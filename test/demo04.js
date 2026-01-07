
import dayjs from "dayjs";

/**
 *
 * @author BingChiHan
 * @date 2024/7/23 17:01
 * @version 1.0.0
 **/

const StatusArrInfo = [
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
//
// const value = StatusArrInfo.filter(e=>e.label==='已完成')[0].value
// console.log({value})

const config = {
    "tableNameId": "tblNRzojIWMUjtwb",
    "titleId": "fldUwZ1FGE",
    "titleChildId": "fldPffsaKY",
    "targetDataId": "fldKzpWj0g",
    "statusId": "fldHsZDzOK"
}

const arr = [
    {
        "fields": {
            "fldKzpWj0g": 1719763200000,
            "fldifpf450": 1.61,
            "fldlrKW81m": null,
            "fldPffsaKY": {
                "recordIds": [
                    "recq1VkBIH"
                ],
                "tableId": "tblNRzojIWMUjtwb",
                "record_ids": [
                    "recq1VkBIH"
                ],
                "table_id": "tblNRzojIWMUjtwb",
                "text": "包装方案",
                "type": "text"
            },
            "fldQVS0Qiw": {
                "id": "optLqZtlgM",
                "text": "包装方案1132"
            },
            "fldHsZDzOK": {
                "id": "optZqBPxOn",
                "text": "进行中"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "包装方案1132"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "包装方案1132"
                }
            ]
        },
        "recordId": "recuiXOy6AxVzM"
    },
    {
        "fields": {
            "fldKzpWj0g": 1719849600000,
            "fldifpf450": 1.61,
            "fldlrKW81m": null,
            "fldPffsaKY": {
                "recordIds": [
                    "recq1VkBIH"
                ],
                "tableId": "tblNRzojIWMUjtwb",
                "record_ids": [
                    "recq1VkBIH"
                ],
                "table_id": "tblNRzojIWMUjtwb",
                "text": "包装方案",
                "type": "text"
            },
            "fldQVS0Qiw": {
                "id": "optLqZtlgM",
                "text": "包装方案1132"
            },
            "fldHsZDzOK": {
                "id": "optZqBPxOn",
                "text": "进行中"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "包装方案122332"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "包装方案1132232"
                }
            ]
        },
        "recordId": "recuiXOAkx2uy0"
    },
    {
        "fields": {
            "fldKzpWj0g": 1719936000000,
            "fldifpf450": 1.608074,
            "fldlrKW81m": 1719936000000,
            "fldPffsaKY": null,
            "fldQVS0Qiw": {
                "id": "optZvrItFR",
                "text": "包装方案"
            },
            "fldHsZDzOK": {
                "id": "optZqBPxOn",
                "text": "进行中"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "包装方案"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "包装方案"
                }
            ]
        },
        "recordId": "recq1VkBIH"
    },
    {
        "fields": {
            "fldKzpWj0g": 1720108800000,
            "fldifpf450": 1.608074,
            "fldlrKW81m": 1722096000000,
            "fldPffsaKY": null,
            "fldQVS0Qiw": {
                "id": "opt0IDufhx",
                "text": "包装设计文件"
            },
            "fldHsZDzOK": {
                "id": "optZqBPxOn",
                "text": "进行中"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "包装设计文件"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "包装设计文件"
                }
            ]
        },
        "recordId": "recOUQnkJM"
    },
    {
        "fields": {
            "fldKzpWj0g": 1720886400000,
            "fldifpf450": 1.608074,
            "fldlrKW81m": 1721491200000,
            "fldPffsaKY": null,
            "fldQVS0Qiw": {
                "id": "optKbgwhJJ",
                "text": "订单验收品质标准"
            },
            "fldHsZDzOK": {
                "id": "optsOe8Qsv",
                "text": "未启动"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "订单验收品质标准"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "订单验收品质标准"
                }
            ]
        },
        "recordId": "recpe909Rq"
    },
    {
        "fields": {
            "fldKzpWj0g": 1721404800000,
            "fldifpf450": 14993.805674,
            "fldlrKW81m": 1719763200000,
            "fldPffsaKY": null,
            "fldQVS0Qiw": {
                "id": "optpB71SEl",
                "text": "客户合同PO"
            },
            "fldHsZDzOK": {
                "id": "optm2bvLKu",
                "text": "已完成"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "客户合同PO"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "客户合同PO"
                }
            ]
        },
        "recordId": "recxJGehSB"
    },
    {
        "fields": {
            "fldKzpWj0g": 1723046400000,
            "fldifpf450": 162.415474,
            "fldlrKW81m": 1722355200000,
            "fldPffsaKY": null,
            "fldQVS0Qiw": {
                "id": "optF1tnQZX",
                "text": "客户文件"
            },
            "fldHsZDzOK": {
                "id": "optsOe8Qsv",
                "text": "未启动"
            },
            "fldpQqfqbe": [
                {
                    "type": "text",
                    "text": "客户文件"
                }
            ],
            "fldUwZ1FGE": [
                {
                    "type": "text",
                    "text": "客户文件"
                }
            ]
        },
        "recordId": "rec4j484wR"
    }
]



function handFlowDataByRecordV1(records,config) {
    records.sort((a, b) => a.fields[config.targetDataId] - b.fields[config.targetDataId]);
    let flowData = []
    let flowChildData = []
    // 遍历result数组，将没有父记录的插入到父记录中
    records.forEach((item, index) => {
        if (!item.fields[config.titleChildId]) {
            flowData.push({
                id: 0,
                status: StatusArrInfo.filter(e => e.label === item.fields[config.statusId].text)[0].value,
                title: item.fields[config.titleId][0].text,
                dayDuration: dayjs(item.fields[config]).format('MM/DD'),
                recordID: item.recordId,
                description: '',
                childNode: []
            })
        } else {
            flowChildData.push({
                id: 0,
                status: StatusArrInfo.filter(e => e.label === item.fields[config.statusId].text)[0].value,
                title: item.fields[config.titleId][0].text,
                dayDuration: dayjs(item.fields[config.targetDataId]).format('MM/DD'),
                recordID: item.recordId,
                description: '',
                parentRecordID: item.fields[config.titleChildId].recordIds[0],
            })
        }
    });

    flowChildData.forEach(item => {
        for (let i = 0; i < flowData.length; i++) {
            if (item.parentRecordID === flowData[i].recordID) {
                console.log("223")
                flowData[i].childNode.push(item)
            }
        }
    })

    return flowData
}

const result1 = handFlowDataByRecordV1(arr,config)
console.log({result1})



function handFlowDataByRecord(records, config) {
    const flowDataMap = new Map(); // 使用 Map 来存储节点数据，方便通过 recordID 进行查找

    // 遍历 records 数组，构建节点数据
    records.forEach((item, index) => {
        const recordID = item.recordId;
        const parentRecordID = item.fields[config.titleChildId]?.recordIds[0];

        const nodeData = {
            id: index,
            status: StatusArrInfo.find(e => e.label === item.fields[config.statusId].text)?.value,
            title: item.fields[config.titleId][0].text,
            dayDuration: dayjs(item.fields[config.targetDataId]).format('MM/DD'),
            recordID: recordID,
            description: '',
            childNode: []
        };

        if (!parentRecordID) {
            // 没有父记录的节点，直接添加到 flowDataMap
            flowDataMap.set(recordID, nodeData);
        } else {
            // 有父记录的节点，先添加到对应的父节点的 childNode 数组中
            const parentNode = flowDataMap.get(parentRecordID);
            if (parentNode) {
                parentNode.childNode.push(nodeData);
            }
        }
    });

    // 将 Map 转换为数组，并按照顺序排列
    const flowData = Array.from(flowDataMap.values()).sort((a, b) => a.id - b.id);

    return flowData;
}

const result = handFlowDataByRecord(arr, config);
console.log({ result });



