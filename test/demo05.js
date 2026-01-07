/**
 *
 * @author BingChiHan
 * @date 2024/7/29 16:21
 * @version 1.0.0
 **/
const input = {
        "summary": "优化微投票选择参与人功能",
        "creator": {
            "id": "on_019b45b905301189e700e28114f40acf",
            "type": "user"
        },
        "is_milestone": false,
        "subtask_count": 0,
        "origin": {
            "platform_i18n_name": {
                "it_it": "",
                "ru_ru": "",
                "zh_hk": "",
                "zh_tw": "",
                "ko_kr": "",
                "en_us": "",
                "es_es": "",
                "zh_cn": "",
                "th_th": "",
                "fr_fr": "",
                "ja_jp": "",
                "de_de": ""
            },
            "href": {
                "title": "",
                "url": ""
            }
        },
        "created_at": "1722238679296",
        "description": "",
        "task_id": "t102623",
        "tasklists": [
            {
                "section_guid": "90d6db8f-3f74-4681-7110-6e82038e39d8",
                "tasklist_guid": "5728c9a5-3e8d-46a6-8424-4e7ffe3b14ce"
            }
        ],
        "source": 1,
        "parent_task_guid": "",
        "url": "https://applink.feishu.cn/client/todo/detail?guid=54184ea7-3886-4c7e-acf9-5deee4042f5a&suite_entity_num=t102623",
        "dependencies": [],
        "mode": 2,
        "completed_at": "0",
        "updated_at": "1722238679698",
        "extra": "",
        "members": [
            {
                "role": "follower",
                "id": "on_019b45b905301189e700e28114f40acf",
                "type": "user"
            }
        ],
        "repeat_rule": "",
        "guid": "54184ea7-3886-4c7e-acf9-5deee4042f5a",
        "status": "todo"
    }

const res = handler(input);
console.log(res)

function handler(input) {
    /* 1. 筛选出系统无法带出下拉框参数ID */
    const customFields = input?.custom_fields;
    console.log({customFields})

    let result = {};
    if (Array.isArray(customFields)) {
        result = customFields.reduce((acc, field) => {
            if (field.name === '任务关联') {
                acc[field.name] = field.text_value;
            } else if (
                field.name === '重要紧急程度' ||
                field.name === '积分' ||
                field.name === '任务分类'
            ) {
                acc[field.name] = field.single_select_value;
            }
            return acc;
        }, {});
    }

    /* 2. 返回多维表批量插入数据结构 */
    if (input.members.length !== 0) {
        return input.members
            .filter((i) => {
                return i.role === 'assignee';
            })
            .map((item) => {
                return {
                    fields: {
                        任务标题: input.summary,
                        // '重要紧急程度':item.custom_fields.,
                        T1: result?.['任务分类'],
                        T2: result?.['重要紧急程度'],
                        开始日期: input?.start ? parseInt(input.start.timestamp) : null,
                        截止日期: input?.due ? parseInt(input.due.timestamp) : null,
                        完成日期:
                            parseInt(input.completed_at) > 0 ? parseInt(input.completed_at) : null,
                        T3: result?.['积分']
                            ? result?.['积分']
                            : 'd2d67a6f-064a-42fb-bd9f-3ce5b9460d2e',
                        任务来源: '我的任务',
                        任务关联: result?.['任务关联'],
                        任务链接: input.url,
                        任务ID: input.guid,
                        负责人: [{ id: item.id }],
                        创建时间: parseInt(input.created_at),
                        更新时间: parseInt(input.updated_at),
                        创建人: [
                            {
                                id: input.creator.id,
                            },
                        ],
                    },
                };
            });
    } else {
        return {
            fields: {
                任务标题: input.summary,
                // '重要紧急程度':item.custom_fields.,
                T1: result?.['任务分类'],
                T2: result?.['重要紧急程度'],
                开始日期: input?.start ? parseInt(input.start.timestamp) : null,
                截止日期: input?.due ? parseInt(input.due.timestamp) : null,
                完成日期: parseInt(input.completed_at) > 0 ? parseInt(input.completed_at) : null,
                T3: result?.['积分'] ? result?.['积分'] : 'd2d67a6f-064a-42fb-bd9f-3ce5b9460d2e',
                任务来源: '我的任务',
                任务关联: result?.['任务关联'],
                任务链接: input.url,
                任务ID: input.guid,
                负责人: [
                    {
                        id: input.creator.id,
                    },
                ],
                创建时间: parseInt(input.created_at),
                更新时间: parseInt(input.updated_at),
                创建人: [
                    {
                        id: input.creator.id,
                    },
                ],
            },
        };
    }
}
