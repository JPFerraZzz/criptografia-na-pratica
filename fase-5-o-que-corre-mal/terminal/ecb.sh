#!/usr/bin/env bash
# Demonstração do ECB no terminal. Cifra os pixels de teste.ppm em AES-128-ECB e em AES-128-CBC,
# mantendo o cabeçalho para os ficheiros continuarem a abrir como imagem.
# Uso: ./ecb.sh   (cria teste.ppm, teste-ecb.ppm e teste-cbc.ppm na pasta atual)
set -euo pipefail
python3 gerar_ppm.py
CAB=$(head -c 20 teste.ppm | python3 -c "import sys; d=sys.stdin.buffer.read(); print(d.index(b'255\n')+4)")
CHAVE=$(openssl rand -hex 16)
IV=$(openssl rand -hex 16)
head -c "$CAB" teste.ppm > cabecalho.bin
tail -c +"$((CAB+1))" teste.ppm > pixels.bin
openssl enc -aes-128-ecb -nopad -K "$CHAVE" -in pixels.bin -out pixels-ecb.bin
openssl enc -aes-128-cbc -nopad -K "$CHAVE" -iv "$IV" -in pixels.bin -out pixels-cbc.bin
cat cabecalho.bin pixels-ecb.bin > teste-ecb.ppm
cat cabecalho.bin pixels-cbc.bin > teste-cbc.ppm
for f in pixels.bin pixels-ecb.bin pixels-cbc.bin; do
  python3 - "$f" <<'PY'
import sys
d = open(sys.argv[1], "rb").read()
blocos = [d[i:i+16] for i in range(0, len(d), 16)]
print(f"{sys.argv[1]:16} {len(blocos)} blocos, {len(set(blocos))} distintos")
PY
done
rm -f cabecalho.bin pixels.bin pixels-ecb.bin pixels-cbc.bin
echo "Abre teste.ppm, teste-ecb.ppm e teste-cbc.ppm num visualizador (por exemplo GIMP, eog ou feh)."
