export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchText = (query.q || query.query || '').toString().trim()

  if (!searchText) {
    return { success: true, data: [] }
  }

  const results: Array<{
    stockCode: string
    stockName: string
    marketType: 'DOMESTIC' | 'OVERSEAS'
    categoryName: string
  }> = []

  const seenCodes = new Set<string>()

  // 1. Naver Stock AC API
  try {
    const res: any = await $fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(searchText)}&target=stock`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://m.stock.naver.com/'
      }
    })

    if (res && res.items && Array.isArray(res.items)) {
      res.items.forEach((item: any) => {
        const code = item.code
        if (code && !seenCodes.has(code)) {
          seenCodes.add(code)
          const isDomestic = /^\d{6}$/.test(code)
          results.push({
            stockCode: code,
            stockName: item.name,
            marketType: isDomestic ? 'DOMESTIC' : 'OVERSEAS',
            categoryName: item.typeName || (isDomestic ? '국내주식' : '해외주식')
          })
        }
      })
    }
  } catch (err) {
    console.warn('Naver stock search error:', err)
  }

  // 2. Yahoo Finance Search (해외주식 / 영문 검색 보완)
  try {
    const yRes: any = await $fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchText)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (yRes && yRes.quotes && Array.isArray(yRes.quotes)) {
      yRes.quotes.forEach((q: any) => {
        if ((q.quoteType === 'EQUITY' || q.quoteType === 'ETF') && q.symbol) {
          const code = q.symbol
          if (!seenCodes.has(code)) {
            seenCodes.add(code)
            const isDomestic = q.exchDisp === 'Korea' || q.exchange === 'KSC' || /^\d{6}$/.test(code)
            results.push({
              stockCode: code,
              stockName: q.shortname || q.longname || q.symbol,
              marketType: isDomestic ? 'DOMESTIC' : 'OVERSEAS',
              categoryName: q.exchDisp || q.exchange || (isDomestic ? '국내주식' : '해외주식')
            })
          }
        }
      })
    }
  } catch (yErr) {
    console.warn('Yahoo search error:', yErr)
  }

  return {
    success: true,
    data: results.slice(0, 10) // 상위 10개 반환
  }
})
