# Deployment

## Описание

CI/CD и хостинг для `main/` (сайт anltx) и вспомогательной serverless-функции лидогенерации.

## Принятые решения и факты

- **Хостинг:** GitHub Pages, кастомный домен `anltx.xyz`. Домен уже куплен, DNS уже настроен, `CNAME` уже присутствует в ветке `gh-pages`.
- **CI/CD:** GitHub Actions, workflow `.github/workflows/deploy.yml`, автодеплой на push в `main`.
- **Текущее поведение деплоя (до миграции на Astro):** workflow копирует содержимое `main/` и `ttapp/` в `_site/` и публикует в ветку `gh-pages` (`force_orphan: true`, `publish_branch: gh-pages`). Это существующая настройка, унаследованная до бутстрапа инфраструктуры.
- **Открытый вопрос на будущее (не блокирует текущий бутстрап):** когда `main/` станет Astro-проектом, `deploy.yml` нужно будет переписать — вместо `cp -r main/* _site/` потребуется `npm ci && npm run build` внутри `main/` с публикацией `main/dist/*`. Нужно будет отдельно решить, продолжает ли деплой публиковать `ttapp/` (сейчас это единственный живой "побочный" путь на проде помимо самого сайта) — решается через отдельный ADR при фактической миграции, не сейчас.
- **Serverless для формы лидогенерации:** Cloudflare Workers. Токен Telegram-бота — только через `wrangler secret`, никогда в репозитории (см. [security.md](security.md)).
- **Переход с GitHub Pages:** запланирован, когда появятся первые платящие клиенты — совпадает с точкой, где потребуется backend/auth. Явно зафиксировано как граница фаз MVP/Beta → Production/Scaling в `docs/roadmap.md`.

## Связанные документы

- [architecture.md](architecture.md)
- [security.md](security.md)
- `docs/roadmap.md`
- `.github/workflows/deploy.yml`
