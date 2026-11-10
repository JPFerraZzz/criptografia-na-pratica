# Fase 5: o que corre mal

A criptografia bem escolhida falha quando é mal usada. Quatro demonstrações, cada uma sobre dados inventados pela própria página.

## Regras desta fase

- Só se ataca material criado pela página, na tua máquina, durante a demonstração.
- Nada de alvos reais, dados de terceiros ou ferramentas apontadas a serviços online.
- Cada demonstração termina com a correção.

## Demonstrações (todas em `index.html`)

| # | Erro | O que a página faz | Correção |
|---|---|---|---|
| 1 | Modo ECB | Desenha uma imagem 64x64, encripta com AES-ECB e com AES-GCM, mostra as duas e conta blocos distintos | Modo autenticado com IV único (GCM, ChaCha20-Poly1305) |
| 2 | IV repetido | Encripta duas mensagens com a mesma chave e IV em AES-GCM; mostra c1 XOR c2 = p1 XOR p2 e recupera a mensagem secreta sem a chave | IV novo por mensagem |
| 3 | Password fraca | Tenta uma lista de passwords (criada por mim) sobre um cifrado de teste, com 1, 1 000 ou 600 000 iterações PBKDF2, e mede tentativas/s | Passwords longas e aleatórias; iterações altas; Argon2id |
| 4 | RSA pequeno | Gera RSA de 64 ou 80 bits (RSA "de manual", BigInt), factoriza o módulo com Pollard rho e reconstrói a privada | 2048 bits no mínimo, 3072 recomendado, ou curvas elípticas |

Como a Web Crypto não tem ECB, a página simula-o com AES-CBC de IV zero bloco a bloco (equivale a ECB).

## Terminal

[`terminal/`](terminal/): `ecb.sh` faz o ECB com `openssl enc -aes-128-ecb -nopad` sobre uma imagem PPM criada por `gerar_ppm.py`, mantendo o cabeçalho para abrir como imagem. Resultado medido: 768 blocos, 31 distintos no original e em ECB, 768 distintos em CBC. Os `.ppm` gerados não vão para o git.

```
cd fase-5-o-que-corre-mal/terminal && ./ecb.sh
```

## Medidas que fiz

- Pollard rho no meu computador, em Node: 64 bits ~75 ms; 80 bits ~1,7 a 2 s; 96 bits ~47 s (1 execução cada; varia com os primos). Por isso a página só oferece 64 e 80 bits.
- PBKDF2 em Node: 27 tentativas em ~0,01 s com 1 000 iterações, e em ~1,9 s com 600 000. No browser varia.

## Quem escreveu o quê

Código e guia escritos pelo Claude a pedido, testados em Node (as quatro demonstrações, com a parte do canvas simulada) e `ecb.sh` corrido de verdade. **O desenho das imagens no canvas não foi visto num browser**: abre a página e confirma que o ECB mostra o contorno das formas.

## Como correr

```
python3 -m http.server 8000
```

Abre `http://localhost:8000/fase-5-o-que-corre-mal/`.

## O que aprendi / o que errei

(Para preencher por ti.)

## Fontes

NIST SP 800-38D (unicidade do IV), NIST SP 800-57 Parte 1, OWASP Password Storage Cheat Sheet, RFC 8017.
