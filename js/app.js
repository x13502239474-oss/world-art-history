(function () {
  'use strict';

  var V = window.Views;
  var S = window.WamStore;
  var IDX = window.SITE_INDEX;
  var ARC = window.PREHISTORIC_ARCHIVE;
  var PER = window.PREHISTORIC_CONTENT;
  var BOOK = window.BOOK_DATA;

  var main = document.getElementById('main');
  var drawer = document.getElementById('site-drawer');
  var sheetRoot = document.getElementById('sheet-root');
  var dialogRoot = document.getElementById('dialog-root');
  var lightboxRoot = document.getElementById('lightbox-root');
  var restoreRoot = document.getElementById('restore-root');
  var toastEl = document.getElementById('toast');
  var progressTrack = document.getElementById('progress-track');
  var progressFill = document.getElementById('progress-fill');
  var searchPanel = document.getElementById('search-panel');
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var navToggle = document.getElementById('nav-toggle');
  var searchToggle = document.getElementById('search-toggle');

  var state = {
    path: '/',
    observer: null,
    activeChapter: null,
    scrollTimer: null,
    lastWrite: 0,
    restoreTimer: null,
    toastTimer: null,
    searchOpen: false,
    searchIndex: null,
    searchFlat: [],
    searchActive: -1,
    expanded: {},
    anchorPosition: null,
    restoreNotice: null,
    restoreTimer: null,
    restoreDeadline: 0,
    restoreRemaining: 8000,
    restorePaused: false,
    restoreHover: false,
    restoreBaseline: 0,
    restoreHandlers: null
  };

  function parseRoute() {
    var raw = window.location.hash.replace(/^#/, '') || '/';
    var index = raw.indexOf('?');
    var path = index >= 0 ? raw.slice(0, index) : raw;
    if (!path || path[0] !== '/') path = '/' + path;
    if (path.length > 1 && path[path.length - 1] === '/') path = path.slice(0, -1);
    return path;
  }

  function queryValue(name) {
    var hash = window.location.hash || '';
    var hashQuery = hash.indexOf('?') >= 0 ? hash.slice(hash.indexOf('?') + 1) : '';
    var fromHash = new URLSearchParams(hashQuery).get(name);
    if (fromHash !== null) return fromHash;
    return new URLSearchParams(window.location.search).get(name);
  }

  function prefersAutoScroll() {
    var reduced = S.getPrefs().reducedMotion === 'off' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.documentElement.classList.toggle('reduced-motion', reduced);
    return reduced;
  }

  function scrollBehavior() { return prefersAutoScroll() ? 'auto' : 'smooth'; }

  function toast(message, duration) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, duration || 2400);
  }

  function focusMainHeading() {
    var heading = main.querySelector('h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function noticeContains(node) {
    return !!(state.restoreNotice && node && state.restoreNotice.contains(node));
  }

  function dismissRestoreNotice(options) {
    options = options || {};
    var notice = state.restoreNotice;
    if (!notice) return;
    window.clearTimeout(state.restoreTimer);
    if (state.restoreHandlers) {
      document.removeEventListener('click', state.restoreHandlers.click, true);
      document.removeEventListener('keydown', state.restoreHandlers.keydown, true);
      state.restoreHandlers = null;
    }
    var shouldFocus = !!(options.focusHeading && notice.contains(document.activeElement));
    state.restoreNotice = null;
    state.restoreHover = false;
    state.restorePaused = false;
    var remove = function () { if (notice.parentNode) notice.parentNode.removeChild(notice); };
    if (options.immediate || prefersAutoScroll()) remove();
    else {
      notice.classList.add('is-hiding');
      window.setTimeout(remove, 200);
    }
    if (shouldFocus) focusMainHeading();
  }

  function pauseRestoreTimer() {
    if (!state.restoreNotice) return;
    if (!state.restorePaused && state.restoreDeadline) {
      state.restoreRemaining = Math.max(0, state.restoreDeadline - Date.now());
    }
    state.restorePaused = true;
    window.clearTimeout(state.restoreTimer);
  }

  function resumeRestoreTimer() {
    if (!state.restoreNotice || !state.restorePaused) return;
    if (state.restoreHover || state.restoreNotice.contains(document.activeElement)) return;
    state.restorePaused = false;
    state.restoreDeadline = Date.now() + state.restoreRemaining;
    state.restoreTimer = window.setTimeout(function () { dismissRestoreNotice(); }, state.restoreRemaining);
  }

  function showRestoreNotice(position) {
    dismissRestoreNotice({ immediate: true });
    state.restoreHover = false;
    var chapter = PER.sections.find(function (s) { return s.id === position.chapterId; });
    var notice = document.createElement('div');
    notice.className = 'restore-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.innerHTML = '<span class="restore-prefix">上次读到这里：</span>' +
      '<span class="restore-title">〈' + V.esc(chapter ? chapter.title : '史前艺术') + '〉</span>' +
      '<span class="restore-actions"><button type="button" data-restore-continue>继续阅读</button>' +
      '<button type="button" data-restore-restart>从头开始</button></span>';
    restoreRoot.appendChild(notice);
    state.restoreNotice = notice;
    state.restoreBaseline = window.scrollY;
    state.restoreRemaining = 8000;
    state.restoreDeadline = Date.now() + 8000;
    state.restoreTimer = window.setTimeout(function () { dismissRestoreNotice(); }, 8000);

    notice.addEventListener('mouseenter', function () { state.restoreHover = true; pauseRestoreTimer(); });
    notice.addEventListener('focusin', pauseRestoreTimer);
    notice.addEventListener('mouseleave', function () { state.restoreHover = false; resumeRestoreTimer(); });
    notice.addEventListener('focusout', function () { window.setTimeout(resumeRestoreTimer, 0); });

    var clickHandler = function (event) {
      if (noticeContains(event.target)) return;
      dismissRestoreNotice({ immediate: true });
    };
    var keyHandler = function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissRestoreNotice({ immediate: true, focusHeading: true });
        return;
      }
      if (noticeContains(event.target)) {
        if (event.key === 'Enter' || event.key === ' ') {
          var button = event.target.closest('button');
          if (button) {
            event.preventDefault();
            button.click();
          }
        }
        return;
      }
      if (state.restoreNotice.contains(document.activeElement)) return;
      dismissRestoreNotice({ immediate: true });
    };
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler, true);
    state.restoreHandlers = { click: clickHandler, keydown: keyHandler };
  }

  function syncBookmarks(root) {
    Array.from(root.querySelectorAll('[data-bookmark]')).forEach(function (button) {
      var pressed = S.isBookmarked(button.getAttribute('data-id'), button.getAttribute('data-type'));
      button.setAttribute('aria-pressed', String(pressed));
      var glyph = button.querySelector('span');
      if (glyph) glyph.textContent = pressed ? '★' : '☆';
      button.setAttribute('aria-label', (pressed ? '取消收藏：' : '收藏：') + button.getAttribute('data-title'));
    });
  }

  function trapFocus(event, root) {
    var nodes = Array.from(root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return node.offsetParent !== null; });
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openOverlay(root, html, options) {
    options = options || {};
    if (!root.hidden) closeOverlay(root, false);
    var previous = document.activeElement;
    root.innerHTML = html;
    root.hidden = false;
    if (options.backdrop) {
      var backdrop = document.createElement('div');
      backdrop.className = 'backdrop';
      backdrop.setAttribute('data-backdrop-root', root.id);
      document.body.appendChild(backdrop);
      root._backdrop = backdrop;
    }
    root._returnFocus = previous;
    var onKey = function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOverlay(root, true);
      } else if (event.key === 'Tab') {
        trapFocus(event, root);
      }
    };
    root._onKey = onKey;
    document.addEventListener('keydown', onKey, true);
    var focusTarget = root.querySelector('[data-autofocus]') || root.querySelector('button, a[href], input');
    if (focusTarget) focusTarget.focus();
  }

  function closeOverlay(root, restoreFocus) {
    if (!root) return;
    if (root._backdrop && root._backdrop.parentNode) root._backdrop.parentNode.removeChild(root._backdrop);
    root._backdrop = null;
    if (root.hidden) return;
    if (root._onKey) document.removeEventListener('keydown', root._onKey, true);
    root.hidden = true;
    root.innerHTML = '';
    if (restoreFocus && root._returnFocus && document.contains(root._returnFocus)) {
      root._returnFocus.focus();
    }
    root._returnFocus = null;
  }

  function closeAllOverlays(restoreFocus) {
    [drawer, sheetRoot, dialogRoot, lightboxRoot].forEach(function (root) {
      closeOverlay(root, restoreFocus);
    });
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function openDrawer() {
    openOverlay(drawer,
      '<div class="drawer-head"><strong>全站导航</strong><button type="button" class="close-btn" data-close-overlay>关闭</button></div>' +
      V.globalNav(), { backdrop: true });
    navToggle.setAttribute('aria-expanded', 'true');
    updateNavActive();
  }

  function openTocSheet() {
    if (state.path !== '/period/prehistoric') {
      toast('本篇目录只在史前艺术阅读页提供；请使用顶部导航。');
      return;
    }
    openOverlay(sheetRoot,
      '<div class="sheet"><div class="drawer-head"><h2>本篇目录</h2>' +
      '<button type="button" class="close-btn" data-close-overlay>关闭</button></div>' +
      V.periodToc(state.anchorPosition ? state.anchorPosition.chapterId : null) + '</div>',
      { backdrop: true });
  }

  function openSiteCard(id) {
    var site = V.siteById(id);
    if (!site) {
      toast('该站点尚未关联作品');
      return;
    }
    S.addRecent(id, 'site', site.name);
    openOverlay(dialogRoot, '<div class="modal" role="dialog" aria-modal="true" aria-label="站点信息">' +
      V.siteCard(site) + '</div>', { backdrop: true });
  }

  function openLightbox(src, title, credit) {
    openOverlay(lightboxRoot,
      '<div class="lightbox" role="dialog" aria-modal="true" aria-label="图像放大">' +
      '<div class="lightbox-head"><strong>' + V.esc(title) + '</strong>' +
      '<button type="button" class="close-btn" data-close-overlay data-autofocus>关闭</button></div>' +
      '<div class="lightbox-body"><img src="' + V.esc(src) + '" alt="' + V.esc(title) + '放大图像"></div>' +
      '<div class="lightbox-foot">' + V.esc(credit || '图像来源见作品档案') + '</div></div>');
  }

  function openConfirm(message, onYes) {
    openOverlay(dialogRoot,
      '<div class="modal" role="dialog" aria-modal="true" aria-label="确认操作"><h2>请确认</h2><p>' + V.esc(message) +
      '</p><div class="modal-actions"><button type="button" class="solid-btn" data-confirm-yes data-autofocus>确认清除</button>' +
      '<button type="button" class="outline-btn" data-close-overlay>取消</button></div></div>', { backdrop: true });
    var button = dialogRoot.querySelector('[data-confirm-yes]');
    if (button) button.addEventListener('click', function () {
      closeOverlay(dialogRoot, true);
      onYes();
    });
  }

  function imageFallback(img) {
    var figure = img.closest ? img.closest('.plate-figure') : null;
    if (!figure) return;
    figure.classList.add('image-failed');
  }

  function thumbFallback(img, id) {
    var work = V.workById(id);
    var wrap = img.closest ? img.closest('.work-thumb') : null;
    if (wrap && work) wrap.innerHTML = V.textPlate(work);
  }

  function currentChapter() {
    var sections = Array.from(main.querySelectorAll('[data-chapter]'));
    var line = window.scrollY + window.innerHeight * 0.32;
    var found = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= line) found = section;
    });
    return found ? found.getAttribute('data-chapter') : (sections[0] ? sections[0].getAttribute('data-chapter') : null);
  }

  function setActiveChapter(id) {
    state.activeChapter = id;
    Array.from(document.querySelectorAll('[data-chapter-link]')).forEach(function (link) {
      var active = link.getAttribute('data-chapter-link') === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    Array.from(document.querySelectorAll('[data-anchor-chapter]')).forEach(function (marker) {
      marker.classList.toggle('is-suppressed', marker.getAttribute('data-anchor-chapter') === id);
    });
  }

  function scrollToChapter(id) {
    var section = main.querySelector('#ch-' + id);
    if (!section) return;
    section.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    window.history.replaceState(null, '', window.location.pathname + window.location.search +
      '#/period/prehistoric?s=' + encodeURIComponent(id));
    setActiveChapter(id);
    var item = PER.sections.find(function (s) { return s.id === id; });
    if (item) S.addRecent(id, 'chapter', item.title, 'prehistoric');
  }

  function scrollToSavedPosition() {
    var position = state.anchorPosition || S.getPosition('prehistoric');
    if (!position) return;
    window.scrollTo({ top: position.scrollY || 0, behavior: scrollBehavior() });
    var chapter = PER.sections.find(function (s) { return s.id === position.chapterId; });
    if (chapter) {
      setActiveChapter(chapter.id);
      S.addRecent(chapter.id, 'chapter', chapter.title, 'prehistoric');
    }
  }

  function updateProgress() {
    if (state.path !== '/period/prehistoric') {
      progressTrack.classList.remove('is-visible');
      return;
    }
    var article = main.querySelector('[data-reading-column]');
    if (!article) return;
    if (window.scrollY < 40) {
      progressTrack.classList.remove('is-visible');
      progressFill.style.width = '0';
      return;
    }
    var rect = article.getBoundingClientRect();
    var total = Math.max(1, article.offsetHeight - window.innerHeight + 80);
    var ratio = Math.max(0, Math.min(1, (-rect.top + 80) / total));
    progressTrack.classList.add('is-visible');
    progressFill.style.width = (ratio * 100).toFixed(2) + '%';
  }

  function writePosition() {
    if (state.path !== '/period/prehistoric') return;
    var article = main.querySelector('[data-reading-column]');
    if (!article) return;
    var rect = article.getBoundingClientRect();
    var total = Math.max(1, article.offsetHeight - window.innerHeight + 80);
    var ratio = Math.max(0, Math.min(1, (-rect.top + 80) / total));
    S.setPosition({
      periodId: 'prehistoric',
      chapterId: currentChapter(),
      scrollY: window.scrollY,
      ratio: ratio
    });
    state.lastWrite = Date.now();
  }

  function schedulePositionWrite() {
    var elapsed = Date.now() - state.lastWrite;
    if (elapsed >= 1000) {
      writePosition();
      return;
    }
    window.clearTimeout(state.scrollTimer);
    state.scrollTimer = window.setTimeout(writePosition, 1000 - elapsed);
  }

  function initPeriod() {
    var sections = Array.from(main.querySelectorAll('[data-chapter]'));
    var visible = new Set();
    state.observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      var target = null;
      if (visible.size) {
        target = Array.from(visible).sort(function (a, b) { return a.offsetTop - b.offsetTop; })[0];
      } else {
        var line = window.scrollY + window.innerHeight * 0.32;
        sections.forEach(function (section) { if (section.offsetTop <= line) target = section; });
      }
      if (target) setActiveChapter(target.getAttribute('data-chapter'));
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(function (section) { state.observer.observe(section); });
    setActiveChapter(currentChapter());

    var deep = queryValue('s');
    if (deep && main.querySelector('#ch-' + deep)) {
      state.activeChapter = deep;
      window.requestAnimationFrame(function () {
        var section = main.querySelector('#ch-' + deep);
        section.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveChapter(deep);
        var item = PER.sections.find(function (s) { return s.id === deep; });
        if (item) S.addRecent(deep, 'chapter', item.title, 'prehistoric');
      });
      return;
    }

    if (state.anchorPosition) showRestoreNotice(state.anchorPosition);
  }

  function initWorksFilters() {
    var root = main.querySelector('[data-atlas-filters]') || main.querySelector('.filter-bar');
    if (!root) return;
    var filterState = { region: 'all', era: 'all' };
    root.addEventListener('click', function (event) {
      var chip = event.target.closest('[data-work-filter]');
      if (!chip) return;
      var group = chip.getAttribute('data-work-filter');
      filterState[group] = chip.getAttribute('data-value');
      Array.from(root.querySelectorAll('[data-work-filter="' + group + '"]')).forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === chip));
      });
      var count = 0;
      Array.from(main.querySelectorAll('[data-work-item]')).forEach(function (item) {
        var visible = (filterState.region === 'all' || item.getAttribute('data-region') === filterState.region) &&
          (filterState.era === 'all' || item.getAttribute('data-era') === filterState.era);
        item.hidden = !visible;
        if (visible) count += 1;
      });
      var counter = main.querySelector('[data-work-count]');
      if (counter) counter.textContent = '显示 ' + count + ' / ' + ARC.works.length + ' 件作品';
    });
  }

  function updateNavActive() {
    var containers = [drawer, main];
    containers.forEach(function (container) {
      Array.from(container.querySelectorAll('[data-nav-period]')).forEach(function (link) {
        if (state.path === '/period/' + link.getAttribute('data-nav-period')) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }

  function buildSearchIndex() {
    if (state.searchIndex) return state.searchIndex;
    var index = [];
    function add(type, label, title, text, href) {
      index.push({ type: type, label: label, title: title, text: text, href: href });
    }
    IDX.periods.forEach(function (period) {
      add('period', '时期', period.name, period.name + ' ' + period.range,
        period.status === 'ready' ? '#/period/' + period.id : '#/');
    });
    ARC.works.forEach(function (work) {
      add('work', '作品档案', work.name,
        [work.name, work.enName, work.place, work.culture, work.material, work.analysis, work.significance].join(' '),
        '#/work/' + work.id);
    });
    ARC.creators.forEach(function (creator) {
      add('creator', '创作者档案', creator.name,
        [creator.name, creator.region, creator.era, creator.summary, creator.body].join(' '),
        '#/creators?focus=' + creator.id);
    });
    ARC.comparisons.forEach(function (comparison) {
      add('comparison', '比较研究', comparison.title,
        [comparison.title, comparison.question, comparison.background].join(' '), '#/comparison/' + comparison.id);
    });
    PER.sections.forEach(function (section) {
      add('chapter', '史前艺术章节', section.title,
        [section.title].concat(section.paras).join(' '), '#/period/prehistoric?s=' + section.id);
    });
    ARC.sources.forEach(function (source) {
      add('source', '资料来源', source.title, [source.title, source.org, source.note].join(' '), '#/sources');
    });
    state.searchIndex = index;
    return index;
  }

  function highlight(text, query) {
    var safe = V.esc(text);
    if (!query) return safe;
    var escaped = V.esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safe.replace(new RegExp(escaped, 'gi'), function (match) { return '<mark>' + match + '</mark>'; });
    } catch (error) {
      return safe;
    }
  }

  function renderSearch() {
    var query = searchInput.value.trim();
    state.searchFlat = [];
    state.searchActive = -1;
    if (!query) {
      searchResults.innerHTML = '<p class="section-note">输入关键词检索作品、章节、创作者、比较、来源与时期。中文可用子串，英文可用名称子串。</p>';
      return;
    }
    var needle = query.toLowerCase();
    var matches = buildSearchIndex().filter(function (item) { return item.text.toLowerCase().indexOf(needle) >= 0; });
    if (!matches.length) {
      searchResults.innerHTML = '<p aria-live="polite">没有找到与「' + V.esc(query) +
        '」相关的内容。可尝试作品中文名、英文名称、地点或章节标题；本站目前仅整理了史前艺术。</p>';
      return;
    }
    var groups = {};
    matches.forEach(function (item) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    var html = '';
    Object.keys(groups).forEach(function (type) {
      var items = groups[type];
      var expanded = !!state.expanded[type];
      var shown = expanded ? items : items.slice(0, 8);
      html += '<section class="search-group"><h2 class="section-note">' + V.esc(items[0].label) + ' · ' + items.length + ' 条</h2><ul class="relation-list">';
      shown.forEach(function (item) {
        state.searchFlat.push(item.href);
        var index = state.searchFlat.length - 1;
        html += '<li><a href="' + V.esc(item.href) + '" data-search-result data-index="' + index + '">' +
          highlight(item.title, query) + '</a> <span class="section-note">' + V.esc(item.label) + '</span></li>';
      });
      html += '</ul>';
      if (items.length > 8) {
        html += '<button type="button" class="link-btn" data-search-expand="' + type + '">' +
          (expanded ? '收起' : '查看全部 ' + items.length + ' 条') + '</button>';
      }
      html += '</section>';
    });
    searchResults.innerHTML = html;
  }

  function setSearchActive(index) {
    var links = Array.from(searchResults.querySelectorAll('[data-search-result]'));
    if (!links.length) return;
    state.searchActive = (index + links.length) % links.length;
    links.forEach(function (link, i) { link.classList.toggle('is-active', i === state.searchActive); });
    links[state.searchActive].scrollIntoView({ block: 'nearest' });
  }

  function toggleSearch(open) {
    state.searchOpen = open;
    searchPanel.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      closeAllOverlays(false);
      searchInput.focus();
    } else {
      searchInput.value = '';
      searchResults.innerHTML = '';
    }
  }

  function toggleBookmark(item) {
    if (!item || !item.id) {
      toast('当前页面暂无可收藏条目');
      return;
    }
    var pressed = S.toggleBookmark(item.id, item.type, item.title, item.periodId);
    syncBookmarks(document);
    toast(pressed ? '已收藏：' + item.title : '已取消收藏：' + item.title);
    if (state.path === '/library') render();
  }

  function pageItem() {
    if (state.path.indexOf('/work/') === 0) {
      var id = state.path.slice('/work/'.length);
      var work = V.workById(id);
      return work ? { id: work.id, type: 'work', title: work.name } : null;
    }
    if (state.path.indexOf('/comparison/') === 0) {
      var cid = state.path.slice('/comparison/'.length);
      var comparison = V.comparisonById(cid);
      return comparison ? { id: comparison.id, type: 'comparison', title: comparison.title } : null;
    }
    if (state.path === '/period/prehistoric') {
      var chapter = PER.sections.find(function (s) { return s.id === state.activeChapter; });
      return chapter ? { id: chapter.id, type: 'chapter', title: chapter.title, periodId: 'prehistoric' }
        : { id: 'prehistoric', type: 'chapter', title: '史前艺术', periodId: 'prehistoric' };
    }
    return null;
  }

  function titleFor(path) {
    if (path === '/') return '世界艺术史';
    if (path === '/period/prehistoric') return '史前艺术';
    if (path === '/works') return '作品档案';
    if (path === '/creators') return '创作者档案';
    if (path === '/comparisons') return '比较研究';
    if (path === '/book') return '原著目录';
    if (path === '/civilizations') return '文明索引';
    if (path === '/sources') return '资料来源';
    if (path === '/atlas') return '分布与年表';
    if (path === '/library') return '我的阅读';
    if (path.indexOf('/work/') === 0) {
      var work = V.workById(path.slice('/work/'.length));
      return work ? work.name : '未找到内容';
    }
    if (path.indexOf('/comparison/') === 0) {
      var comparison = V.comparisonById(path.slice('/comparison/'.length));
      return comparison ? comparison.title : '未找到内容';
    }
    return '未找到内容';
  }

  function render() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    window.clearTimeout(state.scrollTimer);
    dismissRestoreNotice({ immediate: true });
    state.anchorPosition = null;
    restoreRoot.innerHTML = '';
    closeAllOverlays(false);
    if (state.searchOpen) toggleSearch(false);

    var path = parseRoute();
    state.path = path;
    state.activeChapter = null;
    var html;
    if (path === '/') html = V.home();
    else if (path === '/period/prehistoric') {
      var stored = S.getPosition('prehistoric');
      var anchorId = stored && PER.sections.some(function (s) { return s.id === stored.chapterId; })
        ? stored.chapterId : null;
      state.anchorPosition = anchorId ? stored : null;
      html = V.period(queryValue('s'), anchorId);
    }
    else if (path === '/works') html = V.works();
    else if (path.indexOf('/work/') === 0) {
      var wid = path.slice('/work/'.length);
      var work = V.workById(wid);
      if (work) S.addRecent(wid, 'work', work.name);
      html = V.work(wid);
    } else if (path === '/creators') html = V.creators();
    else if (path === '/comparisons') html = V.comparisons();
    else if (path.indexOf('/comparison/') === 0) {
      var cid = path.slice('/comparison/'.length);
      var comparison = V.comparisonById(cid);
      if (comparison) S.addRecent(cid, 'comparison', comparison.title);
      html = V.comparison(cid);
    } else if (path === '/book') html = V.book();
    else if (path === '/civilizations') html = V.civilizations();
    else if (path === '/sources') html = V.sources();
    else if (path === '/atlas') html = V.atlas();
    else if (path === '/library') html = V.library();
    else html = V.notFound();

    main.innerHTML = html;
    document.title = titleFor(path) + ' · 世界艺术史';
    syncBookmarks(main);
    updateNavActive();
    window.scrollTo(0, 0);
    progressTrack.classList.remove('is-visible');
    progressFill.style.width = '0';

    focusMainHeading();

    if (path === '/period/prehistoric') initPeriod();
    if (path === '/works') initWorksFilters();
    if (path === '/atlas') window.WamMap.init();
    if (path === '/creators') {
      var focusId = queryValue('focus');
      if (focusId) {
        var target = main.querySelector('#creator-' + focusId);
        if (target) window.requestAnimationFrame(function () { target.scrollIntoView({ block: 'start' }); });
      }
    }
    if (path === '/civilizations') {
      var civId = queryValue('focus');
      if (civId) {
        var civ = main.querySelector('#civ-' + civId);
        if (civ) window.requestAnimationFrame(function () { civ.scrollIntoView({ block: 'start' }); });
      }
    }
    updateProgress();
  }

  function onClick(event) {
    var chapterLink = event.target.closest('[data-chapter-link]');
    if (chapterLink) {
      event.preventDefault();
      scrollToChapter(chapterLink.getAttribute('data-chapter-link'));
      closeOverlay(sheetRoot, false);
      return;
    }

    var anchor = event.target.closest('[data-anchor-chapter]');
    if (anchor) {
      event.preventDefault();
      scrollToSavedPosition();
      closeOverlay(sheetRoot, false);
      return;
    }

    var bookmark = event.target.closest('[data-bookmark]');
    if (bookmark) {
      event.preventDefault();
      toggleBookmark({
        id: bookmark.getAttribute('data-id'),
        type: bookmark.getAttribute('data-type'),
        title: bookmark.getAttribute('data-title'),
        periodId: bookmark.getAttribute('data-period')
      });
      return;
    }

    var remove = event.target.closest('[data-remove-bookmark]');
    if (remove) {
      S.removeBookmark(remove.getAttribute('data-id'), remove.getAttribute('data-type'));
      toast('已从收藏中移除');
      render();
      return;
    }

    var clearPosition = event.target.closest('[data-clear-position]');
    if (clearPosition) {
      S.clearPosition(clearPosition.getAttribute('data-clear-position'));
      toast('已清除该条阅读位置');
      render();
      return;
    }

    if (event.target.closest('[data-clear-recent]')) {
      openConfirm('清空最近阅读将删除本机全部最近阅读记录，且不可撤销。收藏与阅读位置不受影响。', function () {
        S.clearRecent();
        toast('最近阅读已清空');
        render();
      });
      return;
    }

    if (event.target.closest('[data-clear-positions]')) {
      openConfirm('清除全部阅读位置将删除本机保存的所有继续阅读记录，且不可撤销。', function () {
        S.clearPositions();
        toast('阅读位置已清除');
        render();
      });
      return;
    }

    var bookNotice = event.target.closest('[data-book-notice]');
    if (bookNotice) {
      var box = document.getElementById('book-notice');
      if (box) {
        box.textContent = bookNotice.getAttribute('data-book-notice');
        box.hidden = false;
        box.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
      }
      return;
    }

    var site = event.target.closest('[data-site]');
    if (site) {
      openSiteCard(site.getAttribute('data-site'));
      return;
    }

    var image = event.target.closest('[data-image-src]');
    if (image) {
      openLightbox(image.getAttribute('data-image-src'), image.getAttribute('data-image-title'),
        image.getAttribute('data-image-credit'));
      return;
    }

    if (event.target.closest('[data-restore-continue]')) {
      dismissRestoreNotice({ immediate: true });
      scrollToSavedPosition();
      return;
    }

    if (event.target.closest('[data-restore-restart]')) {
      dismissRestoreNotice({ immediate: true });
      S.clearPosition('prehistoric');
      state.anchorPosition = null;
      Array.from(document.querySelectorAll('[data-anchor-chapter]')).forEach(function (marker) { marker.remove(); });
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      return;
    }

    if (event.target.closest('[data-restart]')) {
      S.clearPosition('prehistoric');
      return;
    }

    var tool = event.target.closest('[data-tool]');
    if (tool) {
      var action = tool.getAttribute('data-tool');
      if (action === 'toc') openTocSheet();
      if (action === 'bookmark') toggleBookmark(pageItem());
      if (action === 'top') window.scrollTo({ top: 0, behavior: scrollBehavior() });
      return;
    }

    var backdrop = event.target.closest('[data-backdrop-root]');
    if (backdrop) {
      var backRoot = document.getElementById(backdrop.getAttribute('data-backdrop-root'));
      closeOverlay(backRoot, true);
      if (backRoot === drawer) navToggle.setAttribute('aria-expanded', 'false');
      return;
    }
    if (event.target.closest('[data-close-overlay]')) {
      var root = event.target.closest('#site-drawer, #sheet-root, #dialog-root, #lightbox-root');
      closeOverlay(root, true);
      if (root === drawer) navToggle.setAttribute('aria-expanded', 'false');
      return;
    }

    var expand = event.target.closest('[data-search-expand]');
    if (expand) {
      var type = expand.getAttribute('data-search-expand');
      state.expanded[type] = !state.expanded[type];
      renderSearch();
      return;
    }

    var result = event.target.closest('[data-search-result]');
    if (result) {
      toggleSearch(false);
      return;
    }

    if (event.target.closest('.drawer a, .sheet a')) {
      closeOverlay(event.target.closest('#site-drawer, #sheet-root'), false);
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function onKeydown(event) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((event.key === '/' && !typing && !state.searchOpen) ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      toggleSearch(true);
      return;
    }
    if (!state.searchOpen) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSearchActive(state.searchActive + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSearchActive(state.searchActive - 1);
    } else if (event.key === 'Enter' && state.searchActive >= 0) {
      event.preventDefault();
      window.location.hash = state.searchFlat[state.searchActive];
      toggleSearch(false);
    } else if (event.key === 'Escape') {
      toggleSearch(false);
    }
  }

  function onScroll() {
    updateProgress();
    if (state.restoreNotice && !state.restoreHover && !state.restoreNotice.contains(document.activeElement) &&
      Math.abs(window.scrollY - state.restoreBaseline) > 24) {
      dismissRestoreNotice({ immediate: true });
    }
    if (state.path === '/period/prehistoric') schedulePositionWrite();
  }

  function init() {
    S.onUnavailable(function () {
      toast('本地存储不可用：本次收藏与阅读记录仅保存在内存中。', 6000);
    });
    drawer.innerHTML = V.globalNav();
    preferences();
    render();

    window.addEventListener('hashchange', render);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    window.addEventListener('pagehide', writePosition);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') writePosition();
    });

    navToggle.addEventListener('click', function () {
      if (drawer.hidden) openDrawer();
      else {
        closeOverlay(drawer, true);
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    searchToggle.addEventListener('click', function () { toggleSearch(state.searchOpen === false); });
    document.getElementById('search-close').addEventListener('click', function () { toggleSearch(false); });
    searchInput.addEventListener('input', function () {
      state.expanded = {};
      renderSearch();
    });
  }

  function preferences() {
    var reduced = S.getPrefs().reducedMotion === 'off' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.documentElement.classList.toggle('reduced-motion', reduced);
  }

  window.WamApp = {
    queryValue: queryValue,
    prefersAutoScroll: prefersAutoScroll,
    imageFallback: imageFallback,
    thumbFallback: thumbFallback,
    openSiteCard: openSiteCard
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
