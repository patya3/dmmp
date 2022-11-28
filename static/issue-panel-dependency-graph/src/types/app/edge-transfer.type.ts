import { JiraIssueLinkType } from '../jira/issue.types';

export type EdgeTransfer = {
  id: string;
  to: string;
  from: string;
  type: JiraIssueLinkType;
};
