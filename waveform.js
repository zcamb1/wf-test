!function(t, e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).WaveSurfer = e()
}(this, (function() {
    "use strict";
    function t(t, e, i, s) {
        return new (i || (i = Promise))((function(n, r) {
            function o(t) {
                try {
                    h(s.next(t))
                } catch (t) {
                    r(t)
                }
            }
            function a(t) {
                try {
                    h(s.throw(t))
                } catch (t) {
                    r(t)
                }
            }
            function h(t) {
                var e;
                t.done ? n(t.value) : (e = t.value,
                e instanceof i ? e : new i((function(t) {
                    t(e)
                }
                ))).then(o, a)
            }
            h((s = s.apply(t, e || [])).next())
        }
        ))
    }
    "function" == typeof SuppressedError && SuppressedError;
    class e {
        constructor() {
            this.listeners = {}
        }
        on(t, e, i) {
            if (this.listeners[t] || (this.listeners[t] = new Set),
            this.listeners[t].add(e),
            null == i ? void 0 : i.once) {
                const i = () => {
                    this.un(t, i),
                    this.un(t, e)
                }
                ;
                return this.on(t, i),
                i
            }
            return () => this.un(t, e)
        }
        un(t, e) {
            var i;
            null === (i = this.listeners[t]) || void 0 === i || i.delete(e)
        }
        once(t, e) {
            return this.on(t, e, {
                once: !0
            })
        }
        unAll() {
            this.listeners = {}
        }
        emit(t, ...e) {
            this.listeners[t] && this.listeners[t].forEach((t => t(...e)))
        }
    }
    const i = {
        decode: function(e, i) {
            return t(this, void 0, void 0, (function*() {
                const t = new AudioContext({
                    sampleRate: i
                });
                return t.decodeAudioData(e).finally(( () => t.close()))
            }
            ))
        },
        createBuffer: function(t, e) {
            return "number" == typeof t[0] && (t = [t]),
            function(t) {
                const e = t[0];
                if (e.some((t => t > 1 || t < -1))) {
                    const i = e.length;
                    let s = 0;
                    for (let t = 0; t < i; t++) {
                        const i = Math.abs(e[t]);
                        i > s && (s = i)
                    }
                    for (const e of t)
                        for (let t = 0; t < i; t++)
                            e[t] /= s
                }
            }(t),
            {
                duration: e,
                length: t[0].length,
                sampleRate: t[0].length / e,
                numberOfChannels: t.length,
                getChannelData: e => null == t ? void 0 : t[e],
                copyFromChannel: AudioBuffer.prototype.copyFromChannel,
                copyToChannel: AudioBuffer.prototype.copyToChannel
            }
        }
    };
    function s(t, e) {
        const i = e.xmlns ? document.createElementNS(e.xmlns, t) : document.createElement(t);
        for (const [t,n] of Object.entries(e))
            if ("children" === t)
                for (const [t,n] of Object.entries(e))
                    "string" == typeof n ? i.appendChild(document.createTextNode(n)) : i.appendChild(s(t, n));
            else
                "style" === t ? Object.assign(i.style, n) : "textContent" === t ? i.textContent = n : i.setAttribute(t, n.toString());
        return i
    }
    function n(t, e, i) {
        const n = s(t, e || {});
        return null == i || i.appendChild(n),
        n
    }
    var r = Object.freeze({
        __proto__: null,
        createElement: n,
        default: n
    });
    const o = {
        fetchBlob: function(e, i, s) {
            return t(this, void 0, void 0, (function*() {
                const n = yield fetch(e, s);
                if (n.status >= 400)
                    throw new Error(`Failed to fetch ${e}: ${n.status} (${n.statusText})`);
                return function(e, i) {
                    t(this, void 0, void 0, (function*() {
                        if (!e.body || !e.headers)
                            return;
                        const s = e.body.getReader()
                          , n = Number(e.headers.get("Content-Length")) || 0;
                        let r = 0;
                        const o = e => t(this, void 0, void 0, (function*() {
                            r += (null == e ? void 0 : e.length) || 0;
                            const t = Math.round(r / n * 100);
                            i(t)
                        }
                        ))
                          , a = () => t(this, void 0, void 0, (function*() {
                            let t;
                            try {
                                t = yield s.read()
                            } catch (t) {
                                return
                            }
                            t.done || (o(t.value),
                            yield a())
                        }
                        ));
                        a()
                    }
                    ))
                }(n.clone(), i),
                n.blob()
            }
            ))
        }
    };
    class a extends e {
        constructor(t) {
            super(),
            this.isExternalMedia = !1,
            t.media ? (this.media = t.media,
            this.isExternalMedia = !0) : this.media = document.createElement("audio"),
            t.mediaControls && (this.media.controls = !0),
            t.autoplay && (this.media.autoplay = !0),
            null != t.playbackRate && this.onMediaEvent("canplay", ( () => {
                null != t.playbackRate && (this.media.playbackRate = t.playbackRate)
            }
            ), {
                once: !0
            })
        }
        onMediaEvent(t, e, i) {
            return this.media.addEventListener(t, e, i),
            () => this.media.removeEventListener(t, e, i)
        }
        getSrc() {
            return this.media.currentSrc || this.media.src || ""
        }
        revokeSrc() {
            const t = this.getSrc();
            t.startsWith("blob:") && URL.revokeObjectURL(t)
        }
        canPlayType(t) {
            return "" !== this.media.canPlayType(t)
        }
        setSrc(t, e) {
            const i = this.getSrc();
            if (t && i === t)
                return;
            this.revokeSrc();
            const s = e instanceof Blob && (this.canPlayType(e.type) || !t) ? URL.createObjectURL(e) : t;
            i && (this.media.src = "");
            try {
                this.media.src = s
            } catch (e) {
                this.media.src = t
            }
        }
        destroy() {
            this.isExternalMedia || (this.media.pause(),
            this.media.remove(),
            this.revokeSrc(),
            this.media.src = "",
            this.media.load())
        }
        setMediaElement(t) {
            this.media = t
        }
        play() {
            return t(this, void 0, void 0, (function*() {
                return this.media.play()
            }
            ))
        }
        pause() {
            this.media.pause()
        }
        isPlaying() {
            return !this.media.paused && !this.media.ended
        }
        setTime(t) {
            this.media.currentTime = Math.max(0, Math.min(t, this.getDuration()))
        }
        getDuration() {
            return this.media.duration
        }
        getCurrentTime() {
            return this.media.currentTime
        }
        getVolume() {
            return this.media.volume
        }
        setVolume(t) {
            this.media.volume = t
        }
        getMuted() {
            return this.media.muted
        }
        setMuted(t) {
            this.media.muted = t
        }
        getPlaybackRate() {
            return this.media.playbackRate
        }
        isSeeking() {
            return this.media.seeking
        }
        setPlaybackRate(t, e) {
            null != e && (this.media.preservesPitch = e),
            this.media.playbackRate = t
        }
        getMediaElement() {
            return this.media
        }
        setSinkId(t) {
            return this.media.setSinkId(t)
        }
    }
    class h extends e {
        constructor(t, e) {
            super(),
            this.timeouts = [],
            this.isScrollable = !1,
            this.audioData = null,
            this.resizeObserver = null,
            this.lastContainerWidth = 0,
            this.isDragging = !1,
            this.subscriptions = [],
            this.unsubscribeOnScroll = [],
            this.subscriptions = [],
            this.options = t;
            const i = this.parentFromOptionsContainer(t.container);
            this.parent = i;
            const [s,n] = this.initHtml();
            i.appendChild(s),
            this.container = s,
            this.scrollContainer = n.querySelector(".scroll"),
            this.wrapper = n.querySelector(".wrapper"),
            this.canvasWrapper = n.querySelector(".canvases"),
            this.progressWrapper = n.querySelector(".progress"),
            this.cursor = n.querySelector(".cursor"),
            e && n.appendChild(e),
            this.initEvents()
        }
        parentFromOptionsContainer(t) {
            let e;
            if ("string" == typeof t ? e = document.querySelector(t) : t instanceof HTMLElement && (e = t),
            !e)
                throw new Error("Container not found");
            return e
        }
        initEvents() {
            const t = t => {
                const e = this.wrapper.getBoundingClientRect()
                  , i = t.clientX - e.left
                  , s = t.clientY - e.top;
                return [i / e.width, s / e.height]
            }
            ;
            if (this.wrapper.addEventListener("click", (e => {
                const [i,s] = t(e);
                this.emit("click", i, s)
            }
            )),
            this.wrapper.addEventListener("dblclick", (e => {
                const [i,s] = t(e);
                this.emit("dblclick", i, s)
            }
            )),
            !0 !== this.options.dragToSeek && "object" != typeof this.options.dragToSeek || this.initDrag(),
            this.scrollContainer.addEventListener("scroll", ( () => {
                const {scrollLeft: t, scrollWidth: e, clientWidth: i} = this.scrollContainer
                  , s = t / e
                  , n = (t + i) / e;
                this.emit("scroll", s, n, t, t + i)
            }
            )),
            "function" == typeof ResizeObserver) {
                const t = this.createDelay(100);
                this.resizeObserver = new ResizeObserver(( () => {
                    t().then(( () => this.onContainerResize())).catch(( () => {}
                    ))
                }
                )),
                this.resizeObserver.observe(this.scrollContainer)
            }
        }
        onContainerResize() {
            const t = this.parent.clientWidth;
            t === this.lastContainerWidth && "auto" !== this.options.height || (this.lastContainerWidth = t,
            this.reRender())
        }
        initDrag() {
            this.subscriptions.push(function(t, e, i, s, n=3, r=0, o=100) {
                if (!t)
                    return () => {}
                    ;
                const a = matchMedia("(pointer: coarse)").matches;
                let h = () => {}
                ;
                const l = l => {
                    if (l.button !== r)
                        return;
                    l.preventDefault(),
                    l.stopPropagation();
                    let d = l.clientX
                      , c = l.clientY
                      , u = !1;
                    const p = Date.now()
                      , m = s => {
                        if (s.preventDefault(),
                        s.stopPropagation(),
                        a && Date.now() - p < o)
                            return;
                        const r = s.clientX
                          , h = s.clientY
                          , l = r - d
                          , m = h - c;
                        if (u || Math.abs(l) > n || Math.abs(m) > n) {
                            const s = t.getBoundingClientRect()
                              , {left: n, top: o} = s;
                            u || (null == i || i(d - n, c - o),
                            u = !0),
                            e(l, m, r - n, h - o),
                            d = r,
                            c = h
                        }
                    }
                      , f = e => {
                        if (u) {
                            const i = e.clientX
                              , n = e.clientY
                              , r = t.getBoundingClientRect()
                              , {left: o, top: a} = r;
                            null == s || s(i - o, n - a)
                        }
                        h()
                    }
                      , g = t => {
                        t.relatedTarget && t.relatedTarget !== document.documentElement || f(t)
                    }
                      , v = t => {
                        u && (t.stopPropagation(),
                        t.preventDefault())
                    }
                      , b = t => {
                        u && t.preventDefault()
                    }
                    ;
                    document.addEventListener("pointermove", m),
                    document.addEventListener("pointerup", f),
                    document.addEventListener("pointerout", g),
                    document.addEventListener("pointercancel", g),
                    document.addEventListener("touchmove", b, {
                        passive: !1
                    }),
                    document.addEventListener("click", v, {
                        capture: !0
                    }),
                    h = () => {
                        document.removeEventListener("pointermove", m),
                        document.removeEventListener("pointerup", f),
                        document.removeEventListener("pointerout", g),
                        document.removeEventListener("pointercancel", g),
                        document.removeEventListener("touchmove", b),
                        setTimeout(( () => {
                            document.removeEventListener("click", v, {
                                capture: !0
                            })
                        }
                        ), 10)
                    }
                }
                ;
                return t.addEventListener("pointerdown", l),
                () => {
                    h(),
                    t.removeEventListener("pointerdown", l)
                }
            }(this.wrapper, ( (t, e, i) => {
                this.emit("drag", Math.max(0, Math.min(1, i / this.wrapper.getBoundingClientRect().width)))
            }
            ), (t => {
                this.isDragging = !0,
                this.emit("dragstart", Math.max(0, Math.min(1, t / this.wrapper.getBoundingClientRect().width)))
            }
            ), (t => {
                this.isDragging = !1,
                this.emit("dragend", Math.max(0, Math.min(1, t / this.wrapper.getBoundingClientRect().width)))
            }
            )))
        }
        getHeight(t, e) {
            var i;
            const s = (null === (i = this.audioData) || void 0 === i ? void 0 : i.numberOfChannels) || 1;
            if (null == t)
                return 128;
            if (!isNaN(Number(t)))
                return Number(t);
            if ("auto" === t) {
                const t = this.parent.clientHeight || 128;
                return (null == e ? void 0 : e.every((t => !t.overlay))) ? t / s : t
            }
            return 128
        }
        initHtml() {
            const t = document.createElement("div")
              , e = t.attachShadow({
                mode: "open"
            })
              , i = this.options.cspNonce && "string" == typeof this.options.cspNonce ? this.options.cspNonce.replace(/"/g, "") : "";
            return e.innerHTML = `\n      <style${i ? ` nonce="${i}"` : ""}>\n        :host {\n          user-select: none;\n          min-width: 1px;\n        }\n        :host audio {\n          display: block;\n          width: 100%;\n        }\n        :host .scroll {\n          overflow-x: auto;\n          overflow-y: hidden;\n          width: 100%;\n          position: relative;\n        }\n        :host .noScrollbar {\n          scrollbar-color: transparent;\n          scrollbar-width: none;\n        }\n        :host .noScrollbar::-webkit-scrollbar {\n          display: none;\n          -webkit-appearance: none;\n        }\n        :host .wrapper {\n          position: relative;\n          overflow: visible;\n          z-index: 2;\n        }\n        :host .canvases {\n          min-height: ${this.getHeight(this.options.height, this.options.splitChannels)}px;\n        }\n        :host .canvases > div {\n          position: relative;\n        }\n        :host canvas {\n          display: block;\n          position: absolute;\n          top: 0;\n          image-rendering: pixelated;\n        }\n        :host .progress {\n          pointer-events: none;\n          position: absolute;\n          z-index: 2;\n          top: 0;\n          left: 0;\n          width: 0;\n          height: 100%;\n          overflow: hidden;\n        }\n        :host .progress > div {\n          position: relative;\n        }\n        :host .cursor {\n          pointer-events: none;\n          position: absolute;\n          z-index: 5;\n          top: 0;\n          left: 0;\n          height: 100%;\n          border-radius: 2px;\n        }\n      </style>\n\n      <div class="scroll" part="scroll">\n        <div class="wrapper" part="wrapper">\n          <div class="canvases" part="canvases"></div>\n          <div class="progress" part="progress"></div>\n          <div class="cursor" part="cursor"></div>\n        </div>\n      </div>\n    `,
            [t, e]
        }
        setOptions(t) {
            if (this.options.container !== t.container) {
                const e = this.parentFromOptionsContainer(t.container);
                e.appendChild(this.container),
                this.parent = e
            }
            !0 !== t.dragToSeek && "object" != typeof this.options.dragToSeek || this.initDrag(),
            this.options = t,
            this.reRender()
        }
        getWrapper() {
            return this.wrapper
        }
        getWidth() {
            return this.scrollContainer.clientWidth
        }
        getScroll() {
            return this.scrollContainer.scrollLeft
        }
        setScroll(t) {
            this.scrollContainer.scrollLeft = t
        }
        setScrollPercentage(t) {
            const {scrollWidth: e} = this.scrollContainer
              , i = e * t;
            this.setScroll(i)
        }
        destroy() {
            var t, e;
            this.subscriptions.forEach((t => t())),
            this.container.remove(),
            null === (t = this.resizeObserver) || void 0 === t || t.disconnect(),
            null === (e = this.unsubscribeOnScroll) || void 0 === e || e.forEach((t => t())),
            this.unsubscribeOnScroll = []
        }
        createDelay(t=10) {
            let e, i;
            const s = () => {
                e && clearTimeout(e),
                i && i()
            }
            ;
            return this.timeouts.push(s),
            () => new Promise(( (n, r) => {
                s(),
                i = r,
                e = setTimeout(( () => {
                    e = void 0,
                    i = void 0,
                    n()
                }
                ), t)
            }
            ))
        }
        convertColorValues(t) {
            if (!Array.isArray(t))
                return t || "";
            if (t.length < 2)
                return t[0] || "";
            const e = document.createElement("canvas")
              , i = e.getContext("2d")
              , s = e.height * (window.devicePixelRatio || 1)
              , n = i.createLinearGradient(0, 0, 0, s)
              , r = 1 / (t.length - 1);
            return t.forEach(( (t, e) => {
                const i = e * r;
                n.addColorStop(i, t)
            }
            )),
            n
        }
        getPixelRatio() {
            return Math.max(1, window.devicePixelRatio || 1)
        }
        renderBarWaveform(t, e, i, s) {
            const n = t[0]
              , r = t[1] || t[0]
              , o = n.length
              , {width: a, height: h} = i.canvas
              , l = h / 2
              , d = this.getPixelRatio()
              , c = e.barWidth ? e.barWidth * d : 1
              , u = e.barGap ? e.barGap * d : e.barWidth ? c / 2 : 0
              , p = e.barRadius || 0
              , m = a / (c + u) / o
              , f = p && "roundRect"in i ? "roundRect" : "rect";
            i.beginPath();
            let g = 0
              , v = 0
              , b = 0;
            for (let t = 0; t <= o; t++) {
                const o = Math.round(t * m);
                if (o > g) {
                    const t = Math.round(v * l * s)
                      , n = t + Math.round(b * l * s) || 1;
                    let r = l - t;
                    "top" === e.barAlign ? r = 0 : "bottom" === e.barAlign && (r = h - n),
                    i[f](g * (c + u), r, c, n, p),
                    g = o,
                    v = 0,
                    b = 0
                }
                const a = Math.abs(n[t] || 0)
                  , d = Math.abs(r[t] || 0);
                a > v && (v = a),
                d > b && (b = d)
            }
            i.fill(),
            i.closePath()
        }
        renderLineWaveform(t, e, i, s) {
            const n = e => {
                const n = t[e] || t[0]
                  , r = n.length
                  , {height: o} = i.canvas
                  , a = o / 2
                  , h = i.canvas.width / r;
                i.moveTo(0, a);
                let l = 0
                  , d = 0;
                for (let t = 0; t <= r; t++) {
                    const r = Math.round(t * h);
                    if (r > l) {
                        const t = a + (Math.round(d * a * s) || 1) * (0 === e ? -1 : 1);
                        i.lineTo(l, t),
                        l = r,
                        d = 0
                    }
                    const o = Math.abs(n[t] || 0);
                    o > d && (d = o)
                }
                i.lineTo(l, a)
            }
            ;
            i.beginPath(),
            n(0),
            n(1),
            i.fill(),
            i.closePath()
        }
        renderWaveform(t, e, i) {
            if (i.fillStyle = this.convertColorValues(e.waveColor),
            e.renderFunction)
                return void e.renderFunction(t, i);
            let s = e.barHeight || 1;
            if (e.normalize) {
                const e = Array.from(t[0]).reduce(( (t, e) => Math.max(t, Math.abs(e))), 0);
                s = e ? 1 / e : 1
            }
            e.barWidth || e.barGap || e.barAlign ? this.renderBarWaveform(t, e, i, s) : this.renderLineWaveform(t, e, i, s)
        }
        renderSingleCanvas(t, e, i, s, n, r, o) {
            const a = this.getPixelRatio()
              , h = document.createElement("canvas");
            h.width = Math.round(i * a),
            h.height = Math.round(s * a),
            h.style.width = `${i}px`,
            h.style.height = `${s}px`,
            h.style.left = `${Math.round(n)}px`,
            r.appendChild(h);
            const l = h.getContext("2d");
            if (this.renderWaveform(t, e, l),
            h.width > 0 && h.height > 0) {
                const t = h.cloneNode()
                  , i = t.getContext("2d");
                i.drawImage(h, 0, 0),
                i.globalCompositeOperation = "source-in",
                i.fillStyle = this.convertColorValues(e.progressColor),
                i.fillRect(0, 0, h.width, h.height),
                o.appendChild(t)
            }
        }
        renderMultiCanvas(t, e, i, s, n, r) {
            const o = this.getPixelRatio()
              , {clientWidth: a} = this.scrollContainer
              , l = i / o;
            let d = Math.min(h.MAX_CANVAS_WIDTH, a, l)
              , c = {};
            if (0 === d)
                return;
            if (e.barWidth || e.barGap) {
                const t = e.barWidth || .5
                  , i = t + (e.barGap || t / 2);
                d % i != 0 && (d = Math.floor(d / i) * i)
            }
            const u = i => {
                if (i < 0 || i >= p)
                    return;
                if (c[i])
                    return;
                c[i] = !0;
                const o = i * d
                  , a = Math.min(l - o, d);
                if (a <= 0)
                    return;
                const h = t.map((t => {
                    const e = Math.floor(o / l * t.length)
                      , i = Math.floor((o + a) / l * t.length);
                    return t.slice(e, i)
                }
                ));
                this.renderSingleCanvas(h, e, a, s, o, n, r)
            }
              , p = Math.ceil(l / d);
            if (!this.isScrollable) {
                for (let t = 0; t < p; t++)
                    u(t);
                return
            }
            const m = this.scrollContainer.scrollLeft / l
              , f = Math.floor(m * p);
            if (u(f - 1),
            u(f),
            u(f + 1),
            p > 1) {
                const t = this.on("scroll", ( () => {
                    const {scrollLeft: t} = this.scrollContainer
                      , e = Math.floor(t / l * p);
                    Object.keys(c).length > h.MAX_NODES && (n.innerHTML = "",
                    r.innerHTML = "",
                    c = {}),
                    u(e - 1),
                    u(e),
                    u(e + 1)
                }
                ));
                this.unsubscribeOnScroll.push(t)
            }
        }
        renderChannel(t, e, i, s) {
            var {overlay: n} = e
              , r = function(t, e) {
                var i = {};
                for (var s in t)
                    Object.prototype.hasOwnProperty.call(t, s) && e.indexOf(s) < 0 && (i[s] = t[s]);
                if (null != t && "function" == typeof Object.getOwnPropertySymbols) {
                    var n = 0;
                    for (s = Object.getOwnPropertySymbols(t); n < s.length; n++)
                        e.indexOf(s[n]) < 0 && Object.prototype.propertyIsEnumerable.call(t, s[n]) && (i[s[n]] = t[s[n]])
                }
                return i
            }(e, ["overlay"]);
            const o = document.createElement("div")
              , a = this.getHeight(r.height, r.splitChannels);
            o.style.height = `${a}px`,
            n && s > 0 && (o.style.marginTop = `-${a}px`),
            this.canvasWrapper.style.minHeight = `${a}px`,
            this.canvasWrapper.appendChild(o);
            const h = o.cloneNode();
            this.progressWrapper.appendChild(h),
            this.renderMultiCanvas(t, r, i, a, o, h)
        }
        render(e) {
            return t(this, void 0, void 0, (function*() {
                var t;
                this.timeouts.forEach((t => t())),
                this.timeouts = [],
                this.canvasWrapper.innerHTML = "",
                this.progressWrapper.innerHTML = "",
                null != this.options.width && (this.scrollContainer.style.width = "number" == typeof this.options.width ? `${this.options.width}px` : this.options.width);
                const i = this.getPixelRatio()
                  , s = this.scrollContainer.clientWidth
                  , n = Math.ceil(e.duration * (this.options.minPxPerSec || 0));
                this.isScrollable = n > s;
                const r = this.options.fillParent && !this.isScrollable
                  , o = (r ? s : n) * i;
                if (this.wrapper.style.width = r ? "100%" : `${n}px`,
                this.scrollContainer.style.overflowX = this.isScrollable ? "auto" : "hidden",
                this.scrollContainer.classList.toggle("noScrollbar", !!this.options.hideScrollbar),
                this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`,
                this.cursor.style.width = `${this.options.cursorWidth}px`,
                this.audioData = e,
                this.emit("render"),
                this.options.splitChannels)
                    for (let i = 0; i < e.numberOfChannels; i++) {
                        const s = Object.assign(Object.assign({}, this.options), null === (t = this.options.splitChannels) || void 0 === t ? void 0 : t[i]);
                        this.renderChannel([e.getChannelData(i)], s, o, i)
                    }
                else {
                    const t = [e.getChannelData(0)];
                    e.numberOfChannels > 1 && t.push(e.getChannelData(1)),
                    this.renderChannel(t, this.options, o, 0)
                }
                Promise.resolve().then(( () => this.emit("rendered")))
            }
            ))
        }
        reRender() {
            if (this.unsubscribeOnScroll.forEach((t => t())),
            this.unsubscribeOnScroll = [],
            !this.audioData)
                return;
            const {scrollWidth: t} = this.scrollContainer
              , {right: e} = this.progressWrapper.getBoundingClientRect();
            if (this.render(this.audioData),
            this.isScrollable && t !== this.scrollContainer.scrollWidth) {
                const {right: t} = this.progressWrapper.getBoundingClientRect();
                let i = t - e;
                i *= 2,
                i = i < 0 ? Math.floor(i) : Math.ceil(i),
                i /= 2,
                this.scrollContainer.scrollLeft += i
            }
        }
        zoom(t) {
            this.options.minPxPerSec = t,
            this.reRender()
        }
        scrollIntoView(t, e=!1) {
            const {scrollLeft: i, scrollWidth: s, clientWidth: n} = this.scrollContainer
              , r = t * s
              , o = i
              , a = i + n
              , h = n / 2;
            if (this.isDragging) {
                const t = 30;
                r + t > a ? this.scrollContainer.scrollLeft += t : r - t < o && (this.scrollContainer.scrollLeft -= t)
            } else {
                (r < o || r > a) && (this.scrollContainer.scrollLeft = r - (this.options.autoCenter ? h : 0));
                const t = r - i - h;
                e && this.options.autoCenter && t > 0 && (this.scrollContainer.scrollLeft += Math.min(t, 10))
            }
            {
                const t = this.scrollContainer.scrollLeft
                  , e = t / s
                  , i = (t + n) / s;
                this.emit("scroll", e, i, t, t + n)
            }
        }
        renderProgress(t, e) {
            if (isNaN(t))
                return;
            const i = 100 * t;
            this.canvasWrapper.style.clipPath = `polygon(${i}% 0, 100% 0, 100% 100%, ${i}% 100%)`,
            this.progressWrapper.style.width = `${i}%`,
            this.cursor.style.left = `${i}%`,
            this.cursor.style.transform = `translateX(-${100 === Math.round(i) ? this.options.cursorWidth : 0}px)`,
            this.isScrollable && this.options.autoScroll && this.scrollIntoView(t, e)
        }
        exportImage(e, i, s) {
            return t(this, void 0, void 0, (function*() {
                const t = this.canvasWrapper.querySelectorAll("canvas");
                if (!t.length)
                    throw new Error("No waveform data");
                if ("dataURL" === s) {
                    const s = Array.from(t).map((t => t.toDataURL(e, i)));
                    return Promise.resolve(s)
                }
                return Promise.all(Array.from(t).map((t => new Promise(( (s, n) => {
                    t.toBlob((t => {
                        t ? s(t) : n(new Error("Could not export image"))
                    }
                    ), e, i)
                }
                )))))
            }
            ))
        }
    }
    h.MAX_CANVAS_WIDTH = 8e3,
    h.MAX_NODES = 10;
    class l extends e {
        constructor() {
            super(...arguments),
            this.unsubscribe = () => {}
        }
        start() {
            this.unsubscribe = this.on("tick", ( () => {
                requestAnimationFrame(( () => {
                    this.emit("tick")
                }
                ))
            }
            )),
            this.emit("tick")
        }
        stop() {
            this.unsubscribe()
        }
        destroy() {
            this.unsubscribe()
        }
    }
    class d extends e {
        constructor(t=new AudioContext) {
            super(),
            this.bufferNode = null,
            this.playStartTime = 0,
            this.playedDuration = 0,
            this._muted = !1,
            this._playbackRate = 1,
            this._duration = void 0,
            this.buffer = null,
            this.currentSrc = "",
            this.paused = !0,
            this.crossOrigin = null,
            this.seeking = !1,
            this.autoplay = !1,
            this.addEventListener = this.on,
            this.removeEventListener = this.un,
            this.audioContext = t,
            this.gainNode = this.audioContext.createGain(),
            this.gainNode.connect(this.audioContext.destination)
        }
        load() {
            return t(this, void 0, void 0, (function*() {}
            ))
        }
        get src() {
            return this.currentSrc
        }
        set src(t) {
            if (this.currentSrc = t,
            this._duration = void 0,
            !t)
                return this.buffer = null,
                void this.emit("emptied");
            fetch(t).then((e => {
                if (e.status >= 400)
                    throw new Error(`Failed to fetch ${t}: ${e.status} (${e.statusText})`);
                return e.arrayBuffer()
            }
            )).then((e => this.currentSrc !== t ? null : this.audioContext.decodeAudioData(e))).then((e => {
                this.currentSrc === t && (this.buffer = e,
                this.emit("loadedmetadata"),
                this.emit("canplay"),
                this.autoplay && this.play())
            }
            ))
        }
        _play() {
            var t;
            if (!this.paused)
                return;
            this.paused = !1,
            null === (t = this.bufferNode) || void 0 === t || t.disconnect(),
            this.bufferNode = this.audioContext.createBufferSource(),
            this.buffer && (this.bufferNode.buffer = this.buffer),
            this.bufferNode.playbackRate.value = this._playbackRate,
            this.bufferNode.connect(this.gainNode);
            let e = this.playedDuration * this._playbackRate;
            (e >= this.duration || e < 0) && (e = 0,
            this.playedDuration = 0),
            this.bufferNode.start(this.audioContext.currentTime, e),
            this.playStartTime = this.audioContext.currentTime,
            this.bufferNode.onended = () => {
                this.currentTime >= this.duration && (this.pause(),
                this.emit("ended"))
            }
        }
        _pause() {
            var t;
            this.paused = !0,
            null === (t = this.bufferNode) || void 0 === t || t.stop(),
            this.playedDuration += this.audioContext.currentTime - this.playStartTime
        }
        play() {
            return t(this, void 0, void 0, (function*() {
                this.paused && (this._play(),
                this.emit("play"))
            }
            ))
        }
        pause() {
            this.paused || (this._pause(),
            this.emit("pause"))
        }
        stopAt(t) {
            var e, i;
            const s = t - this.currentTime;
            null === (e = this.bufferNode) || void 0 === e || e.stop(this.audioContext.currentTime + s),
            null === (i = this.bufferNode) || void 0 === i || i.addEventListener("ended", ( () => {
                this.bufferNode = null,
                this.pause()
            }
            ), {
                once: !0
            })
        }
        setSinkId(e) {
            return t(this, void 0, void 0, (function*() {
                return this.audioContext.setSinkId(e)
            }
            ))
        }
        get playbackRate() {
            return this._playbackRate
        }
        set playbackRate(t) {
            this._playbackRate = t,
            this.bufferNode && (this.bufferNode.playbackRate.value = t)
        }
        get currentTime() {
            return (this.paused ? this.playedDuration : this.playedDuration + (this.audioContext.currentTime - this.playStartTime)) * this._playbackRate
        }
        set currentTime(t) {
            const e = !this.paused;
            e && this._pause(),
            this.playedDuration = t / this._playbackRate,
            e && this._play(),
            this.emit("seeking"),
            this.emit("timeupdate")
        }
        get duration() {
            var t, e;
            return null !== (t = this._duration) && void 0 !== t ? t : (null === (e = this.buffer) || void 0 === e ? void 0 : e.duration) || 0
        }
        set duration(t) {
            this._duration = t
        }
        get volume() {
            return this.gainNode.gain.value
        }
        set volume(t) {
            this.gainNode.gain.value = t,
            this.emit("volumechange")
        }
        get muted() {
            return this._muted
        }
        set muted(t) {
            this._muted !== t && (this._muted = t,
            this._muted ? this.gainNode.disconnect() : this.gainNode.connect(this.audioContext.destination))
        }
        canPlayType(t) {
            return /^(audio|video)\//.test(t)
        }
        getGainNode() {
            return this.gainNode
        }
        getChannelData() {
            const t = [];
            if (!this.buffer)
                return t;
            const e = this.buffer.numberOfChannels;
            for (let i = 0; i < e; i++)
                t.push(this.buffer.getChannelData(i));
            return t
        }
    }
    const c = {
        waveColor: "#999",
        progressColor: "#555",
        cursorWidth: 1,
        minPxPerSec: 0,
        fillParent: !0,
        interact: !0,
        dragToSeek: !1,
        autoScroll: !0,
        autoCenter: !0,
        sampleRate: 8e3
    };
    class u extends a {
        static create(t) {
            return new u(t)
        }
        constructor(t) {
            const e = t.media || ("WebAudio" === t.backend ? new d : void 0);
            super({
                media: e,
                mediaControls: t.mediaControls,
                autoplay: t.autoplay,
                playbackRate: t.audioRate
            }),
            this.plugins = [],
            this.decodedData = null,
            this.stopAtPosition = null,
            this.subscriptions = [],
            this.mediaSubscriptions = [],
            this.abortController = null,
            this.options = Object.assign({}, c, t),
            this.timer = new l;
            const i = e ? void 0 : this.getMediaElement();
            this.renderer = new h(this.options,i),
            this.initPlayerEvents(),
            this.initRendererEvents(),
            this.initTimerEvents(),
            this.initPlugins();
            const s = this.options.url || this.getSrc() || "";
            Promise.resolve().then(( () => {
                this.emit("init");
                const {peaks: t, duration: e} = this.options;
                (s || t && e) && this.load(s, t, e).catch(( () => null))
            }
            ))
        }
        updateProgress(t=this.getCurrentTime()) {
            return this.renderer.renderProgress(t / this.getDuration(), this.isPlaying()),
            t
        }
        initTimerEvents() {
            this.subscriptions.push(this.timer.on("tick", ( () => {
                if (!this.isSeeking()) {
                    const t = this.updateProgress();
                    this.emit("timeupdate", t),
                    this.emit("audioprocess", t),
                    null != this.stopAtPosition && this.isPlaying() && t >= this.stopAtPosition && this.pause()
                }
            }
            )))
        }
        initPlayerEvents() {
            this.isPlaying() && (this.emit("play"),
            this.timer.start()),
            this.mediaSubscriptions.push(this.onMediaEvent("timeupdate", ( () => {
                const t = this.updateProgress();
                this.emit("timeupdate", t)
            }
            )), this.onMediaEvent("play", ( () => {
                this.emit("play"),
                this.timer.start()
            }
            )), this.onMediaEvent("pause", ( () => {
                this.emit("pause"),
                this.timer.stop(),
                this.stopAtPosition = null
            }
            )), this.onMediaEvent("emptied", ( () => {
                this.timer.stop(),
                this.stopAtPosition = null
            }
            )), this.onMediaEvent("ended", ( () => {
                this.emit("timeupdate", this.getDuration()),
                this.emit("finish"),
                this.stopAtPosition = null
            }
            )), this.onMediaEvent("seeking", ( () => {
                this.emit("seeking", this.getCurrentTime())
            }
            )), this.onMediaEvent("error", ( () => {
                var t;
                this.emit("error", null !== (t = this.getMediaElement().error) && void 0 !== t ? t : new Error("Media error")),
                this.stopAtPosition = null
            }
            )))
        }
        initRendererEvents() {
            this.subscriptions.push(this.renderer.on("click", ( (t, e) => {
                this.options.interact && (this.seekTo(t),
                this.emit("interaction", t * this.getDuration()),
                this.emit("click", t, e))
            }
            )), this.renderer.on("dblclick", ( (t, e) => {
                this.emit("dblclick", t, e)
            }
            )), this.renderer.on("scroll", ( (t, e, i, s) => {
                const n = this.getDuration();
                this.emit("scroll", t * n, e * n, i, s)
            }
            )), this.renderer.on("render", ( () => {
                this.emit("redraw")
            }
            )), this.renderer.on("rendered", ( () => {
                this.emit("redrawcomplete")
            }
            )), this.renderer.on("dragstart", (t => {
                this.emit("dragstart", t)
            }
            )), this.renderer.on("dragend", (t => {
                this.emit("dragend", t)
            }
            )));
            {
                let t;
                this.subscriptions.push(this.renderer.on("drag", (e => {
                    if (!this.options.interact)
                        return;
                    let i;
                    this.renderer.renderProgress(e),
                    clearTimeout(t),
                    this.isPlaying() ? i = 0 : !0 === this.options.dragToSeek ? i = 200 : "object" == typeof this.options.dragToSeek && void 0 !== this.options.dragToSeek && (i = this.options.dragToSeek.debounceTime),
                    t = setTimeout(( () => {
                        this.seekTo(e)
                    }
                    ), i),
                    this.emit("interaction", e * this.getDuration()),
                    this.emit("drag", e)
                }
                )))
            }
        }
        initPlugins() {
            var t;
            (null === (t = this.options.plugins) || void 0 === t ? void 0 : t.length) && this.options.plugins.forEach((t => {
                this.registerPlugin(t)
            }
            ))
        }
        unsubscribePlayerEvents() {
            this.mediaSubscriptions.forEach((t => t())),
            this.mediaSubscriptions = []
        }
        setOptions(t) {
            this.options = Object.assign({}, this.options, t),
            t.duration && !t.peaks && (this.decodedData = i.createBuffer(this.exportPeaks(), t.duration)),
            t.peaks && t.duration && (this.decodedData = i.createBuffer(t.peaks, t.duration)),
            this.renderer.setOptions(this.options),
            t.audioRate && this.setPlaybackRate(t.audioRate),
            null != t.mediaControls && (this.getMediaElement().controls = t.mediaControls)
        }
        registerPlugin(t) {
            return t._init(this),
            this.plugins.push(t),
            this.subscriptions.push(t.once("destroy", ( () => {
                this.plugins = this.plugins.filter((e => e !== t))
            }
            ))),
            t
        }
        getWrapper() {
            return this.renderer.getWrapper()
        }
        getWidth() {
            return this.renderer.getWidth()
        }
        getScroll() {
            return this.renderer.getScroll()
        }
        setScroll(t) {
            return this.renderer.setScroll(t)
        }
        setScrollTime(t) {
            const e = t / this.getDuration();
            this.renderer.setScrollPercentage(e)
        }
        getActivePlugins() {
            return this.plugins
        }
        loadAudio(e, s, n, r) {
            return t(this, void 0, void 0, (function*() {
                var t;
                if (this.emit("load", e),
                !this.options.media && this.isPlaying() && this.pause(),
                this.decodedData = null,
                this.stopAtPosition = null,
                !s && !n) {
                    const i = this.options.fetchParams || {};
                    window.AbortController && !i.signal && (this.abortController = new AbortController,
                    i.signal = null === (t = this.abortController) || void 0 === t ? void 0 : t.signal);
                    const n = t => this.emit("loading", t);
                    s = yield o.fetchBlob(e, n, i);
                    const r = this.options.blobMimeType;
                    r && (s = new Blob([s],{
                        type: r
                    }))
                }
                this.setSrc(e, s);
                const a = yield new Promise((t => {
                    const e = r || this.getDuration();
                    e ? t(e) : this.mediaSubscriptions.push(this.onMediaEvent("loadedmetadata", ( () => t(this.getDuration())), {
                        once: !0
                    }))
                }
                ));
                if (!e && !s) {
                    const t = this.getMediaElement();
                    t instanceof d && (t.duration = a)
                }
                if (n)
                    this.decodedData = i.createBuffer(n, a || 0);
                else if (s) {
                    const t = yield s.arrayBuffer();
                    this.decodedData = yield i.decode(t, this.options.sampleRate)
                }
                this.decodedData && (this.emit("decode", this.getDuration()),
                this.renderer.render(this.decodedData)),
                this.emit("ready", this.getDuration())
            }
            ))
        }
        load(e, i, s) {
            return t(this, void 0, void 0, (function*() {
                try {
                    return yield this.loadAudio(e, void 0, i, s)
                } catch (t) {
                    throw this.emit("error", t),
                    t
                }
            }
            ))
        }
        loadBlob(e, i, s) {
            return t(this, void 0, void 0, (function*() {
                try {
                    return yield this.loadAudio("", e, i, s)
                } catch (t) {
                    throw this.emit("error", t),
                    t
                }
            }
            ))
        }
        zoom(t) {
            if (!this.decodedData)
                throw new Error("No audio loaded");
            this.renderer.zoom(t),
            this.emit("zoom", t)
        }
        getDecodedData() {
            return this.decodedData
        }
        exportPeaks({channels: t=2, maxLength: e=8e3, precision: i=1e4}={}) {
            if (!this.decodedData)
                throw new Error("The audio has not been decoded yet");
            const s = Math.min(t, this.decodedData.numberOfChannels)
              , n = [];
            for (let t = 0; t < s; t++) {
                const s = this.decodedData.getChannelData(t)
                  , r = []
                  , o = s.length / e;
                for (let t = 0; t < e; t++) {
                    const e = s.slice(Math.floor(t * o), Math.ceil((t + 1) * o));
                    let n = 0;
                    for (let t = 0; t < e.length; t++) {
                        const i = e[t];
                        Math.abs(i) > Math.abs(n) && (n = i)
                    }
                    r.push(Math.round(n * i) / i)
                }
                n.push(r)
            }
            return n
        }
        getDuration() {
            let t = super.getDuration() || 0;
            return 0 !== t && t !== 1 / 0 || !this.decodedData || (t = this.decodedData.duration),
            t
        }
        toggleInteraction(t) {
            this.options.interact = t
        }
        setTime(t) {
            this.stopAtPosition = null,
            super.setTime(t),
            this.updateProgress(t),
            this.emit("timeupdate", t)
        }
        seekTo(t) {
            const e = this.getDuration() * t;
            this.setTime(e)
        }
        play(e, i) {
            const s = Object.create(null, {
                play: {
                    get: () => super.play
                }
            });
            return t(this, void 0, void 0, (function*() {
                return null != e && this.setTime(e),
                null != i && (this.media instanceof d ? this.media.stopAt(i) : this.stopAtPosition = i),
                s.play.call(this)
            }
            ))
        }
        playPause() {
            return t(this, void 0, void 0, (function*() {
                return this.isPlaying() ? this.pause() : this.play()
            }
            ))
        }
        stop() {
            this.pause(),
            this.setTime(0)
        }
        skip(t) {
            this.setTime(this.getCurrentTime() + t)
        }
        empty() {
            this.load("", [[0]], .001)
        }
        setMediaElement(t) {
            this.unsubscribePlayerEvents(),
            super.setMediaElement(t),
            this.initPlayerEvents()
        }
        exportImage() {
            return t(this, arguments, void 0, (function*(t="image/png", e=1, i="dataURL") {
                return this.renderer.exportImage(t, e, i)
            }
            ))
        }
        destroy() {
            var t;
            this.emit("destroy"),
            null === (t = this.abortController) || void 0 === t || t.abort(),
            this.plugins.forEach((t => t.destroy())),
            this.subscriptions.forEach((t => t())),
            this.unsubscribePlayerEvents(),
            this.timer.destroy(),
            this.renderer.destroy(),
            super.destroy()
        }
    }
    return u.BasePlugin = class extends e {
        constructor(t) {
            super(),
            this.subscriptions = [],
            this.options = t
        }
        onInit() {}
        _init(t) {
            this.wavesurfer = t,
            this.onInit()
        }
        destroy() {
            this.emit("destroy"),
            this.subscriptions.forEach((t => t()))
        }
    }
    ,
    u.dom = r,
    u
}
));
