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
let touchStartY = 0;
let touchStartPercentage = 100;
let touchStartTime = 0;
let didSwipePortrait = false;
let modeSettleTimer;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modeSettleDuration = reduceMotion ? 0 : 520;

function getPortraitReveal() {
  if (!hero) return activeMode === 'marketer' ? 100 : 0;

  const computedValue = Number.parseFloat(
    window.getComputedStyle(hero).getPropertyValue('--portrait-reveal')
  );
  if (Number.isFinite(computedValue)) return computedValue;
  return activeMode === 'marketer' ? 100 : 0;
}

function setMode(mode, announce = false) {
  if (!hero || !['marketer', 'designer'].includes(mode)) return;

  window.clearTimeout(modeSettleTimer);
  activeMode = mode;
  hero.dataset.mode = 'blend';
  hero.style.setProperty('--portrait-reveal', mode === 'marketer' ? '100%' : '0%');
  hero.style.setProperty('--marketer-strength', mode === 'marketer' ? '1' : '0');
  hero.style.setProperty('--designer-strength', mode === 'designer' ? '1' : '0');

  identityButtons.forEach((button) => {
    const isSelected = button.dataset.identity === mode;
    button.setAttribute('aria-pressed', String(isSelected));
    button.style.opacity = isSelected ? '1' : '0';
  });

  const finishMode = () => {
    hero.dataset.mode = mode;
    identityButtons.forEach((button) => button.style.removeProperty('opacity'));
  };

  if (modeSettleDuration === 0) {
    finishMode();
  } else {
    modeSettleTimer = window.setTimeout(finishMode, modeSettleDuration);
  }

  const readableMode = mode === 'marketer' ? 'Marketer' : 'Designer';
  if (modeLabel) modeLabel.textContent = readableMode;
  if (announce && modeLive) modeLive.textContent = `${readableMode} portrait selected.`;
}

function setBlend(marketerPercentage, announce = false) {
  if (!hero) return;

  window.clearTimeout(modeSettleTimer);
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
    button.style.opacity = String(strength);
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
      hero.dataset.tracking = 'true';
      const bounds = portrait.getBoundingClientRect();
      const pointerPosition = (event.clientX - bounds.left) / bounds.width;
      setBlend((1 - pointerPosition) * 100);
    });

    portrait.addEventListener('pointerleave', () => {
      delete hero.dataset.tracking;
      setBlend(50);
    });
  }

  portrait.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') setMode('marketer', true);
    if (event.key === 'ArrowRight') setMode('designer', true);
  });

  portrait.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
    touchStartPercentage = getPortraitReveal();
    touchStartTime = performance.now();
    didSwipePortrait = false;
    hero.dataset.swiping = 'true';
  }, { passive: true });

  portrait.addEventListener('touchmove', (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;

    if (Math.abs(distanceX) <= Math.abs(distanceY) || Math.abs(distanceX) < 4) return;

    didSwipePortrait = true;
    event.preventDefault();

    const bounds = portrait.getBoundingClientRect();
    const reveal = touchStartPercentage + (distanceX / bounds.width) * 100;
    setBlend(reveal);
  }, { passive: false });

  portrait.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    const duration = Math.max(1, performance.now() - touchStartTime);
    delete hero.dataset.swiping;

    if (!didSwipePortrait) return;
    event.preventDefault();

    const isFlick = Math.abs(distance) >= 28 && (Math.abs(distance) / duration) > .45;
    if (isFlick) {
      setMode(distance < 0 ? 'designer' : 'marketer', true);
      return;
    }

    setMode(getPortraitReveal() >= 50 ? 'marketer' : 'designer', true);
  }, { passive: false });

  portrait.addEventListener('touchcancel', () => {
    delete hero.dataset.swiping;
    if (didSwipePortrait) {
      setMode(getPortraitReveal() >= 50 ? 'marketer' : 'designer');
    }
  }, { passive: true });

  portrait.addEventListener('click', () => {
    if (didSwipePortrait) {
      didSwipePortrait = false;
      return;
    }

    if (!finePointer.matches) {
      setMode(activeMode === 'marketer' ? 'designer' : 'marketer', true);
    }
  });
}

setBlend(50);

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
