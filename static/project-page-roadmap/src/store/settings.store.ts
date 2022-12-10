import { ViewMode } from 'gantt-task-react';
import create from 'zustand';

const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1);

interface SettingsState {
  ganttViewMode: ViewMode;
  currentViewDate: Date;

  setGanttViewMode: (viewMode: ViewMode) => void;
  setCurrentViewDate: (date: Date) => void;
}

const useSettingsStore = create<SettingsState>((set) => ({
  ganttViewMode: ViewMode.Month,
  currentViewDate: currentDate,
  setGanttViewMode: (viewMode) => set({ ganttViewMode: viewMode }),
  setCurrentViewDate: (date) => set({ currentViewDate: date }),
}));

export default useSettingsStore;
