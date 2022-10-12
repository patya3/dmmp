import { invoke, requestJira, router } from '@forge/bridge';
import {
  Canvas,
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
import Select, { PopupSelect } from '@atlaskit/select';
import AddIcon from '@atlaskit/icon/glyph/add';
import Blanket from '@atlaskit/blanket';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import TextField from '@atlaskit/textfield';
import { ButtonItem, SkeletonHeadingItem, SkeletonItem } from '@atlaskit/menu';
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';
import Spinner from '@atlaskit/spinner';
import debounce from 'lodash.debounce';
import { motion, useDragControls } from 'framer-motion';
import { Portal } from 'rdk';

(window as any).g = null;
(window as any).i = null;

function ReaflowWindow() {
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState<boolean>(true);
  const [isPannable, setIsPannable] = useState<boolean>(false);
  const [issueLinkTypes, setIssueLinkTypes] = useState<Record<string, any>[]>([]);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(false);
  const [isRightDrawerOpen, setRightIsDrawerOpen] = useState<boolean>(false);
  const [searchedIssues, setSearchedIssues] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isSearchDirty, setIsSearchDirty] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  const dragControls = useDragControls();
  const [enteredNode, setEnteredNode] = useState<NodeData | null>(null);
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [droppable, setDroppable] = useState<boolean>(false);
  const { state, dispatch } = useContext(Context);
  const { nodes, edges } = state;

  const reaflowWindow = useRef(null);
  const canvasRef = useRef<CanvasRef | null>(null);
  const searchFieldRef = useRef<HTMLInputElement | null>(null);

  const { selections, onCanvasClick, onClick } = useSelection({
    nodes,
    edges,
    selections: [],
  });

  const onDragStart = useCallback(
    async (event: MouseEvent, data: any) => {
      setActiveDrag(data.key);
      dragControls.start(event, { snapToCursor: true });
      setIsLeftDrawerOpen(false);
    },
    [setActiveDrag, setIsLeftDrawerOpen, dragControls],
  );

  const onDragEnd = async () => {
    setLoading(true);
    if (droppable && activeDrag) {
      const issue: any = await invoke('getIssueById', {
        id: activeDrag,
        fields: 'issuetype,status,summary,issuelinks',
      });
      dispatch({
        type: ActionKind.ADD_NODE,
        payload: {
          id: issue.key,
          icon: {
            url: issue.fields.issuetype.iconUrl,
            width: 25,
            height: 25,
          },
          data: {
            status: issue.fields.status.name,
            issueType: issue.fields.issuetype.name,
            title: issue.fields.summary,
          },
          width: 170,
        },
      });
      //   linkData: {
      //     outwardIssue: { key: isInward ? edge.from : edge.to },
      //     inwardIssue: { key: isInward ? edge.to : edge.from },
      //     type: { name: event.value.name },
      //   },
      // const issueLink = await invoke('createIssueLink', {
      //   newNodeKey: issue.key,
      //   linkData: {
      //     outwardIssue: { key: isInward ? edge.from : edge.to },
      //     inwardIssue: { key: isInward ? edge.to : edge.from },
      //     type: { name: event.value.name },
      //   },
      // });
      // dispatch({
      //   type: ActionKind.ADD_EDGE,
      //   payload: {
      //     id: item.linkData.id,
      //     text: item.linkData.type.outward,
      //     from: item.linkData.from,
      //     to: item.linkData.to,
      //     data: {
      //       id: item.id,
      //       text: item.linkData.type.outward,
      //     },
      //   },
      // });
    }
    setDroppable(false);
    setLoading(false);
    setRightIsDrawerOpen(true);
  };

  useEffect(() => {
    invoke('getIssueLinkTypes').then((res: any) => {
      const inwardTypes = { label: 'Inward', options: [] as any[] };
      const outwardTypes = { label: 'Outward', options: [] as any[] };
      for (const type of res.issueLinkTypes) {
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
    });
  }, [invoke, setIssueLinkTypes]);

  const toggleFullscreen = useCallback(() => {
    const elem = reaflowWindow.current! as HTMLElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }

    if (state.isFullscreen && document.exitFullscreen) {
      document.exitFullscreen();
    }

    dispatch({ type: ActionKind.TOGGLE_FULLSCREN, payload: !state.isFullscreen });
  }, [state.isFullscreen, dispatch]);

  const onEdgeClick = useCallback(
    (event: MouseEvent, edge: EdgeData) => {
      dispatch({ type: ActionKind.SET_CURRENT_EDGE, payload: edge });
      onClick?.(event as any, edge);
      setIsHidden(false);
    },
    [setIsHidden, onClick, dispatch],
  );

  const onEdgeTypeChange = useCallback(
    (event: Record<string, any> | null, edge: EdgeData) => {
      if (!event || event.label === state.currentEdge!.text) return;

      setIsHidden(true);
      const isInward = event.value.type === 'inward';
      invoke('changeIssueLinkType', {
        linkId: edge.id,
        linkData: {
          outwardIssue: { key: isInward ? edge.from : edge.to },
          inwardIssue: { key: isInward ? edge.to : edge.from },
          type: { name: event.value.name },
        },
      }).then((updatedIssue: any) => {
        dispatch({
          type: ActionKind.CHANGE_EDGE_ID,
          payload: {
            edgeId: edge.id,
            newEdgeId: updatedIssue.fields.issuelinks.find(
              (issueLink: any) => !state.edges.map((edge) => edge.id).includes(issueLink.id),
            ).id,
          },
        });
      });
      dispatch({
        type: ActionKind.UPDATE_EDGE,
        payload: {
          edgeId: edge.id,
          from: isInward ? edge.to : edge.from,
          to: isInward ? edge.from : edge.to,
          text: event.value.outwardText,
        },
      });
    },
    [dispatch, invoke, setIsHidden, state.currentEdge],
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
        const issues = (await response.json()).sections.find(
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
      setLoading(true);
      if (activeDrag && enteredNode) {
        const isInward = type === 'inward';
        const updatedIssue: any = await invoke('createIssueLink', {
          newNodeKey: activeDrag,
          linkData: {
            outwardIssue: { key: isInward ? activeDrag : enteredNode.id },
            inwardIssue: { key: isInward ? enteredNode.id : activeDrag },
            type: { name },
          },
        });
        const link = updatedIssue.fields.issuelinks.find(
          (issueLink: any) => !state.edges.map((edge) => edge.id).includes(issueLink.id),
        );
        dispatch({
          type: ActionKind.ADD_EDGE,
          payload: {
            id: link.id,
            text: link.type.outward,
            from: isInward ? enteredNode.id : activeDrag,
            to: isInward ? activeDrag : enteredNode.id,
            data: {
              id: link.id,
              text: link.type.outward,
            },
          },
        });
      }
      setActiveDrag(null);
      setEnteredNode(null);
      setLoading(false);
    },
    [activeDrag, enteredNode],
  );

  const onAddNode = useCallback(
    async (issue: any) => {
      //add skeleton node
      dispatch({
        type: ActionKind.ADD_NODE,
        payload: {
          id: issue.key,
          icon: {
            url: state.context?.siteUrl + issue.img,
            width: 25,
            height: 25,
          },
          data: {
            title: issue.summary,
          },
          ports: [
            {
              id: `northport_${issue.key}`,
              width: 10,
              height: 10,
              side: 'NORTH',
            },
            {
              id: `southport_${issue.key}`,
              width: 10,
              height: 10,
              side: 'SOUTH',
            },
          ],
          width: 170,
        },
      });
      invoke('getIssueById', {
        id: issue.key,
        fields: 'issuetype,status,summary,issuelinks',
      }).then((loadedIssue: any) => {
        dispatch({
          type: ActionKind.UPDATE_NODE_DATA,
          payload: {
            nodeId: loadedIssue.key,
            data: {
              status: loadedIssue.fields.status.name,
              issueType: loadedIssue.fields.issuetype.name,
              title: loadedIssue.fields.summary,
            },
          },
        });
      });
    },
    [dispatch, invoke],
  );

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
                  searchedIssues?.map((issue: any) => (
                    <motion.div key={issue.key} onMouseDown={(event) => onDragStart(event, issue)}>
                      <ButtonItem
                        isDisabled={state.nodes.map((node) => node.id).includes(issue.key)}
                        css={{ cursor: '' }}
                        onClick={() => onAddNode(issue)}
                      >
                        <b>{issue.key}</b>: {issue.summaryText}
                      </ButtonItem>
                    </motion.div>
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
            </div>
            <div className={classNames(css.leftControls)}>
              <Button
                className={classNames(css.leftControlButton)}
                iconBefore={<AddIcon label="" size="medium" />}
                onClick={toggleDrawer}
              >
                Add
              </Button>
            </div>
            <TransformComponent>
              <Canvas
                ref={canvasRef}
                // height={state.isFullscreen ? undefined : 400}
                maxHeight={state.isFullscreen ? undefined : 700}
                maxWidth={state.isFullscreen ? undefined : 1000}
                fit={true}
                nodes={nodes}
                edges={edges}
                zoomable={false}
                selections={selections}
                onCanvasClick={() => {
                  setIsHidden(true);
                  onCanvasClick?.();
                }}
                onMouseEnter={() => {
                  setDroppable(true);
                }}
                onMouseLeave={() => setDroppable(false)}
                edge={(edge: EdgeProps) => (
                  <Edge
                    {...edge}
                    remove={<Remove hidden={true} />}
                    label={<Label className={classNames('display-none')} />}
                    style={{
                      stroke: !isHidden && edge.id === state.currentEdge?.id ? 'purple' : null,
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
                                'display-none': isHidden || edge.id !== state.currentEdge?.id,
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
                            <div>{edge.text}</div>
                            <div
                              className={classNames({
                                'display-none': isHidden || edge.id !== state.currentEdge?.id,
                              })}
                            >
                              <Button
                                appearance="danger"
                                iconBefore={<TrashIcon label="" size="medium" />}
                                onClick={() => {
                                  invoke('deleteIssueLink', { linkId: edge.id });
                                  dispatch({ type: ActionKind.REMOVE_EDGE, payload: edge });
                                }}
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
                    className={classNames(css.node, { highlight: enteredNode?.id === node.id })}
                    // onClick={(_event, node) => {
                    //   router.open(`/browse/${node.id}`);
                    // }}
                    port={
                      <Port
                        onDragStart={() => console.log('onDragStart')}
                        onDragEnd={() => console.log(enteredNode)}
                        style={{ fill: 'blue', stroke: 'white' }}
                        rx={10}
                        ry={10}
                      />
                    }
                  >
                    {(event) => {
                      return (
                        <foreignObject
                          width={event.width}
                          height={event.height}
                          onClick={() => {
                            router.open(`/browse/${node.id}`);
                          }}
                          onMouseEnter={() => {
                            setEnteredNode(event.node);
                          }}
                          onMouseLeave={() => {
                            setEnteredNode(null);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>
                            <div className={classNames(css.nodeInner)}>
                              <img
                                src={event.node.icon?.url}
                                height={event.node.icon?.height}
                                width={event.node.icon?.width}
                                className={classNames(css.issueTypeIcon)}
                              ></img>
                              <div className={classNames(css.nodeId)}>{event.node.id}</div>
                              <div className={classNames(css.nodeStatus)}>
                                {event.node.data.status ? (
                                  event.node.data.status
                                ) : (
                                  <div className={css.skeleton} style={{ width: 50, height: 10 }} />
                                )}
                              </div>
                            </div>
                            <div className={classNames(css.nodeTitle)}>{event.node.data.title}</div>
                          </div>
                        </foreignObject>
                      );
                    }}
                  </Node>
                )}
              />
              <Portal>
                <motion.div
                  drag
                  dragControls={dragControls}
                  className={classNames(css.dragger)}
                  onDragEnd={onDragEnd}
                >
                  {activeDrag && <div className={css.dragInner}>{activeDrag}</div>}
                </motion.div>
              </Portal>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
export default ReaflowWindow;
