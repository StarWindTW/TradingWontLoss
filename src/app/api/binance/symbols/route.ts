import { NextResponse } from 'next/server';
import { apiCache } from '@/lib/cache';

const SYMBOLS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  const cacheKey = `binance:symbols:${q}`;
  const cached = apiCache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // 定義 API 端點優先級
    const endpoints = [
      {
        name: 'futures',
        info: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
        ticker: 'https://fapi.binance.com/fapi/v1/ticker/24hr',
        type: 'future'
      },
      {
        name: 'spot_vision',
        info: 'https://data-api.binance.vision/api/v3/exchangeInfo',
        ticker: 'https://data-api.binance.vision/api/v3/ticker/24hr',
        type: 'spot'
      },
      {
        name: 'spot_us',
        info: 'https://api.binance.us/api/v3/exchangeInfo',
        ticker: 'https://api.binance.us/api/v3/ticker/24hr',
        type: 'spot_us'
      }
    ];

    let infoData;
    let tickerData;
    let activeEndpoint: { name: string; info: string; ticker: string; type: string } | undefined;

    // 嘗試獲取數據
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to fetch symbols from ${endpoint.name}...`);
        const [infoRes, tickerRes] = await Promise.all([
          fetch(endpoint.info),
          fetch(endpoint.ticker)
        ]);

        if (infoRes.ok && tickerRes.ok) {
          infoData = await infoRes.json();
          tickerData = await tickerRes.json();
          activeEndpoint = endpoint;
          console.log(`Successfully fetched symbols from ${endpoint.name}`);
          break;
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${endpoint.name}:`, e);
      }
    }

    if (!infoData || !tickerData) {
      throw new Error('Failed to fetch symbols from all endpoints');
    }
    
    // 建立交易量和價格變化對照表
    const tickerMap = new Map();
    tickerData.forEach((ticker: any) => {
      tickerMap.set(ticker.symbol, {
        volume: parseFloat(ticker.quoteVolume),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
      });
    });
    
    // 處理不同來源的數據
    const usdtPairs = infoData.symbols
      .filter((symbol: any) => {
        if (activeEndpoint?.type === 'future') {
          // 合約市場過濾邏輯
          return symbol.symbol.endsWith('USDT') && 
                 symbol.contractType === 'PERPETUAL' &&
                 symbol.status === 'TRADING' &&
                 !symbol.baseAsset.includes('_');
        } else if (activeEndpoint?.type === 'spot_us') {
          // Binance.US 過濾邏輯 (主要是 USD 交易對)
          return (symbol.symbol.endsWith('USD') || symbol.symbol.endsWith('USDT')) && 
                 symbol.status === 'TRADING';
        } else {
          // 現貨市場過濾邏輯
          return symbol.symbol.endsWith('USDT') && 
                 symbol.status === 'TRADING';
        }
      })
      .map((symbol: any) => {
        let baseAsset = symbol.baseAsset;
        let symbolSlug = symbol.symbol;
        
        // 處理 Binance.US 的特殊情況
        if (activeEndpoint?.type === 'spot_us') {
          baseAsset = symbol.baseAsset;
          // 如果是 USD 結尾，為了統一格式，我們在前端顯示時可能需要處理
          // 但這裡保持原始 symbol 以便 API 查詢
        } else if (!baseAsset) {
          baseAsset = symbol.symbol.replace('USDT', '');
        }

        const tickerInfo = tickerMap.get(symbol.symbol);
        
        // 為了讓前端統一使用 USDT 格式 (即使來源是 USD)
        // 如果是 Binance.US 的 USD 對，我們在 label 顯示 BTC，但在 value 傳遞 BTCUSDT (如果需要)
        // 或者保持原樣，讓前端 CryptoChart 處理
        // 這裡我們盡量標準化為 USDT 格式的 slug，以便圖表組件使用
        let normalizedSlug = symbolSlug;
        if (symbolSlug.endsWith('USD') && !symbolSlug.endsWith('BUSD') && !symbolSlug.endsWith('USDT')) {
           normalizedSlug = symbolSlug + 'T'; // BTCUSD -> BTCUSDT
        }

        return {
          value: normalizedSlug,           // BTCUSDT (標準化)
          label: baseAsset,                // BTC
          symbol: baseAsset,               // BTC (用於價格查詢)
          slug: normalizedSlug,            // BTCUSDT (用於圖表)
          id: symbolSlug,                  // 原始 ID (用於 API 查詢)
          volume: tickerInfo?.volume || 0,
          priceChangePercent: tickerInfo?.priceChangePercent || 0, // 24小時漲跌幅
        };
      })
      // 按 24 小時成交量（USDT）排序，從高到低
      .sort((a: any, b: any) => b.volume - a.volume);

    // 如果有搜尋關鍵字，進行過濾
    let filteredPairs = usdtPairs;
    if (q) {
      filteredPairs = usdtPairs.filter((pair: any) => 
        pair.symbol.toLowerCase().includes(q)
      );
    }

    // 如果搜尋結果太少，增加返回數量到 100，否則返回 50
    const limit = q ? 100 : 50;
    const result = filteredPairs.slice(0, limit);

    apiCache.set(cacheKey, result, SYMBOLS_CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Binance symbols:', error);
    return NextResponse.json(
      { error: 'Failed to fetch symbols' },
      { status: 500 }
    );
  }
}
