import { NodeData } from 'reaflow';
import { LinkedIssueTransfer } from '../types/app/link-transfer.type';
import { JiraIssueLink } from '../types/jira/issue.types';

export const resolveIssueLink = (
  issueLink: JiraIssueLink,
  depth?: number,
  hidden?: boolean,
): LinkedIssueTransfer => {
  return {
    id: issueLink.id,
    self: issueLink.self,
    issue: {
      ...(issueLink.inwardIssue ? issueLink.inwardIssue! : issueLink.outwardIssue!),
      isPartial: true,
    },
    type: issueLink.type,
    linkType: issueLink.inwardIssue ? 'inward' : 'outward',
    depth,
    hidden,
  };
};

export const resolveIssueLinks = (
  issueLinks: JiraIssueLink[],
  depth?: number,
  hidden?: boolean,
): LinkedIssueTransfer[] =>
  issueLinks.map((issueLink) => resolveIssueLink(issueLink, depth, hidden));

export const createNodeData = (
  id: string,
  iconUrl: string,
  data: Record<string, any>,
): NodeData => {
  return {
    id,
    icon: {
      url: iconUrl,
      width: 25,
      height: 25,
    },
    data,
    ports: [
      {
        id: `northport_${id}`,
        width: 10,
        height: 10,
        side: 'NORTH',
      },
      {
        id: `southport_${id}`,
        width: 10,
        height: 10,
        side: 'SOUTH',
      },
    ],
    width: 170,
  };
};
