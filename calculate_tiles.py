def calculate_tiles(bbox, zoom_levels):
    min_lat, min_lon, max_lat, max_lon = bbox
    total_tiles = 0

    for zoom in zoom_levels:
        min_x = long2tile(min_lon, zoom)
        max_x = long2tile(max_lon, zoom)
        min_y = lat2tile(max_lat, zoom)
        max_y = lat2tile(min_lat, zoom)

        num_tiles = (max_x - min_x + 1) * (max_y - min_y + 1)
        total_tiles += num_tiles
        print(f'Zoom level {zoom}: {num_tiles} tiles')

    print(f'Total tiles to download: {total_tiles}')
    return total_tiles

def long2tile(lon, zoom):
    return int((lon + 180.0) / 360.0 * (2 ** zoom))

def lat2tile(lat, zoom):
    lat_rad = lat * (3.141592653589793 / 180.0)
    return int((1.0 - (lat_rad / 3.141592653589793 + 1.0) / 2.0) * (2 ** zoom))

# Örnek kullanım
bbox = (36.0, 26.0, 42.0, 45.0) # Türkiye'nin genel sınırları
zoom_levels = range(4, 15) # İndirilmek istenen zoom seviyeleri
calculate_tiles(bbox, zoom_levels)

# Zoom level 4: 2 tiles
# Zoom level 5: 3 tiles
# Zoom level 6: 10 tiles
# Zoom level 7: 24 tiles
# Zoom level 8: 75 tiles
# Zoom level 9: 261 tiles
# Zoom level 10: 1008 tiles
# Zoom level 11: 3850 tiles
# Zoom level 12: 15042 tiles
# Zoom level 13: 59458 tiles
# Zoom level 14: 237284 tiles
# Total tiles to download: 317017