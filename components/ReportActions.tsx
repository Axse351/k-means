'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, FileSpreadsheet, Trash2 } from 'lucide-react'
import { getClusteringResult, deleteClusteringRun } from '@/lib/actions/clustering'

export default function ReportActions({ runId }: { runId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const router = useRouter()

  function handleExport() {
    startTransition(async () => {
      const data = await getClusteringResult(runId)
      if (!data) return

      const XLSX = await import('xlsx')
      const { run, results, centroids } = data

      const summarySheet = XLSX.utils.json_to_sheet([
        {
          Jenis: run.tipe === 'akademik' ? 'Akademik' : 'Non-Akademik',
          Jumlah_Cluster: run.k,
          Normalisasi: run.normalisasi,
          Inisialisasi: run.inisialisasi,
          Filter_Prodi: run.filter_prodi ?? 'Semua',
          Filter_Angkatan: run.filter_angkatan ?? 'Semua',
          Jumlah_Data: run.jumlah_data,
          Silhouette_Score: run.silhouette_score,
          SSE: run.sse,
          Tanggal: new Date(run.created_at).toLocaleString('id-ID'),
        },
      ])

      const resultSheet = XLSX.utils.json_to_sheet(
        (results as any[]).map((r) => ({
          NIM: r.mahasiswa?.nim,
          Nama: r.mahasiswa?.nama,
          Prodi: r.mahasiswa?.prodi,
          Angkatan: r.mahasiswa?.angkatan,
          Cluster: `Cluster ${r.cluster + 1}`,
        }))
      )

      const centroidByCluster: Record<number, Record<string, number>> = {}
      for (const c of centroids as any[]) {
        if (!centroidByCluster[c.cluster]) centroidByCluster[c.cluster] = {}
        centroidByCluster[c.cluster][c.variabel] = c.nilai
      }
      const centroidRows = Object.entries(centroidByCluster).map(([clusterIdx, vars]) => ({
        Cluster: `Cluster ${Number(clusterIdx) + 1}`,
        ...vars,
      }))
      const centroidSheet = XLSX.utils.json_to_sheet(centroidRows)

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
      XLSX.utils.book_append_sheet(workbook, resultSheet, 'Hasil Per Mahasiswa')
      XLSX.utils.book_append_sheet(workbook, centroidSheet, 'Centroid')

      const fileName = `Laporan_Clustering_${run.tipe}_${new Date(run.created_at).toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(workbook, fileName)
    })
  }

  function handleDelete() {
    if (!confirm('Yakin ingin menghapus laporan ini? Data hasil clustering terkait juga akan terhapus.')) return

    startDeleteTransition(async () => {
      const res = await deleteClusteringRun(runId)
      if (!res.success) alert(res.message)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3 items-center">
      <Link href={`/admin/clustering/hasil?runId=${runId}`} title="Lihat Detail">
        <Eye size={16} className="text-blue-500" />
      </Link>
      <button onClick={handleExport} disabled={isPending} title="Export Excel" className="disabled:opacity-40">
        <FileSpreadsheet size={16} className="text-green-600" />
      </button>
      <button onClick={handleDelete} disabled={isDeleting} title="Hapus" className="disabled:opacity-40">
        <Trash2 size={16} className="text-red-500" />
      </button>
    </div>
  )
}