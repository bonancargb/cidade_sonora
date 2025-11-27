const mapContent = document.querySelector('.map-content');
let scale = 1;
let translateX = 0;
let translateY = 0;

function applyTransform() {
  mapContent.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  updateMarkers();
}

function updateMarkers() {
  document.querySelectorAll('.marker').forEach(marker => {
    const x = parseFloat(marker.dataset.x);
    const y = parseFloat(marker.dataset.y);

    // Apply map transformations to marker position
    const screenX = x * scale + translateX;
    const screenY = y * scale + translateY;

    // Combine translation and counter-scale in a single transform
    marker.style.transform = `
      translate(${screenX}px, ${screenY}px)
      scale(${1 / scale})
      translate(-50%, -50%) /* optional, if you want marker centered */
    `;
  });
}

// Zoom buttons
document.querySelectorAll('[data-zoom]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.zoom;
    if (action === 'in') scale *= 1.2;
    if (action === 'out') scale /= 1.2;
    if (action === 'reset') { scale = 1; translateX = 0; translateY = 0; }
    applyTransform();
  });
});

// Drag to pan
let isDragging = false, startX, startY;
mapContent.addEventListener('mousedown', e => {
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  applyTransform();
});
window.addEventListener('mouseup', () => isDragging = false);

// Center on load (no Panzoom, just initial translate)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map'); // viewport for the SVG
  const content = document.querySelector('.map-content'); // SVG wrapper
  if (!container || !content) return;

  // Ensure layout is ready, then compute center
  requestAnimationFrame(() => {
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    const cw = content.scrollWidth;  // intrinsic width (1672px)
    const ch = content.scrollHeight; // intrinsic height (1180px)

    // center offsets for current scale (scale defaults to 1)
    const viewW = cw * scale;
    const viewH = ch * scale;
    translateX = (vw - viewW) / 2;
    translateY = (vh - viewH) / 2;

    applyTransform();
  });
});

// Initial placement (kept for safety; will be overridden by DOMContentLoaded centering)
applyTransform();

// Center the SVG map within its container on initial load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.map');         // visible viewport
  const content = document.querySelector('.map-content');   // large SVG wrapper
  if (!container || !content || !window.Panzoom) return;

  // Initialize Panzoom on the content
  const panzoom = Panzoom(content, {
    contain: 'outside',
    animate: true
    // ...existing options if you have them...
  });

  // Compute initial pan to center the content within the container
  const centerMap = () => {
    const parentRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    // Current transform values from Panzoom
    const { x, y, scale } = panzoom.getTransform();

    // The contentRect reflects current transform; to center, offset by remaining space
    const offsetX = (parentRect.width - contentRect.width) / 2;
    const offsetY = (parentRect.height - contentRect.height) / 2;

    // Apply pan relative to current transform
    panzoom.pan(x + offsetX, y + offsetY);
  };

  // Wait a tick to ensure layout is complete, then center
  requestAnimationFrame(() => {
    centerMap();
  });

  // Optional: keep any existing controls
  // ...existing code...
});

$('.header-btn-1').click(function() {
  $('.tab-1').toggleClass('expanded-1');
  $('.info-1').toggleClass('visible');
})

$('.header-btn-2').click(function() {
  $('.tab-2').toggleClass('expanded-2');
  $('.tab-1').toggleClass('shrinked-1');
  $('.info-2').toggleClass('visible');
})

document.addEventListener('DOMContentLoaded', () => {

  const exitBtn = document.querySelector('.exit-btn button');

  exitBtn.addEventListener('click', () => {
    document.querySelector('.tab-1').classList.remove('expanded-1', 'shrinked-1');
    document.querySelector('.tab-2').classList.remove('expanded-2');
    document.querySelector('.info-1').classList.remove('visible');
    document.querySelector('.info-2').classList.remove('visible');
  });

});

document.addEventListener('DOMContentLoaded', () => {
  // initialize players for visible cards at load
  initAudioCards(document);

  // Marker click: open respective modal
  document.querySelectorAll('.marker').forEach(marker => {
    marker.addEventListener('click', function() {
      // Hide all modals first
      document.querySelectorAll('.center-tab').forEach(tab => tab.classList.remove('visible'));
      // Show the respective modal
      const tabId = marker.getAttribute('data-tab');
      const modal = document.getElementById(tabId);
      if (modal) {
        modal.classList.add('visible');
        // initialize audio handlers for cards inside this modal (if not yet initialized)
        initAudioCards(modal);
      }
    });
  });

  // "X" button click: close only its modal
  document.querySelectorAll('.x-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const tabId = btn.getAttribute('data-exit');
      const modal = document.getElementById(tabId);
      if (modal) modal.classList.remove('visible');
      e.stopPropagation();
    });
  });
});

// bind audio handlers once per card
function initAudioCards(scope) {
  const cards = scope.querySelectorAll?.('.card');
  cards?.forEach(card => {
    if (card.dataset.audioInit === '1') return; // prevent duplicate bindings
    const audio = card.querySelector('.audio');
    const progress = card.querySelector('.progress');
    const btn = card.querySelector('.play-btn');
    if (!audio || !progress || !btn) return;

    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');

    // mark initialized
    card.dataset.audioInit = '1';

    // log loading errors to help diagnose bad paths
    audio.addEventListener('error', () => {
      const src = audio.currentSrc || (audio.querySelector('source')?.src || '(no src)');
      console.warn('Audio failed to load:', src);
    });

    audio.preload = 'metadata';

    audio.onloadedmetadata = () => (progress.max = audio.duration || 0);
    audio.ontimeupdate = () => (progress.value = audio.currentTime || 0);

    progress.oninput = () => {
      audio.currentTime = Number(progress.value || 0);
    };

    btn.onclick = () => {
      // pause any other playing audio in the same document
      document.querySelectorAll('.card[data-audio-init="1"] .audio').forEach(a => {
        if (a !== audio && !a.paused) {
          a.pause();
          const c = a.closest('.card');
          const b = c?.querySelector('.play-btn');
          b?.querySelector('.play-icon')?.style && (b.querySelector('.play-icon').style.display = 'block');
          b?.querySelector('.pause-icon')?.style && (b.querySelector('.pause-icon').style.display = 'none');
        }
      });

      if (audio.paused) {
        audio.play().then(() => {
          if (playIcon) playIcon.style.display = 'none';
          if (pauseIcon) pauseIcon.style.display = 'block';
        }).catch(err => {
          console.warn('Audio play blocked or failed:', err);
        });
      } else {
        audio.pause();
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none'; // fixed: hide pause icon on pause
      }
    };

    audio.onended = () => {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none'; // fixed: hide pause icon on end
    };
  });
}

$(document).ready(function() {
  $('.fade-in').addClass('visible');
});

document.addEventListener('DOMContentLoaded', function() {
  const tab3Toggle = document.getElementById('tab-toggle');
  const tab3 = tab3Toggle.closest('.tab-3');
  const info3 = tab3.querySelector('.info-3');

  const spacerPx = 32; // matches visible bottom space (~2rem)

  const openInfo = () => {
    // expand container first
    info3.style.maxHeight = `${info3.scrollHeight + spacerPx}px`;
    tab3.classList.add('expanded-3', 'open');
    // then reveal content next frame (opacity has CSS delay too)
    requestAnimationFrame(() => {
      info3.classList.add('visible');
    });
  };

  const closeInfo = () => {
    // lock current height to allow reverse animation
    info3.style.maxHeight = `${info3.scrollHeight}px`;
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    info3.offsetHeight;
    // fade content out immediately, then collapse
    info3.classList.remove('visible');
    tab3.classList.remove('open');
    info3.style.maxHeight = '0px';

    const onTransitionEnd = (e) => {
      if (e.propertyName === 'max-height') {
        tab3.classList.remove('expanded-3');
        info3.removeEventListener('transitionend', onTransitionEnd);
      }
    };
    info3.addEventListener('transitionend', onTransitionEnd);
  };

  tab3Toggle.addEventListener('click', function() {
    const isOpen = info3.classList.contains('visible');
    if (!isOpen) {
      openInfo();
    } else {
      closeInfo();
    }
  });
});