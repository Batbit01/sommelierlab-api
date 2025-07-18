require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔐 Variables de entorno
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ✅ Usamos los IDs reales de las tablas
const VINOS_TABLE = "tblEal1Pk1PNVUrtB"; // ✅ CORREGIDO
const BODEGAS_TABLE = "tblpszSrXfrpvFEmu";

const DEBUG = process.env.DEBUG === "true";

// 🧪 Endpoint de depuración
app.get('/api/debug', (req, res) => {
  res.json({
    DEBUG,
    AIRTABLE_API_KEY: AIRTABLE_API_KEY ? "✅ definida" : "❌ NO definida",
    BASE_ID,
    VINOS_TABLE,
    BODEGAS_TABLE
  });
});

// 🧪 NUEVO: Test directo a la tabla de vinos sin filtro
app.get('/api/test-vinos', async (req, res) => {
  try {
    const vinosResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${VINOS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: { maxRecords: 5 }
    });

    const resultados = vinosResp.data.records.map(r => ({
      id: r.id,
      campos: r.fields
    }));

    res.json({ encontrados: resultados.length, registros: resultados });

  } catch (error) {
    console.error("❌ Error al leer vinos:", error.response?.data || error.message);
    res.status(500).json({
      error: "No se pudo acceder a Airtable",
      detalle: error.response?.data || error.message
    });
  }
});

// 🔍 Endpoint para obtener vino + bodega
app.get('/api/vino/:id', async (req, res) => {
  const vinoId = req.params.id;

  try {
    // ✅ Consultar vino por campo visible: "ID Vino"
    const vinoResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${VINOS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Vino} = "${vinoId}"`
      }
    });

    const vinoRecord = vinoResp.data.records[0];
    if (!vinoRecord) return res.status(404).json({ error: "Vino no encontrado" });

    const vino = vinoRecord.fields;
    const bodegaId = vino["ID Bodega"];

    // ✅ Consultar bodega (por nombre visible del campo)
    const bodegaResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${BODEGAS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Bodega} = "${bodegaId}"`
      }
    });

    const bodegaRecord = bodegaResp.data.records[0];
    const bodega = bodegaRecord ? bodegaRecord.fields : {};

    // 🧩 Respuesta combinada
    res.json({
      id: vino["ID Vino"],
      nombre: vino["Nombre del vino"],
      tipo: vino["Tipo"],
      variedad: vino["Variedad de uva"],
      origen: vino["Origen/DO"],
      imagen: vino["Imagen"],
      bodega: {
        nombre: bodega["Bodega"],
        web: bodega["Web URL"],
        facebook: bodega["Facebook URL"],
        instagram: bodega["Instagram URL"],
        twitter: bodega["Twitter/X URL"]
      }
    });

  } catch (err) {
    if (DEBUG) {
      console.error("🔴 ERROR DETECTADO:");
      console.error(err.response?.data || err.message || err);
      res.status(500).json({
        error: "Error al consultar Airtable",
        detalle: err.response?.data || err.message || err
      });
    } else {
      res.status(500).json({ error: "Error al consultar Airtable" });
    }
  }
});
// 🧾 Endpoint específico para QR1 Legal
app.get('/api/vino-legal/:id', async (req, res) => {
  const vinoId = req.params.id;

  try {
    // Buscar el vino por ID
    const vinoResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${VINOS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Vino} = "${vinoId}"`
      }
    });

    const vinoRecord = vinoResp.data.records[0];
    if (!vinoRecord) return res.status(404).json({ error: "Vino no encontrado" });

    const vino = vinoRecord.fields;

// ✅ Solo los campos legales
res.json({
  id: vino["ID Vino"],
  nombre: vino["Nombre del vino"],
  Imagen: vino["Imagen"],
  ingredientes: vino["Ingredientes"],
  valor_energetico_kcal: vino["Valor energético (kcal/100ml)"],
  valor_energetico_kj: vino["Valor energético (kJ/100ml)"],
  grasas_totales: vino["Grasas totales (g)"],
  grasas_saturadas: vino["Grasas saturadas (g)"],
  hidratos: vino["Hidratos de carbono (g)"],
  azucares: vino["Azúcares (g)"],
  proteinas: vino["Proteínas (g)"],
  sal: vino["Sal (g)"],
  graduacion_alcoholica: vino["Graduación alcohólica"],
  volumen_ml: vino["Volumen de botella"], // ✅ CORREGIDO A ESTE CAMPO
  alergenos: vino["Alérgenos"],
  idioma: vino["Idioma legal"] || "es",
  url_qr2: vino["QR2 (Sensitive)"]
});



  } catch (err) {
    console.error("❌ Error en /api/vino-legal:", err.message || err);
    res.status(500).json({ error: "Error al obtener los datos legales del vino" });
  }
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));

