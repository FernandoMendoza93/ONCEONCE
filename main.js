/* ==========================================================================
   JAVASCRIPT PRINCIPAL - EZENCIA STUDIO PILATES
   Funcionalidades interactivas y optimizaciones WebView iOS/Android
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. INICIALIZACIÓN DE LENIS (Smooth Scroll)
    let lenis;
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easing inercia suave
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: !isMobile, // desactivado en móvil para usar scroll nativo físico que es perfecto
            mouseMultiplier: 1,
            touchMultiplier: 0, // 0 evita interceptar eventos táctiles y congelar el scroll en móviles
            infinite: false,
        });

        // Loop de RequestAnimationFrame
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        console.log('Lenis inicializado con éxito.');
    } catch (e) {
        console.error('Error al inicializar Lenis:', e);
    }

    // 2. INTERSECTION OBSERVER NATIVO (Animaciones CSS de entrada)
    const initScrollReveal = () => {
        const revealElements = document.querySelectorAll('.scroll-reveal');
        
        const observerOptions = {
            root: null, // viewport del navegador
            rootMargin: '0px 0px -8% 0px', // se activa un poco antes de salir
            threshold: 0.1 // 10% del elemento visible
        };

        const revealCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Una vez revelado, dejamos de observarlo para ahorrar recursos de GPU/CPU
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(revealCallback, observerOptions);
        
        revealElements.forEach(el => {
            observer.observe(el);
        });
    };

    initScrollReveal();

    // 3. CONTROL DE HEADER AL HACER SCROLL
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 4. CONTROL DEL MENÚ LATERAL (BURGER)
    const menuOverlay = document.getElementById('menu-overlay');
    const btnMenu = document.getElementById('btn-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const menuLinks = document.querySelectorAll('.menu-link-item');

    const openMenu = () => {
        menuOverlay.classList.add('active');
        if (lenis) lenis.stop(); // Detiene scroll de fondo
    };

    const closeMenu = () => {
        menuOverlay.classList.remove('active');
        if (lenis) lenis.start(); // Reanuda scroll
    };

    btnMenu.addEventListener('click', openMenu);
    btnCloseMenu.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) closeMenu();
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
            // Desplazamiento manual elegante con Lenis si es enlace interno
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetEl = document.querySelector(targetId);
                if (targetEl && lenis) {
                    setTimeout(() => {
                        lenis.scrollTo(targetEl, { offset: -80 });
                    }, 350); // espera a que cierre el menú para fluidez
                }
            }
        });
    });

    // 0. CONFIGURACIÓN E INICIALIZACIÓN DE SUPABASE
    const SUPABASE_URL = 'https://wxwtacfuabpjloreiiws.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4d3RhY2Z1YWJwamxvcmVpaXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjA2MzUsImV4cCI6MjA5NzM5NjYzNX0.iZw0Fsk95g5g8hQf2JjP6h3hFoGpJD7rveZUFhzUsbY';
    
    let supabase = null;
    try {
        if (SUPABASE_URL !== 'TU_PROJECT_URL_AQUI' && SUPABASE_ANON_KEY !== 'TU_ANON_KEY_AQUI') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Cliente de Supabase inicializado correctamente.');
        } else {
            console.warn('Supabase no inicializado: URL y llave anónima no especificadas.');
        }
    } catch (e) {
        console.error('Error al inicializar cliente de Supabase:', e);
    }

    // 5. SISTEMA DE MODALES (Booking y Merch)
    const bookingModal = document.getElementById('booking-modal');
    const merchModal = document.getElementById('merch-modal');
    
    const btnQuickBook = document.getElementById('btn-quick-book');
    const btnHeroCta = document.getElementById('btn-hero-cta');
    const btnCloseBooking = document.getElementById('btn-close-booking');
    const btnCloseMerch = document.getElementById('btn-close-merch');
    
    const packageButtons = document.querySelectorAll('.package-btn');
    const openBookingButtons = document.querySelectorAll('.open-booking-btn');
    const merchCards = document.querySelectorAll('.merch-card');

    // Auth Modal DOM Elements
    const authModal = document.getElementById('auth-modal');
    const btnCloseAuth = document.getElementById('btn-close-auth');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const authModalTitle = document.getElementById('auth-modal-title');
    const linkShowRegister = document.getElementById('link-show-register');
    const linkShowLogin = document.getElementById('link-show-login');
    const btnProfile = document.getElementById('btn-profile');

    // Account Modal DOM Elements
    const accountModal = document.getElementById('account-modal');
    const btnCloseAccount = document.getElementById('btn-close-account');
    const btnLogout = document.getElementById('btn-logout');
    const panelClient = document.getElementById('panel-client');
    const adminLinkContainer = document.getElementById('admin-link-container');
    
    const userPhoneSpan = document.getElementById('user-phone');
    const userInjuriesSpan = document.getElementById('user-injuries');
    const accountModalTitle = document.getElementById('account-modal-title');
    const clientBookingsList = document.getElementById('client-bookings-list');

    // Datos estáticos de merchandising para inyectar en el modal
    const merchProductsData = {
        sudadera: {
            title: 'SUDADERA OFICIAL',
            price: '$980',
            desc: 'Algodón peinado orgánico de 400g con un corte oversize refinado. Logotipo de Ezencia sutilmente bordado en hilo de oro. Diseñada para mantener la temperatura óptima pre y post entrenamiento.',
            img: 'https://res.cloudinary.com/demo/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1620799140408-edc6dcb6d633'
        },
        calcetas: {
            title: 'MEDIAS ANTIDESLIZANTES',
            price: '$280',
            desc: 'Construcción en algodón elástico transpirable. Grip inferior de silicona orgánica ultra-adherente distribuido ergonómicamente para garantizar estabilidad total en la barra y el carro del reformer.',
            img: 'https://res.cloudinary.com/demo/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1588117261148-ac7338ef50b5'
        }
    };

    // Funciones genéricas de modales
    const openModal = (modalEl) => {
        modalEl.classList.add('active');
        if (lenis) lenis.stop(); // Pausa scroll de fondo para optimizar WebView
        modalEl.setAttribute('aria-hidden', 'false');
        
        if (modalEl === bookingModal) {
            renderSessions();
        }
    };

    const closeModal = (modalEl) => {
        modalEl.classList.remove('active');
        if (lenis) lenis.start(); // Reanuda scroll
        modalEl.setAttribute('aria-hidden', 'true');
    };

    // Listeners del Calendario de Reservas
    btnQuickBook.addEventListener('click', () => openModal(bookingModal));
    btnHeroCta.addEventListener('click', () => openModal(bookingModal));
    btnCloseBooking.addEventListener('click', () => closeModal(bookingModal));
    bookingModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(bookingModal));

    // Selector de pestañas de paquetes
    const tabButtons = document.querySelectorAll('.packages-tabs .tab-btn');
    const tabGrids = document.querySelectorAll('.packages-grid');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetTab = btn.getAttribute('data-tab');
            tabGrids.forEach(grid => {
                if (grid.getAttribute('data-tab-content') === targetTab) {
                    grid.classList.remove('hidden');
                } else {
                    grid.classList.add('hidden');
                }
            });
        });
    });

    // Enlace de compra directa de paquete vía WhatsApp
    const sendWhatsAppMessage = (text) => {
        const phone = "529513506047";
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    packageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-package-category');
            const name = btn.getAttribute('data-package-name');
            const price = btn.getAttribute('data-package-price');
            const text = `¡Hola! Me gustaría adquirir el paquete de ${category}: "${name}" por $${price}. ¿Cómo puedo realizar el pago?`;
            sendWhatsAppMessage(text);
        });
    });

    // Botones de las disciplinas que abren la agenda
    openBookingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            openModal(bookingModal);
        });
    });

    // Listeners de Merch
    btnCloseMerch.addEventListener('click', () => closeModal(merchModal));
    merchModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(merchModal));

    merchCards.forEach(card => {
        const buyBtn = card.querySelector('.buy-cta-btn');
        const prodKey = card.getAttribute('data-product');

        // Abrir modal al pulsar en cualquier lado de la tarjeta o botón comprar
        const handleMerchClick = (e) => {
            const data = merchProductsData[prodKey];
            if (data) {
                // Inyectar datos en modal
                document.getElementById('merch-modal-title').innerText = data.title;
                document.getElementById('merch-modal-price').innerText = data.price;
                document.getElementById('merch-modal-desc').innerText = data.desc;
                document.getElementById('merch-modal-img').src = data.img;
                document.getElementById('merch-modal-img').alt = data.title;
                
                openModal(merchModal);
            }
        };

        card.addEventListener('click', (e) => {
            // Evita que se dispare doble si clica directamente el botón
            if(e.target !== buyBtn) {
                handleMerchClick();
            }
        });
        
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMerchClick();
        });
    });

    // Selector de Tallas (Merch Modal)
    const tallaButtons = document.querySelectorAll('.talla-btn');
    tallaButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tallaButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Selector de días de la semana (Calendario Booking)
    const dayButtons = document.querySelectorAll('.week-day-btn');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dayButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Recarga agenda con efecto visual
            const list = document.querySelector('.sessions-list');
            list.style.opacity = '0.3';
            list.style.transform = 'translate3d(0, 5px, 0)';
            
            setTimeout(() => {
                renderSessions();
                list.style.opacity = '1';
                list.style.transform = 'translate3d(0, 0, 0)';
            }, 300);
        });
    });

    // Alternar formularios Auth Modal
    linkShowRegister.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        authModalTitle.innerText = 'CREAR CUENTA';
    });

    linkShowLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
        authModalTitle.innerText = 'INICIAR SESIÓN';
    });

    // Cerrar modals Auth y Account
    btnCloseAuth.addEventListener('click', () => closeModal(authModal));
    authModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(authModal));
    btnCloseAccount.addEventListener('click', () => closeModal(accountModal));
    accountModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(accountModal));

    // Registro e Inicio de sesión
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!supabase) {
            alert('Supabase no está configurado.');
            return;
        }

        const submitBtn = formLogin.querySelector('.auth-submit-btn');
        submitBtn.innerText = 'INGRESANDO...';
        submitBtn.disabled = true;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        submitBtn.innerText = 'INGRESAR';
        submitBtn.disabled = false;

        if (error) {
            alert('Error al iniciar sesión: ' + error.message);
        } else {
            closeModal(authModal);
            sileo.success({title: 'Sesión Iniciada', description: 'Bienvenido de vuelta a Once:Once.'});
            formLogin.reset();
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-name').value;
        const telefono = document.getElementById('reg-phone').value;
        const lesiones = document.getElementById('reg-injuries').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        if (!supabase) {
            alert('Supabase no está configurado.');
            return;
        }

        const submitBtn = formRegister.querySelector('.auth-submit-btn');
        submitBtn.innerText = 'CREANDO CUENTA...';
        submitBtn.disabled = true;

        // Pasamos los datos adicionales en el metadata del usuario para que el Trigger de base de datos
        // pueda procesar el perfil automáticamente sin importar si la confirmación de email está activa.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre,
                    telefono,
                    historial_lesiones: lesiones,
                    rol: 'cliente'
                }
            }
        });

        if (error) {
            submitBtn.innerText = 'CREAR CUENTA';
            submitBtn.disabled = false;
            alert('Error al registrar usuario: ' + error.message);
            return;
        }

        if (data.user) {
            // Inserción manual de respaldo por si no se configuró el trigger de base de datos
            const { error: profileError } = await supabase
                .from('clientes')
                .insert([
                    { id: data.user.id, nombre, telefono, email, historial_lesiones: lesiones, rol: 'cliente' }
                ]);

            submitBtn.innerText = 'CREAR CUENTA';
            submitBtn.disabled = false;

            if (profileError) {
                // Código de error 23505 es clave duplicada (indica que el trigger ya insertó el perfil exitosamente)
                if (profileError.code === '23505') {
                    closeModal(authModal);
                    sileo.success({title: 'Registro Exitoso', description: 'Tu cuenta ha sido creada. ¡Bienvenido!'});
                    formRegister.reset();
                } else {
                    alert('Cuenta creada pero hubo un error al guardar tu perfil: ' + profileError.message);
                }
            } else {
                closeModal(authModal);
                sileo.success({title: 'Registro Exitoso', description: 'Tu cuenta ha sido creada. ¡Bienvenido!'});
                formRegister.reset();
            }
        }
    });

    btnLogout.addEventListener('click', async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error al cerrar sesión: ' + error.message);
        } else {
            closeModal(accountModal);
            sileo.success({title: 'Sesión Cerrada', description: 'Has cerrado sesión correctamente.'});
        }
    });

    // Control de clic en el botón Perfil
    btnProfile.addEventListener('click', () => {
        if (currentUser) {
            openModal(accountModal);
            loadAccountDashboard();
        } else {
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            authModalTitle.innerText = 'INICIAR SESIÓN';
            openModal(authModal);
        }
    });

    // Datos de Sesión Dinámicos
    let currentUser = null;
    let currentUserProfile = null;
    let dbClassesList = [];

    const fetchClassesFromDb = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
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
                
            if (!error && data) {
                dbClassesList = data;
                console.log(`Cargadas ${data.length} clases desde Supabase.`);
                if (bookingModal.classList.contains('active')) {
                    renderSessions();
                }
            } else if (error) {
                console.error("Error al obtener clases de la BD:", error);
            }
        } catch (e) {
            console.error("Error al obtener clases:", e);
        }
    };

    const loadAccountDashboard = async () => {
        if (!currentUser) return;

        // Si el perfil aún no está cargado o falló previamente, intentamos recuperarlo en vivo
        if (!currentUserProfile) {
            const { data: profile, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', currentUser.id)
                .single();
                
            if (error || !profile) {
                console.error("No se pudo cargar el perfil del usuario:", error);
                accountModalTitle.innerText = 'SESIÓN CADUCADA';
                clientBookingsList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem;"><p style="margin-bottom:1rem;color:#ff6b6b;font-size:0.9rem;">Tu sesión ha expirado por seguridad.</p><button id="btn-re-login" class="buy-cta-btn" style="width:100%;max-width:200px;margin:0 auto;">INICIAR SESIÓN</button></td></tr>';
                document.getElementById('btn-re-login').addEventListener('click', () => {
                    closeModal(accountModal);
                    formRegister.classList.add('hidden');
                    formLogin.classList.remove('hidden');
                    authModalTitle.innerText = 'INICIAR SESIÓN';
                    openModal(authModal);
                });
                return;
            }
            currentUserProfile = profile;
            btnProfile.classList.add('logged-in');
        }

        accountModalTitle.innerText = `HOLA, ${currentUserProfile.nombre.toUpperCase()}`;
        
        // Renderizar el panel cliente por defecto
        panelClient.classList.remove('hidden');
        document.getElementById('account-modal-tag').innerText = 'MI CUENTA';
        userPhoneSpan.innerText = currentUserProfile.telefono || '-';
        userInjuriesSpan.innerText = currentUserProfile.historial_lesiones || 'Ninguna';
        await loadClientBookings();

        // Si es admin, inyectar el link al dashboard operativo de forma condicional y segura en el DOM
        adminLinkContainer.innerHTML = '';
        if (currentUserProfile.rol === 'admin') {
            const adminBtn = document.createElement('a');
            adminBtn.href = 'admin/index.html';
            adminBtn.className = 'admin-dashboard-btn';
            adminBtn.innerText = 'IR AL DASHBOARD ADMIN';
            adminLinkContainer.appendChild(adminBtn);
        }
    };

    const loadClientBookings = async () => {
        const isAdmin = currentUserProfile && currentUserProfile.rol === 'admin';
        clientBookingsList.innerHTML = `<tr><td colspan="3" class="table-loading">${isAdmin ? 'Cargando agenda global del estudio...' : 'Cargando tus reservas...'}</td></tr>`;
        
        let query = supabase
            .from('reservas')
            .select(`
                id,
                estatus_pago,
                fecha,
                clientes (nombre, telefono),
                clases (
                    dia_semana,
                    hora_inicio,
                    disciplinas (nombre),
                    coaches (nombre)
                )
            `)
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('cliente_id', currentUser.id);
        } else {
            query = query.limit(100);
        }
        
        const { data: bookings, error } = await query;
            
        clientBookingsList.innerHTML = '';
        
        if (error) {
            clientBookingsList.innerHTML = `<tr><td colspan="3" class="table-loading">Error al cargar reservas.</td></tr>`;
            return;
        }
        
        if (!bookings || bookings.length === 0) {
            clientBookingsList.innerHTML = `<tr><td colspan="3" class="no-bookings-msg">${isAdmin ? 'No hay reservas registradas en el sistema todavía.' : 'No tienes reservas activas.'}</td></tr>`;
            return;
        }
        
        bookings.forEach(booking => {
            const clase = booking.clases;
            if (!clase) return;
            
            const className = clase.disciplinas?.nombre || 'Clase';
            const coachName = clase.coaches?.nombre || 'Ani';
            const clientName = booking.clientes?.nombre || 'Usuario';
            const clientPhone = booking.clientes?.telefono || '';
            const formattedTime = formatTime12h(clase.hora_inicio);
            const dateLabel = booking.fecha ? formatDateSpanish(booking.fecha) : getSpanishDay(clase.dia_semana);
            
            const isPaid = booking.estatus_pago === 'Confirmado 50%';
            const statusClass = isPaid ? 'confirmed' : 'pending';
            const statusLabel = booking.estatus_pago || 'Pendiente';
            
            const row = document.createElement('tr');
            
            if (isAdmin) {
                row.innerHTML = `
                    <td><strong>${className}</strong><br><small>${dateLabel} - ${formattedTime}</small></td>
                    <td><strong>${clientName}</strong><br><small><a href="https://wa.me/52${clientPhone}" target="_blank" style="color:var(--color-gold);text-decoration:underline;">${clientPhone}</a></small></td>
                    <td style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
                        <span class="status-badge ${statusClass}" style="margin-bottom:0.25rem;">${statusLabel}</span>
                        <button class="action-btn-agendar btn-authorize-booking" data-id="${booking.id}" data-paid="${isPaid}" style="font-size:0.7rem; padding: 0.4rem 0.6rem; min-width:auto; height:auto; letter-spacing:1px;">
                            ${isPaid ? 'CANCELAR PAGO' : 'AUTORIZAR PAGO'}
                        </button>
                    </td>
                `;
            } else {
                row.innerHTML = `
                    <td><strong>${className}</strong><br><small>${dateLabel} - ${formattedTime}</small></td>
                    <td>${coachName}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                `;
            }
            clientBookingsList.appendChild(row);
        });

        if (isAdmin) {
            const authorizeBtns = clientBookingsList.querySelectorAll('.btn-authorize-booking');
            authorizeBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const bookingId = e.target.getAttribute('data-id');
                    const isPaid = e.target.getAttribute('data-paid') === 'true';
                    const newStatus = isPaid ? 'Pendiente' : 'Confirmado 50%';
                    
                    e.target.innerText = 'PROCESANDO...';
                    e.target.disabled = true;
                    e.target.style.opacity = '0.5';

                    const { error: updateError } = await supabase
                        .from('reservas')
                        .update({ estatus_pago: newStatus })
                        .eq('id', bookingId);
                        
                    if (updateError) {
                        alert('Error al actualizar estatus: ' + updateError.message);
                        e.target.innerText = 'ERROR';
                        return;
                    }
                    
                    loadClientBookings();
                });
            });
        }
    };


    // 6. NOTIFICACIONES TOAST (Sileo)
    sileo.init({
        position: 'top-center',
        options: {
            duration: 4000
        }
    });

    // Renderizado dinámico de la agenda
    const renderSessions = () => {
        const activeTabEl = document.querySelector('.booking-tab-btn.active');
        const activeDayEl = document.querySelector('.week-day-btn.active');
        const listContainer = document.querySelector('.sessions-list');
        
        if (!activeTabEl || !activeDayEl || !listContainer) return;
        
        const activeTab = activeTabEl.getAttribute('data-booking-tab');
        const activeDay = activeDayEl.getAttribute('data-day');
        
        listContainer.innerHTML = '';

        if (dbClassesList.length > 0) {
            const isReformerTab = activeTab === 'reformer';
            const filtered = dbClassesList.filter(c => {
                const isReformerClass = c.disciplinas?.nombre?.toLowerCase().includes('reformer');
                return c.dia_semana === activeDay && (isReformerTab ? isReformerClass : !isReformerClass);
            });
            
            filtered.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            
            if (filtered.length === 0) {
                listContainer.innerHTML = '<p class="no-sessions">No hay clases programadas para este día.</p>';
                return;
            }
            
            filtered.forEach(clase => {
                const formatTimeParts = (time24) => {
                    if (!time24) return { time: '', ampm: '' };
                    const parts = time24.split(':');
                    let hours = parseInt(parts[0]);
                    const minutes = parts[1];
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    const hourStr = hours < 10 ? '0' + hours : hours;
                    return { time: `${hourStr}:${minutes}`, ampm };
                };

                const start = formatTimeParts(clase.hora_inicio);
                const end = clase.hora_fin ? formatTimeParts(clase.hora_fin) : null;

                const hoursDisplay = end ? `${start.time} - ${end.time}` : start.time;
                const ampmDisplay = end && start.ampm !== end.ampm ? `${start.ampm} - ${end.ampm}` : start.ampm;
                
                const className = clase.disciplinas?.nombre || 'Clase';
                const coachName = clase.coaches?.nombre || 'Coach';
                
                const slot = document.createElement('div');
                slot.className = 'session-slot glass-panel';
                slot.setAttribute('data-class-id', clase.id);
                slot.innerHTML = `
                    <div class="slot-time" style="min-width: 120px; align-items: center; justify-content: center;">
                        <span class="time-hour">${hoursDisplay}</span>
                        <span class="time-ampm">${ampmDisplay}</span>
                    </div>
                    <div class="slot-info">
                        <h4 class="class-name">${className}</h4>
                        <p class="instructor-name" style="display: none;">Coach: ${coachName}</p>
                        <span class="availability-badge available">Cupo: 0 / ${clase.capacidad_maxima || 5}</span>
                    </div>
                    <div class="slot-action">
                        <button class="action-btn-agendar">AGENDAR</button>
                    </div>
                `;
                
                slot.querySelector('.action-btn-agendar').addEventListener('click', async (e) => {
                    const btn = e.target;
                    
                    if (!currentUser) {
                        closeModal(bookingModal);
                        formRegister.classList.add('hidden');
                        formLogin.classList.remove('hidden');
                        authModalTitle.innerText = 'INICIAR SESIÓN';
                        openModal(authModal);
                        return;
                    }
                    
                    btn.innerText = 'PROCESANDO...';
                    btn.style.opacity = '0.7';
                    btn.disabled = true;
                    
                    const activeDayBtn = document.querySelector('.week-day-btn.active');
                    const bookingDate = activeDayBtn ? activeDayBtn.getAttribute('data-date') : new Date().toISOString().split('T')[0];
                    const formattedDate = formatDateSpanish(bookingDate);
                    
                    const timeString = `${hoursDisplay} ${ampmDisplay}`;
                    const claseInfo = `${className} - ${formattedDate} ${timeString}`;
                    
                    const { data: resData, error: resError } = await supabase
                        .rpc('agendar_clase_atomic', {
                            p_clase_id: clase.id,
                            p_fecha: bookingDate
                        });
                        
                    if (resError) {
                        console.error("Error al guardar reserva:", resError);
                        btn.innerText = 'AGENDAR';
                        btn.style.opacity = '1';
                        btn.disabled = false;
                        
                        if (resError.message.includes('CUPO_LLENO')) {
                            sileo.error({title: "CUPO AGOTADO", description: "Lo sentimos, el último lugar para esta clase acaba de ser reservado. Por favor, selecciona otro horario."});
                        } else if (resError.message.includes('RESERVA_DUPLICADA')) {
                            sileo.warning({title: "RESERVA ACTIVA", description: "Ya cuentas con una reserva para esta clase. Te esperamos en el estudio."});
                        } else if (resError.message.includes('SESION_EXPIRADA')) {
                            closeModal(bookingModal);
                            sileo.error({title: "SESIÓN CADUCADA", description: "Tu sesión ha caducado. Ingresa nuevamente para reservar."});
                            formRegister.classList.add('hidden');
                            formLogin.classList.remove('hidden');
                            authModalTitle.innerText = 'INICIAR SESIÓN';
                            openModal(authModal);
                        } else if (resError.message.includes('CLASE_NO_ENCONTRADA')) {
                            sileo.error({title: "HORARIO NO DISPONIBLE", description: "Esta clase ya no se encuentra activa en el horario. Por favor refresca la página."});
                        } else {
                            alert("Hubo un problema procesando tu reserva: " + resError.message);
                        }
                        return;
                    }
                    
                    const WA_NUMBER = '529516410766';
                    const message = `Hola Once:Once. Me interesa la clase de ${claseInfo} con ${coachName}. Para asegurar mi lugar, ¿podrían proporcionarme la cuenta para transferir el 50% de anticipo? 🤍`;
                    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
                    
                    setTimeout(() => {
                        window.open(waUrl, '_blank');
                        closeModal(bookingModal);
                        
                        btn.innerText = 'AGENDAR';
                        btn.style.opacity = '1';
                        btn.disabled = false;
                    }, 800);
                });
                
                listContainer.appendChild(slot);
            });

            // Consultar dinámicamente las reservas de hoy para calcular cupos
            if (supabase) {
                const bookingDate = activeDayEl.getAttribute('data-date') || new Date().toISOString().split('T')[0];
                supabase
                    .from('reservas')
                    .select('clase_id')
                    .eq('fecha', bookingDate)
                    .then(({ data: reservations, error }) => {
                        if (!error && reservations) {
                            const counts = {};
                            reservations.forEach(r => {
                                counts[r.clase_id] = (counts[r.clase_id] || 0) + 1;
                            });
                            
                            filtered.forEach(clase => {
                                const count = counts[clase.id] || 0;
                                const maxCap = clase.capacidad_maxima || 5;
                                const slotEl = listContainer.querySelector(`[data-class-id="${clase.id}"]`);
                                if (slotEl) {
                                    const badge = slotEl.querySelector('.availability-badge');
                                    const btn = slotEl.querySelector('.action-btn-agendar');
                                    
                                    if (badge) {
                                        if (count >= maxCap) {
                                            badge.className = 'availability-badge full';
                                            badge.innerText = `Clase Llena (${count}/${maxCap})`;
                                            if (btn) {
                                                btn.className = 'action-btn-agendar disabled';
                                                btn.innerText = 'LLENO';
                                                btn.disabled = true;
                                            }
                                        } else if (maxCap - count <= 2) {
                                            badge.className = 'availability-badge warning';
                                            badge.innerText = `Últimos ${maxCap - count} lugares (${count}/${maxCap})`;
                                            if (btn) {
                                                btn.className = 'action-btn-agendar';
                                                btn.innerText = 'AGENDAR';
                                                btn.disabled = false;
                                            }
                                        } else {
                                            badge.className = 'availability-badge available';
                                            badge.innerText = `Cupo: ${count} / ${maxCap}`;
                                            if (btn) {
                                                btn.className = 'action-btn-agendar';
                                                btn.innerText = 'AGENDAR';
                                                btn.disabled = false;
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
            }
            
            return;
        }
    };

    const formatDateSpanish = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        let formatted = date.toLocaleDateString('es-MX', options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const initializeCalendar = () => {
        const dayButtons = document.querySelectorAll('.week-day-btn');
        if (dayButtons.length === 0) return;

        const today = new Date();
        const currentDay = today.getDay(); // 0: Dom, 1: Lun, ...
        
        // Si hoy es domingo (0), cargamos la semana que viene. Si no, cargamos la semana actual.
        const mondayOffset = currentDay === 0 ? 1 : 1 - currentDay;
        const baseDate = new Date(today);
        baseDate.setDate(today.getDate() + mondayOffset);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        dayButtons.forEach((btn) => {
            const dayCode = btn.getAttribute('data-day');
            const dayIdx = days.indexOf(dayCode);
            if (dayIdx !== -1) {
                const targetDate = new Date(baseDate);
                targetDate.setDate(baseDate.getDate() + dayIdx);
                
                const year = targetDate.getFullYear();
                const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                const dateNum = String(targetDate.getDate()).padStart(2, '0');
                const fullDateStr = `${year}-${month}-${dateNum}`;
                
                btn.setAttribute('data-date', fullDateStr);
                
                const numEl = btn.querySelector('.day-num');
                if (numEl) {
                    numEl.innerText = dateNum;
                }
            }
        });
    };

    const formatTime12h = (time24) => {
        const parts = time24.split(':');
        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hourStr = hours < 10 ? '0' + hours : hours;
        return `${hourStr}:${minutes} ${ampm}`;
    };

    const getSpanishDay = (day) => {
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
    };

    // Listeners de pestañas del booking modal
    const bookingTabButtons = document.querySelectorAll('.booking-tab-btn');
    bookingTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bookingTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Recarga agenda con efecto visual
            const list = document.querySelector('.sessions-list');
            list.style.opacity = '0.3';
            list.style.transform = 'translate3d(0, 5px, 0)';
            
            setTimeout(() => {
                renderSessions();
                list.style.opacity = '1';
                list.style.transform = 'translate3d(0, 0, 0)';
            }, 300);
        });
    });

    const btnCheckoutSubmit = document.getElementById('btn-checkout-submit');
    btnCheckoutSubmit.addEventListener('click', () => {
        const prodTitle = document.getElementById('merch-modal-title').innerText;
        const price = document.getElementById('merch-modal-price').innerText;
        const activeTalla = document.querySelector('.talla-btn.active')?.innerText || 'S';
        
        const text = `¡Hola! Me interesa adquirir el producto: "${prodTitle}" en talla ${activeTalla} (Precio: ${price}). ¿Tienen disponibilidad en stock?`;
        
        btnCheckoutSubmit.innerText = 'PROCESANDO...';
        btnCheckoutSubmit.style.opacity = '0.7';
        btnCheckoutSubmit.disabled = true;
        
        setTimeout(() => {
            sendWhatsAppMessage(text);
            closeModal(merchModal);
            
            // Restablecer botón
            btnCheckoutSubmit.innerText = 'COMPLETAR ADQUISICIÓN';
            btnCheckoutSubmit.style.opacity = '1';
            btnCheckoutSubmit.disabled = false;
        }, 800);
    });

    // 7. GESTOS TÁCTILES CARRUSEL DE MERCH (Swipe / Drag)
    const carousel = document.getElementById('merch-carousel');
    const indicators = document.querySelectorAll('.indicator');
    
    let isDown = false;
    let startX;
    let scrollLeft;

    if (carousel) {
        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.classList.add('dragging');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.classList.remove('dragging');
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 1.5; // velocidad
            carousel.scrollLeft = scrollLeft - walk;
        });

        // Sincronización de indicadores en scroll
        carousel.addEventListener('scroll', () => {
            const width = carousel.clientWidth;
            const scrollPos = carousel.scrollLeft;
            const index = Math.round(scrollPos / width);
            
            indicators.forEach((ind, i) => {
                if (i === index) {
                    ind.classList.add('active');
                } else {
                    ind.classList.remove('active');
                }
            });
        });

        // Click en indicadores
        indicators.forEach((ind, index) => {
            ind.addEventListener('click', () => {
                const width = carousel.clientWidth;
                carousel.scrollTo({
                    left: width * index,
                    behavior: 'smooth'
                });
            });
        });
    }

    // 8. SOPORTE DE FEEDBACK TÁCTIL RÁPIDO PARA BOTONES (GPU Active effect)
    const allInteractive = document.querySelectorAll('button, .social-icon-btn, .nav-icon-btn');
    allInteractive.forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.96)';
        }, { passive: true });
        
        btn.addEventListener('touchend', () => {
            btn.style.transform = '';
        }, { passive: true });
    });

    // 9. INICIALIZACIÓN DE DATOS Y SESIÓN DE SUPABASE
    if (supabase) {
        // Inicializar las fechas del calendario dinámicamente
        initializeCalendar();
        
        // Cargar clases desde la base de datos
        fetchClassesFromDb();

        // Escuchar cambios de estado de autenticación de forma reactiva
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state changed:", event, session);
            currentUser = session?.user || null;
            
            if (currentUser) {
                btnProfile.classList.add('logged-in');
            } else {
                currentUserProfile = null;
                btnProfile.classList.remove('logged-in');
                
                // Vaciar contenedor del link admin al cerrar sesión
                if (adminLinkContainer) {
                    adminLinkContainer.innerHTML = '';
                }
                
                // Si el modal de cuenta estaba abierto en esta pestaña, lo cerramos
                if (accountModal.classList.contains('active')) {
                    closeModal(accountModal);
                }
            }
        });

        // 7. CONTROL DE VISIBILIDAD DE CONTRASEÑAS (OJO)
        const passwordToggles = document.querySelectorAll('.toggle-password-btn');
        passwordToggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar submit accidental
                const wrapper = btn.closest('.password-wrapper');
                if (!wrapper) return;
                const input = wrapper.querySelector('input');
                const eyeOpen = btn.querySelector('.eye-open');
                const eyeClosed = btn.querySelector('.eye-closed');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                } else {
                    input.type = 'password';
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                }
            });
        });
    }

    // ==========================================================================
    // 8. MOTOR DE FONDO: IMAGEN PARALLAX
    // ==========================================================================
    const mainBg = document.querySelector('.main-background');
    if (mainBg) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    mainBg.style.backgroundPosition = `center calc(50% + ${Math.sin(scrollY * 0.002) * 15}vh)`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

});
