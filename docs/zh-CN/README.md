<div align="center">

<img src="../../public/banner.png" alt="LingUBible Logo" width="50%">

# 📚 LingUBible

### *让每一个评价，成为学习路上的明灯*

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](../../README.md)
[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red?style=for-the-badge)](../zh-TW/README.md)
[![简体中文](https://img.shields.io/badge/Language-简体中文-green?style=for-the-badge)](README.md)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-19.0.0-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![ECharts](https://img.shields.io/badge/ECharts-5.6.0-AA344D?style=flat-square&logo=apacheecharts&logoColor=white)](https://echarts.apache.org/)

[![部署至 Appwrite Sites](https://img.shields.io/badge/部署至-Appwrite%20Sites-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://lingubible.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/ansonlo-dev/LingUBible/graphs/commit-activity)

[![Ko-fi](https://img.shields.io/badge/支持我们-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/lingubible)

---

**🌟 一个专为岭南大学学生打造的课程与讲师评价平台**

*帮助同学们做出明智的学术选择，分享真实的学习体验*

[🚀 立即体验](#-快速开始) • [📖 查看文档](./) • [🤝 参与贡献](#-贡献) • [🌍 多语言支持](#-语言--language)

</div>

---

## 🌐 在线体验

<div align="center">

**LingUBible 已正式上线，服务岭南大学学生：**

### [🔗 lingubible.com](https://lingubible.com)

*浏览课程与讲师、阅读及撰写评价、探索交互式成绩分布——无需安装。注册需使用有效的岭南大学电子邮件。*

</div>

---

## ✨ 核心功能

<div align="center">

| 功能 | 描述 | 状态 |
|:---:|:---|:---:|
| 📝 **课程评价** | 涵盖工作量、难度、成绩与教学的详细评价，并可投票标记是否有用 | ✅ |
| 👨‍🏫 **讲师评价** | 按授课形式（讲课／辅导）分别呈现各讲师评分 | ✅ |
| 📊 **交互式成绩图表** | 以柱状图、堆叠图、箱形图呈现成绩分布（ECharts），附累积百分比线、GPA 与 N/A 切换 | ✅ |
| 📄 **历届试题** | 按学年与讲师浏览、排序、筛选历届试题，并支持多选批量 ZIP 下载 | ✅ |
| 📑 **课程大纲** | 直接在课程页面查看最新课程大纲 | ✅ |
| ⭐ **收藏** | 收藏喜爱的课程与讲师以便快速访问 | ✅ |
| 🔍 **智能搜索** | 快速搜索课程与讲师，并支持讲师昵称匹配 | ✅ |
| 🏛️ **学院与学系徽章** | 支持课程与讲师的多学系标示 | ✅ |
| 🔐 **学生验证** | 岭南邮箱验证、Google OAuth 与 reCAPTCHA 防护 | ✅ |
| 🌐 **多语言支持** | 英文、繁体中文、简体中文 | ✅ |
| 📈 **个人统计** | 个人仪表板，呈现你的评价记录与获得的票数 | ✅ |
| 📱 **PWA 与响应式** | 可安装的渐进式网页应用，适配各种屏幕尺寸 | ✅ |
| 🌙 **主题切换** | 深色／浅色主题无缝切换 | ✅ |

</div>

---

## 🛠️ 技术架构

<div align="center">

### 🏗️ 技术栈

<div align="center">

| 类别 | 技术 | 版本 | 用途 |
|:-----|:-----|:-----|:-----|
| **🎨 前端** | React | 18.3.1 | UI 框架 |
| | TypeScript | 5.5.3 | 类型安全 |
| | Vite | 7.0.0 | 构建工具 |
| | Tailwind CSS | 3.4.17 | 样式设计 |
| | shadcn/ui · Radix UI | 最新 | UI 组件 |
| | ECharts | 5.6.0 | 数据可视化与图表 |
| | React Router | 6.26.2 | 路由 |
| | TanStack Query | 5.56.2 | 数据获取与缓存 |
| | Zod | 3.23.8 | 结构验证 |
| **🔧 后端** | Appwrite | 19.0.0 | BaaS（认证、TablesDB、存储、函数） |
| | Resend | - | 事务型邮件 |
| | Google reCAPTCHA v3 | - | 机器人防护 |
| **📦 工具** | Bun | 最新 | 包管理器与运行时 |
| | ESLint | 最新 | 代码检查 |
| | PostCSS | 最新 | CSS 处理 |
| | 自研 i18n | - | 国际化 |

</div>

```mermaid
graph TD
    subgraph "🎨 前端技术栈"
        A[React 18.3.1]
        B[TypeScript 5.5.3]
        C[Vite 7.0.0]
        D[Tailwind CSS]
        E[shadcn/ui]
    end
    
    subgraph "🔧 后端服务"
        F[Appwrite 19.0.0]
        G[Resend 邮件]
        H[认证与 TablesDB]
    end
    
    subgraph "📦 开发工具"
        I[ESLint]
        J[PostCSS]
        K[国际化]
    end
    
    style A fill:#61dafb
    style B fill:#3178c6
    style C fill:#646cff
    style D fill:#06b6d4
    style E fill:#000000
    style F fill:#fd366e
    style G fill:#ea4335
    style H fill:#4285f4
    style I fill:#4b32c3
    style J fill:#dd3a0a
    style K fill:#009688
```

### 🏛️ 项目架构

```mermaid
graph TD
    A[🏠 lingubible] --> B[📁 src]
    A --> C[📚 docs]
    A --> D[🛠️ tools]
    A --> E[🌐 public]
    A --> F[⚙️ functions]
    
    B --> B1[🧩 components]
    B --> B2[📄 pages]
    B --> B3[🔧 services]
    B --> B4[🎣 hooks]
    B --> B5[🛠️ utils]
    B --> B6[📝 types]
    
    B1 --> B1A[auth]
    B1 --> B1B[layout]
    B1 --> B1C[user]
    B1 --> B1D[common]
    B1 --> B1E[features]
    B1 --> B1F[ui]
    
    B2 --> B2A[auth]
    B2 --> B2B[user]
    B2 --> B2D[legal]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
```

<div align="center">

### 📂 目录结构概览

| 目录 | 用途 | 主要组件 |
|:-----|:-----|:---------|
| **📁 src/** | 源代码 | 主要应用程序代码 |
| **├── 🧩 components/** | React 组件 | UI 构建块 |
| **├── 📄 pages/** | 页面组件 | 路由级组件 |
| **├── 🔧 services/** | API 服务 | 外部服务集成 |
| **├── 🎣 hooks/** | 自定义 Hooks | 可重用的 React 逻辑 |
| **├── 🛠️ utils/** | 工具函数 | 辅助函数和常量 |
| **└── 📝 types/** | TypeScript 类型 | 类型定义 |
| **📚 docs/** | 文档 | 项目文档 |
| **🛠️ tools/** | 开发工具 | 构建脚本和工具 |
| **🌐 public/** | 静态资源 | 图片、图标、清单 |
| **⚙️ functions/** | 云函数 | 无服务器函数 |

</div>

</div>

---

## ⚡ 性能与优化

<div align="center">

LingUBible 经过调校，在 Appwrite 基础架构上保持快速且流畅的体验。

</div>

- **🧩 代码分割** — vendor、UI、图表与语言代码拆分为独立 chunk，让初始加载更精简，较少用到的代码按需加载。
- **🗂️ 被动多层缓存** — 以内存 + `localStorage` 写穿式 TTL 缓存支撑繁重的汇总读取（授课记录、学期／语言统计），重访即时呈现且不进行任何后台轮询。
- **🔤 字体子集化** — 在构建时对 LXGW 文楷 CJK 字体做子集化，仅内嵌实际使用到的字符。
- **🌍 语言延迟加载** — 每个语言包仅在选用时才动态加载。
- **⚡ Bun + Vite 7** — 安装快速、开发启动近乎即时，热模块替换（HMR）反应灵敏。

---

## 🚀 快速开始

### 📋 系统要求

- **Node.js**: >= 20.19.0（Vite 7 所需）
- **bun**: >= 1.0.0（快速的 JavaScript 运行时与包管理器）
- **Git**: 最新版本

### ⚡ 为什么选择 Bun？

我们从 npm 迁移到 **Bun** 以提升开发体验：

- 🚀 **闪电般快速**: 包安装速度比 npm 快达 25 倍
- 🔧 **一体化工具**: 运行时、打包器、测试运行器和包管理器
- 📦 **无缝替换**: 与 npm 包和脚本完全兼容
- 🛡️ **内置安全性**: 自动锁定文件验证
- 💾 **高效缓存**: 智能依赖缓存减少安装时间

### ⚡ 快速安装

```bash
# 1️⃣ 克隆项目
git clone https://github.com/ansonlo-dev/LingUBible.git
cd LingUBible

# 2️⃣ 安装依赖
bun install
# 快速且可靠的包管理器

# 3️⃣ 环境配置
cp env.example .env.local

# 4️⃣ 启动开发服务器
bun run dev
# 闪电般快速的开发体验
```

### 🔧 环境配置

<details>
<summary>📝 点击查看详细配置步骤</summary>

1. **复制环境变量模板**
   ```bash
   cp env.example .env.local
   ```

2. **配置必要的环境变量**
   ```env
   # 前端（Appwrite 客户端）
   VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id

   # 前端（Google reCAPTCHA v3 — 公开网站密钥）
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

   # 开发模式：允许任何邮箱注册（生产环境切勿开启）
   VITE_DEV_MODE=false

   # 服务器端／云函数（请妥善保密）
   APPWRITE_API_KEY=your_appwrite_api_key
   RESEND_API_KEY=your_resend_api_key
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   ```

3. **参考详细设置指南**
   - [📖 设置指南](setup/)
   - [🔑 环境变量](setup/ENVIRONMENT_VARIABLES_SETUP.md)
   - [🎓 学生邮箱验证](setup/STUDENT_EMAIL_VERIFICATION_SETUP.md)
   - [🛡️ reCAPTCHA 设置](../setup/RECAPTCHA_SETUP.md)

</details>

### 🎯 可用脚本

```bash
# 🚀 开发
bun run dev              # 启动开发服务器（:8080，已启用 --host）
bun run build            # 生产构建（输出：dist/）
bun run build:fast       # 生产构建，跳过字体子集化
bun run preview          # 预览生产构建

# 🔍 代码质量
bun run lint             # ESLint
bun run refactor:check   # 构建 + 健全性检查（“我有没有改坏？”）

# ☁️ 后端
bun run deploy:functions # 部署 Appwrite 云函数

# 🔤 字体与工具
bun run fonts:rebuild    # 重新对 LXGW 文楷字体做子集化
bun run project:structure # 打印 src/ 目录树
```

> **部署：** 前端通过 Appwrite ↔ GitHub 集成自动部署至 **Appwrite Sites**——推送到 `main` 即触发构建。云函数则以 `bun run deploy:functions` 另行部署。

---

## 🌍 语言 / Language

<div align="center">

| 语言 | README | 文档 | 状态 |
|:---:|:---:|:---:|:---:|
| **English** | [README.md](../../README.md) | [Documentation](../) | ✅ 完整 |
| **繁體中文** | [README.md](../zh-TW/README.md) | [文檔](../zh-TW/) | ✅ 完整 |
| **简体中文** | [README.md](README.md) | [文档](./) | ✅ 完整 |

</div>

---

## 📖 文档导航

<div align="center">

### 📚 完整文档结构

| 类别 | 内容 | 链接 |
|:---:|:---|:---:|
| 🔧 **设置指南** | 环境变量、开发模式、邮箱验证、reCAPTCHA | [📖 Setup](setup/) |
| ⚡ **功能说明** | 头像系统、多语言实现、邮件模板、安全性 | [📖 Features](features/) |
| 🚀 **部署指南** | Appwrite Sites Git 部署 | [📖 Deployment](deployment/) |
| 🛠️ **开发文档** | 项目结构、Bun-only 设置、函数分析 | [📖 Development](../development/) |

</div>

---

## 🤝 贡献

<div align="center">

### 🌟 欢迎参与贡献！

我们欢迎所有形式的贡献，无论是代码、文档、设计还是想法分享。

[![Contributors](https://contrib.rocks/image?repo=ansonlo-dev/LingUBible)](https://github.com/ansonlo-dev/LingUBible/graphs/contributors)

</div>

### 📝 贡献指南

1. **🍴 Fork 项目**
2. **🌿 创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **💾 提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **📤 推送到分支** (`git push origin feature/AmazingFeature`)
5. **🔄 创建 Pull Request**

### 📋 贡献类型

- 🐛 **Bug 修复** - 帮助我们修复问题
- ✨ **新功能** - 添加有用的新功能
- 📝 **文档改进** - 完善项目文档
- 🎨 **UI/UX 改进** - 提升用户体验
- 🌍 **翻译** - 支持更多语言
- 🧪 **测试** - 增加测试覆盖率

### 📖 详细指南

- [📖 贡献指南](../CONTRIBUTING.md)

---

## 📊 项目统计

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/ansonlo-dev/LingUBible?style=social)
![GitHub forks](https://img.shields.io/github/forks/ansonlo-dev/LingUBible?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/ansonlo-dev/LingUBible?style=social)

![GitHub issues](https://img.shields.io/github/issues/ansonlo-dev/LingUBible?style=flat-square)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ansonlo-dev/LingUBible?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/ansonlo-dev/LingUBible?style=flat-square)

![GitHub code size](https://img.shields.io/github/languages/code-size/ansonlo-dev/LingUBible?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/ansonlo-dev/LingUBible?style=flat-square)

</div>

---

## ❤️ 支持这个项目

<div align="center">

### 🌟 帮助我们让 LingUBible 持续成长！

如果您觉得 **LingUBible** 对您的学习之路有所帮助，请考虑支持我们的开发工作。您的支持帮助我们：

- 🚀 **新增功能** - 持续改进平台
- 🐛 **修复错误** - 维持稳定的使用体验
- 🌍 **扩展语言支持** - 服务更多学生
- 📱 **提升性能** - 优化用户体验
- 🎨 **改善界面** - 打造更美观的界面

### ☕ 请我们喝杯咖啡

<a href="https://ko-fi.com/lingubible" target="_blank">
  <img src="https://cdn.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me A Coffee" height="50" width="210">
</a>

**每一份贡献，无论多小，都意义重大！🙏**

[![Ko-fi](https://img.shields.io/badge/支持我们-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/lingubible)

### 🎯 其他支持方式

- ⭐ **为此仓库点星** - 帮助其他人发现 LingUBible
- 🐛 **报告错误** - 帮助我们改进平台
- 💡 **建议功能** - 与我们分享您的想法
- 📝 **贡献代码** - 加入我们的开发团队
- 🌍 **推广宣传** - 告诉您的朋友关于 LingUBible

</div>

---

## 🏆 致谢

<div align="center">

### 💝 特别感谢

**📚 LingUBible** 的成功离不开以下支持：

| 类别 | 感谢对象 |
|:---:|:---|
| 🛠️ **技术支持** | React、TypeScript、Vite、Tailwind CSS、Appwrite 等开源项目 |
| 🎨 **设计灵感** | shadcn/ui、Radix UI、Lucide Icons 等设计系统 |
| 🌍 **社区支持** | GitHub、Stack Overflow、Reddit 等开发者社区 |
| 🎓 **用户反馈** | 岭南大学学生社群的宝贵意见和建议 |
| ❤️ **开发团队** | 所有贡献者和维护者的辛勤付出 |

### 🌟 开源精神

本项目秉承开源精神，致力于：
- 📖 **知识共享** - 分享技术经验和最佳实践
- 🤝 **社区协作** - 欢迎所有人参与和贡献
- 🚀 **持续改进** - 不断优化和完善功能
- 🌍 **服务社会** - 为教育事业贡献力量

</div>

---

## 📄 许可证

<div align="center">

**📜 MIT 许可证**

本项目采用 [MIT License](../../LICENSE) 开源协议

```
Copyright (c) 2026 LingUBible

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

</div>

---

<div align="center">

### 🚀 让我们一起打造更好的学习环境！

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

[![GitHub stars](https://img.shields.io/github/stars/ansonlo-dev/LingUBible?style=for-the-badge&logo=github)](https://github.com/ansonlo-dev/LingUBible/stargazers)

---

**🔗 相关链接**

[🌐 官方网站](https://lingubible.com) • 
[📧 联系我们](mailto:contact@ansonlo.dev) • 
[💬 讨论区](https://github.com/ansonlo-dev/LingUBible/discussions) • 
[🐛 问题报告](https://github.com/ansonlo-dev/LingUBible/issues)

---

**⚠️ 免责声明**

本网站与岭南大学无任何官方关联。所有评价和意见均为用户个人观点，不代表岭南大学立场。

---

*Built with ❤️ by [ansonlo.dev](https://ansonlo.dev) | Powered by Open Source*

</div> 