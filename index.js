require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔐 Variables de entorno
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// ✅ Usamos los IDs de tabla reales
const VINOS_TABLE = "tblEa1iPklRWUtBs";
const BODEGAS_TABLE = "tbltRCcG3vT6lVnAY";

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

// 🔍 Endpoint para obtener vino + bodega
app.get('/api/vino/:id', async (req, res) => {
  const vinoId = req.params.id;

  try {
    // ✅ Consultar vino usando el ID INTERNO del campo "Identificación Vino"
    const vinoResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${VINOS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{fldBoV1coyvYfCMaO9} = "${vinoId}"`
      }
    });

    const vinoRecord = vinoResp.data.records[0];
    if (!vinoRecord) return res.status(404).json({ error: "Vino no encontrado" });

    const vino = vinoRecord.fields;
    const bodegaId = vino["ID Bodega"];

    // ✅ Consultar bodega usando ID INTERNO si fuera necesario (por ahora se mantiene por nombre, si es estable)
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
      id: vino["Identificación Vino"],
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

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));


