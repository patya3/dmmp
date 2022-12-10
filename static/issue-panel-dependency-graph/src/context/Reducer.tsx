import { Reducer } from 'react';
import { EdgeData, NodeData } from 'reaflow';
import { EdgeTransfer } from '../types/app/edge-transfer.type';
import { IssueTransfer } from '../types/app/issue-transfer.interface';
import { JiraContext } from '../types/jira/context.type';
import { createNodeDataFromIssueTransfer } from '../utils/graph.utils';
import { createEdgeDataFromLink, updateDepths } from '../utils/reducer.utils';
import { IContext } from './Context';

export enum ActionKind {
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

export interface ActionBase<T, P> {
  type: T;
  payload: P;
}

export type Action =
  | ActionBase<ActionKind.ADD_ISSUES, IssueTransfer[]>
  | ActionBase<
      ActionKind.ADD_LINKS,
      EdgeTransfer[] | { links: EdgeTransfer[]; addedByUser: boolean }
    >
  | ActionBase<ActionKind.REMOVE_EDGE, EdgeData> // TODO: should be string
  | ActionBase<ActionKind.REMOVE_NODE, string>
  | ActionBase<ActionKind.SET_CURRENT_NODE, NodeData>
  | ActionBase<ActionKind.SET_CURRENT_EDGE, EdgeData>
  | ActionBase<ActionKind.ADD_NODE, NodeData>
  | ActionBase<ActionKind.ADD_EDGE, EdgeData>
  | ActionBase<ActionKind.SET_LOADING, boolean>
  | ActionBase<
      ActionKind.UPDATE_EDGE,
      {
        edgeId: string;
        from: string;
        to: string;
        text: string;
        fromPort: string;
        toPort: string;
      }
    >
  | ActionBase<ActionKind.CHANGE_EDGE_ID, { edgeId: string; newEdgeId: string }>
  | ActionBase<ActionKind.CHANGE_DEPENDECY_TYPE, string>
  | ActionBase<ActionKind.TOGGLE_FULLSCREN, boolean>
  | ActionBase<ActionKind.SET_CONTEXT, JiraContext>
  | ActionBase<ActionKind.SET_DEPTH, number>
  | ActionBase<ActionKind.TOGGLE_FULLSCREN, boolean>
  | ActionBase<ActionKind.REMOVE_LINK, string>
  | ActionBase<ActionKind.SET_MODAL_OPEN, boolean>
  | ActionBase<ActionKind.CALC_DEPTHS, null>
  | ActionBase<ActionKind.REMOVE_USER_ADDED, null>
  | ActionBase<ActionKind.REDU_NODE, string>;

const reducer: Reducer<any, any> = (state: IContext, action: Action) => {
  const { type, payload } = action;
  let newNodes: NodeData[],
    newIssues: IssueTransfer[],
    newEdges: EdgeData[],
    newLinks,
    newNodeKeys: string[],
    newEdgeKeys: string[];

  switch (type) {
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
        nodeKeys: [...state.nodeKeys, payload.id],
        loading: false,
      };

    case ActionKind.ADD_EDGE:
      return {
        ...state,
        edges: [...state.edges, payload],
        edgeKeys: [...state.edgeKeys, payload.id],
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
      const edges = state.edges.filter((edge: EdgeData) => edge.id !== payload.id);
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
      const { edgeId, ...edgeData } = payload;
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
      const { edgeId: oldEdgeId, newEdgeId } = payload;
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
        linkIds: newLinks.map((link) => link.id),
      };

    case ActionKind.CHANGE_DEPENDECY_TYPE:
      return {
        ...state,
        currentEdge: { ...state.currentEdge, text: payload },
        edges: state.edges.map((edge: EdgeData) => {
          if (state.currentEdge && edge.id === state.currentEdge.id) {
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
        ...updateDepths(state.issues, state.links, payload),
        depth: payload,
      };

    case ActionKind.ADD_ISSUES:
      newIssues = [...state.issues];
      for (const issue of payload) {
        if (
          !state.issueKeys.includes(issue.key) &&
          !newIssues.map((item) => item.key).includes(issue.key)
        ) {
          newIssues.push(issue);
        } else {
          const matchingIssueIndex = newIssues.findIndex((item) => item.key === issue.key);
          if (newIssues[matchingIssueIndex].isPartial) {
            newIssues[matchingIssueIndex] = issue;
          }
        }
      }
      newNodes = newIssues
        .map((issue) => createNodeDataFromIssueTransfer(issue))
        .filter((node) => node.data.depth <= state.depth);
      return {
        ...state,
        issues: newIssues,
        issueKeys: newIssues.map((issue) => issue.key),
        nodeKeys: newNodes.map((node: NodeData) => node.id),
        nodes: newNodes,
      };

    case ActionKind.ADD_LINKS:
      console.log('payload', payload);
      console.log(state.linkIds);
      console.log(state.links);
      let addedByUser: boolean, links: EdgeTransfer[];
      if (Array.isArray(payload)) {
        addedByUser = false;
        links = payload as EdgeTransfer[];
      } else {
        addedByUser = payload.addedByUser;
        links = payload.links;
      }

      newLinks = [...state.links];
      for (const link of links) {
        if (!state.linkIds.includes(link.id)) newLinks.push(link);
        else {
          const index = newLinks.findIndex((l) => l.id === link.id);
          newLinks[index] = link;
        }
      }
      newEdges = newLinks
        .map((link) => createEdgeDataFromLink(link))
        .filter((link) => state.nodeKeys.includes(link.from) && state.nodeKeys.includes(link.to));
      return {
        ...state,
        links: newLinks,
        linkIds: newLinks.map((link) => link.id),
        ...updateDepths(state.issues, newLinks, state.depth),
      };

    case ActionKind.REMOVE_LINK:
      newEdges = state.edges.filter((edge: EdgeData) => edge.id !== payload);
      newNodes = state.nodes.filter((node: NodeData) => {
        return newEdges.some((edge: EdgeData) => edge.from === node.id || edge.to === node.id);
      });
      newLinks = state.links.filter((link) => link.id !== payload);
      newIssues = state.issues.filter((issue) => {
        return newEdges.some((edge: EdgeData) => edge.from === issue.key || edge.to === issue.key);
      });
      return {
        ...state,
        issueKeys: newIssues.map((issue) => issue.key),
        links: newLinks,
        ...updateDepths(newIssues, newLinks, state.depth),
        linkIds: newLinks.map((link) => link.id),
      };
    case ActionKind.CALC_DEPTHS:
      return {
        ...state,
        ...updateDepths(state.issues, state.links, state.depth),
      };

    case ActionKind.REMOVE_USER_ADDED:
      return {
        ...state,
        issues: state.issues.map((issue) => {
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
        createNodeDataFromIssueTransfer(state.issues.find((issue) => issue.key === payload)!),
      ];
      newNodeKeys = newNodes.map((node) => node.id);
      newEdges = state.links
        .map((link) => createEdgeDataFromLink(link))
        .filter((link) => newNodeKeys.includes(link.from) && newNodeKeys.includes(link.to));
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
};

export default reducer;
