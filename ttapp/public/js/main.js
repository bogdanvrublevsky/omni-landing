const SESSION_TOKEN_KEY = 'session_token';
const AUTH_PAGE = '/auth';

function getCookie(name) {
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');

    if (key === name) {
      return value;
    }
  }

  return null;
}

function getSessionToken() {
  const localStorageToken = localStorage.getItem(SESSION_TOKEN_KEY);
  const cookieToken = getCookie(SESSION_TOKEN_KEY);

  return localStorageToken || cookieToken || null;
}

function checkAuth() {
  const token = getSessionToken();

  if (!token) {
    const currentPage = window.location.pathname + window.location.search;
    const redirectUrl = `${AUTH_PAGE}?redirect=${encodeURIComponent(currentPage)}`;

    window.location.href = redirectUrl;
    return;
  }

  console.log('Session token found');
}

checkAuth();