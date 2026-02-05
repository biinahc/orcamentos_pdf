(function () {

  var LOGO_URI = "img/logo.png";
  var SIG_URI = "img/assinatura.png";

  function $(id) {
    return document.getElementById(id);
  }

  function formatBRL(value) {
    var n = isNaN(value) ? 0 : value;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function parseNumberBR(str) {
    if (!str) return 0;
    var c = String(str)
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    var n = Number(c);
    return isNaN(n) ? 0 : n;
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var listEl;
  var userEditedObs = false;

  function rowTemplate() {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-top"><div class="item-fields"><div class="item-grid">' +
      '<div class="full"><label>Serviço / Material</label><input class="desc" placeholder="Ex.: Instalação elétrica, reforma, material." /></div>' +
      '<div><label>Quantidade</label><input class="q" inputmode="decimal" placeholder="1" value="1" /></div>' +
      '<div><label>Valor unitário (R$)</label><input class="u" inputmode="decimal" placeholder="0,00" /></div>' +
      '</div><div class="item-sub"><span>Subtotal</span><span class="s">R$ 0,00</span></div></div>' +
      '<button class="item-remove" type="button" title="Remover">×</button></div>';

    var q = card.querySelector(".q");
    var u = card.querySelector(".u");
    var btn = card.querySelector(".item-remove");

    function onChange() {
      var qty = parseNumberBR(q.value || "0");
      var unit = parseNumberBR(u.value || "0");
      var sub = qty * unit;
      card.querySelector(".s").textContent = formatBRL(sub);
      recalc();
    }

    q.addEventListener("input", onChange);
    u.addEventListener("input", onChange);
    btn.addEventListener("click", function () {
      card.remove();
      recalc();
    });

    return card;
  }

  function addRow() {
    listEl.appendChild(rowTemplate());
    recalc();
  }

  function fillToday() {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    $("data").value = dd + "/" + mm + "/" + yyyy;
    buildObs(true);
  }

  function numberToWordsBRL(valor) {
    if (valor <= 0) return "";
    return "Valor total: " + formatBRL(valor);
  }

  function getVal(id) {
    var el = $(id);
    return (el && el.value ? el.value : "").trim();
  }
  function ck(id) {
    var el = $(id);
    return !!(el && el.checked);
  }

  function buildObs(force) {
    if (userEditedObs && !force) return;

    var linhas = [];
    if (ck("ck_testado"))
      linhas.push("Todo o serviço será entregue pronto e testado;");
    if (ck("ck_material"))
      linhas.push(
        "Todo o material utilizado será de responsabilidade do contratante;",
      );

    var pessoas = getVal("pessoas");
    if (ck("ck_pessoas")) {
      linhas.push(
        pessoas
          ? "O serviço será executado por " +
              pessoas +
              " pessoa(s), mediante aprovação do orçamento;"
          : "O serviço será executado por ____ pessoa(s), mediante aprovação do orçamento;",
      );
    }

    if (ck("ck_refeicao"))
      linhas.push("Refeição e transporte inclusos no orçamento;");

    var totalNum = parseNumberBR($("total").textContent || "0");
    linhas.push("Valor do serviço: " + formatBRL(totalNum) + ";");

    var entrada = parseNumberBR(getVal("entrada"));
    linhas.push(
      entrada > 0
        ? "Pagamento de entrada: " +
            formatBRL(entrada) +
            " (conforme combinado);"
        : "Pagamento de entrada: não informado;",
    );

    if (ck("ck_pagamento"))
      linhas.push("Forma de pagamento: ___________________________;");

    var inicio = getVal("inicio");
    var termino = getVal("termino");
    if (inicio || termino)
      linhas.push(
        "Previsão: início " +
          (inicio || "___/___/_____") +
          " e término " +
          (termino || "___/___/_____") +
          ";",
      );

    if (ck("ck_recado"))
      linhas.push("No aguardo de sua resposta, desde já agradecemos.");

    var out = [];
    for (var i = 0; i < linhas.length; i++) out.push("- " + linhas[i]);
    $("obs").value = out.join("\n");
  }

  function recalc() {
    var cards = listEl.querySelectorAll(".item-card");
    var subtotal = 0;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var q = (card.querySelector(".q") || { value: "0" }).value;
      var u = (card.querySelector(".u") || { value: "0" }).value;
      var qty = parseNumberBR(q);
      var unit = parseNumberBR(u);
      subtotal += qty * unit;
    }

    $("subtotal").textContent = formatBRL(subtotal);

    var desconto = parseNumberBR(getVal("desconto"));
    var mao = parseNumberBR(getVal("maoDeObra"));
    var total = Math.max(0, subtotal - desconto + mao);

    $("total").textContent = formatBRL(total);
    $("totalExtenso").textContent = numberToWordsBRL(total);

    if (!userEditedObs) buildObs(true);
  }

  function buildPrintDoc() {
    $("pLogo").src = LOGO_URI;
    $("pAss").src = SIG_URI;

    var num = (getVal("num") || $("numText").textContent || "0001").trim();
    $("pNum").textContent = num || "0001";

    $("pData").textContent = getVal("data") || "—";
    $("pCliente").textContent = getVal("cliente") || "—";
    $("pEndereco").textContent = getVal("endereco") || "—";

    var inicio = getVal("inicio");
    var termino = getVal("termino");
    $("pPrevisao").textContent =
      inicio || termino
        ? "Início: " + (inicio || "—") + " • Término: " + (termino || "—")
        : "—";

    var pessoas = getVal("pessoas");
    $("pPessoas").textContent = pessoas ? pessoas + " pessoa(s)" : "—";

    $("pDescricao").textContent = getVal("descricaoPedido") || "—";

    var pItens = $("pItens");
    pItens.innerHTML = "";

    var cards = listEl.querySelectorAll(".item-card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var desc = (card.querySelector(".desc") || { value: "" }).value.trim();
      var q = (card.querySelector(".q") || { value: "" }).value.trim();
      var u = (card.querySelector(".u") || { value: "" }).value.trim();

      var qty = parseNumberBR(q);
      var unit = parseNumberBR(u);
      var sub = qty * unit;

      if (!desc && qty === 0 && unit === 0) continue;

      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHTML(desc || "—") +
        "</td>" +
        "<td class='tr'>" +
        escapeHTML(q || "—") +
        "</td>" +
        "<td class='tr'>" +
        escapeHTML(formatBRL(unit)) +
        "</td>" +
        "<td class='tr'>" +
        escapeHTML(formatBRL(sub)) +
        "</td>";

      pItens.appendChild(tr);
    }

    var obs = $("obs").value || "";
    $("pObs").textContent = obs.trim() ? obs.trim() : "—";
    $("pThanks").style.display = ck("ck_recado") ? "block" : "none";

    $("pSubtotal").textContent = $("subtotal").textContent || "—";
    $("pDesconto").textContent = formatBRL(parseNumberBR(getVal("desconto")));
    $("pMaoObra").textContent = formatBRL(parseNumberBR(getVal("maoDeObra")));
    $("pEntrada").textContent = formatBRL(parseNumberBR(getVal("entrada")));
    $("pTotal").textContent = $("total").textContent || "—";
    $("pTotalExtenso").textContent = $("totalExtenso").textContent || "";
  }

  function exportPDF() {
    buildPrintDoc();
    window.print();
  }

  function init() {
    // coloca as imagens nos dois lugares (tela e impressão)
    $("logoImg").src = LOGO_URI;
    $("sigImg").src = SIG_URI;

    listEl = $("itemsList");

    $("btnAdd").addEventListener("click", addRow);
    $("btnAdd2").addEventListener("click", addRow);
    $("btnToday").addEventListener("click", fillToday);
    $("btnPdf").addEventListener("click", exportPDF);

    $("obs").addEventListener("input", function () {
      userEditedObs = true;
    });

    var inputs = [
      "desconto",
      "maoDeObra",
      "entrada",
      "inicio",
      "termino",
      "pessoas",
      "cliente",
      "endereco",
      "data",
      "descricaoPedido",
    ];
    for (var i = 0; i < inputs.length; i++) {
      var el = $(inputs[i]);
      if (el)
        el.addEventListener("input", function () {
          userEditedObs = false;
          recalc();
          buildObs(true);
        });
    }

    var checks = [
      "ck_testado",
      "ck_material",
      "ck_refeicao",
      "ck_pessoas",
      "ck_pagamento",
      "ck_recado",
    ];
    for (var j = 0; j < checks.length; j++) {
      var c = $(checks[j]);
      if (c)
        c.addEventListener("change", function () {
          userEditedObs = false;
          buildObs(true);
        });
    }

    $("num").addEventListener("input", function (e) {
      $("numText").textContent = e.target.value || "0001";
    });

    addRow();
    addRow();
    addRow();
    buildObs(true);
    recalc();

    window.addRow = addRow;
    window.fillToday = fillToday;
    window.exportPDF = exportPDF;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
