/* Summer Pockets 聖地巡礼マップ — アプリロジック
 * 依存: vendor/leaflet/leaflet.js, assets/js/data.js (window.SP_DATA)
 * ビルド不要・APIキーなし・CDNなし（OSMタイルのみ外部）
 */
(function () {
  'use strict';

  var DATA   = window.SP_DATA;
  var spots  = DATA.spots;

  /* ── 定数 ─────────────────────────────────────── */
  var AREA_COLOR = {
    '出発地': '#6b7785',
    '男木島': '#e8703a',
    '女木島': '#3aa776',
    '直島':   '#2f7fb5',
    '静岡':   '#9b6dd0',
    '茨城':   '#c64b8c',
  };

  var CAT_ICON = {
    '灯台':            '🔆',
    '神社・祠':        '⛩',
    '洞窟・自然':      '🕯',
    '港・交通':        '⛴',
    '展望台':          '🏔',
    '商店・宿':        '🏘',
    '海・浜':          '🏖',
    'アート・モニュメント': '🎨',
    '公共施設':        '🏛',
    '石碑':            '🪨',
    'ランドマーク':    '📍',
    'ダム・水辺':      '💧',
    '建築':            '🏛',
    '公園':            '🌿',
    '観光施設':        '🎫',
  };

  var PREC = {
    high:     { label: '座標: 高精度', cls: '' },
    mid:      { label: '座標: 中精度', cls: '' },
    low:      { label: '座標: 低精度', cls: 'tag--prec-low' },
    estimate: { label: '座標: 推定値', cls: 'tag--prec-estimate' },
  };

  /* ── アプリ状態 ─────────────────────────────────── */
  var state = {
    areas:        new Set(),
    categories:   new Set(),
    onlyWarning:  false,
    onlyAnime:    false,
    onlyPriority: false,
    query:        '',
    selectedId:   null,
  };

  var leafletMap;
  var markers = {};   // id → Leaflet Marker

  // 現在地（geolocation）
  var geoWatchId        = null;  // watchPosition の ID
  var userMarker        = null;  // 現在地マーカー（divIcon）
  var userAccuracyCircle = null; // 精度円（L.circle）
  var firstFix          = true;  // 初回フィックスで地図を寄せるためのフラグ
  var locateBtns        = [];    // ロケートボタン要素の配列（パネル + 地図コントロール）

  // Google Maps 風ロケートアイコン（SVG）
  var _lsvg = ' viewBox="0 0 20 20" width="18" height="18" fill="none" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"';
  var _lcross = '<line x1="10" y1="0.5" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="19.5"/><line x1="0.5" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="19.5" y2="10"/>';
  var LOCATE_SVG_IDLE    = '<svg' + _lsvg + ' stroke="#5f6368"><circle cx="10" cy="10" r="5"/>' + _lcross + '</svg>';
  var LOCATE_SVG_LOADING = '<svg' + _lsvg + ' stroke="#1a73e8" class="locate-icon-spin"><circle cx="10" cy="10" r="5"/>' + _lcross + '</svg>';
  var LOCATE_SVG_ACTIVE  = '<svg' + _lsvg + ' stroke="#1a73e8"><circle cx="10" cy="10" r="5"/><circle cx="10" cy="10" r="2" fill="#1a73e8" stroke="none"/>' + _lcross + '</svg>';

  /* ── ユーティリティ ──────────────────────────────── */

  // HTML 属性・テキストノードへの安全な挿入用エスケープ
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function areaColor(area) { return AREA_COLOR[area] || '#6b7785'; }
  function catIcon(cat)    { return CAT_ICON[cat]    || '📌'; }

  function gmapsLink(s) {
    if (s.gmapsUrl) return s.gmapsUrl;
    if (s.lat != null && s.lng != null) {
      return 'https://www.google.com/maps/search/?api=1&query=' + s.lat + ',' + s.lng;
    }
    return null;
  }

  // タグ span 要素（textContent で安全）
  function mkTag(cls, text) {
    var span = document.createElement('span');
    span.className = 'tag ' + cls;
    span.textContent = text;
    return span;
  }

  // セクション要素（ラベル + テキスト）
  function mkSection(label, text) {
    var sec  = document.createElement('div');
    sec.className = 'detail__section';
    var lbl  = document.createElement('p');
    lbl.className = 'detail__label';
    lbl.textContent = label;
    var body = document.createElement('p');
    body.className = 'detail__text';
    body.textContent = text;
    sec.appendChild(lbl);
    sec.appendChild(body);
    return sec;
  }

  /* ── Leaflet マップ ────────────────────────────── */
  function initMap() {
    leafletMap = L.map('map', { center: [34.41, 134.03], zoom: 11 });

    // OSM 日本（osm.jp）タイル: 日本語ラベルを適切なフォントで描画する。
    // 本家 tile.openstreetmap.org はラスター画像にフォントが焼き込まれ、
    // CJK 統合漢字が中国語字形にフォールバックするため使わない。
    L.tileLayer('https://tile.openstreetmap.jp/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    spots.forEach(function (s) {
      if (s.lat == null || s.lng == null) return;
      var color = areaColor(s.area);
      var icon  = L.divIcon({
        className: '',
        html: '<div class="sp-marker' + (s.priority ? ' sp-marker--priority' : '') +
              '" style="background:' + color + '">' +
              '<span>' + catIcon(s.category) + '</span></div>',
        iconSize:    [28, 28],
        iconAnchor:  [14, 28],
        popupAnchor: [0, -28],
      });

      var marker = L.marker([s.lat, s.lng], { icon: icon })
        .bindPopup(buildPopupHtml(s), { maxWidth: 230 });

      marker.on('popupopen', function () {
        state.selectedId = s.id;
        highlightCard(s.id);
      });

      markers[s.id] = marker;
    });

    addLocateControl();
  }

  /* ── 現在地（geolocation） ───────────────────────── */

  // 地図右上の「現在地」ボタン（Leaflet カスタムコントロール）
  function addLocateControl() {
    var ctrl = L.control({ position: 'topright' });
    ctrl.onAdd = function () {
      var div = L.DomUtil.create('div', 'leaflet-bar locate-control');
      var btn = L.DomUtil.create('a', 'locate-btn', div);
      btn.href = '#';
      btn.title = '現在地を表示';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', '現在地を表示');
      btn.innerHTML = LOCATE_SVG_IDLE;
      // 地図のドラッグ・ズームへの伝播を止める
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.on(btn, 'click', function (e) {
        L.DomEvent.preventDefault(e);
        toggleLocate();
      });
      locateBtns.push(btn);
      return div;
    };
    ctrl.addTo(leafletMap);
  }

  // ボタンの見た目を状態に応じて切替（idle / loading / active）
  function setLocateBtnState(stateName) {
    var icon = stateName === 'loading' ? LOCATE_SVG_LOADING
             : stateName === 'active'  ? LOCATE_SVG_ACTIVE
             : LOCATE_SVG_IDLE;

    locateBtns.forEach(function (btn) {
      btn.classList.remove('is-loading', 'is-active');
      if (stateName === 'loading') btn.classList.add('is-loading');
      else if (stateName === 'active') btn.classList.add('is-active');
    });

    // パネルボタン（SVG + テキスト）
    var panelBtn = document.getElementById('locate-me');
    if (panelBtn) {
      var txt = stateName === 'loading' ? '取得中...' : '現在地';
      panelBtn.innerHTML = icon + ' ' + txt;
    }

    // 地図コントロール（SVG のみ）
    var mapCtrlBtn = document.querySelector('.locate-control .locate-btn');
    if (mapCtrlBtn) mapCtrlBtn.innerHTML = icon;
  }

  function toggleLocate() {
    if (geoWatchId !== null) {
      stopLocate();
    } else {
      startLocate();
    }
  }

  function startLocate() {
    if (!('geolocation' in navigator)) {
      alert('お使いのブラウザは位置情報に対応していません。');
      return;
    }
    // モバイルでリストビューのまま開始した場合、地図タブへ切替
    if (document.body.classList.contains('view-list')) {
      var mapTab = document.querySelector('.mobile-tabs__btn[data-view="map"]');
      if (mapTab && getComputedStyle(mapTab).display !== 'none') {
        mapTab.click();
      }
    }
    setLocateBtnState('loading');
    firstFix = true;
    geoWatchId = navigator.geolocation.watchPosition(
      onGeoSuccess,
      onGeoError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopLocate() {
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
      geoWatchId = null;
    }
    if (userMarker)         { leafletMap.removeLayer(userMarker);         userMarker = null; }
    if (userAccuracyCircle) { leafletMap.removeLayer(userAccuracyCircle); userAccuracyCircle = null; }
    firstFix = true;
    setLocateBtnState('idle');
  }

  function onGeoSuccess(pos) {
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    var acc = pos.coords.accuracy; // メートル

    // 精度円
    if (userAccuracyCircle) {
      userAccuracyCircle.setLatLng([lat, lng]).setRadius(acc);
    } else {
      userAccuracyCircle = L.circle([lat, lng], {
        radius: acc,
        color: '#1a73e8',
        fillColor: '#1a73e8',
        fillOpacity: 0.12,
        weight: 1,
        interactive: false,
      }).addTo(leafletMap);
    }

    // 現在地マーカー
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      var icon = L.divIcon({
        className: '',
        html: '<div class="user-marker"></div>',
        iconSize:   [16, 16],
        iconAnchor: [8, 8],
      });
      userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000, interactive: false })
        .addTo(leafletMap);
    }

    // 初回のみ現在地へ寄せる（以降はマーカーのみ更新）
    if (firstFix) {
      leafletMap.setView([lat, lng], Math.max(leafletMap.getZoom(), 15), { animate: true });
      firstFix = false;
    }

    setLocateBtnState('active');
  }

  function onGeoError(err) {
    var msg;
    if (err.code === err.PERMISSION_DENIED) {
      msg = '位置情報の利用が許可されませんでした。ブラウザの設定をご確認ください。';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = '現在地を取得できませんでした。電波状況をご確認ください。';
    } else if (err.code === err.TIMEOUT) {
      msg = '現在地の取得がタイムアウトしました。';
    } else {
      msg = '現在地の取得に失敗しました。';
    }
    stopLocate();
    alert(msg);
  }

  // ポップアップ HTML（データは自前管理・esc()でエスケープ）
  function buildPopupHtml(s) {
    var badges = '';
    if (s.priority)          badges += '<span class="tag tag--star">★主要</span> ';
    if (s.anime === 'new')   badges += '<span class="tag tag--anime">🆕アニメ新規</span> ';
    if (s.status === 'closed')  badges += '<span class="tag tag--closed">閉店</span> ';
    if (s.status === 'caution') badges += '<span class="tag tag--caution">⚠要確認</span> ';

    var link  = gmapsLink(s);
    var gLink = link
      ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">Google Maps</a>'
      : '';

    return '<div class="popup__name">'  + esc(s.name)     + '</div>' +
           '<div class="popup__game">'  + esc(s.gameName) + '</div>' +
           badges +
           '<div class="popup__links" style="margin-top:8px">' +
             '<a href="#" data-detail="' + esc(s.id) + '">詳細</a> ' + gLink +
           '</div>';
  }

  // ポップアップ内「詳細」リンクのクリック（delegation）
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-detail]');
    if (a) {
      e.preventDefault();
      openDetail(a.getAttribute('data-detail'));
    }
  });

  /* ── フィルタ UI 構築 ─────────────────────────── */
  function buildFilters() {
    var areaOrder = ['出発地', '男木島', '女木島', '直島', '静岡', '茨城'];
    var categories = [];
    spots.forEach(function (s) {
      if (!categories.includes(s.category)) categories.push(s.category);
    });
    categories.sort();

    var areaEl = document.getElementById('area-filters');
    areaOrder.forEach(function (a) {
      if (!spots.some(function (s) { return s.area === a; })) return;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip--area';
      chip.style.setProperty('--chip-color', areaColor(a));

      var dot = document.createElement('span');
      dot.className = 'chip__dot';
      dot.style.background = areaColor(a);
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(a));

      chip.onclick = function () { toggleSetFilter('areas', a, chip); };
      areaEl.appendChild(chip);
    });

    var catEl = document.getElementById('category-filters');
    categories.forEach(function (c) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = catIcon(c) + ' ' + c;
      chip.onclick = function () { toggleSetFilter('categories', c, chip); };
      catEl.appendChild(chip);
    });

    var toggleDefs = [
      { key: 'onlyWarning',  label: '⚠ 注意あり' },
      { key: 'onlyAnime',    label: '🆕 アニメ新規' },
      { key: 'onlyPriority', label: '★ 主要聖地' },
    ];
    var toggleEl = document.getElementById('toggle-filters');
    toggleDefs.forEach(function (def) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = def.label;
      chip.onclick = function () {
        state[def.key] = !state[def.key];
        chip.classList.toggle('is-active', state[def.key]);
        render();
      };
      toggleEl.appendChild(chip);
    });
  }

  function toggleSetFilter(type, value, chipEl) {
    if (state[type].has(value)) {
      state[type].delete(value);
      chipEl.classList.remove('is-active');
    } else {
      state[type].add(value);
      chipEl.classList.add('is-active');
    }
    render();
  }

  document.getElementById('reset-filters').onclick = function () {
    state.areas.clear();
    state.categories.clear();
    state.onlyWarning  = false;
    state.onlyAnime    = false;
    state.onlyPriority = false;
    state.query = '';
    document.getElementById('search').value = '';
    document.querySelectorAll('.chip.is-active').forEach(function (c) {
      c.classList.remove('is-active');
    });
    render();
  };

  document.getElementById('search').addEventListener('input', function (e) {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  /* ── フィルタ判定 ───────────────────────────────── */
  function passesFilter(s) {
    if (state.areas.size > 0 && !state.areas.has(s.area)) return false;
    if (state.categories.size > 0 && !state.categories.has(s.category)) return false;
    if (state.onlyWarning  && s.status !== 'caution' && s.status !== 'closed') return false;
    if (state.onlyAnime    && s.anime !== 'new') return false;
    if (state.onlyPriority && !s.priority) return false;
    if (state.query) {
      var hay = [s.name, s.gameName, s.address, s.area, s.category, s.description]
                  .join(' ').toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  /* ── メインレンダリング ──────────────────────────── */
  function render() {
    var list    = document.getElementById('spot-list');
    var visible = spots.filter(passesFilter);

    document.getElementById('visible-count').textContent =
      visible.length + ' / ' + spots.length + ' 件';

    // マーカー: 全非表示 → 表示対象のみ再追加
    Object.keys(markers).forEach(function (id) {
      if (leafletMap.hasLayer(markers[id])) leafletMap.removeLayer(markers[id]);
    });
    visible.forEach(function (s) {
      if (markers[s.id]) markers[s.id].addTo(leafletMap);
    });

    // カード一覧
    list.innerHTML = '';
    if (visible.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'spot-list__empty';
      empty.textContent = '該当するスポットはありません';
      list.appendChild(empty);
      return;
    }

    visible.forEach(function (s) {
      var li   = document.createElement('li');
      var card = document.createElement('div');
      card.className = 'spot-card';
      if (s.id === state.selectedId) card.classList.add('is-selected');
      card.style.setProperty('--card-color', areaColor(s.area));

      // 名前
      var nameEl = document.createElement('div');
      nameEl.className = 'spot-card__name';
      nameEl.textContent = s.name;
      card.appendChild(nameEl);

      // ゲーム内呼称
      var gameEl = document.createElement('div');
      gameEl.className = 'spot-card__game';
      gameEl.textContent = s.gameName;
      card.appendChild(gameEl);

      // バッジ
      var bdg = document.createElement('div');
      bdg.className = 'spot-card__badges';
      bdg.appendChild(mkTag('tag--area', s.area));
      bdg.appendChild(mkTag('tag--cat',  catIcon(s.category) + ' ' + s.category));
      if (s.priority)           bdg.appendChild(mkTag('tag--star',    '★ 主要聖地'));
      if (s.anime === 'new')    bdg.appendChild(mkTag('tag--anime',   '🆕 アニメ新規'));
      if (s.status === 'closed') bdg.appendChild(mkTag('tag--closed', '閉店'));
      if (s.status === 'caution') bdg.appendChild(mkTag('tag--caution', '⚠ ' + (s.statusNote || '要確認')));
      if (s.precision === 'low')      bdg.appendChild(mkTag('tag--prec-low',      '座標:低精度'));
      if (s.precision === 'estimate') bdg.appendChild(mkTag('tag--prec-estimate', '座標:推定'));
      card.appendChild(bdg);

      card.onclick = function () { selectSpot(s.id, true); };
      li.appendChild(card);
      list.appendChild(li);
    });
  }

  /* ── スポット選択（地図とカードを同期） ──────────── */
  function selectSpot(id, openDetailPanel) {
    state.selectedId = id;
    highlightCard(id);
    var s = spots.find(function (x) { return x.id === id; });
    if (!s) return;
    if (s.lat != null && markers[id]) {
      var zoom = leafletMap.getZoom();
      leafletMap.setView([s.lat, s.lng], zoom < 14 ? 14 : zoom, { animate: true });
      markers[id].openPopup();
    }
    if (openDetailPanel) openDetail(id);
  }

  function highlightCard(id) {
    document.querySelectorAll('.spot-card').forEach(function (c) {
      c.classList.remove('is-selected');
    });
    document.querySelectorAll('.spot-card').forEach(function (c) {
      var nameEl = c.querySelector('.spot-card__name');
      var spot   = spots.find(function (s) { return s.id === id; });
      if (spot && nameEl && nameEl.textContent === spot.name) {
        c.classList.add('is-selected');
        c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  /* ── 詳細パネル ─────────────────────────────────── */
  function openDetail(id) {
    var s = spots.find(function (x) { return x.id === id; });
    if (!s) return;

    var body = document.getElementById('detail-body');
    body.innerHTML = '';

    // ヒーロー
    var hero = document.createElement('div');
    hero.className = 'detail__hero';

    var nameEl = document.createElement('h2');
    nameEl.className = 'detail__name';
    nameEl.textContent = s.name;

    var gameEl = document.createElement('div');
    gameEl.className = 'detail__game';
    gameEl.textContent = 'ゲーム内呼称: ' + s.gameName;

    var bdg = document.createElement('div');
    bdg.className = 'detail__badges';
    bdg.appendChild(mkTag('tag--area', s.area));
    bdg.appendChild(mkTag('tag--cat',  catIcon(s.category) + ' ' + s.category));
    if (s.priority) bdg.appendChild(mkTag('tag--star', '★ 主要聖地'));
    if (s.anime === 'new')       bdg.appendChild(mkTag('tag--anime',   '🆕 アニメ版新規'));
    if (s.anime === 'confirmed') bdg.appendChild(mkTag('tag--anime',   '✅ アニメ登場確認'));
    if (s.status === 'closed')   bdg.appendChild(mkTag('tag--closed',  '閉店 — ' + (s.statusNote || '')));
    if (s.status === 'caution')  bdg.appendChild(mkTag('tag--caution', '⚠ ' + (s.statusNote || '要確認')));

    hero.appendChild(nameEl);
    hero.appendChild(gameEl);
    hero.appendChild(bdg);
    body.appendChild(hero);

    // 説明
    if (s.description) body.appendChild(mkSection('説明', s.description));

    // アクセス
    if (s.access) body.appendChild(mkSection('アクセス', s.access));

    // 注意事項
    if (s.warnings && s.warnings.length > 0) {
      var wSec = document.createElement('div');
      wSec.className = 'detail__section detail__warn';
      var wLbl = document.createElement('p');
      wLbl.className = 'detail__label';
      wLbl.textContent = '注意事項';
      var ul = document.createElement('ul');
      s.warnings.forEach(function (w) {
        var li = document.createElement('li');
        li.textContent = w;
        ul.appendChild(li);
      });
      wSec.appendChild(wLbl);
      wSec.appendChild(ul);
      body.appendChild(wSec);
    }

    // GPS 座標
    if (s.lat != null && s.lng != null) {
      var cSec = document.createElement('div');
      cSec.className = 'detail__section';
      var cLbl = document.createElement('p');
      cLbl.className = 'detail__label';
      cLbl.textContent = 'GPS 座標';
      var cText = document.createElement('p');
      cText.className = 'detail__text detail__coords';
      cText.textContent = s.lat + ', ' + s.lng;
      if (s.precision && PREC[s.precision]) {
        var prec = PREC[s.precision];
        var precTag = document.createElement('span');
        precTag.className = 'tag ' + prec.cls;
        precTag.style.marginLeft = '8px';
        precTag.textContent = prec.label;
        cText.appendChild(precTag);
      }
      cSec.appendChild(cLbl);
      cSec.appendChild(cText);
      body.appendChild(cSec);
    } else {
      body.appendChild(mkSection('GPS 座標', '未特定（地図には表示されません）'));
    }

    // 住所
    if (s.address) body.appendChild(mkSection('住所', s.address));

    // 信頼度
    var rSec = document.createElement('div');
    rSec.className = 'detail__section';
    var rLbl = document.createElement('p');
    rLbl.className = 'detail__label';
    rLbl.textContent = '情報信頼度';
    var rStars = document.createElement('p');
    rStars.className = 'detail__text';
    var filled = document.createElement('span');
    filled.className = 'stars';
    filled.textContent = '★'.repeat(s.reliability);
    var empty = document.createElement('span');
    empty.className = 'stars__off';
    empty.textContent = '☆'.repeat(5 - s.reliability);
    rStars.appendChild(filled);
    rStars.appendChild(empty);
    rSec.appendChild(rLbl);
    rSec.appendChild(rStars);
    body.appendChild(rSec);

    // アクションボタン
    var actions = document.createElement('div');
    actions.className = 'detail__actions';
    var link = gmapsLink(s);
    if (link) {
      var btn = document.createElement('a');
      btn.className = 'btn btn--primary';
      btn.href = link;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.textContent = '🗺️ Google Maps で開く';
      actions.appendChild(btn);
    }
    body.appendChild(actions);

    // パネルを開く
    var detail = document.getElementById('detail');
    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    document.getElementById('overlay').removeAttribute('hidden');
  }

  function closeDetail() {
    var detail = document.getElementById('detail');
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    document.getElementById('overlay').setAttribute('hidden', '');
  }

  document.getElementById('detail-close').onclick = closeDetail;
  document.getElementById('overlay').onclick = closeDetail;

  /* ── ルート モーダル ─────────────────────────────── */
  function openRoutes() {
    var modal = document.getElementById('routes-modal');
    var body  = document.getElementById('routes-body');
    body.innerHTML = '';

    var h2 = document.createElement('h2');
    h2.style.marginTop = '0';
    h2.textContent = '🚶 推奨巡礼ルート';
    body.appendChild(h2);

    DATA.routes.forEach(function (route) {
      var div = document.createElement('div');
      div.className = 'route';

      var title = document.createElement('h3');
      title.className = 'route__title';
      title.textContent = route.name;
      var note = document.createElement('p');
      note.className = 'route__note';
      note.textContent = route.note;
      div.appendChild(title);
      div.appendChild(note);

      route.days.forEach(function (day) {
        var dayDiv = document.createElement('div');
        dayDiv.className = 'route-day';

        var head = document.createElement('div');
        head.className = 'route-day__head';
        head.textContent = day.label + ': ' + day.title;

        var dayNote = document.createElement('div');
        dayNote.className = 'route-day__note';
        dayNote.textContent = day.note;

        var stopsDiv = document.createElement('div');
        stopsDiv.className = 'route-day__stops';

        day.stops.forEach(function (sid) {
          var spot = spots.find(function (x) { return x.id === sid; });
          if (!spot) return;
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'route-stop';
          btn.textContent = spot.name;
          btn.onclick = (function (spotId) {
            return function () {
              closeRoutes();
              selectSpot(spotId, true);
            };
          })(sid);
          stopsDiv.appendChild(btn);
        });

        dayDiv.appendChild(head);
        dayDiv.appendChild(dayNote);
        dayDiv.appendChild(stopsDiv);
        div.appendChild(dayDiv);
      });

      body.appendChild(div);
    });

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeRoutes() {
    var modal = document.getElementById('routes-modal');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('show-routes').onclick = openRoutes;
  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.onclick = closeRoutes;
  });

  /* ── モバイルタブ ──────────────────────────────── */
  document.querySelectorAll('.mobile-tabs__btn').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.mobile-tabs__btn').forEach(function (b) {
        b.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      var view = btn.getAttribute('data-view');
      document.body.classList.remove('view-map', 'view-list');
      document.body.classList.add('view-' + view);
      if (view === 'map') leafletMap.invalidateSize();
    };
  });

  /* ── キーボード: Escape でパネル・モーダルを閉じる ── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('detail').classList.contains('is-open')) {
      closeDetail();
    } else if (document.getElementById('routes-modal').classList.contains('is-open')) {
      closeRoutes();
    }
  });

  /* ── 初期化 ─────────────────────────────────────── */
  function init() {
    document.getElementById('subtitle').textContent = DATA.meta.subtitle;
    document.body.classList.add('view-list');

    initMap();
    buildFilters();
    render();

    // パネル内「現在地」ボタンの初期化
    var panelLocateBtn = document.getElementById('locate-me');
    if (panelLocateBtn) {
      locateBtns.push(panelLocateBtn);
      panelLocateBtn.innerHTML = LOCATE_SVG_IDLE + ' 現在地';
      panelLocateBtn.addEventListener('click', toggleLocate);
    }
  }

  init();
})();
