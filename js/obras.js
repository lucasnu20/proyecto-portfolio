/* =============================================================================
   OBRAS.JS — Base de datos de la galería
   =============================================================================

   Este es el ÚNICO archivo que necesitás tocar para gestionar tus obras.
   La galería, los filtros y el visor (lightbox) se generan solos a partir
   de esta lista. No hace falta editar el HTML.

   ─────────────────────────────────────────────────────────────────────────────
   CÓMO AGREGAR UNA OBRA NUEVA
   ─────────────────────────────────────────────────────────────────────────────
   1. Guardá la foto en la carpeta  img/obras/
      · Formato recomendado: .jpg (o .webp), lado largo de 1600–2400 px,
        calidad 80–85 %. Pesos de 200–600 KB son ideales.
      · Nombre sin espacios, tildes ni ñ:  mi-obra-nueva.jpg  ✔
                                           Mi Obra Nueva.JPG  ✘
   2. Copiá uno de los bloques { ... } de abajo, pegalo dentro de la lista
      (entre los corchetes [ ]) y cambiá los datos.
   3. Cada bloque va separado del siguiente por una COMA.
   4. Guardá el archivo y recargá la página.

   ─────────────────────────────────────────────────────────────────────────────
   CAMPOS DE CADA OBRA
   ─────────────────────────────────────────────────────────────────────────────
   id           (obligatorio) Identificador único, sin espacios ni tildes.
                Se usa en el enlace directo a la obra:  tusitio.com/#obra-umbral-i
                → Ideal para pegar en una postulación: lleva directo a esa pieza.
   titulo       (obligatorio) Título de la obra.
   anio         (obligatorio) Año. Puede ser número (2025) o texto ("2024–2025").
   tecnica      (obligatorio) Técnica y materiales.
   medidas      (obligatorio) Ej: "120 × 90 cm" o "Medidas variables".
   categoria    (obligatorio) Se usa para los FILTROS. Escribila SIEMPRE igual
                (misma mayúscula y tilde): "Pintura", "Escultura", "Dibujo",
                "Grabado", "Instalación", "Fotografía"… Si inventás una categoría
                nueva (ej. "Video"), el botón de filtro aparece automáticamente.
   descripcion  (obligatorio) Texto curatorial / concepto. Para varios párrafos,
                separalos con una línea en blanco usando \n\n dentro del texto.
   url_imagen   (obligatorio) Ruta a la imagen en alta calidad.
                · Local:   "img/obras/mi-obra.jpg"
                · Externa: "https://…" (Cloudinary, ImgBB, etc.)

   Campos OPCIONALES (podés omitirlos):
   url_miniatura  Versión liviana (~800 px) para la grilla. Si no está, se usa
                  url_imagen. Recomendado cuando tengas muchas obras.
   alt            Descripción de la imagen para lectores de pantalla.
                  Si no está, se arma con título + técnica.
   serie          Nombre de la serie a la que pertenece.
   destacada      true → la obra ocupa 2 columnas en pantallas grandes.

   ─────────────────────────────────────────────────────────────────────────────
   REORDENAR / QUITAR
   ─────────────────────────────────────────────────────────────────────────────
   · El orden de la lista = el orden en la galería. Mové bloques para reordenar.
   · Para ocultar una obra sin borrarla, encerrala entre  /*  y  *\/  (comentario).
   · Si algo falla, abrí la consola del navegador (F12 → Consola): app.js avisa
     qué obra tiene un campo faltante o un id repetido.

   ⚠ Errores típicos: olvidar una coma entre bloques, o una comilla sin cerrar.
     Si la galería aparece vacía, casi siempre es eso.
   ========================================================================== */

const OBRAS = [
  {
    id: "umbral-i",
    titulo: "Umbral I",
    anio: 2025,
    tecnica: "Óleo sobre tela",
    medidas: "120 × 90 cm",
    categoria: "Pintura",
    serie: "Umbrales",
    descripcion:
      "Primera pieza de la serie Umbrales. Dos campos de color se tocan sin mezclarse: el límite entre ambos no es una línea sino una zona de fricción, construida con más de veinte veladuras sucesivas.\n\nLa obra parte de la observación de puertas y zaguanes del barrio donde crecí, espacios de paso que no son ni adentro ni afuera.",
    url_imagen: "img/obras/umbral-i.jpg"
  },
  {
    id: "cartografia-de-lo-que-queda",
    titulo: "Cartografía de lo que queda",
    anio: 2024,
    tecnica: "Instalación: hilo de algodón, clavos y papel",
    medidas: "Medidas variables (aprox. 300 × 450 cm)",
    categoria: "Instalación",
    destacada: true,
    descripcion:
      "Un mapa trazado con hilo rojo sobre la pared de la sala. Cada clavo marca un lugar que ya no existe —una casa demolida, un almacén cerrado, un árbol talado— según los relatos de vecinas y vecinos entrevistados durante tres meses.\n\nLos papeles contienen fragmentos transcriptos de esas conversaciones. El público puede leerlos de cerca, pero no llevárselos.",
    url_imagen: "img/obras/cartografia-de-lo-que-queda.jpg"
  },
  {
    id: "serie-humedad",
    titulo: "Sin título (serie Humedad)",
    anio: 2024,
    tecnica: "Aguafuerte y aguatinta sobre papel de algodón",
    medidas: "30 × 40 cm (placa) · Edición de 8",
    categoria: "Grabado",
    serie: "Humedad",
    descripcion:
      "La matriz de cobre se dejó expuesta a la humedad durante semanas antes de morderla: las manchas de óxido pasan a formar parte de la imagen. El paisaje resultante es a la vez una vista y un registro del tiempo.",
    url_imagen: "img/obras/serie-humedad.jpg"
  },
  {
    id: "retrato-de-mi-abuela",
    titulo: "Retrato de mi abuela como paisaje",
    anio: 2023,
    tecnica: "Carbonilla y goma sobre papel",
    medidas: "70 × 50 cm",
    categoria: "Dibujo",
    descripcion:
      "Dibujo realizado de memoria, sin fotografías de referencia. La figura se disuelve en el fondo a medida que el recuerdo se vuelve impreciso: lo que queda es una atmósfera más que un rostro.",
    url_imagen: "img/obras/retrato-de-mi-abuela-como-paisaje.jpg"
  },
  {
    id: "pieza-para-sostener-el-silencio",
    titulo: "Pieza para sostener el silencio",
    anio: 2025,
    tecnica: "Gres esmaltado y hierro",
    medidas: "45 × 30 × 30 cm",
    categoria: "Escultura",
    descripcion:
      "Un recipiente cerrado, sin boca. La forma remite a vasijas utilitarias, pero su función queda anulada: es un objeto que contiene sin dejar entrar ni salir nada.",
    url_imagen: "img/obras/pieza-para-sostener-el-silencio.jpg"
  },
  {
    id: "registro-de-una-pared",
    titulo: "Registro de una pared",
    anio: 2023,
    tecnica: "Fotografía digital, impresión giclée sobre papel de algodón",
    medidas: "60 × 90 cm",
    categoria: "Fotografía",
    descripcion:
      "Durante un año fotografié la misma pared medianera, siempre a la misma hora. Esta imagen corresponde al día en que apareció la grieta.",
    url_imagen: "img/obras/registro-de-una-pared.jpg"
  },
  {
    id: "umbral-ii",
    titulo: "Umbral II",
    anio: 2025,
    tecnica: "Óleo sobre tela",
    medidas: "100 × 100 cm",
    categoria: "Pintura",
    serie: "Umbrales",
    descripcion:
      "Segunda pieza de la serie. El formato cuadrado elimina la lectura de paisaje y deja el color solo, suspendido. La banda clara central funciona como una rendija de luz bajo una puerta.",
    url_imagen: "img/obras/umbral-ii.jpg"
  },
  {
    id: "xilografia-para-un-rio",
    titulo: "Xilografía para un río",
    anio: 2022,
    tecnica: "Xilografía sobre papel japonés",
    medidas: "50 × 120 cm · Edición de 5",
    categoria: "Grabado",
    destacada: true,
    descripcion:
      "Taco de madera tallado a lo largo de treinta y cuatro jornadas, una línea por día. El ritmo irregular de las incisiones registra el cansancio de la mano y el pulso del trabajo.",
    url_imagen: "img/obras/xilografia-para-un-rio.jpg"
  },
  {
    id: "casa-tomada",
    titulo: "Casa tomada",
    anio: 2024,
    tecnica: "Acrílico y collage sobre madera",
    medidas: "80 × 60 cm",
    categoria: "Pintura",
    descripcion:
      "Collage construido con fragmentos de papeles de pared recuperados de una casa en demolición. El marco blanco central delimita el único espacio que permanece vacío.",
    url_imagen: "img/obras/casa-tomada.jpg"
  },
  {
    id: "estudio-de-manos",
    titulo: "Estudio de manos",
    anio: 2022,
    tecnica: "Grafito y acuarela sobre papel",
    medidas: "29,7 × 21 cm",
    categoria: "Dibujo",
    descripcion:
      "Página de cuaderno de taller. Estudios rápidos de las manos de mi madre mientras teje; las manchas de acuarela fueron aplicadas después, sin mirar el dibujo.",
    url_imagen: "img/obras/estudio-de-manos.jpg"
  },
  {
    id: "cuerpos-de-agua",
    titulo: "Cuerpos de agua",
    anio: 2025,
    tecnica: "Yeso, resina y pigmento",
    medidas: "Tres piezas, 25 × 40 × 30 cm c/u",
    categoria: "Escultura",
    descripcion:
      "Tres volúmenes moldeados a partir de bolsas de agua. El yeso fragua registrando la tensión de la superficie líquida: una forma blanda que se vuelve piedra.",
    url_imagen: "img/obras/cuerpos-de-agua.jpg"
  },
  {
    id: "serie-ventanas-3",
    titulo: "Serie Ventanas #3",
    anio: 2023,
    tecnica: "Fotografía analógica 35 mm, copia en gelatina de plata digitalizada",
    medidas: "40 × 30 cm",
    categoria: "Fotografía",
    serie: "Ventanas",
    descripcion:
      "La luz de la tarde entra en el taller y dibuja en el piso una segunda ventana. La serie registra ese desplazamiento a lo largo de las estaciones.",
    url_imagen: "img/obras/serie-ventanas-3.jpg"
  }

  /* ── PLANTILLA PARA COPIAR ──────────────────────────────────────────────
     Recordá poner una COMA después de la llave } de la obra anterior.

  ,{
    id: "nombre-sin-espacios",
    titulo: "Título de la obra",
    anio: 2026,
    tecnica: "Técnica y materiales",
    medidas: "00 × 00 cm",
    categoria: "Pintura",
    descripcion: "Texto curatorial.\n\nSegundo párrafo opcional.",
    url_imagen: "img/obras/nombre-del-archivo.jpg"
  }
  ─────────────────────────────────────────────────────────────────────── */
];

/* ORDEN DE LOS FILTROS (opcional)
   Por defecto los botones aparecen en este orden. Las categorías que no tengan
   ninguna obra se ocultan solas; las que no estén en esta lista se agregan al
   final. Podés reordenarla a gusto. */
const ORDEN_CATEGORIAS = [
  "Pintura",
  "Escultura",
  "Dibujo",
  "Grabado",
  "Instalación",
  "Fotografía"
];
