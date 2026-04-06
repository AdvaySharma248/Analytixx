import { create } from 'zustand';
import type { Dataset, Insight, QueryHistory, ActiveSection } from '@/types';

interface AppState {
  // Navigation
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;

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

  // Loading states
  isUploading: boolean;
  setIsUploading: (loading: boolean) => void;
  isQuerying: boolean;
  setIsQuerying: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  activeSection: 'dashboard' as ActiveSection,
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  datasets: [] as Dataset[],
  activeDataset: null as Dataset | null,
  insights: [] as Insight[],
  queryHistory: [] as QueryHistory[],
  isUploading: false,
  isQuerying: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setActiveSection: (section) => set({ activeSection: section, sidebarMobileOpen: false }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

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

  reset: () => set(initialState),
}));
