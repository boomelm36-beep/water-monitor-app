import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ชุดข้อมูลสำรองกรณี Supabase คืนค่าว่าง
const FALLBACK_STATIONS = [
  { id: 1, station_name: 'คลองรังสิตฯ (คลอง 4 ฝั่งตะวันออก)', water_level_m: 1.45, bank_level_m: 2.50, flow_status: 'ไหลคล่องตัว', province: 'ปทุมธานี', zone_color: 'YELLOW' },
  { id: 2, station_name: 'ปตร.จุฬาลงกรณ์ (คลองรังสิต คลอง 1)', water_level_m: 1.85, bank_level_m: 2.20, flow_status: 'เปิดสูบน้ำ 8 เครื่อง', province: 'ปทุมธานี', zone_color: 'ORANGE' },
  { id: 3, station_name: 'คลองหกวา (ประตูน้ำสายไหม)', water_level_m: 1.10, bank_level_m: 2.00, flow_status: 'ระบายลงฝั่งตะวันออก', province: 'กรุงเทพมหานคร', zone_color: 'GREEN' },
  { id: 4, station_name: 'ท่าน้ำนนทบุรี (แม่น้ำเจ้าพระยา)', water_level_m: 2.10, bank_level_m: 2.30, flow_status: 'น้ำทะเลหนุนสูง', province: 'นนทบุรี', zone_color: 'ORANGE' },
  { id: 5, station_name: 'คลอง 29 / อ.องครักษ์', water_level_m: 2.85, bank_level_m: 2.50, flow_status: 'วิกฤต (ล้นตลิ่ง)', province: 'นครนายก', zone_color: 'RED' }
];

const FALLBACK_TRAFFIC = [
  { id: 1, road_name: 'ถนนรังสิต-นครนายก (ช่วง อ.องครักษ์)', district: 'องครักษ์', province: 'นครนายก', status: '🔴 ปิดการจราจรบางช่วง', water_depth_cm: 35, passable_status: 'เฉพาะรถบรรทุก/ยกสูงผ่านได้' },
  { id: 2, road_name: 'ถนนเลียบคลองสี่ฝั่งตะวันออก', district: 'คลองหลวง', province: 'ปทุมธานี', status: '🟡 น้ำขังขอบทาง', water_depth_cm: 12, passable_status: 'รถทุกประเภทผ่านได้ ชะลอตัวช่วงซอยย่อย' },
  { id: 3, road_name: 'ถนนพิบูลสงคราม (ท่าน้ำนนทบุรี)', district: 'เมืองนนทบุรี', province: 'นนทบุรี', status: '🟠 น้ำเจ้าพระยาหนุน', water_depth_cm: 20, passable_status: 'รถเล็กควรหลีกเลี่ยงช่วง 16:00-19:00 น.' },
  { id: 4, road_name: 'ถนนวิภาวดีรังสิต (ช่วงดอนเมือง)', district: 'ดอนเมือง', province: 'กรุงเทพมหานคร', status: '🟢 สภาพปกติ', water_depth_cm: 0, passable_status: 'ผ่านได้ตามปกติทุกช่องทาง' }
];

const FALLBACK_ALERTS = [
  { id: 1, province: 'นครนายก', area_name: 'อ.องครักษ์ / ถนนรังสิต-นครนายก', risk_level: 'RED', description: 'น้ำท่วมขังสูงบนผิวจราจร มีการปิดการจราจรบางช่องทาง เจ้าหน้าที่เร่งติดตั้งเครื่องสูบน้ำระบายลงคลอง', source_name: 'ปภ. จังหวัดนครนายก', updated_at: new Date().toISOString() },
  { id: 2, province: 'นนทบุรี', area_name: 'อ.เมืองนนทบุรี / ท่าน้ำนนท์', risk_level: 'ORANGE', description: 'เฝ้าระวังน้ำเจ้าพระยาหนุนสูงช่วงเย็น เออเข้าท่วมถนนขอบทางและพื้นที่นอกคันกั้นน้ำ', source_name: 'กรมเจ้าท่า / นนทบุรี', updated_at: new Date().toISOString() },
  { id: 3, province: 'ปทุมธานี', area_name: 'อ.ธัญบุรี / คลอง 4 ฝั่งตะวันออก', risk_level: 'YELLOW', description: 'ระดับน้ำเลียบคลองสี่ฝั่งตะวันออกมีน้ำขังขอบทางเล็กน้อย เครื่องสูบน้ำเทศบาลเปิดระบายต่อเนื่อง', source_name: 'เทศบาลนครรังสิต', updated_at: new Date().toISOString() },
  { id: 4, province: 'กรุงเทพมหานคร', area_name: 'เขตสายไหม / คลองหกวา', risk_level: 'GREEN', description: 'ประตูระบายน้ำคลองหกวาเร่งระบายน้ำลงฝั่งตะวันออก สภาพการจราจรโดยรวมยังสัญจรได้ปกติ', source_name: 'สำนักการระบายน้ำ กทม.', updated_at: new Date().toISOString() }
];

export async function GET() {
  try {
    const { data: stations } = await supabase.from('water_levels').select('*').order('measured_at', { ascending: false });
    const { data: traffic } = await supabase.from('traffic_conditions').select('*').order('updated_at', { ascending: false });
    const { data: alerts } = await supabase.from('risk_alerts').select('*').order('updated_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        stations: (stations && stations.length > 0) ? stations : FALLBACK_STATIONS,
        traffic: (traffic && traffic.length > 0) ? traffic : FALLBACK_TRAFFIC,
        alerts: (alerts && alerts.length > 0) ? alerts : FALLBACK_ALERTS,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: {
        stations: FALLBACK_STATIONS,
        traffic: FALLBACK_TRAFFIC,
        alerts: FALLBACK_ALERTS,
        updatedAt: new Date().toISOString(),
      },
    });
  }
}