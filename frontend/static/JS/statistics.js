document.addEventListener('DOMContentLoaded', async function () {
    const timeLabels = ['09:00', '10:45', '12:30', '14:45', '16:30', '18:15', '20:00'];
    
    const roomSelect = document.getElementById('room');
    const dateInput = document.getElementById('date');

    // Установить текущую дату
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    let chart, pieChart;
    let roomCapacities = {};

    // Получить список аудиторий из API
    async function loadRooms() {
        const res = await fetch('/rooms');
        const rooms = await res.json();

        roomSelect.innerHTML = '';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.name;
            option.dataset.id = room.id;
            option.textContent = `${room.name} (${room.capacity} мест)`;

            roomCapacities[room.id] = room.capacity;
            roomSelect.appendChild(option);
        });
    }

    // Получить данные посещаемости из API
    async function loadDetections(roomName, date) {
        const res = await fetch(`/detections?room_id=${roomName}&date=${date}`);
        const data = await res.json();

        const timeToCount = {};
        timeLabels.forEach(time => timeToCount[time] = 0);

        data.forEach(detection => {
            const time = detection.timestamp.slice(11, 16);// "HH:MM"
            const closestLabel = timeLabels.find(label => time.startsWith(label));

            if (closestLabel) {
                timeToCount[closestLabel] = detection.count;

            }
        });

        return timeLabels.map(time => timeToCount[time] || 0);
    }

    // Построить графики
    function buildCharts(data, capacity) {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        const pieCtx = document.getElementById('pieChart').getContext('2d');

        if (chart) chart.destroy();
        if (pieChart) pieChart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Количество людей',
                    data,
                    fill: true,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(30,136,229,0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: capacity }
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        updatePieChart(data[index], capacity, timeLabels[index]);
                    }
                }
            }
        });

        updatePieChart(data[0], capacity, timeLabels[0]);
    }

    // Обновить круговую диаграмму
    function updatePieChart(present, capacity, time) {
        const absent = capacity - present;
        if (pieChart) {
        pieChart.destroy();
        }
        pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Присутствовали', 'Отсутствовали'],
                datasets: [{
                    data: [present, absent],
                    backgroundColor: ['#2196f3', '#f44336']
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Обновить текстовую инфу
        document.getElementById('selectedTime').textContent = time;
        document.getElementById('totalSeats').textContent = capacity;
        document.getElementById('presentCount').textContent = present;
        document.getElementById('attendancePercent').textContent = `${Math.round((present / capacity) * 100)}%`;
        

    }

    // Загрузить всё
    async function updateAll() {
        const roomName = roomSelect.value;
        const roomId = roomSelect.selectedOptions[0].dataset.id;
        const date = dateInput.value;
        const capacity = roomCapacities[parseInt(roomId)]; 
        const peopleCounts = await loadDetections(roomName, date);
        buildCharts(peopleCounts, capacity);
    }

    // Инициализация
    await loadRooms();
    console.log(roomCapacities);
    await updateAll();

    // Обработчики
    roomSelect.addEventListener('change', updateAll);
    dateInput.addEventListener('change', updateAll);
});

document.getElementById('logoutBtn').addEventListener('click', function () {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login.html'; // путь на страницу входа
    }
});
