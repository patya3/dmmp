import { view } from '@forge/bridge';
import { useEffect, useState } from 'react';

export const useJiraContext = (): any => {
  const [jiraContext, setJiraContext] = useState<any>(null);
  const [issueKey, setIssueKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log('hello');
    view.getContext().then((context: any) => {
      const issueKey = context.extension?.issue.key;

      setJiraContext(context);
      setIssueKey(issueKey);
      setLoading(false);
    });
  }, [setJiraContext, setIssueKey, setLoading]);

  return { jiraContext, issueKey, loadingContext: loading };
};
