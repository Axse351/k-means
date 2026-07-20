'use client'

import { useState, useTransition } from 'react'
import { runClustering, getClusterEvaluation } from '@/lib/actions/clustering'
import EvaluasiKChart from './EvaluasiKChart'

const PRODI_LIST = ['TI', 'SI', 'MI', 'DKV']

const VARIABEL_INFO = {
  akademik: {
    vars: ['IPK', 'IPS Terakhir', 'Rata-rata Kehadiran'],
    note: 'Variabel ini dipilih berdasarkan uji korelasi — IPS 1-8 tidak dipakai karena hampir identik dengan IPK (korelasi 0.999), dan Persentase SKS tidak dipakai karena variasi datanya terlalu kecil.',
    labels: ['Performa Rendah', 'Performa Sedang', 'Performa Tinggi'],
  },
  non_akademik: {
    vars: ['Total Poin SKKM'],
    note: 'Hanya menggunakan Total Poin SKKM karena variabel ini sudah merupakan akumulasi dari UCIC, Organisasi, Publikasi, Prestasi, dan Tri Dharma.',
    labels: ['Kurang Aktif', 'Cukup Aktif', 'Sangat Aktif'],
  },
}

export default function ClusteringForm() {
  const [tipe, setTipe] = useState<'akademik' | 'non_akademik'>('akademik')
  const [k, setK] = useState(3)
  const [prodi, setProdi] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [evaluation, setEvaluation] = useState<{ k: number; inertia: number; silhouette: number }[] | null>(null)
  const [isEvaluating, startEvaluating] = useTransition()
  const [evalInfo, setEvalInfo] = useState('')

  const info = VARIABEL_INFO[tipe]

  function handleEvaluate() {
    setEvaluation(null)
    setEvalInfo('')
    startEvaluating(async () => {
      const res = await getClusterEvaluation({ tipe, prodi: prodi || undefined, angkatan: angkatan ? Number(angkatan) : undefined })

      if (!res.success) {
        setError(res.message)
        return
      }

      setEvaluation(res.evaluation)
      setEvalInfo(
        `${res.jumlahDataValid} data valid digunakan${
          res.jumlahDikecualikan > 0 ? `, ${res.jumlahDikecualikan} data dikecualikan karena tidak lengkap` : ''
        }.`
      )
    })
  }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const res = await runClustering({
        tipe, k, prodi: prodi || undefined, angkatan: angkatan ? Number(angkatan) : undefined,
      })
      if (res && !res.success) setError(res.message)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Jenis Data</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setTipe('akademik'); setEvaluation(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'akademik' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Akademik
              </button>
              <button
                onClick={() => { setTipe('non_akademik'); setEvaluation(null) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'non_akademik' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Non-Akademik
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Filter Dataset</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Program Studi</label>
                <select value={prodi} onChange={(e) => { setProdi(e.target.value); setEvaluation(null) }} className="border w-full p-2 rounded mt-1 text-sm">
                  <option value="">Semua Prodi</option>
                  {PRODI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Angkatan</label>
                <input type="number" value={angkatan} onChange={(e) => { setAngkatan(e.target.value); setEvaluation(null) }} placeholder="Semua angkatan" className="border w-full p-2 rounded mt-1 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Jumlah Cluster (K)</h2>
            <select value={k} onChange={(e) => setK(Number(e.target.value))} className="border p-2 rounded text-sm">
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Default K=3 (sesuai hasil analisis Elbow Method + tujuan kategorisasi 3 tingkat). Klik "Evaluasi Jumlah Cluster" di bawah untuk melihat perbandingan K=2-10 pada dataset saat ini.
            </p>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {isEvaluating ? 'Menghitung...' : '📊 Evaluasi Jumlah Cluster (Elbow & Silhouette)'}
          </button>

          {evaluation && <EvaluasiKChart data={evaluation} info={evalInfo} />}

          {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}

          <button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
            {isPending ? 'Menjalankan clustering...' : 'Jalankan Clustering'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
          <h2 className="font-semibold text-gray-900 mb-3">Variabel yang Digunakan</h2>
          <ul className="space-y-1.5 text-sm mb-3">
            {info.vars.map((v) => (
              <li key={v} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                {v}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">{info.note}</p>

          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Kategori Hasil</h3>
          <div className="space-y-1.5 text-sm">
            {info.labels.map((l) => (
              <div key={l} className="px-2.5 py-1 bg-gray-50 rounded text-gray-600">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}