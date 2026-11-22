(function () {
  'use strict';

  var IDX = window.SITE_INDEX;
  var PER = window.PREHISTORIC_CONTENT;
  var ARC = window.PREHISTORIC_ARCHIVE;
  var BOOK = window.BOOK_DATA;
  var NOTICE = '示意图，不表示国界；站点位置为示意，非精确地理坐标。';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function regionName(id) { return IDX.regionNames[id] || id || '未标注'; }

  function workById(id) { return ARC.works.find(function (w) { return w.id === id; }) || null; }
  function creatorById(id) { return ARC.creators.find(function (c) { return c.id === id; }) || null; }
  function comparisonById(id) { return ARC.comparisons.find(function (c) { return c.id === id; }) || null; }
  function sourceById(id) { return ARC.sources.find(function (s) { return s.id === id; }) || null; }
  function siteById(id) { return IDX.sites.find(function (s) { return s.id === id; }) || null; }
  function periodById(id) { return IDX.periods.find(function (p) { return p.id === id; }) || null; }

  function statusText(status) {
    return status === 'ready' || status === 'full' ? '完整叙事'
      : status === 'partial' ? '部分内容已完成' : '内容整理中';
  }

  function statusClass(status) {
    return status === 'ready' ? 'full' : status;
  }

  function statusTag(status) {
    return '<span class="status-tag ' + esc(statusClass(status)) + '">' + esc(statusText(status)) + '</span>';
  }

  function badge(type) {
    if (type === 'book-chapter') return '<span class="badge badge-book"></span>';
    if (type === 'web-supplement') return '<span class="badge badge-web"></span>';
    return '<span class="badge badge-archive">' + esc(type || '补充资料') + '</span>';
  }

  function stamp(value) {
    if (!value) return '未记录时间';
    var text = String(value);
    return text.length >= 16 ? text.slice(0, 16).replace('T', ' ') : text;
  }

  function breadcrumb(items) {
    var lis = items.map(function (item, index) {
      var last = index === items.length - 1;
      var content = last ? '<span aria-current="page">' + esc(item[0]) + '</span>'
        : '<a href="' + esc(item[1] || '#/') + '">' + esc(item[0]) + '</a>';
      return '<li>' + content + '</li>';
    }).join('');
    return '<nav class="breadcrumb" aria-label="面包屑"><ol>' + lis + '</ol></nav>';
  }

  function bookmarkButton(item) {
    return '<button type="button" class="bookmark-btn" data-bookmark ' +
      'data-id="' + esc(item.id) + '" data-type="' + esc(item.type) + '" ' +
      'data-title="' + esc(item.title) + '" data-period="' + esc(item.periodId || 'prehistoric') + '" ' +
      'aria-pressed="false" aria-label="收藏：' + esc(item.title) + '"><span aria-hidden="true">☆</span></button>';
  }

  function globalNav() {
    var periods = IDX.periods.map(function (period) {
      var label = '<span class="nav-range">' + esc(period.range) + '</span>';
      if (period.status === 'ready') {
        return '<li><a href="#/period/' + esc(period.id) + '" data-nav-period="' + esc(period.id) + '">' +
          '<span>' + esc(period.name) + label + '</span>' + statusTag(period.status) + '</a></li>';
      }
      return '<li><span class="nav-planned"><span>' + esc(period.name) + label + '</span>' +
        statusTag(period.status) + '</span></li>';
    }).join('');

    var civs = IDX.civilizations.map(function (civ) {
      return '<li><a href="#/civilizations?focus=' + esc(civ.id) + '">' + esc(civ.name) +
        '<span class="nav-range">' + esc(statusText(civ.status)) + '</span></a></li>';
    }).join('');

    var book = BOOK.parts.map(function (part) {
      var chapters = part.chapters.map(function (chapter) {
        var linked = chapter.id === 'ch-1';
        var text = esc(chapter.title.replace(/\s+/g, ' ')) + ' · ' + chapter.page;
        return linked
          ? '<li><a class="book-nav-chapter is-linked" href="#/period/prehistoric">' + text + '</a></li>'
          : '<li><span class="book-nav-chapter">' + text + '</span></li>';
      }).join('');
      return '<div class="book-nav-part">' + esc(part.title.replace(/\s+/g, ' ')) + '</div><ul>' + chapters + '</ul>';
    }).join('');

    return '<nav class="global-nav" aria-label="全站导航">' +
      '<div class="nav-group"><h3>主导航 · 时期（9）</h3><ol>' + periods + '</ol></div>' +
      '<div class="nav-group nav-aux"><h3>地域文明（10）</h3><ul>' + civs + '</ul></div>' +
      '<div class="nav-group nav-book"><h3>5 部 21 章（仅供查证）</h3>' + book + '</div>' +
      '<div class="nav-group"><a href="#/library">我的阅读 · 收藏与位置</a></div>' +
      '</nav>';
  }

  function dotLegend() {
    return '<p class="dot-legend"><span class="legend-item">● 原著章节</span>' +
      '<span class="legend-item">○ 网页补充内容</span></p>';
  }

  function tocList(anchorId) {
    return PER.sections.map(function (section, index) {
      var anchor = anchorId === section.id
        ? '<button type="button" class="anchor-marker" data-anchor-chapter="' + esc(section.id) + '" ' +
          'aria-label="上次读到这里：〈' + esc(section.title) + '〉，继续阅读">' +
          '<span class="anchor-text">上次读到这里</span><span class="anchor-dot" aria-hidden="true">●</span></button>'
        : '';
      var dotClass = section.sourceType === 'book-chapter' ? 'book' : 'web';
      return '<li class="toc-item"><a class="toc-link" href="#ch-' + esc(section.id) + '" ' +
        'data-chapter-link="' + esc(section.id) + '">' +
        '<span class="source-dot source-dot--' + dotClass + '" aria-hidden="true">' +
        (dotClass === 'book' ? '●' : '○') + '</span>' +
        '<span class="toc-title"><span class="chapter-index">' + (index + 1) + '</span> ' + esc(section.title) + '</span></a>' +
        anchor + '</li>';
    }).join('');
  }

  function periodToc(anchorId) {
    return '<nav aria-label="本篇目录"><h3>本篇目录</h3>' + dotLegend() + '<ol>' + tocList(anchorId) + '</ol></nav>';
  }

  function plateShape(work) {
    var form = work.form || '';
    if (/圆雕|雕塑/.test(form)) return 'round';
    if (/陶|钵|壶|容器/.test(form)) return 'pottery';
    if (/刻纹片|石片/.test(form)) return 'incised';
    return 'wide';
  }

  function regionTint(work) {
    var tints = {
      africa: '#C9A87A', europe: '#B9B2A0', 'west-asia': '#C7B08A', 'east-asia': '#B7B49C',
      'southeast-asia': '#BFAF86', americas: '#C3A98C', oceania: '#B6B7A0', 'south-asia': '#CBB48F'
    };
    return tints[work.region] || '#C6BCA6';
  }

  function textPlate(work) {
    return '<div class="plate" data-shape="' + esc(plateShape(work)) + '" style="--region-tint:' + esc(regionTint(work)) + '">' +
      '<div class="plate-liner">' +
      '<div class="plate-texture" aria-hidden="true"></div>' +
      '<span class="plate-watermark" aria-hidden="true">' + esc((work.name || '艺').charAt(0)) + '</span>' +
      '<div class="plate-body">' +
      '<span class="plate-name">' + esc(work.name) + '</span>' +
      '<span class="plate-rule" aria-hidden="true"></span>' +
      '<span class="plate-date">' + esc(work.date) + '</span>' +
      '<span class="plate-en">' + esc(work.enName) + '</span>' +
      '<span class="plate-specs">' + esc(work.material) + ' · ' + esc(work.form) + '</span>' +
      '</div>' +
      '<span class="plate-note">本条目未配置图像，文字描述如下</span>' +
      '<span class="plate-region">' + esc(regionName(work.region)) + '</span>' +
      '</div></div>';
  }

  function imageFigure(work) {
    if (!work.image) {
      return '<figure class="plate-figure" data-shape="' + esc(plateShape(work)) + '">' + textPlate(work) +
        '<figcaption>文字图版说明 · ' + esc(work.form) + ' · ' + esc(work.date) + '</figcaption></figure>';
    }
    var credit = work.imageCredit ? '<br>图像来源：' + esc(work.imageCredit) : '';
    return '<figure class="plate-figure" data-work-figure="' + esc(work.id) + '" data-shape="' + esc(plateShape(work)) + '">' +
      '<button type="button" class="image-trigger" data-image-src="' + esc(work.image) + '" ' +
      'data-image-title="' + esc(work.name) + '" data-image-credit="' + esc(work.imageCredit || '') + '" ' +
      'aria-label="放大查看：' + esc(work.name) + '">' +
      '<img src="' + esc(work.image) + '" alt="' + esc(work.name) + '图像" loading="lazy" ' +
      'onerror="window.WamApp && window.WamApp.imageFallback(this)"></button>' +
      '<figcaption><span class="plate-caption-title">' + esc(work.name) + '</span>' + credit + '</figcaption>' +
      '<div class="image-fallback-note">' + textPlate(work) + '</div>' +
      '</figure>';
  }

  function smallThumb(work) {
    if (work.image) {
      return '<div class="work-thumb"><figure class="plate-figure" data-shape="' + esc(plateShape(work)) + '"><img src="' + esc(work.image) +
        '" alt="' + esc(work.name) + '图像" loading="lazy" ' +
        'onerror="window.WamApp && window.WamApp.thumbFallback(this,\'' + esc(work.id) + '\')"></figure></div>';
    }
    return '<div class="work-thumb">' + textPlate(work) + '</div>';
  }

  function timelineList() {
    var items = PER.timeline.map(function (entry) {
      var work = entry.workId ? workById(entry.workId) : null;
      var detail = work
        ? '<a href="#/work/' + esc(work.id) + '">' + esc(entry.text) + '</a>'
        : '<span>' + esc(entry.text) + '</span> <span class="timeline-no-work">暂无对应作品档案</span>';
      return '<li data-timeline-work="' + esc(entry.workId || '') + '">' +
        '<span class="timeline-year">' + esc(entry.year) + '</span>' +
        '<span class="timeline-label">' + esc(entry.label) + '</span>' +
        '<span class="timeline-text">' + detail + '</span></li>';
    }).join('');
    return '<ol class="timeline-list">' + items + '</ol>';
  }

  function atlasTimeline() {
    var nodes = PER.timeline.map(function (entry) {
      var work = entry.workId ? workById(entry.workId) : null;
      var cls = work ? 'timeline-node is-clickable' : 'timeline-node is-empty';
      var inner = '<span class="node-year">' + esc(entry.year) + '</span>' +
        '<span class="node-label">' + esc(entry.label) + '</span>' + esc(entry.text) +
        (work ? '' : '<br><span class="timeline-no-work">暂无对应作品档案</span>');
      return work
        ? '<button type="button" class="' + cls + '" data-timeline-work="' + esc(work.id) + '">' + inner + '</button>'
        : '<div class="' + cls + '" data-timeline-work="">' + inner + '</div>';
    }).join('');
    return '<div class="timeline-rail" aria-label="史前艺术时间轴">' + nodes + '</div>';
  }

  function matrixMarkup() {
    var bands = ['西经120–60', '西经60–0', '0–东经60', '东经60–120', '东经120–180']
      .map(function (name) { return '<span>' + esc(name) + '</span>'; }).join('');
    var groups = Object.keys(IDX.regionNames).map(function (region) {
      var sites = IDX.sites.filter(function (site) { return site.region === region; });
      var items = sites.map(function (site) {
        var label = site.name + '，' + regionName(site.region) + '，' + site.era + '，查看作品';
        return '<li><button type="button" class="site-dot" data-site="' + esc(site.id) + '" ' +
          'data-work="' + esc(site.workId || '') + '" style="--x:' + Number(site.x) + ';--y:' + Number(site.y) + '" ' +
          'data-marker="' + esc(site.name.charAt(0)) + '" aria-label="' + esc(label) + '"></button></li>';
      }).join('');
      return '<li class="matrix-group" data-group-region="' + esc(region) + '"><ul>' + items + '</ul></li>';
    }).join('');

    var legend = Object.keys(IDX.regionNames).map(function (region) {
      return '<li data-legend-region="' + esc(region) + '">' + esc(regionName(region)) + '</li>';
    }).join('');

    return '<div class="matrix-frame" data-matrix>' +
      '<p class="matrix-notice">' + esc(NOTICE) + '</p>' +
      '<div class="matrix-canvas"><div class="matrix-bands">' + bands + '</div>' +
      '<ul class="matrix-sites">' + groups + '</ul></div>' +
      '<ul class="matrix-legend" aria-label="区域图例">' + legend + '</ul>' +
      '<div class="matrix-caption">' + esc(NOTICE) + '<br>共 ' + IDX.sites.length +
      ' 处示意站点；点击站点查看区域、时代与关联作品。</div></div>';
  }

  function atlasFilters() {
    var periods = IDX.periods.map(function (period) {
      var enabled = period.status === 'ready';
      return '<button type="button" class="chip" data-filter="period" data-value="' + esc(period.id) + '" ' +
        'aria-pressed="' + (enabled ? 'false' : 'false') + '"' + (enabled ? '' : ' disabled') + '>' +
        esc(period.name) + (enabled ? '' : ' · 内容整理中') + '</button>';
    }).join('');
    var regions = ['<button type="button" class="chip" data-filter="region" data-value="all" aria-pressed="true">全部区域</button>']
      .concat(Object.keys(IDX.regionNames).map(function (region) {
        return '<button type="button" class="chip" data-filter="region" data-value="' + esc(region) + '" aria-pressed="false">' +
          esc(regionName(region)) + '</button>';
      })).join('');
    var eras = ['<button type="button" class="chip" data-filter="era" data-value="all" aria-pressed="true">全部时代</button>']
      .concat(Array.from(new Set(IDX.sites.map(function (site) { return site.era; }))).map(function (era) {
        return '<button type="button" class="chip" data-filter="era" data-value="' + esc(era) + '" aria-pressed="false">' +
          esc(era) + '</button>';
      })).join('');
    return '<div class="filter-bar" data-atlas-filters>' +
      '<div class="filter-group"><span>时期</span><div class="chip-row">' + periods + '</div></div>' +
      '<div class="filter-group"><span>区域</span><div class="chip-row">' + regions + '</div></div>' +
      '<div class="filter-group"><span>时代</span><div class="chip-row">' + eras + '</div></div>' +
      '<button type="button" class="chip" data-filter-reset>重置筛选</button>' +
      '<span class="filter-count" data-site-count aria-live="polite">显示 ' + IDX.sites.length + ' / ' + IDX.sites.length + ' 个站点</span>' +
      '</div>';
  }

  function civilizationTable() {
    var rows = IDX.civilizations.map(function (civ) {
      var periods = civ.periods.length
        ? civ.periods.map(function (id) {
          var period = periodById(id);
          if (!period) return esc(id);
          return period.status === 'ready'
            ? '<a href="#/period/' + esc(id) + '">' + esc(period.name) + '</a>'
            : '<span class="section-note">' + esc(period.name) + '（内容整理中）</span>';
        }).join('、')
        : '<span class="section-note">暂无覆盖时期</span>';
      return '<tr><th scope="row">' + esc(civ.name) + '</th><td>' + esc(regionName(civ.region)) + '</td>' +
        '<td>' + statusTag(civ.status) + '</td><td>' + esc(civ.note) + '</td><td>' + periods + '</td></tr>';
    }).join('');
    return '<table class="data-table"><thead><tr><th>文明</th><th>地域</th><th>状态</th><th>说明</th><th>覆盖时期</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';
  }

  function home() {
    var positions = window.WamStore.getPositions();
    var last = positions[0];
    var lastChapter = last && PER.sections.find(function (s) { return s.id === last.chapterId; });
    var band = last
      ? '<div class="reading-band"><strong>上次读到这里</strong><span>〈' + esc(lastChapter ? lastChapter.title : PER.name) + '〉 · ' +
        esc(last.updatedAt.slice(0, 10)) + '</span><span class="band-actions">' +
        '<a class="link-btn" href="#/period/' + esc(last.periodId) + '?s=' + esc(last.chapterId || '') + '">继续阅读</a>' +
        '<a class="link-btn" href="#/period/' + esc(last.periodId) + '" data-restart>从头开始</a></span></div>'
      : '';

    var axis = IDX.periods.map(function (period) {
      var inner = '<span><strong>' + esc(period.name) + '</strong><span class="axis-range">' + esc(period.range) + '</span></span>' +
        statusTag(period.status);
      return period.status === 'ready'
        ? '<li><a href="#/period/' + esc(period.id) + '">' + inner + '</a></li>'
        : '<li><span class="axis-planned">' + inner + '</span></li>';
    }).join('');

    var featured = ['willendorf', 'lion-man', 'stonehenge', 'catalhoyuk'].map(function (id) {
      var work = workById(id);
      return work ? '<div>' + imageFigure(work) + '<p class="section-note"><a href="#/work/' + esc(work.id) + '">' +
        esc(work.name) + '</a> · ' + esc(regionName(work.region)) + '</p></div>' : '';
    }).join('');

    return '<div class="container">' + band +
      '<section class="home-intro"><h1 class="site-title">世界艺术史</h1>' +
      '<p class="site-title-en">A World History of Art</p>' +
      '<p class="site-sub">在没有文字的年代，图像如何思考</p>' +
      '<p class="integrity-note">来源诚信：本站正文、作品档案与比较研究均为网页补充内容，依据文末公开的学术与机构资料撰写；' +
      '原著目录忠实取自用户提供的中文版 PDF 书签。本站不伪造原著引文，不把补充内容冒充原著观点。</p>' +
      '<a class="cta-link" href="#/period/prehistoric">进入史前艺术 · 12 章 / 19 件作品 / 11 个档案 / 5 组比较</a>' +
      '</section>' +
      '<section class="section-block"><h2>展览动线 · 九个时期</h2>' +
      '<p class="section-note">主导航按时期排列；目前仅史前艺术已整理完成，其余为内容整理中的文本条目。</p>' +
      '<ol class="period-axis">' + axis + '</ol></section>' +
      '<section class="section-block"><h2>图版陈列 · 四件有图作品</h2>' +
      '<div class="plate-row">' + featured + '</div></section>' +
      '<section class="section-block"><h2>时间轴 · 16 条节点</h2>' + timelineList() + '</section>' +
      '<section class="section-block"><h2>文明分布示意矩阵</h2>' + matrixMarkup() + '</section>' +
      '<section class="section-block"><h2>文明索引 · 10 项</h2>' + civilizationTable() + '</section>' +
      '<section class="section-block"><h2>原著结构 · 5 部 21 章</h2>' +
      '<p>目录条目与页码来自用户提供的中文版 PDF 书签。第一部第一章「史前时代」已配套阅读；其余章节暂无本站内容。</p>' +
      '<a class="link-btn" href="#/book">查看原著目录 →</a></section></div>';
  }

  function period(activeChapter, anchorId) {
    var crumbs = [['首页', '#/'], ['按时期', '#/'], ['史前艺术', '#/period/prehistoric']];
    if (activeChapter) {
      var crumbSection = PER.sections.find(function (s) { return s.id === activeChapter; });
      if (crumbSection) crumbs.push([crumbSection.title, null]);
    }

    var inlineToc = dotLegend() + '<ol class="chapter-toc">' + tocList(anchorId) + '</ol>';

    var bookSections = PER.bookAnchor.sections.map(function (section) {
      return '<li><span class="source-dot source-dot--book" aria-hidden="true">●</span>' +
        '<span>' + esc(section.title) + '</span><span class="line-page">PDF ' + esc(section.page) + '</span></li>';
    }).join('');

    var sections = PER.sections.map(function (section, index) {
      var previous = PER.sections[index - 1];
      var next = PER.sections[index + 1];
      var prevLink = previous
        ? '<a href="#ch-' + esc(previous.id) + '" data-chapter-link="' + esc(previous.id) + '">← 上篇：' + esc(previous.title) + '</a>'
        : '<span class="is-empty">已是第一篇</span>';
      var nextLink = next
        ? '<a href="#ch-' + esc(next.id) + '" data-chapter-link="' + esc(next.id) + '">下篇：' + esc(next.title) + ' →</a>'
        : '<span class="is-empty">已是末篇</span>';
      var paras = section.paras.map(function (para) { return '<p>' + esc(para) + '</p>'; }).join('');
      var body = section.id === 'limits'
        ? '<div class="caution"><strong>解释的边界</strong>' + paras + '</div>'
        : paras;
      return '<section class="chapter-section" id="ch-' + esc(section.id) + '" data-chapter="' + esc(section.id) + '">' +
        '<div class="chapter-head"><span class="chapter-index">' + (index + 1) + '</span>' +
        '<h2>' + esc(section.title) + '</h2>' + badge(section.sourceType) + '</div>' + body +
        '<div class="chapter-nav">' + prevLink + nextLink + '</div></section>';
    }).join('');

    return '<div class="container-wide"><div class="layout">' +
      '<aside class="side-nav"><div class="side-nav-inner">' + globalNav() + '</div></aside>' +
      '<article class="prose reading-column" data-reading-column>' + breadcrumb(crumbs) +
      '<div class="page-head"><p class="page-kicker">主导航 · 时期 · 已整理完成</p>' +
      '<h1>史前艺术</h1><p class="page-sub">' + esc(PER.range) + ' · ' + esc(PER.subtitle) + '</p></div>' +
      '<div class="source-note"><strong>来源说明 · 原文完整展示</strong>' + esc(PER.sourceNote) + '</div>' +
      '<div class="book-anchor"><p>原著锚点：' + esc(PER.bookAnchor.part) + ' · ' + esc(PER.bookAnchor.chapter) +
      ' · PDF 第 ' + esc(PER.bookAnchor.page) + ' 页。</p>' +
      dotLegend() + '<ul class="book-anchor-list">' + bookSections + '</ul>' +
      '<a href="#/book">查证原著目录（5 部 21 章）→</a></div>' +
      '<div class="lead">' + PER.lead.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<h2 id="chapter-list">十二章目录</h2>' + inlineToc + sections +
      '<section class="section-block"><h2>继续查证</h2>' +
      '<p><a href="#/works">进入作品档案（19 件）</a> · <a href="#/comparisons">阅读跨文明比较（5 组）</a> · ' +
      '<a href="#/sources">查看资料来源（16 条）</a></p></section>' +
      '</article>' +
      '<aside class="page-toc"><div class="page-toc-inner">' + periodToc(anchorId) + '</div></aside>' +
      '</div></div>';
  }

  function works() {
    var regions = ['<button type="button" class="chip" data-work-filter="region" data-value="all" aria-pressed="true">全部地域</button>']
      .concat(Object.keys(IDX.regionNames).map(function (region) {
        return '<button type="button" class="chip" data-work-filter="region" data-value="' + esc(region) + '" aria-pressed="false">' +
          esc(regionName(region)) + '</button>';
      })).join('');
    var eras = ['<button type="button" class="chip" data-work-filter="era" data-value="all" aria-pressed="true">全部时期</button>',
      '<button type="button" class="chip" data-work-filter="era" data-value="paleolithic" aria-pressed="false">旧石器时代</button>',
      '<button type="button" class="chip" data-work-filter="era" data-value="neolithic" aria-pressed="false">新石器时代</button>',
      '<button type="button" class="chip" data-work-filter="era" data-value="later" aria-pressed="false">早期文明阶段</button>'].join('');

    var list = ARC.works.map(function (work, index) {
      var era = work.year <= -10000 ? 'paleolithic' : (work.year <= -1000 ? 'neolithic' : 'later');
      var excerpt = work.background.length > 118 ? work.background.slice(0, 118) + '…' : work.background;
      return '<li data-work-item data-region="' + esc(work.region) + '" data-era="' + era + '">' +
        smallThumb(work) + '<div><div class="work-label-head"><span class="chapter-index">' + (index + 1) + '</span>' +
        '<h2><a href="#/work/' + esc(work.id) + '">' + esc(work.name) + '</a></h2>' +
        '<span class="work-en">' + esc(work.enName) + '</span></div>' +
        '<div class="work-meta"><span>' + esc(work.date) + '</span><span>' + esc(regionName(work.region)) + '</span>' +
        '<span>' + esc(work.place) + '</span><span>' + esc(work.form) + '</span></div>' +
        '<p class="work-excerpt">' + esc(excerpt) + '</p>' +
        '<div class="bookmark-inline">' + bookmarkButton({ id: work.id, type: 'work', title: work.name }) +
        '<a class="link-btn" href="#/work/' + esc(work.id) + '">查看档案 →</a></div></div></li>';
    }).join('');

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['作品与档案', '#/works']]) +
      '<div class="page-head"><p class="page-kicker">作品档案 · 网页补充内容</p><h1>作品档案 · 19 件</h1>' +
      '<p class="page-sub">列表式展签，可按地域与时期筛选。所有条目均为网页补充内容，非原著文本。</p></div>' +
      '<div class="filter-bar"><div class="filter-group"><span>地域</span><div class="chip-row">' + regions + '</div></div>' +
      '<div class="filter-group"><span>时期</span><div class="chip-row">' + eras + '</div></div>' +
      '<span class="filter-count" data-work-count aria-live="polite">显示 19 / 19 件作品</span></div>' +
      '<ul class="work-list">' + list + '</ul></div>';
  }

  function work(id) {
    var work = workById(id);
    if (!work) return notFound();
    var fields = [
      ['名称', esc(work.name) + '<br><span class="work-en">' + esc(work.enName) + '</span>'],
      ['年代', esc(work.date)],
      ['地域地点', esc(regionName(work.region)) + ' · ' + esc(work.place)],
      ['创作者文化', esc(work.creator) + '<br>' + esc(work.culture)],
      ['材质', esc(work.material)],
      ['形制', esc(work.form)],
      ['现藏', esc(work.current)],
      ['来源', (work.sources || []).map(function (sid) {
        var source = sourceById(sid);
        return source ? '<a href="#/sources">' + esc(source.title) + '</a>' : esc(sid);
      }).join('、')]
    ].map(function (field) {
      return '<tr><th scope="row">' + esc(field[0]) + '</th><td>' + field[1] + '</td></tr>';
    }).join('');

    var creators = ARC.creators.filter(function (c) { return c.works.indexOf(id) >= 0; }).map(function (c) {
      return '<li><a href="#/creators?focus=' + esc(c.id) + '">' + esc(c.name) + '</a> · ' + esc(c.era) + '</li>';
    }).join('') || '<li>暂无对应创作者档案</li>';

    var comparisons = ARC.comparisons.filter(function (c) {
      return (c.a && c.a.workId === id) || (c.b && c.b.workId === id);
    }).map(function (c) {
      return '<li><a href="#/comparison/' + esc(c.id) + '">' + esc(c.title) + '</a></li>';
    }).join('') || '<li>暂无对应比较研究</li>';

    var sites = IDX.sites.filter(function (s) { return s.workId === id; }).map(function (s) {
      return '<li><button type="button" class="link-btn" data-site="' + esc(s.id) + '">' + esc(s.name) +
        ' · ' + esc(regionName(s.region)) + ' · ' + esc(s.era) + '（在示意矩阵中查看）</button></li>';
    }).join('') || '<li>暂无对应示意站点</li>';

    var sourceList = (work.sources || []).map(function (sid) {
      var source = sourceById(sid);
      if (!source) return '<li>' + esc(sid) + '</li>';
      return '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.title) +
        '<span class="sr-only">在新窗口打开</span></a><div class="source-org">' + esc(source.org) + ' · ' + esc(source.note) + '</div></li>';
    }).join('');

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['作品档案', '#/works'], [work.name, null]]) +
      '<div class="detail-head"><div><p class="page-kicker">作品档案 · 网页补充内容</p><h1>' + esc(work.name) + '</h1>' +
      '<p class="detail-en">' + esc(work.enName) + '</p><span class="badge badge-web-text">网页补充内容 · 非原著文本</span></div>' +
      bookmarkButton({ id: work.id, type: 'work', title: work.name }) + '</div>' +
      '<table class="field-table"><tbody>' + fields + '</tbody></table>' +
      imageFigure(work) +
      '<section class="detail-section"><h2>背景</h2><p>' + esc(work.background) + '</p></section>' +
      '<section class="detail-section"><h2>分析</h2><p>' + esc(work.analysis) + '</p></section>' +
      '<section class="detail-section"><h2>意义</h2><p>' + esc(work.significance) + '</p></section>' +
      '<section class="detail-section"><h2>资料来源</h2><ul class="source-list">' + sourceList + '</ul></section>' +
      '<section class="detail-section"><h2>相关创作者档案</h2><ul class="relation-list">' + creators + '</ul></section>' +
      '<section class="detail-section"><h2>相关比较研究</h2><ul class="relation-list">' + comparisons + '</ul></section>' +
      '<section class="detail-section"><h2>示意矩阵中的站点</h2><ul class="relation-list">' + sites + '</ul></section>' +
      '<p class="section-note"><a href="#/works">← 返回作品档案列表</a></p></div>';
  }

  function creators() {
    var jumps = ARC.creators.map(function (c) {
      return '<li><a href="#creator-' + esc(c.id) + '">' + esc(c.name) + '</a></li>';
    }).join('');
    var list = ARC.creators.map(function (c) {
      var works = c.works.map(function (wid) {
        var item = workById(wid);
        return item ? '<li><a href="#/work/' + esc(wid) + '">' + esc(item.name) + '</a> · ' + esc(item.date) + '</li>' : '';
      }).join('');
      var source = sourceById(c.source);
      return '<section class="chapter-section" id="creator-' + esc(c.id) + '">' +
        '<div class="chapter-head"><h2>' + esc(c.name) + '</h2>' + badge('web-supplement') + '</div>' +
        '<p class="section-note">' + esc(regionName(c.region)) + ' · ' + esc(c.era) + '</p>' +
        '<p><strong>' + esc(c.summary) + '</strong></p><p>' + esc(c.body) + '</p>' +
        '<h3>关联作品</h3><ul class="relation-list">' + works + '</ul>' +
        '<p class="section-note">' + (source ? '依据：' + esc(source.title) : '') + '</p></section>';
    }).join('');

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['辅助分类', '#/civilizations'], ['创作者档案', '#/creators']]) +
      '<div class="page-head"><p class="page-kicker">辅助分类 · 档案索引</p><h1>创作者与所属文化 · 11 个档案</h1>' +
      '<p class="page-sub">史前艺术没有署名。这里的“创作者”指文化传统、遗址人群或可推断的劳动群体，不虚构姓名。</p></div>' +
      '<h2>档案跳转</h2><ul class="relation-list">' + jumps + '</ul>' + list + '</div>';
  }

  function comparisons() {
    var list = ARC.comparisons.map(function (c, index) {
      var a = workById(c.a.workId);
      var b = workById(c.b.workId);
      return '<li class="chapter-section"><span class="chapter-index">' + (index + 1) + '</span>' +
        '<h2><a href="#/comparison/' + esc(c.id) + '">' + esc(c.title) + '</a></h2>' +
        '<p class="pull-quote">' + esc(c.question) + '</p>' +
        '<p class="section-note">' + esc(a ? a.name : c.a.workId) + ' ／ ' + esc(b ? b.name : c.b.workId) + '</p></li>';
    }).join('');
    return '<div class="container">' + breadcrumb([['首页', '#/'], ['辅助分类', '#/civilizations'], ['比较研究', '#/comparisons']]) +
      '<div class="page-head"><p class="page-kicker">辅助分类 · 跨文明比较</p><h1>比较研究 · 5 组</h1>' +
      '<p class="page-sub">比较不是为了排名，而是把相似问题放进不同的材料、地域与证据条件中。</p></div>' +
      '<ol class="chapter-toc" style="list-style:none">' + list + '</ol></div>';
  }

  function comparison(id) {
    var item = comparisonById(id);
    if (!item) return notFound();
    var a = workById(item.a.workId);
    var b = workById(item.b.workId);
    var column = function (side) {
      var work = side === 'a' ? a : b;
      var data = side === 'a' ? item.a : item.b;
      var points = data.points.map(function (point) { return '<li>' + esc(point) + '</li>'; }).join('');
      return '<div class="compare-col"><span class="compare-letter">' + side.toUpperCase() + '</span>' +
        '<h3>' + esc(data.label) + '</h3>' +
        (work ? '<p><a href="#/work/' + esc(work.id) + '">' + esc(work.name) + ' →</a></p>'
          : '<p class="section-note">该站点尚未关联作品</p>') +
        '<ul>' + points + '</ul></div>';
    };

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['比较研究', '#/comparisons'], [item.title, null]]) +
      '<div class="page-head"><p class="page-kicker">比较研究 · 网页补充内容</p><h1>' + esc(item.title) + '</h1></div>' +
      '<blockquote class="pull-quote">' + esc(item.question) + '</blockquote>' +
      '<div class="comparison-grid">' + column('a') + column('b') + '</div>' +
      '<section class="compare-step"><h2>背景</h2><p>' + esc(item.background) + '</p></section>' +
      '<section class="compare-step"><h2>审美</h2><p>' + esc(item.aesthetics) + '</p></section>' +
      '<section class="compare-step"><h2>差异</h2><p>' + esc(item.difference) + '</p></section>' +
      '<div class="caution"><strong>解释的边界</strong><p>' + esc(item.caution) + '</p></div>' +
      '<p class="section-note"><a href="#/comparisons">← 返回比较研究列表</a></p></div>';
  }

  function book() {
    var parts = BOOK.parts.map(function (part, partIndex) {
      var chapters = part.chapters.map(function (chapter) {
        var linked = chapter.id === 'ch-1';
        var sections = (chapter.sections || []).map(function (section) {
          return '<li class="book-line book-section-line"><span class="line-title">' + esc(section.title) +
            '</span><span class="line-dots"></span><span class="line-page">' + esc(section.page) + '</span></li>';
        }).join('');
        var main = linked
          ? '<a class="book-line" href="#/period/prehistoric"><span class="line-title">' + esc(chapter.title) +
            ' <span class="badge badge-book"></span> 已配套阅读</span><span class="line-dots"></span>' +
            '<span class="line-page">' + esc(chapter.page) + '</span></a>'
          : '<button type="button" class="book-line" data-book-notice="原著目录条目 · 本站暂无对应内容整理 · PDF 第 ' +
            esc(chapter.page) + ' 页"><span class="line-title">' + esc(chapter.title) +
            '</span><span class="line-dots"></span><span class="line-page">' + esc(chapter.page) + '</span></button>';
        return '<li>' + main + (sections ? '<ul class="book-chapter">' + sections + '</ul>' : '') + '</li>';
      }).join('');
      return '<section class="book-part"><h2>' + esc(part.title.replace(/\s+/g, ' ')) +
        '<span class="section-note"> · 起始 PDF 第 ' + esc(part.page) + ' 页 · ' + part.chapters.length + ' 章</span></h2>' +
        '<ol class="book-chapter">' + chapters + '</ol></section>';
    }).join('');

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['原著结构', '#/book']]) +
      '<div class="page-head"><p class="page-kicker">原著结构 · 仅供查证</p><h1>《世界艺术史》目录 · 5 部 21 章</h1>' +
      '<p class="page-sub">' + esc(BOOK.pdfNote) + ' 主编：' + BOOK.authors.map(esc).join('、') + '</p></div>' +
      '<p class="book-notice" id="book-notice" aria-live="polite" hidden></p>' + parts + '</div>';
  }

  function civilizations() {
    var groups = Object.keys(IDX.regionNames).map(function (region) {
      var civs = IDX.civilizations.filter(function (civ) { return civ.region === region; }).map(function (civ) {
        var covered = civ.periods.length ? civ.periods.map(function (id) {
          var period = periodById(id);
          return period && period.status === 'ready'
            ? '<a href="#/period/' + esc(id) + '">' + esc(period.name) + '</a>'
            : '<span class="section-note">' + esc(period ? period.name : id) + '（内容整理中）</span>';
        }).join('、') : '<span class="section-note">暂无覆盖时期</span>';
        return '<section class="chapter-section" id="civ-' + esc(civ.id) + '">' +
          '<div class="chapter-head"><h2>' + esc(civ.name) + '</h2>' + statusTag(civ.status) + '</div>' +
          '<p>' + esc(civ.note) + '</p><p class="section-note">覆盖时期：' + covered + '</p></section>';
      }).join('');
      return civs ? '<section class="section-block"><h2>' + esc(regionName(region)) + '</h2>' + civs + '</section>' : '';
    }).join('');

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['辅助分类', '#/civilizations']]) +
      '<div class="page-head"><p class="page-kicker">辅助分类 · 地域文明</p><h1>文明索引 · 10 项</h1>' +
      '<p class="page-sub">文明索引是辅助分类，不与原著章节结构混用。状态文案表示本站已整理内容的范围，不代表该文明自身的历史评价。</p></div>' +
      groups + '</div>';
  }

  function sources() {
    var list = ARC.sources.map(function (source, index) {
      return '<li><span class="chapter-index">' + (index + 1) + '</span> <a href="' + esc(source.url) +
        '" target="_blank" rel="noopener noreferrer">' + esc(source.title) + '<span class="sr-only">在新窗口打开</span></a>' +
        '<div class="source-org">' + esc(source.org) + '</div><p>' + esc(source.note) + '</p></li>';
    }).join('');
    return '<div class="container">' + breadcrumb([['首页', '#/'], ['资料与查证', '#/sources']]) +
      '<div class="page-head"><p class="page-kicker">资料来源 · 16 条</p><h1>资料来源</h1>' +
      '<p class="page-sub">网页补充内容依据下列公开的大学、博物馆与机构资料撰写。链接在新窗口打开。</p></div>' +
      '<ul class="source-list">' + list + '</ul></div>';
  }

  function atlas() {
    return '<div class="container-wide">' + breadcrumb([['首页', '#/'], ['辅助分类', '#/civilizations'], ['分布与年表', '#/atlas']]) +
      '<div class="page-head"><p class="page-kicker">辅助分类 · 空间与时间</p><h1>文明分布示意矩阵与时间表</h1>' +
      '<p class="page-sub">默认且始终优先显示示意矩阵：不表示国界，站点仅作示意定位。时间轴与站点可双向对照。</p></div>' +
      '<section data-atlas>' + atlasFilters() + matrixMarkup() +
      '<div class="map-enhance-note" data-map-enhance>在线底图增强未启用；示意矩阵为默认视图。</div>' +
      '<section class="section-block"><h2>时间轴 · 16 条节点</h2>' + atlasTimeline() + '</section></section></div>';
  }

  function library() {
    var marks = window.WamStore.getBookmarks();
    var recent = window.WamStore.getRecent();
    var positions = window.WamStore.getPositions();

    function linkFor(item) {
      if (item.type === 'work') return '#/work/' + item.id;
      if (item.type === 'comparison') return '#/comparison/' + item.id;
      if (item.type === 'chapter') return '#/period/' + item.periodId + '?s=' + item.id;
      if (item.type === 'site') return '#/atlas?site=' + item.id;
      if (item.type === 'creator') return '#/creators?focus=' + item.id;
      return '#/';
    }

    var markList = marks.map(function (item) {
      return '<li class="library-item"><a href="' + esc(linkFor(item)) + '">' + esc(item.title) + '</a>' +
        '<span class="item-meta">' + esc(item.type) + ' · 收藏于 ' + esc(stamp(item.addedAt)) + '</span>' +
        '<button type="button" class="link-btn" data-remove-bookmark data-id="' + esc(item.id) + '" data-type="' + esc(item.type) + '">移除</button></li>';
    }).join('') || '<li class="library-empty">还没有收藏。作品、比较与章节阅读页均可收藏。</li>';

    var recentList = recent.map(function (item) {
      return '<li class="library-item"><a href="' + esc(linkFor(item)) + '">' + esc(item.title) + '</a>' +
        '<span class="item-meta">' + esc(item.type) + ' · 阅读于 ' + esc(stamp(item.visitedAt)) + '</span></li>';
    }).join('') || '<li class="library-empty">暂无最近阅读记录。</li>';

    var positionList = positions.map(function (item) {
      var section = PER.sections.find(function (s) { return s.id === item.chapterId; });
      return '<li class="library-item"><a href="#/period/' + esc(item.periodId) + '?s=' + esc(item.chapterId || '') + '">' +
        esc(section ? section.title : '史前艺术') + '</a>' +
        '<span class="item-meta">更新于 ' + esc(stamp(item.updatedAt)) + '</span>' +
        '<button type="button" class="link-btn" data-clear-position="' + esc(item.periodId) + '">清除此条</button></li>';
    }).join('') || '<li class="library-empty">暂无阅读位置记录。</li>';

    return '<div class="container">' + breadcrumb([['首页', '#/'], ['我的阅读', '#/library']]) +
      '<div class="page-head"><p class="page-kicker">本地数据 · 无账号</p><h1>我的阅读</h1></div>' +
      '<section class="section-block"><h2>收藏</h2><ul class="work-list" style="list-style:none;padding:0">' + markList + '</ul></section>' +
      '<section class="section-block"><h2>最近阅读</h2><ul class="work-list" style="list-style:none;padding:0">' + recentList + '</ul>' +
      '<button type="button" class="outline-btn" data-clear-recent>清空最近阅读</button></section>' +
      '<section class="section-block"><h2>阅读位置</h2><ul class="work-list" style="list-style:none;padding:0">' + positionList + '</ul>' +
      '<button type="button" class="outline-btn" data-clear-positions>清除全部阅读位置</button></section>' +
      '<p class="footer-privacy">收藏、最近阅读和阅读位置只保存在你当前这台设备的浏览器里，不会上传，也没有账号。清除浏览器数据会一并删除。</p>' +
      '</div>';
  }

  function siteCard(site) {
    var work = site.workId ? workById(site.workId) : null;
    return '<h2>' + esc(site.name) + '</h2>' +
      '<p class="section-note">' + esc(regionName(site.region)) + ' · ' + esc(site.era) + '</p>' +
      '<p>关联作品：' + (work ? esc(work.name) : '该站点尚未关联作品') + '</p>' +
      '<div class="modal-actions">' +
      (work ? '<a class="solid-btn" href="#/work/' + esc(work.id) + '">查看作品 →</a>' : '') +
      '<button type="button" class="outline-btn" data-close-overlay>返回示意矩阵</button></div>';
  }

  function notFound() {
    return '<div class="container">' + breadcrumb([['首页', '#/'], ['未找到内容', null]]) +
      '<div class="page-head"><p class="page-kicker">路由提示</p><h1>这里还没有内容</h1>' +
      '<p class="page-sub">该条目尚未整理，或地址有误。原著目录中未配套的章节只提供查证信息，不生成内容页。</p></div>' +
      '<p><a class="link-btn" href="#/">返回首页 →</a></p></div>';
  }

  window.Views = {
    esc: esc, NOTICE: NOTICE,
    regionName: regionName, workById: workById, creatorById: creatorById,
    comparisonById: comparisonById, sourceById: sourceById, siteById: siteById, periodById: periodById,
    statusText: statusText, stamp: stamp, breadcrumb: breadcrumb, bookmarkButton: bookmarkButton,
    globalNav: globalNav, periodToc: periodToc, textPlate: textPlate, imageFigure: imageFigure,
    timelineList: timelineList, matrixMarkup: matrixMarkup, atlasTimeline: atlasTimeline,
    home: home, period: period, works: works, work: work, creators: creators,
    comparisons: comparisons, comparison: comparison, book: book,
    civilizations: civilizations, sources: sources, atlas: atlas, library: library,
    siteCard: siteCard, notFound: notFound
  };
})();
