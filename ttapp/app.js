const http = require('http');
const fs = require('fs');
const { isStaticRequest, handleApiRequest,handleStaticRequest } = require('./static');
const { handleAuthAttempt } = require('./auth');
const { getPagePath } = require('./route');

const HOST = '0.0.0.0';
const PORT = 3000;

function sendPage(response, pagePath) {
  fs.readFile(pagePath, 'utf8', (error, content) => {
    if (error) {
      response.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
      });

      response.end('Page not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
    });

    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestPath = request.url.split('?')[0];

  if (request.method === 'POST' && requestPath === '/auth-attempt') {
    handleAuthAttempt(request, response);
    return;
  }

  if (isStaticRequest(requestPath)) {
    handleStaticRequest(requestPath, response);
  } else if (isApiRequest) {
    handleApiRequest(requestPath, request, response);
  } else {
    handlePageRequest(requestPath, response);
  }

  const pagePath = getPagePath(requestPath);

  if (!pagePath) {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    response.end('Route not found');
    return;
  }

  sendPage(response, pagePath);
});

server.listen(PORT, HOST, () => {
  console.log(`Server started: http://${HOST}:${PORT}`);
});
