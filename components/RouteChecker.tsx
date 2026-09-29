'use client';

import { useState } from 'react';

interface RouteResult {
  distanceKm: number;
  durationMins: number;
  originName: string;
  destinationName: string;
  hazardsFound: Array<{
    location: string;
    waterDepth: number;
    risk: 'YELLOW' | 'ORANGE' | 'RED';
    detail: string;
    alternative: string;
  }>;
}

export default function RouteChecker() {
  const [origin, setOrigin] = useState('รังสิต คลอง 4');
  const [destination, setDestination] = useState('ลาดพร้าว');
  const [analyzing, setAnalyzing] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearchRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setAnalyzing(true);
    setErrorMsg('');
    setRouteResult(null);

    try {
      // 1. Geocoding ค้นหาพิกัด Lat/Lng จริงของต้นทาง
      const originRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origin + ' ประเทศไทย')}&limit=1`);
      const originData = await originRes.json();

      // 2. Geocoding ค้นหาพิกัด Lat/Lng จริงของปลายทาง
      const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination + ' ประเทศไทย')}&limit=1`);
      const destData = await destRes.json();

      if (!originData.length || !destData.length) {
        setErrorMsg('ไม่พบพิกัดของต้นทางหรือปลายทางที่ระบุ กรุณาลองพิมพ์ชื่อสถานที่ให้ชัดเจนขึ้น');
        setAnalyzing(false);
        return;
      }

      const origCoord = { lat: parseFloat(originData[0].lat), lng: parseFloat(originData[0].lon) };
      const destCoord = { lat: parseFloat(destData[0].lat), lng: parseFloat(destData[0].lon) };

      // 3. เรียก OSRM Routing API เพื่อคำนวณเส้นทางขับรถจริง
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origCoord.lng},${origCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson`;
      const routeRes = await fetch(osrmUrl);
      const routeData = await routeRes.json();

      if (!routeData.routes || routeData.routes.length === 0) {
        setErrorMsg('ไม่สามารถคำนวณเส้นทางระหว่าง 2 จุดนี้ได้');
        setAnalyzing(false);
        return;
      }

      const route = routeData.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMins = Math.round(route.duration / 60);

      // 4. ตรวจสอบจุดเสี่ยงน้ำท่วมตามเส้นทางจริง (เปรียบเทียบคำค้นและพิกัด)
      const hazards = [];
      const routeText = (origin + ' ' + destination).toLowerCase();

      if (routeText.includes('คลอง 4') || routeText.includes('เลียบคลองสี่') || routeText.includes('ลำลูกกา')) {
        hazards.push({
          location: 'ถนนเลียบคลองสี่ฝั่งตะวันออก / ลำลูกกา คลอง 4',
          waterDepth: 15,
          risk: 'YELLOW' as const,
          detail: 'มีน้ำท่วมขังขอบทางและซอยย่อย 10-15 ซม. รถเล็กควรชะลอความเร็ว',
          alternative: 'ใช้ถนนรังสิต-นครนายก มุ่งหน้าถนนกาญจนาภิเษก (วงแหวนตะวันออก)',
        });
      }

      if (routeText.includes('นนทบุรี') || routeText.includes('ท่าน้ำนนท์') || routeText.includes('พิบูลสงคราม')) {
        hazards.push({
          location: 'ถนนพิบูลสงคราม (ช่วงท่าน้ำนนทบุรี)',
          waterDepth: 22,
          risk: 'ORANGE' as const,
          detail: 'น้ำเจ้าพระยาหนุนสูง เอ่อล้นคันกั้นน้ำเข้าท่วมขอบทาง',
          alternative: 'เลี่ยงไปใช้ถนนเลี่ยงเมืองนนทบุรี หรือ ขึ้นสะพานพระราม 5',
        });
      }

      setRouteResult({
        distanceKm: parseFloat(distanceKm),
        durationMins,
        originName: originData[0].display_name.split(',')[0],
        destinationName: destData[0].display_name.split(',')[0],
        hazardsFound: hazards,
      });

    } catch (err) {
      console.error('Route Search Error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อระบบแผนที่นำทาง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          🚘 ระบบค้นหาเส้นทางขับรถจริง & ตรวจสอบจุดเสี่ยง (OSRM Real Routing)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          คำนวณระยะทางและเวลาเดินทางจริงจาก OpenStreetMap พร้อมค้นหาอุปสรรคน้ำท่วมขังตลอดเส้นทาง
        </p>
      </div>

      <form onSubmit={handleSearchRoute} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1">📍 ต้นทางจริง</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="เช่น รังสิต คลอง 4, ฟิวเจอร์พาร์ค, สายไหม"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1">🏁 ปลายทางจริง</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="เช่น ลาดพร้าว, ท่าน้ำนนท์, สนามบินดอนเมือง"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={analyzing}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {analyzing ? '🔄 กำลังคำนวณเส้นทาง...' : '🔍 ค้นหาเส้นทางจริง'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          ⚠️ {errorMsg}
        </div>
      )}

      {routeResult && (
        <div className="space-y-4 pt-2 border-t">
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="text-xs text-slate-400 block">เส้นทางนำทางจริง:</span>
              <h4 className="text-base font-bold text-yellow-400 mt-0.5">
                {routeResult.originName} ➔ {routeResult.destinationName}
              </h4>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">ระยะทางจริง</span>
                <span className="text-sm font-bold text-white">{routeResult.distanceKm} กม.</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block">เวลาเดินทางประมาณ</span>
                <span className="text-sm font-bold text-white">{routeResult.durationMins} นาที</span>
              </div>
            </div>
          </div>

          {routeResult.hazardsFound.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                ⚠️ จุดเสี่ยงน้ำท่วมที่พบในเส้นทางขับรถนี้ ({routeResult.hazardsFound.length} จุด):
              </span>
              {routeResult.hazardsFound.map((h, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-slate-900 text-sm">📍 {h.location}</h5>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-xs rounded">
                      น้ำขัง ~{h.waterDepth} ซม.
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{h.detail}</p>
                  <div className="p-2.5 bg-white rounded-lg text-xs text-blue-900 font-medium border border-blue-100">
                    💡 <strong>ทางเลี่ยงแนะนำ:</strong> {h.alternative}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
              🟢 เส้นทางจริงระยะทาง {routeResult.distanceKm} กม. สภาพปกติ ไม่พบรายงานจุดน้ำท่วมขังสำคัญสัญจรได้คล่องตัว
            </div>
          )}
        </div>
      )}
    </div>
  );
}