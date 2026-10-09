// KEYS HEATMAP ブックマークレット本体（e-amusement GATE上で実行される）
// ブックマークには index.html が生成する短いローダーだけを登録し、このファイルを読み込ませる。
// ローダーはクリック直後に空のタブを開いて window.KHW に渡す（読み込み後に開くとポップアップブロックされるため）
(function () {
  var script = document.currentScript;
  var APP = script ? script.src.replace(/bookmarklet\.js(\?.*)?$/, '') : '';
  var w = window.KHW || null;
  window.KHW = null;

  var ROW = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\s*[,\t]\s*(\d+)/;
  function extract(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (l) {
      var m = l.trim().match(ROW);
      if (m) out.push(m[1] + '/' + m[2] + '/' + m[3] + ',' + m[4]);
    });
    return out;
  }
  function fromDoc(doc) {
    var els = doc.querySelectorAll('textarea, pre');
    for (var i = 0; i < els.length; i++) {
      var r = extract(els[i].value || els[i].textContent);
      if (r.length) return r;
    }
    if (!doc.body) return [];
    var t = doc.body.innerHTML
      .replace(/<\/t[dh]>/gi, ',')
      .replace(/<br\s*\/?>|<\/(tr|p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return extract(t.split('\n').map(function (l) { return l.replace(/,\s*$/, ''); }).join('\n'));
  }
  function done(lines) {
    var url = APP + '#csv=' + encodeURIComponent(lines.join('\n'));
    if (w && !w.closed) w.location.href = url; else location.href = url;
  }
  function fail(msg) {
    if (w) w.close();
    alert('KEYS HEATMAP: ' + msg);
  }

  if (!/(^|\.)eagate\.573\.jp$/.test(location.hostname)) {
    fail('e-amusement GATE（beatmania IIDX）のCSVダウンロード画面で実行してください。');
    return;
  }
  if (w) { try { w.document.write('<p style="font-family:sans-serif;color:#555">KEYS HEATMAP: 打鍵データを取得中…</p>'); } catch (e) {} }

  var cur = fromDoc(document);
  if (cur.length) { done(cur); return; }
  var v = location.pathname.match(/\/game\/2dx\/(\d+)\//);
  if (!v) { fail('beatmania IIDXのCSVダウンロード画面で実行してください。'); return; }
  fetch('/game/2dx/' + v[1] + '/djdata/score_download.html', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'style=tower'
  }).then(function (r) {
    var cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1] || 'utf-8';
    return r.arrayBuffer().then(function (b) {
      try { return new TextDecoder(cs).decode(b); } catch (e) { return new TextDecoder().decode(b); }
    });
  }).then(function (html) {
    var lines = fromDoc(new DOMParser().parseFromString(html, 'text/html'));
    if (!lines.length) { fail('打鍵データを取得できませんでした。ログイン状態を確認し、「IIDXタワーCSVダウンロード」の「表示する」を押してから再度お試しください。'); return; }
    done(lines);
  }).catch(function (e) { fail('通信に失敗しました（' + e.message + '）'); });
})();
