# DataExplorer Chrome Extension
DataExplorer — Chrome Extension для анализа клиентской среды веб-страниц.
Расширение:
- подключается к страницам максимально рано;
- собирает информацию о DOM и runtime окружении;
- хранит состояние отдельно для каждой вкладки;
- отображает данные в popup;
- в будущем предоставляет:
  - sidebar;
  - DevTools panel;
  - централизованный background data layer.

# Архитектура
Расширение построено на Manifest V3.

## Основные компоненты
### 1. Content Script

Файл:
content/content-script.js

Подключается через:
"run_at": "document_start"

Задачи:
* максимально раннее подключение к странице;
* чтение DOM;
* поиск \<script>;
* сбор runtime данных;
* отправка snapshot в background worker.

Текущее поведение:
* выполняет snapshot сразу после подключения;
* повторяет snapshot на DOMContentLoaded.


### 2. Background Service Worker

Файл:
background/service-worker.js

Является центральным data-layer расширения.

Задачи:
* получение сообщений от content scripts;
* хранение состояния вкладок;
* синхронизация popup/sidebar/devtools;
* маршрутизация сообщений между компонентами.

State хранится в:
chrome.storage.session

Ключи:
popupStateByTabId:\<tabId>

Каждая вкладка имеет независимое состояние.

State удаляется при закрытии вкладки:
chrome.tabs.onRemoved

⸻

### 3. Popup UI

Файлы:
popup/popup.html
popup/popup.js
popup/popup.css

Popup открывается по клику на иконку расширения.

Текущие возможности:
* отображение статуса подключения;
* отображение URL и title страницы;
* отображение времени подключения;
* отображение списка найденных \<script>.

Popup поддерживает live updates через:
chrome.runtime.onMessage

⸻

### 4. Shared Layer

Файлы:
shared/messages.js
shared/messages-content.js
shared/constants.js

Содержит:
* message types;
* shared constants;
* protocol взаимодействия компонентов.

⸻

Message Protocol

CONTENT_CONNECTED

Отправляется:

content-script -> background

Payload:

{
  url,
  title,
  scripts
}

⸻

GET_CURRENT_TAB_POPUP_STATE

Отправляется:

popup -> background

Запрашивает state активной вкладки.

⸻

CURRENT_TAB_POPUP_STATE

Ответ:

background -> popup

Возвращает текущее состояние вкладки.

⸻

POPUP_STATE_UPDATED

Отправляется:

background -> popup

Используется для live обновления popup.

Payload:

{
  tabId,
  state
}

⸻

Текущий State Format

{
  connectionStatus: 'connected' | 'disconnected',
  connectedAt: string | null,
  url: string | null,
  title: string | null,
  scripts: Array<{
    index: number,
    src: string | null,
    type: string | null,
    async: boolean,
    defer: boolean,
    inline: boolean
  }>
}

⸻

Текущие Permissions

[
  "tabs",
  "activeTab",
  "scripting",
  "storage",
  "sidePanel"
]

Host permissions:

["<all_urls>"]

⸻

Важные архитектурные решения

1. Используется chrome.storage.session

Причина:

* service worker в MV3 выгружается;
* in-memory state ненадежен.

⸻

2. Content script подключается на document_start

Причина:

* нужен максимально ранний доступ к DOM;
* нужен ранний поиск script tags.

⸻

3. Popup state хранится отдельно по tabId

Причина:

* независимое состояние вкладок;
* возможность параллельного анализа нескольких страниц.

⸻

4. Live updates идут через runtime messaging

Причина:

* popup не должен вручную перезапрашивать state;
* background является single source of truth.

⸻

Планируемое развитие

Sidebar

Будет:

* расширенный UI анализа;
* просмотр data layer;
* runtime inspection.

⸻

DevTools Panel

Будет:

* интеграция с Chrome DevTools;
* timeline событий;
* network/runtime inspection.

⸻

Background Data Aggregation

Будет:

* сбор данных со всех вкладок;
* централизованный event stream;
* cross-tab state management.

⸻

Ограничения и риски

MV3 Service Worker Lifecycle

Service worker может выгружаться Chrome.

Поэтому:

* нельзя полагаться на глобальные переменные;
* state должен храниться в storage.

⸻

document_start не гарантирует готовый DOM

На ранней стадии:

* часть DOM может отсутствовать;
* scripts могут догружаться позже.

Поэтому snapshot выполняется:

* сразу;
* повторно на DOMContentLoaded.

⸻

Popup живет временно

Popup уничтожается после закрытия.

Поэтому:

* UI должен быть полностью восстанавливаемым из state.

