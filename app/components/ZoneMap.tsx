'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic Import Leaflet เพื่อป้องกันปัญหา SSR (Server-Side Rendering)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

export interface LocationZone {
  id: string;
  name: string;
  province: 'กรุงเทพมหานคร' | 'นนทบุรี' | 'ปทุมธานี' | 'นครนายก';
  lat: number;
  lng: number;
  riskLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  details: string;
  waterLevelDelta: string;
}

// พิกัดจุดเสี่ยงหลักใน 4 จังหวัด
const ZONE_LOCATIONS: LocationZone[] = [
  // กทม.
  { id: '1', name: 'เขตสายไหม (คลองหกวา)', province: 'กรุงเทพมหานคร', lat: 13.9142, lng: 100.6482, riskLevel: 'YELLOW', details: 'ระดับน้ำเพิ่มขึ้นช้าๆ เฝ้าระวังน้ำล้นตลิ่ง', waterLevelDelta: '+3 ซม.' },
  { id: '2', name: 'เขตดอนเมือง (ถนนวิภาวดีฯ)', province: 'กรุงเทพมหานคร', lat: 13.9130, lng: 100.6041, riskLevel: 'GREEN', details: 'การจราจรปกติ เร่งระบายน้ำต่อเนื่อง', waterLevelDelta: '0 ซม.' },
  { id: '3', name: 'เขตบางเขน (วงเวียนบางเขน)', province: 'กรุงเทพมหานคร', lat: 13.8745, lng: 100.5969, riskLevel: 'YELLOW', details: 'มีน้ำขังเล็กน้อยบริเวณวงเวียน', waterLevelDelta: '+2 ซม.' },

  // นนทบุรี
  { id: '4', name: 'ท่าน้ำนนทบุรี (แม่น้ำเจ้าพระยา)', province: 'นนทบุรี', lat: 13.8415, lng: 100.4912, riskLevel: 'ORANGE', details: 'น้ำหนุนสูงช่วงเย็น เฝ้าระวังระดับน้ำเจ้าพระยา', waterLevelDelta: '+12 ซม.' },
  { id: '5', name: 'ปากเกร็ด / คลองบ้านใหม่', province: 'นนทบุรี', lat: 13.9127, lng: 100.4981, riskLevel: 'YELLOW', details: 'ประตูระบายน้ำเปิดระบายออกแม่น้ำ', waterLevelDelta: '+5 ซม.' },
  { id: '6', name: 'ถนนแจ้งวัฒนะ (หน้าศาลปกครอง)', province: 'นนทบุรี', lat: 13.8902, lng: 100.5654, riskLevel: 'GREEN', details: 'รถผ่านได้ทุกช่องทาง', waterLevelDelta: '0 ซม.' },

  // ปทุมธานี
  { id: '7', name: 'รังสิต (ปตร.จุฬาลงกรณ์)', province: 'ปทุมธานี', lat: 13.9875, lng: 100.6158, riskLevel: 'ORANGE', details: 'ระดับน้ำในคลองรังสิตสูง เร่งสูบน้ำออก', waterLevelDelta: '+8 ซม.' },
  { id: '8', name: 'ลำลูกกา คลอง 4', province: 'ปทุมธานี', lat: 13.9312, lng: 100.6812, riskLevel: 'YELLOW', details: 'ถนนเลียบคลองมีน้ำขัง 10-15 ซม.', waterLevelDelta: '+4 ซม.' },

  // นครนายก
  { id: '9', name: 'อ.เมืองนครนายก (แม่น้ำนครนายก)', province: 'นครนายก', lat: 14.2069, lng: 101.2131, riskLevel: 'GREEN', details: 'การระบายน้ำมุ่งหน้าบางปะกงคล่องตัว', waterLevelDelta: '-2 ซม.' },
  // รังสิต คลอง 4 (ถนนรังสิต-นครนายก / คลองประยูรศักดิ์) เพิ่มเติม
  { 
    id: '10', 
    name: 'รังสิต คลอง 4 (ถนนรังสิต-นครนายก / คลองประยูรศักดิ์)', 
    province: 'ปทุมธานี', 
    lat: 13.9875, 
    lng: 100.6812, 
    riskLevel: 'YELLOW', 
    details: 'เฝ้าระวังระดับน้ำคลองรังสิต และน้ำรอการระบายบริเวณซอยเข้าชุมชน', 
    waterLevelDelta: '+5 ซม.' 
  },
];

export default function ZoneMap({ selectedProvince, searchQuery }: { selectedProvince: string; searchQuery: string }) {
  const [filteredZones, setFilteredZones] = useState<LocationZone[]>(ZONE_LOCATIONS);

  useEffect(() => {
    let result = ZONE_LOCATIONS;
    if (selectedProvince !== 'ALL') {
      result = result.filter(z => z.province === selectedProvince);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(z => 
        z.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        z.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredZones(result);
  }, [selectedProvince, searchQuery]);

  const getColor = (risk: string) => {
    switch (risk) {
      case 'RED': return '#ef4444';
      case 'ORANGE': return '#f97316';
      case 'YELLOW': return '#eab308';
      default: return '#22c55e';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-md flex items-center gap-2">
            🗺️ แผนผังแสดงความเสี่ยงโซนน้ำท่วม (Color-Coded Zoning Map)
          </h3>
          <p className="text-xs text-slate-400">ครอบคลุม กทม., นนทบุรี, ปทุมธานี, นครนายก</p>
        </div>
        
        {/* Legend บอกสัญลักษณ์สี */}
        <div className="hidden md:flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> ปกติ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> เฝ้าระวัง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> เสี่ยงสูง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> วิกฤต</span>
        </div>
      </div>

      {/* แผนที่ Interactive Leaflet Map */}
      <div className="h-[400px] w-full relative z-0">
        {/* ปรับ center เป็นพิกัดรังสิต คลอง 4 และเพิ่ม zoom เป็น 12-13 เพื่อให้เห็นชัดเจน */}
          <MapContainer 
            center={[13.9875, 100.6812]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {filteredZones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={12}
              pathOptions={{ fillColor: getColor(zone.riskLevel), color: '#fff', weight: 2, fillOpacity: 0.8 }}
            >
              <Popup>
                <div className="p-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{zone.province}</span>
                  <h4 className="font-bold text-sm text-slate-900">{zone.name}</h4>
                  <p className="text-xs text-slate-600 my-1">{zone.details}</p>
                  <span className="text-xs font-semibold text-blue-600">การเปลี่ยนแปลง (1 ชม.): {zone.waterLevelDelta}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}