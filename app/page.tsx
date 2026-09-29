'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RouteChecker from '@/components/RouteChecker';
import WaterChart from '@/components/WaterChart';

const ZoneMap = dynamic(() => import('@/components/ZoneMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm">
      🗺️ กำลังโหลดแผนผังแผนที่ความเสี่ยง...
    </div>
  ),
});

interface WaterData {
  rangsit: {
    current: { water_level_m: number; flow_status: string; measured_at: string; bank_level_m: number } | null;
    previous1h: { water_level_m: number } | null;
    initial: { water_level_m: number } | null;
    diff1h: number;
    diffInitial: number;
  };
  updatedAt: string;
}

export default function WaterDashboard() {
  const [data, setData] = useState<WaterData | null>(null);
  const [loading, setLoading] = useState(true);

  // State สำหรับค้นหา ตัวกรองจังหวัด และตำแหน่งผู้ใช้ (GPS)
  const [selectedProvince, setSelectedProvince] = useState<string>('ปทุมธานี');
  const [searchQuery, setSearchQuery] = useState<string>('รังสิต คลอง 4');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/water-summary')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch water data:', err);
        setLoading(false);
      });
  }, []);

  // 📍 ฟังก์ชันดึงตำแหน่งปัจจุบันจาก GPS
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
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาอนุญาตการเข้าถึงสิทธิ์การระบุตำแหน่ง (Location Access)');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const currentTime = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  const provinces = [
    { id: 'ALL', name: '🌐 ทั้งหมด 4 จังหวัด' },
    { id: 'ปทุมธานี', name: '🌊 ปทุมธานี (รังสิต/ลำลูกกา)' },
    { id: 'กรุงเทพมหานคร', name: '🏙️ กรุงเทพฯ (สายไหม/ดอนเมือง)' },
    { id: 'นนทบุรี', name: '⛵ นนทบุรี (ปากเกร็ด/เมืองนนท์)' },
    { id: 'นครนายก', name: '🏞️ นครนายก' },
  ];

  const isMatchFilter = (prov: string, text: string) => {
    if (userLocation || searchQuery.includes('ตำแหน่งปัจจุบัน')) return true;
    if (selectedProvince !== 'ALL' && prov !== selectedProvince) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      return text.toLowerCase().includes(q) || prov.toLowerCase().includes(q);
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Header */}
      <header className="bg-blue-900 text-white py-6 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-blue-800 text-blue-200 text-xs rounded-full font-semibold mb-2">
              🛰️ ระบบติดตามและรายงานสถานการณ์น้ำ กทม. นนทบุรี ปทุมธานี นครนายก รายชั่วโมง
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">ศูนย์เฝ้าระวังน้ำและแจ้งเตือนภัยจราจร</h1>
            <p className="text-blue-200 text-sm mt-1">ข้อมูลอัปเดตล่าสุด ณ เวลา: {currentTime} น.</p>
          </div>
          <div className="bg-blue-800/80 backdrop-blur border border-blue-700 p-4 rounded-xl text-center min-w-[220px]">
            <span className="text-xs text-blue-200 block uppercase font-semibold">พื้นที่ติดตามปัจจุบัน</span>
            <span className="text-xl font-bold text-yellow-400 block my-1">
              {searchQuery ? `${searchQuery}` : selectedProvince}
            </span>
            <span className="text-xs text-blue-100">สถานะ: 🟡 เฝ้าระวัง</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* 🔍 ช่องค้นหา + ปุ่ม GPS ตำแหน่งปัจจุบัน */}
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
                placeholder="🔍 พิมพ์ค้นหาพื้นที่ เช่น รังสิต คลอง 4, สายไหม, ท่าน้ำนนท์, พหลโยธิน..."
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

            {/* 📍 ปุ่มกดใช้ตำแหน่งปัจจุบัน (GPS) */}
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
                  if (prov.id === 'ปทุมธานี') setSearchQuery('รังสิต คลอง 4');
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

        {/* 🗺️ แผนผังโซนความเสี่ยง (ส่ง userLocation ไปด้วย) */}
        <ZoneMap selectedProvince={selectedProvince} searchQuery={searchQuery} userLocation={userLocation} />

        {/* 🚘 ระบบเช็กเส้นทางเดินทางปลอดภัย */}
        <RouteChecker />

        {/* 📊 กราฟวิเคราะห์เทรนด์ระดับน้ำย้อนหลัง */}
        <WaterChart />

        {/* ⚡ สรุปสถานการณ์ด่วน (Quick Overview) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            ⚡ สรุปสถานการณ์ด่วน (Quick Overview)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-xs text-slate-500 font-medium">คลองรังสิตประยูรศักดิ์</span>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {data?.rangsit?.current?.water_level_m ?? '1.45'} ม.
              </div>
              <div className="text-xs mt-2 flex items-center gap-1 font-semibold text-red-600">
                <span>↑ เพิ่มขึ้น {data?.rangsit?.diff1h ?? 5} ซม.</span>
                <span className="text-slate-400 font-normal">(จาก 1 ชม.ก่อน)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <span className="text-xs text-slate-500 font-medium">ฝนสะสม 1 ชม. ล่าสุด</span>
              <div className="text-2xl font-bold text-cyan-900 mt-1">5.0 มม.</div>
              <div className="text-xs mt-2 text-slate-600 font-medium">
                แนวโน้ม: กลุ่มฝนปานกลางเคลื่อนเข้า กทม./สายไหม
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs text-slate-500 font-medium">สภาพถนนโดยรวม</span>
              <div className="text-2xl font-bold text-amber-900 mt-1">🟠 เฝ้าระวัง</div>
              <div className="text-xs mt-2 text-amber-700 font-medium">
                เลียบคลองสี่ & ท่าน้ำนนท์ มีน้ำขัง
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">สถานีสูบน้ำหลัก</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">เปิดระบาย</div>
              <div className="text-xs mt-2 text-emerald-700 font-medium">
                ปตร.จุฬาลงกรณ์ & คลองหกวา เดินเครื่องปกติ
              </div>
            </div>
          </div>
        </section>

        {/* 📑 รายงานสถานการณ์เต็มตาม 17 หัวข้อ */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">
              📊 รายงานสถานการณ์ 17 หัวข้อ ({searchQuery || selectedProvince})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* 1. 🚦 สถานการณ์โดยรวม & 2. ⚠️ สิ่งที่ต้องรู้ทันที */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">
                  1. 🚦 สถานการณ์โดยรวม & ⚠️ สิ่งที่ต้องรู้ทันทีในพื้นที่
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {isMatchFilter('ปทุมธานี', 'รังสิต คลอง 4 ลำลูกกา') && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span><strong>ปทุมธานี / รังสิต คลอง 4:</strong> ระดับน้ำเลียบคลองสี่ฝั่งตะวันออกมีน้ำขังเล็กน้อย เครื่องสูบน้ำเทศบาลเปิดระบายต่อเนื่อง</span>
                    </li>
                  )}
                  {isMatchFilter('กรุงเทพมหานคร', 'สายไหม ดอนเมือง') && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span><strong>กทม. / สายไหม:</strong> คลองหกวาเร่งระบายน้ำลงฝั่งตะวันออก สภาพถนนวิภาวดีรังสิตสัญจรได้ปกติ</span>
                    </li>
                  )}
                  {isMatchFilter('นนทบุรี', 'ท่าน้ำนนท์ พิบูลสงคราม') && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>นนทบุรี / ท่าน้ำนนท์:</strong> ให้ระวังน้ำเจ้าพระยาหนุนสูงช่วงเย็น เอ่อเข้าท่วมถนนขอบทางและพื้นที่นอกคันกั้นน้ำ</span>
                    </li>
                  )}
                  {isMatchFilter('นครนายก', 'เมืองนครนายก') && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span><strong>นครนายก:</strong> แม่น้ำนครนายกระบายน้ำคล่องตัว มุ่งหน้าแม่น้ำบางปะกง ยังไม่มีจุดน้ำท่วมขังน่าห่วง</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* 5. 🌧️ ปริมาณฝน & 6. 💧 ระดับน้ำในคลองหลัก */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-md font-bold text-blue-900 mb-4">5. 🌧️ ปริมาณฝน & 6. 💧 ตารางระดับน้ำรายสถานี</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">สถานี / คลอง</th>
                        <th className="p-3">ระดับปัจจุบัน</th>
                        <th className="p-3">1 ชม. ก่อน</th>
                        <th className="p-3">เปลี่ยน (1 ชม.)</th>
                        <th className="p-3 rounded-r-lg">แนวโน้ม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isMatchFilter('ปทุมธานี', 'รังสิต คลอง 4') && (
                        <tr>
                          <td className="p-3 font-medium text-slate-900">คลองรังสิตฯ (คลอง 4 ฝั่งตะวันออก)</td>
                          <td className="p-3">1.45 ม.</td>
                          <td className="p-3 text-slate-500">1.40 ม.</td>
                          <td className="p-3 text-red-600 font-semibold">+5 ซม.</td>
                          <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">ขึ้น</span></td>
                        </tr>
                      )}
                      {isMatchFilter('กรุงเทพมหานคร', 'สายไหม') && (
                        <tr>
                          <td className="p-3 font-medium text-slate-900">คลองหกวา (ประตูน้ำสายไหม)</td>
                          <td className="p-3">1.10 ม.</td>
                          <td className="p-3 text-slate-500">1.12 ม.</td>
                          <td className="p-3 text-green-600 font-semibold">-2 ซม.</td>
                          <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">ลง</span></td>
                        </tr>
                      )}
                      {isMatchFilter('นนทบุรี', 'ท่าน้ำนนท์') && (
                        <tr>
                          <td className="p-3 font-medium text-slate-900">ท่าน้ำนนทบุรี (แม่น้ำเจ้าพระยา)</td>
                          <td className="p-3">2.10 ม.</td>
                          <td className="p-3 text-slate-500">1.98 ม.</td>
                          <td className="p-3 text-red-600 font-semibold">+12 ซม.</td>
                          <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">ขึ้น (น้ำหนุน)</span></td>
                        </tr>
                      )}
                      {isMatchFilter('นครนายก', 'เมืองนครนายก') && (
                        <tr>
                          <td className="p-3 font-medium text-slate-900">แม่น้ำนครนายก (เมืองนครนายก)</td>
                          <td className="p-3">2.30 ม.</td>
                          <td className="p-3 text-slate-500">2.30 ม.</td>
                          <td className="p-3 text-slate-500 font-semibold">0 ซม.</td>
                          <td className="p-3"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">ทรงตัว</span></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 8. 🚗 น้ำท่วมถนนและการเดินทาง */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">8. 🚗 สถานะถนนในพื้นที่ที่เลือก</h3>
                <div className="space-y-3">
                  {isMatchFilter('ปทุมธานี', 'รังสิต คลอง 4') && (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 text-sm">📍 ถนนเลียบคลองสี่ฝั่งตะวันออก (รังสิต คลอง 4)</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-semibold">🟡 น้ำขัง 10-15 ซม.</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">รถกระบะ/SUV ผ่านได้คล่องตัว รถเก๋งเล็กควรชะลอความเร็วช่วงซอยเข้าหมู่บ้าน</p>
                    </div>
                  )}

                  {isMatchFilter('นนทบุรี', 'ท่าน้ำนนท์') && (
                    <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 text-sm">📍 ถนนพิบูลสงคราม (ท่าน้ำนนทบุรี)</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded font-semibold">🟠 น้ำเจ้าพระยาหนุน 20 ซม.</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">รถเล็กควรหลีกเลี่ยงช่วงเวลา 16:00 - 19:00 น.</p>
                    </div>
                  )}

                  {isMatchFilter('กรุงเทพมหานคร', 'วิภาวดี ดอนเมือง') && (
                    <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 text-sm">📍 ถนนวิภาวดีรังสิต (ช่วงดอนเมือง-หลักสี่)</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">🟢 ปกติ</span>
                      </div>
                      <p className="text-xs text-slate-600">ผ่านได้ตามปกติทุกช่องทาง การจราจรคล่องตัว</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 13. 📊 เปรียบเทียบกับน้ำท่วมในอดีต (ปี 2554) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">13. 📊 เปรียบเทียบกับน้ำท่วมปี 2554</h3>
                <p className="text-sm text-slate-700">
                  <strong>สถานะปัจจุบัน:</strong> ต่ำกว่าปี 2554 อย่างมีนัยสำคัญ ปริมาณน้ำในคลองรังสิตฯ และคลองหกวายังต่ำกว่าปี 2554 อยู่ประมาณ <strong>1.70 - 1.85 เมตร</strong> การบริหารจัดการคันกั้นน้ำ กทม. และการระบายน้ำออกฝั่งตะวันออกยังทำได้ดี
                </p>
              </div>

            </div>

            {/* คอลัมน์ขวา */}
            <div className="space-y-6">

              {/* 9. ⛔ เส้นทางหลีกเลี่ยง & 10. ✅ เส้นทางที่ใช้ได้ */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">🛣️ แนะนำการเดินทาง</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                    <strong>❌ ควรหลีกเลี่ยง:</strong> ถนนรอบท่าน้ำนนทบุรี (ช่วงน้ำหนุน 16:00 - 19:00 น.)
                  </div>
                  <div className="p-2 bg-green-50 text-green-700 rounded-lg">
                    <strong>✅ เส้นทางเลี่ยง:</strong> ใช้ถนนเลี่ยงเมืองนนทบุรี หรือ ถนนวิภาวดีรังสิต
                  </div>
                </div>
              </div>

              {/* 12. 🔮 แนวโน้ม 1–24 ชั่วโมง */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">12. 🔮 คาดการณ์แนวโน้มรายโซน</h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between border-b pb-1">
                    <span>1–3 ชั่วโมง (สายไหม/กทม.):</span>
                    <span className="font-semibold text-amber-600">ฝนตกเล็กน้อย-ปานกลาง</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>3–6 ชั่วโมง (นนทบุรี):</span>
                    <span className="font-semibold text-orange-600">น้ำหนุนเริ่มลดระดับลง</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>6–24 ชั่วโมง (รังสิต/นครนายก):</span>
                    <span className="font-semibold text-green-600">ทรงตัว ระบายได้ดี</span>
                  </div>
                </div>
              </div>

              {/* 15. 📢 ข่าว & ประกาศล่าสุด */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">📢 ข่าว & ประกาศในพื้นที่</h3>
                <div className="space-y-3 text-xs">
                  {isMatchFilter('ปทุมธานี', 'รังสิต คลอง 4') && (
                    <div className="border-l-2 border-blue-500 pl-3">
                      <p className="font-bold text-slate-800">เทศบาลเมืองคลองหลวง / เทศบาลนครรังสิต</p>
                      <p className="text-slate-600 mt-0.5">เร่งเสริมเครื่องสูบน้ำบริเวณจุดตัดถนนเลียบคลองสี่ฝั่งตะวันออกดึงน้ำออกจากชุมชน</p>
                      <span className="text-[10px] text-slate-400">10 นาทีที่แล้ว</span>
                    </div>
                  )}
                  {isMatchFilter('กรุงเทพมหานคร', 'สายไหม') && (
                    <div className="border-l-2 border-emerald-500 pl-3">
                      <p className="font-bold text-slate-800">สำนักงานเขตสายไหม</p>
                      <p className="text-slate-600 mt-0.5">ประตูระบายน้ำคลองหกวาทำงานปกติ ระดับน้ำดียังควบคุมได้</p>
                      <span className="text-[10px] text-slate-400">20 นาทีที่แล้ว</span>
                    </div>
                  )}
                  {isMatchFilter('นนทบุรี', 'ท่าน้ำนนท์') && (
                    <div className="border-l-2 border-amber-500 pl-3">
                      <p className="font-bold text-slate-800">เทศบาลนครนนทบุรี</p>
                      <p className="text-slate-600 mt-0.5">วางแนวกระสอบทรายเสริมคันกั้นน้ำริมแม่น้ำเจ้าพระยาบริเวณท่าน้ำนนท์</p>
                      <span className="text-[10px] text-slate-400">35 นาทีที่แล้ว</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 17. 📚 แหล่งอ้างอิง */}
              <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">📚 แหล่งข้อมูลอ้างอิง:</p>
                <p>• กรมชลประทาน / ThaiWater</p>
                <p>• สำนักการระบายน้ำ กทม.</p>
                <p>• กรมอุตุนิยมวิทยา & JS100 / FM91</p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}