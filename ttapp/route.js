const path = require('path');

class Router {

    static apiEndpoint = '/api';

    static apiRoutes = {
        '/auth-attempt': 'auth-attempt',
        '/check-username': 'check-username',};

    static publicDir = path.join(__dirname, 'public');

    static pages = {
        '/auth': '/auth.html',
        '/home': '/home.html',
        '/': '/home.html',};

    static isApiRequest(requestPath) {
        return requestPath.startsWith(Router.apiEndpoint);
    }

    static isStaticRequest(requestPath) {
        const extension = path.extname(requestPath);
        return !!extension;
    }

    static findPath(requestPath) {}
        
}

const ROUTER = {
    isStatic: (requestPath) => {
        const extension = path.extname(requestPath);
        return !!extension;
    },
    isApi: (requestPath) => {
        return requestPath.startsWith('/api/');
    },
};

const pages = {
  '/auth': 'public/auth.html',
  '/home': 'public/home.html',
  '/': 'public/home.html',
};

const apiRoutes = {
  '/api/auth-attempt': 'auth-attempt',
  '/api/check-username': 'check-username',
};

fuc

function getPagePath(requestPath) {
  const matchedRoute = Object.keys(pages).find((route) => {
    return requestPath === route;
  });

  if (!matchedRoute) {
    return null;
  }

  return path.join(__dirname, pages[matchedRoute]);
}

function getApiRoute(requestPath) {
  const matchedRoute = Object.keys(apiRoutes).find((route) => {
    return requestPath === route;
  });

  if (!matchedRoute) {
    return null;
  }

  return apiRoutes[matchedRoute];
}

module.exports = ROUTER;
