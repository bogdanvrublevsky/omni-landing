import { MESSAGE_TYPES } from '../shared/messages.js';
import { DEFAULT_POPUP_STATE } from '../shared/constants.js';

const POPUP_STATE_STORAGE_PREFIX = 'popupStateByTabId:';

const getKey = (tabId) => `${POPUP_STATE_STORAGE_PREFIX}${tabId}`;

function buildPopupState(previousState, payload) {
  return {
    ...DEFAULT_POPUP_STATE,
    ...previousState,
    connectionStatus: 'connected',
    connectedAt: new Date().toISOString(),
    url: payload?.url || null,
    title: payload?.title || null,
    scripts: Array.isArray(payload?.scripts) ? payload.scripts : []
  };
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id || null;
}

async function getPopupState(tabId) {
  if (!tabId) return { ...DEFAULT_POPUP_STATE };

  const key = getKey(tabId);
  const data = await chrome.storage.session.get(key);

  return data[key] || { ...DEFAULT_POPUP_STATE };
}

async function setPopupState(tabId, state) {
  if (!tabId) return;

  await chrome.storage.session.set({
    [getKey(tabId)]: state
  });
}

async function removePopupState(tabId) {
  if (!tabId) return;

  await chrome.storage.session.remove(getKey(tabId));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPES.CONTENT_CONNECTED) {
    const tabId = sender.tab?.id;

    getPopupState(tabId)
      .then((previousState) => {
        const nextState = buildPopupState(previousState, message.payload);
        return setPopupState(tabId, nextState);
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === MESSAGE_TYPES.GET_CURRENT_TAB_POPUP_STATE) {
    getActiveTabId()
      .then((tabId) => getPopupState(tabId))
      .then((state) => {
        sendResponse({
          type: MESSAGE_TYPES.CURRENT_TAB_POPUP_STATE,
          payload: state
        });
      })
      .catch((error) => {
        sendResponse({
          type: MESSAGE_TYPES.CURRENT_TAB_POPUP_STATE,
          payload: {
            ...DEFAULT_POPUP_STATE,
            error: error.message
          }
        });
      });

    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removePopupState(tabId).catch(() => {});
});