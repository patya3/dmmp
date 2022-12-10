import { Gantt, Task } from 'gantt-task-react';
import css from './Roadmap.module.css';
import 'gantt-task-react/dist/index.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import useFiltersStore from '../../store/filters.store';
import useJiraStore from '../../store/jira.store';
import { convertJiraIssueToTask } from '../../utils/converters.util';
import Spinner from '@atlaskit/spinner';
import useSettingsStore from '../../store/settings.store';
import TaskListHeader from './custom/TaskListHeader/TaskListHeader';
import TaskListTable from './custom/TaskListTable/TaskListTable';
import { compares } from '../../utils/project-comparer.util';
import TooltipContent from './custom/TooltipContent/TooltipContent';

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Fira Sans','Droid Sans', 'Helvetica Neue', sans-serif";

function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

  // global state
  const projectKeys = useFiltersStore((state) => state.projectKeys);
  const statusCategories = useFiltersStore((state) => state.statusCategories);
  const userIds = useFiltersStore((state) => state.userIds);
  const issueType = useFiltersStore((state) => state.issueType);
  const text = useFiltersStore((state) => state.text);
  const issues = useJiraStore((state) => state.issues);
  const viewMode = useSettingsStore((state) => state.ganttViewMode);
  const currentViewDate = useSettingsStore((state) => state.currentViewDate);
  const loading = useJiraStore((state) => state.loading);

  // fetch and async
  const fetchIssues = useJiraStore((state) => state.fetchIssues);
  const updateIssueDate = useJiraStore((state) => state.updateIssueDate);

  // setters
  const setLoading = useJiraStore((state) => state.setLoading);

  // local state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ganttHeight, setGanttHeight] = useState(0);
  // const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchIssues(issueType).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    let newIssues = issues.filter((issue) => !issue.data?.hidden);
    if (statusCategories.length)
      newIssues = newIssues.filter((issue) => statusCategories.includes(issue.fields.status.name));
    if (userIds.length)
      newIssues = newIssues.filter((issue) => {
        if (issue.fields.assignee) return userIds.includes(issue.fields.assignee.accountId);
        else return userIds.includes(null);
      });
    if (projectKeys.length)
      newIssues = newIssues.filter((issue) => projectKeys.includes(issue.fields.project.key));
    if (text)
      newIssues = newIssues.filter(
        (issue) =>
          issue.fields.summary.toLowerCase().includes(text.toLowerCase()) ||
          issue.key.toLowerCase().includes(text.toLowerCase()),
      );
    setTasks(newIssues.map((issue) => convertJiraIssueToTask(issue)).sort(compares));
  }, [issues, statusCategories, userIds, projectKeys, text]);

  const handleTaskChange = useCallback(
    async (task: Task) => {
      const oldTask = tasks.find((t) => t.id === task.id)!;
      if (oldTask.end !== task.end) await updateIssueDate(task.id, task.end, 'end');
      if (oldTask.start !== task.start) await updateIssueDate(task.id, task.start, 'start');
    },
    [tasks],
  );

  useEffect(() => {
    if (ref.current) {
      setGanttHeight(ref.current.clientHeight - 93);
    }
  }, [ref]);

  useEffect(() => {
    if (ref2.current) {
      for (let i = 0; i < tasks.length; i++) {
        const date = new Date().toISOString().split('T')[0];
        const start = tasks[i].start.toISOString().split('T')[0];
        const end = tasks[i].end.toISOString().split('T')[0];
        if (date === end && date === start) {
          setTimeout(() => {
            let bars: NodeListOf<HTMLElement> | null = ref2.current!.querySelectorAll(
              `.bar > g:nth-child(${i + 1}) > g > g > rect`,
            );
            bars?.forEach((bar) => {
              if (bar) {
                bar.style.width = '0';
              }
            });
          }, 5);
        }
      }
    }
  }, [tasks, ref2]);

  return (
    <div className={css.roadmapOuterContainer}>
      <div className={css.roadmapInnerContainer}>
        <div ref={ref} className={css.heightMeasure}></div>
        {!!tasks.length && (
          <div ref={ref2}>
            <Gantt
              // ganttHeight={ganttHeight}
              tasks={tasks}
              viewMode={viewMode}
              columnWidth={260}
              headerHeight={60}
              TaskListHeader={TaskListHeader}
              TaskListTable={TaskListTable}
              TooltipContent={TooltipContent}
              onDateChange={handleTaskChange}
              barBackgroundSelectedColor={'currentColor'}
              viewDate={currentViewDate}
              listCellWidth="110px"
              timeStep={1000 * 60 * 60 * 24}
              barFill={50}
              fontFamily={fontFamily}
            />
          </div>
        )}
        {!tasks.length && (
          <div className={css.spinnerContainer}>
            <h2>No issues found with the specified filters.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Roadmap;
