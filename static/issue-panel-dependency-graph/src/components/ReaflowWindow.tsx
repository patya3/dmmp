import { invoke, requestJira, router } from '@forge/bridge';
import {
  Canvas,
  CanvasPosition,
  CanvasRef,
  Edge,
  EdgeData,
  EdgeProps,
  Label,
  Node,
  NodeData,
  NodeProps,
  Port,
  Remove,
  useSelection,
} from 'reaflow';
import classNames from 'classnames';
import bind from 'classnames/bind';
import css from './ReaflowWindow.module.css';
import { MouseEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Context } from '../context/Context';
import { ActionKind } from '../context/Reducer';
import Button from '@atlaskit/button';
import VidFullScreenOnIcon from '@atlaskit/icon/glyph/vid-full-screen-on';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import EditIcon from '@atlaskit/icon/glyph/edit';
import LockIcon from '@atlaskit/icon/glyph/lock';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import EditorHorizontalRuleIcon from '@atlaskit/icon/glyph/editor/horizontal-rule';
import { PopupSelect } from '@atlaskit/select';
import AddIcon from '@atlaskit/icon/glyph/add';
import Blanket from '@atlaskit/blanket';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import TextField from '@atlaskit/textfield';
import { ButtonItem } from '@atlaskit/menu';
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';
import Spinner from '@atlaskit/spinner';
import debounce from 'lodash.debounce';
import Flag, { AppearanceTypes, AutoDismissFlag, FlagGroup } from '@atlaskit/flag';
import ConfirmationModal, { ConfirmationModalProps } from './ConfirmationModal/ConfirmationModal';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import LinkIcon from '@atlaskit/icon/glyph/link';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import UndoIcon from '@atlaskit/icon/glyph/undo';
import { createNodeData, resolveIssueLink } from '../utils/graph.utils';
import { SearchJiraIssue } from '../types/jira/search-issue.types';
import { JiraIssue, JiraIssueLinkType } from '../types/jira/issue.types';
import {
  convertLinkTransferToIssueTransfer,
  convertMultiplieLinkTransferToEdgeTransfer,
} from '../utils/reducer.utils';
import { IssueTransfer } from '../types/app/issue-transfer.interface';
import Lozenge from '@atlaskit/lozenge';

const cx = bind.bind(css);

(window as any).g = null;
(window as any).i = null;

function ReaflowWindow() {
  const [isPannable, setIsPannable] = useState<boolean>(false);
  const [issueLinkTypes, setIssueLinkTypes] = useState<Record<string, any>[]>([]);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(false);
  const [isRightDrawerOpen, setRightIsDrawerOpen] = useState<boolean>(false);
  const [searchedIssues, setSearchedIssues] = useState<SearchJiraIssue[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isSearchDirty, setIsSearchDirty] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [depth, setDepth] = useState<number>(1);
  const [maxDepth, setMaxDepth] = useState<number>(5);
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalProps | null>(
    null,
  );
  const [removedNodeIds, setRemovedNodeIds] = useState<string[]>([]);

  const [flags, setFlags] = useState<
    { id: number; title: string; description: string; type: string; appearance: AppearanceTypes }[]
  >([]);

  const [enteredNodeId, setEnteredNodeId] = useState<string>('');
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [tempEdgeId, setTempEdgeId] = useState<string | null>(null);
  const { state, dispatch } = useContext(Context);
  const { nodes, edges, nodeKeys, edgeKeys, issues } = state;

  const reaflowWindow = useRef(null);
  const canvasRef = useRef<CanvasRef | null>(null);
  const searchFieldRef = useRef<HTMLInputElement | null>(null);

  const { selections, onClick, clearSelections } = useSelection({
    nodes,
    edges,
    selections: [],
  });

  useEffect(() => {
    invoke<{ issueLinkTypes: JiraIssueLinkType[] }>('getIssueLinkTypes').then(
      ({ issueLinkTypes }) => {
        const inwardTypes = { label: 'Inward', options: [] as { label: string; value: any }[] };
        const outwardTypes = { label: 'Outward', options: [] as { label: string; value: any }[] };
        for (const type of issueLinkTypes) {
          inwardTypes.options.push({
            label: type.inward,
            value: { name: type.name, type: 'inward', outwardText: type.outward },
          });
          outwardTypes.options.push({
            label: type.outward,
            value: { name: type.name, type: 'outward', outwardText: type.outward },
          });
        }

        setIssueLinkTypes([inwardTypes, outwardTypes]);
      },
    );
  }, [invoke, setIssueLinkTypes]);

  const toggleFullscreen = useCallback(() => {
    const elem = document.body;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }

    if (state.isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
    }

    dispatch({ type: ActionKind.TOGGLE_FULLSCREN, payload: !state.isFullscreen });
  }, [state.isFullscreen, dispatch]);

  const onNodeClick = useCallback((event: MouseEvent, node: NodeData) => {
    dispatch({ type: ActionKind.SET_CURRENT_NODE, payload: node });
    onClick?.(event as any, node);
  }, []);

  const onEdgeClick = useCallback(
    (event: MouseEvent, edge: EdgeData) => {
      dispatch({ type: ActionKind.SET_CURRENT_EDGE, payload: edge });
      onClick?.(event as any, edge);
    },
    [onClick, dispatch],
  );

  const onEdgeTypeChange = useCallback(
    (event: Record<string, any> | null, edge: EdgeData) => {
      if (!event || event.label === state.currentEdge!.text) return;

      const isInward = event.value.type === 'inward';
      invoke<JiraIssue>('changeIssueLinkType', {
        linkId: edge.id,
        linkData: {
          outwardIssue: { key: isInward ? edge.from : edge.to },
          inwardIssue: { key: isInward ? edge.to : edge.from },
          type: { name: event.value.name },
        },
      }).then((updatedIssue) => {
        const link = resolveIssueLink(
          updatedIssue.fields.issuelinks.find((issueLink) => !edgeKeys.includes(issueLink.id))!,
        );
        dispatch({
          type: ActionKind.CHANGE_EDGE_ID,
          payload: {
            edgeId: edge.id,
            newEdgeId: link.id,
          },
        });
        dispatch({
          type: ActionKind.ADD_LINKS,
          payload: [
            {
              id: link.id,
              from: isInward ? edge.to! : edge.from!,
              to: isInward ? edge.from! : edge.to!,
              type: link.type,
            },
          ],
        });
      });
      dispatch({
        type: ActionKind.UPDATE_EDGE,
        payload: {
          edgeId: edge.id,
          from: isInward ? edge.to! : edge.from!,
          to: isInward ? edge.from! : edge.to!,
          text: event.value.outwardText,
          fromPort: isInward ? `southport_${edge.to!}` : `southport_${edge.from!}`,
          toPort: isInward ? `northport_${edge.from!}` : `northport_${edge.to!}`,
        },
      });
    },
    [dispatch, invoke, state.currentEdge, edges, edgeKeys],
  );

  const toggleDrawer = useCallback(() => {
    setIsLeftDrawerOpen(!isLeftDrawerOpen);
  }, [isLeftDrawerOpen, setIsLeftDrawerOpen, setRightIsDrawerOpen, isRightDrawerOpen]);

  const hideDrawer = useCallback(() => {
    setIsLeftDrawerOpen(false);
    setRightIsDrawerOpen(false);
  }, [setIsLeftDrawerOpen, setRightIsDrawerOpen]);

  const onSearchIssue = useCallback(
    debounce(async () => {
      setIsSearchLoading(true);
      setIsSearchDirty(true);
      const text = searchFieldRef.current?.value;
      if (text && text.length >= 2) {
        const response = await requestJira(
          `/rest/api/3/issue/picker?query=${text}&currentJQL=&showSubTasks=true`,
        );
        const issues: SearchJiraIssue[] = (await response.json()).sections.find(
          (section: any) => section.id === 'cs',
        )?.issues;
        setSearchedIssues(issues);
      } else {
        setSearchedIssues([]);
      }
      setIsSearchLoading(false);
    }, 300),
    [requestJira, searchFieldRef, setIsSearchLoading, setIsSearchDirty],
  );

  const onAddDependecy = useCallback(
    async ({ name, type }: Record<string, string>) => {
      if (tempEdgeId) {
        const [fromNodeId, toNodeId] = tempEdgeId.split('_');
        const isInward = type === 'inward';
        const issueWithCreatedLink = await invoke<JiraIssue>('createIssueLink', {
          newNodeKey: activeDrag,
          linkData: {
            outwardIssue: { key: isInward ? fromNodeId : toNodeId },
            inwardIssue: { key: isInward ? toNodeId : fromNodeId },
            type: { name },
          },
        });

        const link = resolveIssueLink(
          issueWithCreatedLink.fields.issuelinks.find(
            (issueLink) => !edgeKeys.includes(issueLink.id),
          )!,
        );

        dispatch({
          type: ActionKind.CHANGE_EDGE_ID,
          payload: {
            edgeId: tempEdgeId,
            newEdgeId: link.id,
          },
        });
        dispatch({
          type: ActionKind.ADD_LINKS,
          payload: [
            {
              id: link.id,
              to: isInward ? fromNodeId : toNodeId,
              from: isInward ? toNodeId : fromNodeId,
              type: link.type,
            },
          ],
        });
      }
      setEnteredNodeId('');
      setLoading(false);
      setTempEdgeId(null);
      setRightIsDrawerOpen(false);
    },
    [activeDrag, enteredNodeId, tempEdgeId],
  );

  const onRemoveEdge = useCallback((edgeId: string) => {
    setConfirmationModalData({
      title: 'Confirm deletation',
      body: 'Are you sure you want to delete this dependecy?',
      buttons: ['delete'],
      additionalData: { edgeId },
    });
    dispatch({ type: ActionKind.SET_MODAL_OPEN, payload: true });
  }, []);

  const onRemoveNode = useCallback(
    (nodeId: string) => {
      setRemovedNodeIds([...removedNodeIds, nodeId]);
      dispatch({ type: ActionKind.REMOVE_NODE, payload: nodeId });
    },
    [removedNodeIds],
  );

  const onReduNode = useCallback(() => {
    const newRemovedNodeIds = [...removedNodeIds];
    const nodeId = newRemovedNodeIds.pop()!;
    setRemovedNodeIds(newRemovedNodeIds);
    dispatch({ type: ActionKind.REDU_NODE, payload: nodeId });
    clearSelections();
  }, [removedNodeIds]);

  const onAddNode = useCallback(
    async (issue: SearchJiraIssue) => {
      //add skeleton node
      dispatch({
        type: ActionKind.ADD_NODE,
        payload: createNodeData(issue.key, state.context?.siteUrl + issue.img, {
          title: issue.summary,
          depth: -1,
          temp: true,
        }),
      });
      invoke<JiraIssue>('getIssueById', {
        id: issue.key,
        fields: 'issuetype,status,summary,issuelinks',
      }).then((loadedIssue) => {
        const links = loadedIssue.fields.issuelinks.map((item) => resolveIssueLink(item));
        dispatch({
          type: ActionKind.ADD_ISSUES,
          payload: [
            ...links.map((item) => convertLinkTransferToIssueTransfer(item, -1, false, true)),
            { ...loadedIssue, depth: -1, hidden: false, addedByUser: true },
          ],
        });
        dispatch({
          type: ActionKind.ADD_LINKS,
          payload: {
            links: convertMultiplieLinkTransferToEdgeTransfer(links, issue.key),
            addedByUser: true,
          },
        });
        canvasRef.current!.fitCanvas?.();
      });
    },
    [dispatch, invoke, nodeKeys, edgeKeys, canvasRef],
  );

  const onAddEdge = useCallback(
    (fromNodeId: string) => {
      const toNodeId = enteredNodeId as string;
      setActiveDrag(fromNodeId);
      const id = `${fromNodeId}_${toNodeId}`;
      dispatch({
        type: ActionKind.ADD_EDGE,
        payload: {
          id,
          text: 'undefined',
          from: fromNodeId,
          to: toNodeId,
          fromPort: `southport_${fromNodeId}`,
          toPort: `northport_${toNodeId}`,
        },
      });
      setTempEdgeId(id);
      setRightIsDrawerOpen(true);
      canvasRef.current!.fitCanvas?.();
    },
    [enteredNodeId, activeDrag, canvasRef],
  );

  const onDepthIncrease = useCallback(() => {
    setLoading(true);
    if (depth < 5) {
      setDepth(depth + 1);
    }
    getIssues(depth + 1);
    dispatch({ type: ActionKind.SET_DEPTH, payload: depth + 1 });
  }, [depth, setDepth]);

  const onDepthDecrease = useCallback(() => {
    setLoading(true);
    if (depth > 1) {
      setDepth(depth - 1);
    }
    dispatch({ type: ActionKind.REMOVE_USER_ADDED, payload: null });
    dispatch({ type: ActionKind.SET_DEPTH, payload: depth - 1 });
    setLoading(false);
  }, [depth, setDepth]);

  const getIssues = useCallback(
    (depth: number) => {
      const issueKeysInDepth: string[] = issues
        .filter((issue) => issue.depth === depth - 1)
        .map((issue) => issue.key);
      const issueKeysToQuery: string[] = [];
      const previouslyLoadedIssues: IssueTransfer[] = [];

      for (const issueKey of issueKeysInDepth) {
        const issue = issues.find((issue) => issue.key === issueKey)!;
        if (issue.isPartial) {
          issueKeysToQuery.push(issueKey);
        } else {
          previouslyLoadedIssues.push(issue);
        }
      }
      if (!issueKeysToQuery.length) {
        dispatch({ type: ActionKind.CALC_DEPTHS, payload: null });
        setLoading(false);
        if (!issueKeysInDepth.length) {
          setMaxDepth(depth - 1);
          setDepth(depth - 1);
          const newFlags = flags.slice();
          newFlags.splice(0, 0, {
            id: flags.length + 1,
            title: 'No more issues found',
            description: 'No more dependency found in that graph',
            type: 'timed',
            appearance: 'warning',
          });
          setFlags(newFlags);
        }
        return;
      }

      invoke<JiraIssue[]>('getIssuesByKeys', {
        issueKeys: issueKeysToQuery,
        fields: 'issuetype,status,summary,issuelinks',
      }).then((issues) => {
        for (const issue of issues) {
          const links = issue.fields.issuelinks.map((item) => resolveIssueLink(item));
          dispatch({
            type: ActionKind.ADD_ISSUES,
            payload: [
              ...links.map((item) => convertLinkTransferToIssueTransfer(item, -1)),
              { ...issue, depth: -1, hidden: false },
            ],
          });
          dispatch({
            type: ActionKind.ADD_LINKS,
            payload: convertMultiplieLinkTransferToEdgeTransfer(links, issue.key),
          });
        }
        canvasRef.current!.fitCanvas?.();
        setLoading(false);
      });
    },
    [nodes, nodeKeys, edgeKeys, issues, depth],
  );

  const handleFlagDismiss = () => {
    setFlags(flags.slice(1));
  };

  useEffect(() => {
    canvasRef.current!.fitCanvas?.();
  }, [state, canvasRef]);

  return (
    <div ref={reaflowWindow} className={classNames(css.parent)}>
      <TransformWrapper
        wheel={{ step: 0.2 }}
        maxScale={4}
        minScale={0.5}
        limitToBounds={true}
        disabled={!isPannable}
      >
        {({ resetTransform, centerView }) => (
          <>
            <Blanket
              onBlanketClicked={hideDrawer}
              isTinted={isLeftDrawerOpen || loading || isRightDrawerOpen}
              shouldAllowClickThrough={!isLeftDrawerOpen && !isRightDrawerOpen}
            >
              {loading && <Spinner size={'xlarge'} />}
            </Blanket>
            {confirmationModalData && <ConfirmationModal {...confirmationModalData} />}
            <FlagGroup onDismissed={handleFlagDismiss}>
              {flags.map((flag) => {
                if (flag.type === 'timed') {
                  return (
                    <AutoDismissFlag
                      icon={<ErrorIcon label="Warning" />}
                      id={flag.id}
                      title={flag.title}
                      description={flag.description}
                      appearance={flag.appearance}
                    />
                  );
                }
                return (
                  <Flag
                    icon={<AddIcon label="Info" />}
                    id={flag.id}
                    title={flag.title}
                    description={flag.description}
                  />
                );
              })}
            </FlagGroup>
            <div
              className={classNames(css.drawer, css.drawerRight)}
              style={{ width: isRightDrawerOpen ? '250px' : 0, transitionDuration: '0.5s' }}
            >
              <div className={css.drawerHeader}>
                <h2>Dependecy type</h2>
                <Button
                  iconBefore={<ArrowRightIcon label="" size="medium" />}
                  appearance="subtle"
                />
              </div>
              <TextField
                id="select-dependency-type"
                placeholder="Select a dependecy type..."
                onChange={(event) => {
                  setSearchText(event.currentTarget.value);
                }}
                autoComplete="off"
                elemAfterInput={isSearchLoading && <Spinner size={'medium'} />}
              />
              <div className={css.searchResult}>
                {issueLinkTypes?.map((group: any, index: number) => {
                  return (
                    <>
                      <ButtonItem key={index} isDisabled={true}>
                        {group.label}
                      </ButtonItem>
                      {group.options
                        .filter((option: any) => option.label.includes(searchText))
                        .map((issueLinkType: any, index: number) => {
                          return (
                            <ButtonItem
                              key={index}
                              onClick={() => onAddDependecy(issueLinkType.value)}
                            >
                              {issueLinkType.label}
                            </ButtonItem>
                          );
                        })}
                    </>
                  );
                })}
              </div>
            </div>
            <div
              className={css.drawer}
              style={{ width: isLeftDrawerOpen ? '250px' : 0, transitionDuration: '0.5s' }}
            >
              <div className={css.drawerHeader}>
                <Button
                  iconBefore={<ArrowLeftIcon label="" size="medium" />}
                  onClick={toggleDrawer}
                  appearance="subtle"
                />
                <h2>Add issue</h2>
              </div>
              <TextField
                ref={searchFieldRef}
                id="add-issue-field"
                placeholder="Search for an issue..."
                onChange={() => {
                  setIsSearchLoading(true);
                  onSearchIssue();
                }}
                autoComplete="off"
                elemAfterInput={isSearchLoading && <Spinner size={'medium'} />}
              />
              <div className={css.searchResult}>
                {!!searchedIssues.length &&
                  searchedIssues?.map((issue) => (
                    <ButtonItem
                      isDisabled={state.nodes.map((node) => node.id).includes(issue.key)}
                      css={{ cursor: '' }}
                      onClick={() => {
                        onAddNode(issue);
                      }}
                    >
                      <b>{issue.key}</b>: {issue.summaryText}
                    </ButtonItem>
                  ))}
                {!isSearchLoading && isSearchDirty && !searchedIssues.length && (
                  <h6>No issues found</h6>
                )}
                {!isSearchLoading && !isSearchDirty && <h6>Type for search</h6>}
              </div>
            </div>
            <div className={classNames(css.rightControls)}>
              <Button
                className={classNames(css.rightControlButton)}
                iconBefore={<VidFullScreenOnIcon label="" size="medium" />}
                onClick={toggleFullscreen}
              />
              <Button
                className={classNames(css.rightControlButton)}
                iconBefore={<RefreshIcon label="" size="medium" />}
              />
              <Button
                className={classNames(css.rightControlButton)}
                iconBefore={
                  isPannable ? (
                    <UnlockIcon label="" size="medium" />
                  ) : (
                    <LockIcon label="" size="medium" />
                  )
                }
                onClick={() => {
                  setIsPannable(!isPannable);
                  centerView();
                  resetTransform();
                }}
              />
              <div
                className={classNames({
                  'display-none': !removedNodeIds.length,
                })}
              >
                <Button
                  className={classNames(css.rightControlButton)}
                  iconBefore={<UndoIcon label="" size="medium" />}
                  onClick={onReduNode}
                />
              </div>
            </div>
            <div className={classNames(css.leftControls)}>
              <Button
                className={classNames(css.leftControlButton)}
                iconBefore={<AddIcon label="" size="medium" />}
                onClick={toggleDrawer}
                isDisabled={isPannable}
              >
                Add Issue
              </Button>
              <Button
                className={classNames(css.leftControlButton)}
                iconBefore={<EditorHorizontalRuleIcon label="" size="medium" />}
                onClick={onDepthDecrease}
                isDisabled={isPannable || depth === 1}
              />
              <div className={classNames(css.leftControlButton, css.depth)}>Depth: {depth}</div>
              <Button
                className={classNames(css.leftControlButton)}
                iconBefore={<AddIcon label="" size="medium" />}
                onClick={onDepthIncrease}
                isDisabled={isPannable || depth === maxDepth}
              />
            </div>
            <TransformComponent>
              <Canvas
                defaultPosition={CanvasPosition.CENTER}
                ref={canvasRef}
                maxHeight={state.isFullscreen ? 1100 : 700}
                maxWidth={state.isFullscreen ? 2000 : 1000}
                fit={true}
                nodes={nodes}
                edges={edges}
                zoomable={true}
                selections={selections}
                onCanvasClick={() => {
                  clearSelections();
                }}
                edge={(edge: EdgeProps) => (
                  <Edge
                    {...edge}
                    remove={<Remove hidden={true} />}
                    label={<Label className={classNames('display-none')} />}
                    style={{
                      stroke: selections.includes(edge.id) ? 'purple' : null,
                    }}
                    onClick={onEdgeClick}
                  >
                    {({ edge, center }) => {
                      return (
                        <foreignObject
                          className={classNames(css.edgeForeignObject)}
                          width={100}
                          height={100}
                          x={center ? center.x - 50 : 0}
                          y={center ? center.y - 50 : 0}
                          onClick={(event: MouseEvent) => onEdgeClick(event as MouseEvent, edge)}
                        >
                          <div className={classNames(css.edgeButtons)} id={edge.id}>
                            <div
                              className={classNames({
                                'display-none': !selections.includes(edge.id),
                              })}
                            >
                              <PopupSelect
                                options={issueLinkTypes}
                                maxMenuHeight={200}
                                minMenuHeight={200}
                                popperProps={{
                                  placement: 'auto',
                                }}
                                placeholder={`${edge.from} ${edge.text} ${edge.to}`}
                                onChange={(event) => onEdgeTypeChange(event, edge)}
                                target={({ ref }) => (
                                  <Button
                                    ref={ref}
                                    appearance="primary"
                                    iconBefore={<EditIcon label="" size="medium" />}
                                  />
                                )}
                              />
                            </div>
                            <div className={cx({ transparentText: edge.text === 'undefined' })}>
                              {edge.text}
                              {edge.text === 'undefined' && (
                                <div
                                  className={css.skeleton}
                                  style={{ width: 50, height: 12, position: 'absolute' }}
                                />
                              )}
                            </div>
                            <div
                              className={classNames({
                                'display-none': !selections.includes(edge.id),
                              })}
                            >
                              <Button
                                appearance="danger"
                                iconBefore={<TrashIcon label="" size="medium" />}
                                onClick={() => onRemoveEdge(edge.id)}
                              />
                            </div>
                          </div>
                        </foreignObject>
                      );
                    }}
                  </Edge>
                )}
                node={(node: NodeProps) => (
                  <Node
                    {...node}
                    onClick={onNodeClick}
                    className={css.node}
                    remove={<Remove hidden={true} />}
                    port={
                      <Port
                        onDragEnd={(_event, _initial, data) => {
                          setActiveDrag(data.id.split('_')[1]);
                          onAddEdge(data.id.split('_')[1]);
                        }}
                        onEnter={() => setEnteredNodeId(node.id)}
                        onLeave={() => setEnteredNodeId('')}
                        className={css.port}
                        rx={10}
                        ry={10}
                      />
                    }
                  >
                    {(nodeProps) => {
                      return (
                        <foreignObject
                          width={nodeProps.width}
                          height={nodeProps.height}
                          onClick={(event) => onNodeClick(event, nodeProps.node)}
                          className={cx({
                            nodeForeignObject: true,
                            nodeHover: enteredNodeId === nodeProps.node.id,
                            nodeSelected: selections.includes(nodeProps.node.id),
                            defaultNodeBackground: nodeProps.node.data?.depth === 0,
                          })}
                          onMouseEnter={() => {
                            setEnteredNodeId(nodeProps.node.id);
                          }}
                          onMouseLeave={() => {
                            setEnteredNodeId('');
                          }}
                          style={{
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            className={classNames(css.nodeButtons, {
                              'display-none': !selections.includes(nodeProps.node.id),
                            })}
                          >
                            <Button
                              appearance="primary"
                              iconBefore={<LinkIcon label="" size="medium" />}
                              style={{ display: 'absolute' }}
                              onClick={() => router.open(`/browse/${node.id}`)}
                            />
                            <Button
                              appearance="danger"
                              iconBefore={<CrossIcon label="" size="medium" />}
                              style={{ display: 'absolute' }}
                              onClick={() => onRemoveNode(node.id)}
                            />
                          </div>
                          <div>
                            <div className={classNames(css.nodeInner)}>
                              <img
                                src={nodeProps.node.icon?.url}
                                height={nodeProps.node.icon?.height}
                                width={nodeProps.node.icon?.width}
                                className={classNames(css.issueTypeIcon)}
                              ></img>
                              <div className={classNames(css.nodeId)}>
                                {nodeProps.node.data.issueType}
                              </div>
                              <div className={classNames(css.nodeStatus)}>
                                {nodeProps.node.data.status ? (
                                  <>
                                    {nodeProps.node.data.status === 'To Do' && (
                                      <Lozenge>To Do</Lozenge>
                                    )}
                                    {nodeProps.node.data.status === 'In Progress' && (
                                      <Lozenge appearance="inprogress">In Progress</Lozenge>
                                    )}
                                    {nodeProps.node.data.status === 'Done' && (
                                      <Lozenge appearance="success">Done</Lozenge>
                                    )}
                                  </>
                                ) : (
                                  <div className={css.skeleton} style={{ width: 50, height: 10 }} />
                                )}
                              </div>
                            </div>
                            <div className={classNames(css.nodeTitle)}>{nodeProps.node.id}</div>
                          </div>
                        </foreignObject>
                      );
                    }}
                  </Node>
                )}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

export default ReaflowWindow;
