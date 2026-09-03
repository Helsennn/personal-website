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
const projectGalleries = [...document.querySelectorAll('[data-project-gallery]')];
const projectDialog = document.querySelector('[data-project-dialog]');
const projectDialogContent = document.querySelector('[data-project-content]');
const projectDialogClose = document.querySelector('[data-project-close]');
const projectOpeners = [...document.querySelectorAll('[data-project-open]')];
const projectRows = [...document.querySelectorAll('.project-row')];
const mediaViewer = document.querySelector('[data-media-viewer]');
const mediaViewerImage = document.querySelector('[data-media-viewer-image]');
const mediaViewerCaption = document.querySelector('[data-media-viewer-caption]');
const mediaViewerClose = document.querySelector('[data-media-viewer-close]');
const publicationDetails = [...document.querySelectorAll('[data-publication-accordion] details')];

let activeMode = 'marketer';
let touchStartX = 0;
let touchStartY = 0;
let touchStartPercentage = 100;
let touchStartTime = 0;
let didSwipePortrait = false;
let modeSettleTimer;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const touchFirstMedia = window.matchMedia('(hover: none), (pointer: coarse)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modeSettleDuration = reduceMotion ? 0 : 680;

function setPortraitDepth(x = 0, y = 0) {
  if (!identityStage || reduceMotion) return;

  const boundedX = Math.min(1, Math.max(-1, x));
  const boundedY = Math.min(1, Math.max(-1, y));
  identityStage.style.setProperty('--stage-x', `${boundedX * 7}px`);
  identityStage.style.setProperty('--stage-y', `${boundedY * 5}px`);
  identityStage.style.setProperty('--stage-tilt-x', `${boundedY * -1.25}deg`);
  identityStage.style.setProperty('--stage-tilt-y', `${boundedX * 1.8}deg`);
}

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
      const pointerY = (event.clientY - bounds.top) / bounds.height;
      setBlend((1 - pointerPosition) * 100);
      setPortraitDepth((pointerPosition - .5) * 2, (pointerY - .5) * 2);
    });

    portrait.addEventListener('pointerleave', () => {
      delete hero.dataset.tracking;
      setBlend(50);
      setPortraitDepth();
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
    setPortraitDepth(Math.max(-1, Math.min(1, distanceX / (bounds.width * .42))), 0);
  }, { passive: false });

  portrait.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    const duration = Math.max(1, performance.now() - touchStartTime);
    delete hero.dataset.swiping;
    setPortraitDepth();

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
    setPortraitDepth();
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

projectGalleries.forEach((gallery) => {
  const track = gallery.querySelector('[data-gallery-track]');
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const previousButton = gallery.querySelector('[data-gallery-prev]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('[data-gallery-status]');
  let activeIndex = 0;
  let scrollFrame;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  if (!track || slides.length === 0) return;

  const updateStatus = () => {
    if (status) status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };

  const goToSlide = (index, behavior = reduceMotion ? 'auto' : 'smooth') => {
    activeIndex = (index + slides.length) % slides.length;
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior });
    updateStatus();
  };

  previousButton?.addEventListener('click', () => goToSlide(activeIndex - 1));
  nextButton?.addEventListener('click', () => goToSlide(activeIndex + 1));

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToSlide(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToSlide(activeIndex + 1);
    }
  });

  track.addEventListener('scroll', () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const nextIndex = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (nextIndex !== activeIndex) {
        activeIndex = Math.min(slides.length - 1, Math.max(0, nextIndex));
        updateStatus();
      }
    });
  }, { passive: true });

  if (finePointer.matches) {
    track.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    });

    track.addEventListener('pointermove', (event) => {
      if (!isDragging) return;
      track.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });

    const finishDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      goToSlide(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
    };

    track.addEventListener('pointerup', finishDrag);
    track.addEventListener('pointercancel', finishDrag);
    track.addEventListener('dragstart', (event) => event.preventDefault());
  }

  updateStatus();
});

let projectReturnFocus = null;
let mediaReturnFocus = null;
let selectedMobileMedia = null;
let touchProjectPreview = null;
let touchProjectPreviewTimer;
let touchProjectAnimationTimer;

function setProjectPreviewActive(opener, active) {
  opener?.classList.toggle('is-previewing', active);
  const previewVideo = opener?.querySelector('.project-row__preview video');

  if (!(previewVideo instanceof HTMLVideoElement)) return;

  if (active) {
    previewVideo.play().catch(() => {});
    return;
  }

  previewVideo.pause();
  previewVideo.currentTime = 0;
}

projectRows.forEach((row) => {
  row.addEventListener('pointerenter', () => {
    if (!finePointer.matches) return;
    const previewVideo = row.querySelector('.project-row__preview video');
    previewVideo?.play().catch(() => {});
  });

  row.addEventListener('pointerleave', () => {
    if (!finePointer.matches) return;
    const previewVideo = row.querySelector('.project-row__preview video');
    if (!(previewVideo instanceof HTMLVideoElement)) return;
    previewVideo.pause();
    previewVideo.currentTime = 0;
  });
});

function closeMediaViewer() {
  if (!mediaViewer?.open) return;
  mediaViewer.close();
}

function openMediaViewer(trigger) {
  const sourceImage = trigger?.querySelector('img');
  if (!mediaViewer || !mediaViewerImage || !sourceImage) return;

  mediaReturnFocus = trigger;
  mediaViewerImage.src = sourceImage.currentSrc || sourceImage.src;
  mediaViewerImage.alt = sourceImage.alt;

  if (mediaViewerCaption) {
    const caption = trigger.querySelector('.case-media-card__caption');
    mediaViewerCaption.textContent = caption?.innerText.replace(/\s+/g, ' ').trim() || sourceImage.alt;
  }

  if (typeof mediaViewer.showModal === 'function') {
    mediaViewer.showModal();
  } else {
    mediaViewer.setAttribute('open', '');
  }
}

function closeProjectDialog() {
  if (!projectDialog?.open) return;
  projectDialog.close();
}

function openProjectDialog(projectKey, trigger) {
  if (!projectDialog || !projectDialogContent) return;

  const template = document.querySelector(`#project-${projectKey}`);
  if (!(template instanceof HTMLTemplateElement)) return;

  projectReturnFocus = trigger || document.activeElement;
  selectedMobileMedia = null;
  projectDialogContent.replaceChildren(template.content.cloneNode(true));
  document.body.classList.add('dialog-open');

  if (typeof projectDialog.showModal === 'function') {
    projectDialog.showModal();
  } else {
    projectDialog.setAttribute('open', '');
  }

  projectDialog.querySelector('.project-dialog__shell')?.scrollTo({ top: 0, behavior: 'auto' });
}

projectOpeners.forEach((opener) => {
  opener.addEventListener('click', (event) => {
    const usesTouchPreview = (
      touchFirstMedia.matches || window.innerWidth < 700
    ) && (
      opener.classList.contains('slopeframe-preview') ||
      opener.classList.contains('project-row')
    ) && event.detail !== 0 && !reduceMotion;

    if (usesTouchPreview && touchProjectPreview !== opener) {
      window.clearTimeout(touchProjectPreviewTimer);
      window.clearTimeout(touchProjectAnimationTimer);
      setProjectPreviewActive(touchProjectPreview, false);
      touchProjectPreview = opener;
      setProjectPreviewActive(opener, false);
      void opener.offsetWidth;
      setProjectPreviewActive(opener, true);

      if (opener.classList.contains('slopeframe-preview')) {
        touchProjectAnimationTimer = window.setTimeout(() => {
          setProjectPreviewActive(opener, false);
        }, 3000);
      }

      touchProjectPreviewTimer = window.setTimeout(() => {
        setProjectPreviewActive(opener, false);
        touchProjectPreview = null;
      }, opener.classList.contains('project-row') ? 10000 : 7000);
      return;
    }

    window.clearTimeout(touchProjectPreviewTimer);
    window.clearTimeout(touchProjectAnimationTimer);
    setProjectPreviewActive(opener, false);
    touchProjectPreview = null;
    openProjectDialog(opener.dataset.projectOpen, opener);
  });
});

projectDialogContent?.addEventListener('click', (event) => {
  const mediaCard = event.target.closest('[data-case-image]');
  if (!(mediaCard instanceof HTMLButtonElement)) return;

  const usesTouchFirstMedia = touchFirstMedia.matches || window.innerWidth < 700;
  if (!usesTouchFirstMedia || event.detail === 0 || selectedMobileMedia === mediaCard) {
    openMediaViewer(mediaCard);
    return;
  }

  projectDialogContent.querySelectorAll('[data-case-image].is-active').forEach((card) => {
    card.classList.remove('is-active');
    card.setAttribute('aria-pressed', 'false');
  });
  mediaCard.classList.add('is-active');
  mediaCard.setAttribute('aria-pressed', 'true');
  selectedMobileMedia = mediaCard;
});

projectDialogClose?.addEventListener('click', closeProjectDialog);
mediaViewerClose?.addEventListener('click', closeMediaViewer);

projectDialog?.addEventListener('click', (event) => {
  if (event.target === projectDialog) closeProjectDialog();
});

mediaViewer?.addEventListener('click', (event) => {
  if (event.target === mediaViewer) closeMediaViewer();
});

mediaViewer?.addEventListener('close', () => {
  if (mediaViewerImage) {
    mediaViewerImage.removeAttribute('src');
    mediaViewerImage.alt = '';
  }
  if (mediaReturnFocus instanceof HTMLElement) mediaReturnFocus.focus({ preventScroll: true });
  mediaReturnFocus = null;
});

projectDialog?.addEventListener('close', () => {
  closeMediaViewer();
  document.body.classList.remove('dialog-open');
  projectDialogContent?.querySelectorAll('video').forEach((video) => video.pause());
  if (projectReturnFocus instanceof HTMLElement) projectReturnFocus.focus({ preventScroll: true });
  projectReturnFocus = null;
});

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
