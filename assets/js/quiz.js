/* ==========================================================================
   Quiz Implante Fixo — /quiz — Oral Sin Juiz de Fora
   Autoqualificacao em 6 perguntas -> WhatsApp da unidade certa, com as
   respostas na primeira mensagem. Nao ha formulario: a mensagem E o lead.

   Tracking: quiz_start / quiz_step / quiz_complete saem daqui via dataLayer
   (mesmo canal do tracking.js). O clique final no wa.me e capturado pelo
   listener global do tracking.js, que ja dispara whatsapp_click_{unidade},
   Pixel Contact e conversao Ads, alem de anexar a origem ("Vim do Google")
   na mensagem — nada disso e duplicado aqui.
   ========================================================================== */
(function () {
  'use strict';

  /* --- CONFIG ------------------------------------------------------------ */
  /* Mesmos numeros validados do tracking.js — se mudar la, mudar aqui. */
  var NUMEROS = { centro: '553299818698', benfica: '553299101440' };

  /* Quem recebe lead de fora de JF (Santos Dumont, Lima Duarte...).
     Historico de fechamentos regionais aponta Benfica — confirmar com a
     Dra./comercial antes de escalar verba para o interior. */
  var UNIDADE_INTERIOR = 'benfica';

  var UNIDADE_INFO = {
    centro:  { nome: 'Unidade Centro',  nomeCurto: 'Centro',  end: 'R. Espírito Santo, 936 — Centro' },
    benfica: { nome: 'Unidade Benfica', nomeCurto: 'Benfica', end: 'R. Diogo Álvares, 469 — Benfica' },
  };

  /* curto = como a resposta aparece na mensagem de WhatsApp.
     A objecao (pergunta 4) NAO vai na mensagem de proposito: ela personaliza
     a tela de resultado e segue no quiz_complete para leitura do comercial. */
  var PERGUNTAS = [
    {
      id: 'situacao',
      titulo: 'Qual dessas situações é a sua hoje?',
      opcoes: [
        { t: 'Perdi um ou poucos dentes', curto: 'perdi um ou poucos dentes', perfil: 'unitario' },
        { t: 'Perdi vários dentes', curto: 'perdi vários dentes', perfil: 'multiplo' },
        { t: 'Uso prótese móvel (dentadura) e ela incomoda', curto: 'uso prótese móvel que incomoda', perfil: 'protocolo' },
        { t: 'Não tenho mais dentes (ou restam poucos)', curto: 'não tenho mais dentes (ou restam poucos)', perfil: 'protocolo' },
      ],
    },
    {
      id: 'dor',
      titulo: 'O que mais pesa no seu dia a dia por causa disso?',
      opcoes: [
        { t: 'Vergonha de sorrir em fotos e conversas', curto: 'vergonha de sorrir', espelho: 'a vergonha de sorrir' },
        { t: 'Dificuldade para mastigar o que gosto', curto: 'dificuldade para mastigar', espelho: 'a dificuldade para mastigar o que gosta' },
        { t: 'Prótese que solta na hora de comer ou falar', curto: 'prótese que solta', espelho: 'a prótese que solta' },
        { t: 'Dor ou desconforto constante', curto: 'dor ou desconforto constante', espelho: 'a dor e o desconforto constantes' },
      ],
    },
    {
      id: 'tempo',
      titulo: 'Há quanto tempo você convive com isso?',
      /* urgente = puxa a frase de "isso ja dura X" no resultado. So nos
         baldes longos: com pouco tempo a frase soaria forcada. */
      opcoes: [
        { t: 'Menos de 1 ano', curto: 'menos de 1 ano' },
        { t: '1 a 3 anos', curto: '1 a 3 anos' },
        { t: '3 a 10 anos', curto: '3 a 10 anos', urgente: true },
        { t: 'Mais de 10 anos', curto: 'mais de 10 anos', urgente: true },
      ],
    },
    {
      id: 'objecao',
      titulo: 'O que mais te impediu de resolver até agora?',
      opcoes: [
        { t: 'Medo da cirurgia ("será que dói?")', valor: 'medo' },
        { t: 'Achei que não caberia no bolso', valor: 'preco' },
        { t: 'Falta de tempo, fui adiando', valor: 'tempo' },
        { t: 'Não sabia que existia solução fixa para o meu caso', valor: 'desconhecimento' },
      ],
    },
    {
      id: 'para',
      titulo: 'O atendimento seria para quem?',
      /* voz muda TODO o destinatario do resultado: quem responde por si le
         "o seu caso"; quem pesquisa pelos pais/familiar le "o caso dessa
         pessoa" — senao o filho leria como se tivesse a queixa. */
      opcoes: [
        { t: 'Para mim', curto: 'para mim', voz: 'self' },
        { t: 'Para meu pai ou minha mãe', curto: 'para meu pai/minha mãe', voz: 'terceiro' },
        { t: 'Para outro familiar', curto: 'para outro familiar', voz: 'terceiro' },
      ],
    },
    {
      id: 'regiao',
      titulo: 'Onde você (ou a pessoa) mora?',
      opcoes: [
        { t: 'Zona Norte de JF (Benfica, Santa Cruz, Nova Era, região)', curto: 'Zona Norte de JF', unidade: 'benfica' },
        { t: 'Centro e demais bairros de JF', curto: 'Centro e demais bairros de JF', unidade: 'centro' },
        { t: 'Outra cidade da região (Santos Dumont, Lima Duarte…)', curto: 'outra cidade da região', unidade: UNIDADE_INTERIOR },
      ],
    },
  ];

  var TOTAL = PERGUNTAS.length;

  /* Regra CRO/CFO: nunca "voce e candidato aprovado" — indicacao e ato
     clinico. Sem preco, sem promessa de resultado, sem minimizar risco.
     O resultado e montado a partir das respostas: a voz (self/terceiro) troca
     o destinatario inteiro, {dor} entra do espelho, {tempo} entra quando o
     caso e antigo, e a objecao escolhida puxa o acolhimento correspondente —
     cada uma das 4, nao so o medo. */
  var COPY = {
    msgIntro: 'Olá! Vim através do Quiz do site e quero agendar um horário ' +
      'com a equipe da Dra. Alice.',

    self: {
      titulo: 'Bom sinal: existe um caminho para o seu caso',
      espelho: 'Conviver com {dor} cansa — e não precisa ser assim para sempre.',
      tempo: 'E, pelo que você contou, isso já acompanha você há {tempo} — ' +
        'tempo mais que suficiente para buscar uma solução de verdade.',
      ponte: 'Pelo que você respondeu, o seu caso merece uma conversa ' +
        'presencial com a Dra. Alice. É nela que ela examina, planeja e ' +
        'confirma qual solução é indicada para você — cada caso é único.',
      objecao: {
        medo: 'E se o receio foi o que te segurou até aqui, fique tranquilo: ' +
          'essa primeira conversa não tem procedimento nenhum. É um bate-papo ' +
          'com calma, para você entender tudo antes de decidir qualquer coisa.',
        preco: 'E sobre o que cabe no seu momento: na conversa você recebe um ' +
          'plano claro, com as opções e condições na mesa — sem surpresa e ' +
          'sem compromisso.',
        tempo: 'E se a rotina foi adiando, o primeiro passo é simples: a ' +
          'conversa é rápida e marcada no horário que funciona para você.',
        desconhecimento: 'E sim: existe solução fixa para muitos casos como o ' +
          'seu. É exatamente isso que a Dra. Alice avalia e te explica ' +
          'pessoalmente, com calma.',
      },
    },

    terceiro: {
      titulo: 'Bom sinal: existe um caminho para ajudar quem você ama',
      espelho: 'Ver alguém que você ama convivendo com {dor} não é fácil — e a ' +
        'boa notícia é que não precisa ser assim para sempre.',
      tempo: 'E isso já dura {tempo}, pelo que você contou — tempo mais que ' +
        'suficiente para buscar uma solução de verdade.',
      ponte: 'Pelo que você respondeu, o caso dessa pessoa merece uma conversa ' +
        'presencial com a Dra. Alice. É nela que ela examina, planeja e ' +
        'confirma qual solução é indicada — cada caso é único. E você pode ' +
        'estar junto em cada passo.',
      objecao: {
        medo: 'E se o receio foi o que segurou até aqui, fique tranquilo: essa ' +
          'primeira conversa não tem procedimento nenhum. É um bate-papo com ' +
          'calma, para entender tudo antes de decidir qualquer coisa.',
        preco: 'E sobre o que cabe no momento de vocês: na conversa a equipe ' +
          'apresenta um plano claro, com as opções e condições — sem surpresa ' +
          'e sem compromisso.',
        tempo: 'E se a rotina foi adiando, o primeiro passo é simples: a ' +
          'conversa é rápida e marcada no melhor horário para vocês.',
        desconhecimento: 'E sim: existe solução fixa para muitos casos. É ' +
          'exatamente isso que a Dra. Alice avalia e explica pessoalmente, ' +
          'com calma.',
      },
    },
  };

  var WPP_SVG = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.003 0C7.164 0 .002 7.16.002 16c0 2.82.74 5.583 2.15 8.02L0 32l8.204-2.15A15.9 15.9 0 0 0 16.003 32C24.84 32 32 24.84 32 16S24.84 0 16.003 0zm0 29.2c-2.5 0-4.95-.67-7.088-1.94l-.508-.3-4.87 1.277 1.3-4.75-.33-.52A13.16 13.16 0 0 1 2.8 16c0-7.28 5.92-13.2 13.203-13.2 3.53 0 6.845 1.375 9.34 3.872a13.13 13.13 0 0 1 3.865 9.33c0 7.28-5.92 13.198-13.205 13.198zm7.24-9.885c-.397-.198-2.348-1.158-2.712-1.29-.363-.132-.628-.198-.892.2-.264.396-1.024 1.29-1.256 1.554-.23.264-.463.297-.86.1-.397-.2-1.676-.618-3.193-1.97-1.18-1.052-1.977-2.35-2.21-2.747-.23-.396-.024-.61.174-.807.178-.177.397-.462.595-.694.198-.23.264-.396.397-.66.132-.264.066-.495-.033-.694-.1-.198-.892-2.15-1.223-2.943-.322-.773-.65-.668-.892-.68l-.76-.014c-.264 0-.694.1-1.058.495-.363.396-1.388 1.356-1.388 3.31 0 1.953 1.42 3.84 1.618 4.104.198.264 2.796 4.27 6.775 5.986.947.41 1.686.653 2.262.836.95.302 1.815.26 2.498.157.762-.114 2.348-.96 2.68-1.884.33-.925.33-1.72.23-1.884-.098-.164-.362-.263-.76-.462z"/></svg>';

  /* --- tracking (fire-and-forget: nunca bloqueia o fluxo) ----------------- */
  function ga4(evento, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      /* mesmo formato do gtag() do tracking.js: push do objeto arguments */
      function gtag() { window.dataLayer.push(arguments); }
      gtag('event', evento, params || {});
    } catch (e) {}
  }

  /* --- estado + telas ----------------------------------------------------- */
  var respostas = {};            /* id da pergunta -> opcao escolhida */
  var completou = false;         /* quiz_complete dispara uma vez so */

  var screen = document.getElementById('quizScreen');
  var progress = document.getElementById('quizProgress');
  var progressLabel = document.getElementById('quizProgressLabel');
  var progressFill = document.getElementById('quizProgressFill');
  if (!screen) return;

  function animar() {
    screen.style.animation = 'none';
    void screen.offsetWidth; /* reflow para reiniciar a animacao de entrada */
    screen.style.animation = '';
    window.scrollTo({ top: 0 });
  }

  function mostrarProgresso(step) {
    if (step === null) { progress.hidden = true; return; }
    progress.hidden = false;
    progressLabel.textContent = 'Pergunta ' + (step + 1) + ' de ' + TOTAL;
    progressFill.style.width = Math.round(((step + 1) / TOTAL) * 100) + '%';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function renderPergunta(step) {
    var p = PERGUNTAS[step];
    mostrarProgresso(step);

    var html = '<h1 class="quiz-title">' + esc(p.titulo) + '</h1>' +
      '<div class="quiz-opts" role="group" aria-label="' + esc(p.titulo) + '">';
    p.opcoes.forEach(function (op, i) {
      html += '<button type="button" class="quiz-opt" data-i="' + i + '"' +
        (respostas[p.id] === op ? ' aria-pressed="true"' : '') + '>' +
        esc(op.t) + '</button>';
    });
    html += '</div>' +
      '<button type="button" class="quiz-back" id="quizBack">← Voltar</button>';
    screen.innerHTML = html;
    animar();

    screen.querySelectorAll('.quiz-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        respostas[p.id] = p.opcoes[parseInt(btn.getAttribute('data-i'), 10)];
        btn.classList.add('is-picked');
        ga4('quiz_step', { step: step + 1, pergunta: p.id });
        /* pausa curta para a pessoa VER a escolha marcada antes de avancar */
        setTimeout(function () {
          if (step + 1 < TOTAL) renderPergunta(step + 1);
          else renderResultado();
        }, 220);
      });
    });

    document.getElementById('quizBack').addEventListener('click', function () {
      if (step === 0) renderIntro();
      else renderPergunta(step - 1);
    });
  }

  function renderIntro() {
    mostrarProgresso(null);
    screen.innerHTML =
      '<div class="quiz-intro">' +
      '<span class="eyebrow">Teste rápido · 2 minutos</span>' +
      '<h1 class="quiz-title">Descubra se o implante fixo é indicado para o seu caso</h1>' +
      '<p class="quiz-sub">Responda 6 perguntas rápidas. No final, você fala direto no ' +
      'WhatsApp com a equipe da Dra. Alice, na unidade mais perto de você.</p>' +
      '<button type="button" class="btn btn--green btn--lg quiz-start" id="quizStart">Começar →</button>' +
      '</div>';
    animar();
    ligarStart();
  }

  function montarMensagem() {
    /* A mensagem E a captura do lead: recepcao e Shark leem tudo na chegada.
       "Vim através do Quiz" identifica o canal logo na 1a linha.
       So respostas do quiz — nunca dado pessoal ou de saude alem delas.
       O tracking.js anexa a origem ("Vim do Google") no clique. */
    return COPY.msgIntro + '\n' +
      'Situação: ' + respostas.situacao.curto +
      ' · Incomoda mais: ' + respostas.dor.curto +
      ' · Há: ' + respostas.tempo.curto +
      ' · Para: ' + respostas.para.curto +
      ' · Região: ' + respostas.regiao.curto;
  }

  function renderResultado() {
    mostrarProgresso(null);

    /* Texto por voz + respostas. A unidade roteada pela regiao e apenas
       SUGERIDA no texto; os dois botoes ficam lado a lado, ambos DIRETO no
       wa.me com o numero da propria unidade e a mesma mensagem do Quiz.
       Ninguem precisa rolar para achar a segunda unidade. */
    var voz = respostas.para.voz || 'self';
    var c = COPY[voz];
    var unidade = respostas.regiao.unidade;
    var outra = unidade === 'centro' ? 'benfica' : 'centro';
    var msg = encodeURIComponent(montarMensagem());
    function linkDe(u) { return 'https://wa.me/' + NUMEROS[u] + '?text=' + msg; }

    var espelho = c.espelho.replace('{dor}', respostas.dor.espelho);
    var ponte = (respostas.tempo.urgente
      ? c.tempo.replace('{tempo}', respostas.tempo.curto) + ' '
      : '') + c.ponte;
    var acolhimento = c.objecao[respostas.objecao.valor] || '';

    function botao(u, reco) {
      return '<a class="btn btn--wpp quiz-cta2' + (reco ? ' is-reco' : '') +
        '" href="' + linkDe(u) + '" target="_blank" rel="noopener">' + WPP_SVG +
        '<span><strong>' + esc(UNIDADE_INFO[u].nomeCurto) +
        '</strong><small>no WhatsApp</small></span></a>';
    }

    var html = '<div class="quiz-result">' +
      '<img class="quiz-result__img" src="assets/img/4T7A7618.jpg" ' +
      'alt="Dra. Alice Furtado conversando com um paciente na Oral Sin Juiz de Fora" />' +
      '<span class="eyebrow">Seu resultado</span>' +
      '<h1 class="quiz-title">' + esc(c.titulo) + '</h1>' +
      '<p class="quiz-result__mirror">' + esc(espelho) + '</p>' +
      '<p class="quiz-result__bridge">' + esc(ponte) + '</p>' +
      (acolhimento ? '<p class="quiz-result__care">' + esc(acolhimento) + '</p>' : '') +
      '<div class="quiz-result__proof">' +
      '<span class="stars">★★★★★</span>' +
      '<strong>Mais de 300 avaliações 5 estrelas nas duas unidades</strong>' +
      '<span>Dra. Alice Furtado · 11+ anos de experiência · Responsável técnica</span>' +
      '</div>' +
      '<p class="quiz-result__pick">Fale agora no WhatsApp — sugerimos a ' +
      '<strong>' + esc(UNIDADE_INFO[unidade].nomeCurto) + '</strong>, mais perto ' +
      'da região que você indicou:</p>' +
      '<div class="quiz-result__cta2">' + botao(unidade, true) + botao(outra, false) + '</div>' +
      '</div>' +
      '<button type="button" class="quiz-back" id="quizBack">← Voltar</button>';
    screen.innerHTML = html;
    animar();

    document.getElementById('quizBack').addEventListener('click', function () {
      renderPergunta(TOTAL - 1);
    });

    if (!completou) {
      completou = true;
      ga4('quiz_complete', {
        perfil: respostas.situacao.perfil,
        objecao: respostas.objecao.valor,
        regiao: respostas.regiao.curto,
        unidade: unidade,
      });
    }
  }

  function ligarStart() {
    var start = document.getElementById('quizStart');
    if (!start) return;
    start.addEventListener('click', function () {
      ga4('quiz_start', {});
      renderPergunta(0);
    });
  }

  /* tela 0 ja esta no HTML — so ligar o botao */
  ligarStart();
})();
