// Almacenamiento de reportes y eventos
let reports = JSON.parse(localStorage.getItem('reports')) || [];
let scheduledEvents = JSON.parse(localStorage.getItem('scheduledEvents')) || [];
let currentDate = new Date();

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
    const today = new Date();
    const todayEvents = scheduledEvents.filter(event => 
        new Date(event.date).toDateString() === today.toDateString()
    );
    
    const totalReports = reports.length;
    const pendingReports = reports.filter(report => !report.atendido).length;
    
    dashboard.innerHTML = `
        <div class="dashboard-container">
            <h2>Panel de Control</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Eventos Hoy</h3>
                    <p class="stat-number">${todayEvents.length}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Reportes</h3>
                    <p class="stat-number">${totalReports}</p>
                </div>
                <div class="stat-card">
                    <h3>Reportes Pendientes</h3>
                    <p class="stat-number">${pendingReports}</p>
                </div>
            </div>
            <div class="today-events">
                <h3>Eventos de Hoy</h3>
                ${todayEvents.length > 0 ? `
                    <table class="events-table">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Evento</th>
                                <th>Lugar</th>
                                <th>Asignado a</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayEvents.map(event => `
                                <tr>
                                    <td>${event.startTime}</td>
                                    <td>${event.name}</td>
                                    <td>${event.location}</td>
                                    <td>Empleado ${event.employeeId}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No hay eventos programados para hoy</p>'}
            </div>
        </div>
    `;
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
            <div class="filter-group">
                <label>Filtrar por estado:</label>
                <select onchange="filterReports(this.value)">
                    <option value="todos">Todos</option>
                    <option value="pendientes">Pendientes</option>
                    <option value="atendidos">Atendidos</option>
                </select>
            </div>
            <table class="reports-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Salón</th>
                        <th>Descripción</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="reportsTableBody">
                </tbody>
            </table>
        </div>
    `;
    
    filterReports('todos');
}

function filterReports(filter) {
    let filteredReports = [...reports];
    
    if (filter === 'pendientes') {
        filteredReports = reports.filter(report => !report.atendido);
    } else if (filter === 'atendidos') {
        filteredReports = reports.filter(report => report.atendido);
    }
    
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = filteredReports.map(report => `
        <tr class="${report.atendido ? 'atendido' : ''}">
            <td>${new Date(report.fecha).toLocaleDateString()}</td>
            <td>${report.salon}</td>
            <td>${report.descripcion}</td>
            <td><span class="priority ${report.prioridad}">${report.prioridad}</span></td>
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
        filterReports('todos');
        updateDashboard();
    }
}

function deleteReport(reportId) {
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
        reports = reports.filter(report => report.id !== reportId);
        localStorage.setItem('reports', JSON.stringify(reports));
        filterReports('todos');
        updateDashboard();
    }
}

// Calendario (código existente)
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    document.getElementById('currentMonth').textContent = 
        `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = `
        <div class="calendar-days">
            <div>Dom</div>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
        </div>
    `;
    
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-dates';
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-date empty';
        daysGrid.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'calendar-date';
        const currentDateStr = new Date(year, month, day).toISOString().split('T')[0];
        
        const hasEvents = scheduledEvents.some(event => 
            event.date.split('T')[0] === currentDateStr
        );
        
        if (hasEvents) {
            dateDiv.classList.add('has-events');
        }
        
        dateDiv.innerHTML = `<span>${day}</span>`;
        dateDiv.onclick = () => showEventModal(new Date(year, month, day));
        
        daysGrid.appendChild(dateDiv);
    }
    
    calendarGrid.appendChild(daysGrid);
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function showEventModal(date) {
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.innerHTML = `
        <div class="modal-header">
            <h3>Crear Evento - ${date.toLocaleDateString()}</h3>
            <button class="modal-close" onclick="this.closest('.event-modal').remove();
                document.querySelector('.modal-overlay').remove();">&times;</button>
        </div>
        <form onsubmit="handleEventSubmit(event, '${date.toISOString()}')">
            <div class="form-group">
                <label>Nombre del Evento</label>
                <input type="text" id="eventName" required>
            </div>
            <div class="form-group">
                <label>Lugar</label>
                <input type="text" id="eventLocation" required>
            </div>
            <div class="form-group">
                <label>Hora de Inicio</label>
                <input type="time" id="startTime" required>
            </div>
            <div class="form-group">
                <label>Hora de Finalización</label>
                <input type="time" id="endTime" required>
            </div>
            <div class="form-group">
                <label>Equipo Requerido</label>
                <textarea id="equipment" required></textarea>
            </div>
            <div class="form-group">
                <label>Asignado a (Número de Empleado)</label>
                <input type="text" id="assignedTo" required>
            </div>
            <button type="submit" class="submit-btn">Crear Evento</button>
        </form>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function handleEventSubmit(event, dateStr) {
    event.preventDefault();
    
    const newEvent = {
        id: Date.now(),
        name: document.getElementById('eventName').value,
        location: document.getElementById('eventLocation').value,
        date: dateStr,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        equipment: document.getElementById('equipment').value,
        employeeId: document.getElementById('assignedTo').value
    };
    
    scheduledEvents.push(newEvent);
    localStorage.setItem('scheduledEvents', JSON.stringify(scheduledEvents));
    
    document.querySelector('.event-modal').remove();
    document.querySelector('.modal-overlay').remove();
    
    renderCalendar();
    if (document.getElementById('proximos').classList.contains('active')) {
        filterUpcomingEvents();
    }
    updateDashboard();
}

// Próximos Eventos (código existente)
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

function deleteScheduledEvent(eventId) {
    if (confirm('¿Estás seguro de que deseas cancelar este evento?')) {
        scheduledEvents = scheduledEvents.filter(event => event.id !== eventId);
        localStorage.setItem('scheduledEvents', JSON.stringify(scheduledEvents));
        filterUpcomingEvents();
        renderCalendar();
        updateDashboard();
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
});