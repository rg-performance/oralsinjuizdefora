# Oral Sin Juiz de Fora — Landing Page

Landing page de alta conversão para a Oral Sin Juiz de Fora, focada em **implantes dentários** e **prótese fixa (protocolo)** para o público **60+**, com blog interno para SEO.

## Stack

Site **estático** (HTML + CSS + JS vanilla) — sem build, sem dependências. Abre direto no navegador e é fácil de hospedar (Vercel, Netlify, GitHub Pages ou qualquer hospedagem).

```
.
├── index.html                     # Landing page principal
├── assets/
│   ├── css/styles.css             # Estilos (variáveis de marca no topo)
│   └── js/main.js                 # Animações, menu, FAQ, form → WhatsApp
├── blog/                          # Artigos para SEO
│   ├── implante-dentario-acima-60-anos.html
│   ├── protese-fixa-vs-dentadura.html
│   └── carga-imediata-dentes-fixos-mesmo-dia.html
├── robots.txt
└── sitemap.xml
```

## Estrutura da LP (sequência)

1. Top bar (avaliação Google + contato)
2. Header sticky com CTA WhatsApp
3. **Hero** — headline de conversão + provas + CTA
4. Barra de **números** (animados)
5. **Dores** do público 60+ → bloco de solução
6. **Tratamentos** (implante, protocolo, carga imediata, lentes, clareamento, periodontia)
7. **Diferenciais** da Oral Sin
8. **Como funciona** (passo a passo)
9. **Antes e depois**
10. **Depoimentos**
11. **FAQ** (accordion)
12. **CTA final + formulário** (envia direto para o WhatsApp)
13. **Blog** (SEO)
14. Footer + botão flutuante de WhatsApp

## Como personalizar

- **Cores da marca:** edite as variáveis no topo de `assets/css/styles.css` (`:root`).
- **WhatsApp/telefone:** os números (`5532999931447` e `(32) 3512-9444`) estão no `index.html` e no `data-wpp` do formulário.
- **Endereço:** Rua Braz Bernardino, 199 — sala 113, Centro, Juiz de Fora — MG (ajustar no footer e no schema).
- **Imagens:** atualmente usam Unsplash (placeholders). Substituir por **fotos reais da clínica e antes/depois** para máxima conversão.

## Próximos passos sugeridos

- [ ] Trocar imagens placeholder por fotos reais (hero, antes/depois, equipe)
- [ ] Confirmar números, endereço e CRO do responsável técnico
- [ ] Integrar pixel do Google Ads / GA4 / Meta para mensurar conversões
- [ ] Adicionar mapa do Google embarcado no footer
- [ ] Revisar/aprovar a copy
