### Arquitectura backend ###

### Node.js + Express + MySQL

backend/
│
├── node_modules/ # Dependencias instaladas (NO editar)
│
├── src/ # Código fuente del backend
│ ├── config/ # Configuraciones generales (DB, variables env, etc)
│ │ ├── db.js
│ │ └── env.js
│ │
│ ├── controllers/ # Lógica de negocio
│ │ ├── orderController.js
│ │ ├── productController.js
│ │ ├── ratingController.js
│ │ ├── commentController.js
│ │ ├── authController.js
│ │ ├── cartController.js
│ │ └── userController.js
│ │
│ ├── emails/ # Envío de correos electrónicos
│ │ ├── order-confirmation.html
│ │ └── welcome.html
│ │
│ ├── models/ # Modelos y acceso a base de datos
│ │ ├── index.js
│ │ ├── productModel.js
│ │ ├── orderItemModel.js
│ │ ├── cartItemModel.js
│ │ ├── userModel.js
│ │ └── orderModel.js
│ │ └── commentModel.js
│ │ └── ratingModel.js
│ │
│ ├── routes/ # Endpoints de la API
│ │ ├── productRoutes.js
│ │ ├── commentRoutes.js
│ │ ├── ratingRoutes.js
│ │ ├── authRoutes.js
│ │ ├── cartRoutes.js
│ │ ├── orderRoutes.js
│ │ └── userRoutes.js
│ │
│ ├── scripts/
│ │ ├── createAdmin.js // Script para crear un administrador
│ │
│ │
│ ├── middlewares/ # Middlewares reutilizables
│ │ ├── authMiddleware.js
│ │ ├── roleMiddleware.js
│ │ ├── uploadMiddleware.js
│ │ └── errorHandler.js
│ │
│ ├── services/ # Lógica adicional desacoplada
│ │ ├── paymentService.js
│ │ └── emailService.js
│ │
│ ├── utils/ # Funciones auxiliares
│ │ ├── email.js
│ │ └── slugify.js
│ │
│ ├── app.js # Configuración de la app de Express
│ ├── resetDatabase.js
│ ├── hashPassword.js
│ └── server.js # Inicializa el servidor y escucha en un puerto
│ │
│ └── uploads/ # Carpeta donde se suben las imágenes.
│
├── .env # Variables de entorno
├── package.json # Declaración de dependencias y scripts
├── package-lock.json # Versión fija de dependencias
├── README.md # Documentación inicial del proyecto
└── .gitignore # Archivos a ignorar por git (ej. node_modules, .env)

#####Futuras implementaciones#####

✅ Lista de funcionalidades planificadas (ordenada por dificultad)

🔹 Nivel 1 – Básico / Medio
✅ Token con expiración automática (JWT) ✅
✅ Roles de usuario (admin, cliente) ✅
✅ Control de permisos por rol (proteger rutas) ✅
✅ CRUD de productos protegido para admins ✅
🔍 Filtros, búsqueda por nombre en productos ✅
📄 Paginación de productos (ej. 10 por página) ✅
🎨 Elegir paleta de colores para el frontend
🌐 Buscar webs de referencia para inspirar el diseño ✅
🧩 Usar Miro.com para prototipado del diseño
🛒 Navegación libre para usuarios planos (sin registro)✅
🛒 Añadir artículos a la cesta y ver cesta para usuarios cliente✅
🍪 Añadir popup para las cookies
🔎 Filtros en backend: nombre, rango de precio, stock, talla, color, marca, paginación y ordenación. ✅
🔎 Añadir la posibilidad de filtrar en el front, por talla, color, etc.
🔎 Añadir la posibilidad de buscar por texto en el navbar
📊 Añadir la posibilidad de ver el historial de compras ✅
✏️ Posibilidad de editar perfil de usuario (cambiar contraseña, correo, nombre, etc) ✅
✏️ Posibilidad de eliminar perfil ✅
✏️ Añadir "olvidé mi contraseña" en el formulario de login, con correo incluido
🙎‍♂️ Añadir que los usuarios puedan comentar en los productos✅
🙎‍♂️ Posiblidad de calificar el producto con estrellas
⭐️ Hacer que cada producto tenga una puntuación en base a las estrellas que le hayan dado los usuarios

🔸 Nivel 2 – Medio / Avanzado
🖼 Subida de imágenes para productos (solo admin)✅
🧺 Sistema de carrito de compras completo (por usuario cliente)✅
💳 Integración con pagos (Stripe o PayPal)
📧 Envío de emails tras registro o compra ✅
✉️ Crear mail del sitio ✅
🗂 Historial de pedidos por usuario ✅
📦 Gestión automática de stock al comprar ✅
🔐 Login con Gmail (OAuth 2.0 con Google)
📝 Permisos para admins crear y editar anuncios/productos ✅
⁇ Crear página 404 en el front

🔺 Nivel 3 – Avanzado
🔗 Conexión del backend con frontend (React u otro)
🛡 Seguridad avanzada: rate limiting, XSS, validación profunda
🧠 IA para búsquedas conversacionales (“quiero unos zapatos azules del número 45”) (biblioteca tensorflow JS )
