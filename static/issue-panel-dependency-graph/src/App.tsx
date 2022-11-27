import { useContext, useEffect, useState } from 'react';
import { Context } from './context/Context';
import { useIssue } from './hooks/useIssue';
import { ActionKind } from './context/Reducer';
import ReaflowWindow from './components/ReaflowWindow';
import Spinner from '@atlaskit/spinner';
import { invoke } from '@forge/bridge';
import { resolveIssueLink } from './utils/graph.utils';

function App() {
  const { loading, errors, issue, context } = useIssue();
  const { dispatch, state } = useContext(Context);
  const [loadingGraph, setLoadingGraph] = useState(true);

  useEffect(() => {
    if (!loading && context) {
      dispatch({ type: ActionKind.SET_CONTEXT, payload: context });
    }
    console.log(issue);
    if (!loading && issue && errors.length === 0 && (!state.edges.length || !state.nodes.length)) {
      const links = issue.fields.issuelinks.map((item: any) => resolveIssueLink(item));
      dispatch({
        type: ActionKind.ADD_ISSUES,
        payload: [
          ...links.map((item: any) => ({ ...item.issue, depth: 1, hidden: false })),
          { ...issue, depth: 0, hidden: false },
        ],
      });
      dispatch({
        type: ActionKind.ADD_LINKS,
        payload: links.map((link: any) => ({
          id: link.id,
          to: link.linkType === 'inward' ? issue.key : link.issue.key,
          from: link.linkType === 'inward' ? link.issue.key : issue.key,
          type: link.type,
        })),
      });
      invoke('getIssuesByKeys', {
        issueKeys: links.map((item: any) => item.issue.key),
        fields: 'issuetype,status,summary,issuelinks',
      }).then((issues: any) => {
        for (const it of issues) {
          const links = it.fields.issuelinks.map((item: any) => resolveIssueLink(item));
          dispatch({
            type: ActionKind.ADD_ISSUES,
            payload: [
              ...links.map((item: any) => ({ ...item.issue, depth: 2, hidden: true })),
              { ...it, depth: 1, hidden: false },
            ],
          });
          dispatch({
            type: ActionKind.ADD_LINKS,
            payload: links.map((link: any) => ({
              id: link.id,
              to: link.linkType === 'inward' ? it.key : link.issue.key,
              from: link.linkType === 'inward' ? link.issue.key : it.key,
              type: link.type,
            })),
          });
        }
      });

      setLoadingGraph(false);
    }
  }, [loading, issue]);

  return !loadingGraph && issue ? <ReaflowWindow /> : <Spinner size={'xlarge'} />;
}

export default App;
