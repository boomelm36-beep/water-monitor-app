'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ข้อมูลจำลองสถิติมนุษย์ 24 ชั่วโมงล่าสุด (ดึงจริงจาก Supabase)
const DATA_24H = [
  { time: '00:00', waterLevel: 1.30, bankLevel: 2.50, rain: 0 },
  { time: '03:00', waterLevel: 1.32, bankLevel: 2.50, rain: 2 },
  { time: '06:00', waterLevel: 1.35, bankLevel: 2.50, rain: 5 },
  { time: '09:00', waterLevel: 1.40, bankLevel: 2.50, rain: 12 },
  { time: '12:00', waterLevel: 1.45, bankLevel: 2.50, rain: 8 },
  { time: '15:00', waterLevel: 1.48, bankLevel: 2.50, rain: 15 },
  { time: '18:00', waterLevel: 1.45, bankLevel: 2.50, rain: 3 },
  { time: '21:00', waterLevel: 1.42, bankLevel: 2.50, rain: 0 },
];

// ข้อมูลจำลองสถิติย้อนหลัง 7 วัน
const DATA_7DAYS = [
  { time: '23 ก.ย.', waterLevel: 1.10, bankLevel: 2.50 },
  { time: '24 ก.ย.', waterLevel: 1.18, bankLevel: 2.50 },
  { time: '25 ก.ย.', waterLevel: 1.25, bankLevel: 2.50 },
  { time: '26 ก.ย.', waterLevel: 1.30, bankLevel: 2.50 },
  { time: '27 ก.ย.', waterLevel: 1.42, bankLevel: 2.50 },
  { time: '28 ก.ย.', waterLevel: 1.48, bankLevel: 2.50 },
  { time: '29 ก.ย.', waterLevel: 1.45, bankLevel: 2.50 },
];

// ข้อมูล Matrix เปรียบเทียบกับน้ำท่วมปีอดีต (2554, 2565, ปัจจุบัน)
const DATA_COMPARISON = [
  { month: 'ก.ค.', year2554: 1.80, year2565: 1.20, currentYear: 1.10 },
  { month: 'ส.ค.', year2554: 2.30, year2565: 1.45, currentYear: 1.25 },
  { month: 'ก.ย.', year2554: 2.85, year2565: 1.65, currentYear: 1.45 },
  { month: 'ต.ค.', year2554: 3.40, year2565: 1.90, currentYear: null }, // อนาคต
  { month: 'พ.ย.', year2554: 3.10, year2565: 1.50, currentYear: null },
];

export default function WaterChart() {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | 'COMPARE'>('24H');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      
      {/* Header + แถบสลับช่วงเวลา */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📊 กราฟวิเคราะห์เทรนด์ระดับน้ำ & สถิติเปรียบเทียบ
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามการเปลี่ยนแปลงอัตราการขึ้น-ลงของน้ำ ในคลองรังสิตประยูรศักดิ์
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTimeRange('24H')}
            className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === '24H' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            24 ชั่วโมง
          </button>
          <button
            onClick={() => setTimeRange('7D')}
            className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === '7D' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            7 วันย้อนหลัง
          </button>
          <button
            onClick={() => setTimeRange('COMPARE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'COMPARE' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            เทียบปี 2554 / 2565
          </button>
        </div>
      </div>

      {/* กราฟ Recharts */}
      <div className="h-[320px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {timeRange !== 'COMPARE' ? (
            <LineChart data={timeRange === '24H' ? DATA_24H : DATA_7DAYS} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis domain={[0, 3.0]} stroke="#64748b" unit="ม." />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`${value} เมตร`, '']}
              />
              <Legend verticalAlign="top" height={36} />

              {/* เส้นเตือนภัยระดับตลิ่ง */}
              <ReferenceLine y={2.50} label={{ value: '🚨 ระดับตลิ่ง (2.50 ม.)', fill: '#ef4444', fontSize: 11, position: 'top' }} stroke="#ef4444" strokeDasharray="4 4" />
              <ReferenceLine y={2.00} label={{ value: '⚠️ ระดับเตือนภัย (2.00 ม.)', fill: '#f59e0b', fontSize: 11, position: 'top' }} stroke="#f59e0b" strokeDasharray="4 4" />

              {/* เส้นระดับน้ำจริง */}
              <Line
                type="monotone"
                dataKey="waterLevel"
                name="ระดับน้ำจริง (ม.)"
                stroke="#0284c7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0284c7' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            /* กราฟเปรียบเทียบปี 2554 vs 2565 vs ปัจจุบัน */
            <LineChart data={DATA_COMPARISON} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis domain={[0, 4.0]} stroke="#64748b" unit="ม." />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }} />
              <Legend verticalAlign="top" height={36} />

              <Line type="monotone" dataKey="year2554" name="มหาอุทกภัย ปี 2554" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="year2565" name="น้ำท่วมใหญ่ ปี 2565" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="currentYear" name="ปีปัจจุบัน (2569)" stroke="#0284c7" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* สรุปข้อวิเคราะห์จากกราฟ */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
        <p className="font-bold text-slate-900">📌 บทวิเคราะห์แนวโน้มจากกราฟ:</p>
        {timeRange === '24H' && (
          <p>• ระดับน้ำในรอบ 24 ชั่วโมงแกว่งตัวในระดับ 1.30 - 1.48 เมตร โดยเพิ่มขึ้นสูงสุดช่วงที่มีฝนตกสะสม แต่ยังต่ำกว่าระดับตลิ่งอยู่ <strong>1.02 เมตร</strong></p>
        )}
        {timeRange === '7D' && (
          <p>• สถิติ 7 วันย้อนหลังแสดงให้เห็นว่าระดับน้ำค่อยๆ ปรับตัวสูงขึ้นเล็กน้อยตามปริมาณฝนสะสมตอนบน แต่ยังอยู่ในเกณฑ์ควบคุมได้</p>
        )}
        {timeRange === 'COMPARE' && (
          <p>• เมื่อเทียบกับปี 2554 ระดับน้ำ ณ เดือนปัจจุบันยังต่ำกว่าปี 2554 มากถึง <strong>1.40 เมตร</strong> และการระบายน้ำยังทำได้คล่องตัวกว่าปี 2565</p>
        )}
      </div>

    </div>
  );
}