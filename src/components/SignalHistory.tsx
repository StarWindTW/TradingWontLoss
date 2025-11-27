'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Badge,
  Text,
  Button,
  Dialog,
  HStack,
  Image,
  IconButton,
  VStack,
  Grid,
} from '@chakra-ui/react';
import { LuTrendingUp, LuTrendingDown, LuTrash2, LuCog } from 'react-icons/lu';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

interface SignalRecord {
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
  serverId: string;
  channelId: string;
  threadId?: string;
}

interface SignalHistoryProps {
  records: SignalRecord[];
  onDelete?: (id: string) => void;
  sortOrder?: 'desc' | 'asc';
}

export default function SignalHistory({ records, onDelete, sortOrder = 'desc' }: SignalHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  // 排序
  const sortedRecords = [...records].sort((a, b) => {
    return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {sortedRecords.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          尚無發送記錄
        </Text>
      ) : (
        <>
          {/* <Table.ScrollArea borderWidth="1px" borderColor="border.emphasized" rounded="xl">
            <Table.Root size="lg" stickyHeader variant="outline" bg="dcms.panel">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>幣種</Table.ColumnHeader>
                  <Table.ColumnHeader>時間</Table.ColumnHeader>
                  <Table.ColumnHeader>倉位</Table.ColumnHeader>
                  <Table.ColumnHeader>開倉價</Table.ColumnHeader>
                  <Table.ColumnHeader>止盈</Table.ColumnHeader>
                  <Table.ColumnHeader>止損</Table.ColumnHeader>
                  <Table.ColumnHeader>原因</Table.ColumnHeader>
                  <Table.ColumnHeader>盈虧比</Table.ColumnHeader>
                  <Table.ColumnHeader>發送者</Table.ColumnHeader>
                  <Table.ColumnHeader>操作</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedRecords.map((record) => (
                  <Table.Row key={record.id}>
                    <Table.Cell>
                      <HStack gap={4} alignItems="center">
                        <Image
                          src={`https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${record.coinSymbol.toUpperCase()}.png`}
                          alt={record.coinSymbol}
                          width="28px"
                          height="28px"
                          borderRadius="full"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src.endsWith('.png')) {
                              img.src = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${record.coinSymbol?.toUpperCase()}.svg`;
                            } else {
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector('.crypto-text-fallback')) {
                                const textEl = document.createElement('span');
                                textEl.className = 'crypto-text-fallback';
                                textEl.textContent = record.coinSymbol || '';
                                textEl.style.fontSize = '10px';
                                textEl.style.fontWeight = 'bold';
                                textEl.style.color = '#4A5568';
                                parent.appendChild(textEl);
                              }
                            }
                          }}
                        />
                        <Text fontWeight="bold">{record.coinSymbol}</Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell fontSize="xs">{formatTime(record.timestamp)}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={record.positionType === 'long' ? 'green' : 'red'}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        width="fit-content"
                      >
                        {record.positionType === 'long' ? <LuTrendingUp size={14} /> : <LuTrendingDown size={14} />}
                        {record.positionType === 'long' ? '做多' : '做空'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontFamily="mono">{record.entryPrice}</Table.Cell>
                    <Table.Cell fontFamily="mono" color="green.400">
                      {record.takeProfit}
                    </Table.Cell>
                    <Table.Cell fontFamily="mono" color="red.400">
                      {record.stopLoss}
                    </Table.Cell>
                    <Table.Cell maxWidth="200px">
                      <Text truncate title={record.reason || ''}>
                        {record.reason || '-'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell fontFamily="mono">
                      {record.riskRewardRatio ? `${record.riskRewardRatio}:1` : '-'}
                    </Table.Cell>
                    <Table.Cell fontSize="sm">{record.sender}</Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <IconButton
                          variant="ghost"
                          rounded="xl"
                          onClick={() => router.push(`/history/${record.id}`)}
                        >
                          <LuCog />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea> */}
          <Grid width="100%" templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={2} mt={4} overflow="hidden">
            {sortedRecords.map((record) => (
              <Box
                key={record.id}
                p={4}
                border="1px solid"
                borderColor="border.emphasized"
                bg="dcms.panel"
                _hover={{ bg: "dcms.btnHover" }}
                rounded='3xl'
                justifyContent="space-between"
                onClick={() => router.push(`/history/${record.id}`)}
                cursor="pointer"
              >
                <HStack justifyContent="space-between" mb={2} position="relative">
                  <HStack gap={4} alignItems="center">
                    <Image
                      src={`https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${record.coinSymbol.toUpperCase()}.png`}
                      alt={record.coinSymbol}
                      width="28px"
                      height="28px"
                      borderRadius="full"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.endsWith('.png')) {
                          img.src = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${record.coinSymbol?.toUpperCase()}.svg`;
                        } else {
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent && !parent.querySelector('.crypto-text-fallback')) {
                            const textEl = document.createElement('span');
                            textEl.className = 'crypto-text-fallback';
                            textEl.textContent = record.coinSymbol || '';
                            textEl.style.fontSize = '10px';
                            textEl.style.fontWeight = 'bold';
                            textEl.style.color = '#4A5568';
                            parent.appendChild(textEl);
                          }
                        }
                      }}
                    />
                    <Text fontWeight="bold">{record.coinSymbol}</Text>
                  </HStack>
                  <IconButton
                    right={0}
                    variant="ghost"
                    rounded="full"
                    colorPalette="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(record.id);
                    }}
                  >
                    <LuTrash2 />
                  </IconButton>
                </HStack>
                <Badge size="md" rounded="lg" mt={3} py={1} colorPalette={record.positionType === 'long' ? 'green' : 'red'}>
                  {record.positionType === 'long' ? '做多' : '做空'}
                </Badge>
                <HStack mt={4} justifyContent="space-between">
                  <Text>開倉價</Text>
                  <Text fontFamily="mono">{record.entryPrice}</Text>
                </HStack>
                <HStack mt={4} justifyContent="space-between">
                  <Text>止盈</Text>
                  <Text color="green.400" fontFamily="mono">{record.takeProfit}</Text>
                </HStack>
                <HStack mt={4} justifyContent="space-between">
                  <Text>止損</Text>
                  <Text color="red.400" fontFamily="mono">{record.stopLoss}</Text>
                </HStack>
                <HStack mt={4} justifyContent="space-between">
                  <Text>開倉時間</Text>
                  <Text fontFamily="mono">{formatTime(record.timestamp)}</Text>
                </HStack>
                <HStack mt={4} justifyContent="space-between">
                  <Text>開倉原因</Text>
                </HStack>
                <Box mt={2} p={3} bg="dcms.panelbox" borderRadius="xl" minHeight="40px">
                  <Text fontFamily="mono" truncate title={record.reason || ''}>{record.reason || '-'}</Text>
                </Box>
              </Box>
            ))}
          </Grid>
        </>
      )}

      <Dialog.Root open={!!deleteId} onOpenChange={(e) => !e.open && setDeleteId(null)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>確認刪除</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>確定要刪除這筆紀錄嗎？此操作無法復原。</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">取消</Button>
              </Dialog.CloseTrigger>
              <Button
                colorPalette="red"
                onClick={() => {
                  if (deleteId && onDelete) onDelete(deleteId);
                  setDeleteId(null);
                }}
              >
                確認刪除
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
