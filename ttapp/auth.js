const users = require('./data/users.json');

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });

  response.end(JSON.stringify(data));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        const parsedBody = JSON.parse(body || '{}');

        resolve(parsedBody);
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function getUser(username) {
  return users[username] || null;
}

function checkUserToken(username, token) {
  const user = getUser(username);

  if (!user) {
    return false;
  }

  return user.token === token;
}

function checkUserPassword(username, password) {
  const user = getUser(username);

  if (!user) {
    return false;
  }

  return user.password === password;
}

async function handleAuthAttempt(request, response) {
  try {
    const body = await readRequestBody(request);

    const {
      username,
      password,
      token,
    } = body;

    if (!username) {
      sendJson(response, 400, {
        success: false,
        error: 'Username required',
      });

      return;
    }

    if (token) {
      const isValidToken = checkUserToken(username, token);

      if (!isValidToken) {
        sendJson(response, 401, {
          success: false,
          error: 'Invalid token',
        });

        return;
      }

      sendJson(response, 200, {
        success: true,
        redirect: '/home',
      });

      return;
    }

    if (password) {
      const userExists = Boolean(getUser(username));

      if (!userExists) {
        sendJson(response, 401, {
          success: false,
          error: 'User not found',
        });

        return;
      }

      const isValidPassword = checkUserPassword(username, password);

      if (!isValidPassword) {
        sendJson(response, 401, {
          success: false,
          error: 'Invalid password',
        });

        return;
      }

      sendJson(response, 200, {
        success: true,
        redirect: '/home',
      });

      return;
    }

    sendJson(response, 400, {
      success: false,
      error: 'Password or token required',
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: 'Internal server error',
    });
  }
}

module.exports = {
  handleAuthAttempt,
};