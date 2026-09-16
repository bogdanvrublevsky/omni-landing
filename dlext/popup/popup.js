
import { MESSAGE_TYPES } from '../shared/messages.js';

const statusNode = document.querySelector('#connectionStatus');
const pageTitleNode = document.querySelector('#pageTitle');
const pageUrlNode = document.querySelector('#pageUrl');
const connectedAtNode = document.querySelector('#connectedAt');
const scriptsSummaryNode = document.querySelector('#scriptsSummary');
const scriptsListNode = document.querySelector('#scriptsList');

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function renderStatus(status) {
  const isConnected = status === 'connected';
  statusNode.textContent = isConnected ? 'Connected' : 'Disconnected';
  statusNode.classList.toggle('status--connected', isConnected);
  statusNode.classList.toggle('status--disconnected', !isConnected);
}

function renderScripts(scripts) {
  scriptsListNode.replaceChildren();
  scriptsSummaryNode.textContent = `${scripts.length} found`;

  for (const script of scripts) {
    const item = document.createElement('li');
    item.className = 'scripts__item';

    const source = document.createElement('div');
    source.textContent = script.src || 'Inline script';

    const meta = document.createElement('div');
    meta.className = 'scripts__meta';
    meta.textContent = [
      `#${script.index}`,
      script.type ? `type=${script.type}` : null,
      script.async ? 'async' : null,
      script.defer ? 'defer' : null
    ].filter(Boolean).join(' · ');

    item.append(source, meta);
    scriptsListNode.append(item);
  }
}

function renderPopupState(state) {
  renderStatus(state.connectionStatus);
  pageTitleNode.textContent = state.title || '—';
  pageUrlNode.textContent = state.url || '—';
  connectedAtNode.textContent = formatDate(state.connectedAt);
  renderScripts(Array.isArray(state.scripts) ? state.scripts : []);
}

chrome.runtime.sendMessage({
  type: MESSAGE_TYPES.GET_CURRENT_TAB_POPUP_STATE
}).then((response) => {
  renderPopupState(response?.payload || {});
}).catch(() => {
  renderPopupState({
    connectionStatus: 'disconnected',
    scripts: []
  });
});