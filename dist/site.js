'use strict';

(() => {
  const locale = document.documentElement.lang === 'zh-CN' ? window.TWINPAST_ZH : null;
  const t = (key, values = {}) => (locale?.strings[key] ?? String(key))
    .replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  const $ = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = t(text);
    return node;
  };
  const cases = window.TWINPAST_CASES.map((item) => ({...item, ...locale?.cases[item.pair_id]}));
  const results = window.TWINPAST_RESULTS;

  // Keep the reader in the same section when switching editions.
  document.querySelectorAll('.language-switch a').forEach((link) => {
    link.addEventListener('click', () => {
      link.hash = document.querySelector('.nav-links a.current')?.hash || '#top';
    });
  });

  /* ---------- Video overview: poster with a play button, native controls once started ---------- */

  const overview = $('overview-video');
  if (overview) {
    const frame = overview.closest('.vf-player');
    const start = frame.querySelector('[data-overview-play]');
    const started = () => { frame.classList.add('is-started'); overview.controls = true; };
    overview.controls = false;
    start.hidden = false;
    start.addEventListener('click', () => {
      started();
      overview.play().catch(() => {});
      overview.focus({preventScroll: true});
    });
    overview.addEventListener('play', started);
  }

  /* ---------- Paired video explorer ---------- */

  const descriptions = {
    AIR: 'Retrieve an entity’s identity or its earlier visual, spatial or motion attributes.',
    HSR: 'Recover an object’s condition or configuration at a specified past moment.',
    EOR: 'Recover the temporal order of past events, not just that they occurred.',
    HAC: 'Count how many times an action occurred across the history.',
    MEI: 'Combine or compare several historical facts to answer one question.',
  };
  const clock = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
  const videos = [$('video-a'), $('video-b')];
  const timeline = $('timeline');
  const panel = $('pair-panel');
  const remembered = new Map();
  let active = cases[0];
  let generation = 0;
  let playing = false;
  let loading = null;
  let loadAbort = new AbortController();
  let dragging = false;
  let resuming = false;
  let seekSequence = 0;

  function status(message, error = false) {
    $('player-status').textContent = t(message);
    $('player-status').classList.toggle('error', error);
  }

  function playbackUI() {
    $('play-pair').textContent = t(playing ? 'Pause' : 'Play both');
    panel.classList.toggle('is-playing', playing);
    document.querySelectorAll('.video-overlay').forEach((button) => {
      button.setAttribute('aria-label', t(playing ? 'Pause both videos' : 'Play both videos'));
    });
  }

  function pausePair() {
    playing = false;
    videos.forEach((video) => video.pause());
    playbackUI();
  }

  function waitForMetadata(video, signal) {
    if (video.readyState >= 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => {
        clearTimeout(timer);
        video.removeEventListener('loadedmetadata', ready);
        video.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
      };
      const ready = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error('The video could not be loaded.')); };
      const aborted = () => { cleanup(); reject(new DOMException('Pair changed', 'AbortError')); };
      video.addEventListener('loadedmetadata', ready);
      video.addEventListener('error', failed);
      signal.addEventListener('abort', aborted, {once: true});
      timer = setTimeout(() => { cleanup(); reject(new Error('Loading timed out. Try again.')); }, 25000);
      if (signal.aborted) aborted();
    });
  }

  function ensureLoaded() {
    if (loading) return loading;
    const signal = loadAbort.signal;
    const token = generation;
    const pending = videos.map((video) => waitForMetadata(video, signal));
    videos.forEach((video, index) => {
      const key = index ? 'video_b' : 'video_a';
      const mp4 = video.canPlayType('video/mp4; codecs="avc1.64001f"');
      video.src = !mp4 && active[`${key}_webm`] ? active[`${key}_webm`] : active[key];
      video.preload = 'auto';
      video.load();
    });
    status('Loading…');
    loading = Promise.all(pending).then(() => { if (token === generation) updateTime(videos[0].currentTime); })
      .catch((error) => { if (token === generation) loading = null; throw error; });
    return loading;
  }

  async function resume(token = generation) {
    if (!playing || token !== generation || resuming) return;
    resuming = true;
    try {
      await Promise.all(videos.map((video) => video.play()));
    } catch (error) {
      if (token === generation && playing && error.name !== 'AbortError') {
        pausePair();
        status('Playback could not start. Press play again.', true);
      }
    } finally {
      resuming = false;
    }
  }

  async function togglePlay() {
    if (playing) { pausePair(); return; }
    playing = true;
    playbackUI();
    const token = generation;
    try {
      await ensureLoaded();
      if (token !== generation || !playing) return;
      if (videos[0].ended || videos[0].currentTime >= active.duration_s - 0.1) {
        videos.forEach((video) => { video.currentTime = 0; });
      }
      await resume(token);
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      pausePair();
      status(error.message, true);
    }
  }

  async function seek(time) {
    const token = generation;
    const sequence = ++seekSequence;
    try {
      await ensureLoaded();
      if (token !== generation || sequence !== seekSequence) return;
      const end = Math.min(...videos.map((video) => video.duration), active.duration_s);
      const target = Math.min(Math.max(0, time), Math.max(0, end - 0.05));
      videos.forEach((video) => { video.currentTime = target; });
      updateTime(target);
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      pausePair();
      status(error.message, true);
    }
  }

  function updateTime(time) {
    if (!dragging) timeline.value = time;
    $('elapsed').textContent = clock(time);
    timeline.setAttribute('aria-valuetext', t('{elapsed} of {duration}', {elapsed: clock(time), duration: clock(active.duration_s)}));
    if (!$('player-status').classList.contains('error')) {
      status(time >= active.suffix_start_s ? 'Now in the shared suffix: both videos show the same frames.' : 'Now in the history: the two videos differ.');
    }
  }

  function renderExamples(code, taskCases) {
    const box = $('example-buttons');
    $('example-selector').hidden = taskCases.length < 2;
    if (box.dataset.task !== code) {
      box.replaceChildren(...taskCases.map((item) => {
        const button = el('button', '', item.example_label);
        button.type = 'button';
        button.dataset.example = item.pair_id;
        return button;
      }));
      box.dataset.task = code;
    }
    box.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.example === active.pair_id));
    });
  }

  function choose(code, pairId) {
    const taskCases = cases.filter((item) => item.code === code);
    const next = taskCases.find((item) => item.pair_id === (pairId || remembered.get(code))) || taskCases[0];
    if (!next) return;
    pausePair();
    loadAbort.abort();
    loadAbort = new AbortController();
    generation++;
    loading = null;
    dragging = false;
    seekSequence++;
    active = next;
    remembered.set(code, active.pair_id);
    renderExamples(code, taskCases);
    document.querySelectorAll('[data-task]').forEach((tab) => {
      const selected = tab.dataset.task === code;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    $('tab-panel').setAttribute('aria-labelledby', `tab-${code}`);
    $('task-description').textContent = `${t(active.title)}${t('. ')}${t(descriptions[code])}`;
    $('question-text').textContent = active.question;
    const letters = 'ABCDEF';
    $('question-options').replaceChildren(...active.options.map((option, index) => {
      const item = el('li', '', option);
      if (letters[index] === active.answer_a) item.append(el('span', 'chip a', 'correct for History A'));
      if (letters[index] === active.answer_b) item.append(el('span', 'chip b', 'correct for History B'));
      return item;
    }));
    videos.forEach((video, index) => {
      video.removeAttribute('src');
      video.poster = active[index ? 'poster_b' : 'poster_a'];
      video.preload = 'none';
      video.load();
      video.playbackRate = Number($('playback-rate').value);
    });
    timeline.max = active.duration_s;
    $('duration').textContent = clock(active.duration_s);
    $('timeline-track').style.setProperty('--boundary', `${active.suffix_start_s / active.duration_s * 100}%`);
    $('player-status').classList.remove('error');
    timeline.value = 0;
    $('elapsed').textContent = '0:00';
    status(t('History: first {history}. Shared suffix: the remaining {suffix}.', {history: clock(active.suffix_start_s), suffix: clock(active.duration_s - active.suffix_start_s)}));
  }

  document.querySelectorAll('[data-task]').forEach((tab) => {
    tab.addEventListener('click', () => choose(tab.dataset.task));
    tab.addEventListener('keydown', (event) => {
      const tabs = [...document.querySelectorAll('[data-task]')];
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[index].focus();
      choose(tabs[index].dataset.task);
    });
  });
  $('example-buttons').addEventListener('click', (event) => {
    const button = event.target.closest('[data-example]');
    if (button) choose(active.code, button.dataset.example);
  });
  $('play-pair').addEventListener('click', togglePlay);
  document.querySelectorAll('[data-play]').forEach((button) => button.addEventListener('click', togglePlay));
  $('jump-evidence').addEventListener('click', () => seek(active.evidence_time_s));
  $('jump-shared').addEventListener('click', () => seek(active.suffix_start_s + 0.25));
  timeline.addEventListener('input', () => { dragging = true; $('elapsed').textContent = clock(Number(timeline.value)); });
  timeline.addEventListener('change', () => { dragging = false; seek(Number(timeline.value)); });
  $('playback-rate').addEventListener('change', () => videos.forEach((video) => { video.playbackRate = Number($('playback-rate').value); }));
  videos.forEach((video) => {
    video.addEventListener('ended', () => { pausePair(); updateTime(videos[0].currentTime); });
    video.addEventListener('waiting', () => { if (playing) videos.forEach((item) => item.pause()); });
    video.addEventListener('canplay', () => { if (playing && videos.every((item) => item.readyState >= 3)) resume(); });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pausePair(); });
  let lastSync = 0;
  function tick(timestamp) {
    if (timestamp - lastSync > 100) {
      lastSync = timestamp;
      if (playing && videos[0].readyState >= 1 && !dragging) updateTime(videos[0].currentTime);
      if (playing && videos.every((video) => video.readyState >= 3 && !video.seeking)
          && Math.abs(videos[0].currentTime - videos[1].currentTime) > 0.18) {
        videos[1].currentTime = videos[0].currentTime;
      }
    }
    requestAnimationFrame(tick);
  }
  choose('AIR');
  requestAnimationFrame(tick);

  /* ---------- Input comparison (paper Tables 1 and 2) ---------- */

  const inputLabels = ['Question only', '1 recent frame', '4 recent frames', 'Up to 64 frames'];
  const inputScores = {
    'Qwen3-VL-8B': [
      ['OVO-Bench', 'Avg', [41.41, 58.47, 66.93, 50.96], 'Four recent frames score highest.'],
      ['StreamingBench', 'Real-Time Avg', [46.70, 73.03, 81.79, 67.71], 'Four recent frames score highest.'],
      ['TwinPast', 'PairAcc', [0.00, null, 0.00, 34.00], 'No pair is solved without the history.'],
    ],
    'DeepSeek-Flash': [
      ['OVO-Bench', 'Avg', [49.02, 68.05, 70.47, 61.18], 'Four recent frames score highest.'],
      ['StreamingBench', 'Real-Time Avg', [57.18, 77.79, 80.67, 74.27], 'Four recent frames score highest.'],
      ['TwinPast', 'PairAcc', [2.10, 5.14, 3.14, 42.57], 'Almost no pair is solved without the history.'],
    ],
  };
  const inputChart = $('input-chart');
  function renderInputChart(model) {
    const first = !inputChart.children.length;
    inputScores[model].forEach(([name, metric, scores, note], panelIndex) => {
      let panel = inputChart.children[panelIndex];
      if (first) {
        panel = el('div', `ic-panel${name === 'TwinPast' ? ' twinpast' : ''}`);
        const title = el('p', 'ic-title', name);
        title.append(el('span', '', metric));
        const bars = el('div', 'ic-bars');
        const labels = el('div', 'ic-labels');
        inputLabels.forEach((label) => {
          const col = el('div', 'ic-col');
          col.append(el('span', 'ic-value'), el('span', 'ic-bar'));
          bars.append(col);
          labels.append(el('span', '', label));
        });
        panel.append(title, bars, labels, el('p', 'ic-note'));
        inputChart.append(panel);
      }
      const best = Math.max(...scores.map((score) => score ?? -1));
      panel.querySelectorAll('.ic-col').forEach((col, i) => {
        const score = scores[i];
        col.classList.toggle('best', score === best);
        col.querySelector('.ic-value').textContent = score === null ? t('n/a') : score.toFixed(2);
        col.querySelector('.ic-bar').style.height = `${score === null ? 0 : score * 0.82}%`;
        col.querySelector('.ic-bar').style.visibility = score === null ? 'hidden' : '';
      });
      panel.querySelector('.ic-note').textContent = t(note);
      panel.querySelector('.ic-bars').setAttribute('role', 'img');
      panel.querySelector('.ic-bars').setAttribute('aria-label', t('{model} on {benchmark} {metric}: {scores}', {model, benchmark: name, metric: t(metric), scores: scores.map((score, i) => `${t(inputLabels[i])} ${score === null ? t('not reported') : score.toFixed(2)}`).join(', ')}));
    });
  }
  $('input-model').addEventListener('click', (event) => {
    const button = event.target.closest('[data-model]');
    if (!button) return;
    $('input-model').querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    renderInputChart(button.dataset.model);
  });
  renderInputChart('Qwen3-VL-8B');

  /* ---------- Pair outcome chart (paper Table 2: PairAcc and D) ---------- */

  const byPair = (a, b) => b.pair - a.pair;
  const group = (key) => results.results.filter((row) => row.group === key);
  const chartGroups = [
    ['Streaming video LLMs', 'evaluated online, question at query time', group('A').sort(byPair)],
    ['General-purpose MLLMs', 'given each complete video', group('C').sort(byPair)],
    ['Human references', '', group('F').sort(byPair)],
    ['Controls without history', 'recent frames only, or question only', [...group('D'), ...group('E')].sort(byPair)],
  ];
  const chart = $('outcome-chart');
  chartGroups.forEach(([title, note, rows], groupIndex) => {
    const heading = el('p', 'oc-group', title);
    if (note) heading.append(' ', el('span', '', `(${t(note)})`));
    chart.append(heading);
    rows.forEach((row, index) => {
      const line = el('div', `oc-row${groupIndex === 0 && index === 0 ? ' top' : ''}`);
      const bar = el('span', 'oc-bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', t('{model}: both correct {pair}%, different answers {different}%', {model: t(row.model), pair: row.pair.toFixed(2), different: row.D.toFixed(2)}));
      const fill = el('span', 'oc-fill');
      const both = el('i', 'both');
      both.style.width = `${row.pair}%`;
      const diff = el('i', 'diff');
      diff.style.width = `${Math.max(0, row.D - row.pair)}%`;
      fill.append(both, diff);
      bar.append(fill);
      bar.title = t('PairAcc {pair}% · different answers (D) {different}%', {pair: row.pair.toFixed(2), different: row.D.toFixed(2)});
      line.append(el('span', '', row.model), bar, el('span', 'oc-value', row.pair.toFixed(2)));
      chart.append(line);
    });
  });
  const axis = el('div', 'oc-axis');
  const ticks = el('div');
  ['0', '25', '50', '75', '100%'].forEach((label) => ticks.append(el('span', '', label)));
  axis.append(ticks);
  chart.append(axis);

  /* ---------- Task-wise PairAcc (paper Figure 3) ---------- */

  const tasks = [['AIR', 'Attribute and identity', 92], ['HSR', 'Historical state', 77], ['EOR', 'Event order', 65], ['HAC', 'Action counting', 57], ['MEI', 'Multi-event', 59]];
  const taskPairAcc = {
    stream: [
      ['Qwen3.8-Omni-Flash-Realtime', 71.7, 53.2, 63.1, 15.8, 25.4],
      ['MiniCPM-o 4.5', 75.0, 44.2, 66.2, 8.8, 18.6],
      ['StreamForest', 68.5, 28.6, 36.9, 12.3, 13.6],
      ['JoyAI-VL Interaction', 57.6, 32.5, 47.7, 5.3, 10.2],
      ['AURA', 56.5, 33.8, 50.8, 1.8, 8.5],
      ['MOSS-VL Realtime', 67.4, 19.5, 36.9, 7.0, 16.9],
      ['ReKV', 62.0, 13.0, 29.2, 3.5, 13.6],
      ['OneStreamer', 38.0, 29.9, 40.0, 5.3, 8.5],
      ['Dispider', 35.9, 11.7, 32.3, 3.5, 5.1],
      ['VideoLLM-online', 2.2, 0.0, 1.5, 0.0, 0.0],
      ['Mage-VL (codec + gate)', 0.0, 1.3, 0.0, 0.0, 0.0],
    ],
    general: [
      ['Gemini 4 Argon', 94.6, 92.2, 98.5, 77.2, 91.5],
      ['Kimi K3.1 Pro', 96.7, 88.3, 98.5, 71.9, 86.4],
      ['Seed 2.1 Pro', 92.4, 89.6, 90.8, 71.9, 83.1],
      ['Seed 2.1 Turbo', 92.4, 85.7, 89.2, 64.9, 89.8],
      ['Muse Spark 1.3', 94.6, 88.3, 92.3, 49.1, 79.7],
      ['Qwen3.8-Omni-Flash', 92.4, 83.1, 96.9, 63.2, 71.2],
      ['MiniMax-M3.1-Flash', 90.2, 81.8, 89.2, 64.9, 69.5],
      ['GLM-5.3-Flash', 87.0, 70.1, 92.3, 35.1, 61.0],
      ['MiMo-V2.6-Flash', 82.6, 68.8, 87.7, 29.8, 50.8],
    ],
    human: [['Human (offline replay)', 95.7, 84.4, 90.8, 75.4, 91.5]],
  };
  const taskChart = $('task-chart');
  const readout = el('p', 'tc-readout');
  const defaultReadout = t('Best streaming system per task: 75.0, 53.2, 66.2, 15.8 and 25.4.');
  readout.textContent = defaultReadout;
  function trace(name) {
    taskChart.classList.toggle('tracing', Boolean(name));
    taskChart.querySelectorAll('.tc-mark').forEach((mark) => mark.classList.toggle('on', mark.dataset.model === name));
    if (!name) { readout.textContent = defaultReadout; return; }
    const row = Object.values(taskPairAcc).flat().find((item) => item[0] === name);
    readout.replaceChildren(el('strong', '', name), `: ${tasks.map((task, i) => `${task[0]} ${row[i + 1].toFixed(1)}`).join(' · ')}`);
  }
  tasks.forEach(([code, label, count], taskIndex) => {
    const row = el('div', 'tc-row');
    const name = el('span', '', `${code} `);
    name.append(el('small', '', label));
    const track = el('div', 'tc-track');
    Object.entries(taskPairAcc).forEach(([kind, systems]) => systems.forEach((system) => {
      const mark = el('button', `tc-mark ${kind}`);
      mark.type = 'button';
      mark.style.left = `${system[taskIndex + 1]}%`;
      mark.dataset.model = system[0];
      mark.setAttribute('aria-label', t('{model}, {task}: {score}% PairAcc', {model: t(system[0]), task: code, score: system[taskIndex + 1].toFixed(1)}));
      mark.addEventListener('mouseenter', () => trace(system[0]));
      mark.addEventListener('focus', () => trace(system[0]));
      mark.addEventListener('mouseleave', () => trace(null));
      mark.addEventListener('blur', () => trace(null));
      track.append(mark);
    }));
    row.append(name, track, el('span', '', ''));
    taskChart.append(row);
  });
  const taskAxis = el('div', 'oc-axis');
  const taskTicks = el('div');
  ['0', '25', '50', '75', '100%'].forEach((label) => taskTicks.append(el('span', '', label)));
  taskAxis.append(taskTicks);
  taskChart.append(taskAxis, readout);

  /* ---------- Distance between evidence and query (paper Tables S4 and S5) ---------- */

  const distanceSteps = ['No suffix', 'Original', '+30 s', '+60 s', '+180 s', '+600 s'].map((step) => t(step));
  const distanceSeries = [
    ['StreamForest', [46.86, 35.14, 33.43, 33.14, 29.71, 21.71]],
    ['ReKV', [33.14, 27.43, 24.86, 24.29, 22.29, 21.71]],
    ['OneStreamer', [52.29, 26.29, 18.86, 18.57, 20.57, 18.57]],
    ['MiniCPM-o 4.5', [50.00, 46.29, 45.71, 42.86, 14.86, 9.14]],
    ['Offline reference', [46.29, 43.71, 43.71, 44.29, 42.57, 41.14]],
  ];
  const distanceMax = 60;
  const distanceChart = $('distance-chart');
  const dcX = (i) => (i + 0.5) / distanceSteps.length * 100;
  const dcY = (value) => (1 - value / distanceMax) * 100;
  const dcLegend = el('div', 'dc-legend');
  dcLegend.setAttribute('role', 'group');
  dcLegend.setAttribute('aria-label', t('Highlight a system'));
  const dcPlot = el('div', 'dc-plot');
  const dcArea = el('div', 'dc-area');
  [0, 20, 40, 60].forEach((tick) => {
    const line = el('span', 'dc-grid', String(tick));
    line.style.top = `${dcY(tick)}%`;
    dcArea.append(line);
  });
  const dcBand = el('span', 'dc-band');
  dcBand.style.left = `${100 / distanceSteps.length}%`;
  dcBand.style.width = `${100 / distanceSteps.length}%`;
  dcArea.append(dcBand);
  const svgNS = 'http://www.w3.org/2000/svg';
  const dcSvg = document.createElementNS(svgNS, 'svg');
  dcSvg.setAttribute('viewBox', '0 0 100 100');
  dcSvg.setAttribute('preserveAspectRatio', 'none');
  dcSvg.setAttribute('aria-hidden', 'true');
  dcArea.append(dcSvg);
  const dcReadout = el('p', 'dc-readout');
  const dcDefault = t('The offline reference stays between 41.14 and 46.29 in all six settings.');
  let dcPinned = null;
  function dcTrace(index) {
    const active = index ?? dcPinned;
    distanceChart.classList.toggle('tracing', active !== null);
    distanceChart.querySelectorAll('[data-series]').forEach((node) => node.classList.toggle('on', Number(node.dataset.series) === active));
    dcLegend.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === dcPinned)));
    if (active === null) { dcReadout.textContent = dcDefault; return; }
    const [name, values] = distanceSeries[active];
    dcReadout.replaceChildren(el('strong', '', name), `: ${values.map((value, i) => `${distanceSteps[i].toLowerCase()} ${value.toFixed(2)}`).join(' · ')}`);
  }
  distanceSeries.forEach(([name, values], index) => {
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points', values.map((value, i) => `${dcX(i).toFixed(2)},${dcY(value).toFixed(2)}`).join(' '));
    line.setAttribute('class', `dc-line s${index}`);
    line.dataset.series = index;
    dcSvg.append(line);
    values.forEach((value, i) => {
      const dot = el('span', `dc-dot s${index}`);
      dot.style.left = `${dcX(i)}%`;
      dot.style.top = `${dcY(value)}%`;
      dot.dataset.series = index;
      dot.title = `${t(name)}, ${distanceSteps[i].toLowerCase()}: ${value.toFixed(2)}%`;
      dot.addEventListener('mouseenter', () => dcTrace(index));
      dot.addEventListener('mouseleave', () => dcTrace(null));
      dcArea.append(dot);
    });
    const button = el('button', `dc-key s${index}`, name);
    button.type = 'button';
    button.prepend(el('i'));
    button.addEventListener('mouseenter', () => dcTrace(index));
    button.addEventListener('mouseleave', () => dcTrace(null));
    button.addEventListener('focus', () => dcTrace(index));
    button.addEventListener('blur', () => dcTrace(null));
    button.addEventListener('click', () => { dcPinned = dcPinned === index ? null : index; dcTrace(null); });
    dcLegend.append(button);
  });
  dcPlot.append(dcArea);
  const dcAxis = el('div', 'dc-axis');
  distanceSteps.forEach((step, i) => dcAxis.append(el('span', i === 1 ? 'original' : '', step)));
  const dcTableWrap = el('div', 'visually-hidden');
  const dcTable = el('table');
  dcTableWrap.append(dcTable);
  const dcHead = el('tr');
  dcHead.append(el('th', '', 'System'), ...distanceSteps.map((step) => el('th', '', step)));
  dcTable.append(dcHead, ...distanceSeries.map(([name, values]) => {
    const row = el('tr');
    row.append(el('th', '', name), ...values.map((value) => el('td', '', value.toFixed(2))));
    return row;
  }));
  distanceChart.append(dcLegend, dcPlot, dcAxis, dcReadout, dcTableWrap);
  dcTrace(null);

  /* ---------- Full results table ---------- */

  const columns = ['AIR', 'HSR', 'EOR', 'HAC', 'MEI', 'acc', 'pair', 'D', 'C', 'R', 'S'];
  const body = $('results-body');
  Object.entries(results.groups).forEach(([key, title]) => {
    const head = el('tr', 'group-row');
    const cell = el('th', '', `(${key}) ${t(title)}`);
    cell.colSpan = columns.length + 1;
    cell.scope = 'rowgroup';
    head.append(cell);
    body.append(head);
    group(key).forEach((row) => {
      const line = el('tr');
      const name = el('th', '', row.model);
      name.scope = 'row';
      line.append(name);
      columns.forEach((column) => {
        line.append(el('td', column === 'pair' ? 'pair-column' : '', row[column] === null ? '–' : row[column].toFixed(2)));
      });
      body.append(line);
    });
  });

  /* ---------- Section highlight in the navigation, chart entrance ---------- */

  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href')));
  function markCurrent() {
    const line = window.scrollY + window.innerHeight * 0.35;
    let current = -1;
    sections.forEach((section, i) => { if (section.offsetTop <= line) current = i; });
    navLinks.forEach((link, i) => {
      const on = i === current;
      if (on && !link.classList.contains('current')) {
        const box = link.parentElement;
        if (box.scrollWidth > box.clientWidth) box.scrollLeft = link.offsetLeft - (box.clientWidth - link.offsetWidth) / 2;
      }
      link.classList.toggle('current', on);
    });
  }
  let spyQueued = false;
  window.addEventListener('scroll', () => {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(() => { spyQueued = false; markCurrent(); });
  }, {passive: true});
  markCurrent();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.12});
    document.querySelectorAll('.outcome-chart, .hbars').forEach((node) => {
      node.classList.add('animate');
      observer.observe(node);
    });
  }

  /* ---------- Frame viewer ---------- */

  const viewer = $('viewer');
  const frameGroups = new Map();
  let frames = [];
  let frameIndex = 0;
  let opener = null;
  function showFrame() {
    const button = frames[frameIndex];
    const image = button.querySelector('img');
    $('viewer-image').src = image.src;
    $('viewer-image').alt = image.alt;
    $('viewer-title').textContent = button.dataset.frameTitle;
    $('viewer-position').textContent = `${frameIndex + 1} / ${frames.length}`;
    $('viewer-prev').disabled = frameIndex === 0;
    $('viewer-next').disabled = frameIndex === frames.length - 1;
  }
  function stepFrame(offset) {
    const target = frameIndex + offset;
    if (target < 0 || target >= frames.length) return;
    frameIndex = target;
    showFrame();
  }
  document.querySelectorAll('[data-frame-group]').forEach((button) => {
    const key = button.dataset.frameGroup;
    if (!frameGroups.has(key)) frameGroups.set(key, []);
    frameGroups.get(key).push(button);
    button.setAttribute('aria-label', t('Enlarge frame: {title}', {title: button.dataset.frameTitle}));
    button.addEventListener('click', () => {
      opener = button;
      frames = frameGroups.get(key);
      frameIndex = frames.indexOf(button);
      showFrame();
      viewer.showModal();
    });
  });
  $('viewer-prev').addEventListener('click', () => stepFrame(-1));
  $('viewer-next').addEventListener('click', () => stepFrame(1));
  $('viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') stepFrame(-1);
    else if (event.key === 'ArrowRight') stepFrame(1);
  });
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => opener?.focus({preventScroll: true}));

  /* ---------- Citation ---------- */

  const copy = $('copy-citation');
  if (navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('citation-bibtex').textContent);
        $('citation-status').textContent = t('BibTeX copied.');
      } catch {
        $('citation-status').textContent = t('Copy failed. Select the entry and copy it manually.');
      }
    });
  }
})();
