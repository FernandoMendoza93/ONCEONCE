/* ==========================================================================
   JAVASCRIPT PRINCIPAL - EZENCIA STUDIO PILATES
   Funcionalidades interactivas y optimizaciones WebView iOS/Android
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. INICIALIZACIÓN DE LENIS (Smooth Scroll)
    let lenis = null;
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (!isMobile) {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easing inercia suave
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                touchMultiplier: 0,
                infinite: false,
            });

            // Loop de RequestAnimationFrame
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
            
            console.log('Lenis inicializado con éxito (Desktop).');
        } else {
            console.log('Móvil detectado. Lenis desactivado y scroll nativo activo.');
        }
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

    // Timer de auto-refresco para el modal de agenda (cada 60s)
    let bookingRefreshInterval = null;

    // Funciones genéricas de modales
    const openModal = (modalEl) => {
        modalEl.classList.add('active');
        if (lenis) lenis.stop();
        modalEl.setAttribute('aria-hidden', 'false');

        if (modalEl === bookingModal) {
            renderSessions();
            // Iniciar refresco automático: cada 60s recalcula horas pasadas
            if (!bookingRefreshInterval) {
                bookingRefreshInterval = setInterval(() => {
                    if (bookingModal.classList.contains('active')) {
                        renderSessions();
                    }
                }, 60000); // 60 segundos
            }
        }
    };

    const closeModal = (modalEl) => {
        modalEl.classList.remove('active');
        if (lenis) lenis.start();
        modalEl.setAttribute('aria-hidden', 'true');

        // Cancelar el timer de refresco al cerrar el modal de agenda
        if (modalEl === bookingModal && bookingRefreshInterval) {
            clearInterval(bookingRefreshInterval);
            bookingRefreshInterval = null;
        }
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
        window.location.href = url;
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
            const msg = error.message.toLowerCase();
            if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
                sileo.error({ title: 'Credenciales incorrectas', description: 'El correo o la contraseña no son válidos. Verifica tus datos e intenta de nuevo.' });
            } else if (msg.includes('email not confirmed')) {
                sileo.warning({ title: 'Confirma tu correo', description: 'Revisa tu bandeja de entrada y confirma tu email antes de iniciar sesión.' });
            } else if (msg.includes('too many requests')) {
                sileo.error({ title: 'Demasiados intentos', description: 'Por seguridad, espera unos minutos antes de intentarlo de nuevo.' });
            } else {
                sileo.error({ title: 'Error al iniciar sesión', description: error.message });
            }
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
            
            const isAlreadyRegistered = 
                error.message.toLowerCase().includes('already registered') ||
                error.message.toLowerCase().includes('already been registered') ||
                error.message.toLowerCase().includes('user already') ||
                error.code === 'user_already_exists';

            if (isAlreadyRegistered) {
                // Redirigir elegantemente al login en lugar de mostrar el error técnico
                formRegister.classList.add('hidden');
                formLogin.classList.remove('hidden');
                authModalTitle.innerText = 'INICIAR SESIÓN';
                // Pre-rellenar el email en el login para agilizar el proceso
                const loginEmailInput = formLogin.querySelector('input[type="email"]');
                if (loginEmailInput) loginEmailInput.value = email;
                sileo.info({
                    title: '¡Ya tienes una cuenta! 🤍',
                    description: 'Este correo ya está registrado. Te redirigimos para que inicies sesión.'
                });
            } else {
                sileo.error({
                    title: 'Error al crear cuenta',
                    description: error.message
                });
            }
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

        // Renderizar el panel cliente por defecto
        panelClient.classList.remove('hidden');
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

    const loadClientBookings = async (selectedDate = null) => {
        const isAdmin = currentUserProfile && currentUserProfile.rol === 'admin';
        
        // --- 1. Obtener fecha del servidor ---
        let todayStr;
        try {
            const { data: latest, error: dateError } = await supabase
                .from('reservas')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (latest && latest.length > 0) {
                todayStr = new Date(latest[0].created_at).toISOString().split('T')[0];
            } else {
                todayStr = new Date().toISOString().split('T')[0];
            }
        } catch (e) {
            todayStr = new Date().toISOString().split('T')[0];
        }

        // Fecha a filtrar (si no se seleccionó, usa hoy)
        // Check if selectedDate is an event object (from a caller that passed `e`)
        if (selectedDate && typeof selectedDate !== 'string') selectedDate = null;
        const filterDate = selectedDate || todayStr;

        // --- 2. Configurar UI según rol ---
        const accountModalTag = document.getElementById('account-modal-tag');
        const summarySection = document.querySelector('.user-profile-summary');
        const sectionTitle = document.getElementById('admin-agenda-title');
        const theadTr = document.querySelector('.account-table thead tr');

        if (isAdmin) {
            // --- VISTA ADMIN ---
            accountModalTag.innerText = 'ADMINISTRACIÓN';
            accountModalTitle.innerText = 'PANEL DE CONTROL';
            if (summarySection) summarySection.style.display = 'none';
            
            // --- TÍTULO DINÁMICO ---
            const today = new Date(todayStr);
            const selected = new Date(filterDate);
            // Fix timezone issue for difference calculation
            today.setUTCHours(12,0,0,0);
            selected.setUTCHours(12,0,0,0);
            
            let titleText = 'AGENDA';
            if (filterDate === todayStr) {
                titleText = 'AGENDA - HOY';
            } else {
                const diffDays = Math.round((selected - today) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) titleText = 'AGENDA - MAÑANA';
                else if (diffDays === -1) titleText = 'AGENDA - AYER';
                else titleText = `AGENDA - ${formatDateSpanish(filterDate).toUpperCase()}`;
            }
            
            if (sectionTitle) sectionTitle.innerText = titleText;

            // --- SELECTOR DE FECHA ---
            const filterContainer = document.getElementById('admin-date-filter-container');
            if (filterContainer) {
                if (!document.getElementById('admin-date-picker')) {
                    filterContainer.innerHTML = `
                        <input type="date" id="admin-date-picker" class="admin-date-input" value="${filterDate}">
                    `;
                    document.getElementById('admin-date-picker').addEventListener('change', (e) => {
                        loadClientBookings(e.target.value);
                    });
                } else {
                    document.getElementById('admin-date-picker').value = filterDate;
                }
            }

            // --- CABECERA DE TABLA ---
            if (theadTr) {
                theadTr.innerHTML = '<th>Clase / Fecha</th><th>Cliente</th><th>Acción</th>';
            }

            clientBookingsList.innerHTML = `<tr><td colspan="3" class="table-loading">Cargando agenda de la fecha...</td></tr>`;

            // --- 3. CONSULTA A SUPABASE (FILTRO EXACTO) ---
            let query = supabase
                .from('reservas')
                .select(`
                    id,
                    estatus_pago,
                    fecha,
                    created_at,
                    clientes (nombre, telefono),
                    clases (
                        dia_semana,
                        hora_inicio,
                        disciplinas (nombre),
                        coaches (nombre)
                    )
                `)
                .eq('fecha', filterDate)
                .limit(100);

            const { data: bookingsArray, error } = await query;
            let bookings = bookingsArray || [];

            // --- 4. RESUMEN DEL DÍA ---
            const summaryEl = document.getElementById('admin-agenda-summary');
            if (summaryEl) {
                if (error) {
                    summaryEl.innerText = '⚠️ Error al cargar';
                } else if (!bookings || bookings.length === 0) {
                    summaryEl.innerText = '📭 Sin reservas este día';
                } else {
                    const total = bookings.length;
                    const pendientes = bookings.filter(b => b.estatus_pago !== 'Confirmado 50%').length;
                    const clasesUnicas = [...new Set(bookings.map(b => b.clases?.disciplinas?.nombre || 'Clase'))];
                    summaryEl.innerText = `📊 ${clasesUnicas.length} clases • ${total} reservas • ${pendientes} pendientes`;
                }
            }

            // --- 5. RENDERIZAR TABLA ---
            const tbody = document.getElementById('client-bookings-list');
            tbody.innerHTML = '';

            if (error) {
                tbody.innerHTML = `<tr><td colspan="3" class="table-loading">Error: ${error.message}</td></tr>`;
                return;
            }

            if (!bookings || bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="no-bookings-msg">No hay reservas para este día.</td></tr>`;
                return;
            }

            // Ordenar por hora
            bookings.sort((a, b) => {
                if (a.clases?.hora_inicio && b.clases?.hora_inicio) {
                    return a.clases.hora_inicio.localeCompare(b.clases.hora_inicio);
                }
                return 0;
            });

            bookings.forEach(booking => {
                const clase = booking.clases;
                if (!clase) return;

                const className = clase.disciplinas?.nombre || 'Clase';
                const clientName = booking.clientes?.nombre || 'Usuario';
                const clientPhone = booking.clientes?.telefono || '';
                const formattedTime = formatTime12h(clase.hora_inicio);
                const dateLabel = booking.fecha ? formatDateSpanish(booking.fecha) : '';

                let statusClass = 'pending';
                let statusLabel = booking.estatus_pago || 'Pendiente';
                
                if (statusLabel === 'Confirmado 50%') statusClass = 'confirmed';
                if (statusLabel === 'Cancelado' || statusLabel === 'Rechazado') {
                    statusClass = 'rejected';
                    statusLabel = 'Rechazado';
                }

                // Generar los botones dinámicamente según el estado
                let actionButtonsHTML = '';
                if (statusLabel === 'Rechazado') {
                    actionButtonsHTML = `
                        <button class="action-btn-agendar btn-change-status" data-id="${booking.id}" data-status="Pendiente" title="Restaurar a Pendiente" style="font-size:1.1rem; padding: 0.3rem 0.5rem; min-width:auto; height:auto; background:rgba(255,255,255,0.1);">
                            ↩️
                        </button>
                    `;
                } else if (statusLabel === 'Confirmado 50%') {
                    actionButtonsHTML = `
                        <button class="action-btn-agendar btn-change-status" data-id="${booking.id}" data-status="Pendiente" title="Revertir a Pendiente" style="font-size:1.1rem; padding: 0.3rem 0.5rem; min-width:auto; height:auto; background:rgba(255,255,255,0.1);">
                            ↩️
                        </button>
                        <button class="action-btn-agendar btn-change-status" data-id="${booking.id}" data-status="Cancelado" title="Rechazar/Cancelar" style="font-size:1.1rem; padding: 0.3rem 0.5rem; min-width:auto; height:auto; background:rgba(255,50,50,0.2);">
                            🗑️
                        </button>
                    `;
                } else {
                    // Pendiente
                    actionButtonsHTML = `
                        <button class="action-btn-agendar btn-change-status" data-id="${booking.id}" data-status="Confirmado 50%" title="Confirmar Pago" style="font-size:1.1rem; padding: 0.3rem 0.5rem; min-width:auto; height:auto; background:rgba(50,255,50,0.2);">
                            ✅
                        </button>
                        <button class="action-btn-agendar btn-change-status" data-id="${booking.id}" data-status="Cancelado" title="Rechazar/Cancelar" style="font-size:1.1rem; padding: 0.3rem 0.5rem; min-width:auto; height:auto; background:rgba(255,50,50,0.2);">
                            🗑️
                        </button>
                    `;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <strong>${className}</strong><br>
                        <small>${dateLabel} - ${formattedTime}</small>
                    </td>
                    <td>
                        <strong>${clientName}</strong><br>
                        <small>
                            <a href="https://wa.me/52${clientPhone}" 
                               target="_blank" 
                               style="color:var(--color-gold);text-decoration:underline;">
                                ${clientPhone}
                            </a>
                        </small>
                    </td>
                    <td style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
                        <span class="status-badge ${statusClass}" style="margin-bottom:0.25rem;">
                            ${statusLabel}
                        </span>
                        <div style="display:flex; gap:0.4rem;">
                            ${actionButtonsHTML}
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // --- 6. EVENTOS PARA CAMBIAR ESTATUS ---
            document.querySelectorAll('.btn-change-status').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const btnEl = e.currentTarget;
                    const bookingId = btnEl.getAttribute('data-id');
                    const newStatus = btnEl.getAttribute('data-status');

                    btnEl.style.opacity = '0.5';
                    btnEl.disabled = true;

                    const { error: updateError } = await supabase
                        .from('reservas')
                        .update({ estatus_pago: newStatus })
                        .eq('id', bookingId);

                    if (updateError) {
                        alert('Error al actualizar estatus: ' + updateError.message);
                        btnEl.style.opacity = '1';
                        btnEl.disabled = false;
                        return;
                    }

                    if (window.sileo) {
                        sileo.success({ 
                            title: 'Estatus Actualizado', 
                            description: `La reserva ahora está en ${newStatus}` 
                        });
                    }
                    
                    loadClientBookings(filterDate);
                });
            });

            return; // Salir de la función (no ejecutar la parte de cliente)
        }

        // --- VISTA CLIENTE ---
        accountModalTag.innerText = 'MI CUENTA';
        accountModalTitle.innerText = `HOLA, ${currentUserProfile.nombre.toUpperCase()}`;
        if (summarySection) summarySection.style.display = 'block';
        
        // Re-usamos el antiguo título ya que cliente no tiene admin-agenda-title
        const oldSectionTitle = document.querySelector('.panel-section-title');
        if (oldSectionTitle) oldSectionTitle.innerText = 'MIS RESERVAS';
        
        const filterContainer = document.getElementById('admin-date-filter-container');
        if (filterContainer) filterContainer.innerHTML = ''; // Ocultar date picker
        
        if (theadTr) {
            theadTr.innerHTML = '<th>Clase</th><th>Coach</th><th>Estado</th>';
        }
        
        userPhoneSpan.innerText = currentUserProfile.telefono || '-';
        userInjuriesSpan.innerText = currentUserProfile.historial_lesiones || 'Ninguna';

        clientBookingsList.innerHTML = `<tr><td colspan="3" class="table-loading">Cargando tus reservas...</td></tr>`;
        
        let query = supabase
            .from('reservas')
            .select(`
                id,
                estatus_pago,
                fecha,
                created_at,
                clientes (nombre, telefono),
                clases (
                    dia_semana,
                    hora_inicio,
                    disciplinas (nombre),
                    coaches (nombre)
                )
            `)
            .eq('cliente_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        const { data: rawBookings, error } = await query;
        let bookings = rawBookings || [];

        clientBookingsList.innerHTML = '';
        
        if (error) {
            clientBookingsList.innerHTML = `<tr><td colspan="3" class="table-loading">Error al cargar reservas.</td></tr>`;
            return;
        }
        
        if (!bookings || bookings.length === 0) {
            clientBookingsList.innerHTML = `<tr><td colspan="3" class="no-bookings-msg">No tienes reservas activas.</td></tr>`;
            return;
        }
        
        bookings.forEach(booking => {
            const clase = booking.clases;
            if (!clase) return;
            
            const className = clase.disciplinas?.nombre || 'Clase';
            const coachName = clase.coaches?.nombre || 'Ani';
            const formattedTime = formatTime12h(clase.hora_inicio);
            const dateLabel = booking.fecha ? formatDateSpanish(booking.fecha) : getSpanishDay(clase.dia_semana);
            
            const isPaid = booking.estatus_pago === 'Confirmado 50%';
            const statusClass = isPaid ? 'confirmed' : 'pending';
            const statusLabel = booking.estatus_pago || 'Pendiente';
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>${className}</strong><br><small>${dateLabel} - ${formattedTime}</small></td>
                <td>${coachName}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            `;
            clientBookingsList.appendChild(row);
        });
    };


    // 6. NOTIFICACIONES TOAST (Sileo)
    sileo.init({
        position: 'top-center',
        options: {
            duration: 4000
        }
    });

    // Helper: obtiene la hora actual en México (CST / UTC-6) de forma precisa
    // Usa Intl.DateTimeFormat.formatToParts() — evita el round-trip de string
    // que falla en Safari/iOS WebView (toLocaleString → new Date() puede dar Invalid Date)
    const getMexicoNow = () => {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Mexico_City',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).formatToParts(new Date());

        const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0');

        // Construir Date directamente desde las partes — sin parseo de string intermedio
        return new Date(
            get('year'),
            get('month') - 1, // los meses en JS son 0-indexed
            get('day'),
            get('hour') === 24 ? 0 : get('hour'), // algunos browsers usan 24 para medianoche
            get('minute'),
            get('second')
        );
    };

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

            // Detectar si el día activo es HOY para ocultar clases que ya pasaron
            const nowMx = getMexicoNow();
            const todayDateStr = `${nowMx.getFullYear()}-${String(nowMx.getMonth()+1).padStart(2,'0')}-${String(nowMx.getDate()).padStart(2,'0')}`;
            const activeDateStr = activeDayEl.getAttribute('data-date') || '';
            const isToday = activeDateStr === todayDateStr;
            // Hora actual en México como número comparable: HHMM
            const nowHHMM = nowMx.getHours() * 100 + nowMx.getMinutes();
            
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

                // Calcular si esta clase ya pasó (solo aplica si el día seleccionado es hoy)
                let isPastClass = false;
                if (isToday && clase.hora_inicio) {
                    const [hh, mm] = clase.hora_inicio.split(':').map(Number);
                    const classHHMM = hh * 100 + mm;
                    isPastClass = classHHMM < nowHHMM;
                }
                
                const slot = document.createElement('div');
                slot.className = `session-slot glass-panel${isPastClass ? ' past-class' : ''}`;
                slot.setAttribute('data-class-id', clase.id);
                slot.innerHTML = `
                    <div class="slot-time" style="min-width: 120px; align-items: center; justify-content: center;">
                        <span class="time-hour">${hoursDisplay}</span>
                        <span class="time-ampm">${ampmDisplay}</span>
                    </div>
                    <div class="slot-info">
                        <h4 class="class-name">${className}</h4>
                        <p class="instructor-name" style="display: none;">Coach: ${coachName}</p>
                        <span class="availability-badge ${isPastClass ? 'past' : 'available'}">${isPastClass ? 'Clase finalizada' : `Cupo: 0 / ${clase.capacidad_maxima || 5}`}</span>
                    </div>
                    <div class="slot-action">
                        <button class="action-btn-agendar${isPastClass ? ' disabled' : ''}" ${isPastClass ? 'disabled' : ''}>${isPastClass ? 'NO DISPONIBLE' : 'AGENDAR'}</button>
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
                        } else if (resError.message.includes('FECHA_PASADA')) {
                            sileo.error({title: "Fecha no disponible", description: "No es posible reservar en una fecha que ya pasó. Por favor selecciona un día disponible."});
                            renderSessions(); // refrescar la vista para bloquear visualmente
                        } else if (resError.message.includes('HORA_PASADA')) {
                            sileo.error({title: "Horario ya finalizado", description: "Esta clase ya inició. Por favor selecciona otro horario disponible."});
                            renderSessions(); // refrescar la vista para bloquear visualmente
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
                            sileo.error({title: "Error al reservar", description: resError.message});
                        }
                        return;
                    }
                    
                    const WA_NUMBER = '529516410766';
                    const message = `Hola Once:Once. Me interesa la clase de ${claseInfo} con ${coachName}. Para asegurar mi lugar, ¿podrían proporcionarme la cuenta para transferir el 50% de anticipo? 🤍`;
                    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
                    
                    window.location.href = waUrl;
                    closeModal(bookingModal);
                    
                    btn.innerText = 'AGENDAR';
                    btn.style.opacity = '1';
                    btn.disabled = false;
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
                    .neq('estatus_pago', 'Cancelado')
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
                                    // Si el slot es de clase pasada, no sobrescribir su estilo
                                    if (slotEl.classList.contains('past-class')) return;

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
        // Usar timeZone: 'UTC' para que toLocaleDateString lea el objeto en el mismo
        // huso horario (UTC) en el que fue construido, evitando conversiones de zona horaria local.
        const options = { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' };
        let formatted = date.toLocaleDateString('es-MX', options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const initializeCalendar = () => {
        const dayButtons = document.querySelectorAll('.week-day-btn');
        if (dayButtons.length === 0) return;

        // Usar siempre la hora de México para comparaciones de fecha
        const nowMx = getMexicoNow();
        const todayDateStr = `${nowMx.getFullYear()}-${String(nowMx.getMonth()+1).padStart(2,'0')}-${String(nowMx.getDate()).padStart(2,'0')}`;

        const currentDayMx = nowMx.getDay(); // 0=Dom, 1=Lun, ...

        // Si hoy es domingo (0), mostramos la próxima semana. Si no, mostramos la semana actual.
        const mondayOffset = currentDayMx === 0 ? 1 : 1 - currentDayMx;
        const baseDate = new Date(nowMx);
        baseDate.setDate(nowMx.getDate() + mondayOffset);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        let todayBtn = null;

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
                if (numEl) numEl.innerText = dateNum;

                // Bloquear días estrictamente anteriores a hoy
                if (fullDateStr < todayDateStr) {
                    btn.disabled = true;
                    btn.classList.add('day-past');
                    btn.setAttribute('title', 'Fecha pasada');
                } else if (fullDateStr === todayDateStr) {
                    todayBtn = btn;
                }
            }
        });

        // Activar HOY por defecto (si existe en la semana visible)
        // Si hoy es domingo cargamos la semana siguiente y no hay "today" visible
        if (todayBtn) {
            dayButtons.forEach(b => b.classList.remove('active'));
            todayBtn.classList.add('active');
        }
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
        
        sendWhatsAppMessage(text);
        closeModal(merchModal);
        
        // Restablecer botón
        btnCheckoutSubmit.innerText = 'COMPLETAR ADQUISICIÓN';
        btnCheckoutSubmit.style.opacity = '1';
        btnCheckoutSubmit.disabled = false;
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
    // 8. MOTOR DE FONDO: IMAGEN PARALLAX (OPTIMIZACIÓN DE COMPOSICIÓN GPU)
    // ==========================================================================
    const mainBgImage = document.querySelector('.main-background-image');
    if (mainBgImage) {
        let ticking = false;
        
        // Función de posicionamiento reutilizable
        const updateParallax = () => {
            const scrollY = window.scrollY;
            const offset = Math.sin(scrollY * 0.002) * (window.innerHeight * 0.15);
            const y = scrollY + offset;
            mainBgImage.style.transform = `translate3d(0, ${y}px, 0)`;
        };

        // Inicializar de inmediato para evitar pantalla en negro al cargar
        updateParallax();

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ==========================================================================
    // 9. OPTIMIZACIÓN HERO CAROUSEL: Gestionar will-change dinámicamente
    // ==========================================================================
    const carouselImages = document.querySelectorAll('.carousel-img');
    if (carouselImages.length > 0) {
        const checkActiveImages = () => {
            const cycleTime = 48000;
            const visibleDuration = 9000;
            const timeNow = performance.now() % cycleTime;
            
            carouselImages.forEach((img, index) => {
                const delay = index * 6000;
                let relativeTime = timeNow - delay;
                if (relativeTime < 0) relativeTime += cycleTime;
                
                if (relativeTime <= visibleDuration || relativeTime >= (cycleTime - 1000)) {
                    img.classList.add('is-animating');
                } else {
                    img.classList.remove('is-animating');
                }
            });
        };
        setInterval(checkActiveImages, 1000);
        checkActiveImages();
    }

});
