import { JiraIssueLinkIssueData, JiraIssueLinkType } from '../jira/issue.types';

export type LinkTransfer = {
  id: string;
  self: string;
  issue: JiraIssueLinkIssueData & { isPartial: boolean };
  type: JiraIssueLinkType;
  linkType: 'inward' | 'outward';
};
