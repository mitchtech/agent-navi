const sprite = document.querySelector('#sprite');
const stateLabel = document.querySelector('#state-label');
const motionButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const states = { idle: [0, 6, 'idle'], working: [7, 6, 'working'], waiting: [6, 6, 'waiting for input'], review: [8, 6, 'reviewing'], failure: [5, 8, 'blocked'],
  'moving-right': [1, 8, 'moving right'], 'moving-left': [2, 8, 'moving left'], waving: [3, 4, 'waving'], jumping: [4, 5, 'jumping'], neutral: [0, 1, 'looking forward', 6] };
for (let direction = 0; direction < 16; direction++) states[`look-${direction}`] = [9 + Math.floor(direction / 8), 1, `looking ${document.querySelector(`[data-state="look-${direction}"]`).textContent.toLowerCase()}`, direction % 8];
let state = 'idle';
let frame = 0;
let paused = false;
let timer;

function animate() {
  clearInterval(timer);
  frame = 0;
  const [row, count, , start = 0] = states[state];
  sprite.style.backgroundPosition = `${-start * 192}px ${-row * 208}px`;
  const stopped = paused || reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches ? 'Reduced motion is on' : stopped ? 'Resume animation' : 'Pause animation';
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute('aria-pressed', String(stopped));
  if (!stopped && !document.hidden && count > 1) timer = setInterval(() => {
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
    button.textContent = 'Copied';
    button.classList.add('copied');
    setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('copied'); }, 2000);
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
