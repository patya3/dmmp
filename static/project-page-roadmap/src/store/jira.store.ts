import { invoke, view } from '@forge/bridge';
import create from 'zustand';
import { JiraContext } from '../types/jira/context.type';
import { JiraIssueField } from '../types/jira/field.type';
import { IssueTypes, JiraIssue, JiraIssueAssignee } from '../types/jira/issue.types';
import { JiraProject } from '../types/jira/project.type';

interface JiraState {
  issues: JiraIssue[];
  issueFields: JiraIssueField[];
  projects: JiraProject[];
  loading: boolean;
  context: JiraContext | null;
  assignees: JiraIssueAssignee[];

  setIssueData: (key: string, data: Record<string, any>) => void;
  setIssuesData: (keys: string[], data: Record<string, any>) => void;
  setLoading: (loading: boolean) => void;
  hideIssues: (issueKeys: string[]) => void;

  fetchIssues: (issueType: IssueTypes) => Promise<void>;
  fetchContext: () => Promise<void>;
  fetchIssueFields: () => Promise<void>;
  createIssueLink: (inwardIssueKey: string, outwardIssueKey: string) => Promise<void>;
  updateIssueDate: (issueKey: string, date: Date, type: 'end' | 'start') => Promise<void>;
}

const useJiraStore = create<JiraState>()((set, get) => ({
  issues: [],
  issueFields: [],
  projects: [],
  loading: false,
  context: null,
  assignees: [],

  setIssueData: (key, data) => {
    const issues = [...get().issues];
    const index = issues.findIndex((issue) => issue.key === key);
    if (index === -1) return;
    issues[index].data = data;
    set({ issues });
  },

  setIssuesData: (keys, data) => {
    const issues = [...get().issues];
    for (let i = 0; i < keys.length; i++) {
      const index = issues.findIndex((issue) => issue.key === keys[i]);
      if (index === -1) return;
      issues[index].data = data;
    }
    set({ issues });
  },

  setLoading: (loading) => set({ loading }),

  hideIssues: (issueKeys) => {
    const issues = get().issues.map((issue) =>
      issueKeys.includes(issue.key) ? { ...issue, data: { hidden: !issue.data?.hidden } } : issue,
    );
    set({ issues });
  },

  fetchIssues: async (issueType) => {
    set({ loading: true });
    const fieldId = (await invoke<string>('getFromStorageByKey', { key: 'cpcfId' })).split('_')[1];
    const defaultProjectKey = get().context?.extension?.project.key;
    const fields = `issuetype,status,summary,issuelinks,assignee,duedate,customfield_10015,customfield_10014,progress,project,${fieldId}`;
    const issues = (
      await invoke<JiraIssue[]>('getIssues', {
        defaultProjectKey,
        issueType,
        fields,
        connectedProjectsCustomFieldId: fieldId,
      })
    ).map((issue) =>
      issue.fields.customfield_10014 ? { ...issue, data: { hidden: true } } : issue,
    );

    const assignees = issues
      .map((issue) => issue.fields.assignee)
      .filter((assignee) => assignee !== null)
      .filter((v, i, a) => a.findIndex((assignee) => assignee.accountId === v.accountId) === i);

    const projects = issues
      .map((issue) => issue.fields.project)
      .filter((v, i, a) => a.findIndex((project) => project.key === v.key) === i);

    set({ loading: false, issues, assignees, projects });
  },

  fetchContext: async () => {
    const context = (await view.getContext()) as JiraContext;
    set({ context });
  },

  fetchIssueFields: async () => {
    set({ loading: true });
    const issueFields = await invoke<JiraIssueField[]>('getIssueFields');
    set({ issueFields, loading: false });
  },

  createIssueLink: async (inwardIssueKey: string, outwardIssueKey: string, typeName = 'Blocks') => {
    set({ loading: true });
    const outwardIssue = await invoke<JiraIssue>('createIssueLink', {
      inwardIssueKey,
      outwardIssueKey,
      typeName,
    });
    const issues = [...get().issues];
    const index = issues.findIndex((issue) => issue.key === outwardIssue.key);
    if (index === -1) return;
    issues[index] = outwardIssue;
    set({ issues, loading: false });
  },

  updateIssueDate: async (issueKey, date, type) => {
    const fieldName = type === 'end' ? 'duedate' : 'customfield_10015';
    const issues = [...get().issues];
    const index = issues.findIndex((issue) => issue.key === issueKey);
    issues[index].fields[fieldName] = date.toISOString().split('T')[0];
    set({ issues });
    invoke('updateIssueDate', {
      issueKey,
      fieldName,
      fieldValue: date,
    });
  },
}));

export default useJiraStore;
