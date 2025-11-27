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
    Separator
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LuArrowLeft, LuSave, LuHistory } from 'react-icons/lu';

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
            
        } catch (error) {
            console.error(error);
            toaster.create({ title: '更新失敗', type: 'error' });
        } finally {
            setIsSaving(false);
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
                <HStack justify="space-between">
                    <Heading size="xl">管理信號: {signal.coinSymbol}</Heading>
                    <Badge colorPalette={signal.positionType === 'long' ? 'green' : 'red'} size="lg">
                        {signal.positionType === 'long' ? '做多' : '做空'}
                    </Badge>
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
