import { invoke, view } from '@forge/bridge';
import { useEffect, useState } from 'react';

type Response = {
  loading: boolean;
  errors: { message: string }[];
  issue: any;
  context: any;
};
export const useIssue = (): Response => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ message: string }[]>([]);
  const [issue, setIssue] = useState<any>({});
  const [context, setContext] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrors([]);

    const fetchIssue = async () => {
      try {
        const context = (await view.getContext()) as any;
        // const response = await requestJira(`/rest/api/3/issue/${context.extension?.issue.key}`);
        const data: any = await invoke('getIssueById', {
          id: context.extension?.issue.key,
          fields: 'issuetype,status,summary,issuelinks',
        });

        setIssue(data);
        setContext(context);
      } catch (e) {
        console.error('Could not fetch issue', e);
        setIssue({});
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
