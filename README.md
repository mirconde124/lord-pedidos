# Gerador de Documentos — LORD POLÍMEROS

Ferramenta interna de vendas: monta pedidos e orçamentos comerciais de resina no
padrão visual da LORD POLÍMEROS e gera o PDF em segundos (impressão nativa em
A4 paisagem, `Ctrl/⌘ + Enter` para gerar, `Esc` para voltar ao formulário).

Site estático puro — `index.html` é o app inteiro (HTML/CSS/JS, sem framework,
sem dependência de build para rodar). `vite` é usado só como servidor de
desenvolvimento e para publicar `/public` num host estático.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar

```bash
npm run build
```

Gera `dist/` pronto para qualquer hospedagem estática (Vercel, Netlify, etc.).
Este repositório está conectado ao Vercel — todo push em `master` já publica
automaticamente.

## Estrutura

- `index.html` — app completo (formulário, painel de peso ao vivo, geração do
  documento, impressão)
- `public/lord-branca.png`, `public/lord-azul.png` — logo oficial (branca para
  fundos escuros, azul para fundos claros)
- `public/favicon.svg` — ícone da aba do navegador

## Regras de cálculo

- `subtotal = quantidade × valor por kg`
- `IPI = subtotal × IPI%`
- `total com IPI = subtotal + IPI`
- `ICMS = subtotal × ICMS%` — informativo, nunca somado ao total
