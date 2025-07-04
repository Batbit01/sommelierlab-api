
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const VINOS_TABLE = "Vinos_Completa";
const BODEGAS_TABLE = "Bodegas_Completa_Con_ID";

app.get('/api/vino/:id', async (req, res) => {
  const vinoId = req.params.id;
  try {
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

    const bodegaResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${BODEGAS_TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `{ID Bodega} = "${bodegaId}"`
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
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Error al consultar Airtable" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
