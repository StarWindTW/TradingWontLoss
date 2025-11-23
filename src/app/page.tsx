'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, VStack, HStack, Button, ButtonGroup, SegmentGroup, SegmentGroupItemText, Flex } from '@chakra-ui/react';
import AsyncSelect from 'react-select/async';
import { useSession } from 'next-auth/react';
import ForumMessageForm from '../components/ForumMessageForm';
import AuthButton from '../components/AuthButton';
import CryptoChart from '../components/CryptoChart';
import CryptoSelector from '../components/CryptoSelector';
import Sidebar from '../components/Sidebar';
import ResizableSplit from '../components/ResizableSplit';
import TestAnimation from '@/components/TestAnimation';

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

export default function Home() {
  const { data: session } = useSession();
  // Cryptocurrencies loaded from Binance Futures API
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string; id: string; slug?: string; symbol?: string } | null>({
    value: 'BTCUSDT',
    label: 'BTC',
    id: 'BTCUSDT',
    slug: 'BTCUSDT',
    symbol: 'BTC'
  });

  // Timeframe selection
  const [timeframe, setTimeframe] = useState<string | null>('1h');

  // Trading levels for chart
  const [tradingLevels, setTradingLevels] = useState<{
    entryPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
  }>({});

  // Page navigation
  const [currentPage, setCurrentPage] = useState<string>('home');

  const [selectedServerId, setSelectedServerId] = useState<string>('');

  // Add new signal to history
  const addSignalToHistory = async (signal: SignalRecord) => {
    try {
      console.log('📤 Sending signal to database:', signal);

      // 保存到數據庫
      const response = await fetch('/api/signal-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signal),
      });

      if (response.ok) {
        const savedSignal = await response.json();
        console.log('✅ Signal saved successfully!', savedSignal);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save signal:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Failed to save signal history:', error);
    }
  };

  const loadOptions = async (inputValue: string) => {
    const q = inputValue || '';
    const res = await fetch(`/api/binance/symbols?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  };

  return (
    <Box display="flex" height="calc(100vh - 65px)" overflow="hidden" bg="dcms.bg" color={{ base: "gray.900", _dark: "gray.50" }}>
      {/* {session && <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />} */}

      <Box flex={1} ml={session ? "240px" : 0} height="100%" display="flex" flexDirection="column">
        <VStack gap={0} align="stretch" height="100%">
          {/* <HStack justify="space-between" bg="bg.panel" p={4} borderBottom="1px solid" borderColor={{ base: "gray.200", _dark: "gray.800" }} flexShrink={0} position="relative">
            <Heading size="xl">
              DCMS
            </Heading>
            <AuthButton />
          </HStack> */}

          {session && (
            <>
              {/* 主頁 - 顯示圖表 */}
              {currentPage === 'home' && (
                <Flex direction="column" flex={1} pt={0} p={6} minHeight={0}>
                  {/* <TestAnimation /> */}
                  {/* <Box flexShrink={0}>
                  </Box> */}

                  <Box flex={1} minHeight={0}>
                    <ResizableSplit
                      left={
                        <Flex direction="column" height="100%">
                          <HStack mb={4} justifyContent="space-between" flexShrink={0}>
                            <CryptoSelector
                              selectedOption={selectedOption}
                              setSelectedOption={setSelectedOption}
                            />
                            <SegmentGroup.Root
                              rounded="full"
                              value={timeframe}
                              onValueChange={(e) => setTimeframe(e.value)}
                            >
                              <SegmentGroup.Indicator rounded="full" backgroundColor={{ base: "white", _dark: "gray.600" }} />
                              <SegmentGroup.Item value='15m'>
                                <SegmentGroupItemText>15分鐘</SegmentGroupItemText>
                                <SegmentGroup.ItemHiddenInput />
                              </SegmentGroup.Item>
                              <SegmentGroup.Item value='1h'>
                                <SegmentGroupItemText>1小時</SegmentGroupItemText>
                                <SegmentGroup.ItemHiddenInput />
                              </SegmentGroup.Item>
                              <SegmentGroup.Item value='4h'>
                                <SegmentGroupItemText>4小時</SegmentGroupItemText>
                                <SegmentGroup.ItemHiddenInput />
                              </SegmentGroup.Item>
                              <SegmentGroup.Item value='1d'>
                                <SegmentGroupItemText>日線</SegmentGroupItemText>
                                <SegmentGroup.ItemHiddenInput />
                              </SegmentGroup.Item>
                            </SegmentGroup.Root>
                          </HStack>

                          <Box flex={1} minHeight={0}>
                            <CryptoChart
                              symbol={selectedOption?.slug || 'BTCUSDT'}
                              interval={timeframe}
                              containerHeight="100%"
                              containerWidth={undefined}
                              entryPrice={tradingLevels.entryPrice}
                              takeProfit={tradingLevels.takeProfit}
                              stopLoss={tradingLevels.stopLoss}
                            />
                          </Box>
                        </Flex>
                      }
                      right={
                        <Box height="100%">
                          <ForumMessageForm
                            selectedOption={selectedOption}
                            setSelectedOption={setSelectedOption}
                            onTradingLevelsChange={setTradingLevels}
                            onSignalSent={addSignalToHistory}
                            onServerChange={setSelectedServerId}
                          />
                        </Box>
                      }
                    />
                  </Box>
                </Flex>
              )}

              {/* 歷史紀錄頁面 */}
              {/* {currentPage === 'history' && (
                <Box flex={1} overflowY="auto">
                  <Heading size="lg" mb={6}>歷史紀錄</Heading>
                  <SignalHistory records={signalHistory} onDelete={deleteSignal} />
                </Box>
              )} */}
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
