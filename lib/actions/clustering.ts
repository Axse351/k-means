'use server'

import { createClient } from '@/utils/supabase/server'
import { runKMeans, evaluateKRange, labelClustersByRank } from '@/lib/kmeans'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Variabel & label SESUAI hasil analisis di notebook Python — tidak lagi bisa dipilih bebas,
// karena sudah melalui uji korelasi & analisis deskriptif yang menentukan variabel final ini.
const AKADEMIK_VARIABEL = ['ipk', 'ips_terakhir', 'rata_rata_kehadiran']
const AKADEMIK_LABELS = ['Performa Rendah', 'Performa Sedang', 'Performa Tinggi']

const NON_AKADEMIK_VARIABEL = ['total_skkm']
const NON_AKADEMIK_LABELS = ['Kurang Aktif', 'Cukup Aktif', 'Sangat Aktif']

export type ClusteringInput = {
  tipe: 'akademik' | 'non_akademik'
  k: number
  prodi?: string
  angkatan?: number
}

type EvaluationPoint = {
  k: number
  inertia: number
  silhouette: number
}

type ClusterEvaluationSuccess = {
  success: true
  evaluation: EvaluationPoint[]
  jumlahDataValid: number
  jumlahDikecualikan: number
}

type ClusterEvaluationFailure = {
  success: false
  message: string
}

type ClusterEvaluationResult = ClusterEvaluationSuccess | ClusterEvaluationFailure

async function fetchDataset(input: ClusteringInput) {
  const supabase = await createClient()
  const table = input.tipe === 'akademik' ? 'data_akademik' : 'data_non_akademik'
  const variabel = input.tipe === 'akademik' ? AKADEMIK_VARIABEL : NON_AKADEMIK_VARIABEL

  let query = supabase
    .from('mahasiswa')
    .select(`id, nim, nama, prodi, angkatan, jenis_kelamin, ${table}(${variabel.join(',')})`)

  if (input.prodi) query = query.eq('prodi', input.prodi)
  if (input.angkatan) query = query.eq('angkatan', input.angkatan)

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)
  if (!rows) return { validRows: [], excludedRows: [], variabel, table }

  const validRows: any[] = []
  const excludedRows: any[] = []

  for (const r of rows as any[]) {
    const rel = Array.isArray(r[table]) ? r[table][0] : r[table]
    const missingFields = variabel.filter((v) => !rel || rel[v] === null || rel[v] === undefined)

    if (!rel || missingFields.length > 0) {
      excludedRows.push({
        nim: r.nim,
        nama: r.nama,
        prodi: r.prodi,
        sebab: !rel
          ? `Belum ada data ${input.tipe === 'akademik' ? 'akademik' : 'non-akademik'} sama sekali`
          : `Kolom kosong: ${missingFields.join(', ')}`,
      })
    } else {
      validRows.push({ ...r, _rel: rel })
    }
  }

  return { validRows, excludedRows, variabel, table }
}

export async function getClusterEvaluation(input: Omit<ClusteringInput, 'k'>): Promise<ClusterEvaluationResult> {
  const { validRows, variabel, excludedRows } = await fetchDataset({ ...input, k: 0 })

  if (validRows.length < 3) {
    return { success: false, message: 'Data valid terlalu sedikit untuk evaluasi (minimal 3 data bersih)' }
  }

  const matrix = validRows.map((r: any) => variabel.map((v) => Number(r._rel[v])))
  const kMax = Math.min(10, validRows.length - 1)
  const kRange = Array.from({ length: Math.max(0, kMax - 1) }, (_, i) => i + 2)

  const evaluation = evaluateKRange(matrix, kRange)

  return {
    success: true,
    evaluation,
    jumlahDataValid: validRows.length,
    jumlahDikecualikan: excludedRows.length,
  }
}

export async function runClustering(input: ClusteringInput) {
  const supabase = await createClient()
  const { validRows, excludedRows, variabel } = await fetchDataset(input)

  if (validRows.length === 0) {
    return { success: false, message: 'Tidak ada data bersih yang cocok dengan filter' }
  }

  if (validRows.length < input.k) {
    return {
      success: false,
      message: `Data bersih (${validRows.length}) lebih sedikit dari jumlah cluster (${input.k}). ${excludedRows.length} data dikecualikan karena tidak lengkap.`,
    }
  }

  const matrix = validRows.map((r: any) => variabel.map((v) => Number(r._rel[v])))
  const result = runKMeans(matrix, { k: input.k, normalization: 'zscore', init: 'kmeans++' })

  const labels = input.tipe === 'akademik' ? AKADEMIK_LABELS : NON_AKADEMIK_LABELS
  const labelMap = labelClustersByRank(result.centroidsNormalized, labels)

  const { data: run, error: runError } = await supabase
    .from('clustering_runs')
    .insert({
      tipe: input.tipe,
      k: input.k,
      normalisasi: 'zscore',
      inisialisasi: 'kmeans++',
      variabel,
      filter_prodi: input.prodi ?? null,
      filter_angkatan: input.angkatan ?? null,
      jumlah_data: validRows.length,
      silhouette_score: result.silhouetteScore,
      sse: result.sse,
      dbi_score: result.daviesBouldinIndex,
      excluded_data: excludedRows,
      label_map: labelMap,
    })
    .select('id')
    .single()

  if (runError || !run) {
    return { success: false, message: runError?.message ?? 'Gagal menyimpan run' }
  }

  const resultsPayload = validRows.map((r: any, i: number) => ({
    run_id: run.id,
    mahasiswa_id: r.id,
    cluster: result.assignments[i],
    label: labelMap[result.assignments[i]],
  }))

  const { error: resultsError } = await supabase.from('clustering_results').insert(resultsPayload)
  if (resultsError) {
    return { success: false, message: resultsError.message }
  }

  const centroidsPayload: any[] = []
  result.centroids.forEach((centroid, clusterIdx) => {
    centroid.forEach((nilai, varIdx) => {
      centroidsPayload.push({ run_id: run.id, cluster: clusterIdx, variabel: variabel[varIdx], nilai })
    })
  })

  const { error: centroidError } = await supabase.from('clustering_centroids').insert(centroidsPayload)
  if (centroidError) {
    return { success: false, message: centroidError.message }
  }

  redirect(`/admin/clustering/hasil?runId=${run.id}`)
}

export async function getClusteringResult(runId: string) {
  const supabase = await createClient()
  const { data: run } = await supabase.from('clustering_runs').select('*').eq('id', runId).single()
  if (!run) return null

  const table = run.tipe === 'akademik' ? 'data_akademik' : 'data_non_akademik'
  const variabel: string[] = run.variabel ?? []

  const { data: results } = await supabase
    .from('clustering_results')
    .select(`cluster, label, mahasiswa(nim, nama, prodi, angkatan, jenis_kelamin, ${table}(${variabel.join(',')}))`)
    .eq('run_id', runId)

  const { data: centroids } = await supabase
    .from('clustering_centroids')
    .select('*')
    .eq('run_id', runId)
    .order('cluster')

  return { run, results: results ?? [], centroids: centroids ?? [] }
}

export async function deleteClusteringRun(runId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clustering_runs').delete().eq('id', runId)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/admin/clustering/laporan')
  return { success: true, message: 'Laporan berhasil dihapus' }
}

export async function getAllClusteringRuns(params: { tipe?: string; page?: number }) {
  const supabase = await createClient()
  const PAGE_SIZE = 10
  const page = params.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase.from('clustering_runs').select('*', { count: 'exact' })
  if (params.tipe) query = query.eq('tipe', params.tipe)

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)

  if (error) return { runs: [], count: 0 }
  return { runs: data ?? [], count: count ?? 0 }
}