const hero = document.querySelector('[data-hero]');
const identityStage = document.querySelector('[data-identity-stage]');
const portrait = document.querySelector('[data-portrait]');
const identityButtons = [...document.querySelectorAll('[data-identity]')];
const modeLabel = document.querySelector('[data-mode-label]');
const modeLive = document.querySelector('[data-mode-live]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const kineticTitle = document.querySelector('[data-kinetic-title]');
const projectCovers = [...document.querySelectorAll('[data-project-cover]')];
const publicationDetails = [...document.querySelectorAll('[data-publication-accordion] details')];

let activeMode = 'marketer';
let touchStartX = 0;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function setMode(mode, announce = false) {
  if (!hero || !['marketer', 'designer'].includes(mode)) return;

  activeMode = mode;
  hero.dataset.mode = mode;
  hero.style.setProperty('--portrait-reveal', mode === 'marketer' ? '100%' : '0%');
  hero.style.setProperty('--marketer-strength', mode === 'marketer' ? '1' : '0');
  hero.style.setProperty('--designer-strength', mode === 'designer' ? '1' : '0');

  identityButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.identity === mode));
    button.style.removeProperty('opacity');
  });

  const readableMode = mode === 'marketer' ? 'Marketer' : 'Designer';
  if (modeLabel) modeLabel.textContent = readableMode;
  if (announce && modeLive) modeLive.textContent = `${readableMode} portrait selected.`;
}

function setBlend(marketerPercentage, announce = false) {
  if (!hero) return;

  const boundedPercentage = Math.min(100, Math.max(0, marketerPercentage));
  activeMode = boundedPercentage >= 50 ? 'marketer' : 'designer';
  hero.dataset.mode = 'blend';
  hero.style.setProperty('--portrait-reveal', `${boundedPercentage}%`);
  hero.style.setProperty('--marketer-strength', String(boundedPercentage / 100));
  hero.style.setProperty('--designer-strength', String((100 - boundedPercentage) / 100));

  identityButtons.forEach((button) => {
    const strength = button.dataset.identity === 'marketer'
      ? boundedPercentage / 100
      : (100 - boundedPercentage) / 100;
    button.setAttribute('aria-pressed', 'false');
    button.style.opacity = String(.12 + strength * .88);
  });

  if (modeLabel) modeLabel.textContent = 'Marketer / Designer';
  if (announce && modeLive) {
    modeLive.textContent = `Blended portrait view, ${Math.round(boundedPercentage)} percent Marketer and ${Math.round(100 - boundedPercentage)} percent Designer.`;
  }
}

identityButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.identity, true));

  if (finePointer.matches) {
    button.addEventListener('pointerenter', () => setMode(button.dataset.identity));
  }
});

if (portrait) {
  if (finePointer.matches) {
    portrait.addEventListener('pointermove', (event) => {
      const bounds = portrait.getBoundingClientRect();
      const pointerPosition = (event.clientX - bounds.left) / bounds.width;
      setBlend((1 - pointerPosition) * 100);
    });

    portrait.addEventListener('pointerleave', () => setBlend(50));
  }

  portrait.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') setMode('marketer', true);
    if (event.key === 'ArrowRight') setMode('designer', true);
  });

  portrait.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  portrait.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 36) return;
    setMode(distance < 0 ? 'designer' : 'marketer', true);
  }, { passive: true });

  portrait.addEventListener('click', () => {
    if (!finePointer.matches) {
      setMode(activeMode === 'marketer' ? 'designer' : 'marketer', true);
    }
  });
}

if (finePointer.matches) {
  setBlend(50);
} else {
  setMode('marketer');
}

if (kineticTitle && finePointer.matches) {
  kineticTitle.addEventListener('pointermove', (event) => {
    const bounds = kineticTitle.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const offset = progress - .5;
    kineticTitle.style.setProperty('--title-x-one', `${offset * -18}px`);
    kineticTitle.style.setProperty('--title-x-two', `${offset * 8}px`);
    kineticTitle.style.setProperty('--title-x-three', `${offset * 22}px`);
  });

  kineticTitle.addEventListener('pointerleave', () => {
    kineticTitle.style.setProperty('--title-x-one', '0px');
    kineticTitle.style.setProperty('--title-x-two', '0px');
    kineticTitle.style.setProperty('--title-x-three', '0px');
  });
}

if (finePointer.matches) {
  projectCovers.forEach((cover) => {
    cover.addEventListener('pointermove', (event) => {
      const bounds = cover.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) - .5;
      const y = ((event.clientY - bounds.top) / bounds.height) - .5;
      cover.style.setProperty('--cover-x', `${x * 20}px`);
      cover.style.setProperty('--cover-y', `${y * 16}px`);
    });

    cover.addEventListener('pointerleave', () => {
      cover.style.setProperty('--cover-x', '0px');
      cover.style.setProperty('--cover-y', '0px');
    });
  });
}

publicationDetails.forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    publicationDetails.forEach((otherDetails) => {
      if (otherDetails !== details) otherDetails.open = false;
    });
  });
});

function closeMenu() {
  if (!menuToggle || !nav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = 'Menu';
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.querySelector('span').textContent = isOpen ? 'Menu' : 'Close';
    nav.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const reveals = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

  reveals.forEach((element) => revealObserver.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
