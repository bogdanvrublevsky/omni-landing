function collectPageSnapshot() {
  const scripts = Array.from(document.scripts || []).map((script, index) => ({
    index,
    src: script.src || null,
    type: script.type || null,
    async: script.async,
    defer: script.defer,
    inline: !script.src
  }));

  return {
    url: location.href,
    title: document.title,
    scripts
  };
}

function notifyConnected() {
  chrome.runtime.sendMessage({
    type: 'CONTENT_CONNECTED',
    payload: collectPageSnapshot()
  }).catch(() => {
    // Background worker may be unavailable during extension reloads.
  });
}

notifyConnected();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifyConnected, { once: true });
} else {
  queueMicrotask(notifyConnected);
}
