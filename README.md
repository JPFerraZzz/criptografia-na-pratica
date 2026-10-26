# Criptografia na Prática

Repositório de estudo autodidata de criptografia. Parte de um livro, passa por um resumo meu (com os erros corrigidos) e acaba em pequenos programas que correm no browser e no terminal.

O objetivo é perceber como a criptografia funciona e, sobretudo, como falha. A parte ofensiva fica para o fim, depois de saber o que está a ser atacado.

## Demo

`https://jpferrazzz.github.io/criptografia-na-pratica/`

Tudo corre no browser de quem visita. As chaves e os textos nunca saem do teu computador.

## Aviso

Isto é material educativo. Não uses nenhum código deste repositório para proteger dados reais. Para isso existem ferramentas auditadas (GnuPG, age, libsodium). As demonstrações de ataques da fase 5 funcionam apenas sobre dados criados por ti, na tua máquina.

## Estrutura

| Pasta | Conteúdo | Estado |
|---|---|---|
| `docs/` | Resumo do capítulo, correções ao resumo e passo a passo | em revisão |
| `fase-1-simetrica/` | AES-GCM com Web Crypto API, chave derivada de password | escrita com Claude, por rever e testar |
| `fase-2-assimetrica/` | Par de chaves, encriptação e assinaturas | por fazer |
| `fase-3-hibrida/` | AES para a mensagem, chave pública para a chave AES | por fazer |
| `fase-4-pgp/` | OpenPGP.js e comparação com a fase 3 | por fazer |
| `fase-5-o-que-corre-mal/` | IV repetido, modo ECB, passwords fracas, chaves curtas | por fazer |

## Como correr localmente

A Web Crypto API só funciona em contexto seguro. `localhost` conta, abrir o ficheiro com duplo clique não é fiável. Na raiz do repo:

```
python3 -m http.server 8000
```

Depois abre `http://localhost:8000`.

## Créditos e método

O ponto de partida foi o livro **Técnicas para Hackers: Soluções para Segurança**, de Wilson Oliveira (Centro Atlântico), requisitado na biblioteca. Li o capítulo de criptografia e escrevi um resumo meu.

Usei IA (Claude) para rever o resumo, encontrar erros, propor a estrutura do projeto, escrever a fase 1 como ponto de partida e redigir a documentação de cada fase. As fases seguintes são escritas por mim, e a documentação é feita a partir do meu código e das minhas notas e revista por mim antes de cada commit. O README de cada fase diz quem escreveu o quê. Algumas partes do livro estão desatualizadas (DES e 3DES, por exemplo), por isso o repositório indica sempre o que se usa hoje.

## Erros que corrigi do meu próprio resumo

Está tudo em [`docs/correcoes-ao-resumo.md`](docs/correcoes-ao-resumo.md). Mantive a primeira versão em [`docs/resumo-original.md`](docs/resumo-original.md) para se ver a diferença, e o resumo atual está em [`docs/resumo.md`](docs/resumo.md).

## Como foi feito

O método, fase a fase, está em [`docs/passo-a-passo.md`](docs/passo-a-passo.md).

## Fontes

- MDN, Web Crypto API (SubtleCrypto: `encrypt`, `deriveKey`, `generateKey`)
- NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)
- NIST SP 800-57 Parte 1, Recommendation for Key Management (equivalência entre tamanhos de chave)
- NIST SP 800-131A, transição de algoritmos e tamanhos de chave
- OWASP Password Storage Cheat Sheet (iterações recomendadas para PBKDF2)
- RFC 8017, PKCS #1 (RSA)
- RFC 4880 e RFC 9580, OpenPGP
- RFC 5280, certificados X.509 e CRL; RFC 6960, OCSP

## Licença

MIT, ver [`LICENSE`](LICENSE).
