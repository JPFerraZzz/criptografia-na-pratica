# Equivalências: página, GnuPG e OpenSSL

Os comandos abaixo foram corridos com GnuPG 2.4.4 e OpenSSL 3.0.13, num diretório de teste (`GNUPGHOME` próprio, para não tocar no teu chaveiro). As saídas são as que observei; os identificadores mudam de máquina para máquina.

## GnuPG (equivale à página da fase 4)

| Na página | No terminal |
|---|---|
| Gerar chaves | `gpg --batch --quick-generate-key "Teste <teste@example.com>" default default never` (sem `--batch` pede passphrase) |
| Chave pública | `gpg --armor --export teste@example.com > pub.asc` |
| Encriptar | `gpg --armor --encrypt --recipient teste@example.com msg.txt` (cria `msg.txt.asc`) |
| Decriptar | `gpg --decrypt msg.txt.asc` |
| Assinar (texto legível) | `gpg --armor --clearsign -o msg.clear.asc msg.txt` |
| Assinar (binária) | `gpg --armor --sign -o msg.sig.asc msg.txt` |
| Verificar | `gpg --verify msg.clear.asc` |
| Ver os pacotes | `gpg --list-packets msg.txt.asc` |

Notas:

- Se o ficheiro de saída já existe, o `gpg` recusa-se a sobrescrever ("O ficheiro existe"). Usa `-o` com outro nome.
- Alterar uma palavra do texto de uma mensagem `--clearsign` e correr `gpg --verify` dá `Assinatura INVÁLIDA`.
- `--quick-generate-key ... default default` escolheu uma chave principal EdDSA (algoritmo 22) com uma subchave ECDH cv25519 (algoritmo 18), o mesmo desenho que a página gera.

### O que o `--list-packets` mostra

Na versão testada, uma mensagem para uma única pessoa tinha:

```
:pubkey enc packet: version 3, algo 18, keyid 67120331958B3FEE      <- PKESK (chave de sessão cifrada com a pública)
:aead encrypted packet: cipher=9 aead=2 cb=16                       <- dados cifrados (AES-256 em modo OCB)
:compressed packet: algo=2                                          <- compressão (dentro do cifrado)
:literal data packet:                                               <- o texto
```

Uma mensagem assinada com `--sign` tem `compressed`, `onepass_sig`, `literal data` e `signature packet: algo 22`.

O GnuPG 2.4 usou aqui um modo AEAD (OCB) para os dados. A página (OpenPGP.js) usa o SEIPD com MDC. Ambos autenticam os dados; o que muda é o mecanismo.

### Interoperabilidade testada

- Mensagem encriptada pelo `gpg` para uma chave sua, decriptada pela OpenPGP.js: funciona.
- Chave gerada pela OpenPGP.js com `type: "ecc", curve: "curve25519Legacy"` importada no `gpg` (`gpg --import`): o `gpg` decripta a mensagem encriptada e assinada pela OpenPGP.js e verifica a assinatura cleartext.
- Mensagem encriptada pela OpenPGP.js para uma chave pública gerada pelo `gpg`: o `gpg` decripta.
- Armadilha: com `type: "curve25519"` (formato novo da RFC 9580) o `gpg` 2.4.4 não conseguiu decriptar nem verificar ("Algoritmo de chave pública inválido"). Por isso a página gera a variante `curve25519Legacy`. Versões mais recentes do GnuPG poderão aceitar o formato novo.

## OpenSSL (equivale às fases 2 e 3, à mão)

```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out priv.pem
openssl pkey -in priv.pem -pubout -out pub.pem
```

Encriptar e decriptar uma mensagem curta com RSA-OAEP (fase 2):

```
openssl pkeyutl -encrypt -pubin -inkey pub.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in msg.txt -out msg.enc
openssl pkeyutl -decrypt -inkey priv.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in msg.enc
```

O limite que a fase 2 mostra no browser confirma-se: 318 bytes passam (saída de 384 bytes), 319 dão `data too large for key size`.

Assinar e verificar (RSA, em vez do ECDSA da página):

```
openssl dgst -sha256 -sign priv.pem -out msg.sig msg.txt
openssl dgst -sha256 -verify pub.pem -signature msg.sig msg.txt     # Verified OK
```

Se `msg.txt` for alterado, dá `Verification failure`.

### A fase 3 à mão

```
openssl rand -hex 32 > chave.hex
openssl rand -hex 16 > iv.hex
openssl enc -aes-256-cbc -K $(cat chave.hex) -iv $(cat iv.hex) -in msg.txt -out msg.enc
openssl pkeyutl -encrypt -pubin -inkey pub.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in chave.hex -out chave.enc
```

Para decriptar: `openssl pkeyutl -decrypt ... -in chave.enc -out chave2.hex` e depois `openssl enc -d -aes-256-cbc -K $(cat chave2.hex) -iv $(cat iv.hex) -in msg.enc`. O `chave.enc` tem 384 bytes e recupera a chave exata.

Diferença com a página: o `openssl enc` não suporta GCM, usei CBC. Numa mensagem de 64 bytes, inverter 1 bit no primeiro bloco cifrado fez o `openssl enc -d` terminar com sucesso (código de saída 0), com o primeiro bloco decifrado em lixo e só mais um byte alterado no bloco seguinte. Nenhum aviso. É o que o GCM evita.
