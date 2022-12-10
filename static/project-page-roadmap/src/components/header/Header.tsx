import css from './Header.module.css';
import Breadcumbs, { BreadcrumbsItem } from '@atlaskit/breadcrumbs';
import { router } from '@forge/bridge';
import Textfield from '@atlaskit/textfield';
import AvatarGroup, { AvatarProps } from '@atlaskit/avatar-group';
import Select, { CheckboxSelect } from '@atlaskit/select';
import Button, { ButtonGroup } from '@atlaskit/button';
import { ViewMode } from 'gantt-task-react';
import useJiraStore from '../../store/jira.store';
import useFiltersStore from '../../store/filters.store';
import { useCallback, useEffect, useState } from 'react';
import useSettingsStore from '../../store/settings.store';

import EditorSearchIcon from '@atlaskit/icon/glyph/editor/search';
import InfoIcon from '@atlaskit/icon/glyph/info';
import Spinner from '@atlaskit/spinner';
import AddIcon from '@atlaskit/icon/glyph/add';
import InlineDialog from '@atlaskit/inline-dialog';
import AddDependencyDialog from '../AddDependencyDialog/AddDependencyDialog';
import InfoDialog from '../InfoDialog/InfoDialog';

function Header() {
  // global state
  const context = useJiraStore((state) => state.context);
  const projects = useJiraStore((state) => state.projects);
  const assignees = useJiraStore((state) => state.assignees);
  const userIds = useFiltersStore((state) => state.userIds);
  const viewMode = useSettingsStore((state) => state.ganttViewMode);
  const loading = useJiraStore((state) => state.loading);

  // setters
  const setProjectKeys = useFiltersStore((state) => state.setProjectKeys);
  const setStatusCategories = useFiltersStore((state) => state.setStatusCategories);
  const addRemoveUserId = useFiltersStore((state) => state.addRemoveUserId);
  const setViewMode = useSettingsStore((state) => state.setGanttViewMode);
  const setText = useFiltersStore((state) => state.setText);

  // local state
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [users, setUsers] = useState<AvatarProps[]>([]);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [infoDialogIsOpen, setInfoDialogIsOpen] = useState(false);

  useEffect(() => {
    setProjectOptions(projects.map(({ name, key }) => ({ label: name, value: key })));
  }, [projects]);

  const toggleDialog = useCallback(() => {
    setDialogIsOpen((prevState) => !prevState);
  }, []);

  const toggleInfoDialog = useCallback(() => {
    setInfoDialogIsOpen((prevState) => !prevState);
  }, []);

  useEffect(() => {
    setUsers([
      ...assignees.map(({ accountId, displayName, avatarUrls }) => ({
        key: accountId,
        name: displayName,
        href: '#',
        src: avatarUrls['32x32'],
        onClick: () => addRemoveUserId(accountId),
      })),
      {
        key: 0,
        name: 'unassigned',
        href: '#',
        onClick: () => addRemoveUserId(null),
      },
    ]);
  }, [assignees, userIds]);

  const viewModeSelected = useCallback(
    (inputViewMode: ViewMode) => inputViewMode === viewMode,
    [viewMode],
  );

  return (
    <div className={css.headerContainer}>
      <div className={css.breadcrumbContainer}>
        <Breadcumbs>
          <BreadcrumbsItem text="Projects" onClick={() => router.navigate('/projects')} />
          <BreadcrumbsItem
            text={context?.extension?.project.key ?? ''}
            onClick={() => router.navigate(`/projects/${context?.extension?.project.key ?? ''}`)}
          />
          <BreadcrumbsItem text="Multi Project Roadmap" />
        </Breadcumbs>
      </div>
      <div className={css.filterContainer}>
        <div className={css.filters}>
          <div>
            <Textfield
              name="search"
              aria-label="search text field"
              placeholder="Search"
              elemAfterInput={
                <EditorSearchIcon label="" size="medium" primaryColor="rgb(94, 108, 132)" />
              }
              onChange={(el) => setText(el.currentTarget.value)}
            />
          </div>
          <div>
            <AvatarGroup
              borderColor="transparent"
              appearance="stack"
              data={users}
              overrides={{
                Avatar: {
                  render: (Component, props, index) => {
                    const style = { border: '1px solid blue', borderRadius: '50%' };
                    const key = props.key === 0 ? null : '' + props.key;
                    return (
                      <div style={userIds.includes(key) ? style : {}}>
                        <Component {...props} key={index} />
                      </div>
                    );
                  },
                },
              }}
            />
          </div>
          <div>
            <CheckboxSelect
              inputId="status-category"
              className={css.statusSelect}
              onChange={(values) => {
                setStatusCategories(
                  values.length
                    ? values.map(({ value }) => value.toString())
                    : ['To Do', 'In Progress', 'Done'],
                );
              }}
              options={[
                { label: 'In Progress', value: 'In Progress' },
                { label: 'To Do', value: 'To Do' },
                { label: 'Done', value: 'Done' },
              ]}
              placeholder="Status category"
            />
          </div>
          <div>
            <Select
              inputId="project"
              className={css.projectSelect}
              onChange={(values) => setProjectKeys(values.map(({ value }) => value))}
              options={projectOptions}
              placeholder="Select projects"
              isMulti
            />
          </div>
        </div>
      </div>
      <div className={css.buttonGroupContainer}>
        <ButtonGroup>
          <InlineDialog
            onClose={() => {
              toggleInfoDialog();
            }}
            content={<InfoDialog />}
            isOpen={infoDialogIsOpen}
          >
            <Button
              onClick={() => toggleInfoDialog()}
              iconBefore={<InfoIcon label="" size="small" />}
            >
              Info
            </Button>
          </InlineDialog>
          <InlineDialog
            onClose={() => {
              toggleDialog();
            }}
            content={<AddDependencyDialog />}
            isOpen={dialogIsOpen}
          >
            <Button
              onClick={() => toggleDialog()}
              style={{ marginLeft: '5px' }}
              iconBefore={<AddIcon label="" size="small" />}
            >
              Add Dependency
            </Button>
          </InlineDialog>
        </ButtonGroup>
        {loading && (
          <div style={{ fontSize: '15px' }}>
            <Spinner size="medium" />
            <strong style={{ paddingLeft: '5px', verticalAlign: 'bottom' }}>
              Loading issues...
            </strong>
          </div>
        )}
        <ButtonGroup>
          <Button
            onClick={() => setViewMode(ViewMode.Day)}
            isSelected={viewModeSelected(ViewMode.Day)}
          >
            Days
          </Button>
          <Button
            onClick={() => setViewMode(ViewMode.Week)}
            isSelected={viewModeSelected(ViewMode.Week)}
          >
            Weeks
          </Button>
          <Button
            onClick={() => setViewMode(ViewMode.Month)}
            isSelected={viewModeSelected(ViewMode.Month)}
          >
            Months
          </Button>
          <Button
            onClick={() => setViewMode(ViewMode.Year)}
            isSelected={viewModeSelected(ViewMode.Year)}
          >
            Years
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}

export default Header;
