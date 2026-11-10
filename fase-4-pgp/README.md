# Fase 4: PGP a sério

Vê como uma implementação real do que fizeste à mão na fase 3 se compara, e como se faz o mesmo no terminal.

## O que faz

Uma página com a OpenPGP.js **6.3.2**, em `vendor/` (servida localmente, sem CDN, funciona offline; licença LGPL em `vendor/LICENSE`) que:

1. Gera chaves (EdDSA + ECDH sobre Curve25519, sem passphrase, por simplicidade).
2. Encripta (e opcionalmente assina) e decripta, e mostra os pacotes OpenPGP da mensagem.
3. Altera 1 carácter e mostra que a decriptação falha.
4. Assina em modo "cleartext", verifica, e mostra a falha quando se altera o texto.

## Como correr

```
python3 -m http.server 8000
```

Abre `http://localhost:8000/fase-4-pgp/`.

## Terminal

[`equivalencias.md`](equivalencias.md): os comandos `gpg` e `openssl` correspondentes, corridos de verdade (GnuPG 2.4.4, OpenSSL 3.0.13), com a saída observada de `--list-packets`.

## Comparação com a fase 3

| Fase 3 | OpenPGP |
|---|---|
| `chaveCifrada` | pacote PKESK (leva também o ID da chave destinatária) |
| `iv` + `cifrado` | pacote SEIPD (dados cifrados com integridade) |
| `versao`, `nome`, `tipo` | pacote de dados literais (formato, nome, data) |
| nada | compressão, assinatura, carimbo de data, preferências de algoritmos |
| confiar na chave colada | teia de confiança (PGP) ou autoridades certificadoras (X.509) |

## Descoberta importante: compatibilidade

A OpenPGP.js 6 gera por defeito, com `type: "curve25519"`, chaves no formato novo da RFC 9580. Testei com o GnuPG 2.4.4 e **não consegue usá-las** ("Algoritmo de chave pública inválido"). A página usa `type: "ecc", curve: "curve25519Legacy"`, e essas funcionam nos dois sentidos com o `gpg`. Versões mais recentes do GnuPG podem aceitar o formato novo.

Outras notas: o `gpg` 2.4 cifra os dados com AEAD (OCB), a página com SEIPD/MDC. Ambos autenticam.

## Quem escreveu o quê

Código, guia e `equivalencias.md` escritos pelo Claude a pedido. A lógica foi testada em Node contra a OpenPGP.js e contra o `gpg` real (interoperabilidade nos dois sentidos). **Não foi aberta num browser.** A API da OpenPGP.js muda entre versões: segue a documentação da 6.x.

## Atualizar a biblioteca

```
npm pack openpgp@<versão>   # e copiar dist/openpgp.min.js e LICENSE para vendor/
```

Depois repete os testes de interoperabilidade com o `gpg`.

## O que aprendi / o que errei

(Para preencher por ti.)

## Fontes

Documentação da OpenPGP.js, RFC 4880 e RFC 9580, manual do GnuPG.
