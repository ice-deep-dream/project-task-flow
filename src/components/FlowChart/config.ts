
/* 节点的状态 */
export const StatusMap = {
    0: { className:'status-0', text: '未启动' },
    1: { className:'status-1', text: '进行中' },
    2: { className:'status-2', text: '已完成' },
    3: { className:'status-3', text: '已关闭' },
};

export const StatusChildMap = {
    0: { className:'status-0-circle', text: '未启动' },
    1: { className:'status-1-circle', text: '进行中' },
    2: { className:'status-2-circle', text: '已完成' },
    3: { className:'status-3-circle', text: '已关闭' },
};

export const StatusArrInfo = [
    {
        value: 0,
        label: '未启动',
    },
    {
        value: 1,
        label: '进行中',
    },
    {
        value: 2,
        label: '已完成',
    },
    {
        value: 3,
        label: '已关闭',
    }
]
