import { view } from '@forge/bridge';
import { useEffect, useState } from 'react';
import { JiraContext } from '../types/jira/context.type';

export const useJiraContext = () => {
  const [jiraContext, setJiraContext] = useState<JiraContext | null>(null);
  const [issueKey, setIssueKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    view.getContext().then((context: any) => {
      const issueKey = context.extension?.issue.key;

      setJiraContext(context);
      setIssueKey(issueKey);
      setLoading(false);
    });
  }, [setJiraContext, setIssueKey, setLoading]);

  return { jiraContext, issueKey, loadingContext: loading };
};
