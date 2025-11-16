// src/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// --- 👇 NUEVAS IMPORTACIONES PARA GOOGLE AUTH ---
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("./models"); // Importamos el modelo User
// --- 👇 ¡IMPORTAR SERVICIO DE EMAIL! ---
const { sendWelcomeEmail } = require("./services/emailService");
// --- FIN DE NUEVAS IMPORTACIONES ---

const app = express();

const uploadsDirectory = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  console.log("📁 Carpeta 'uploads' creada automáticamente dentro de src.");
}

// Middlewares
app.use(cors());
app.use(express.json());

// --- 👇 NUEVO MIDDLEWARE DE SESIÓN Y PASSPORT ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// --- FIN DE NUEVO MIDDLEWARE ---

// --- 👇 CONFIGURACIÓN DE ESTRATEGIA DE GOOGLE ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            username: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatarUrl: profile.photos[0].value,
            role: "client",
            password: null,
          },
        });

        if (
          !created &&
          !user.avatarUrl &&
          profile.photos &&
          profile.photos[0]
        ) {
          user.avatarUrl = profile.photos[0].value;
          await user.save();
        }

        // --- 👇 ¡CORRECCIÓN! ENVIAR BIENVENIDA SI ES NUEVO ---
        if (created) {
          try {
            await sendWelcomeEmail(user.email, user.username);
            console.log(`📧 (Bienvenida Google) Email enviado a ${user.email}`);
          } catch (emailError) {
            // No detenemos el login si el email falla, solo lo advertimos
            console.warn(
              `⚠️ Error al enviar correo de bienvenida de Google a ${user.email}:`,
              emailError.message
            );
          }
        }
        // --- FIN DE CORRECCIÓN ---

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Passport necesita esto para manejar la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
// --- FIN DE CONFIGURACIÓN DE PASSPORT ---

// Importar middlewares
const authenticationMiddleware = require("./middlewares/authMiddleware");
const errorHandlingMiddleware = require("./middlewares/errorHandler");

// Importar rutas
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authenticationRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const addressRoutes = require("./routes/addressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");

// 1. RUTAS API
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authenticationRoutes);
app.use("/api/cart", authenticationMiddleware, cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// 2. Servir archivos estáticos
app.use("/uploads", express.static(uploadsDirectory));

// --- MANEJADOR DE RUTA NO ENCONTRADA (404 JSON) ---
app.use((req, res, next) => {
  const error = new Error(`Ruta de API no encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Middleware para manejo de errores
app.use(errorHandlingMiddleware);

module.exports = app;
