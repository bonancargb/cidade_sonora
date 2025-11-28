const mapContent = document.querySelector('.map-content');
$(document).ready(function() {
  $('.fade-in').addClass('visible');
});

// Removed pan/zoom logic for .object-container and .map-content

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