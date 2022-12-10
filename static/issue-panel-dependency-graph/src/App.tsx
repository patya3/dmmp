import { useContext, useEffect, useState } from 'react';
import { Context } from './context/Context';
import { useIssue } from './hooks/useIssue';
import { ActionKind } from './context/Reducer';
import ReaflowWindow from './components/ReaflowWindow';
import Spinner from '@atlaskit/spinner';
import { invoke } from '@forge/bridge';
import { resolveIssueLinks } from './utils/graph.utils';
import {
  convertLinkTransferToIssueTransfer,
  convertMultiplieLinkTransferToEdgeTransfer,
} from './utils/reducer.utils';

function App() {
  const { loading, errors, issue, context } = useIssue();
  const { dispatch, state } = useContext(Context);
  const [loadingGraph, setLoadingGraph] = useState(true);

  useEffect(() => {
    if (!loading && context) {
      dispatch({ type: ActionKind.SET_CONTEXT, payload: context });
    }
    if (!loading && issue && errors.length === 0 && (!state.edges.length || !state.nodes.length)) {
      const linkTransfers = resolveIssueLinks(issue.fields.issuelinks);
      dispatch({
        type: ActionKind.ADD_ISSUES,
        payload: [
          ...linkTransfers.map((item) => convertLinkTransferToIssueTransfer(item, 1, false)),
          { ...issue, depth: 0, hidden: false },
        ],
      });
      dispatch({
        type: ActionKind.ADD_LINKS,
        payload: convertMultiplieLinkTransferToEdgeTransfer(linkTransfers, issue.key),
      });
      invoke('getIssuesByKeys', {
        issueKeys: linkTransfers.map((item) => item.issue.key),
        fields: 'issuetype,status,summary,issuelinks',
      }).then((issues: any) => {
        for (const it of issues) {
          const linkTransfers = resolveIssueLinks(it.fields.issuelinks);
          dispatch({
            type: ActionKind.ADD_ISSUES,
            payload: [
              ...linkTransfers.map((item) => convertLinkTransferToIssueTransfer(item, 2, true)),
              { ...it, depth: 1, hidden: false },
            ],
          });
          dispatch({
            type: ActionKind.ADD_LINKS,
            payload: convertMultiplieLinkTransferToEdgeTransfer(linkTransfers, it.key),
          });
        }
      });

      setLoadingGraph(false);
    }
  }, [loading, issue]);

  return !loadingGraph && issue ? <ReaflowWindow /> : <Spinner size={'xlarge'} />;
}

export default App;
