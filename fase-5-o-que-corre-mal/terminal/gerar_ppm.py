"""Cria teste.ppm: imagem 64x64 RGB com três formas, feita aqui (sem bibliotecas)."""
L = 64
px = [[(255, 255, 255)] * L for _ in range(L)]
for y in range(8, 26):
    for x in range(8, 56):
        px[y][x] = (192, 57, 43)
for y in range(L):
    for x in range(L):
        if (x - 32) ** 2 + (y - 44) ** 2 <= 14 ** 2:
            px[y][x] = (36, 113, 163)
for y in range(30, 58):
    for x in range(4, 14):
        px[y][x] = (30, 132, 73)
with open("teste.ppm", "wb") as f:
    f.write(b"P6\n64 64\n255\n")  # cabeçalho de 12 bytes
    for linha in px:
        for r, g, b in linha:
            f.write(bytes((r, g, b)))
