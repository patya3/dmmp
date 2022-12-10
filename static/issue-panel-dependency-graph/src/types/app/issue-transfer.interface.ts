import { JiraIssueLinkIssueData } from '../jira/issue.types';

export interface IssueTransfer extends JiraIssueLinkIssueData {
  isPartial?: boolean;
  depth: number;
  hidden: boolean;
  addedByUser?: boolean;
}
