import { invoke } from '@forge/bridge';
import { useEffect, useReducer, useState } from 'react';
import { EdgeData, NodeData } from 'reaflow';
import reducer, { ActionKind } from '../context/Reducer';

const nodeDefaultConfig = {
  width: 170,
};

export const useGraph = (issue: any) => {
  const initialState: any = {
    issue: {},
    edges: [],
    nodes: [],
    currentNode: null,
    currentEdge: null,
    loading: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: ActionKind.SET_ISSUE, payload: issue });
  }, []);

  // const state = {
  //   nodes,
  //   edges,
  //   issue,
  // };
  //
  // return [state, { setNodes, setEdges, setIssue }];
  return state;
};
