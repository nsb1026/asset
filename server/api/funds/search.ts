export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchText = (query.q || query.query || '').toString().trim()

  if (!searchText) {
    return { success: true, data: [] }
  }

  const results: Array<{
    fundCode: string
    fundName: string
    fundType: string
  }> = []

  try {
    const res: any = await $fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(searchText)}&target=stock,fund`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://m.stock.naver.com/'
      }
    })

    if (res && res.items && Array.isArray(res.items)) {
      res.items.forEach((item: any) => {
        results.push({
          fundCode: item.code || '',
          fundName: item.name || '',
          fundType: item.typeName || (item.category === 'fund' ? '공모펀드' : 'ETF/펀드')
        })
      })
    }
  } catch (err) {
    console.warn('Fund search error:', err)
  }

  return {
    success: true,
    data: results.slice(0, 10)
  }
})
