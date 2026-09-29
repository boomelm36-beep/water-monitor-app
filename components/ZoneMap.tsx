'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ปรับแต่ง Icon สำหรับหมุดค้นหาจริง
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface StationData {
  id?: number;
  station_name: string;
  water_level_m: number;
  bank_level_m: number;
  flow_status: string;
  province: string;
  lat: number;
  lng: number;
  zone_color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

// 🛸 Component ควบคุมให้แผนที่บิน (FlyTo) ไปยังหมุดค้นหาจริงหรือตำแหน่งผู้ใช้
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
  const [stations, setStations] = useState<StationData[]>([]);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 1. ดึงข้อมูลหมุดสถานีวัดน้ำจริงจาก Supabase ผ่าน API
  useEffect(() => {
    fetch('/api/water-summary')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data?.stations) {
          setStations(resData.data.stations);
        } else {
          // Fallback สถานีหลักถ้าระบบเพิ่งเริ่ม
          setStations([
            { station_name: 'รังสิต คลอง 4 (ถนนเลียบคลองสี่ฝั่งตะวันออก)', water_level_m: 1.45, bank_level_m: 2.50, flow_status: 'ปกติ', province: 'ปทุมธานี', lat: 13.9885, lng: 100.6858, zone_color: 'YELLOW' },
            { station_name: 'ปตร.จุฬาลงกรณ์', water_level_m: 1.85, bank_level_m: 2.20, flow_status: 'เร่งระบาย', province: 'ปทุมธานี', lat: 13.9875, lng: 100.6158, zone_color: 'ORANGE' },
            { station_name: 'ปตร.คลองหกวา (สายไหม)', water_level_m: 1.10, bank_level_m: 2.00, flow_status: 'ปกติ', province: 'กรุงเทพมหานคร', lat: 13.9142, lng: 100.6482, zone_color: 'GREEN' },
            { station_name: 'ท่าน้ำนนทบุรี', water_level_m: 2.10, bank_level_m: 2.30, flow_status: 'น้ำหนุน', province: 'นนทบุรี', lat: 13.8415, lng: 100.4912, zone_color: 'ORANGE' },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // 2. ค้นหาพิกัดจริงบนแผนที่โลกเมื่อมีการพิมพ์ Search (Nominatim Geocoding API)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '' || searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      setSearchedLocation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // ค้นหาพิกัดสถานที่ในไทยจริงจาก OpenStreetMap
        const query = encodeURIComponent(`${searchQuery} ประเทศไทย`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();

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
    }, 800); // Debounce ป้องกันการยิง API ถี่เกินไป

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // กรองหมุดสถานีตามจังหวัด
  const filteredStations = stations.filter((s) => {
    if (selectedProvince === 'ALL') return true;
    return s.province === selectedProvince;
  });

  const getColor = (risk: string) => {
    switch (risk) {
      case 'RED': return '#ef4444';
      case 'ORANGE': return '#f97316';
      case 'YELLOW': return '#eab308';
      default: return '#22c55e';
    }
  };

  // พิกัดเป้าหมายสำหรับการบินของแผนที่
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
            🗺️ แผนผังความเสี่ยงและพิกัดการค้นหาจริง (Real-Time Map)
          </h3>
          <p className="text-xs text-slate-400">
            {isSearching
              ? '🔍 กำลังค้นหาพิกัดสถานที่จริง...'
              : searchedLocation
              ? `📍 พบตำแหน่งจริง: ${searchedLocation.displayName.split(',')[0]}`
              : userLocation
              ? '📍 แสดงพิกัดปัจจุบันจาก GPS ของคุณ'
              : `สถานีติดตามน้ำในพื้นที่: ${filteredStations.length} จุด`}
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

          {/* 📍 หมุดค้นหาพิกัดจริงจากการพิมพ์ Search */}
          {searchedLocation && !userLocation && (
            <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchIcon}>
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="text-[10px] font-bold text-red-600 uppercase block">จุดที่คุณค้นหา</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{searchedLocation.displayName.split(',')[0]}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{searchedLocation.displayName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 📍 หมุด GPS ตำแหน่งปัจจุบัน */}
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

          {/* 🟢🟡🟠🔴 หมุดสถานีวัดน้ำจริง */}
          {filteredStations.map((station, idx) => (
            <CircleMarker
              key={idx}
              center={[station.lat, station.lng]}
              radius={13}
              pathOptions={{ fillColor: getColor(station.zone_color), color: '#ffffff', weight: 2.5, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{station.province}</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{station.station_name}</h4>
                  <p className="text-xs text-slate-600 my-1">ระดับน้ำ: {station.water_level_m} ม. (ตลิ่ง {station.bank_level_m} ม.)</p>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 p-1.5 rounded-lg border border-blue-100 block">
                    สถานะ: {station.flow_status}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}