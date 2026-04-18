import { randomUUID } from "node:crypto";

import { z } from "zod";

import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import type {
  AnalysisPoint,
  AnalysisResult,
  ChartType,
  DatasetProfile,
  DatasetRow,
  DateGrain,
  InferredColumnType,
  InsightPayload,
  Primitive,
  QueryFilter,
  QueryOperation,
  QueryPlan,
} from "../types/analytics";
import { getDatasetRowsAndProfile } from "./dataset-service.js";
import { generateQueryPlan } from "./gemini-service.js";

const chartTypeValues = ["bar", "line", "pie", "area"] as const;
const operationValues = ["sum", "average", "count", "top", "trend", "distribution"] as const;
const dateGrainValues = ["day", "week", "month", "quarter", "year"] as const;
const filterOperatorValues = [
  "equals",
  "notEquals",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "between",
] as const;

const queryPlanSchema = z.object({
  operation: z.enum(operationValues),
  groupBy: z.string().nullable(),
  metric: z.string().nullable(),
  filters: z.array(
    z.object({
      column: z.string(),
      operator: z.enum(filterOperatorValues),
      value: z.any(),
    }),
  ),
  sort: z
    .object({
      by: z.enum(["metric", "group", "time"]),
      direction: z.enum(["asc", "desc"]),
    })
    .nullable(),
  limit: z.number().int().positive().max(50).nullable(),
  timeColumn: z.string().nullable(),
  dateGrain: z.enum(dateGrainValues).nullable(),
  chartType: z.enum(chartTypeValues),
});

function canonicalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveColumn(candidate: string | null, profile: DatasetProfile) {
  if (!candidate) {
    return null;
  }

  const exactMatch = profile.columns.find((column) => column.name === candidate);
  if (exactMatch) {
    return exactMatch.name;
  }

  const normalized = canonicalize(candidate);
  const looseMatch = profile.columns.find((column) => canonicalize(column.name) === normalized);
  return looseMatch?.name ?? null;
}

function getColumnType(profile: DatasetProfile, columnName: string | null) {
  if (!columnName) {
    return null;
  }

  return profile.columns.find((column) => column.name === columnName)?.inferredType ?? null;
}

function defaultChartType(operation: QueryOperation) {
  if (operation === "trend") {
    return "line";
  }
  if (operation === "distribution") {
    return "pie";
  }
  return "bar";
}

function defaultDateGrain() {
  return "month" as DateGrain;
}

function defaultLimit(operation: QueryOperation) {
  if (operation === "top" || operation === "distribution") {
    return 10;
  }
  if (operation === "trend") {
    return 12;
  }
  return null;
}

function sanitizePlan(rawPlan: unknown, profile: DatasetProfile) {
  const parsed = queryPlanSchema.parse(rawPlan);

  const groupBy = resolveColumn(parsed.groupBy, profile);
  const metric = resolveColumn(parsed.metric, profile);
  const timeColumn = resolveColumn(parsed.timeColumn, profile);
  const filters = parsed.filters.map((filter) => ({
    ...filter,
    sourceColumn: filter.column,
    column: resolveColumn(filter.column, profile),
  }));

  const missingFilterColumn = filters.find((filter) => !filter.column);
  if (missingFilterColumn) {
    throw new Error(`Invalid column name: ${missingFilterColumn.sourceColumn}`);
  }

  if (parsed.groupBy && !groupBy) {
    throw new Error(`Invalid column name: ${parsed.groupBy}`);
  }
  if (parsed.metric && !metric) {
    throw new Error(`Invalid column name: ${parsed.metric}`);
  }
  if (parsed.timeColumn && !timeColumn) {
    throw new Error(`Invalid column name: ${parsed.timeColumn}`);
  }

  const numericMetricOperations: QueryOperation[] = ["sum", "average"];
  if (numericMetricOperations.includes(parsed.operation) && !metric) {
    throw new AppError(
      400,
      `The "${parsed.operation}" operation requires a numeric metric column.`,
      "METRIC_REQUIRED",
    );
  }

  const metricType = getColumnType(profile, metric);
  if (metric && ["sum", "average", "top"].includes(parsed.operation) && metricType !== "number") {
    throw new AppError(
      400,
      `Metric column "${metric}" must be numeric for ${parsed.operation} queries.`,
      "INVALID_METRIC_TYPE",
    );
  }

  let resolvedTimeColumn = timeColumn;
  if (parsed.operation === "trend" && !resolvedTimeColumn) {
    const firstDateColumn = profile.columns.find((column) => column.inferredType === "date");
    resolvedTimeColumn = firstDateColumn?.name ?? null;
  }

  if (parsed.operation === "trend" && !resolvedTimeColumn) {
    throw new AppError(
      400,
      "Trend analysis requires a date/time column in the dataset.",
      "TIME_COLUMN_REQUIRED",
    );
  }

  if ((parsed.operation === "top" || parsed.operation === "distribution") && !groupBy) {
    throw new AppError(
      400,
      `${parsed.operation} analysis requires a grouping column.`,
      "GROUP_BY_REQUIRED",
    );
  }

  const chartType = chartTypeValues.includes(parsed.chartType)
    ? parsed.chartType
    : defaultChartType(parsed.operation);

  return {
    operation: parsed.operation,
    groupBy,
    metric,
    filters: filters.map((filter) => ({
      column: filter.column as string,
      operator: filter.operator,
      value: filter.value,
    })),
    sort: parsed.sort,
    limit: parsed.limit ?? defaultLimit(parsed.operation),
    timeColumn: resolvedTimeColumn,
    dateGrain: parsed.dateGrain ?? (parsed.operation === "trend" ? defaultDateGrain() : null),
    chartType,
  } satisfies QueryPlan;
}

function toComparableValue(value: Primitive, type: InferredColumnType | null) {
  if (value == null) {
    return null;
  }

  if (type === "date") {
    const timestamp = Date.parse(String(value));
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  if (type === "number") {
    return typeof value === "number" ? value : Number(value);
  }

  if (type === "boolean") {
    return typeof value === "boolean" ? value : String(value).toLowerCase() === "true";
  }

  return String(value).toLowerCase();
}

function matchesFilter(row: DatasetRow, filter: QueryFilter, profile: DatasetProfile) {
  const columnType = getColumnType(profile, filter.column);
  const rowValue = row[filter.column];
  const comparableValue = toComparableValue(rowValue, columnType);

  if (filter.operator === "contains") {
    return String(rowValue ?? "").toLowerCase().includes(String(filter.value ?? "").toLowerCase());
  }

  if (filter.operator === "in") {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    return values.some(
      (value) => toComparableValue(value as Primitive, columnType) === comparableValue,
    );
  }

  if (
    filter.operator === "between" &&
    typeof filter.value === "object" &&
    filter.value !== null &&
    "min" in filter.value &&
    "max" in filter.value
  ) {
    const min = toComparableValue(filter.value.min as Primitive, columnType);
    const max = toComparableValue(filter.value.max as Primitive, columnType);
    if (comparableValue == null || min == null || max == null) {
      return false;
    }
    return comparableValue >= min && comparableValue <= max;
  }

  const expectedValue = toComparableValue(filter.value as Primitive, columnType);

  switch (filter.operator) {
    case "equals":
      return comparableValue === expectedValue;
    case "notEquals":
      return comparableValue !== expectedValue;
    case "gt":
      return comparableValue != null && expectedValue != null && comparableValue > expectedValue;
    case "gte":
      return comparableValue != null && expectedValue != null && comparableValue >= expectedValue;
    case "lt":
      return comparableValue != null && expectedValue != null && comparableValue < expectedValue;
    case "lte":
      return comparableValue != null && expectedValue != null && comparableValue <= expectedValue;
    default:
      return false;
  }
}

function applyFilters(rows: DatasetRow[], filters: QueryFilter[], profile: DatasetProfile) {
  if (filters.length === 0) {
    return rows;
  }

  return rows.filter((row) => filters.every((filter) => matchesFilter(row, filter, profile)));
}

function formatDateBucket(value: Primitive, grain: DateGrain) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  if (grain === "day") {
    return { key: `${year}-${month}-${day}`, order: Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) };
  }
  if (grain === "week") {
    const firstDayOfYear = Date.UTC(year, 0, 1);
    const week = Math.ceil(((date.getTime() - firstDayOfYear) / 86400000 + 1) / 7);
    return { key: `${year}-W${String(week).padStart(2, "0")}`, order: week };
  }
  if (grain === "quarter") {
    const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
    return { key: `${year}-Q${quarter}`, order: quarter + year * 10 };
  }
  if (grain === "year") {
    return { key: `${year}`, order: year };
  }

  return { key: `${year}-${month}`, order: Date.UTC(year, date.getUTCMonth(), 1) };
}

function getNumericMetric(row: DatasetRow, metric: string | null) {
  if (!metric) {
    return 1;
  }

  const value = row[metric];
  
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const stringVal = value.replace(/,/g, "");
    const parsed = Number(stringVal);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function sortPoints(points: Array<AnalysisPoint & { order: number }>, direction: "asc" | "desc") {
  return [...points].sort((left, right) =>
    direction === "asc" ? left.value - right.value : right.value - left.value,
  );
}

function executePlan(rows: DatasetRow[], profile: DatasetProfile, plan: QueryPlan): AnalysisResult {
  const filteredRows = applyFilters(rows, plan.filters, profile);

  if (filteredRows.length === 0) {
    throw new AppError(404, "No data matched the requested query filters.", "EMPTY_QUERY_RESULT");
  }

  const buckets = new Map<string, { sum: number; count: number; order: number }>();

  const addToBucket = (label: string, value: number, order = Number.MAX_SAFE_INTEGER) => {
    const current = buckets.get(label) ?? { sum: 0, count: 0, order };
    current.sum += value;
    current.count += 1;
    current.order = Math.min(current.order, order);
    buckets.set(label, current);
  };

  if (plan.operation === "trend") {
    const grain = plan.dateGrain ?? "month";
    for (const row of filteredRows) {
      const bucket = formatDateBucket(row[plan.timeColumn as string], grain);
      if (!bucket) {
        continue;
      }

      const metricValue = getNumericMetric(row, plan.metric);
      if (plan.metric && metricValue == null) {
        continue;
      }

      addToBucket(bucket.key, metricValue ?? 1, bucket.order);
    }
  } else if (plan.groupBy) {
    for (const row of filteredRows) {
      const bucketLabel = row[plan.groupBy] == null ? "Unknown" : String(row[plan.groupBy]);
      const metricValue = getNumericMetric(row, plan.metric);

      if (plan.metric && metricValue == null && plan.operation !== "count") {
        continue;
      }

      addToBucket(bucketLabel, metricValue ?? 1);
    }
  } else {
    for (const row of filteredRows) {
      const metricValue = getNumericMetric(row, plan.metric);
      if (plan.metric && metricValue == null && plan.operation !== "count") {
        continue;
      }

      addToBucket(plan.metric ?? "Records", metricValue ?? 1);
    }
  }

  let points: Array<AnalysisPoint & { order: number }> = [...buckets.entries()].map(([name, bucket]) => ({
    name,
    value: plan.operation === "average" ? bucket.sum / bucket.count : bucket.sum,
    timestamp: plan.operation === "trend" ? name : undefined,
    order: bucket.order,
  }));

  if (points.length === 0) {
    throw new AppError(
      404,
      "The query could not produce any numeric data points from the dataset.",
      "NO_NUMERIC_RESULTS",
    );
  }

  if (plan.operation === "trend") {
    points = points.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  } else if (plan.sort) {
    points = sortPoints(points, plan.sort.direction);
  } else if (plan.operation === "top" || plan.operation === "distribution") {
    points = sortPoints(points, "desc");
  }

  const limitedPoints = plan.limit ? points.slice(0, plan.limit) : points;

  return {
    chartType: plan.chartType,
    points: limitedPoints.map(({ order, ...point }) => ({
      ...point,
      value: Number(point.value.toFixed(4)),
    })),
    resolvedPlan: plan,
    totalRowsAnalyzed: filteredRows.length,
  };
}

function formatValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function normalizeText(value: string) {
  return value.toLowerCase();
}

function sentenceCase(value: string) {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function toLabel(value: string | null) {
  if (!value) return "result";
  return value.replace(/_/g, " ");
}

function pluralize(word: string, count: number) {
  if (count === 1) return word;
  if (word.endsWith("y")) return `${word.slice(0, -1)}ies`;
  if (word.endsWith("s")) return word;
  return `${word}s`;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatPeriodLabel(label: string) {
  const match = label.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return label;
  }
  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = monthNames[monthIndex] ?? label;
  return `${monthName} ${year}`;
}

function buildFilterPhrase(plan: QueryPlan) {
  const statusFilter = plan.filters.find(
    (filter) =>
      filter.column.toLowerCase().includes("status") &&
      typeof filter.value === "string",
  );

  if (!statusFilter) {
    return null;
  }

  const value = String(statusFilter.value).toLowerCase();
  if (value.includes("return")) {
    return { subject: "Returned orders", metricLabel: "returns", bonus: true };
  }
  if (value.includes("cancel")) {
    return { subject: "Cancelled orders", metricLabel: "cancellations", bonus: false };
  }
  if (value.includes("deliver")) {
    return { subject: "Delivered orders", metricLabel: "deliveries", bonus: false };
  }

  return { subject: `${statusFilter.value} records`, metricLabel: "records", bonus: false };
}

function findMetricLabel(question: string, plan: QueryPlan) {
  const normalized = normalizeText(question);

  if (plan.metric) {
    return plan.metric.toLowerCase();
  }

  if (normalized.includes("order")) {
    return "orders";
  }

  return "records";
}

function buildAnalystInsight(question: string, result: AnalysisResult): InsightPayload {
  const normalized = normalizeText(question);
  const points = result.points;
  const plan = result.resolvedPlan;
  const filterPhrase = buildFilterPhrase(plan);
  const metricLabel = filterPhrase?.metricLabel ?? findMetricLabel(question, plan);

  const isTrend = plan.operation === "trend";
  const isDistribution = plan.operation === "distribution" || plan.chartType === "pie";
  const isTop = plan.operation === "top" || normalized.includes("top");
  const isComparison = normalized.includes(" vs ") || normalized.includes("versus") || normalized.includes("compare");
  const isHighestLowest = normalized.includes("highest") || normalized.includes("lowest");
  const isConditional = plan.filters.length > 0;

  if (isTrend && points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    const direction =
      last.value > first.value ? "increasing" : last.value < first.value ? "decreasing" : "stable";
    const peak = points.reduce((best, point) => (point.value > best.value ? point : best), first);
    return {
      title: "Trend analysis",
      summary: `${sentenceCase(metricLabel)} show a ${direction} trend from ${formatPeriodLabel(first.name)} to ${formatPeriodLabel(last.name)}, with ${formatPeriodLabel(peak.name)} recording the highest value.`,
    };
  }

  if (isComparison && points.length >= 2) {
    const [first, second] = points;
    const leader = first.value >= second.value ? first : second;
    const follower = leader === first ? second : first;
    const gap = leader.value - follower.value;
    const gapRatio = follower.value > 0 ? gap / follower.value : 1;
    const strength = gapRatio >= 0.2 ? "significantly" : "slightly";
    const comparison =
      leader.value === follower.value
        ? "is on par with"
        : `${strength} outperforms`;
    const total = points.reduce((sum, point) => sum + point.value, 0);
    const share = total > 0 ? (leader.value / total) * 100 : 0;
    return {
      title: `Comparison: ${leader.name} vs ${follower.name}`,
      summary: `${leader.name} ${comparison} ${follower.name} in total ${metricLabel}, contributing ${share >= 60 ? "the majority" : "a larger share"} of the result.`,
    };
  }

  if (isDistribution && points.length > 0) {
    const leader = points[0];
    const followers = points.slice(1, 3).map((point) => point.name);
    const followerText = followers.length > 0 ? `, followed by ${followers.join(" and ")}` : "";
    return {
      title: `Distribution by ${plan.groupBy ?? "category"}`,
      summary: `Most ${metricLabel} come from ${leader.name}${followerText}.`,
    };
  }

  if (isHighestLowest && points.length >= 2) {
    const sorted = [...points].sort((left, right) => right.value - left.value);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    return {
      title: `Highest vs lowest`,
      summary: `${highest.name} has the highest ${metricLabel}, while ${lowest.name} has the lowest.`,
    };
  }

  if ((isTop || isConditional) && points.length > 0) {
    const topNames = points.slice(0, 5).map((point) => point.name);
    const leader = points[0];
    const listText = formatList(topNames);
    const groupLabel = toLabel(plan.groupBy).toLowerCase();
    const groupLabelPlural = pluralize(groupLabel, topNames.length);
    const filterPrefix = filterPhrase ? `${filterPhrase.subject} show that ` : "";
    const metricText = filterPhrase?.metricLabel ?? metricLabel;
    const baseSentence =
      topNames.length === 1
        ? `${filterPrefix}${leader.name} has the highest number of ${metricText} among all ${pluralize(groupLabel, 2)}.`
        : `${filterPrefix}the top ${topNames.length} ${groupLabelPlural} by ${metricText} are ${listText}, with ${leader.name} generating the highest ${metricText}.`;
    const returnedFilter = filterPhrase?.bonus;
    const bonus = returnedFilter
      ? " This indicates potential issues in product quality or customer satisfaction in this category."
      : "";

    return {
      title: `Top results`,
      summary: `${baseSentence}${bonus}`,
    };
  }

  if (points.length === 1) {
    return {
      title: "Answer",
      summary: `${sentenceCase(metricLabel)} total ${formatValue(points[0].value)} for this query.`,
    };
  }

  const leader = points[0];
  return {
    title: `Top result: ${leader.name}`,
    summary: `${leader.name} leads with ${formatValue(leader.value)} in ${metricLabel}.`,
  };
}

export async function runQuery(userId: string, datasetId: string, question: string) {
  const { rows, profile } = await getDatasetRowsAndProfile(userId, datasetId);
  const rawPlan = await generateQueryPlan({
    question,
    profile,
    previewRows: profile.previewRows,
  });

  if (typeof rawPlan !== "object" || rawPlan === null || !("operation" in rawPlan)) {
    throw new AppError(400, "Unable to understand query.", "QUERY_PLAN_INVALID");
  }

  if (
    rawPlan.operation !== "count" &&
    !("metric" in rawPlan)
  ) {
    throw new AppError(400, "Unable to understand query.", "QUERY_PLAN_INVALID");
  }

  const resolvedPlan = sanitizePlan(rawPlan, profile);
  const analysis = executePlan(rows, profile, resolvedPlan);
  const insightCopy = buildAnalystInsight(question, analysis);
  const insightId = randomUUID();
  const queryId = randomUUID();
  const createdAt = new Date().toISOString();

  await db.$transaction([
    db.insight.create({
      data: {
        id: insightId,
        userId,
        datasetId,
        query: question,
        title: insightCopy.title,
        summary: insightCopy.summary,
        chartType: analysis.chartType,
        chartData: JSON.stringify(analysis.points),
      },
    }),
    db.query.create({
      data: {
        id: queryId,
        userId,
        datasetId,
        question,
        response: insightCopy.summary,
      },
    }),
  ]);

    return {
      id: insightId,
      queryId,
      datasetId,
      title: insightCopy.title,
      summary: insightCopy.summary,
      chartType: analysis.chartType,
      chartData: analysis.points,
      chart: {
        labels: analysis.points.map((point) => point.name),
        values: analysis.points.map((point) => point.value),
        type: analysis.chartType,
      },
      insight: {
        title: insightCopy.title,
        summary: insightCopy.summary,
      },
      createdAt,
    };
}

