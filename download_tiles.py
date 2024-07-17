import os
import requests
import time

def download_tiles(bbox, zoom_levels, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    min_lat, min_lon, max_lat, max_lon = bbox

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    for zoom in zoom_levels:
        min_x = long2tile(min_lon, zoom)
        max_x = long2tile(max_lon, zoom)
        min_y = lat2tile(max_lat, zoom)
        max_y = lat2tile(min_lat, zoom)

        for x in range(min_x, max_x + 1):
            for y in range(min_y, max_y + 1):
                url = f'https://tile.openstreetmap.org/{zoom}/{x}/{y}.png'
                try:
                    response = requests.get(url, headers=headers)
                    response.raise_for_status()
                    tile_path = os.path.join(output_dir, f'{zoom}_{x}_{y}.png')
                    with open(tile_path, 'wb') as tile_file:
                        tile_file.write(response.content)
                    print(f'Downloaded {tile_path}')
                    time.sleep(1)  # Her talep arasına 1 saniye gecikme ekleyin
                except requests.exceptions.RequestException as e:
                    print(f'Failed to download {url}: {e}')

def long2tile(lon, zoom):
    return int((lon + 180.0) / 360.0 * (2 ** zoom))

def lat2tile(lat, zoom):
    lat_rad = lat * (3.141592653589793 / 180.0)
    return int((1.0 - (lat_rad / 3.141592653589793 + 1.0) / 2.0) * (2 ** zoom))

# Örnek kullanım
bbox = (36.0, 26.0, 42.0, 45.0) # Türkiye'nin genel sınırları
zoom_levels = range(4, 15) # İndirilmek istenen zoom seviyeleri
output_dir = 'osm_tiles'
download_tiles(bbox, zoom_levels, output_dir)
