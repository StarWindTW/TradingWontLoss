'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
    Box,
    HStack,
    Text,
    Image,
    MenuRoot,
    MenuTrigger,
    MenuContent,
    MenuItem,
    Input,
    Spinner,
    Portal,
} from '@chakra-ui/react';
import {
    LuTrendingUp,
    LuTrendingDown,
    LuChevronDown,
    LuSearch
} from 'react-icons/lu';

interface CryptoOption {
    value: string;
    label: string;
    id: string;
    symbol?: string;
    slug?: string;
    iconUrl?: string;
    priceChangePercent?: number;
    volume?: number;
}

interface CryptoSelectorProps {
    selectedOption: CryptoOption | null;
    setSelectedOption: Dispatch<SetStateAction<CryptoOption | null>>;
}

// 加密貨幣價格組件
function CryptoPrice({ symbol, realtime = false }: { symbol: string; realtime?: boolean }) {
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!symbol || symbol.length === 0) return;

        // Initial fetch
        const fetchPrice = async () => {
            if (!price) setIsLoading(true);
            try {
                const url = `/api/binance/price?symbol=${encodeURIComponent(symbol)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setPrice(data.price);
                }
            } catch (e) {
                console.error(`❌ Exception fetching price for ${symbol}:`, e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrice();

        // WebSocket for realtime updates
        if (realtime) {
            const ws = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@aggTrade`);
            
            ws.onopen = () => {
                // console.log(`🔌 Price WS Connected: ${symbol}`);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.p) {
                        setPrice(parseFloat(data.p));
                    }
                } catch (err) {
                    console.error('WS Message Error:', err);
                }
            };

            return () => {
                ws.close();
            };
        }
    }, [symbol, realtime]);

    if (isLoading && !price) {
        return <Spinner size="xs" />;
    }

    if (!price) {
        return null;
    }

    const formatPrice = (price: number) => {
        if (price >= 100) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
        } else {
            return price.toLocaleString('en-US', { maximumFractionDigits: 8 });
        }
    };

    return (
        <Text fontWeight="medium" color="fg">
            ${formatPrice(price)}
        </Text>
    );
}

export default function CryptoSelector({ selectedOption, setSelectedOption }: CryptoSelectorProps) {
    const [cryptoSearch, setCryptoSearch] = useState('');
    const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
    const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);

    // 載入加密貨幣選項
    useEffect(() => {
        const fetchCryptoOptions = async () => {
            if (!cryptoSearch) {
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

    // 自動補全 selectedOption 的詳細資訊 (如 24h 漲跌幅)
    useEffect(() => {
        if (selectedOption && selectedOption.priceChangePercent === undefined) {
            const fetchTickerInfo = async () => {
                try {
                    const query = selectedOption.symbol || 'BTC';
                    const res = await fetch(`/api/binance/symbols?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const targetSlug = selectedOption.slug || selectedOption.value;
                        const match = data.find((item: CryptoOption) => 
                            item.slug === targetSlug || item.value === targetSlug
                        );
                        
                        if (match) {
                            setSelectedOption(prev => prev ? { ...prev, ...match } : match);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch ticker info:', e);
                }
            };
            fetchTickerInfo();
        }
    }, [selectedOption, setSelectedOption]);

    return (
        <HStack gap={3}>
            <Box width="100%" maxWidth="400px" position="relative">
                <MenuRoot positioning={{ placement: "bottom-start", gutter: 8 }}>
                    <MenuTrigger asChild>
                        <Box
                            as="h1"
                            fontSize="2xl"
                            fontWeight="bold"
                            cursor="pointer"
                            _hover={{ color: 'blue.500' }}
                            transition="color 0.2s"
                            mb={2}
                        >
                            <HStack gap={3} justify="space-between">
                                <HStack gap={3}>
                                    {selectedOption && (
                                        <Box
                                            width="32px"
                                            height="32px"
                                            borderRadius="full"
                                            bg="gray.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            overflow="hidden"
                                        >
                                            {selectedOption.iconUrl ? (
                                                selectedOption.iconUrl === 'text' ? (
                                                    <Text fontSize="12px" fontWeight="bold" color="#4A5568">
                                                        {selectedOption.symbol}
                                                    </Text>
                                                ) : (
                                                    <Image
                                                        src={selectedOption.iconUrl}
                                                        alt={selectedOption.symbol}
                                                        width="32px"
                                                        height="32px"
                                                        borderRadius="full"
                                                    />
                                                )
                                            ) : (
                                                <Image
                                                    src={`https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${selectedOption.symbol?.toUpperCase()}.png`}
                                                    alt={selectedOption.symbol}
                                                    width="32px"
                                                    height="32px"
                                                    borderRadius="full"
                                                    onError={(e) => {
                                                        const img = e.currentTarget;
                                                        if (img.src.endsWith('.png')) {
                                                            img.src = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${selectedOption.symbol?.toUpperCase()}.svg`;
                                                        } else {
                                                            setSelectedOption(prev => prev ? { ...prev, iconUrl: 'text' } : null);
                                                        }
                                                    }}
                                                    onLoad={() => {
                                                        const img = document.querySelector(`img[alt="${selectedOption.symbol}"]`) as HTMLImageElement;
                                                        if (img && img.src) {
                                                            setSelectedOption(prev => prev ? { ...prev, iconUrl: img.src } : null);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                    <Text>
                                        {selectedOption ? selectedOption.label + "USDT" : '選擇加密貨幣'}
                                    </Text>
                                </HStack>
                                <Box as={LuChevronDown} fontSize="xl" color="gray.500" />
                            </HStack>
                        </Box>
                    </MenuTrigger>
                    <MenuContent
                        maxWidth="600px"
                        rounded="2xl"
                        boxShadow="0 10px 40px rgba(0, 0, 0, 0)"
                        border="1px solid"
                        borderColor="border.emphasized"
                        bg="bg.muted"
                        overflow="hidden"
                        zIndex={9999}
                        position="absolute"
                        p={0}
                    >
                        <Box p={1.5} pb={1} position="sticky" top={0} zIndex={1}>
                            <Box position="relative">
                                <Box
                                    position="absolute"
                                    left="12px"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    color="gray.500"
                                    pointerEvents="none"
                                    zIndex={1}
                                >
                                    <LuSearch size={18} />
                                </Box>
                                <Input
                                    placeholder="搜尋加密貨幣..."
                                    value={cryptoSearch}
                                    onChange={(e) => setCryptoSearch(e.target.value)}
                                    size="md"
                                    autoFocus
                                    bg="bg.emphasized"
                                    variant="subtle"
                                    focusRingColor="border.emphasized"
                                    focusRingWidth="0"
                                    rounded="xl"
                                    paddingLeft="40px"
                                />
                            </Box>
                        </Box>
                        {/* 表格標題 */}
                        <Box
                            px={4}
                            py={2}
                            borderBottom="1px solid"
                            borderColor="border.emphasized"
                            position="sticky"
                            top="20px"
                            zIndex={1}
                        >
                            <HStack width="100%" justify="space-between">
                                <Box width="180px">
                                    <Text fontSize="xs" fontWeight="bold" color="fg.subtle">幣種</Text>
                                </Box>
                                <HStack>
                                    <Box width="120px" textAlign="right">
                                        <Text fontSize="xs" fontWeight="bold" color="fg.subtle">最新價格</Text>
                                    </Box>
                                    <Box width="100px" textAlign="right">
                                        <Text fontSize="xs" fontWeight="bold" color="fg.subtle">24h漲跌幅</Text>
                                    </Box>
                                </HStack>
                            </HStack>
                        </Box>
                        <Box mb={3} maxHeight="400px" overflowY="auto">
                            {isLoadingCrypto ? (
                                <Box p={4} textAlign="center">
                                    <Spinner size="md" />
                                </Box>
                            ) : cryptoOptions.length === 0 ? (
                                <Box p={4} textAlign="center" color="gray.500">
                                    找不到相關的加密貨幣
                                </Box>
                            ) : (
                                cryptoOptions.map((option) => (
                                    <MenuItem
                                        key={option.value}
                                        value={option.value}
                                        onClick={() => {
                                            console.log('Selected option:', option);
                                            setSelectedOption(option);
                                        }}
                                        cursor="pointer"
                                        _hover={{ bg: 'bg.panel' }}
                                        // _hover={{ bg: 'blue.50' }}
                                        px={4}
                                        py={1.5}
                                    >
                                        <HStack width="100%" justify="space-between" gap={2}>
                                            {/* 幣種欄位 */}
                                            <HStack gap={3} width="180px">
                                                <Box
                                                    width="28px"
                                                    height="28px"
                                                    borderRadius="full"
                                                    bg="bg.emphasized"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    overflow="hidden"
                                                    flexShrink={0}
                                                >
                                                    <Image
                                                        src={`https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${option.symbol?.toUpperCase()}.png`}
                                                        alt={option.symbol}
                                                        width="28px"
                                                        height="28px"
                                                        borderRadius="full"
                                                        onError={(e) => {
                                                            const img = e.currentTarget;
                                                            if (img.src.endsWith('.png')) {
                                                                img.src = `https://cdn.jsdelivr.net/gh/StarWindTW/Binance-Icons/icons/${option.symbol?.toUpperCase()}.svg`;
                                                            } else {
                                                                img.style.display = 'none';
                                                                const parent = img.parentElement;
                                                                if (parent && !parent.querySelector('.crypto-text-fallback')) {
                                                                    const textEl = document.createElement('span');
                                                                    textEl.className = 'crypto-text-fallback';
                                                                    textEl.textContent = option.symbol || '';
                                                                    textEl.style.fontSize = '10px';
                                                                    textEl.style.fontWeight = 'bold';
                                                                    textEl.style.color = '#4A5568';
                                                                    parent.appendChild(textEl);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Box minWidth="0">
                                                    <Text fontWeight="semibold" fontSize="sm">{option.symbol}</Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        成交量: {option.volume ? `${(option.volume / 1000000).toFixed(2)}M` : '-'}
                                                    </Text>
                                                </Box>
                                            </HStack>
                                            <HStack>
                                                {/* 最新價格欄位 */}
                                                <Box width="120px" textAlign="right">
                                                    {option.value && option.value.length > 0 ? (
                                                        <CryptoPrice symbol={option.value} />
                                                    ) : option.slug && option.slug.length > 0 ? (
                                                        <CryptoPrice symbol={option.slug} />
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.400">-</Text>
                                                    )}
                                                </Box>

                                                {/* 24h漲跌幅欄位 */}
                                                <Box width="100px" textAlign="right">
                                                    {option.priceChangePercent !== undefined && (
                                                        <HStack gap={1} justify="flex-end">
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="semibold"
                                                                color={option.priceChangePercent >= 0 ? 'green.500' : 'red.500'}
                                                            >
                                                                {option.priceChangePercent >= 0 ? '+' : ''}{option.priceChangePercent.toFixed(2)}%
                                                            </Text>
                                                        </HStack>
                                                    )}
                                                </Box>
                                            </HStack>
                                        </HStack>
                                    </MenuItem>
                                ))
                            )}
                        </Box>
                    </MenuContent>
                </MenuRoot>
            </Box>
            {selectedOption && (
                <Box>
                    <HStack align="center">
                        <CryptoPrice symbol={selectedOption.value || selectedOption.slug || ''} realtime={true} />
                    </HStack>
                    {selectedOption.priceChangePercent !== undefined && (
                        <HStack gap={1}>
                            <Text
                                fontSize="sm"
                                fontWeight="semibold"
                                color={selectedOption.priceChangePercent >= 0 ? 'green.500' : 'red.500'}
                            >
                                {selectedOption.priceChangePercent >= 0 ? '+' : ''}{selectedOption.priceChangePercent.toFixed(2)}%
                            </Text>
                        </HStack>
                    )}
                </Box>
            )}
        </HStack>
    );
}
