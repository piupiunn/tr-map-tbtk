const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let geojson;
fetch("turkiye.geojson.json")
  .then((response) => response.json())
  .then((data) => {
    geojson = data;
    console.log("GeoJSON data loaded:", geojson);
    drawMap();
  })
  .catch((error) => console.error("Error loading GeoJSON:", error));

let isDragging = false;
let lastX, lastY;
let offsetX = 0,
  offsetY = 0;
let zoom = 1; // Başlangıç ölçeği

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    drawMap();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

canvas.addEventListener("wheel", (e) => {
  const zoomFactor = 1.1;
  if (e.deltaY < 0) {
    zoom *= zoomFactor;
  } else {
    zoom /= zoomFactor;
  }
  drawMap();
});

function drawMap() {
  if (!geojson) {
    console.error("GeoJSON data not loaded");
    return;
  }

  const features = geojson.features;

  // Find bounding box
  const [minX, minY, maxX, maxY] = getBoundingBox(features);
  console.log("Bounding box:", { minX, minY, maxX, maxY });

  // Calculate scale and translation
  const scaleX = canvas.width / (maxX - minX);
  const scaleY = canvas.height / (maxY - minY);
  const scale = Math.min(scaleX, scaleY) * zoom * 0.8; // Ölçek
  const translateX = (canvas.width - (maxX - minX) * scale) / 2 + offsetX;
  const translateY = (canvas.height - (maxY - minY) * scale) / 2 + offsetY;
  console.log("Scale and translation:", { scale, translateX, translateY });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(translateX, translateY);
  ctx.scale(scale, -scale);
  ctx.translate(-minX, -maxY);

  // Set stroke style for borders
  ctx.strokeStyle = "#000000"; // Siyah sınır çizgisi
  ctx.lineWidth = 0.5 / scale; // Ölçekle uyumlu çizgi genişliği

  features.forEach((feature) => {
    const { type, coordinates } = feature.geometry;
    ctx.beginPath();

    if (type === "Polygon") {
      coordinates.forEach((ring) => {
        ring.forEach(([x, y], index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
      });
    } else if (type === "MultiPolygon") {
      coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach(([x, y], index) => {
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
        });
      });
    }

    ctx.closePath();
    ctx.stroke();

    // Draw city name for Polygons only (for simplicity)
    if (type === "Polygon" || type === "MultiPolygon") {
      const [centroidX, centroidY] = getCentroid(feature.geometry);
      ctx.save();
      ctx.scale(1, -1); // Y eksenini ters çevirme
      ctx.font = `${20 / scale}px Arial`; // Font boyutu
      ctx.fillStyle = "#000000"; // Siyah renk
      ctx.textAlign = "center"; // Ortalanmış metin
      ctx.fillText(feature.properties.name, centroidX, -centroidY); // Yazı koordinatlarını uygun hale getirme
      ctx.restore();
    }
  });

  ctx.restore();
}

function getBoundingBox(features) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  features.forEach((feature) => {
    const { type, coordinates } = feature.geometry;

    if (type === "Polygon") {
      coordinates.forEach((ring) => {
        ring.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        });
      });
    } else if (type === "MultiPolygon") {
      coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          });
        });
      });
    }
  });
  return [minX, minY, maxX, maxY];
}

function getCentroid(geometry) {
  const { type, coordinates } = geometry;
  let x = 0,
    y = 0,
    n = 0;

  if (type === "Polygon") {
    coordinates.forEach((ring) => {
      ring.forEach((coord) => {
        x += coord[0];
        y += coord[1];
        n++;
      });
    });
  } else if (type === "MultiPolygon") {
    coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((coord) => {
          x += coord[0];
          y += coord[1];
          n++;
        });
      });
    });
  }

  return [x / n, y / n];
}

//
//
//
//
const map = document.getElementById("map");
const tileSize = 256; // Her karo boyutu 256x256 piksel

// Başlangıç ayarları
let zoom2 = 4;
let center = { lat: 39.9334, lng: 32.8597 }; // Türkiye'nin merkezine yakın

// Karoları yükleme
function loadTiles() {
  // Harita kapsayıcısını temizle
  map.innerHTML = "";

  // Haritanın ortasını piksellerde hesapla
  const centerPixelX = lonToX(center.lng, zoom2);
  const centerPixelY = latToY(center.lat, zoom2);

  // Haritanın ortasına göre karoları yerleştir
  const startX = Math.floor(centerPixelX - map.clientWidth / 2 / tileSize);
  const startY = Math.floor(centerPixelY - map.clientHeight / 2 / tileSize);
  const endX = Math.floor(centerPixelX + map.clientWidth / 2 / tileSize);
  const endY = Math.floor(centerPixelY + map.clientHeight / 2 / tileSize);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const tile = document.createElement("img");
      tile.src = `http://tile.stamen.com/toner/${zoom}/${x}/${y}.png`;
      tile.className = "tile";
      tile.style.left = `${(x - startX) * tileSize}px`;
      tile.style.top = `${(y - startY) * tileSize}px`;
      map.appendChild(tile);
    }
  }
}

// Enlemden piksellere dönüşüm
function latToY(lat, zoom) {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
    Math.pow(2, zoom) *
    tileSize;
  return y;
}

// Boylamdan piksellere dönüşüm
function lonToX(lon, zoom) {
  const x = ((lon + 180) / 360) * Math.pow(2, zoom) * tileSize;
  return x;
}

// Haritayı ilk yükleme
loadTiles();
