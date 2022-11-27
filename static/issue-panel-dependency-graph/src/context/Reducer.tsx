import { EdgeData, NodeData } from 'reaflow';
import {
  createEdgeDataFromLink,
  createNodeDataFromIssue,
  updateDepths,
} from '../utils/context.utils';

export enum ActionKind {
  SET_ISSUE = 'SET_ISSUE',
  SET_CURRENT_NODE = 'SET_CURRENT_NODE',
  SET_CURRENT_EDGE = 'SET_CURRENT_EDGE',
  ADD_NODE = 'ADD_NODE',
  ADD_EDGE = 'ADD_EDGE',
  REMOVE_NODE = 'REMOVE_NODE',
  REMOVE_EDGE = 'REMOVE_EDGE',
  UPDATE_EDGE = 'UPDATE_EDGE',
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

export default reducer;
