'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RouteChecker from '@/components/RouteChecker';
import WaterChart from '@/components/WaterChart';

// Dynamic Import เพื่อป้องกันปัญหา Server-Side Rendering แผนที่ Leaflet
const ZoneMap = dynamic(() => import('@/components/ZoneMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm">
      🗺️ กำลังโหลดแผนผังแผนที่ความเสี่ยง...
    </div>
  ),
});

interface WaterStation {
  id: number;
  station_name: string;
  water_level_m: number;
  bank_level_m: number;
  flow_status: string;
  province: string;
  measured_at: string;
  zone_color?: string;
}

interface TrafficCondition {
  id: number;
  road_name: string;
  district: string;
  province: string;
  status: string;
  water_depth_cm: number;
  passable_status: string;
  updated_at: string;
}

interface RainfallData {
  id: number;
  location_name: string;
  rain_1h_mm: number;
  trend: string;
  measured_at: string;
}

interface RiskAlert {
  id: number;
  province: string;
  area_name: string;
  risk_level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  description: string;
  source_name: string;
  updated_at: string;
}

interface DashboardData {
  stations: WaterStation[];
  traffic: TrafficCondition[];
  rainfall: RainfallData[];
  alerts: RiskAlert[];
  updatedAt: string;
}

export default function WaterDashboard() {
  // ✅ ประกาศ State ภายในฟังก์ชัน Component ถูกต้องตามหลัก React
  const [mounted, setMounted] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // แก้อาการ Hydration Mismatch (Error #418) รอให้ Client Mount เสร็จก่อนค่อยแสดงเวลา
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLiveData = () => {
    setLoading(true);
    fetch('/api/water-summary')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setLiveData(resData.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch realtime data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 300000); // รีเฟรชทุก 5 นาที
    return () => clearInterval(interval);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่งปัจจุบัน (GPS)');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setSelectedProvince('ALL');
        setSearchQuery('📍 ตำแหน่งปัจจุบันของคุณ');
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิดอนุญาตสิทธิ์เข้าถึงตำแหน่ง (Location Access)');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const currentTime = liveData?.updatedAt
    ? new Date(liveData.updatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  const provinces = [
    { id: 'ALL', name: '🌐 ทั้งหมดทุกพื้นที่' },
    { id: 'ปทุมธานี', name: '🌊 โซนปทุมธานี - รังสิต' },
    { id: 'กรุงเทพมหานคร', name: '🏙️ โซนกรุงเทพฯ - สายไหม' },
    { id: 'นนทบุรี', name: '⛵ โซนนนทบุรี - เจ้าพระยา' },
    { id: 'นครนายก', name: '🏞️ โซนนครนายก - องครักษ์' },
  ];

  // กรองประกาศเตือนภัย
  const filteredAlerts = (liveData?.alerts || []).filter((a) => {
    if (selectedProvince === 'ALL' && (!searchQuery || searchQuery.trim() === '')) return true;
    if (selectedProvince !== 'ALL' && a.province !== selectedProvince) return false;
    if (searchQuery && !searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      const q = searchQuery.toLowerCase().trim();
      return (
        a.area_name.toLowerCase().includes(q) ||
        a.province.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // กรองสถานีวัดน้ำ
  const filteredStations = (liveData?.stations || []).filter((s) => {
    if (selectedProvince === 'ALL' && (!searchQuery || searchQuery.trim() === '')) return true;
    if (selectedProvince !== 'ALL' && s.province !== selectedProvince) return false;
    if (searchQuery && !searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.station_name.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // กรองสภาพการจราจร
  const filteredTraffic = (liveData?.traffic || []).filter((t) => {
    if (selectedProvince === 'ALL' && (!searchQuery || searchQuery.trim() === '')) return true;
    if (selectedProvince !== 'ALL' && t.province !== selectedProvince) return false;
    if (searchQuery && !searchQuery.includes('ตำแหน่งปัจจุบัน')) {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.road_name.toLowerCase().includes(q) ||
        t.province.toLowerCase().includes(q) ||
        t.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 🟢 Header / สรุปหัวข้อหลัก */}
      <header className="bg-blue-900 text-white py-6 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-blue-800 text-blue-200 text-xs rounded-full font-semibold mb-2">
              🛰️ ระบบติดตามและรายงานสถานการณ์น้ำเรียลไทม์
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">ศูนย์เฝ้าระวังน้ำและแจ้งเตือนภัยจราจร</h1>
            <p className="text-blue-200 text-sm mt-1" suppressHydrationWarning>
              ข้อมูลอัปเดตจากระบบ: {mounted ? currentTime : 'กำลังโหลด...'} น.
            </p>
          </div>
          <div className="bg-blue-800/80 backdrop-blur border border-blue-700 p-4 rounded-xl text-center min-w-[220px]">
            <span className="text-xs text-blue-200 block uppercase font-semibold">พื้นที่ติดตามปัจจุบัน</span>
            <span className="text-xl font-bold text-yellow-400 block my-1">
              {searchQuery ? `${searchQuery}` : selectedProvince === 'ALL' ? 'ทั้งหมดทุกพื้นที่' : selectedProvince}
            </span>
            <button 
              onClick={fetchLiveData} 
              className="text-xs text-blue-100 hover:text-white underline mt-1 block w-full text-center"
            >
              🔄 รีเฟรชข้อมูลสด
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* 🔍 ช่องค้นหาพื้นที่ + ปุ่ม GPS */}
        <section className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setUserLocation(null);
                }}
                placeholder="🔍 ค้นหาคลอง แม่น้ำ ถนน หรือพื้นที่..."
                className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setUserLocation(null);
                  }}
                  className="absolute right-3 top-2.5 text-xs bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  ล้างคำค้น
                </button>
              )}
            </div>

            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
            >
              <span>📍</span>
              <span>{isLocating ? 'กำลังค้นหาพิกัด...' : 'ใช้ตำแหน่งปัจจุบันของคุณ'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {provinces.map((prov) => (
              <button
                key={prov.id}
                onClick={() => {
                  setSelectedProvince(prov.id);
                  setUserLocation(null);
                  if (prov.id === 'ปทุมธานี') setSearchQuery('รังสิต');
                  else if (prov.id === 'กรุงเทพมหานคร') setSearchQuery('สายไหม');
                  else if (prov.id === 'นนทบุรี') setSearchQuery('นนทบุรี');
                  else if (prov.id === 'นครนายก') setSearchQuery('องครักษ์');
                  else setSearchQuery('');
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  selectedProvince === prov.id && !userLocation
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {prov.name}
              </button>
            ))}
          </div>
        </section>

        {/* 🗺️ แผนผังแผนที่แสดงความเสี่ยงจริง */}
        <ZoneMap selectedProvince={selectedProvince} searchQuery={searchQuery} userLocation={userLocation} />

        {/* 🚘 ระบบเช็กเส้นทางขับรถจริง (OSRM Engine) */}
        <RouteChecker />

        {/* 📊 กราฟระดับน้ำย้อนหลัง (Recharts) */}
        <WaterChart />

        {/* ⚡ สรุปสถานการณ์ด่วนภาพรวม */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            ⚡ สรุปสถานการณ์ด่วน (Quick Overview)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-xs text-slate-500 font-medium">คลองรังสิตประยูรศักดิ์</span>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {liveData?.stations?.[0]?.water_level_m ?? '1.45'} ม.
              </div>
              <div className="text-xs mt-2 flex items-center gap-1 font-semibold text-blue-700">
                <span>สถานะ: {liveData?.stations?.[0]?.flow_status ?? 'ปกติ'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <span className="text-xs text-slate-500 font-medium">ฝนสะสมล่าสุด</span>
              <div className="text-2xl font-bold text-cyan-900 mt-1">
                {liveData?.rainfall?.[0]?.rain_1h_mm ?? '0.0'} มม.
              </div>
              <div className="text-xs mt-2 text-slate-600 font-medium">
                แนวโน้ม: {liveData?.rainfall?.[0]?.trend ?? 'ไม่มีฝน'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs text-slate-500 font-medium">สภาพถนนโดยรวม</span>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {filteredTraffic.some(t => t.water_depth_cm > 20) ? '🔴 มีจุดปิดทาง' : '🟠 เฝ้าระวัง'}
              </div>
              <div className="text-xs mt-2 text-amber-700 font-medium">
                พบการรายงานน้ำขัง {filteredTraffic.filter(t => t.water_depth_cm > 0).length} จุด
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">ประตูระบายน้ำหลัก</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">เปิดระบาย</div>
              <div className="text-xs mt-2 text-emerald-700 font-medium">
                ปตร.จุฬาลงกรณ์ & คลองหกวา เดินเครื่องปกติ
              </div>
            </div>
          </div>
        </section>

        {/* 📑 รายงานสถานการณ์และประกาศเตือนภัยจากแหล่งข่าวจริงทั้งหมด */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">
              📊 ประกาศเตือนภัยและข้อมูลสภาวะน้ำจริง ({searchQuery || selectedProvince})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* 🚨 1. ประกาศเตือนภัยและพื้นที่เสี่ยงจริงทั้งหมด */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-md font-bold text-blue-900 flex items-center gap-2">
                    🚦 รายงานพื้นที่เสี่ยงและประกาศเตือนภัยภัยพิบัติจริงทั้งหมด
                  </h3>
                  <span className="text-[11px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">
                    อ้างอิง: ปภ. / กรมชลประทาน / ThaiWater
                  </span>
                </div>

                {loading ? (
                  <div className="p-4 text-xs text-slate-400 animate-pulse text-center">
                    กำลังดึงข้อมูลรายงานพื้นที่เสี่ยงจริงจากศูนย์เตือนภัย...
                  </div>
                ) : filteredAlerts.length > 0 ? (
                  <ul className="space-y-3 text-sm text-slate-700">
                    {filteredAlerts.map((alertItem) => {
                      const riskBadge = 
                        alertItem.risk_level === 'RED' 
                          ? { symbol: '🔴', color: 'text-red-700 bg-red-50 border-red-200', text: 'วิกฤต/ปิดการจราจร' }
                          : alertItem.risk_level === 'ORANGE'
                          ? { symbol: '🟠', color: 'text-orange-700 bg-orange-50 border-orange-200', text: 'เสี่ยงสูง/เอ่อล้น' }
                          : { symbol: '🟡', color: 'text-amber-700 bg-amber-50 border-amber-200', text: 'เฝ้าระวัง' };

                      return (
                        <li key={alertItem.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{riskBadge.symbol}</span>
                              <span>{alertItem.province} / {alertItem.area_name}:</span>
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${riskBadge.color}`}>
                              {riskBadge.text}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 pl-5 leading-relaxed">
                            {alertItem.description}
                          </p>
                          <div className="text-[10px] text-slate-400 pl-5 pt-1">
                            แหล่งอ้างอิง: {alertItem.source_name} • อัปเดตเมื่อ: {new Date(alertItem.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center border border-emerald-200">
                    🟢 ไม่พบรายงานประกาศเตือนภัยระดับวิกฤตในเขตพื้นที่ที่เลือกในขณะนี้ สภาวะน้ำและเส้นทางจราจรอยู่ในเกณฑ์เฝ้าระวังปกติ
                  </div>
                )}
              </div>

              {/* 2. ตารางระดับน้ำทุกสถานีในพื้นที่ */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-md font-bold text-blue-900 mb-4">🌧️ ตารางระดับน้ำและสถานีวัดจริงทั้งหมด</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">สถานี / คลอง</th>
                        <th className="p-3">ระดับปัจจุบัน</th>
                        <th className="p-3">ระดับตลิ่ง</th>
                        <th className="p-3">จังหวัด</th>
                        <th className="p-3 rounded-r-lg">สถานะการระบาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-xs text-slate-400 animate-pulse">กำลังดึงข้อมูลสถานีจริงจากระบบ...</td>
                        </tr>
                      ) : filteredStations.length > 0 ? (
                        filteredStations.map((st) => {
                          const isOverflow = st.water_level_m >= st.bank_level_m;
                          return (
                            <tr key={st.id} className={isOverflow ? 'bg-red-50/50' : ''}>
                              <td className="p-3 font-medium text-slate-900">{st.station_name}</td>
                              <td className={`p-3 font-bold ${isOverflow ? 'text-red-600' : 'text-blue-900'}`}>
                                {st.water_level_m} ม.
                              </td>
                              <td className="p-3 text-slate-500">{st.bank_level_m} ม.</td>
                              <td className="p-3 text-slate-600">{st.province}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                  isOverflow ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {st.flow_status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-xs text-slate-400">ไม่พบสถานีวัดน้ำในเงื่อนไขการค้นหานี้</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. สถานะเส้นทางจราจรทั้งหมดในโซน */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">🚗 สถานะเส้นทางจราจรทั้งหมดในพื้นที่</h3>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-slate-400 animate-pulse">กำลังดึงข้อมูลเส้นทางการจราจร...</p>
                  ) : filteredTraffic.length > 0 ? (
                    filteredTraffic.map((tf) => (
                      <div key={tf.id} className={`p-3.5 rounded-xl border ${
                        tf.water_depth_cm > 20 ? 'border-red-200 bg-red-50/60' :
                        tf.water_depth_cm > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-green-200 bg-green-50/40'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800 text-sm">📍 {tf.road_name} ({tf.district} - {tf.province})</span>
                          <span className={`px-2 py-0.5 text-xs rounded font-bold ${
                            tf.water_depth_cm > 20 ? 'bg-red-100 text-red-800' :
                            tf.water_depth_cm > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {tf.status} {tf.water_depth_cm > 0 ? `(น้ำขัง ${tf.water_depth_cm} ซม.)` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">สถานะการสัญจร: {tf.passable_status}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-xs text-center">
                      ไม่มีการรายงานอุปสรรคน้ำท่วมขังบนเส้นทางจราจรหลักในเขตพื้นที่นี้
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* คอลัมน์ขวา: ข้อมูลแหล่งอ้างอิงและการคาดการณ์ */}
            <div className="space-y-6">

              {/* เส้นทางเลี่ยงแนะนำ */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">🛣️ เส้นทางเลี่ยงแนะนำ</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg">
                    <strong>✅ เส้นทางแนะนำ:</strong> ใช้ถนนวิภาวดีรังสิต หรือทางยกระดับอุตราภิมุข (โทลล์เวย์) สภาพปกติ
                  </div>
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
                    <strong>❌ เส้นทางควรระวัง:</strong> ถนนรังสิต-นครนายก ช่วงองครักษ์ และถนนรอบท่าน้ำนนทบุรีช่วงน้ำหนุน
                  </div>
                </div>
              </div>

              {/* ข้อมูลการดึงข้อมูลสดจากแหล่งทางการ */}
              <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-500 space-y-1.5">
                <p className="font-bold text-slate-700">📚 ระบบดึงข้อมูลสดอัปเดตตรงจาก:</p>
                <p>• กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)</p>
                <p>• คลังข้อมูลน้ำแห่งชาติ (ThaiWater Public API)</p>
                <p>• กรมชลประทาน & สำนักการระบายน้ำ กทม.</p>
                <p>• ดาวเทียมตรวจอากาศ Open-Meteo Weather API</p>
                <p>• OpenStreetMap Nominatim & OSRM Engine</p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}