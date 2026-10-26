# Passo a passo das fases

Método de trabalho: escrevo e corro o código de cada fase (da 2 em diante, ver a fase 1 abaixo). Depois junto o código, o output e o que observei, e a documentação da fase é redigida a partir disso. Reviso tudo antes do commit.

Regra para cada fase: se não consigo explicar uma linha do código, ainda não está pronta.

## Passo 0: preparar o repo

A estrutura já existe (pastas, README, LICENSE MIT, docs, `index.html` da raiz, fase 1 e planos das fases 2 a 5). Para publicar:

1. Descompactar, `git init`, primeiro commit.
2. Criar o repo público `JPFerraZzz/criptografia-na-pratica` no GitHub, vazio (sem README, sem licença, sem .gitignore, porque já existem aqui), e fazer push.
3. Em Settings > Pages, escolher Deploy from branch, `main`, pasta `/ (root)`. O site fica em `https://jpferrazzz.github.io/criptografia-na-pratica/`. É HTTPS, por isso a Web Crypto API funciona.
4. Testar localmente com `python3 -m http.server 8000` na raiz e abrir `http://localhost:8000`.

Tudo em HTML, CSS e JavaScript puro, sem build e sem dependências (exceto a OpenPGP.js na fase 4).

## Fase 1: simétrica (AES-GCM)

Objetivo: perceber o que é chave, IV, salt e etiqueta de autenticação, e porque o GCM deteta alterações.

Esta fase já tem uma versão escrita pelo Claude (`app.js`, `index.html`, `style.css` e um README). Duas opções:

- Ler e correr o que existe, fazer as experiências do README da fase e passar a linha a linha do `app.js` até conseguires explicar cada uma.
- Apagar o `app.js` e reescrevê-lo sozinho a partir dos passos abaixo, usando a versão existente só para comparar no fim.

A segunda dá mais trabalho e ensina mais. Como é a fase mais curta, é a melhor altura para a fazer, e diz-te se percebes o suficiente para as seguintes. Seja qual for a escolha, o README da fase tem de refletir o que fizeste.

Passos no código (`crypto.subtle`):
1. Gerar um salt de 16 bytes com `crypto.getRandomValues`.
2. `importKey` com a password em formato `raw`, algoritmo `PBKDF2`.
3. `deriveKey` com PBKDF2, hash SHA-256 e um número alto de iterações, para obter uma chave AES-GCM de 256 bits. Confirmar o valor recomendado na OWASP Password Storage Cheat Sheet, que muda com o tempo.
4. Gerar um IV de 12 bytes aleatório, novo a cada encriptação.
5. `encrypt` com `AES-GCM` e esse IV.
6. Mostrar no ecrã, em hex, o salt, o IV e o texto cifrado. No resultado do Web Crypto, os últimos 16 bytes são a etiqueta de autenticação.
7. Fazer o caminho inverso (`decrypt`).
8. Botão "alterar um byte do texto cifrado": o `decrypt` deve falhar com um erro. Esta é a demonstração mais importante da fase.

Perguntas a responder no README da fase: porque é que o IV tem 12 bytes, porque é que o salt não precisa de ser secreto, o que acontece com a mesma password e salts diferentes.

Equivalente no terminal:
```
openssl enc -aes-256-cbc -pbkdf2 -iter <n> -salt -in msg.txt -out msg.enc
```
O `openssl enc` não suporta GCM, por isso usa CBC. Aproveita para observar a diferença: alterar um byte num bloco do meio não dá erro nenhum, só lixo no texto decifrado. Sem etiqueta de autenticação, ninguém avisa.

Fontes: MDN (SubtleCrypto), NIST SP 800-38D, OWASP.

## Fase 2: assimétrica

Objetivo: ver na prática o par de chaves, as duas utilizações (encriptar e assinar) e o limite de tamanho do RSA.

Encriptação:
1. `generateKey` com `RSA-OAEP`, 3072 bits, expoente 65537, hash SHA-256.
2. Exportar a pública (`spki`) e a privada (`pkcs8`) e mostrá-las em PEM.
3. Encriptar um texto curto com a pública e decriptar com a privada.
4. Tentar encriptar um texto grande. Com 3072 bits e SHA-256, o limite é 318 bytes (tamanho da chave em bytes menos 2 vezes o tamanho do hash menos 2). Mostrar o erro. É este erro que justifica a fase 3.

Assinatura:
5. `generateKey` com `ECDSA` na curva P-256 (ou Ed25519, se o teu browser suportar; confirma na MDN).
6. Assinar um texto com a privada e verificar com a pública.
7. Alterar uma letra do texto e verificar outra vez: tem de dar falso.

Equivalente no terminal:
```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out priv.pem
openssl pkey -in priv.pem -pubout -out pub.pem
openssl pkeyutl -encrypt -pubin -inkey pub.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in msg.txt -out msg.enc
openssl pkeyutl -decrypt -inkey priv.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in msg.enc
openssl dgst -sha256 -sign priv.pem -out msg.sig msg.txt
openssl dgst -sha256 -verify pub.pem -signature msg.sig msg.txt
```

Fontes: MDN, RFC 8017 (RSA-OAEP), NIST SP 800-57.

## Fase 3: híbrida

Objetivo: juntar as fases 1 e 2 e perceber porque é que o PGP existe.

1. Gerar uma chave AES-GCM de 256 bits, extraível.
2. Encriptar a mensagem com ela (IV novo).
3. Exportar a chave AES em `raw` e encriptá-la com a chave pública RSA-OAEP da fase 2 (ou usar `wrapKey`).
4. Juntar tudo num pacote JSON: chave cifrada, IV e texto cifrado, em base64.
5. Decifrar: privada abre a chave AES, chave AES abre a mensagem.
6. Testar com um texto de 1 MB, que falhava na fase 2. Mostrar os tamanhos de cada parte.

Equivalente no terminal (à mão, para ver cada peça):
```
openssl rand -hex 32 > chave.hex
openssl rand -hex 16 > iv.hex
openssl enc -aes-256-cbc -K $(cat chave.hex) -iv $(cat iv.hex) -in msg.txt -out msg.enc
openssl pkeyutl -encrypt -pubin -inkey pub.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in chave.hex -out chave.enc
```
Para ver o mesmo fluxo feito pelo OpenSSL, experimenta `openssl cms -encrypt` com um certificado autoassinado.

Fontes: MDN (wrapKey), RFC 4880 / 9580 (para comparar com a fase 4).

## Fase 4: PGP a sério

Objetivo: usar uma biblioteca madura e reconhecer nela o que fiz à mão na fase 3.

1. Guardar a OpenPGP.js no repo, numa versão fixa, em vez de carregar de uma CDN.
2. Gerar um par de chaves, encriptar para a pública, decriptar com a privada, assinar e verificar.
3. A API mudou entre versões. Segue a documentação da versão que fixares, não exemplos antigos da internet.

Equivalente no terminal:
```
gpg --quick-generate-key "Teste <teste@example.com>"
gpg --armor --export teste@example.com > pub.asc
gpg --armor --encrypt --recipient teste@example.com msg.txt
gpg --list-packets msg.txt.asc
```
O `--list-packets` mostra um pacote com a chave de sessão cifrada pela pública e um pacote com os dados cifrados. É a tua fase 3, vista por dentro. Faz uma tabela no README da fase a comparar as duas.

Fontes: documentação da OpenPGP.js, RFC 4880 e RFC 9580, manual do GnuPG.

## Fase 5: o que corre mal

Objetivo: quebrar, em dados teus e na tua máquina, aquilo que construíste. Cada demo tem um README com três partes: o erro, porque funciona o ataque, como se evita.

1. IV reutilizado. Cifrar duas mensagens com a mesma chave e o mesmo IV. O XOR dos dois textos cifrados dá o XOR dos dois textos claros, e com um deles conhecido recuperas o outro. Em GCM acresce que se perde a garantia de autenticação.
2. Modo ECB. Cifrar uma imagem simples feita por ti (formas de cores diferentes) em AES-ECB, preservando o cabeçalho do ficheiro, e abrir o resultado. Os padrões continuam visíveis. Usa `openssl enc -aes-128-ecb`.
3. Password fraca. Um script que tenta uma lista de passwords comuns sobre um ficheiro teu cifrado. Medir o tempo com 1 iteração de PBKDF2 e com o valor recomendado, e comparar.
4. Chave RSA pequena. Gerar um RSA com módulo de 64 bits e factorizá-lo em Python para recuperar a privada. Mostra porque é que se usam 2048 bits ou mais.

Fontes: NIST SP 800-38D (secção sobre unicidade do IV), OWASP, NIST SP 800-57.

## No fim de cada fase

- [ ] Código corre localmente e no GitHub Pages
- [ ] Equivalente no terminal feito e comparado
- [ ] README da fase com: o que faz, como correr, o que observar, o que corre mal, fontes
- [ ] Afirmações técnicas conferidas nas fontes
- [ ] Secção "o que aprendi / o que errei" preenchida
- [ ] Estado atualizado na tabela do README principal
- [ ] Fase ativada no menu da `index.html` da raiz (hoje todas dizem "em breve", fase 1 incluída)
- [ ] Commit com mensagem clara
