export type Primitive = string | number | boolean | null;
export type DatasetRow = Record<string, Primitive>;

export type InferredColumnType = "number" | "date" | "boolean" | "string" | "mixed";
export type ChartType = "bar" | "line" | "pie" | "area";
export type QueryOperation = "sum" | "average" | "count" | "top" | "trend" | "distribution";
export type DateGrain = "day" | "week" | "month" | "quarter" | "year";
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "between";

export interface ColumnProfile {
  name: string;
  inferredType: InferredColumnType;
  nullCount: number;
  nonNullCount: number;
  uniqueCount: number;
  invalidCount: number;
  sampleValues: string[];
}

export interface QualitySummary {
  duplicateRowCount: number;
  sparseColumns: string[];
  flaggedColumns: Array<{
    column: string;
    issue: string;
    count: number;
  }>;
  warnings: string[];
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  previewRows: DatasetRow[];
  quality: QualitySummary;
}

export type QueryFilterValue =
  | Primitive
  | Primitive[]
  | {
      min: Primitive;
      max: Primitive;
    };

export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: QueryFilterValue;
}

export interface QueryPlan {
  operation: QueryOperation;
  groupBy: string | null;
  metric: string | null;
  filters: QueryFilter[];
  sort: {
    by: "metric" | "group" | "time";
    direction: "asc" | "desc";
  } | null;
  limit: number | null;
  timeColumn: string | null;
  dateGrain: DateGrain | null;
  chartType: ChartType;
}

export interface AnalysisPoint {
  name: string;
  value: number;
  timestamp?: string;
}

export interface AnalysisResult {
  chartType: ChartType;
  points: AnalysisPoint[];
  resolvedPlan: QueryPlan;
  totalRowsAnalyzed: number;
}

export interface InsightPayload {
  title: string;
  summary: string;
}
