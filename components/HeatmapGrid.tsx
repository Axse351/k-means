'use client'

export default function HeatmapGrid({
  title,
  rowLabels,
  colLabels,
  values,
  colorScale = 'diverging',
  formatValue = (v: number) => v.toFixed(2),
}: {
  title: string
  rowLabels: string[]
  colLabels: string[]
  values: number[][]
  colorScale?: 'diverging' | 'sequential'
  formatValue?: (v: number) => string
}) {
  const flat = values.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)

  function cellColor(v: number) {
    if (colorScale === 'diverging') {
      if (v >= 0) {
        const alpha = Math.min(1, v)
        return `rgba(239, 68, 68, ${alpha * 0.75})`
      }
      const alpha = Math.min(1, -v)
      return `rgba(59, 130, 246, ${alpha * 0.75})`
    }
    const range = max - min || 1
    const alpha = (v - min) / range
    return `rgba(37, 99, 235, ${0.15 + alpha * 0.65})`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {colLabels.map((c) => (
                <th key={c} className="p-2 text-gray-500 font-medium whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((r, i) => (
              <tr key={r}>
                <td className="p-2 text-gray-500 font-medium whitespace-nowrap">{r}</td>
                {values[i].map((v, j) => (
                  <td key={j} className="p-0">
                    <div
                      className="w-16 h-12 flex items-center justify-center font-medium text-gray-800"
                      style={{ backgroundColor: cellColor(v) }}
                    >
                      {formatValue(v)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}