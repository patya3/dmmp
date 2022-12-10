import { EdgeData, NodeData } from 'reaflow';
import { EdgeTransfer } from '../types/app/edge-transfer.type';
import { IssueTransfer } from '../types/app/issue-transfer.interface';
import { LinkTransfer } from '../types/app/link-transfer.type';
import { createNodeDataFromIssueTransfer } from './graph.utils';

export const updateDepths = (
  issues: IssueTransfer[],
  links: EdgeTransfer[],
  depth: number,
): {
  issues: IssueTransfer[];
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
    newIssues: IssueTransfer[];
  newIssues = issues.map((issue) => {
    const index = depths.findIndex((depthSet) => depthSet.has(issue.key));
    return { ...issue, depth: index };
  });
  newNodes = newIssues
    .map((issue) => createNodeDataFromIssueTransfer(issue))
    .filter((node) => node.data.depth <= depth || node.data.addedByUser);
  newNodeKeys = newNodes.map((node: NodeData) => node.id);
  newEdges = links
    .map((link) => createEdgeDataFromLink(link))
    .filter((link) => newNodeKeys.includes(link.from) && newNodeKeys.includes(link.to));
  newEdgeKeys = newEdges.map((edge: EdgeData) => edge.id);

  return {
    issues: newIssues,
    nodes: newNodes,
    edges: newEdges,
    nodeKeys: newNodeKeys,
    edgeKeys: newEdgeKeys,
  };
};

export const createEdgeDataFromLink = (link: EdgeTransfer) => {
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
  linkTransfer: LinkTransfer,
  issueKey: string,
): EdgeTransfer => ({
  id: linkTransfer.id,
  to: linkTransfer.linkType === 'inward' ? issueKey : linkTransfer.issue.key,
  from: linkTransfer.linkType === 'inward' ? linkTransfer.issue.key : issueKey,
  type: linkTransfer.type,
});

export const convertMultiplieLinkTransferToEdgeTransfer = (
  linkTransfers: LinkTransfer[],
  issueKey: string,
): EdgeTransfer[] =>
  linkTransfers.map((linkTransfer) => convertLinkTransferToEdgeTransfer(linkTransfer, issueKey));

export const convertLinkTransferToIssueTransfer = (
  linkTransfer: LinkTransfer,
  depth: number,
  hidden = false,
  addedByUser = false,
): IssueTransfer => ({
  ...linkTransfer.issue,
  depth,
  hidden,
  addedByUser,
});
