# Fase 5: o que corre mal

Objetivo: ver na prática como a criptografia bem escolhida falha quando é mal usada. É aqui que o repositório passa de "sei usar" a "percebo como se ataca".

## Regras desta fase

- Só se ataca material criado por ti, na tua máquina, durante a demonstração.
- Nada de alvos reais, nada de dados de terceiros, nada de ferramentas apontadas a serviços online.
- Cada demonstração termina com a correção: o que se faz para não cair no erro.

## Demonstrações

### 1. ECB e o pinguim

Encriptar uma imagem em modo ECB e em modo CBC/GCM e comparar. Em ECB os blocos iguais dão cifrados iguais, por isso a silhueta da imagem continua visível. Usa uma imagem de teste criada por ti (um bitmap simples com formas geométricas serve). Ferramenta: `openssl enc -aes-128-ecb` sobre os dados de pixels, mantendo o cabeçalho do ficheiro.

### 2. IV repetido

Encriptar duas mensagens com a mesma chave e o mesmo IV num modo baseado em contador (como o GCM). A operação XOR dos dois cifrados dá o XOR dos dois textos, o que permite recuperar texto conhecendo parte de uma das mensagens. Script em Python ou Node, só com mensagens inventadas.

### 3. Password fraca

Ficheiro encriptado com a fase 1 e uma password do tipo `sol2024`. Escrever um pequeno script que tenta uma lista de passwords comuns (lista que tu crias) e mede quantas tentativas por segundo consegue com 600 000 iterações e com 1 000. Mostra por que razão o número de iterações importa.

### 4. Chave RSA pequena

Gerar uma chave RSA de 512 bits (só para a demonstração) e factorizar o módulo com uma ferramenta pública de factorização, para ver que a chave privada se reconstrói a partir da pública. Comparar com o custo para 3072 bits.

## Estado

Por fazer.
