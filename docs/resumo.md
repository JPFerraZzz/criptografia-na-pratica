# Resumo: criptografia

Notas minhas do capítulo de criptografia de *Técnicas para Hackers: Soluções para Segurança* (Wilson Oliveira, Centro Atlântico), já com as correções. O que mudou face à primeira versão está em [`correcoes-ao-resumo.md`](correcoes-ao-resumo.md).

## Criptografia simétrica

- Uma só chave, que encripta e decripta. Para outra pessoa ler a mensagem tem de ter a mesma chave, por isso a chave tem de viajar por um canal seguro.
- Vantagens: rápida e com chaves curtas (uma chave AES-256 tem 32 bytes).
- Desvantagens: distribuir a chave sem ela ser intercetada, e não escalar. Para n pessoas falarem todas entre si, são precisas n(n-1)/2 chaves. Quem tiver a chave lê tudo o que foi cifrado com ela.
- Exemplos antigos: DES, 3DES e RC2 estão desaconselhados ou partidos. IDEA e CAST5 não estão partidos, mas caíram em desuso.
- Exemplos atuais: AES (o standard) e ChaCha20.

## Criptografia assimétrica

- Duas chaves ligadas matematicamente. A pública partilha-se, a privada fica só comigo. O que a pública encripta, só a privada decripta. O user 1 dá a chave pública ao user 2, o user 2 encripta a mensagem com ela, e o user 1 decripta com a privada.
- Também serve para assinar, e aí o sentido inverte-se: assino com a privada e qualquer pessoa verifica com a pública. Isto prova quem escreveu e que nada foi alterado.
- Vantagens: resolve a distribuição de chaves, porque não preciso de combinar um segredo antes de comunicar. Não é mais segura do que a simétrica. RSA-3072 dá cerca de 128 bits de segurança (NIST SP 800-57), o mesmo que uma chave AES-128 de 16 bytes.
- Desvantagens: lenta. O RSA tem chaves longas (2048 a 4096 bits) e só encripta mensagens pequenas. As curvas elípticas têm chaves muito mais curtas (Ed25519 usa 32 bytes).
- Exemplos e para que servem:
  - RSA: encriptar e assinar.
  - ElGamal: encriptar.
  - Diffie-Hellman: troca de chaves, não encripta nada. A versão com curvas elípticas é o ECDH.
  - DSA/DSS: só assinatura. As versões modernas são ECDSA e Ed25519.

## Criptosistemas híbridos

- Juntam o melhor dos dois: a simétrica trata da mensagem (rápida) e a assimétrica trata de passar a chave (sem canal seguro prévio).
- Passo a passo:
  1. Gera-se uma chave simétrica aleatória, usada só nesta mensagem (chave de sessão).
  2. Encripta-se a mensagem com essa chave.
  3. Encripta-se a chave de sessão com a chave pública do destinatário.
  4. Enviam-se as duas coisas.
  5. O destinatário decripta a chave de sessão com a sua privada e depois decripta a mensagem com ela.
- O PGP faz exatamente isto. O TLS segue a mesma ideia, mas em vez de encriptar a chave de sessão, as duas pontas acordam-na por Diffie-Hellman (ECDHE).

## PKI e certificados (conceito à parte)

- Problema: como sei que esta chave pública pertence mesmo à pessoa que diz ser? Um certificado liga uma identidade a uma chave pública e é assinado por uma autoridade certificadora (CA).
- Um certificado tem prazo de validade. Os que são retirados antes do prazo ficam numa lista de revogação (CRL), ou o estado é consultado ao momento por OCSP.
- No PGP não há CAs. A confiança vem de verificar a impressão digital (fingerprint) da chave com a pessoa, ou de outras pessoas que assinaram essa chave (web of trust).
