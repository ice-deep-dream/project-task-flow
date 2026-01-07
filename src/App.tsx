import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { dashboard, DashboardState } from '@lark-base-open/js-sdk';
import FlowChart from './components/FlowChart'; // 引用重构后的入口
import { FlowNodeData } from './components/FlowChart/types'; // 引用拆分后的类型
import './App.scss';

// 引入样式
import 'reset-css';
import '@semi-bot/semi-theme-feishu-dashboard/semi.css';

/**
 * 应用主组件
 */
const App: React.FC = () => {
    // 流程节点数据状态管理
    const [flowNodeData, setFlowNodeData] = useState<FlowNodeData[]>([]);
    // 应用加载状态
    const [loading, setLoading] = useState(true);
    // 错误状态管理
    const [error, setError] = useState<string | null>(null);

    // 使用 useCallback 优化事件处理函数
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
                    if (config?.customConfig?.data && Array.isArray(config.customConfig.data)) {
                        setFlowNodeData(config.customConfig.data);
                    } else {
                        setFlowNodeData([]);
                    }
                } catch (configError) {
                    // 容错处理：配置加载失败时使用空数据，不阻断渲染
                    setFlowNodeData([]);
                }
            } else if (dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create) {
                // 配置/创建模式：初始化空数据，等待用户配置
                setFlowNodeData([]);
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
        // 延迟初始化：确保 SDK 环境完全就绪，避免竞态条件
        const timer = setTimeout(initializeApp, 100);
        return () => clearTimeout(timer);
    }, [initializeApp]);

    // 加载状态渲染
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

    // 错误状态渲染
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
                />
            </div>
        </ConfigProvider>
    );
};

export default App;
