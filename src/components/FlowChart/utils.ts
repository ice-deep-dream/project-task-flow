import dayjs from 'dayjs';
import { base, IOpenLink, IOpenSingleSelect } from '@lark-base-open/js-sdk';
import { FlowConfig, FlowNodeData } from './types';
import { StatusArrInfo } from './config';

// ============================================================================
// 🎨 样式常量与设计 Token
// ============================================================================
export const TOKEN = {
    colorTextTitle: '#1F2329',
    colorTextBody: '#646A73',
    colorTextLight: '#8F959E',
    colorBgCard: '#FFFFFF',
    colorBgPage: '#F5F6F7',
    colorBorder: '#DEE0E3',
    colorLine: '#C4C8CC',
    colorRed: '#F54A45',
    colorRedBg: '#FFF2F1',
    primary: '#3370FF', // 蓝色常量
    shadowCard: '0 2px 8px rgba(31, 35, 41, 0.04)',
    shadowCardHover: '0 6px 16px rgba(31, 35, 41, 0.08)',
    radius: '8px',
    colors: {
        gray: { bg: '#F2F3F5', text: '#646A73', border: '#8F959E' },
        blue: { bg: '#E1EAFF', text: '#3370FF', border: '#3370FF' },
        green: { bg: '#E3F9E9', text: '#00B69B', border: '#00B69B' },
        orange: { bg: '#FFF5E5', text: '#FF8800', border: '#FF8800' },
        red: { bg: '#FEECEC', text: '#F54A45', border: '#F54A45' },
    }
};

// ============================================================================
// 🛠️ 辅助函数
// ============================================================================

export const getStatusStyle = (status: number) => {
    switch (status) {
        case 1: return TOKEN.colors.blue;
        case 2: return TOKEN.colors.green;
        case 3: return TOKEN.colors.orange;
        case 4: return TOKEN.colors.red;
        case 0:
        default: return TOKEN.colors.gray;
    }
};

export const checkIsOverdue = (
    planDate: string,
    finishDate: string,
    status: number,
    hasPlanConfig: boolean,
    hasFinishConfig: boolean,
    hasStatusConfig: boolean
) => {
    if (!hasPlanConfig || !hasFinishConfig || !hasStatusConfig) return false;
    if (!planDate) return false;

    const plan = dayjs(planDate);

    if (status === 2) {
        if (!finishDate) return false;
        return dayjs(finishDate).isAfter(plan, 'day');
    }

    return dayjs().isAfter(plan, 'day');
};

export function isValidFlowConfig(obj: unknown): obj is FlowConfig {
    if (!obj || typeof obj !== 'object') return false;
    const config = obj as Record<string, unknown>;
    return (
        typeof config.tableNameId === 'string' &&
        typeof config.titleId === 'string'
    );
}

// --- 内部数据提取 Helper ---

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function hasTextProp(value: unknown): value is { text: unknown } {
    return isObject(value) && 'text' in value;
}

export function pickTextFromCellValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        const first = value[0];
        if (hasTextProp(first) && typeof first.text === 'string') return first.text;
        if (typeof first === 'string') return first;
        return '';
    }
    if (hasTextProp(value) && typeof (value as any).text === 'string') return (value as any).text;
    return '';
}

export function pickOwnerName(value: unknown): string {
    if (!value) return '';
    if (Array.isArray(value)) {
        return value.map((user: any) => user.name || user.enName || '').join(', ');
    }
    return '';
}

export function pickLinkRecordIds(value: unknown): string[] {
    if (!value) return [];
    if (isObject(value) && 'recordIds' in value && Array.isArray((value as any).recordIds)) {
        return ((value as any).recordIds as unknown[]).map((x) => String(x));
    }
    return [];
}

// 🆕 核心修复：正确解析超链接数组
export function pickLinkUrl(value: unknown): string {
    if (!value) return '';

    // 情况1：数组 (多维表格标准返回格式)
    // 格式: [{ type: 'url', text: '...', link: 'https://...' }]
    if (Array.isArray(value)) {
        // 找到第一个包含 link 属性的对象
        const linkItem = value.find((item: any) => item && item.link);
        return linkItem ? linkItem.link : '';
    }

    // 情况2：单对象 (兼容性处理)
    if (isObject(value) && 'link' in value && typeof (value as any).link === 'string') {
        return (value as any).link;
    }

    // 情况3：纯文本 (如果用户选了文本字段当链接)
    if (typeof value === 'string') return value;

    return '';
}

// ============================================================================
// 📊 核心数据获取逻辑
// ============================================================================
export async function getFlowDate(flowConfig: FlowConfig): Promise<FlowNodeData[]> {
    try {
        if (!flowConfig?.tableNameId) return [];
        const getTableListRes = await base.getTableList();
        const flowConfigTable = getTableListRes.filter((item) => item.id === flowConfig.tableNameId);
        if (flowConfigTable.length === 0) return [];

        const param = { pageSize: 200 };
        const records = await flowConfigTable[0].getRecords(param);

        const recordSort = records.records.sort((a, b) => {
            if (!flowConfig.targetDataId) return 0;
            const dateA = new Date(a.fields[flowConfig.targetDataId] as string);
            const dateB = new Date(b.fields[flowConfig.targetDataId] as string);
            return dateA.getTime() - dateB.getTime();
        });

        const flowData: FlowNodeData[] = [];
        const childWithParent: (FlowNodeData & { parentRecordID: string })[] = [];

        recordSort.forEach((item) => {
            let statusInfo = { value: 0 };
            if (flowConfig.statusId) {
                const statusField = item.fields[flowConfig.statusId] as IOpenSingleSelect;
                const statusText = pickTextFromCellValue(statusField);

                if (statusText === '未启动') statusInfo.value = 0;
                else if (statusText === '进行中') statusInfo.value = 1;
                else if (statusText === '已完成') statusInfo.value = 2;
                else if (statusText === '暂停') statusInfo.value = 3;
                else {
                    const found = StatusArrInfo.find((e) => e.label === statusText);
                    statusInfo.value = found ? found.value : 0;
                }
            }

            const titleField = item.fields[flowConfig.titleId];
            const titleText = pickTextFromCellValue(titleField);

            const ownerField = flowConfig.ownerId ? item.fields[flowConfig.ownerId] : null;
            const ownerName = pickOwnerName(ownerField);

            const planDateRaw = flowConfig.targetDataId ? (item.fields[flowConfig.targetDataId] as string) : null;
            const finishDateRaw = flowConfig.finishDataId ? (item.fields[flowConfig.finishDataId] as string) : null;

            // 🆕 获取超链接数据
            const linkField = flowConfig.linkId ? item.fields[flowConfig.linkId] : null;
            const linkUrl = pickLinkUrl(linkField); // 这里会调用修复后的函数

            const recordData: FlowNodeData = {
                id: 0,
                status: statusInfo.value,
                title: titleText,
                planDate: planDateRaw ? dayjs(planDateRaw).format('YYYY-MM-DD') : '',
                finishDate: finishDateRaw ? dayjs(finishDateRaw).format('YYYY-MM-DD') : '',
                recordID: item.recordId,
                description: '',
                owners: ownerName,
                link: linkUrl, // 赋值
                childNode: [],
            };

            const linkRaw = flowConfig.titleChildId ? item.fields[flowConfig.titleChildId] : null;
            if (!linkRaw) {
                flowData.push(recordData);
            } else {
                const recordIds = pickLinkRecordIds(linkRaw as IOpenLink);
                if (recordIds.length > 0) {
                    childWithParent.push({ ...recordData, parentRecordID: recordIds[0] });
                } else {
                    flowData.push(recordData);
                }
            }
        });

        childWithParent.forEach((child) => {
            const parent = flowData.find((p) => p.recordID === child.parentRecordID);
            if (parent) parent.childNode.push(child);
        });

        return flowData;
    } catch (error) {
        return [];
    }
}
