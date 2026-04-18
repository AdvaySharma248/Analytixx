import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import type {
  ChartType,
  DatasetProfile,
  DatasetRow,
  DateGrain,
  FilterOperator,
  InsightPayload,
  QueryOperation,
  QueryPlan,
} from "../types/analytics";

const supportedOperations: QueryOperation[] = [
  "sum",
  "average",
  "count",
  "top",
  "trend",
  "distribution",
];

const chartTypes: ChartType[] = ["bar", "line", "pie", "area"];
const dateGrains: DateGrain[] = ["day", "week", "month", "quarter", "year"];
const filterOperators: FilterOperator[] = [
  "equals",
  "notEquals",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "between",
];

const measureKeywordGroups = [
  ["sales", "revenue", "gmv", "turnover", "amount", "income"],
  ["profit", "margin", "earnings"],
  ["quantity", "qty", "unit", "units", "volume"],
  ["discount", "markdown"],
];

const statusIntentGroups = [
  {
    aliases: ["return", "returns", "returned"],
    candidateValues: ["Returned", "Return"],
  },
  {
    aliases: ["cancel", "cancelled", "canceled", "cancelled order", "cancelled orders", "canceled orders"],
    candidateValues: ["Cancelled", "Canceled", "Cancel"],
  },
  {
    aliases: ["deliver", "delivered", "delivered order", "delivered orders", "completed", "complete"],
    candidateValues: ["Delivered", "Completed"],
  },
];

const queryPlanJsonSchema = {
  type: "object",
  properties: {
    operation: { type: "string", enum: supportedOperations },
    groupBy: { type: ["string", "null"] },
    metric: { type: ["string", "null"] },
    filters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          column: { type: "string" },
          operator: { type: "string", enum: filterOperators },
          value: {},
        },
        required: ["column", "operator", "value"],
        additionalProperties: false,
      },
    },
    sort: {
      type: ["object", "null"],
      properties: {
        by: { type: "string", enum: ["metric", "group", "time"] },
        direction: { type: "string", enum: ["asc", "desc"] },
      },
      required: ["by", "direction"],
      additionalProperties: false,
    },
    limit: { type: ["integer", "null"], minimum: 1, maximum: 50 },
    timeColumn: { type: ["string", "null"] },
    dateGrain: { type: ["string", "null"], enum: [...dateGrains, null] },
    chartType: { type: "string", enum: chartTypes },
  },
  required: ["operation", "groupBy", "metric", "filters", "sort", "limit", "timeColumn", "dateGrain", "chartType"],
  additionalProperties: false,
} as const;

const insightJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
  },
  required: ["title", "summary"],
  additionalProperties: false,
} as const;

let aiClient: GoogleGenAI | null = null;

function getClient() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  aiClient ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return aiClient;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function canonicalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function describeProfile(profile: DatasetProfile) {
  return profile.columns.map((column) => ({
    name: column.name,
    inferredType: column.inferredType,
    nullCount: column.nullCount,
    uniqueCount: column.uniqueCount,
    sampleValues: column.sampleValues.slice(0, 3),
  }));
}

function findColumn(profile: DatasetProfile, matcher: (column: DatasetProfile["columns"][number]) => boolean) {
  return profile.columns.find(matcher)?.name ?? null;
}

function findDateColumn(profile: DatasetProfile) {
  return findColumn(profile, (column) => column.inferredType === "date");
}

function findStatusColumn(profile: DatasetProfile) {
  return findColumn(profile, (column) => {
    const normalizedName = canonicalize(column.name);
    return normalizedName.includes("status") || normalizedName.includes("state");
  });
}

function findCategoricalColumn(profile: DatasetProfile, preferredNames: string[]) {
  const normalizedPreferred = preferredNames.map(canonicalize);
  const preferredMatch = profile.columns.find((column) => {
    const normalizedName = canonicalize(column.name);
    return normalizedPreferred.some((preferred) => normalizedName.includes(preferred));
  });

  if (preferredMatch) {
    return preferredMatch.name;
  }

  return (
    profile.columns.find(
      (column) =>
        (column.inferredType === "string" || column.inferredType === "mixed") &&
        column.uniqueCount > 1,
    )?.name ?? null
  );
}

function findMetricColumn(profile: DatasetProfile, question: string, operation: QueryOperation) {
  const normalizedQuestion = normalizeText(question);
  const numericColumns = profile.columns.filter((column) => column.inferredType === "number");
  const preferredMetricGroups = [
    {
      keywords: ["sales", "revenue", "gmv", "turnover", "amount", "income"],
      aliases: ["sales", "revenue", "amount", "total", "gmv"],
    },
    {
      keywords: ["profit", "margin", "earnings"],
      aliases: ["profit", "margin", "earnings"],
    },
    {
      keywords: ["quantity", "qty", "units", "volume"],
      aliases: ["quantity", "qty", "unit", "units", "volume"],
    },
    {
      keywords: ["discount", "markdown"],
      aliases: ["discount", "markdown"],
    },
  ];

  const hasExplicitMeasureKeyword = measureKeywordGroups.some((group) =>
    group.some((keyword) => normalizedQuestion.includes(keyword)),
  );
  const hasStatusIntent = statusIntentGroups.some((group) =>
    group.aliases.some((alias) => normalizedQuestion.includes(alias)),
  );

  if (
    operation === "count" ||
    ((operation === "top" || operation === "distribution") && !hasExplicitMeasureKeyword && hasStatusIntent)
  ) {
    return null;
  }

  for (const group of preferredMetricGroups) {
    const questionMatchesGroup = group.keywords.some((keyword) => normalizedQuestion.includes(keyword));
    if (!questionMatchesGroup) {
      continue;
    }

    const matchedColumn = numericColumns.find((column) => {
      const normalizedName = canonicalize(column.name);
      return group.aliases.some((alias) => normalizedName.includes(canonicalize(alias)));
    });

    if (matchedColumn) {
      return matchedColumn.name;
    }
  }

  const businessMetric = numericColumns.find((column) => {
    const normalizedName = canonicalize(column.name);
    return (
      /(sales|revenue|amount|total|profit|quantity|discount|score|value)/.test(normalizedName) &&
      !/(id|code|zip|postal|pin)/.test(normalizedName)
    );
  });

  if (businessMetric) {
    return businessMetric.name;
  }

  return (
    numericColumns.find((column) => !/(^|[^a-z])(id|code|zip|postal|pin)([^a-z]|$)/.test(normalizeText(column.name)))
      ?.name ?? null
  );
}

function extractLimit(question: string) {
  const normalizedQuestion = normalizeText(question);
  const patterns = [
    /\btop\s+(\d+)\b/,
    /\bbottom\s+(\d+)\b/,
    /\bfirst\s+(\d+)\b/,
    /\blast\s+(\d+)\b/,
  ];

  for (const pattern of patterns) {
    const match = normalizedQuestion.match(pattern);
    if (match) {
      return Math.min(Number(match[1]), 50);
    }
  }

  return null;
}

function inferDateGrain(question: string) {
  const normalizedQuestion = normalizeText(question);

  if (normalizedQuestion.includes("quarter")) {
    return "quarter" as DateGrain;
  }
  if (normalizedQuestion.includes("year") || normalizedQuestion.includes("annual")) {
    return "year" as DateGrain;
  }
  if (normalizedQuestion.includes("week")) {
    return "week" as DateGrain;
  }
  if (normalizedQuestion.includes("day") || normalizedQuestion.includes("daily")) {
    return "day" as DateGrain;
  }
  if (
    normalizedQuestion.includes("month") ||
    normalizedQuestion.includes("monthly") ||
    normalizedQuestion.includes("comparison") ||
    normalizedQuestion.includes("compare")
  ) {
    return "month" as DateGrain;
  }

  return null;
}

function inferOperation(question: string) {
  const normalizedQuestion = normalizeText(question);
  const hasExplicitMeasureKeyword = measureKeywordGroups.some((group) =>
    group.some((keyword) => normalizedQuestion.includes(keyword)),
  );
  const hasStatusIntent = statusIntentGroups.some((group) =>
    group.aliases.some((alias) => normalizedQuestion.includes(alias)),
  );

  if (
    normalizedQuestion.includes("trend") ||
    normalizedQuestion.includes("over time") ||
    normalizedQuestion.includes("month") ||
    normalizedQuestion.includes("monthly") ||
    normalizedQuestion.includes("quarter") ||
    normalizedQuestion.includes("yearly") ||
    normalizedQuestion.includes("weekly") ||
    normalizedQuestion.includes("daily") ||
    normalizedQuestion.includes("comparison") ||
    normalizedQuestion.includes("compare")
  ) {
    return "trend" as QueryOperation;
  }

  if (
    normalizedQuestion.includes("top") ||
    normalizedQuestion.includes("most") ||
    normalizedQuestion.includes("best") ||
    normalizedQuestion.includes("highest") ||
    normalizedQuestion.includes("least") ||
    normalizedQuestion.includes("lowest") ||
    normalizedQuestion.includes("bottom")
  ) {
    return "top" as QueryOperation;
  }

  if (
    normalizedQuestion.includes("distribution") ||
    normalizedQuestion.includes("breakdown") ||
    normalizedQuestion.includes("share") ||
    normalizedQuestion.includes("split")
  ) {
    return "distribution" as QueryOperation;
  }

  if (
    normalizedQuestion.includes("average") ||
    normalizedQuestion.includes("avg") ||
    normalizedQuestion.includes("mean")
  ) {
    return "average" as QueryOperation;
  }

  if (
    normalizedQuestion.includes("count") ||
    normalizedQuestion.includes("how many") ||
    normalizedQuestion.includes("number of") ||
    normalizedQuestion.includes("total orders") ||
    normalizedQuestion.includes("record count")
  ) {
    return "count" as QueryOperation;
  }

  if (hasStatusIntent && !hasExplicitMeasureKeyword) {
    return "count" as QueryOperation;
  }

  return "sum" as QueryOperation;
}

function inferChartType(question: string, operation: QueryOperation) {
  const normalizedQuestion = normalizeText(question);

  if (normalizedQuestion.includes("pie") || normalizedQuestion.includes("donut")) {
    return "pie" as ChartType;
  }
  if (normalizedQuestion.includes("area")) {
    return "area" as ChartType;
  }
  if (
    normalizedQuestion.includes("line") ||
    operation === "trend"
  ) {
    return "line" as ChartType;
  }
  if (operation === "distribution") {
    return "pie" as ChartType;
  }

  return "bar" as ChartType;
}

function findGroupByColumn(profile: DatasetProfile, question: string, operation: QueryOperation) {
  const normalizedQuestion = normalizeText(question);
  const aliases = [
    { names: ["Product"], tokens: ["product", "products", "item", "items", "sku"] },
    { names: ["Category"], tokens: ["category", "categories", "segment", "segments"] },
    { names: ["Region"], tokens: ["region", "regions", "territory", "territories"] },
    { names: ["City"], tokens: ["city", "cities", "location", "locations"] },
    { names: ["Customer"], tokens: ["customer", "customers", "client", "clients"] },
    { names: ["PaymentMethod"], tokens: ["payment method", "payment", "payments", "upi", "credit card", "debit card", "cod"] },
    { names: ["OrderStatus"], tokens: ["status", "order status", "delivered", "returned", "cancelled", "canceled"] },
  ];

  for (const alias of aliases) {
    const matchedToken = alias.tokens.some((token) => normalizedQuestion.includes(token));
    if (!matchedToken) {
      continue;
    }

    const matchedColumn = findCategoricalColumn(profile, alias.names);
    if (matchedColumn) {
      return matchedColumn;
    }
  }

  if (operation === "top" || operation === "distribution" || normalizedQuestion.includes(" by ")) {
    return findCategoricalColumn(profile, ["Product", "Category", "Region", "City", "Customer"]);
  }

  return null;
}

function inferFilters(profile: DatasetProfile, question: string) {
  const normalizedQuestion = normalizeText(question);
  const filters: QueryPlan["filters"] = [];
  const usedColumns = new Set<string>();

  const statusColumn = findStatusColumn(profile);
  if (statusColumn) {
    const statusProfile = profile.columns.find((column) => column.name === statusColumn);

    for (const group of statusIntentGroups) {
      const matchedAlias = group.aliases.some((alias) => normalizedQuestion.includes(alias));
      if (!matchedAlias) {
        continue;
      }

      const matchedSample =
        statusProfile?.sampleValues.find((sampleValue) => {
          const normalizedSample = canonicalize(sampleValue);
          return group.candidateValues.some((candidate) =>
            normalizedSample.includes(canonicalize(candidate)),
          );
        }) ?? group.candidateValues[0];

      filters.push({
        column: statusColumn,
        operator: "equals",
        value: matchedSample,
      });
      usedColumns.add(statusColumn);
      break;
    }
  }

  for (const column of profile.columns) {
    if (usedColumns.has(column.name)) {
      continue;
    }

    if (column.inferredType === "number" || column.inferredType === "date") {
      continue;
    }

    for (const sampleValue of column.sampleValues) {
      const normalizedSample = normalizeText(sampleValue);
      if (!normalizedSample) {
        continue;
      }

      const pattern = new RegExp(`(^|\\b)${escapeRegExp(normalizedSample)}(\\b|$)`);
      if (pattern.test(normalizedQuestion)) {
        filters.push({
          column: column.name,
          operator: "equals",
          value: sampleValue,
        });
        usedColumns.add(column.name);
        break;
      }
    }
  }

  return filters;
}

function buildHeuristicQueryPlan(question: string, profile: DatasetProfile): QueryPlan {
  const operation = inferOperation(question);
  const timeColumn = operation === "trend" ? findDateColumn(profile) : null;
  const dateGrain = operation === "trend" ? inferDateGrain(question) ?? "month" : null;
  const groupBy = operation === "trend" ? null : findGroupByColumn(profile, question, operation);
  const metric = findMetricColumn(profile, question, operation);
  const limit = extractLimit(question);
  const chartType = inferChartType(question, operation);

  return {
    operation,
    groupBy,
    metric,
    filters: inferFilters(profile, question),
    sort: operation === "top" ? { by: "metric", direction: "desc" } : null,
    limit,
    timeColumn,
    dateGrain,
    chartType,
  };
}

export async function generateQueryPlan(options: {
  question: string;
  profile: DatasetProfile;
  previewRows: DatasetRow[];
}) {
  const client = getClient();
  const fallbackPlan = buildHeuristicQueryPlan(options.question, options.profile);

  if (!client) {
    return fallbackPlan;
  }

  const prompt = [
    "You are a strict data analyst query planner.",
    "Your job is to convert a user's analytics question into a structured JSON execution plan.",

    "IMPORTANT RULES:",

    "1. Use ONLY exact dataset column names. Never invent or assume columns.",
    "2. Validate that all referenced columns exist in the dataset schema.",

    "3. Always follow this execution order:",
    "   Filter → Group → Aggregate",

    "4. For metrics like 'sales', 'revenue', 'amount':",
    "   - Use operation: 'sum'",
    "   - Use the correct numeric column (e.g., Sales)",
    "   - NEVER use count for these metrics",

    "5. If the query implies conditions like:",
    "   - returned → OrderStatus = 'Returned'",
    "   - cancelled/canceled → OrderStatus = 'Cancelled'",
    "   - delivered → OrderStatus = 'Delivered'",
    "   Apply this filter BEFORE aggregation",

    "6. For queries like 'total sales':",
    "   - DO NOT apply any filters unless explicitly mentioned",
    "   - Include ALL rows",

    "7. For queries like 'which category has most returns':",
    "   - First apply filter: OrderStatus = 'Returned'",
    "   - Then group by category",
    "   - Then use COUNT (not sum)",

    "8. For TOP queries:",
    "   - Use operation: 'top'",
    "   - Include 'limit' field (default = 5 if not specified)",

    "9. For TREND queries:",
    "   - Use a date column (e.g., Date)",
    "   - Include 'timeGrain' (day, month, year)",

    "10. For DISTRIBUTION queries:",
    "   - Use operation: 'distribution'",

    "11. If NO metric is specified:",
    "   - Default to COUNT of records",

    "12. ALWAYS return a valid JSON object matching this schema:",

    JSON.stringify({
      operation: "",
      groupBy: "",
      metric: "",
      filter: {},
      chartType: "",
      limit: "",
      timeGrain: ""
    }),

    "13. DO NOT include explanations, text, or comments. Return ONLY JSON.",

    "14. If the query cannot be mapped to valid dataset columns:",
    "   - Return:",
    JSON.stringify({
      error: "Invalid query or unknown column"
    }),

    "",
    `Dataset columns and profiles: ${JSON.stringify(describeProfile(options.profile))}`,
    `Preview rows: ${JSON.stringify(options.previewRows.slice(0, 5))}`,
    `User question: ${options.question}`,
  ].join("\n");

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const currentPrompt = attempt === 0
        ? prompt
        : prompt + "\n\nCRITICAL FIX: Your previous generation failed schema validation. Please try again. Ensure your output is EXCLUSIVELY valid JSON matching the schema, with absolutely no markdown formatting, code blocks, or extra text.";

      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: currentPrompt,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: queryPlanJsonSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty planning response.");
      }

      return JSON.parse(text) as QueryPlan;
    } catch (error) {
      lastError = error;
    }
  }

  const errorSummary =
    typeof lastError === "object" &&
      lastError !== null &&
      "status" in lastError
      ? `status ${String((lastError as { status?: unknown }).status)}`
      : "unknown error";

  console.warn(`[planner] Gemini planning failed, using heuristic fallback (${errorSummary}).`);
  return fallbackPlan;
}

export async function generateInsightCopy(options: {
  question: string;
  datasetName: string;
  resolvedPlan: QueryPlan;
  chartType: ChartType;
  chartData: Array<{ name: string; value: number }>;
  totalRowsAnalyzed: number;
  fallback: InsightPayload;
}) {
  const client = getClient();

  if (!client) {
    return options.fallback;
  }

  const prompt = [
    "You are a data analytics summarizer.",
    "Summarize the already-computed result without changing any numbers.",
    "Return valid JSON only.",
    "Keep the summary to 2 sentences maximum and avoid markdown.",
    "",
    `Dataset: ${options.datasetName}`,
    `Original question: ${options.question}`,
    `Resolved plan: ${JSON.stringify(options.resolvedPlan)}`,
    `Chart type: ${options.chartType}`,
    `Rows analyzed: ${options.totalRowsAnalyzed}`,
    `Chart data: ${JSON.stringify(options.chartData)}`,
    `Fallback title: ${options.fallback.title}`,
    `Fallback summary: ${options.fallback.summary}`,
  ].join("\n");

  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseJsonSchema: insightJsonSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return options.fallback;
    }

    return JSON.parse(text) as InsightPayload;
  } catch {
    return options.fallback;
  }
}

