import Select from '@atlaskit/select';
import { useState } from 'react';
import useJiraStore from '../../store/jira.store';
import css from './AddDependencyDialog.module.css';

import LinkFilledIcon from '@atlaskit/icon/glyph/link-filled';
import Button from '@atlaskit/button';
import { IssueTypes } from '../../types/jira/issue.types';

function AddDependencyDialog() {
  // global state
  const issues = useJiraStore((state) =>
    state.issues.filter(
      (issue) => !issue.data?.hidden && issue.fields.issuetype.name === IssueTypes.Epic,
    ),
  );

  //fetch
  const createIssueLink = useJiraStore((state) => state.createIssueLink);

  // local state
  const [fromIssueKey, setFromIssueKey] = useState<string | null | undefined>(null);
  const [toIssueKey, setToIssueKey] = useState<string | null | undefined>(null);

  return (
    <div className={css.container}>
      <Select
        options={issues
          .filter((issue) => issue.key !== toIssueKey)
          .map((issue) => ({
            label: (
              <>
                <b>{issue.key}</b> {issue.fields.summary}
              </>
            ),
            value: issue.key,
          }))}
        onChange={(selected) => setFromIssueKey(selected?.value)}
        placeholder="Choose an issue"
      />
      <div style={{ padding: '8px 0' }}>
        <span style={{ verticalAlign: 'middle' }}>
          <LinkFilledIcon size="medium" primaryColor="" />
        </span>
        <span style={{ verticalAlign: 'text-bottom', paddingLeft: '3px' }}>blocks</span>
      </div>
      <Select
        options={issues
          .filter((issue) => issue.key !== fromIssueKey)
          .map((issue) => ({
            label: (
              <>
                <b>{issue.key}</b> {issue.fields.summary}
              </>
            ),
            value: issue.key,
          }))}
        onChange={(selected) => setToIssueKey(selected?.value)}
        placeholder="Choose an issue"
        isDisabled={!fromIssueKey}
      />
      <Button
        style={{ float: 'right', marginTop: '10px' }}
        appearance="primary"
        isDisabled={!fromIssueKey || !toIssueKey}
        onClick={() => createIssueLink(fromIssueKey!, toIssueKey!)}
      >
        Add
      </Button>
    </div>
  );
}

export default AddDependencyDialog;
