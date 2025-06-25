document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('Пожалуйста, заполните все поля');
            return;
        }

        const submitButton = loginForm.querySelector('.login-btn');
        submitButton.textContent = 'Вход...';
        submitButton.disabled = true;

        try {
            // Отправляем запрос на FastAPI /auth/login
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                }),
            });

            if (!response.ok) {
                throw new Error('Неверный логин или пароль');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.access_token);

            // Получаем данные пользователя с /auth/me
            const profileResponse = await fetch('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`,
                },
            });

            if (!profileResponse.ok) {
                throw new Error('Ошибка при получении профиля');
            }

            const user = await profileResponse.json();

            localStorage.setItem('username', user.name);
            localStorage.setItem('userRole', user.role);

            // Перенаправление в зависимости от роли
            if (user.role === 'admin') {
                window.location.href = '/admin-panel';
            } else {
                window.location.href = '/user-statistics';
            }

        } catch (error) {
            showError(error.message || 'Ошибка входа');
            submitButton.textContent = 'Войти';
            submitButton.disabled = false;
        }
    });

    function showError(message) {
        const existingError = loginForm.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#e74c3c';
        errorElement.style.marginBottom = '15px';
        errorElement.style.textAlign = 'center';

        const loginButton = loginForm.querySelector('.login-btn');
        loginForm.insertBefore(errorElement, loginButton);
    }
});
