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
}

export interface Action {
  type: ActionKind;
  payload: EdgeData | EdgeData[] | NodeData | NodeData[] | Record<string, any> | boolean | string;
}

function reducer(state: any, action: Action) {
  const { type, payload } = action;

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
        loading: false,
      };
    case ActionKind.INIT_EDGES:
      return {
        ...state,
        edges: payload,
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
        loading: false,
      };
    case ActionKind.ADD_EDGE:
      return {
        ...state,
        edges: [...state.edges, payload],
        loading: false,
      };
    case ActionKind.SET_LOADING:
      return {
        ...state,
        loading: payload,
      };
    case ActionKind.REMOVE_NODE:
      return {
        ...state,
        nodes: state.nodes.filter((node: NodeData) => node.id !== (payload as NodeData).id),
        edges: state.edges.filter((edge: EdgeData) => edge.id.includes((payload as NodeData).id)),
      };
    case ActionKind.REMOVE_EDGE:
      const newEdges = state.edges.filter((edge: EdgeData) => edge.id !== (payload as EdgeData).id);
      return {
        ...state,
        edges: newEdges,
        nodes: state.nodes.filter((node: NodeData) => {
          return newEdges.some((edge: EdgeData) => edge.from === node.id || edge.to === node.id);
        }),
      };

    case ActionKind.UPDATE_EDGE:
      return {
        ...state,
        edges: state.edges.map((edge: EdgeData) => {
          if (edge.id === (payload as any).edgeId) {
            return {
              ...edge,
              from: (payload as any).from,
              to: (payload as any).to,
              text: (payload as any).text,
            };
          }
          return edge;
        }),
      };

    case ActionKind.UPDATE_NODE_DATA:
      const { nodeId, data } = payload as Record<string, any>;
      console.log(nodeId, data);
      return {
        ...state,
        nodes: state.nodes.map((node: NodeData) => {
          if (node.id === nodeId) {
            console.log(node.id, nodeId);
            return {
              ...node,
              data,
            };
          }
          return node;
        }),
      };

    case ActionKind.CHANGE_EDGE_ID:
      return {
        ...state,
        edges: state.edges.map((edge: EdgeData) => {
          if (edge.id === (payload as any).edgeId) {
            return {
              ...edge,
              id: (payload as any).newEdgeId,
            };
          }
          return edge;
        }),
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

    default:
      return state;
  }
}

export default reducer;
