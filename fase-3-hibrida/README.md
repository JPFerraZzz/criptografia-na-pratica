# Fase 3: criptografia híbrida

Junta as fases 1 e 2: AES-GCM para a mensagem, RSA-OAEP para a chave AES. É o desenho do PGP.

## O que faz

Uma página onde:

1. **Destinatário**: gera um par RSA-3072 (a privada fica em memória, não extraível).
2. **Remetente**: cola uma chave pública (ou usa a gerada), escolhe um texto ou ficheiro e encripta.
3. O resultado é um pacote JSON.
4. **Destinatário**: decripta o pacote com a privada; se for ficheiro, descarrega-o.
5. Botão "1 MB aleatório": encripta 1 MB, que na fase 2 era impossível; mostra os tamanhos de cada parte.
6. Mostra a impressão digital (SHA-256) da chave pública.

A privada só existe enquanto o separador está aberto. Ao recarregar a página, perdem-se as mensagens que cifraste para ela.

## Formato do pacote

```json
{
  "versao": "hibrido-v1",
  "nome": "nome do ficheiro",
  "tipo": "tipo MIME",
  "chaveCifrada": "base64, 384 bytes (chave AES-256 cifrada com RSA-OAEP)",
  "iv": "base64, 12 bytes",
  "cifrado": "base64, tamanho da mensagem + 16 bytes da etiqueta GCM"
}
```

## Como correr

```
python3 -m http.server 8000
```

Abre `http://localhost:8000/fase-3-hibrida/`.

## Conceitos

- Cifrar tudo com RSA não funciona: limite de 318 bytes e lentidão (fase 2).
- A chave AES é descartável: uma fuga compromete uma mensagem.
- **O que o híbrido não resolve**: não há garantia de que a chave pública colada é da pessoa certa. Isso é a PKI (certificados X.509, CRL, OCSP; ver [`../docs/correcoes-ao-resumo.md`](../docs/correcoes-ao-resumo.md), ponto 5). A impressão digital serve para comparar a chave por outro canal.
- Não há *forward secrecy*: quem guardar o pacote e depois roubar a privada, lê a mensagem. O TLS evita-o com ECDHE.
- O pacote tem autenticação da mensagem (GCM) mas não diz quem a enviou. Para isso é preciso assinar (fase 4).

## Equivalente no terminal

Em [`../fase-4-pgp/equivalencias.md`](../fase-4-pgp/equivalencias.md) ("A fase 3 à mão"), com `openssl` em CBC (o `openssl enc` não suporta GCM). Testado: a chave AES cifrada tem 384 bytes e recupera-se igual.

## Quem escreveu o quê

Código e guia escritos pelo Claude a pedido, testados em Node (encriptar, decriptar, 1 MB, adulteração) mas **não abertos num browser**. Confirma na página, incluindo o descarregar de ficheiros e o campo de ficheiro, que não tem como ser testado em Node.

## O que aprendi / o que errei

(Para preencher por ti.)

## Fontes

MDN (SubtleCrypto `exportKey`, `encrypt`), RFC 8017, RFC 9580 (para comparar com a fase 4), NIST SP 800-38D.
