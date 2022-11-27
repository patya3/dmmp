import { NodeData } from 'reaflow';

export const resolveIssueLink = (issueLink: any) => {
  return {
    id: issueLink.id,
    self: issueLink.self,
    issue: {
      ...(issueLink.inwardIssue ? issueLink.inwardIssue : issueLink.outwardIssue),
      isPartial: true,
    },
    type: issueLink.type,
    linkType: issueLink.inwardIssue ? 'inward' : 'outward',
  };
};

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
