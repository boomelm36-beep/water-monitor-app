import { supabase } from '@/lib/supabase';

export interface WaterLevelRecord {
  id?: number;
  station_name: string;
  water_level_m: number;
  bank_level_m: number;
  flow_status: string;
  measured_at: string;
  source_name: string;
}

export async function saveWaterLevel(data: Omit<WaterLevelRecord, 'id'>) {
  const { data: result, error } = await supabase
    .from('water_levels')
    .insert([data])
    .select();

  if (error) {
    console.error('Error saving water level:', error);
    throw error;
  }
  return result;
}

export async function getWaterLevelComparison(stationName: string) {
  const { data, error } = await supabase
    .from('water_levels')
    .select('*')
    .eq('station_name', stationName)
    .order('measured_at', { ascending: false })
    .limit(24);

  if (error || !data || data.length === 0) {
    return { current: null, previous1h: null, initial: null, diff1h: 0, diffInitial: 0 };
  }

  const current = data[0];
  const previous1h = data[1] || current;
  const initial = data[data.length - 1];

  const diff1h = Math.round((current.water_level_m - previous1h.water_level_m) * 100);
  const diffInitial = Math.round((current.water_level_m - initial.water_level_m) * 100);

  return {
    current,
    previous1h,
    initial,
    diff1h,
    diffInitial,
  };
}