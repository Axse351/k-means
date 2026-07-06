'use client'

import Papa from 'papaparse'
import { useState } from 'react'
import { importAkademikBulk, importNonAkademikBulk } from '@/lib/actions/import'

export default function ImportPage() {
  const [tipe, setTipe] = useState<'akademik' | 'non_akademik'>('akademik')
  const [rows, setRows] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; total: number; errors: string[] } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setRows(results.data as any[]),
    })
  }

  async function handleImport() {
    setIsImporting(true)
    const res = tipe === 'akademik' ? await importAkademikBulk(rows) : await importNonAkademikBulk(rows)
    setResult(res)
    setIsImporting(false)
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
      <p className="text-gray-500 text-sm mb-6">Upload file CSV data akademik atau non-akademik mahasiswa</p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setTipe('akademik'); setRows([]); setResult(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'akademik' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}
        >
          Data Akademik
        </button>
        <button
          onClick={() => { setTipe('non_akademik'); setRows([]); setResult(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tipe === 'non_akademik' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}
        >
          Data Non Akademik
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600 mb-3">
          {tipe === 'akademik'
            ? 'Kolom yang dibutuhkan: NIM, Nama, Jenis Kelamin, Prodi, Angkatan, IPK, IPS1-IPS8, SKS ditempuh'
            : 'Kolom yang dibutuhkan: NIM, Nama, Jenis Kelamin, Prodi, Angkatan, UCIC Values, Kegiatan UCIC, Organisasi, Jenis Organisasi, Publikasi, Jenis Publikasi, Prestasi, Jenis Prestasi, Tri Dharma, Jenis Tri Dharma, Total SKKM'}
        </p>

        <input type="file" accept=".csv" onChange={handleFile} className="mb-4 text-sm" />

        {rows.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-2">
              File: <strong>{fileName}</strong> — {rows.length} baris terbaca
            </p>

            <div className="overflow-x-auto mb-4">
              <table className="text-xs w-full border border-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(rows[0]).slice(0, 6).map((key) => (
                      <th key={key} className="p-2 text-left border-b">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.keys(rows[0]).slice(0, 6).map((key) => (
                        <td key={key} className="p-2 border-b">{row[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-1">Preview 5 baris pertama dari {rows.length} total</p>
            </div>

            <button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {isImporting ? 'Mengimpor...' : `Import ${rows.length} Data`}
            </button>
          </>
        )}

        {result && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            Berhasil import {result.success} dari {result.total} data.
            {result.errors.length > 0 && (
              <ul className="mt-2 text-red-600 list-disc pl-4">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}