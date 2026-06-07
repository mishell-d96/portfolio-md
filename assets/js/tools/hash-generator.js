// Hash generator — uses vendored CryptoJS, js-md4 and bcrypt.
(function () {
  'use strict';
  var root = document.getElementById('tool-root');
  if (!root) return;

  function createDESKey(str) {
    var bytes = [];
    for (var i = 0; i < 7; i++) bytes.push(str.charCodeAt(i));
    var key = [];
    key.push(bytes[0] >> 1);
    key.push(((bytes[0] & 0x01) << 6) | (bytes[1] >> 2));
    key.push(((bytes[1] & 0x03) << 5) | (bytes[2] >> 3));
    key.push(((bytes[2] & 0x07) << 4) | (bytes[3] >> 4));
    key.push(((bytes[3] & 0x0F) << 3) | (bytes[4] >> 5));
    key.push(((bytes[4] & 0x1F) << 2) | (bytes[5] >> 6));
    key.push(((bytes[5] & 0x3F) << 1) | (bytes[6] >> 7));
    key.push(bytes[6] & 0x7F);
    for (var k = 0; k < key.length; k++) {
      key[k] = (key[k] << 1);
      var parity = 0;
      for (var j = 0; j < 8; j++) if (key[k] & (1 << j)) parity++;
      if (parity % 2 === 0) key[k] |= 1;
    }
    return key.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function desEncrypt(key, plaintext) {
    var enc = CryptoJS.DES.encrypt(CryptoJS.enc.Latin1.parse(plaintext), CryptoJS.enc.Hex.parse(createDESKey(key)),
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    return enc.ciphertext.toString(CryptoJS.enc.Hex);
  }
  function ntlm(input) {
    input = String(input || '');
    var u16 = [];
    for (var i = 0; i < input.length; i++) { var c = input.charCodeAt(i); u16.push(c & 0xFF); u16.push((c >> 8) & 0xFF); }
    var nt = md4(new Uint8Array(u16)).toUpperCase();
    var pw = input.toUpperCase();
    pw = pw.length < 14 ? pw + '\0'.repeat(14 - pw.length) : pw.substring(0, 14);
    var lm = (desEncrypt(pw.substring(0, 7), 'KGS!@#$%') + desEncrypt(pw.substring(7, 14), 'KGS!@#$%')).toUpperCase();
    return lm + ':' + nt;
  }

  var ALGS = {
    'MD5': function (s) { return CryptoJS.MD5(s).toString(); },
    'SHA-1': function (s) { return CryptoJS.SHA1(s).toString(); },
    'SHA-224': function (s) { return CryptoJS.SHA224(s).toString(); },
    'SHA-256': function (s) { return CryptoJS.SHA256(s).toString(); },
    'SHA-384': function (s) { return CryptoJS.SHA384(s).toString(); },
    'SHA-512': function (s) { return CryptoJS.SHA512(s).toString(); },
    'NTLM (LM:NT)': ntlm,
    'bcrypt (cost 10)': function (s) { return dcodeIO.bcrypt.hashSync(s, 10); }
  };

  var opts = Object.keys(ALGS).map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('');
  root.innerHTML =
    '<div class="tool-row">' +
      '<select class="tool-select" id="hg-alg">' + opts + '</select>' +
      '<button type="button" class="tool-btn" id="hg-go">Hash</button>' +
    '</div>' +
    '<div class="tool-field"><label for="hg-in">Input</label><textarea class="tool-input" id="hg-in" spellcheck="false"></textarea></div>' +
    '<div class="tool-field"><label for="hg-out">Hash</label><textarea class="tool-output" id="hg-out" spellcheck="false" readonly></textarea></div>' +
    '<p class="tool-status" id="hg-status"></p>';

  var alg = document.getElementById('hg-alg'), inp = document.getElementById('hg-in'),
      out = document.getElementById('hg-out'), status = document.getElementById('hg-status');

  function go() {
    try {
      if (typeof CryptoJS === 'undefined') throw new Error('crypto library not loaded');
      out.value = ALGS[alg.value](inp.value);
      status.textContent = '';
    } catch (e) { out.value = ''; status.textContent = 'Error: ' + e.message; }
  }
  document.getElementById('hg-go').addEventListener('click', go);
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) go(); });
})();
