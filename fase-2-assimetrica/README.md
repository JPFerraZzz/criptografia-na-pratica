# Fase 2: criptografia assimétrica

Resolve o problema que a fase 1 deixou aberto: duas pessoas que nunca combinaram uma password precisam de trocar mensagens em privado.

## O que faz

Uma página (`index.html` + `app.js`, só Web Crypto API) que:

1. Gera um par RSA-OAEP de 3072 bits (SHA-256), mostra a chave pública em PEM (SPKI) e mantém a privada **não extraível**.
2. Encripta um texto curto com a pública e decripta com a privada.
3. Tenta encriptar 400 bytes e mostra o erro (o limite é 318 bytes: 384 - 2x32 - 2).
4. Gera um par ECDSA P-256, assina um texto, verifica, e mostra que alterar 1 letra invalida a assinatura.

Os valores reais de cada execução aparecem no guia à direita. Funções partilhadas (base64, PEM) estão em `../assets/util.js`.

## Como correr

```
python3 -m http.server 8000
```

Abre `http://localhost:8000/fase-2-assimetrica/`.

## Conceitos

- **Privada não extraível**: `generateKey(..., extractable=false)` aplica-se à privada; o JavaScript não consegue ler os bytes dela. A pública exporta-se sempre.
- **Dois pares de chaves**: encriptar (RSA-OAEP) e assinar (ECDSA) usam chaves diferentes. A Web Crypto até impõe: uma chave de OAEP não assina.
- **Limite do OAEP**: com 3072 bits e SHA-256, no máximo 318 bytes por operação. Isto justifica a fase 3.
- **Segurança equivalente**: RSA-3072 ~ 128 bits de segurança (NIST SP 800-57 Parte 1), o mesmo que AES-128.

## Equivalente no terminal

Comandos testados em [`../fase-4-pgp/equivalencias.md`](../fase-4-pgp/equivalencias.md) (secção OpenSSL). O limite de 318 bytes confirmou-se: 318 passa, 319 dá `data too large for key size`.

## Quem escreveu o quê

Código e guia escritos pelo Claude a pedido, e testados com um script em Node (a lógica de `app.js` com a Web Crypto do Node) mais os comandos OpenSSL. **Não foi aberto num browser** durante a escrita: abre a página e confirma antes de a considerares pronta.

## Extensões possíveis

- ECDH P-256 e derivar uma chave AES a partir do segredo partilhado.
- Ed25519 quando o browser suportar (confirmar na MDN).

## O que aprendi / o que errei

(Para preencher por ti depois de fazeres as experiências do guia.)

## Fontes

MDN (SubtleCrypto: `generateKey`, `encrypt`, `sign`), RFC 8017, NIST SP 800-57 Parte 1.
