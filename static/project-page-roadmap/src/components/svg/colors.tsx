import { Fragment } from 'react';
import { IssueTypes } from '../../types/jira/issue.types';
import { colormap } from '../../utils/colormap';
function SVGColors() {
  const issueTypes = [IssueTypes.Epic, IssueTypes.Story, IssueTypes.Task];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="0" width="0">
      {issueTypes.map((issueType) => (
        <Fragment key={issueType}>
          <defs>
            <linearGradient id={`noStart${issueType}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: colormap[issueType].light, stopOpacity: 1 }} />
              <stop
                offset="60%"
                style={{ stopColor: colormap[issueType].default, stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <defs>
            <linearGradient id={`noEnd${issueType}`} x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" style={{ stopColor: colormap[issueType].light, stopOpacity: 1 }} />
              <stop
                offset="60%"
                style={{ stopColor: colormap[issueType].default, stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
        </Fragment>
      ))}
    </svg>
  );
}

export default SVGColors;
