<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SommelierLab - Ficha del Vino</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: sans-serif;
      padding: 2rem;
      background-color: #fefefe;
      color: #222;
      max-width: 600px;
      margin: auto;
    }
    .vino-ficha img {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: 1rem;
    }
    .vino-dato {
      margin-bottom: 1rem;
    }
    .vino-dato strong {
      display: inline-block;
      width: 100px;
    }
    #respuesta {
      margin-top: 2rem;
      font-style: italic;
      background: #f1f1f1;
      padding: 1rem;
      border-radius: 0.5rem;
    }
    #hablar {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.75rem 1.5rem;
      background: #800000;
      color: white;
      border: none;
      border-radius: 1rem;
      cursor: pointer;
    }
    .redes a {
      margin-right: 1rem;
      text-decoration: none;
      color: #800000;
    }
    #radar-container {
      margin-top: 3rem;
    }
    .switch-buttons {
      margin-bottom: 1rem;
    }
    .switch-buttons button {
      margin-right: 1rem;
      padding: 0.5rem 1rem;
      background: #eee;
      border: 1px solid #ccc;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  </style>
</head>

<body>

  <h1>Ficha del Vino</h1>

  <div class="vino-ficha">
    <img id="vinoImagen" src="" alt="Imagen del vino" />
    <div class="vino-dato"><strong>Nombre:</strong> <span id="vinoNombre">-</span></div>
    <div class="vino-dato"><strong>Tipo:</strong> <span id="vinoTipo">-</span></div>
    <div class="vino-dato"><strong>Origen:</strong> <span id="vinoOrigen">-</span></div>
    <div class="vino-dato"><strong>Variedad:</strong> <span id="vinoUva">-</span></div>
    <div class="vino-dato"><strong>Bodega:</strong> <span id="bodegaNombre">-</span></div>
    <div class="vino-dato redes" id="bodega-redes"></div>
  </div>

  <div id="respuesta">Cargando descripción del vino...</div>

  <button id="hablar">Hablar con el sommelier</button>

  <div id="radar-container">
    <h3>Perfil organoléptico</h3>
    <div class="switch-buttons">
      <button onclick="renderRadar('gustativo')">Gustativo</button>
      <button onclick="renderRadar('aromatico')">Aromático</button>
    </div>
    <canvas id="radarChart" width="400" height="400"></canvas>
  </div>

  <script>
    let radarChart;
    let organo = {};

    function renderRadar(tipo) {
      if (!organo || Object.keys(organo).length === 0) {
        console.warn("⚠️ Datos organolépticos no disponibles.");
        return;
      }

      const ctx = document.getElementById('radarChart').getContext('2d');
      let labels = [];
      let data = [];

      if (tipo === 'gustativo') {
        labels = ["Cuerpo", "Acidez", "Dulzor", "Taninos", "Frescura", "Mineralidad"];
        data = [
          organo["Cuerpo"] || 0,
          organo["Acidez"] || 0,
          organo["Dulzor"] || 0,
          organo["Taninos"] || 0,
          organo["Frescura"] || 0,
          organo["Mineralidad"] || 0
        ];
      } else {
        labels = ["Frutal", "Floral", "Especiado", "Tostado", "Herbáceo"];
        data = [
          organo["Frutal"] || 0,
          organo["Floral"] || 0,
          organo["Especiado"] || 0,
          organo["Tostado"] || 0,
          organo["Herbáceo"] || 0
        ];
      }

      if (radarChart) radarChart.destroy();

      radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: `Perfil ${tipo}`,
            data,
            fill: true,
            backgroundColor: "rgba(128,0,0,0.2)",
            borderColor: "rgba(128,0,0,1)",
            pointBackgroundColor: "rgba(128,0,0,1)"
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              min: 0,
              max: 10,
              ticks: {
                stepSize: 2
              }
            }
          }
        }
      });
    }

    document.addEventListener("DOMContentLoaded", async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const vinoId = urlParams.get("vino_id");

      if (!vinoId) {
        document.getElementById("respuesta").innerText = "No se especificó ningún vino.";
        return;
      }

      const apiBase = "https://sommelierlab-api-production.up.railway.app/api/vino";
      const organoBase = "https://sommelierlab-api-production.up.railway.app/api/organoleptica";
      const webhookBase = "https://n8n-production-cb18.up.railway.app/webhook/consultar-vino";

      try {
        const fichaResponse = await fetch(`${apiBase}/${vinoId}`);
        const fichaData = await fichaResponse.json();

        document.getElementById("vinoImagen").src =
          (fichaData.imagen && Array.isArray(fichaData.imagen) && fichaData.imagen[0]?.url)
          ? fichaData.imagen[0].url : "";
        document.getElementById("vinoNombre").innerText = fichaData.nombre;
        document.getElementById("vinoTipo").innerText = fichaData.tipo;
        document.getElementById("vinoUva").innerText = fichaData.variedad;
        document.getElementById("vinoOrigen").innerText = fichaData.origen;
        document.getElementById("bodegaNombre").innerText = fichaData.bodega.nombre;

        const redesHtml = [];
        if (fichaData.bodega
