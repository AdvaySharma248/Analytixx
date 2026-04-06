export interface DatasetRow {
  [key: string]: string | number | null;
}

export interface Dataset {
  id: string;
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  dataPreview: DatasetRow[];
  fileSize: number;
  createdAt: string;
}

export interface Insight {
  id: string;
  datasetId: string;
  query: string;
  title: string;
  summary: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  chartData: { name: string; value: number }[];
  createdAt: string;
}

export interface QueryHistory {
  id: string;
  datasetId: string;
  question: string;
  response: string;
  createdAt: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type ActiveSection = 'dashboard' | 'upload' | 'insights' | 'history';
