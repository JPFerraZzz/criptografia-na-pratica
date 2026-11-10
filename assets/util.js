// Funções pequenas partilhadas pelas fases 2 a 5 (a fase 1 tem as suas no app.js).
// Fica tudo em window.U para não precisar de módulos nem de build.

(function () {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const paraB64 = (bytes) => {
    let s = "";
    const u = new Uint8Array(bytes);
    // Em blocos, para não rebentar a pilha com ficheiros grandes.
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const deB64 = (b64) => Uint8Array.from(atob(b64.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const paraHex = (bytes) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
  const curto = (txt, max = 48) => (txt.length > max ? txt.slice(0, max) + "…" : txt);

  // PEM = base64 em linhas de 64 caracteres entre duas linhas de cabeçalho.
  const paraPem = (bytes, titulo) => {
    const linhas = paraB64(bytes).match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${titulo}-----\n${linhas}\n-----END ${titulo}-----`;
  };
  const dePem = (pem) => deB64(pem.replace(/-----[^-]+-----/g, ""));

  const $ = (id) => document.getElementById(id);
  const passo = (...ids) => window.marcarPasso && window.marcarPasso(...ids);
  const mostrar = (nome, texto) => window.mostrarValor && window.mostrarValor(nome, texto);

  // Escreve numa <pre> de resultado. estado: "ok", "erro" ou "" (neutro).
  const dizer = (id, texto, estado = "") => {
    const el = $(id);
    el.dataset.estado = estado;
    el.textContent = texto;
  };

  const ocupado = async (botao, fn) => {
    botao.disabled = true;
    try { return await fn(); } finally { botao.disabled = false; }
  };

  window.U = { enc, dec, paraB64, deB64, paraHex, curto, paraPem, dePem, $, passo, mostrar, dizer, ocupado };
})();
