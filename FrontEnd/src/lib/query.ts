import type { Insight, QueryHistory } from '@/types';

export interface QueryResponse {
  id: string;
  queryId: string;
  datasetId: string;
  title: string;
  summary: string;
  chartType: Insight['chartType'];
  chartData: Insight['chartData'];
  createdAt: string;
}

export async function runDatasetQuery(datasetId: string, question: string): Promise<QueryResponse> {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      datasetId,
      question,
    }),
  });

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;

  if (text) {
    try {
      const parsed = JSON.parse(text) as unknown;
      payload = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      throw new Error('The backend returned an invalid response. Please try again.');
    }
  }

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : 'Query failed';
    throw new Error(message);
  }

  return payload as unknown as QueryResponse;
}

export function createInsightFromResponse(
  response: QueryResponse,
  question: string,
): Insight {
  return {
    id: response.id,
    datasetId: response.datasetId,
    query: question,
    title: response.title,
    summary: response.summary,
    chartType: response.chartType,
    chartData: response.chartData,
    createdAt: response.createdAt,
  };
}

export function createQueryHistoryFromResponse(
  response: QueryResponse,
  question: string,
): QueryHistory {
  return {
    id: response.queryId,
    datasetId: response.datasetId,
    question,
    response: response.summary,
    createdAt: response.createdAt,
  };
}
