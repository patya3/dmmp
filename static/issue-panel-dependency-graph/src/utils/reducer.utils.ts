import { EdgeData, NodeData } from 'reaflow';
import { EdgeTransfer } from '../types/app/edge-transfer.type';
import { LinkedIssueTransfer } from '../types/app/link-transfer.type';

export const updateDepths = (
  issues: any[],
  links: any[],
  depth: number,
): {
  issues: any[];
  nodes: NodeData[];
  edges: EdgeData[];
  edgeKeys: string[];
  nodeKeys: string[];
} => {
  const defaultIssue = issues.find((issue) => issue.depth === 0)!;
  const depths: Set<string>[] = [
    new Set([defaultIssue.key]),
    new Set([]),
    new Set([]),
    new Set([]),
    new Set([]),
    new Set([]),
  ];
  let i = 0;
  let currentEdges = links.filter((link) => depths[i].has(link.from!) || depths[i].has(link.to!));
  const addedNodes = [defaultIssue.key];
  while (currentEdges.length) {
    if (i + 1 >= depths.length) {
      break;
    }
    for (const edge of currentEdges) {
      if (!addedNodes.includes(edge.from!)) {
        depths[i + 1].add(edge.from!);
        addedNodes.push(edge.from!);
      }
      if (!addedNodes.includes(edge.to!)) {
        depths[i + 1].add(edge.to!);
        addedNodes.push(edge.to!);
      }
    }
    i++;
    currentEdges = links.filter((link) => depths[i].has(link.from!) || depths[i].has(link.to!));
  }

  let newNodes: NodeData[],
    newEdges: EdgeData[],
    newNodeKeys: string[],
    newEdgeKeys: string[],
    newIssues: any[];
  newIssues = issues.map((issue) => {
    const index = depths.findIndex((depthSet) => depthSet.has(issue.key));
    return { ...issue, depth: index };
  });
  newNodes = newIssues
    .map((issue: any) => createNodeDataFromIssue(issue))
    .filter((node) => node.data.depth <= depth || node.data.addedByUser);
  newNodeKeys = newNodes.map((node: NodeData) => node.id);
  newEdges = links
    .map((link: any) => createEdgeDataFromLink(link))
    .filter((link: any) => newNodeKeys.includes(link.from) && newNodeKeys.includes(link.to));
  newEdgeKeys = newEdges.map((edge: EdgeData) => edge.id);

  return {
    issues: newIssues,
    nodes: newNodes,
    edges: newEdges,
    nodeKeys: newNodeKeys,
    edgeKeys: newEdgeKeys,
  };
};

export const createNodeDataFromIssue = (linkTransfer: LinkedIssueTransfer): NodeData => {
  const { issue, self, depth, hidden, addedByUser } = linkTransfer;
  console.log(linkTransfer);
  const { key, fields } = issue;

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

export const createEdgeDataFromLink = (link: any) => {
  const { from, to, type, id } = link;

  return {
    id,
    text: type.outward,
    from: from,
    to: to,
    fromPort: `southport_${from}`,
    toPort: `northport_${to}`,
  };
};

export const convertLinkTransferToEdgeTransfer = (
  linkTransfer: LinkedIssueTransfer,
  issueKey: string,
): EdgeTransfer => ({
  id: linkTransfer.id,
  to: linkTransfer.linkType === 'inward' ? issueKey : linkTransfer.issue.key,
  from: linkTransfer.linkType === 'inward' ? linkTransfer.issue.key : issueKey,
  type: linkTransfer.type,
});

export const convertMultiplieLinkTransferToEdgeTransfer = (
  linkTransfers: LinkedIssueTransfer[],
  issueKey: string,
): EdgeTransfer[] =>
  linkTransfers.map((linkTransfer) => convertLinkTransferToEdgeTransfer(linkTransfer, issueKey));
