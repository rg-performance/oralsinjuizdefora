/* ==========================================================================
   RG Tracking — Oral Sin Juiz de Fora
   Captura code-first: Meta Pixel + GA4 + Google Ads, sem GTM, sem build step.
   Carregado por index.html e por blog/*.html.
   IDs vazios = tag nao carrega. A pagina nunca quebra por falta de config.
   ========================================================================== */
(function () {
  'use strict';

  /* --- CONFIG — IDs dos consoles ---------------------------------------- */
  var RG_TRACKING = {
    /* Duas contas de anuncio (uma por unidade) => dois Pixels.
       Os DOIS carregam em todas as paginas de proposito: o Meta fica so em
       CTWA, entao o Pixel serve exclusivamente para montar publico. Cada
       conta precisa enxergar 100% dos visitantes para remarketear o pool
       inteiro de JF — carregar so "o Pixel da unidade" daria meia audiencia
       para cada uma. */
    fbPixelIds: [
      '2155246258524898', // Centro  · act_984258896091093
      '1379837757571593', // Benfica · act_1947456385756252
    ],
    ga4Id: 'G-KQ41D6MEGZ',   // propriedade 545766061 (uma so p/ as 2 unidades)
    adsId: 'AW-18245423562', // uma conta Google Ads p/ as 2 unidades
    adsLabels: {
      centro:  'cGGLCKvtgtEcEMqjjPxD', // "Contato - OS Centro"
      benfica: 'qe00CITNh9EcEMqjjPxD', // "Contato - OS Benfica"
    },
  };

  /* Numeros validados. A unidade e resolvida pelo numero no href — por isso
     o HTML nao precisa de data-attribute. Nao alterar estes numeros.
     Qualquer numero fora deste mapa cai em 'nao_atribuida' e dispara
     whatsapp_click_footer — rede de seguranca: se aparecer volume nesse
     evento, entrou um numero sem unidade na LP. */
  var UNIDADES = {
    '553299818698': 'centro',
    '553299101440': 'benfica',
  };

  var TEXTO_PADRAO = {
    centro:  'Olá! Quero agendar uma avaliação na unidade Centro.',
    benfica: 'Olá! Quero agendar uma avaliação na unidade Benfica.',
    nao_atribuida: 'Olá! Quero agendar uma avaliação.',
  };

  var COOKIE = '_rg_attr';
  var DIAS = 90;
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
                'utm_term', 'gclid', 'fbclid', 'unidade'];

  /* --- storage ----------------------------------------------------------- */
  function ler(nome) {
    try {
      var ls = window.localStorage.getItem(nome);
      if (ls) return JSON.parse(ls);
    } catch (e) {}
    var m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }

  function gravar(nome, valor) {
    var json = JSON.stringify(valor);
    try { window.localStorage.setItem(nome, json); } catch (e) {}
    var exp = new Date(Date.now() + DIAS * 864e5).toUTCString();
    document.cookie = nome + '=' + encodeURIComponent(json) +
      ';expires=' + exp + ';path=/;SameSite=Lax';
  }

  /* --- atribuicao -------------------------------------------------------- */
  /* Regra: navegacao interna (URL sem nenhum param) NUNCA sobrescreve.
     URL com param = toque novo de verdade -> atualiza ultimo toque,
     preserva o primeiro. O codigo do WhatsApp usa o ULTIMO toque, que e o
     que trouxe a pessoa ate a conversa. */
  function capturarAtribuicao() {
    var url = new URLSearchParams(window.location.search);
    var toque = {};
    var temParam = false;

    PARAMS.forEach(function (p) {
      var v = url.get(p);
      if (v) { toque[p] = v.slice(0, 120); temParam = true; }
    });

    var salvo = ler(COOKIE) || {};

    if (temParam) {
      toque.ts = Date.now();
      salvo.ultimo = toque;
      if (!salvo.primeiro) salvo.primeiro = toque;
      gravar(COOKIE, salvo);
    } else if (!salvo.ultimo) {
      var direto = { utm_source: 'direto', ts: Date.now() };
      salvo.ultimo = direto;
      if (!salvo.primeiro) salvo.primeiro = direto;
      gravar(COOKIE, salvo);
    }

    return salvo.ultimo || {};
  }

  var attr = capturarAtribuicao();

  function contexto(unidade) {
    return {
      unidade: unidade || attr.unidade || 'nao_informada',
      utm_source: attr.utm_source || '',
      utm_medium: attr.utm_medium || '',
      utm_campaign: attr.utm_campaign || '',
      utm_content: attr.utm_content || '',
      gclid: attr.gclid || '',
      fbclid: attr.fbclid || '',
    };
  }

  /* --- tags base --------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var temGtag = false;

  if (RG_TRACKING.ga4Id || RG_TRACKING.adsId) {
    /* Consent Mode v2 — TEM que vir antes do config.
       Medicao 1st-party (analytics) roda por legitimo interesse; tudo que e
       publicidade/personalizacao nasce negado e so libera no aceite. Com isso
       a conversao continua sendo medida (modelada) sem cookie de anuncio,
       e a recusa vale tambem para o lado do Google — nao so para o Pixel. */
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
    var idBase = RG_TRACKING.ga4Id || RG_TRACKING.adsId;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + idBase;
    document.head.appendChild(s);
    gtag('js', new Date());
    if (RG_TRACKING.ga4Id) gtag('config', RG_TRACKING.ga4Id);
    if (RG_TRACKING.adsId) gtag('config', RG_TRACKING.adsId);
    temGtag = true;
  }

  /* --- consentimento (LGPD) ---------------------------------------------- */
  /* Atribuicao 1st-party e GA4 rodam na carga: dado agregado de navegacao,
     sem dado pessoal — legitimo interesse cobre.
     Os Pixels do Meta sao terceiros e o contexto (implante dentario) permite
     inferir interesse em saude, que a ANPD trata como dado sensivel (art. 11).
     Por isso os Pixels SO carregam apos aceite explicito. */
  var CONSENT = '_rg_consent';
  var temPixel = false;

  function iniciarPixels() {
    if (temPixel) return;
    if (!RG_TRACKING.fbPixelIds || !RG_TRACKING.fbPixelIds.length) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    /* fbq('track') entrega para TODOS os pixels inicializados — e o que
       queremos: as duas contas veem o pool completo de visitantes. */
    RG_TRACKING.fbPixelIds.forEach(function (id) {
      if (id) { window.fbq('init', id); temPixel = true; }
    });
    if (temPixel) window.fbq('track', 'PageView');
  }

  function liberarPublicidade() {
    if (!temGtag) return;
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  }

  function registrarConsentimento(valor) {
    gravar(CONSENT, { v: valor, ts: Date.now() });
    if (valor === 'aceito') { liberarPublicidade(); iniciarPixels(); }
    ga4('consentimento', { escolha: valor });
  }

  function montarBanner() {
    var css = document.createElement('style');
    css.textContent =
      '.rg-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#0d2b20;color:#fff;padding:16px 20px;display:flex;gap:16px;' +
      'align-items:center;justify-content:center;flex-wrap:wrap;' +
      'font-family:Inter,sans-serif;font-size:15px;line-height:1.5;' +
      'box-shadow:0 -2px 16px rgba(0,0,0,.3)}' +
      '.rg-consent p{margin:0;max-width:620px}' +
      '.rg-consent div{display:flex;gap:10px;flex-shrink:0}' +
      '.rg-consent button{font:inherit;font-weight:600;cursor:pointer;' +
      'border-radius:8px;padding:12px 22px;min-height:44px;border:1px solid #fff}' +
      '.rg-consent .rg-sim{background:#00c26e;border-color:#00c26e;color:#04231a}' +
      '.rg-consent .rg-nao{background:transparent;color:#fff}' +
      '@media(max-width:640px){.rg-consent{font-size:14px}' +
      '.rg-consent div{width:100%}.rg-consent button{flex:1}}' +
      /* o banner nao pode cobrir o botao flutuante de WhatsApp — ele sobe
         enquanto o aviso estiver na tela e volta ao normal quando sai.
         Sem transition de proposito: e a posicao inicial, ninguem ve a
         animacao, e transition aqui so adiciona um estado intermediario. */
      '.rg-consent-on .wpp-float{bottom:calc(var(--rg-banner-h,180px) + 16px)' +
      ' !important}';
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.className = 'rg-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML =
      '<p>Usamos cookies para entender como o site é usado e para exibir ' +
      'anúncios nossos em outras plataformas. Você pode recusar — o site ' +
      'continua funcionando normalmente.</p>' +
      '<div><button type="button" class="rg-nao">Recusar</button>' +
      '<button type="button" class="rg-sim">Aceitar</button></div>';
    document.body.appendChild(el);

    function ajustarAltura() {
      document.documentElement.style.setProperty('--rg-banner-h', el.offsetHeight + 'px');
    }
    ajustarAltura();
    document.body.classList.add('rg-consent-on');
    window.addEventListener('resize', ajustarAltura);

    function fechar(valor) {
      registrarConsentimento(valor);
      window.removeEventListener('resize', ajustarAltura);
      document.body.classList.remove('rg-consent-on');
      el.remove();
    }

    el.querySelector('.rg-sim').addEventListener('click', function () { fechar('aceito'); });
    el.querySelector('.rg-nao').addEventListener('click', function () { fechar('recusado'); });
  }

  var consent = ler(CONSENT);
  if (consent && consent.v === 'aceito') { liberarPublicidade(); iniciarPixels(); }
  else if (!consent) montarBanner();
  /* recusado => publicidade segue negada, sem Pixel, e sem repetir o banner */

  /* --- emissores --------------------------------------------------------- */
  function ga4(evento, params) {
    if (!RG_TRACKING.ga4Id || !temGtag) return;
    gtag('event', evento, params || {});
  }

  function pixel(evento, params) {
    if (!temPixel || !window.fbq) return;
    window.fbq('track', evento, params || {});
  }

  function adsConversao(unidade) {
    var label = RG_TRACKING.adsLabels[unidade];
    if (!RG_TRACKING.adsId || !label || !temGtag) return;
    gtag('event', 'conversion', { send_to: RG_TRACKING.adsId + '/' + label });
  }

  /* --- codigo de referencia do WhatsApp ---------------------------------- */
  function fonte() {
    if (attr.gclid) return 'GG';
    if (attr.fbclid) {
      var src = (attr.utm_source || '').toLowerCase();
      return src.indexOf('insta') > -1 || src === 'ig' ? 'IG' : 'FB';
    }
    return 'ORG';
  }

  function slugCampanha() {
    var c = attr.utm_campaign;
    if (!c) return 'DIRETO';
    return c.normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '')
            .toUpperCase().slice(0, 12) || 'DIRETO';
  }

  function id4() {
    var abc = 'abcdefghijklmnopqrstuvwxyz0123456789', r = '';
    for (var i = 0; i < 4; i++) r += abc[Math.floor(Math.random() * abc.length)];
    return r;
  }

  var TOKEN_UNIDADE = { centro: 'CENTRO', benfica: 'BENFICA', nao_atribuida: 'NA' };

  /* Carrega SOMENTE unidade + campanha. Nunca dado pessoal ou de saude. */
  function codigo(unidade) {
    var tok = TOKEN_UNIDADE[unidade] || 'NA';
    return 'RG-' + tok + '-' + fonte() + '-' + slugCampanha() + '-' + id4();
  }

  function montarLink(a, unidade) {
    var num = (a.getAttribute('href').match(/wa\.me\/(\d+)/) || [])[1];
    if (!num) return;
    var atual = new URL(a.href).searchParams.get('text');
    var base = atual || TEXTO_PADRAO[unidade] || TEXTO_PADRAO.nao_atribuida;
    base = base.replace(/\s*\[RG-[^\]]*\]\s*$/, '');
    var texto = base + ' [' + codigo(unidade) + ']';
    a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(texto);
  }

  /* --- listeners --------------------------------------------------------- */
  function secaoDe(el) {
    if (el.closest('.wpp-float')) return 'flutuante';
    var sec = el.closest('section[id]');
    if (sec) return sec.id;
    if (el.closest('footer')) return 'rodape';
    var h = el.closest('header');
    if (h) return h.id || 'topo_nav';
    if (el.closest('article')) return 'artigo';
    return 'desconhecida';
  }

  function ehBlog() { return /\/blog\//.test(window.location.pathname); }

  function slugPost() {
    return window.location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    /* WhatsApp */
    var num = (href.match(/wa\.me\/(\d+)/) || [])[1];
    if (num) {
      var unidade = UNIDADES[num] || 'nao_atribuida';
      montarLink(a, unidade);
      var ctx = contexto(unidade);
      ctx.secao = secaoDe(a);

      if (unidade === 'centro' || unidade === 'benfica') {
        ga4('whatsapp_click_' + unidade, ctx);
        pixel('Contact', { unidade: unidade, campanha: ctx.utm_campaign });
        adsConversao(unidade);
      } else {
        ctx.unidade = 'nao_atribuida';
        ctx.origem = ehBlog() ? 'blog:' + slugPost() : 'index';
        ga4('whatsapp_click_footer', ctx);
        pixel('Contact', { unidade: 'nao_atribuida' });
      }
      return;
    }

    /* Blog -> index (topo de funil) */
    if (ehBlog() && /index\.html#/.test(href)) {
      ga4('blog_to_cta', {
        post: slugPost(),
        destino: href.split('#')[1] || '',
        origem: secaoDe(a),
        utm_campaign: attr.utm_campaign || '',
      });
      return;
    }

    /* Ancoras internas */
    if (href.charAt(0) === '#' && href.length > 1) {
      ga4('cta_anchor_click', { secao: secaoDe(a), destino: href.slice(1) });
    }
  }, true);

  /* scroll_50 */
  var scrollFeito = false;
  window.addEventListener('scroll', function () {
    if (scrollFeito) return;
    var alt = document.documentElement.scrollHeight - window.innerHeight;
    if (alt > 0 && (window.scrollY / alt) >= 0.5) {
      scrollFeito = true;
      ga4('scroll_50', { pagina: slugPost() });
    }
  }, { passive: true });

  /* engaged_visit */
  setTimeout(function () { ga4('engaged_visit', { pagina: slugPost() }); }, 60000);

  /* view_unidades */
  var agendar = document.getElementById('agendar');
  if (agendar && window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { ga4('view_unidades', contexto()); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(agendar);
  }

  /* Pre-monta os links na carga — o clique remonta com codigo novo */
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
    var n = (a.getAttribute('href').match(/wa\.me\/(\d+)/) || [])[1];
    if (n) montarLink(a, UNIDADES[n] || 'nao_atribuida');
  });
})();
