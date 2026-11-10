// Fase 4: OpenPGP.js 6.3.2 (servida localmente em vendor/). Mesmo fluxo da fase 3, feito por uma biblioteca madura.
const { $, passo, mostrar, dizer, ocupado, curto } = U;

// Etiquetas de pacote do OpenPGP (RFC 9580, secção 5).
const PACOTES = {
  1: "PKESK (chave de sessão cifrada com a pública)",
  2: "Assinatura",
  3: "SKESK (chave de sessão cifrada com password)",
  8: "Dados comprimidos",
  9: "SED (dados cifrados, sem proteção, obsoleto)",
  11: "Dados literais",
  18: "SEIPD (dados cifrados + proteção de integridade)",
};
const nomePacote = (p) => PACOTES[p.constructor.tag] || "tag " + p.constructor.tag;

let chaves = null; // { privada, publica } como objetos OpenPGP, só em memória

function precisaChaves() {
  if (!chaves) throw new Error("Gera primeiro o par de chaves.");
}

$("gerar").addEventListener("click", (ev) => ocupado(ev.target, async () => {
  dizer("res-chaves", "A gerar chave Curve25519…");
  const nome = $("nome").value.trim() || "Teste";
  const email = $("email").value.trim() || "teste@example.com";
  const r = await openpgp.generateKey({
    // Variante "legacy" (Ed25519 para assinar + ECDH sobre Curve25519 para encriptar): é a que o GnuPG 2.4
    // lê. O formato novo da RFC 9580 (type: "curve25519") não é aceite pelo GnuPG 2.4.4.
    type: "ecc",
    curve: "curve25519Legacy",
    userIDs: [{ name: nome, email }],
    format: "object",
  });
  chaves = { privada: r.privateKey, publica: r.publicKey };
  $("pub").value = chaves.publica.armor();
  $("priv").value = chaves.privada.armor();
  const sub = chaves.publica.subkeys.map((s) => s.getAlgorithmInfo().algorithm).join(", ");
  mostrar("pgp-id", chaves.publica.getFingerprint().toUpperCase().match(/.{1,4}/g).join(" "));
  mostrar("pgp-alg", `chave principal: ${chaves.publica.getAlgorithmInfo().algorithm}; subchave(s): ${sub}`);
  mostrar("pgp-criada", chaves.publica.getCreationTime().toISOString());
  dizer("res-chaves", "Par gerado (só existe nesta página; ao recarregar perde-se).", "ok");
  passo("gerar");
}));

$("encriptar").addEventListener("click", async () => {
  try {
    precisaChaves();
    const assinar = $("assinar-ao-encriptar").checked;
    const armored = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: $("texto").value }),
      encryptionKeys: chaves.publica,
      signingKeys: assinar ? chaves.privada : undefined,
    });
    $("cifrado").value = armored;
    const msg = await openpgp.readMessage({ armoredMessage: armored });
    // Os pacotes do OpenPGP: é a mesma estrutura da fase 3, mas normalizada.
    const nomes = msg.packets.map(nomePacote);
    mostrar("pgp-pacotes", nomes.map((n, i) => `${i + 1}. ${n}`).join("\n"));
    mostrar("pgp-tam", `${$("texto").value.length} caracteres → ${armored.length} caracteres armored`);
    dizer("res-enc", `Encriptado${assinar ? " e assinado" : ""}. Pacotes:\n${nomes.map((n, i) => `${i + 1}. ${n}`).join("\n")}`, "ok");
    passo("gerar", "encriptar", "pacotes");
  } catch (e) {
    dizer("res-enc", "Erro: " + e.message, "erro");
  }
});

$("decriptar").addEventListener("click", async () => {
  try {
    precisaChaves();
    const message = await openpgp.readMessage({ armoredMessage: $("cifrado").value });
    const { data, signatures } = await openpgp.decrypt({
      message, decryptionKeys: chaves.privada, verificationKeys: chaves.publica,
    });
    let estado = "sem assinatura";
    if (signatures.length) {
      try { await signatures[0].verified; estado = "assinatura VÁLIDA"; }
      catch (e) { estado = "assinatura INVÁLIDA: " + e.message; }
    }
    dizer("res-enc", `Decriptado (${estado}):\n${data}`, "ok");
    passo("decriptar");
  } catch (e) {
    dizer("res-enc", "Falhou a decriptar: " + e.message, "erro");
    passo("decriptar");
  }
});

$("adulterar").addEventListener("click", () => {
  const linhas = $("cifrado").value.split("\n");
  // Muda um carácter base64 a meio do corpo (as linhas de cabeçalho e o checksum ficam intactas).
  const i = Math.floor(linhas.length / 2);
  const l = linhas[i];
  if (!l || l.startsWith("-----")) { dizer("res-enc", "Encripta primeiro.", "erro"); return; }
  linhas[i] = l.slice(0, 5) + (l[5] === "A" ? "B" : "A") + l.slice(6);
  $("cifrado").value = linhas.join("\n");
  dizer("res-enc", "Alterei 1 carácter no meio da mensagem. Carrega em Decriptar.");
  passo("adulterar");
});

// ---------- assinar ----------
$("assinar").addEventListener("click", async () => {
  try {
    precisaChaves();
    const assinado = await openpgp.sign({
      message: await openpgp.createCleartextMessage({ text: $("texto-ass").value }),
      signingKeys: chaves.privada,
    });
    $("assinado").value = assinado;
    dizer("res-ass", "Assinado (texto legível + assinatura).", "ok");
    passo("assinar");
  } catch (e) {
    dizer("res-ass", "Erro: " + e.message, "erro");
  }
});

$("verificar").addEventListener("click", async () => {
  try {
    precisaChaves();
    const message = await openpgp.readCleartextMessage({ cleartextMessage: $("assinado").value });
    const r = await openpgp.verify({ message, verificationKeys: chaves.publica });
    try {
      await r.signatures[0].verified;
      dizer("res-ass", "Assinatura VÁLIDA.\nTexto: " + r.data, "ok");
    } catch (e) {
      dizer("res-ass", "Assinatura INVÁLIDA: " + e.message, "erro");
    }
    passo("verificar");
  } catch (e) {
    dizer("res-ass", "Erro: " + e.message, "erro");
    passo("verificar");
  }
});

$("alterar-ass").addEventListener("click", () => {
  const t = $("assinado").value;
  const marca = "-----BEGIN PGP SIGNED MESSAGE-----\nHash: ";
  if (!t.startsWith(marca)) { dizer("res-ass", "Assina primeiro.", "erro"); return; }
  // O corpo do texto vem depois da primeira linha em branco.
  const i = t.indexOf("\n\n") + 2;
  $("assinado").value = t.slice(0, i) + (t[i] === "X" ? "Y" : "X") + t.slice(i + 1);
  dizer("res-ass", "Mudei a primeira letra do texto. Carrega em Verificar.");
  passo("alterar-ass");
});
