import create from 'zustand';
import { IssueTypes } from '../types/jira/issue.types';

interface FiltersState {
  projectKeys: string[];
  statusCategories: string[];
  userIds: (string | null)[];
  issueType: IssueTypes;
  text: string;

  setProjectKeys: (projectKeys: string[]) => void;
  setStatusCategories: (statusCategories: string[]) => void;
  setUserIds: (userIds: string[]) => void;
  addRemoveUserId: (userId: string | null) => void;
  setIssueType: (issueType: IssueTypes) => void;
  setText: (text: string) => void;
}

const useFiltersStore = create<FiltersState>()((set) => ({
  defaultProject: null,
  projectKeys: [],
  statusCategories: ['To Do', 'In Progress', 'Done'],
  userIds: [],
  issueType: IssueTypes.Epic,
  text: '',

  setProjectKeys: (projectKeys) => set({ projectKeys }),
  setStatusCategories: (statusCategories) => set({ statusCategories }),
  setUserIds: (userIds) => set({ userIds }),
  addRemoveUserId: (userId) =>
    set((state) => {
      if (!state.userIds.includes(userId)) {
        return { userIds: [...state.userIds, userId] };
      }
      return { userIds: state.userIds.filter((ui) => ui !== userId) };
    }),
  setIssueType: (issueType) => set({ issueType }),
  setText: (text) => set({ text }),
}));

export default useFiltersStore;
