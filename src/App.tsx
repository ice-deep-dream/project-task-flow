import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { dashboard, DashboardState } from '@lark-base-open/js-sdk';
import FlowChart from './components/FlowChart';
import { FlowNodeData, FlowConfig } from './components/FlowChart/types'; // 🆕 引入 FlowConfig 类型
import './App.scss';

import 'reset-css';
import '@semi-bot/semi-theme-feishu-dashboard/semi.css';

/**
 * 应用主组件
 */
const App: React.FC = () => {
    // 流程节点数据状态管理
    const [flowNodeData, setFlowNodeData] = useState<FlowNodeData[]>([]);
    // 🆕 1. 新增：流程配置状态管理
    const [flowConfig, setFlowConfig] = useState<FlowConfig | undefined>(undefined);

    // 应用加载状态
    const [loading, setLoading] = useState(true);
    // 错误状态管理
    const [error, setError] = useState<string | null>(null);

    const handleFlowNodeData = useCallback((newData: FlowNodeData[]) => {
        setFlowNodeData(newData);
    }, []);

    /**
     * 初始化应用
     * 根据仪表盘状态加载相应的配置和数据
     */
    const initializeApp = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 根据不同状态进行初始化
            if (dashboard.state === DashboardState.View) {
                // 查看模式：加载已保存的配置数据
                try {
                    const config = await dashboard.getConfig();
                    if (config?.customConfig) {
                        // 🆕 2. 同时加载 Data 和 Config
                        if (Array.isArray(config.customConfig.data)) {
                            setFlowNodeData(config.customConfig.data);
                        }
                        if (config.customConfig.config) {
                            setFlowConfig(config.customConfig.config);
                        }
                    } else {
                        setFlowNodeData([]);
                    }
                } catch (configError) {
                    setFlowNodeData([]);
                }
            } else if (dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create) {
                // 配置/创建模式：初始化空数据，等待用户配置
                setFlowNodeData([]);
                setFlowConfig(undefined);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '应用初始化失败';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // 应用初始化副作用
    useEffect(() => {
        const timer = setTimeout(initializeApp, 100);
        return () => clearTimeout(timer);
    }, [initializeApp]);

    if (loading) {
        return (
            <ConfigProvider>
                <div className="app-loading">
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                </div>
            </ConfigProvider>
        );
    }

    if (error) {
        return (
            <ConfigProvider>
                <div className="app-error">
                    <div className="error-content">
                        <h3>应用加载失败</h3>
                        <p>{error}</p>
                        <button onClick={initializeApp}>重试</button>
                    </div>
                </div>
            </ConfigProvider>
        );
    }

    return (
        <ConfigProvider>
            <div className="app">
                <FlowChart
                    flowNodeData={flowNodeData}
                    handleFlowNodeData={handleFlowNodeData}
                    defaultConfig={flowConfig} // 🆕 3. 将配置传给子组件
                />
            </div>
        </ConfigProvider>
    );
};

export default App;
