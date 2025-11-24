// src/scripts/seedProducts.js
const path = require("path");
// Ajustamos la carga del .env para asegurarnos de que lo lee desde la raíz del proyecto
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// ================= CONFIGURACIÓN =================
const PRODUCTS_ROOT_DIR = process.env.SEED_PRODUCTS_DIR;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api`;

console.log("\n🔧 Configuración de Seed:");
console.log(`   - Directorio: ${PRODUCTS_ROOT_DIR}`);
console.log(`   - Admin: ${ADMIN_EMAIL}`);
console.log(`   - API: ${API_URL}`);

if (!PRODUCTS_ROOT_DIR || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("\n❌ ERROR CRÍTICO: Faltan variables en el archivo .env");
  process.exit(1);
}

if (!fs.existsSync(PRODUCTS_ROOT_DIR)) {
  console.error(
    `\n❌ ERROR: La carpeta de productos no existe: ${PRODUCTS_ROOT_DIR}`
  );
  process.exit(1);
}
// =================================================

// --- LISTAS Y MAPEOS ---

const BRAND_MAPPING = {
  nike: "Nike",
  adidas: "Adidas",
  puma: "Puma",
  asics: "Asics",
  newbalance: "New Balance",
  converse: "Converse",
  fila: "Fila",
  jordan: "Jordan",
  newera: "New Era",
  underarmour: "Under Armour",
  thenorthface: "The North Face",
};

const VIEW_KEYWORDS = [
  "frontal",
  "trasera",
  "lateral",
  "detalle",
  "estuche",
  "cremallera",
  "ambos",
  "logo",
  "logo-1",
  "logo-2",
  "suela",
  "interior",
  "footer",
  "precio",
  "desc",
  "des",
];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44"];

const CATEGORY_MAP = {
  complementos: "complementos",
  ropa: "ropa",
  zapatillas: "zapatillas",
};

const GENDER_MAP = {
  hombre: "hombre",
  mujer: "mujer",
  unisex: "unisex",
};

// --- FUNCIONES AUXILIARES ---

async function login() {
  try {
    console.log("\n🔐 Iniciando sesión como Admin...");
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    console.log("✅ Login correcto.");
    return response.data.token;
  } catch (error) {
    console.error("❌ Error en Login.");
    process.exit(1);
  }
}

function findProductFolders(dir, fileList = []) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return fileList;
  }

  const hasTxt = files.some((f) => f.endsWith(".txt"));
  const hasImg = files.some((f) => f.match(/\.(png|jpg|jpeg|webp)$/i));

  if (hasTxt && hasImg) {
    fileList.push(dir);
    return fileList;
  }

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    try {
      if (fs.statSync(filePath).isDirectory()) {
        findProductFolders(filePath, fileList);
      }
    } catch (err) {}
  });

  return fileList;
}

function formatName(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractMetadataFromPath(folderPath) {
  const relativePath = path.relative(PRODUCTS_ROOT_DIR, folderPath);
  const segments = relativePath.split(path.sep);

  let category = "complementos";
  let gender = "unisex";
  let brand = "Footer"; // Default
  let subCategory = "";

  const rawName = segments[segments.length - 1]; // Nombre de la carpeta del producto (ej: nikePeak)
  let modelName = formatName(rawName); // ej: Nike Peak

  segments.forEach((seg) => {
    const lower = seg.toLowerCase();
    const normalizedSeg = normalizeString(seg);

    // 1. Detectar Categoría
    if (CATEGORY_MAP[lower]) category = CATEGORY_MAP[lower];

    // 2. Detectar Género
    if (GENDER_MAP[lower]) gender = GENDER_MAP[lower];

    // 3. Detectar Marca por CARPETA
    if (BRAND_MAPPING[normalizedSeg]) {
      brand = BRAND_MAPPING[normalizedSeg];
    }

    // 4. Detectar Subcategoría
    if (
      [
        "camisetas",
        "sudaderas",
        "pantalones",
        "chaquetas",
        "mochilas",
        "guantes",
        "gorros",
      ].includes(lower)
    ) {
      subCategory = lower;
    }
  });

  // 5. ESTRATEGIA DE RESCATE PARA MARCA
  if (brand === "Footer") {
    const normalizedName = normalizeString(rawName);
    for (const key of Object.keys(BRAND_MAPPING)) {
      if (normalizedName.includes(key)) {
        brand = BRAND_MAPPING[key];
        break;
      }
    }
  }

  // --- NUEVO: CONCATENAR MARCA + MODELO ---
  // Evitamos redundancia. Si la marca ya está en el nombre (ej: "Nike Peak"), no ponemos "Nike Nike Peak".
  const brandNormalized = brand.toLowerCase();
  const modelNormalized = modelName.toLowerCase();

  if (!modelNormalized.includes(brandNormalized)) {
    // Si el nombre es "Speedcat" y la marca "Puma" -> "Puma Speedcat"
    modelName = `${brand} ${modelName}`;
  }
  // ---------------------------------------

  return { category, gender, brand, name: modelName, subCategory };
}

// --- PROCESAMIENTO DE PRODUCTO ---

async function processAndUploadProduct(folderPath, token) {
  try {
    const files = fs.readdirSync(folderPath);
    const meta = extractMetadataFromPath(folderPath);

    const form = new FormData();
    form.append("name", meta.name); // Ahora incluirá la marca
    form.append("category", meta.category);
    form.append("gender", meta.gender);
    form.append("brand", meta.brand);
    form.append("is_new", "true");
    if (meta.subCategory) form.append("sub_category", meta.subCategory);

    form.append("material", "Sintético");
    form.append("season", "todas");

    // Precio y Descripción
    let price = 49.99;
    let description = `Producto oficial ${meta.brand}. Modelo ${meta.name}.`;

    const txtFiles = files.filter((f) => f.endsWith(".txt"));

    for (const file of txtFiles) {
      const lowerFile = file.toLowerCase();
      if (
        lowerFile.match(/[\d,]+/) &&
        !lowerFile.includes("des") &&
        !lowerFile.includes("info")
      ) {
        const match = file.match(/(\d+[,.]?\d*)/);
        if (match) price = parseFloat(match[0].replace(",", "."));
      }
      if (
        lowerFile.includes("des") ||
        lowerFile.includes("info") ||
        lowerFile.includes("descripción")
      ) {
        try {
          const content = fs.readFileSync(path.join(folderPath, file), "utf-8");
          if (content && content.trim().length > 0)
            description = content.trim();
        } catch (err) {}
      }
    }

    form.append("price", price.toString());
    form.append("description", description);

    const imageFiles = files.filter(
      (f) => f.match(/\.(png|jpg|jpeg|webp)$/i) && !f.startsWith(".")
    );

    if (imageFiles.length === 0) {
      console.warn(`⚠️ ${meta.name}: Sin imágenes. Saltando.`);
      return;
    }

    const variants = [];
    const imageMetadata = [];

    imageFiles.forEach((file) => {
      const fileNameNoExt = path.parse(file).name.toLowerCase();
      if (fileNameNoExt.includes("footer") || fileNameNoExt === ".ds_store")
        return;

      let colorName = formatName(path.parse(file).name);

      if (VIEW_KEYWORDS.some((kw) => fileNameNoExt.includes(kw))) {
        colorName = "Estándar";
      }

      const filePath = path.join(folderPath, file);
      form.append("images", fs.createReadStream(filePath));

      imageMetadata.push({
        filename: file,
        color: colorName,
      });

      if (!variants.find((v) => v.color === colorName)) {
        const sizesToGenerate =
          meta.category === "zapatillas" ? SHOE_SIZES : CLOTHING_SIZES;

        if (meta.category === "complementos") {
          variants.push({
            color: colorName,
            size: "Talla Única",
            stock: Math.floor(Math.random() * 20) + 10,
            price: 0,
          });
        } else {
          sizesToGenerate.forEach((size) => {
            variants.push({
              color: colorName,
              size: size,
              stock: Math.floor(Math.random() * 15) + 10,
              price: 0,
            });
          });
        }
      }
    });

    form.append("variants", JSON.stringify(variants));
    form.append("imageMetadata", JSON.stringify(imageMetadata));

    const response = await axios.post(`${API_URL}/products`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log(
      `✅ [${meta.brand}] ${meta.name} -> Subido (ID: ${response.data.id})`
    );
  } catch (error) {
    console.error(`❌ Error subiendo: ${folderPath}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
    } else {
      console.error(`   Error Local: ${error.message}`);
    }
  }
}

async function main() {
  console.log("\n🚀 INICIANDO SEED MASIVO...");
  const token = await login();

  console.log("\n📂 Escaneando carpetas...");
  const productFolders = findProductFolders(PRODUCTS_ROOT_DIR);
  console.log(`🎯 Detectados ${productFolders.length} productos.\n`);

  let count = 0;
  for (const folder of productFolders) {
    count++;
    process.stdout.write(`[${count}/${productFolders.length}] `);
    await processAndUploadProduct(folder, token);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("\n✨ ¡TODO COMPLETADO! ✨");
}

main();
