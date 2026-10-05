const sprite = document.querySelector('#sprite');
const stateLabel = document.querySelector('#state-label');
const motionButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const states = { idle: [0, 6, 'idle'], working: [7, 6, 'working'], waiting: [6, 6, 'waiting for input'], review: [8, 6, 'reviewing'], failure: [5, 8, 'blocked'] };
let state = 'idle';
let frame = 0;
let paused = false;
let timer;

function animate() {
  clearInterval(timer);
  frame = 0;
  const [row, count] = states[state];
  sprite.style.backgroundPosition = `0px ${-row * 208}px`;
  const stopped = paused || reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches ? 'Reduced motion is on' : stopped ? 'Resume animation' : 'Pause animation';
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute('aria-pressed', String(stopped));
  if (!stopped && !document.hidden) timer = setInterval(() => {
    frame = (frame + 1) % count;
    sprite.style.backgroundPosition = `${-frame * 192}px ${-row * 208}px`;
  }, 160);
}

document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => {
  state = button.dataset.state;
  document.querySelectorAll('[data-state]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  stateLabel.textContent = `Navi is ${states[state][2]}`;
  animate();
}));
motionButton.addEventListener('click', () => { paused = !paused; animate(); });
reducedMotion.addEventListener('change', animate);
document.addEventListener('visibilitychange', animate);
animate();

document.querySelectorAll('[data-install]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.install;
  document.querySelectorAll('[data-install]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#sounds-install').hidden = choice === 'pet';
  document.querySelector('#pet-install').hidden = choice === 'sounds';
}));

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent);
    status.textContent = 'Commands copied.';
  } catch { status.textContent = 'Clipboard unavailable. Select and copy the commands above.'; }
}));

let activeAudio;
document.querySelectorAll('[data-clip]').forEach(button => button.addEventListener('click', async () => {
  if (activeAudio) activeAudio.pause();
  document.querySelectorAll('[data-clip]').forEach(item => item.classList.remove('playing'));
  const audio = new Audio(`audio/${button.dataset.clip}.wav`);
  activeAudio = audio;
  const status = document.querySelector('#audio-status');
  audio.addEventListener('ended', () => {
    button.classList.remove('playing');
    if (activeAudio === audio) status.textContent = 'Preview finished. Click another clip to listen.';
  });
  try {
    await audio.play();
    if (activeAudio === audio) {
      button.classList.add('playing');
      status.textContent = `Playing ${button.querySelector('.sound-name').textContent}`;
    }
  } catch {
    if (activeAudio === audio) status.textContent = 'Playback unavailable. Check your browser audio settings or try the CLI preview.';
  }
}));
