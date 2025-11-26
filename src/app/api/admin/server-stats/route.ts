import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

// GET: 獲取每個伺服器的統計數據
export async function GET() {
  try {
    console.log('📊 Fetching server statistics...');

    // Fetch all signals with server_id and timestamp
    const { data, error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('server_id, timestamp')
      .not('server_id', 'is', null);

    if (error) {
      throw error;
    }

    // Aggregate in memory
    const statsMap = new Map<string, { count: number, lastTime: number }>();

    (data || []).forEach(record => {
      const serverId = record.server_id;
      const timestamp = parseInt(record.timestamp);
      
      if (!statsMap.has(serverId)) {
        statsMap.set(serverId, { count: 0, lastTime: 0 });
      }
      
      const stat = statsMap.get(serverId)!;
      stat.count++;
      stat.lastTime = Math.max(stat.lastTime, timestamp);
    });

    const stats = Array.from(statsMap.entries()).map(([serverId, stat]) => ({
      serverId,
      totalSignals: stat.count,
      lastSignalTime: stat.lastTime,
    })).sort((a, b) => b.totalSignals - a.totalSignals);

    console.log(`✅ Retrieved stats for ${stats.length} servers`);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Fetch server stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server statistics' },
      { status: 500 }
    );
  }
}
