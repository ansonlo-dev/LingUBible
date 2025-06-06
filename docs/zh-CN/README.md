<div align="center">

![LingUBible Logo](../../assets/logo-banner.svg)

# 📚 LingUBible

### *让每一个评价，成为学习路上的明灯*

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](../../README.md)
[![繁體中文](https://img.shields.io/badge/Language-繁體中文-red?style=for-the-badge)](../zh-TW/README.md)
[![简体中文](https://img.shields.io/badge/Language-简体中文-green?style=for-the-badge)](README.md)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-18.1.1-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/ansonlo/campus-comment-verse/graphs/commit-activity)

---

**🌟 一个专为岭南大学学生打造的课程与讲师评价平台**

*帮助同学们做出明智的学术选择，分享真实的学习体验*

[🚀 立即体验](#-快速开始) • [📖 查看文档](./) • [🤝 参与贡献](#-贡献) • [🌍 多语言支持](#-语言--language)

</div>

---

## 📸 项目预览

<div align="center">

### 🎨 现代化界面设计
*响应式设计，支持深色/浅色主题*

| 🌅 浅色主题 | 🌙 深色主题 |
|:---:|:---:|
| ![Light Theme](https://via.placeholder.com/400x250/f8fafc/64748b?text=Light+Theme+Preview) | ![Dark Theme](https://via.placeholder.com/400x250/0f172a/e2e8f0?text=Dark+Theme+Preview) |

### 📱 多设备支持
*桌面、平板、手机完美适配*

![Responsive Design](https://via.placeholder.com/800x200/3b82f6/ffffff?text=Responsive+Design+%7C+Desktop+%7C+Tablet+%7C+Mobile)

### 🎯 核心功能展示

<table>
<tr>
<td align="center" width="25%">
<img src="https://via.placeholder.com/200x150/3b82f6/ffffff?text=📝+Course+Reviews" alt="Course Reviews"/>
<br><strong>课程评价</strong>
</td>
<td align="center" width="25%">
<img src="https://via.placeholder.com/200x150/10b981/ffffff?text=👨‍🏫+Lecturer+Ratings" alt="Lecturer Ratings"/>
<br><strong>讲师评分</strong>
</td>
<td align="center" width="25%">
<img src="https://via.placeholder.com/200x150/f59e0b/ffffff?text=🔍+Smart+Search" alt="Smart Search"/>
<br><strong>智能搜索</strong>
</td>
<td align="center" width="25%">
<img src="https://via.placeholder.com/200x150/8b5cf6/ffffff?text=🌐+Multilingual" alt="Multilingual"/>
<br><strong>多语言支持</strong>
</td>
</tr>
</table>

</div>

---

## ✨ 核心功能

<div align="center">

| 功能 | 描述 | 状态 |
|:---:|:---|:---:|
| 📝 **课程评价** | 分享详细的课程学习体验和建议 | ✅ |
| 👨‍🏫 **讲师评分** | 评价教学质量和教学风格 | ✅ |
| 🔍 **智能搜索** | 快速找到课程和讲师信息 | ✅ |
| 🔐 **安全认证** | 学生邮箱验证系统 | ✅ |
| 🌐 **多语言支持** | 英文、繁体中文、简体中文 | ✅ |
| 📱 **响应式设计** | 支持所有设备和屏幕尺寸 | ✅ |
| 🎨 **现代化 UI** | 美观直观的用户界面 | ✅ |
| 🌙 **主题切换** | 深色/浅色主题自由切换 | ✅ |
| 📊 **数据统计** | 个人评价统计和成就系统 | ✅ |
| 🔔 **实时通知** | 重要更新和互动提醒 | ✅ |

</div>

---

## 🛠️ 技术架构

<div align="center">

### 🏗️ 技术栈

```mermaid
graph TB
    A[🎨 前端] --> B[⚛️ React 18.3.1]
    A --> C[📘 TypeScript 5.5.3]
    A --> D[⚡ Vite 5.4.1]
    A --> E[🎨 Tailwind CSS 3.4.17]
    A --> F[🧩 shadcn/ui]
    
    G[🔧 后端] --> H[🚀 Appwrite 18.1.1]
    G --> I[📧 邮件服务]
    G --> J[🔐 身份认证]
    
    K[📦 工具] --> L[📝 ESLint]
    K --> M[🔧 PostCSS]
    K --> N[📱 PWA 支持]
    K --> O[🌍 国际化]
```

### 🏛️ 项目架构

```
lingubible/
├── src/                       # 源代码
│   ├── components/            # React 组件
│   ├── pages/                 # 页面组件
│   ├── services/              # API 服务
│   ├── hooks/                 # 自定义 Hooks
│   ├── utils/                 # 工具函数
│   └── types/                 # TypeScript 类型
├── docs/                      # 项目文档
├── tools/                     # 开发工具
├── public/                    # 静态资源
└── functions/                 # 云函数
```

### 📊 性能指标

<table align="center">
<tr>
<td align="center">
<img src="https://img.shields.io/badge/Lighthouse-100-brightgreen?style=flat-square&logo=lighthouse" alt="Lighthouse Score"/>
<br><strong>性能评分</strong>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Bundle_Size-<500KB-blue?style=flat-square" alt="Bundle Size"/>
<br><strong>打包大小</strong>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Load_Time-<2s-green?style=flat-square" alt="Load Time"/>
<br><strong>加载时间</strong>
</td>
<td align="center">
<img src="https://img.shields.io/badge/PWA-Ready-purple?style=flat-square" alt="PWA Ready"/>
<br><strong>PWA 支持</strong>
</td>
</tr>
</table>

</div>

---

## 🚀 快速开始

### 📋 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **Git**: 最新版本

### ⚡ 快速安装

```bash
# 1️⃣ 克隆项目
git clone https://github.com/ansonlo/campus-comment-verse.git
cd campus-comment-verse

# 2️⃣ 安装依赖
npm install
# 或使用 yarn
yarn install

# 3️⃣ 环境配置
cp env.example .env.local

# 4️⃣ 启动开发服务器
npm run dev
# 或使用 yarn
yarn dev
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
   # Appwrite 配置
   VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   
   # 邮件服务配置
   VITE_EMAIL_SERVICE_ID=your_email_service_id
   
   # 其他配置...
   ```

3. **参考详细设置指南**
   - [📖 完整设置指南](setup/)
   - [🔐 认证配置](setup/authentication.md)
   - [📧 邮件服务设置](setup/email-service.md)

</details>

### 🎯 可用脚本

```bash
# 🚀 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 🔍 代码质量
npm run lint             # 代码检查
npm run refactor:check   # 重构检查

# 📚 文档
npm run docs:structure   # 查看文档结构
npm run project:structure # 查看项目结构

# 🛠️ 工具
npm run docs:setup       # 设置多语言文档
npm run refactor:update-imports # 更新导入路径
npm run readme:generate-assets  # 生成 README 资产
```

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
| 🔧 **设置指南** | 环境配置、依赖安装、部署设置 | [📖 Setup](setup/) |
| ⚡ **功能说明** | 核心功能、API 使用、组件介绍 | [📖 Features](features/) |
| 🚀 **部署指南** | 生产部署、CI/CD、性能优化 | [📖 Deployment](deployment/) |
| 🧪 **测试文档** | 单元测试、集成测试、E2E 测试 | [📖 Testing](testing/) |
| 🛠️ **开发文档** | 架构设计、重构记录、开发规范 | [📖 Development](development/) |

</div>

---

## 🤝 贡献

<div align="center">

### 🌟 欢迎参与贡献！

我们欢迎所有形式的贡献，无论是代码、文档、设计还是想法分享。

[![Contributors](https://contrib.rocks/image?repo=ansonlo/campus-comment-verse)](https://github.com/ansonlo/campus-comment-verse/graphs/contributors)

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

- [Contributing Guide (English)](../CONTRIBUTING.md)
- [貢獻指南 (繁體中文)](../zh-TW/CONTRIBUTING.md)
- [贡献指南 (简体中文)](CONTRIBUTING.md)

---

## 📊 项目统计

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/ansonlo/campus-comment-verse?style=social)
![GitHub forks](https://img.shields.io/github/forks/ansonlo/campus-comment-verse?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/ansonlo/campus-comment-verse?style=social)

![GitHub issues](https://img.shields.io/github/issues/ansonlo/campus-comment-verse?style=flat-square)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ansonlo/campus-comment-verse?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/ansonlo/campus-comment-verse?style=flat-square)

![Lines of code](https://img.shields.io/tokei/lines/github/ansonlo/campus-comment-verse?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/ansonlo/campus-comment-verse?style=flat-square)

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
Copyright (c) 2024 LingUBible

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

[![GitHub stars](https://img.shields.io/github/stars/ansonlo/campus-comment-verse?style=for-the-badge&logo=github)](https://github.com/ansonlo/campus-comment-verse/stargazers)

---

**🔗 相关链接**

[🌐 官方网站](https://lingubible.vercel.app) • 
[📧 联系我们](mailto:contact@ansonlo.dev) • 
[💬 讨论区](https://github.com/ansonlo/campus-comment-verse/discussions) • 
[🐛 问题报告](https://github.com/ansonlo/campus-comment-verse/issues)

---

**⚠️ 免责声明**

本网站与岭南大学无任何官方关联。所有评价和意见均为用户个人观点，不代表岭南大学立场。

---

*Built with ❤️ by [ansonlo.dev](https://ansonlo.dev) | Powered by Open Source*

</div> 