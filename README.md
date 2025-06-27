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
🙎‍♂️ Posiblidad de calificar el producto con estrellas ✅
⭐️ Hacer que cada producto tenga una puntuación en base a las estrellas que le hayan dado los usuarios ✅

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
⭐️ Filtrar por número de estrellas, más a menos estrellas, etc
⁇ Crear página 404 en el front

🔺 Nivel 3 – Avanzado
🔗 Conexión del backend con frontend (React u otro)
🛡 Seguridad avanzada: rate limiting, XSS, validación profunda
🧠 IA para búsquedas conversacionales (“quiero unos zapatos azules del número 45”) (biblioteca tensorflow JS )

---

# Footer

## Descripción

Footer es una aplicación web backend para una tienda online de ropa y zapatos. Está desarrollada con Node.js, Express, MySQL y Stripe para la gestión de pagos. Este backend ofrece funcionalidades robustas como autenticación con JWT, roles de usuario, control de permisos, gestión de productos, carrito de compras, sistema de valoraciones, historial de pedidos, envío de correos y más.

---

## Tecnologías

- Node.js
- Express
- MySQL
- Sequelize (ORM para MySQL)
- Stripe (integración para pagos)
- JSON Web Tokens (JWT)
- Bcrypt (para hash de contraseñas)
- Nodemailer (para envío de emails)
- Otros paquetes: dotenv, cors, multer, slugify, etc.

---

## Funcionalidades principales

- Autenticación con tokens JWT con expiración automática.
- Gestión de roles (administrador y cliente) con protección de rutas y permisos.
- CRUD completo de productos para administradores.
- Filtros avanzados y paginación para productos (nombre, precio, stock, talla, color, marca, ordenación).
- Navegación y carrito de compras para usuarios sin registro y clientes registrados.
- Gestión completa del carrito y checkout con Stripe.
- Historial de pedidos para cada usuario.
- Comentarios y calificaciones (estrellas) para productos.
- Puntuación media para cada producto basada en valoraciones.
- Subida de imágenes para productos (solo administradores).
- Envío automático de emails tras registro y confirmación de compra.
- Gestión automática de stock al realizar una compra.
- Login con Google mediante OAuth 2.0 (implementación futura / pendiente).

---

## Instalación y ejecución local

### Requisitos previos

- Node.js (v16+ recomendado)
- MySQL y MySQL Workbench (o cliente equivalente)

### Pasos para instalar

1. Clonar el repositorio:

   git clone https://github.com/Juanpedrogomezespinosa/footer-back.git

   cd footer-back

2. Crear la base de datos `Footer` en MySQL. Puedes usar MySQL Workbench o consola MySQL:

   CREATE DATABASE Footer;

3. Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajustar valores según tu entorno):

   EMAIL*USER=tu-email@example.com
   EMAIL_PASS=tu-password-email
   PORT=3000
   DB_NAME=Footer
   DB_USER=root
   DB_PASSWORD=
   DB_HOST=127.0.0.1
   JWT_SECRET=tu-secret-jwt
   STRIPE_SECRET_KEY=sk_test*...
   STRIPE*PUBLISHABLE_KEY=pk_test*...

4. Instalar dependencias:

   npm install

5. Inicializar la base de datos y tablas (opcional, si tienes script para esto):

   npm run reset-db

6. Crear un usuario administrador (opcional, si tienes script para esto):

   npm run create-admin

7. Ejecutar el servidor en modo desarrollo con recarga automática:

   npm run dev

   O en modo producción:

   npm start

---

## Endpoints principales

- `/api/auth` - Registro, login y autenticación de usuarios.
- `/api/products` - CRUD de productos y búsqueda.
- `/api/cart` - Gestión del carrito de compras (añadir, eliminar, checkout).
- `/api/orders` - Historial de pedidos y creación de órdenes.
- `/api/comments` - Comentarios en productos.
- `/api/ratings` - Calificaciones de productos.
- `/api/users` - Gestión y edición de perfiles de usuario.

---

## Notas adicionales

- La integración de Stripe para pagos está implementada y el endpoint `/api/cart/checkout` procesa los pagos y crea órdenes.
- El backend envía correos electrónicos para confirmación de registro y pedidos mediante Nodemailer y plantillas Handlebars.
- Se usa JWT para asegurar rutas y controlar acceso según roles.
- Las imágenes de productos se almacenan en la carpeta `/uploads` y se sirven estáticamente.

---
