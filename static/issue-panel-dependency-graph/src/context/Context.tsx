import { createContext, Dispatch, useReducer } from 'react';
import { EdgeData, NodeData } from 'reaflow';
import reducer, { Action } from './Reducer';

interface IContext {
  issue: Record<string, any>;
  edges: EdgeData[];
  nodes: NodeData[];
  currentNode: NodeData | null;
  currentEdge: EdgeData | null;
  loading: boolean;
  isFullscreen: boolean;
  context: Record<string, any> | null;
  issues: Record<string, any>[];
  loadedDepth: number;
  nodeKeys: string[];
  edgeKeys: string[];
}

export const initialState: IContext = {
  issue: {},
  edges: [],
  nodes: [],
  currentNode: null,
  currentEdge: null,
  loading: false,
  isFullscreen: false,
  context: null,
  issues: [],
  loadedDepth: 1,
  nodeKeys: [],
  edgeKeys: [],
};

export const Context = createContext<{
  state: IContext;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const Provider: React.FC<{ children: any }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>;
};
