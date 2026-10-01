#!/bin/bash
# Doble clic: toma la lista de precios copiada (portapapeles), muestra el
# reporte y, si confirmás, publica los precios en la web.
cd "$(dirname "$0")"
python3 scripts/actualizar_precios.py "$@"
echo
read -n 1 -s -r -p "Presioná una tecla para cerrar..."
echo
