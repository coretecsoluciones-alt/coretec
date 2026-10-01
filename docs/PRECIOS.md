# Precios — actualización diaria

## Todos los días

1. Copiá el mensaje de la lista de precios completo (tal cual sale de WhatsApp).
2. Doble clic en **`Actualizar precios.command`** (en la carpeta del proyecto).
3. Revisá el reporte y respondé `s` para publicar.

Netlify actualiza la web en ~1 minuto. No hay que tocar HTML/CSS/JS.

Desde la terminal es lo mismo: `python3 scripts/actualizar_precios.py`
(o `python3 scripts/actualizar_precios.py lista.txt` para leer de un archivo).
Con `--prueba` muestra el reporte sin guardar ni publicar nada.

## Qué hace

- Lee cada línea `Nombre — USD precio` de la lista (ignora títulos, emojis, asteriscos).
- Busca **solo** los productos definidos en `data/productos.json`. El resto de la lista se ignora.
- Escribe `data/precios.json`, hace commit y push. La web lee ese archivo al cargar y muestra "Desde USD X".

## Protecciones

| Situación | Qué pasa |
|---|---|
| Un producto de la web no está en la lista de hoy | No muestra precio; el botón dice "Consultar disponibilidad" |
| Un precio cambia más de 30% | No publica nada. Si es correcto: correr con `--forzar` |
| El mismo producto aparece dos veces con precios distintos | No publica nada |
| Ningún producto coincide / el texto copiado no es la lista | No publica nada |
| El archivo de precios no carga | La card queda como siempre, solo con "Consultar precio" |

Nunca crea ni borra cards: la web solo muestra precio en las cards que ya existen.

## Cambiar qué variante define el precio de una card

Editá `data/productos.json`, campo `lista`, con el nombre **exacto** de la lista diaria.
Se ignoran mayúsculas, acentos, comillas y espacios (`256 GB` = `256GB`), pero nada más:
`iPhone 17 Pro 256GB` nunca coincide con `iPhone 17 Pro Max 256GB`.

`"lista": null` → la card no muestra precio y dice "Consultar disponibilidad".

## Agregar una card nueva con precio

1. Crear la card en `index.html` (como hasta ahora) y agregar antes del botón:
   `<p class="card-price" data-price="mi-id" hidden></p>`
2. Agregar `{ "id": "mi-id", "web": "Nombre", "lista": "Nombre en la lista" }` a `data/productos.json`.
