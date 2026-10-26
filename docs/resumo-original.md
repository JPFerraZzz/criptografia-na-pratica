# Resumo original (antes das correções)

Fonte: Técnicas para Hackers: Soluções para Segurança, Wilson Oliveira, Centro Atlântico. Resumo escrito por mim após a primeira leitura.

## Criptografia

A criptografia existe com base em algoritmos.

### Criptografia Simétrica

- Com uma chave, é possível encriptar e decriptar, normalmente tem-se de compartilhar a chave para a mensagem poder ser acessada por outrem.
- Vantagens: rápida e chaves curtas.
- Desvantagens: um user tendo a chave pode decriptar tudo o que estiver encriptado na máquina com a mesma chave.
- Exemplos: DES, IDEA, CAST, RC2, 3DES.

### Criptografia Assimétrica

- Existem duas chaves, uma que encripta (chave pública) e outra que decripta (chave privada). Normalmente, o user 1 dá a chave pública ao user 2, o user 2 encripta uma mensagem com a chave pública e envia para o user 1, que usa a chave privada para decriptar a mensagem.
- Vantagens: o método mais seguro de criptografia existente, a chave que se usa para encriptar não pode decriptar.
- Desvantagens: muito lento e as chaves são longas.
- Exemplos: Diffie-Hellman, RSA, ElGamal e DSS.

### Criptografia Híbrida

- Junta as vantagens dos dois algoritmos (simétrico e assimétrico). Dentro de um sistema de criptografia com chave pública, existe uma certificação, que é um recurso que, após determinar os users e as suas funções válidas para este sistema, emite chaves e certificados correspondentes. Esses certificados são uma lista dos users, que é constantemente vigiada, assim que um dado passa de válido para inválido, o certificado revoga o acesso a esse user.
