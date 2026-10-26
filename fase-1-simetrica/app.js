// Fase 1: AES-256-GCM com chave derivada de password (PBKDF2).
// Só usa a Web Crypto API do browser. Nenhuma biblioteca externa.

const enc = new TextEncoder();
const dec = new TextDecoder();

// Valor recomendado pela OWASP para PBKDF2-HMAC-SHA256 (confirmar na versão atual do cheat sheet).
const ITERACOES = 600000;
const VERSAO = "v1";

function paraB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function deB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Password + salt -> chave AES de 256 bits.
// O salt é aleatório e público: serve para a mesma password dar chaves diferentes.
async function derivarChave(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERACOES, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encriptar(texto, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  // IV de 12 bytes (tamanho recomendado para GCM). Nunca reutilizar com a mesma chave.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chave = await derivarChave(password, salt);
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, enc.encode(texto))
  );
  return { salt, iv, cifrado };
}

async function decriptar(pacote, password) {
  const [versao, s, i, c] = pacote.trim().split(".");
  if (versao !== VERSAO || !s || !i || !c) {
    throw new Error("Formato inválido. Esperado: v1.salt.iv.cifrado");
  }
  const salt = deB64(s);
  const iv = deB64(i);
  const cifrado = deB64(c);
  const chave = await derivarChave(password, salt);
  const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, chave, cifrado);
  return dec.decode(claro);
}

function montarPacote({ salt, iv, cifrado }) {
  return [VERSAO, paraB64(salt), paraB64(iv), paraB64(cifrado)].join(".");
}

const $ = (id) => document.getElementById(id);

// Ligação ao guia da página (ver ../assets/fase.js). Se não existir, não faz nada.
const passo = (...ids) => window.marcarPasso && window.marcarPasso(...ids);
const mostrar = (nome, texto) => window.mostrarValor && window.mostrarValor(nome, texto);

const paraHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const curto = (hex, max = 48) => (hex.length > max ? hex.slice(0, max) + "…" : hex);

$("encriptar").addEventListener("click", async () => {
  $("resultado").textContent = "";
  $("resultado").dataset.estado = "";
  try {
    const r = await encriptar($("texto").value, $("password").value);
    $("pacote").value = montarPacote(r);
    $("detalhes").textContent =
      `salt: ${r.salt.length} bytes\n` +
      `iv: ${r.iv.length} bytes\n` +
      `cifrado: ${r.cifrado.length} bytes ` +
      `(${r.cifrado.length - 16} de texto + 16 da etiqueta de autenticação GCM)\n` +
      `iterações PBKDF2: ${ITERACOES}`;
    const nTexto = r.cifrado.length - 16;
    mostrar("salt", paraHex(r.salt));
    mostrar("iv", paraHex(r.iv));
    mostrar("cifrado", `${nTexto} bytes: ` + curto(paraHex(r.cifrado.slice(0, nTexto))));
    mostrar("etiqueta", paraHex(r.cifrado.slice(nTexto)));
    passo("entrada", "encriptar", "pacote");
  } catch (e) {
    $("resultado").dataset.estado = "erro";
    $("resultado").textContent = "Erro ao encriptar: " + e.message;
  }
});

$("decriptar").addEventListener("click", async () => {
  try {
    $("resultado").textContent = "Decriptado com sucesso:\n" + (await decriptar($("pacote").value, $("password").value));
    $("resultado").dataset.estado = "ok";
    passo("decriptar");
  } catch (e) {
    // O GCM não distingue password errada de dados alterados: ambos falham a autenticação.
    $("resultado").dataset.estado = "erro";
    $("resultado").textContent =
      "Falhou. Password errada ou dados alterados (o GCM rejeitou a autenticação).\n" + e.message;
    passo("decriptar");
  }
});

// Inverte 1 bit do primeiro byte do texto cifrado para mostrar que o GCM deteta alterações.
$("adulterar").addEventListener("click", () => {
  const partes = $("pacote").value.trim().split(".");
  if (partes.length !== 4) {
    $("resultado").dataset.estado = "erro";
    $("resultado").textContent = "Encripta primeiro.";
    return;
  }
  const bytes = deB64(partes[3]);
  bytes[0] ^= 1;
  partes[3] = paraB64(bytes);
  $("pacote").value = partes.join(".");
  $("resultado").dataset.estado = "";
  $("resultado").textContent = "Alterei 1 bit. Carrega em Decriptar e vê o que acontece.";
  passo("adulterar");
});
