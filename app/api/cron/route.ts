import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. ตรวจสอบความปลอดภัยด้วย Bearer Token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // 2. ตัวอย่างข้อมูลระดับน้ำล่าสุด (ในอนาคตสามารถเปลี่ยนเป็นดึงจาก API จริงได้)
    const sampleWaterData = [
      {
        station_name: 'คลองรังสิตประยูรศักดิ์',
        water_level_m: 1.45,
        bank_level_m: 2.50,
        flow_status: 'ทรงตัว',
        measured_at: now,
        source_name: 'กรมชลประทาน',
      },
      {
        station_name: 'คลองหกวา สายล่าง',
        water_level_m: 1.10,
        bank_level_m: 2.20,
        flow_status: 'ลง',
        measured_at: now,
        source_name: 'สำนักการระบายน้ำ กทม.',
      },
    ];

    // บันทึกลง Supabase
    const { error: waterError } = await supabase
      .from('water_levels')
      .insert(sampleWaterData);

    if (waterError) throw waterError;

    // 3. ตัวอย่างข้อมูลปริมาณฝน
    const sampleRainData = [
      {
        location_name: 'อำเภอลำลูกกา',
        rain_1h_mm: 5.0,
        rain_24h_mm: 32.5,
        trend: 'ฝนเล็กน้อย',
        measured_at: now,
        source_name: 'กรมอุตุนิยมวิทยา',
      },
    ];

    const { error: rainError } = await supabase
      .from('rainfall_data')
      .insert(sampleRainData);

    if (rainError) throw rainError;

    return NextResponse.json({
      success: true,
      message: 'อัปเดตและบันทึกข้อมูลรายชั่วโมงเรียบร้อยแล้ว',
      timestamp: now,
    });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}