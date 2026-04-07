import { create } from 'zustand';
import type { Dataset, Insight, QueryHistory } from '@/types';

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

  // Reset
  reset: () => void;
}

const initialState = {
  datasets: [] as Dataset[],
  activeDataset: null as Dataset | null,
  insights: [] as Insight[],
  queryHistory: [] as QueryHistory[],
  isUploading: false,
  isQuerying: false,
  showRawData: false,
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
  setActiveDataset: (dataset) => set({ activeDataset: dataset }),

  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set((state) => ({ insights: [insight, ...state.insights] })),

  setQueryHistory: (history) => set({ queryHistory: history }),
  addQuery: (query) => set((state) => ({ queryHistory: [query, ...state.queryHistory] })),

  setIsUploading: (loading) => set({ isUploading: loading }),
  setIsQuerying: (loading) => set({ isQuerying: loading }),
  setShowRawData: (show) => set({ showRawData: show }),

  reset: () => set(initialState),
}));
