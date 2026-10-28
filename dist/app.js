'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const cases = window.TWINPAST_CASES;
  const resultData = window.TWINPAST_RESULTS;
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const clock = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
  const descriptions = {
    AIR: 'Retrieve an entity’s identity or visual attributes from an earlier event.',
    HSR: 'Recover an object’s state at the specific historical moment the question refers to.',
    EOR: 'Recover the order of past events, beyond recognizing that they happened.',
    HAC: 'Track individual action occurrences across the history and recover the correct count.',
    MEI: 'Combine evidence from multiple earlier events to answer one shared question.',
  };
  const videos = [$('video-a'), $('video-b')];
  const timeline = $('timeline');
  const selectedExamples = new Map();
  let activeCase = cases[0];
  let generation = 0;
  let intendedPlaying = false;
  let loading = null;
  let loadAbort = new AbortController();
  let revealed = false;
  let dragging = false;
  let resuming = false;
  let seekSequence = 0;

  function status(message, error = false) {
    $('player-status').textContent = message;
    $('player-status').classList.toggle('error', error);
  }

  function playbackUI() {
    $('play-label').textContent = intendedPlaying ? 'Pause together' : 'Play together';
    $('play-symbol').textContent = intendedPlaying ? 'Ⅱ' : '▶';
    $('play-pair').setAttribute('aria-label', intendedPlaying ? 'Pause both histories' : 'Play both histories');
    $('pair-panel').classList.toggle('is-playing', intendedPlaying);
    document.querySelectorAll('.video-overlay').forEach((button) => {
      button.setAttribute('aria-label', intendedPlaying ? 'Pause both histories' : 'Play both histories');
      button.firstElementChild.textContent = intendedPlaying ? 'Ⅱ' : '▶';
    });
  }

  function pausePair() {
    intendedPlaying = false;
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
        video.removeEventListener('error', error);
        signal.removeEventListener('abort', abort);
      };
      const ready = () => { cleanup(); resolve(); };
      const error = () => { cleanup(); reject(new Error('Video could not be loaded. Please try again.')); };
      const abort = () => { cleanup(); reject(new DOMException('Pair changed', 'AbortError')); };
      video.addEventListener('loadedmetadata', ready);
      video.addEventListener('error', error);
      signal.addEventListener('abort', abort, {once: true});
      timer = setTimeout(() => { cleanup(); reject(new Error('Video loading timed out. Please try again.')); }, 25000);
      if (signal.aborted) abort();
    });
  }

  function ensureLoaded() {
    if (loading) return loading;
    const signal = loadAbort.signal;
    const token = generation;
    const pending = videos.map((video) => waitForMetadata(video, signal));
    videos.forEach((video, index) => {
      const branch = index ? 'video_b' : 'video_a';
      const supportsMP4 = video.canPlayType('video/mp4; codecs="avc1.64001f"');
      video.src = !supportsMP4 && activeCase[`${branch}_webm`] ? activeCase[`${branch}_webm`] : activeCase[branch];
      video.preload = 'auto';
      video.load();
    });
    status('Loading both histories…');
    loading = Promise.all(pending).catch((error) => {
      if (token === generation) loading = null;
      throw error;
    });
    return loading;
  }

  async function resumePlayback(token = generation) {
    if (!intendedPlaying || token !== generation || resuming) return;
    resuming = true;
    try {
      await Promise.all(videos.map((video) => video.play()));
      if (token === generation && intendedPlaying) {
        status('Both histories are playing together. Drag the timeline to move through the pair.');
      }
    } catch (error) {
      if (token === generation && intendedPlaying && error.name !== 'AbortError') {
        pausePair();
        status('Playback could not start. Press play to try again.', true);
      }
    } finally {
      resuming = false;
    }
  }

  async function playPair() {
    if (intendedPlaying) { pausePair(); status('Both histories paused.'); return; }
    intendedPlaying = true;
    playbackUI();
    const token = generation;
    try {
      await ensureLoaded();
      if (token !== generation || !intendedPlaying) return;
      if (videos[0].ended || videos[0].currentTime >= activeCase.duration_s - 0.1) {
        videos.forEach((video) => { video.currentTime = 0; });
      }
      await resumePlayback(token);
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      pausePair(); status(error.message, true);
    }
  }

  async function seekPair(time) {
    const token = generation;
    const sequence = ++seekSequence;
    try {
      await ensureLoaded();
      if (token !== generation || sequence !== seekSequence) return;
      const end = Math.min(...videos.map((video) => video.duration), activeCase.duration_s);
      const target = Math.min(Math.max(0, time), Math.max(0, end - 0.05));
      videos.forEach((video) => { video.currentTime = target; });
      updateTime(target);
      status(target >= activeCase.suffix_start_s ? 'Both branches are now in the shared recent context.' : 'Look for the historical evidence that distinguishes the two answers.');
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      pausePair(); status(error.message, true);
    }
  }

  function updateTime(time) {
    if (!dragging) timeline.value = time;
    $('elapsed').textContent = clock(time);
    timeline.setAttribute('aria-valuetext', `${clock(time)} of ${clock(activeCase.duration_s)}`);
    const shared = time >= activeCase.suffix_start_s;
    document.querySelectorAll('.phase-tag').forEach((element) => {
      element.textContent = shared ? 'SHARED RECENT CONTEXT' : 'HISTORICAL CONTEXT';
    });
  }

  function updateAnswers() {
    $('pair-panel').classList.toggle('revealed', revealed);
    ['a', 'b'].forEach((branch, index) => {
      const answer = activeCase[`answer_${branch}`];
      $(`answer-${branch}`).querySelector('strong').textContent = revealed ? `${answer}. ${activeCase.answer_texts[index]}` : 'Reveal below';
    });
    $('reveal-answers').innerHTML = revealed ? 'Hide the answers <span aria-hidden="true">↑</span>' : 'Reveal the two answers <span aria-hidden="true">↗</span>';
    $('reveal-answers').setAttribute('aria-expanded', String(revealed));
    $('reveal-note').textContent = revealed ? 'Both answers must be correct for this pair to count as a success.' : 'The recent context is shared. The earlier evidence tells them apart.';
  }

  function renderExampleSelector(code, taskCases) {
    const container = $('example-buttons');
    $('example-selector').hidden = taskCases.length < 2;
    if (container.dataset.task !== code) {
      container.replaceChildren(...taskCases.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.example = item.pair_id;
        button.setAttribute('aria-controls', 'video-a video-b question-text');
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        button.append(number, document.createTextNode(item.example_label || `Example ${index + 1}`));
        return button;
      }));
      container.dataset.task = code;
    }
    container.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.example === activeCase.pair_id));
    });
    const position = taskCases.findIndex((item) => item.pair_id === activeCase.pair_id) + 1;
    $('example-position').textContent = `${position} of ${taskCases.length}`;
  }

  function chooseCase(code, pairId) {
    const taskCases = cases.filter((item) => item.code === code);
    const nextCase = taskCases.find((item) => item.pair_id === (pairId || selectedExamples.get(code))) || taskCases[0];
    if (!nextCase) return;
    pausePair();
    loadAbort.abort();
    loadAbort = new AbortController();
    generation++;
    loading = null;
    revealed = false;
    dragging = false;
    seekSequence++;
    activeCase = nextCase;
    selectedExamples.set(code, activeCase.pair_id);
    renderExampleSelector(code, taskCases);
    document.querySelectorAll('[data-task]').forEach((tab) => {
      const selected = tab.dataset.task === code;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    $('pair-panel').setAttribute('aria-labelledby', `tab-${code}`);
    $('task-code').textContent = code;
    $('task-title').textContent = activeCase.title;
    $('pair-count').textContent = `${activeCase.count} pairs in this task`;
    $('task-description').textContent = descriptions[code];
    $('question-text').textContent = activeCase.question;
    $('question-options').replaceChildren(...activeCase.options.map((option) => {
      const item = document.createElement('li'); item.textContent = option; return item;
    }));
    videos.forEach((video, index) => {
      video.removeAttribute('src');
      video.poster = activeCase[index ? 'poster_b' : 'poster_a'];
      video.preload = 'none';
      video.load();
      video.playbackRate = Number($('playback-rate').value);
    });
    timeline.max = activeCase.duration_s;
    $('duration').textContent = clock(activeCase.duration_s);
    $('timeline-track').style.setProperty('--boundary', `${activeCase.suffix_start_s / activeCase.duration_s * 100}%`);
    updateTime(0);
    updateAnswers();
    status('Choose play to load this pair. All videos retain their full timeline.');
  }

  document.querySelectorAll('[data-task]').forEach((tab) => {
    tab.addEventListener('click', () => chooseCase(tab.dataset.task));
    tab.addEventListener('keydown', (event) => {
      const tabs = [...document.querySelectorAll('[data-task]')];
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[index].focus(); chooseCase(tabs[index].dataset.task);
    });
  });
  document.querySelectorAll('[data-explore-pair]').forEach((link) => {
    link.addEventListener('click', () => {
      const example = cases.find((item) => item.pair_id === link.dataset.explorePair);
      if (example) chooseCase(example.code, example.pair_id);
    });
  });
  $('example-buttons').addEventListener('click', (event) => {
    const button = event.target.closest('[data-example]');
    if (button) chooseCase(activeCase.code, button.dataset.example);
  });
  $('play-pair').addEventListener('click', playPair);
  document.querySelectorAll('[data-play]').forEach((button) => button.addEventListener('click', playPair));
  $('reveal-answers').addEventListener('click', () => { revealed = !revealed; updateAnswers(); });
  $('jump-evidence').addEventListener('click', () => seekPair(activeCase.evidence_time_s));
  $('jump-shared').addEventListener('click', () => seekPair(activeCase.suffix_start_s + 0.25));
  timeline.addEventListener('input', () => { dragging = true; $('elapsed').textContent = clock(Number(timeline.value)); });
  timeline.addEventListener('change', () => { dragging = false; seekPair(Number(timeline.value)); });
  $('playback-rate').addEventListener('change', () => videos.forEach((video) => { video.playbackRate = Number($('playback-rate').value); }));
  document.querySelectorAll('[data-fullscreen]').forEach((button) => button.addEventListener('click', async () => {
    const video = button.dataset.fullscreen === 'a' ? videos[0] : videos[1];
    try {
      if (video.parentElement.requestFullscreen) await video.parentElement.requestFullscreen();
      else if (video.webkitEnterFullscreen) { await ensureLoaded(); video.webkitEnterFullscreen(); }
      else status('Fullscreen is not available in this browser.');
    } catch { status('Fullscreen is not available in this browser.'); }
  }));
  videos.forEach((video) => {
    video.addEventListener('ended', () => { pausePair(); updateTime(videos[0].currentTime); status('Pair finished. Reveal the answers, or replay the historical evidence.'); });
    video.addEventListener('waiting', () => {
      if (!intendedPlaying) return;
      videos.forEach((item) => item.pause());
      status('Buffering both histories to keep playback synchronized…');
    });
    video.addEventListener('canplay', () => {
      if (intendedPlaying && videos.every((item) => item.readyState >= 3)) resumePlayback();
    });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && intendedPlaying) { pausePair(); status('Playback paused while this page was in the background.'); } });
  let lastSync = 0;
  function tick(timestamp) {
    if (timestamp - lastSync > 100) {
      lastSync = timestamp;
      if (videos[0].readyState >= 1 && !dragging) updateTime(videos[0].currentTime);
      if (intendedPlaying && videos.every((video) => video.readyState >= 3 && !video.seeking)) {
        if (Math.abs(videos[0].currentTime - videos[1].currentTime) > 0.18) videos[1].currentTime = videos[0].currentTime;
      }
    }
    requestAnimationFrame(tick);
  }
  chooseCase('AIR');
  requestAnimationFrame(tick);

  function renderComparison() {
    const model = $('comparison-model').value;
    const recent = resultData.results.find((row) => row.group === 'D' && row.model === `${model} (4 Frames)`);
    const history = resultData.results.find((row) => row.group === 'B' && row.model === `${model} (64 Frames)`);
    $('comparison-bars').innerHTML = [recent, history].map((row, index) => `<div class="chart-row ${index ? 'history' : ''}"><div class="chart-row-top"><strong>${index ? 'With historical input' : 'Recent frames only'}</strong><span class="chart-value">${row.pair.toFixed(2)}%<small>PairAcc</small></span></div><div class="chart-bar-track" role="img" aria-label="${index ? 'With historical input' : 'Recent frames only'}: ${row.pair.toFixed(2)} percent pair accuracy"><div class="chart-bar" style="--value:${row.pair}%"></div></div><p class="chart-row-note"><strong class="frame-count">${index ? 'Up to 64 uniformly sampled frames' : '4 recent frames'}</strong> · Individual accuracy ${row.acc.toFixed(2)}%</p></div>`).join('');
    $('comparison-gain').textContent = `+${(history.pair - recent.pair).toFixed(2)}`;
  }
  $('comparison-model').addEventListener('change', renderComparison);
  renderComparison();

  let selectedGroup = 'A';
  const scoreColumns = ['AIR', 'HSR', 'EOR', 'HAC', 'MEI', 'acc', 'pair', 'D', 'C', 'R', 'S'];
  function renderResults() {
    const query = $('model-search').value.trim().toLowerCase();
    const sorting = $('result-sort').value;
    const diagnostics = $('show-diagnostics').checked;
    const span = diagnostics ? 12 : 8;
    $('results-table').classList.toggle('show-diagnostics', diagnostics);
    $('diagnostic-notes').hidden = !diagnostics;
    let count = 0;
    let html = '';
    Object.entries(resultData.groups).forEach(([group, title]) => {
      if (selectedGroup !== 'all' && selectedGroup !== group) return;
      const rows = resultData.results.filter((row) => row.group === group && row.model.toLowerCase().includes(query));
      if (!rows.length) return;
      if (sorting !== 'paper') rows.sort((a, b) => (b[sorting] ?? -Infinity) - (a[sorting] ?? -Infinity));
      count += rows.length;
      html += `<tr class="group-row"><th colspan="${span}" scope="rowgroup">${escape(title)}</th></tr>`;
      rows.forEach((row) => {
        html += `<tr><th scope="row">${escape(row.model)}</th>${scoreColumns.map((key, index) => `<td class="${key === 'pair' ? 'pair-column' : index >= 7 ? 'diagnostic' : ''}">${row[key] === null ? '—' : row[key].toFixed(2)}</td>`).join('')}</tr>`;
      });
    });
    $('results-body').innerHTML = html || `<tr><td colspan="${span}" class="empty-result">No models match this search. Try a different name or setting.</td></tr>`;
    $('result-count').textContent = `${count} of ${resultData.results.length} result rows · 700 branches / 350 pairs · Human streaming: weighted reference`;
  }
  $('result-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-group]');
    if (!button) return;
    selectedGroup = button.dataset.group;
    $('result-filters').querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    renderResults();
  });
  $('model-search').addEventListener('input', renderResults);
  $('result-sort').addEventListener('change', renderResults);
  $('show-diagnostics').addEventListener('change', renderResults);
  renderResults();
})();
