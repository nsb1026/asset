export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const codeOrName = (query.code || query.name || '').toString().trim()

  if (!codeOrName) {
    throw createError({ statusCode: 400, statusMessage: '종목코드 또는 종목명이 필요합니다.' })
  }

  try {
    let stockCode = codeOrName
    let stockName = ''
    let currentPrice = 0
    let changePrice = 0
    let changeRate = 0
    let marketType = 'DOMESTIC'

    const isDomesticCode = /^\d{6}$/.test(codeOrName)

    // 1. 6자리 종목코드인 경우 네이버 모바일 기본 시세 조회
    if (isDomesticCode) {
      try {
        const res: any = await $fetch(`https://m.stock.naver.com/api/stock/${codeOrName}/basic`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        })

        if (res && res.stockName) {
          stockName = res.stockName
          const rawPrice = res.nowPrice || res.closePrice || '0'
          currentPrice = parseInt(String(rawPrice).replace(/,/g, ''), 10) || 0
          changePrice = parseInt(String(res.compareToPreviousClosePrice || 0).replace(/,/g, ''), 10) || 0
          changeRate = parseFloat(res.fluctuationsRatio || 0)

          if (currentPrice > 0) {
            return {
              success: true,
              stockCode: codeOrName,
              stockName,
              currentPrice,
              changePrice,
              changeRate,
              marketType: 'DOMESTIC',
              source: 'Naver Finance'
            }
          }
        }
      } catch (err) {
        console.warn('Naver direct basic fetch failed:', err)
      }
    }

    // 2. 종목명으로 네이버 검색 API(ac.stock.naver.com) 통해 종목코드 및 이름 추출
    try {
      const acRes: any = await $fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(codeOrName)}&target=stock`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://m.stock.naver.com/'
        }
      })

      if (acRes && acRes.items && Array.isArray(acRes.items) && acRes.items.length > 0) {
        const match = acRes.items[0]
        stockCode = match.code
        stockName = match.name

        if (/^\d{6}$/.test(stockCode)) {
          const priceRes: any = await $fetch(`https://m.stock.naver.com/api/stock/${stockCode}/basic`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          if (priceRes && priceRes.stockName) {
            const rawPrice = priceRes.nowPrice || priceRes.closePrice || '0'
            currentPrice = parseInt(String(rawPrice).replace(/,/g, ''), 10) || 0
            changePrice = parseInt(String(priceRes.compareToPreviousClosePrice || 0).replace(/,/g, ''), 10) || 0
            changeRate = parseFloat(priceRes.fluctuationsRatio || 0)

            if (currentPrice > 0) {
              return {
                success: true,
                stockCode,
                stockName,
                currentPrice,
                changePrice,
                changeRate,
                marketType: 'DOMESTIC',
                source: 'Naver Search AC'
              }
            }
          }
        }
      }
    } catch (acErr) {
      console.warn('Naver AC search failed:', acErr)
    }

    // 3. 해외 주식 (AAPL, TSLA, NVDA 등) Yahoo Finance 시세 및 검색
    try {
      const yahooRes: any = await $fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${codeOrName.toUpperCase()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      const meta = yahooRes?.chart?.result?.[0]?.meta
      if (meta && meta.regularMarketPrice) {
        stockCode = codeOrName.toUpperCase()
        stockName = meta.shortName || meta.symbol || stockCode
        currentPrice = meta.regularMarketPrice
        const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice
        changePrice = currentPrice - prevClose
        changeRate = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0

        return {
          success: true,
          stockCode,
          stockName,
          currentPrice,
          changePrice,
          changeRate,
          marketType: 'OVERSEAS',
          currency: meta.currency || 'USD',
          source: 'Yahoo Finance'
        }
      }
    } catch (yErr) {
      console.warn('Yahoo Finance search failed:', yErr)
    }

    return {
      success: false,
      message: `'${codeOrName}' 시세 정보를 인터넷에서 찾을 수 없습니다.`
    }

  } catch (error: any) {
    console.error('Fetch Stock Price Error:', error)
    return {
      success: false,
      message: '시세 정보 조회 중 오류가 발생했습니다.',
      error: error?.message
    }
  }
})
