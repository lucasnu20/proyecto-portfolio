# Portfolio de artista — v2 "Recorrido"

El sitio funciona como una muestra digital que se recorre por salas:
portada con obras flotando → Sala 01 (obras, sala oscura) → Sala 02 (artista)
→ Sala 03 (trayectoria) → Sala 04 (contacto, sala azul).

## Estructura (igual que antes)

```
portfolio/
├── index.html            Estructura + textos fijos (bio, statement, CV, contacto)
├── css/styles.css        Estilos. Colores de cada sala: sección 0
├── js/obras.js           ★ Obras, orden de filtros y fragmentos de texto
├── js/app.js             Movimiento, galería, visor, menú, formulario
├── img/retrato.jpg       Tu retrato (vertical 4:5)
├── img/obras/            Fotos de las obras
└── docs/cv-lucia-moreno.pdf
```

Abrí `index.html` con doble clic: no necesita servidor.

## Lo nuevo que podés controlar

| Qué | Dónde |
|---|---|
| Qué obras flotan en la portada | `obras.js` → `portada: true` (hasta 6) |
| Obra sin passe-partout (instalaciones, fotos de sala) | `obras.js` → `sin_marco: true` |
| Frases que flotan entre las obras | `obras.js` → lista `FRAGMENTOS` |
| Posición / tamaño / profundidad de las obras de portada | `app.js` → `CONFIG.portada` |
| Montaje de la sala (anchos, desplazamientos, profundidad) | `app.js` → `CONFIG.montaje` |
| Ambiente de cada sección (claro / oscuro / azul) | `index.html` → atributo `data-room` |
| Colores de cada sala | `styles.css` → sección 0 |

## Checklist para personalizarlo

1. "Buscar y reemplazar" `Lucía Moreno` por tu nombre en `index.html`.
2. Buscá `✎ EDITAR` en `index.html` y cambiá los textos.
3. Obras: fotos en `img/obras/` + datos en `js/obras.js`.
4. Reemplazá `img/retrato.jpg` y el PDF de `docs/`.
5. Formulario: URL de Formspree en el `action` del `<form>` + `emailFallback` en `app.js`.

## Accesibilidad

- Si el sistema tiene activado "reducir movimiento", todo queda quieto y visible.
- El visor se cierra con Escape o clic afuera; se navega con ← →.
- La vista **Índice** ofrece una lista rápida y sin movimiento, útil para jurados.
- Cada obra tiene enlace directo: `tusitio.com/#obra-ID`.

## Publicarlo gratis

Netlify Drop (app.netlify.com/drop), GitHub Pages o Vercel.
