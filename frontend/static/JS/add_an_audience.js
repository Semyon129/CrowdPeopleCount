document.addEventListener('DOMContentLoaded', function() {
    // Базовый URL API - замените на реальный URL
    const API_BASE_URL = 'http://127.0.0.1:8000';
    let authToken = localStorage.getItem('accessToken');

    // Проверка аутентификации с перенаправлением
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    // элементы DOM
    const elements = {
        tableBody: document.querySelector('.auditories-table tbody'),
        searchInput: document.querySelector('.search-box input'),
        addButton: document.querySelector('.add-auditory-button'),
        logoutBtn: document.querySelector('.logout-button'),
        refreshBtn: document.querySelector('.refresh-button')
    };

    
    async function makeRequest(endpoint, method = 'GET', body = null) {
    try {
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            const errorText = contentType && contentType.includes("application/json")
                ? await response.json()
                : await response.text();
            throw new Error(errorText?.message || errorText || 'Ошибка сервера');
        }

        return contentType && contentType.includes("application/json")
            ? await response.json()
            : await response.text();
    } catch (error) {
        console.error('Ошибка запроса:', error);
        showNotification(error.message || 'Ошибка соединения', 'error');
        throw error;
    }
}


    // Загрузка аудиторий с сервера
    async function loadAuditories() {
        try {
            return await makeRequest('/rooms');
        } catch (error) {
            return [];
        }
    }

    // Отображение аудиторий в таблице
    async function renderAuditories(auditoriesToRender = null) {
        try {
            const auditories = auditoriesToRender || await loadAuditories();
            elements.tableBody.innerHTML = '';
            
            auditories.forEach(auditory => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${auditory.name}</td>
                    <td>${auditory.currentStudents}/${auditory.capacity}</td>
                    <td>${auditory.lastUpdate || 'Нет данных'}</td>
                    <td class="actions">
                        <button class="btn-edit" data-id="${auditory.id}">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn-delete" data-id="${auditory.id}">
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

    // Поиск аудиторий
    elements.searchInput.addEventListener('input', async function(e) {
        const searchTerm = e.target.value.toLowerCase();
        try {
            const allAuditories = await loadAuditories();
            const filtered = allAuditories.filter(auditory => 
                auditory.name.toLowerCase().includes(searchTerm)
            );
            renderAuditories(filtered);
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    });

    // Модальное окно для добавления/редактирования аудитории
    async function showAuditoryModal(auditory = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${auditory ? 'Редактировать аудиторию' : 'Добавить аудиторию'}</h2>
                <form id="auditory-form">
                    <div class="form-group">
                        <label for="auditory-name"><i class="fas fa-door-open"></i> Название</label>
                        <input type="text" id="auditory-name" value="${auditory?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="auditory-capacity"><i class="fas fa-users"></i> Вместимость</label>
                        <input type="number" id="auditory-capacity" value="${auditory?.capacity || ''}" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-save">
                            <i class="fas fa-check"></i> ${auditory ? 'Сохранить' : 'Добавить'}
                        </button>
                        <button type="button" class="btn-cancel" id="cancel-btn">
                            <i class="fas fa-times"></i> Отмена
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);

        // Закрытие модального окна
        modal.querySelector('#cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Обработка отправки формы
        modal.querySelector('#auditory-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const auditoryData = {
                name: document.getElementById('auditory-name').value,
                capacity: parseInt(document.getElementById('auditory-capacity').value)
            };
            
            try {
                if (auditory) {
                    await makeRequest(`/rooms/${auditory.id}`, 'PUT', auditoryData);
                    showNotification('Аудитория обновлена');
                } else {
                    await makeRequest('/rooms', 'POST', auditoryData);
                    showNotification('Аудитория добавлена');
                }
                
                renderAuditories();
                modal.remove();
                style.remove();
            } catch (error) {
                console.error('Ошибка сохранения:', error);
            }
        });
    }

    // Обработчики кнопок
    function addEditEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async function() {
                const auditoryId = this.getAttribute('data-id');
                try {
                    const auditory = await makeRequest(`/rooms/${auditoryId}`);
                    showAuditoryModal(auditory);
                } catch (error) {
                    console.error('Ошибка загрузки:', error);
                }
            });
        });
    }

    function addDeleteEventListeners() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                const auditoryId = this.getAttribute('data-id');
                if (confirm('Вы уверены, что хотите удалить эту аудиторию?')) {
                    try {
                        await makeRequest(`/rooms/${auditoryId}`, 'DELETE');
                        showNotification('Аудитория удалена');
                        renderAuditories();
                    } catch (error) {
                        console.error('Ошибка удаления:', error);
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

    // Обновление данных
    elements.refreshBtn.addEventListener('click', function() {
        renderAuditories();
        showNotification('Данные обновлены');
    });

    // Добавление новой аудитории
    elements.addButton.addEventListener('click', function() {
        showAuditoryModal();
    });

    // Функция показа уведомлений
    function showNotification(message, type = 'success') {
        // Удаляем старое уведомление, если оно есть
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }


    // Инициализация
    renderAuditories();
});
