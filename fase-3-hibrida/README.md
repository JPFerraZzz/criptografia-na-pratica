# Fase 3: criptografia híbrida

Objetivo: juntar as fases 1 e 2 e perceber por que é que o PGP e o TLS funcionam desta forma.

## O procedimento

1. Gerar uma chave AES-256 aleatória, usada uma única vez.
2. Encriptar a mensagem (ou ficheiro, de qualquer tamanho) com AES-GCM e um IV novo.
3. Encriptar a chave AES com a chave pública RSA do destinatário.
4. Guardar tudo num único pacote: chave AES cifrada, IV, texto cifrado.

Para decriptar, o destinatário usa a chave privada para recuperar a chave AES e depois decripta a mensagem.

## O que construir

Uma página que encripta um ficheiro escolhido pelo utilizador para a chave pública de outra pessoa (colada num campo) e outra secção que decripta com a chave privada. Formato do pacote em JSON com campos em base64, documentado no README.

## Conceitos a explicar

- Porque é que cifrar a mensagem toda com RSA não funciona (limite de tamanho e lentidão, ver fase 2).
- Porque é que a chave AES é descartável: se alguém a obtiver, só compromete uma mensagem.
- O que o híbrido não resolve: ninguém garante que a chave pública colada é mesmo da pessoa certa. Esse problema pertence à PKI (certificados, CRL, OCSP, ver [`docs/correcoes-ao-resumo.md`](../docs/correcoes-ao-resumo.md), ponto 5).

## Estado

Por fazer.
