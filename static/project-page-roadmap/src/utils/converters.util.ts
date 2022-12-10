import { Task } from 'gantt-task-react';
import { IssueTypes, JiraIssue } from '../types/jira/issue.types';
import { colormap } from './colormap';

export function convertJiraIssueToTask(jiraIssue: JiraIssue): Task {
  const { key, fields, data } = jiraIssue;

  const currentDate = new Date();
  let start: Date | null = null;
  let end: Date | null = null;
  let hidden = false;
  const dependencies = jiraIssue.fields.issuelinks
    .filter((issueLink) => issueLink.inwardIssue && issueLink.type.name === 'Blocks')
    .map((issueLink) => issueLink.inwardIssue!.key);

  if (fields.customfield_10015) start = new Date(fields.customfield_10015);
  if (fields.duedate) end = new Date(fields.duedate);

  const backgroundColor = calcBackgroundColor(start, end, fields.issuetype.name as IssueTypes);

  if (start && !end) {
    end = new Date(start.getTime());
    end.setMonth(start.getMonth() + 1);
  }

  if (!start && end) {
    start = new Date(end.getTime());
    start.setMonth(end.getMonth() - 1);
  }

  if (!start && !end) {
    start = currentDate;
    end = currentDate;
    hidden = true;
  }

  const task: Task = {
    id: key,
    name: fields.summary,
    type: 'task',
    start: start!,
    end: end!,
    progress: !hidden ? fields.progress.percent || 0 : 0,
    // progress: 0,
    // dependencies:
    //   fields.issuetype.name === IssueTypes.Epic ? dependencies : [fields.customfield_10014!], // TODO: do it later
    dependencies,

    styles: {
      backgroundColor,
      backgroundSelectedColor: backgroundColor,
      progressColor: colormap[jiraIssue.fields.issuetype.name].progress,
    },
    ...(fields.customfield_10014 && { project: fields.customfield_10014 }),
  };

  return task;
}

function calcBackgroundColor(
  startDate: Date | null,
  endDate: Date | null,
  issueType: IssueTypes,
): string {
  if (startDate && !endDate) return `url(#noEnd${issueType})`;
  if (!startDate && endDate) return `url(#noStart${issueType})`;

  if (!endDate && !startDate) {
    return 'transparent';
  }

  return colormap[issueType].default;
}
