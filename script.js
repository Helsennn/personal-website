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
let portraitGesture = null;
let suppressPortraitClickUntil = 0;
let modeSettleTimer;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const touchFirstMedia = window.matchMedia('(hover: none), (pointer: coarse)');
const desktopLayout = window.matchMedia('(min-width: 920px)');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionPreference.matches;

// Pointer events can arrive faster than the display can paint. Keep one update
// per frame, and cancel queued work when a gesture ends.
function frameLatest(callback) {
  let frame = 0;
  let latest;
  const schedule = (value) => {
    latest = value;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback(latest);
    });
  };
  schedule.cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  return schedule;
}

function setPortraitDepth(x = 0, y = 0) {
  if (!identityStage) return;
  if (reduceMotion) { x = 0; y = 0; }

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

  if (reduceMotion) {
    finishMode();
  } else {
    modeSettleTimer = window.setTimeout(finishMode, 580);
  }

  const readableMode = mode === 'marketer' ? 'Marketer' : 'Designer';
  portrait?.setAttribute('aria-valuenow', mode === 'marketer' ? '0' : '100');
  portrait?.setAttribute('aria-valuetext', readableMode);
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
  portrait?.setAttribute('aria-valuenow', String(Math.round(100 - boundedPercentage)));
  portrait?.setAttribute('aria-valuetext', `${Math.round(boundedPercentage)}% Marketer, ${Math.round(100 - boundedPercentage)}% Designer`);

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

  button.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse' && finePointer.matches) setMode(button.dataset.identity);
  });
});

if (portrait) {
  const paintPortrait = frameLatest(({ reveal, x, y }) => {
    setBlend(reveal);
    setPortraitDepth(x, y);
  });

  portrait.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    paintPortrait.cancel();
    if (event.key === 'ArrowLeft') setMode('marketer', true);
    if (event.key === 'ArrowRight') setMode('designer', true);
    if (event.key === 'Home') setMode('marketer', true);
    if (event.key === 'End') setMode('designer', true);
    if (event.key === 'Enter' || event.key === ' ') setMode(activeMode === 'marketer' ? 'designer' : 'marketer', true);
  });

  portrait.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    paintPortrait.cancel();
    portraitGesture = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      reveal: getPortraitReveal(), width: portrait.getBoundingClientRect().width,
      time: performance.now(), axis: null
    };
    suppressPortraitClickUntil = 0;
  });

  portrait.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' && finePointer.matches) {
      const bounds = portrait.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      hero.dataset.tracking = 'true';
      paintPortrait({ reveal: (1 - x) * 100, x: (x - .5) * 2, y: (y - .5) * 2 });
      return;
    }
    const gesture = portraitGesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (gesture.axis === 'x') portrait.setPointerCapture(event.pointerId);
    }
    if (gesture.axis !== 'x') return;
    hero.dataset.swiping = 'true';
    paintPortrait({ reveal: gesture.reveal + dx / gesture.width * 100, x: dx / (gesture.width * .42), y: 0 });
  });

  const finishPortrait = (event) => {
    const gesture = portraitGesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    portraitGesture = null;
    paintPortrait.cancel();
    delete hero.dataset.swiping;
    setPortraitDepth();
    if (gesture.axis || event.type === 'pointercancel') suppressPortraitClickUntil = performance.now() + 400;
    if (gesture.axis === 'x') {
      const dx = event.clientX - gesture.x;
      const flick = event.type !== 'pointercancel' && Math.abs(dx) >= 28 && Math.abs(dx) / Math.max(1, performance.now() - gesture.time) > .45;
      const reveal = gesture.reveal + dx / gesture.width * 100;
      setMode(flick ? (dx < 0 ? 'designer' : 'marketer') : (reveal >= 50 ? 'marketer' : 'designer'), true);
    }
    if (portrait.hasPointerCapture(event.pointerId)) portrait.releasePointerCapture(event.pointerId);
  };
  portrait.addEventListener('pointerup', finishPortrait);
  portrait.addEventListener('pointercancel', finishPortrait);

  portrait.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    paintPortrait.cancel();
    delete hero.dataset.tracking;
    setBlend(50);
    setPortraitDepth();
  });

  portrait.addEventListener('click', () => {
    if (performance.now() < suppressPortraitClickUntil) return;
    if (!finePointer.matches) {
      setMode(activeMode === 'marketer' ? 'designer' : 'marketer', true);
    }
  });
}

setBlend(50);

if (kineticTitle) {
  const paintTitle = frameLatest((event) => {
    if (!finePointer.matches || reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = kineticTitle.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const offset = progress - .5;
    kineticTitle.style.setProperty('--title-x-one', `${offset * -18}px`);
    kineticTitle.style.setProperty('--title-x-two', `${offset * 8}px`);
    kineticTitle.style.setProperty('--title-x-three', `${offset * 22}px`);
  });
  kineticTitle.addEventListener('pointermove', paintTitle);

  kineticTitle.addEventListener('pointerleave', () => {
    paintTitle.cancel();
    kineticTitle.style.setProperty('--title-x-one', '0px');
    kineticTitle.style.setProperty('--title-x-two', '0px');
    kineticTitle.style.setProperty('--title-x-three', '0px');
  });
}

projectCovers.forEach((cover) => {
  const paintCover = frameLatest((event) => {
    if (!finePointer.matches || reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = cover.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) - .5;
    const y = ((event.clientY - bounds.top) / bounds.height) - .5;
    cover.style.setProperty('--cover-x', `${x * 20}px`);
    cover.style.setProperty('--cover-y', `${y * 16}px`);
  });
  cover.addEventListener('pointermove', paintCover);

  cover.addEventListener('pointerleave', () => {
    paintCover.cancel();
    cover.style.setProperty('--cover-x', '0px');
    cover.style.setProperty('--cover-y', '0px');
  });
});

projectGalleries.forEach((gallery) => {
  const track = gallery.querySelector('[data-gallery-track]');
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const previousButton = gallery.querySelector('[data-gallery-prev]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('[data-gallery-status]');
  let activeIndex = 0;
  let targetIndex = null;
  let scrollFrame;
  let settleTimer;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  if (!track || slides.length === 0) return;

  const updateStatus = () => {
    if (status) status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };

  const goToSlide = (index, behavior = reduceMotion ? 'auto' : 'smooth') => {
    activeIndex = (index + slides.length) % slides.length;
    targetIndex = activeIndex;
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
      if (targetIndex === null && nextIndex !== activeIndex) {
        activeIndex = Math.min(slides.length - 1, Math.max(0, nextIndex));
        updateStatus();
      }
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      targetIndex = null;
      activeIndex = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      updateStatus();
    }, 140);
  }, { passive: true });

  if (finePointer.matches) {
    track.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.pointerType !== 'mouse') return;
      targetIndex = null;
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
let mediaCards = [];
let mediaIndex = 0;
let disposeProjectRails = () => {};
const scrollLocks = new Set();
let savedScrollY = 0;

function lockScroll(owner) {
  if (!scrollLocks.size) {
    savedScrollY = window.scrollY;
    document.body.style.setProperty('--locked-scroll', `${-savedScrollY}px`);
    document.body.classList.add('scroll-locked');
  }
  scrollLocks.add(owner);
}

function unlockScroll(owner) {
  if (!scrollLocks.delete(owner) || scrollLocks.size) return;
  document.body.classList.remove('scroll-locked');
  document.body.style.removeProperty('--locked-scroll');
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, savedScrollY);
  root.style.scrollBehavior = previousBehavior;
}

function showDialog(dialog) {
  dialog.classList.remove('is-closing');
  dialog.showModal();
  if (!reduceMotion) dialog.animate([
    { opacity: 0, transform: 'translateY(14px) scale(.99)' },
    { opacity: 1, transform: 'none' }
  ], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}

function dismissDialog(dialog) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  if (reduceMotion) { dialog.close(); return; }
  const opacity = getComputedStyle(dialog).opacity;
  dialog.getAnimations().forEach((animation) => animation.cancel());
  dialog.classList.add('is-closing');
  const exit = dialog.animate([
    { opacity, transform: 'none' },
    { opacity: 0, transform: 'translateY(8px) scale(.995)' }
  ], { duration: 160, easing: 'ease-in', fill: 'forwards' });
  exit.finished.then(() => {
    dialog.close();
    exit.cancel();
    dialog.classList.remove('is-closing');
  }).catch(() => {});
}

// A drag on a gallery or cover must never become a click on its image.
function preventDragClick(element) {
  let origin;
  let suppressUntil = 0;
  element.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return;
    if (event.target.closest('video[controls]')) { origin = null; return; }
    origin = { x: event.clientX, y: event.clientY };
    suppressUntil = 0;
  }, { passive: true });
  element.addEventListener('pointermove', (event) => {
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) {
      suppressUntil = performance.now() + 500;
    }
  }, { passive: true });
  element.addEventListener('pointercancel', () => {
    origin = null;
    suppressUntil = performance.now() + 500;
  });
  element.addEventListener('pointerup', () => { origin = null; });
  element.addEventListener('click', (event) => {
    if (event.detail && performance.now() < suppressUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function setProjectPreviewActive(opener, active) {
  opener?.classList.toggle('is-previewing', active);
  opener?.setAttribute('aria-expanded', String(active));
  if (active && opener?.classList.contains('slopeframe-preview')) {
    playSlopePreview(opener);
    opener.querySelector('.featured-visual__top i').textContent = 'Open project note ↗';
  }
  const previewVideo = opener?.querySelector('.project-row__preview video');

  if (!(previewVideo instanceof HTMLVideoElement)) return;

  if (active && !reduceMotion) {
    previewVideo.play().catch(() => {});
    return;
  }

  previewVideo.pause();
  previewVideo.currentTime = 0;
}

function playSlopePreview(cover) {
  if (reduceMotion || cover.classList.contains('is-unfolding')) return;
  cover.classList.add('is-unfolding');
}

document.querySelectorAll('.slopeframe-preview').forEach((cover) => {
  cover.addEventListener('pointerenter', (event) => {
    if (finePointer.matches && event.pointerType === 'mouse') playSlopePreview(cover);
  });
  cover.addEventListener('focus', () => {
    if (cover.matches(':focus-visible')) playSlopePreview(cover);
  });
  cover.addEventListener('animationend', (event) => {
    if (event.animationName === 'slopeframe-peek-unfold') cover.classList.remove('is-unfolding');
  });
  if (touchFirstMedia.matches) cover.querySelector('.featured-visual__top i').textContent = 'Tap to preview ↗';
});

projectRows.forEach((row) => {
  row.addEventListener('pointerenter', () => {
    if (!finePointer.matches) return;
    const previewVideo = row.querySelector('.project-row__preview video');
    if (!reduceMotion) previewVideo?.play().catch(() => {});
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
  dismissDialog(mediaViewer);
}

function renderMedia(index) {
  mediaIndex = Math.min(mediaCards.length - 1, Math.max(0, index));
  const trigger = mediaCards[mediaIndex];
  const sourceImage = trigger?.querySelector('img');
  if (!mediaViewer || !mediaViewerImage || !sourceImage) return;
  mediaViewerImage.src = sourceImage.currentSrc || sourceImage.src;
  mediaViewerImage.alt = sourceImage.alt;
  if (mediaViewerCaption) {
    const caption = trigger.querySelector('.case-media-card__caption') || trigger.closest('figure')?.querySelector('figcaption');
    mediaViewerCaption.textContent = caption?.innerText.replace(/\s+/g, ' ').trim() || sourceImage.alt;
  }
  mediaViewer.querySelector('[data-media-prev]').disabled = mediaIndex === 0;
  mediaViewer.querySelector('[data-media-next]').disabled = mediaIndex === mediaCards.length - 1;
  mediaViewer.querySelector('[data-media-status]').textContent = `${String(mediaIndex + 1).padStart(2, '0')} / ${String(mediaCards.length).padStart(2, '0')}`;
  if (!reduceMotion && mediaViewer.open) {
    mediaViewerImage.getAnimations().forEach((animation) => animation.cancel());
    mediaViewerImage.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 160 });
  }
}

function openMediaViewer(trigger) {
  if (!mediaViewer || mediaViewer.open) return;
  mediaReturnFocus = trigger;
  const gallery = trigger.closest('.case-media-gallery, .case-phone-rail');
  mediaCards = gallery ? [...gallery.querySelectorAll('[data-case-image]')] : [trigger];
  renderMedia(mediaCards.indexOf(trigger));
  showDialog(mediaViewer);
}

mediaViewer?.querySelector('[data-media-prev]')?.addEventListener('click', () => renderMedia(mediaIndex - 1));
mediaViewer?.querySelector('[data-media-next]')?.addEventListener('click', () => renderMedia(mediaIndex + 1));
mediaViewer?.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  renderMedia(mediaIndex + (event.key === 'ArrowRight' ? 1 : -1));
});
let mediaSwipe = null;
mediaViewerImage?.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' || !event.isPrimary) return;
  mediaSwipe = { x: event.clientX, y: event.clientY };
});
mediaViewerImage?.addEventListener('pointerup', (event) => {
  if (!mediaSwipe) return;
  const dx = event.clientX - mediaSwipe.x;
  const dy = event.clientY - mediaSwipe.y;
  mediaSwipe = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) renderMedia(mediaIndex + (dx < 0 ? 1 : -1));
});
mediaViewerImage?.addEventListener('pointercancel', () => { mediaSwipe = null; });

function closeProjectDialog() {
  dismissDialog(projectDialog);
}

function setupProjectRails() {
  const cleanups = [];
  projectDialogContent.querySelectorAll('.case-phone-rail figure').forEach((figure) => {
    const img = figure.querySelector('img');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'case-phone-image';
    button.dataset.caseImage = '';
    button.setAttribute('aria-label', `Enlarge ${img.alt}`);
    img.before(button);
    button.append(img);
  });
  projectDialogContent.querySelectorAll('.case-phone-rail, .case-media-gallery').forEach((rail) => {
    const slides = [...rail.children];
    const toolbar = document.createElement('div');
    toolbar.className = 'case-rail-controls';
    toolbar.innerHTML = '<span>Explore images <small>Swipe · Tap to enlarge</small></span><div><button type="button" aria-label="Previous project image">←</button><span aria-live="polite"></span><button type="button" aria-label="Next project image">→</button></div>';
    rail.before(toolbar);
    const [previous, next] = toolbar.querySelectorAll('button');
    const status = toolbar.querySelector(':scope > div > span');
    let index = 0;
    let targetIndex = null;
    let settle;
    const position = (slide) => slide.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
    const update = () => {
      toolbar.hidden = rail.scrollWidth <= rail.clientWidth + 2;
      const first = position(slides[0]);
      if (targetIndex === null) index = slides.reduce((nearest, slide, i) => Math.abs(position(slide) - first - rail.scrollLeft) < Math.abs(position(slides[nearest]) - first - rail.scrollLeft) ? i : nearest, 0);
      previous.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const go = (delta) => {
      index = Math.max(0, Math.min(slides.length - 1, index + delta));
      targetIndex = index;
      rail.scrollTo({ left: position(slides[index]) - position(slides[0]), behavior: reduceMotion ? 'instant' : 'smooth' });
      update();
    };
    previous.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    const paint = frameLatest(update);
    rail.addEventListener('scroll', () => {
      paint();
      clearTimeout(settle);
      settle = setTimeout(() => { targetIndex = null; update(); }, 140);
    }, { passive: true });
    rail.addEventListener('pointerdown', () => { targetIndex = null; }, { passive: true });
    const observer = new ResizeObserver(paint);
    observer.observe(rail);
    cleanups.push(() => { observer.disconnect(); paint.cancel(); clearTimeout(settle); });
    update();
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

function openProjectDialog(projectKey, trigger) {
  if (!projectDialog || !projectDialogContent || projectDialog.open) return;

  const template = document.querySelector(`#project-${projectKey}`);
  if (!(template instanceof HTMLTemplateElement)) return;

  projectReturnFocus = trigger || document.activeElement;
  projectDialogContent.replaceChildren(template.content.cloneNode(true));
  document.body.classList.add('dialog-open');
  lockScroll('project');
  projectDialog.setAttribute('aria-labelledby', 'active-project-title');
  projectDialogContent.querySelector('h2').id = 'active-project-title';
  showDialog(projectDialog);
  projectDialog.querySelector('.project-dialog__shell')?.scrollTo({ top: 0, behavior: 'instant' });
  disposeProjectRails = setupProjectRails();
}

projectOpeners.forEach((opener) => {
  preventDragClick(opener);
  opener.addEventListener('click', (event) => {
    const usesTouchPreview = (
      touchFirstMedia.matches || window.innerWidth < 700
    ) && (
      opener.classList.contains('slopeframe-preview') ||
      opener.classList.contains('project-row')
    ) && event.detail !== 0;

    if (usesTouchPreview && !opener.classList.contains('is-previewing')) {
      setProjectPreviewActive(opener, true);
      return;
    }

    // Retain the expanded row behind the note, so closing returns to exactly
    // the same reading position. Opening a later row never collapses one above.
    openProjectDialog(opener.dataset.projectOpen, opener);
  });
});

if (projectDialogContent) preventDragClick(projectDialogContent);
projectDialogContent?.addEventListener('click', (event) => {
  const mediaCard = event.target.closest('[data-case-image]');
  if (!(mediaCard instanceof HTMLButtonElement)) return;
  openMediaViewer(mediaCard);
});

projectDialogClose?.addEventListener('click', closeProjectDialog);
mediaViewerClose?.addEventListener('click', closeMediaViewer);
projectDialog?.addEventListener('cancel', (event) => { event.preventDefault(); closeProjectDialog(); });
mediaViewer?.addEventListener('cancel', (event) => { event.preventDefault(); closeMediaViewer(); });

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
  mediaCards = [];
});

projectDialog?.addEventListener('close', () => {
  closeMediaViewer();
  disposeProjectRails();
  document.body.classList.remove('dialog-open');
  unlockScroll('project');
  projectDialogContent?.querySelectorAll('video').forEach((video) => video.pause());
  if (projectReturnFocus instanceof HTMLElement) projectReturnFocus.focus({ preventScroll: true });
  projectReturnFocus = null;
});

publicationDetails.forEach((details) => {
  const summary = details.querySelector('summary');
  let animation;
  summary.addEventListener('click', (event) => {
    if (reduceMotion) return;
    event.preventDefault();
    const from = details.getBoundingClientRect().height;
    const opening = details.dataset.expanding ? details.dataset.expanding === 'false' : !details.open;
    animation?.cancel();
    details.dataset.expanding = String(opening);
    details.style.height = '';
    details.open = true;
    const to = opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
    animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    animation.onfinish = () => {
      details.open = opening;
      delete details.dataset.expanding;
      animation = null;
    };
  });
});

function syncMenuAccess() {
  if (!nav) return;
  nav.inert = !desktopLayout.matches && !nav.classList.contains('is-open');
}

function closeMenu(returnFocus = false) {
  if (!menuToggle || !nav) return;
  const wasOpen = nav.classList.contains('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = 'Menu';
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  document.querySelector('main').inert = false;
  document.querySelector('.site-footer').inert = false;
  unlockScroll('menu');
  syncMenuAccess();
  if (returnFocus && wasOpen) menuToggle.focus({ preventScroll: true });
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) { closeMenu(true); return; }
    lockScroll('menu');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.querySelector('span').textContent = 'Close';
    nav.classList.add('is-open');
    document.body.classList.add('menu-open');
    document.querySelector('main').inert = true;
    document.querySelector('.site-footer').inert = true;
    syncMenuAccess();
    nav.querySelector('a').focus({ preventScroll: true });
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
  nav.addEventListener('click', (event) => { if (event.target === nav) closeMenu(true); });
  document.querySelector('.wordmark')?.addEventListener('click', () => closeMenu());

  document.addEventListener('keydown', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.key === 'Tab') {
      const controls = [...document.querySelectorAll('.site-header a, .site-header button')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  desktopLayout.addEventListener('change', () => closeMenu());
  syncMenuAccess();
}

const sectionLinks = [...document.querySelectorAll('.site-nav a')];
const navSections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean).sort((a, b) => a.offsetTop - b.offsetTop);
const updateNavigation = frameLatest(() => {
  if (scrollLocks.size) return;
  const active = navSections.filter((section) => section.getBoundingClientRect().top <= window.innerHeight * .35).at(-1);
  sectionLinks.forEach((link) => {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
});
window.addEventListener('scroll', updateNavigation, { passive: true });
window.addEventListener('resize', updateNavigation, { passive: true });
updateNavigation();

motionPreference.addEventListener('change', (event) => {
  reduceMotion = event.matches;
  if (reduceMotion) {
    setPortraitDepth();
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
    document.querySelectorAll('.project-row video').forEach((video) => video.pause());
    publicationDetails.forEach((details) => details.getAnimations().forEach((animation) => animation.finish()));
  }
});

// Continuous decorative motion and preview video only run while visible.
const ambientElements = [...document.querySelectorAll('.practice-marquee, .project-row:has(video)')];
if ('IntersectionObserver' in window) {
  const ambientObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      target.classList.toggle('is-offscreen', !isIntersecting);
      const video = target.querySelector('video');
      if (video && !isIntersecting) video.pause();
      else if (video && !reduceMotion && target.classList.contains('is-previewing')) video.play().catch(() => {});
    });
  });
  ambientElements.forEach((element) => ambientObserver.observe(element));
}
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) document.querySelectorAll('video').forEach((video) => video.pause());
});

const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });

  reveals.forEach((element) => revealObserver.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
