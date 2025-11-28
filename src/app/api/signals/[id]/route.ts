import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/options";

export const dynamic = 'force-dynamic';

// GET: 獲取單個信號詳情和變更歷史
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signalId = params.id;

    // 獲取信號詳情
    const { data: signalData, error: signalError } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('*')
      .eq('id', signalId)
      .eq('user_id', session.user.id)
      .single();

    if (signalError || !signalData) {
      if (signalError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Signal not found or access denied' }, { status: 403 });
      }
      throw signalError;
    }

    // 獲取變更歷史
    const { data: logsData, error: logsError } = await supabase
      .from('signal_logs')
      .select('*')
      .eq('signal_id', signalId)
      .order('updated_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching logs:', logsError);
    }

    // 轉換 snake_case 到 camelCase
    const signal = {
      id: signalData.id,
      timestamp: signalData.timestamp,
      coinSymbol: signalData.coin_symbol,
      coinName: signalData.coin_name,
      positionType: signalData.position_type,
      entryPrice: signalData.entry_price,
      takeProfit: signalData.take_profit,
      stopLoss: signalData.stop_loss,
      reason: signalData.reason,
      riskRewardRatio: signalData.risk_reward_ratio,
      sender: signalData.sender,
      serverId: signalData.server_id,
      channelId: signalData.channel_id,
      threadId: signalData.thread_id || undefined,
      userId: signalData.user_id,
    };

    const logs = (logsData || []).map(log => ({
      id: log.id,
      oldTakeProfit: log.old_take_profit,
      newTakeProfit: log.new_take_profit,
      oldStopLoss: log.old_stop_loss,
      newStopLoss: log.new_stop_loss,
      updatedAt: log.updated_at,
      updatedBy: log.updated_by,
    }));

    return NextResponse.json({ signal, logs });
  } catch (error) {
    console.error('Get signal error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal' },
      { status: 500 }
    );
  }
}

// PATCH: 更新信號（止盈止損）
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signalId = params.id;
    const body = await request.json();

    // 先獲取原始數據以記錄變更
    const { data: oldData } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('take_profit, stop_loss')
      .eq('id', signalId)
      .eq('user_id', session.user.id)
      .single();

    if (!oldData) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    // 更新信號
    const { data, error } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .update({
        take_profit: body.takeProfit,
        stop_loss: body.stopLoss,
      })
      .eq('id', signalId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    // 記錄變更歷史
    await supabase
      .from('signal_logs')
      .insert({
        signal_id: signalId,
        old_take_profit: oldData.take_profit,
        new_take_profit: body.takeProfit,
        old_stop_loss: oldData.stop_loss,
        new_stop_loss: body.stopLoss,
        updated_by: session.user.id,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update signal error:', error);
    return NextResponse.json(
      { error: 'Failed to update signal' },
      { status: 500 }
    );
  }
}

