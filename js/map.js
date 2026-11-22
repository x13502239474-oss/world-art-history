(function () {
  'use strict';

  const MAP_KEY = '请到腾讯位置服务开放平台申请自己的 key 并替换此占位符';
  const PLACEHOLDER = '请到腾讯位置服务开放平台申请自己的 key 并替换此占位符';

  var IDX = window.SITE_INDEX;

  function sameWork(node, workId) {
    if (!workId) return false;
    return node.getAttribute('data-work') === workId || node.getAttribute('data-timeline-work') === workId;
  }

  function clearHighlights(root) {
    Array.from(root.querySelectorAll('.is-linked')).forEach(function (node) {
      node.classList.remove('is-linked');
    });
  }

  function highlight(root, workId) {
    clearHighlights(root);
    if (!workId) return;
    Array.from(root.querySelectorAll('[data-work], [data-timeline-work]')).forEach(function (node) {
      if (sameWork(node, workId)) node.classList.add('is-linked');
    });
  }

  function applyFilters(root, state) {
    var count = 0;
    Array.from(root.querySelectorAll('[data-site]')).forEach(function (node) {
      var site = IDX.sites.find(function (item) { return item.id === node.getAttribute('data-site'); });
      if (!site) return;
      var visible = (state.region === 'all' || site.region === state.region) &&
        (state.era === 'all' || site.era === state.era);
      node.hidden = !visible;
      if (visible) count += 1;
    });
    Array.from(root.querySelectorAll('[data-legend-region]')).forEach(function (legend) {
      var region = legend.getAttribute('data-legend-region');
      var visible = Array.from(root.querySelectorAll('[data-site]')).some(function (node) {
        var site = IDX.sites.find(function (item) { return item.id === node.getAttribute('data-site'); });
        return site && site.region === region && !node.hidden;
      });
      legend.hidden = !visible;
    });
    var counter = root.querySelector('[data-site-count]');
    if (counter) counter.textContent = '显示 ' + count + ' / ' + IDX.sites.length + ' 个站点';
  }

  function bindFilters(root) {
    var state = { period: null, region: 'all', era: 'all' };
    var bar = root.querySelector('[data-atlas-filters]');
    if (!bar) return;
    bar.addEventListener('click', function (event) {
      var chip = event.target.closest('[data-filter]');
      if (chip) {
        if (chip.disabled) return;
        var group = chip.getAttribute('data-filter');
        var value = chip.getAttribute('data-value');
        state[group] = value === 'all' ? null : value;
        Array.from(bar.querySelectorAll('[data-filter="' + group + '"]')).forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === chip));
        });
        applyFilters(root, state);
        return;
      }
      if (event.target.closest('[data-filter-reset]')) {
        state = { period: null, region: 'all', era: 'all' };
        Array.from(bar.querySelectorAll('[data-filter]')).forEach(function (item) {
          item.setAttribute('aria-pressed', String(item.getAttribute('data-value') === 'all'));
        });
        applyFilters(root, state);
      }
    });
    applyFilters(root, state);

    var focusSite = function () {
      var query = window.WamApp && window.WamApp.queryValue('site');
      if (!query) return;
      var node = root.querySelector('[data-site="' + query + '"]');
      if (node) {
        node.setAttribute('aria-current', 'true');
        node.scrollIntoView({ behavior: window.WamApp.prefersAutoScroll() ? 'auto' : 'smooth', block: 'center' });
      }
    };
    window.setTimeout(focusSite, 0);
  }

  function bindLinks(root) {
    root.addEventListener('mouseover', function (event) {
      var node = event.target.closest('[data-work], [data-timeline-work]');
      if (node) highlight(root, node.getAttribute('data-work') || node.getAttribute('data-timeline-work'));
    });
    root.addEventListener('mouseout', function (event) {
      if (event.target.closest('[data-work], [data-timeline-work]')) clearHighlights(root);
    });
    root.addEventListener('focusin', function (event) {
      var node = event.target.closest('[data-work], [data-timeline-work]');
      if (node) highlight(root, node.getAttribute('data-work') || node.getAttribute('data-timeline-work'));
    });
    root.addEventListener('focusout', function () { clearHighlights(root); });
    root.addEventListener('click', function (event) {
      var node = event.target.closest('[data-timeline-work]');
      if (!node || node.matches('[data-site]')) return;
      var workId = node.getAttribute('data-timeline-work');
      if (!workId) return;
      var dot = Array.from(root.querySelectorAll('[data-site]')).find(function (item) {
        return item.getAttribute('data-work') === workId;
      });
      if (dot) {
        dot.scrollIntoView({ behavior: window.WamApp.prefersAutoScroll() ? 'auto' : 'smooth', block: 'center' });
        highlight(root, workId);
      }
    });
  }

  function bind(root) {
    if (!root || root.dataset.mapBound === '1') return;
    root.dataset.mapBound = '1';
    bindFilters(root);
    bindLinks(root);
  }

  function degrade(note, text) {
    if (note) note.textContent = text;
  }

  function enhance(root) {
    var note = root.querySelector('[data-map-enhance]');
    if (!MAP_KEY || MAP_KEY === PLACEHOLDER || MAP_KEY.indexOf('占位符') >= 0 || MAP_KEY.indexOf('请到') >= 0) {
      degrade(note, '在线底图增强未启用；示意矩阵为默认视图。');
      return;
    }
    var host = document.createElement('div');
    host.className = 'map-canvas';
    root.appendChild(host);
    var timer = window.setTimeout(function () {
      if (script.parentNode) script.parentNode.removeChild(script);
      degrade(note, '在线底图加载超时；已保留示意矩阵。');
    }, 3000);
    var script = document.createElement('script');
    script.src = 'https://map.qq.com/api/gljs?v=1.exp&key=' + encodeURIComponent(MAP_KEY);
    script.onload = function () {
      window.clearTimeout(timer);
      if (window.TMap && window.TMap.Map) {
        try {
          new window.TMap.Map(host, {
            center: new window.TMap.LatLng(30, 70),
            zoom: 2
          });
          degrade(note, '在线底图增强已加载；示意矩阵仍为默认视图。');
        } catch (error) {
          degrade(note, '在线底图初始化失败；已保留示意矩阵。');
        }
      } else {
        degrade(note, '在线底图接口不可用；已保留示意矩阵。');
      }
    };
    script.onerror = function () {
      window.clearTimeout(timer);
      degrade(note, '在线底图加载失败；已保留示意矩阵。');
    };
    document.head.appendChild(script);
  }

  function init() {
    var root = document.querySelector('[data-atlas]');
    if (!root) return;
    bind(root);
    enhance(root);
  }

  window.WamMap = { init: init, bind: bind };
})();
