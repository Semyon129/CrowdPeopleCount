document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    
    // Вместимость аудиторий
    const roomCapacity = {
        '101': 35,
        '102': 30,
        '103': 25,
        '201': 40,
        '202': 20
    };
    
    // Данные для графика (время и количество людей)
    const timeLabels = ['9:00', '10:45', '12:30', '14:45', '16:30', '18:10', '19:45'];
    
    // Инициализация данных
    let currentRoom = '101';
    let peopleData = generateRandomData(roomCapacity[currentRoom]);
    
    // Основной график
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Количество людей',
                data: peopleData,
                backgroundColor: 'rgba(30, 136, 229, 0.2)',
                borderColor: 'rgba(30, 136, 229, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    updatePieChart(index);
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: roomCapacity[currentRoom],
                    title: {
                        display: true,
                        text: 'Количество людей'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Время'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} из ${roomCapacity[currentRoom]}`;
                        }
                    }
                }
            }
        }
    });

    // Круговая диаграмма
    const pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Присутствовали', 'Отсутствовали'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['rgba(30, 136, 229, 0.8)', 'rgba(255, 99, 132, 0.8)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${percentage}%`;
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // Обновление круговой диаграммы
    function updatePieChart(index) {
        const selectedTime = timeLabels[index];
        const present = peopleData[index];
        const total = roomCapacity[currentRoom];
        const absent = total - present;
        const presentPercentage = Math.round((present / total) * 100);
        
        pieChart.data.datasets[0].data = [present, absent];
        pieChart.update();
        
        document.getElementById('selectedTime').textContent = selectedTime;
        document.getElementById('totalSeats').textContent = total;
        document.getElementById('presentCount').textContent = present;
        document.getElementById('attendancePercent').textContent = `${presentPercentage}%`;
    }

    // Генерация случайных данных
    function generateRandomData(max) {
        return timeLabels.map(() => Math.floor(Math.random() * max * 0.8) + Math.floor(max * 0.2));
    }

    // Обработчики изменения фильтров
    document.getElementById('room').addEventListener('change', function() {
        currentRoom = this.value.split(' ')[0];
        peopleData = generateRandomData(roomCapacity[currentRoom]);
        
        // Обновляем основной график
        chart.data.datasets[0].data = peopleData;
        chart.options.scales.y.max = roomCapacity[currentRoom];
        chart.update();
        
        // Сбрасываем круговую диаграмму
        resetPieChart();
    });

    document.getElementById('date').addEventListener('change', function() {
        peopleData = generateRandomData(roomCapacity[currentRoom]);
        chart.data.datasets[0].data = peopleData;
        chart.update();
        resetPieChart();
    });
    
    // Сброс круговой диаграммы
    function resetPieChart() {
        pieChart.data.datasets[0].data = [0, 0];
        pieChart.update();
        
        document.getElementById('selectedTime').textContent = '-';
        document.getElementById('totalSeats').textContent = '0';
        document.getElementById('presentCount').textContent = '0';
        document.getElementById('attendancePercent').textContent = '0%';
    }
    
    // Инициализация с первой парой
    updatePieChart(0);
});