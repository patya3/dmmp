import { JiraProject } from './project.type';

export type JiraIssue = {
  id: string;
  key: string;
  self: string; // link of the issue
  fields: {
    summary: string;
    status: JiraIssueStatus;
    issuetype: JiraIssueType;
    issuelinks: JiraIssueLink[];
    assignee: JiraIssueAssignee;
    duedate: string;
    [key: string]: any;
    customfield_10015: string; // start date
    customfield_10014?: string; // epic link
    progress: { progress: number; total: number; percent: number };
    project: JiraProject;
  };
  data?: Record<string, any>;
};

export type JiraIssueStatus = {
  description: string;
  iconUrl: string;
  id: string;
  name: string;
  self: string;
  statusCategory: {
    colorName: string;
    id: number;
    key: string;
    name: string;
    self: string;
  };
};

export type JiraIssueType = {
  avatarId: number;
  description: string;
  hierarchyLevel: number;
  iconUrl: string;
  id: string;
  name: string;
  self: string;
  subtask: boolean;
};

export type JiraIssuePriority = {
  id: string;
  name: string;
  iconUrl: string;
  self: string;
};

export type JiraIssueLink = {
  id: string;
  outwardIssue?: JiraIssueLinkIssueData;
  inwardIssue?: JiraIssueLinkIssueData;
  self: string;
  type: JiraIssueLinkType;
};

export type JiraIssueAssignee = {
  accountId: string;
  accountType: string;
  active: boolean;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  displayName: string;
  self: string;
  timeZone: string;
};

export type JiraIssueLinkType = {
  id: string;
  inward: string;
  name: string;
  outward: string;
  self: string;
};

export type JiraIssueLinkIssueData = {
  id: string;
  key: string;
  self: string;
  fields: {
    issuetype: JiraIssueType;
    priority?: JiraIssuePriority;
    status: JiraIssueStatus;
    summary: string;
  };
};

export enum IssueTypes {
  Epic = 'Epic',
  Bug = 'Bug',
  Story = 'Story',
  SubTask = 'Sub-task',
  Task = 'Task',
}
