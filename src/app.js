require("dotenv").config();

const express = require("express");
const cors = require("cors");
// const path = require("path"); // Ya no necesitamos path para uploads
// const fs = require("fs");     // Ya no necesitamos fs para uploads

// --- IMPORTACIONES GOOGLE AUTH ---
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("./models");
// --- IMPORTAR SERVICIO DE EMAIL ---
const { sendWelcomeEmail } = require("./services/emailService");

const app = express();

// --------------------------------------------------------
// 1. CONFIGURACIÓN DE CORS
// --------------------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://footer-front.vercel.app",
      "https://footer-ashy.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// --- MIDDLEWARE DE SESIÓN Y PASSPORT ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// --- CONFIGURACIÓN DE ESTRATEGIA DE GOOGLE ---
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://footer-back.onrender.com"
    : "http://localhost:3000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`,
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

        if (created) {
          // Enviamos el email sin await para no bloquear el login
          sendWelcomeEmail(user.email, user.username).catch((err) =>
            console.warn("⚠️ Error envío email bienvenida Google:", err.message)
          );
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

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

// --- RUTA HEALTH CHECK (NUEVO) ---
// Esto soluciona el error 404 en los logs de Render cuando verifica el servidor
app.get("/", (req, res) => {
  res.status(200).send("API Backend Footer funcionando correctamente 🚀");
});
// ---------------------------------

// 2. RUTAS API
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

// NOTA: Eliminamos app.use("/uploads"...) porque ahora las imágenes vienen de Cloudinary

// --- MANEJADOR DE RUTA NO ENCONTRADA (404 JSON) ---
app.use((req, res, next) => {
  const error = new Error(`Ruta de API no encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Middleware para manejo de errores
app.use(errorHandlingMiddleware);

module.exports = app;
