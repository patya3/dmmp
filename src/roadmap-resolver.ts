import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import {
  createIssueLink,
  getIssueById,
  getIssueFields,
  getIssues,
  getProjects,
  updateIssue,
} from './api';

const resolver = new Resolver();

const defaultFields =
  'issuetype,status,summary,issuelinks,assignee,duedate,customfield_10015,customfield_10014,progress';

resolver.define('getIssues', ({ payload }) => {
  const { fields, issueType, connectedProjectsCustomFieldId, defaultProjectKey } = payload;
  return getIssues(
    defaultProjectKey,
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

resolver.define('updateIssueDate', async ({ payload }) => {
  const { fieldName, fieldValue, issueKey } = payload;
  const body = {
    fields: {
      [fieldName]: fieldValue,
    },
  };

  return updateIssue(issueKey, body);
});

resolver.define('setSettings', async ({ payload }) => {
  for (const [k, v] of Object.entries(payload.settings)) {
    await storage.set(k, v);
  }
});

resolver.define('getSettings', async ({ payload }) => {
  const { settingKeys } = payload;
  const settings: Record<string, any>[] = [];

  for (const key of settingKeys) {
    settings[key] = await storage.get(key);
  }

  return settings;
});

export const handler = resolver.getDefinitions();
