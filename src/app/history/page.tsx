"use client";

import SignalHistory from "@/components/SignalHistory";
import { Box, Heading, Spinner, Center } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function HistoryPage() {
    const { data: session } = useSession();

    interface SignalRecord {
        id: string;
        timestamp: number;
        coinSymbol: string;
        coinName: string;
        positionType: 'long' | 'short';
        entryPrice: string;
        takeProfit: string;
        stopLoss: string;
        riskRewardRatio?: string;
        sender: string;
        serverId: string;
        channelId: string;
        threadId?: string;
    }

    const [signalHistory, setSignalHistory] = useState<SignalRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedServerId, setSelectedServerId] = useState<string>('');

    // Load history from database on mount or when server changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const serverParam = selectedServerId ? `&serverId=${selectedServerId}` : '';
                console.log(`📥 Loading signal history from database (serverId: ${selectedServerId || 'all'})...`);
                const response = await fetch(`/api/signal-history?limit=50${serverParam}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Loaded ${data.length} records from database`);
                    setSignalHistory(data);
                } else {
                    console.error('❌ Failed to load history:', response.status);
                }
            } catch (error) {
                console.error('❌ Failed to load signal history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        if (session) {
            fetchHistory();
        }
    }, [session, selectedServerId]);

    const deleteSignal = async (id: string) => {
        try {
            const record = signalHistory.find(r => r.id === id);
            if (!record) return;

            console.log('🗑️ Deleting signal:', id);

            // 先從 Discord 刪除 (如果有 threadId)
            if (record.threadId && session?.accessToken) {
                try {
                    // 改為呼叫 Next.js API Route，由後端代理請求到 Bot API
                    // 這樣可以避免 Mixed Content (HTTPS 呼叫 HTTP) 和 CORS 問題
                    await fetch(`/api/discord/thread/${record.threadId}`, {
                        method: 'DELETE',
                    });
                    console.log('✅ Discord thread deleted');
                } catch (error) {
                    console.error('❌ Failed to delete Discord thread:', error);
                }
            }

            // 從數據庫刪除
            const response = await fetch(`/api/signal-history?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('✅ Signal deleted from database');
                // 更新本地狀態
                setSignalHistory((prev) => prev.filter(r => r.id !== id));
            } else {
                console.error('❌ Failed to delete from database');
            }
        } catch (error) {
            console.error('❌ Failed to delete signal:', error);
        }
    };

    if (!session) {
        return <Box p={6}>請先登入以查看歷史紀錄</Box>;
    }

    return (
        <Box ml="240px" flex={1} overflowY="auto" p={6} height="100%">
            <Heading size="lg" mb={6}>歷史紀錄</Heading>
            {isLoadingHistory ? (
                <Center h="200px">
                    <Spinner size="xl" />
                </Center>
            ) : (
                <SignalHistory records={signalHistory} onDelete={deleteSignal} />
            )}
        </Box>
    );
}