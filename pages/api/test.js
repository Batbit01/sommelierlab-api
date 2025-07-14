// pages/api/test.js
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const records = await base('Vinos_Completa').select({ maxRecords: 1 }).firstPage();
    if (records.length === 0) {
      return res.status(404).json({ error: "No se encontraron vinos" });
    }

    const vino = records[0].fields;
    return res.status(200).json({ mensaje: "¡Conexión exitosa!", vino });
  } catch (error) {
    console.error("Error accediendo a Airtable:", error);
    return res.status(500).json({ error: "Error accediendo a Airtable", detalle: error.message });
  }
}
