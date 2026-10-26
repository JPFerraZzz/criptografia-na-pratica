// Ajudantes partilhados pelas páginas das fases.
// marcarPasso("encriptar", "pacote"): os ids anteriores ficam "feitos", o último fica ativo.
// mostrarValor("salt", "ab12..."): preenche todos os elementos com data-live="salt".

(function () {
  const passos = Array.from(document.querySelectorAll(".passo"));
  const feitos = new Set();
  const duasColunas = window.matchMedia("(min-width: 62rem)");
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");

  window.marcarPasso = function (...ids) {
    ids.forEach((id) => feitos.add(id));
    const ativo = ids[ids.length - 1];
    passos.forEach((p) => {
      const id = p.dataset.passo;
      p.classList.toggle("ativo", id === ativo);
      p.classList.toggle("feito", id !== ativo && feitos.has(id));
      if (id === ativo) p.setAttribute("aria-current", "step");
      else p.removeAttribute("aria-current");
    });
    // Só desliza até ao passo quando o guia está ao lado do laboratório.
    const el = passos.find((p) => p.dataset.passo === ativo);
    if (el && duasColunas.matches) {
      el.scrollIntoView({ block: "center", behavior: reduzir.matches ? "auto" : "smooth" });
    }
  };

  window.mostrarValor = function (nome, texto) {
    document.querySelectorAll('[data-live="' + nome + '"]').forEach((e) => {
      e.textContent = texto;
    });
  };
})();
