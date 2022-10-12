import { useContext, useEffect, useState } from 'react';
import { Context } from './context/Context';
import { useIssue } from './hooks/useIssue';
import { ActionKind } from './context/Reducer';
import ReaflowWindow from './components/ReaflowWindow';
import Spinner from '@atlaskit/spinner';
import { invoke } from '@forge/bridge';

const iconSize = {
  width: 25,
  height: 25,
};

function App() {
  const { loading, errors, issue, context } = useIssue();
  const { dispatch, state } = useContext(Context);
  const [loadingGraph, setLoadingGraph] = useState(true);

  useEffect(() => {
    if (!loading && context) {
      dispatch({ type: ActionKind.SET_CONTEXT, payload: context });
    }
    if (!loading && issue && errors.length === 0 && (!state.edges.length || !state.nodes.length)) {
      console.log(issue.fields.issuelinks);
      const linkedIssues: any[] = issue.fields.issuelinks.map((item: any) => {
        return item.inwardIssue
          ? {
              ...item.inwardIssue,
              linkType: 'inward',
              linkData: { id: item.id, type: item.type, from: item.inwardIssue.key, to: issue.key },
            }
          : {
              ...item.outwardIssue,
              linkType: 'outward',
              linkData: {
                id: item.id,
                type: item.type,
                from: issue.key,
                to: item.outwardIssue.key,
              },
            };
      });

      const issueKeys = [...linkedIssues, issue].map((item: any) => item.key);

      for (const li of linkedIssues) {
        invoke('getIssueById', { id: li.id, fields: 'issuelinks' }).then((i: any) => {
          linkedIssues.push(
            ...i.fields.issuelinks
              .filter((item: any) => {
                const key = item.inwardIssue ? item.inwardIssue.key : item.outwardIssue.key;
                return !issueKeys.includes(key);
              })
              .map((item: any) => {
                return item.inwardIssue
                  ? {
                      ...item.inwardIssue,
                      linkType: 'inward',
                      linkData: {
                        id: item.id,
                        type: item.type,
                        from: item.inwardIssue.key,
                        to: li.key,
                      },
                    }
                  : {
                      ...item.outwardIssue,
                      linkType: 'outward',
                      linkData: {
                        id: item.id,
                        type: item.type,
                        from: li.key,
                        to: item.outwardIssue.key,
                      },
                    };
              }),
          );
          dispatch({
            type: ActionKind.INIT_NODES,
            payload: [...linkedIssues, issue].map((item: any) => ({
              id: item.key,
              icon: {
                url: item.fields.issuetype.iconUrl,
                ...iconSize,
              },
              ports: [
                {
                  id: `northport_${item.key}`,
                  width: 10,
                  height: 10,
                  side: 'NORTH',
                  hidden: true,
                },
                {
                  id: `southport_${item.key}`,
                  width: 10,
                  height: 10,
                  side: 'SOUTH',
                },
              ],
              data: {
                status: item.fields.status.name,
                issueType: item.fields.issuetype.name,
                title: item.fields.summary,
              },
              width: 170,
            })),
          });
          dispatch({
            type: ActionKind.INIT_EDGES,
            payload: linkedIssues.map((item: any) => {
              return {
                id: item.linkData.id,
                text: item.linkData.type.outward,
                from: item.linkData.from,
                to: item.linkData.to,
                data: {
                  id: item.id,
                  text: item.linkData.type.outward,
                },
                fromPort: `southport_${item.linkData.from}`,
                toPort: `northport_${item.linkData.to}`,
              };
            }),
          });
          setLoadingGraph(false);
        });
      }
    }
  }, [loading, issue]);

  return !loadingGraph && issue ? <ReaflowWindow /> : <Spinner size={'xlarge'} />;
}

export default App;
