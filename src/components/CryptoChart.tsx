'use client';

import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, IChartApi, ISeriesApi, LineStyle, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box, Spinner, Center, Flex } from '@chakra-ui/react';
import { useColorMode } from './ui/color-mode';
import html2canvas from 'html2canvas';

export interface CryptoChartRef {
  takeScreenshot: () => Promise<Blob | null>;
}

interface CryptoChartProps {
  containerHeight?: number | string;
  containerWidth?: number;
  symbol?: string;
  interval?: string | null;
  entryPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}

const getIntervalMilliseconds = (interval: string) => {
  const unit = interval.slice(-1);
  const value = parseInt(interval.slice(0, -1));
  if (isNaN(value)) return 60 * 60 * 1000;
  
  switch(unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
};

const CryptoChart = forwardRef<CryptoChartRef, CryptoChartProps>(({
  containerHeight = '100%',
  containerWidth = 600,
  symbol = 'BTCUSDT',
  interval = '1h',
  entryPrice,
  takeProfit,
  stopLoss,
}, ref) => {
  const { colorMode } = useColorMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshot: async () => {
      if (containerRef.current) {
        try {
          const canvas = await html2canvas(containerRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: colorMode === 'dark' ? '#27272a' : '#FFFFFF',
            logging: false,
            scale: 2, // Higher quality
          });
          return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
          });
        } catch (error) {
          console.error('Screenshot failed:', error);
          return null;
        }
      }
      return null;
    }
  }));

  const chartInstanceRef = useRef<IChartApi | null>(null);
  const macdChartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const latestChartDataRef = useRef<any[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [macdHeight, setMacdHeight] = useState(150);
  const isResizingRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    
    // Limit the height (min 50px, max container height - 100px)
    if (newHeight >= 50 && newHeight <= containerRect.height - 100) {
      setMacdHeight(newHeight);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, stopResizing]);

  const getChartTheme = (isDark: boolean) => {
    // Lightweight Charts 建議使用明確的 Hex 色碼，避免 CSS 變數在 Canvas 中無法解析的問題
    // 對應 dcms.panel: Dark -> gray.800 (#1A202C), Light -> white (#FFFFFF)
    const backgroundColor = isDark ? '#27272a' : '#FFFFFF';
    const textColor = isDark ? '#E2E8F0' : '#333333';
    const gridColor = isDark ? '#3f3f46' : '#e4e4e7';
    const borderColor = isDark ? '#3f3f46' : '#e4e4e7';

    return {
      layout: {
        textColor: textColor,
        background: { type: ColorType.Solid, color: backgroundColor }
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      timeScale: {
        borderColor: borderColor,
      },
    };
  };

  const calculateEMA = (data: any[], count: number) => {
    if (data.length < count) return [];
    
    const result = [];
    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += data[i].close;
    }
    let ema = sum / count;
    
    // Push the first EMA point
    result.push({ time: data[count - 1].time, value: ema });

    const multiplier = 2 / (count + 1);

    for (let i = count; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
      result.push({ time: data[i].time, value: ema });
    }
    return result;
  };

  const calculateMACD = (data: any[]) => {
    const fastLength = 12;
    const slowLength = 26;
    const signalLength = 9;

    if (data.length < slowLength) return { macdData: [], signalData: [], histogramData: [] };

    const getEMA = (values: number[], length: number) => {
      const k = 2 / (length + 1);
      const emaArray = new Array(values.length).fill(undefined);
      let sum = 0;
      for (let i = 0; i < length; i++) {
        sum += values[i];
      }
      emaArray[length - 1] = sum / length;
      for (let i = length; i < values.length; i++) {
        emaArray[i] = (values[i] - emaArray[i - 1]) * k + emaArray[i - 1];
      }
      return emaArray;
    };

    const closes = data.map(d => d.close);
    const ema12 = getEMA(closes, fastLength);
    const ema26 = getEMA(closes, slowLength);

    const macdLine = new Array(data.length).fill(undefined);
    for (let i = 0; i < data.length; i++) {
      if (ema12[i] !== undefined && ema26[i] !== undefined) {
        macdLine[i] = ema12[i] - ema26[i];
      }
    }

    const signalLine = new Array(data.length).fill(undefined);
    let firstValidMacdIdx = -1;
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] !== undefined) {
        firstValidMacdIdx = i;
        break;
      }
    }

    if (firstValidMacdIdx !== -1 && data.length >= firstValidMacdIdx + signalLength) {
      let sum = 0;
      for (let i = 0; i < signalLength; i++) {
        sum += macdLine[firstValidMacdIdx + i];
      }
      signalLine[firstValidMacdIdx + signalLength - 1] = sum / signalLength;
      const k = 2 / (signalLength + 1);
      for (let i = firstValidMacdIdx + signalLength; i < data.length; i++) {
        signalLine[i] = (macdLine[i] - signalLine[i - 1]) * k + signalLine[i - 1];
      }
    }

    const macdData = [];
    const signalData = [];
    const histogramData = [];

    for (let i = 0; i < data.length; i++) {
      const time = data[i].time;
      if (macdLine[i] !== undefined && signalLine[i] !== undefined) {
        macdData.push({ time, value: macdLine[i] });
        signalData.push({ time, value: signalLine[i] });
        histogramData.push({
          time,
          value: macdLine[i] - signalLine[i],
          color: (macdLine[i] - signalLine[i]) >= 0 ? '#26a69a' : '#ef5350'
        });
      } else {
        // Push whitespace data to keep alignment with the main chart
        macdData.push({ time });
        signalData.push({ time });
        histogramData.push({ time });
      }
    }

    return { macdData, signalData, histogramData };
  };





  useEffect(() => {
    // Resize handler
    const handleResize = () => {
      if (chartInstanceRef.current && chartContainerRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
      if (macdChartInstanceRef.current && macdContainerRef.current) {
        macdChartInstanceRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth,
          height: macdContainerRef.current.clientHeight
        });
      }
    };

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    if (macdContainerRef.current) {
      resizeObserver.observe(macdContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerHeight]);

  useEffect(() => {
    const fetchData = async (isUpdate = false) => {
      try {
        if (!isUpdate) {
          setIsLoading(true);
        }
        setError(null);

        // 驗證 symbol 格式
        console.log('🔍 CryptoChart received symbol:', symbol);
        if (!symbol || !symbol.endsWith('USDT')) {
          console.error('❌ Invalid symbol format received:', symbol);
          setError(`無效的交易對格式: ${symbol}`);
          setIsLoading(false);
          return;
        }

        // Fetch K線數據從幣安合約 API
        console.log(isUpdate ? 'Updating chart data...' : 'Fetching chart data for symbol:', symbol, 'interval:', interval);
        const resp = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=500&_t=${Date.now()}`);
        console.log('API response status:', resp.status);

        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('API error:', errorText);
          throw new Error('Failed to fetch data');
        }

        const data = await resp.json();
        console.log('Received data points:', data.length);

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('Chart data is empty');
          setError('無圖表數據');
          setIsLoading(false);
          return;
        }

        // 轉換幣安數據格式為 lightweight-charts 格式
        const chartData = data.map((item: any) => ({
          time: Math.floor(item.time / 1000) as any, // 毫秒轉秒
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));
        
        latestChartDataRef.current = chartData;

        // Calculate EMA data
        const ema200Data = calculateEMA(chartData, 120);
        
        // Calculate MACD data
        const { macdData, signalData, histogramData } = calculateMACD(chartData);

        // Check if container is ready
        if (!chartContainerRef.current || !macdContainerRef.current) {
          console.warn('Chart container not ready yet');
          setIsLoading(false);
          return;
        }

        // Create or update chart
        if (!chartInstanceRef.current) {
          console.log('Creating chart with', chartData.length, 'data points');

          const themeOptions = getChartTheme(colorMode === 'dark');

          const chartOptions = {
            width: chartContainerRef.current.clientWidth || containerWidth,
            height: chartContainerRef.current.clientHeight || (typeof containerHeight === 'number' ? containerHeight : 400),
            crosshair: {
              mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
              minimumWidth: 90,
            },
            ...themeOptions,
            timeScale: {
              ...themeOptions.timeScale,
              visible: false,
              timeVisible: true,
              secondsVisible: false,
            },
            localization: {
              timeFormatter: (time: number) => {
                const date = new Date(time * 1000);
                // Convert to UTC+8 (Taipei time)
                const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                const year = utc8Date.getUTCFullYear();
                const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(utc8Date.getUTCDate()).padStart(2, '0');
                const hours = String(utc8Date.getUTCHours()).padStart(2, '0');
                const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
              },
            },
          };

          chartInstanceRef.current = createChart(chartContainerRef.current, chartOptions);
          
          // Create MACD Chart
          const macdOptions = {
            width: macdContainerRef.current!.clientWidth || containerWidth,
            height: macdContainerRef.current!.clientHeight || macdHeight,
            crosshair: {
              mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
              minimumWidth: 90,
            },
            ...themeOptions,
            timeScale: {
              ...themeOptions.timeScale,
              timeVisible: true,
              secondsVisible: false,
            },
            layout: {
              ...themeOptions.layout,
              attributionLogo: false,
            },
          };
          macdChartInstanceRef.current = createChart(macdContainerRef.current!, macdOptions);

          // Sync Charts
          chartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range && macdChartInstanceRef.current) {
              macdChartInstanceRef.current.timeScale().setVisibleLogicalRange(range);
            }
          });

          macdChartInstanceRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range && chartInstanceRef.current) {
              chartInstanceRef.current.timeScale().setVisibleLogicalRange(range);
            }
          });

          // Sync Crosshair
          chartInstanceRef.current.subscribeCrosshairMove((param) => {
            if (!macdChartInstanceRef.current || !macdSeriesRef.current || !chartContainerRef.current || !macdContainerRef.current) return;
            
            if (param.time && param.point) {
               // Sync Y position relatively
               const priceHeight = chartContainerRef.current.clientHeight;
               const macdHeight = macdContainerRef.current.clientHeight;
               const ratio = param.point.y / priceHeight;
               const targetY = ratio * macdHeight;
               
               const price = macdSeriesRef.current.coordinateToPrice(targetY);
               
               if (price !== null) {
                   macdChartInstanceRef.current.setCrosshairPosition(price, param.time, macdSeriesRef.current);
               }
            } else {
               macdChartInstanceRef.current.clearCrosshairPosition();
            }
          });

          macdChartInstanceRef.current.subscribeCrosshairMove((param) => {
            if (!chartInstanceRef.current || !candlestickSeriesRef.current || !chartContainerRef.current || !macdContainerRef.current) return;
            
            if (param.time && param.point) {
               // Sync Y position relatively
               const priceHeight = chartContainerRef.current.clientHeight;
               const macdHeight = macdContainerRef.current.clientHeight;
               const ratio = param.point.y / macdHeight;
               const targetY = ratio * priceHeight;
               
               const price = candlestickSeriesRef.current.coordinateToPrice(targetY);
               
               if (price !== null) {
                   chartInstanceRef.current.setCrosshairPosition(price, param.time, candlestickSeriesRef.current);
               }
            } else {
               chartInstanceRef.current.clearCrosshairPosition();
            }
          });

          console.log('Chart instance created');

          // Add candlestick series
          candlestickSeriesRef.current = chartInstanceRef.current.addSeries(CandlestickSeries, {
            upColor: '#089981',
            downColor: '#F23645',
            borderVisible: false,
            wickUpColor: '#089981',
            wickDownColor: '#F23645',
            lastValueVisible: true,
          });

          ema50SeriesRef.current = chartInstanceRef.current.addSeries(LineSeries, {
            color: '#2962FF', // Purple
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            crosshairMarkerVisible: false,
            lastValueVisible: true,
            priceLineVisible: false,
            // title: 'EMA 120',
          });

          // Add MACD series
          histogramSeriesRef.current = macdChartInstanceRef.current.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
              type: 'price',
              precision: 5,
              minMove: 0.00001,
            },
            priceScaleId: 'right',
          });

          // Add Zero Line
          histogramSeriesRef.current.createPriceLine({
            price: 0,
            color: '#787B86',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: '',
          });

          macdSeriesRef.current = macdChartInstanceRef.current.addSeries(LineSeries, {
            color: '#2962FF',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });

          signalSeriesRef.current = macdChartInstanceRef.current.addSeries(LineSeries, {
            color: '#FF6D00',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          
          console.log('Series created successfully');
        }
        
        // Update data
        candlestickSeriesRef.current?.setData(chartData);
        ema50SeriesRef.current?.setData(ema200Data);
        
        histogramSeriesRef.current?.setData(histogramData);
        macdSeriesRef.current?.setData(macdData);
        signalSeriesRef.current?.setData(signalData);

        console.log('Data updated successfully');        // Fit content (only on initial load)
        if (!isUpdate) {
          chartInstanceRef.current?.timeScale().fitContent();

          // Set visible range to show recent data
          if (chartData.length > 100) {
            chartInstanceRef.current?.timeScale().setVisibleRange({
              from: chartData[chartData.length - 100].time as any,
              to: chartData[chartData.length - 1].time as any,
            });
          }
        }

        if (!isUpdate) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load chart data');
        if (!isUpdate) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    fetchData(false);

    // WebSocket connection for real-time updates
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      if (!symbol || !interval) return;

      const wsSymbol = symbol.toLowerCase();
      const wsInterval = interval;
      const wsUrl = `wss://fstream.binance.com/ws/${wsSymbol}@kline_${wsInterval}`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket Connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.e === 'kline') {
          const kline = message.k;
          const candle = {
            time: Math.floor(kline.t / 1000) as any,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };

          // Update latestChartDataRef
          const currentData = latestChartDataRef.current;
          if (currentData.length === 0) return;

          const lastIndex = currentData.length - 1;
          const lastCandle = currentData[lastIndex];

          if (lastCandle.time === candle.time) {
              // Update existing candle
              currentData[lastIndex] = candle;
          } else if (candle.time > lastCandle.time) {
              // Add new candle
              currentData.push(candle);
              // Limit data size
              if (currentData.length > 2000) currentData.shift();
          } else {
              // Ignore old data
              return;
          }

          // Update chart series
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.update(candle);
          }

          // Recalculate indicators for the updated data
          // We only need to update the last point(s)
          const ema50Data = calculateEMA(currentData, 120);
          const { macdData, signalData, histogramData } = calculateMACD(currentData);

          if (ema50SeriesRef.current && ema50Data.length > 0) {
              ema50SeriesRef.current.update(ema50Data[ema50Data.length - 1]);
          }
          
          if (macdSeriesRef.current && macdData.length > 0) {
              macdSeriesRef.current.update(macdData[macdData.length - 1]);
          }
          if (signalSeriesRef.current && signalData.length > 0) {
              signalSeriesRef.current.update(signalData[signalData.length - 1]);
          }
          if (histogramSeriesRef.current && histogramData.length > 0) {
              histogramSeriesRef.current.update(histogramData[histogramData.length - 1]);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
      };
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (ws) {
        console.log('🔌 Disconnecting WebSocket');
        ws.close();
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
        candlestickSeriesRef.current = null;
        ema50SeriesRef.current = null;
        priceLinesRef.current = [];
      }
      if (macdChartInstanceRef.current) {
        macdChartInstanceRef.current.remove();
        macdChartInstanceRef.current = null;
        macdSeriesRef.current = null;
        signalSeriesRef.current = null;
        histogramSeriesRef.current = null;
      }
    };
  }, [containerHeight, containerWidth, symbol, interval]);

  // Update price lines when trading levels change
  useEffect(() => {
    if (!chartInstanceRef.current || !candlestickSeriesRef.current) return;

    // Remove existing price lines
    priceLinesRef.current.forEach(line => {
      if (line && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(line);
      }
    });
    priceLinesRef.current = [];

    // Add entry price line
    if (entryPrice && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: '#FFC107',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: '開倉',
      });
      priceLinesRef.current.push(line);
    }

    // Add take profit line
    if (takeProfit && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: takeProfit,
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '止盈',
      });
      priceLinesRef.current.push(line);
    }

    // Add stop loss line
    if (stopLoss && candlestickSeriesRef.current) {
      const line = candlestickSeriesRef.current.createPriceLine({
        price: stopLoss,
        color: '#F44336',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '止損',
      });
      priceLinesRef.current.push(line);
    }
  }, [entryPrice, takeProfit, stopLoss]);

  // Update chart theme when color mode changes
  useEffect(() => {
    const themeOptions = getChartTheme(colorMode === 'dark');
    
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions(themeOptions);
    }
    if (macdChartInstanceRef.current) {
      macdChartInstanceRef.current.applyOptions({
        ...themeOptions,
        layout: {
          ...themeOptions.layout,
          attributionLogo: false,
        },
      });
    }
  }, [colorMode]);

  return (
    <Flex ref={containerRef} direction="column" position="relative" width="100%" height={containerHeight} rounded="xl" gap={0}>
      {isLoading && (
        <Center
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="dcms.panel"
          zIndex={10}
          rounded="xl"
        >
          <Spinner size="xl" color="blue.500" />
        </Center>
      )}
      {error && (
        <Center
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="rgba(255, 255, 255, 0.9)"
          zIndex={10}
        >
          <Box color="red.500" fontWeight="semibold">{error}</Box>
        </Center>
      )}
      <Box ref={chartContainerRef} flex={1} width="100%" roundedTop="2xl" overflow="hidden" border="1px solid" borderColor="border.emphasized" />
      


      {/* Resize Handle */}
      <Box
        height="3px"
        bg="transparent"
        _hover={{ bg: "blue.500" }}
        cursor="ns-resize"
        onMouseDown={startResizing}
        width="100%"
        zIndex={20}
        transition="background 0.2s"
        opacity={0.5}
      />

      <Box ref={macdContainerRef} height={`${macdHeight}px`} width="100%" roundedBottom="2xl" overflow="hidden" border="1px solid" borderColor="border.emphasized" borderTop="none" />
    </Flex>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;
