import { JiraIssueLinkIssueData, JiraIssueLinkType } from '../jira/issue.types';

export type LinkedIssueTransfer = {
  id: string;
  self: string;
  issue: JiraIssueLinkIssueData & { isPartial: boolean };
  type: JiraIssueLinkType;
  linkType: 'inward' | 'outward';
  depth?: number;
  hidden?: boolean;
  addedByUser?: boolean;
};
