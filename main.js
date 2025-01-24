// Almacenamiento de reportes y eventos
let reports = JSON.parse(localStorage.getItem('reports')) || [];
let scheduledEvents = JSON.parse(localStorage.getItem('scheduledEvents')) || [];
let currentDate = new Date(); // Fecha actual

// Función para mostrar secciones
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`button[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'registro') {
        initializeRegistroForm();
    } else if (sectionId === 'reportes') {
        loadReports();
    } else if (sectionId === 'calendario') {
        renderCalendar();
    } else if (sectionId === 'proximos') {
        updateEmployeeEventFilter();
        filterUpcomingEvents();
    }
}

// Dashboard
function updateDashboard() {
    const dashboard = document.getElementById('dashboard');
    
    dashboard.innerHTML = `
        <div class="dashboard-container">
            <h2>Panel de Control</h2>
            <div class="date-filter">
                <label>Filtrar por fecha:</label>
                <input type="date" id="dashboardStartDate" onchange="updateDashboardData()">
                <input type="date" id="dashboardEndDate" onchange="updateDashboardData()">
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Eventos en Rango</h3>
                    <p class="stat-number" id="eventsCount">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Reportes</h3>
                    <p class="stat-number" id="reportsCount">0</p>
                </div>
                <div class="stat-card">
                    <h3>Reportes Pendientes</h3>
                    <p class="stat-number" id="pendingCount">0</p>
                </div>
            </div>
            <div class="charts-container">
                <div class="chart-wrapper">
                    <h3>Reportes por Empleado</h3>
                    <canvas id="employeeReportsChart"></canvas>
                </div>
                <div class="chart-wrapper">
                    <h3>Salones más Reportados</h3>
                    <canvas id="roomReportsChart"></canvas>
                </div>
            </div>
            <div class="today-events">
                <h3>Eventos en el Rango Seleccionado</h3>
                <div id="filteredEventsList"></div>
            </div>
        </div>
    `;

    updateDashboardData();
}

function updateDashboardData() {
    const startDate = document.getElementById('dashboardStartDate').value;
    const endDate = document.getElementById('dashboardEndDate').value;

    let filteredEvents = [...scheduledEvents];
    let filteredReports = [...reports];

    if (startDate && endDate) {
        filteredEvents = scheduledEvents.filter(event => {
            const eventDate = event.date.split('T')[0];
            return eventDate >= startDate && eventDate <= endDate;
        });

        filteredReports = reports.filter(report => {
            const reportDate = new Date(report.fecha).toISOString().split('T')[0];
            return reportDate >= startDate && reportDate <= endDate;
        });
    }

    // Actualizar contadores
    document.getElementById('eventsCount').textContent = filteredEvents.length;
    document.getElementById('reportsCount').textContent = filteredReports.length;
    document.getElementById('pendingCount').textContent = filteredReports.filter(r => !r.atendido).length;

    // Actualizar lista de eventos
    const eventsList = document.getElementById('filteredEventsList');
    eventsList.innerHTML = filteredEvents.length > 0 ? `
        <table class="events-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Evento</th>
                    <th>Lugar</th>
                    <th>Asignado a</th>
                </tr>
            </thead>
            <tbody>
                ${filteredEvents.map(event => `
                    <tr>
                        <td>${new Date(event.date).toLocaleDateString()}</td>
                        <td>${event.startTime}</td>
                        <td>${event.name}</td>
                        <td>${event.location}</td>
                        <td>Empleado ${event.employeeId}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<p>No hay eventos en el rango seleccionado</p>';

    // Generar gráficas
    generateEmployeeReportsChart(filteredReports);
    generateRoomReportsChart(filteredReports);
}

function generateEmployeeReportsChart(filteredReports) {
    const employeeReports = {};
    filteredReports.forEach(report => {
        employeeReports[report.employeeId] = (employeeReports[report.employeeId] || 0) + 1;
    });

    const ctx = document.getElementById('employeeReportsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(employeeReports).map(id => `Empleado ${id}`),
            datasets: [{
                label: 'Reportes Atendidos',
                data: Object.values(employeeReports),
                backgroundColor: '#64ffda',
                borderColor: '#64ffda',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#a0aec0'
                    }
                },
                x: {
                    ticks: {
                        color: '#a0aec0'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

function generateRoomReportsChart(filteredReports) {
    const roomReports = {};
    filteredReports.forEach(report => {
        roomReports[report.salon] = (roomReports[report.salon] || 0) + 1;
    });

    const topRooms = Object.entries(roomReports)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const ctx = document.getElementById('roomReportsChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: topRooms.map(([room]) => room),
            datasets: [{
                data: topRooms.map(([,count]) => count),
                backgroundColor: [
                    '#64ffda',
                    '#ff6b6b',
                    '#ffd93d',
                    '#6c5ce7',
                    '#a8e6cf'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

// Registro de Reportes
function initializeRegistroForm() {
    const registro = document.getElementById('registro');
    registro.innerHTML = `
        <div class="form-container">
            <h2>Nuevo Reporte</h2>
            <form onsubmit="handleReportSubmit(event)">
                <div class="form-group">
                    <label>Salón</label>
                    <input type="text" id="reportRoom" required>
                </div>
                <div class="form-group">
                    <label>Descripción del Problema</label>
                    <textarea id="reportDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label>Prioridad</label>
                    <select id="reportPriority" required>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Número de Empleado Asignado</label>
                    <input type="text" id="reportEmployee" required>
                </div>
                <button type="submit" class="submit-btn">Crear Reporte</button>
            </form>
        </div>
    `;
}

function handleReportSubmit(event) {
    event.preventDefault();
    
    const newReport = {
        id: Date.now(),
        salon: document.getElementById('reportRoom').value,
        descripcion: document.getElementById('reportDescription').value,
        prioridad: document.getElementById('reportPriority').value,
        employeeId: document.getElementById('reportEmployee').value,
        fecha: new Date().toISOString(),
        atendido: false
    };
    
    reports.push(newReport);
    localStorage.setItem('reports', JSON.stringify(reports));
    
    event.target.reset();
    alert('Reporte creado exitosamente');
    showSection('reportes');
}

// Reportes
function loadReports() {
    const reportesSection = document.getElementById('reportes');
    reportesSection.innerHTML = `
        <div class="reports-container">
            <h2>Lista de Reportes</h2>
            <div class="filters-container">
                <div class="filter-group">
                    <label>Estado:</label>
                    <select id="statusFilter" onchange="applyReportFilters()">
                        <option value="todos">Todos</option>
                        <option value="pendientes">Pendientes</option>
                        <option value="atendidos">Atendidos</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Empleado:</label>
                    <select id="employeeFilter" onchange="applyReportFilters()">
                        <option value="todos">Todos</option>
                        ${[...new Set(reports.map(r => r.employeeId))].map(id => 
                            `<option value="${id}">Empleado ${id}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Rango de Fecha:</label>
                    <input type="date" id="startDate" onchange="applyReportFilters()">
                    <input type="date" id="endDate" onchange="applyReportFilters()">
                </div>
                <button onclick="exportToExcel()" class="export-btn">
                    Exportar a Excel
                </button>
            </div>
            <table class="reports-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Salón</th>
                        <th>Descripción</th>
                        <th>Prioridad</th>
                        <th>Empleado</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="reportsTableBody">
                </tbody>
            </table>
        </div>
    `;
    
    applyReportFilters();
}

function applyReportFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let filteredReports = [...reports];
    
    if (statusFilter === 'pendientes') {
        filteredReports = filteredReports.filter(report => !report.atendido);
    } else if (statusFilter === 'atendidos') {
        filteredReports = filteredReports.filter(report => report.atendido);
    }
    
    if (employeeFilter !== 'todos') {
        filteredReports = filteredReports.filter(report => report.employeeId === employeeFilter);
    }
    
    if (startDate && endDate) {
        filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.fecha).toISOString().split('T')[0];
            return reportDate >= startDate && reportDate <= endDate;
        });
    }
    
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = filteredReports.map(report => `
        <tr class="${report.atendido ? 'atendido' : ''}">
            <td>${new Date(report.fecha).toLocaleDateString()}</td>
            <td>${report.salon}</td>
            <td>${report.descripcion}</td>
            <td><span class="priority ${report.prioridad}">${report.prioridad}</span></td>
            <td>Empleado ${report.employeeId}</td>
            <td>${report.atendido ? 'Atendido' : 'Pendiente'}</td>
            <td>
                <div class="report-actions">
                    ${!report.atendido ? `
                        <button onclick="markReportAsAttended(${report.id})">
                            Marcar como Atendido
                        </button>
                    ` : ''}
                    <button onclick="deleteReport(${report.id})">
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function markReportAsAttended(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        report.atendido = true;
        localStorage.setItem('reports', JSON.stringify(reports));
        applyReportFilters();
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
    }
}

function deleteReport(reportId) {
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
        reports = reports.filter(report => report.id !== reportId);
        localStorage.setItem('reports', JSON.stringify(reports));
        applyReportFilters();
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
    }
}

function exportToExcel() {
    const statusFilter = document.getElementById('statusFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let dataToExport = [...reports];
    
    if (statusFilter === 'pendientes') {
        dataToExport = dataToExport.filter(report => !report.atendido);
    } else if (statusFilter === 'atendidos') {
        dataToExport = dataToExport.filter(report => report.atendido);
    }
    
    if (employeeFilter !== 'todos') {
        dataToExport = dataToExport.filter(report => report.employeeId === employeeFilter);
    }
    
    if (startDate && endDate) {
        dataToExport = dataToExport.filter(report => {
            const reportDate = new Date(report.fecha).toISOString().split('T')[0];
            return reportDate >= startDate && reportDate <= endDate;
        });
    }
    
    const ws = XLSX.utils.json_to_sheet(dataToExport.map(report => ({
        Fecha: new Date(report.fecha).toLocaleDateString(),
        Salon: report.salon,
        Descripcion: report.descripcion,
        Prioridad: report.prioridad,
        Empleado: `Empleado ${report.employeeId}`,
        Estado: report.atendido ? 'Atendido' : 'Pendiente'
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    
    XLSX.writeFile(wb, `reportes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Calendario
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    currentMonthElement.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    let calendarHTML = `
        <div class="calendar-days">
            <div>Dom</div>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
        </div>
        <div class="calendar-dates">
    `;
    
    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-date empty"></div>';
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const eventsForDay = scheduledEvents.filter(event => event.date.split('T')[0] === dateString);
        const hasEvents = eventsForDay.length > 0;
        
        calendarHTML += `
            <div class="calendar-date ${hasEvents ? 'has-events' : ''}" 
                 onclick="showEventsForDay('${dateString}')">
                ${day}
                ${hasEvents ? `<span class="event-indicator">${eventsForDay.length}</span>` : ''}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarGrid.innerHTML = calendarHTML;
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function showEventsForDay(date) {
    const eventsForDay = scheduledEvents.filter(event => event.date.split('T')[0] === date);
    
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.innerHTML = `
        <div class="event-modal-content">
            <h3>Eventos para ${new Date(date).toLocaleDateString()}</h3>
            <button class="modal-close" onclick="this.parentElement.parentElement.remove(); overlay.remove();">
                &times;
            </button>
            <div class="events-list">
                ${eventsForDay.length > 0 ? eventsForDay.map(event => `
                    <div class="event-item">
                        <h4>${event.name}</h4>
                        <p><strong>Lugar:</strong> ${event.location}</p>
                        <p><strong>Horario:</strong> ${event.startTime} - ${event.endTime}</p>
                        <p><strong>Equipo:</strong> ${event.equipment}</p>
                        <p><strong>Asignado a:</strong> Empleado ${event.employeeId}</p>
                    </div>
                `).join('') : '<p>No hay eventos programados para este día</p>'}
                <button onclick="showAddEventForm('${date}')" class="submit-btn">Agregar Evento</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Función para agregar eventos (debes implementarla)
function showAddEventForm(date) {
    alert(`Agregar evento para la fecha: ${date}`);
    // Aquí puedes abrir un formulario para agregar un nuevo evento
}

function showAddEventForm(date) {
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.innerHTML = `
    <div>
        <div class="modal-header">
            <h3>Agregar Evento</h3>
            <button class="modal-close" onclick="this.closest('.event-modal').remove();
                document.querySelector('.modal-overlay').remove();">&times;</button>
        </div>
        <form onsubmit="handleAddEvent(event, '${date}')">
            <div class="form-group">
                <label>Nombre del Evento</label>
                <input type="text" id="newEventName" required>
            </div>
            <div class="form-group">
                <label>Lugar</label>
                <input type="text" id="newEventLocation" required>
            </div>
            <div class="form-group">
                <label>Hora de Inicio</label>
                <input type="time" id="newStartTime" required>
            </div>
            <div class="form-group">
                <label>Hora de Finalización</label>
                <input type="time" id="newEndTime" required>
            </div>
            <div class="form-group">
                <label>Equipo Requerido</label>
                <textarea id="newEquipment" required></textarea>
            </div>
            <div class="form-group">
                <label>Asignado a (Número de Empleado)</label>
                <input type="text" id="newAssignedTo" required>
            </div>
            <button type="submit" class="submit-btn">Crear Evento</button>
        </form>
    </div>
`;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function handleAddEvent(event, date) {
    event.preventDefault();
    
    const newEvent = {
        id: Date.now(),
        name: document.getElementById('newEventName').value,
        location: document.getElementById('newEventLocation').value,
        date: date,
        startTime: document.getElementById('newStartTime').value,
        endTime: document.getElementById('newEndTime').value,
        equipment: document.getElementById('newEquipment').value,
        employeeId: document.getElementById('newAssignedTo').value
    };
    
    scheduledEvents.push(newEvent);
    localStorage.setItem('scheduledEvents', JSON.stringify(scheduledEvents));
    
    document.querySelector('.event-modal').remove();
    document.querySelector('.modal-overlay').remove();
    
    renderCalendar();
    if (document.getElementById('dashboard').classList.contains('active')) {
        updateDashboard();
    }
}

function editEvent(eventId) {
    const event = scheduledEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.innerHTML = `
        <div>
            <div class="modal-header">
                <h3>Editar Evento</h3>
                <button class="modal-close" onclick="this.closest('.event-modal').remove();
                    document.querySelector('.modal-overlay').remove();">&times;</button>
            </div>
            <form onsubmit="handleEventEdit(event, ${eventId})">
                <div class="form-group">
                    <label>Nombre del Evento</label>
                    <input type="text" id="editEventName" value="${event.name}" required/>
                </div>
                <div class="form-group">
                    <label>Lugar</label>
                    <input type="text" id="editEventLocation" value="${event.location}" required/>
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="editEventDate" value="${event.date.split('T')[0]}" required />
                </div>
                <div class="form-group">
                    <label>Hora de Inicio</label>
                    <input type="time" id="editStartTime" value="${event.startTime}" required />
                </div>
                <div class="form-group">
                    <label>Hora de Finalización</label>
                    <input type="time" id="editEndTime" value="${event.endTime}" required />
                </div>
                <div class="form-group">
                    <label>Equipo Requerido</label>
                    <textarea id="editEquipment" required>${event.equipment}</textarea>
                </div>
                <div class="form-group">
                    <label>Asignado a (Número de Empleado)</label>
                    <input type="text" id="editAssignedTo" value="${event.employeeId}" required />
                </div>
                <button type="submit" class="submit-btn">Guardar Cambios</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function handleEventEdit(event, eventId) {
    event.preventDefault();
    
    const updatedEvent = {
        id: eventId,
        name: document.getElementById('editEventName').value,
        location: document.getElementById('editEventLocation').value,
        date: document.getElementById('editEventDate').value,
        startTime: document.getElementById('editStartTime').value,
        endTime: document.getElementById('editEndTime').value,
        equipment: document.getElementById('editEquipment').value,
        employeeId: document.getElementById('editAssignedTo').value
    };
    
    const eventIndex = scheduledEvents.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        scheduledEvents[eventIndex] = updatedEvent;
        localStorage.setItem('scheduledEvents', JSON.stringify(scheduledEvents));
    }
    
    document.querySelector('.event-modal').remove();
    document.querySelector('.modal-overlay').remove();
    
    filterUpcomingEvents();
    renderCalendar();
    if (document.getElementById('dashboard').classList.contains('active')) {
        updateDashboard();
    }
}

function deleteScheduledEvent(eventId) {
    if (confirm('¿Estás seguro de que deseas cancelar este evento?')) {
        scheduledEvents = scheduledEvents.filter(event => event.id !== eventId);
        localStorage.setItem('scheduledEvents', JSON.stringify(scheduledEvents));
        filterUpcomingEvents();
        renderCalendar();
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
    }
}

// Próximos Eventos
function updateEmployeeEventFilter() {
    const employeeFilter = document.getElementById('employeeEventFilter');
    const employees = new Set(scheduledEvents.map(event => event.employeeId));
    
    employeeFilter.innerHTML = '<option value="all">Todos los empleados</option>';
    
    [...employees].sort().forEach(employeeId => {
        const option = document.createElement('option');
        option.value = employeeId;
        option.textContent = `Empleado ${employeeId}`;
        employeeFilter.appendChild(option);
    });
}

function filterUpcomingEvents() {
    const employeeFilter = document.getElementById('employeeEventFilter').value;
    const now = new Date();
    
    let filteredEvents = scheduledEvents
        .filter(event => new Date(event.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (employeeFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.employeeId === employeeFilter);
    }
    
    const eventsList = document.getElementById('upcomingEventsList');
    eventsList.innerHTML = `
        <table class="events-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Evento</th>
                    <th>Lugar</th>
                    <th>Horario</th>
                    <th>Equipo</th>
                    <th>Asignado a</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${filteredEvents.map(event => `
                    <tr>
                        <td>${new Date(event.date).toLocaleDateString()}</td>
                        <td>${event.name}</td>
                        <td>${event.location}</td>
                        <td>${event.startTime} - ${event.endTime}</td>
                        <td>${event.equipment}</td>
                        <td>Empleado ${event.employeeId}</td>
                        <td>
                            <div class="event-actions">
                                <button onclick="editEvent(${event.id})">
                                    Editar
                                </button>
                                <button onclick="deleteScheduledEvent(${event.id})">
                                    Cancelar
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
});