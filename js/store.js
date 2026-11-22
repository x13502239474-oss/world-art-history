(function () {
  'use strict';

  var PREFIX = 'wam:v1:';
  var SCHEMA = 1;
  var MEMORY = {};
  var unavailableListener = null;
  var unavailableNotified = false;

  function fallback(key, value) {
    return Object.prototype.hasOwnProperty.call(MEMORY, key) ? MEMORY[key] : value;
  }

  function read(key, initial) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback(key, initial);
      return JSON.parse(raw);
    } catch (error) {
      return fallback(key, initial);
    }
  }

  function write(key, value) {
    MEMORY[key] = value;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      if (!unavailableNotified) {
        unavailableNotified = true;
        window.setTimeout(function () {
          if (unavailableListener) unavailableListener();
        }, 0);
      }
    }
  }

  function array(key) {
    var value = read(key, []);
    return Array.isArray(value) ? value : [];
  }

  function object(key) {
    var value = read(key, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function stamp() { return new Date().toISOString(); }

  function same(a, b) { return a.id === b.id && a.type === b.type; }

  function withinTTL(entry) {
    if (!entry || !entry.updatedAt) return false;
    var then = Date.parse(entry.updatedAt);
    return isFinite(then) && (Date.now() - then) <= 30 * 24 * 60 * 60 * 1000;
  }

  function init() {
    try {
      var probe = PREFIX + '__probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
    } catch (error) {
      if (!unavailableNotified) {
        unavailableNotified = true;
        window.setTimeout(function () {
          if (unavailableListener) unavailableListener();
        }, 0);
      }
    }
    if (read('schema', null) !== SCHEMA) write('schema', SCHEMA);
    var prefs = object('prefs');
    if (!prefs.reducedMotion || !Object.prototype.hasOwnProperty.call(prefs, 'mapFallbackAlways')) {
      write('prefs', { reducedMotion: 'system', mapFallbackAlways: true });
    }
  }

  var Store = {
    init: init,
    onUnavailable: function (fn) { unavailableListener = fn; },

    getBookmarks: function () { return array('bookmarks'); },
    isBookmarked: function (id, type) {
      return array('bookmarks').some(function (item) { return item.id === id && item.type === type; });
    },
    toggleBookmark: function (id, type, title, periodId) {
      var list = array('bookmarks');
      var index = list.findIndex(function (item) { return item.id === id && item.type === type; });
      var pressed;
      if (index >= 0) {
        list.splice(index, 1);
        pressed = false;
      } else {
        list.unshift({ id: id, type: type, periodId: periodId || 'prehistoric', title: title || id, addedAt: stamp() });
        pressed = true;
        if (list.length > 200) list.length = 200;
      }
      write('bookmarks', list);
      return pressed;
    },
    removeBookmark: function (id, type) {
      write('bookmarks', array('bookmarks').filter(function (item) { return !same(item, { id: id, type: type }); }));
    },

    getRecent: function () { return array('recent'); },
    addRecent: function (id, type, title, periodId) {
      var list = array('recent').filter(function (item) { return !same(item, { id: id, type: type }); });
      list.unshift({ id: id, type: type, periodId: periodId || 'prehistoric', title: title || id, visitedAt: stamp() });
      if (list.length > 50) list.length = 50;
      write('recent', list);
    },
    clearRecent: function () { write('recent', []); },

    getPositions: function () {
      var all = object('positions');
      var keys = Object.keys(all);
      var kept = {};
      keys.forEach(function (key) { if (withinTTL(all[key])) kept[key] = all[key]; });
      if (keys.length !== Object.keys(kept).length) write('positions', kept);
      return Object.keys(kept).map(function (key) { return kept[key]; })
        .sort(function (a, b) { return Date.parse(b.updatedAt) - Date.parse(a.updatedAt); });
    },
    getPosition: function (periodId) {
      var pos = object('positions')[periodId];
      return withinTTL(pos) ? pos : null;
    },
    setPosition: function (position) {
      if (!position || !position.periodId) return;
      var all = object('positions');
      delete all[position.periodId];
      all[position.periodId] = {
        periodId: position.periodId,
        chapterId: position.chapterId || null,
        scrollY: Math.round(position.scrollY || 0),
        ratio: Math.max(0, Math.min(1, position.ratio || 0)),
        updatedAt: stamp()
      };
      var keys = Object.keys(all);
      if (keys.length > 30) {
        keys.sort(function (a, b) { return Date.parse(all[a].updatedAt) - Date.parse(all[b].updatedAt); });
        keys.slice(0, keys.length - 30).forEach(function (key) { delete all[key]; });
      }
      write('positions', all);
    },
    clearPosition: function (periodId) {
      var all = object('positions');
      delete all[periodId];
      write('positions', all);
    },
    clearPositions: function () { write('positions', {}); },

    getPrefs: function () {
      var prefs = object('prefs');
      return {
        reducedMotion: prefs.reducedMotion === 'off' ? 'off' : 'system',
        mapFallbackAlways: prefs.mapFallbackAlways !== false
      };
    },
    setPref: function (key, value) {
      var prefs = object('prefs');
      prefs[key] = value;
      write('prefs', prefs);
    }
  };

  window.WamStore = Store;
  init();
})();
