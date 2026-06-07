// Encoder / Decoder — pure vanilla, no external libs.
(function () {
  'use strict';
  var root = document.getElementById('tool-root');
  if (!root) return;

  var OPS = {
    'base64': {
      label: 'Base64',
      enc: function (s) { return btoa(unescape(encodeURIComponent(s))); },
      dec: function (s) { return decodeURIComponent(escape(atob(s))); }
    },
    'base64-utf16le': {
      label: 'Base64 (UTF-16LE)',
      enc: function (s) {
        var b = new ArrayBuffer(s.length * 2), v = new DataView(b);
        for (var i = 0; i < s.length; i++) v.setUint16(i * 2, s.charCodeAt(i), true);
        return btoa(String.fromCharCode.apply(null, new Uint8Array(b)));
      },
      dec: function (s) {
        var bin = atob(s), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var v = new DataView(bytes.buffer), out = '';
        for (var j = 0; j < bytes.length; j += 2) out += String.fromCharCode(v.getUint16(j, true));
        return out;
      }
    },
    'url': {
      label: 'URL', enc: function (s) { return encodeURIComponent(s); }, dec: function (s) { return decodeURIComponent(s); }
    },
    'url-all': {
      label: 'URL (encode all bytes)',
      enc: function (s) {
        return Array.from(new TextEncoder().encode(s)).map(function (b) { return '%' + b.toString(16).toUpperCase().padStart(2, '0'); }).join('');
      },
      dec: function (s) { return decodeURIComponent(s); }
    },
    'html': {
      label: 'HTML entities',
      enc: function (s) { return s.replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); },
      dec: function (s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
    },
    'decimal': {
      label: 'Decimal entities (&#nn;)',
      enc: function (s) { return s.split('').map(function (c) { return '&#' + c.charCodeAt(0) + ';'; }).join(''); },
      dec: function (s) { return (s.match(/&#\d+;/g) || []).map(function (e) { return String.fromCharCode(parseInt(e.slice(2, -1), 10)); }).join(''); }
    },
    'hex-entity': {
      label: 'Hex entities (&#xNN;)',
      enc: function (s) { return s.split('').map(function (c) { return '&#x' + c.charCodeAt(0).toString(16) + ';'; }).join(''); },
      dec: function (s) { return (s.match(/&#x[\da-fA-F]+;/g) || []).map(function (e) { return String.fromCharCode(parseInt(e.slice(3, -1), 16)); }).join(''); }
    },
    'unicode': {
      label: 'Unicode (\\uXXXX)',
      enc: function (s) { return s.split('').map(function (c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); }).join(''); },
      dec: function (s) { return s.replace(/\\u[\dA-F]{4}/gi, function (m) { return String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16)); }); }
    },
    'hex-js': {
      label: 'JS Hex (\\xNN)',
      enc: function (s) { return '\\x' + s.split('').map(function (c) { return ('0' + c.charCodeAt(0).toString(16)).slice(-2); }).join('\\x'); },
      dec: function (s) { return s.split('\\x').slice(1).map(function (h) { return String.fromCharCode(parseInt(h, 16)); }).join(''); }
    }
  };

  var opts = Object.keys(OPS).map(function (k) { return '<option value="' + k + '">' + OPS[k].label + '</option>'; }).join('');
  root.innerHTML =
    '<div class="tool-row">' +
      '<select class="tool-select" id="ed-op">' + opts + '</select>' +
      '<button type="button" class="tool-btn" id="ed-encode">Encode ↓</button>' +
      '<button type="button" class="tool-btn secondary" id="ed-decode">Decode ↑</button>' +
      '<button type="button" class="tool-btn secondary" id="ed-swap">⇅ Swap</button>' +
    '</div>' +
    '<div class="tool-field"><label for="ed-in">Input</label><textarea class="tool-input" id="ed-in" spellcheck="false"></textarea></div>' +
    '<div class="tool-field"><label for="ed-out">Output</label><textarea class="tool-output" id="ed-out" spellcheck="false" readonly></textarea></div>' +
    '<p class="tool-status" id="ed-status"></p>';

  var op = document.getElementById('ed-op'), inp = document.getElementById('ed-in'),
      out = document.getElementById('ed-out'), status = document.getElementById('ed-status');

  function go(dir) {
    var fn = OPS[op.value][dir];
    try { out.value = fn(inp.value); status.textContent = ''; }
    catch (e) { out.value = ''; status.textContent = 'Error: ' + e.message; }
  }
  document.getElementById('ed-encode').addEventListener('click', function () { go('enc'); });
  document.getElementById('ed-decode').addEventListener('click', function () { go('dec'); });
  document.getElementById('ed-swap').addEventListener('click', function () { inp.value = out.value; out.value = ''; });
})();
