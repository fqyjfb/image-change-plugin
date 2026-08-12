# 图片转换 - ToolBox 插件

支持本地图片、网络图片、SVG代码转换为PNG、ICO或Base64格式的工具。

## 功能特性

- **多种输入方式**：支持本地图片上传、网络图片URL、SVG代码输入
- **拖拽上传**：支持拖拽图片文件到上传区域
- **剪贴板粘贴**：本地图片模式下支持 Ctrl+V 粘贴剪贴板截图
- **实时预览**：上传或输入后即时预览效果
- **格式转换**：支持转换为PNG、ICO或Base64格式
- **多尺寸输出**：支持16/32/48/64/128/256px多种尺寸
- **自定义保存路径**：支持指定文件保存路径
- **Base64快捷复制**：一键复制Base64编码结果到剪贴板
- **主题适配**：自动跟随 ToolBox 应用的浅色/深色主题

## 使用方法

1. **安装**：在 ToolBox 插件商店中找到"图片转换"插件并安装
2. **选择输入方式**：
   - **本地图片**：点击上传区域、拖拽图片文件，或 Ctrl+V 粘贴剪贴板截图
   - **网络图片**：输入图片URL，按 Enter 键或点击刷新按钮加载
   - **SVG代码**：粘贴SVG代码，点击"预览SVG"或按 Ctrl/Cmd + Enter
3. **设置输出**：
   - 选择输出格式：PNG、ICO 或 Base64
   - 如选择 ICO，还需选择输出尺寸：16px ~ 256px
4. **选择保存路径**（可选）：点击文件夹图标选择保存路径
5. **转换并保存**：点击"转换并保存"按钮完成转换
   - Base64 格式会直接显示在结果区域，可点击"复制"按钮快捷复制

## 快捷键

- **本地图片**：拖拽文件到上传区域，Ctrl+V 粘贴剪贴板图片
- **网络图片**：Enter 键快速加载
- **SVG代码**：Ctrl/Cmd + Enter 快速预览

## 开发

```bash
# 安装依赖
pnpm install

# 构建插件
pnpm run build

# 构建产物位于 dist/index.js
```

## 项目结构

```
image-change-plugin/
├── src/
│   ├── index.tsx          # 入口文件
│   └── ToolPanel.tsx      # 主界面组件
├── dist/
│   └── index.js           # 构建产物（必须提交到Git）
├── .github/
│   └── workflows/
│       └── release.yml    # GitHub Actions 自动构建
├── .gitignore
├── README.md
├── build.mjs              # Vite 构建配置
├── manifest.json          # 插件元数据
├── package.json           # 依赖配置
└── tsconfig.json          # TypeScript 配置
```

## 技术栈

- React 19.x
- TypeScript 6.x
- Vite 5.x
- Tailwind CSS 3.x（CDN）
- Lucide React 1.x

## 许可证

MIT License
