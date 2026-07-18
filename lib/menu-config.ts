export type MenuItem = { label: string; href: string }
export type MenuSection = { section: string | null; items: MenuItem[] }

export const adminMenu: MenuSection[] = [
  { section: null, items: [{ label: 'Dashboard', href: '/admin/dashboard' }] },
  {
    section: 'Kelola Data Mahasiswa',
    items: [
      { label: 'Data Akademik', href: '/admin/data-akademik' },
      { label: 'Data Non Akademik', href: '/admin/data-non-akademik' },
      { label: 'Import Data', href: '/admin/import' },
    ],
  },
  {
    section: 'Clustering',
    items: [
      { label: 'Proses K-Means', href: '/admin/clustering' },
      { label: 'Hasil Analisis', href: '/admin/clustering/hasil' },
      { label: 'Laporan', href: '/admin/clustering/laporan' },
    ],
  },
  { section: null, items: [{ label: 'Pengguna', href: '/admin/pengguna' }] },
]

export const kaprodiMenu: MenuSection[] = [
  { section: null, items: [{ label: 'Dashboard', href: '/kaprodi/dashboard' }] },
  {
    section: 'Data Mahasiswa',
    items: [
      { label: 'Data Akademik', href: '/kaprodi/data-akademik' },
      { label: 'Data Non Akademik', href: '/kaprodi/data-non-akademik' },
    ],
  },
  {
    section: null,
    items: [
      { label: 'Hasil Analisis', href: '/kaprodi/hasil-analisis' },
      { label: 'Catatan', href: '/kaprodi/catatan' },
    ],
  },
]

export const dekanMenu: MenuSection[] = [
  { section: null, items: [{ label: 'Dashboard', href: '/dekan/dashboard' }] },
  {
    section: 'Data Mahasiswa',
    items: [
      { label: 'Data Akademik', href: '/dekan/data-akademik' },
      { label: 'Data Non Akademik', href: '/dekan/data-non-akademik' },
    ],
  },
  {
    section: null,
    items: [
      { label: 'Hasil Analisis', href: '/dekan/hasil-analisis' },
      { label: 'Laporan', href: '/dekan/laporan' },
    ],
  },
]