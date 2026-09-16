# Analytics

## Описание

Веб-аналитика посетителей сайта anltx (отличать от "аналитической платформы" как продукта — см. [business.md](business.md)).

## Принятые решения и факты

- **Стек:** Google Tag Manager (GTM) + Google Analytics 4 (GA4).
- **Google Search Console** уже верифицирован для домена `anltx.xyz` на момент бутстрапа инфраструктуры (2026-07).
- **Cookie consent:** загрузка GTM/GA4 обязана быть гейтирована согласием пользователя (см. [security.md](security.md)) — включено в MVP-скоуп, не отложено.
- **Именование событий:** `snake_case` (пример: `lead_form_submit`). Конкретный список событий будет пополняться здесь по мере внедрения (первое ожидаемое событие — отправка формы лидогенерации через Cloudflare Worker).
- **Техническая SEO-база** включена в MVP: sitemap.xml, robots.txt, canonical/meta/OG-теги, hreflang для EN/RU. Контентная SEO-стратегия (тексты, семантическая оптимизация) сознательно отложена на более позднюю фазу.

## Связанные документы

- [security.md](security.md)
- [business.md](business.md)
- `CLAUDE.md` → разделы Security, Logging
