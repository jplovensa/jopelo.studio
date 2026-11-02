import serviceChats from './service-chat-content.js';

const films = {
  strategy: {
    name: 'Strategy & storytelling', category: 'DIRECTION',
    description: 'A lot of ideas. One clear direction. I turn the messy middle into positioning, a story, and a plan you can use.',
    scope: 'Positioning & messaging · Pitch narratives · Business & venture strategy',
    video: new URL('./assets/services/strategy.mp4', import.meta.url).href,
    poster: new URL('./assets/services/strategy.jpg', import.meta.url).href,
  },
  web: {
    name: 'Web experiences', category: 'DIGITAL',
    description: 'Yes, it can look good and do its job. Thoughtful design, expressive interactions, and the code to make it all work.',
    scope: 'Creative direction · Interface design · Web development',
    video: new URL('./assets/services/web.mp4', import.meta.url).href,
    poster: new URL('./assets/services/web.jpg', import.meta.url).href,
  },
  brand: {
    name: 'Brand worlds', category: 'IDENTITY',
    description: 'More than a logo having a good day. A recognisable identity that stays consistent wherever your business shows up.',
    scope: 'Brand identity · Visual systems · Motion & digital expression',
    video: new URL('./assets/services/brand.mp4', import.meta.url).href,
    poster: new URL('./assets/services/brand.jpg', import.meta.url).href,
  },
  styling: {
    name: 'Styling your space', category: 'INTERIORS',
    description: 'Your room, with a little more intention. Layout, materials, furniture and the details that make it feel like you, through SECHA Studio+.',
    scope: 'Concepts & moodboards · Room planning · Finish & styling palettes',
    video: new URL('./assets/services/styling.mp4', import.meta.url).href,
    poster: new URL('./assets/services/styling.jpg', import.meta.url).href,
  },
  ventures: {
    name: 'Ventures & real estate', category: 'ADVISORY',
    description: 'The exciting idea meets the spreadsheet. Commercial strategy and operating decisions that give the next move a proper foundation.',
    scope: 'Development strategy · PropTech roadmaps · Commercial advisory',
    video: new URL('./assets/services/ventures.mp4', import.meta.url).href,
    poster: new URL('./assets/services/ventures.jpg', import.meta.url).href,
  },
};

export function initServiceTrailers() {
  const preview = document.querySelector('#service-preview');
  const player = document.querySelector('.service-player');
  const buttons = [...document.querySelectorAll('[data-preview-service]')];
  const dialog = document.querySelector('#trailer-dialog');
  const fullVideo = document.querySelector('#trailer-video');
  const status = document.querySelector('#service-status');
  const fullStatus = document.querySelector('#trailer-dialog-status');
  const watch = document.querySelector('#service-watch');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 'web';
  let inView = false;
  let hoverTimer;
  let manualPreviewPause = false;
  let expectedPreviewPause = false;
  let lastGlobalPause = document.body.classList.contains('motion-paused');
  let lastPreviewEligibility = false;

  function pausePreview() {
    if (!preview.paused) expectedPreviewPause = true;
    preview.pause();
  }
  preview.addEventListener('pause', () => {
    if (expectedPreviewPause) expectedPreviewPause = false;
    else manualPreviewPause = true;
  });
  preview.addEventListener('play', () => { expectedPreviewPause = false; manualPreviewPause = false; });

  function syncPreview(forceStart = false) {
    const globallyPaused = document.body.classList.contains('motion-paused');
    if (!dialog.open || (globallyPaused && !lastGlobalPause) || document.hidden) fullVideo.pause();
    lastGlobalPause = globallyPaused;
    const canPreview = inView && !preference.matches && !globallyPaused
      && !document.hidden && !document.body.classList.contains('intro-playing')
      && !document.querySelector('dialog[open]');
    if (canPreview && !manualPreviewPause && (!lastPreviewEligibility || forceStart)) {
      if (preview.paused) preview.play().catch(() => {});
    } else if (!canPreview) {
      pausePreview();
    }
    lastPreviewEligibility = canPreview;
  }

  function select(id) {
    if (!films[id]) return;
    const film = films[id];
    current = id;
    manualPreviewPause = false;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewService === id)));
    document.querySelector('#service-category').replaceChildren(
      document.createTextNode(`${film.category} / JOPELO CHATS `),
      Object.assign(document.createElement('span'), { textContent: '00:12' }),
    );
    const title = document.querySelector('#service-title');
    title.replaceChildren(document.createTextNode(film.name), Object.assign(document.createElement('span'), { textContent: '.' }));
    document.querySelector('#service-description').textContent = film.description;
    document.querySelector('#service-scope').textContent = film.scope;
    document.querySelector('#service-inquire').dataset.service = film.name;
    document.querySelector('#trailer-dialog-inquire').dataset.service = film.name;
    const messages = serviceChats[id].messages;
    for (const list of document.querySelectorAll('[data-chat-transcript]')) {
      list.replaceChildren(...messages.map(message => {
        const item = document.createElement('li');
        const speaker = document.createElement('strong');
        speaker.textContent = message.sender === 'you' ? 'You: ' : 'JOPELO: ';
        item.append(speaker, document.createTextNode(message.text));
        return item;
      }));
    }
    document.querySelectorAll('.chat-transcript').forEach(details => { details.open = false; });
    status.hidden = true;
    pausePreview();
    preview.muted = true;
    preview.poster = film.poster;
    preview.setAttribute('aria-label', `${film.name} muted service preview`);
    if (preview.getAttribute('src') !== film.video) {
      preview.src = film.video;
      preview.load();
    }
    syncPreview(true);
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.previewService));
    button.addEventListener('focus', () => select(button.dataset.previewService));
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => select(button.dataset.previewService), 220);
    });
    button.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({ preventScroll: true });
      buttons[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
  });

  watch.addEventListener('click', () => {
    clearTimeout(hoverTimer);
    const film = films[current];
    pausePreview();
    document.querySelector('#trailer-dialog-title').textContent = film.name;
    document.querySelector('#trailer-dialog-category').textContent = `${film.category} / JOPELO CHATS`;
    fullVideo.poster = film.poster;
    fullVideo.src = film.video;
    fullVideo.setAttribute('aria-label', `${film.name} full service trailer`);
    fullVideo.muted = false;
    fullVideo.volume = .65;
    fullVideo.load();
    fullStatus.textContent = '12 seconds. Made-up chat. Real services. Keyboard clicks + message pops.';
    if (!dialog.open) dialog.showModal();
    fullVideo.play().catch(() => { fullStatus.textContent = 'Press play to start the trailer.'; });
  });
  document.querySelector('#trailer-dialog-close').addEventListener('click', () => { fullVideo.pause(); dialog.close(); });
  document.querySelector('#trailer-dialog-inquire').addEventListener('click', () => fullVideo.pause());
  dialog.addEventListener('cancel', () => fullVideo.pause());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) { fullVideo.pause(); dialog.close(); }
  });
  dialog.addEventListener('close', () => {
    fullVideo.pause();
    fullVideo.removeAttribute('src');
    fullVideo.load();
    syncPreview();
  });
  preview.addEventListener('error', () => {
    if (!preview.getAttribute('src')) return;
    status.textContent = 'The preview could not load. You can still discuss this service.';
    status.hidden = false;
  });
  fullVideo.addEventListener('error', () => {
    if (fullVideo.getAttribute('src')) fullStatus.textContent = 'The trailer could not load. Please try again.';
  });
  document.addEventListener('visibilitychange', () => syncPreview());
  preference.addEventListener('change', () => syncPreview());
  new MutationObserver(() => syncPreview()).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'open'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
      syncPreview();
    }, { threshold: .35 }).observe(player);
  }
  select('web');
}
