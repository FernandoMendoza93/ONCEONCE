// JAVASCRIPT OPERATIVO DEL DASHBOARD ADMIN - ONCE:ONCE

document.addEventListener('DOMContentLoaded', () => {
    
    // 0. CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
    const SUPABASE_URL = 'https://wxwtacfuabpjloreiiws.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4d3RhY2Z1YWJwamxvcmVpaXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjA2MzUsImV4cCI6MjA5NzM5NjYzNX0.iZw0Fsk95g5g8hQf2JjP6h3hFoGpJD7rveZUFhzUsbY';
    
    let supabase = null;
    let currentUser = null;
    let currentAdminProfile = null;
    
    // Inicializar variables del Calendario/Agenda
    let currentWeekMonday = getMonday(new Date());
    let activeFilterType = 'all'; // 'all', 'reformer', 'tapetes'
    let activeMobileDay = getDayAbbreviation(new Date()); // Mon, Tue...
    
    // Inicializar Notificaciones Sileo
    sileo.init({
        position: 'top-center',
        duration: 3500,
        theme: 'dark'
    });

    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Validar sesión del admin
        checkAuth();
    } catch (e) {
        console.error('Error al inicializar cliente de Supabase:', e);
        window.location.replace('../index.html');
    }

    // ==========================================================================
    // 1. SEGURIDAD Y CONTROL DE ACCESO (GUARDIA FRONTEND)
    // ==========================================================================
    async function checkAuth() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                window.location.replace('../index.html');
                return;
            }
            
            currentUser = session.user;
            
            // Consultar el perfil en la tabla clientes
            const { data: profile, error: profileError } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', currentUser.id)
                .single();
                
            if (profileError || !profile || profile.rol !== 'admin') {
                window.location.replace('../index.html');
                return;
            }
            
            currentAdminProfile = profile;
            document.getElementById('display-admin-name').innerText = profile.nombre;
            
            // Cerrar animación del loader e iniciar la interfaz del Dashboard
            const loader = document.getElementById('admin-loader');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.getElementById('admin-content').style.display = 'flex';
            }, 400);
            
            initDashboard();
            
        } catch (e) {
            console.error("Auth Guard Catch:", e);
            window.location.replace('../index.html');
        }
    }

    // ==========================================================================
    // 2. INICIALIZADOR DE INTERFAZ Y MANEJADORES GLOBALES
    // ==========================================================================
    function initDashboard() {
        initTabs();
        initSubTabs();
        initModalCloseHandlers();
        
        // Carga por defecto: Vista Overview
        loadOverview();
        
        // Manejador del Logout en el sidebar
        document.getElementById('btn-admin-logout').addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                sileo.error({title: 'Error', description: 'No se pudo cerrar la sesión.'});
            } else {
                window.location.replace('../index.html');
            }
        });

        // Configurar buscador de clientes en tiempo real
        const searchInput = document.getElementById('input-search-clientes');
        searchInput.addEventListener('input', debounce(() => {
            loadClientes(searchInput.value.trim());
        }, 300));
        
        // Botón cerrar detalle de cliente
        document.getElementById('btn-close-client-detail').addEventListener('click', () => {
            document.getElementById('client-detail-panel').style.display = 'none';
        });

        // Formularios de alta
        document.getElementById('form-new-coach').addEventListener('submit', handleAddCoach);
        document.getElementById('form-new-disciplina').addEventListener('submit', handleAddDisciplina);
    }

    // Navegación de Pestañas Principales (Sidebar)
    function initTabs() {
        const tabs = document.querySelectorAll('.nav-tab-btn');
        const sections = document.querySelectorAll('.view-section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const target = tab.getAttribute('data-target');
                document.getElementById(target).classList.add('active');
                
                loadViewData(target);
            });
        });
    }

    // Navegación de Sub-Pestañas (Coaches & Disciplinas)
    function initSubTabs() {
        const subtabs = document.querySelectorAll('.admin-tab-btn');
        const subviews = document.querySelectorAll('.admin-subtab-view');
        
        subtabs.forEach(tab => {
            tab.addEventListener('click', () => {
                subtabs.forEach(t => t.classList.remove('active'));
                subviews.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const subtarget = tab.getAttribute('data-subtarget');
                document.getElementById(subtarget).classList.add('active');
            });
        });
    }

    // Enrutador de datos de vistas
    function loadViewData(viewId) {
        if (viewId === 'view-overview') {
            loadOverview();
        } else if (viewId === 'view-agenda') {
            loadAgenda();
        } else if (viewId === 'view-clientes') {
            loadClientes();
        } else if (viewId === 'view-coaches-disciplinas') {
            loadCoaches();
            loadDisciplinas();
        }
    }

    // ==========================================================================
    // VISTA 1 — OVERVIEW (KPIs Y HOY)
    // ==========================================================================
    async function loadOverview() {
        try {
            const todayEnglish = getDayAbbreviation(new Date());
            const todayDateStr = getLocalDateString(new Date());
            
            // Actualizar etiqueta de fecha superior
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('overview-date-label').innerText = new Date().toLocaleDateString('es-ES', options).toUpperCase();

            // 1. Obtener clases activas del día de hoy
            const { data: classes, error: classesError } = await supabase
                .from('clases')
                .select(`
                    id,
                    hora_inicio,
                    hora_fin,
                    capacidad_maxima,
                    disciplinas (nombre),
                    coaches (nombre)
                `)
                .eq('dia_semana', todayEnglish)
                .eq('activo', true)
                .order('hora_inicio', { ascending: true });

            if (classesError) throw classesError;

            // 2. Obtener reservas programadas para hoy
            const { data: todayBookings, error: bookingsError } = await supabase
                .from('reservas')
                .select('id, clase_id, estatus_pago')
                .eq('fecha', todayDateStr);

            if (bookingsError) throw bookingsError;

            // Calcular ocupación de clases
            const bookingCounts = {};
            todayBookings.forEach(b => {
                bookingCounts[b.clase_id] = (bookingCounts[b.clase_id] || 0) + 1;
            });

            // Inyectar KPI: Clases de Hoy
            document.getElementById('kpi-val-clases').innerText = classes.length;
            const totalPlaces = classes.reduce((acc, c) => acc + (c.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (c.capacidad_maxima || 5)), 0);
            const bookedPlaces = todayBookings.length;
            document.getElementById('kpi-sub-clases').innerText = `${bookedPlaces} / ${totalPlaces} lugares ocupados`;

            // 3. KPI: Ocupación de la semana
            // Obtener reservas de la semana en curso (Lunes a Sábado)
            const weekDates = getWeekDates(currentWeekMonday);
            const mondayStr = getLocalDateString(weekDates[0]);
            const saturdayStr = getLocalDateString(weekDates[5]);
            
            const { data: weekBookings, error: weekBookingsError } = await supabase
                .from('reservas')
                .select('id')
                .gte('fecha', mondayStr)
                .lte('fecha', saturdayStr);

            const { data: activeClasses, error: activeClassesError } = await supabase
                .from('clases')
                .select('id, capacidad_maxima, disciplinas(nombre)')
                .eq('activo', true);

            if (!weekBookingsError && !activeClassesError && activeClasses) {
                const weeklyCapacity = activeClasses.reduce((acc, c) => {
                    const maxCap = c.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (c.capacidad_maxima || 5);
                    return acc + maxCap;
                }, 0);
                
                const percent = weeklyCapacity > 0 ? Math.round((weekBookings.length / weeklyCapacity) * 100) : 0;
                document.getElementById('kpi-val-ocupacion').innerText = `${percent}%`;
                document.getElementById('kpi-sub-ocupacion').innerText = `${weekBookings.length} reservas registradas`;
            }

            // 4. KPI: Pagos pendientes
            const { count: pendingCount, error: pendingError } = await supabase
                .from('reservas')
                .select('*', { count: 'exact', head: true })
                .neq('estatus_pago', 'Confirmado 50%');

            if (!pendingError) {
                document.getElementById('kpi-val-pagos').innerText = pendingCount;
                document.getElementById('kpi-sub-pagos').innerText = 'Reservas sin confirmación de pago';
            }

            // Configurar redirección de clic de card pagos pendientes a la agenda
            document.getElementById('kpi-pagos-pendientes').onclick = () => {
                document.querySelector('[data-target="view-agenda"]').click();
            };

            // 5. KPI: Coaches activos hoy
            const todayCoaches = [...new Set(classes.map(c => c.coaches?.nombre).filter(Boolean))];
            document.getElementById('kpi-val-coaches').innerText = todayCoaches.length;
            document.getElementById('kpi-sub-coaches').innerText = todayCoaches.length > 0 ? todayCoaches.join(', ') : 'Ninguno asignado';

            // 6. RENDERIZAR TABLA DE HOY
            const tbody = document.getElementById('overview-today-classes');
            tbody.innerHTML = '';

            if (classes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="table-no-data">No hay clases activas programadas para hoy (${getSpanishDay(todayEnglish)}).</td></tr>`;
                return;
            }

            classes.forEach(clase => {
                const maxCap = clase.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (clase.capacidad_maxima || 5);
                const booked = bookingCounts[clase.id] || 0;
                const percentFull = Math.round((booked / maxCap) * 100);
                
                let statusLabel = 'Disponible';
                let statusClass = 'status-green';
                if (booked === maxCap) {
                    statusLabel = 'Llena';
                    statusClass = 'status-red';
                } else if (percentFull >= 70) {
                    statusLabel = 'Pocos cupos';
                    statusClass = 'status-yellow';
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${formatTime12h(clase.hora_inicio)}</strong><br><small>Fin: ${formatTime12h(clase.hora_fin)}</small></td>
                    <td><strong>${clase.disciplinas?.nombre || 'Clase'}</strong></td>
                    <td>${clase.coaches?.nombre || 'Sin coach'}</td>
                    <td><strong>${booked} / ${maxCap}</strong> <small style="color:var(--color-text-muted);">(${percentFull}%)</small></td>
                    <td><span class="status-badge ${statusClass === 'status-green' ? 'confirmed' : (statusClass === 'status-red' ? 'cancelled' : 'pending')}">${statusLabel}</span></td>
                    <td><button class="admin-action-btn view-cell-action-btn" data-class-id="${clase.id}" data-date="${todayDateStr}">VER CLASE</button></td>
                `;
                
                row.querySelector('.view-cell-action-btn').addEventListener('click', (e) => {
                    openAgendaClassModal(clase.id, todayDateStr);
                });
                
                tbody.appendChild(row);
            });

        } catch (error) {
            console.error('Error al cargar resumen operativo:', error);
            sileo.error({title: 'Error de carga', description: 'No se pudieron descargar los datos operacionales.'});
        }
    }

    // ==========================================================================
    // VISTA 2 — AGENDA SEMANAL (CALENDARIO COMPACTO Y TÁCTIL)
    // ==========================================================================
    async function loadAgenda() {
        try {
            // Renderizar la etiqueta de semana seleccionada
            const weekDates = getWeekDates(currentWeekMonday);
            const mondayLabel = formatDateShortSpanish(weekDates[0]);
            const saturdayLabel = formatDateShortSpanish(weekDates[5]);
            document.getElementById('label-current-week').innerText = `${mondayLabel} - ${saturdayLabel}`;

            // Configurar botones de semana
            document.getElementById('btn-prev-week').onclick = () => {
                currentWeekMonday.setDate(currentWeekMonday.getDate() - 7);
                loadAgenda();
            };
            document.getElementById('btn-next-week').onclick = () => {
                currentWeekMonday.setDate(currentWeekMonday.getDate() + 7);
                loadAgenda();
            };

            // 1. Obtener todas las clases activas
            const { data: classes, error: classesError } = await supabase
                .from('clases')
                .select(`
                    id,
                    dia_semana,
                    hora_inicio,
                    hora_fin,
                    capacidad_maxima,
                    disciplinas (nombre),
                    coaches (nombre)
                `)
                .eq('activo', true);

            if (classesError) throw classesError;

            // 2. Obtener todas las reservas en este rango de semana
            const mondayStr = getLocalDateString(weekDates[0]);
            const saturdayStr = getLocalDateString(weekDates[5]);

            const { data: bookings, error: bookingsError } = await supabase
                .from('reservas')
                .select('clase_id, fecha')
                .gte('fecha', mondayStr)
                .lte('fecha', saturdayStr);

            if (bookingsError) throw bookingsError;

            // Contabilizar reservas por clase_id + fecha
            const bookingCounts = {};
            bookings.forEach(b => {
                const key = `${b.clase_id}_${b.fecha}`;
                bookingCounts[key] = (bookingCounts[key] || 0) + 1;
            });

            // 3. Configurar filtros de barra rápida
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeFilterType = btn.getAttribute('data-target') || btn.getAttribute('data-filter-type');
                    renderGrid(classes, bookingCounts, weekDates);
                };
            });

            // 4. Renderizar cuadrícula
            renderGrid(classes, bookingCounts, weekDates);

        } catch (error) {
            console.error('Error al cargar agenda semanal:', error);
            sileo.error({title: 'Error de carga', description: 'No se pudieron descargar los horarios de esta semana.'});
        }
    }

    function renderGrid(classes, bookingCounts, weekDates) {
        // Filtrar clases según botón de tipo activo
        let filteredClasses = classes;
        if (activeFilterType === 'reformer') {
            filteredClasses = classes.filter(c => c.disciplinas?.nombre?.toLowerCase().includes('reformer'));
        } else if (activeFilterType === 'tapetes') {
            filteredClasses = classes.filter(c => c.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i));
        }

        // Obtener todos los horarios de inicio únicos ordenados
        const startTimes = [...new Set(filteredClasses.map(c => c.hora_inicio))].sort();

        // 1. RENDERIZAR GRID DESKTOP / TABLET
        const desktopContainer = document.getElementById('agenda-desktop-grid');
        desktopContainer.innerHTML = '';

        if (startTimes.length === 0) {
            desktopContainer.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--color-text-muted); font-style:italic;">No hay clases programadas para este filtro.</div>`;
            return;
        }

        const table = document.createElement('table');
        table.className = 'agenda-table';

        // Cabecera: Time | Lunes (Date) ...
        const daysEnglish = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysSpanish = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        let headerRow = '<tr><th class="time-col-header">Horario</th>';
        daysEnglish.forEach((day, index) => {
            const dateStr = formatDateShortSpanish(weekDates[index]);
            headerRow += `<th>${daysSpanish[index]}<span class="day-num">${dateStr}</span></th>`;
        });
        headerRow += '</tr>';
        
        const thead = document.createElement('thead');
        thead.innerHTML = headerRow;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        startTimes.forEach(time => {
            const row = document.createElement('tr');
            
            // Columna de hora
            const timeTd = document.createElement('td');
            timeTd.className = 'time-col';
            timeTd.innerHTML = `<strong>${formatTime12h(time)}</strong>`;
            row.appendChild(timeTd);

            // Columnas de días
            daysEnglish.forEach((day, dayIndex) => {
                const td = document.createElement('td');
                const matchedClass = filteredClasses.find(c => c.dia_semana === day && c.hora_inicio === time);

                if (matchedClass) {
                    const targetDateStr = getLocalDateString(weekDates[dayIndex]);
                    const key = `${matchedClass.id}_${targetDateStr}`;
                    const booked = bookingCounts[key] || 0;
                    const maxCap = matchedClass.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (matchedClass.capacidad_maxima || 5);
                    const percent = Math.round((booked / maxCap) * 100);

                    let statusClass = 'status-green';
                    if (booked === maxCap) {
                        statusClass = 'status-red';
                    } else if (percent >= 70) {
                        statusClass = 'status-yellow';
                    }

                    const card = document.createElement('div');
                    card.className = `agenda-class-card ${statusClass}`;
                    card.innerHTML = `
                        <div class="agenda-class-name">${matchedClass.disciplinas?.nombre || 'Clase'}</div>
                        <div class="agenda-class-coach">${matchedClass.coaches?.nombre || 'Ani'}</div>
                        <div class="agenda-class-occupancy-row">
                            <span class="agenda-class-occupancy-text ${statusClass.replace('status-', '')}">${booked}/${maxCap}</span>
                            <span class="agenda-class-indicator-dot ${statusClass.replace('status-', '')}"></span>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        openAgendaClassModal(matchedClass.id, targetDateStr);
                    });
                    
                    td.appendChild(card);
                }
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        desktopContainer.appendChild(table);

        // 2. RENDERIZAR VISTA DE MÓVIL (SELECTORES DE CHIPS + LISTA VERTICAL)
        renderMobileView(filteredClasses, bookingCounts, weekDates);
    }

    function renderMobileView(filteredClasses, bookingCounts, weekDates) {
        const chipContainer = document.getElementById('mobile-day-selector');
        const listContainer = document.getElementById('agenda-mobile-list');
        
        chipContainer.innerHTML = '';
        listContainer.innerHTML = '';

        const daysEnglish = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysSpanishInitials = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

        // Renderizar chips de días
        daysEnglish.forEach((day, index) => {
            const date = weekDates[index];
            const chip = document.createElement('button');
            chip.className = `mobile-day-chip ${day === activeMobileDay ? 'active' : ''}`;
            chip.innerHTML = `
                <span>${daysSpanishInitials[index]}</span>
                <span class="chip-num">${date.getDate()}</span>
            `;
            
            chip.onclick = () => {
                document.querySelectorAll('.mobile-day-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                activeMobileDay = day;
                renderMobileList(filteredClasses, bookingCounts, weekDates[index]);
            };
            
            chipContainer.appendChild(chip);
        });

        // Cargar lista para el día móvil activo
        const activeDayIndex = daysEnglish.indexOf(activeMobileDay);
        if (activeDayIndex !== -1) {
            renderMobileList(filteredClasses, bookingCounts, weekDates[activeDayIndex]);
        }
    }

    function renderMobileList(filteredClasses, bookingCounts, selectedDate) {
        const listContainer = document.getElementById('agenda-mobile-list');
        listContainer.innerHTML = '';
        
        const dayAbbr = getDayAbbreviation(selectedDate);
        const dateStr = getLocalDateString(selectedDate);
        
        const dayClasses = filteredClasses
            .filter(c => c.dia_semana === dayAbbr)
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        if (dayClasses.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; padding: 3rem; color:var(--color-text-muted); font-style:italic;">No hay clases programadas para este día.</div>`;
            return;
        }

        dayClasses.forEach(clase => {
            const key = `${clase.id}_${dateStr}`;
            const booked = bookingCounts[key] || 0;
            const maxCap = clase.disciplinas?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (clase.capacidad_maxima || 5);
            const percent = Math.round((booked / maxCap) * 100);

            let statusClass = 'status-green';
            if (booked === maxCap) {
                statusClass = 'status-red';
            } else if (percent >= 70) {
                statusClass = 'status-yellow';
            }

            const card = document.createElement('div');
            card.className = `mobile-class-card ${statusClass}`;
            card.innerHTML = `
                <div class="mobile-class-main">
                    <h4>${clase.disciplinas?.nombre || 'Clase'}</h4>
                    <div class="mobile-class-meta">
                        <span>🕒 ${formatTime12h(clase.hora_inicio)} - ${formatTime12h(clase.hora_fin)}</span>
                        <span>👤 ${clase.coaches?.nombre || 'Ani'}</span>
                    </div>
                </div>
                <div class="mobile-class-occupancy">
                    <span class="mobile-occupancy-num ${statusClass.replace('status-', '')}">${booked} / ${maxCap}</span>
                    <span class="mobile-occupancy-label">Cupos</span>
                </div>
            `;
            
            card.onclick = () => {
                openAgendaClassModal(clase.id, dateStr);
            };
            
            listContainer.appendChild(card);
        });
    }

    // Modal de Detalles de la Clase Programada
    async function openAgendaClassModal(classId, dateStr) {
        try {
            const modal = document.getElementById('agenda-class-modal');
            
            // 1. Obtener detalles de la clase
            const { data: clase, error: classError } = await supabase
                .from('clases')
                .select('*, disciplines:disciplina_id(nombre), coaches:coach_id(nombre)')
                .eq('id', classId)
                .single();

            if (classError) throw classError;

            // Inyectar datos cabecera
            document.getElementById('modal-class-discipline-tag').innerText = 'PILATES STUDIO';
            document.getElementById('modal-class-title').innerText = clase.disciplines?.nombre || 'Clase';
            document.getElementById('modal-class-coach').innerText = clase.coaches?.nombre || 'Ani';
            document.getElementById('modal-class-time').innerText = `${formatTime12h(clase.hora_inicio)} - ${formatTime12h(clase.hora_fin)} (${formatDateSpanish(dateStr)})`;

            // 2. Obtener clientes inscritos
            const clientsTbody = document.getElementById('modal-class-clients-list');
            clientsTbody.innerHTML = '<tr><td colspan="4" class="table-loading">Cargando alumnos inscritos...</td></tr>';

            const { data: bookings, error: bookingsError } = await supabase
                .from('reservas')
                .select('*, clientes(*)')
                .eq('clase_id', classId)
                .eq('fecha', dateStr);

            if (bookingsError) throw bookingsError;

            const maxCap = clase.disciplines?.nombre?.match(/tapete|mat pilates|gap/i) ? 7 : (clase.capacidad_maxima || 5);
            document.getElementById('modal-class-occupancy').innerText = `${bookings.length} / ${maxCap}`;

            clientsTbody.innerHTML = '';

            if (bookings.length === 0) {
                clientsTbody.innerHTML = `<tr><td colspan="4" class="table-no-data">No hay alumnos reservados para esta clase todavía.</td></tr>`;
            } else {
                bookings.forEach(booking => {
                    const clientProfile = booking.clientes;
                    if (!clientProfile) return;

                    const row = document.createElement('tr');
                    
                    const isPaid = booking.estatus_pago === 'Confirmado 50%';
                    const statusClass = isPaid ? 'confirmed' : 'pending';
                    const statusText = booking.estatus_pago || 'Pendiente';

                    row.innerHTML = `
                        <td>
                            <strong>${clientProfile.nombre}</strong>
                            ${clientProfile.historial_lesiones ? '<span class="alert-icon-indicator" title="Tiene registro de lesiones">⚠️</span>' : ''}
                        </td>
                        <td><a href="https://wa.me/52${clientProfile.telefono}" target="_blank" style="color:var(--color-gold);text-decoration:underline;">${clientProfile.telefono}</a></td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td style="display:flex; gap:0.5rem; justify-content:flex-end;">
                            <button class="admin-action-btn toggle-pay-btn" data-booking-id="${booking.id}" data-current-paid="${isPaid}">
                                ${isPaid ? 'PENDIENTE' : 'PAGADO'}
                            </button>
                            <button class="admin-secondary-btn delete-booking-btn" data-booking-id="${booking.id}" style="color:#FF6B6B; border-color:rgba(255,107,107,0.25);">
                                CANCELAR
                            </button>
                        </td>
                    `;
                    
                    // Acción: Cambiar estatus de pago
                    row.querySelector('.toggle-pay-btn').addEventListener('click', async (e) => {
                        const bId = e.target.getAttribute('data-booking-id');
                        const isCurrentPaid = e.target.getAttribute('data-current-paid') === 'true';
                        const newStatus = isCurrentPaid ? 'Pendiente' : 'Confirmado 50%';
                        
                        e.target.disabled = true;
                        const { error: updateError } = await supabase
                            .from('reservas')
                            .update({ estatus_pago: newStatus })
                            .eq('id', bId);

                        if (updateError) {
                            sileo.error({title: 'Error', description: 'No se pudo actualizar el pago: ' + updateError.message});
                            e.target.disabled = false;
                        } else {
                            sileo.success({title: 'Pago Modificado', description: 'El estado de pago ha sido modificado.'});
                            // Recargar el modal y la agenda
                            openAgendaClassModal(classId, dateStr);
                            loadAgenda();
                        }
                    });

                    // Acción: Cancelar Reserva
                    row.querySelector('.delete-booking-btn').addEventListener('click', async (e) => {
                        if (!confirm(`¿Estás seguro de que deseas cancelar la reserva de ${clientProfile.nombre}?`)) return;
                        
                        e.target.disabled = true;
                        const { error: deleteError } = await supabase
                            .from('reservas')
                            .delete()
                            .eq('id', booking.id);

                        if (deleteError) {
                            sileo.error({title: 'Error', description: 'No se pudo cancelar la reserva.'});
                            e.target.disabled = false;
                        } else {
                            sileo.success({title: 'Reserva Cancelada', description: 'La reserva fue cancelada exitosamente.'});
                            openAgendaClassModal(classId, dateStr);
                            loadAgenda();
                        }
                    });

                    clientsTbody.appendChild(row);
                });
            }

            modal.classList.add('active');

        } catch (error) {
            console.error('Error al abrir detalles de la clase:', error);
            sileo.error({title: 'Error', description: 'No se pudo abrir el panel de la clase.'});
        }
    }

    // ==========================================================================
    // VISTA 3 — CLIENTES (BÚSQUEDA Y LESIONES DETALLADAS)
    // ==========================================================================
    async function loadClientes(searchQuery = '') {
        try {
            const tableBody = document.getElementById('clients-table-body');
            tableBody.innerHTML = '<tr><td colspan="4" class="table-loading">Buscando alumnos registrados...</td></tr>';

            let queryBuilder = supabase
                .from('clientes')
                .select('*')
                .order('nombre', { ascending: true })
                .limit(40);

            if (searchQuery) {
                queryBuilder = queryBuilder.or(`nombre.ilike.%${searchQuery}%,telefono.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            }

            const { data: clients, error } = await queryBuilder;

            if (error) throw error;

            tableBody.innerHTML = '';

            if (clients.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="table-no-data">No se encontraron clientes para la búsqueda "${searchQuery}".</td></tr>`;
                return;
            }

            clients.forEach(client => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <strong>${client.nombre}</strong>
                        ${client.historial_lesiones ? '<span class="alert-icon-indicator" title="Precaución: Posee lesiones registradas">⚠️</span>' : ''}
                    </td>
                    <td><a href="https://wa.me/52${client.telefono}" target="_blank" style="color:var(--color-gold);text-decoration:underline;">${client.telefono}</a></td>
                    <td>${client.email || '-'}</td>
                    <td><button class="admin-action-btn view-detail-btn" data-client-id="${client.id}">VER FICHA</button></td>
                `;

                row.querySelector('.view-detail-btn').addEventListener('click', () => {
                    openClientDetailPanel(client);
                });

                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error al cargar lista de clientes:', error);
            sileo.error({title: 'Error', description: 'No se pudo cargar el directorio.'});
        }
    }

    async function openClientDetailPanel(client) {
        try {
            const panel = document.getElementById('client-detail-panel');
            
            // Rellenar datos base del contacto
            document.getElementById('client-detail-name').innerText = client.nombre;
            document.getElementById('client-detail-avatar').innerText = client.nombre.charAt(0).toUpperCase();
            document.getElementById('client-detail-phone').innerText = `Tel: ${client.telefono}`;
            document.getElementById('client-detail-email').innerText = client.email || 'Sin email registrado';

            // Cargar lesiones de forma sumamente destacada
            const injuriesContainer = document.getElementById('client-injuries-container');
            const injuriesText = document.getElementById('client-detail-injuries');

            if (client.historial_lesiones && client.historial_lesiones.trim() !== '') {
                injuriesContainer.className = 'detail-section alert-section has-injuries';
                injuriesText.innerText = client.historial_lesiones;
            } else {
                injuriesContainer.className = 'detail-section alert-section';
                injuriesText.innerText = 'No se registran lesiones ni condiciones médicas de precaución para este alumno.';
            }

            // Cargar historial de reservas pasadas y futuras
            const bookingsList = document.getElementById('client-detail-bookings');
            bookingsList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--color-text-muted);">Cargando historial de reservas...</div>';

            const { data: bookings, error } = await supabase
                .from('reservas')
                .select(`
                    id,
                    fecha,
                    estatus_pago,
                    clases (
                        hora_inicio,
                        disciplinas (nombre),
                        coaches (nombre)
                    )
                `)
                .eq('cliente_id', client.id)
                .order('fecha', { ascending: false });

            bookingsList.innerHTML = '';

            if (error) {
                bookingsList.innerHTML = '<div style="text-align:center; padding:1rem; color:#FF6B6B;">Error al cargar historial.</div>';
                return;
            }

            if (!bookings || bookings.length === 0) {
                bookingsList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--color-text-muted); font-style:italic;">No registra reservas históricas.</div>';
            } else {
                bookings.forEach(booking => {
                    const clase = booking.clases;
                    if (!clase) return;

                    const dateLabel = booking.fecha ? formatDateSpanish(booking.fecha) : 'Fecha sin asignar';
                    const timeLabel = formatTime12h(clase.hora_inicio);
                    const isPaid = booking.estatus_pago === 'Confirmado 50%';

                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <div class="history-meta">
                            <strong>${clase.disciplinas?.nombre || 'Clase'}</strong>
                            <span>${dateLabel} - ${timeLabel} • ${clase.coaches?.nombre || 'Ani'}</span>
                        </div>
                        <span class="status-badge ${isPaid ? 'confirmed' : 'pending'}">${booking.estatus_pago || 'Pendiente'}</span>
                    `;
                    bookingsList.appendChild(item);
                });
            }

            panel.style.display = 'block';

        } catch (error) {
            console.error('Error al abrir detalle del cliente:', error);
            sileo.error({title: 'Error', description: 'No se pudo abrir la ficha del cliente.'});
        }
    }

    // ==========================================================================
    // VISTA 4 — COACHES Y DISCIPLINAS (ALTAS CRUD Y GESTIÓN)
    // ==========================================================================
    async function loadCoaches() {
        try {
            const tableBody = document.getElementById('coaches-table-body');
            tableBody.innerHTML = '<tr><td colspan="4" class="table-loading">Cargando coaches...</td></tr>';

            const { data: coaches, error } = await supabase
                .from('coaches')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;

            tableBody.innerHTML = '';

            if (coaches.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="table-no-data">No hay instructores registrados.</td></tr>`;
                return;
            }

            coaches.forEach(coach => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${coach.nombre}</strong></td>
                    <td>${coach.especialidad || 'General'}</td>
                    <td>
                        <label class="switch-label">
                            <input type="checkbox" class="toggle-coach-status" data-coach-id="${coach.id}" ${coach.activo ? 'checked' : ''}>
                            <span class="switch-slider"></span>
                        </label>
                    </td>
                    <td>
                        <span style="font-size:0.75rem; color:var(--color-text-muted);">Ajuste automático</span>
                    </td>
                `;

                // Manejador del toggle de estatus activo directo a la DB
                row.querySelector('.toggle-coach-status').addEventListener('change', async (e) => {
                    const cId = e.target.getAttribute('data-coach-id');
                    const isActive = e.target.checked;

                    const { error: updateError } = await supabase
                        .from('coaches')
                        .update({ activo: isActive })
                        .eq('id', cId);

                    if (updateError) {
                        sileo.error({title: 'Error', description: 'No se pudo actualizar el estatus.'});
                        e.target.checked = !isActive; // revertir
                    } else {
                        sileo.success({
                            title: 'Estatus Guardado', 
                            description: `${coach.nombre} ha sido marcado como ${isActive ? 'Activo' : 'Inactivo'}`
                        });
                    }
                });

                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error al cargar coaches:', error);
            sileo.error({title: 'Error', description: 'No se pudo cargar la lista de coaches.'});
        }
    }

    async function loadDisciplinas() {
        try {
            const tableBody = document.getElementById('disciplinas-table-body');
            tableBody.innerHTML = '<tr><td colspan="3" class="table-loading">Cargando disciplinas de clases...</td></tr>';

            const { data: disciplines, error } = await supabase
                .from('disciplinas')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;

            tableBody.innerHTML = '';

            if (disciplines.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="3" class="table-no-data">No hay disciplinas de clase configuradas.</td></tr>`;
                return;
            }

            disciplines.forEach(disc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${disc.nombre}</strong></td>
                    <td style="font-size:0.85rem; color:var(--color-text-muted); line-height:1.4;">${disc.descripcion || 'Sin descripción'}</td>
                    <td>
                        <span style="font-size:0.75rem; color:var(--color-text-muted);">Estable</span>
                    </td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error al cargar disciplinas:', error);
            sileo.error({title: 'Error', description: 'No se pudieron descargar las disciplinas.'});
        }
    }

    // Formularios de Creación (Acciones de escritura con RLS)
    async function handleAddCoach(e) {
        e.preventDefault();
        const nombreInput = document.getElementById('input-coach-nombre');
        const espInput = document.getElementById('input-coach-especialidad');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.innerText = 'GUARDANDO...';

        try {
            const { error } = await supabase
                .from('coaches')
                .insert({
                    nombre: nombreInput.value.trim(),
                    especialidad: espInput.value.trim(),
                    activo: true
                });

            if (error) throw error;

            sileo.success({title: 'Coach Creado', description: 'El instructor ha sido agregado a la plantilla.'});
            closeModal(document.getElementById('modal-create-coach'));
            e.target.reset();
            loadCoaches();
        } catch (err) {
            sileo.error({title: 'Error', description: 'No se pudo guardar el coach: ' + err.message});
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'GUARDAR COACH';
        }
    }

    async function handleAddDisciplina(e) {
        e.preventDefault();
        const nombreInput = document.getElementById('input-disciplina-nombre');
        const descInput = document.getElementById('input-disciplina-descripcion');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.innerText = 'GUARDANDO...';

        try {
            const { error } = await supabase
                .from('disciplinas')
                .insert({
                    nombre: nombreInput.value.trim(),
                    descripcion: descInput.value.trim()
                });

            if (error) throw error;

            sileo.success({title: 'Disciplina Creada', description: 'La disciplina ha sido registrada para clases.'});
            closeModal(document.getElementById('modal-create-disciplina'));
            e.target.reset();
            loadDisciplinas();
        } catch (err) {
            sileo.error({title: 'Error', description: 'No se pudo guardar: ' + err.message});
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'GUARDAR DISCIPLINA';
        }
    }

    // ==========================================================================
    // 6. FUNCIONES AUXILIARES (FECHAS, TIEMPOS, UTILS)
    // ==========================================================================
    function getMonday(d) {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajustar si cae domingo
        return new Date(d.setDate(diff));
    }

    function getWeekDates(monday) {
        const dates = [];
        for (let i = 0; i < 6; i++) { // Lunes a Sábado
            const tempDate = new Date(monday);
            tempDate.setDate(monday.getDate() + i);
            dates.push(tempDate);
        }
        return dates;
    }

    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getDayAbbreviation(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    function getSpanishDay(day) {
        const days = {
            Mon: "Lunes",
            Tue: "Martes",
            Wed: "Miércoles",
            Thu: "Jueves",
            Fri: "Viernes",
            Sat: "Sábado",
            Sun: "Domingo"
        };
        return days[day] || day;
    }

    function formatDateSpanish(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        // usar Date.UTC para evitar desajustes horarios
        const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('es-ES', options).replace('.', '');
    }

    function formatDateShortSpanish(date) {
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    }

    function formatTime12h(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        let hour = parseInt(parts[0]);
        const min = parts[1];
        const ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        hour = hour ? hour : 12; // el número 0 se traduce como 12
        return `${hour}:${min}${ampm}`;
    }

    // ==========================================================================
    // 7. SISTEMA DE MODALES (INICIALIZADOR)
    // ==========================================================================
    function initModalCloseHandlers() {
        const modals = [
            { modalId: 'agenda-class-modal', closeId: 'btn-close-class-modal' },
            { modalId: 'modal-create-coach', closeId: 'btn-close-coach-modal', triggerId: 'btn-new-coach' },
            { modalId: 'modal-create-disciplina', closeId: 'btn-close-disciplina-modal', triggerId: 'btn-new-disciplina' }
        ];

        modals.forEach(({ modalId, closeId, triggerId }) => {
            const modal = document.getElementById(modalId);
            const closeBtn = document.getElementById(closeId);
            const backdrop = modal.querySelector('.modal-backdrop');

            const closeFn = () => closeModal(modal);

            closeBtn.addEventListener('click', closeFn);
            backdrop.addEventListener('click', closeFn);

            if (triggerId) {
                document.getElementById(triggerId).addEventListener('click', () => openModal(modal));
            }
        });
    }

    function openModal(modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Debounce para el input de búsqueda
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});
