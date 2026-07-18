export type NormalizationMethod = 'minmax' | 'zscore'
export type InitMethod = 'random' | 'kmeans++'

export interface KMeansOptions {
  k: number
  normalization?: NormalizationMethod
  init?: InitMethod
  maxIterations?: number
  tolerance?: number
  seed?: number
}

export interface KMeansResult {
  assignments: number[]
  centroids: number[][]
  centroidsNormalized: number[][]
  iterations: number
  sse: number
  silhouetteScore: number
  normalization: { method: NormalizationMethod; params: any }
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return Math.sqrt(sum)
}

function normalizeMinMax(data: number[][]) {
  const nCols = data[0].length
  const min = new Array(nCols).fill(Infinity)
  const max = new Array(nCols).fill(-Infinity)

  for (const row of data) {
    for (let j = 0; j < nCols; j++) {
      if (row[j] < min[j]) min[j] = row[j]
      if (row[j] > max[j]) max[j] = row[j]
    }
  }

  const normalized = data.map((row) =>
    row.map((val, j) => {
      const range = max[j] - min[j]
      return range === 0 ? 0 : (val - min[j]) / range
    })
  )

  return { normalized, params: { min, max } }
}

function normalizeZScore(data: number[][]) {
  const nCols = data[0].length
  const mean = new Array(nCols).fill(0)
  const std = new Array(nCols).fill(0)
  const n = data.length

  for (const row of data) for (let j = 0; j < nCols; j++) mean[j] += row[j]
  for (let j = 0; j < nCols; j++) mean[j] /= n

  for (const row of data) for (let j = 0; j < nCols; j++) std[j] += (row[j] - mean[j]) ** 2
  for (let j = 0; j < nCols; j++) std[j] = Math.sqrt(std[j] / n)

  const normalized = data.map((row) =>
    row.map((val, j) => (std[j] === 0 ? 0 : (val - mean[j]) / std[j]))
  )

  return { normalized, params: { mean, std } }
}

function denormalize(point: number[], method: NormalizationMethod, params: any): number[] {
  if (method === 'minmax') {
    return point.map((val, j) => val * (params.max[j] - params.min[j]) + params.min[j])
  }
  return point.map((val, j) => val * params.std[j] + params.mean[j])
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function initRandom(data: number[][], k: number, rand: () => number): number[][] {
  const indices = new Set<number>()
  while (indices.size < k) indices.add(Math.floor(rand() * data.length))
  return Array.from(indices).map((i) => [...data[i]])
}

function initKMeansPlusPlus(data: number[][], k: number, rand: () => number): number[][] {
  const centroids: number[][] = [[...data[Math.floor(rand() * data.length)]]][0] ? [[...data[Math.floor(rand() * data.length)]]] : []
  centroids.length = 0
  centroids.push([...data[Math.floor(rand() * data.length)]])

  while (centroids.length < k) {
    const distances = data.map((point) =>
      Math.min(...centroids.map((c) => euclideanDistance(point, c) ** 2))
    )
    const sum = distances.reduce((a, b) => a + b, 0)
    let r = rand() * sum
    let chosenIdx = 0
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i]
      if (r <= 0) { chosenIdx = i; break }
    }
    centroids.push([...data[chosenIdx]])
  }

  return centroids
}

function computeSilhouette(data: number[][], assignments: number[], k: number): number {
  const n = data.length
  if (n <= k) return 0
  const scores: number[] = []

  for (let i = 0; i < n; i++) {
    const own = assignments[i]
    let aSum = 0, aCount = 0
    const otherSums: Record<number, { sum: number; count: number }> = {}

    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const dist = euclideanDistance(data[i], data[j])
      if (assignments[j] === own) {
        aSum += dist; aCount++
      } else {
        if (!otherSums[assignments[j]]) otherSums[assignments[j]] = { sum: 0, count: 0 }
        otherSums[assignments[j]].sum += dist
        otherSums[assignments[j]].count++
      }
    }

    const a = aCount > 0 ? aSum / aCount : 0
    const bValues = Object.values(otherSums).map((v) => v.sum / v.count)
    const b = bValues.length > 0 ? Math.min(...bValues) : 0
    scores.push(aCount === 0 ? 0 : (b - a) / Math.max(a, b, 1e-9))
  }

  return scores.reduce((a, b) => a + b, 0) / scores.length
}

export function runKMeans(rawData: number[][], options: KMeansOptions): KMeansResult {
  const { k, normalization = 'minmax', init = 'kmeans++', maxIterations = 100, tolerance = 1e-4, seed = 42 } = options

  if (rawData.length < k) {
    throw new Error(`Jumlah data (${rawData.length}) lebih sedikit dari jumlah cluster (${k})`)
  }

  const { normalized, params } = normalization === 'minmax' ? normalizeMinMax(rawData) : normalizeZScore(rawData)
  const rand = mulberry32(seed)

  let centroids = init === 'kmeans++' ? initKMeansPlusPlus(normalized, k, rand) : initRandom(normalized, k, rand)
  let assignments = new Array(normalized.length).fill(-1)
  let iterations = 0

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1
    let changed = false

    const newAssignments = normalized.map((point) => {
      let minDist = Infinity, cluster = 0
      centroids.forEach((c, idx) => {
        const d = euclideanDistance(point, c)
        if (d < minDist) { minDist = d; cluster = idx }
      })
      return cluster
    })

    for (let i = 0; i < newAssignments.length; i++) {
      if (newAssignments[i] !== assignments[i]) changed = true
    }
    assignments = newAssignments

    const newCentroids = centroids.map((_, clusterIdx) => {
      const members = normalized.filter((_, i) => assignments[i] === clusterIdx)
      if (members.length === 0) return centroids[clusterIdx]
      const nCols = members[0].length
      const sum = new Array(nCols).fill(0)
      for (const m of members) for (let j = 0; j < nCols; j++) sum[j] += m[j]
      return sum.map((s) => s / members.length)
    })

    let shift = 0
    for (let i = 0; i < centroids.length; i++) shift += euclideanDistance(centroids[i], newCentroids[i])
    centroids = newCentroids

    if (!changed || shift < tolerance) break
  }

  const sse = normalized.reduce((acc, point, i) => acc + euclideanDistance(point, centroids[assignments[i]]) ** 2, 0)
  const silhouetteScore = computeSilhouette(normalized, assignments, k)
  const centroidsDenormalized = centroids.map((c) => denormalize(c, normalization, params))

  return { assignments, centroids: centroidsDenormalized, centroidsNormalized: centroids, iterations, sse, silhouetteScore, normalization: { method: normalization, params } }
}