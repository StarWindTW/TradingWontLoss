import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // 測試連接
    const { count, error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    console.log('✅ Supabase connection successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      totalRecords: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
