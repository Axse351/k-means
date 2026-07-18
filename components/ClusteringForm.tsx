'use client'

import { useState, useTransition } from 'react'
import { runClustering } from '@/lib/actions/clustering'
import { GraduationCap, Sparkles, SlidersHorizontal, Filter, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const AKADEMIK_VARS = [
  { key: 'ipk', label: 'IPK', default: true },
  { key: 'ips1', label: 'IPS 1' }, { key: 'ips2', label: 'IPS 2' },
  { key: 'ips3', label: 'IPS 3' }, { key: 'ips4', label: 'IPS 4' },
  { key: 'ips5', label: 'IPS 5' }, { key: 'ips6', label: 'IPS 6' },
  { key: 'ips7', label: 'IPS 7' }, { key: 'ips8', label: 'IPS 8' },
  { key: 'sks_ditempuh', label: 'SKS Ditempuh', default: true },
]

const NON_AKADEMIK_VARS = [
  { key: 'ucic_values', label: 'UCIC Values', default: true },
  { key: 'organisasi', label: 'Organisasi', default: true },
  { key: 'publikasi', label: 'Publikasi', default: true },
  { key: 'prestasi', label: 'Prestasi', default: true },
  { key: 'tri_dharma', label: 'Tri Dharma', default: true },
  { key: 'total_skkm', label: 'Total SKKM' },
]

const PRODI_LIST = ['TI', 'SI', 'MI', 'DKV']

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: number
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 tracking-wide">
              LANGKAH {step}
            </span>
          </div>
          <h2 className="font-semibold text-gray-900 leading-tight">{title}</h2>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function ClusteringForm() {
  const [tipe, setTipe] = useState<'akademik' | 'non_akademik'>('akademik')
  const [k, setK] = useState(3)
  const [normalisasi, setNormalisasi] = useState<'minmax' | 'zscore'>('minmax')
  const [inisialisasi, setInisialisasi] = useState<'random' | 'kmeans++'>('kmeans++')
  const [prodi, setProdi] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const varList = tipe === 'akademik' ? AKADEMIK_VARS : NON_AKADEMIK_VARS
  const [selectedVars, setSelectedVars] = useState<string[]>(varList.filter((v) => v.default).map((v) => v.key))

  function switchTipe(newTipe: 'akademik' | 'non_akademik') {
    setTipe(newTipe)
    const list = newTipe === 'akademik' ? AKADEMIK_VARS : NON_AKADEMIK_VARS
    setSelectedVars(list.filter((v) => v.default).map((v) => v.key))
  }

  function toggleVar(key: string) {
    setSelectedVars((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]))
  }

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const res = await runClustering({
        tipe, k, normalisasi, inisialisasi, variabel: selectedVars,
        prodi: prodi || undefined, angkatan: angkatan ? Number(angkatan) : undefined,
      })
      if (res && !res.success) setError(res.message)
    })
  }

  return (
    <div className="grid grid-cols-3 gap-6 items-start">
      <div className="col-span-2 space-y-5">
        {/* Step 1: Jenis Data */}
        <StepCard step={1} icon={GraduationCap} title="Jenis Data" description="Pilih kategori data yang akan dianalisis">
          <div className="grid grid-cols-2 gap-3">
            {(['akademik', 'non_akademik'] as const).map((opt) => {
              const active = tipe === opt
              return (
                <button
                  key={opt}
                  onClick={() => switchTipe(opt)}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {active && (
                    <CheckCircle2 size={18} className="absolute top-3 right-3 text-blue-600" />
                  )}
                  <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                    {opt === 'akademik' ? 'Akademik' : 'Non-Akademik'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {opt === 'akademik' ? 'IPK, IPS, SKS ditempuh' : 'Values, organisasi, prestasi'}
                  </p>
                </button>
              )
            })}
          </div>
        </StepCard>

        {/* Step 2: Filter Dataset */}
        <StepCard step={2} icon={Filter} title="Filter Dataset" description="Batasi cakupan data (opsional)">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Program Studi</label>
              <select
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                className="border border-gray-200 w-full p-2.5 rounded-lg mt-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                <option value="">Semua Prodi</option>
                {PRODI_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Angkatan</label>
              <input
                type="number"
                value={angkatan}
                onChange={(e) => setAngkatan(e.target.value)}
                placeholder="Semua angkatan"
                className="border border-gray-200 w-full p-2.5 rounded-lg mt-1.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>
          </div>
        </StepCard>

        {/* Step 3: Parameter K-Means */}
        <StepCard step={3} icon={SlidersHorizontal} title="Parameter K-Means" description="Atur konfigurasi algoritma clustering">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Jumlah Cluster (k)</label>
              <select
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="border border-gray-200 w-full p-2.5 rounded-lg mt-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Normalisasi</label>
              <select
                value={normalisasi}
                onChange={(e) => setNormalisasi(e.target.value as any)}
                className="border border-gray-200 w-full p-2.5 rounded-lg mt-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                <option value="minmax">Min-Max</option>
                <option value="zscore">Z-Score</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Inisialisasi</label>
              <select
                value={inisialisasi}
                onChange={(e) => setInisialisasi(e.target.value as any)}
                className="border border-gray-200 w-full p-2.5 rounded-lg mt-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                <option value="kmeans++">K-Means++</option>
                <option value="random">Random</option>
              </select>
            </div>
          </div>
        </StepCard>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || selectedVars.length === 0}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-medium text-sm shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menjalankan clustering...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Jalankan Clustering
            </>
          )}
        </button>
      </div>

      {/* Panel Variabel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Pilih Variabel</h2>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {selectedVars.length} dipilih
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Minimal 1 variabel untuk menjalankan analisis</p>

        <div className="flex flex-wrap gap-2">
          {varList.map((v) => {
            const active = selectedVars.includes(v.key)
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => toggleVar(v.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {v.label}
              </button>
            )
          })}
        </div>

        {selectedVars.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-4">
            Pilih setidaknya satu variabel sebelum menjalankan clustering.
          </p>
        )}
      </div>
    </div>
  )
}