import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/options";
import { createClient } from '@supabase/supabase-js';

// 嘗試創建 Admin Client 以繞過 RLS (如果設定了 Service Role Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey) 
    : supabase;

// GET: 獲取單個信號詳情和日誌
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // 獲取信號詳情
    const { data: signal, error: signalError } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('*')
      .eq('id', id)
      .single();

    if (signalError) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    // 檢查權限 (只能查看自己的? 或者所有人都可以查看但只能編輯自己的? 
    // 題目說 "只能修改自己的", 暗示可能可以看別人的, 但為了安全起見, 先限制只能看自己的, 
    // 或者如果這是公開歷史記錄, 則可以看. 
    // 根據之前的 GET /api/signal-history 邏輯, 它是 fetch user_id = session.user.id, 
    // 所以目前歷史記錄是私有的. 這裡也保持一致.)
    if (signal.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 獲取變更日誌 (從 logs JSONB 欄位)
    const logs = signal.logs || [];

    // 轉換 snake_case 到 camelCase
    const formattedSignal = {
      id: signal.id,
      timestamp: signal.timestamp,
      coinSymbol: signal.coin_symbol,
      coinName: signal.coin_name,
      positionType: signal.position_type,
      entryPrice: signal.entry_price,
      takeProfit: signal.take_profit,
      stopLoss: signal.stop_loss,
      reason: signal.reason,
      riskRewardRatio: signal.risk_reward_ratio,
      sender: signal.sender,
      serverId: signal.server_id,
      channelId: signal.channel_id,
      threadId: signal.thread_id,
      userId: signal.user_id,
    };

    const formattedLogs = (logs || []).map((log: any) => ({
      id: log.id || `${log.updatedAt}-${Math.random()}`, // Fallback ID
      signalId: id,
      oldTakeProfit: log.oldTakeProfit,
      newTakeProfit: log.newTakeProfit,
      oldStopLoss: log.oldStopLoss,
      newStopLoss: log.newStopLoss,
      updatedAt: log.updatedAt,
      updatedBy: log.updatedBy,
    }));

    return NextResponse.json({
      signal: formattedSignal,
      logs: formattedLogs
    });

  } catch (error) {
    console.error('Error fetching signal details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal details' },
      { status: 500 }
    );
  }
}

// PATCH: 更新信號 (止盈/止損)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const { takeProfit, stopLoss } = body;

    console.log(`📝 PATCH signal ${id}:`, { takeProfit, stopLoss });

    // 1. 獲取當前信號以驗證權限和獲取舊值
    const { data: currentSignal, error: fetchError } = await supabase
      .from(TABLES.SIGNAL_HISTORY)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentSignal) {
      console.error('❌ Signal not found or fetch error:', fetchError);
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    console.log('🔍 Current signal:', { 
        id: currentSignal.id, 
        take_profit: currentSignal.take_profit, 
        stop_loss: currentSignal.stop_loss,
        user_id: currentSignal.user_id 
    });

    if (currentSignal.user_id !== session.user.id) {
      console.warn(`⚠️ Unauthorized update attempt by user ${session.user.id} on signal ${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. 準備更新數據
    const updates: any = {};
    let hasChanges = false;

    // 比較時轉為字串比較，避免類型差異
    const currentTP = String(currentSignal.take_profit || '');
    const newTP = String(takeProfit || '');
    const currentSL = String(currentSignal.stop_loss || '');
    const newSL = String(stopLoss || '');

    if (takeProfit !== undefined && newTP !== currentTP) {
      updates.take_profit = takeProfit;
      hasChanges = true;
    }
    if (stopLoss !== undefined && newSL !== currentSL) {
      updates.stop_loss = stopLoss;
      hasChanges = true;
    }

    console.log('🔄 Updates to apply:', updates, 'Has changes:', hasChanges);

    if (!hasChanges) {
      return NextResponse.json({ message: 'No changes detected' });
    }

    // 3. 更新信號
    const { error: updateError, data: updatedData } = await supabaseAdmin
      .from(TABLES.SIGNAL_HISTORY)
      .update(updates)
      .eq('id', id)
      .select(); // Add select to verify update

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      throw updateError;
    }

    if (!updatedData || updatedData.length === 0) {
        console.error('❌ Update returned no data. Possible RLS issue or ID mismatch.');
        return NextResponse.json({ error: 'Update failed - Database rejected change' }, { status: 500 });
    }

    console.log('✅ Update successful:', updatedData);

    // 4. 記錄日誌 (更新到 logs JSONB 欄位)
    const logEntry = {
      id: crypto.randomUUID(),
      oldTakeProfit: currentSignal.take_profit,
      newTakeProfit: updates.take_profit || currentSignal.take_profit,
      oldStopLoss: currentSignal.stop_loss,
      newStopLoss: updates.stop_loss || currentSignal.stop_loss,
      updatedBy: session.user.id,
      updatedAt: new Date().toISOString(),
    };

    // 獲取當前 logs
    const currentLogs = currentSignal.logs || [];
    const newLogs = [logEntry, ...currentLogs]; // 新的在前面

    // 更新 logs 欄位
    const { error: logUpdateError } = await supabaseAdmin
      .from(TABLES.SIGNAL_HISTORY)
      .update({ logs: newLogs })
      .eq('id', id);

    if (logUpdateError) {
      console.error('Failed to update logs:', logUpdateError);
      // 不中斷流程，因為主要數據更新已成功
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating signal:', error);
    return NextResponse.json(
      { error: 'Failed to update signal' },
      { status: 500 }
    );
  }
}
