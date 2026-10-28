'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const example = window.TWINPAST_CASES.find((item) => item.pair_id === 'pilot_r3_00073');
  document.querySelectorAll('[data-hero-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const recent = button.dataset.heroView === 'recent';
      document.querySelectorAll('[data-hero-view]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      $('hero-frame-pair').dataset.view = button.dataset.heroView;
      ['a', 'b'].forEach((branch, index) => {
        $(`hero-frame-${branch}`).src = recent ? example.shared_poster : example[`poster_${branch}`];
        $(`hero-frame-${branch}`).alt = recent ? 'The identical recent scene used in both branches' : `Historical beach scene with the queried boat ${index ? 'present' : 'absent'}`;
        $(`hero-caption-${branch}`).textContent = recent ? `Same recent view → ${index ? 'Yes' : 'No'}` : `Boat ${index ? 'present' : 'absent'} → ${index ? 'Yes' : 'No'}`;
      });
      $('hero-demo-note').textContent = recent
        ? 'The earlier boat evidence still determines each answer.'
        : 'The earlier boat evidence determines the answer.';
    });
  });

  const patterns = {
    repeat: {answers: ['No', 'No'], explanation: 'One correct answer is not enough to solve this pair.'},
    correct: {answers: ['No', 'Yes'], explanation: 'Both answers follow their historical evidence. The pair is correct.'},
    reverse: {answers: ['Yes', 'No'], explanation: 'The answers differ, but each is assigned to the wrong history. The pair is incorrect.'},
  };
  function renderPattern(key) {
    const pattern = patterns[key];
    const correctness = pattern.answers.map((answer, i) => answer === (i ? 'Yes' : 'No'));
    document.querySelectorAll('[data-answer-pattern]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.answerPattern === key)));
    ['a', 'b'].forEach((branch, i) => {
      const target = $(`rule-answer-${branch}`);
      const verdict = document.createElement('small');
      verdict.textContent = correctness[i] ? 'Correct' : 'Incorrect';
      target.replaceChildren(document.createTextNode(pattern.answers[i]), verdict);
      target.dataset.correct = String(correctness[i]);
    });
    $('rule-accuracy').textContent = `${correctness.filter(Boolean).length * 50}%`;
    $('rule-pair').textContent = correctness.every(Boolean) ? '100%' : '0%';
    $('rule-explanation').textContent = pattern.explanation;
  }
  document.querySelectorAll('[data-answer-pattern]').forEach((button) => button.addEventListener('click', () => renderPattern(button.dataset.answerPattern)));
  renderPattern('repeat');

  // Aggregate comparison values from Table 1 of the supplied manuscript.
  const auditScores = {
    'Qwen3-VL-8B': {ovo: [66.93, 50.96], streaming: [81.79, 67.71]},
    'DeepSeek-Flash': {ovo: [70.47, 61.18], streaming: [80.67, 74.27]},
  };
  function renderReversal() {
    const model = $('comparison-model').value;
    $('ranking-model').textContent = model;
    const recent = window.TWINPAST_RESULTS.results.find((r) => r.group === 'D' && r.model === `${model} (4 Frames)`);
    const history = window.TWINPAST_RESULTS.results.find((r) => r.group === 'B' && r.model === `${model} (64 Frames)`);
    const rows = [
      ['OVO-Bench', 'OVO Avg', auditScores[model].ovo],
      ['StreamingBench', 'Real-Time Avg', auditScores[model].streaming],
      ['TwinPast', 'PairAcc', [recent.pair, history.pair]],
    ];
    $('input-ranking').replaceChildren(...rows.map(([name, metric, scores]) => {
      const row = document.createElement('div'); row.className = 'reversal-row'; row.setAttribute('role', 'row');
      const label = document.createElement('span'); label.setAttribute('role', 'rowheader');
      const detail = document.createElement('small'); detail.textContent = metric;
      label.append(document.createTextNode(name), detail); row.append(label);
      scores.forEach((score, i) => {
        const cell = document.createElement('strong'); cell.setAttribute('role', 'cell'); cell.textContent = `${score.toFixed(2)}%`;
        if (score > scores[1 - i]) cell.className = 'winner';
        row.append(cell);
      });
      return row;
    }));
  }
  $('comparison-model').addEventListener('change', renderReversal);
  renderReversal();

  document.querySelectorAll('[data-open-details]').forEach((link) => {
    link.addEventListener('click', () => {
      $(link.dataset.openDetails).open = true;
    });
  });
  function openLinkedDetails() {
    const target = $(location.hash.slice(1));
    if (!target) return;
    let details = target.closest('details');
    while (details) {
      details.open = true;
      details = details.parentElement.closest('details');
    }
  }
  window.addEventListener('hashchange', openLinkedDetails);
  openLinkedDetails();
})();
