import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { IconMinus, IconPlus, IconRefresh, IconAlertTriangle } from '@douyinfe/semi-icons';
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
}> = React.memo((props) => {
    // 状态管理
    const [flowConfig, setFlowConfig] = useState<FlowConfig | undefined>(undefined);
    const [currentState, setCurrentState] = useState(dashboard.state);
    const [zoom, setZoom] = useState(1);

    // Refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const handleFlowNodeDataRef = useRef(props.handleFlowNodeData);

    // 同步外部传入的数据处理函数
    useEffect(() => {
        handleFlowNodeDataRef.current = props.handleFlowNodeData;
    }, [props.handleFlowNodeData]);

    const isConfigMode = useMemo(() => currentState === DashboardState.Config || currentState === DashboardState.Create, [currentState]);

    // 间距配置
    const parentGapX = flowConfig?.parentGapX ?? 60;
    const childGapY = flowConfig?.childGapY ?? 30;

    // 🆕 核心修复：计算是否配置了状态栏，用于传递给连线组件计算锚点高度
    const hasStatus = !!flowConfig?.statusId;

    const handleFlowConfig = useCallback((newData: FlowConfig) => {
        setFlowConfig(newData);
    }, []);

    // 视图模式下的数据刷新逻辑
    const refreshInViewLike = useCallback(async () => {
        const stateNow = dashboard.state;
        if (!(stateNow === DashboardState.View || stateNow === DashboardState.FullScreen)) return;
        try {
            await dashboard.getData();
            const cfg = await dashboard.getConfig();
            const savedFlowConfig = (cfg?.customConfig as any)?.config;
            if (!isValidFlowConfig(savedFlowConfig)) {
                handleFlowNodeDataRef.current([]);
                return;
            }
            setFlowConfig(savedFlowConfig);
            const newFlowData = await getFlowDate(savedFlowConfig);
            handleFlowNodeDataRef.current(Array.isArray(newFlowData) ? newFlowData : []);
        } catch (e) {
            handleFlowNodeDataRef.current([]);
        }
    }, []);

    // 初始化与事件监听
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
                } catch (e) {
                    // 忽略配置获取失败
                }
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

    // 通知宿主渲染完成
    useEffect(() => { void dashboard.setRendered(); }, [props.flowNodeData]);

    // 缩放控制
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomReset = () => setZoom(1);

    return (
        <main className={classnames({ main: true, 'main-config': isConfigMode })} style={{ backgroundColor: TOKEN.colorBgPage }}>

            {/* 🆕 画布容器：包含滚动区域和缩放控件 */}
            <div className="canvas-container">

                {/* 滚动区域 */}
                <div
                    ref={containerRef}
                    className="flow-chart"
                >
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
                            padding: '40px' // 这里的 padding 保证缩放时内容不贴边
                        }}
                    >
                        {/* 🆕 连线组件：传入 hasStatus 以修正锚点高度 */}
                        <FlowConnectors
                            wrapperRef={wrapperRef}
                            flowNodeData={props.flowNodeData}
                            zoom={zoom}
                            hasStatus={hasStatus}
                        />

                        {props.flowNodeData && props.flowNodeData.length > 0 ? (
                            props.flowNodeData.map((item) => {
                                const statusStyle = getStatusStyle(item.status);
                                // 逾期判断
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
                                                border: `1px solid ${isOverdue ? TOKEN.colorRed : TOKEN.colorBorder}`,
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
                                            {/* 状态顶栏 (仅当配置了状态字段时显示) */}
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
                                                <div className="title" style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: TOKEN.colorTextTitle,
                                                    marginBottom: flowConfig?.targetDataId ? '10px' : '0',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <a target="_blank" rel="noopener noreferrer" href={`https://applink.feishu.cn/client/todo/detail?guid=${item.recordID}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                        {item.title}
                                                    </a>
                                                </div>

                                                {/* 日期栏 (仅当配置了计划日期时显示) */}
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
                                                                border: `1px solid ${isChildOverdue ? TOKEN.colorRed : TOKEN.colorBorder}`,
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
                                                                if (!isChildOverdue) e.currentTarget.style.borderColor = TOKEN.colors.blue.border;
                                                                e.currentTarget.style.boxShadow = TOKEN.shadowCardHover;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!isChildOverdue) e.currentTarget.style.borderColor = TOKEN.colorBorder;
                                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                                                            }}
                                                        >
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
                                                                    marginBottom: hasFooter ? '4px' : '0'
                                                                }}
                                                            >
                                                                {isChildOverdue && <IconAlertTriangle style={{ color: TOKEN.colorRed, fontSize: 12, marginRight: 4, verticalAlign: '-1px' }} />}
                                                                {child.title}
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

                {/* 🆕 缩放控件：绝对定位在左下角 */}
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
