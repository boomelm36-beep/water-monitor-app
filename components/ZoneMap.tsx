'use client';

import { useEffect, useState } from 'react';
// ✅ นำเข้า Component และ Hook จาก react-leaflet โดยตรง
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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
  keywords: string;
}

// 📍 รายชื่อหมุดความเสี่ยง
export const ZONE_LOCATIONS: LocationZone[] = [
  {
    id: 'p1',
    name: 'รังสิต คลอง 4 (ถนนเลียบคลองสี่ฝั่งตะวันออก)',
    province: 'ปทุมธานี',
    lat: 13.9885,
    lng: 100.6858,
    riskLevel: 'YELLOW',
    details: 'เฝ้าระวังระดับน้ำขังถนนเลียบคลองสี่ฝั่งตะวันออก และทางเข้าหมู่บ้าน',
    waterLevelDelta: '+5 ซม.',
    keywords: 'รังสิต คลอง 4 คลองสี่ เลียบคลอง4 เลียบคลองสี่ ฝั่งตะวันออก ปทุมธานี ลำลูกกา',
  },
  {
    id: 'p2',
    name: 'ประตูระบายน้ำจุฬาลงกรณ์ (คลองรังสิตฯ)',
    province: 'ปทุมธานี',
    lat: 13.9875,
    lng: 100.6158,
    riskLevel: 'ORANGE',
    details: 'เดินเครื่องสูบน้ำเต็มกำลัง เร่งดึงน้ำลงสู่แม่น้ำเจ้าพระยา',
    waterLevelDelta: '+8 ซม.',
    keywords: 'จุฬาลงกรณ์ รังสิต คลอง1 ตลาดรังสิต สะพานแดง ปทุมธานี',
  },
  {
    id: 'p3',
    name: 'ลำลูกกา คลอง 4 (ถนนเลียบคลอง 4)',
    province: 'ปทุมธานี',
    lat: 13.9312,
    lng: 100.6812,
    riskLevel: 'YELLOW',
    details: 'มีน้ำท่วมขังขอบทาง 10-15 ซม. สภาพการจราจรชะลอตัว',
    waterLevelDelta: '+4 ซม.',
    keywords: 'ลำลูกกา คลอง 4 คลองสี่ พฤกษา สายใต้ ปทุมธานี',
  },
  {
    id: 'b1',
    name: 'เขตสายไหม (ประตูระบายน้ำคลองหกวา)',
    province: 'กรุงเทพมหานคร',
    lat: 13.9142,
    lng: 100.6482,
    riskLevel: 'YELLOW',
    details: 'ระดับน้ำคลองหกวาเพิ่มขึ้นช้าๆ ยังต่ำกว่าระดับตลิ่ง',
    waterLevelDelta: '+3 ซม.',
    keywords: 'สายไหม คลองหกวา หกวา สุขาภิบาล5 กรุงเทพ กทม BKK',
  },
  {
    id: 'b2',
    name: 'เขตดอนเมือง (ถนนวิภาวดีรังสิต)',
    province: 'กรุงเทพมหานคร',
    lat: 13.9130,
    lng: 100.6041,
    riskLevel: 'GREEN',
    details: 'การจราจรปกติ เร่งระบายน้ำขังช่องทางขนาน',
    waterLevelDelta: '0 ซม.',
    keywords: 'ดอนเมือง วิภาวดี สนามบินดอนเมือง โทลล์เวย์ กรุงเทพ กทม',
  },
  {
    id: 'b3',
    name: 'เขตบางเขน (วงเวียนบางเขน / พหลโยธิน)',
    province: 'กรุงเทพมหานคร',
    lat: 13.8745,
    lng: 100.5969,
    riskLevel: 'YELLOW',
    details: 'มีน้ำขังรอการระบายเล็กน้อยบริเวณวงเวียน',
    waterLevelDelta: '+2 ซม.',
    keywords: 'บางเขน วงเวียนบางเขน พหลโยธิน รามอินทรา กรุงเทพ กทม',
  },
  {
    id: 'n1',
    name: 'ท่าน้ำนนทบุรี (แม่น้ำเจ้าพระยา)',
    province: 'นนทบุรี',
    lat: 13.8415,
    lng: 100.4912,
    riskLevel: 'ORANGE',
    details: 'น้ำเจ้าพระยาหนุนสูงช่วงเย็น เอ่อเข้าท่วมพื้นที่นอกคันกั้นน้ำ',
    waterLevelDelta: '+12 ซม.',
    keywords: 'ท่าน้ำนนท์ นนทบุรี พิบูลสงคราม เจ้าพระยา เมืองนนท์',
  },
  {
    id: 'n2',
    name: 'ปากเกร็ด / คลองบ้านใหม่',
    province: 'นนทบุรี',
    lat: 13.9127,
    lng: 100.4981,
    riskLevel: 'YELLOW',
    details: 'เฝ้าระวังระดับน้ำเอ่อล้นเข้าชุมชนริมคลอง',
    waterLevelDelta: '+5 ซม.',
    keywords: 'ปากเกร็ด แจ้งวัฒนะ นนทบุรี คลองบ้านใหม่',
  },
  {
    id: 'ny1',
    name: 'อ.เมืองนครนายก (แม่น้ำนครนายก)',
    province: 'นครนายก',
    lat: 14.2069,
    lng: 101.2131,
    riskLevel: 'GREEN',
    details: 'การระบายน้ำมุ่งหน้าบางปะกงยังทำได้ดี ไม่มีน้ำท่วมขัง',
    waterLevelDelta: '-2 ซม.',
    keywords: 'นครนายก เมืองนครนายก แม่น้ำนครนายก เขื่อนขุนด่าน',
  },
];

// 🛸 Component ควบคุมเลื่อนหน้าจอแผนที่
function MapFlyController({ zones }: { zones: LocationZone[] }) {
  const map = useMap(); // เรียกใช้ useMap ได้ตามปกติ

  useEffect(() => {
    if (zones && zones.length > 0) {
      const target = zones[0];
      const zoomLevel = zones.length === 1 ? 14 : 11;
      map.flyTo([target.lat, target.lng], zoomLevel, {
        duration: 1.2,
      });
    }
  }, [zones, map]);

  return null;
}

export default function ZoneMap({ selectedProvince, searchQuery }: { selectedProvince: string; searchQuery: string }) {
  const [filteredZones, setFilteredZones] = useState<LocationZone[]>(ZONE_LOCATIONS);

  useEffect(() => {
    let result = ZONE_LOCATIONS;

    if (selectedProvince !== 'ALL') {
      result = result.filter(z => z.province === selectedProvince);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(z =>
        z.name.toLowerCase().includes(q) ||
        z.details.toLowerCase().includes(q) ||
        z.province.toLowerCase().includes(q) ||
        z.keywords.toLowerCase().includes(q)
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
          <p className="text-xs text-slate-400">
            {filteredZones.length > 0 ? `พบหมุดสถานที่ ${filteredZones.length} จุด` : '❌ ไม่พบหมุดสถานที่ที่ค้นหา'}
          </p>
        </div>
        
        <div className="hidden md:flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> ปกติ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> เฝ้าระวัง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> เสี่ยงสูง</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> วิกฤต</span>
        </div>
      </div>

      <div className="h-[420px] w-full relative z-0">
        <MapContainer center={[13.9885, 100.6858]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          <MapFlyController zones={filteredZones} />

          {filteredZones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={14}
              pathOptions={{ fillColor: getColor(zone.riskLevel), color: '#ffffff', weight: 2.5, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{zone.province}</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-0.5">{zone.name}</h4>
                  <p className="text-xs text-slate-600 my-1.5">{zone.details}</p>
                  <div className="text-xs font-semibold text-blue-600 bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                    การเปลี่ยนแปลง (1 ชม.): {zone.waterLevelDelta}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}