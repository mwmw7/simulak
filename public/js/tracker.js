// Simulak Analytics Tracker v1.0
(function() {
  'use strict';

  // --- Session ID ---
  var SESSION_KEY = '_slk_sid';
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  var startTime = Date.now();
  var screenSize = screen.width + 'x' + screen.height;
  var scrollMarks = {};
  var sentBeacon = false;

  function send(data) {
    data.session_id = sessionId;
    data.screen = screenSize;
    try {
      var payload = JSON.stringify(data);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/track', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
    } catch(e) {}
  }

  // --- Time on page (beacon on leave) ---
  function sendDuration() {
    if (sentBeacon) return;
    sentBeacon = true;
    send({ action: 'time_on_page', label: document.title, detail: location.pathname, duration_ms: Date.now() - startTime });
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') sendDuration();
  });
  window.addEventListener('beforeunload', sendDuration);
  // Reset beacon flag when page becomes visible again (SPA)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') sentBeacon = false;
  });

  // --- Scroll depth tracking ---
  var ticking = false;
  function checkScroll() {
    var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    if (docHeight <= 0) return;
    var pct = Math.round((window.scrollY / docHeight) * 100);
    var marks = [25, 50, 75, 100];
    for (var i = 0; i < marks.length; i++) {
      if (pct >= marks[i] && !scrollMarks[marks[i]]) {
        scrollMarks[marks[i]] = true;
        send({ action: 'scroll_depth', label: marks[i] + '%', detail: location.pathname, duration_ms: Date.now() - startTime });
      }
    }
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function() { checkScroll(); ticking = false; });
    }
  }, { passive: true });

  // --- Outbound link tracking ---
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.href || '';
    try {
      var url = new URL(href);
      if (url.hostname && url.hostname !== location.hostname) {
        send({ action: 'outbound_click', label: url.hostname, detail: href, duration_ms: Date.now() - startTime });
      }
    } catch(ex) {}
  });

  // --- Initial pageview enrichment (send screen size + session for association) ---
  send({ action: 'session_start', label: document.title, detail: location.pathname, duration_ms: 0 });

})();
