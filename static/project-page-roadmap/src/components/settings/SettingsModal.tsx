import Select from '@atlaskit/select';
import { ViewMode } from 'gantt-task-react';

const options = [
  { label: 'Hour', value: ViewMode.Hour },
  { label: 'QuarterDay', value: ViewMode.QuarterDay },
  { label: 'HalfDay', value: ViewMode.HalfDay },
  { label: 'Day', value: ViewMode.Day },
  { label: 'Weeks', value: ViewMode.Week },
  { label: 'Months', value: ViewMode.Month },
  { label: 'Years', value: ViewMode.Year },
];

function SettingsModal() {
  return (
    <div>
      <Select isSearchable={false} options={options} />
    </div>
  );
}

export default SettingsModal;
