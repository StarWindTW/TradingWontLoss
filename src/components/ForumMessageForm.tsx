'use client';

import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
    Box,
    Button,
    Input,
    HStack,
    Stack,
    Spinner,
    Text,
    RadioCard,
    Image,
    Field as ChakraField,
    MenuRoot,
    MenuTrigger,
    MenuContent,
    MenuItem,
} from '@chakra-ui/react';
import {
    LuTrendingUp,
    LuTrendingDown,
    LuRefreshCw,
    LuDollarSign,
    LuChevronDown,
    LuSearch
} from 'react-icons/lu';
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle
} from 'react-icons/fa';
import { NativeSelectRoot, NativeSelectField } from '@/components/ui/native-select';
import { toaster } from '@/components/ui/toaster';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import ServerSelector from './ServerSelector';
import PositionSelector from './PositionSelector';

interface CryptoOption {
    value: string;
    label: string;
    id: string;
    symbol?: string;
    slug?: string;
    iconUrl?: string; // 添加圖標 URL 狀態
    priceChangePercent?: number; // 24小時漲跌幅
    volume?: number; // 24小時成交量 (USDT)
}

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

interface ForumMessageFormProps {
    selectedOption: CryptoOption | null;
    setSelectedOption: Dispatch<SetStateAction<CryptoOption | null>>;
    onTradingLevelsChange?: (levels: { entryPrice?: number; takeProfit?: number; stopLoss?: number }) => void;
    onSignalSent?: (signal: SignalRecord) => void;
    onServerChange?: (serverId: string) => void;
}

interface Server {
    id: string;
    name: string;
    icon: string | null;
}

interface Channel {
    id: string;
    name: string;
    type: number;
    parent: string | null;
}

interface FormData {
    serverId: string;
    channelId: string;
    positionType: 'long' | 'short';
    entryPrice: string;
    takeProfit: string;
    stopLoss: string;
}

interface CoinItem {
    id: string;
    symbol: string;
    name: string;
    tvSymbol?: string;
}

// 加密貨幣價格組件（使用幣安 API）
function CryptoPrice({ symbol }: { symbol: string }) {
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        const fetchPrice = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/binance/price?symbol=${encodeURIComponent(symbol)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPrice(data.price);
                }
            } catch (e) {
                console.error('Failed to fetch price:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrice();
    }, [symbol]);

    if (isLoading) {
        return <Spinner size="xs" />;
    }

    if (!price) {
        return null;
    }

    // 根據價格大小決定顯示精度
    const formatPrice = (price: number) => {
        if (price >= 1) {
            // 價格 >= 1，顯示 2 位小數
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 0.01) {
            // 0.01 <= 價格 < 1，顯示 4 位小數
            return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        } else if (price >= 0.0001) {
            // 0.0001 <= 價格 < 0.01，顯示 6 位小數
            return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
        } else {
            // 價格 < 0.0001，顯示 8 位小數
            return price.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
        }
    };

    return (
        <Text fontSize="sm" fontWeight="medium" color="blue.600">
            ${formatPrice(price)}
        </Text>
    );
}

export default function ForumMessageForm({
    selectedOption,
    setSelectedOption,
    onTradingLevelsChange,
    onSignalSent,
    onServerChange,
}: ForumMessageFormProps) {
    const [formData, setFormData] = useState<FormData>({
        serverId: '',
        channelId: '',
        positionType: 'long',
        entryPrice: '',
        takeProfit: '',
        stopLoss: '',
    });
    const [servers, setServers] = useState<Server[]>([]);
    const [isLoadingServers, setIsLoadingServers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasDefaultChannel, setHasDefaultChannel] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [isAutoPrice, setIsAutoPrice] = useState(false);
    const [cryptoSearch, setCryptoSearch] = useState('');
    const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
    const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);
    const previousServerIdRef = useRef<string>('');

    const { data: session } = useSession();
    // coins are provided via props (fetched in parent)

    // 載入伺服器列表
    useEffect(() => {
        const fetchServers = async () => {
            if (!session?.accessToken) {
                setIsLoadingServers(false);
                toaster.create({
                    title: '尚未登入',
                    description: '請先登入以載入伺服器列表',
                    type: 'error',
                    duration: 5000,
                });
                return;
            }

            try {
                const response = await axios.get('/api/servers');

                if (!response.data) {
                    throw new Error('伺服器回傳空資料');
                }

                setServers(response.data);
            } catch (error) {
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.error || error.message
                    : '發生未知錯誤';

                console.error('Error fetching servers:', error);
                toaster.create({
                    title: '載入伺服器失敗',
                    description: errorMessage,
                    type: 'error',
                    duration: 5000,
                });
            } finally {
                setIsLoadingServers(false);
            }
        };
        fetchServers();
    }, [session?.accessToken]);

    // 載入加密貨幣選項
    useEffect(() => {
        const fetchCryptoOptions = async () => {
            if (!cryptoSearch) {
                // 載入預設選項（從幣安獲取）
                setIsLoadingCrypto(true);
                try {
                    const res = await fetch(`/api/binance/symbols?q=`);
                    if (res.ok) {
                        const data = await res.json();
                        setCryptoOptions(data);
                    }
                } catch (e) {
                    console.error('Failed to fetch crypto options:', e);
                } finally {
                    setIsLoadingCrypto(false);
                }
                return;
            }

            // 搜尋加密貨幣（從幣安）
            setIsLoadingCrypto(true);
            try {
                const res = await fetch(`/api/binance/symbols?q=${encodeURIComponent(cryptoSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setCryptoOptions(data);
                }
            } catch (e) {
                console.error('Failed to fetch crypto options:', e);
            } finally {
                setIsLoadingCrypto(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchCryptoOptions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [cryptoSearch]);

    // 當選擇伺服器時載入預設頻道設定
    useEffect(() => {
        const fetchSettings = async () => {
            if (!formData.serverId) {
                setHasDefaultChannel(false);
                return;
            }

            try {
                // 載入預設頻道設定
                const settingsResponse = await fetch(`/api/server-settings?serverId=${formData.serverId}`);
                if (settingsResponse.ok) {
                    const settings = await settingsResponse.json();
                    if (settings.defaultChannelId) {
                        // 自動填入預設頻道
                        setFormData(prev => ({
                            ...prev,
                            channelId: settings.defaultChannelId,
                        }));
                        setHasDefaultChannel(true);

                        toaster.create({
                            title: '已載入預設頻道',
                            description: '使用 Discord 指令 /setchannel 可修改預設頻道',
                            type: 'success',
                            duration: 3000,
                        });
                    } else {
                        setHasDefaultChannel(false);
                        toaster.create({
                            title: '未設定預設頻道',
                            description: '請在 Discord 伺服器中使用 /setchannel 指令設定預設頻道',
                            type: 'warning',
                            duration: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error('載入設定失敗:', error);
                setHasDefaultChannel(false);
            }
        };

        fetchSettings();
    }, [formData.serverId]);

    // 監聽 serverId 變化並通知父組件
    useEffect(() => {
        if (formData.serverId !== previousServerIdRef.current) {
            previousServerIdRef.current = formData.serverId;
            if (onServerChange) {
                // 使用 setTimeout 確保在渲染完成後執行
                setTimeout(() => {
                    onServerChange(formData.serverId);
                }, 0);
            }
        }
    }, [formData.serverId]);

    // 監聽價格變化並更新圖表
    useEffect(() => {
        if (onTradingLevelsChange) {
            const parsePrice = (val: string) => {
                const num = parseFloat(val);
                return isNaN(num) ? undefined : num;
            };

            onTradingLevelsChange({
                entryPrice: parsePrice(formData.entryPrice),
                takeProfit: parsePrice(formData.takeProfit),
                stopLoss: parsePrice(formData.stopLoss),
            });
        }
    }, [formData.entryPrice, formData.takeProfit, formData.stopLoss]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value,
            // 當選擇新的伺服器時,清除已選擇的頻道
            ...(name === 'serverId' ? { channelId: '' } : {})
        };

        setFormData(newFormData);
    };

    // 獲取最優價格（從幣安獲取當前市場價格）
    const fetchBestPrice = async (silent = false) => {
        if (!selectedOption?.value && !selectedOption?.slug) {
            if (!silent) {
                toaster.create({
                    title: '請先選擇幣種',
                    type: 'warning',
                    duration: 2000,
                });
            }
            return;
        }

        try {
            const tradingPair = selectedOption.value || selectedOption.slug || '';
            const response = await fetch(
                `/api/binance/price?symbol=${encodeURIComponent(tradingPair)}&_t=${Date.now()}`
            );

            if (!response.ok) {
                throw new Error('無法獲取價格數據');
            }

            const data = await response.json();
            const latestPrice = data.price;
            setCurrentPrice(latestPrice);

            // 自動填入開倉價格欄位 (使用函數式更新確保獲取最新狀態)
            setFormData(prevFormData => ({
                ...prevFormData,
                entryPrice: latestPrice.toString(),
            }));

            if (!silent) {
                toaster.create({
                    title: '已填入當前價格',
                    description: `價格: ${latestPrice}`,
                    type: 'success',
                    duration: 2000,
                });
            }
        } catch (error) {
            if (!silent) {
                toaster.create({
                    title: '獲取價格失敗',
                    description: error instanceof Error ? error.message : '請稍後再試',
                    type: 'error',
                    duration: 3000,
                });
            }
        }
    };

    // 自動更新價格
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isAutoPrice && selectedOption?.symbol) {
            // 立即獲取一次
            fetchBestPrice(true);

            // 每3秒更新一次
            intervalId = setInterval(() => {
                fetchBestPrice(true);
            }, 3000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isAutoPrice, selectedOption?.symbol]);

    // 切換自動價格模式
    const toggleAutoPrice = () => {
        if (!selectedOption?.symbol) {
            toaster.create({
                title: '請先選擇幣種',
                type: 'warning',
                duration: 2000,
            });
            return;
        }
        setIsAutoPrice(!isAutoPrice);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!session?.accessToken) {
            toaster.create({
                title: '未登入',
                description: '請先登入後再試',
                type: 'error',
                duration: 5000,
            });
            return;
        }

        // 檢查是否有預設頻道
        if (!formData.channelId || !hasDefaultChannel) {
            toaster.create({
                title: '未設定預設頻道',
                description: '請先在 Discord 伺服器中使用 /setchannel 指令設定預設發送頻道',
                type: 'error',
                duration: 7000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // 整合幣種、開倉價格、止盈、止損訊息
            const coinSymbol = selectedOption?.symbol || '未指定';
            const coinName = selectedOption?.label || '未指定';
            const senderName = session?.user?.name || '未知用戶';
            const positionTypeEmoji = formData.positionType === 'long' ? '📈' : '📉';
            const positionTypeText = formData.positionType === 'long' ? '做多 LONG' : '做空 SHORT';
            const positionTypeShort = formData.positionType === 'long' ? '做多' : '做空';

            // 自動生成標題：幣種-做多/空
            const autoTitle = `${positionTypeEmoji} ${coinSymbol}-${positionTypeShort}`;

            // 計算盈虧比例
            const entryPrice = parseFloat(formData.entryPrice);
            const takeProfitPrice = parseFloat(formData.takeProfit);
            const stopLossPrice = parseFloat(formData.stopLoss);

            let riskRewardRatio = '';
            if (entryPrice && takeProfitPrice && stopLossPrice) {
                const profit = Math.abs(takeProfitPrice - entryPrice);
                const loss = Math.abs(entryPrice - stopLossPrice);
                const ratio = (profit / loss).toFixed(2);
                riskRewardRatio = ratio;
            }

            // 創建 Discord Embed
            const embedColor = formData.positionType === 'long' ? 0x00FF00 : 0xFF0000; // 綠色做多，紅色做空
            const userAvatar = session?.user?.image || '';

            // 幣種圖標 URL - 使用本地 API (公開可訪問)
            // 注意：在生產環境中，需要將 localhost 改為實際域名
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
            const coinIcon = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${coinSymbol.toUpperCase()}.png`;

            const embed = {
                author: {
                    name: `${coinSymbol}-${positionTypeText}`,
                    icon_url: coinIcon,
                },
                title: `交易信號`,
                color: embedColor,
                fields: [
                    {
                        name: '💎 幣種',
                        value: `\`${coinName}\``,
                        inline: false
                    },
                    {
                        name: '📍 開倉價格',
                        value: `\`${formData.entryPrice || '未設定'}\``,
                        inline: true
                    },
                    {
                        name: '🎯 止盈目標',
                        value: `\`${formData.takeProfit || '未設定'}\``,
                        inline: true
                    },
                    {
                        name: '🛡️ 止損價格',
                        value: `\`${formData.stopLoss || '未設定'}\``,
                        inline: true
                    }
                ],
                footer: {
                    text: `${senderName}`,
                    icon_url: userAvatar,
                },
                timestamp: new Date().toISOString()
            };

            // 如果有盈虧比，添加到 fields
            if (riskRewardRatio) {
                embed.fields.push({
                    name: '📊 盈虧比',
                    value: `\`${riskRewardRatio}:1\``,
                    inline: true
                });
            }

            const response = await axios.post(
                '/api/send-forum-message',
                {
                    channelId: formData.channelId,
                    title: autoTitle,
                    embed: embed,
                }
            );

            // 添加到歷史記錄
            if (onSignalSent) {
                const signalRecord: SignalRecord = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: Date.now(),
                    coinSymbol,
                    coinName,
                    positionType: formData.positionType,
                    entryPrice: formData.entryPrice,
                    takeProfit: formData.takeProfit,
                    stopLoss: formData.stopLoss,
                    riskRewardRatio: riskRewardRatio || undefined,
                    sender: senderName,
                    serverId: formData.serverId,
                    channelId: formData.channelId,
                    threadId: response.data?.threadId,
                };
                onSignalSent(signalRecord);
            }

            toaster.create({
                title: '訊息發送成功',
                type: 'success',
                duration: 3000,
            });

            // 重置表單 (保留 serverId、channelId 和 positionType 方便連續發送)
            const newFormData = {
                ...formData,
                entryPrice: '',
                takeProfit: '',
                stopLoss: '',
            };
            setFormData(newFormData);

            // 清除圖表上的價格線
            if (onTradingLevelsChange) {
                onTradingLevelsChange({
                    entryPrice: undefined,
                    takeProfit: undefined,
                    stopLoss: undefined,
                });
            }
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || error.message
                : '發生未知錯誤';

            toaster.create({
                title: '發送失敗',
                description: errorMessage,
                type: 'error',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingServers) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box
            width="100%"
            // maxWidth="600px"
            margin="0 auto"
            padding={6}
        >
            <form onSubmit={handleSubmit}>
                <Stack gap={6}>
                    <ChakraField.Root required>
                        <ChakraField.Label>選擇伺服器</ChakraField.Label>
                        <ServerSelector
                            width="100%"
                            servers={servers}
                            selectedServerId={formData.serverId}
                            onSelect={(serverId) => {
                                setFormData(prev => ({
                                    ...prev,
                                    serverId: serverId,
                                    channelId: ''
                                }));
                            }}
                        />
                    </ChakraField.Root>

                    {hasDefaultChannel && formData.channelId && (
                        <Box
                            p={3}
                            bg="green.50"
                            borderRadius="md"
                            borderLeft="4px solid"
                            borderColor="green.500"
                            display="flex"
                            alignItems="center"
                            gap={2}
                        >
                            <FaCheckCircle size={20} color="green" />
                            <Box>
                                <Text fontSize="sm" color="green.700">
                                    已設定預設頻道 (頻道ID: {formData.channelId})
                                </Text>
                                <Text fontSize="xs" color="green.600" mt={1}>
                                    如需更改，請在 Discord 使用 /setchannel 指令
                                </Text>
                            </Box>
                        </Box>
                    )}
                    <ChakraField.Root>
                        <ChakraField.Label>倉位類型</ChakraField.Label>
                        <PositionSelector
                            value={formData.positionType}
                            onChange={(value) => setFormData({ ...formData, positionType: value })}
                        />
                    </ChakraField.Root>

                    {/* <Cha  */}

                    <ChakraField.Root required>
                        <ChakraField.Label>開倉價格</ChakraField.Label>
                        <Stack direction="row" gap={2}>
                            <Input
                                name="entryPrice"
                                type="number"
                                step="any"
                                value={formData.entryPrice}
                                onChange={handleChange}
                                placeholder="例如：50000"
                                flex={1}
                                disabled={isAutoPrice}
                            />
                            <Button
                                onClick={toggleAutoPrice}
                                colorPalette={isAutoPrice ? 'green' : 'blue'}
                                variant={isAutoPrice ? 'solid' : 'outline'}
                                size="md"
                                minWidth="100px"
                            >
                                {isAutoPrice ? <LuRefreshCw className="animate-spin" /> : <LuDollarSign />}
                                {isAutoPrice ? '跟價中' : '最優價'}
                            </Button>
                        </Stack>
                    </ChakraField.Root>

                    <ChakraField.Root required>
                        <ChakraField.Label>止盈價格</ChakraField.Label>
                        <Input
                            name="takeProfit"
                            type="number"
                            step="any"
                            value={formData.takeProfit}
                            onChange={handleChange}
                            placeholder="例如：55000"
                        />
                    </ChakraField.Root>

                    <ChakraField.Root required>
                        <ChakraField.Label>止損價格</ChakraField.Label>
                        <Input
                            name="stopLoss"
                            type="number"
                            step="any"
                            value={formData.stopLoss}
                            onChange={handleChange}
                            placeholder="例如：48000"
                        />
                    </ChakraField.Root>

                    <Button
                        type="submit"
                        colorPalette="blue"
                        size="lg"
                        width="full"
                        disabled={isSubmitting || !formData.channelId}
                    >
                        {isSubmitting ? '發送中...' : '發送訊息'}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}