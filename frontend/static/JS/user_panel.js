document.addEventListener('DOMContentLoaded', function() {
    //замените на реальный URL
    const API_BASE_URL = 'http://127.0.0.1:8000';
    let authToken = localStorage.getItem('accessToken');

   
    if (!authToken) {
        window.location.href = '/';
        return;
    }

   
    const elements = {
        tableBody: document.querySelector('.auditories-table tbody'),
        searchInput: document.querySelector('.search-box input'),
        searchButton: document.querySelector('.search-box button'),
        refreshButton: document.querySelector('.refresh-button'),
        logoutButton: document.querySelector('.logout-button')
    };

    
    async function makeApiRequest(endpoint, method = 'GET', data = null) {
        try {
            const headers = {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            };

            const config = {
                method,
                headers
            };

            if (data) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка сервера');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showNotification(error.message || 'Ошибка соединения с сервером', 'error');
            throw error;
        }
    }

    // Загрузка данных об аудиториях с сервера
    async function loadAuditories() {
        try {
            const data = await makeApiRequest('/rooms');
            return data.auditories || [];
        } catch (error) {
            return [];
        }
    }

    // Отображение аудиторий в таблице
    async function renderAuditories(auditories = null) {
        try {
            const auditoriesData = auditories || await loadAuditories();
            elements.tableBody.innerHTML = '';

            if (auditoriesData.length === 0) {
                elements.tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center;">Нет данных об аудиториях</td>
                    </tr>
                `;
                return;
            }

            auditoriesData.forEach(auditory => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${auditory.name}</td>
                    <td>${auditory.currentStudents}/${auditory.capacity}</td>
                    <td>${formatTime(auditory.lastUpdate)}</td>
                `;
                elements.tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Render error:', error);
        }
    }

    // Форматирование времени
    function formatTime(timestamp) {
        if (!timestamp) return 'Нет данных';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Поиск аудиторий
    async function searchAuditories(searchTerm) {
        try {
            const allAuditories = await loadAuditories();
            const filtered = allAuditories.filter(auditory => 
                auditory.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            renderAuditories(filtered);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    // Обновление данных
    async function refreshData() {
        try {
            await renderAuditories();
            showNotification('Данные обновлены');
        } catch (error) {
            console.error('Refresh error:', error);
        }
    }

    // Выход из системы
    async function logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            try {
                await makeApiRequest('/auth/logout', 'POST');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('accessToken');
                window.location.href = '/';
            }
        }
    }

    // Показать уведомление
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Стили для уведомления
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                animation: slideIn 0.3s, fadeOut 0.5s 2.5s forwards;
                z-index: 1000;
                font-family: 'Montserrat', sans-serif;
            }
            .notification.success {
                background-color: var(--success-green);
            }
            .notification.error {
                background-color: var(--danger-red);
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            @keyframes fadeOut {
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    // Назначение обработчиков событий
    elements.searchButton.addEventListener('click', () => {
        searchAuditories(elements.searchInput.value);
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAuditories(elements.searchInput.value);
        }
    });

    elements.refreshButton.addEventListener('click', refreshData);
    elements.logoutButton.addEventListener('click', logout);

    // Первоначальная загрузка данных
    renderAuditories();
});
