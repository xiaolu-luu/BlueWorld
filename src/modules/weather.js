/** 02 Control / Weather: 14 synchronized videos behind one comparison slider. */

import { WEATHER } from '../data.js';
import { onLangChange, t } from '../i18n.js';

const SPEEDS = [1, 0.5, 2];
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const PREV_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 5v14l-9.5-7z"/></svg>';
const NEXT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 5v14l9.5-7z"/></svg>';
const FULL_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

export function initWeather() {
  const mount = document.getElementById('weather-demo');
  if (!mount) return;

  const root = document.createElement('div');
  root.className = 'weather-shell';
  root.classList.add('is-loading');
  let activeCondition =
    WEATHER.conditions.find((condition) => condition.id === WEATHER.defaultCondition) ?? WEATHER.conditions[0];

  const head = document.createElement('div');
  head.className = 'weather-toolbar';
  const conditionTabs = document.createElement('div');
  conditionTabs.className = 'weather-condition-tabs';
  conditionTabs.setAttribute('role', 'group');
  const conditionButtons = WEATHER.conditions.map((weatherCondition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'weather-condition-btn';
    button.dataset.condition = weatherCondition.id;
    button.setAttribute('aria-pressed', String(weatherCondition.id === activeCondition.id));
    conditionTabs.append(button);
    return button;
  });
  const loadState = document.createElement('span');
  loadState.className = 'weather-load-state';
  loadState.setAttribute('role', 'status');
  loadState.setAttribute('aria-live', 'polite');
  head.append(conditionTabs, loadState);

  const viewport = document.createElement('div');
  viewport.className = 'weather-viewport';
  const stage = document.createElement('div');
  stage.className = 'weather-stage';
  stage.style.setProperty('--compare', '50%');

  const gtLayer = createLayer('gt');
  const predLayer = createLayer('pred');
  const cameraLabels = document.createElement('div');
  cameraLabels.className = 'weather-camera-labels';
  const sideLabels = document.createElement('div');
  sideLabels.className = 'weather-side-labels';
  const predLabel = document.createElement('span');
  predLabel.className = 'weather-side-label weather-side-pred';
  const gtLabel = document.createElement('span');
  gtLabel.className = 'weather-side-label weather-side-gt';
  sideLabels.append(predLabel, gtLabel);

  const dividerLayer = document.createElement('div');
  dividerLayer.className = 'weather-dividers';
  const dividers = activeCondition.views.map(() => {
    const cell = document.createElement('div');
    cell.className = 'weather-divider-cell';
    const divider = document.createElement('button');
    divider.type = 'button';
    divider.className = 'weather-divider';
    divider.setAttribute('role', 'slider');
    divider.setAttribute('aria-valuemin', '0');
    divider.setAttribute('aria-valuemax', '100');
    divider.setAttribute('aria-valuenow', '50');
    cell.append(divider);
    dividerLayer.append(cell);
    return divider;
  });

  stage.append(gtLayer, predLayer, cameraLabels, sideLabels, dividerLayer);
  viewport.append(stage);

  const controls = document.createElement('div');
  controls.className = 'weather-controls';
  const playBtn = controlButton(PLAY_ICON, 'common.play');
  const prevBtn = controlButton(PREV_ICON, 'common.prevFrame');
  const nextBtn = controlButton(NEXT_ICON, 'common.nextFrame');
  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'weather-seek';
  seek.min = '0';
  seek.max = '1000';
  seek.step = '1';
  seek.value = '0';
  const time = document.createElement('span');
  time.className = 'weather-time';
  time.textContent = '0:00 / 0:00';
  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.className = 'weather-speed';
  speedBtn.textContent = '1×';
  const fullBtn = controlButton(FULL_ICON, 'common.fullscreen');
  controls.append(playBtn, prevBtn, nextBtn, seek, time, speedBtn, fullBtn);

  root.append(head, viewport, controls);
  mount.append(root);

  const gtVideos = addVideos(gtLayer, 'gt');
  const predVideos = addVideos(predLayer, 'pred');
  const videos = [...gtVideos, ...predVideos];
  const master = gtVideos[0];
  let compare = 50;
  let ready = 0;
  let metadataReady = 0;
  let failed = false;
  let speedIndex = 0;
  let syncHandle = null;
  let syncUsesVideoFrame = false;
  let sourcesLoaded = false;
  let centeredOnMobile = false;
  let resumeAfterLoad = false;

  playBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  seek.disabled = true;
  speedBtn.disabled = true;

  activeCondition.views.forEach((view) => {
    const label = document.createElement('span');
    label.dataset.cameraName = view.name;
    cameraLabels.append(label);
  });

  function createLayer(kind) {
    const layer = document.createElement('div');
    layer.className = `weather-layer weather-${kind}`;
    return layer;
  }

  function addVideos(layer, kind) {
    return activeCondition.views.map((view) => {
      const video = document.createElement('video');
      video.src = view[kind];
      video.dataset.metadataReady = 'false';
      video.dataset.dataReady = 'false';
      video.preload = 'metadata';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.tabIndex = -1;
      layer.append(video);
      return video;
    });
  }

  function controlButton(icon, labelKey) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'weather-control-btn';
    button.innerHTML = icon;
    button.dataset.labelKey = labelKey;
    return button;
  }

  function updateLoadState() {
    loadState.classList.toggle('is-error', failed);
    if (failed) loadState.textContent = t('weather.loadError');
    else if (ready === videos.length) loadState.textContent = t('weather.ready');
    else loadState.textContent = t('weather.loading', { ready, total: videos.length });
  }

  function renderCopy() {
    conditionTabs.setAttribute('aria-label', t('weather.synchronized'));
    conditionButtons.forEach((button) => {
      button.textContent = t(`weather.conditions.${button.dataset.condition}`);
    });
    predLabel.textContent = t('weather.prediction', {
      condition: t(`weather.conditions.${activeCondition.id}`),
    });
    gtLabel.textContent = t('weather.groundTruth');
    stage.setAttribute('aria-label', t('weather.compare'));
    dividers.forEach((divider, index) => {
      divider.setAttribute(
        'aria-label',
        `${t(`weather.cameras.${activeCondition.views[index].name}`)} · ${t('weather.divider')}`,
      );
    });
    seek.setAttribute('aria-label', t('common.seek'));
    speedBtn.setAttribute('aria-label', t('common.speed'));
    cameraLabels.querySelectorAll('[data-camera-name]').forEach((label) => {
      label.textContent = t(`weather.cameras.${label.dataset.cameraName}`);
    });
    updateButtonLabels();
    updateLoadState();
  }

  function updateButtonLabels() {
    playBtn.setAttribute('aria-label', t(master.paused ? 'common.play' : 'common.pause'));
    for (const button of [prevBtn, nextBtn, fullBtn]) {
      button.setAttribute('aria-label', t(button.dataset.labelKey));
    }
  }

  function setCompare(value) {
    compare = Math.max(0, Math.min(100, value));
    stage.style.setProperty('--compare', `${compare}%`);
    dividers.forEach((divider) => divider.setAttribute('aria-valuenow', String(Math.round(compare))));
  }

  function setCompareFromPointer(event, divider) {
    const rect = divider.parentElement.getBoundingClientRect();
    setCompare(((event.clientX - rect.left) / rect.width) * 100);
  }

  dividers.forEach((divider) => {
    divider.addEventListener('pointerdown', (event) => {
      divider.setPointerCapture(event.pointerId);
      setCompareFromPointer(event, divider);
    });
    divider.addEventListener('pointermove', (event) => {
      if (divider.hasPointerCapture(event.pointerId)) setCompareFromPointer(event, divider);
    });
    divider.addEventListener('dblclick', () => setCompare(50));
    divider.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 5 : 1;
      if (event.key === 'ArrowLeft') setCompare(compare - step);
      else if (event.key === 'ArrowRight') setCompare(compare + step);
      else if (event.key === 'Home') setCompare(0);
      else if (event.key === 'End') setCompare(100);
      else return;
      event.preventDefault();
    });
  });

  function fmt(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function renderTime() {
    const duration = master.duration || 0;
    time.textContent = `${fmt(master.currentTime)} / ${fmt(duration)}`;
    if (duration && !seek.matches(':active')) {
      seek.value = String(Math.round((master.currentTime / duration) * 1000));
    }
  }

  function setAllTime(nextTime) {
    const duration = master.duration || 0;
    const clamped = Math.max(0, Math.min(duration, nextTime));
    for (const video of videos) {
      if (video.readyState >= 1) video.currentTime = clamped;
    }
    renderTime();
  }

  function pauseAll() {
    for (const video of videos) video.pause();
    stopSyncLoop();
    renderPlayState();
  }

  async function playAll() {
    if (metadataReady < videos.length || failed) return;
    const target = master.currentTime;
    for (const video of videos) {
      if (Math.abs(video.currentTime - target) > 0.025) video.currentTime = target;
      video.playbackRate = SPEEDS[speedIndex];
    }
    await Promise.allSettled(videos.map((video) => video.play()));
    renderPlayState();
    startSyncLoop();
  }

  function renderPlayState() {
    const playing = !master.paused;
    root.classList.toggle('is-playing', playing);
    playBtn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    updateButtonLabels();
  }

  function syncFollowers() {
    if (master.paused) return;
    const masterTime = master.currentTime;
    const baseRate = SPEEDS[speedIndex];
    for (const video of videos.slice(1)) {
      if (video.readyState < 2) continue;
      const drift = video.currentTime - masterTime;
      if (Math.abs(drift) > 0.12) {
        video.currentTime = masterTime;
        video.playbackRate = baseRate;
      } else {
        const correction = Math.max(0.96, Math.min(1.04, 1 - drift * 0.35));
        video.playbackRate = baseRate * correction;
      }
      if (video.paused) video.play().catch(() => {});
    }
    renderTime();
    scheduleSyncFrame();
  }

  function scheduleSyncFrame() {
    if (master.paused || syncHandle != null) return;
    if ('requestVideoFrameCallback' in master) {
      syncUsesVideoFrame = true;
      syncHandle = master.requestVideoFrameCallback(() => {
        syncHandle = null;
        syncFollowers();
      });
    } else {
      syncUsesVideoFrame = false;
      syncHandle = requestAnimationFrame(() => {
        syncHandle = null;
        syncFollowers();
      });
    }
  }

  function startSyncLoop() {
    stopSyncLoop();
    scheduleSyncFrame();
  }

  function stopSyncLoop() {
    if (syncHandle == null) return;
    if (syncUsesVideoFrame) master.cancelVideoFrameCallback?.(syncHandle);
    else cancelAnimationFrame(syncHandle);
    syncHandle = null;
  }

  function setControlsDisabled(disabled) {
    for (const control of [playBtn, prevBtn, nextBtn, seek, speedBtn]) control.disabled = disabled;
  }

  function setCondition(conditionId) {
    const nextCondition = WEATHER.conditions.find((item) => item.id === conditionId);
    if (!nextCondition || nextCondition.id === activeCondition.id) return;

    resumeAfterLoad = !master.paused;
    pauseAll();
    activeCondition = nextCondition;
    ready = 0;
    metadataReady = 0;
    failed = false;
    root.classList.add('is-loading');
    setControlsDisabled(true);
    seek.value = '0';
    time.textContent = '0:00 / 0:00';

    conditionButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.condition === activeCondition.id));
    });

    activeCondition.views.forEach((view, index) => {
      for (const [video, src] of [
        [gtVideos[index], view.gt],
        [predVideos[index], view.pred],
      ]) {
        video.dataset.metadataReady = 'false';
        video.dataset.dataReady = 'false';
        video.preload = sourcesLoaded ? 'auto' : 'metadata';
        video.src = src;
        video.load();
      }
    });
    renderCopy();
  }

  conditionButtons.forEach((button) => {
    button.addEventListener('click', () => setCondition(button.dataset.condition));
  });

  playBtn.addEventListener('click', () => {
    if (master.paused) playAll();
    else pauseAll();
  });
  prevBtn.addEventListener('click', () => {
    pauseAll();
    setAllTime(master.currentTime - 1 / WEATHER.fps);
  });
  nextBtn.addEventListener('click', () => {
    pauseAll();
    setAllTime(master.currentTime + 1 / WEATHER.fps);
  });
  seek.addEventListener('input', () => {
    if (master.duration) setAllTime((Number(seek.value) / 1000) * master.duration);
  });
  speedBtn.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % SPEEDS.length;
    const rate = SPEEDS[speedIndex];
    for (const video of videos) video.playbackRate = rate;
    speedBtn.textContent = `${rate}×`;
  });
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.();
  });

  for (const video of videos) {
    video.addEventListener('loadedmetadata', () => {
      if (video.dataset.metadataReady === 'true') return;
      video.dataset.metadataReady = 'true';
      metadataReady += 1;
      if (metadataReady === videos.length) {
        setControlsDisabled(false);
        setAllTime(0);
      }
      renderTime();
    });
    video.addEventListener('loadeddata', () => {
      if (video.dataset.dataReady === 'true') return;
      video.dataset.dataReady = 'true';
      ready += 1;
      if (ready === videos.length) {
        root.classList.remove('is-loading');
        if (resumeAfterLoad) {
          resumeAfterLoad = false;
          playAll();
        }
      }
      updateLoadState();
    });
    video.addEventListener('error', () => {
      failed = true;
      resumeAfterLoad = false;
      root.classList.remove('is-loading');
      updateLoadState();
    });
  }

  master.addEventListener('play', () => {
    renderPlayState();
    startSyncLoop();
  });
  master.addEventListener('pause', renderPlayState);
  master.addEventListener('seeked', () => {
    for (const video of videos.slice(1)) {
      if (Math.abs(video.currentTime - master.currentTime) > 0.025) video.currentTime = master.currentTime;
    }
    renderTime();
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !sourcesLoaded) {
        sourcesLoaded = true;
        for (const video of videos) {
          video.preload = 'auto';
          video.load();
        }
      } else if (!entry.isIntersecting && !master.paused) {
        pauseAll();
      }
    },
    { rootMargin: '500px 0px', threshold: 0.01 },
  );
  observer.observe(root);

  const playbackObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (ready === videos.length && metadataReady === videos.length && !failed) playAll();
        else resumeAfterLoad = true;
      } else {
        resumeAfterLoad = false;
        pauseAll();
      }
    },
    { threshold: 0.18 },
  );
  playbackObserver.observe(root);

  new ResizeObserver(() => {
    if (!centeredOnMobile && viewport.scrollWidth > viewport.clientWidth + 1) {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      centeredOnMobile = true;
    }
  }).observe(viewport);

  renderCopy();
  renderTime();
  onLangChange(renderCopy);
}
