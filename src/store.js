import { create } from 'zustand';

export const useStore = create((set, get) => ({
  user: null,
  tasks: [],
  history: [],
  loading: true,
  activeView: 'today', // 'today' | 'analytics' | 'history'
  showAddTask: false,
  editingTask: null,
  filterCategory: 'all',

  setUser: (user) => set({ user }),
  setTasks: (tasks) => set({ tasks }),
  setHistory: (history) => set({ history }),
  setLoading: (loading) => set({ loading }),
  setActiveView: (activeView) => set({ activeView }),
  setShowAddTask: (showAddTask) => set({ showAddTask }),
  setEditingTask: (editingTask) => set({ editingTask }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),

  reorderTasks: (tasks) => set({ tasks }),
}));
