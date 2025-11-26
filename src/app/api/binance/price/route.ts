import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  console.log('=== Price API Called ===');
  console.log('Raw symbol parameter:', JSON.stringify(symbol));
  console.log('Symbol type:', typeof symbol);
  console.log('Symbol length:', symbol?.length);
  console.log('Request URL:', request.url);

  if (!symbol || symbol.trim().length === 0) {
    console.error('❌ Empty or invalid symbol provided');
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // 構建交易對符號
    const tradingPair = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}USDT`;

    console.log('✅ Trading pair:', tradingPair);

    // 僅使用合約 API，避免混合現貨數據
    const endpoints = [
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${tradingPair}`,
    ];

    let lastError;
    let data;

    for (const url of endpoints) {
      try {
        console.log('Trying Binance API URL:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          data = await response.json();
          if (data && data.price) {
            console.log('Successfully fetched price from:', url);
            break;
          }
        } else {
          const errorText = await response.text();
          console.warn(`Failed to fetch from ${url}: ${response.status} ${errorText}`);
          lastError = new Error(`Binance API returned ${response.status}: ${errorText}`);
        }
      } catch (e) {
        console.warn(`Error fetching from ${url}:`, e);
        lastError = e;
      }
    }

    if (!data || !data.price) {
      throw lastError || new Error('Failed to fetch price from all endpoints');
    }
    
    return NextResponse.json({
      symbol: tradingPair, // Return original requested symbol
      price: parseFloat(data.price),
    });
  } catch (error) {
    console.error('Error fetching Binance Futures price:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
