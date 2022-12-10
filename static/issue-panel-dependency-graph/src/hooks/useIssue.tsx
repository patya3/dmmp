import { invoke, view } from '@forge/bridge';
import { useEffect, useState } from 'react';
import { JiraContext } from '../types/jira/context.type';
import { JiraIssue } from '../types/jira/issue.types';

type Response = {
  loading: boolean;
  errors: { message: string }[];
  issue: JiraIssue | null;
  context: JiraContext | null;
};
export const useIssue = (): Response => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ message: string }[]>([]);
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [context, setContext] = useState<JiraContext | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrors([]);

    const fetchIssue = async () => {
      try {
        const context = (await view.getContext()) as JiraContext;
        const data = await invoke<JiraIssue>('getIssueById', {
          id: context.extension?.issue.key,
          fields: 'issuetype,status,summary,issuelinks',
        });

        setIssue(data);
        setContext(context);
      } catch (e) {
        console.error('Could not fetch issue', e);
        setIssue(null);
        setErrors([{ message: 'Could not fetch issue' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [setLoading, setIssue, setErrors]);

  return {
    loading,
    issue,
    errors,
    context,
  };
};
