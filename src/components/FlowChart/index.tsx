import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { IconMinus, IconPlus, IconRefresh, IconAlertTriangle, IconLink } from '@douyinfe/semi-icons';
import classnames from 'classnames';
import { dashboard, DashboardState } from '@lark-base-open/js-sdk';

import './style.scss';
import { StatusChildMap, StatusMap } from './config';
import { FlowConfig, FlowNodeData, HandleFlowNodeData } from './types';
import { checkIsOverdue, getFlowDate, getStatusStyle, isValidFlowConfig, TOKEN } from './utils';
import FlowConnectors from './Connectors';
import ConfigPanel from './ConfigPanel';

/**
 * 主流程图组件
 */
const FlowChart: React.FC<{
    flowNodeData: FlowNodeData[];
    handleFlowNodeData: HandleFlowNodeData;
    defaultConfig?: FlowConfig;
}> = React.memo((props) => {
    // 状态初始化：优先使用传入的配置
    const [flowConfig, setFlowConfig] = useState<FlowConfig | undefined>(props.defaultConfig);
    const [currentState, setCurrentState] = useState(dashboard.state);
    const [zoom, setZoom] = useState(1);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const handleFlowNodeDataRef = useRef(props.handleFlowNodeData);

    // 监听外部配置变化
    useEffect(() => {
        if (props.defaultConfig) {
            setFlowConfig(props.defaultConfig);
        }
    }, [props.defaultConfig]);

    useEffect(() => {
        handleFlowNodeDataRef.current = props.handleFlowNodeData;
    }, [props.handleFlowNodeData]);

    const isConfigMode = useMemo(() => currentState === DashboardState.Config || currentState === DashboardState.Create, [currentState]);

    const parentGapX = flowConfig?.parentGapX ?? 60;
    const childGapY = flowConfig?.childGapY ?? 30;
    const hasStatus = !!flowConfig?.statusId;

    const handleFlowConfig = useCallback((newData: FlowConfig) => {
        setFlowConfig(newData);
    }, []);

    const refreshInViewLike = useCallback(async () => {
        const stateNow = dashboard.state;
        if (!(stateNow === DashboardState.View || stateNow === DashboardState.FullScreen)) return;
        try {
            await dashboard.getData();
            const cfg = await dashboard.getConfig();
            const savedFlowConfig = (cfg?.customConfig as any)?.config;

            if (!isValidFlowConfig(savedFlowConfig)) {
                // 如果是配置本身无效，可以清空
                handleFlowNodeDataRef.current([]);
                return;
            }

            setFlowConfig(savedFlowConfig);

            // ⚠️ 核心修改：这里如果 getFlowDate 抛错，会进入 catch，而不会执行下一行
            const newFlowData = await getFlowDate(savedFlowConfig);

            // 只有成功获取到数据才更新
            if (Array.isArray(newFlowData)) {
                handleFlowNodeDataRef.current(newFlowData);
            }
        } catch (e) {
            // ⚠️ 核心修改：捕获错误，只打印日志，绝对不要清空数据
            console.error('自动刷新数据失败，保持原有数据显示', e);
        }
    }, []);

    useEffect(() => {
        setCurrentState(dashboard.state);
        let cancelled = false;
        const init = async () => {
            const stateNow = dashboard.state;
            if (stateNow === DashboardState.Create) return;
            if (stateNow === DashboardState.Config) {
                try {
                    const res = await dashboard.getConfig();
                    const flowConfigInit = (res?.customConfig as any)?.config;
                    if (cancelled) return;
                    if (isValidFlowConfig(flowConfigInit)) {
                        setFlowConfig(flowConfigInit);
                        if (flowConfigInit.tableNameId && flowConfigInit.titleId) {
                            const flowData = await getFlowDate(flowConfigInit);
                            if (!cancelled) handleFlowNodeDataRef.current(Array.isArray(flowData) ? flowData : []);
                        }
                    }
                } catch (e) { }
                return;
            }
            if (stateNow === DashboardState.View || stateNow === DashboardState.FullScreen) {
                await refreshInViewLike();
            }
        };
        void init();

        const offDataChange = dashboard.onDataChange(async () => {
            if (cancelled) return;
            setCurrentState(dashboard.state);
            if (dashboard.state === DashboardState.View || dashboard.state === DashboardState.FullScreen) {
                await refreshInViewLike();
            }
        });
        const offConfigChange = dashboard.onConfigChange(async () => {
            if (cancelled) return;
            setCurrentState(dashboard.state);
            if (dashboard.state === DashboardState.View || dashboard.state === DashboardState.FullScreen) {
                await refreshInViewLike();
            }
        });
        return () => {
            cancelled = true;
            offDataChange?.();
            offConfigChange?.();
        };
    }, [refreshInViewLike]);

    useEffect(() => { void dashboard.setRendered(); }, [props.flowNodeData]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomReset = () => setZoom(1);

    return (
        <main className={classnames({ main: true, 'main-config': isConfigMode })} style={{ backgroundColor: TOKEN.colorBgPage }}>
            <div className="canvas-container">
                <div ref={containerRef} className="flow-chart">
                    <div
                        ref={wrapperRef}
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: '0 0',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: parentGapX,
                            width: 'fit-content',
                            minWidth: '100%',
                            minHeight: '100%',
                            position: 'relative',
                            padding: '40px'
                        }}
                    >
                        <FlowConnectors
                            wrapperRef={wrapperRef}
                            flowNodeData={props.flowNodeData}
                            zoom={zoom}
                            hasStatus={hasStatus}
                        />

                        {props.flowNodeData && props.flowNodeData.length > 0 ? (
                            props.flowNodeData.map((item) => {
                                const statusStyle = getStatusStyle(item.status);
                                const isOverdue = checkIsOverdue(
                                    item.planDate,
                                    item.finishDate,
                                    item.status,
                                    !!flowConfig?.targetDataId,
                                    !!flowConfig?.finishDataId,
                                    !!flowConfig?.statusId
                                );

                                return (
                                    <div
                                        key={`${item.recordID}-${item.status}`}
                                        className="flow-item"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            position: 'relative',
                                            zIndex: 1,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {/* --- 父节点 Card --- */}
                                        <div
                                            className="node"
                                            data-node="parent"
                                            data-id={item.recordID}
                                            style={{
                                                backgroundColor: TOKEN.colorBgCard,
                                                borderRadius: TOKEN.radius,
                                                border: `1px solid ${TOKEN.colorBorder}`,
                                                boxShadow: TOKEN.shadowCard,
                                                minWidth: '220px',
                                                maxWidth: '360px',
                                                width: 'fit-content',
                                                textAlign: 'left',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                paddingBottom: '12px'
                                            }}
                                        >
                                            {flowConfig?.statusId && (
                                                <div style={{
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.text,
                                                    padding: '8px 12px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    borderBottom: `1px solid ${statusStyle.bg}`,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span>{StatusMap[item.status as keyof typeof StatusMap]?.text || '未知状态'}</span>
                                                    {flowConfig?.ownerId && item.owners && (
                                                        <span style={{ fontWeight: 400, opacity: 0.8, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            👤 {item.owners}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ padding: '10px 12px 0 12px' }}>
                                                {/* 🆕 父节点标题区域 */}
                                                <div className="title" style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: TOKEN.colorTextTitle,
                                                    marginBottom: flowConfig?.targetDataId ? '10px' : '0',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '6px'
                                                }}>
                                                    <a target="_blank" rel="noopener noreferrer" href={`https://applink.feishu.cn/client/todo/detail?guid=${item.recordID}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}>
                                                        {item.title}
                                                    </a>

                                                    {/* 🆕 超链接图标 */}
                                                    {item.link && (
                                                        <Tooltip content="打开链接" position="top">
                                                            <a
                                                                href={item.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    color: TOKEN.primary,
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <IconLink size="small" />
                                                            </a>
                                                        </Tooltip>
                                                    )}
                                                </div>

                                                {flowConfig?.targetDataId && (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '11px',
                                                        color: TOKEN.colorTextBody,
                                                        backgroundColor: isOverdue ? TOKEN.colorRedBg : '#F9F9F9',
                                                        padding: '6px 8px',
                                                        borderRadius: '4px',
                                                        border: isOverdue ? `1px solid ${TOKEN.colorRed}` : 'none'
                                                    }}>
                                                        <div title="计划日期" style={{ display: 'flex', alignItems: 'center', color: isOverdue ? TOKEN.colorRed : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                                                            <span style={{ marginRight: 4 }}>{isOverdue ? '⚠️' : '📅'}</span>
                                                            {item.planDate || '-'}
                                                        </div>
                                                        {flowConfig?.finishDataId && (
                                                            <div title="完成日期" style={{ display: 'flex', alignItems: 'center', color: item.finishDate ? TOKEN.colors.green.text : TOKEN.colorTextLight }}>
                                                                <span style={{ marginRight: 4 }}>✅</span>
                                                                {item.finishDate || '-'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* --- 子节点容器 --- */}
                                        <div
                                            className="flow-child-container"
                                            style={{
                                                marginTop: childGapY,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 8,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {item.childNode && Array.isArray(item.childNode) && item.childNode.map((child) => {
                                                const childStatusStyle = getStatusStyle(child.status);
                                                const isChildOverdue = checkIsOverdue(
                                                    child.planDate,
                                                    child.finishDate,
                                                    child.status,
                                                    !!flowConfig?.targetDataId,
                                                    !!flowConfig?.finishDataId,
                                                    !!flowConfig?.statusId
                                                );
                                                const hasFooter = !!(flowConfig?.statusId || flowConfig?.ownerId);

                                                return (
                                                    <div key={child.recordID} className="flow-child-item">
                                                        <div
                                                            className="node-child"
                                                            data-node="child"
                                                            data-parent-id={item.recordID}
                                                            data-id={child.recordID}
                                                            style={{
                                                                backgroundColor: TOKEN.colorBgCard,
                                                                borderRadius: '6px',
                                                                border: `1px solid ${TOKEN.colorBorder}`,
                                                                padding: '8px 10px',
                                                                width: '200px',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-start',
                                                                gap: '4px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                position: 'relative',
                                                                minHeight: hasFooter ? '56px' : 'auto'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = TOKEN.colors.blue.border;
                                                                e.currentTarget.style.boxShadow = TOKEN.shadowCardHover;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = TOKEN.colorBorder;
                                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                                                            }}
                                                        >
                                                            {/* 🆕 子节点标题区域 */}
                                                            <div
                                                                className="title"
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 500,
                                                                    color: isChildOverdue ? TOKEN.colorRed : TOKEN.colorTextTitle,
                                                                    width: '100%',
                                                                    whiteSpace: 'normal',
                                                                    wordBreak: 'break-word',
                                                                    lineHeight: '1.4',
                                                                    textAlign: 'left',
                                                                    marginBottom: hasFooter ? '4px' : '0',
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                {isChildOverdue && <IconAlertTriangle style={{ color: TOKEN.colorRed, fontSize: 12, marginRight: 4, verticalAlign: '-1px', flexShrink: 0 }} />}
                                                                <span style={{ flex: 1 }}>{child.title}</span>

                                                                {/* 🆕 子节点超链接图标 */}
                                                                {child.link && (
                                                                    <a
                                                                        href={child.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            color: TOKEN.primary,
                                                                            cursor: 'pointer',
                                                                            flexShrink: 0
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <IconLink size="small" />
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {hasFooter && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    width: '100%',
                                                                    alignItems: 'center',
                                                                    marginTop: 'auto'
                                                                }}>
                                                                    {flowConfig?.statusId ? (
                                                                        <div style={{
                                                                            fontSize: '10px',
                                                                            color: childStatusStyle.text,
                                                                            backgroundColor: childStatusStyle.bg,
                                                                            padding: '1px 6px',
                                                                            borderRadius: '4px',
                                                                            fontWeight: 600,
                                                                            whiteSpace: 'nowrap'
                                                                        }}>
                                                                            {StatusChildMap[child.status as keyof typeof StatusChildMap]?.text || '进行中'}
                                                                        </div>
                                                                    ) : <div />}

                                                                    {flowConfig?.ownerId && child.owners && (
                                                                        <div style={{
                                                                            fontSize: '10px',
                                                                            color: TOKEN.colorTextLight,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            maxWidth: '90px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }} title={child.owners}>
                                                                            <span style={{ marginRight: 2 }}>👤</span>
                                                                            {child.owners}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : isConfigMode ? (
                            <div className="config-placeholder" style={{ color: TOKEN.colorTextLight }}><p>请在右侧配置面板中设置数据源以显示流程图</p></div>
                        ) : (
                            <div className="empty-placeholder" style={{ color: TOKEN.colorTextLight }}><p>暂无流程数据</p></div>
                        )}
                    </div>
                </div>

                <div className="zoom-controls">
                    <Tooltip content="放大" position="right"><Button icon={<IconPlus />} theme="borderless" type="tertiary" onClick={handleZoomIn} style={{backgroundColor: '#fff', boxShadow: TOKEN.shadowCard}} /></Tooltip>
                    <Tooltip content="重置" position="right"><Button icon={<IconRefresh />} theme="borderless" type="tertiary" onClick={handleZoomReset} style={{backgroundColor: '#fff', boxShadow: TOKEN.shadowCard}} /></Tooltip>
                    <Tooltip content="缩小" position="right"><Button icon={<IconMinus />} theme="borderless" type="tertiary" onClick={handleZoomOut} style={{backgroundColor: '#fff', boxShadow: TOKEN.shadowCard}} /></Tooltip>
                </div>
            </div>

            {isConfigMode && (
                <ConfigPanel
                    flowConfig={flowConfig}
                    handleFlowConfig={handleFlowConfig}
                    flowNodeData={props.flowNodeData}
                    handleFlowNodeData={props.handleFlowNodeData}
                />
            )}
        </main>
    );
});
FlowChart.displayName = 'FlowChart';

export default FlowChart;
