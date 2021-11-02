
var f;
f || (f = typeof Module !== 'undefined' ? Module : {});
var k = {}, l;
for (l in f) {
  f.hasOwnProperty(l) && (k[l] = f[l]);
}
var aa = [], ba = "./this.program";
function t(a, b) {
  throw b;
}
var ca = "object" === typeof window, u = "function" === typeof importScripts, v = "", da, w, ea, x, y;
if ("object" === typeof process && "object" === typeof process.versions && "string" === typeof process.versions.node) {
  v = u ? require("path").dirname(v) + "/" : __dirname + "/", da = function(a, b) {
    x || (x = require("fs"));
    y || (y = require("path"));
    a = y.normalize(a);
    return x.readFileSync(a, b ? null : "utf8");
  }, ea = function(a) {
    a = da(a, !0);
    a.buffer || (a = new Uint8Array(a));
    a.buffer || z("Assertion failed: undefined");
    return a;
  }, w = function(a, b, c) {
    x || (x = require("fs"));
    y || (y = require("path"));
    a = y.normalize(a);
    x.readFile(a, function(d, e) {
      d ? c(d) : b(e.buffer);
    });
  }, 1 < process.argv.length && (ba = process.argv[1].replace(/\\/g, "/")), aa = process.argv.slice(2), "undefined" !== typeof module && (module.exports = f), process.on("uncaughtException", function(a) {
    if (!(a instanceof fa)) {
      throw a;
    }
  }), process.on("unhandledRejection", function(a) {
    throw a;
  }), t = function(a, b) {
    if (noExitRuntime || 0 < ha) {
      throw process.exitCode = a, b;
    }
    b instanceof fa || A("exiting due to exception: " + b);
    process.exit(a);
  }, f.inspect = function() {
    return "[Emscripten Module object]";
  };
} else {
  if (ca || u) {
    u ? v = self.location.href : "undefined" !== typeof document && document.currentScript && (v = document.currentScript.src), v = 0 !== v.indexOf("blob:") ? v.substr(0, v.replace(/[?#].*/, "").lastIndexOf("/") + 1) : "", da = function(a) {
      var b = new XMLHttpRequest();
      b.open("GET", a, !1);
      b.send(null);
      return b.responseText;
    }, u && (ea = function(a) {
      var b = new XMLHttpRequest();
      b.open("GET", a, !1);
      b.responseType = "arraybuffer";
      b.send(null);
      return new Uint8Array(b.response);
    }), w = function(a, b, c) {
      var d = new XMLHttpRequest();
      d.open("GET", a, !0);
      d.responseType = "arraybuffer";
      d.onload = function() {
        200 == d.status || 0 == d.status && d.response ? b(d.response) : c();
      };
      d.onerror = c;
      d.send(null);
    };
  }
}
var ia = f.print || console.log.bind(console), A = f.printErr || console.warn.bind(console);
for (l in k) {
  k.hasOwnProperty(l) && (f[l] = k[l]);
}
k = null;
f.arguments && (aa = f.arguments);
f.thisProgram && (ba = f.thisProgram);
f.quit && (t = f.quit);
var B;
f.wasmBinary && (B = f.wasmBinary);
var noExitRuntime = f.noExitRuntime || !0;
"object" !== typeof WebAssembly && z("no native wasm support detected");
var ja, ka = !1;
function la(a) {
  var b = f["_" + a];
  b || z("Assertion failed: Cannot call unknown function " + (a + ", make sure it is exported"));
  return b;
}
function ma(a, b, c, d) {
  var e = {string:function(p) {
    var r = 0;
    if (null !== p && void 0 !== p && 0 !== p) {
      var q = (p.length << 2) + 1;
      r = C(q);
      D(p, E, r, q);
    }
    return r;
  }, array:function(p) {
    var r = C(p.length);
    F.set(p, r);
    return r;
  }};
  a = la(a);
  var h = [], g = 0;
  if (d) {
    for (var m = 0; m < d.length; m++) {
      var n = e[c[m]];
      n ? (0 === g && (g = na()), h[m] = n(d[m])) : h[m] = d[m];
    }
  }
  c = a.apply(null, h);
  return c = function(p) {
    0 !== g && oa(g);
    return "string" === b ? G(p) : "boolean" === b ? !!p : p;
  }(c);
}
var pa = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;
function qa(a, b, c) {
  var d = b + c;
  for (c = b; a[c] && !(c >= d);) {
    ++c;
  }
  if (16 < c - b && a.subarray && pa) {
    return pa.decode(a.subarray(b, c));
  }
  for (d = ""; b < c;) {
    var e = a[b++];
    if (e & 128) {
      var h = a[b++] & 63;
      if (192 == (e & 224)) {
        d += String.fromCharCode((e & 31) << 6 | h);
      } else {
        var g = a[b++] & 63;
        e = 224 == (e & 240) ? (e & 15) << 12 | h << 6 | g : (e & 7) << 18 | h << 12 | g << 6 | a[b++] & 63;
        65536 > e ? d += String.fromCharCode(e) : (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023));
      }
    } else {
      d += String.fromCharCode(e);
    }
  }
  return d;
}
function G(a, b) {
  return a ? qa(E, a, b) : "";
}
function D(a, b, c, d) {
  if (!(0 < d)) {
    return 0;
  }
  var e = c;
  d = c + d - 1;
  for (var h = 0; h < a.length; ++h) {
    var g = a.charCodeAt(h);
    if (55296 <= g && 57343 >= g) {
      var m = a.charCodeAt(++h);
      g = 65536 + ((g & 1023) << 10) | m & 1023;
    }
    if (127 >= g) {
      if (c >= d) {
        break;
      }
      b[c++] = g;
    } else {
      if (2047 >= g) {
        if (c + 1 >= d) {
          break;
        }
        b[c++] = 192 | g >> 6;
      } else {
        if (65535 >= g) {
          if (c + 2 >= d) {
            break;
          }
          b[c++] = 224 | g >> 12;
        } else {
          if (c + 3 >= d) {
            break;
          }
          b[c++] = 240 | g >> 18;
          b[c++] = 128 | g >> 12 & 63;
        }
        b[c++] = 128 | g >> 6 & 63;
      }
      b[c++] = 128 | g & 63;
    }
  }
  b[c] = 0;
  return c - e;
}
function ra(a) {
  for (var b = 0, c = 0; c < a.length; ++c) {
    var d = a.charCodeAt(c);
    55296 <= d && 57343 >= d && (d = 65536 + ((d & 1023) << 10) | a.charCodeAt(++c) & 1023);
    127 >= d ? ++b : b = 2047 >= d ? b + 2 : 65535 >= d ? b + 3 : b + 4;
  }
  return b;
}
"undefined" !== typeof TextDecoder && new TextDecoder("utf-16le");
function sa(a) {
  var b = ra(a) + 1, c = C(b);
  D(a, F, c, b);
  return c;
}
var F, E, ta, ua, H, va, I, J, wa, xa = [], ya = [], za = [], Aa = [], Ba = [], ha = 0;
function Ca() {
  var a = f.preRun.shift();
  xa.unshift(a);
}
var K = 0, Da = null, L = null;
f.preloadedImages = {};
f.preloadedAudios = {};
function z(a) {
  if (f.onAbort) {
    f.onAbort(a);
  }
  a = "Aborted(" + a + ")";
  A(a);
  ka = !0;
  throw new WebAssembly.RuntimeError(a + ". Build with -s ASSERTIONS=1 for more info.");
}
function Ea() {
  return M.startsWith("data:application/octet-stream;base64,");
}
var M;
M = "nl.wasm";
if (!Ea()) {
  var Fa = M;
  M = f.locateFile ? f.locateFile(Fa, v) : v + Fa;
}
function Ga() {
  var a = M;
  try {
    if (a == M && B) {
      return new Uint8Array(B);
    }
    if (ea) {
      return ea(a);
    }
    throw "both async and sync fetching of the wasm failed";
  } catch (b) {
    z(b);
  }
}
function Ha() {
  if (!B && (ca || u)) {
    if ("function" === typeof fetch && !M.startsWith("file://")) {
      return fetch(M, {credentials:"same-origin"}).then(function(a) {
        if (!a.ok) {
          throw "failed to load wasm binary file at '" + M + "'";
        }
        return a.arrayBuffer();
      }).catch(function() {
        return Ga();
      });
    }
    if (w) {
      return new Promise(function(a, b) {
        w(M, function(c) {
          a(new Uint8Array(c));
        }, b);
      });
    }
  }
  return Promise.resolve().then(function() {
    return Ga();
  });
}
function Ia() {
  var a = document.getElementById("picker"), b = a.files[0];
  a.value = null;
  console.log("--- load file:");
  console.log("  name: " + b.name);
  console.log("  type: " + b.type);
  console.log("  size: " + b.size);
  256000 > b.size ? (a = new FileReader(), a.onload = function(c) {
    console.log("file loaded!");
    (c = c.target.result) ? (console.log("content length: " + c.byteLength), c = new Uint8Array(c), 0 == ma("util_emsc_loadfile", "int", ["string", "array", "number"], [b.name, c, c.length]) && console.warn("util_emsc_loadfile() failed!")) : console.warn("load result empty!");
  }, a.readAsArrayBuffer(b)) : console.warn("ignoring file because it is too big");
}
function Ja(a) {
  for (; 0 < a.length;) {
    var b = a.shift();
    if ("function" == typeof b) {
      b(f);
    } else {
      var c = b.ma;
      "number" === typeof c ? void 0 === b.C ? N(c)() : N(c)(b.C) : c(void 0 === b.C ? null : b.C);
    }
  }
}
var Ka = [];
function N(a) {
  var b = Ka[a];
  b || (a >= Ka.length && (Ka.length = a + 1), Ka[a] = b = wa.get(a));
  return b;
}
function La(a) {
  this.l = a - 16;
  this.ga = function(b) {
    H[this.l + 4 >> 2] = b;
  };
  this.da = function(b) {
    H[this.l + 8 >> 2] = b;
  };
  this.ea = function() {
    H[this.l >> 2] = 0;
  };
  this.ba = function() {
    F[this.l + 12 >> 0] = 0;
  };
  this.fa = function() {
    F[this.l + 13 >> 0] = 0;
  };
  this.Z = function(b, c) {
    this.ga(b);
    this.da(c);
    this.ea();
    this.ba();
    this.fa();
  };
}
var Ma = 0, Na = [null, [], []], Oa = {};
function Pa() {
  void 0 === Pa.start && (Pa.start = Date.now());
  return 1E3 * (Date.now() - Pa.start) | 0;
}
var Qa = 0;
function Ra() {
  for (var a = P.length - 1; 0 <= a; --a) {
    Sa(a);
  }
  P = [];
  Ta = [];
}
var Ta = [];
function Ua() {
  if (Qa && Va.s) {
    for (var a = 0; a < Ta.length; ++a) {
      var b = Ta[a];
      Ta.splice(a, 1);
      --a;
      b.ua.apply(null, b.ia);
    }
  }
}
var P = [];
function Sa(a) {
  var b = P[a];
  b.target.removeEventListener(b.g, b.X, b.h);
  P.splice(a, 1);
}
function Q(a) {
  function b(d) {
    ++Qa;
    Va = a;
    Ua();
    a.j(d);
    Ua();
    --Qa;
  }
  if (a.i) {
    a.X = b, a.target.addEventListener(a.g, b, a.h), P.push(a), Wa || (Aa.push(Ra), Wa = !0);
  } else {
    for (var c = 0; c < P.length; ++c) {
      P[c].target == a.target && P[c].g == a.g && Sa(c--);
    }
  }
}
function Xa(a) {
  return a ? a == window ? "#window" : a == screen ? "#screen" : a && a.nodeName ? a.nodeName : "" : "";
}
var Wa, Va, Ya, Za, $a, ab, bb, cb, db, eb = [0, "undefined" !== typeof document ? document : 0, "undefined" !== typeof window ? window : 0];
function R(a) {
  a = 2 < a ? G(a) : a;
  return eb[a] || ("undefined" !== typeof document ? document.querySelector(a) : void 0);
}
function fb(a) {
  return 0 > eb.indexOf(a) ? a.getBoundingClientRect() : {left:0, top:0};
}
function gb(a, b, c, d, e, h) {
  Ya || (Ya = S(256));
  a = {target:R(a), g:h, i:d, j:function(g) {
    g = g || event;
    var m = g.target.id ? g.target.id : "", n = Ya;
    D(Xa(g.target), E, n + 0, 128);
    D(m, E, n + 128, 128);
    N(d)(e, n, b) && g.preventDefault();
  }, h:c};
  Q(a);
}
function hb(a, b, c, d, e, h) {
  Za || (Za = S(176));
  a = {target:R(a), s:!0, g:h, i:d, j:function(g) {
    var m = Za;
    J[m >> 3] = g.timeStamp;
    var n = m >> 2;
    H[n + 2] = g.location;
    H[n + 3] = g.ctrlKey;
    H[n + 4] = g.shiftKey;
    H[n + 5] = g.altKey;
    H[n + 6] = g.metaKey;
    H[n + 7] = g.repeat;
    H[n + 8] = g.charCode;
    H[n + 9] = g.keyCode;
    H[n + 10] = g.which;
    D(g.key || "", E, m + 44, 32);
    D(g.code || "", E, m + 76, 32);
    D(g.char || "", E, m + 108, 32);
    D(g.locale || "", E, m + 140, 32);
    N(d)(e, m, b) && g.preventDefault();
  }, h:c};
  Q(a);
}
function ib(a, b, c) {
  J[a >> 3] = b.timeStamp;
  a >>= 2;
  H[a + 2] = b.screenX;
  H[a + 3] = b.screenY;
  H[a + 4] = b.clientX;
  H[a + 5] = b.clientY;
  H[a + 6] = b.ctrlKey;
  H[a + 7] = b.shiftKey;
  H[a + 8] = b.altKey;
  H[a + 9] = b.metaKey;
  ta[2 * a + 20] = b.button;
  ta[2 * a + 21] = b.buttons;
  H[a + 11] = b.movementX;
  H[a + 12] = b.movementY;
  c = fb(c);
  H[a + 13] = b.clientX - c.left;
  H[a + 14] = b.clientY - c.top;
}
function T(a, b, c, d, e, h) {
  $a || ($a = S(72));
  a = R(a);
  Q({target:a, s:"mousemove" != h && "mouseenter" != h && "mouseleave" != h, g:h, i:d, j:function(g) {
    g = g || event;
    ib($a, g, a);
    N(d)(e, $a, b) && g.preventDefault();
  }, h:c});
}
function jb(a, b, c, d, e) {
  ab || (ab = S(260));
  Q({target:a, g:e, i:d, j:function(h) {
    h = h || event;
    var g = ab, m = document.pointerLockElement || document.H || document.K || document.J;
    H[g >> 2] = !!m;
    var n = m && m.id ? m.id : "";
    D(Xa(m), E, g + 4, 128);
    D(n, E, g + 132, 128);
    N(d)(20, g, b) && h.preventDefault();
  }, h:c});
}
function kb(a, b, c, d, e) {
  Q({target:a, g:e, i:d, j:function(h) {
    h = h || event;
    N(d)(38, 0, b) && h.preventDefault();
  }, h:c});
}
function lb(a, b, c, d) {
  bb || (bb = S(36));
  a = R(a);
  Q({target:a, g:"resize", i:d, j:function(e) {
    e = e || event;
    if (e.target == a) {
      var h = document.body;
      if (h) {
        var g = bb;
        H[g >> 2] = e.detail;
        H[g + 4 >> 2] = h.clientWidth;
        H[g + 8 >> 2] = h.clientHeight;
        H[g + 12 >> 2] = innerWidth;
        H[g + 16 >> 2] = innerHeight;
        H[g + 20 >> 2] = outerWidth;
        H[g + 24 >> 2] = outerHeight;
        H[g + 28 >> 2] = pageXOffset;
        H[g + 32 >> 2] = pageYOffset;
        N(d)(10, g, b) && e.preventDefault();
      }
    }
  }, h:c});
}
function mb(a, b, c, d, e, h) {
  cb || (cb = S(1696));
  a = R(a);
  Q({target:a, s:"touchstart" == h || "touchend" == h, g:h, i:d, j:function(g) {
    for (var m, n = {}, p = g.touches, r = 0; r < p.length; ++r) {
      m = p[r], m.L = m.M = 0, n[m.identifier] = m;
    }
    for (r = 0; r < g.changedTouches.length; ++r) {
      m = g.changedTouches[r], m.L = 1, n[m.identifier] = m;
    }
    for (r = 0; r < g.targetTouches.length; ++r) {
      n[g.targetTouches[r].identifier].M = 1;
    }
    p = cb;
    J[p >> 3] = g.timeStamp;
    var q = p >> 2;
    H[q + 3] = g.ctrlKey;
    H[q + 4] = g.shiftKey;
    H[q + 5] = g.altKey;
    H[q + 6] = g.metaKey;
    q += 7;
    var O = fb(a), qb = 0;
    for (r in n) {
      if (m = n[r], H[q] = m.identifier, H[q + 1] = m.screenX, H[q + 2] = m.screenY, H[q + 3] = m.clientX, H[q + 4] = m.clientY, H[q + 5] = m.pageX, H[q + 6] = m.pageY, H[q + 7] = m.L, H[q + 8] = m.M, H[q + 9] = m.clientX - O.left, H[q + 10] = m.clientY - O.top, q += 13, 31 < ++qb) {
        break;
      }
    }
    H[p + 8 >> 2] = qb;
    N(d)(e, p, b) && g.preventDefault();
  }, h:c});
}
function nb(a, b, c, d, e, h) {
  a = {target:R(a), g:h, i:d, j:function(g) {
    g = g || event;
    N(d)(e, 0, b) && g.preventDefault();
  }, h:c};
  Q(a);
}
function ob(a, b, c, d) {
  db || (db = S(104));
  Q({target:a, s:!0, g:"wheel", i:d, j:function(e) {
    e = e || event;
    var h = db;
    ib(h, e, a);
    J[h + 72 >> 3] = e.deltaX;
    J[h + 80 >> 3] = e.deltaY;
    J[h + 88 >> 3] = e.deltaZ;
    H[h + 96 >> 2] = e.deltaMode;
    N(d)(9, h, b) && e.preventDefault();
  }, h:c});
}
function pb(a) {
  var b = a.getExtension("ANGLE_instanced_arrays");
  b && (a.vertexAttribDivisor = function(c, d) {
    b.vertexAttribDivisorANGLE(c, d);
  }, a.drawArraysInstanced = function(c, d, e, h) {
    b.drawArraysInstancedANGLE(c, d, e, h);
  }, a.drawElementsInstanced = function(c, d, e, h, g) {
    b.drawElementsInstancedANGLE(c, d, e, h, g);
  });
}
function rb(a) {
  var b = a.getExtension("OES_vertex_array_object");
  b && (a.createVertexArray = function() {
    return b.createVertexArrayOES();
  }, a.deleteVertexArray = function(c) {
    b.deleteVertexArrayOES(c);
  }, a.bindVertexArray = function(c) {
    b.bindVertexArrayOES(c);
  }, a.isVertexArray = function(c) {
    return b.isVertexArrayOES(c);
  });
}
function sb(a) {
  var b = a.getExtension("WEBGL_draw_buffers");
  b && (a.drawBuffers = function(c, d) {
    b.drawBuffersWEBGL(c, d);
  });
}
function tb(a) {
  a.qa = a.getExtension("WEBGL_multi_draw");
}
var ub = 1, vb = [], U = [], wb = [], xb = [], yb = [], V = [], zb = [], Ab = {};
function W(a) {
  Bb || (Bb = a);
}
function Cb(a) {
  for (var b = ub++, c = a.length; c < b; c++) {
    a[c] = null;
  }
  return b;
}
function Db(a, b) {
  a.I || (a.I = a.getContext, a.getContext = function(d, e) {
    e = a.I(d, e);
    return "webgl" == d == e instanceof WebGLRenderingContext ? e : null;
  });
  var c = a.getContext("webgl", b);
  return c ? Eb(c, b) : 0;
}
function Eb(a, b) {
  var c = Cb(zb), d = {oa:c, attributes:b, version:b.aa, B:a};
  a.canvas && (a.canvas.ha = d);
  zb[c] = d;
  ("undefined" === typeof b.G || b.G) && Fb(d);
  return c;
}
function Fb(a) {
  a || (a = Gb);
  if (!a.$) {
    a.$ = !0;
    var b = a.B;
    pb(b);
    rb(b);
    sb(b);
    b.ka = b.getExtension("EXT_disjoint_timer_query");
    tb(b);
    (b.getSupportedExtensions() || []).forEach(function(c) {
      c.includes("lose_context") || c.includes("debug") || b.getExtension(c);
    });
  }
}
var Bb, Gb, Hb = ["default", "low-power", "high-performance"];
function Ib(a, b, c, d) {
  for (var e = 0; e < a; e++) {
    var h = X[c](), g = h && Cb(d);
    h ? (h.name = g, d[g] = h) : W(1282);
    H[b + 4 * e >> 2] = g;
  }
}
function Jb(a, b) {
  if (b) {
    var c = void 0;
    switch(a) {
      case 36346:
        c = 1;
        break;
      case 36344:
        return;
      case 36345:
        c = 0;
        break;
      case 34466:
        var d = X.getParameter(34467);
        c = d ? d.length : 0;
    }
    if (void 0 === c) {
      switch(d = X.getParameter(a), typeof d) {
        case "number":
          c = d;
          break;
        case "boolean":
          c = d ? 1 : 0;
          break;
        case "string":
          W(1280);
          return;
        case "object":
          if (null === d) {
            switch(a) {
              case 34964:
              case 35725:
              case 34965:
              case 36006:
              case 36007:
              case 32873:
              case 34229:
              case 34068:
                c = 0;
                break;
              default:
                W(1280);
                return;
            }
          } else {
            if (d instanceof Float32Array || d instanceof Uint32Array || d instanceof Int32Array || d instanceof Array) {
              for (a = 0; a < d.length; ++a) {
                H[b + 4 * a >> 2] = d[a];
              }
              return;
            }
            try {
              c = d.name | 0;
            } catch (e) {
              W(1280);
              A("GL_INVALID_ENUM in glGet0v: Unknown object returned from WebGL getParameter(" + a + ")! (error: " + e + ")");
              return;
            }
          }
          break;
        default:
          W(1280);
          A("GL_INVALID_ENUM in glGet0v: Native code calling glGet0v(" + a + ") and it returns " + d + " of type " + typeof d + "!");
          return;
      }
    }
    H[b >> 2] = c;
  } else {
    W(1281);
  }
}
function Kb(a) {
  var b = ra(a) + 1, c = S(b);
  D(a, E, c, b);
  return c;
}
function Lb(a) {
  return "]" == a.slice(-1) && a.lastIndexOf("[");
}
function Y(a) {
  var b = X.W;
  if (b) {
    var c = b.o[a];
    "number" === typeof c && (b.o[a] = c = X.getUniformLocation(b, b.U[a] + (0 < c ? "[" + c + "]" : "")));
    return c;
  }
  W(1282);
}
for (var Z = [], X, Mb = new Float32Array(288), Nb = 0; 288 > Nb; ++Nb) {
  Z[Nb] = Mb.subarray(0, Nb + 1);
}
var Tb = {__assert_fail:function(a, b, c, d) {
  z("Assertion failed: " + G(a) + ", at: " + [b ? G(b) : "unknown filename", c, d ? G(d) : "unknown function"]);
}, __cxa_allocate_exception:function(a) {
  return S(a + 16) + 16;
}, __cxa_atexit:function() {
}, __cxa_throw:function(a, b, c) {
  (new La(a)).Z(b, c);
  Ma++;
  throw a;
}, __syscall_fcntl64:function() {
  return 0;
}, __syscall_ioctl:function() {
  return 0;
}, __syscall_open:function() {
}, abort:function() {
  z("");
}, clock:Pa, emsc_js_cursor_to_default:function() {
  document.getElementById("canvas").style.cursor = "default";
}, emsc_js_cursor_to_pointer:function() {
  document.getElementById("canvas").style.cursor = "pointer";
}, emsc_js_download_binary:function(a, b, c) {
  a = G(a);
  for (var d = "", e = 0; e < c; e++) {
    d += String.fromCharCode(E[b + e]);
  }
  console.log(btoa(d));
  b = document.createElement("a");
  b.setAttribute("href", "data:application/octet-stream;base64," + btoa(d));
  b.setAttribute("download", a);
  b.style.display = "none";
  document.body.appendChild(b);
  b.click();
  document.body.removeChild(b);
}, emsc_js_download_string:function(a, b) {
  a = G(a);
  b = G(b);
  var c = document.createElement("a");
  c.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(b));
  c.setAttribute("download", a);
  c.style.display = "none";
  document.body.appendChild(c);
  c.click();
  document.body.removeChild(c);
}, emsc_js_init:function() {
  f.emsc_js_onload = Ia;
}, emsc_js_is_osx:function() {
  return navigator.userAgent.includes("Macintosh") ? 1 : 0;
}, emsc_js_load:function() {
  document.getElementById("picker").click();
}, emsc_js_onload:Ia, emsc_js_open_link:function(a) {
  a = G(a);
  window.open(a);
}, emscripten_get_device_pixel_ratio:function() {
  return "number" === typeof devicePixelRatio && devicePixelRatio || 1.0;
}, emscripten_get_element_css_size:function(a, b, c) {
  a = R(a);
  if (!a) {
    return -4;
  }
  a = fb(a);
  J[b >> 3] = a.width;
  J[c >> 3] = a.height;
  return 0;
}, emscripten_memcpy_big:function(a, b, c) {
  E.copyWithin(a, b, b + c);
}, emscripten_request_animation_frame_loop:function(a, b) {
  function c(d) {
    N(a)(d, b) && requestAnimationFrame(c);
  }
  return requestAnimationFrame(c);
}, emscripten_resize_heap:function() {
  z("OOM");
}, emscripten_set_blur_callback_on_thread:function(a, b, c, d) {
  gb(a, b, c, d, 12, "blur");
  return 0;
}, emscripten_set_canvas_element_size:function(a, b, c) {
  a = R(a);
  if (!a) {
    return -4;
  }
  a.width = b;
  a.height = c;
  return 0;
}, emscripten_set_focus_callback_on_thread:function(a, b, c, d) {
  gb(a, b, c, d, 13, "focus");
  return 0;
}, emscripten_set_keydown_callback_on_thread:function(a, b, c, d) {
  hb(a, b, c, d, 2, "keydown");
  return 0;
}, emscripten_set_keypress_callback_on_thread:function(a, b, c, d) {
  hb(a, b, c, d, 1, "keypress");
  return 0;
}, emscripten_set_keyup_callback_on_thread:function(a, b, c, d) {
  hb(a, b, c, d, 3, "keyup");
  return 0;
}, emscripten_set_mousedown_callback_on_thread:function(a, b, c, d) {
  T(a, b, c, d, 5, "mousedown");
  return 0;
}, emscripten_set_mouseenter_callback_on_thread:function(a, b, c, d) {
  T(a, b, c, d, 33, "mouseenter");
  return 0;
}, emscripten_set_mouseleave_callback_on_thread:function(a, b, c, d) {
  T(a, b, c, d, 34, "mouseleave");
  return 0;
}, emscripten_set_mousemove_callback_on_thread:function(a, b, c, d) {
  T(a, b, c, d, 8, "mousemove");
  return 0;
}, emscripten_set_mouseup_callback_on_thread:function(a, b, c, d) {
  T(a, b, c, d, 6, "mouseup");
  return 0;
}, emscripten_set_pointerlockchange_callback_on_thread:function(a, b, c, d) {
  if (!document || !document.body || !(document.body.requestPointerLock || document.body.H || document.body.K || document.body.J)) {
    return -1;
  }
  a = R(a);
  if (!a) {
    return -4;
  }
  jb(a, b, c, d, "pointerlockchange");
  jb(a, b, c, d, "mozpointerlockchange");
  jb(a, b, c, d, "webkitpointerlockchange");
  jb(a, b, c, d, "mspointerlockchange");
  return 0;
}, emscripten_set_pointerlockerror_callback_on_thread:function(a, b, c, d) {
  if (!document || !(document.body.requestPointerLock || document.body.H || document.body.K || document.body.J)) {
    return -1;
  }
  a = R(a);
  if (!a) {
    return -4;
  }
  kb(a, b, c, d, "pointerlockerror");
  kb(a, b, c, d, "mozpointerlockerror");
  kb(a, b, c, d, "webkitpointerlockerror");
  kb(a, b, c, d, "mspointerlockerror");
  return 0;
}, emscripten_set_resize_callback_on_thread:function(a, b, c, d) {
  lb(a, b, c, d);
  return 0;
}, emscripten_set_touchcancel_callback_on_thread:function(a, b, c, d) {
  mb(a, b, c, d, 25, "touchcancel");
  return 0;
}, emscripten_set_touchend_callback_on_thread:function(a, b, c, d) {
  mb(a, b, c, d, 23, "touchend");
  return 0;
}, emscripten_set_touchmove_callback_on_thread:function(a, b, c, d) {
  mb(a, b, c, d, 24, "touchmove");
  return 0;
}, emscripten_set_touchstart_callback_on_thread:function(a, b, c, d) {
  mb(a, b, c, d, 22, "touchstart");
  return 0;
}, emscripten_set_webglcontextlost_callback_on_thread:function(a, b, c, d) {
  nb(a, b, c, d, 31, "webglcontextlost");
  return 0;
}, emscripten_set_webglcontextrestored_callback_on_thread:function(a, b, c, d) {
  nb(a, b, c, d, 32, "webglcontextrestored");
  return 0;
}, emscripten_set_wheel_callback_on_thread:function(a, b, c, d) {
  a = R(a);
  return "undefined" !== typeof a.onwheel ? (ob(a, b, c, d), 0) : -1;
}, emscripten_webgl_create_context:function(a, b) {
  b >>= 2;
  b = {alpha:!!H[b], depth:!!H[b + 1], stencil:!!H[b + 2], antialias:!!H[b + 3], premultipliedAlpha:!!H[b + 4], preserveDrawingBuffer:!!H[b + 5], powerPreference:Hb[H[b + 6]], failIfMajorPerformanceCaveat:!!H[b + 7], aa:H[b + 8], pa:H[b + 9], G:H[b + 10], Y:H[b + 11], ra:H[b + 12], sa:H[b + 13]};
  a = R(a);
  return !a || b.Y ? 0 : Db(a, b);
}, emscripten_webgl_enable_extension:function(a, b) {
  a = zb[a];
  b = G(b);
  b.startsWith("GL_") && (b = b.substr(3));
  "ANGLE_instanced_arrays" == b && pb(X);
  "OES_vertex_array_object" == b && rb(X);
  "WEBGL_draw_buffers" == b && sb(X);
  "WEBGL_multi_draw" == b && tb(X);
  return !!a.B.getExtension(b);
}, emscripten_webgl_init_context_attributes:function(a) {
  a >>= 2;
  for (var b = 0; 14 > b; ++b) {
    H[a + b] = 0;
  }
  H[a] = H[a + 1] = H[a + 3] = H[a + 4] = H[a + 8] = H[a + 10] = 1;
}, emscripten_webgl_make_context_current:function(a) {
  Gb = zb[a];
  f.ja = X = Gb && Gb.B;
  return !a || X ? 0 : -5;
}, fd_close:function() {
  return 0;
}, fd_read:function(a, b, c, d) {
  a = Oa.na(a);
  b = Oa.la(a, b, c);
  H[d >> 2] = b;
  return 0;
}, fd_seek:function() {
}, fd_write:function(a, b, c, d) {
  for (var e = 0, h = 0; h < c; h++) {
    var g = H[b >> 2], m = H[b + 4 >> 2];
    b += 8;
    for (var n = 0; n < m; n++) {
      var p = E[g + n], r = Na[a];
      0 === p || 10 === p ? ((1 === a ? ia : A)(qa(r, 0)), r.length = 0) : r.push(p);
    }
    e += m;
  }
  H[d >> 2] = e;
  return 0;
}, glActiveTexture:function(a) {
  X.activeTexture(a);
}, glAttachShader:function(a, b) {
  X.attachShader(U[a], V[b]);
}, glBindBuffer:function(a, b) {
  X.bindBuffer(a, vb[b]);
}, glBindFramebuffer:function(a, b) {
  X.bindFramebuffer(a, wb[b]);
}, glBindRenderbuffer:function(a, b) {
  X.bindRenderbuffer(a, xb[b]);
}, glBindTexture:function(a, b) {
  X.bindTexture(a, yb[b]);
}, glBlendColor:function(a, b, c, d) {
  X.blendColor(a, b, c, d);
}, glBlendEquationSeparate:function(a, b) {
  X.blendEquationSeparate(a, b);
}, glBlendFuncSeparate:function(a, b, c, d) {
  X.blendFuncSeparate(a, b, c, d);
}, glBufferData:function(a, b, c, d) {
  X.bufferData(a, c ? E.subarray(c, c + b) : b, d);
}, glBufferSubData:function(a, b, c, d) {
  X.bufferSubData(a, b, E.subarray(d, d + c));
}, glClear:function(a) {
  X.clear(a);
}, glClearColor:function(a, b, c, d) {
  X.clearColor(a, b, c, d);
}, glClearDepthf:function(a) {
  X.clearDepth(a);
}, glClearStencil:function(a) {
  X.clearStencil(a);
}, glColorMask:function(a, b, c, d) {
  X.colorMask(!!a, !!b, !!c, !!d);
}, glCompileShader:function(a) {
  X.compileShader(V[a]);
}, glCompressedTexImage2D:function(a, b, c, d, e, h, g, m) {
  X.compressedTexImage2D(a, b, c, d, e, h, m ? E.subarray(m, m + g) : null);
}, glCreateProgram:function() {
  var a = Cb(U), b = X.createProgram();
  b.name = a;
  b.A = b.u = b.v = 0;
  b.F = 1;
  U[a] = b;
  return a;
}, glCreateShader:function(a) {
  var b = Cb(V);
  V[b] = X.createShader(a);
  return b;
}, glCullFace:function(a) {
  X.cullFace(a);
}, glDeleteBuffers:function(a, b) {
  for (var c = 0; c < a; c++) {
    var d = H[b + 4 * c >> 2], e = vb[d];
    e && (X.deleteBuffer(e), e.name = 0, vb[d] = null);
  }
}, glDeleteFramebuffers:function(a, b) {
  for (var c = 0; c < a; ++c) {
    var d = H[b + 4 * c >> 2], e = wb[d];
    e && (X.deleteFramebuffer(e), e.name = 0, wb[d] = null);
  }
}, glDeleteProgram:function(a) {
  if (a) {
    var b = U[a];
    b ? (X.deleteProgram(b), b.name = 0, U[a] = null) : W(1281);
  }
}, glDeleteRenderbuffers:function(a, b) {
  for (var c = 0; c < a; c++) {
    var d = H[b + 4 * c >> 2], e = xb[d];
    e && (X.deleteRenderbuffer(e), e.name = 0, xb[d] = null);
  }
}, glDeleteShader:function(a) {
  if (a) {
    var b = V[a];
    b ? (X.deleteShader(b), V[a] = null) : W(1281);
  }
}, glDeleteTextures:function(a, b) {
  for (var c = 0; c < a; c++) {
    var d = H[b + 4 * c >> 2], e = yb[d];
    e && (X.deleteTexture(e), e.name = 0, yb[d] = null);
  }
}, glDepthFunc:function(a) {
  X.depthFunc(a);
}, glDepthMask:function(a) {
  X.depthMask(!!a);
}, glDisable:function(a) {
  X.disable(a);
}, glDisableVertexAttribArray:function(a) {
  X.disableVertexAttribArray(a);
}, glDrawArrays:function(a, b, c) {
  X.drawArrays(a, b, c);
}, glDrawArraysInstancedANGLE:function(a, b, c, d) {
  X.drawArraysInstanced(a, b, c, d);
}, glDrawElements:function(a, b, c, d) {
  X.drawElements(a, b, c, d);
}, glDrawElementsInstancedANGLE:function(a, b, c, d, e) {
  X.drawElementsInstanced(a, b, c, d, e);
}, glEnable:function(a) {
  X.enable(a);
}, glEnableVertexAttribArray:function(a) {
  X.enableVertexAttribArray(a);
}, glFrontFace:function(a) {
  X.frontFace(a);
}, glGenBuffers:function(a, b) {
  Ib(a, b, "createBuffer", vb);
}, glGenRenderbuffers:function(a, b) {
  Ib(a, b, "createRenderbuffer", xb);
}, glGenTextures:function(a, b) {
  Ib(a, b, "createTexture", yb);
}, glGetAttribLocation:function(a, b) {
  return X.getAttribLocation(U[a], G(b));
}, glGetError:function() {
  var a = X.getError() || Bb;
  Bb = 0;
  return a;
}, glGetIntegerv:function(a, b) {
  Jb(a, b);
}, glGetProgramInfoLog:function(a, b, c, d) {
  a = X.getProgramInfoLog(U[a]);
  null === a && (a = "(unknown error)");
  b = 0 < b && d ? D(a, E, d, b) : 0;
  c && (H[c >> 2] = b);
}, glGetProgramiv:function(a, b, c) {
  if (c) {
    if (a >= ub) {
      W(1281);
    } else {
      if (a = U[a], 35716 == b) {
        a = X.getProgramInfoLog(a), null === a && (a = "(unknown error)"), H[c >> 2] = a.length + 1;
      } else {
        if (35719 == b) {
          if (!a.A) {
            for (b = 0; b < X.getProgramParameter(a, 35718); ++b) {
              a.A = Math.max(a.A, X.getActiveUniform(a, b).name.length + 1);
            }
          }
          H[c >> 2] = a.A;
        } else {
          if (35722 == b) {
            if (!a.u) {
              for (b = 0; b < X.getProgramParameter(a, 35721); ++b) {
                a.u = Math.max(a.u, X.getActiveAttrib(a, b).name.length + 1);
              }
            }
            H[c >> 2] = a.u;
          } else {
            if (35381 == b) {
              if (!a.v) {
                for (b = 0; b < X.getProgramParameter(a, 35382); ++b) {
                  a.v = Math.max(a.v, X.getActiveUniformBlockName(a, b).length + 1);
                }
              }
              H[c >> 2] = a.v;
            } else {
              H[c >> 2] = X.getProgramParameter(a, b);
            }
          }
        }
      }
    }
  } else {
    W(1281);
  }
}, glGetShaderInfoLog:function(a, b, c, d) {
  a = X.getShaderInfoLog(V[a]);
  null === a && (a = "(unknown error)");
  b = 0 < b && d ? D(a, E, d, b) : 0;
  c && (H[c >> 2] = b);
}, glGetShaderiv:function(a, b, c) {
  c ? 35716 == b ? (a = X.getShaderInfoLog(V[a]), null === a && (a = "(unknown error)"), H[c >> 2] = a ? a.length + 1 : 0) : 35720 == b ? (a = X.getShaderSource(V[a]), H[c >> 2] = a ? a.length + 1 : 0) : H[c >> 2] = X.getShaderParameter(V[a], b) : W(1281);
}, glGetString:function(a) {
  var b = Ab[a];
  if (!b) {
    switch(a) {
      case 7939:
        b = X.getSupportedExtensions() || [];
        b = b.concat(b.map(function(d) {
          return "GL_" + d;
        }));
        b = Kb(b.join(" "));
        break;
      case 7936:
      case 7937:
      case 37445:
      case 37446:
        (b = X.getParameter(a)) || W(1280);
        b = b && Kb(b);
        break;
      case 7938:
        b = Kb("OpenGL ES 2.0 (" + X.getParameter(7938) + ")");
        break;
      case 35724:
        b = X.getParameter(35724);
        var c = b.match(/^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/);
        null !== c && (3 == c[1].length && (c[1] += "0"), b = "OpenGL ES GLSL ES " + c[1] + " (" + b + ")");
        b = Kb(b);
        break;
      default:
        W(1280);
    }
    Ab[a] = b;
  }
  return b;
}, glGetUniformLocation:function(a, b) {
  b = G(b);
  if (a = U[a]) {
    var c = a, d = c.o, e = c.V, h;
    if (!d) {
      for (c.o = d = {}, c.U = {}, h = 0; h < X.getProgramParameter(c, 35718); ++h) {
        var g = X.getActiveUniform(c, h);
        var m = g.name;
        g = g.size;
        var n = Lb(m);
        n = 0 < n ? m.slice(0, n) : m;
        var p = c.F;
        c.F += g;
        e[n] = [g, p];
        for (m = 0; m < g; ++m) {
          d[p] = m, c.U[p++] = n;
        }
      }
    }
    c = a.o;
    d = 0;
    e = b;
    h = Lb(b);
    0 < h && (d = parseInt(b.slice(h + 1)) >>> 0, e = b.slice(0, h));
    if ((e = a.V[e]) && d < e[0] && (d += e[1], c[d] = c[d] || X.getUniformLocation(a, b))) {
      return d;
    }
  } else {
    W(1281);
  }
  return -1;
}, glLinkProgram:function(a) {
  a = U[a];
  X.linkProgram(a);
  a.o = 0;
  a.V = {};
}, glPolygonOffset:function(a, b) {
  X.polygonOffset(a, b);
}, glRenderbufferStorage:function(a, b, c, d) {
  X.renderbufferStorage(a, b, c, d);
}, glScissor:function(a, b, c, d) {
  X.scissor(a, b, c, d);
}, glShaderSource:function(a, b, c, d) {
  for (var e = "", h = 0; h < b; ++h) {
    var g = d ? H[d + 4 * h >> 2] : -1;
    e += G(H[c + 4 * h >> 2], 0 > g ? void 0 : g);
  }
  X.shaderSource(V[a], e);
}, glStencilFunc:function(a, b, c) {
  X.stencilFunc(a, b, c);
}, glStencilFuncSeparate:function(a, b, c, d) {
  X.stencilFuncSeparate(a, b, c, d);
}, glStencilMask:function(a) {
  X.stencilMask(a);
}, glStencilOp:function(a, b, c) {
  X.stencilOp(a, b, c);
}, glStencilOpSeparate:function(a, b, c, d) {
  X.stencilOpSeparate(a, b, c, d);
}, glTexImage2D:function(a, b, c, d, e, h, g, m, n) {
  var p = X, r = p.texImage2D;
  if (n) {
    var q = m - 5120;
    q = 1 == q ? E : 4 == q ? H : 6 == q ? I : 5 == q || 28922 == q ? va : ua;
    var O = 31 - Math.clz32(q.BYTES_PER_ELEMENT);
    n = q.subarray(n >> O, n + e * (d * ({5:3, 6:4, 8:2, 29502:3, 29504:4,}[g - 6402] || 1) * (1 << O) + 4 - 1 & -4) >> O);
  } else {
    n = null;
  }
  r.call(p, a, b, c, d, e, h, g, m, n);
}, glTexParameteri:function(a, b, c) {
  X.texParameteri(a, b, c);
}, glUniform1fv:function(a, b, c) {
  if (288 >= b) {
    for (var d = Z[b - 1], e = 0; e < b; ++e) {
      d[e] = I[c + 4 * e >> 2];
    }
  } else {
    d = I.subarray(c >> 2, c + 4 * b >> 2);
  }
  X.uniform1fv(Y(a), d);
}, glUniform1i:function(a, b) {
  X.uniform1i(Y(a), b);
}, glUniform2fv:function(a, b, c) {
  if (144 >= b) {
    for (var d = Z[2 * b - 1], e = 0; e < 2 * b; e += 2) {
      d[e] = I[c + 4 * e >> 2], d[e + 1] = I[c + (4 * e + 4) >> 2];
    }
  } else {
    d = I.subarray(c >> 2, c + 8 * b >> 2);
  }
  X.uniform2fv(Y(a), d);
}, glUniform3fv:function(a, b, c) {
  if (96 >= b) {
    for (var d = Z[3 * b - 1], e = 0; e < 3 * b; e += 3) {
      d[e] = I[c + 4 * e >> 2], d[e + 1] = I[c + (4 * e + 4) >> 2], d[e + 2] = I[c + (4 * e + 8) >> 2];
    }
  } else {
    d = I.subarray(c >> 2, c + 12 * b >> 2);
  }
  X.uniform3fv(Y(a), d);
}, glUniform4fv:function(a, b, c) {
  if (72 >= b) {
    var d = Z[4 * b - 1], e = I;
    c >>= 2;
    for (var h = 0; h < 4 * b; h += 4) {
      var g = c + h;
      d[h] = e[g];
      d[h + 1] = e[g + 1];
      d[h + 2] = e[g + 2];
      d[h + 3] = e[g + 3];
    }
  } else {
    d = I.subarray(c >> 2, c + 16 * b >> 2);
  }
  X.uniform4fv(Y(a), d);
}, glUniformMatrix4fv:function(a, b, c, d) {
  if (18 >= b) {
    var e = Z[16 * b - 1], h = I;
    d >>= 2;
    for (var g = 0; g < 16 * b; g += 16) {
      var m = d + g;
      e[g] = h[m];
      e[g + 1] = h[m + 1];
      e[g + 2] = h[m + 2];
      e[g + 3] = h[m + 3];
      e[g + 4] = h[m + 4];
      e[g + 5] = h[m + 5];
      e[g + 6] = h[m + 6];
      e[g + 7] = h[m + 7];
      e[g + 8] = h[m + 8];
      e[g + 9] = h[m + 9];
      e[g + 10] = h[m + 10];
      e[g + 11] = h[m + 11];
      e[g + 12] = h[m + 12];
      e[g + 13] = h[m + 13];
      e[g + 14] = h[m + 14];
      e[g + 15] = h[m + 15];
    }
  } else {
    e = I.subarray(d >> 2, d + 64 * b >> 2);
  }
  X.uniformMatrix4fv(Y(a), !!c, e);
}, glUseProgram:function(a) {
  a = U[a];
  X.useProgram(a);
  X.W = a;
}, glVertexAttribDivisorANGLE:function(a, b) {
  X.vertexAttribDivisor(a, b);
}, glVertexAttribPointer:function(a, b, c, d, e, h) {
  X.vertexAttribPointer(a, b, c, !!d, e, h);
}, glViewport:function(a, b, c, d) {
  X.viewport(a, b, c, d);
}, sapp_js_add_beforeunload_listener:function() {
  f.N = function(a) {
    0 != Ob() && (a.preventDefault(), a.returnValue = " ");
  };
  window.addEventListener("beforeunload", f.N);
}, sapp_js_add_clipboard_listener:function() {
  f.T = function(a) {
    a = a.clipboardData.getData("text");
    ma("_sapp_emsc_onpaste", "void", ["string"], [a]);
  };
  window.addEventListener("paste", f.T);
}, sapp_js_add_dragndrop_listeners:function(a) {
  f.ta = [];
  a = G(a);
  a = document.getElementById(a);
  f.O = function(b) {
    b.stopPropagation();
    b.preventDefault();
  };
  f.P = function(b) {
    b.stopPropagation();
    b.preventDefault();
  };
  f.R = function(b) {
    b.stopPropagation();
    b.preventDefault();
  };
  f.S = function(b) {
    b.stopPropagation();
    b.preventDefault();
    var c = b.dataTransfer.files;
    f.D = c;
    Pb(c.length);
    var d;
    for (d = 0; d < c.length; d++) {
      ma("_sapp_emsc_drop", "void", ["number", "string"], [d, c[d].name]);
    }
    Qb(b.clientX, b.clientY);
  };
  a.addEventListener("dragenter", f.O, !1);
  a.addEventListener("dragleave", f.P, !1);
  a.addEventListener("dragover", f.R, !1);
  a.addEventListener("drop", f.S, !1);
}, sapp_js_clear_favicon:function() {
  var a = document.getElementById("sokol-app-favicon");
  a && document.head.removeChild(a);
}, sapp_js_create_textfield:function() {
  var a = document.createElement("input");
  a.type = "text";
  a.id = "_sokol_app_input_element";
  a.autocapitalize = "none";
  a.addEventListener("focusout", function() {
    Rb();
  });
  document.body.append(a);
}, sapp_js_dropped_file_size:function(a) {
  return 0 > a || a >= f.D.length ? 0 : f.D[a].size;
}, sapp_js_exit_pointerlock:function() {
  document.exitPointerLock && document.exitPointerLock();
}, sapp_js_fetch_dropped_file:function(a, b, c, d, e) {
  var h = new FileReader();
  h.onload = function(g) {
    g = g.target.result;
    g.byteLength > d ? Sb(a, 0, 1, b, 0, c, d, e) : (E.set(new Uint8Array(g), c), Sb(a, 1, 0, b, g.byteLength, c, d, e));
  };
  h.onerror = function() {
    Sb(a, 0, 2, b, 0, c, d, e);
  };
  h.readAsArrayBuffer(f.D[a]);
}, sapp_js_focus_textfield:function() {
  document.getElementById("_sokol_app_input_element").focus();
}, sapp_js_pointer_init:function(a) {
  a = G(a);
  f.m = document.getElementById(a);
  f.m || console.log("sokol_app.h: invalid target:" + a);
  f.m.requestPointerLock || console.log("sokol_app.h: target doesn't support requestPointerLock:" + a);
}, sapp_js_remove_beforeunload_listener:function() {
  window.removeEventListener("beforeunload", f.N);
}, sapp_js_remove_clipboard_listener:function() {
  window.removeEventListener("paste", f.T);
}, sapp_js_remove_dragndrop_listeners:function(a) {
  a = G(a);
  a = document.getElementById(a);
  a.removeEventListener("dragenter", f.O);
  a.removeEventListener("dragleave", f.P);
  a.removeEventListener("dragover", f.R);
  a.removeEventListener("drop", f.S);
}, sapp_js_request_pointerlock:function() {
  f.m && f.m.requestPointerLock && f.m.requestPointerLock();
}, sapp_js_set_favicon:function(a, b, c) {
  var d = document.createElement("canvas");
  d.width = a;
  d.height = b;
  var e = d.getContext("2d"), h = e.createImageData(a, b);
  h.data.set(E.subarray(c, c + a * b * 4));
  e.putImageData(h, 0, 0);
  a = document.createElement("link");
  a.id = "sokol-app-favicon";
  a.rel = "shortcut icon";
  a.href = d.toDataURL();
  document.head.appendChild(a);
}, sapp_js_unfocus_textfield:function() {
  document.getElementById("_sokol_app_input_element").blur();
}, sapp_js_write_clipboard:function(a) {
  a = G(a);
  var b = document.createElement("textarea");
  b.setAttribute("autocomplete", "off");
  b.setAttribute("autocorrect", "off");
  b.setAttribute("autocapitalize", "off");
  b.setAttribute("spellcheck", "false");
  b.style.left = "-100px";
  b.style.top = "-100px";
  b.style.height = 1;
  b.style.width = 1;
  b.value = a;
  document.body.appendChild(b);
  b.select();
  document.execCommand("copy");
  document.body.removeChild(b);
}, setTempRet0:function() {
}, simgui_js_is_osx:function() {
  return navigator.userAgent.includes("Macintosh") ? 1 : 0;
}, stm_js_perfnow:function() {
  return performance.now();
}, time:function(a) {
  var b = Date.now() / 1000 | 0;
  a && (H[a >> 2] = b);
  return b;
}};
(function() {
  function a(e) {
    f.asm = e.exports;
    ja = f.asm.memory;
    e = ja.buffer;
    f.HEAP8 = F = new Int8Array(e);
    f.HEAP16 = ta = new Int16Array(e);
    f.HEAP32 = H = new Int32Array(e);
    f.HEAPU8 = E = new Uint8Array(e);
    f.HEAPU16 = ua = new Uint16Array(e);
    f.HEAPU32 = va = new Uint32Array(e);
    f.HEAPF32 = I = new Float32Array(e);
    f.HEAPF64 = J = new Float64Array(e);
    wa = f.asm.__indirect_function_table;
    ya.unshift(f.asm.__wasm_call_ctors);
    K--;
    f.monitorRunDependencies && f.monitorRunDependencies(K);
    0 == K && (null !== Da && (clearInterval(Da), Da = null), L && (e = L, L = null, e()));
  }
  function b(e) {
    a(e.instance);
  }
  function c(e) {
    return Ha().then(function(h) {
      return WebAssembly.instantiate(h, d);
    }).then(function(h) {
      return h;
    }).then(e, function(h) {
      A("failed to asynchronously prepare wasm: " + h);
      z(h);
    });
  }
  var d = {env:Tb, wasi_snapshot_preview1:Tb,};
  K++;
  f.monitorRunDependencies && f.monitorRunDependencies(K);
  if (f.instantiateWasm) {
    try {
      return f.instantiateWasm(d, a);
    } catch (e) {
      return A("Module.instantiateWasm callback failed with error: " + e), !1;
    }
  }
  (function() {
    return B || "function" !== typeof WebAssembly.instantiateStreaming || Ea() || M.startsWith("file://") || "function" !== typeof fetch ? c(b) : fetch(M, {credentials:"same-origin"}).then(function(e) {
      return WebAssembly.instantiateStreaming(e, d).then(b, function(h) {
        A("wasm streaming compile failed: " + h);
        A("falling back to ArrayBuffer instantiation");
        return c(b);
      });
    });
  })();
  return {};
})();
f.___wasm_call_ctors = function() {
  return (f.___wasm_call_ctors = f.asm.__wasm_call_ctors).apply(null, arguments);
};
var Rb = f.__sapp_emsc_notify_keyboard_hidden = function() {
  return (Rb = f.__sapp_emsc_notify_keyboard_hidden = f.asm._sapp_emsc_notify_keyboard_hidden).apply(null, arguments);
};
f.__sapp_emsc_onpaste = function() {
  return (f.__sapp_emsc_onpaste = f.asm._sapp_emsc_onpaste).apply(null, arguments);
};
var Ob = f.__sapp_html5_get_ask_leave_site = function() {
  return (Ob = f.__sapp_html5_get_ask_leave_site = f.asm._sapp_html5_get_ask_leave_site).apply(null, arguments);
}, Pb = f.__sapp_emsc_begin_drop = function() {
  return (Pb = f.__sapp_emsc_begin_drop = f.asm._sapp_emsc_begin_drop).apply(null, arguments);
};
f.__sapp_emsc_drop = function() {
  return (f.__sapp_emsc_drop = f.asm._sapp_emsc_drop).apply(null, arguments);
};
var Qb = f.__sapp_emsc_end_drop = function() {
  return (Qb = f.__sapp_emsc_end_drop = f.asm._sapp_emsc_end_drop).apply(null, arguments);
}, Sb = f.__sapp_emsc_invoke_fetch_cb = function() {
  return (Sb = f.__sapp_emsc_invoke_fetch_cb = f.asm._sapp_emsc_invoke_fetch_cb).apply(null, arguments);
};
f._main = function() {
  return (f._main = f.asm.main).apply(null, arguments);
};
var S = f._malloc = function() {
  return (S = f._malloc = f.asm.malloc).apply(null, arguments);
};
f._free = function() {
  return (f._free = f.asm.free).apply(null, arguments);
};
f.___errno_location = function() {
  return (f.___errno_location = f.asm.__errno_location).apply(null, arguments);
};
f._util_emsc_loadfile = function() {
  return (f._util_emsc_loadfile = f.asm.util_emsc_loadfile).apply(null, arguments);
};
var na = f.stackSave = function() {
  return (na = f.stackSave = f.asm.stackSave).apply(null, arguments);
}, oa = f.stackRestore = function() {
  return (oa = f.stackRestore = f.asm.stackRestore).apply(null, arguments);
}, C = f.stackAlloc = function() {
  return (C = f.stackAlloc = f.asm.stackAlloc).apply(null, arguments);
};
f.dynCall_jiji = function() {
  return (f.dynCall_jiji = f.asm.dynCall_jiji).apply(null, arguments);
};
var Ub;
function fa(a) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + a + ")";
  this.status = a;
}
L = function Vb() {
  Ub || Wb();
  Ub || (L = Vb);
};
function Wb(a) {
  function b() {
    if (!Ub && (Ub = !0, f.calledRun = !0, !ka)) {
      Ja(ya);
      Ja(za);
      if (f.onRuntimeInitialized) {
        f.onRuntimeInitialized();
      }
      if (Xb) {
        var c = a, d = f._main;
        c = c || [];
        var e = c.length + 1, h = C(4 * (e + 1));
        H[h >> 2] = sa(ba);
        for (var g = 1; g < e; g++) {
          H[(h >> 2) + g] = sa(c[g - 1]);
        }
        H[(h >> 2) + e] = 0;
        try {
          var m = d(e, h);
          if (!(noExitRuntime || 0 < ha)) {
            if (f.onExit) {
              f.onExit(m);
            }
            ka = !0;
          }
          t(m, new fa(m));
        } catch (n) {
          n instanceof fa || "unwind" == n || t(1, n);
        } finally {
        }
      }
      if (f.postRun) {
        for ("function" == typeof f.postRun && (f.postRun = [f.postRun]); f.postRun.length;) {
          c = f.postRun.shift(), Ba.unshift(c);
        }
      }
      Ja(Ba);
    }
  }
  a = a || aa;
  if (!(0 < K)) {
    if (f.preRun) {
      for ("function" == typeof f.preRun && (f.preRun = [f.preRun]); f.preRun.length;) {
        Ca();
      }
    }
    Ja(xa);
    0 < K || (f.setStatus ? (f.setStatus("Running..."), setTimeout(function() {
      setTimeout(function() {
        f.setStatus("");
      }, 1);
      b();
    }, 1)) : b());
  }
}
f.run = Wb;
if (f.preInit) {
  for ("function" == typeof f.preInit && (f.preInit = [f.preInit]); 0 < f.preInit.length;) {
    f.preInit.pop()();
  }
}
var Xb = !0;
f.noInitialRun && (Xb = !1);
Wb();

