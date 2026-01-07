import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { dashboard, DashboardState } from '@lark-base-open/js-sdk';
import FlowChart from './components/FlowChart';
import { FlowNodeData, FlowConfig } from './components/FlowChart/types';
import './App.scss';

import 'reset-css';
import '@semi-bot/semi-theme-feishu-dashboard/semi.css';

/**
 * 应用主组件
 */
const App: React.FC = () => {
    // 流程节点数据状态管理
    const [flowNodeData, setFlowNodeData] = useState<FlowNodeData[]>([]);
    // 流程配置状态管理
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
                    const res = await dashboard.getConfig();
                    // 🔧 修复点：使用 'as any' 进行类型断言，解决 TS2345 错误
                    const customConfig = res?.customConfig as any;

                    if (customConfig) {
                        // 1. 加载数据
                        if (Array.isArray(customConfig.data)) {
                            setFlowNodeData(customConfig.data);
                        }
                        // 2. 加载配置
                        if (customConfig.config) {
                            setFlowConfig(customConfig.config as FlowConfig);
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
                    defaultConfig={flowConfig}
                />
            </div>
        </ConfigProvider>
    );
};

export default App;
