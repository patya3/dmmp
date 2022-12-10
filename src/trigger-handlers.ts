import { storage } from '@forge/api';
import {
  createCustomField,
  createCustomFieldOptions,
  getCustomFieldContexts,
  getProjects,
} from './api';
export async function installationHandler() {
  const customFieldBody = {
    searcherKey: 'com.atlassian.jira.plugin.system.customfieldtypes:multiselectsearcher',
    name: 'Connected Projects',
    description: 'List of projects in which the issue is related.',
    type: 'com.atlassian.jira.plugin.system.customfieldtypes:multiselect',
  };

  const projects: any[] = await getProjects();
  const options = projects.map((project) => ({
    disabled: false,
    value: `${project.name} (${project.key})`,
  }));

  const optionsBody = { options };

  const { id: fieldId } = await createCustomField(customFieldBody);
  const { values } = await getCustomFieldContexts(fieldId);
  const contextId = values[0].id;
  await createCustomFieldOptions(fieldId, contextId, optionsBody);

  await storage.set('cpcfId', fieldId);
  await storage.set(
    'cpcfOptions',
    options.map((option) => option.value),
  );
  return true;
}
