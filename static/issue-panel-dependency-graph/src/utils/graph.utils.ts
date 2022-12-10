import { NodeData } from 'reaflow';
import { IssueTransfer } from '../types/app/issue-transfer.interface';
import { LinkTransfer } from '../types/app/link-transfer.type';
import { JiraIssueLink } from '../types/jira/issue.types';

export const resolveIssueLink = (issueLink: JiraIssueLink): LinkTransfer => {
  return {
    id: issueLink.id,
    self: issueLink.self,
    issue: {
      ...(issueLink.inwardIssue ? issueLink.inwardIssue! : issueLink.outwardIssue!),
      isPartial: true,
    },
    type: issueLink.type,
    linkType: issueLink.inwardIssue ? 'inward' : 'outward',
  };
};

export const resolveIssueLinks = (issueLinks: JiraIssueLink[]): LinkTransfer[] =>
  issueLinks.map((issueLink) => resolveIssueLink(issueLink));

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

export const createNodeDataFromIssueTransfer = (item: IssueTransfer): NodeData => {
  const { fields, key, self, depth, hidden, addedByUser } = item;
  return {
    id: key,
    icon: {
      url: fields.issuetype.iconUrl,
      width: 25,
      height: 25,
    },
    data: {
      title: fields.summary,
      status: fields.status.name,
      issueType: fields.issuetype.name,
      link: self,
      depth,
      hidden,
      addedByUser,
    },
    ports: [
      {
        id: `northport_${key}`,
        width: 10,
        height: 10,
        side: 'NORTH',
      },
      {
        id: `southport_${key}`,
        width: 10,
        height: 10,
        side: 'SOUTH',
      },
    ],
    width: 170,
  };
};
