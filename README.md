
---

# 📊 多维表格流程图插件 (Base Flow Chart)

![License](https://img.shields.io/badge/license-GPLv3-blue.svg) ![Version](https://img.shields.io/badge/version-1.0.0-green.svg) ![Platform](https://img.shields.io/badge/platform-Feishu%20%2F%20Lark-3370ff.svg)

**Base Flow Chart** 是一款专为飞书/Lark 多维表格（Base）设计的可视化仪表盘插件。它能将枯燥的任务列表瞬间转化为**动态树状流程图**，帮助团队直观地梳理任务依赖、追踪项目进度、识别逾期风险，并支持一键跳转外部设计稿或文档。

---

## ✨ 核心功能 (Features)

*   **🌲 自动层级构建**：基于多维表格的“双向关联”字段，自动生成清晰的父子任务树状图。
*   **🎨 智能状态染色**：根据任务状态（未开始、进行中、已完成、暂停）自动改变卡片颜色，进度一目了然。
*   **⚠️ 逾期风险预警**：自动计算计划日期与当前日期，逾期任务通过红色高亮和 ⚠️ 图标醒目提示。
*   **🔗 便捷超链接**：支持配置超链接字段，在卡片上直接点击 🔗 图标跳转至 Figma、产品文档或外部系统。
*   **🔍 交互式画布**：支持画布无限拖拽、缩放（放大/缩小/重置），适应不同规模的项目视图。
*   **📱 响应式设计**：完美适配飞书仪表盘的查看模式与全屏模式。

---

## 🛠️ 数据准备 (Prerequisites)

为了获得最佳的使用体验，请确保您的多维表格包含以下类型的字段：

| 字段名称 (示例) | 字段类型 | 必填 | 作用说明 |
| :--- | :--- | :--- | :--- |
| **任务标题** | 文本 | ✅ | 卡片显示的主标题 |
| **子任务/关联** | **双向关联** | ✅ | **核心**：用于构建父子连线关系 |
| **状态** | 单选 | ❌ | 控制卡片颜色 (建议包含: 未启动, 进行中, 已完成) |
| **计划日期** | 日期 | ❌ | 用于计算是否逾期 |
| **完成日期** | 日期 | ❌ | 标记实际完成时间 |
| **负责人** | 人员 | ❌ | 显示任务负责人头像/姓名 |
| **相关链接** | **超链接** | ❌ | **新功能**：显示跳转图标 (如 Figma/PRD) |

---

## 🚀 使用指南 (User Guide)

### 1. 安装插件
在飞书多维表格的仪表盘中，点击“添加组件”，选择“自定义组件”，上传本项目构建后的代码包。

### 2. 配置面板
进入组件的配置页面，依次进行如下映射：

1.  **数据表**：选择包含任务数据的数据表。
2.  **节点标题**：选择任务名称字段。
3.  **子记录字段**：选择关联了子任务的关联字段（不选无法显示连线）。
4.  **其他字段**：按需配置状态、日期、负责人及**超链接**字段。
5.  **间距调整**：根据视觉需求调整父/子节点的横纵间距。

### 3. 查看与交互
*   **保存**配置后，即可在仪表盘看到流程图。
*   **点击卡片标题**：打开多维表格记录详情页。
*   **点击 🔗 图标**：跳转到配置的外部链接。
*   **缩放控制**：使用左下角的工具栏调整视图大小。

---

## 💻 开发指南 (Development)

如果您想对本项目进行二次开发，请遵循以下步骤：

### 环境要求
*   Node.js (推荐 v16+)
*   npm 或 yarn

### 安装依赖
```bash
npm install
# 或者
yarn install
```

### 本地启动
开启本地开发服务器，支持热更新：
```bash
npm run start
```

### 构建打包
编译生产环境代码（输出至 `dist` 目录）：
```bash
npm run build
```

---

## ❓ 常见问题 (FAQ)

**Q: 为什么配置了超链接字段，卡片上没有显示图标？**
A: 请确保该条记录的超链接字段**内容不为空**。只有当字段内有有效链接时，🔗 图标才会显示。

**Q: 逾期逻辑是如何判断的？**
A: 逻辑如下：
1. 如果状态为“已完成”，且有“完成日期”，则比较完成日期是否晚于计划日期。
2. 如果状态非“已完成”，则比较“当前日期”是否晚于计划日期。

**Q: 为什么我的连线显示不出来？**
A: 请检查配置面板中的“**子记录字段**”是否已正确选择，且数据表中确实存在关联关系。

---

## 📄 开源协议 (License)

Copyright (c) 2026-01-07 [ICE]

This project is licensed under the **GNU General Public License v3.0**.

You should have received a copy of the GNU General Public License along with this program.  
If not, see <https://www.gnu.org/licenses/gpl-3.0.html>.

### GNU GENERAL PUBLIC LICENSE
**Version 3, 29 June 2007**

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>  
Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

*(For the full text of the license, please refer to the LICENSE file in the repository or the link above.)*
