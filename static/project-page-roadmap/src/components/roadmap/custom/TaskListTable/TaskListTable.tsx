import React, { useCallback, useState } from 'react';
import styles from './TaskListTable.module.css';
import { Task } from 'gantt-task-react';
import useJiraStore from '../../../../store/jira.store';
import { ViewIssueModal } from '@forge/jira-bridge';
import useSettingsStore from '../../../../store/settings.store';
import Button from '@atlaskit/button';
import AddIcon from '@atlaskit/icon/glyph/add';
import useFiltersStore from '../../../../store/filters.store';

const TaskListTable: React.FC<{
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: Task[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: Task) => void;
}> = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize, locale, onExpanderClick }) => {
  // global state
  const issues = useJiraStore((state) => state.issues);
  const issueType = useFiltersStore((state) => state.issueType);

  // fetch
  const updateIssueDate = useJiraStore((state) => state.updateIssueDate);
  const fetchIssues = useJiraStore((state) => state.fetchIssues);

  // setters
  const setCurrentViewDate = useSettingsStore((state) => state.setCurrentViewDate);
  const hideIssues = useJiraStore((state) => state.hideIssues);

  //local state
  const [displayed, setDisplayed] = useState<string | null>('T2-2');

  const addBar = useCallback(async (issueKey: string) => {
    const currentDate = new Date();
    await updateIssueDate(issueKey, currentDate, 'start');
    currentDate.setMonth(currentDate.getMonth() + 1);
    await updateIssueDate(issueKey, currentDate, 'end');
  }, []);

  const viewIssueModal = (issueKey: string) =>
    new ViewIssueModal({
      context: {
        issueKey,
      },
      onClose: async () => await fetchIssues(issueType),
    });

  return (
    <div
      className={styles.taskListWrapper}
      style={{
        fontFamily: fontFamily,
        fontSize: fontSize,
      }}
    >
      {tasks.map((t) => {
        const issue = issues.find((issue) => issue.key === t.id);
        const childrenKeys = issues
          .filter((issue) => issue.fields.customfield_10014 === t.id)
          .map((issue) => issue.key);
        let expanderSymbol = '';
        if (t.project === undefined) {
          const subIssues = issues.filter((i) => i.fields.customfield_10014 === issue?.key);
          if (subIssues.length) {
            if (subIssues.filter((i) => !i.data?.hidden).length) {
              expanderSymbol = '▼';
            } else {
              expanderSymbol = '▶';
            }
          }
        }
        const start = issue?.fields.customfield_10015
          ? issue?.fields.customfield_10015.replaceAll('-', '. ')
          : 'No Start Date';
        const end = issue?.fields.duedate
          ? issue?.fields.duedate.replaceAll('-', '. ')
          : 'No Due Date';

        return (
          <div
            className={styles.taskListTableRow}
            style={{ height: rowHeight }}
            key={`${t.id}row`}
            onMouseOver={() => setDisplayed(t.id)}
          >
            <div
              className={styles.taskListCell}
              style={{
                minWidth: rowWidth,
                maxWidth: rowWidth,
              }}
              title={t.name}
            >
              <div className={styles.taskListNameWrapper}>
                <div
                  className={
                    expanderSymbol ? styles.taskListExpander : styles.taskListEmptyExpander
                  }
                  onClick={() => {
                    hideIssues(childrenKeys);
                  }}
                >
                  {expanderSymbol}
                </div>
                <div onClick={() => viewIssueModal(issue!.key).open()} className={styles.issueName}>
                  <img src={issue?.fields.issuetype.iconUrl} className={styles.taskIcon} />
                  <span style={{ color: '#5E6C84' }}>{t.id}</span>
                </div>
              </div>
            </div>
            <div
              onClick={() => setCurrentViewDate(t.start)}
              className={styles.taskListCell}
              style={{
                minWidth: rowWidth,
                maxWidth: rowWidth,
                cursor: 'pointer',
              }}
            >
              &nbsp;{start}
            </div>
            <div
              onClick={() => setCurrentViewDate(t.end)}
              className={styles.taskListCell}
              style={{
                minWidth: rowWidth,
                maxWidth: rowWidth,
                cursor: 'pointer',
              }}
            >
              &nbsp;{end}
            </div>
            {displayed === t.id && !issue?.fields.duedate && !issue?.fields.customfield_10015 && (
              <div
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  height: rowHeight,
                  display: 'grid',
                  alignItems: 'center',
                }}
              >
                <Button iconBefore={<AddIcon size="small" />} onClick={() => addBar(t.id)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskListTable;
