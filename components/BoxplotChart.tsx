'use client'

import type { BoxplotStats } from '@/lib/statUtils'

export default function BoxplotChart({
  title,
  groups,
}: {
  title: string
  groups: { label: string; color: string; stats: BoxplotStats }[]
}) {
  const height = 260
  const paddingTop = 20
  const paddingBottom = 34
  const chartHeight = height - paddingTop - paddingBottom
  const groupWidth = 130
  const width = Math.max(groups.length * groupWidth, groupWidth)

  const allValues = groups.flatMap((g) => [g.stats.min, g.stats.max])
  const globalMin = Math.min(...allValues)
  const globalMax = Math.max(...allValues)
  const range = globalMax - globalMin || 1

  const yScale = (v: number) => paddingTop + chartHeight - ((v - globalMin) / range) * chartHeight

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        {groups.map((g, i) => {
          const cx = i * groupWidth + groupWidth / 2
          const boxWidth = 50
          const { min, q1, median, q3, max } = g.stats

          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={yScale(min)} y2={yScale(max)} stroke="#9ca3af" strokeWidth={1.5} />
              <line x1={cx - 12} x2={cx + 12} y1={yScale(min)} y2={yScale(min)} stroke="#9ca3af" strokeWidth={1.5} />
              <line x1={cx - 12} x2={cx + 12} y1={yScale(max)} y2={yScale(max)} stroke="#9ca3af" strokeWidth={1.5} />
              <rect
                x={cx - boxWidth / 2}
                y={yScale(q3)}
                width={boxWidth}
                height={Math.max(2, yScale(q1) - yScale(q3))}
                fill={g.color}
                fillOpacity={0.25}
                stroke={g.color}
                strokeWidth={1.5}
              />
              <line x1={cx - boxWidth / 2} x2={cx + boxWidth / 2} y1={yScale(median)} y2={yScale(median)} stroke={g.color} strokeWidth={2} />
              <text x={cx} y={height - 12} textAnchor="middle" fontSize={11} fill="#6b7280">{g.label}</text>
              <text x={cx + boxWidth / 2 + 6} y={yScale(median) + 4} fontSize={9} fill="#374151">{median.toFixed(2)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}