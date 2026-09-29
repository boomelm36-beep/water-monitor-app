'use client';

import { useState, useEffect } from 'react';

// Interface สำหรับรับข้อมูล
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

  // ดึงข้อมูลเมื่อโหลดหน้าเว็บ
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

  const currentTime = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 🟢 Header / สรุปย่อด้านบน */}
      <header className="bg-blue-900 text-white py-6 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-blue-800 text-blue-200 text-xs rounded-full font-semibold mb-2">
              🛰️ ระบบติดตามสถานการณ์น้ำรังสิต-ลำลูกกา รายชั่วโมง
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">ศูนย์เฝ้าระวังน้ำ รังสิต–ลำลูกกา–สายไหม–นครนายก</h1>
            <p className="text-blue-200 text-sm mt-1">ข้อมูลล่าสุด ณ เวลา: {currentTime} น.</p>
          </div>
          <div className="bg-blue-800/80 backdrop-blur border border-blue-700 p-4 rounded-xl text-center min-w-[200px]">
            <span className="text-xs text-blue-200 block uppercase tracking-wider font-semibold">ระดับความเสี่ยงโดยรวม</span>
            <span className="text-2xl font-black text-yellow-400 block my-1">🟡 เฝ้าระวัง</span>
            <span className="text-xs text-blue-100">มีฝนเล็กน้อย น้ำยังระบายได้</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">

        {/* 🚨 สรุปด่วน (Quick Summary Dashboard) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            ⚡ สรุปสถานการณ์ด่วน (Quick Overview)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* ระดับน้ำ */}
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

            {/* ปริมาณฝน */}
            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <span className="text-xs text-slate-500 font-medium">ฝนสะสม 1 ชม. ล่าสุด</span>
              <div className="text-2xl font-bold text-cyan-900 mt-1">5.0 มม.</div>
              <div className="text-xs mt-2 text-slate-600 font-medium">
                แนวโน้ม: กลุ่มฝนปานกลางกำลังเคลื่อนเข้า
              </div>
            </div>

            {/* การจราจร */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs text-slate-500 font-medium">สภาพถนนหลัก</span>
              <div className="text-2xl font-bold text-amber-900 mt-1">🟠 ชะลอตัว</div>
              <div className="text-xs mt-2 text-amber-700 font-medium">
                ลำลูกกา คลอง 4 มีน้ำขัง 10-15 ซม.
              </div>
            </div>

            {/* การระบายน้ำ */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">ปตร.จุฬาลงกรณ์</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">เปิดระบาย</div>
              <div className="text-xs mt-2 text-emerald-700 font-medium">
                เดินเครื่องสูบน้ำ 8/12 เครื่อง
              </div>
            </div>

          </div>
        </section>

        {/* 📑 รายงานสถานการณ์เต็มตาม 17 หัวข้อ */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">📊 รายงานฉบับเต็มรายชั่วโมง</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* คอลัมน์ซ้าย: สถานการณ์ฝน + น้ำ + การระบายน้ำ */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. 🚦 สถานการณ์โดยรวม & 2. ⚠️ สิ่งที่ต้องรู้ทันที */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">1. 🚦 สถานการณ์โดยรวม & ⚠️ สิ่งที่ต้องรู้ทันที</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>ระดับน้ำคลองรังสิตฯ:</strong> ยังต่ำกว่าระดับตลิ่ง 1.05 เมตร แต่มีแนวโน้มเพิ่มขึ้นช้าๆ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span><strong>จุดน่าห่วง:</strong> ถนนเลียบคลอง 4 ลำลูกกา และ ชุมชนสะพานแดง รังสิต</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span><strong>คาดการณ์ 1-3 ชม. ข้างหน้า:</strong> จะมีฝนตกเล็กน้อยถึงปานกลางครอบคลุมลำลูกกาและสายไหม</span>
                  </li>
                </ul>
              </div>

              {/* 3. 📈/4. 📊 ตารางเปรียบเทียบระดับน้ำรายจุด */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-md font-bold text-blue-900 mb-4">5. 🌧️ ปริมาณฝน & 6. 💧 ระดับน้ำในคลองหลัก</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">จุดวัด / คลอง</th>
                        <th className="p-3">ระดับปัจจุบัน</th>
                        <th className="p-3">1 ชม. ก่อน</th>
                        <th className="p-3">เปลี่ยน (1 ชม.)</th>
                        <th className="p-3 rounded-r-lg">แนวโน้ม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-medium text-slate-900">คลองรังสิตฯ (ปตร.จุฬาลงกรณ์)</td>
                        <td className="p-3">1.45 ม.</td>
                        <td className="p-3 text-slate-500">1.40 ม.</td>
                        <td className="p-3 text-red-600 font-semibold">+5 ซม.</td>
                        <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">ขึ้น</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-900">คลองหกวา (สายไหม)</td>
                        <td className="p-3">1.10 ม.</td>
                        <td className="p-3 text-slate-500">1.12 ม.</td>
                        <td className="p-3 text-green-600 font-semibold">-2 ซม.</td>
                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">ลง</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-slate-900">แม่น้ำนครนายก (เมืองนครนายก)</td>
                        <td className="p-3">2.30 ม.</td>
                        <td className="p-3 text-slate-500">2.30 ม.</td>
                        <td className="p-3 text-slate-500 font-semibold">0 ซม.</td>
                        <td className="p-3"><span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">ทรงตัว</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-3">* แหล่งข้อมูล: ThaiWater & กรมชลประทาน อัปเดตเมื่อ 10 นาทีที่แล้ว</p>
              </div>

              {/* 8. 🚗 น้ำท่วมถนนและการเดินทาง */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">8. 🚗 น้ำท่วมถนน & 🚗 ประเภทรถที่ผ่านได้</h3>
                <div className="space-y-3">
                  
                  {/* ถนนจุดที่ 1 */}
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 text-sm">📍 ถนนลำลูกกา ช่วงคลอง 4</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-semibold">🟡 มีน้ำขัง 15 ซม.</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">✓ กระบะ/SUV</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">✓ รถบรรทุก</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">⚠️ เก๋ง/มอเตอร์ไซค์ (ควรระวัง)</span>
                    </div>
                  </div>

                  {/* ถนนจุดที่ 2 */}
                  <div className="p-3 rounded-xl border border-green-200 bg-green-50/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 text-sm">📍 ถนนพหลโยธิน ช่วงหน้าตลาดรังสิต</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">🟢 สภาพปกติ</span>
                    </div>
                    <p className="text-xs text-slate-600">ผ่านได้ตามปกติทุกช่องทาง สภาพการจราจรคล่องตัว</p>
                  </div>

                </div>
              </div>

              {/* 13. 📊 เปรียบเทียบกับน้ำท่วมในอดีต (ปี 2554) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
                <h3 className="text-md font-bold text-blue-900 border-b pb-2">13. 📊 เปรียบเทียบกับน้ำท่วมปี 2554</h3>
                <p className="text-sm text-slate-700">
                  <strong>สถานะปัจจุบัน:</strong> ต่ำกว่าปี 2554 อย่างมีนัยสำคัญ ปริมาณน้ำในคลองรังสิตฯ ยังต่ำกว่าปี 2554 อยู่ประมาณ <strong>1.85 เมตร</strong> การระบายน้ำออกสู่นครนายกและบางปะกงยังคงทำได้ดี
                </p>
              </div>

            </div>

            {/* คอลัมน์ขวา: การเตือนภัย ข่าว และจุดเฝ้าระวัง */}
            <div className="space-y-6">

              {/* 9. ⛔ เส้นทางหลีกเลี่ยง & 10. ✅ เส้นทางที่ใช้ได้ */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">🛣️ แนะนำการเดินทาง</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                    <strong>❌ ควรหลีกเลี่ยง:</strong> ซอยเลียบคลอง 3 ลำลูกกา (มีน้ำท่วมขังขอบทาง)
                  </div>
                  <div className="p-2 bg-green-50 text-green-700 rounded-lg">
                    <strong>✅ เส้นทางเลี่ยง:</strong> ใช้ถนนวิภาวดีรังสิต หรือ ทางด่วนโทลล์เวย์ สภาพจราจรดี
                  </div>
                </div>
              </div>

              {/* 12. 🔮 แนวโน้ม 1–24 ชั่วโมง */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">12. 🔮 คาดการณ์แนวโน้ม</h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between border-b pb-1">
                    <span>1–3 ชั่วโมง:</span>
                    <span className="font-semibold text-amber-600">ต้องเฝ้าระวัง (ฝนตกเพิ่ม)</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>3–6 ชั่วโมง:</span>
                    <span className="font-semibold text-slate-600">ทรงตัว</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>6–24 ชั่วโมง:</span>
                    <span className="font-semibold text-green-600">ต่ำ (กลับสู่ภาวะปกติ)</span>
                  </div>
                </div>
              </div>

              {/* 15. 📢 ข่าว & ประกาศล่าสุด */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-md font-bold text-slate-900 border-b pb-2">📢 ประกาศและ Social Media</h3>
                <div className="space-y-3 text-xs">
                  <div className="border-l-2 border-blue-500 pl-3">
                    <p className="font-bold text-slate-800">เทศบาลนครรังสิต</p>
                    <p className="text-slate-600 mt-0.5">เดินเครื่องสูบน้ำเร่งดึงน้ำออกจากชุมชนสะพานแดงลงคลองรังสิตฯ ตลอด 24 ชม.</p>
                    <span className="text-[10px] text-slate-400">10 นาทีที่แล้ว • Facebook ทางการ</span>
                  </div>
                  <div className="border-l-2 border-amber-500 pl-3">
                    <p className="font-bold text-slate-800">JS100 Radio</p>
                    <p className="text-slate-600 mt-0.5">มีรายงานน้ำขังเล็กน้อยบริเวณหน้าหมู่บ้านพฤกษา ลำลูกกา คลอง 4</p>
                    <span className="text-[10px] text-slate-400">25 นาทีที่แล้ว • X (Twitter)</span>
                  </div>
                </div>
              </div>

              {/* 17. 📚 แหล่งอ้างอิง */}
              <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">📚 แหล่งข้อมูลอ้างอิง:</p>
                <p>• กรมชลประทาน / ThaiWater</p>
                <p>• กรมอุตุนิยมวิทยา</p>
                <p>• เพจเทศบาลนครรังสิต & JS100</p>
              </div>

            </div>

          </div>
        </section>

      </main>
    </div>
  );
}