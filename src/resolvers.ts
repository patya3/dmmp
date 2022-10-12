import Resolver from '@forge/resolver';
import { createIssueLink, deleteIssueLink, getIssueById, getIssueLinkTypes } from './api';

const resolver = new Resolver();

resolver.define('getIssueById', ({ payload, context }) => {
  console.log(context);
  return getIssueById(payload.id ?? context.extension.issue.key, payload.fields);
});

resolver.define('deleteIssueLink', ({ payload }) => {
  if (!payload.linkId) throw new Error('No issue link id');
  return deleteIssueLink(payload.linkId);
});

resolver.define('createIssueLink', async ({ payload }) => {
  if (!payload.linkData) throw new Error('No link data provided');
  if (!payload.newNodeKey) throw new Error('No new node provided');
  await createIssueLink(payload.linkData);
  return getIssueById(payload.newNodeKey, null);
});

resolver.define('changeIssueLinkType', async ({ payload, context }) => {
  if (!payload.linkId) throw new Error('No issue link id');
  if (!payload.linkData) throw new Error('No link data provided');
  await deleteIssueLink(payload.linkId);
  await createIssueLink(payload.linkData);
  return getIssueById(context.extension.issue.key, null);
});

resolver.define('getIssueLinkTypes', () => {
  return getIssueLinkTypes();
});

export const handler = resolver.getDefinitions();
