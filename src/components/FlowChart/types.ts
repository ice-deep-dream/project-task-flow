// 流程节点数据结构
export interface FlowNodeData {
    id: number;
    status: number;
    title: string;
    planDate: string;
    finishDate: string;
    recordID: string;
    description: string;
    owners: string;
    childNode: FlowNodeData[];
}

// 流程图配置结构
export interface FlowConfig {
    tableNameId: string;
    titleId: string;
    titleChildId?: string;
    targetDataId?: string;
    finishDataId?: string;
    statusId?: string;
    ownerId?: string;
    parentGapX?: number;
    childGapY?: number;
}

// 下拉框选项结构
export interface DropdownOption {
    value: string;
    label: string;
    otherKey?: number;
}

// 回调函数类型
export type HandleFlowNodeData = (newData: FlowNodeData[]) => void;
export type HandleFlowConfig = (newData: FlowConfig) => void;
