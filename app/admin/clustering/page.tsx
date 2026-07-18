import ClusteringForm from '@/components/ClusteringForm'

export default function ClusteringPage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Proses K-Means</h1>
      <p className="text-gray-500 text-sm mb-6">Konfigurasi dan jalankan analisis clustering data mahasiswa</p>
      <ClusteringForm />
    </div>
  )
}