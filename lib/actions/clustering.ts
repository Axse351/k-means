'use server'

import { createClient } from '@/utils/supabase/server'
import { runKMeans, type NormalizationMethod, type InitMethod } from '@/lib/kmeans'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const AKADEMIK_VARIABEL = ['ipk', 'ips1', 'ips2', 'ips3', 'ips4', 'ips5', 'ips6', 'ips7', 'ips8', 'sks_ditempuh']
const NON_AKADEMIK_VARIABEL = ['ucic_values', 'organisasi', 'publikasi', 'prestasi', 'tri_dharma', 'total_skkm']

export type ClusteringInput = {
  tipe: 'akademik' | 'non_akademik'
  k: number
  normalisasi: NormalizationMethod
  inisialisasi: InitMethod
  variabel: string[]
  prodi?: string
  angkatan?: number
}

export async function runClustering(input: ClusteringInput) {
  const supabase = await createClient()
  const table = input.tipe === 'akademik' ? 'data_akademik' : 'data_non_akademik'
  const allowedVars = input.tipe === 'akademik' ? AKADEMIK_VARIABEL : NON_AKADEMIK_VARIABEL
  const variabel = input.variabel.filter((v) => allowedVars.includes(v))

  if (variabel.length === 0) return { success: false, message: 'Pilih minimal 1 variabel' }

  let query = supabase.from('mahasiswa').select(`id, nim, nama, prodi, angkatan, ${table}(${variabel.join(',')})`)
  if (input.prodi) query = query.eq('prodi', input.prodi)
  if (input.angkatan) query = query.eq('angkatan', input.angkatan)

  const { data: rows, error } = await query
  if (error) return { success: false, message: error.message }
  if (!rows || rows.length === 0) return { success: false, message: 'Tidak ada data yang cocok dengan filter' }

  const validRows = rows.filter((r: any) => {
    const rel = Array.isArray(r[table]) ? r[table][0] : r[table]
    return rel && variabel.every((v) => rel[v] !== null && rel[v] !== undefined)
  })

  if (validRows.length < input.k) {
    return { success: false, message: `Data valid (${validRows.length}) lebih sedikit dari jumlah cluster (${input.k}). Lengkapi data yang kosong dulu.` }
  }

  const matrix = validRows.map((r: any) => {
    const rel = Array.isArray(r[table]) ? r[table][0] : r[table]
    return variabel.map((v) => Number(rel[v]))
  })

  const result = runKMeans(matrix, { k: input.k, normalization: input.normalisasi, init: input.inisialisasi })

  const { data: run, error: runError } = await supabase
    .from('clustering_runs')
    .insert({
      tipe: input.tipe, k: input.k, normalisasi: input.normalisasi, inisialisasi: input.inisialisasi,
      variabel, filter_prodi: input.prodi ?? null, filter_angkatan: input.angkatan ?? null,
      jumlah_data: validRows.length, silhouette_score: result.silhouetteScore, sse: result.sse,
    })
    .select('id')
    .single()

  if (runError || !run) return { success: false, message: runError?.message ?? 'Gagal menyimpan run' }

  const resultsPayload = validRows.map((r: any, i: number) => ({
    run_id: run.id, mahasiswa_id: r.id, cluster: result.assignments[i],
  }))
  const { error: resultsError } = await supabase.from('clustering_results').insert(resultsPayload)
  if (resultsError) return { success: false, message: resultsError.message }

  const centroidsPayload: any[] = []
  result.centroids.forEach((centroid, clusterIdx) => {
    centroid.forEach((nilai, varIdx) => {
      centroidsPayload.push({ run_id: run.id, cluster: clusterIdx, variabel: variabel[varIdx], nilai })
    })
  })
  const { error: centroidError } = await supabase.from('clustering_centroids').insert(centroidsPayload)
  if (centroidError) return { success: false, message: centroidError.message }

  redirect(`/admin/clustering/hasil?runId=${run.id}`)
}

export async function getClusteringResult(runId: string) {
  const supabase = await createClient()
  const { data: run } = await supabase.from('clustering_runs').select('*').eq('id', runId).single()
  if (!run) return null

  const { data: results } = await supabase
    .from('clustering_results')
    .select('cluster, mahasiswa(nim, nama, prodi, angkatan)')
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

  if (error) return { success: false, message: error.message }

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