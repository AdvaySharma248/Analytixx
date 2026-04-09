import { create } from 'zustand';
import type { Dataset, Insight, QueryHistory } from '@/types';

type ChartType = 'bar' | 'line' | 'pie' | 'area';

interface AppState {
  // Data
  datasets: Dataset[];
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  activeDataset: Dataset | null;
  setActiveDataset: (dataset: Dataset | null) => void;

  // Insights
  insights: Insight[];
  setInsights: (insights: Insight[]) => void;
  addInsight: (insight: Insight) => void;
  latestInsight: Insight | null;

  // Query History
  queryHistory: QueryHistory[];
  setQueryHistory: (history: QueryHistory[]) => void;
  addQuery: (query: QueryHistory) => void;

  // UI State
  isUploading: boolean;
  setIsUploading: (loading: boolean) => void;
  isQuerying: boolean;
  setIsQuerying: (loading: boolean) => void;
  showRawData: boolean;
  setShowRawData: (show: boolean) => void;
  selectedChartType: ChartType;
  setSelectedChartType: (type: ChartType) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  datasets: [] as Dataset[],
  activeDataset: null as Dataset | null,
  insights: [] as Insight[],
  latestInsight: null as Insight | null,
  queryHistory: [] as QueryHistory[],
  isUploading: false,
  isQuerying: false,
  showRawData: false,
  selectedChartType: 'bar' as ChartType,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) => set((state) => ({ datasets: [dataset, ...state.datasets] })),
  removeDataset: (id) => set((state) => {
    const datasets = state.datasets.filter((d) => d.id !== id);
    const activeDataset = state.activeDataset?.id === id ? null : state.activeDataset;
    return { datasets, activeDataset };
  }),
  setActiveDataset: (dataset) => set({ activeDataset: dataset, latestInsight: null }),

  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set((state) => ({
    insights: [insight, ...state.insights],
    latestInsight: insight,
  })),

  setQueryHistory: (history) => set({ queryHistory: history }),
  addQuery: (query) => set((state) => ({ queryHistory: [query, ...state.queryHistory] })),

  setIsUploading: (loading) => set({ isUploading: loading }),
  setIsQuerying: (loading) => set({ isQuerying: loading }),
  setShowRawData: (show) => set({ showRawData: show }),
  setSelectedChartType: (type) => set({ selectedChartType: type }),

  reset: () => set(initialState),
}));
