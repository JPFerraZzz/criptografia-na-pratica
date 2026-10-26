# Correções ao resumo

Comparação entre o resumo que escrevi depois de ler o capítulo ([`resumo-original.md`](resumo-original.md)) e o que as fontes primárias dizem. Cada correção indica o erro, a versão certa e onde confirmar.

## 1. A assimétrica não é "o método mais seguro"

Escrevi que a criptografia assimétrica é o método mais seguro que existe. Está errado. Segurança compara-se por bits de segurança, e uma chave AES-256 simétrica é, na prática, inquebrável com a tecnologia atual. O RSA precisa de 3072 bits para chegar a cerca de 128 bits de segurança equivalente. A assimétrica existe porque resolve outro problema: dois desconhecidos poderem comunicar sem terem combinado uma chave antes.

Fonte: NIST SP 800-57 Parte 1, tabela de equivalência entre algoritmos e tamanhos de chave.

## 2. A chave pública também serve para verificar assinaturas

"A chave que encripta não pode decriptar" é verdade para encriptação. Nas assinaturas digitais o sentido inverte-se: assinas com a chave privada e qualquer pessoa verifica com a pública. O resumo só falava de um dos dois usos.

## 3. Diffie-Hellman, RSA, ElGamal e DSS não fazem todos a mesma coisa

- RSA e ElGamal encriptam.
- Diffie-Hellman é um protocolo de troca de chaves. Duas partes chegam a um segredo comum sem o enviarem, mas não encripta mensagens por si.
- DSS (com o algoritmo DSA) serve apenas para assinaturas.

Pô-los todos na mesma lista de "exemplos de assimétrica" está certo ao nível da família, mas esconde que cada um serve para uma coisa diferente.

## 4. Os exemplos simétricos do livro estão desatualizados

DES tem uma chave de 56 bits e é quebrável por força bruta há mais de vinte anos. 3DES foi retirado pelo NIST. RC2 é antigo e não se usa em projetos novos. Hoje usa-se AES (com GCM) e ChaCha20-Poly1305. A fase 1 deste repositório usa AES-256-GCM.

## 5. Criptografia híbrida não é o mesmo que PKI

Misturei dois conceitos. A criptografia híbrida é um procedimento:

1. Gera-se uma chave simétrica aleatória, usada só uma vez.
2. A mensagem é encriptada com essa chave (rápido, mesmo para ficheiros grandes).
3. A chave simétrica é encriptada com a chave pública do destinatário.
4. Envia-se a mensagem cifrada e a chave cifrada juntas.

É assim que o PGP funciona. O TLS segue a mesma ideia, mas em vez de encriptar a chave de sessão, as duas pontas acordam-na por Diffie-Hellman (ECDHE). A parte dos certificados, utilizadores válidos e revogação que descrevi pertence à PKI (infraestrutura de chave pública), que garante que uma chave pública é mesmo de quem diz ser. Revogar não é algo que o "certificado faz": a autoridade certificadora publica uma lista de revogação (CRL) ou responde a consultas em tempo real (OCSP).

Fontes: RFC 5280 (X.509 e CRL), RFC 6960 (OCSP), RFC 9580 (OpenPGP).

## 6. O problema real da simétrica é a distribuição da chave

Escrevi que a desvantagem é quem tem a chave poder decriptar tudo. Isso é uma consequência de a chave ser partilhada. Os dois problemas de fundo são outros:

- Como passar a chave ao destinatário sem ser intercetada.
- Escala: com n pessoas a comunicar em privado entre todas, precisas de n(n-1)/2 chaves. Com 10 pessoas são 45, com 100 são 4950.

## 7. "Chaves curtas" e "muito lento" precisam de contexto

A simétrica tem chaves curtas (256 bits) e a assimétrica chaves longas (RSA de 3072 bits) porque os algoritmos funcionam de maneira diferente, não por acaso. As curvas elípticas (ECDH, Ed25519) dão segurança equivalente com chaves de 256 bits, por isso hoje "assimétrica = chaves longas" só vale para o RSA. A lentidão é real, e é por isso que a híbrida existe.
