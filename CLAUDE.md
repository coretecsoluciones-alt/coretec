# CORETEC — Landing Page Premium

## Descripción
Landing page para **CORETEC**, revendedor premium de productos Apple en Argentina.
Diseño inspirado en apple.com: minimalista, mucho espacio, tipografía potente, animaciones suaves.

## Estructura del proyecto
```
coretec/
├── index.html          # Página principal (única)
├── css/style.css       # Todos los estilos
├── js/main.js          # Interacciones y animaciones JS
├── images/             # Assets visuales (ver README.md)
├── data/productos.json # Cards con precio → nombre en la lista diaria (editar a mano)
├── data/precios.json   # Precios publicados (GENERADO, no editar)
├── scripts/actualizar_precios.py  # Lista diaria → precios.json + commit/push
├── Actualizar precios.command     # Lanzador doble clic del script
└── docs/PRECIOS.md     # Flujo diario de precios
```

## Secciones
1. **Header** — Sticky, glassmorphism al scroll, logo + nav + Instagram + WhatsApp CTA
2. **Hero** — Full-screen dark, mockup CSS iPhone animado, gradient ambiental
3. **Trust Strip** — 4 pilares de confianza horizontales
4. **iPhone** — Grid 3 cols + feature strip inferior
5. **Mac** — Sección dark, grid 3 cols
6. **iPad** — Sección light, grid 2 cols
7. **Apple Watch** — Sección CORETEC deep blue, grid 2 cols
8. **Accesorios** — Grid 4 cols
9. **Comunidad** — Instagram posts grid + card CTA + testimonials
10. **WhatsApp CTA** — Sección de conversión principal
11. **Footer** — Links, redes, legal
12. **Floating WA** — Botón flotante WhatsApp siempre visible

## Paleta de colores
- `--blue: #005FFF` — Azul CORETEC (accent, CTAs)
- `--coretec-deep: #00142E` — Sección Watch (azul marino profundo)
- `--near-black: #1D1D1F` — Sección Mac
- `--gray-50: #F5F5F7` — Fondo claro (iPhone, iPad, Accesorios)
- `--white: #FFFFFF` — Cards, fondos

## Tipografía
- **Inter** (Google Fonts) — todo el sitio, pesos 300–700

## Animaciones
- **Scroll reveal**: IntersectionObserver + `.reveal` → `.reveal.visible`
- **Delays escalonados**: `.reveal-d1`, `.reveal-d2`, `.reveal-d3`
- **Hero parallax**: `requestAnimationFrame` on scroll
- **Card 3D tilt**: `mousemove` + `rotateX/Y` (solo hover:hover devices)
- **Ambient gradient**: `animation: ambientPulse` + mouse tracking
- **Device float**: `animation: deviceFloat` (keyframes)
- **WhatsApp float**: aparece después de 300px scroll

## Conversión
- WhatsApp: `https://wa.me/message/AEAC4UFJWENON1`
- Instagram: `https://www.instagram.com/coretec.ar/`
- Cada producto tiene un botón "Consultar precio" → WhatsApp
- Precios "Desde USD X": `<p class="card-price" data-price="id" hidden>` se llena desde `data/precios.json` (ver `docs/PRECIOS.md`)
- Floating button siempre visible
- CTA banner dedicado antes del footer

## Assets pendientes
- Reemplazar SVG placeholders por imágenes reales Apple (ver `images/README.md`)
- Logo CORETEC real (si existe como SVG/PNG)
- Posts reales del Instagram en la grilla (o embed de Instagram)
- Fotos de clientes para testimonials

## Pendiente
- Agregar más productos por categoría si es necesario
- Integración real con Instagram API para mostrar posts recientes
