import api, { route } from '@forge/api';
import { CreateIssueLinkInput } from './input.types';
import { IssueLinkTypes } from './types/return.types';

export const getIssueById = async (issueId: string, fields: string | null) => {
  let res: any;
  if (!fields) {
    res = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`);
  } else {
    res = await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}?fields=${fields}`);
  }
  return res.json();
};

export const deleteIssueLink = async (linkId: string): Promise<boolean> => {
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/issueLink/${linkId}`, { method: 'DELETE' });

  return res.ok;
};

export const createIssueLink = async (
  bodyData: CreateIssueLinkInput,
): Promise<{ ok: boolean; msg: string }> => {
  const res = await api.asApp().requestJira(route`/rest/api/3/issueLink`, {
    method: 'POST',
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    return { ok: res.ok, msg: `${res.status} ${res.statusText}` };
  }

  return { ok: res.ok, msg: '' };
};

export const getIssueLinkTypes = async (): Promise<IssueLinkTypes> => {
  const res = await api.asApp().requestJira(route`/rest/api/3/issueLinkType`, {
    headers: {
      Accept: 'application/json',
    },
  });

  return res.json();
};

export const getIssuesByKeys = async (keys: string[], fields: string) => {
  const jqlUrlString: string = keys.map((key) => `key=${key}`).join(' or ');
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/search?jql=${jqlUrlString}&fields=${fields}`, {
      headers: {
        Accept: 'application/json',
      },
    });

  const kecske = (await res.json()).issues;
  console.log(kecske);
  return kecske;
};
