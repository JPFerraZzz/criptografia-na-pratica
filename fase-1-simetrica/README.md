# Fase 1: criptografia simétrica

Uma página que encripta e decripta texto com AES-256-GCM. A chave vem de uma password, derivada com PBKDF2. Tudo corre no browser com a Web Crypto API, sem bibliotecas.

## Como correr

```
python3 -m http.server 8000
```

Abre `http://localhost:8000`.

## O que cada parte faz

### Salt (16 bytes)

Valor aleatório e público, guardado junto do cifrado. Duas pessoas com a mesma password obtêm chaves diferentes, e um atacante não pode usar tabelas pré-calculadas de passwords.

### PBKDF2 (600 000 iterações, SHA-256)

Transforma a password numa chave de 256 bits de forma deliberadamente lenta, para travar tentativas de força bruta. Uma password fraca continua fraca, por mais iterações que tenha.

### IV (12 bytes)

Valor aleatório usado uma vez por mensagem. Com GCM, repetir o IV com a mesma chave destrói a segurança (a fase 5 mostra isto).

### Etiqueta GCM (16 bytes, no fim do cifrado)

O GCM é um modo autenticado: além de encriptar, garante que ninguém alterou os dados. O botão "Alterar 1 byte" demonstra-o. Decriptar falha em vez de devolver lixo.

## Experiências para fazer

1. Encripta o mesmo texto duas vezes com a mesma password. O pacote é diferente de cada vez. Porquê?
2. Altera uma letra da password e tenta decriptar. Compara a mensagem de erro com a de um byte alterado. São iguais, e isso é de propósito.
3. Muda `ITERACOES` para 1 000 e mede quanto tempo demora a encriptar. Depois volta a 600 000.
4. Troca a ordem do pacote e vê que o formato rejeita.

## O que fica de fora

Esta fase usa uma única password para encriptar e decriptar, por isso o problema da distribuição da chave (ver [`docs/correcoes-ao-resumo.md`](../docs/correcoes-ao-resumo.md), ponto 6) continua por resolver. A fase 2 ataca-o.
