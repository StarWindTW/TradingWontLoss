'use client';

import { useState, useEffect } from 'react';
import { 
    Box, 
    Heading, 
    Text, 
    Input, 
    Button, 
    VStack, 
    HStack, 
    Badge, 
    Table, 
    Spinner, 
    Card,
    Stack,
    Separator,
    IconButton,
    Flex
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LuArrowLeft, LuSave, LuHistory, LuTag, LuX, LuPlus, LuRefreshCw } from 'react-icons/lu';
import axios from 'axios';

interface SignalLog {
    id: string;
    oldTakeProfit: string;
    newTakeProfit: string;
    oldStopLoss: string;
    newStopLoss: string;
    updatedAt: string;
    updatedBy: string;
}

interface SignalDetail {
    id: string;
    timestamp: number;
    coinSymbol: string;
    coinName: string;
    positionType: 'long' | 'short';
    entryPrice: string;
    takeProfit: string;
    stopLoss: string;
    reason?: string;
    riskRewardRatio?: string;
    sender: string;
    userId: string;
    serverId: string;
    channelId: string;
    threadId?: string;
}

interface ForumTag {
    id: string;
    name: string;
    moderated: boolean;
    emoji: any;
}

export default function SignalManagePage({ params }: { params: { id: string } }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [signal, setSignal] = useState<SignalDetail | null>(null);
    const [logs, setLogs] = useState<SignalLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editForm, setEditForm] = useState({
        takeProfit: '',
        stopLoss: ''
    });

    const [isSyncingDiscord, setIsSyncingDiscord] = useState(false);
    const [availableForumTags, setAvailableForumTags] = useState<ForumTag[]>([]);
    const [selectedForumTags, setSelectedForumTags] = useState<string[]>([]);
    const [isUpdatingTags, setIsUpdatingTags] = useState(false);

    // 更新 Discord 消息
    const updateDiscordMessage = async (updatedSignal?: SignalDetail) => {
        const signalData = updatedSignal || signal;
        if (!signalData || !signalData.threadId) {
            console.log('No thread ID, skipping Discord update');
            return;
        }

        try {
            const positionTypeText = signalData.positionType === 'long' ? '做多 LONG' : '做空 SHORT';
            const embedColor = signalData.positionType === 'long' ? 0x00FF00 : 0xFF0000;
            const coinIcon = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${signalData.coinSymbol.toUpperCase()}.png`;
            const userAvatar = session?.user?.image || '';

            // 計算盈虧比
            let riskRewardRatio = '';
            if (signalData.entryPrice && signalData.takeProfit && signalData.stopLoss) {
                const entryPrice = parseFloat(signalData.entryPrice);
                const takeProfitPrice = parseFloat(signalData.takeProfit);
                const stopLossPrice = parseFloat(signalData.stopLoss);
                const profit = Math.abs(takeProfitPrice - entryPrice);
                const loss = Math.abs(entryPrice - stopLossPrice);
                riskRewardRatio = (profit / loss).toFixed(2);
            }

            const embed = {
                author: {
                    name: `${signalData.coinSymbol}-${positionTypeText}`,
                    icon_url: coinIcon,
                },
                title: `交易信號`,
                color: embedColor,
                fields: [
                    {
                        name: '💎 幣種',
                        value: `\`${signalData.coinName}\``,
                        inline: false
                    },
                    {
                        name: '📍 開倉價格',
                        value: `\`${signalData.entryPrice || '未設定'}\``,
                        inline: true
                    },
                    {
                        name: '🎯 止盈目標',
                        value: `\`${signalData.takeProfit || '未設定'}\``,
                        inline: true
                    },
                    {
                        name: '🛡️ 止損價格',
                        value: `\`${signalData.stopLoss || '未設定'}\``,
                        inline: true
                    }
                ],
                footer: {
                    text: `${signalData.sender}`,
                    icon_url: userAvatar,
                },
                timestamp: new Date(signalData.timestamp).toISOString()
            };

            // 添加開倉原因
            if (signalData.reason) {
                embed.fields.push({
                    name: '📝 開倉原因',
                    value: signalData.reason,
                    inline: false
                });
            }

            // 添加盈虧比
            if (riskRewardRatio) {
                embed.fields.push({
                    name: '📊 盈虧比',
                    value: `\`${riskRewardRatio}:1\``,
                    inline: true
                });
            }

            // 調用 Bot API 更新消息（不更新標籤，標籤由用戶單獨管理）
            console.log('📤 Sending to Discord Bot:', {
                threadId: signalData.threadId
            });
            
            const response = await axios.patch(
                `http://localhost:3001/api/update-thread-message/${signalData.threadId}`,
                { 
                    embed
                    // 不傳 appliedTags，保持標籤不變
                },
                {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}`,
                    }
                }
            );

            console.log('✅ Discord message updated successfully:', response.data);
        } catch (error) {
            console.error('Failed to update Discord message:', error);
            // 不顯示錯誤提示，因為這是次要功能
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/signals/${params.id}`);
                if (!res.ok) {
                    if (res.status === 403) {
                        toaster.create({ title: '無權限訪問', type: 'error' });
                        router.push('/history');
                        return;
                    }
                    throw new Error('Failed to fetch signal');
                }
                const data = await res.json();
                setSignal(data.signal);
                setLogs(data.logs);
                setEditForm({
                    takeProfit: data.signal.takeProfit || '',
                    stopLoss: data.signal.stopLoss || ''
                });
                
                // 如果有 threadId，從 Discord 讀取當前標籤
                if (data.signal.threadId && session?.accessToken) {
                    try {
                        const tagsResponse = await axios.get(
                            `http://localhost:3001/api/threads/${data.signal.threadId}/tags`,
                            {
                                headers: {
                                    Authorization: `Bearer ${session.accessToken}`
                                }
                            }
                        );
                        setSelectedForumTags(tagsResponse.data.appliedTags || []);
                        console.log('📋 從 Discord 讀取到的標籤:', tagsResponse.data.appliedTags);
                    } catch (error) {
                        console.error('Failed to fetch thread tags from Discord:', error);
                        // 如果讀取失敗，保持空數組
                        setSelectedForumTags([]);
                    }
                } else {
                    setSelectedForumTags([]);
                }
            } catch (error) {
                console.error(error);
                toaster.create({ title: '載入失敗', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchData();
        }
    }, [params.id, session, router]);

    // 獲取論壇標籤
    useEffect(() => {
        const fetchForumTags = async () => {
            if (!signal?.channelId || !session?.accessToken) {
                setAvailableForumTags([]);
                return;
            }

            try {
                const response = await axios.get(
                    `http://localhost:3001/api/channels/${signal.channelId}/tags`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    }
                );
                setAvailableForumTags(response.data);
                console.log('Available forum tags:', response.data);
            } catch (error) {
                console.error('Failed to fetch forum tags:', error);
                setAvailableForumTags([]);
            }
        };

        fetchForumTags();
    }, [signal?.channelId, session?.accessToken]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/signals/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error('Update failed');

            toaster.create({ title: '更新成功', type: 'success' });
            
            // Refresh data
            const refreshRes = await fetch(`/api/signals/${params.id}`);
            const data = await refreshRes.json();
            setSignal(data.signal);
            setLogs(data.logs);

            // 同步更新 Discord 消息
            await updateDiscordMessage(data.signal);
            
        } catch (error) {
            console.error(error);
            toaster.create({ title: '更新失敗', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleTag = async (tagId: string) => {
        if (!signal || !signal.threadId) {
            toaster.create({ 
                title: '無法更新', 
                description: '此信號沒有關聯的 Discord 帖子',
                type: 'error' 
            });
            return;
        }

        // 防止重複點擊
        if (isUpdatingTags) return;

        let newSelectedTags: string[];
        
        if (selectedForumTags.includes(tagId)) {
            // 移除標籤
            newSelectedTags = selectedForumTags.filter(id => id !== tagId);
        } else {
            // 添加標籤（最多5個）
            if (selectedForumTags.length >= 5) {
                toaster.create({
                    title: '最多只能選擇 5 個標籤',
                    type: 'warning',
                    duration: 2000,
                });
                return;
            }
            newSelectedTags = [...selectedForumTags, tagId];
        }

        // 立即更新 UI
        setSelectedForumTags(newSelectedTags);
        setIsUpdatingTags(true);
        
        try {
            console.log('🏷️ Updating Discord tags:', newSelectedTags);
            
            // 立即更新 Discord
            const response = await axios.patch(
                `http://localhost:3001/api/update-thread-message/${signal.threadId}`,
                { 
                    appliedTags: newSelectedTags
                },
                {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}`,
                    }
                }
            );

            console.log('✅ Discord tags updated successfully:', response.data);
            
            toaster.create({ 
                title: '標籤已更新', 
                type: 'success',
                duration: 1500
            });
            
        } catch (error) {
            console.error('❌ Update Discord tags error:', error);
            
            // 更新失敗，恢復原來的標籤
            setSelectedForumTags(selectedForumTags);
            
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.details || error.response?.data?.error || error.message
                : '未知錯誤';
            
            toaster.create({ 
                title: '更新標籤失敗', 
                description: errorMessage,
                type: 'error' 
            });
        } finally {
            setIsUpdatingTags(false);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (!signal) return null;

    return (
        <Box p={6} maxWidth="1200px" margin="0 auto">
            <Button variant="ghost" mb={4} onClick={() => router.push('/history')}>
                <LuArrowLeft /> 返回列表
            </Button>

            <VStack gap={6} align="stretch">
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                    <Heading size="xl">管理信號: {signal.coinSymbol}</Heading>
                    <HStack gap={2}>
                        {signal.threadId && (
                            <Button 
                                variant="outline" 
                                colorPalette="blue"
                                size="sm"
                                onClick={async () => {
                                    setIsSyncingDiscord(true);
                                    await updateDiscordMessage();
                                    toaster.create({ 
                                        title: 'Discord 消息已更新', 
                                        type: 'success',
                                        duration: 2000
                                    });
                                    setIsSyncingDiscord(false);
                                }}
                                loading={isSyncingDiscord}
                            >
                                <LuRefreshCw /> 同步到 Discord
                            </Button>
                        )}
                        <Badge colorPalette={signal.positionType === 'long' ? 'green' : 'red'} size="lg">
                            {signal.positionType === 'long' ? '做多' : '做空'}
                        </Badge>
                    </HStack>
                </HStack>

                <HStack gap={6} align="start" wrap="wrap">
                    {/* 左側：編輯表單 */}
                    <Box flex={1} minW="300px">
                        <Card.Root>
                            <Card.Header>
                                <Heading size="md">信號詳情</Heading>
                            </Card.Header>
                            <Card.Body>
                                <Stack gap={4}>
                                    <Box>
                                        <Text color="gray.500" fontSize="sm">開倉價格</Text>
                                        <Text fontSize="xl" fontWeight="bold">{signal.entryPrice}</Text>
                                    </Box>
                                    
                                    <Box>
                                        <Text color="gray.500" fontSize="sm" mb={1}>止盈價格</Text>
                                        <Input 
                                            value={editForm.takeProfit}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, takeProfit: e.target.value }))}
                                        />
                                    </Box>

                                    <Box>
                                        <Text color="gray.500" fontSize="sm" mb={1}>止損價格</Text>
                                        <Input 
                                            value={editForm.stopLoss}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                                        />
                                    </Box>

                                    <Box>
                                        <Text color="gray.500" fontSize="sm">開倉原因</Text>
                                        <Text>{signal.reason || '無'}</Text>
                                    </Box>

                                    <Separator />

                                    {/* Discord 論壇標籤 */}
                                    {availableForumTags.length > 0 && (
                                        <Box>
                                            <HStack mb={2}>
                                                <LuTag />
                                                <Text color="gray.500" fontSize="sm" fontWeight="bold">論壇標籤</Text>
                                                <Text fontSize="xs" color="gray.400">(點擊即時更新，最多5個)</Text>
                                            </HStack>
                                            
                                            <Flex gap={2} wrap="wrap">
                                                {availableForumTags.map((tag) => {
                                                    const isSelected = selectedForumTags.includes(tag.id);
                                                    return (
                                                        <Badge 
                                                            key={tag.id}
                                                            colorPalette={isSelected ? 'blue' : 'gray'}
                                                            cursor={isUpdatingTags ? 'wait' : 'pointer'}
                                                            onClick={() => handleToggleTag(tag.id)}
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={1}
                                                            px={3}
                                                            py={1}
                                                            fontSize="sm"
                                                            borderWidth={isSelected ? '2px' : '1px'}
                                                            borderColor={isSelected ? 'blue.500' : 'border.emphasized'}
                                                            opacity={isUpdatingTags ? 0.6 : 1}
                                                            _hover={{ 
                                                                bg: isSelected ? 'blue.100' : 'gray.100',
                                                                transform: isUpdatingTags ? 'none' : 'scale(1.05)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {tag.emoji && tag.emoji.name && `${tag.emoji.name} `}
                                                            {tag.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </Flex>
                                            
                                            {isUpdatingTags && (
                                                <HStack mt={2} fontSize="xs" color="gray.500">
                                                    <Spinner size="xs" />
                                                    <Text>更新中...</Text>
                                                </HStack>
                                            )}
                                        </Box>
                                    )}

                                    <Button 
                                        colorPalette="blue" 
                                        onClick={handleSave} 
                                        loading={isSaving}
                                        mt={4}
                                    >
                                        <LuSave /> 保存修改
                                    </Button>
                                </Stack>
                            </Card.Body>
                        </Card.Root>
                    </Box>

                    {/* 右側：變更歷史 */}
                    <Box flex={1} minW="300px">
                        <Card.Root>
                            <Card.Header>
                                <HStack>
                                    <LuHistory />
                                    <Heading size="md">變更歷史</Heading>
                                </HStack>
                            </Card.Header>
                            <Card.Body>
                                {logs.length === 0 ? (
                                    <Text color="gray.500">尚無變更記錄</Text>
                                ) : (
                                    <Stack gap={4}>
                                        {logs.map(log => (
                                            <Box key={log.id} p={3} borderWidth="1px" borderRadius="md" bg="bg.subtle">
                                                <Text fontSize="xs" color="gray.500" mb={2}>
                                                    {new Date(log.updatedAt).toLocaleString()}
                                                </Text>
                                                <Stack gap={1}>
                                                    {log.oldTakeProfit !== log.newTakeProfit && (
                                                        <Text fontSize="sm">
                                                            止盈: <Text as="span" color="red.400" textDecoration="line-through">{log.oldTakeProfit}</Text> 
                                                            {' -> '} 
                                                            <Text as="span" color="green.500" fontWeight="bold">{log.newTakeProfit}</Text>
                                                        </Text>
                                                    )}
                                                    {log.oldStopLoss !== log.newStopLoss && (
                                                        <Text fontSize="sm">
                                                            止損: <Text as="span" color="red.400" textDecoration="line-through">{log.oldStopLoss}</Text> 
                                                            {' -> '} 
                                                            <Text as="span" color="green.500" fontWeight="bold">{log.newStopLoss}</Text>
                                                        </Text>
                                                    )}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </Card.Body>
                        </Card.Root>
                    </Box>
                </HStack>
            </VStack>
        </Box>
    );
}
