export type JiraContext = {
  accountId: string;
  cloudId: string;
  environmentId: string;
  environmentType: string;
  extension?: {
    issue: {
      id: string;
      key: string;
      type: string;
      typeId: string;
    };
    project: {
      id: string;
      key: string;
      type: string;
    };
    isNewToIssue: boolean;
    type: string;
  };
  localId: string;
  locale: string;
  moduleKey: string;
  siteUrl: string;
  theme: string | null;
  timezone: string;
};
