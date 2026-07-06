'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({
  id,
  action,
}: {
  id: string
  action: (id: string) => Promise<{ success: boolean; message: string }>
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Yakin mau hapus data mahasiswa ini? Data akademik & non-akademiknya ikut terhapus.')) {
      return
    }
    startTransition(async () => {
      const result = await action(id)
      if (!result.success) alert('Gagal hapus: ' + result.message)
      router.refresh()
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} title="Hapus">
      <Trash2 size={16} className="text-red-500" />
    </button>
  )
}