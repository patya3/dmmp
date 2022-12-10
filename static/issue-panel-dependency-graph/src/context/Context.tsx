import { createContext, Dispatch, useReducer } from 'react';
import { EdgeData, NodeData } from 'reaflow';
import { EdgeTransfer } from '../types/app/edge-transfer.type';
import { IssueTransfer } from '../types/app/issue-transfer.interface';
import { JiraContext } from '../types/jira/context.type';
import reducer, { Action } from './Reducer';

export interface IContext {
  edges: EdgeData[];
  nodes: NodeData[];
  currentNode: NodeData | null;
  currentEdge: EdgeData | null;
  loading: boolean;
  isFullscreen: boolean;
  context: JiraContext | null;
  issues: IssueTransfer[];
  issueKeys: string[];
  links: EdgeTransfer[];
  linkIds: string[];
  depth: number;
  nodeKeys: string[];
  edgeKeys: string[];
  confirmationModalIsOpen: boolean;
}

export const initialState: IContext = {
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
};

export const Context = createContext<{
  state: IContext;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const Provider: React.FC<{ children: any }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>;
};
