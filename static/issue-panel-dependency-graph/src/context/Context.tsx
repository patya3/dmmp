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
  issueKeys: string[];
  links: Record<string, any>[];
  linkIds: string[];
  depth: number;
  nodeKeys: string[];
  edgeKeys: string[];
  confirmationModalIsOpen: boolean;
  currentMaxDepth: number;
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
  issueKeys: [],
  links: [],
  linkIds: [],
  depth: 1,
  nodeKeys: [],
  edgeKeys: [],
  confirmationModalIsOpen: false,
  currentMaxDepth: 1,
};

export const Context = createContext<{
  state: IContext;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const Provider: React.FC<{ children: any }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>;
};
