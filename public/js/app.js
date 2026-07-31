/* SIMULAK ENTERTAINMENT — AngularJS 1.x 앱 */
(function () {
  "use strict";

  var app = angular.module("simulakApp", ["ngSanitize"]);

  /* ── 메인 컨트롤러 ─────────────────────────────── */
  app.controller("MainController", ["$http", "$scope", "$interval", "$timeout", "AnthemEngine",
  function ($http, $scope, $interval, $timeout, AnthemEngine) {
    var vm = this;

    vm.loaded = false;
    vm.content = { brand: {}, hero: {}, philosophy: [], services: [], synthStars: [], artists: [], metrics: [], contact: {} };
    vm.playing = false;
    vm.trackIndex = 0;
    vm.current = {};
    vm.bars = seedBars(48);
    vm.tIndex = 0;
    vm.target = {};

    // 언어 설정
    vm.lang = localStorage.getItem('simulak_lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');
    vm.toggleLang = function() {
      vm.lang = vm.lang === 'ko' ? 'en' : 'ko';
      localStorage.setItem('simulak_lang', vm.lang);
      loadContent(vm.lang);
    };

    // Express API에서 콘텐츠 로드
    function loadContent(lang) {
      $http.get("/api/content?lang=" + lang).then(function (res) {
        vm.content = res.data;
        vm.current = vm.content.artists[0] || {};
        vm.target = (vm.content.targeting && vm.content.targeting[0]) || {};
        $timeout(function () { vm.loaded = true; }, 450);
      }, function () {
        $timeout(function () { vm.loaded = true; }, 450);
      });
    }
    loadContent(vm.lang);

    /* 플레이어 */
    function onTrackEnded() {
      $scope.$applyAsync(function () { vm.playing = false; });
    }
    vm.togglePlay = function () {
      vm.playing = !vm.playing;
      if (vm.playing) { AnthemEngine.play(vm.current, onTrackEnded); }
      else { AnthemEngine.stop(); }
    };
    vm.selectTrack = function (i) {
      var switched = i !== vm.trackIndex;
      vm.trackIndex = i;
      vm.current = vm.content.artists[i];
      // 곡을 클릭하면 바로 재생 (다른 곡이면 처음부터)
      vm.playing = true;
      AnthemEngine.play(vm.current, onTrackEnded, switched);
    };
    vm.nextTrack = function () {
      if (!vm.content.artists.length) return;
      vm.selectTrack((vm.trackIndex + 1) % vm.content.artists.length);
    };
    vm.prevTrack = function () {
      if (!vm.content.artists.length) return;
      vm.selectTrack((vm.trackIndex - 1 + vm.content.artists.length) % vm.content.artists.length);
    };

    /* 초개인화 광고 — 오디언스 세그먼트 선택 + 자동 순환 */
    vm.selectTarget = function (i) {
      vm.tIndex = i;
      vm.target = vm.content.targeting[i];
      vm._tHold = Date.now(); // 사용자가 고르면 잠시 자동순환 멈춤
    };
    $interval(function () {
      var t = vm.content.targeting;
      if (!t || !t.length) return;
      if (vm._tHold && Date.now() - vm._tHold < 8000) return;
      vm.tIndex = (vm.tIndex + 1) % t.length;
      vm.target = t[vm.tIndex];
    }, 3600);

    // 웨이브폼 애니메이션 (재생 중일 때만 출렁이게)
    $interval(function () {
      for (var i = 0; i < vm.bars.length; i++) {
        if (vm.playing) {
          vm.bars[i] = 12 + Math.abs(Math.sin(i * 0.5 + Date.now() / 180)) * 80 + Math.random() * 8;
        } else {
          vm.bars[i] = 10 + (Math.sin(i * 0.6) + 1) * 8;
        }
      }
    }, 90);

    function seedBars(n) {
      var a = [];
      for (var i = 0; i < n; i++) { a.push(10 + (Math.sin(i * 0.6) + 1) * 8); }
      return a;
    }
  }]);

  /* ── 부드러운 스크롤 디렉티브 ───────────────────── */
  app.directive("smoothScroll", function () {
    return {
      restrict: "A",
      link: function (scope, el) {
        el.on("click", function (e) {
          var href = el.attr("href") || "";
          if (href.charAt(0) !== "#") return;
          var target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
  });

  /* ── 스크롤 진입 시 등장 디렉티브 ───────────────── */
  app.directive("reveal", function () {
    return {
      restrict: "A",
      link: function (scope, el) {
        el.addClass("reveal");
        // QA/스크린샷 훅: ?reveal=all 이면 즉시 모두 노출 (프로덕션 동작엔 영향 없음)
        if (window.location.search.indexOf("reveal=all") !== -1) { el.addClass("reveal--in"); return; }
        if (!("IntersectionObserver" in window)) { el.addClass("reveal--in"); return; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal--in");
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        io.observe(el[0]);
      }
    };
  });

  /* ── 루프 비디오 디렉티브 (포스터 이미지로 폴백) ── */
  // <media-loop cls="..." poster="{{img}}" src="{{video}}"></media-loop>
  app.directive("mediaLoop", function () {
    return {
      restrict: "E",
      link: function (scope, el, attrs) {
        var v = document.createElement("video");
        if (attrs.cls) { v.className = attrs.cls; }
        v.autoplay = true; v.loop = true; v.muted = true; v.defaultMuted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("preload", "metadata");

        attrs.$observe("poster", function (p) { if (p) { v.poster = p; } });
        attrs.$observe("src", function (s) {
          if (s && v.getAttribute("data-src") !== s) {
            v.setAttribute("data-src", s);
            v.src = s;
            var pr = v.play();
            if (pr && pr.catch) { pr.catch(function () {}); }
          }
        });
        // 영상 로드 실패 시 src 제거 → 포스터(webp)만 표시
        v.addEventListener("error", function () {
          if (v.getAttribute("src")) { v.removeAttribute("src"); try { v.load(); } catch (e) {} }
        }, true);

        el.append(v);
      }
    };
  });

  /* ── 음원 엔진 (assets/audio 의 실제 음원 파일 재생) ─── */
  app.factory("AnthemEngine", function () {
    var audio = null;

    function ensure() {
      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
      }
      return audio;
    }

    // track.audio 의 파일을 재생. fromStart=true 면 처음부터, 아니면 이어서(일시정지 → 재개).
    function play(track, onEnded, fromStart) {
      var a = ensure();
      var src = track && track.audio;
      if (!src) { return; }
      if (a.getAttribute("data-src") !== src) {
        a.setAttribute("data-src", src);
        a.src = src;
      } else if (fromStart) {
        try { a.currentTime = 0; } catch (e) {}
      }
      a.onended = function () { if (onEnded) { onEnded(); } };
      var p = a.play();
      if (p && p.catch) { p.catch(function () {}); }
    }

    function stop() {
      if (audio) { try { audio.pause(); } catch (e) {} }
    }

    return { play: play, stop: stop };
  });

})();
