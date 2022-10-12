export type CreateIssueLinkInput = {
  outwardIssue: { key: string };
  inwardIssue: { key: string };
  type: { name: string };
};
