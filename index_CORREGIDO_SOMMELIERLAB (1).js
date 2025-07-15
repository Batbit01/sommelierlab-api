// index.js

const express = require('express');
const Airtable = require('airtable');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Ruta para comprobar que el servidor funciona
app.get('/', (req, res) => {
  res.send('API SommelierLab activa');
});

// Ruta para obtener info de un vino concreto
app.get('/api/vino/:id', async (req, res) => {
  const vinoId = req.params.id;

  try {
    const records = await base('Vinos_Completa').select({
      filterByFormula: `{ID Vino} = "${vinoId}"`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Vino no encontrado' });
    }

    const vino = records[0].fields;
    res.json(vino);
  } catch (error) {
    console.error('Error al buscar el vino:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor API escuchando en http://localhost:${port}`);
});
