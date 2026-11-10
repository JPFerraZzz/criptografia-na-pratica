// Fase 3: criptografia híbrida. AES-256-GCM para os dados, RSA-OAEP para a chave AES.
const { enc, dec, paraB64, deB64, paraHex, paraPem, dePem, $, passo, mostrar, dizer, ocupado, curto } = U;

const RSA = { name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
const VERSAO = "hibrido-v1";

let par = null; // par do "destinatário", só em memória

// O destinatário gera o par e passa a pública a quem quer escrever-lhe.
$("gerar").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  dizer("res-chaves", "A gerar RSA-3072…");
  par = await crypto.subtle.generateKey(RSA, false, ["encrypt", "decrypt"]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", par.publicKey));
  $("pub").value = paraPem(spki, "PUBLIC KEY");
  mostrar("impressao", await impressao(spki));
  dizer("res-chaves", "Par gerado. A privada fica neste separador (não se exporta). A pública já está no campo da secção B.", "ok");
  passo("chaves");
}));

// Impressão digital: hash da chave pública. Para comparar por outro canal (telefone, em pessoa).
async function impressao(spki) {
  const h = paraHex(await crypto.subtle.digest("SHA-256", spki));
  return h.match(/.{1,4}/g).slice(0, 8).join(" ");
}

async function importarPublica(pem) {
  const spki = dePem(pem);
  mostrar("impressao", await impressao(spki));
  return crypto.subtle.importKey("spki", spki, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
}

// Lê o ficheiro escolhido; se não houver, usa o texto do campo.
async function lerEntrada() {
  const f = $("ficheiro").files && $("ficheiro").files[0];
  if (f) return { bytes: new Uint8Array(await f.arrayBuffer()), nome: f.name, tipo: f.type || "application/octet-stream" };
  return { bytes: enc.encode($("texto").value), nome: "mensagem.txt", tipo: "text/plain" };
}

async function encriptarHibrido(bytes, chavePublica, nome, tipo) {
  // 1. Chave AES nova, só para esta mensagem.
  const aes = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  // 2. Encriptar os dados com ela (IV novo).
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, bytes));
  // 3. Encriptar a chave AES (32 bytes, cabe no RSA) com a pública do destinatário.
  const aesRaw = await crypto.subtle.exportKey("raw", aes);
  const chaveCifrada = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, chavePublica, aesRaw));
  // 4. Pacote único.
  const pacote = { versao: VERSAO, nome, tipo, chaveCifrada: paraB64(chaveCifrada), iv: paraB64(iv), cifrado: paraB64(cifrado) };
  return { pacote, tamanhos: { claro: bytes.length, chaveAes: aesRaw.byteLength, chaveCifrada: chaveCifrada.length, iv: iv.length, cifrado: cifrado.length } };
}

async function decriptarHibrido(pacote, chavePrivada) {
  if (pacote.versao !== VERSAO) throw new Error("Versão de pacote desconhecida.");
  // 5. A privada abre a chave AES…
  const aesRaw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, chavePrivada, deB64(pacote.chaveCifrada));
  const aes = await crypto.subtle.importKey("raw", aesRaw, "AES-GCM", false, ["decrypt"]);
  // …e a chave AES abre a mensagem.
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(pacote.iv) }, aes, deB64(pacote.cifrado)));
}

function mostrarTamanhos(t) {
  mostrar("t-claro", `${t.claro} bytes`);
  mostrar("t-aes", `${t.chaveAes} bytes (a chave AES, em claro, nunca sai da página)`);
  mostrar("t-chave", `${t.chaveCifrada} bytes (chave AES cifrada com RSA)`);
  mostrar("t-iv", `${t.iv} bytes`);
  mostrar("t-cifrado", `${t.cifrado} bytes (${t.claro} + 16 da etiqueta GCM)`);
}

async function correr(bytes, nome, tipo) {
  const pub = await importarPublica($("pub").value);
  const t0 = performance.now();
  const { pacote, tamanhos } = await encriptarHibrido(bytes, pub, nome, tipo);
  const ms = Math.round(performance.now() - t0);
  $("pacote").value = JSON.stringify(pacote, null, 2);
  mostrarTamanhos(tamanhos);
  return { ms, tamanhos };
}

$("encriptar").addEventListener("click", async () => {
  try {
    const { bytes, nome, tipo } = await lerEntrada();
    const { ms, tamanhos } = await correr(bytes, nome, tipo);
    dizer("res-enc", `Encriptado "${nome}": ${tamanhos.claro} bytes em ${ms} ms.`, "ok");
    passo("chaves", "encriptar", "pacote");
  } catch (e) {
    dizer("res-enc", "Erro: " + e.message + "\n(Já geraste ou colaste uma chave pública válida?)", "erro");
  }
});

// 1 MB de bytes aleatórios: na fase 2 o RSA falhava aos 319 bytes.
$("um-mb").addEventListener("click", async () => {
  try {
    const bytes = new Uint8Array(1024 * 1024);
    for (let i = 0; i < bytes.length; i += 65536) crypto.getRandomValues(bytes.subarray(i, i + 65536));
    const { ms, tamanhos } = await correr(bytes, "um-megabyte.bin", "application/octet-stream");
    dizer("res-enc", `1 MB encriptado em ${ms} ms. O RSA só viu ${tamanhos.chaveAes} bytes (a chave AES).`, "ok");
    passo("chaves", "encriptar", "pacote", "um-mb");
  } catch (e) {
    dizer("res-enc", "Erro: " + e.message, "erro");
  }
});

$("decriptar").addEventListener("click", async () => {
  try {
    if (!par) throw new Error("Não tenho a chave privada. Só o separador que gerou o par a tem.");
    const pacote = JSON.parse($("pacote").value);
    const claro = await decriptarHibrido(pacote, par.privateKey);
    let texto = null;
    try { texto = new TextDecoder("utf-8", { fatal: true }).decode(claro); } catch { /* binário */ }
    if (texto !== null && pacote.tipo === "text/plain") {
      dizer("res-dec", `Decriptado (${claro.length} bytes):\n` + texto, "ok");
    } else {
      dizer("res-dec", `Decriptado: "${pacote.nome}", ${claro.length} bytes (não é texto, descarrega abaixo).`, "ok");
    }
    const link = $("descarregar");
    if (link.href && link.href.startsWith("blob:")) URL.revokeObjectURL(link.href);
    link.href = URL.createObjectURL(new Blob([claro], { type: pacote.tipo }));
    link.download = pacote.nome || "decifrado.bin";
    link.hidden = false;
    passo("decriptar");
  } catch (e) {
    dizer("res-dec", "Falhou: " + e.message + "\n(Pacote alterado, ou cifrado para outra chave pública.)", "erro");
    passo("decriptar");
  }
});

$("adulterar").addEventListener("click", () => {
  try {
    const p = JSON.parse($("pacote").value);
    const b = deB64(p.cifrado);
    b[0] ^= 1;
    p.cifrado = paraB64(b);
    $("pacote").value = JSON.stringify(p, null, 2);
    dizer("res-dec", "Alterei 1 bit do cifrado. Carrega em Decriptar.");
    passo("adulterar");
  } catch {
    dizer("res-dec", "Encripta primeiro.", "erro");
  }
});
