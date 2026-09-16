

const form = document.querySelector('.auth');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');

usernameInput.addEventListener('blur', async () => {
  const username = usernameInput.value.trim();

  if (!username) {
    return;
  }

  try {
    const response = await fetch('/check-username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
      }),
    });

    const data = await response.json();

    console.log('check-username response:', data);
  } catch (error) {
    console.error('check-username error:', error);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  try {
    const response = await fetch('/auth-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    console.log('auth-attempt response:', data);
  } catch (error) {
    console.error('auth-attempt error:', error);
  }
});