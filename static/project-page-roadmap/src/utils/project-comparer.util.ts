import { Task } from 'gantt-task-react';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const compares = (a: Task, b: Task): number => {
  if (a.project && b.project) {
    return collator.compare(a.id, b.id);
  }
  if (!a.project && !b.project) {
    return collator.compare(a.id, b.id);
  }
  if (a.project && !b.project) {
    return collator.compare(a.project, b.id);
  }
  if (!a.project && b.project) {
    return collator.compare(a.id, b.project);
  }
  return 0;
};
