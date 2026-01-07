import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlowNodeData } from './types';
import { TOKEN } from './utils';

type ConnectorPath = { key: string; d: string };

type AnchorType = 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'right-fixed' | 'left-fixed';

/**
 * 计算相对坐标
 * @param hasStatus 是否包含状态栏（决定固定锚点的 Y 轴偏移量）
 */
function getRelativePoint(
    wrapperEl: HTMLElement,
    nodeRect: DOMRect,
    type: AnchorType,
    zoom: number,
    hasStatus: boolean // 🆕 新增参数
) {
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const xRaw = (nodeRect.left - wrapperRect.left) / zoom;
    const yRaw = (nodeRect.top - wrapperRect.top) / zoom;
    const wRaw = nodeRect.width / zoom;
    const hRaw = nodeRect.height / zoom;

    let x = 0;
    let y = 0;

    // 🛑 核心修复：根据是否有状态栏，动态计算标题行的中心位置
    // 有状态栏：Status(约32px) + Padding(10px) + HalfText(约7px) ≈ 49px (微调为 46 以视觉居中)
    // 无状态栏：Padding(10px) + HalfText(约7px) ≈ 17px (微调为 22 以视觉居中)
    const FIXED_ANCHOR_Y = hasStatus ? 46 : 22;

    switch (type) {
        case 'top-center': x = xRaw + wRaw / 2; y = yRaw; break;
        case 'bottom-center': x = xRaw + wRaw / 2; y = yRaw + hRaw; break;
        case 'left-center': x = xRaw; y = yRaw + hRaw / 2; break;
        case 'right-center': x = xRaw + wRaw; y = yRaw + hRaw / 2; break;

        // 主轴连线使用固定高度锚点
        case 'right-fixed': x = xRaw + wRaw; y = yRaw + FIXED_ANCHOR_Y; break;
        case 'left-fixed': x = xRaw; y = yRaw + FIXED_ANCHOR_Y; break;
    }
    return { x, y };
}

function makeStepPath(from: { x: number; y: number }, to: { x: number; y: number }, type: 'p2c' | 'p2p') {
    if (type === 'p2c') {
        // 父 -> 子：直角折线
        return `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`;
    } else {
        // 父 -> 父：中间折线
        const midX = (from.x + to.x) / 2;
        return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
    }
}

function useRafScheduler() {
    const rafIdRef = useRef<number | null>(null);
    const schedule = useCallback((fn: () => void) => {
        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            fn();
        });
    }, []);
    useEffect(() => {
        return () => { if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); };
    }, []);
    return schedule;
}

const FlowConnectors: React.FC<{
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    flowNodeData: FlowNodeData[];
    zoom: number;
    hasStatus: boolean; // 🆕 接收配置状态
}> = React.memo(({ wrapperRef, flowNodeData, zoom, hasStatus }) => {
    const [paths, setPaths] = useState<ConnectorPath[]>([]);
    const schedule = useRafScheduler();

    const computePaths = useCallback(() => {
        const wrapperEl = wrapperRef.current;
        if (!wrapperEl) return;

        const getParentEl = (recordId: string) =>
            wrapperEl.querySelector<HTMLElement>(`[data-node="parent"][data-id="${recordId}"]`);
        const getChildEl = (parentId: string, childId: string) =>
            wrapperEl.querySelector<HTMLElement>(
                `[data-node="child"][data-parent-id="${parentId}"][data-id="${childId}"]`,
            );

        const nextPaths: ConnectorPath[] = [];
        const OUT = 0;

        for (let i = 0; i < flowNodeData.length; i++) {
            const parent = flowNodeData[i];
            const nextParent = flowNodeData[i + 1];
            const parentId = parent?.recordID;
            if (!parentId) continue;

            const parentEl = getParentEl(parentId);
            if (!parentEl) continue;

            const parentRect = parentEl.getBoundingClientRect();

            // 1. 父 -> 子 (保持底部中心，不受 Status 影响)
            const parentBottom = getRelativePoint(wrapperEl, parentRect, 'bottom-center', zoom, hasStatus);

            const children = Array.isArray(parent.childNode) ? parent.childNode : [];
            if (children.length > 0) {
                for (const child of children) {
                    const childEl = getChildEl(parentId, child.recordID);
                    if (!childEl) continue;
                    const childRect = childEl.getBoundingClientRect();
                    const childLeft = getRelativePoint(wrapperEl, childRect, 'left-center', zoom, hasStatus);

                    nextPaths.push({
                        key: `p2c:${parentId}->${child.recordID}`,
                        d: makeStepPath(parentBottom, childLeft, 'p2c'),
                    });
                }
            }

            // 2. 父 -> 父 (使用 fixed 锚点，受 Status 影响)
            if (nextParent?.recordID) {
                const nextEl = getParentEl(nextParent.recordID);
                if (nextEl) {
                    const nextRect = nextEl.getBoundingClientRect();

                    const parentRight = getRelativePoint(wrapperEl, parentRect, 'right-fixed', zoom, hasStatus);
                    const nextLeft = getRelativePoint(wrapperEl, nextRect, 'left-fixed', zoom, hasStatus);

                    const pFrom = { x: parentRight.x + OUT, y: parentRight.y };
                    const pTo = { x: nextLeft.x - OUT, y: nextLeft.y };

                    nextPaths.push({
                        key: `p2p:${parentId}->${nextParent.recordID}`,
                        d: makeStepPath(pFrom, pTo, 'p2p'),
                    });
                }
            }
        }
        setPaths(nextPaths);
    }, [wrapperRef, flowNodeData, zoom, hasStatus]); // 🆕 依赖 hasStatus

    useEffect(() => { schedule(computePaths); }, [computePaths, schedule, zoom]);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => schedule(computePaths));
        ro.observe(el);
        const onEvent = () => schedule(computePaths);
        window.addEventListener('resize', onEvent);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', onEvent);
        };
    }, [wrapperRef, computePaths, schedule]);

    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0 }}>
            <style>{`.flow-connector-path { stroke: ${TOKEN.colorLine}; stroke-width: 1.5; fill: none; stroke-linejoin: round; stroke-linecap: round; transition: d 0.1s linear; }`}</style>
            {paths.map((p) => <path key={p.key} d={p.d} className="flow-connector-path" />)}
        </svg>
    );
});
FlowConnectors.displayName = 'FlowConnectors';

export default FlowConnectors;
