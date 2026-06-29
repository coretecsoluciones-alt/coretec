# CORETEC — Imágenes y Assets

## Estructura esperada

```
images/
├── hero-product.png          # Imagen hero principal (iPhone 16 Pro o Mac)
├── iphone-16-pro.png         # iPhone 16 Pro (fondo transparente, PNG)
├── iphone-16.png             # iPhone 16
├── iphone-15.png             # iPhone 15
├── macbook-pro.png           # MacBook Pro 16"
├── macbook-air.png           # MacBook Air M3
├── mac-mini.png              # Mac mini M4
├── ipad-pro.png              # iPad Pro M4
├── ipad-air.png              # iPad Air M2
├── apple-watch-ultra.png     # Apple Watch Ultra 2
├── apple-watch-series10.png  # Apple Watch Series 10
├── airpods-pro.png           # AirPods Pro 2
├── airpods-4.png             # AirPods 4
├── apple-pencil-pro.png      # Apple Pencil Pro
├── magsafe.png               # MagSafe Charger
└── logo-coretec.svg          # Logo CORETEC (si existe como vector)
```

## Cómo agregar imágenes

1. Guardá el archivo en esta carpeta con el nombre exacto listado arriba.
2. El HTML ya tiene `<img src="images/NOMBRE.png" onerror="this.style.display='none'">` en cada card.
3. Al agregar la imagen real, el placeholder SVG queda oculto automáticamente por el CSS (`card-img-icon` está en z-index 0, la imagen en z-index 1).

## Specs recomendadas

- Formato: **PNG con fondo transparente** para mayor flexibilidad
- Tamaño: mínimo 800×800px para cards, 1200×800px para hero
- Peso: optimizá con [Squoosh](https://squoosh.app/) o similar
- Imágenes Apple originales: usar PNG/WebP de alta calidad del media kit oficial

## Fuentes de imágenes Apple oficiales

Si tenés licencia/acceso al media kit Apple:
- Apple Newsroom (newsroom.apple.com) — imágenes de press de alta resolución
- Apple Product Images — backgrounds transparentes disponibles en el sitio oficial
- Formato sugerido: PNG con canal alfa, fondo transparente

## Videos (opcional)

Para agregar video al hero (tipo Apple.com):
1. Guardá el video como `hero-video.mp4` y `hero-video.webm`
2. Reemplazá el div `.hero-visual` en index.html con:
```html
<video autoplay muted loop playsinline class="hero-video">
    <source src="images/hero-video.webm" type="video/webm">
    <source src="images/hero-video.mp4" type="video/mp4">
</video>
```
3. Agregá en CSS: `.hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.6; }`
