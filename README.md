# BlueWorld-Web

BlueWorld 项目官网 / Project site — 双语（EN / 中文）研究展示站点。

功能总览 / Feature set:

- **Landing 首屏**：7 路环视画面同步播放，在同一时间轴上自然叠加切换 `GT` → `HDMap` → `Pred`
- **i18n 双语**：英文 / 中文一键切换，选择持久化（localStorage），`data-i18n` 驱动全部文案
- **导航**：吸顶 header、滚动进度条、当前小节高亮（scroll-spy）、移动端抽屉菜单
- **00 Overview**：进展卡片 + 应用入口卡片
- **01 Model & Data**：可交互架构图（4 种条件注入路径可选切换）+ 技术要点列表
- **02 Control**：3 个标签页（车道 / 路标 / 红绿灯），自动轮播，自定义播放器（播放/暂停、倍速、进度、逐帧、全屏、循环）
- **天气变换**：Snow / Rain / Fog / Night / Dusk 五种模式，14 路独立视频同步播放，7 个机位按环视 3×3 布局排列，通过同步竖线叠加比较 GT 与天气预测
- **03 Scene Grounding**：参考图 / 3DGS / 点云 三组画廊，含 condition vs generated 对比查看器
- **04 Post-training**：长时程生成对比（sf / csf）+ 交互式 RL 演示（canvas 键盘/按钮控制的小型驾驶仿真）
- **05 Applications**：行车记录仪数据生产演示 + 闭环仿真（视频与 BEV 轨迹画布同步播放）
- **06 Resources**：报告卡片、资源链接、相关工作、BibTeX 引用（一键复制）
- **全局**：亮 / 暗主题、reveal 滚动显现动画、图片灯箱、`prefers-reduced-motion` 支持、媒体缓存 Service Worker、无 JS 降级提示

## 开发 / Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 占位媒体 / Placeholder media

`public/media/` 下的所有视频均为**本地生成的演示占位**（`npm run media` 可重新生成，需要 ffmpeg）。
替换真实素材时保持文件名不变，直接覆盖即可。媒体清单见 `src/data.js`。

## 目录结构 / Structure

```
├── index.html              # 页面骨架（各 section 均为挂载点）
├── public/
│   ├── blueworld-logo.svg
│   ├── blueworld-symbol.svg
│   ├── media/…             # 占位视频、天气视频、海报图与 BEV 轨迹
│   └── media-cache.js       # 媒体缓存 Service Worker
├── scripts/
│   └── generate-media.sh    # 占位媒体生成脚本（ffmpeg）
└── src/
    ├── main.js             # 启动入口
    ├── i18n.js             # 全部文案（EN/ZH）+ i18n 引擎
    ├── data.js             # 媒体清单 / 章节配置
    ├── styles/…            # 样式
    └── modules/…           # 各 section 的交互模块
```

文案修改：`src/i18n.js`；媒体与结构配置：`src/data.js`。

## 部署 / Deploy

`npm run build` 后将 `dist/` 发布到任意静态托管（GitHub Pages / Vercel / Nginx）均可。
