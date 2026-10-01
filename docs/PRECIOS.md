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
- Cada card de la web es una **familia** (MacBook Pro, iPad Air, Apple Watch Ultra…) definida en `data/productos.json`.
- Junta todas las líneas de la lista que pertenecen a esa familia y toma **el precio más bajo** → "Desde USD X".
- El resto de la lista se ignora.
- Escribe `data/precios.json`, hace commit y push. La web lee ese archivo al cargar.
- El reporte muestra, para cada card, qué línea dio el precio más bajo y cuántas opciones tiene la familia.

## Protecciones

| Situación | Qué pasa |
|---|---|
| Una familia no tiene ninguna opción en la lista de hoy | No muestra precio; el botón dice "Consultar disponibilidad" |
| Un precio cambia más de 30% | No publica nada. Si es correcto: correr con `--forzar` |
| Una línea de la lista entra en dos familias a la vez | No publica nada (hay que corregir las reglas) |
| Ningún producto coincide / el texto copiado no es la lista | No publica nada |
| El archivo de precios no carga | La card queda como siempre, solo con "Consultar precio" |

Nunca crea ni borra cards: la web solo muestra precio en las cards que ya existen.

## Reglas de familia (`data/productos.json`)

```json
{ "id": "airpods", "web": "AirPods", "empieza": ["AirPods"], "excluye": ["Pro", "Max"] }
```

- `empieza`: el nombre en la lista tiene que empezar con este texto, como palabra completa
  (`iPhone 17` no incluye `iPhone 17e`).
- `excluye`: palabras que sacan una línea de la familia (`AirPods Pro 3` no entra en AirPods).
- Se ignoran mayúsculas, acentos, comillas y espacios (`256 GB` = `256GB`).

## Agregar una card nueva con precio

1. Crear la card en `index.html` (como hasta ahora) y agregar antes del botón:
   `<p class="card-price" data-price="mi-id" hidden></p>`
2. Agregar su regla de familia a `data/productos.json` con el mismo `id`.
3. Probar con `python3 scripts/actualizar_precios.py lista.txt --prueba` y revisar qué líneas entran.
