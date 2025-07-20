require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const VINOS_TABLE = "tblEal1Pk1PNVUrtB";
const BODEGAS_TABLE = "tblpszSrXfrpvFEmu";
const ORGANOLEPTICA_TABLE = "tblXrhuVVKZZ0pfJB";
const DEBUG = process.env.DEBUG === "true";

// Debug
app.get('/api/debug', (req, res) => {
  res.json({
    DEBUG,
    AIRTABLE_API_KEY: AIRTABLE_API_KEY ? "✅ definida" : "❌ NO definida",
    BASE_ID,
    VINOS_TABLE,
    BODEGAS_TABLE
  });
});

// Test sin filtro
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
    res.status(500).json({ error: "No se pudo acceder a Airtable", detalle: error.response?.data || error.message });
  }
});

// Vino + bodega
app.get('/api/vino/:id', async (req, res) => {
  const vinoId = req.params.id;

  try {
    const vinoResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${VINOS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Vino} = '${vinoId}'`
      }
    });

    const vinoRecord = vinoResp.data.records[0];
    if (!vinoRecord) return res.status(404).json({ error: "Vino no encontrado" });

    const vino = vinoRecord.fields;
    const bodegaId = vino["ID Bodega"];

    const bodegaResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${BODEGAS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Bodega} = '${bodegaId}'`
      }
    });

    const bodegaRecord = bodegaResp.data.records[0];
    const bodega = bodegaRecord ? bodegaRecord.fields : {};

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
      console.error("🔴 ERROR DETECTADO en /api/vino/:id:", err.response?.data || err.message || err);
    }
    res.status(500).json({ error: "Error al consultar vino y bodega" });
  }
});

// Vino Legal
app.get('/api/vino-legal/:id', async (
