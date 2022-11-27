export type JiraIssue = {
  id: string;
  key: string;
  self: string; // link of the issue
  fields: {
    summary: string;
    status: JiraIssueStatus;
    issuetype: JiraIssueType;
    issuelinks: JiraIssueLink[];
  };
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
    priority: JiraIssuePriority;
    status: JiraIssueStatus;
    summary: string;
  };
};
