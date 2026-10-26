# Fase 2: criptografia assimétrica

Objetivo: resolver o problema que a fase 1 deixou aberto. Duas pessoas que nunca combinaram uma password precisam de trocar mensagens em privado.

## O que construir

Uma página que:

1. Gera um par de chaves RSA-OAEP de 3072 bits (`crypto.subtle.generateKey`) e mostra a chave pública exportada em formato SPKI/base64.
2. Encripta um texto curto com a chave pública e decripta com a privada.
3. Gera um par ECDSA P-256, assina um texto com a privada e verifica a assinatura com a pública.
4. Mostra o que acontece se o texto for alterado depois de assinado.

## Conceitos a explicar no código

- Porque é que a chave privada nunca sai do browser (`extractable: false` onde for possível).
- Porque é que encriptar e assinar usam pares de chaves diferentes.
- O limite de tamanho do RSA-OAEP. Com 3072 bits (384 bytes) e SHA-256, cabem no máximo 318 bytes de texto por operação (384 menos 2x32 menos 2). Tenta encriptar 400 bytes e regista o erro. Esta limitação é a razão de existir a fase 3.
- Equivalência de segurança: RSA 3072 e AES-128 têm cerca de 128 bits de segurança (NIST SP 800-57).

## Extensões

- Trocar RSA por ECDH P-256 e derivar uma chave AES a partir do segredo partilhado.
- Ed25519, quando o browser o suportar (verificar compatibilidade na MDN antes de usar).

## Estado

Por fazer.
