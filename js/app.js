/* =============================================================================
   APP.JS — Lógica del portfolio
   =============================================================================
   ⚠ Para agregar o cambiar OBRAS no hace falta tocar este archivo:
     editá js/obras.js.

   Organización (cada bloque es un módulo independiente):
     · CONFIG        Ajustes generales
     · Utilidades    Funciones auxiliares
     · Datos         Lee y valida la lista OBRAS de obras.js
     · Aparicion     Fade-in suave al hacer scroll
     · Navegacion    Menú móvil, header al hacer scroll, sección activa
     · Galeria       Grilla masonry + filtros por categoría
     · Visor         Lightbox accesible (Escape, clic afuera, flechas, swipe)
     · Formulario    Envío sin recargar (Formspree) + validación
     · Inicio        Arranca todo

   Se usan scripts clásicos (no "type=module") a propósito: así el sitio
   funciona también abriendo index.html con doble clic, sin servidor.
   ========================================================================== */

(function () {
  "use strict";

  /* ===========================================================================
     CONFIG
     ======================================================================== */
  const CONFIG = {
    // Texto de ejemplo en la URL de Formspree. Mientras siga ahí, el formulario
    // avisa que falta configurarlo en vez de intentar enviar.
    formPlaceholder: "TU_CODIGO",
    // Email alternativo que se muestra si el envío falla. ✎ EDITAR
    emailFallback: "hola@luciamoreno.art",
    // Alto de cada "fila" de la grilla masonry. Debe coincidir con
    // grid-auto-rows en styles.css (.gallery-grid).
    masonryRow: 8,
    // Nombre del filtro que muestra todas las obras.
    filtroTodas: "Todas"
  };


  /* ===========================================================================
     UTILIDADES
     ======================================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Evita que caracteres como < > " & en los textos rompan el HTML.
  const esc = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  // Convierte "párrafo 1\n\npárrafo 2" en <p>…</p><p>…</p>
  const parrafos = (texto) =>
    String(texto ?? "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("");

  const textoAlt = (o) => o.alt || `${o.titulo}, ${o.anio}. ${o.tecnica}, ${o.medidas}.`;


  /* ===========================================================================
     DATOS — lee OBRAS (de obras.js) y avisa en la consola si falta algo
     ======================================================================== */
  const Datos = {
    obras: [],
    categorias: [],

    cargar() {
      if (typeof OBRAS === "undefined" || !Array.isArray(OBRAS)) {
        console.error(
          "[Portfolio] No se encontró la lista OBRAS. Revisá que js/obras.js exista, " +
          "que se cargue ANTES que app.js en index.html y que no tenga errores de sintaxis " +
          "(una coma o comilla faltante)."
        );
        return;
      }

      const requeridos = ["id", "titulo", "anio", "tecnica", "medidas", "categoria", "descripcion", "url_imagen"];
      const usados = new Set();

      this.obras = OBRAS.map((obra, i) => {
        if (!obra || typeof obra !== "object") return null;

        const faltan = requeridos.filter((k) => obra[k] === undefined || obra[k] === "");
        if (faltan.length) {
          console.warn(`[Portfolio] La obra n.º ${i + 1} ("${obra.titulo || "sin título"}") no tiene: ${faltan.join(", ")}.`);
        }
        if (!obra.url_imagen) return null; // sin imagen no se puede mostrar

        // Id único y apto para URL (si falta o se repite, se genera uno).
        let id = String(obra.id || obra.titulo || `obra-${i + 1}`)
          .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (usados.has(id)) {
          console.warn(`[Portfolio] El id "${id}" está repetido (obra n.º ${i + 1}). Cambialo en obras.js.`);
          id = `${id}-${i + 1}`;
        }
        usados.add(id);

        return { ...obra, id, categoria: String(obra.categoria || "Otros").trim() };
      }).filter(Boolean);

      // Orden de los filtros: primero el de ORDEN_CATEGORIAS, luego cualquier otra.
      const presentes = [...new Set(this.obras.map((o) => o.categoria))];
      const orden = typeof ORDEN_CATEGORIAS !== "undefined" && Array.isArray(ORDEN_CATEGORIAS) ? ORDEN_CATEGORIAS : [];
      this.categorias = [
        ...orden.filter((c) => presentes.includes(c)),
        ...presentes.filter((c) => !orden.includes(c))
      ];
    },

    porId(id) {
      return this.obras.find((o) => o.id === id);
    }
  };


  /* ===========================================================================
     APARICIÓN — fade-in al entrar en pantalla (elementos con data-reveal)
     ======================================================================== */
  const Aparicion = {
    io: null,

    init() {
      if (!("IntersectionObserver" in window) || reduceMotion.matches) {
        this.io = null;
        this.observar(document);
        return;
      }
      this.io = new IntersectionObserver((entradas) => {
        let n = 0;
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          // Pequeño escalonado entre elementos que aparecen a la vez.
          e.target.style.setProperty("--reveal-delay", `${Math.min(n++, 6) * 80}ms`);
          e.target.classList.add("is-visible");
          e.target.addEventListener("transitionend", () => e.target.style.removeProperty("--reveal-delay"), { once: true });
          this.io.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
      this.observar(document);
    },

    observar(ctx) {
      $$("[data-reveal]:not(.is-visible)", ctx).forEach((el) => {
        if (this.io) this.io.observe(el);
        else el.classList.add("is-visible");
      });
    }
  };


  /* ===========================================================================
     NAVEGACIÓN — menú móvil, sombra del header, enlace activo
     ======================================================================== */
  const Navegacion = {
    init() {
      this.header = $(".site-header");
      this.toggle = $(".nav-toggle");
      this.nav = $("#site-nav");
      if (!this.header || !this.toggle || !this.nav) return;

      this.toggle.addEventListener("click", () => this.setAbierto(!this.abierto()));

      // Cerrar al elegir un enlace, al hacer clic afuera o con Escape.
      this.nav.addEventListener("click", (e) => { if (e.target.closest("a")) this.setAbierto(false); });
      document.addEventListener("click", (e) => {
        if (this.abierto() && !this.header.contains(e.target)) this.setAbierto(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.abierto()) { this.setAbierto(false); this.toggle.focus(); }
      });
      window.matchMedia("(min-width: 861px)").addEventListener("change", (m) => { if (m.matches) this.setAbierto(false); });

      // Línea bajo el header al hacer scroll.
      const alScroll = () => this.header.classList.toggle("is-scrolled", window.scrollY > 8);
      window.addEventListener("scroll", alScroll, { passive: true });
      alScroll();

      this.seccionActiva();
    },

    abierto() { return this.toggle.getAttribute("aria-expanded") === "true"; },

    setAbierto(valor) {
      this.toggle.setAttribute("aria-expanded", String(valor));
      $(".sr-only", this.toggle).textContent = valor ? "Cerrar menú" : "Menú";
      this.nav.classList.toggle("is-open", valor);
    },

    // Marca en el menú la sección que se está viendo.
    seccionActiva() {
      if (!("IntersectionObserver" in window)) return;
      const enlaces = $$(".nav-list a");
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          enlaces.forEach((a) => {
            if (a.getAttribute("href") === `#${e.target.id}`) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      enlaces.forEach((a) => {
        const s = document.querySelector(a.getAttribute("href"));
        if (s) io.observe(s);
      });
    }
  };


  /* ===========================================================================
     GALERÍA — genera las obras, los filtros y el layout masonry
     ======================================================================== */
  const Galeria = {
    filtro: CONFIG.filtroTodas,

    init() {
      this.grid = $("#gallery");
      this.filtros = $("#filters");
      this.contador = $("#gallery-count");
      if (!this.grid) return;

      if (!Datos.obras.length) {
        this.grid.innerHTML = `<li class="gallery-empty">Todavía no hay obras cargadas. Agregalas en <code>js/obras.js</code>.</li>`;
        return;
      }

      this.renderFiltros();
      this.renderObras();
      this.activarMasonry();

      // Un solo "escuchador" para todos los clics de la grilla (delegación).
      this.grid.addEventListener("click", (e) => {
        const boton = e.target.closest(".work");
        if (boton) Visor.abrir(boton.closest(".gallery-item").dataset.id, boton);
      });

      this.actualizarContador();
      Aparicion.observar(this.grid);
    },

    renderFiltros() {
      if (!this.filtros) return;
      // Si todas las obras son de una sola categoría, los filtros no aportan.
      if (Datos.categorias.length < 2) { this.filtros.hidden = true; return; }

      const cuenta = (c) => Datos.obras.filter((o) => o.categoria === c).length;
      const boton = (c, n) => `
        <button class="filter" type="button" data-filtro="${esc(c)}" aria-pressed="${c === this.filtro}">
          ${esc(c)} <span class="filter-count" aria-hidden="true">${n}</span>
        </button>`;

      this.filtros.innerHTML =
        boton(CONFIG.filtroTodas, Datos.obras.length) +
        Datos.categorias.map((c) => boton(c, cuenta(c))).join("");

      this.filtros.addEventListener("click", (e) => {
        const b = e.target.closest(".filter");
        if (b) this.aplicarFiltro(b.dataset.filtro);
      });
    },

    renderObras() {
      this.grid.innerHTML = Datos.obras.map((o, i) => `
        <li class="gallery-item${o.destacada ? " is-featured" : ""}" data-id="${esc(o.id)}" data-categoria="${esc(o.categoria)}" data-reveal>
          <button class="work" type="button" aria-haspopup="dialog"
                  aria-label="${esc(o.titulo)}, ${esc(o.anio)}. ${esc(o.tecnica)}. Ver ficha completa">
            <span class="work-media">
              <img src="${esc(o.url_miniatura || o.url_imagen)}" alt="${esc(textoAlt(o))}"
                   loading="${i < 6 ? "eager" : "lazy"}" decoding="async">
            </span>
            <span class="work-caption">
              <span class="work-title">${esc(o.titulo)}</span>
              <span class="work-year">${esc(o.anio)}</span>
            </span>
            <span class="work-tech">${esc(o.tecnica)} · ${esc(o.medidas)}</span>
          </button>
        </li>`).join("");

      // Al cargar cada imagen, fijamos su proporción real y la mostramos con fade.
      $$("img", this.grid).forEach((img) => {
        const listo = () => {
          if (img.naturalWidth) img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          img.classList.add("is-loaded");
        };
        const error = () => {
          img.classList.add("is-loaded");
          console.warn(`[Portfolio] No se pudo cargar la imagen "${img.getAttribute("src")}". Revisá la ruta y el nombre del archivo (mayúsculas, extensión .jpg/.JPG).`);
        };
        if (img.complete && img.naturalWidth) listo();
        else { img.addEventListener("load", listo, { once: true }); img.addEventListener("error", error, { once: true }); }
      });
    },

    // Masonry: cada obra ocupa tantas filas de 8px como mida su contenido.
    // ResizeObserver recalcula solo al cargar imágenes o cambiar el ancho.
    activarMasonry() {
      const ajustar = (item) => {
        const alto = item.getBoundingClientRect().height;
        if (alto > 0) item.style.gridRowEnd = `span ${Math.ceil(alto / CONFIG.masonryRow)}`;
      };
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver((entradas) => entradas.forEach((e) => ajustar(e.target)));
        $$(".gallery-item", this.grid).forEach((item) => ro.observe(item));
      } else {
        const todo = () => $$(".gallery-item", this.grid).forEach(ajustar);
        window.addEventListener("resize", todo);
        window.addEventListener("load", todo);
      }
    },

    aplicarFiltro(categoria) {
      if (categoria === this.filtro) return;
      this.filtro = categoria;

      $$(".filter", this.filtros).forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.filtro === categoria)));

      const cambiar = () => {
        $$(".gallery-item", this.grid).forEach((item) => {
          item.hidden = !(categoria === CONFIG.filtroTodas || item.dataset.categoria === categoria);
        });
        this.actualizarContador();
        this.grid.classList.remove("is-filtering");
      };

      // Transición suave: desvanece, filtra y vuelve a aparecer.
      if (reduceMotion.matches) cambiar();
      else {
        this.grid.classList.add("is-filtering");
        clearTimeout(this._t);
        this._t = setTimeout(cambiar, 280);
      }
    },

    actualizarContador() {
      if (!this.contador) return;
      const n = this.visibles().length;
      const obras = n === 1 ? "obra" : "obras";
      this.contador.textContent = this.filtro === CONFIG.filtroTodas
        ? `${n} ${obras}`
        : `${n} ${obras} · ${this.filtro}`;
    },

    // Obras visibles con el filtro actual (el visor navega sólo entre éstas).
    visibles() {
      return Datos.obras.filter((o) => this.filtro === CONFIG.filtroTodas || o.categoria === this.filtro);
    },

    botonDe(id) {
      return $(`.gallery-item[data-id="${CSS.escape(id)}"]:not([hidden]) .work`, this.grid);
    }
  };


  /* ===========================================================================
     VISOR (LIGHTBOX)
     · Escape o clic en el espacio vacío → cierra
     · Flechas ← → del teclado, botones o deslizar el dedo → navega
     · Al cerrar, el foco vuelve a la obra que se estaba viendo
     · Cada obra tiene enlace directo: tusitio.com/#obra-ID
     ======================================================================== */
  const Visor = {
    lista: [],
    indice: 0,
    disparador: null,
    token: 0,

    init() {
      this.dlg = $("#lightbox");
      if (!this.dlg || typeof this.dlg.showModal !== "function") return;

      this.stage = $("#lb-stage");
      this.img = $("#lb-img");
      this.info = $(".lb-info", this.dlg);
      this.campos = {
        cat: $("#lb-cat"), titulo: $("#lb-title"), anio: $("#lb-anio"),
        tecnica: $("#lb-tecnica"), medidas: $("#lb-medidas"),
        serie: $("#lb-serie"), serieFila: $("#lb-serie-row"),
        desc: $("#lb-desc"), original: $("#lb-original"), contador: $("#lb-counter")
      };
      this.btnPrev = $('[data-lb="prev"]', this.dlg);
      this.btnNext = $('[data-lb="next"]', this.dlg);

      // Botones
      this.dlg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-lb]");
        if (b) {
          const accion = b.dataset.lb;
          if (accion === "prev") this.mover(-1);
          if (accion === "next") this.mover(1);
          if (accion === "close") this.cerrar();
          return;
        }
        // Clic "afuera": en el fondo del visor o alrededor de la imagen.
        if (e.target === this.dlg || e.target === this.stage) this.cerrar();
      });

      // Escape: el <dialog> dispara "cancel"; lo interceptamos para animar el cierre.
      this.dlg.addEventListener("cancel", (e) => { e.preventDefault(); this.cerrar(); });

      // Flechas del teclado
      this.dlg.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft")  { e.preventDefault(); this.mover(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); this.mover(1); }
      });

      // Deslizar en pantallas táctiles
      let x0 = null, y0 = null;
      this.stage.addEventListener("touchstart", (e) => {
        x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY;
      }, { passive: true });
      this.stage.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.mover(dx < 0 ? 1 : -1);
        x0 = y0 = null;
      }, { passive: true });

      this.dlg.addEventListener("close", () => this.alCerrar());

      // Enlace directo a una obra (#obra-umbral-i)
      window.addEventListener("hashchange", () => this.desdeHash());
      this.desdeHash();
    },

    desdeHash() {
      const m = location.hash.match(/^#obra-(.+)$/);
      if (!m) return;
      const id = decodeURIComponent(m[1]);
      if (Datos.porId(id) && !(this.dlg.open && this.actual()?.id === id)) this.abrir(id);
    },

    actual() { return this.lista[this.indice]; },

    abrir(id, disparador) {
      this.lista = Galeria.visibles();
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

    mover(paso) {
      if (this.lista.length > 1) this.mostrar(this.indice + paso);
    },

    mostrar(i) {
      const n = this.lista.length;
      this.indice = (i + n) % n;           // da la vuelta al llegar al final
      const o = this.lista[this.indice];
      const c = this.campos;

      // Ficha técnica
      c.cat.textContent = o.categoria;
      c.titulo.textContent = o.titulo;
      c.anio.textContent = o.anio;
      c.tecnica.textContent = o.tecnica;
      c.medidas.textContent = o.medidas;
      c.serie.textContent = o.serie || "";
      c.serieFila.hidden = !o.serie;
      c.desc.innerHTML = parrafos(o.descripcion);
      c.original.href = o.url_imagen;
      c.contador.textContent = `${String(this.indice + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      this.btnPrev.disabled = this.btnNext.disabled = n < 2;

      // Imagen en alta: se muestra con fade cuando termina de cargar.
      const token = ++this.token;
      this.stage.classList.add("is-loading");
      this.img.classList.add("is-loading");
      const listo = () => {
        if (token !== this.token) return;  // el usuario ya pasó a otra obra
        this.stage.classList.remove("is-loading");
        this.img.classList.remove("is-loading");
      };
      this.img.onload = listo;
      this.img.onerror = () => {
        listo();
        console.warn(`[Portfolio] No se pudo cargar "${o.url_imagen}".`);
      };
      this.img.alt = textoAlt(o);
      this.img.src = o.url_imagen;
      if (this.img.complete && this.img.naturalWidth) listo();

      // Volver arriba en la ficha y precargar las obras vecinas.
      this.info.scrollTop = 0;
      this.dlg.scrollTop = 0;
      [1, -1].forEach((d) => {
        const vecina = this.lista[(this.indice + d + n) % n];
        if (vecina) new Image().src = vecina.url_imagen;
      });

      // Actualiza la URL sin recargar ni desplazar la página.
      history.replaceState(null, "", `#obra-${encodeURIComponent(o.id)}`);
    },

    cerrar() {
      if (!this.dlg.open || this.dlg.classList.contains("is-closing")) return;
      if (reduceMotion.matches) { this.dlg.close(); return; }
      this.dlg.classList.add("is-closing");
      this.dlg.addEventListener("animationend", () => this.dlg.close(), { once: true });
    },

    alCerrar() {
      this.dlg.classList.remove("is-closing");
      document.documentElement.classList.remove("lb-open");
      history.replaceState(null, "", location.pathname + location.search);
      // Devuelve el foco a la obra vista (o a la que abrió el visor).
      const o = this.actual();
      const destino = (o && Galeria.botonDe(o.id)) || this.disparador;
      if (destino && typeof destino.focus === "function") {
        destino.focus({ preventScroll: true });
        destino.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
    }
  };


  /* ===========================================================================
     FORMULARIO DE CONTACTO
     ---------------------------------------------------------------------------
     OPCIÓN A — FORMSPREE (recomendada, ya integrada):
       Sólo pegá tu URL de Formspree en el atributo action del <form> en
       index.html. No hace falta tocar nada acá.

     OPCIÓN B — EMAILJS:
       1. Creá cuenta en https://www.emailjs.com, un "Email Service" y un
          "Email Template" que use las variables {{nombre}}, {{email}},
          {{motivo}} y {{mensaje}}.
       2. En index.html, antes de app.js, agregá:
            <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
       3. Completá EMAILJS abajo con tus claves y poné  activo: true.
     ======================================================================== */
  const EMAILJS = {
    activo: false,
    publicKey: "TU_PUBLIC_KEY",
    serviceId: "TU_SERVICE_ID",
    templateId: "TU_TEMPLATE_ID"
  };

  const Formulario = {
    init() {
      this.form = $("#contact-form");
      if (!this.form) return;
      this.estado = $("#form-status");
      this.boton = $('button[type="submit"]', this.form);

      if (EMAILJS.activo && window.emailjs) window.emailjs.init({ publicKey: EMAILJS.publicKey });

      this.form.addEventListener("submit", (e) => this.enviar(e));
      // Quita el error de un campo apenas se corrige.
      this.form.addEventListener("input", (e) => {
        if (e.target.closest(".field.has-error") && e.target.checkValidity()) this.limpiarError(e.target);
      });
    },

    mensaje(texto, tipo = "") {
      this.estado.textContent = texto;
      this.estado.className = `form-status${tipo ? ` is-${tipo}` : ""}`;
    },

    validar() {
      let primero = null;
      $$("input[required], textarea[required]", this.form).forEach((campo) => {
        this.limpiarError(campo);
        campo.value = campo.value.trim() ? campo.value : "";
        if (campo.checkValidity()) return;
        const texto = campo.validity.valueMissing
          ? "Este campo es obligatorio."
          : "Revisá el formato (ej.: nombre@correo.com).";
        const err = document.createElement("span");
        err.className = "field-error";
        err.id = `${campo.id}-error`;
        err.textContent = texto;
        campo.closest(".field").classList.add("has-error");
        campo.closest(".field").appendChild(err);
        campo.setAttribute("aria-invalid", "true");
        campo.setAttribute("aria-describedby", err.id);
        primero = primero || campo;
      });
      if (primero) primero.focus();
      return !primero;
    },

    limpiarError(campo) {
      const field = campo.closest(".field");
      field.classList.remove("has-error");
      $(".field-error", field)?.remove();
      campo.removeAttribute("aria-invalid");
      campo.removeAttribute("aria-describedby");
    },

    async enviar(e) {
      e.preventDefault();
      if (!this.validar()) { this.mensaje("Revisá los campos marcados.", "error"); return; }

      const usaEmailJS = EMAILJS.activo && window.emailjs;
      if (!usaEmailJS && this.form.action.includes(CONFIG.formPlaceholder)) {
        this.mensaje("El formulario aún no está configurado. Mientras tanto, escribime a " + CONFIG.emailFallback, "error");
        console.info("[Portfolio] Pegá tu URL de Formspree en el atributo action del <form> (index.html).");
        return;
      }

      this.boton.disabled = true;
      this.mensaje("Enviando…");

      try {
        if (usaEmailJS) {
          await window.emailjs.sendForm(EMAILJS.serviceId, EMAILJS.templateId, this.form);
        } else {
          const res = await fetch(this.form.action, {
            method: "POST",
            body: new FormData(this.form),
            headers: { Accept: "application/json" }
          });
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
  Aparicion.init();
  Navegacion.init();
  Galeria.init();
  Visor.init();
  Formulario.init();
})();
