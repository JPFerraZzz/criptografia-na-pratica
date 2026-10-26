# Fase 4: PGP a sério

Objetivo: ver como uma implementação real do que fizeste à mão na fase 3 se compara, e usar as ferramentas de linha de comandos que vais encontrar em Linux.

## O que construir

1. Uma página com a biblioteca OpenPGP.js (servida localmente, não por CDN, para o repositório funcionar offline) que gera chaves, encripta, decripta, assina e verifica.
2. Um ficheiro `equivalencias.md` com os mesmos passos feitos no terminal e na página.

## Comandos a documentar e testar

GnuPG:

```
gpg --full-generate-key
gpg --armor --export <id> > publica.asc
gpg --encrypt --armor --recipient <id> mensagem.txt
gpg --decrypt mensagem.txt.asc
gpg --sign --armor mensagem.txt
gpg --verify mensagem.txt.asc
```

OpenSSL, para a parte manual das fases 2 e 3 (confirmar as opções na versão instalada antes de publicar):

```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out privada.pem
openssl pkey -in privada.pem -pubout -out publica.pem
```

## Comparar com a fase 3

- O que o formato OpenPGP guarda além do que o teu pacote guarda (algoritmos usados, identificadores de chave, carimbo de data, compressão).
- Como o OpenPGP encadeia chave de sessão, chave pública e assinatura (RFC 9580).
- Teia de confiança versus autoridades certificadoras.

## Estado

Por fazer.
