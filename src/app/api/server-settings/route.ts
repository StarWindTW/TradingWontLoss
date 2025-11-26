import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SETTINGS_TABLE = 'server_settings';

// GET: 獲取伺服器設定
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json({ error: 'Missing serverId' }, { status: 400 });
    }

    console.log(`📖 Fetching settings for server: ${serverId}`);

    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('server_id', serverId)
      .single();

    if (error && error.code !== 'PGRST116') {
       throw error;
    }

    if (!data) {
      return NextResponse.json({ defaultChannelId: null });
    }

    console.log(`✅ Retrieved settings for server ${serverId}`);
    return NextResponse.json({
      serverId: data.server_id,
      defaultChannelId: data.default_channel_id,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error('❌ Fetch server settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server settings' },
      { status: 500 }
    );
  }
}

// POST: 保存/更新伺服器設定
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📝 Saving server settings:', body);

    const { serverId, channelId, updatedBy } = body;

    if (!serverId || !channelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const upsertData = {
        server_id: serverId,
        default_channel_id: channelId,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
    };

    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(upsertData, { onConflict: 'server_id' })
      .select()
      .single();

    if (error) {
        throw error;
    }

    console.log('✅ Server settings saved successfully');
    return NextResponse.json({
      serverId: data.server_id,
      defaultChannelId: data.default_channel_id,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    });
  } catch (error) {
    console.error('❌ Save server settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save server settings' },
      { status: 500 }
    );
  }
}
