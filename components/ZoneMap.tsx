'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icon สำหรับหมุดค้นหาพิกัดจริง
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface WaterStation {
  id?: number;
  station_name: string;
  water_level_m: number;
  bank_level_m: number;
  flow_status: string;
  province: string;
  lat: number;
  lng: number;
  zone_color?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

function MapController({ targetCoords, zoom = 14 }: { targetCoords: { lat: number; lng: number } | null; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (targetCoords) {
      map.flyTo([targetCoords.lat, targetCoords.lng], zoom, { duration: 1.5 });
    }
  }, [targetCoords, zoom, map]);

  return null;
}

export default function ZoneMap({
  selectedProvince,
  searchQuery,
  userLocation,
}: {
  selectedProvince: string;
  searchQuery: string;
  userLocation: { lat: number; lng: number } | null;
}) {
  const [stations, setStations] = useState<WaterStation[]>([]);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 1. ดึงข้อมูลสถานีวัดระดับน้ำจริงจาก API
  useEffect(() => {
    fetch('/api/water-summary')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data?.stations) {
          setStations(resData.data.stations);
        }
      })
      .catch((err) => console.error('Failed to load stations:', err));
  }, []);

  // 2. ค้นหาพิกัดจริงของ คลอง / แม่น้ำ / ประตูระบายน้ำ / สถานีสูบน้ำ จาก OpenStreetMap Nominatim
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '' || searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      setSearchedLocation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cleanQuery = searchQuery.trim();
        // เน้นคำค้นหาเจาะจงทางน้ำ
        const queryWithWater = cleanQuery.match(/(คลอง|แม่น้ำ|ประตูระบายน้ำ|ปตร|สถานีสูบน้ำ)/)
          ? `${cleanQuery} ประเทศไทย`
          : `คลอง ${cleanQuery} ประเทศไทย`;

        let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithWater)}&limit=1`);
        let data = await res.json();

        // หากค้นหาทางน้ำเจาะจงไม่เจอ ให้ค้นหาชื่อสถานที่ทั่วไปในไทย
        if (!data || data.length === 0) {
          res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${cleanQuery} ประเทศไทย`)}&limit=1`);
          data = await res.json();
        }

        if (data && data.length > 0) {
          setSearchedLocation({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
          });
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // กรองเฉพาะสถานีจริงตามจังหวัด หรือชื่อสายน้ำ
  const filteredStations = stations.filter((s) => {
    const matchesProvince = selectedProvince === 'ALL' || s.province === selectedProvince;
    if (!matchesProvince) return false;

    if (searchQuery && searchQuery.trim() !== '' && !searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.station_name.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getColor = (station: WaterStation) => {
    if (station.zone_color) return station.zone_color;
    if (station.water_level_m >= station.bank_level_m) return 'RED';
    if (station.water_level_m >= station.bank_level_m * 0.8) return 'ORANGE';
    if (station.water_level_m >= station.bank_level_m * 0.6) return 'YELLOW';
    return 'GREEN';
  };

  const getColorHex = (color: string) => {
    switch (color) {
      case 'RED': return '#ef4444';
      case 'ORANGE': return '#f97316';
      case 'YELLOW': return '#eab308';
      default: return '#22c55e';
    }
  };

  const targetCoords = userLocation
    ? userLocation
    : searchedLocation
    ? { lat: searchedLocation.lat, lng: searchedLocation.lng }
    : filteredStations.length > 0
    ? { lat: filteredStations[0].lat, lng: filteredStations[0].lng }
    : { lat: 13.9885, lng: 100.6858 };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-md flex items-center gap-2">
            🗺️ แผนผังระดับน้ำจริง (คลอง / แม่น้ำ / ประตูระบายน้ำ)
          </h3>
          <p className="text-xs text-slate-400">
            {isSearching
              ? '🔍 กำลังค้นหาตำแหน่งทางน้ำจริง...'
              : searchedLocation
              ? `📍 พิกัดทางน้ำ/จุดค้นหา: ${searchedLocation.displayName.split(',')[0]}`
              : userLocation
              ? '📍 แสดงพิกัดปัจจุบันจาก GPS ของคุณ'
              : `สถานีวัดน้ำจริงในระบบ: ${filteredStations.length} จุด`}
          </p>
        </div>
      </div>

      <div className="h-[420px] w-full relative z-0">
        <MapContainer center={[13.9885, 100.6858]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          <MapController targetCoords={targetCoords} />

          {/* หมุดปักพิกัดทางน้ำ / จุดที่ผู้ใช้ค้นหาจริง */}
          {searchedLocation && !userLocation && (
            <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchIcon}>
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="text-[10px] font-bold text-red-600 uppercase block">พิกัดทางน้ำ / จุดค้นหาจริง</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{searchedLocation.displayName.split(',')[0]}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{searchedLocation.displayName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* หมุด GPS ตำแหน่งปัจจุบัน */}
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={10}
              pathOptions={{ fillColor: '#2563eb', color: '#ffffff', weight: 3, fillOpacity: 0.95 }}
            >
              <Popup>
                <div className="p-1 text-center">
                  <h4 className="font-bold text-sm text-slate-900">📍 ตำแหน่งปัจจุบันของคุณ</h4>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* หมุดสถานีวัดระดับน้ำจริง */}
          {filteredStations.map((station, idx) => {
            const color = getColor(station);
            return (
              <CircleMarker
                key={idx}
                center={[station.lat, station.lng]}
                radius={13}
                pathOptions={{ fillColor: getColorHex(color), color: '#ffffff', weight: 2.5, fillOpacity: 0.85 }}
              >
                <Popup>
                  <div className="p-1 min-w-[190px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{station.province}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">{station.station_name}</h4>
                    <p className="text-xs text-slate-600 my-1">
                      ระดับน้ำจริง: <strong>{station.water_level_m} ม.</strong> (ตลิ่ง {station.bank_level_m} ม.)
                    </p>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 p-1.5 rounded-lg border border-blue-100 block mt-1">
                      สถานะการระบาย: {station.flow_status}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}