# 👟 Footer API - Backend E-commerce

![NodeJS](https://img.shields.io/badge/Node.js-20.x-green) ![Express](https://img.shields.io/badge/Express-4.x-lightgrey) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue) ![Stripe](https://img.shields.io/badge/Stripe-Payment-635bff) ![Status](https://img.shields.io/badge/Status-Deployed-success)

**Footer API** es el motor backend para una tienda de comercio electrónico de moda urbana. Construido con una arquitectura sólida y escalable, gestiona la autenticación, inventario, pagos y notificaciones.

🔗 **URL de la API (Producción):** [https://footer-back.onrender.com](https://footer-back.onrender.com)

---

## 🛠️ Stack Tecnológico

- **Core:** Node.js, Express.js
- **Base de Datos:** MySQL (Aiven Cloud) + Sequelize ORM
- **Autenticación:** JWT (JSON Web Tokens) + Bcrypt
- **Pagos:** Stripe API
- **Emails:** Nodemailer (Plantillas HTML)
- **Archivos:** Multer (Subida de imágenes local/nube)

---

## ✨ Funcionalidades Principales

### 🔐 Seguridad y Autenticación

- Registro y Login de usuarios con hash de contraseñas (Bcrypt).
- Autenticación mediante **JWT** con expiración automática.
- Middleware de **Roles** (Admin vs Cliente) para proteger rutas sensibles.
- Login social con Google (OAuth 2.0).

### 🛒 E-commerce

- **Gestión de Productos:** CRUD completo (solo Admin), filtros avanzados (talla, color, precio) y paginación.
- **Carrito de Compras:** Lógica de negocio para añadir items, calcular totales y gestionar stock en tiempo real.
- **Checkout:** Integración completa con **Stripe** para procesar pagos seguros.
- **Pedidos:** Generación de órdenes de compra, historial de usuario y facturación.

### 👥 Gestión de Usuarios

- Perfil de usuario editable (avatar, datos personales).
- Sistema de direcciones de envío.
- Valoraciones y comentarios en productos (Rating system).

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu máquina:

1.  **Clonar el repositorio:**

    ```bash
    git clone [https://github.com/Juanpedrogomezespinosa/footer-back.git](https://github.com/Juanpedrogomezespinosa/footer-back.git)
    cd footer-back
    ```

2.  **Instalar dependencias:**

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz y añade tus claves:

    ```env
    PORT=3000
    DB_HOST=127.0.0.1
    DB_USER=root
    DB_PASSWORD=tu_password
    DB_NAME=Footer
    JWT_SECRET=tu_secreto_super_seguro
    STRIPE_SECRET_KEY=sk_test_...
    EMAIL_USER=tu_correo@gmail.com
    EMAIL_PASS=tu_contraseña_app
    FRONTEND_URL=http://localhost:4200
    ```

4.  **Base de Datos:**
    Asegúrate de tener MySQL corriendo. Puedes usar los scripts incluidos para poblar la base de datos:

    ```bash
    npm run reset-db   # Crea las tablas
    npm run create-admin # Crea un usuario administrador
    ```

5.  **Arrancar el servidor:**
    ```bash
    npm run dev
    ```

---

## 📡 Endpoints de la API

| Método | Endpoint               | Descripción                    | Acceso    |
| :----- | :--------------------- | :----------------------------- | :-------- |
| `POST` | `/api/auth/login`      | Iniciar sesión                 | Público   |
| `GET`  | `/api/products`        | Listar productos (con filtros) | Público   |
| `POST` | `/api/cart/add`        | Añadir producto al carrito     | Usuario   |
| `POST` | `/api/orders/checkout` | Pagar y crear orden            | Usuario   |
| `POST` | `/api/products`        | Crear nuevo producto           | **Admin** |
| `GET`  | `/api/users/profile`   | Ver datos del usuario          | Usuario   |

---

## 📂 Estructura del Proyecto

```bash
src/
├── config/         # Configuración de DB y variables
├── controllers/    # Lógica de las peticiones (MVC)
├── models/         # Modelos de Sequelize (Tablas)
├── routes/         # Definición de rutas API
├── middlewares/    # Auth, Roles, Uploads, Error Handling
├── services/       # Lógica de negocio desacoplada (Email, Stripe)
├── utils/          # Helpers y utilidades
└── uploads/        # Almacenamiento temporal de imágenes
```

☁️ Despliegue
Este proyecto está desplegado usando una arquitectura moderna en la nube:

Backend: Render (Web Service)

Base de Datos: Aiven (MySQL Cloud)

✒️ Autor
Juan Pedro Gómez Espinosa - GitHub
