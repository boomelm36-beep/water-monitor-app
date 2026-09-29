import { NextResponse } from 'next/server';
import { getWaterLevelComparison } from '@/lib/waterService';

export async function GET() {
  try {
    const rangsitData = await getWaterLevelComparison('คลองรังสิตประยูรศักดิ์');

    return NextResponse.json({
      success: true,
      data: {
        rangsit: rangsitData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}