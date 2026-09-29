'use client';

import { useState } from 'react';

interface RouteHazard {
  road: string;
  location: string;
  status: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  waterDepth: number; // ซม.
  passableCars: { sedan: boolean; suv: boolean; truck: boolean };
  detail: string;
  alternativeRoute: string;
}

// ฐานข้อมูลจุดเสี่ยงบนถนนหลัก (สมมติ/เชื่อมต่อกับ DB traffic_conditions)
const ROAD_HAZARDS: RouteHazard[] = [
  {
    road: 'ลำลูกกา',
    location: 'ช่วงคลอง 3 - คลอง 5',
    status: 'ORANGE',
    waterDepth: 18,
    passableCars: { sedan: false, suv: true, truck: true },
    detail: 'มีน้ำขังขอบทางและเลนซ้ายสุด 15-20 ซม. การจราจรติดขัด',
    alternativeRoute: 'เลี่ยงไปใช้ถนนรังสิต-นครนายก หรือ ถนนสายใต้คลองหกวา',
  },
  {
    road: 'พิบูลสงคราม',
    location: 'หน้าท่าน้ำนนทบุรี',
    status: 'RED',
    waterDepth: 25,
    passableCars: { sedan: false, suv: false, truck: true },
    detail: 'น้ำเจ้าพระยาหนุนสูง เอ่อล้นคันกั้นน้ำ รถเล็กไม่ควรถ่าน',
    alternativeRoute: 'เลี่ยงไปใช้ถนนเลี่ยงเมืองนนทบุรี หรือ ขึ้นสะพานพระราม 5',
  },
  {
    road: 'พหลโยธิน',
    location: 'ช่วงหน้าตลาดรังสิต - ฟิวเจอร์พาร์ค',
    status: 'YELLOW',
    waterDepth: 10,
    passableCars: { sedan: true, suv: true, truck: true },
    detail: 'มีน้ำรอการระบายช่องทางซ้ายสุด ชะลอตัวเล็กน้อย',
    alternativeRoute: 'ใช้ทางยกระดับอุตราภิมุข (ดอนเมืองโทลล์เวย์)',
  },
  {
    road: 'สายไหม',
    location: 'ช่วงซอยสายไหม 43 - 55',
    status: 'YELLOW',
    waterDepth: 12,
    passableCars: { sedan: true, suv: true, truck: true },
    detail: 'ระดับน้ำขังในซอยย่อย รถบนถนนหลักยังสัญจรได้ปกติ',
    alternativeRoute: 'ใช้ถนนหทัยราษฎร์ หรือ ถนนสุขาภิบาล 5',
  },
];

export default function RouteChecker() {
  const [origin, setOrigin] = useState('รังสิต คลอง 4');
  const [destination, setDestination] = useState('ลาดพร้าว');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    matchedHazards: RouteHazard[];
    overallRisk: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  } | null>(null);

  const handleSearchRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      // ตรวจหาจุดเสี่ยงจากคำค้นต้นทาง-ปลายทาง
      const query = (origin + ' ' + destination).toLowerCase();
      
      const found = ROAD_HAZARDS.filter(h => 
        query.includes(h.road.toLowerCase()) || 
        query.includes('รังสิต') || 
        query.includes('ลำลูกกา') ||
        query.includes('นนทบุรี')
      );

      let maxRisk: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
      if (found.some(f => f.status === 'RED')) maxRisk = 'RED';
      else if (found.some(f => f.status === 'ORANGE')) maxRisk = 'ORANGE';
      else if (found.some(f => f.status === 'YELLOW')) maxRisk = 'YELLOW';

      setResult({
        matchedHazards: found,
        overallRisk: maxRisk,
      });
      setAnalyzing(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          🚘 ระบบเช็กเส้นทางเดินทางปลอดภัย (Route Risk Checker)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          ประเมินจุดน้ำท่วมขังบนเส้นทาง แนะนำประเภทรถที่ผ่านได้ และหาเส้นทางเลี่ยงให้อัตโนมัติ
        </p>
      </div>

      {/* ฟอร์มระบุต้นทาง-ปลายทาง */}
      <form onSubmit={handleSearchRoute} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1">📍 ต้นทาง</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="เช่น รังสิต คลอง 4, ลำลูกกา, ท่าน้ำนนท์"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1">🏁 ปลายทาง</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="เช่น ลาดพร้าว, อนุสาวรีย์ชัยฯ, แจ้งวัฒนะ"
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
            {analyzing ? '🔄 กำลังประเมิน...' : '🔍 ตรวจสอบเส้นทาง'}
          </button>
        </div>
      </form>

      {/* ผลการวิเคราะห์เส้นทาง */}
      {result && (
        <div className="space-y-4 pt-2 border-t">
          {/* แถบสรุปความเสี่ยงรวม */}
          <div className={`p-4 rounded-xl flex items-center justify-between border ${
            result.overallRisk === 'RED' ? 'bg-red-50 border-red-200 text-red-900' :
            result.overallRisk === 'ORANGE' ? 'bg-orange-50 border-orange-200 text-orange-900' :
            result.overallRisk === 'YELLOW' ? 'bg-amber-50 border-amber-200 text-amber-900' :
            'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <span className="text-xs font-semibold uppercase block opacity-80">ผลการประเมินเส้นทาง ({origin} → {destination})</span>
              <h4 className="text-base font-bold mt-0.5">
                {result.overallRisk === 'RED' && '🔴 พบเส้นทางปิด/ผ่านไม่ได้ ชะลอหรือเลี่ยงเด็ดขาด'}
                {result.overallRisk === 'ORANGE' && '🟠 พบจุดเสี่ยงสูง รถเล็กควรหลีกเลี่ยง'}
                {result.overallRisk === 'YELLOW' && '🟡 พบจุดน้ำขังเล็กน้อย เดินทางได้ด้วยความระมัดระวัง'}
                {result.overallRisk === 'GREEN' && '🟢 เส้นทางปลอดภัย ไม่พบรายงานน้ำท่วมขังสำคัญ'}
              </h4>
            </div>
          </div>

          {/* รายการจุดเสี่ยงที่พบตลอดเส้นทาง */}
          {result.matchedHazards.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">⚠️ จุดที่ต้องเฝ้าระวังบนเส้นทางนี้ ({result.matchedHazards.length} จุด):</span>
              {result.matchedHazards.map((hazard, index) => (
                <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">📍 ถนน{hazard.road} ({hazard.location})</h5>
                      <p className="text-xs text-slate-600 mt-0.5">{hazard.detail}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                      hazard.status === 'RED' ? 'bg-red-100 text-red-700' :
                      hazard.status === 'ORANGE' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      น้ำขัง ~{hazard.waterDepth} ซม.
                    </span>
                  </div>

                  {/* ประเภทรถที่ผ่านได้ */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-medium">คำแนะนำรายประเภทรถ:</span>
                    <span className={`px-2 py-0.5 rounded font-medium ${hazard.passableCars.sedan ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {hazard.passableCars.sedan ? '✓ รถเก๋งผ่านได้' : '❌ เก๋งผ่านไม่ได้'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${hazard.passableCars.suv ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {hazard.passableCars.suv ? '✓ SUV/กระบะผ่านได้' : '❌ SUV ผ่านไม่ได้'}
                    </span>
                  </div>

                  {/* เส้นทางแนะนำเลี่ยง */}
                  <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg text-xs font-medium">
                    💡 <strong>ทางเลี่ยงแนะนำ:</strong> {hazard.alternativeRoute}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">ไม่พบรายงานอุปสรรคน้ำท่วมขังบนเส้นทางหลักที่คุณระบุ สามารถเดินทางได้สะดวก</p>
          )}
        </div>
      )}
    </div>
  );
}   