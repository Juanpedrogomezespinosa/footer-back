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
│ │ ├── productController.js
│ │ ├── authController.js
│ │ └── userController.js
│ │ └── cartController.js
│ │
│ ├── models/ # Modelos y acceso a base de datos
│ │ ├── index.js
│ │ ├── productModel.js
│ │ ├── orderItemModel.js
│ │ ├── userModel.js
│ │ └── orderModel.js
│ │
│ ├── routes/ # Endpoints de la API
│ │ ├── productRoutes.js
│ │ ├── authRoutes.js
│ │ └── userRoutes.js
│ │ └── cartRoutes.js
│ │
│ ├── middlewares/ # Middlewares reutilizables
│ │ ├── authMiddleware.js
│ │ └── errorHandler.js
│ │ ├── roleMiddleware.js
│ │
│ ├── services/ # Lógica adicional desacoplada
│ │ └── paymentService.js
│ │
│ ├── utils/ # Funciones auxiliares
│ │ └── slugify.js
│ │
│ ├── app.js # Configuración de la app de Express
│ └── resetDatabase.js
│ └── hashPassword.js
│ └── server.js # Inicializa el servidor y escucha en un puerto
│
├── .env # Variables de entorno
├── package.json # Declaración de dependencias y scripts
├── package-lock.json # Versión fija de dependencias
├── README.md # Documentación inicial del proyecto
└── .gitignore # Archivos a ignorar por git (ej. node_modules, .env)

#####Futuras implementaciones#####

- Añadir filtros, paginación/ búsqueda para productos.
- Implementar roles de usuario y control de permisos.
- Integrar pagos, emails o subir imágenes.
- conectar con el front.
  ✅ Lista de funcionalidades planificadas (ordenada por dificultad)

🔹 Nivel 1 – Básico / Medio
✅ Token con expiración automática (JWT) ✅
✅ Roles de usuario (admin, cliente) ✅
✅ Control de permisos por rol (proteger rutas) ✅
✅ CRUD de productos protegido para admins ✅
🔍 Filtros, búsqueda por nombre en productos ✅
📄 Paginación de productos (ej. 10 por página) ✅
🎨 Elegir paleta de colores para el frontend
🌐 Buscar webs de referencia para inspirar el diseño
🧩 Usar Miro.com para prototipado del diseño
🛒 Navegación libre para usuarios planos (sin registro)✅
🛒 Añadir artículos a la cesta y ver cesta para usuarios cliente✅

🔸 Nivel 2 – Medio / Avanzado
🖼 Subida de imágenes para productos (solo admin)
🧺 Sistema de carrito de compras completo (por usuario cliente)
💳 Integración con pagos (Stripe o PayPal)
📧 Envío de emails tras registro o compra (configurar mail del sitio)
🗂 Historial de pedidos por usuario
📦 Gestión automática de stock al comprar
🔐 Login con Gmail (OAuth 2.0 con Google)
📝 Permisos para admins crear y editar anuncios/productos

🔺 Nivel 3 – Avanzado
🔗 Conexión del backend con frontend (React u otro)
🛡 Seguridad avanzada: rate limiting, XSS, validación profunda
🧠 IA para búsquedas conversacionales (“quiero unos zapatos azules del número 45”)

credenciales admin:

{
"email": "admin@tudominio.com",
"password": "MiContraseñaAdmin123"
}

usuario de prueba:
{
"username": "juanpe",
"email": "juanpe@example.com",
"password": "123456"
}
