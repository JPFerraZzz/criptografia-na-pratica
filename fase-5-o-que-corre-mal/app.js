// Fase 5: quatro erros clássicos, demonstrados só sobre dados criados nesta página.
const { enc, dec, paraB64, deB64, paraHex, $, passo, mostrar, dizer, ocupado, curto } = U;

// =====================================================================
// 1. ECB: blocos iguais dão cifrados iguais
// =====================================================================
const L = 64; // imagem de 64x64 pixels RGB = 12288 bytes = 768 blocos de 16 bytes

function desenharOriginal(c) {
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, L, L);
  g.fillStyle = "#c0392b"; g.fillRect(8, 8, 48, 18);       // faixa vermelha
  g.fillStyle = "#2471a3"; g.beginPath(); g.arc(32, 44, 14, 0, Math.PI * 2); g.fill(); // círculo azul
  g.fillStyle = "#1e8449"; g.fillRect(4, 30, 10, 28);      // barra verde
}

// Dos pixels RGBA do canvas para bytes RGB (sem canal alfa).
function pixelsRGB(c) {
  const d = c.getContext("2d").getImageData(0, 0, L, L).data;
  const rgb = new Uint8Array(L * L * 3);
  for (let i = 0, j = 0; i < d.length; i += 4) { rgb[j++] = d[i]; rgb[j++] = d[i + 1]; rgb[j++] = d[i + 2]; }
  return rgb;
}

function desenharBytes(c, rgb) {
  const g = c.getContext("2d");
  const img = g.createImageData(L, L);
  for (let i = 0, j = 0; i < img.data.length; i += 4) {
    img.data[i] = rgb[j++]; img.data[i + 1] = rgb[j++]; img.data[i + 2] = rgb[j++]; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// A Web Crypto não tem ECB. Truque: AES-CBC com IV zero sobre UM bloco de 16 bytes é um AES simples
// (o primeiro bloco do resultado). Repetido bloco a bloco, é exatamente ECB.
async function ecb(chaveCBC, dados) {
  const zeros = new Uint8Array(16);
  const blocos = [];
  for (let i = 0; i < dados.length; i += 16) {
    blocos.push(crypto.subtle.encrypt({ name: "AES-CBC", iv: zeros }, chaveCBC, dados.subarray(i, i + 16)));
  }
  const out = new Uint8Array(dados.length);
  (await Promise.all(blocos)).forEach((b, i) => out.set(new Uint8Array(b).subarray(0, 16), i * 16));
  return out;
}

const blocosDistintos = (d) => {
  const s = new Set();
  for (let i = 0; i < d.length; i += 16) s.add(paraHex(d.subarray(i, i + 16)));
  return s.size;
};

$("ecb-correr").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  desenharOriginal($("img-orig"));
  const claro = pixelsRGB($("img-orig"));
  const bruto = crypto.getRandomValues(new Uint8Array(32));
  const kCBC = await crypto.subtle.importKey("raw", bruto, "AES-CBC", false, ["encrypt"]);
  const kGCM = await crypto.subtle.importKey("raw", bruto, "AES-GCM", false, ["encrypt"]);
  const cEcb = await ecb(kCBC, claro);
  const cGcm = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: crypto.getRandomValues(new Uint8Array(12)) }, kGCM, claro)).subarray(0, claro.length);
  desenharBytes($("img-ecb"), cEcb);
  desenharBytes($("img-gcm"), cGcm);
  const n = claro.length / 16;
  mostrar("ecb-blocos", `${n} blocos de 16 bytes`);
  mostrar("ecb-d-claro", `${blocosDistintos(claro)} distintos no original`);
  mostrar("ecb-d-ecb", `${blocosDistintos(cEcb)} distintos em ECB`);
  mostrar("ecb-d-gcm", `${blocosDistintos(cGcm)} distintos em GCM`);
  dizer("res-ecb", "Mesma chave AES-256, mesma imagem. À esquerda o original, no meio ECB, à direita GCM.", "ok");
  passo("ecb");
}));

// =====================================================================
// 2. IV repetido em GCM
// =====================================================================
$("iv-correr").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  try {
    const chave = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const iv = new Uint8Array(12); // O ERRO: sempre o mesmo IV (aqui zeros) com a mesma chave
    const p1 = enc.encode($("iv-conhecida").value);
    const p2 = enc.encode($("iv-secreta").value);
    const c1 = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, p1));
    const c2 = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, p2));
    const n = Math.min(p1.length, p2.length);
    // O atacante só tem c1, c2 e a mensagem conhecida p1. Nunca vê a chave.
    const recuperado = new Uint8Array(n);
    for (let i = 0; i < n; i++) recuperado[i] = c1[i] ^ c2[i] ^ p1[i];
    const xorCifrados = new Uint8Array(n), xorClaros = new Uint8Array(n);
    for (let i = 0; i < n; i++) { xorCifrados[i] = c1[i] ^ c2[i]; xorClaros[i] = p1[i] ^ p2[i]; }
    const igual = paraHex(xorCifrados) === paraHex(xorClaros);
    mostrar("iv-xorc", curto(paraHex(xorCifrados), 64));
    mostrar("iv-xorp", curto(paraHex(xorClaros), 64));
    mostrar("iv-igual", igual ? "iguais" : "diferentes");
    dizer("res-iv",
      `c1 XOR c2 == p1 XOR p2 ? ${igual ? "SIM" : "não"}\n` +
      `Recuperado (sem a chave!) dos primeiros ${n} bytes da mensagem secreta:\n"${dec.decode(recuperado)}"` +
      (p2.length > n ? `\n(só ${n} de ${p2.length} bytes: a mensagem conhecida é mais curta)` : ""),
      igual ? "erro" : "");
    passo("iv");
  } catch (e) {
    dizer("res-iv", "Erro: " + e.message, "erro");
  }
}));

// =====================================================================
// 3. Password fraca
// =====================================================================
const LISTA = [
  "123456", "password", "12345678", "qwerty", "abc123", "benfica", "sporting", "porto", "portugal",
  "lisboa", "amor", "futebol", "123456789", "letmein", "iloveyou", "admin", "welcome", "monkey",
  "dragon", "master", "sunshine", "princess", "football", "shadow", "superman", "sol2023", "sol2024",
  "sol2025", "verao2024", "inverno2024", "mudar123", "passw0rd", "qwerty123", "trustno1", "azerty",
].join("\n");
$("lista").value = LISTA;

async function chaveDe(pw, salt, iter) {
  const m = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    m, { name: "AES-GCM", length: 256 }, false, ["decrypt", "encrypt"]);
}

async function atacar(iter) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pw = $("pw-alvo").value;
  // Ficheiro "vítima", feito como na fase 1 (a password real é a do campo, o atacante não a vê).
  const alvo = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv },
    await chaveDe(pw, salt, iter), enc.encode("conteúdo secreto de teste")));
  const palavras = $("lista").value.split("\n").map((s) => s.trim()).filter(Boolean);
  const t0 = performance.now();
  let tentativas = 0, achada = null;
  for (const p of palavras) {
    tentativas++;
    try {
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await chaveDe(p, salt, iter), alvo);
      achada = p; break;
    } catch { /* password errada: o GCM recusa */ }
    // Dá ao browser oportunidade de atualizar o ecrã.
    if (tentativas % 5 === 0) await new Promise((r) => setTimeout(r));
  }
  const seg = (performance.now() - t0) / 1000;
  return { tentativas, achada, seg, porSeg: tentativas / seg, total: palavras.length };
}

$("pw-correr").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  const iter = Number($("iter").value);
  dizer("res-pw", `A atacar com ${iter} iterações… (com 600 000 pode demorar alguns segundos)`);
  const r = await atacar(iter);
  mostrar("pw-iter", String(iter));
  mostrar("pw-tent", `${r.tentativas} de ${r.total}`);
  mostrar("pw-seg", `${r.seg.toFixed(2)} s`);
  mostrar("pw-taxa", `${r.porSeg.toFixed(1)} tentativas/s (neste browser, num só fio)`);
  const milhao = 1e6 / r.porSeg;
  mostrar("pw-milhao", milhao < 120 ? `${milhao.toFixed(0)} s` : milhao < 7200 ? `${(milhao / 60).toFixed(0)} min` : `${(milhao / 3600).toFixed(1)} h`);
  dizer("res-pw", r.achada
    ? `Password encontrada: "${r.achada}" ao fim de ${r.tentativas} tentativas (${r.seg.toFixed(2)} s).`
    : `Não está na lista (${r.tentativas} tentativas, ${r.seg.toFixed(2)} s).`, r.achada ? "erro" : "ok");
  passo("pw");
}));

// =====================================================================
// 4. RSA pequeno: factorizar o módulo recupera a privada
// =====================================================================
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
function modpow(a, e, m) { let r = 1n; a %= m; while (e > 0n) { if (e & 1n) r = r * a % m; a = a * a % m; e >>= 1n; } return r; }
function modinv(a, m) { // inverso modular (Euclides estendido)
  let [r0, r1, s0, s1] = [m, a % m, 0n, 1n];
  while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  return ((s0 % m) + m) % m;
}
function aleatorioBits(bits) {
  const b = crypto.getRandomValues(new Uint8Array(Math.ceil(bits / 8)));
  let v = 0n; for (const x of b) v = (v << 8n) | BigInt(x);
  return (v & ((1n << BigInt(bits)) - 1n)) | (1n << BigInt(bits - 1)) | 1n; // bit de topo e ímpar
}
function ehPrimo(n) { // Miller-Rabin com bases fixas (de sobra para esta demonstração)
  const peq = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const p of peq) if (n % p === 0n) return n === p;
  let d = n - 1n, s = 0; while (!(d & 1n)) { d >>= 1n; s++; }
  for (const a of peq) {
    let x = modpow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let ok = false;
    for (let i = 1; i < s; i++) { x = x * x % n; if (x === n - 1n) { ok = true; break; } }
    if (!ok) return false;
  }
  return true;
}
function primoDe(bits) { let p; do { p = aleatorioBits(bits); } while (!ehPrimo(p)); return p; }
// Pollard rho: encontra um fator em ~raiz quadrada do menor fator (2^(bits/4) passos para o módulo).
function pollardRho(n) {
  let x = 2n, y = 2n, d = 1n, passos = 0;
  const f = (v) => (v * v + 1n) % n;
  while (d === 1n) { x = f(x); y = f(f(y)); d = gcd(x > y ? x - y : y - x, n); passos++; }
  return { fator: d, passos };
}

$("rsa-correr").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  try {
    const bits = Number($("rsa-bits").value);
    const maxBytes = Math.floor((bits - 2) / 8);
    const msg = enc.encode($("rsa-msg").value);
    if (msg.length === 0 || msg.length > maxBytes) throw new Error(`Com ${bits} bits a mensagem tem de ter entre 1 e ${maxBytes} bytes.`);
    const e = 65537n;
    let p, q, n, phi;
    do { p = primoDe(bits / 2); q = primoDe(bits / 2); phi = (p - 1n) * (q - 1n); } while (p === q || gcd(e, phi) !== 1n);
    n = p * q;
    // RSA "de manual", sem padding: só para a demonstração (o OAEP existe por boas razões).
    let m = 0n; for (const b of msg) m = (m << 8n) | BigInt(b);
    const c = modpow(m, e, n);
    mostrar("rsa-n", `${n} (${n.toString(2).length} bits)`);
    mostrar("rsa-c", String(c));
    dizer("res-rsa", "A factorizar o módulo (público)… pode demorar alguns segundos.");
    await new Promise((r) => setTimeout(r, 30));
    // --- o atacante só conhece n, e e c ---
    const t0 = performance.now();
    const { fator, passos } = pollardRho(n);
    const ms = performance.now() - t0;
    const p2 = fator, q2 = n / fator;
    const d = modinv(e, (p2 - 1n) * (q2 - 1n));
    let r = modpow(c, d, n);
    const bytes = []; while (r > 0n) { bytes.unshift(Number(r & 255n)); r >>= 8n; }
    mostrar("rsa-fatores", `${p2} × ${q2}`);
    mostrar("rsa-tempo", `${ms.toFixed(0)} ms (${passos} passos do algoritmo)`);
    mostrar("rsa-d", String(d));
    dizer("res-rsa", `Módulo de ${bits} bits factorizado em ${ms.toFixed(0)} ms.\nChave privada reconstruída.\nMensagem recuperada: "${dec.decode(new Uint8Array(bytes))}"`, "erro");
    passo("rsa");
  } catch (e) {
    dizer("res-rsa", "Erro: " + e.message, "erro");
  }
}));

desenharOriginal($("img-orig"));
