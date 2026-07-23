/* ==========================================================================
   Quiz do Sorriso — /quiz — Oral Sin Juiz de Fora
   Autoqualificacao em 6 telas -> WhatsApp da unidade certa, com as respostas
   e o caminho provavel na primeira mensagem. Nao ha formulario: a msg E o lead.

   Fluxo ramificado:
     1. para quem  -> define a VOZ (self | terceiro)
     2. objetivo   -> define a TRILHA (perdido | dentadura | estetica | orientacao)
     3. detalhe    -> pergunta que MUDA conforme a trilha (feeds o espelho da dor)
     4. tempo · 5. objecao · 6. regiao  -> universais
   Cada pessoa responde sempre 6 telas; so a 3a troca de conteudo. No fim, o
   resultado indica o PROCEDIMENTO mais comum para a trilha (nunca como
   diagnostico: a indicacao e sempre confirmada na avaliacao presencial).

   Tracking: quiz_start / quiz_step / quiz_complete via dataLayer (mesmo canal
   do tracking.js). O clique final no wa.me e capturado pelo listener global do
   tracking.js, que dispara whatsapp_click_{unidade}, Pixel Contact e conversao
   Ads e anexa a origem ("Vim do Google") — nada disso e duplicado aqui.
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

  var TOTAL = 6; /* toda pessoa responde 6 telas; so a 3a muda de conteudo */

  /* --- perguntas fixas (universais) -------------------------------------- */
  /* curto = como a resposta entra na mensagem de WhatsApp. */
  var PERG = {
    para: {
      id: 'para',
      titulo: 'Antes de começar: para quem é este atendimento?',
      /* voz muda TODO o destinatario do resultado. Perguntar no COMECO deixa
         as telas de sintoma e o resultado ja no tom certo — quem pesquisa
         pelo pai/mae nao le "o seu caso" como se tivesse a queixa. */
      opcoes: [
        { t: 'Para mim', curto: 'para mim', voz: 'self' },
        { t: 'Para meu pai ou minha mãe', curto: 'para o meu pai/mãe', voz: 'terceiro' },
        { t: 'Para outra pessoa que quero ajudar', curto: 'para um familiar', voz: 'terceiro' },
      ],
    },
    objetivo: {
      id: 'objetivo',
      titulo: 'O que você mais quer resolver?',
      /* track define a trilha da pergunta 3 e o procedimento sugerido no fim */
      opcoes: [
        { t: 'Repor um ou alguns dentes que faltam', curto: 'repor dentes que faltam', track: 'perdido' },
        { t: 'Trocar a dentadura por dentes fixos', curto: 'trocar dentadura por fixo', track: 'dentadura' },
        { t: 'Melhorar a aparência do sorriso (cor, formato, facetas)', curto: 'estética do sorriso', track: 'estetica' },
        { t: 'Ainda não sei — quero orientação', curto: 'quer orientação', track: 'orientacao' },
      ],
    },
    tempo: {
      id: 'tempo',
      titulo: 'Há quanto tempo isso te incomoda?',
      /* urgente = puxa a frase de "isso ja dura X" no resultado. So nos
         baldes longos: com pouco tempo a frase soaria forcada. */
      opcoes: [
        { t: 'Menos de 1 ano', curto: 'menos de 1 ano' },
        { t: '1 a 3 anos', curto: '1 a 3 anos' },
        { t: '3 a 10 anos', curto: '3 a 10 anos', urgente: true },
        { t: 'Mais de 10 anos', curto: 'mais de 10 anos', urgente: true },
      ],
    },
    objecao: {
      id: 'objecao',
      titulo: 'O que mais tem impedido de resolver isso?',
      opcoes: [
        { t: 'Medo do procedimento ("será que dói?")', valor: 'medo' },
        { t: 'Achei que não caberia no bolso', valor: 'preco' },
        { t: 'Falta de tempo, fui adiando', valor: 'tempo' },
        { t: 'Não sabia que existia solução para o meu caso', valor: 'desconhecimento' },
      ],
    },
    regiao: {
      id: 'regiao',
      titulo: 'Onde você (ou a pessoa) mora?',
      opcoes: [
        { t: 'Zona Norte de JF (Benfica, Santa Cruz, Nova Era, região)', curto: 'Zona Norte de JF', unidade: 'benfica' },
        { t: 'Centro e demais bairros de JF', curto: 'Centro e demais bairros de JF', unidade: 'centro' },
        { t: 'Outra cidade da região (Santos Dumont, Lima Duarte…)', curto: 'outra cidade da região', unidade: UNIDADE_INTERIOR },
      ],
    },
  };

  /* --- pergunta 3, por trilha -------------------------------------------- */
  /* espelho = como a dor entra na frase de acolhimento; curto = na mensagem.
     Na trilha "orientacao" (nao sei) as opcoes carregam um track proprio: a
     resposta reencaminha quem comecou sem saber para o procedimento certo. */
  var DETALHE = {
    perdido: {
      id: 'detalhe',
      titulo: 'O que mais incomoda por causa do dente que falta?',
      opcoes: [
        { t: 'Dificuldade para mastigar', curto: 'dificuldade para mastigar', espelho: 'a dificuldade para mastigar' },
        { t: 'Vergonha de sorrir', curto: 'vergonha de sorrir', espelho: 'a vergonha de sorrir' },
        { t: 'O espaço que fica aparecendo', curto: 'o espaço aparente', espelho: 'o espaço que fica aparecendo' },
        { t: 'Dor ou incômodo', curto: 'dor ou incômodo', espelho: 'a dor e o incômodo' },
      ],
    },
    dentadura: {
      id: 'detalhe',
      titulo: 'O que mais incomoda hoje?',
      opcoes: [
        { t: 'A prótese solta ao comer ou falar', curto: 'prótese que solta', espelho: 'a prótese que solta' },
        { t: 'Dificuldade para mastigar o que gosto', curto: 'dificuldade para mastigar', espelho: 'a dificuldade para mastigar o que gosta' },
        { t: 'Vergonha de sorrir', curto: 'vergonha de sorrir', espelho: 'a vergonha de sorrir' },
        { t: 'Dor ou feridas na gengiva', curto: 'dor ou feridas na gengiva', espelho: 'a dor e as feridas na gengiva' },
      ],
    },
    estetica: {
      id: 'detalhe',
      titulo: 'O que você mais gostaria de mudar no sorriso?',
      /* alinhador = a resposta que puxa tambem os alinhadores no resultado */
      opcoes: [
        { t: 'A cor (amarelado ou manchado)', curto: 'a cor dos dentes' },
        { t: 'O formato ou o desgaste dos dentes', curto: 'o formato dos dentes' },
        { t: 'Espaços entre os dentes', curto: 'espaços entre os dentes' },
        { t: 'Dentes tortos ou desalinhados', curto: 'dentes desalinhados', alinhador: true },
      ],
    },
    orientacao: {
      id: 'detalhe',
      titulo: 'O que mais te incomoda no sorriso hoje?',
      opcoes: [
        { t: 'Falta um ou mais dentes', curto: 'falta de dentes', espelho: 'a falta de dentes', track: 'perdido' },
        { t: 'Uso prótese/dentadura que incomoda', curto: 'prótese que incomoda', espelho: 'a prótese que incomoda', track: 'dentadura' },
        { t: 'Não gosto da aparência dos meus dentes', curto: 'a aparência dos dentes', track: 'estetica' },
        { t: 'Sinto dor ou desconforto', curto: 'dor ou desconforto', espelho: 'a dor e o desconforto' },
      ],
    },
  };

  /* trilha efetiva: na "orientacao", a pergunta 3 reencaminha para a real */
  function trackAtual() {
    var base = respostas.objetivo ? respostas.objetivo.track : 'orientacao';
    if (base === 'orientacao' && respostas.detalhe && respostas.detalhe.track) {
      return respostas.detalhe.track;
    }
    return base;
  }

  /* sequencia das 6 telas — recalculada a cada render (a 3a depende da 2a) */
  function fluxo() {
    var tk = respostas.objetivo ? respostas.objetivo.track : 'orientacao';
    return [PERG.para, PERG.objetivo, DETALHE[tk], PERG.tempo, PERG.objecao, PERG.regiao];
  }

  /* --- copy do resultado (CRO/CFO) --------------------------------------- */
  /* Nunca "voce e candidato aprovado" — indicacao e ato clinico. Sem preco,
     sem promessa, sem "melhor/unico/garantido", sem minimizar risco. O
     procedimento aparece como "caminho mais comum", sempre com a ressalva de
     que so a avaliacao presencial confirma. */
  var COPY = {
    msgIntro: 'Olá! Vim através do Quiz do site e quero agendar um horário ' +
      'com a equipe da Dra. Alice.',

    titulo: {
      self: 'Bom sinal: existe um caminho para o seu caso',
      terceiro: 'Bom sinal: existe um caminho para ajudar quem você ama',
    },

    /* espelho por familia de trilha: "incomodo" injeta {x}; "estetica" nao,
       porque "conviver com a cor dos dentes" nao soa bem. */
    espelho: {
      incomodo: {
        self: 'Conviver com {x} cansa — e não precisa ser assim para sempre.',
        terceiro: 'Ver alguém que você ama convivendo com {x} não é fácil — e a ' +
          'boa notícia é que não precisa ser assim para sempre.',
      },
      estetica: {
        self: 'Não gostar do próprio sorriso mexe com a autoestima todo dia — ' +
          'e dá, sim, para mudar isso.',
        terceiro: 'Quando alguém que a gente ama não se sente bem com o próprio ' +
          'sorriso, a gente quer ajudar — e dá, sim, para mudar isso.',
      },
    },

    /* frase do procedimento — nome em <strong>, inserido como HTML confiavel */
    procedimento: {
      perdido: 'Para um ou poucos dentes ausentes, o caminho mais comum é o ' +
        '<strong>implante dentário</strong> — um pino que repõe a raiz, com uma ' +
        'coroa de aparência natural por cima.',
      dentadura: 'Para trocar a dentadura por dentes presos, o caminho costuma ' +
        'ser a <strong>prótese fixa sobre implantes</strong> (protocolo) — os ' +
        'dentes ficam firmes, sem precisar tirar para limpar.',
      estetica: 'Para renovar a aparência do sorriso, os caminhos mais comuns ' +
        'são as <strong>facetas</strong> ou as <strong>lentes de contato ' +
        'dental</strong> — lâminas finas que ajustam cor e formato.',
      esteticaAlinhador: 'Para renovar o sorriso entram as <strong>facetas</strong> ' +
        'e as <strong>lentes de contato dental</strong>; e, para o alinhamento, ' +
        'os <strong>alinhadores invisíveis</strong> — a Dra. define a combinação certa.',
      orientacao: 'Existe mais de um caminho conforme o seu caso — do ' +
        '<strong>implante</strong> às <strong>facetas</strong> — e é justamente ' +
        'isso que a avaliação vai esclarecer para você.',
    },

    /* ressalva presencial (voz) — fecha a frase do procedimento */
    ressalva: {
      self: ' Cada caso é único: é na conversa presencial com a Dra. Alice que ' +
        'isso é examinado, planejado e confirmado — sem compromisso.',
      terceiro: ' Cada caso é único: é na conversa presencial com a Dra. Alice ' +
        'que isso é examinado, planejado e confirmado — e você pode estar junto ' +
        'em cada passo.',
    },

    tempo: {
      self: 'E, pelo que você contou, isso já dura {tempo} — tempo mais que ' +
        'suficiente para buscar uma solução de verdade.',
      terceiro: 'E isso já dura {tempo}, pelo que você contou — tempo mais que ' +
        'suficiente para buscar uma solução de verdade.',
    },

    objecao: {
      self: {
        medo: 'E se o receio foi o que te segurou até aqui, fique tranquilo: ' +
          'essa primeira conversa não tem procedimento nenhum. É um bate-papo ' +
          'com calma, para você entender tudo antes de decidir qualquer coisa.',
        preco: 'E sobre o que cabe no seu momento: na conversa você recebe um ' +
          'plano claro, com as opções e condições na mesa — sem surpresa e ' +
          'sem compromisso.',
        tempo: 'E se a rotina foi adiando, o primeiro passo é simples: a ' +
          'conversa é rápida e marcada no horário que funciona para você.',
        desconhecimento: 'E sim: existe solução para muitos casos como o seu. É ' +
          'exatamente isso que a Dra. Alice avalia e te explica pessoalmente, ' +
          'com calma.',
      },
      terceiro: {
        medo: 'E se o receio foi o que segurou até aqui, fique tranquilo: essa ' +
          'primeira conversa não tem procedimento nenhum. É um bate-papo com ' +
          'calma, para entender tudo antes de decidir qualquer coisa.',
        preco: 'E sobre o que cabe no momento de vocês: na conversa a equipe ' +
          'apresenta um plano claro, com as opções e condições — sem surpresa ' +
          'e sem compromisso.',
        tempo: 'E se a rotina foi adiando, o primeiro passo é simples: a ' +
          'conversa é rápida e marcada no melhor horário para vocês.',
        desconhecimento: 'E sim: existe solução para muitos casos. É exatamente ' +
          'isso que a Dra. Alice avalia e explica pessoalmente, com calma.',
      },
    },
  };

  /* rotulo curto do caminho provavel — vai na mensagem para o comercial */
  var PROC_CURTO = {
    perdido: 'implante dentário',
    dentadura: 'prótese fixa / protocolo',
    estetica: 'facetas / lentes',
    orientacao: 'a definir na avaliação',
  };

  var WPP_SVG = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.003 0C7.164 0 .002 7.16.002 16c0 2.82.74 5.583 2.15 8.02L0 32l8.204-2.15A15.9 15.9 0 0 0 16.003 32C24.84 32 32 24.84 32 16S24.84 0 16.003 0zm0 29.2c-2.5 0-4.95-.67-7.088-1.94l-.508-.3-4.87 1.277 1.3-4.75-.33-.52A13.16 13.16 0 0 1 2.8 16c0-7.28 5.92-13.2 13.203-13.2 3.53 0 6.845 1.375 9.34 3.872a13.13 13.13 0 0 1 3.865 9.33c0 7.28-5.92 13.198-13.205 13.198zm7.24-9.885c-.397-.198-2.348-1.158-2.712-1.29-.363-.132-.628-.198-.892.2-.264.396-1.024 1.29-1.256 1.554-.23.264-.463.297-.86.1-.397-.2-1.676-.618-3.193-1.97-1.18-1.052-1.977-2.35-2.21-2.747-.23-.396-.024-.61.174-.807.178-.177.397-.462.595-.694.198-.23.264-.396.397-.66.132-.264.066-.495-.033-.694-.1-.198-.892-2.15-1.223-2.943-.322-.773-.65-.668-.892-.68l-.76-.014c-.264 0-.694.1-1.058.495-.363.396-1.388 1.356-1.388 3.31 0 1.953 1.42 3.84 1.618 4.104.198.264 2.796 4.27 6.775 5.986.947.41 1.686.653 2.262.836.95.302 1.815.26 2.498.157.762-.114 2.348-.96 2.68-1.884.33-.925.33-1.72.23-1.884-.098-.164-.362-.263-.76-.462z"/></svg>';

  /* --- tracking (fire-and-forget: nunca bloqueia o fluxo) ---------------- */
  function ga4(evento, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      /* mesmo formato do gtag() do tracking.js: push do objeto arguments */
      function gtag() { window.dataLayer.push(arguments); }
      gtag('event', evento, params || {});
    } catch (e) {}
  }

  /* --- estado + telas ---------------------------------------------------- */
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
    var p = fluxo()[step];
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
      '<h1 class="quiz-title">Descubra o melhor caminho para o seu sorriso</h1>' +
      '<p class="quiz-sub">Responda 6 perguntas rápidas. No final, você fala direto no ' +
      'WhatsApp com a equipe da Dra. Alice, na unidade mais perto de você.</p>' +
      '<button type="button" class="btn btn--green btn--lg quiz-start" id="quizStart">Começar →</button>' +
      '</div>';
    animar();
    ligarStart();
  }

  function montarMensagem() {
    /* A mensagem E a captura do lead: recepcao e Shark leem tudo na chegada.
       "Vim através do Quiz" identifica o canal logo na 1a linha; o "interesse
       provável" adianta o caminho para o comercial. So respostas do quiz —
       nunca dado pessoal ou de saude alem delas. O tracking.js anexa a origem
       ("Vim do Google") no clique. */
    return COPY.msgIntro + '\n' +
      'Objetivo: ' + respostas.objetivo.curto +
      ' · O que mais incomoda: ' + respostas.detalhe.curto +
      ' · Há: ' + respostas.tempo.curto +
      ' · Atendimento: ' + respostas.para.curto +
      ' · Região: ' + respostas.regiao.curto +
      ' · Interesse provável: ' + PROC_CURTO[trackAtual()];
  }

  function renderResultado() {
    mostrarProgresso(null);

    var voz = respostas.para.voz || 'self';
    var tk = trackAtual();
    var unidade = respostas.regiao.unidade;
    var outra = unidade === 'centro' ? 'benfica' : 'centro';
    var msg = encodeURIComponent(montarMensagem());
    function linkDe(u) { return 'https://wa.me/' + NUMEROS[u] + '?text=' + msg; }

    /* espelho da dor — familia estetica nao injeta detalhe */
    var familia = (tk === 'estetica') ? 'estetica' : 'incomodo';
    var espelho = COPY.espelho[familia][voz];
    if (familia === 'incomodo') {
      espelho = espelho.replace('{x}', (respostas.detalhe && respostas.detalhe.espelho) || 'isso');
    }

    /* procedimento provavel + ressalva presencial (com <strong>, HTML confiavel) */
    var procKey = tk;
    if (tk === 'estetica' && respostas.detalhe && respostas.detalhe.alinhador) procKey = 'esteticaAlinhador';
    var bridge = (respostas.tempo.urgente
      ? COPY.tempo[voz].replace('{tempo}', respostas.tempo.curto) + ' '
      : '') + COPY.procedimento[procKey] + COPY.ressalva[voz];

    var acolhimento = COPY.objecao[voz][respostas.objecao.valor] || '';

    function botao(u, reco) {
      return '<a class="btn btn--wpp quiz-cta2' + (reco ? ' is-reco' : '') +
        '" href="' + linkDe(u) + '" target="_blank" rel="noopener">' + WPP_SVG +
        '<span><strong>' + esc(UNIDADE_INFO[u].nomeCurto) +
        '</strong><small>no WhatsApp</small></span></a>';
    }

    /* espelho e bridge sao copy estatica (inclui <strong>): inserida como HTML.
       Nenhuma resposta e texto livre — todas mapeiam para constantes acima. */
    var html = '<div class="quiz-result">' +
      '<img class="quiz-result__img" src="assets/img/4T7A7618.jpg" ' +
      'alt="Dra. Alice Furtado conversando com um paciente na Oral Sin Juiz de Fora" />' +
      '<span class="eyebrow">Seu resultado</span>' +
      '<h1 class="quiz-title">' + COPY.titulo[voz] + '</h1>' +
      '<p class="quiz-result__mirror">' + espelho + '</p>' +
      '<p class="quiz-result__bridge">' + bridge + '</p>' +
      (acolhimento ? '<p class="quiz-result__care">' + acolhimento + '</p>' : '') +
      '<div class="quiz-result__proof">' +
      '<span class="stars">★★★★★</span>' +
      '<strong>Mais de 120 avaliações 5 estrelas no Google</strong>' +
      '<span>Dra. Alice Furtado, responsável técnica · +22 anos de tradição Oral Sin</span>' +
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
        objetivo: respostas.objetivo.track,
        procedimento: PROC_CURTO[tk],
        objecao: respostas.objecao.valor,
        regiao: respostas.regiao.curto,
        unidade: unidade,
        voz: voz,
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
