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
const projectJump = document.querySelector('[data-project-jump]');
const projectShell = projectDialog?.querySelector('.project-dialog__shell');
const projectOpeners = [...document.querySelectorAll('[data-project-open]')];
const projectRows = [...document.querySelectorAll('.project-row')];
const mediaViewer = document.querySelector('[data-media-viewer]');
const mediaViewerImage = document.querySelector('[data-media-viewer-image]');
const mediaViewerCaption = document.querySelector('[data-media-viewer-caption]');
const mediaViewerClose = document.querySelector('[data-media-viewer-close]');
const mediaViewport = document.querySelector('[data-media-viewport]');
const mediaZoomIn = document.querySelector('[data-media-zoom-in]');
const mediaZoomOut = document.querySelector('[data-media-zoom-out]');
const mediaFitButton = document.querySelector('[data-media-fit]');
const mediaActualButton = document.querySelector('[data-media-actual]');
const mediaZoomStatus = document.querySelector('[data-media-zoom-status]');
const publicationDetails = [...document.querySelectorAll('[data-publication-accordion] details')];
const readingProgress = document.querySelector('[data-reading-progress]');
const marquee = document.querySelector('.practice-marquee');
const marqueeToggle = document.querySelector('[data-marquee-toggle]');

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
    // Keep both labels readable around the midpoint, while still fading out
    // the opposite identity completely at either end of the portrait.
    button.style.opacity = String(1 - (1 - strength) ** 2);
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
  const images = slides.map((slide) => slide.querySelector('[data-case-image]'));
  const previousButton = gallery.querySelector('[data-gallery-prev]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('[data-gallery-status]');
  let activeIndex = 0;
  let targetIndex = null;
  let scrollFrame;
  let settleTimer;
  let drag = null;
  let previousWidth = 0;

  if (!track || slides.length === 0) return;

  const updateStatus = () => {
    if (status) status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    images.forEach((image, index) => { if (image) image.tabIndex = index === activeIndex ? 0 : -1; });
    if (!mediaViewer?.open && images.includes(document.activeElement) && document.activeElement !== images[activeIndex]) {
      images[activeIndex]?.focus({ preventScroll: true });
    }
  };
  const goToSlide = (index, behavior = reduceMotion ? 'instant' : 'smooth') => {
    activeIndex = (index + slides.length) % slides.length;
    targetIndex = activeIndex;
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior });
    updateStatus();
  };
  gallery.querySelector('[data-gallery-enlarge]')?.addEventListener('click', () => openMediaViewer(images[activeIndex]));
  previousButton?.addEventListener('click', () => goToSlide(activeIndex - 1));
  nextButton?.addEventListener('click', () => goToSlide(activeIndex + 1));
  gallery.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const focusedIndex = images.indexOf(event.target.closest('[data-case-image]'));
    goToSlide((focusedIndex >= 0 ? focusedIndex : activeIndex) + (event.key === 'ArrowRight' ? 1 : -1));
    if (focusedIndex >= 0) images[activeIndex]?.focus({ preventScroll: true });
  });

  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const nextIndex = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (targetIndex === null && nextIndex !== activeIndex) {
        activeIndex = Math.min(slides.length - 1, Math.max(0, nextIndex));
        updateStatus();
      }
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      targetIndex = null;
      activeIndex = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
      updateStatus();
    }, 140);
  }, { passive: true });

  preventDragClick(track);
  track.addEventListener('pointerdown', (event) => {
    targetIndex = null;
    if (event.button !== 0 || event.pointerType !== 'mouse' || !event.isPrimary) return;
    drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const distance = event.clientX - drag.x;
    if (!drag.moved && Math.abs(distance) <= 10) return;
    if (!drag.moved) {
      drag.moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    }
    track.scrollLeft = drag.left - distance;
  });
  const finishDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (moved) goToSlide(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
  };
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('pointerleave', (event) => { if (drag && !drag.moved) finishDrag(event); });
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('click', (event) => {
    const image = event.target.closest('[data-case-image]');
    if (image instanceof HTMLButtonElement) openMediaViewer(image);
  });
  mediaViewer?.addEventListener('close', () => {
    if (!gallery.contains(mediaReturnFocus)) return;
    const viewed = images.indexOf(mediaCards[mediaIndex]);
    if (viewed < 0) return;
    goToSlide(viewed, 'instant');
    mediaReturnFocus = images[viewed];
  });
  new ResizeObserver(() => {
    if (track.clientWidth === previousWidth) return;
    previousWidth = track.clientWidth;
    goToSlide(activeIndex, 'instant');
  }).observe(track);
  updateStatus();
});

let projectReturnFocus = null;
let mediaReturnFocus = null;
let mediaCards = [];
let mediaIndex = 0;
let mediaReturnScroll = 0;
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
  let dragged = false;
  let suppressUntil = 0;
  element.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return;
    if (event.target.closest('video[controls]')) { origin = null; return; }
    origin = { x: event.clientX, y: event.clientY };
    dragged = false;
    suppressUntil = 0;
  }, { passive: true });
  element.addEventListener('pointermove', (event) => {
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) {
      dragged = true;
      suppressUntil = performance.now() + 500;
    }
  }, { passive: true });
  element.addEventListener('pointercancel', () => {
    origin = null;
    suppressUntil = performance.now() + 500;
  });
  element.addEventListener('pointerup', () => {
    // Suppress from release, including a slow drag held still before lifting.
    if (dragged) suppressUntil = performance.now() + 500;
    origin = null;
  });
  element.addEventListener('click', (event) => {
    if (event.detail && performance.now() < suppressUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function setProjectPreviewActive(opener, active) {
  opener?.classList.toggle('is-previewing', active);
  opener?.querySelector('[data-project-preview]')?.setAttribute('aria-expanded', String(active));
  const indicator = opener?.querySelector('.project-row__arrow');
  if (indicator) indicator.textContent = finePointer.matches && window.innerWidth >= 920 ? '↗' : active ? '−' : '+';
  const panel = opener?.querySelector('.project-row__preview');
  if (panel) panel.inert = !active;
  const previewVideo = opener?.querySelector('.project-row__preview video');

  if (!(previewVideo instanceof HTMLVideoElement)) return;

  if (active && !reduceMotion) {
    previewVideo.play().catch(() => {});
    return;
  }

  previewVideo.pause();
  previewVideo.currentTime = 0;
}

// A cover composition becomes a focused product walkthrough; the six source cards stay in DOM order.
document.querySelectorAll('.slopeframe-preview').forEach((cover) => {
  const stage = cover.querySelector('[data-preview-gallery]');
  const slides = [...stage.querySelectorAll('.slopeframe-screen')];
  const buttons = slides.map((slide) => slide.querySelector('[data-preview-image]'));
  const close = cover.querySelector('[data-preview-expand]');
  const deckOpen = cover.querySelector('[data-preview-deck-open]');
  const story = cover.querySelector('[data-preview-story]');
  const eyebrow = cover.querySelector('[data-preview-eyebrow]');
  const title = cover.querySelector('[data-preview-title]');
  const description = cover.querySelector('[data-preview-description]');
  const action = cover.querySelector('[data-preview-action]');
  const actionLabel = cover.querySelector('[data-preview-action-label]');
  const selectors = cover.querySelector('[data-preview-selectors]');
  const tabs = [...cover.querySelectorAll('[data-screen-select]')];
  const count = cover.querySelector('[data-preview-count]');
  const selectorTrack = cover.querySelector('.slopeframe-selectors__track');
  const previousScreen = cover.querySelector('[data-preview-previous]');
  const nextScreen = cover.querySelector('[data-preview-next]');
  const mobileClose = cover.querySelector('[data-preview-mobile-close]');
  const pages = [
    ['Today', 'A day worth<br>keeping.', 'Your resort, your next run, and the moments ahead—all in one place.'],
    ['Book', 'Meet your<br>mountain crew.', 'Discover local photographers and find a session that fits your day.'],
    ['AI Match', 'Find yourself<br>in the frame.', 'Match the mountain, the moment, and your gear to find your photos.'],
    ['Trips', 'Keep the<br>whole day.', 'Purchased photos and ski-day albums, together in your personal archive.'],
    ['Album', 'Back to<br>that feeling.', 'Revisit the runs, the people, and the photos that made a day yours.'],
    ['Profile', 'Your kind<br>of mountain.', 'A ski profile built around your level, your gear, and your home mountain.']
  ];
  let expanded = false;
  let pinned = false;
  let pointerInside = false;
  let suppressHoverUntilLeave = false;
  let enterTimer;
  let leaveTimer;
  let selectionTimer;
  let ownsViewer = false;
  let active = 0;
  let lastWidth = 0;
  let screenGesture = null;
  let suppressImageClickUntil = 0;
  const layout = () => {
    const width = stage.clientWidth;
    const mobile = width < 680;
    const storyBottom = story.offsetTop + story.offsetHeight;
    let mainWidth = mobile ? Math.min(218, width * .49) : Math.min(226, width * .255);
    if (mobile && expanded) {
      const headerHeight = document.querySelector('[data-header]')?.offsetHeight || 0;
      const availableHeight = window.innerHeight - headerHeight - cover.querySelector('.slopeframe-preview__bar').offsetHeight - storyBottom - selectors.offsetHeight - 90;
      mainWidth = Math.min(mainWidth, Math.max(120, (availableHeight - 8) * 1206 / 2622 + 8));
    }
    const mainHeight = (mainWidth - 8) * 2622 / 1206 + 8;
    const mainTop = mobile ? storyBottom + (expanded ? 18 : 38) : Math.max(18, (548 - mainHeight) / 2 - 18);
    const center = mobile ? width / 2 : width * .73;
    const compositionWidth = mobile ? mainWidth : Math.min(mainWidth, width * .225);
    const compositionCenter = center + (!mobile && width < 900 ? width * .03 : 0);
    const navTop = mobile ? mainTop + mainHeight + 20 : Math.max(370, storyBottom + 30);
    selectors.style.top = `${navTop}px`;
    const navLeft = width * (mobile ? .06 : .0435);
    const navWidth = width * (mobile ? .88 : .34);
    const thumbGap = mobile ? 7 : 9;
    const thumbWidth = mobile ? Math.max(44, (navWidth - 35) / 6) : (navWidth - 45) / 6;
    const coverX = [0, -.56, .64, -.99, 1.03, .2];
    const coverY = [0, 53, 68, 104, 122, 50];
    const coverScale = [1, .86, .83, .7, .69, .77];
    const coverAngle = [-2, -12, 10, -17, 16, 5];
    slides.forEach((slide, i) => {
      const selected = expanded && i === active;
      const cardWidth = expanded ? (selected ? mainWidth : thumbWidth) : compositionWidth * coverScale[i];
      const x = expanded ? (selected ? center - cardWidth / 2 : navLeft + i * (thumbWidth + thumbGap)) : compositionCenter - cardWidth / 2 + coverX[i] * compositionWidth;
      const y = expanded ? (selected ? mainTop : navTop + 28) : mainTop + coverY[i] * (mobile ? .64 : 1);
      slide.style.left = `${x}px`;
      slide.style.top = `${y}px`;
      slide.style.width = `${cardWidth}px`;
      slide.style.transform = `rotate(${expanded ? 0 : coverAngle[i]}deg)`;
      slide.style.opacity = expanded ? (selected ? '1' : '0') : (i === 0 ? '1' : '.92');
      slide.style.zIndex = selected || (!expanded && i === 0) ? '8' : String(7 - i);
      slide.classList.toggle('is-active', selected);
      slide.inert = !selected;
    });
    const baseHeight = mobile ? mainTop + mainHeight + 52 : Math.max(548, mainTop + mainHeight + 50);
    stage.style.height = `${expanded ? Math.max(baseHeight, navTop + selectors.offsetHeight + 28) : baseHeight}px`;
    deckOpen.style.left = mobile ? '0' : '43%';
    deckOpen.style.top = `${mobile ? mainTop - 15 : 0}px`;
    deckOpen.style.width = mobile ? '100%' : '57%';
    deckOpen.style.height = `${(mobile ? 0 : mainTop) + mainHeight + 40}px`;
  };
  const update = (animate = false) => {
    cover.classList.toggle('is-expanded', expanded);
    close.hidden = !expanded;
    close.setAttribute('aria-expanded', String(expanded));
    deckOpen.hidden = expanded;
    selectors.hidden = !expanded;
    eyebrow.textContent = expanded ? `${String(active + 1).padStart(2, '0')} / ${pages[active][0]}` : 'A day on the mountain';
    title.innerHTML = (expanded ? pages[active][1] : 'From first lift<br>to last frame.').replace('<br>', '<span class="slopeframe-title-break"> </span>');
    description.textContent = expanded ? pages[active][2] : 'Find your people, your photos, and a day worth keeping.';
    actionLabel.textContent = expanded ? 'View full screen' : 'Explore the experience';
    count.textContent = `${String(active + 1).padStart(2, '0')} / 06`;
    previousScreen.disabled = active === 0;
    nextScreen.disabled = active === slides.length - 1;
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === active)));
    layout();
    if (expanded && selectorTrack.scrollWidth > selectorTrack.clientWidth + 2) {
      selectorTrack.scrollTo({ left: tabs[active].offsetLeft - tabs[0].offsetLeft + tabs[active].offsetWidth / 2 - selectorTrack.clientWidth / 2, behavior: reduceMotion ? 'instant' : 'smooth' });
    }
    if (animate && !reduceMotion) {
      [eyebrow, title, description].forEach((node) => {
        node.getAnimations().forEach((animation) => animation.cancel());
        node.animate([{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    }
  };
  const clearHoverTimers = () => {
    clearTimeout(enterTimer);
    clearTimeout(leaveTimer);
    clearTimeout(selectionTimer);
  };
  const collapse = () => {
    clearHoverTimers();
    const restoreFocus = slides.some((slide) => slide.contains(document.activeElement)) || selectors.contains(document.activeElement) || document.activeElement === close;
    pinned = false;
    expanded = false;
    screenGesture = null;
    update(true);
    if (restoreFocus) action.focus({ preventScroll: true });
  };
  const openOverview = (pin = true) => {
    clearHoverTimers();
    pinned = pinned || pin;
    if (expanded) return;
    expanded = true;
    update(true);
    if (pin && stage.clientWidth < 680) cover.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'instant' : 'smooth' });
  };
  const scheduleCollapse = () => {
    clearTimeout(leaveTimer);
    if (!expanded || pinned || pointerInside || mediaViewer?.open) return;
    leaveTimer = setTimeout(() => {
      if (!pinned && !pointerInside && !mediaViewer?.open) collapse();
    }, 240);
  };
  const openDetail = (returnFocus) => {
    clearHoverTimers();
    ownsViewer = true;
    openMediaViewer(buttons[active]);
    mediaReturnFocus = returnFocus;
  };
  cover.addEventListener('pointerenter', (event) => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    pointerInside = true;
    clearTimeout(leaveTimer);
    if (expanded || suppressHoverUntilLeave || mediaViewer?.open) return;
    enterTimer = setTimeout(() => {
      if (pointerInside && !suppressHoverUntilLeave && !mediaViewer?.open) openOverview(false);
    }, 130);
  });
  cover.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    pointerInside = false;
    suppressHoverUntilLeave = false;
    clearTimeout(enterTimer);
    clearTimeout(selectionTimer);
    scheduleCollapse();
  });
  // Actual keyboard interaction pins the view; programmatic focus restoration does not.
  cover.addEventListener('keydown', (event) => {
    if (expanded && ['Tab','ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      pinned = true;
      clearHoverTimers();
    }
  });
  deckOpen.addEventListener('click', () => { openOverview(); action.focus({ preventScroll: true }); });
  action.addEventListener('click', () => {
    if (!expanded) { openOverview(); return; }
    openDetail(action);
  });
  close.addEventListener('click', () => {
    suppressHoverUntilLeave = true;
    collapse();
  });
  mobileClose.addEventListener('click', () => {
    suppressHoverUntilLeave = true;
    collapse();
  });
  const stepScreen = (delta) => {
    clearHoverTimers();
    pinned = true;
    const next = Math.max(0, Math.min(slides.length - 1, active + delta));
    if (next !== active) { active = next; update(true); }
  };
  previousScreen.addEventListener('click', () => stepScreen(-1));
  nextScreen.addEventListener('click', () => stepScreen(1));
  buttons.forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) { screenGesture = null; return; }
      if (!expanded || button !== buttons[active] || event.button !== 0 || (event.pointerType === 'mouse' && stage.clientWidth >= 680)) return;
      screenGesture = { id: event.pointerId, x: event.clientX, y: event.clientY, index: active };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointerup', (event) => {
      const gesture = screenGesture;
      screenGesture = null;
      if (!gesture || gesture.id !== event.pointerId || gesture.index !== active) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressImageClickUntil = performance.now() + 450;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) stepScreen(dx < 0 ? 1 : -1);
    });
    button.addEventListener('pointercancel', () => { screenGesture = null; });
    button.addEventListener('lostpointercapture', () => { screenGesture = null; });
  });
  stage.addEventListener('click', (event) => {
    if (event.detail !== 0 && event.target.closest('[data-preview-image]') && performance.now() < suppressImageClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  preventDragClick(selectorTrack);
  tabs.forEach((tab, i) => {
    tab.addEventListener('pointerenter' , (event) => {
      if (!finePointer.matches || event.pointerType === 'touch' || !expanded || mediaViewer?.open) return;
      clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        if (expanded && pointerInside && !mediaViewer?.open && active !== i) { active = i; update(true); }
      }, 90);
    });
    tab.addEventListener('pointerleave', () => clearTimeout(selectionTimer));
    tab.addEventListener('click', () => {
      clearHoverTimers();
      pinned = true;
      if (active !== i) { active = i; update(true); }
    });
  });
  selectors.addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const focused = tabs.indexOf(event.target.closest('[data-screen-select]'));
    const origin = focused < 0 ? active : focused;
    active = event.key === 'Home' ? 0 : event.key === 'End' ? 5 : (origin + (event.key === 'ArrowRight' ? 1 : 5)) % 6;
    update(true);
    tabs[active].focus({ preventScroll: true });
  });
  stage.addEventListener('click', (event) => {
    const image = event.target.closest('[data-preview-image]');
    if (expanded && image === buttons[active]) openDetail(image);
  });
  mediaViewer?.addEventListener('close', () => {
    if (!ownsViewer) return;
    ownsViewer = false;
    requestAnimationFrame(() => {
      // The modal hides pointer transitions; recheck after its focus restoration finishes.
      pointerInside = finePointer.matches && cover.matches(':hover');
      scheduleCollapse();
    });
  });
  new ResizeObserver(() => {
    if (stage.clientWidth === lastWidth) return;
    lastWidth = stage.clientWidth;
    layout();
  }).observe(stage);
  window.addEventListener('resize', frameLatest(layout), { passive: true });
  update();
  document.fonts?.ready.then(layout);
});

function prepareOptionalVideos(root) {
  root.querySelectorAll('[data-optional-video]').forEach((video) => {
    const poster = video.parentElement.querySelector('.teaser-poster');
    const message = poster?.querySelector('[data-video-message]');
    if (message) message.hidden = true;
    const ready = () => {
      video.classList.add('is-ready');
      if (poster) poster.hidden = true;
    };
    const failed = () => {
      if (poster) poster.hidden = false;
      if (message) message.hidden = false;
      video.remove();
    };
    video.addEventListener('loadeddata', ready, { once: true });
    // Controls must remain available when data-saving modes load metadata only.
    if (video.controls) video.addEventListener('loadedmetadata', ready, { once: true });
    video.addEventListener('error', failed, { once: true });
    if (video.error) failed();
    else if (video.readyState >= 2 || (video.controls && video.readyState >= 1)) ready();
  });
}
prepareOptionalVideos(document);

const updatePreviewHints = () => {
  const isTouch = touchFirstMedia.matches || window.innerWidth < 920;
  const hint = document.querySelector('[data-project-hint]');
  if (hint) hint.textContent = isTouch ? 'Tap + to explore · Open the image to read' : 'Hover to preview · Click to read';
  projectRows.forEach((row) => {
    const indicator = row.querySelector('.project-row__arrow');
    if (indicator) indicator.textContent = isTouch ? (row.classList.contains('is-previewing') ? '−' : '+') : '↗';
  });
};
touchFirstMedia.addEventListener('change', updatePreviewHints);
window.addEventListener('resize', frameLatest(updatePreviewHints), { passive: true });
updatePreviewHints();

// Decode nearby preview images before interaction, not every image on load.
if ('IntersectionObserver' in window) {
  const previewObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      const image = target.querySelector('.project-row__preview img');
      if (image) {
        image.loading = 'eager';
        image.decoding = 'async';
        image.decode?.().catch(() => {});
      }
      observer.unobserve(target);
    });
  }, { rootMargin: '320px 0px' });
  projectRows.forEach((row) => previewObserver.observe(row));
}

projectRows.forEach((row) => {
  const summary = row.querySelector('[data-project-preview]');
  let pinned = false;
  let keyboardEngaged = false;
  let hoverTimer;
  const collapse = () => {
    clearTimeout(hoverTimer);
    if (pinned || keyboardEngaged || projectDialog?.open) return;
    // Restore focus before making a preview button inert.
    if (row.querySelector('.project-row__preview')?.contains(document.activeElement)) summary.focus({ preventScroll: true });
    setProjectPreviewActive(row, false);
  };
  preventDragClick(summary);
  row.addEventListener('pointerdown', () => { keyboardEngaged = false; }, { passive: true });
  row.addEventListener('keydown', (event) => {
    if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) keyboardEngaged = true;
  });
  summary.addEventListener('click', (event) => {
    clearTimeout(hoverTimer);
    if (finePointer.matches && window.innerWidth >= 920 && event.detail !== 0) {
      pinned = false;
      setProjectPreviewActive(row, true);
      openProjectDialog(row.dataset.project, summary);
      return;
    }
    pinned = !row.classList.contains('is-previewing');
    setProjectPreviewActive(row, pinned);
  });
  row.addEventListener('pointerenter', (event) => {
    if (!finePointer.matches || window.innerWidth < 920 || event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    keyboardEngaged = false;
    if (!projectDialog?.open) hoverTimer = setTimeout(() => setProjectPreviewActive(row, true), 100);
  });
  row.addEventListener('pointerleave', () => {
    clearTimeout(hoverTimer);
    if (!finePointer.matches || window.innerWidth < 920) return;
    hoverTimer = setTimeout(collapse, 180);
  });
  row.addEventListener('focusout', (event) => {
    if (row.contains(event.relatedTarget) || projectDialog?.open) return;
    keyboardEngaged = false;
    if (!row.matches(':hover')) collapse();
  });
  projectDialog?.addEventListener('close', () => {
    requestAnimationFrame(() => {
      // Modal focus restoration is not a request to keep a hover preview open.
      if (!row.matches(':hover')) collapse();
    });
  });
});

// Viewer zoom is independent of the homepage disclosure and gallery position.
let mediaZoom = 1;
let mediaZoomMode = 'fit';
let mediaImageSize = { width: 1, height: 1 };
let mediaSwipe = null;
let mediaPan = null;
const mediaTouchPointers = new Set();

function mediaFitScale() {
  if (!mediaViewport) return 1;
  return Math.min(
    Math.max(1, mediaViewport.clientWidth - 32) / mediaImageSize.width,
    Math.max(1, mediaViewport.clientHeight - 32) / mediaImageSize.height,
    1
  );
}

function mediaMaximumZoom() {
  return Math.max(4, 1 / Math.max(.0001, mediaFitScale()));
}

function clearMediaGesture() {
  if (mediaPan && mediaViewport?.hasPointerCapture(mediaPan.id)) mediaViewport.releasePointerCapture(mediaPan.id);
  mediaPan = null;
  mediaSwipe = null;
  mediaTouchPointers.clear();
  mediaViewport?.classList.remove('is-dragging');
}

function paintMediaZoom() {
  if (!mediaViewerImage || !mediaViewport) return;
  const fit = mediaFitScale();
  if (mediaZoomMode === 'fit') mediaZoom = 1;
  else if (mediaZoomMode === 'actual') mediaZoom = 1 / Math.max(.0001, fit);
  mediaZoom = Math.max(1, Math.min(mediaMaximumZoom(), mediaZoom));
  const isZoomed = mediaZoom > 1.001;
  mediaViewer.classList.toggle('is-zoomed', isZoomed);
  mediaZoomStatus.textContent = isZoomed ? `${Math.round(fit * mediaZoom * 100)}%` : 'Fit';
  mediaZoomOut.disabled = !isZoomed;
  mediaZoomIn.disabled = mediaZoom >= mediaMaximumZoom() - .001;
  mediaFitButton.setAttribute('aria-pressed', String(!isZoomed));
  mediaActualButton.setAttribute('aria-pressed', String(Math.abs(fit * mediaZoom - 1) < .005));
  if (!mediaViewer.open || mediaViewport.clientWidth < 1 || mediaViewport.clientHeight < 1) return;
  mediaViewerImage.style.width = `${mediaImageSize.width * fit * mediaZoom}px`;
  mediaViewerImage.style.height = `${mediaImageSize.height * fit * mediaZoom}px`;
}

function setMediaZoom(next, mode = 'custom', anchor = null) {
  if (!mediaViewer?.open || !mediaViewport || !mediaViewerImage) return;
  const before = mediaViewerImage.getBoundingClientRect();
  const viewport = mediaViewport.getBoundingClientRect();
  const x = anchor?.x ?? mediaViewport.clientWidth / 2;
  const y = anchor?.y ?? mediaViewport.clientHeight / 2;
  const imageX = before.width ? Math.max(0, Math.min(1, (viewport.left + x - before.left) / before.width)) : .5;
  const imageY = before.height ? Math.max(0, Math.min(1, (viewport.top + y - before.top) / before.height)) : .5;
  mediaZoom = Math.max(1, Math.min(mediaMaximumZoom(), next));
  mediaZoomMode = mediaZoom <= 1.001 && mode !== 'actual' ? 'fit' : mode;
  clearMediaGesture();
  paintMediaZoom();
  if (mediaZoom <= 1.001) {
    mediaViewport.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    return;
  }
  const after = mediaViewerImage.getBoundingClientRect();
  mediaViewport.scrollTo({
    left: mediaViewport.scrollLeft + after.left - viewport.left + imageX * after.width - x,
    top: mediaViewport.scrollTop + after.top - viewport.top + imageY * after.height - y,
    behavior: 'instant'
  });
}

function resetMediaZoom() {
  clearMediaGesture();
  mediaZoom = 1;
  mediaZoomMode = 'fit';
  mediaViewport?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  paintMediaZoom();
}

function zoomMediaIn() {
  setMediaZoom(mediaZoom <= 1.001 ? 2 : mediaZoom * 1.5);
}

function zoomMediaOut() {
  setMediaZoom(mediaZoom / 1.5);
}

function closeMediaViewer() {
  dismissDialog(mediaViewer);
}

function renderMedia(index) {
  const previousIndex = mediaIndex;
  mediaIndex = Math.min(mediaCards.length - 1, Math.max(0, index));
  if (mediaViewer?.open && previousIndex === mediaIndex) return;
  const trigger = mediaCards[mediaIndex];
  const sourceImage = trigger?.querySelector('img');
  if (!mediaViewer || !mediaViewerImage || !sourceImage) return;
  mediaImageSize = {
    width: sourceImage.naturalWidth || Number(sourceImage.getAttribute('width')) || 1,
    height: sourceImage.naturalHeight || Number(sourceImage.getAttribute('height')) || 1
  };
  mediaViewerImage.src = sourceImage.currentSrc || sourceImage.src;
  mediaViewerImage.alt = sourceImage.alt;
  resetMediaZoom();
  if (mediaViewerCaption) {
    const caption = trigger.querySelector('.case-media-card__caption') || trigger.closest('figure')?.querySelector('figcaption');
    mediaViewerCaption.textContent = trigger.dataset.mediaCaption || caption?.innerText.replace(/\s+/g, ' ').trim() || sourceImage.alt;
  }
  mediaViewer.querySelector('[data-media-prev]').disabled = mediaIndex === 0;
  mediaViewer.querySelector('[data-media-next]').disabled = mediaIndex === mediaCards.length - 1;
  mediaViewer.querySelector('[data-media-status]').textContent = `${String(mediaIndex + 1).padStart(2, '0')} / ${String(mediaCards.length).padStart(2, '0')}`;
  if (!reduceMotion && mediaViewer.open) {
    mediaViewerImage.getAnimations().forEach((animation) => animation.cancel());
    const direction = mediaIndex > previousIndex ? 1 : -1;
    mediaViewerImage.animate([
      { opacity: .35, translate: `${direction * 12}px 0` },
      { opacity: 1, translate: '0 0' }
    ], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
}

function openMediaViewer(trigger) {
  if (!mediaViewer || mediaViewer.open) return;
  mediaReturnFocus = trigger;
  mediaReturnScroll = projectShell?.scrollTop || 0;
  const gallery = trigger.closest('.case-media-gallery, .case-phone-rail, [data-preview-gallery], [data-project-gallery]');
  mediaCards = gallery ? [...gallery.querySelectorAll('[data-case-image]')].filter((card) => !card.closest('[hidden]')) : [trigger];
  renderMedia(mediaCards.indexOf(trigger));
  mediaViewer.querySelector('[data-media-close-label]').textContent = projectDialog?.open ? 'Back to note' : 'Back to preview';
  lockScroll('media');
  showDialog(mediaViewer);
  requestAnimationFrame(() => { if (mediaViewer.open) paintMediaZoom(); });
}

mediaViewer?.querySelector('[data-media-prev]')?.addEventListener('click', () => renderMedia(mediaIndex - 1));
mediaViewer?.querySelector('[data-media-next]')?.addEventListener('click', () => renderMedia(mediaIndex + 1));
mediaZoomIn?.addEventListener('click', zoomMediaIn);
mediaZoomOut?.addEventListener('click', zoomMediaOut);
mediaFitButton?.addEventListener('click', () => setMediaZoom(1, 'fit'));
mediaActualButton?.addEventListener('click', () => setMediaZoom(1 / Math.max(.0001, mediaFitScale()), 'actual'));
mediaViewerImage?.addEventListener('load', () => {
  if (mediaViewerImage.naturalWidth && mediaViewerImage.naturalHeight) {
    mediaImageSize = { width: mediaViewerImage.naturalWidth, height: mediaViewerImage.naturalHeight };
    paintMediaZoom();
  }
});
mediaViewer?.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomMediaIn(); return; }
  if (event.key === '-' || event.key === '−') { event.preventDefault(); zoomMediaOut(); return; }
  if (event.key === '0') { event.preventDefault(); setMediaZoom(1, 'fit'); return; }
  if (event.key === '1') { event.preventDefault(); setMediaZoom(1 / Math.max(.0001, mediaFitScale()), 'actual'); return; }
  if (mediaZoom > 1.001 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const step = event.shiftKey ? 200 : 80;
    mediaViewport.scrollBy({
      left: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
      top: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
      behavior: 'instant'
    });
    return;
  }
  if (mediaZoom <= 1.001 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    renderMedia(mediaIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
mediaViewport?.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse') {
    mediaTouchPointers.add(event.pointerId);
    if (mediaTouchPointers.size > 1) { mediaSwipe = null; return; }
    if (mediaZoom <= 1.001 && event.isPrimary) mediaSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    return;
  }
  if (mediaZoom <= 1.001 || event.button !== 0) return;
  mediaPan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: mediaViewport.scrollLeft, top: mediaViewport.scrollTop };
  mediaViewport.setPointerCapture(event.pointerId);
  mediaViewport.classList.add('is-dragging');
  event.preventDefault();
});
mediaViewport?.addEventListener('pointermove', (event) => {
  if (!mediaPan || event.pointerId !== mediaPan.id) return;
  mediaViewport.scrollLeft = mediaPan.left - (event.clientX - mediaPan.x);
  mediaViewport.scrollTop = mediaPan.top - (event.clientY - mediaPan.y);
});
mediaViewport?.addEventListener('pointerup', (event) => {
  if (mediaPan?.id === event.pointerId) { clearMediaGesture(); return; }
  const singleTouch = mediaTouchPointers.size === 1;
  mediaTouchPointers.delete(event.pointerId);
  const gesture = mediaSwipe;
  mediaSwipe = null;
  if (mediaZoom > 1.001 || !singleTouch || !gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) renderMedia(mediaIndex + (dx < 0 ? 1 : -1));
});
mediaViewport?.addEventListener('pointercancel', clearMediaGesture);
mediaViewport?.addEventListener('lostpointercapture', () => {
  mediaPan = null;
  mediaViewport.classList.remove('is-dragging');
});
mediaViewerImage?.addEventListener('dragstart', (event) => event.preventDefault());
mediaViewerImage?.addEventListener('dblclick', (event) => {
  event.preventDefault();
  const bounds = mediaViewport.getBoundingClientRect();
  setMediaZoom(mediaZoom > 1.001 ? 1 : Math.max(2, 1 / Math.max(.0001, mediaFitScale())), 'custom', {
    x: event.clientX - bounds.left, y: event.clientY - bounds.top
  });
});
if (mediaViewport && 'ResizeObserver' in window) {
  let zoomResizeFrame = 0;
  const zoomObserver = new ResizeObserver(() => {
    cancelAnimationFrame(zoomResizeFrame);
    zoomResizeFrame = requestAnimationFrame(() => {
      if (mediaViewer.open) setMediaZoom(mediaZoom, mediaZoomMode);
    });
  });
  zoomObserver.observe(mediaViewport);
}

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
    rail.tabIndex = 0;
    rail.setAttribute('role', 'region');
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
    const destination = (slide) => Math.min(rail.scrollWidth - rail.clientWidth, Math.max(0, position(slide) - position(slides[0])));
    const update = () => {
      toolbar.hidden = rail.scrollWidth <= rail.clientWidth + 2;
      if (targetIndex === null) {
        index = slides.reduce((nearest, slide, i) => Math.abs(destination(slide) - rail.scrollLeft) < Math.abs(destination(slides[nearest]) - rail.scrollLeft) ? i : nearest, 0);
        if (!toolbar.hidden && rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2) index = slides.length - 1;
      }
      previous.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const go = (delta) => {
      index = Math.max(0, Math.min(slides.length - 1, index + delta));
      targetIndex = index;
      rail.scrollTo({ left: destination(slides[index]), behavior: reduceMotion ? 'instant' : 'smooth' });
      update();
    };
    previous.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    rail.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || toolbar.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const focusedIndex = slides.findIndex((slide) => slide === event.target || slide.contains(event.target));
      if (focusedIndex >= 0) index = focusedIndex;
      go(event.key === 'ArrowRight' ? 1 : -1);
      if (focusedIndex >= 0) {
        const slide = slides[index];
        const button = slide.matches('[data-case-image]') ? slide : slide.querySelector('[data-case-image]');
        button?.focus({ preventScroll: true });
      }
    });
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
  prepareOptionalVideos(projectDialogContent);
  document.body.classList.add('dialog-open');
  lockScroll('project');
  projectDialog.setAttribute('aria-labelledby', 'active-project-title');
  projectDialogContent.querySelector('h2').id = 'active-project-title';
  projectDialog.querySelector('[data-project-label]').textContent = projectKey === 'gbh' ? 'GBH Kids' : projectDialogContent.querySelector('h2').textContent;
  showDialog(projectDialog);
  projectDialog.querySelector('.project-dialog__shell')?.scrollTo({ top: 0, behavior: 'instant' });
  disposeProjectRails = setupProjectRails();
  updateProjectJump();
}

projectOpeners.forEach((opener) => {
  preventDragClick(opener);
  opener.addEventListener('click', () => {
    // Every explicit "read" action opens immediately. Preview disclosure and
    // navigation are separate controls, so repeated taps are never required.
    openProjectDialog(opener.dataset.projectOpen, opener);
  });
});

function projectImageSection() {
  return projectDialogContent?.querySelector('.case-rail-controls:not([hidden]), .case-phone-rail, .case-media-gallery, .case-cinema');
}

function updateProjectJump() {
  const target = projectImageSection();
  if (!projectJump || !projectShell) return;
  projectJump.hidden = !target;
  if (!target) return;
  const atEnd = projectShell.scrollTop > 0 && projectShell.scrollTop + projectShell.clientHeight >= projectShell.scrollHeight - 2;
  const atImages = atEnd || target.getBoundingClientRect().top <= projectShell.getBoundingClientRect().top + 100;
  if (projectJump.dataset.overview === String(atImages)) return;
  projectJump.dataset.overview = String(atImages);
  projectJump.innerHTML = atImages ? 'Overview <span aria-hidden="true">↑</span>' : 'Images <span aria-hidden="true">↓</span>';
  projectJump.setAttribute('aria-label', atImages ? 'Back to project overview' : 'Jump to project images');
}

projectShell?.addEventListener('scroll', frameLatest(updateProjectJump), { passive: true });
projectJump?.addEventListener('click', () => {
  const target = projectImageSection();
  if (!target || !projectShell) return;
  const headerHeight = projectDialog.querySelector('.project-dialog__header').getBoundingClientRect().height;
  const top = projectJump.dataset.overview === 'true' ? 0 : projectShell.scrollTop + target.getBoundingClientRect().top - projectShell.getBoundingClientRect().top - headerHeight - 16;
  projectShell.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });
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
  resetMediaZoom();
  if (mediaViewerImage) {
    mediaViewerImage.removeAttribute('src');
    mediaViewerImage.alt = '';
  }
  unlockScroll('media');
  if (mediaReturnFocus instanceof HTMLElement) mediaReturnFocus.focus({ preventScroll: true });
  if (projectDialog?.open) projectShell?.scrollTo({ top: mediaReturnScroll, behavior: 'instant' });
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
  requestAnimationFrame(resumeVisiblePreviewVideos);
});

publicationDetails.forEach((details) => {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.publication-body');
  let animation;
  let bodyAnimation;
  summary.addEventListener('click', (event) => {
    if (reduceMotion) return;
    event.preventDefault();
    const from = details.getBoundingClientRect().height;
    const bodyOpacity = details.open ? getComputedStyle(body).opacity : '0';
    const opening = details.dataset.expanding ? details.dataset.expanding === 'false' : !details.open;
    animation?.cancel();
    bodyAnimation?.cancel();
    details.dataset.expanding = String(opening);
    details.style.height = '';
    details.open = true;
    const to = opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
    bodyAnimation = body.animate([
      { opacity: bodyOpacity },
      { opacity: opening ? 1 : 0 }
    ], { duration: opening ? 220 : 140, easing: 'ease-out', fill: 'forwards' });
    animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    animation.onfinish = () => {
      details.open = opening;
      delete details.dataset.expanding;
      bodyAnimation?.cancel();
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
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
  readingProgress?.style.setProperty('--reading-progress', progress.toFixed(4));
  const active = navSections.filter((section) => section.getBoundingClientRect().top <= window.innerHeight * .35).at(-1);
  sectionLinks.forEach((link) => {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
});
window.addEventListener('scroll', updateNavigation, { passive: true });
window.addEventListener('resize', updateNavigation, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(updateNavigation).observe(document.querySelector('main'));
updateNavigation();

marqueeToggle?.addEventListener('click', () => {
  const paused = marquee.classList.toggle('is-paused');
  marqueeToggle.setAttribute('aria-pressed', String(paused));
  marqueeToggle.setAttribute('aria-label', paused ? 'Resume moving topics' : 'Pause moving topics');
  marqueeToggle.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
});

motionPreference.addEventListener('change', (event) => {
  reduceMotion = event.matches;
  if (reduceMotion) {
    setPortraitDepth();
    document.querySelectorAll('.reveal, [data-entrance]').forEach((element) => element.classList.add('is-visible'));
    document.querySelectorAll('.project-row video').forEach((video) => video.pause());
    publicationDetails.forEach((details) => details.getAnimations({ subtree: true }).forEach((animation) => animation.finish()));
    mediaViewerImage?.getAnimations().forEach((animation) => animation.finish());
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
function resumeVisiblePreviewVideos() {
  if (document.hidden || reduceMotion || projectDialog?.open || mediaViewer?.open) return;
  document.querySelectorAll('.project-row.is-previewing video').forEach((video) => {
    const bounds = video.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.height > 0) video.play().catch(() => {});
  });
}

document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) document.querySelectorAll('video').forEach((video) => video.pause());
  else resumeVisiblePreviewVideos();
});

// Reveal individual reading units as they enter the viewport. A short stagger
// guides the eye without making a whole section wait or replay on the way back.
const entranceGroups = [
  ['.hero-heading', '.eyebrow, .headline-word, .hero-intro'],
  ['.intro-grid', '.section-number, .intro-statement, .intro-notes > div'],
  ['.section-heading', ':scope > *'],
  ['.featured-project', '.featured-visual, .featured-project__copy'],
  ['.project-index', '.project-index__label, .project-row']
];
entranceGroups.forEach(([groupSelector, itemSelector]) => {
  document.querySelectorAll(groupSelector).forEach((group) => {
    group.classList.remove('reveal');
    group.querySelectorAll(itemSelector).forEach((item, index) => {
      item.dataset.entrance = '';
      item.style.setProperty('--entrance-order', String(Math.min(index, group === kineticTitle ? 4 : 3)));
    });
  });
});

const reveals = document.querySelectorAll('.reveal, [data-entrance]');

if ('IntersectionObserver' in window && !reduceMotion) {
  const pendingReveals = new Set();
  let revealFrame = 0;
  let titleReady = !document.fonts || document.fonts.status === 'loaded';

  const flushReveals = () => {
    if (document.hidden || revealFrame) return;
    revealFrame = requestAnimationFrame(() => {
      revealFrame = 0;
      if (document.hidden) return;
      pendingReveals.forEach((element) => {
        if (!titleReady && kineticTitle?.contains(element)) return;
        element.classList.add('is-visible');
        revealObserver.unobserve(element);
        pendingReveals.delete(element);
      });
    });
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < .08) {
        pendingReveals.delete(entry.target);
        return;
      }
      pendingReveals.add(entry.target);
    });
    flushReveals();
  }, { threshold: .08, rootMargin: '0px 0px -32px 0px' });

  reveals.forEach((element) => revealObserver.observe(element));
  document.addEventListener('visibilitychange', flushReveals);

  // Give the display font a short chance to arrive, without holding up the
  // page on a slow connection. Background tabs keep their entrance until seen.
  if (!titleReady) {
    let fontFallback;
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => { fontFallback = setTimeout(resolve, 450); })
    ]).then(() => {
      clearTimeout(fontFallback);
      titleReady = true;
      flushReveals();
    });
  }
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
