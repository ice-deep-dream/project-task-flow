import React, { useEffect, useMemo, useState } from 'react';
import { Button, Select, Toast } from '@douyinfe/semi-ui';
import { base, dashboard } from '@lark-base-open/js-sdk';
import { Item } from '../Item'; // 假设这是你的通用组件
import { DropdownOption, FlowConfig, FlowNodeData, HandleFlowConfig, HandleFlowNodeData } from './types';
import { getFlowDate } from './utils';

// 自定义 Hook 管理下拉选项
function useDropdownOptions(initial: DropdownOption[] = []) {
    const [options, setOptions] = useState<DropdownOption[]>(initial);
    return { options, setOptions };
}

const ConfigPanel: React.FC<{
    flowConfig: FlowConfig | undefined;
    handleFlowConfig: HandleFlowConfig;
    flowNodeData: FlowNodeData[];
    handleFlowNodeData: HandleFlowNodeData;
}> = React.memo((props) => {
    // 状态管理
    const [tableSelected, setTableSelected] = useState('');
    const [titleSelected, setTitleSelected] = useState('');
    const [recordParentSelected, setRecordParentSelected] = useState('');
    const [dateSelected, setDateSelected] = useState('');
    const [finishDateSelected, setFinishDateSelected] = useState('');
    const [statusSelected, setStatusSelected] = useState('');
    const [ownerSelected, setOwnerSelected] = useState('');
    const [parentGapX, setParentGapX] = useState(60);
    const [childGapY, setChildGapY] = useState(30);

    // 下拉选项
    const { options: tableOptions, setOptions: setTableOptions } = useDropdownOptions();
    const { options: titleOptions, setOptions: setTitleOptions } = useDropdownOptions();
    const { options: recordParentOptions, setOptions: setRecordParentOptions } = useDropdownOptions();
    const { options: targetDateOptions, setOptions: setTargetDateOptions } = useDropdownOptions();
    const { options: statusOptions, setOptions: setStatusOptions } = useDropdownOptions();
    const { options: ownerOptions, setOptions: setOwnerOptions } = useDropdownOptions();

    const spacingOptionsX = useMemo(() => [{ value: '40', label: '紧凑 40' }, { value: '60', label: '默认 60' }, { value: '80', label: '宽松 80' }, { value: '100', label: '很宽 100' }], []);
    const spacingOptionsY = useMemo(() => [{ value: '20', label: '紧凑 20' }, { value: '30', label: '默认 30' }, { value: '40', label: '宽松 40' }, { value: '50', label: '很宽 50' }], []);

    // 初始化逻辑：加载表列表 -> 读取配置 -> 回填状态 -> 加载字段
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                // 1. 获取所有数据表
                const tables = await base.getTableList();
                const tableMetaArr = await Promise.all(
                    tables.map(async (table) => {
                        const meta = await base.getTableMetaById(table.id);
                        return { value: meta.id, label: meta.name, otherKey: 0 };
                    }),
                );
                if (cancelled) return;
                setTableOptions(tableMetaArr);

                // 2. 确定配置来源 (Props 优先，其次 Backend)
                let activeConfig = props.flowConfig;
                if (!activeConfig || !activeConfig.tableNameId) {
                    const res = await dashboard.getConfig();
                    activeConfig = (res.customConfig as any)?.config;
                }

                // 3. 回填配置
                if (activeConfig && activeConfig.tableNameId) {
                    setTableSelected(activeConfig.tableNameId);
                    setTitleSelected(activeConfig.titleId || '');
                    setRecordParentSelected(activeConfig.titleChildId || '');
                    setDateSelected(activeConfig.targetDataId || '');
                    setFinishDateSelected(activeConfig.finishDataId || '');
                    setStatusSelected(activeConfig.statusId || '');
                    setOwnerSelected(activeConfig.ownerId || '');
                    setParentGapX(activeConfig.parentGapX ?? 60);
                    setChildGapY(activeConfig.childGapY ?? 30);

                    // 4. 加载字段
                    await getOptions(activeConfig.tableNameId);
                }
            } catch (error) {
                // 忽略初始化错误
            }
        };
        init();
        return () => { cancelled = true; };
    }, []);

    const getOptions = async (tableId: string) => {
        if (!tableId) return;
        const fields = await dashboard.getCategories(tableId);
        const categories = {
            titleOptions: [] as DropdownOption[],
            targetDateOptions: [] as DropdownOption[],
            statusOptions: [] as DropdownOption[],
            recordParentOptions: [] as DropdownOption[],
            ownerOptions: [] as DropdownOption[],
        };
        fields.forEach((field, index) => {
            const option = { value: field.fieldId, label: field.fieldName, otherKey: index };
            if (field.fieldType === 1 || field.fieldType === 3) categories.titleOptions.push(option);
            if (field.fieldType === 5) categories.targetDateOptions.push(option);
            if (field.fieldType === 3) categories.statusOptions.push(option);
            if (field.fieldType === 18) categories.recordParentOptions.push(option);
            if (field.fieldType === 11) categories.ownerOptions.push(option);
        });
        setTitleOptions(categories.titleOptions);
        setTargetDateOptions(categories.targetDateOptions);
        setStatusOptions(categories.statusOptions);
        setRecordParentOptions(categories.recordParentOptions);
        setOwnerOptions(categories.ownerOptions);
    };

    // 实时预览监听
    useEffect(() => {
        if (tableSelected && titleSelected) {
            const previewConfig: FlowConfig = {
                tableNameId: tableSelected,
                titleId: titleSelected,
                titleChildId: recordParentSelected,
                targetDataId: dateSelected,
                finishDataId: finishDateSelected,
                statusId: statusSelected,
                ownerId: ownerSelected,
                parentGapX,
                childGapY,
            };

            props.handleFlowConfig(previewConfig);
            getFlowDate(previewConfig).then(data => {
                props.handleFlowNodeData(data);
            });
        }
    }, [
        tableSelected, titleSelected, recordParentSelected, dateSelected,
        finishDateSelected, statusSelected, ownerSelected, parentGapX, childGapY
    ]);

    const handleUserChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value === undefined || value === null ? '' : String(value));
    };

    const saveFlowConfig = async () => {
        if (!tableSelected || !titleSelected) {
            Toast.error('请填写必填项');
            return;
        }
        try {
            const currentConfig: FlowConfig = {
                tableNameId: tableSelected,
                titleId: titleSelected,
                titleChildId: recordParentSelected,
                targetDataId: dateSelected,
                finishDataId: finishDateSelected,
                statusId: statusSelected,
                ownerId: ownerSelected,
                parentGapX,
                childGapY,
            };

            await dashboard.saveConfig({
                customConfig: {
                    data: props.flowNodeData,
                    config: currentConfig,
                },
                dataConditions: [
                    {
                        tableId: tableSelected,
                        groups: [
                            { fieldId: titleSelected },
                            ...(dateSelected ? [{ fieldId: dateSelected }] : []),
                            ...(statusSelected ? [{ fieldId: statusSelected }] : []),
                            ...(recordParentSelected ? [{ fieldId: recordParentSelected }] : []),
                        ],
                        series: 'COUNTA',
                    },
                ],
            });
            Toast.success('保存成功');
        } catch (error) {
            Toast.error('保存失败');
        }
    };

    const isReady = !!tableSelected && !!titleSelected;

    return (
        <div className="config-panel">
            <div className="config-header">配置面板</div>
            <div className="config-content">
                <Item label={<span style={{color: '#1F2329'}}>数据表 <span style={{color: '#F54A45'}}>*</span></span>}>
                    <Select
                        showClear
                        value={tableSelected}
                        optionList={tableOptions}
                        onChange={async (v) => { const s = String(v || ''); handleUserChange(setTableSelected, s); await getOptions(s); }}
                        placeholder="请选择数据表"
                        style={{ width: 180 }}
                        validateStatus={!tableSelected ? 'error' : 'default'}
                    />
                </Item>
                <Item label={<span style={{color: '#1F2329'}}>节点标题 <span style={{color: '#F54A45'}}>*</span></span>}>
                    <Select
                        showClear
                        value={titleSelected}
                        optionList={titleOptions}
                        onChange={(v) => handleUserChange(setTitleSelected, v)}
                        placeholder="请选择字段"
                        style={{ width: 180 }}
                        validateStatus={!titleSelected ? 'error' : 'default'}
                    />
                </Item>
                <Item label="子记录字段">
                    <Select showClear value={recordParentSelected} optionList={recordParentOptions} onChange={(v) => handleUserChange(setRecordParentSelected, v)} placeholder="可选：子记录" style={{ width: 180 }} />
                </Item>
                <Item label="计划日期">
                    <Select showClear value={dateSelected} optionList={targetDateOptions} onChange={(v) => handleUserChange(setDateSelected, v)} placeholder="可选：计划日期" style={{ width: 180 }} />
                </Item>
                <Item label="完成日期">
                    <Select showClear value={finishDateSelected} optionList={targetDateOptions} onChange={(v) => handleUserChange(setFinishDateSelected, v)} placeholder="可选：完成日期" style={{ width: 180 }} />
                </Item>
                <Item label="状态">
                    <Select showClear value={statusSelected} optionList={statusOptions} onChange={(v) => handleUserChange(setStatusSelected, v)} placeholder="可选：状态" style={{ width: 180 }} />
                </Item>
                <Item label="负责人">
                    <Select showClear value={ownerSelected} optionList={ownerOptions} onChange={(v) => handleUserChange(setOwnerSelected, v)} placeholder="可选：负责人" style={{ width: 180 }} />
                </Item>
                <div style={{ borderTop: '1px solid #EFF0F1', margin: '8px 0' }}></div>
                <Item label="父节点间距">
                    {/* 直接设置 Number 类型，不走 handleUserChange 字符串转换 */}
                    <Select showClear value={String(parentGapX)} optionList={spacingOptionsX} onChange={(v) => setParentGapX(Number(v))} style={{ width: 180 }} />
                </Item>
                <Item label="子节点间距">
                    <Select showClear value={String(childGapY)} optionList={spacingOptionsY} onChange={(v) => setChildGapY(Number(v))} style={{ width: 180 }} />
                </Item>
                <Button className="btn" theme="solid" onClick={saveFlowConfig} disabled={!isReady}>确认保存</Button>
            </div>
        </div>
    );
});
ConfigPanel.displayName = 'ConfigPanel';

export default ConfigPanel;
