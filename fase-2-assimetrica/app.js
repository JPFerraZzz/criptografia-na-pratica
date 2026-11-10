// Fase 2: RSA-OAEP (encriptar) e ECDSA P-256 (assinar), só com a Web Crypto API.
const { enc, dec, paraB64, deB64, paraPem, $, passo, mostrar, dizer, ocupado, curto, paraHex } = U;

const RSA = { name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
// Limite do OAEP: bytes da chave - 2 * bytes do hash - 2 = 384 - 64 - 2.
const LIMITE_OAEP = RSA.modulusLength / 8 - 2 * 32 - 2;

let rsa = null; // { publicKey, privateKey }
let ec = null;

// ---------- RSA ----------
$("gerar-rsa").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  dizer("res-rsa", "A gerar um par RSA de 3072 bits (pode demorar alguns segundos)…");
  const t0 = performance.now();
  // extractable: false aplica-se à privada: o browser guarda-a internamente e o JavaScript
  // nunca consegue ler os bytes dela. A pública é sempre exportável.
  rsa = await crypto.subtle.generateKey(RSA, false, ["encrypt", "decrypt"]);
  const pubBytes = new Uint8Array(await crypto.subtle.exportKey("spki", rsa.publicKey));
  // Isto é só para a página mostrar que a privada não se exporta.
  const privExtraivel = rsa.privateKey.extractable;
  $("pub-rsa").value = paraPem(pubBytes, "PUBLIC KEY");
  mostrar("rsa-tempo", `${Math.round(performance.now() - t0)} ms`);
  mostrar("rsa-extraivel", String(privExtraivel));
  mostrar("rsa-pub-bytes", `${pubBytes.length} bytes (SPKI/DER)`);
  dizer("res-rsa", "Par gerado. A chave pública está acima; a privada ficou dentro do browser e não é exportável.", "ok");
  passo("gerar-rsa");
}));

async function encriptarRSA(bytes) {
  if (!rsa) throw new Error("Gera primeiro o par de chaves.");
  return new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsa.publicKey, bytes));
}

$("enc-rsa").addEventListener("click", async () => {
  try {
    const claro = enc.encode($("txt-rsa").value);
    const c = await encriptarRSA(claro);
    $("cif-rsa").value = paraB64(c);
    mostrar("rsa-claro-n", `${claro.length} bytes`);
    mostrar("rsa-cifrado-n", `${c.length} bytes (sempre ${RSA.modulusLength / 8}, qualquer que seja o texto)`);
    mostrar("rsa-cifrado", curto(paraHex(c), 64));
    dizer("res-rsa", `Encriptado: ${claro.length} bytes → ${c.length} bytes.`, "ok");
    passo("gerar-rsa", "enc-rsa");
  } catch (e) {
    dizer("res-rsa", "Erro: " + e.message, "erro");
  }
});

$("dec-rsa").addEventListener("click", async () => {
  try {
    if (!rsa) throw new Error("Gera primeiro o par de chaves.");
    const claro = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsa.privateKey, deB64($("cif-rsa").value));
    dizer("res-rsa", "Decriptado com a chave privada:\n" + dec.decode(claro), "ok");
    passo("dec-rsa");
  } catch (e) {
    dizer("res-rsa", "Falhou a decriptar (cifrado inválido ou alterado).\n" + e.message, "erro");
    passo("dec-rsa");
  }
});

$("grande-rsa").addEventListener("click", async () => {
  const n = 400;
  try {
    await encriptarRSA(new Uint8Array(n).fill(65));
    dizer("res-rsa", `Inesperado: ${n} bytes foram aceites.`, "erro");
  } catch (e) {
    mostrar("rsa-limite", `${LIMITE_OAEP} bytes`);
    mostrar("rsa-erro", `${e.name}: ${e.message || "(sem mensagem, o browser não explica)"}`);
    dizer("res-rsa",
      `Tentei encriptar ${n} bytes. O limite com RSA-3072 + OAEP + SHA-256 é ${LIMITE_OAEP}.\n` +
      `Erro do browser: ${e.name}${e.message ? ": " + e.message : ""}\n` +
      `É por isto que a fase 3 existe.`, "erro");
    passo("grande-rsa");
  }
});

// ---------- ECDSA ----------
const ECDSA = { name: "ECDSA", hash: "SHA-256" };

$("gerar-ec").addEventListener("click", async () => {
  // Privada não extraível; a pública exporta-se sempre.
  ec = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
  const pubBytes = new Uint8Array(await crypto.subtle.exportKey("spki", ec.publicKey));
  $("pub-ec").value = paraPem(pubBytes, "PUBLIC KEY");
  mostrar("ec-pub-bytes", `${pubBytes.length} bytes (SPKI/DER)`);
  dizer("res-ec", "Par ECDSA P-256 gerado. A privada ficou não extraível.", "ok");
  passo("gerar-ec");
});

let ultimaAssinatura = null;
let textoAssinado = null;

$("assinar").addEventListener("click", async () => {
  try {
    if (!ec) throw new Error("Gera primeiro o par ECDSA.");
    textoAssinado = $("txt-ec").value;
    const sig = new Uint8Array(await crypto.subtle.sign(ECDSA, ec.privateKey, enc.encode(textoAssinado)));
    ultimaAssinatura = sig;
    $("sig").value = paraB64(sig);
    mostrar("ec-sig-n", `${sig.length} bytes (r e s, 32 cada)`);
    dizer("res-ec", "Assinado com a chave privada.", "ok");
    passo("gerar-ec", "assinar");
  } catch (e) {
    dizer("res-ec", "Erro: " + e.message, "erro");
  }
});

async function verificar() {
  if (!ec) throw new Error("Gera primeiro o par ECDSA.");
  return crypto.subtle.verify(ECDSA, ec.publicKey, deB64($("sig").value), enc.encode($("txt-ec").value));
}

$("verificar").addEventListener("click", async () => {
  try {
    const ok = await verificar();
    dizer("res-ec", ok ? "Assinatura VÁLIDA: o texto é exatamente o que foi assinado." : "Assinatura INVÁLIDA: o texto ou a assinatura foram alterados.", ok ? "ok" : "erro");
    passo("verificar");
  } catch (e) {
    dizer("res-ec", "Erro: " + e.message, "erro");
  }
});

$("alterar").addEventListener("click", async () => {
  try {
    if (!ultimaAssinatura) throw new Error("Assina primeiro.");
    const t = $("txt-ec");
    // Muda a primeira letra para outra diferente.
    t.value = (t.value[0] === "X" ? "Y" : "X") + t.value.slice(1);
    const ok = await verificar();
    dizer("res-ec", `Mudei 1 letra do texto (agora começa por "${t.value[0]}"). Verificação: ${ok ? "válida" : "INVÁLIDA"}.`, ok ? "erro" : "ok");
    passo("alterar");
  } catch (e) {
    dizer("res-ec", "Erro: " + e.message, "erro");
  }
});
