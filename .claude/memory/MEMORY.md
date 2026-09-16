# MEMORY — anltx (main/)

Индекс базы знаний проекта. Каждый файл — одна тема: описание, принятые решения, связанные документы. Обновляется по мере появления новых фактов (living documentation, см. `CLAUDE.md`).

- [business.md](business.md) — продукт, бизнес-модель (freemium), ЦА, монетизация, долгосрочное направление (lwtms/sstms/dlext, CMS).
- [architecture.md](architecture.md) — SSG на Astro, i18n через раздельные пути, хостинг, границы MVP/Beta/Production.
- [content.md](content.md) — авторство контента: Content Collections vs ручная вёрстка, требование к туториалу, роль AI в написании статей.
- [deployment.md](deployment.md) — GitHub Actions, GitHub Pages, Cloudflare Workers, текущее и будущее поведение `deploy.yml`.
- [security.md](security.md) — модель секретов, cookie consent, инцидент с plaintext-паролем в `ttapp` (закрыт, коммит `29e32e3`).
- [analytics.md](analytics.md) — GTM/GA4, GSC, соглашение об именовании событий, техническая SEO-база.

## Вне скоупа этой базы знаний

`dlext/`, `ttapp/`, `sgame/`, `treev/` — отдельные проекты монорепозитория, не описываются здесь (см. `CLAUDE.md` → Scope).
