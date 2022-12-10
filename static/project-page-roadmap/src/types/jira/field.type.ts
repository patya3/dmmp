export type JiraIssueField = {
  id: string;
  key: string;
  name: string;
  untranslatedName: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema: {
    type: string;
    items?: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
};
