import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. ดึงสถานีระดับน้ำเรียลไทม์
    const { data: stations } = await supabase
      .from('water_levels')
      .select('*')
      .order('measured_at', { ascending: false });

    // 2. ดึงสถานะถนนและการจราจรเรียลไทม์
    const { data: traffic } = await supabase
      .from('traffic_conditions')
      .select('*')
      .order('updated_at', { ascending: false });

    // 3. ดึงประกาศเตือนพื้นที่เสี่ยงจริงทั้งหมดจาก ปภ. / กรมชลประทาน / ThaiWater
    const { data: alerts } = await supabase
      .from('risk_alerts')
      .select('*')
      .order('risk_level', { ascending: true }); // เรียง RED -> ORANGE -> YELLOW

    return NextResponse.json({
      success: true,
      data: {
        stations: stations || [],
        traffic: traffic || [],
        alerts: alerts || [],
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}