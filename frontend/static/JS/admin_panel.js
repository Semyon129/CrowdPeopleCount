document.addEventListener('DOMContentLoaded', function() {
    // Базовый URL API - замените на реальный URL
    const API_BASE_URL = 'http://127.0.0.1:8000';
    let authToken = localStorage.getItem('accessToken');

    // Проверка аутентификации с перенаправлением
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    // Получаем элементы DOM с проверкой
    const elements = {
        tableBody: document.querySelector('.users-table tbody'),
        searchInput: document.querySelector('.search-box input'),
        addUserBtn: document.querySelector('.btn-add-user'),
        logoutBtn: document.querySelector('.logout-button')
    };

    // Проверка наличия обязательных элементов
    if (!elements.tableBody || !elements.logoutBtn) {
        console.error('Не найдены обязательные элементы DOM');
        return;
    }

    
    async function makeRequest(url, method = 'GET', body = null) {
        try {
            const headers = {
                'Authorization': `Bearer ${authToken}`
            };
            
            if (body) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_BASE_URL}${url}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Ошибка запроса ${method} ${url}:`, error);
            throw error;
        }
    }

    // Загрузка пользователей с сервера
    async function loadUsers() {
        try {
            return await makeRequest('/users');
        } catch (error) {
            showNotification('Не удалось загрузить пользователей', 'error');
            return [];
        }
    }

    // Отображение пользователей в таблице
    async function renderUsers(usersToRender = null) {
        try {
            const users = usersToRender || await loadUsers();
            elements.tableBody.innerHTML = '';
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td><span class="role ${user.role}">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></td>
                    <td class="actions">
                        <button class="btn-edit" data-id="${user.id}">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn-delete" data-id="${user.id}">
                            <i class="fas fa-trash-alt"></i> Удалить
                        </button>
                    </td>
                `;
                elements.tableBody.appendChild(row);
            });
            
            addEditEventListeners();
            addDeleteEventListeners();
        } catch (error) {
            console.error('Ошибка рендеринга:', error);
        }
    }

    // Поиск пользователей
    elements.searchInput?.addEventListener('input', async function(e) {
        const searchTerm = e.target.value.toLowerCase();
        try {
            const allUsers = await loadUsers();
            const filteredUsers = allUsers.filter(user => 
                (user.name?.toLowerCase().includes(searchTerm)) || 
                (user.email?.toLowerCase().includes(searchTerm)) ||
                (user.login?.toLowerCase().includes(searchTerm))
            );
            renderUsers(filteredUsers);
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    });

    // Добавление нового пользователя
    elements.addUserBtn?.addEventListener('click', () => showUserModal());

    // Модальное окно для пользователя
async function showUserModal(user = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const isEdit = Boolean(user);  // редактирование или добавление

    modal.innerHTML = `
        <div class="modal-content form-container">
            <span class="close-modal">&times;</span>
            <h2>${isEdit ? 'Редактировать' : 'Добавить'} пользователя</h2>
            <form id="user-form">
                <div class="form-group">
                    <label for="user-name"><i class="fas fa-user"></i> ФИО</label>
                    <input type="text" id="user-name" placeholder="Введите полное имя" required>
                </div>
                <div class="form-group">
                    <label for="user-email"><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="user-email" placeholder="example@mail.ru" required>
                </div>
                <div class="form-group">
                    <label for="user-login"><i class="fas fa-user-tag"></i> Логин</label>
                    <input type="text" id="user-login" placeholder="Придумайте логин" required>
                </div>
                <div class="form-group">
                    <label for="user-password"><i class="fas fa-lock"></i> Пароль</label>
                    <input type="password" id="user-password" placeholder="Не менее 8 символов">
                </div>
                <div class="form-group">
                    <label for="user-role"><i class="fas fa-user-shield"></i> Роль</label>
                    <select id="user-role">
                        <option value="admin">Администратор</option>
                        <option value="user">Пользователь</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-save"><i class="fas fa-save"></i> Сохранить</button>
                    <button type="button" class="btn-cancel"><i class="fas fa-times"></i> Отмена</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие модалки
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());

    // Предзаполнение данных при редактировании
    if (isEdit) {
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-login').value = user.login;
        document.getElementById('user-role').value = user.role;
    }

    // Обработка submit
    modal.querySelector('#user-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const userData = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            login: document.getElementById('user-login').value,
            role: document.getElementById('user-role').value,
        };

        const password = document.getElementById('user-password')?.value?.trim();
        if (password && password.length >= 8) {
            userData.password = password;
        }


        try {
            if (isEdit) {
                await makeRequest(`/users/${user.id}`, 'PUT', userData);
                showNotification('Пользователь обновлен');
            } else {
                await makeRequest('/users', 'POST', userData);
                showNotification('Пользователь добавлен');
            }

            modal.remove();
            renderUsers();
        } catch (err) {
            showNotification(err.message || 'Ошибка сохранения', 'error');
        }
    });
}


    // Обработчики кнопок
    function addEditEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.getAttribute('data-id');
                try {
                    const user = await makeRequest(`/users/${userId}`);
                    showUserModal(user);
                } catch (error) {
                    showNotification('Не удалось загрузить данные пользователя', 'error');
                }
            });
        });
    }

    function addDeleteEventListeners() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.getAttribute('data-id');
                if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
                    try {
                        await makeRequest(`/users/${userId}`, 'DELETE');
                        showNotification('Пользователь удален');
                        renderUsers();
                    } catch (error) {
                        showNotification('Не удалось удалить пользователя', 'error');
                    }
                }
            });
        });
    }

    // Выход из системы
    elements.logoutBtn.addEventListener('click', async function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            try {
                await makeRequest('/auth/logout', 'POST');
            } catch (error) {
                console.error('Ошибка выхода:', error);
            } finally {
                localStorage.removeItem('accessToken');
                window.location.href = '/';
            }
        }
    });
    

    // Функция показа уведомлений
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Инициализация приложения
    renderUsers();
});
