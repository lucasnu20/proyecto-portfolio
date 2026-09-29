# Portfolio de artista — guía rápida

## Estructura

```
portfolio/
├── index.html            Estructura + textos fijos (bio, statement, CV, contacto)
├── css/styles.css        Estilos. Colores y tipografías: sección 0 (variables)
├── js/obras.js           ★ Lista de obras: agregar, quitar, reordenar
├── js/app.js             Lógica (galería, filtros, visor, menú, formulario)
├── img/retrato.jpg       Tu retrato (vertical 4:5)
├── img/obras/            Fotos de las obras
└── docs/cv-lucia-moreno.pdf   Tu CV en PDF
```

Abrí `index.html` con doble clic para verlo: no necesita servidor.

## Checklist para personalizarlo

1. **Nombre**: en `index.html`, "Buscar y reemplazar" → `Lucía Moreno` por tu nombre.
2. **Textos**: buscá `✎ EDITAR` en `index.html` (intro, sobre mí, statement, CV, contacto, redes).
3. **Obras**: poné las fotos en `img/obras/` y editá `js/obras.js` (instrucciones y plantilla adentro).
4. **Retrato**: reemplazá `img/retrato.jpg`.
5. **CV PDF**: reemplazá el archivo en `docs/` (mismo nombre, o cambiá la ruta en los 2 botones `data-cv-link`).
6. **Formulario**: creá un formulario en formspree.io y pegá la URL en el `action` del `<form>`.
   También cambiá `emailFallback` en `js/app.js`.
7. **Colores o tipografías** (opcional): sección 0 de `css/styles.css`.

## Enlace directo a una obra

Cada obra tiene su propia URL: `tusitio.com/#obra-ID` (ej. `#obra-umbral-i`).
Sirve para pegar en una postulación y que el jurado vea directamente esa pieza con su ficha.

## Publicarlo gratis

Netlify Drop (arrastrás la carpeta a app.netlify.com/drop), GitHub Pages o Vercel.
Después actualizá `og:image` en `index.html` con la URL completa de una imagen.
