export interface BoxplotStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}

function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

// Setara df.describe() / boxplot di Python (kuartil dengan interpolasi linear, sama seperti pandas/numpy default)
export function computeBoxplotStats(values: number[]): BoxplotStats {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = percentile(sorted, 0.25)
  const median = percentile(sorted, 0.5)
  const q3 = percentile(sorted, 0.75)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return { min: sorted[0], q1, median, q3, max: sorted[sorted.length - 1], mean }
}

export interface HistogramBin {
  range: string
  count: number
}

// Setara sns.histplot(bins=10) di notebook
export function computeHistogram(values: number[], binCount = 10): HistogramBin[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (max - min) / binCount || 1

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    range: `${(min + i * width).toFixed(1)}–${(min + (i + 1) * width).toFixed(1)}`,
    count: 0,
  }))

  for (const v of values) {
    let idx = Math.floor((v - min) / width)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx].count++
  }

  return bins
}

// Korelasi Pearson — setara df.corr(method="pearson") di pandas
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n === 0) return 0

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denom = Math.sqrt(denomX * denomY)
  return denom === 0 ? 0 : num / denom
}

export function computeCorrelationMatrix(data: Record<string, number[]>): { labels: string[]; matrix: number[][] } {
  const labels = Object.keys(data)
  const matrix = labels.map((rowLabel) =>
    labels.map((colLabel) => pearsonCorrelation(data[rowLabel], data[colLabel]))
  )
  return { labels, matrix }
}