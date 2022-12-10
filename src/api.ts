import api, { route } from '@forge/api';

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
  bodyData: Record<string, any>,
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

export const getIssueLinkTypes = async () => {
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

  return (await res.json()).issues;
};

export const getIssues = async (
  defaultProjectKey: string,
  fields: string,
  issueType: string,
  connectedProjectsCustomFieldId: string,
) => {
  const jqlStrings: string[] = [];
  jqlStrings.push(
    `(project = ${defaultProjectKey} OR (cf[${connectedProjectsCustomFieldId}] = ${defaultProjectKey}))`,
  );
  jqlStrings.push(`(issuetype = ${issueType} or "Epic Link" != null)`);

  const jqlUrlString = jqlStrings.join(' AND ') + ' ORDER BY issuetype ASC, key ASC';

  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/search?jql=${jqlUrlString}&fields=${fields}`, {
      headers: {
        Accept: 'application/json',
      },
    });

  return (await res.json()).issues;
};

export const getProjects = async () => {
  const res = await api.asApp().requestJira(route`/rest/api/3/project/search`, {
    headers: {
      Accept: 'application/json',
    },
  });

  return (await res.json()).values;
};

export const getIssueFields = async () => {
  const res = await api.asUser().requestJira(route`/rest/api/3/field`, {
    headers: {
      Accept: 'application/json',
    },
  });

  return await res.json();
};

export const createCustomField = async (body: {
  searcherKey: string;
  name: string;
  description: string;
  type: string;
}) => {
  const res = await api.asApp().requestJira(route`/rest/api/3/field`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res.json();
};

export const getCustomFieldContexts = async (fieldId: string) => {
  const res = await api.asApp().requestJira(route`/rest/api/3/field/${fieldId}/context`, {
    headers: {
      Accept: 'application/json',
    },
  });

  return res.json();
};

export const createCustomFieldOptions = async (
  fieldId: string,
  contextId: string,
  body: { options: { disabled: boolean; value: string }[] },
) => {
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/field/${fieldId}/context/${contextId}/option`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  return res.json();
};

export const addFieldToDefaultScreen = async (fieldId: string) => {
  const res = await api.asApp().requestJira(route`/rest/api/3/screens/addToDefault/${fieldId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  return res.json();
};

export const updateIssue = async (issueKey: string, body: Record<string, any>) => {
  await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};
