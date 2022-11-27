import { EdgeData, NodeData } from 'reaflow';

export enum ActionKind {
  SET_ISSUE = 'SET_ISSUE',
  INIT_NODES = 'INIT_NODES',
  INIT_EDGES = 'INIT_EDGES',
  SET_CURRENT_NODE = 'SET_CURRENT_NODE',
  SET_CURRENT_EDGE = 'SET_CURRENT_EDGE',
  ADD_NODE = 'ADD_NODE',
  ADD_EDGE = 'ADD_EDGE',
  REMOVE_NODE = 'REMOVE_NODE',
  REMOVE_EDGE = 'REMOVE_EDGE',
  UPDATE_EDGE = 'UPDATE_EDGE',
  UPDATE_NODE_DATA = 'UPDATE_NODE_DATA',
  CHANGE_EDGE_ID = 'CHANGE_EDGE_ID',
  SET_LOADING = 'SET_LOADING',
  CHANGE_DEPENDECY_TYPE = 'CHANGE_DEPENDECY_TYPE',
  TOGGLE_FULLSCREN = 'TOGGLE_FULLSCREN',
  SET_CONTEXT = 'SET_CONTEXT',
  SET_DEPTH = 'SET_DEPTH',
  ADD_ISSUES = 'ADD_ISSUES',
  ADD_LINKS = 'ADD_LINKS',
  REMOVE_LINK = 'REMOVE_LINK',
  CALC_DEPTHS = 'CALC_DEPTHS',
  REMOVE_USER_ADDED = 'REMOVE_USER_ADDED',
  SET_MODAL_OPEN = 'SET_MODAL_OPEN',
  REDU_NODE = 'REDU_NODE',
}

export interface Action {
  type: ActionKind;
  payload:
    | null
    | EdgeData
    | EdgeData[]
    | NodeData
    | NodeData[]
    | Record<string, any>
    | Record<string, any>[]
    | boolean
    | string
    | number;
}

function reducer(state: any, action: Action) {
  const { type, payload } = action;
  let newNodes: NodeData[],
    newIssues,
    newEdges: EdgeData[],
    newLinks,
    newNodeKeys: string[],
    newEdgeKeys: string[];

  switch (type) {
    case ActionKind.SET_ISSUE:
      return {
        ...state,
        issue: payload,
        loading: false,
      };
    case ActionKind.INIT_NODES:
      return {
        ...state,
        nodes: payload,
        nodeKeys: (payload as NodeData[]).map((item: NodeData) => item.id),
        loading: false,
      };
    case ActionKind.INIT_EDGES:
      return {
        ...state,
        edges: payload,
        edgeKeys: (payload as EdgeData[]).map((item: EdgeData) => item.id),
        loading: false,
      };
    case ActionKind.SET_CURRENT_NODE:
      return {
        ...state,
        currentNode: payload,
      };
    case ActionKind.SET_CURRENT_EDGE:
      return {
        ...state,
        currentEdge: payload,
      };
    case ActionKind.ADD_NODE:
      return {
        ...state,
        nodes: [...state.nodes, payload],
        nodeKeys: [...state.nodeKeys, (payload as NodeData).id],
        loading: false,
      };
    case ActionKind.ADD_EDGE:
      return {
        ...state,
        edges: [...state.edges, payload],
        edgeKeys: [...state.edgeKeys, (payload as EdgeData).id],
        loading: false,
      };
    case ActionKind.SET_LOADING:
      return {
        ...state,
        loading: payload,
      };
    case ActionKind.REMOVE_NODE:
      newNodes = state.nodes.filter((node: NodeData) => node.id !== payload);
      newNodeKeys = newNodes.map((node) => node.id);
      newEdges = state.edges.filter(
        (edge: EdgeData) => newNodeKeys.includes(edge.from!) && newNodeKeys.includes(edge.to!),
      );
      newEdgeKeys = newEdges.map((edge) => edge.id);
      return {
        ...state,
        nodes: newNodes,
        edges: newEdges,
        nodeKeys: newNodeKeys,
        edgeKeys: newEdgeKeys,
      };
    case ActionKind.REMOVE_EDGE:
      const edges = state.edges.filter((edge: EdgeData) => edge.id !== (payload as EdgeData).id);
      const nodes = state.nodes.filter((node: NodeData) => {
        return edges.some((edge: EdgeData) => edge.from === node.id || edge.to === node.id);
      });
      return {
        ...state,
        edges: edges,
        nodes: nodes,
        nodeKeys: nodes.map((node: NodeData) => node.id),
        edgeKeys: edges.map((edge: EdgeData) => edge.id),
      };

    case ActionKind.UPDATE_EDGE:
      const { edgeId, ...edgeData } = payload as EdgeData & { edgeId: string };
      return {
        ...state,
        edges: state.edges.map((edge: EdgeData) => {
          if (edge.id === edgeId) {
            const newEdge = { ...edge, ...edgeData };
            return newEdge;
          }
          return edge;
        }),
      };

    case ActionKind.UPDATE_NODE_DATA:
      const { nodeId, data } = payload as Record<string, any>;
      const nodeIndex = state.nodes.findIndex((node: any) => node.id === nodeId);
      newNodes = [...state.nodes];
      newNodes[nodeIndex] = {
        ...state.nodes[nodeIndex],
        data: {
          ...state.nodes[nodeIndex].data,
          ...data,
        },
      };
      return {
        ...state,
        nodes: newNodes,
      };

    case ActionKind.CHANGE_EDGE_ID:
      const { edgeId: oldEdgeId, newEdgeId } = payload as Record<string, string>;
      const index = state.edgeKeys.findIndex((key: string) => key === oldEdgeId);
      newEdgeKeys = [...state.edgeKeys];
      newLinks = [...state.links];
      if (!oldEdgeId.includes('_')) {
        newLinks[index].id = newEdgeId;
      }
      newEdges = state.edges.map((edge: EdgeData) => {
        if (edge.id === oldEdgeId) {
          return {
            ...edge,
            id: newEdgeId,
          };
        }
        return edge;
      });
      newEdgeKeys[index] = newEdgeId;

      return {
        ...state,
        edges: newEdges,
        edgeKeys: newEdgeKeys,
        links: newLinks,
        linkIds: newLinks.map((link: any) => link.id),
      };

    case ActionKind.CHANGE_DEPENDECY_TYPE:
      return {
        ...state,
        currentEdge: { ...state.currentEdge, text: payload },
        edges: state.edges.map((edge: EdgeData) => {
          if (edge.id === state.currentEdge.id) {
            return { ...edge, text: payload };
          }
          return edge;
        }),
      };
    case ActionKind.TOGGLE_FULLSCREN:
      return {
        ...state,
        isFullscreen: payload,
      };
    case ActionKind.SET_CONTEXT:
      return {
        ...state,
        context: payload,
      };

    case ActionKind.SET_DEPTH:
      return {
        ...state,
        ...updateDepths(state.issues, state.links, payload as number),
        depth: payload,
      };

    case ActionKind.ADD_ISSUES:
      newIssues = [...state.issues];
      for (const issue of payload as Record<string, any>[]) {
        if (
          !state.issueKeys.includes(issue.key) &&
          !newIssues.map((i: any) => i.key).includes(issue.key)
        ) {
          newIssues.push(issue);
        } else {
          const matchingIssueIndex = newIssues.findIndex((i: any) => i.key === issue.key);
          if (newIssues[matchingIssueIndex].isPartial) {
            newIssues[matchingIssueIndex] = issue;
          }
        }
      }
      newNodes = newIssues
        .map((issue: any) => createNodeDataFromIssue(issue))
        .filter((node) => node.data.depth <= state.depth);
      return {
        ...state,
        issues: newIssues,
        issueKeys: newIssues.map((issue: any) => issue.key),
        nodeKeys: newNodes.map((node: NodeData) => node.id),
        nodes: newNodes,
      };

    case ActionKind.ADD_LINKS:
      let addedByUser: boolean, links;
      if (Array.isArray(payload)) {
        addedByUser = false;
        links = payload;
      } else {
        addedByUser = (payload as Record<string, any>).addedByUser;
        links = (payload as Record<string, any>).links;
      }

      newLinks = [...state.links];
      for (const link of links) {
        if (!state.linkIds.includes(link.id)) newLinks.push(link);
        else {
          const index = newLinks.findIndex((l: any) => l.id === link.id);
          newLinks[index] = link;
        }
      }
      newEdges = newLinks
        .map((link: any) => createEdgeDataFromLink(link))
        .filter(
          (link: any) => state.nodeKeys.includes(link.from) && state.nodeKeys.includes(link.to),
        );
      return {
        ...state,
        links: newLinks,
        linkIds: newLinks.map((link: any) => link.id),
        ...updateDepths(state.issues, newLinks, state.depth),
      };

    case ActionKind.REMOVE_LINK:
      newEdges = state.edges.filter((edge: EdgeData) => edge.id !== payload);
      newNodes = state.nodes.filter((node: NodeData) => {
        return newEdges.some((edge: EdgeData) => edge.from === node.id || edge.to === node.id);
      });
      newLinks = state.links.filter((link: any) => link.id !== payload);
      newIssues = state.issues.filter((issue: any) => {
        return newEdges.some((edge: EdgeData) => edge.from === issue.key || edge.to === issue.key);
      });
      return {
        ...state,
        issueKeys: newIssues.map((issue: any) => issue.key),
        links: newLinks,
        ...updateDepths(newIssues, newLinks, state.depth),
        linkIds: newLinks.map((link: any) => link.id),
      };
    case ActionKind.CALC_DEPTHS:
      return {
        ...state,
        ...updateDepths(state.issues, state.links, state.depth),
      };

    case ActionKind.REMOVE_USER_ADDED:
      return {
        ...state,
        issues: state.issues.map((issue: any) => {
          delete issue.addedByUser;
          return issue;
        }),
        nodes: state.nodes.map((node: NodeData) => {
          delete node.data.addedByUser;
          return node;
        }),
      };
    case ActionKind.SET_MODAL_OPEN:
      return {
        ...state,
        confirmationModalIsOpen: payload,
      };

    case ActionKind.REDU_NODE:
      newNodes = [
        ...state.nodes,
        createNodeDataFromIssue(state.issues.find((issue: any) => issue.key === payload)),
      ];
      newNodeKeys = newNodes.map((node) => node.id);
      newEdges = state.links
        .map((link: any) => createEdgeDataFromLink(link))
        .filter((link: any) => newNodeKeys.includes(link.from) && newNodeKeys.includes(link.to));
      return {
        ...state,
        nodes: newNodes,
        edges: newEdges,
        nodeKeys: newNodeKeys,
        edgeKeys: newEdges.map((edge) => edge.id),
      };

    default:
      return state;
  }
}

const createNodeDataFromIssue = (issue: any): NodeData => {
  const { key, fields, self, depth, hidden, addedByUser } = issue;
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

const createEdgeDataFromLink = (link: any) => {
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

const updateDepths = (
  issues: any[],
  links: any[],
  depth: number,
): {
  issues: any[];
  nodes: NodeData[];
  edges: EdgeData[];
  edgeKeys: string[];
  nodeKeys: string[];
  currentMaxDepth: number;
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
    currentMaxDepth: Math.max(...newNodes.map((node) => node.data.depth)),
  };
};

export default reducer;
