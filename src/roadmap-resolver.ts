import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import { createIssueLink, getIssueById, getIssueFields, getIssues, getProjects } from './api';

const resolver = new Resolver();

// project = TC OR (project=T2 AND "Connected Projects[Labels]" in (TC)) ORDER BY Rank ASC
const defaultFields =
  'issuetype,status,summary,issuelinks,assignee,duedate,customfield_10015,progress';

resolver.define('getIssues', ({ payload }) => {
  const {
    fields,
    projectKeys,
    statusCategories,
    userIds,
    issueType,
    connectedProjectsCustomFieldId,
    defaultProjectKey,
  } = payload;
  return getIssues(
    defaultProjectKey,
    projectKeys,
    statusCategories,
    userIds,
    fields ? fields : defaultFields,
    issueType,
    connectedProjectsCustomFieldId,
  );
});

resolver.define('getProjects', () => {
  return getProjects();
});

resolver.define('getIssueFields', () => {
  return getIssueFields();
});

resolver.define('createIssueLink', async ({ payload }) => {
  const { outwardIssueKey, inwardIssueKey, typeName } = payload;
  await createIssueLink({
    inwardIssue: { key: inwardIssueKey },
    outwardIssue: { key: outwardIssueKey },
    type: { name: typeName },
  });
  return getIssueById(outwardIssueKey, defaultFields);
});

resolver.define('getFromStorageByKey', async ({ payload }) => {
  return storage.get(payload.key);
});

export const handler = resolver.getDefinitions();
