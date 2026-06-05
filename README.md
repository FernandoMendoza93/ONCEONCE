# Once:Once Pilates Studio - Landing Page Premium

Este repositorio contiene la landing page premium de **Once:Once Pilates Studio**, un santuario de bienestar físico y mental ubicado en Oaxaca, México. 

La web ha sido diseñada meticulosamente para ofrecer una experiencia estética de alta costura e inmersión total, resolviendo específicamente los problemas técnicos más comunes que sufren los sitios web cuando se abren a través del **WebView de Instagram** en dispositivos móviles, con especial enfoque en dispositivos iOS (iPhone).

---

## 🚀 Características y Soluciones Técnicas (WebView Instagram/iOS)

1. **Dominio de Viewport Dinámico (`100dvh`)**: Toda la maquetación se adapta de forma elástica a la altura dinámica del viewport. Esto evita que las barras de control superior e inferior del navegador integrado de Instagram bloqueen o corten los botones de llamado a la acción (CTAs) o el Header.
2. **Respeto a Áreas Seguras (`safe-area-inset-top/bottom`)**: Los paddings y márgenes superiores e inferiores se adaptan dinámicamente al notch, la Dynamic Island y el indicador táctil inferior de los iPhones.
3. **Prevención de Overscroll ("Rubber-Banding")**: Bloqueo del efecto rebote nativo de Safari en iOS mediante propiedades CSS en el documento base (`overscroll-behavior: none`), dando una experiencia de navegación fluida idéntica a una app nativa.
4. **Prevención de Fuga de Scroll ("Scroll Chaining") en Modales**: Los modales del calendario semanal de reservas y detalles de merchandising tienen su propia contención de desplazamiento (`overscroll-behavior: contain`), impidiendo que el scroll dentro del modal mueva la página principal de fondo.
5. **Cero Pestañas Externas**: Todo el agendado de clases y el flujo de merchandising ocurren dentro de la misma vista mediante modales fluidos cargados instantáneamente, reteniendo al cliente en el flujo de la aplicación.
6. **Optimización con Cloudinary CDN**: Entrega inteligente de imágenes a través de Cloudinary usando transformaciones al vuelo (`f_auto` y `q_auto`), lo que reduce drásticamente el peso de la página y los tiempos de carga en redes móviles.

---

## 🛠️ Tecnologías Empleadas

El desarrollo se construyó con tecnologías base estáticas ultra-ligeras para maximizar la velocidad de carga (Load Time) sin la sobrecarga de frameworks Javascript complejos:

* **HTML5 Semántico**: Estructura limpia y optimizada para SEO y accesibilidad.
* **CSS3 Vanilla**: Estilo y diseño "Santuario Etéreo" con una paleta HSL adaptada, efectos de glassmorphism (`backdrop-filter`) y variables CSS.
* **JavaScript ES6+**: Gestión de interacción móvil, modales y gestos táctiles.
* **Lenis Smooth Scroll (v1.1.9)**: Motor de scroll suave con inercia física para una experiencia táctil sedosa.
* **Intersection Observer API**: Animaciones CSS fluidas que se ejecutan directamente en la tarjeta gráfica (GPU) mediante transformaciones 3D, garantizando un rendimiento a 60fps con mínimo impacto en la batería del teléfono.

---

## 📂 Estructura del Proyecto

```text
├── assets/                  # Logotipo transparente de Once:Once y fotos de disciplinas
│   ├── logo_gold.png        # Logo en dorado premium (esquina superior izquierda)
│   ├── logo_white.png       # Logo en blanco roto alternativo
│   ├── barre.jpg            # Foto de disciplina Barre
│   ├── reformer.jpg         # Foto de disciplina Pilates Reformer
│   └── mat.jpg              # Foto de disciplina Mat Pilates
├── index.html               # Estructura del sitio y maquetación de modales
├── index.css                # Sistema de diseño, layout responsivo y variables
├── main.js                  # Lógica de interacciones, Lenis, animaciones y modales
└── README.md                # Documentación del proyecto
```

---

## 💻 Visualización Local

Para previsualizar el proyecto en tu máquina local, puedes levantar un servidor estático rápido:

**Con Python:**
```bash
python -m http.server 8080
```
Abre [http://localhost:8080](http://localhost:8080) en tu navegador.
