import { addNodeAndEdge, EdgeData, NodeData } from 'reaflow';

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
}

export interface Action {
  type: ActionKind;
  payload:
    | EdgeData
    | EdgeData[]
    | NodeData
    | NodeData[]
    | Record<string, any>
    | boolean
    | string
    | number;
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
      return {
        ...state,
        nodes: state.nodes.filter((node: NodeData) => node.id !== (payload as NodeData).id),
        edges: state.edges.filter((edge: EdgeData) => edge.id.includes((payload as NodeData).id)),
        nodeKeys: state.nodeKeys.filter((key: string) => key !== (payload as NodeData).id),
        edgeKeys: state.edgeKeys.filter((key: string) => !key.includes((payload as NodeData).id)),
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
      const newNodes = [...state.nodes];
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
      const index = state.edgeKeys.findIndex((key: string) => key === (payload as any).edgeId);
      console.log(state.edgeKeys.filter((key: string) => key === (payload as any).edgeId));
      console.log(index);
      const edgeKeys = [...state.edgeKeys];
      edgeKeys[index] = (payload as any).newEdgeId;
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
        edgeKeys,
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
        loadedDepth: payload,
      };

    default:
      return state;
  }
}

export default reducer;
