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
│ │
│ ├── middlewares/ # Middlewares reutilizables
│ │ ├── authMiddleware.js
│ │ └── errorHandler.js
│ │
│ ├── services/ # Lógica adicional desacoplada
│ │ └── paymentService.js
│ │
│ ├── utils/ # Funciones auxiliares
│ │ └── slugify.js
│ │
│ ├── app.js # Configuración de la app de Express
│ └── server.js # Inicializa el servidor y escucha en un puerto
│ └── resetDatabase.js

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
