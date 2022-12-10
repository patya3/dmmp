import { Task } from 'gantt-task-react';
import useJiraStore from '../../../../store/jira.store';
import styles from './TooltipContent.module.css';
import ProgressBar from '@atlaskit/progress-bar';
import Lozenge from '@atlaskit/lozenge';

const TooltipContent: React.FC<{
  task: Task;
  fontSize: string;
  fontFamily: string;
}> = ({ task, fontSize, fontFamily }) => {
  const style = {
    fontSize,
    fontFamily,
  };
  const issue = useJiraStore((state) => state.issues.find((issue) => issue.key === task.id)!);
  return (
    <div className={styles.tooltipDefaultContainer} style={style}>
      <div className={styles.nameContainer}>
        <strong>{issue.fields.summary}</strong>
        <span>
          {issue.fields.status.name === 'To Do' && <Lozenge>To Do</Lozenge>}
          {issue.fields.status.name === 'In Progress' && (
            <Lozenge appearance="inprogress">In Progress</Lozenge>
          )}
          {issue.fields.status.name === 'Done' && <Lozenge appearance="success">Done</Lozenge>}
        </span>
      </div>
      {!!issue.fields.progress.total && (
        <div>
          <span style={{ float: 'right' }}>
            Logged {issue.fields.progress.progress / 60 / 60}h of &nbsp;
            {issue.fields.progress.total / 60 / 60}h
          </span>
          <ProgressBar value={issue.fields.progress.percent / 100} />
        </div>
      )}
      <div>
        <b>From:</b>{' '}
        {issue.fields.customfield_10015 ? issue.fields.customfield_10015 : 'No Start Date'}
      </div>
      <div>
        <b>To:</b>{' '}
        {issue.fields.duedate ? issue.fields.duedate.replaceAll('-', '. ') : 'No Due Date'}
      </div>
      <div>
        <b>Assigneed To:</b>&nbsp;
        {issue.fields.assignee ? (
          <>
            <img src={issue.fields.assignee.avatarUrls['16x16']} style={{ borderRadius: '50%' }} />
            <span>{issue.fields.assignee.displayName}</span>
          </>
        ) : (
          'unassigned'
        )}
      </div>
      {!!issue.fields.issuelinks.length && (
        <div>
          <b>Dependencies:</b>
          <ul>
            {issue.fields.issuelinks.map((issuelink) => (
              <div key={issuelink.id}>
                {issuelink.inwardIssue && (
                  <li>
                    {issuelink.type.inward} <b>{issuelink.inwardIssue.key}</b>
                  </li>
                )}
                {issuelink.outwardIssue && (
                  <li>
                    {issuelink.type.outward} <b>{issuelink.outwardIssue.key}</b>
                  </li>
                )}
              </div>
            ))}
          </ul>
        </div>
      )}

      {task.end.getTime() - task.start.getTime() !== 0 && (
        <p className={styles.tooltipDefaultContainerParagraph}>{`Duration: ${~~(
          (task.end.getTime() - task.start.getTime()) /
          (1000 * 60 * 60 * 24)
        )} day(s)`}</p>
      )}
    </div>
  );
};

export default TooltipContent;
