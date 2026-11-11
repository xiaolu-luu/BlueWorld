/**
 * i18n — all site copy lives here, in English and Simplified Chinese.
 * Placeholders {like_this} are filled per use-site via t('key', { ... }).
 */

export const DICT = {
  en: {
    a11y: {
      skip: 'Skip to content',
      mainNav: 'Main navigation',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      langSwitch: 'Language',
      toEnglish: 'Switch to English',
      toChinese: 'Switch to Chinese',
      progress: 'Reading progress',
    },
    theme: { label: 'Appearance' },
    nav: {
      overview: 'Overview',
      method: 'Model & Data',
      advances: 'Advances',
      control: 'Control & Consistency',
      grounding: 'Scene Grounding',
      posttraining: 'Long-Horizon & RL',
      apps: 'Applications',
      resources: 'Resources',
    },
    landing: {
      eyebrow: 'Technical report · Demo site',
      worldTitle: 'One scene, seven views',
      worldLede: 'A single generative model renders the same street from seven cameras at once — synchronized in time and consistent in space.',
      tagline: 'Building controllable virtual cities with world models — placeholder copy for the BlueWorld project page.',
      explore: 'Explore the demos',
      synchronized: '7 views · synchronized',
      scroll: 'Scroll',
      loadError: 'The landing videos could not be loaded. The demos below still work — jump straight to a section.',
      viewLabel: 'Camera view {n}',
    },
    hero: {
      ctaReport: 'Read the report',
      ctaDemos: 'Watch the demos',
    },
    overview: {
      eyebrow: 'Overview',
      title: 'What this page demonstrates',
      lede: 'BlueWorld is a placeholder research-project site. Each section below hosts one interactive demo: replace the copy in src/i18n.js and the media in public/media/ to make it yours.',
      dev1Title: 'Controllable generation',
      dev1Body: 'Steer what the model renders — lane changes, road furniture, traffic lights — while every camera stays consistent.',
      dev2Title: 'Scene grounding',
      dev2Body: 'Ground rollouts in real evidence: reference frames, 3DGS reconstructions or point clouds from the target route.',
      dev3Title: 'Long-horizon & RL',
      dev3Body: 'Extend rollouts far past the training horizon and post-train policies inside the simulator with RL.',
      appsTitle: 'Applications',
      dashcamTitle: 'Dashcam data production',
      dashcamBody: 'Turn fleet footage into annotated, multi-view training data with predicted 3D layout.',
      closedLoopTitle: 'Closed-loop simulation',
      closedLoopBody: 'Drop a planner into the generated city and train or evaluate it against reactive agents.',
    },
    method: {
      eyebrow: 'Model & Data',
      title: 'One backbone, several ways in',
      lede: 'The figure below sketches the conditioning routes. Pick a route to see where the evidence enters the denoising stack.',
      archTitle: 'Architecture at a glance',
      routes: {
        dashcam: 'Dashcam route',
        reference: 'Reference frames',
        threeDGS: '3DGS renders',
        pointcloud: 'Point cloud',
      },
      fig: {
        sceneEvidence: 'Scene evidence',
        conditioning: 'Conditioning interface',
        core: 'Denoising core',
        output: 'Seven synchronized views',
        inject: 'injected at every block',
        crossView: 'cross-view attention',
        time: 'time',
        views: 'views',
        notes: {
          dashcam: 'The dashcam stream is encoded jointly with the seven target streams; the dashcam view itself is dropped before decoding.',
          reference: 'Reference frames share one reference state through joint attention; spatial alignment only — no reference timestamps.',
          threeDGS: '3DGS renders along the target trajectory provide pixel-aligned appearance; the pose offset encodes the requested motion.',
          pointcloud: 'Per latent position, depth and RGB are concatenated and projected by a shared linear layer into the token stream.',
        },
      },
      detailsTitle: 'Data & training facts',
      details: {
        views: { label: 'Synchronized views', value: '7 cameras per scene' },
        clips: { label: 'Training clips', value: 'Placeholder — see the report' },
        hours: { label: 'Raw footage', value: 'Placeholder — see the report' },
        steps: { label: 'Denoising steps', value: 'Flow matching, N steps' },
        resolution: { label: 'Latent resolution', value: 'Placeholder — see the report' },
        posttraining: { label: 'Post-training', value: 'Diffusion-RL policy tuning' },
      },
    },
    control: {
      eyebrow: 'Control & Consistency',
      title: 'Steer the rollout',
      lede: 'Three control signals, one model. Each tab plays a clip where the highlighted element changes while the rest of the scene keeps its identity.',
      tab: { lane: 'Lane change', road_marker: 'Road markers', traffic_light: 'Traffic lights' },
      caption: 'Control: {signal}',
      placeholderNote: 'All clips on this page are locally generated placeholders — swap files in public/media/ for real results.',
    },
    grounding: {
      eyebrow: 'Scene Grounding',
      title: 'Rollouts grounded in real scenes',
      lede: 'Three ways to condition a rollout on captured evidence. The same placeholder clip plays in every group until real media is added.',
      tab: {
        reference_images: 'Reference frames',
        threeDGS: '3DGS renders',
        pointcloud: 'Point cloud',
      },
      gallery: {
        reference_images: {
          summary: 'Condition on a handful of frames from a reference clip; the model completes the remaining views and time steps.',
          footnote: 'Scene: G150 · G293 · G387 — condition vs. generation, one clip per camera.',
        },
        threeDGS: {
          summary: 'A 3D Gaussian reconstruction of the route supplies appearance; rollouts stay aligned to the reconstructed geometry.',
          footnote: 'Renders from the reconstruction compared with the generated views.',
        },
        pointcloud: {
          summary: 'Sparse geometry from the target route constrains the layout of every generated view.',
          footnote: 'Condition streams carry RGB + depth at each latent position.',
        },
      },
      condition: 'Condition',
      generated: 'Generation',
      sceneLabel: 'Scene {id} · camera {cam}',
    },
    posttraining: {
      eyebrow: 'Post-training',
      title: 'Longer rollouts, sharper policies',
      lede: 'Two results of post-training: long-horizon generation that stays coherent, and RL policies that learn inside the simulator.',
    },
    long: {
      title: 'Long-horizon generation',
      lede: 'Short-form (sf) rollouts against consistency-stabilized fine-tuned (csf) ones on three held-out scenes.',
      summary: 'Left: the short-form baseline drifts after the first intersection. Right: the stabilized rollout keeps lane geometry and actor layout consistent over the same span. Placeholder clips.',
      sfLabel: 'Short-form (sf)',
      csfLabel: 'Stabilized (csf)',
      sceneLabel: 'Scene',
    },
    rl: {
      title: 'Policy learning in the loop',
      lede: 'A small interactive demo of closed-loop training: drive the ego agent with your keyboard while reactive agents share the road.',
      interactionHint: 'Use ← → (or the on-screen buttons) to steer once the demo has focus.',
      loading: 'Loading interactive demo…',
      error: 'The interactive demo could not start on this device.',
      keysHint: 'Steer',
      speed: 'Speed',
      reward: 'Reward',
      collision: 'Collisions',
      reset: 'Reset',
      pause: 'Pause',
      resume: 'Resume',
      paused: 'Paused',
    },
    applicationChapter: {
      eyebrow: 'Applications',
      title: 'From model to product',
      lede: 'Two downstream uses of the same generative city.',
    },
    dashcam: {
      title: 'Dashcam data production',
      lede: 'One dashcam stream in, seven annotated views out — with predicted 3D layout and per-frame scores.',
      chips: {
        frames: 'Frames',
        views: 'Views',
        score: 'Scene score',
        layout: '3D layout: predicted',
      },
    },
    closedLoop: {
      title: 'Closed-loop simulation & training',
      lede: 'A planner drives through generated traffic while the BEV panel replays the ground-truth trajectories of the same episode.',
      bevLabel: 'BEV trajectories',
      mapError: 'Trajectory data unavailable — playing the clip without the map.',
      episodeLabel: 'Episode: interaction avoidance',
    },
    resources: {
      eyebrow: 'Resources',
      title: 'Report, code & data',
      reportTitle: 'Technical report',
      draft: 'Draft',
      reportName: 'BlueWorld: Building Controllable Virtual Cities with World Models',
      reportMeta: 'arXiv:0000.00000 · placeholder',
      reportNote: 'The report link points at a placeholder — update it in src/data.js.',
      related: 'Related work',
      moreSoon: 'More resources will appear here as they are released.',
      cite: 'Cite',
      copy: 'Copy',
      copied: 'Copied',
      links: {
        code: 'Code',
        models: 'Models',
        dataset: 'Dataset',
        soon: 'coming soon',
      },
    },
    common: {
      placeholder: 'Placeholder',
      play: 'Play',
      pause: 'Pause',
      replay: 'Replay',
      speed: 'Speed',
      loading: 'Loading…',
      loadError: 'Could not load the media.',
      retry: 'Retry',
      readOnline: 'Read online',
      fullscreen: 'Full screen',
      exitFullscreen: 'Exit full screen',
      prevFrame: 'Previous frame',
      nextFrame: 'Next frame',
      seek: 'Seek',
    },
    footer: {
      line1: 'BlueWorld — a placeholder project site. Replace copy in src/i18n.js.',
      top: 'Back to top',
    },
    noscript: 'This page needs JavaScript to play the videos and switch languages.',
  },

  zh: {
    a11y: {
      skip: '跳到主要内容',
      mainNav: '主导航',
      menuOpen: '打开菜单',
      menuClose: '关闭菜单',
      langSwitch: '语言',
      toEnglish: '切换到英文',
      toChinese: '切换到中文',
      progress: '阅读进度',
    },
    theme: { label: '外观' },
    nav: {
      overview: '总览',
      method: '模型与数据',
      advances: '核心进展',
      control: '控制与一致性',
      grounding: '场景对齐',
      posttraining: '长时程与 RL',
      apps: '应用',
      resources: '资源',
    },
    landing: {
      eyebrow: '技术报告 · 演示站点',
      worldTitle: '一个场景，七路视角',
      worldLede: '单个生成模型同时渲染同一条街道的七个机位——时间同步、空间一致。',
      tagline: '用世界模型构建可控的虚拟城市——BlueWorld 项目页占位文案。',
      explore: '浏览演示',
      synchronized: '7 路视角 · 已同步',
      scroll: '向下滚动',
      loadError: '首屏视频加载失败。下方各演示不受影响，可直接跳转到对应章节。',
      viewLabel: '机位 {n}',
    },
    hero: {
      ctaReport: '阅读报告',
      ctaDemos: '观看演示',
    },
    overview: {
      eyebrow: '总览',
      title: '本页演示什么',
      lede: 'BlueWorld 是一个研究项目占位站点。下方每个章节承载一个交互演示：文案在 src/i18n.js，媒体在 public/media/，替换即可投入使用。',
      dev1Title: '可控生成',
      dev1Body: '控制模型渲染的内容——变道、道路设施、红绿灯——同时所有机位保持一致。',
      dev2Title: '场景对齐',
      dev2Body: '让 rollout 对齐真实证据：参考帧、3DGS 重建或目标路线的点云。',
      dev3Title: '长时程与强化学习',
      dev3Body: '把 rollout 拉长到远超训练时长，并在模拟器内用 RL 后训练策略。',
      appsTitle: '应用',
      dashcamTitle: '行车记录仪数据生产',
      dashcamBody: '把行车记录仪素材加工为带标注的多视角训练数据，并预测 3D 结构。',
      closedLoopTitle: '闭环仿真',
      closedLoopBody: '把规划器放进生成的城市中，与响应式智能体交互地训练和评估。',
    },
    method: {
      eyebrow: '模型与数据',
      title: '一个主干，多种条件入口',
      lede: '下图给出条件注入路径的示意。选择一条路径，查看证据在哪一层进入去噪网络。',
      archTitle: '架构一览',
      routes: {
        dashcam: '行车记录仪路径',
        reference: '参考帧',
        threeDGS: '3DGS 渲染',
        pointcloud: '点云',
      },
      fig: {
        sceneEvidence: '场景证据',
        conditioning: '条件接口',
        core: '去噪主干',
        output: '七路同步视角',
        inject: '逐块注入',
        crossView: '跨视角注意力',
        time: '时间',
        views: '视角',
        notes: {
          dashcam: '行车记录仪流与七路目标流联合编码；解码前丢弃记录仪本身那一路。',
          reference: '参考帧通过联合注意力共享一个参考状态；仅空间对齐，不使用参考帧时间戳。',
          threeDGS: '沿目标轨迹的 3DGS 渲染提供像素对齐的外观；位姿偏移编码期望运动。',
          pointcloud: '每个隐位置把深度与 RGB 拼接后，经共享线性层投影进 token 流。',
        },
      },
      detailsTitle: '数据与训练',
      details: {
        views: { label: '同步视角', value: '每场景 7 个机位' },
        clips: { label: '训练片段', value: '占位 — 见报告' },
        hours: { label: '原始素材', value: '占位 — 见报告' },
        steps: { label: '去噪步数', value: '流匹配，N 步' },
        resolution: { label: '隐空间分辨率', value: '占位 — 见报告' },
        posttraining: { label: '后训练', value: '扩散 RL 策略微调' },
      },
    },
    control: {
      eyebrow: '控制与一致性',
      title: '控制 rollout',
      lede: '三种控制信号，同一个模型。每个标签页播放一段视频：被控元素改变，其余场景保持一致。',
      tab: { lane: '变道', road_marker: '道路标线', traffic_light: '红绿灯' },
      caption: '控制信号：{signal}',
      placeholderNote: '本页所有视频均为本地生成的占位片段——把 public/media/ 中的文件替换为真实结果即可。',
    },
    grounding: {
      eyebrow: '场景对齐',
      title: '对齐真实场景的 rollout',
      lede: '三种方式把 rollout 条件在采集到的证据上。真实素材接入前，各组播放同一占位片段。',
      tab: {
        reference_images: '参考帧',
        threeDGS: '3DGS 渲染',
        pointcloud: '点云',
      },
      gallery: {
        reference_images: {
          summary: '以参考片段中的少量帧为条件，模型补全其余视角与时间步。',
          footnote: '场景：G150 · G293 · G387——条件 vs 生成，每个机位一段。',
        },
        threeDGS: {
          summary: '路线的 3D 高斯重建提供外观；rollout 与重建几何保持对齐。',
          footnote: '重建渲染与生成视角的对比。',
        },
        pointcloud: {
          summary: '目标路线的稀疏几何约束每个生成视角的布局。',
          footnote: '条件流在每个隐位置携带 RGB + 深度。',
        },
      },
      condition: '条件',
      generated: '生成',
      sceneLabel: '场景 {id} · 机位 {cam}',
    },
    posttraining: {
      eyebrow: '后训练',
      title: '更长的 rollout，更稳的策略',
      lede: '后训练的两项结果：保持一致性的长时程生成，以及在模拟器内学出的 RL 策略。',
    },
    long: {
      title: '长时程生成',
      lede: '在三个保留场景上对比短程（sf）rollout 与一致性稳定微调（csf）rollout。',
      summary: '左：短程基线在第一个路口后开始漂移。右：稳定后的 rollout 在相同时长内保持车道几何与交通参与者布局。占位片段。',
      sfLabel: '短程 (sf)',
      csfLabel: '稳定 (csf)',
      sceneLabel: '场景',
    },
    rl: {
      title: '闭环中的策略学习',
      lede: '一个闭环训练的小型交互演示：用键盘驾驶自车，与响应式智能体共享道路。',
      interactionHint: '演示获得焦点后，用 ← →（或屏幕按钮）转向。',
      loading: '交互演示加载中…',
      error: '当前设备无法启动交互演示。',
      keysHint: '转向',
      speed: '车速',
      reward: '奖励',
      collision: '碰撞',
      reset: '重置',
      pause: '暂停',
      resume: '继续',
      paused: '已暂停',
    },
    applicationChapter: {
      eyebrow: '应用',
      title: '从模型到产品',
      lede: '同一座生成式城市的两类下游用法。',
    },
    dashcam: {
      title: '行车记录仪数据生产',
      lede: '输入一路行车记录仪素材，输出七个带标注的视角，并给出预测的 3D 结构与逐帧评分。',
      chips: {
        frames: '帧数',
        views: '视角',
        score: '场景评分',
        layout: '3D 结构：预测',
      },
    },
    closedLoop: {
      title: '闭环仿真与训练',
      lede: '规划器在生成的交通流中行驶，BEV 面板同步回放同一条轨迹的真值。',
      bevLabel: 'BEV 轨迹',
      mapError: '轨迹数据不可用——仅播放视频。',
      episodeLabel: '片段：交互避让',
    },
    resources: {
      eyebrow: '资源',
      title: '报告、代码与数据',
      reportTitle: '技术报告',
      draft: '草稿',
      reportName: 'BlueWorld：用世界模型构建可控的虚拟城市',
      reportMeta: 'arXiv:0000.00000 · 占位',
      reportNote: '报告链接当前指向占位地址——在 src/data.js 中更新。',
      related: '相关工作',
      moreSoon: '更多资源将随发布逐步上线。',
      cite: '引用',
      copy: '复制',
      copied: '已复制',
      links: {
        code: '代码',
        models: '模型',
        dataset: '数据集',
        soon: '即将上线',
      },
    },
    common: {
      placeholder: '占位',
      play: '播放',
      pause: '暂停',
      replay: '重播',
      speed: '倍速',
      loading: '加载中…',
      loadError: '媒体加载失败。',
      retry: '重试',
      readOnline: '在线阅读',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      prevFrame: '上一帧',
      nextFrame: '下一帧',
      seek: '进度',
    },
    footer: {
      line1: 'BlueWorld——占位项目站点。文案在 src/i18n.js 中替换。',
      top: '回到顶部',
    },
    noscript: '本页需要 JavaScript 来播放视频与切换语言。',
  },
};

/* ---------- engine ---------- */

const STORAGE_KEY = 'bw.lang';
let current = 'en';
const listeners = new Set();

function normalize(lang) {
  return String(lang || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function initLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  current = saved ? normalize(saved) : normalize(navigator.language);
  return current;
}

export function getLang() {
  return current;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setLang(lang) {
  const next = normalize(lang);
  if (next === current) return;
  current = next;
  localStorage.setItem(STORAGE_KEY, current);
  applyLang();
  for (const fn of listeners) fn(current);
}

/** Resolve a dotted key against the active dictionary; returns undefined if missing. */
export function lookup(lang, key) {
  let node = DICT[lang];
  if (!node) return undefined;
  for (const part of key.split('.')) {
    node = node[part];
    if (node == null) return undefined;
  }
  return node;
}

/** Translate with {placeholder} interpolation. Missing keys fall back to EN, then the key itself. */
export function t(key, vars) {
  let str = lookup(current, key);
  if (str == null) str = lookup('en', key);
  if (str == null) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

/** Apply the active language to <html> and every data-i18n / data-i18n-attr element. */
export function applyLang() {
  const html = document.documentElement;
  html.lang = current === 'zh' ? 'zh-CN' : 'en';
  html.dataset.lang = current;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = t(el.dataset.i18n);
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const spec of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = spec.split(':').map((s) => s.trim());
      if (attr && key) {
        const value = t(key);
        if (value != null) el.setAttribute(attr, value);
      }
    }
  });

  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === current));
  });

  document.body.classList.remove('i18n-pending');
}
