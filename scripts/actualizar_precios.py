#!/usr/bin/env python3
"""Actualiza data/precios.json a partir de la lista diaria de precios.

Uso:
    python3 scripts/actualizar_precios.py              # lee la lista del portapapeles
    python3 scripts/actualizar_precios.py lista.txt    # lee la lista de un archivo
Opciones:
    --prueba   muestra el reporte sin guardar ni publicar nada
    --forzar   acepta cambios de precio mayores al límite de seguridad
    --si       no pide confirmación antes de publicar

Cada card de la web es una familia (data/productos.json) y muestra el menor
precio de la lista dentro de esa familia ("Desde USD X"). Todo lo demás de la
lista se ignora; las familias sin ninguna opción en la lista de hoy quedan sin
precio y la web muestra "Consultar disponibilidad".
"""
import json
import re
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTOS = ROOT / 'data' / 'productos.json'
PRECIOS = ROOT / 'data' / 'precios.json'

MAX_CAMBIO = 0.30   # variación máxima aceptada sin --forzar (30%)
MIN_LINEAS = 5      # menos líneas con precio = probablemente no es la lista

# "Nombre — USD 1.210", "Nombre - $1210", "Nombre: 1210", "Nombre<TAB>1210"
LINEA = re.compile(
    r'^(?P<nombre>.+?)'
    r'(?:\s+[-–—]\s*|\s*[—–:|]\s*|\t+)'
    r'(?:U\$[SD]|USD|US\$|\$)?\s*'
    r'(?P<precio>\d[\d.,]*)\s*(?:USD)?$',
    re.IGNORECASE,
)


def normalizar(texto):
    t = unicodedata.normalize('NFKD', texto)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = t.upper()
    t = re.sub(r'["“”″\']', '', t)                    # 13" = 13
    t = re.sub(r'WI-?FI', 'WIFI', t)
    t = re.sub(r'(\d)\s+(GB|TB|MM)\b', r'\1\2', t)    # 256 GB = 256GB
    return re.sub(r'\s+', ' ', t).strip()


def parsear_precio(s):
    s = s.strip('.,')
    m = re.fullmatch(r'(\d{1,3}(?:[.,]\d{3})+)[.,](\d{2})', s)    # 1.730,00 / 1,730.00
    if m:
        return parsear_precio(m[1]) + int(m[2]) / 100 if int(m[2]) else parsear_precio(m[1])
    if re.fullmatch(r'\d{1,3}(?:[.,]\d{3})+', s):     # 1.210 / 1,210
        return int(re.sub(r'[.,]', '', s))
    if re.fullmatch(r'\d+', s):
        return int(s)
    if re.fullmatch(r'\d+[.,]\d{1,2}', s):
        return float(s.replace(',', '.'))
    return None


# Títulos de sección de la lista (*IPHONE*, *MACBOOK*…). Desde oct-2026 las líneas
# no repiten la familia ("17 Pro 256" bajo *IPHONE*), así que se le antepone.
SECCIONES = {
    'IPHONE': 'iPhone',
    'MACBOOK': 'MacBook',
    'MAC MINI': 'Mac mini',
    'IMAC': 'iMac',
    'IPAD': 'iPad',
    'AIRPODS': 'AirPods',
    'APPLE WATCH': 'Apple Watch',
    'APPLE PENCIL': 'Apple Pencil',
    'AIRTAG': 'AirTag',
    'MAGIC KEYBOARD': 'Magic Keyboard',
    'CARGADOR': 'Cargador',
}
TITULO = re.compile(r'^\*([^*\d]+)\*$')


def parsear_lista(texto):
    """Devuelve [(nombre_original, nombre_normalizado, precio)]."""
    items = []
    prefijo = None
    for raw in texto.splitlines():
        t = TITULO.match(raw.strip())
        if t:
            prefijo = SECCIONES.get(normalizar(t[1]))
            continue
        linea = raw.replace('*', '').replace('_', '').strip()
        linea = re.sub(r'^[^\w"]+', '', linea)        # viñetas / emojis
        m = LINEA.match(linea)
        if not m:
            continue
        precio = parsear_precio(m['precio'])
        if not precio or precio <= 0:
            continue
        nombre = m['nombre'].strip()
        if prefijo and not pertenece(normalizar(nombre), [normalizar(prefijo)], []):
            nombre = f'{prefijo} {nombre}'
        items.append((nombre, normalizar(nombre), precio))
    return items


def pertenece(clave, empieza, excluye):
    """True si el nombre normalizado empieza con alguno de los prefijos (como
    palabra completa) y el resto no contiene ninguna palabra excluida."""
    for pre in empieza:
        if clave == pre or clave.startswith(pre + ' '):
            resto = ' ' + re.sub(r'[/,()]', ' ', clave[len(pre):]) + ' '
            if not any(f' {x} ' in resto for x in excluye):
                return True
    return False


def fmt(usd):
    return f"USD {usd:,.0f}".replace(',', '.')


def leer_texto(archivos):
    if archivos:
        return Path(archivos[0]).read_text(encoding='utf-8')
    try:
        return subprocess.run(['pbpaste'], capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        sys.exit('No pude leer el portapapeles. Pasá la lista como archivo: '
                 'python3 scripts/actualizar_precios.py lista.txt')


def git(*args, check=True):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=check)


def publicar(hoy):
    if not git('status', '--porcelain', '--', str(PRECIOS)).stdout.strip():
        print('\nLos precios publicados ya son estos. No hay nada para subir.')
        return
    git('add', '--', str(PRECIOS))
    git('commit', '-m', f'Precios {hoy}', '--', str(PRECIOS))
    r = git('push', check=False)
    if r.returncode != 0:
        print('\n✗ Se guardó el cambio pero falló el push a GitHub:\n' + r.stderr)
        print('  Revisá la conexión y corré `git push` (o volvé a ejecutar este script).')
        sys.exit(1)
    print('\n✓ Publicado. La web se actualiza en ~1–2 minutos.')


def main():
    args = sys.argv[1:]
    prueba = '--prueba' in args
    forzar = '--forzar' in args
    sin_confirmar = '--si' in args
    archivos = [a for a in args if not a.startswith('--')]

    if not prueba:
        git('pull', '--ff-only', '-q', check=False)

    config = json.loads(PRODUCTOS.read_text(encoding='utf-8'))['productos']
    ids = [p['id'] for p in config]
    if len(set(ids)) != len(ids):
        sys.exit('✗ data/productos.json tiene ids repetidos. Corregilo antes de seguir.')
    reglas = [(p, [normalizar(e) for e in p['empieza']], [normalizar(x) for x in p.get('excluye', [])])
              for p in config]

    anterior = json.loads(PRECIOS.read_text(encoding='utf-8')) if PRECIOS.exists() else {}
    previos = anterior.get('precios', {})

    items = parsear_lista(leer_texto(archivos))
    if len(items) < MIN_LINEAS:
        sys.exit(f'✗ Solo encontré {len(items)} líneas con precio. ¿Copiaste la lista completa?')

    # Cada línea de la lista va a UNA familia como máximo; si cae en dos, las reglas están mal.
    familias = {p['id']: [] for p in config}
    errores = []
    for nombre, clave, precio in items:
        duenos = [p for p, empieza, excluye in reglas if pertenece(clave, empieza, excluye)]
        if len(duenos) > 1:
            errores.append(f"'{nombre}' entra en más de una familia: {', '.join(p['web'] for p in duenos)}.")
        for p in duenos:
            familias[p['id']].append((precio, nombre))

    hoy = date.today().isoformat()
    nuevos = {}
    actualizados, sin_cambio, faltantes, grandes = [], [], [], []

    for p in config:
        pid, previo = p['id'], previos.get(p['id'])
        miembros = familias[pid]
        if not miembros:
            faltantes.append(p)                       # sin precio hoy
            continue
        precio, nombre = min(miembros)                # precio de entrada de la familia
        nuevos[pid] = {'usd': precio, 'lista': nombre, 'opciones': len(miembros), 'fecha': hoy}
        fila = (p, previo, precio, nombre, len(miembros))
        if previo and previo.get('usd') == precio:
            sin_cambio.append(fila)
        else:
            actualizados.append(fila)
            if previo and abs(precio - previo['usd']) / previo['usd'] > MAX_CAMBIO:
                grandes.append(fila)

    # ── Reporte ──
    print(f'Lista leída: {len(items)} productos. Familias de la web con precio hoy: '
          f'{len(actualizados) + len(sin_cambio)} de {len(config)}.\n')
    for marca, filas in (('✓', actualizados), ('=', sin_cambio)):
        for p, previo, precio, nombre, n in filas:
            antes = f"{fmt(previo['usd'])} → " if previo and marca == '✓' else ''
            print(f"  {marca} {p['web']:<30} {antes}Desde {fmt(precio)}   ← {nombre} ({n} en la familia)")
    for p in faltantes:
        print(f"  ⚠ {p['web']:<30} ninguna opción en la lista de hoy → 'Consultar disponibilidad'")

    if errores:
        print('\n✗ No se publicó nada:\n  ' + '\n  '.join(errores))
        sys.exit(1)
    if not actualizados and not sin_cambio:
        sys.exit('\n✗ Ningún producto de la web coincidió con la lista. ¿Cambió el formato? No se publicó nada.')
    if grandes and not forzar:
        print(f'\n✗ No se publicó nada: estos precios cambian más de {MAX_CAMBIO:.0%}, '
              'puede ser un producto confundido:')
        for p, previo, precio, *_ in grandes:
            print(f"    {p['web']}: {fmt(previo['usd'])} → {fmt(precio)}")
        print('  Si son correctos, volvé a correr con --forzar.')
        sys.exit(1)

    if prueba:
        print('\n(Modo prueba: no se guardó nada.)')
        return
    if not sin_confirmar:
        if input('\n¿Publicar estos precios en la web? (s/n): ').strip().lower() not in ('s', 'si', 'sí', 'y'):
            print('Cancelado. No se cambió nada.')
            return

    PRECIOS.write_text(json.dumps({'actualizado': hoy, 'precios': nuevos}, ensure_ascii=False, indent=2) + '\n',
                       encoding='utf-8')
    publicar(hoy)


if __name__ == '__main__':
    main()
