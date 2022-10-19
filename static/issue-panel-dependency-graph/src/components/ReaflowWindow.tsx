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
import Select, { PopupSelect } from '@atlaskit/select';
import AddIcon from '@atlaskit/icon/glyph/add';
import Blanket from '@atlaskit/blanket';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import TextField from '@atlaskit/textfield';
import { ButtonItem } from '@atlaskit/menu';
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import Spinner from '@atlaskit/spinner';
import debounce from 'lodash.debounce';
import { motion, useDragControls } from 'framer-motion';

const cx = bind.bind(css);

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
  const [depth, setDepth] = useState<number>(1);

  const dragControls = useDragControls();
  const [enteredNodeId, setEnteredNodeId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [tempEdgeId, setTempEdgeId] = useState<string | null>(null);
  const [droppable, setDroppable] = useState<boolean>(false);
  const { state, dispatch } = useContext(Context);
  const { nodes, edges, loadedDepth, nodeKeys, edgeKeys } = state;
  console.log(nodeKeys);

  const reaflowWindow = useRef(null);
  const canvasRef = useRef<CanvasRef | null>(null);
  const searchFieldRef = useRef<HTMLInputElement | null>(null);

  const { selections, onCanvasClick, onClick } = useSelection({
    nodes,
    edges,
    selections: [],
  });

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
    const elem = document.body;
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
          fromPort: isInward ? `southport_${edge.to}` : `southport_${edge.from}`,
          toPort: isInward ? `northport_${edge.from}` : `northport_${edge.to}`,
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
      if (tempEdgeId) {
        const [fromNodeId, toNodeId] = tempEdgeId.split('_');
        const isInward = type === 'inward';
        const createdLink: any = await invoke('createIssueLink', {
          newNodeKey: activeDrag,
          linkData: {
            outwardIssue: { key: isInward ? fromNodeId : toNodeId },
            inwardIssue: { key: isInward ? toNodeId : fromNodeId },
            type: { name },
          },
        });

        const edgesByEndpoints = edges.map((edge) => `${edge.from}_${edge.to}`);
        console.log(edgesByEndpoints);
        console.log(createdLink);

        const link = createdLink.fields.issuelinks.find(
          (issueLink: any) => !edgeKeys.includes(issueLink.id),
        );
        const newEdgeId = link.id;

        dispatch({
          type: ActionKind.CHANGE_EDGE_ID,
          payload: {
            edgeId: tempEdgeId,
            newEdgeId,
          },
        });
        const toNode = nodes.find((node) => node.id === toNodeId);
        if (toNode) {
          console.log(fromNodeId, toNode);
          setTimeout(() => {
            dispatch({
              type: ActionKind.UPDATE_NODE_DATA,
              payload: { nodeId: fromNodeId, data: { depth: toNode.data.depth + 1 } },
            });
          }, 1000);
        }
        dispatch({
          type: ActionKind.UPDATE_EDGE,
          payload: {
            edgeId: newEdgeId,
            text: link.type.outward,
            to: isInward ? fromNodeId : toNodeId,
            from: isInward ? toNodeId : fromNodeId,
            toPort: `northport_${isInward ? fromNodeId : toNodeId}`,
            fromPort: `southport_${isInward ? toNodeId : fromNodeId}`,
            data: {
              id: link.id,
              text: link.type.outward,
            },
          },
        });
      }
      setEnteredNodeId(null);
      setLoading(false);
      setTempEdgeId(null);
    },
    [activeDrag, enteredNodeId, tempEdgeId],
  );

  const onAddNode = useCallback(
    async (issue: any) => {
      //add skeleton node
      dispatch({
        type: ActionKind.ADD_NODE,
        payload: createNodeData(issue.key, state.context?.siteUrl + issue.img, {
          title: issue.summary,
          depth: 0,
        }),
      });
      invoke('getIssueById', {
        id: issue.key,
        fields: 'issuetype,status,summary,issuelinks',
      }).then((loadedIssue: any) => {
        for (const issueLink of loadedIssue.fields.issuelinks) {
          if (!edgeKeys.includes(issueLink.id)) {
            const resolvedIssueLink = resolveIssueLink(issueLink);
            const fromNode =
              resolvedIssueLink.linkType === 'outward' ? resolvedIssueLink.issue.key : issue.key;
            const toNode =
              resolvedIssueLink.linkType === 'outward' ? issue.key : resolvedIssueLink.issue.key;

            if (nodeKeys.includes(resolvedIssueLink.issue.key)) {
              dispatch({
                type: ActionKind.ADD_EDGE,
                payload: {
                  id: resolvedIssueLink.id,
                  text: resolvedIssueLink.type.outward,
                  from: fromNode,
                  to: toNode,
                  fromPort: `southport_${fromNode}`,
                  toPort: `northport_${toNode}`,
                },
              });
            }
          }
        }
        dispatch({
          type: ActionKind.UPDATE_NODE_DATA,
          payload: {
            nodeId: loadedIssue.key,
            data: {
              status: loadedIssue.fields.status.name,
              issueType: loadedIssue.fields.issuetype.name,
              title: loadedIssue.fields.summary,
              depth: 0,
            },
          },
        });
      });
    },
    [dispatch, invoke, nodeKeys, edgeKeys],
  );

  const onAddEdge = useCallback(
    (fromNodeId: string) => {
      const toNodeId = enteredNodeId;
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
      // dispatch({
      //   type: ActionKind.UPDATE_NODE_DATA,
      //   payload: {
      //     nodeId: fromNode,
      //     data: {
      //       depth: 2,
      //     },
      //   },
      // });
      setTempEdgeId(id);
      setRightIsDrawerOpen(true);
      console.log(activeDrag);
    },
    [enteredNodeId, activeDrag],
  );

  const onDepthChange = useCallback(
    (newDepth: number) => {
      setLoading(true);
      setDepth(newDepth);
      if (newDepth === 2) {
        if (loadedDepth >= 2) {
          console.log('cache');
        } else {
          dispatch({ type: ActionKind.SET_DEPTH, payload: 2 });
          getIssues(2);
        }
      } else if (newDepth === 3) {
        console.log('asd');
      }
    },
    [nodes, loadedDepth],
  );

  const getIssues = useCallback(
    (depth: number) => {
      invoke('getIssuesByKeys', {
        issueKeys: nodes.filter((node) => node.data.depth === depth - 1).map((node) => node.id),
        fields: 'issuetype,status,summary,issuelinks',
      }).then((issues: any) => {
        for (const item of issues) {
          for (const issueLink of item.fields.issuelinks) {
            const linkedIssue = issueLink.inwardIssue
              ? issueLink.inwardIssue
              : issueLink.outwardIssue;
            const linkType = issueLink.inwardIssue ? 'inward' : 'outward';
            const fromNode = linkType === 'outward' ? item.key : linkedIssue.key;
            const toNode = linkType === 'outward' ? linkedIssue.key : item.key;
            if (!nodeKeys.includes(linkedIssue.key)) {
              dispatch({
                type: ActionKind.ADD_NODE,
                payload: createNodeData(linkedIssue.key, linkedIssue.fields.issuetype.iconUrl, {
                  status: linkedIssue.fields.status.name,
                  issueType: linkedIssue.fields.issuetype.name,
                  title: linkedIssue.fields.summary,
                  depth,
                }),
              });
              dispatch({
                type: ActionKind.ADD_EDGE,
                payload: {
                  id: issueLink.id,
                  text: issueLink.type.outward,
                  from: fromNode,
                  to: toNode,
                  fromPort: `southport_${fromNode}`,
                  toPort: `northport_${toNode}`,
                },
              });
            } else {
              if (!edgeKeys.includes(issueLink.id)) {
                dispatch({
                  type: ActionKind.ADD_EDGE,
                  payload: {
                    id: issueLink.id,
                    text: issueLink.type.outward,
                    from: fromNode,
                    to: toNode,
                    fromPort: `southport_${fromNode}`,
                    toPort: `northport_${toNode}`,
                  },
                });
              }
            }
          }
        }
        setLoading(false);
      });
    },
    [nodes, nodeKeys, edgeKeys],
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
                isDisabled={isPannable}
              >
                Add Issue
              </Button>
              <div className={css.leftControlButton}>
                <PopupSelect
                  options={[
                    { label: 'Depth 1', value: 1 },
                    { label: 'Depth 2', value: 2 },
                    { label: 'Depth 3', value: 3 },
                  ]}
                  onChange={(value: { value: number; label: string } | null) =>
                    onDepthChange(value!.value)
                  }
                  maxMenuHeight={200}
                  minMenuHeight={200}
                  popperProps={{
                    placement: 'auto',
                  }}
                  target={({ ref }) => (
                    <Button ref={ref} iconAfter={<ChevronDownIcon label="" size="medium" />}>
                      Depth: {depth}
                    </Button>
                  )}
                />
                <PopupSelect
                  className={css.depthSelect}
                  onChange={(value) => console.log(value?.value)}
                  placeholder="Depth"
                />
              </div>
            </div>
            <TransformComponent>
              <Canvas
                defaultPosition={state.isFullscreen ? CanvasPosition.TOP : CanvasPosition.CENTER}
                ref={canvasRef}
                onLayoutChange={() => {
                  canvasRef.current!.fitCanvas?.();
                  console.log('layout change');
                }}
                // height={state.isFullscreen ? undefined : 400}
                maxHeight={state.isFullscreen ? undefined : 700}
                maxWidth={state.isFullscreen ? undefined : 1000}
                fit={true}
                nodes={nodes.filter((node) => node.data.depth <= depth)}
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
                    className={classNames(css.node)}
                    // onClick={(_event, node) => {
                    //   router.open(`/browse/${node.id}`);
                    // }}
                    port={
                      <Port
                        onDragEnd={(_event, _initial, data) => {
                          setActiveDrag(data.id.split('_')[1]);
                          onAddEdge(data.id.split('_')[1]);
                        }}
                        onEnter={() => setEnteredNodeId(node.id)}
                        onLeave={() => setEnteredNodeId(null)}
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
                          // onClick={() => {
                          //   router.open(`/browse/${node.id}`);
                          // }}
                          className={cx({ isNodeHover: enteredNodeId === event.node.id })}
                          onMouseEnter={() => {
                            setEnteredNodeId(event.node.id);
                          }}
                          onMouseLeave={() => {
                            setEnteredNodeId(null);
                          }}
                          onMouseUp={() => {
                            console.log('kecske mecske minden rendebn');
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
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

const createNodeData = (id: string, iconUrl: string, data: Record<string, any>): NodeData => {
  return {
    id,
    icon: {
      url: iconUrl,
      width: 25,
      height: 25,
    },
    data,
    ports: [
      {
        id: `northport_${id}`,
        width: 10,
        height: 10,
        side: 'NORTH',
      },
      {
        id: `southport_${id}`,
        width: 10,
        height: 10,
        side: 'SOUTH',
      },
    ],
    width: 170,
  };
};

const resolveIssueLink = (issueLink: any) => {
  return {
    id: issueLink.id,
    self: issueLink.self,
    issue: issueLink.inwardIssue ? issueLink.inwardIssue : issueLink.outwardIssue,
    type: issueLink.type,
    linkType: issueLink.inwardIssue ? 'inward' : 'outward',
  };
};

// const getNodesAndEdges = (issues: any) => {
//   const kecske mecske minden rendben csak el kell
// }
export default ReaflowWindow;
