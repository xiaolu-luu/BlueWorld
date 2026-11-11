/**
 * Site data: media manifests, section configuration, report metadata.
 * All paths are relative to the site root (files live under public/).
 */

export const REPORT = {
  title: 'BlueWorld: Building Controllable Virtual Cities with World Models',
  arxivId: '2611.00596',
  url: 'https://arxiv.org/abs/2611.00596',
  meta: 'arXiv:2611.00596 · placeholder link — update in src/data.js',
  isDraft: true,
  bibtex: `@article{blueworld2026,
  title   = {BlueWorld: Building Controllable Virtual Cities with World Models},
  author  = {BlueWorld Team},
  journal = {arXiv preprint arXiv:2611.00596},
  year    = {2026}
}`,
};

/** Landing: one source video, seven crops. x/y/w/h are in source-video pixels (1280x720 placeholders). */
export const LANDING = {
  openingSrc: 'media/landing/opening.mp4',
  src: 'media/landing/synchronized.mp4',
  views: [
    { id: 1, side: 'main', poster: 'media/landing/view-01.jpg', crop: [120, 0, 640, 720] },
    { id: 2, side: 'a', poster: 'media/landing/view-02.jpg', crop: [760, 0, 400, 300] },
    { id: 3, side: 'b', poster: 'media/landing/view-03.jpg', crop: [760, 210, 400, 300] },
    { id: 4, side: 'c', poster: 'media/landing/view-04.jpg', crop: [760, 420, 400, 300] },
    { id: 5, side: 'd', poster: 'media/landing/view-05.jpg', crop: [0, 0, 200, 360] },
    { id: 6, side: 'e', poster: 'media/landing/view-06.jpg', crop: [0, 360, 200, 360] },
    { id: 7, side: 'f', poster: 'media/landing/view-07.jpg', crop: [120, 700, 300, 100] },
  ],
};

/** 02 Control: one clip per control signal. */
export const CONTROL_ITEMS = [
  { controlType: 'lane', src: 'media/control/lane.mp4', poster: 'media/control/lane.jpg', isReference: true },
  { controlType: 'road_marker', src: 'media/control/road_marker.mp4', poster: 'media/control/road_marker.jpg', isReference: true },
  { controlType: 'traffic_light', src: 'media/control/traffic_light.mp4', poster: 'media/control/traffic_light.jpg', isReference: true },
];

/** 03 Grounding groups. */
export const GROUNDING_CAMS = [0, 2, 3, 4, 5, 6, 7]; // camera 1 is the dashcam itself
export const GROUNDING_SCENES = [
  { id: 'G150', base: 'media/G150' },
  { id: 'G293', base: 'media/G293' },
  { id: 'G387', base: 'media/G387' },
];
export const GROUNDING_3DGS = [
  { id: '3dgs-01', src: 'media/grounding/3dgs/demo-01.mp4', titleKey: 'grounding.condition' },
  { id: '3dgs-02', src: 'media/grounding/3dgs/demo-02.mp4', titleKey: 'grounding.generated' },
  { id: '3dgs-04', src: 'media/grounding/3dgs/demo-04.mp4', titleKey: 'grounding.generated' },
];

/** 04 Post-training: long-horizon sf vs csf pairs. */
export const LONG_ITEMS = [
  { id: 'V058', sf: 'media/V058-sf.mp4', csf: 'media/V058-csf.mp4' },
  { id: 'V121', sf: 'media/V121-sf.mp4', csf: 'media/V121-csf.mp4' },
  { id: 'V126', sf: 'media/V126-sf.mp4', csf: 'media/V126-csf.mp4' },
];

/** 04 Post-training: RL interactive demo (keyboard steering, built in-page). */
export const RL_DEMO = {
  fps: 60,
  roadLength: 2400,
  agents: 10,
};

/** 05 Applications: dashcam production demo. */
export const DASHCAM = {
  src: 'media/dashcam/sample_3_3_pred_rank3.mp4',
  poster: 'media/dashcam/sample_3_3_pred_rank3.jpg',
  stats: { frames: 312, views: 7, score: '0.83' },
};

/** 05 Applications: closed-loop episode — clip + BEV trajectories. */
export const CLOSED_LOOP = {
  clip: 'media/interaction/avoidance.mp4',
  poster: 'media/interaction/avoidance.jpg',
  bev: 'media/interaction/bev.json',
};

/** Resource links (code / models / dataset). */
export const RESOURCE_LINKS = [
  { key: 'code', href: null },
  { key: 'models', href: null },
  { key: 'dataset', href: null },
];

/** Related work — placeholders pointing at the project's own report section anchors. */
export const RELATED = [
  { title: 'X-World 1.0 — city-scale world models', href: 'https://arxiv.org/abs/2611.00596', src: 'arXiv' },
  { title: 'Multi-view video diffusion baselines', href: '#method', src: 'on this page' },
  { title: 'BEV trajectory dataset', href: '#closed-loop', src: 'on this page' },
];

/** Flags controlling global behaviour. */
export const FLAGS = {
  showReferenceBadges: true,
  showPlaceholderNotes: true,
  registerMediaCacheWorker: true,
};

/** Every media URL the site uses — the media-cache service worker precaches this list. */
export function allMediaUrls() {
  const urls = new Set([
    LANDING.openingSrc,
    LANDING.src,
    ...LANDING.views.map((v) => v.poster),
    ...CONTROL_ITEMS.map((c) => c.src),
    ...GROUNDING_3DGS.map((c) => c.src),
    ...DASHCAM.src ? [DASHCAM.src, DASHCAM.poster] : [],
    CLOSED_LOOP.clip,
    CLOSED_LOOP.poster,
    CLOSED_LOOP.bev,
  ]);
  for (const scene of GROUNDING_SCENES) {
    for (const cam of GROUNDING_CAMS) {
      urls.add(`${scene.base}/condition_cam${cam}.mp4`);
      urls.add(`${scene.base}/generated_cam${cam}.mp4`);
    }
  }
  for (const item of LONG_ITEMS) {
    urls.add(item.sf);
    urls.add(item.csf);
  }
  return [...urls];
}
