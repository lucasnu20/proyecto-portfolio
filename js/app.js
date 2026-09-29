/* =============================================================================
   APP.JS — Portfolio de artista · v2 "Recorrido"
   =============================================================================
   ⚠ Para agregar o cambiar OBRAS no hace falta tocar este archivo:
     editá js/obras.js.

   Módulos (cada bloque es independiente):
     · CONFIG       Ajustes generales (montaje, portada, formulario)
     · Utilidades
     · Datos        Lee y valida OBRAS y FRAGMENTOS de obras.js
     · Motor        Bucle de animación: parallax con inercia, mouse, cursor
     · Salas        Cambia el ambiente (claro / oscuro / azul) según la sección
     · Aparicion    Los elementos "llegan flotando" al entrar en pantalla
     · Navegacion   Menú, header que se oculta, riel de recorrido
     · Portada      Obras flotando alrededor del nombre
     · Galeria      Montaje de salón flotante + vista Índice + filtros
     · Cita         Frase grande con palabras a distintas velocidades
     · Contacto     Obras a la deriva en la sala azul
     · Cursor       Cursor personalizado ("Ver" sobre las obras)
     · Visor        Lightbox accesible (Escape, clic afuera, flechas, swipe)
     · Formulario   Envío sin recargar (Formspree o EmailJS)

   Todo el movimiento se desactiva si la persona tiene activada la opción
   "reducir movimiento" en su sistema operativo (accesibilidad).
   Scripts clásicos (no módulos ES) para que funcione con doble clic, sin servidor.
   ========================================================================== */

(function () {
  "use strict";

  /* ===========================================================================
     CONFIG
     ======================================================================== */
  const CONFIG = {
    formPlaceholder: "TU_CODIGO",
    emailFallback: "hola@luciamoreno.art",   // ✎ EDITAR: se muestra si el envío falla
    masonryRow: 8,                            // = grid-auto-rows de .salon en styles.css
    filtroTodas: "Todas",
    fragmentoCada: 4,                         // intercala un fragmento de texto cada N obras

    /* MONTAJE DE LA SALA: patrón que se repite para dar un colgado "libre".
       w     = ancho de la obra dentro de su columna (%)
       mt    = desplazamiento vertical extra (px)
       align = alineación en la columna: flex-start | center | flex-end
       prof  = profundidad del parallax (+ se mueve más lento, − más rápido) */
    montaje: [
      { w: 100, mt: 0,   align: "flex-start", prof: 0.05 },
      { w: 78,  mt: 110, align: "flex-end",   prof: -0.07 },
      { w: 88,  mt: 40,  align: "center",     prof: 0.09 },
      { w: 74,  mt: 70,  align: "flex-start", prof: -0.04 },
      { w: 94,  mt: 10,  align: "flex-end",   prof: 0.07 },
      { w: 82,  mt: 130, align: "center",     prof: -0.09 }
    ],

    /* PORTADA: posiciones de las obras flotantes (hasta 6).
       x, y = posición en % de la pantalla · w = ancho base en vw
       xm, ym, wm = lo mismo en celulares (si faltan, la obra no se muestra en móvil)
       prof = profundidad: < 0.5 lejos (más chica, desenfocada) · > 1 cerca (encima del nombre)
       rot  = leve rotación en grados */
    portada: [
      { x: 5,  y: 15, w: 14, xm: -5, ym: 10, wm: 34, prof: 0.8,  rot: -3 },
      { x: 75, y: 12, w: 15, xm: 63, ym: 9,  wm: 38, prof: 1.2,  rot: 2.5 },
      { x: 83, y: 57, w: 11, xm: 70, ym: 73, wm: 30, prof: 0.4,  rot: -2 },
      { x: 9,  y: 63, w: 12, xm: 3,  ym: 75, wm: 30, prof: 1.35, rot: 3 },
      { x: 34, y: 80, w: 9,  prof: 0.3, rot: -1.5 },
      { x: 67, y: 77, w: 8,  prof: 0.5, rot: 4 }
    ]
  };


  /* ===========================================================================
     UTILIDADES
     ======================================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const punteroFino  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esMovil      = () => window.matchMedia("(max-width: 860px)").matches;

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const parrafos = (t) => String(t ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

  const textoAlt = (o) => o.alt || `${o.titulo}, ${o.anio}. ${o.tecnica}, ${o.medidas}.`;
  const miniatura = (o) => o.url_miniatura || o.url_imagen;
  const num = (n) => String(n).padStart(2, "0");

  // Número pseudoaleatorio estable (misma obra → mismo ritmo de flotación)
  const azar = (semilla) => {
    let h = 0;
    for (const c of String(semilla)) h = (h * 31 + c.charCodeAt(0)) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
  const ritmo = (semilla) => {
    const r = azar(semilla);
    return `--dur:${(8 + r * 6).toFixed(2)}s; --delay:${(-r * 12).toFixed(2)}s; --amp:${(-8 - r * 10).toFixed(1)}px; --sway:${(r - .5).toFixed(2)}deg`;
  };

  // Al cargar una imagen: fija su proporción real y la muestra (de borrosa a nítida)
  const alCargar = (img, cb) => {
    const listo = () => {
      if (img.naturalWidth) img.style.setProperty("--ratio", `${img.naturalWidth} / ${img.naturalHeight}`);
      img.classList.add("is-loaded");
      if (cb) cb(img);
    };
    if (img.complete && img.naturalWidth) listo();
    else {
      img.addEventListener("load", listo, { once: true });
      img.addEventListener("error", () => {
        img.classList.add("is-loaded");
        console.warn(`[Portfolio] No se pudo cargar "${img.getAttribute("src")}". Revisá la ruta y el nombre del archivo.`);
      }, { once: true });
    }
  };


  /* ===========================================================================
     DATOS
     ======================================================================== */
  const Datos = {
    obras: [], categorias: [], fragmentos: [],

    cargar() {
      if (typeof OBRAS === "undefined" || !Array.isArray(OBRAS)) {
        console.error("[Portfolio] No se encontró la lista OBRAS. Revisá que js/obras.js exista, que se cargue antes que app.js y que no tenga errores de sintaxis (coma o comilla faltante).");
        return;
      }
      const requeridos = ["id", "titulo", "anio", "tecnica", "medidas", "categoria", "descripcion", "url_imagen"];
      const usados = new Set();

      this.obras = OBRAS.map((obra, i) => {
        if (!obra || typeof obra !== "object") return null;
        const faltan = requeridos.filter((k) => obra[k] === undefined || obra[k] === "");
        if (faltan.length) console.warn(`[Portfolio] La obra n.º ${i + 1} ("${obra.titulo || "sin título"}") no tiene: ${faltan.join(", ")}.`);
        if (!obra.url_imagen) return null;

        let id = String(obra.id || obra.titulo || `obra-${i + 1}`).toLowerCase()
          .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (usados.has(id)) {
          console.warn(`[Portfolio] El id "${id}" está repetido (obra n.º ${i + 1}). Cambialo en obras.js.`);
          id = `${id}-${i + 1}`;
        }
        usados.add(id);
        return { ...obra, id, n: i + 1, categoria: String(obra.categoria || "Otros").trim() };
      }).filter(Boolean);

      const presentes = [...new Set(this.obras.map((o) => o.categoria))];
      const orden = typeof ORDEN_CATEGORIAS !== "undefined" && Array.isArray(ORDEN_CATEGORIAS) ? ORDEN_CATEGORIAS : [];
      this.categorias = [...orden.filter((c) => presentes.includes(c)), ...presentes.filter((c) => !orden.includes(c))];

      this.fragmentos = (typeof FRAGMENTOS !== "undefined" && Array.isArray(FRAGMENTOS) ? FRAGMENTOS : [])
        .filter((f) => f && f.texto);
    },

    porId(id) { return this.obras.find((o) => o.id === id); },

    deportada() {
      const marcadas = this.obras.filter((o) => o.portada);
      return (marcadas.length ? marcadas : this.obras).slice(0, CONFIG.portada.length);
    }
  };


  /* ===========================================================================
     MOTOR — un único bucle de animación para todo el sitio.
     Las "capas" se desplazan con el scroll a distinta velocidad (parallax)
     y con inercia (siguen al scroll con un pequeño retraso), lo que da la
     sensación de objetos suspendidos en el aire.
     ======================================================================== */
  const Motor = {
    activo: !reduceMotion,
    capas: [],
    mapa: new Map(),
    tareas: [],
    mouse: { x: 0, y: 0, tx: 0, ty: 0, px: -100, py: -100 },

    init() {
      if (!this.activo) return;
      window.addEventListener("pointermove", (e) => {
        this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
        this.mouse.px = e.clientX;
        this.mouse.py = e.clientY;
      }, { passive: true });

      this.io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { const c = this.mapa.get(e.target); if (c) c.visible = e.isIntersecting; });
      }, { rootMargin: "25% 0px 25% 0px" });

      const tick = () => { this.frame(); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    },

    // Registra un elemento para que flote con el scroll (depth: -0.2 … 0.2)
    registrar(el, depth) {
      if (!this.activo || !el || this.mapa.has(el)) return;
      const c = { el, depth, y: 0, visible: false };
      this.capas.push(c);
      this.mapa.set(el, c);
      this.io.observe(el);
    },

    alCuadro(fn) { if (this.activo) this.tareas.push(fn); },

    frame() {
      const m = this.mouse;
      m.x += (m.tx - m.x) * 0.06;
      m.y += (m.ty - m.y) * 0.06;

      const mitad = window.innerHeight / 2;
      const vis = this.capas.filter((c) => c.visible && c.el.offsetParent !== null);
      // 1) leer todas las posiciones  2) escribir todas las transformaciones
      const dist = vis.map((c) => {
        const r = c.el.getBoundingClientRect();
        return r.top + r.height / 2 - c.y - mitad;
      });
      vis.forEach((c, i) => {
        const destino = -dist[i] * c.depth;
        c.y += (destino - c.y) * 0.09;
        c.el.style.transform = `translate3d(0, ${c.y.toFixed(2)}px, 0)`;
      });
      for (const fn of this.tareas) fn(m);
    }
  };


  /* ===========================================================================
     SALAS — el ambiente cambia según la sección que está en el centro
     ======================================================================== */
  const Salas = {
    colores: { light: "#eceae4", dark: "#111110", blue: "#2331c8" },
    init() {
      const meta = $('meta[name="theme-color"]');
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const sala = e.target.dataset.room || "light";
          document.documentElement.dataset.room = sala;
          if (meta && this.colores[sala]) meta.setAttribute("content", this.colores[sala]);
        });
      }, { rootMargin: "-48% 0px -48% 0px" });
      $$("[data-room]").forEach((s) => { if (s !== document.documentElement) io.observe(s); });
    }
  };


  /* ===========================================================================
     APARICIÓN — fade + desenfoque → nítido al entrar en pantalla
     ======================================================================== */
  const Aparicion = {
    io: null,
    init() {
      if (!("IntersectionObserver" in window) || reduceMotion) { this.observar(document); return; }
      this.io = new IntersectionObserver((entradas) => {
        let n = 0;
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.style.setProperty("--reveal-delay", `${Math.min(n++, 6) * 90}ms`);
          e.target.classList.add("is-visible");
          this.io.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      this.observar(document);
    },
    observar(ctx) {
      $$("[data-reveal]:not(.is-visible)", ctx).forEach((el) => {
        if (this.io) this.io.observe(el); else el.classList.add("is-visible");
      });
    }
  };


  /* ===========================================================================
     NAVEGACIÓN
     ======================================================================== */
  const Navegacion = {
    init() {
      this.header = $(".site-header");
      this.toggle = $(".nav-toggle");
      this.nav = $("#site-nav");
      this.fill = $("#rail-fill");
      if (!this.header) return;

      this.toggle?.addEventListener("click", () => this.setAbierto(!this.abierto()));
      this.nav?.addEventListener("click", (e) => { if (e.target.closest("a")) this.setAbierto(false); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.abierto()) { this.setAbierto(false); this.toggle.focus(); }
      });
      window.matchMedia("(min-width: 861px)").addEventListener("change", (m) => { if (m.matches) this.setAbierto(false); });

      // Header: fondo al bajar; se esconde al scrollear hacia abajo y vuelve al subir
      let ultimo = window.scrollY, pendiente = false;
      const alScroll = () => {
        const y = window.scrollY;
        this.header.classList.toggle("is-scrolled", y > 10);
        const ocultar = y > window.innerHeight * 0.9 && y > ultimo + 4 && !this.abierto();
        if (ocultar) this.header.classList.add("is-hidden");
        else if (y < ultimo - 4 || y < window.innerHeight * 0.9) this.header.classList.remove("is-hidden");
        ultimo = y;
        if (this.fill) {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          this.fill.style.height = `${total > 0 ? (y / total) * 100 : 0}%`;
        }
        pendiente = false;
      };
      window.addEventListener("scroll", () => {
        if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); }
      }, { passive: true });
      alScroll();

      // Marca la sala actual en el menú y en el riel
      const enlaces = $$(".nav-list a, .rail a");
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          enlaces.forEach((a) => {
            if (a.getAttribute("href") === `#${e.target.id}`) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("main > section[id]").forEach((s) => io.observe(s));
    },

    abierto() { return this.toggle?.getAttribute("aria-expanded") === "true"; },

    setAbierto(v) {
      if (!this.toggle) return;
      this.toggle.setAttribute("aria-expanded", String(v));
      $(".nav-toggle-text", this.toggle).textContent = v ? "Cerrar" : "Menú";
      this.nav.classList.toggle("is-open", v);
      this.header.classList.toggle("menu-open", v);
      this.header.classList.remove("is-hidden");
      document.documentElement.classList.toggle("lb-open", v);   // bloquea el scroll de fondo
    }
  };


  /* ===========================================================================
     PORTADA — obras flotando alrededor del nombre
     ======================================================================== */
  const Portada = {
    init() {
      const espacio = $("#hero-space");
      if (!espacio || !Datos.obras.length) return;

      const piezas = Datos.deportada();
      const conteo = $("#hero-count");
      if (conteo) conteo.textContent = Datos.obras.length;

      // Atmósfera: resplandor desenfocado de la primera obra
      const aura = $("#hero-aura");
      if (aura && piezas[0]) aura.style.backgroundImage = `url("${miniatura(piezas[0])}")`;

      espacio.innerHTML = piezas.map((o, i) => {
        const s = CONFIG.portada[i];
        const lejos = s.prof < 0.5;
        const vars = [
          `--x:${s.x}%`, `--y:${s.y}%`, `--w:${s.w}vw`,
          s.xm !== undefined ? `--xm:${s.xm}%; --ym:${s.ym}%; --wm:${s.wm}vw` : "",
          `--rot:${s.rot}deg`,
          `--z:${s.prof > 1 ? 6 : lejos ? 1 : 3}`,
          `--blur:${lejos ? 1.6 : 0}px`,
          `--alpha:${lejos ? 0.72 : 1}`,
          `--in-delay:${(0.25 + i * 0.16).toFixed(2)}s`
        ].filter(Boolean).join("; ");
        return `
          <div class="hero-piece${s.xm === undefined ? " no-mobile" : ""}" style="${vars}" data-i="${i}">
            <div class="hp-par">
              <button type="button" data-id="${esc(o.id)}" data-cursor="Ver" aria-haspopup="dialog"
                      aria-label="${esc(o.titulo)}, ${esc(o.anio)}. Ver ficha">
                <span class="bob" style="${ritmo(o.id)}">
                  <span class="frame${o.sin_marco ? " no-mat" : ""}">
                    <img src="${esc(miniatura(o))}" alt="${esc(textoAlt(o))}" decoding="async">
                  </span>
                </span>
              </button>
            </div>
          </div>`;
      }).join("");

      // Ajusta el ancho según la proporción real (las horizontales, un poco más anchas)
      $$(".hero-piece", espacio).forEach((p) => {
        const img = $("img", p);
        alCargar(img, () => {
          const f = Math.min(1.55, Math.max(0.78, Math.sqrt(img.naturalWidth / img.naturalHeight)));
          const s = CONFIG.portada[+p.dataset.i];
          p.style.setProperty("--w", `${(s.w * f).toFixed(2)}vw`);
          if (s.wm) p.style.setProperty("--wm", `${(s.wm * f).toFixed(2)}vw`);
        });
      });

      espacio.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-id]");
        if (b) Visor.abrir(b.dataset.id, b, Datos.obras);
      });

      // Entrada escalonada
      requestAnimationFrame(() => requestAnimationFrame(() =>
        $$(".hero-piece", espacio).forEach((p) => p.classList.add("is-in"))));

      // Movimiento: siguen al mouse según su profundidad y se alejan al hacer scroll
      const capas = $$(".hero-piece", espacio).map((p) => ({
        el: $(".hp-par", p), prof: CONFIG.portada[+p.dataset.i].prof
      }));
      const contenido = $(".hero-content");
      Motor.alCuadro((m) => {
        const y = window.scrollY;
        if (y > window.innerHeight * 1.3) return;
        for (const c of capas) {
          const tx = m.x * c.prof * 28;
          const ty = m.y * c.prof * 18 - y * c.prof * 0.45;
          c.el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
        }
        if (contenido) {
          contenido.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
          contenido.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.85)).toFixed(3);
        }
      });
    }
  };


  /* ===========================================================================
     GALERÍA — montaje de salón + índice + filtros
     ======================================================================== */
  const Galeria = {
    filtro: CONFIG.filtroTodas,
    vista: "sala",

    init() {
      this.salon = $("#gallery");
      this.indice = $("#index-list");
      this.filtros = $("#filters");
      this.contador = $("#gallery-count");
      if (!this.salon) return;

      if (!Datos.obras.length) {
        this.salon.innerHTML = `<li class="gallery-empty">Todavía no hay obras cargadas. Agregalas en <code>js/obras.js</code>.</li>`;
        return;
      }

      this.renderFiltros();
      this.renderSala();
      this.renderIndice();
      this.masonry();
      this.vistas();
      this.inclinacion();
      this.vistaPrevia();

      const abrir = (e) => {
        const b = e.target.closest("[data-id]");
        if (b && (b.matches(".piece") || b.matches(".index-row"))) Visor.abrir(b.dataset.id, b);
      };
      this.salon.addEventListener("click", abrir);
      this.indice.addEventListener("click", abrir);

      this.actualizarContador();
      Aparicion.observar(this.salon);
    },

    renderFiltros() {
      if (!this.filtros) return;
      if (Datos.categorias.length < 2) { this.filtros.hidden = true; return; }
      const cuenta = (c) => Datos.obras.filter((o) => o.categoria === c).length;
      const boton = (c, n) => `<button class="filter" type="button" data-filtro="${esc(c)}" aria-pressed="${c === this.filtro}">${esc(c)} <span class="filter-count" aria-hidden="true">${n}</span></button>`;
      this.filtros.innerHTML = boton(CONFIG.filtroTodas, Datos.obras.length) +
        Datos.categorias.map((c) => boton(c, cuenta(c))).join("");
      this.filtros.addEventListener("click", (e) => {
        const b = e.target.closest(".filter");
        if (b) this.aplicarFiltro(b.dataset.filtro);
      });
    },

    renderSala() {
      const items = [];
      let f = 0;
      Datos.obras.forEach((o, i) => {
        items.push({ tipo: "obra", o });
        if ((i + 1) % CONFIG.fragmentoCada === 0 && f < Datos.fragmentos.length && i < Datos.obras.length - 1) {
          items.push({ tipo: "frag", t: Datos.fragmentos[f++] });
        }
      });

      this.salon.innerHTML = items.map((it, k) => {
        const m = CONFIG.montaje[k % CONFIG.montaje.length];
        const estilo = `--w:${it.o?.destacada ? 100 : m.w}; --mt:${m.mt}; --align:${m.align}`;

        if (it.tipo === "frag") {
          return `
            <li class="salon-item salon-fragment" data-fragmento data-depth="${m.prof * 1.6}" data-reveal style="--mt:${m.mt}; --align:${m.align}">
              <blockquote class="fragment bob" style="${ritmo(it.t.texto)}">
                <p>${esc(it.t.texto)}</p>
                ${it.t.firma ? `<footer class="fragment-sign kicker">— ${esc(it.t.firma)}</footer>` : ""}
              </blockquote>
            </li>`;
        }
        const o = it.o;
        return `
          <li class="salon-item${o.destacada ? " is-featured" : ""}" data-id-item="${esc(o.id)}" data-categoria="${esc(o.categoria)}" data-depth="${m.prof}" data-reveal style="${estilo}">
            <button class="piece" type="button" data-id="${esc(o.id)}" data-cursor="Ver" aria-haspopup="dialog"
                    aria-label="${esc(o.titulo)}, ${esc(o.anio)}. ${esc(o.tecnica)}. Ver ficha completa">
              <span class="bob" style="${ritmo(o.id)}">
                <span class="frame${o.sin_marco ? " no-mat" : ""}">
                  <img src="${esc(miniatura(o))}" alt="${esc(textoAlt(o))}" loading="${o.n <= 4 ? "eager" : "lazy"}" decoding="async">
                </span>
              </span>
              <span class="drop" style="${ritmo(o.id)}"></span>
              <span class="piece-label">
                <span class="piece-num">N.º ${num(o.n)}</span>
                <span class="piece-title">${esc(o.titulo)}</span>
                <span class="piece-year">${esc(o.anio)}</span>
                <span class="piece-meta">${esc(o.tecnica)} · ${esc(o.medidas)}</span>
              </span>
            </button>
          </li>`;
      }).join("");

      $$("img", this.salon).forEach((img) => alCargar(img));
      $$("[data-depth]", this.salon).forEach((el) => Motor.registrar(el, parseFloat(el.dataset.depth) || 0));
    },

    renderIndice() {
      this.indice.innerHTML = Datos.obras.map((o) => `
        <li data-id-item="${esc(o.id)}" data-categoria="${esc(o.categoria)}">
          <button class="index-row" type="button" data-id="${esc(o.id)}" data-img="${esc(miniatura(o))}" aria-haspopup="dialog">
            <span class="idx-thumb"><img src="${esc(miniatura(o))}" alt="" loading="lazy"></span>
            <span class="idx-num">${num(o.n)}</span>
            <span class="idx-title">${esc(o.titulo)}</span>
            <span class="idx-cat">${esc(o.categoria)}</span>
            <span class="idx-tech">${esc(o.tecnica)}</span>
            <span class="idx-year">${esc(o.anio)}</span>
          </button>
        </li>`).join("");
    },

    // Masonry: cada ítem ocupa tantas filas de 8px como mida (ResizeObserver)
    masonry() {
      const ajustar = (item) => {
        const alto = item.getBoundingClientRect().height;
        if (alto > 0) item.style.gridRowEnd = `span ${Math.ceil(alto / CONFIG.masonryRow)}`;
      };
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver((es) => es.forEach((e) => ajustar(e.target)));
        $$(".salon-item", this.salon).forEach((it) => ro.observe(it));
      } else {
        const todo = () => $$(".salon-item", this.salon).forEach(ajustar);
        window.addEventListener("resize", todo);
        window.addEventListener("load", todo);
      }
    },

    vistas() {
      $$(".view-btn").forEach((b) => b.addEventListener("click", () => {
        this.vista = b.dataset.view;
        $$(".view-btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        this.salon.hidden = this.vista !== "sala";
        this.indice.hidden = this.vista !== "indice";
      }));
    },

    aplicarFiltro(cat) {
      if (cat === this.filtro) return;
      this.filtro = cat;
      $$(".filter", this.filtros).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtro === cat)));

      const cambiar = () => {
        const todas = cat === CONFIG.filtroTodas;
        $$("[data-categoria]", this.salon).forEach((it) => { it.hidden = !(todas || it.dataset.categoria === cat); });
        $$("[data-fragmento]", this.salon).forEach((it) => { it.hidden = !todas; });
        $$("[data-categoria]", this.indice).forEach((it) => { it.hidden = !(todas || it.dataset.categoria === cat); });
        this.actualizarContador();
        this.salon.classList.remove("is-filtering");
      };
      if (reduceMotion) cambiar();
      else { this.salon.classList.add("is-filtering"); clearTimeout(this._t); this._t = setTimeout(cambiar, 350); }
    },

    actualizarContador() {
      if (!this.contador) return;
      const n = this.visibles().length;
      const txt = `${n} ${n === 1 ? "obra" : "obras"}`;
      this.contador.textContent = this.filtro === CONFIG.filtroTodas ? `${txt} · 2022 — 2026` : `${txt} · ${this.filtro}`;
    },

    visibles() {
      return Datos.obras.filter((o) => this.filtro === CONFIG.filtroTodas || o.categoria === this.filtro);
    },

    botonDe(id) {
      const sel = CSS.escape(id);
      return $(`[data-id-item="${sel}"]:not([hidden]) [data-id]`, this.vista === "sala" ? this.salon : this.indice);
    },

    // Inclinación 3D suave del marco siguiendo el mouse
    inclinacion() {
      if (!punteroFino || reduceMotion) return;
      this.salon.addEventListener("pointermove", (e) => {
        const p = e.target.closest(".piece");
        if (!p) return;
        const fr = $(".frame", p);
        const r = fr.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        fr.style.setProperty("--ry", `${(dx * 8).toFixed(2)}deg`);
        fr.style.setProperty("--rx", `${(-dy * 8).toFixed(2)}deg`);
      });
      this.salon.addEventListener("pointerout", (e) => {
        const p = e.target.closest(".piece");
        if (p && !p.contains(e.relatedTarget)) {
          const fr = $(".frame", p);
          fr.style.removeProperty("--rx");
          fr.style.removeProperty("--ry");
        }
      });
    },

    // Vista previa flotante al recorrer el índice con el mouse
    vistaPrevia() {
      const prev = $("#index-preview");
      if (!prev || !punteroFino || reduceMotion) return;
      const img = $("img", prev);
      let x = 0, y = 0;
      this.indice.addEventListener("pointerover", (e) => {
        const row = e.target.closest(".index-row");
        if (!row) return;
        if (img.getAttribute("src") !== row.dataset.img) img.src = row.dataset.img;
        prev.classList.add("is-visible");
      });
      this.indice.addEventListener("pointerleave", () => prev.classList.remove("is-visible"));
      Motor.alCuadro((m) => {
        if (!prev.classList.contains("is-visible")) return;
        x += (m.px + 28 - x) * 0.14;
        y += (m.py - prev.offsetHeight / 2 - y) * 0.14;
        prev.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(m.x * 3).toFixed(2)}deg)`;
      });
    }
  };


  /* ===========================================================================
     CITA — cada palabra de la frase grande flota a su propia velocidad
     ======================================================================== */
  const Cita = {
    init() {
      $$("[data-split]").forEach((p) => {
        const envolver = (nodo) => {
          [...nodo.childNodes].forEach((n) => {
            if (n.nodeType === 3) {
              const frag = document.createDocumentFragment();
              n.textContent.split(/(\s+)/).forEach((parte) => {
                if (!parte) return;
                if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
                const s = document.createElement("span");
                s.className = "word";
                s.textContent = parte;
                frag.appendChild(s);
              });
              n.replaceWith(frag);
            } else if (n.nodeType === 1) envolver(n);
          });
        };
        envolver(p);
        const k = esMovil() ? 0.4 : 1;   // en celulares, menos dispersión para que se lea bien
        $$(".word", p).forEach((w, i) => Motor.registrar(w, [0.03, -0.05, 0.065, -0.02, 0.045, -0.06][i % 6] * k));
      });
    }
  };


  /* ===========================================================================
     CONTACTO — obras pequeñas a la deriva en la sala azul (decorativas)
     ======================================================================== */
  const Contacto = {
    posiciones: [
      { x: 62, y: 4,  w: 9,  prof: -0.12, blur: 0 },
      { x: 90, y: 3,  w: 6,  prof: 0.1,   blur: 2 },
      { x: 42, y: 60, w: 5,  prof: -0.06, blur: 3 }
    ],
    init() {
      const cont = $("#contact-drift");
      if (!cont || !Datos.obras.length) return;
      const resto = Datos.obras.filter((o) => !o.portada);
      const lista = (resto.length >= 3 ? resto : Datos.obras).slice(0, this.posiciones.length);
      cont.innerHTML = lista.map((o, i) => {
        const p = this.posiciones[i];
        return `
          <div class="drift-piece" style="--x:${p.x}%; --y:${p.y}%; --w:${p.w}vw; --blur:${p.blur}px" data-depth="${p.prof}">
            <span class="bob" style="${ritmo(o.id + "c")}">
              <span class="frame"><img src="${esc(miniatura(o))}" alt="" loading="lazy"></span>
            </span>
          </div>`;
      }).join("");
      $$("img", cont).forEach((img) => alCargar(img));
      $$("[data-depth]", cont).forEach((el) => Motor.registrar(el, parseFloat(el.dataset.depth)));
    }
  };


  /* ===========================================================================
     CURSOR — círculo que sigue al mouse y dice "Ver" sobre las obras
     ======================================================================== */
  const Cursor = {
    init() {
      const c = $("#cursor");
      if (!c || !punteroFino || reduceMotion) return;
      document.documentElement.classList.add("has-cursor");
      const label = $(".cursor-label", c);
      let x = -100, y = -100;

      document.addEventListener("pointerover", (e) => {
        const t = e.target.closest("[data-cursor]");
        c.classList.toggle("is-view", !!t);
        if (t) label.textContent = t.dataset.cursor;
      });
      document.addEventListener("pointerleave", () => c.classList.add("is-hidden"));
      document.addEventListener("pointerenter", () => c.classList.remove("is-hidden"));

      Motor.alCuadro((m) => {
        x += (m.px - x) * 0.2;
        y += (m.py - y) * 0.2;
        c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    }
  };


  /* ===========================================================================
     VISOR (LIGHTBOX)
     · Escape o clic en el espacio vacío → cierra
     · Flechas ← →, botones o deslizar el dedo → navega
     · Al cerrar, el foco vuelve a la obra vista
     · Enlace directo a cada obra: tusitio.com/#obra-ID
     ======================================================================== */
  const Visor = {
    lista: [], indice: 0, disparador: null, token: 0,

    init() {
      this.dlg = $("#lightbox");
      if (!this.dlg || typeof this.dlg.showModal !== "function") return;
      this.stage = $("#lb-stage");
      this.img = $("#lb-img");
      this.aura = $("#lb-aura");
      this.info = $(".lb-info", this.dlg);
      this.c = {
        cat: $("#lb-cat"), titulo: $("#lb-title"), anio: $("#lb-anio"), tecnica: $("#lb-tecnica"),
        medidas: $("#lb-medidas"), serie: $("#lb-serie"), serieFila: $("#lb-serie-row"),
        desc: $("#lb-desc"), original: $("#lb-original"), contador: $("#lb-counter")
      };
      this.btnPrev = $('[data-lb="prev"]', this.dlg);
      this.btnNext = $('[data-lb="next"]', this.dlg);

      this.dlg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-lb]");
        if (b) {
          if (b.dataset.lb === "prev") this.mover(-1);
          if (b.dataset.lb === "next") this.mover(1);
          if (b.dataset.lb === "close") this.cerrar();
          return;
        }
        if (e.target === this.dlg || e.target === this.stage || e.target.classList.contains("lb-float")) this.cerrar();
      });
      this.dlg.addEventListener("cancel", (e) => { e.preventDefault(); this.cerrar(); });
      this.dlg.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft")  { e.preventDefault(); this.mover(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); this.mover(1); }
      });

      let x0 = null, y0 = null;
      this.stage.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
      this.stage.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.mover(dx < 0 ? 1 : -1);
        x0 = y0 = null;
      }, { passive: true });

      this.dlg.addEventListener("close", () => this.alCerrar());
      window.addEventListener("hashchange", () => this.desdeHash());
      this.desdeHash();
    },

    desdeHash() {
      const m = location.hash.match(/^#obra-(.+)$/);
      if (!m) return;
      const id = decodeURIComponent(m[1]);
      if (Datos.porId(id) && !(this.dlg.open && this.actual()?.id === id)) this.abrir(id, null, Datos.obras);
    },

    actual() { return this.lista[this.indice]; },

    abrir(id, disparador, lista) {
      this.lista = lista || Galeria.visibles();
      let i = this.lista.findIndex((o) => o.id === id);
      if (i === -1) { this.lista = Datos.obras; i = this.lista.findIndex((o) => o.id === id); }
      if (i === -1) return;
      this.disparador = disparador || document.activeElement;
      this.mostrar(i);
      if (!this.dlg.open) {
        this.dlg.classList.remove("is-closing");
        this.dlg.showModal();
        document.documentElement.classList.add("lb-open");
      }
    },

    mover(paso) { if (this.lista.length > 1) this.mostrar(this.indice + paso); },

    mostrar(i) {
      const n = this.lista.length;
      this.indice = (i + n) % n;
      const o = this.lista[this.indice];
      const c = this.c;

      c.cat.textContent = `N.º ${num(o.n)} — ${o.categoria}`;
      c.titulo.textContent = o.titulo;
      c.anio.textContent = o.anio;
      c.tecnica.textContent = o.tecnica;
      c.medidas.textContent = o.medidas;
      c.serie.textContent = o.serie || "";
      c.serieFila.hidden = !o.serie;
      c.desc.innerHTML = parrafos(o.descripcion);
      c.original.href = o.url_imagen;
      c.contador.textContent = `${num(this.indice + 1)} / ${num(n)}`;
      this.btnPrev.disabled = this.btnNext.disabled = n < 2;
      if (this.aura) this.aura.style.backgroundImage = `url("${miniatura(o)}")`;

      const token = ++this.token;
      this.stage.classList.add("is-loading");
      this.img.classList.add("is-loading");
      const listo = () => {
        if (token !== this.token) return;
        this.stage.classList.remove("is-loading");
        this.img.classList.remove("is-loading");
      };
      this.img.onload = listo;
      this.img.onerror = () => { listo(); console.warn(`[Portfolio] No se pudo cargar "${o.url_imagen}".`); };
      this.img.alt = textoAlt(o);
      this.img.src = o.url_imagen;
      if (this.img.complete && this.img.naturalWidth) listo();

      this.info.scrollTop = 0;
      this.dlg.scrollTop = 0;
      [1, -1].forEach((d) => { const v = this.lista[(this.indice + d + n) % n]; if (v) new Image().src = v.url_imagen; });
      history.replaceState(null, "", `#obra-${encodeURIComponent(o.id)}`);
    },

    cerrar() {
      if (!this.dlg.open || this.dlg.classList.contains("is-closing")) return;
      if (reduceMotion) { this.dlg.close(); return; }
      this.dlg.classList.add("is-closing");
      const fin = () => { clearTimeout(this._cierre); if (this.dlg.open) this.dlg.close(); };
      const alTerminar = (e) => { if (e.target === this.dlg) { this.dlg.removeEventListener("animationend", alTerminar); fin(); } };
      this.dlg.addEventListener("animationend", alTerminar);
      this._cierre = setTimeout(fin, 400);   // respaldo por si la animación no termina
    },

    alCerrar() {
      this.dlg.classList.remove("is-closing");
      document.documentElement.classList.remove("lb-open");
      history.replaceState(null, "", location.pathname + location.search);
      const o = this.actual();
      const enPortada = this.disparador && this.disparador.closest && this.disparador.closest(".hero");
      const destino = (!enPortada && o && Galeria.botonDe(o.id)) || this.disparador;
      if (destino && typeof destino.focus === "function") {
        destino.focus({ preventScroll: true });
        if (!enPortada) destino.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      }
    }
  };


  /* ===========================================================================
     FORMULARIO DE CONTACTO
     ---------------------------------------------------------------------------
     OPCIÓN A — FORMSPREE (ya integrada): pegá tu URL en el action del <form>.
     OPCIÓN B — EMAILJS:
       1. Cuenta en https://www.emailjs.com + "Email Service" + "Email Template"
          con las variables {{nombre}}, {{email}}, {{motivo}} y {{mensaje}}.
       2. En index.html, antes de app.js:
          <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
       3. Completá EMAILJS abajo y poné activo: true.
     ======================================================================== */
  const EMAILJS = { activo: false, publicKey: "TU_PUBLIC_KEY", serviceId: "TU_SERVICE_ID", templateId: "TU_TEMPLATE_ID" };

  const Formulario = {
    init() {
      this.form = $("#contact-form");
      if (!this.form) return;
      this.estado = $("#form-status");
      this.boton = $('button[type="submit"]', this.form);
      if (EMAILJS.activo && window.emailjs) window.emailjs.init({ publicKey: EMAILJS.publicKey });
      this.form.addEventListener("submit", (e) => this.enviar(e));
      this.form.addEventListener("input", (e) => {
        if (e.target.closest(".field.has-error") && e.target.checkValidity()) this.limpiar(e.target);
      });
    },
    mensaje(t, tipo = "") { this.estado.textContent = t; this.estado.className = `form-status${tipo ? ` is-${tipo}` : ""}`; },
    validar() {
      let primero = null;
      $$("input[required], textarea[required]", this.form).forEach((campo) => {
        this.limpiar(campo);
        if (!campo.value.trim()) campo.value = "";
        if (campo.checkValidity()) return;
        const err = document.createElement("span");
        err.className = "field-error";
        err.id = `${campo.id}-error`;
        err.textContent = campo.validity.valueMissing ? "Este campo es obligatorio." : "Revisá el formato (ej.: nombre@correo.com).";
        campo.closest(".field").classList.add("has-error");
        campo.closest(".field").appendChild(err);
        campo.setAttribute("aria-invalid", "true");
        campo.setAttribute("aria-describedby", err.id);
        primero = primero || campo;
      });
      if (primero) primero.focus();
      return !primero;
    },
    limpiar(campo) {
      const f = campo.closest(".field");
      f.classList.remove("has-error");
      $(".field-error", f)?.remove();
      campo.removeAttribute("aria-invalid");
      campo.removeAttribute("aria-describedby");
    },
    async enviar(e) {
      e.preventDefault();
      if (!this.validar()) { this.mensaje("Revisá los campos marcados.", "error"); return; }
      const usaEmailJS = EMAILJS.activo && window.emailjs;
      if (!usaEmailJS && this.form.action.includes(CONFIG.formPlaceholder)) {
        this.mensaje(`El formulario aún no está configurado. Mientras tanto, escribime a ${CONFIG.emailFallback}`, "error");
        console.info("[Portfolio] Pegá tu URL de Formspree en el atributo action del <form> (index.html).");
        return;
      }
      this.boton.disabled = true;
      this.mensaje("Enviando…");
      try {
        if (usaEmailJS) await window.emailjs.sendForm(EMAILJS.serviceId, EMAILJS.templateId, this.form);
        else {
          const res = await fetch(this.form.action, { method: "POST", body: new FormData(this.form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
        this.form.reset();
        this.mensaje("¡Gracias! Tu mensaje fue enviado. Te respondo a la brevedad.", "success");
      } catch (err) {
        console.error("[Portfolio] Error al enviar el formulario:", err);
        this.mensaje(`No se pudo enviar. Escribime directamente a ${CONFIG.emailFallback}.`, "error");
      } finally {
        this.boton.disabled = false;
      }
    }
  };


  /* ===========================================================================
     INICIO
     ======================================================================== */
  const anio = $("#year");
  if (anio) anio.textContent = new Date().getFullYear();

  Datos.cargar();
  Motor.init();
  Salas.init();
  Aparicion.init();
  Navegacion.init();
  Portada.init();
  Galeria.init();
  Cita.init();
  Contacto.init();
  Cursor.init();
  Visor.init();
  Formulario.init();

  // Elementos del HTML con data-depth (tarjetas del CV, retrato, formulario…)
  $$("[data-depth]").forEach((el) => Motor.registrar(el, parseFloat(el.dataset.depth) || 0));
})();
