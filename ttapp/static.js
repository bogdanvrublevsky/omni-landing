const fs = require('fs');
const path = require('path');

const staticExtensions = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const staticDirectories = {
  '.js': 'public/js',
  '.css': 'public/css',
};

function getStaticFilePath(requestPath) {
  const extension = path.extname(requestPath);
  const staticDirectory = staticDirectories[extension];

  if (!staticDirectory) {
    return null;
  }

  const fileName = path.basename(requestPath);

  return path.join(__dirname, staticDirectory, fileName);
}

function sendStaticFile(response, filePath) {
  const extension = path.extname(filePath);
  const contentType = staticExtensions[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
      });

      response.end('Static file not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentType,
    });

    response.end(content);
  });
}

function isStaticRequest(requestPath) {
  const extension = path.extname(requestPath);

  if (!extension) {
    return false;
  }

  return Boolean(staticDirectories[extension]);
}

function handleStaticRequest(requestPath, response) {
  if (!isStaticRequest(requestPath)) {
    return false;
  }

  const staticFilePath = getStaticFilePath(requestPath);

  sendStaticFile(response, staticFilePath);

  return true;
}

module.exports = {
  isStaticRequest,
  handleStaticRequest,
};
