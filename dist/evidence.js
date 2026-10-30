'use strict';

(() => {
  const dialog = document.getElementById('evidence-viewer');
  const photo = document.getElementById('evidence-viewer-image');
  const title = document.getElementById('evidence-viewer-title');
  const position = document.getElementById('evidence-viewer-position');
  const previous = document.getElementById('evidence-frame-previous');
  const next = document.getElementById('evidence-frame-next');
  const close = document.getElementById('evidence-viewer-close');
  const groups = new Map();
  let frames = [];
  let index = 0;
  let opener;

  document.querySelectorAll('[data-frame-group]').forEach((button) => {
    const key = button.dataset.frameGroup;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(button);
    button.addEventListener('click', () => {
      opener = button;
      frames = groups.get(key);
      index = frames.indexOf(button);
      render();
      dialog.showModal();
      close.focus();
    });
  });

  function render() {
    const button = frames[index];
    const original = button.querySelector('img');
    photo.src = original.src;
    photo.alt = original.alt;
    title.textContent = button.dataset.frameTitle;
    position.textContent = `${index + 1} / ${frames.length}`;
    previous.disabled = index === 0;
    next.disabled = index === frames.length - 1;
  }
  function step(offset) {
    const target = index + offset;
    if (target < 0 || target >= frames.length) return;
    index = target;
    render();
  }
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  });
  dialog.addEventListener('close', () => opener?.focus({preventScroll: true}));
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
