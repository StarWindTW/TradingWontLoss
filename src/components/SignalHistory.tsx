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
} from '@chakra-ui/react';
import { LuTrendingUp, LuTrendingDown, LuTrash2 } from 'react-icons/lu';
import { toaster } from '@/components/ui/toaster';

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
}

export default function SignalHistory({ records, onDelete }: SignalHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      <Heading size="md" mb={4}>
        發送歷史記錄
      </Heading>
      
      {records.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          尚無發送記錄
        </Text>
      ) : (
        <Table.ScrollArea>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>時間</Table.ColumnHeader>
                <Table.ColumnHeader>幣種</Table.ColumnHeader>
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
              {records.map((record) => (
                <Table.Row key={record.id}>
                  <Table.Cell fontSize="xs">{formatTime(record.timestamp)}</Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="bold">{record.coinSymbol}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {record.coinName}
                    </Text>
                  </Table.Cell>
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
                    <Button
                      size="xs"
                      colorPalette="red"
                      onClick={() => setDeleteId(record.id)}
                    >
                      <LuTrash2 />
                      刪除
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
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
