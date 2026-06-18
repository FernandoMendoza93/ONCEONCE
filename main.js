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
        
        if (modalEl === bookingModal && typeof renderSessions === 'function') {
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

    // 6. NOTIFICACIONES TOAST (GPU y Micro-animaciones)
    const toast = document.getElementById('toast-notification');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');
    let toastTimeout;

    const showToast = (title, message) => {
        toastTitle.innerText = title;
        toastMsg.innerText = message;
        
        // Limpia timeouts activos
        clearTimeout(toastTimeout);
        
        toast.classList.add('active');
        
        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    };

    // Datos reales de horarios de Reformer y Tapetes
    const scheduleData = {
        reformer: {
            Mon: [
                { time: "05:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 4 / 7" },
                { time: "06:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 3 / 7" },
                { time: "07:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 5 / 7" }
            ],
            Tue: [
                { time: "07:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 2 / 7" },
                { time: "08:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 4 / 7" },
                { time: "09:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 6 / 7" }
            ],
            Wed: [
                { time: "04:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 3 / 7" },
                { time: "05:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 5 / 7" }
            ],
            Thu: [
                { time: "04:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 4 / 7" },
                { time: "05:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 2 / 7" }
            ],
            Fri: [
                { time: "07:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 4 / 7" },
                { time: "08:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 3 / 7" },
                { time: "09:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 5 / 7" },
                { time: "04:00 PM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 6 / 7" }
            ],
            Sat: [
                { time: "07:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 5 / 7" },
                { time: "08:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 3 / 7" },
                { time: "09:00 AM", name: "Pilates Reformer", instructor: "Ani", available: "Cupo: 4 / 7" }
            ]
        },
        tapetes: {
            Mon: [
                { time: "06:30 AM", name: "Sculpt", instructor: "Renata", available: "Cupo: 5 / 10" },
                { time: "08:00 AM", name: "Mat", instructor: "Renata", available: "Cupo: 6 / 10" },
                { time: "09:30 AM", name: "GAP", instructor: "Nane", available: "Cupo: 4 / 10" },
                { time: "11:00 AM", name: "Barre", instructor: "Staff", available: "Cupo: 7 / 10" }
            ],
            Tue: [
                { time: "06:30 AM", name: "Mat", instructor: "Renata", available: "Cupo: 4 / 10" },
                { time: "08:00 AM", name: "Sculpt", instructor: "Renata", available: "Cupo: 5 / 10" },
                { time: "09:30 AM", name: "Barre", instructor: "Staff", available: "Cupo: 6 / 10" },
                { time: "11:00 AM", name: "GAP", instructor: "Nane", available: "Cupo: 5 / 10" }
            ],
            Wed: [
                { time: "06:30 AM", name: "Barre", instructor: "Staff", available: "Cupo: 5 / 10" },
                { time: "08:00 AM", name: "Sculpt", instructor: "Renata", available: "Cupo: 4 / 10" },
                { time: "09:30 AM", name: "Mat", instructor: "Renata", available: "Cupo: 6 / 10" },
                { time: "11:00 AM", name: "GAP", instructor: "Nane", available: "Cupo: 3 / 10" }
            ],
            Thu: [
                { time: "06:30 AM", name: "Mat", instructor: "Renata", available: "Cupo: 6 / 10" },
                { time: "08:00 AM", name: "Barre", instructor: "Staff", available: "Cupo: 4 / 10" },
                { time: "09:30 AM", name: "Sculpt", instructor: "Renata", available: "Cupo: 5 / 10" },
                { time: "11:00 AM", name: "GAP", instructor: "Nane", available: "Cupo: 5 / 10" }
            ],
            Fri: [
                { time: "06:30 AM", name: "Barre", instructor: "Staff", available: "Cupo: 4 / 10" },
                { time: "08:00 AM", name: "Mat", instructor: "Renata", available: "Cupo: 6 / 10" },
                { time: "09:30 AM", name: "Sculpt", instructor: "Renata", available: "Cupo: 5 / 10" },
                { time: "11:00 AM", name: "GAP", instructor: "Nane", available: "Cupo: 7 / 10" }
            ],
            Sat: [
                { time: "08:00 AM", name: "Mat", instructor: "Renata", available: "Cupo: 5 / 10" },
                { time: "09:30 AM", name: "Barre", instructor: "Staff", available: "Cupo: 4 / 10" },
                { time: "11:00 AM", name: "GAP", instructor: "Nane", available: "Cupo: 6 / 10" }
            ]
        }
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
        const sessions = scheduleData[activeTab][activeDay] || [];
        
        if (sessions.length === 0) {
            listContainer.innerHTML = '<p class="no-sessions">No hay clases programadas para este día.</p>';
            return;
        }
        
        sessions.forEach(session => {
            const timeParts = session.time.split(' ');
            const hour = timeParts[0];
            const ampm = timeParts[1];
            
            const slot = document.createElement('div');
            slot.className = 'session-slot glass-panel';
            slot.innerHTML = `
                <div class="slot-time">
                    <span class="time-hour">${hour}</span>
                    <span class="time-ampm">${ampm}</span>
                </div>
                <div class="slot-info">
                    <h4 class="class-name">${session.name}</h4>
                    <p class="instructor-name">Coach: ${session.instructor}</p>
                    <span class="availability-badge available">${session.available}</span>
                </div>
                <div class="slot-action">
                    <button class="action-btn-agendar">AGENDAR</button>
                </div>
            `;
            
            // Añadir listener de WhatsApp al botón dinámico
            slot.querySelector('.action-btn-agendar').addEventListener('click', (e) => {
                const btn = e.target;
                const text = `¡Hola! Me interesa agendar la clase de "${session.name}" con ${session.instructor} el día ${getSpanishDay(activeDay)} a las ${session.time}. ¿Tienen disponibilidad?`;
                
                btn.innerText = 'PROCESANDO...';
                btn.style.opacity = '0.7';
                btn.disabled = true;
                
                setTimeout(() => {
                    sendWhatsAppMessage(text);
                    closeModal(bookingModal);
                    
                    // Restablecer botón
                    btn.innerText = 'AGENDAR';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }, 800);
            });
            
            listContainer.appendChild(slot);
        });
    };

    const getSpanishDay = (day) => {
        const days = {
            Mon: "Lunes",
            Tue: "Martes",
            Wed: "Miércoles",
            Thu: "Jueves",
            Fri: "Viernes",
            Sat: "Sábado"
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

});
