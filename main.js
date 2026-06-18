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
        
        // Foco de accesibilidad
        modalEl.setAttribute('aria-hidden', 'false');
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
            
            // Simular recarga de agenda con sutil efecto visual
            const list = document.querySelector('.sessions-list');
            list.style.opacity = '0.3';
            list.style.transform = 'translate3d(0, 5px, 0)';
            
            setTimeout(() => {
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

    // Acciones dentro de los modales (Agendar y Comprar)
    const scheduleButtons = document.querySelectorAll('.action-btn-agendar:not(.disabled)');
    scheduleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const slot = btn.closest('.session-slot');
            const className = slot.querySelector('.class-name').innerText;
            const coach = slot.querySelector('.instructor-name').innerText.replace('Coach: ', '');
            const hour = slot.querySelector('.time-hour').innerText + ' ' + slot.querySelector('.time-ampm').innerText;
            const day = document.querySelector('.week-day-btn.active .day-name').innerText;
            
            const text = `¡Hola! Me interesa agendar la clase de "${className}" con ${coach} el día ${day} a las ${hour}. ¿Tienen disponibilidad?`;
            
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
