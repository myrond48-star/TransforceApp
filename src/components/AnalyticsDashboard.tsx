'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { computeAnalyticsData } from './analyticsAggregation';

// Mock implementation of getToken
const getToken = () => { try { return localStorage.getItem("token") } catch { return null } }

// ── Types ──────────────────────────────────────────────────────────────────────
interface V3Data {
  period: { label: string; prev_label: string; month: string; year: number }
  bom:  { agent: number; support: number; total: number }
  eom:  { agent: number; support: number; total: number }
  attrition:      { total: number; agent: number; support: number }
  attrition_rate: { all: number; agent: number; support: number }
  joiner:         { total: number; new_hire: number; transfer_in: number }
  net_hc_change:  number
  hc_growth_pct:  number
  prev: { eom_total: number; attrition: number; attrition_rate: number; joiners: number }
  ytd:  { attrition: number; attrition_rate: number }
  trend_12m: Array<{
    month: string; starting_hc: number; ending_hc: number
    new_hire: number; attrition: number; attrition_pct: number; hc_growth_pct: number
  }>
  projects: Array<{
    project: string; opg: string; sto: string; starting_hc: number; ending_hc: number
    new_hire: number; resign: number; net: number
    attrition_pct: number; prev_attrition_pct: number
  }>
  opg_rows: Array<{
    name: string; ending_hc: number; attrition_pct: number; resign: number; count: number; share: number
  }>
  opg_options:     string[]
  project_options: string[]
}

interface AttrData {
  summary: { voluntary: number; involuntary: number; total: number }
  by_reason_typed: Array<{ resign_type: string; reason: string; count: number }>
}

// ── Palette ────────────────────────────────────────────────────────────────────
const RED    = '#D1102B'
const BLUE   = '#3B82F6'
const GREEN  = '#22C55E'
const DRILL_PALETTE = ['#3B82F6','#F97316','#8B5CF6','#14B8A6','#F59E0B','#EC4899','#10B981','#6366F1','#EF4444','#84CC16']
const PURPLE = '#8B5CF6'
const ORANGE = '#F97316'
const GRAY   = '#9CA3AF'

// ── Trend series groups (defines linked left↔right pairs) ──────────────────────
// net_hc is NOT a toggle — it is always shown as a text label above the bar chart
const TREND_SERIES = [
  { key: 'total_hc',  label: 'Total HC / Growth %', color: BLUE,   rightField: 'growth_pct'    as const | null },
  { key: 'attrition', label: 'Attrition # / %',      color: RED,    rightField: 'attrition_pct' as const | null },
  { key: 'new_hire',  label: 'New Hire #',            color: GREEN,  rightField: null },
] as const

// ── Micro components ───────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>{children}</div>
}

function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[10px] font-black text-black uppercase tracking-widest">{title}</h3>
        {sub && <p className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest mt-0.5">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
    </div>
  )
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function Spark({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const r   = max - min || 1
  const W = 72, H = 24, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / r) * (H - pad * 2)
    return [x, y]
  })
  const d    = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ')
  const area = `${d} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`
  const last = pts[pts.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <path d={area} fill={color} fillOpacity={0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2} fill={color} />
    </svg>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, deltaValue, deltaLabel, lowerIsBetter = false, sparkValues, sparkColor, tooltip,
}: {
  title: string; value: string
  deltaValue: number; deltaLabel: string
  lowerIsBetter?: boolean; sparkValues: number[]; sparkColor: string
  tooltip?: React.ReactNode
}) {
  const [tipOpen, setTipOpen] = React.useState(false)

  const up      = deltaValue > 0
  const neutral = deltaValue === 0
  const good    = neutral ? null : lowerIsBetter ? !up : up
  const col     = neutral ? GRAY : good === null ? GRAY : good ? GREEN : RED

  const absDelta = Math.abs(deltaValue)
  const fmtDelta = Number.isInteger(absDelta)
    ? absDelta.toLocaleString()
    : absDelta.toFixed(2)
  const suffix = title.toLowerCase().includes('growth') || title.toLowerCase().includes('attrition %') ? 'pp' : ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative">
      <div className="flex items-start justify-between gap-1 mb-3">
        <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest leading-tight">{title}</p>
        {tooltip && (
          <div className="relative shrink-0">
            <button
              onMouseEnter={() => setTipOpen(true)}
              onMouseLeave={() => setTipOpen(false)}
              className="w-4 h-4 rounded-full border border-gray-200 text-[8px] font-black text-neutral-gray flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              ?
            </button>
            {tipOpen && (
              <div className="absolute right-0 top-5 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-[9px] font-semibold text-gray-600 leading-relaxed">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-[28px] leading-none font-black text-black" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </p>
        <Spark values={sparkValues} color={sparkColor} />
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
        {!neutral && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-black"
            style={{ color: col, background: good ? 'rgba(34,197,94,0.10)' : 'rgba(209,16,43,0.10)' }}>
            {up ? '▲' : '▼'}
          </span>
        )}
        <span className="text-[10px] font-black tabnum" style={{ color: col, fontVariantNumeric: 'tabular-nums' }}>
          {!neutral && (up ? '+' : '−')}{fmtDelta}{suffix}
        </span>
        <span className="text-[9px] font-bold text-neutral-gray ml-1 truncate">{deltaLabel}</span>
      </div>
    </div>
  )
}

// ── Trend KPI selector pill ────────────────────────────────────────────────────
// ── Tornado: top vs bottom diverging horizontal bars ───────────────────────────
function TornadoChart({ topRows, bottomRows, fmt }: {
  topRows:    { label: string; value: number }[]
  bottomRows: { label: string; value: number }[]
  fmt?: (v: number) => string
}) {
  const fmtVal = (v: number) => fmt ? fmt(v) : (Number.isInteger(v) ? v.toString() : v.toFixed(2))
  const allMax = Math.max(1, ...[...topRows, ...bottomRows].map(d => Math.abs(d.value)))
  const BAR_MAX_PX = 40

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-0">
        {/* Green — best performers */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-center" style={{ color: GREEN }}>▲ Top 10 — Best</p>
          <div className="space-y-1.5 pr-2">
            {topRows.map((d, i) => {
              const barPx = Math.max(3, Math.round((Math.abs(d.value) / allMax) * BAR_MAX_PX))
              return (
                <div key={d.label} className="flex items-center gap-1 min-w-0">
                  <span className="text-[8px] font-black w-4 text-center rounded shrink-0"
                    style={{ background: '#F0FDF4', color: GREEN }}>{i + 1}</span>
                  <span className="text-[9px] font-black text-black text-left flex-1 truncate min-w-0">{d.label}</span>
                  <span className="text-[9px] font-black shrink-0 w-12 text-right" style={{ color: GREEN, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVal(d.value)}
                  </span>
                  <div className="h-3 rounded-l-sm shrink-0" style={{ width: barPx, background: GREEN, opacity: 0.8 }} />
                </div>
              )
            })}
          </div>
        </div>
        {/* Red — worst performers */}
        <div className="border-l border-gray-100 pl-2">
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-center" style={{ color: RED }}>Bottom 10 — Worst ▼</p>
          <div className="space-y-1.5">
            {bottomRows.map((d, i) => {
              const barPx = Math.max(3, Math.round((Math.abs(d.value) / allMax) * BAR_MAX_PX))
              return (
                <div key={d.label} className="flex items-center gap-1 min-w-0">
                  <div className="h-3 rounded-r-sm shrink-0" style={{ width: barPx, background: RED, opacity: 0.8 }} />
                  <span className="text-[9px] font-black shrink-0 w-12" style={{ color: RED, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVal(d.value)}
                  </span>
                  <span className="text-[9px] font-black text-black text-right flex-1 truncate min-w-0">{d.label}</span>
                  <span className="text-[8px] font-black w-4 text-center rounded shrink-0"
                    style={{ background: '#FEF2F2', color: RED }}>{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const TIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[10px]">
      <p className="font-black text-black uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? (p.value % 1 !== 0 ? p.value.toFixed(2) : p.value.toLocaleString()) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Sortable project table ─────────────────────────────────────────────────────
function ProjectTable({ projects }: { projects: V3Data['projects'] }) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'ending_hc', dir: 'desc' })

  const sorted = useMemo(() => {
    const arr = [...projects]
    arr.sort((a, b) => {
      const av = (a as any)[sort.key]
      const bv = (b as any)[sort.key]
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sort.dir === 'asc' ? av - bv : bv - av
    })
    return arr
  }, [projects, sort])

  const toggle = (key: string) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })

  const cols = [
    { key: 'project',           label: 'Project',     align: 'left'  as const },
    { key: 'starting_hc',      label: 'Start HC',    align: 'right' as const },
    { key: 'new_hire',         label: 'New Hire',    align: 'right' as const },
    { key: 'resign',           label: 'Resign',      align: 'right' as const },
    { key: 'ending_hc',       label: 'End HC',      align: 'right' as const },
    { key: 'net',              label: 'Net Δ',       align: 'right' as const },
    { key: 'attrition_pct',   label: 'Attrition %', align: 'right' as const },
    { key: 'prev_attrition_pct', label: 'vs Prev',  align: 'right' as const },
  ]

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[480px] -mx-2">
      <table className="w-full" style={{ borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr className="border-b border-gray-100">
            <th className="sticky top-0 bg-white text-[9px] font-black uppercase tracking-widest text-neutral-gray py-2.5 px-3 text-left w-6">
              #
            </th>
            {cols.map(c => (
              <th key={c.key}
                className={`sticky top-0 bg-white text-[9px] font-black uppercase tracking-widest text-neutral-gray py-2.5 px-3 cursor-pointer select-none hover:text-black transition-colors ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                onClick={() => toggle(c.key)}>
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {sort.key === c.key && <span className="text-[8px]">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const trend = r.attrition_pct - r.prev_attrition_pct
            const hi    = r.attrition_pct > 5
            return (
              <tr key={r.project} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 text-[9px] font-black text-neutral-gray">{i + 1}</td>
                <td className="py-2.5 px-3">
                  <div>
                    <p className="text-[11px] font-black text-black">{r.project}</p>
                    <p className="text-[9px] font-bold text-neutral-gray">{r.opg}</p>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-[11px] font-bold text-black">{r.starting_hc.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-[11px] font-bold" style={{ color: GREEN }}>+{r.new_hire}</td>
                <td className="py-2.5 px-3 text-right text-[11px] font-bold" style={{ color: RED }}>−{r.resign}</td>
                <td className="py-2.5 px-3 text-right text-[11px] font-black text-black">{r.ending_hc.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-[11px] font-black" style={{ color: r.net >= 0 ? GREEN : RED }}>
                  {r.net >= 0 ? '+' : '−'}{Math.abs(r.net)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`text-[11px] font-black`} style={{ color: hi ? RED : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                    {r.attrition_pct.toFixed(2)}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black"
                    style={{ color: trend > 0 ? RED : trend < 0 ? GREEN : GRAY }}>
                    {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'}{Math.abs(trend).toFixed(2)}pp
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Pie tooltip — matches TIP style ───────────────────────────────────────────
const PIE_TIP = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const total = payload[0]?.payload?.__total ?? 0
  const pct   = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0'
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[10px]">
      <p className="font-black text-black uppercase tracking-wider mb-1">{p.name}</p>
      <p style={{ color: p.payload.color }} className="font-bold">
        Count: {p.value.toLocaleString()}
      </p>
      <p className="font-bold text-neutral-gray">Share: {pct}%</p>
    </div>
  )
}

// ── Attrition drill-down (3 levels: Type → Notice → Reason) ───────────────────
function AttritionDrillDown({ attrData, periodMonths }: { attrData: AttrData; periodMonths: number }) {
  const [drillNotice, setDrillNotice] = useState<string | null>(null)
  const level = drillNotice === null ? 0 : 1

  // Parse "Notice - Specific Reason" from each full reason string
  const enriched = useMemo(() =>
    attrData.by_reason_typed.map(r => {
      const parts = r.reason.split(' - ')
      const noticeType     = parts.length > 1 ? parts.slice(0, -1).join(' - ') : 'General'
      const specificReason = parts.length > 1 ? parts[parts.length - 1] : parts[0]
      return { ...r, noticeType, specificReason }
    }), [attrData])

  // Level 0: notice types aggregated across ALL resign_types
  // Level 1: specific reasons within the selected notice type
  const pieData = useMemo(() => {
    const map = new Map<string, number>()
    const rows = level === 0
      ? enriched
      : enriched.filter(r => r.noticeType === drillNotice)
    const key = (r: typeof enriched[0]) => level === 0 ? r.noticeType : r.specificReason
    for (const r of rows) map.set(key(r), (map.get(key(r)) || 0) + r.count)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: DRILL_PALETTE[i % DRILL_PALETTE.length] }))
  }, [level, drillNotice, enriched])

  const total = pieData.reduce((s, d) => s + d.value, 0)

  const [hoveredSegment, setHoveredSegment] = useState<{ name: string; value: number; color: string } | null>(null)

  const handleClick = (name: string) => { if (level === 0) setDrillNotice(name) }
  const goBack = () => setDrillNotice(null)

  const breadcrumb = ['All', ...(drillNotice ? [drillNotice] : [])]

  // Right panel level 0: all specific reasons combined, sorted by count
  const allReasons = useMemo(() => {
    const rows = level === 0 ? enriched : enriched.filter(r => r.noticeType === drillNotice)
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.specificReason, (map.get(r.specificReason) || 0) + r.count)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: DRILL_PALETTE[i % DRILL_PALETTE.length] }))
  }, [level, drillNotice, enriched])

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left — Drill-down pie */}
      <Card>
        <SectionTitle
          title="Attrition by Notice Type"
          sub={`${periodMonths}-month · ${attrData.summary.total} exits · Voluntary ${attrData.summary.voluntary} / Involuntary ${attrData.summary.involuntary}`}
          right={level > 0 && (
            <button onClick={goBack}
              className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
              ← Back
            </button>
          )}
        />
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {breadcrumb.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <span className="text-[8px] text-gray-300">›</span>}
              <span className={`text-[9px] font-black uppercase tracking-widest ${i === breadcrumb.length - 1 ? 'text-black' : 'text-gray-400'}`}>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.map(d => ({ ...d, __total: total }))}
                  cx="50%" cy="50%" innerRadius={42} outerRadius={66} dataKey="value" stroke="none"
                  onClick={level === 0 ? (d: any) => handleClick(d.name as string) : undefined}
                  onMouseEnter={(d: any) => setHoveredSegment({ name: d.name, value: d.value, color: d.color })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{ cursor: level === 0 ? 'pointer' : 'default' }}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[20px] font-black text-black leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{total}</p>
              <p className="text-[7px] font-bold text-neutral-gray uppercase tracking-wider mt-0.5">
                {level === 0 ? 'exits' : (drillNotice ?? '')}
              </p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-36">
            {pieData.map(d => (
              <div key={d.name}
                className={`${level === 0 ? 'cursor-pointer' : ''} group`}
                onClick={level === 0 ? () => handleClick(d.name) : undefined}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[9px] font-bold text-black truncate group-hover:underline">{d.name}</span>
                  </div>
                  <span className="text-[9px] font-black shrink-0 ml-2" style={{ color: d.color, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-3.5" style={{ width: 'calc(100% - 14px)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${total > 0 ? (d.value/total*100).toFixed(1) : 0}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Hover info strip — replaces tooltip, no overlap with donut center */}
        <div className="mt-3 h-6 flex items-center justify-center">
          {hoveredSegment ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
              style={{ background: `${hoveredSegment.color}12`, border: `1px solid ${hoveredSegment.color}30` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: hoveredSegment.color }} />
              <span style={{ color: hoveredSegment.color }}>{hoveredSegment.name}</span>
              <span className="text-gray-400 font-bold">·</span>
              <span style={{ color: hoveredSegment.color, fontVariantNumeric: 'tabular-nums' }}>{hoveredSegment.value}</span>
              <span className="text-gray-400 font-bold">·</span>
              <span style={{ color: hoveredSegment.color }}>{total > 0 ? (hoveredSegment.value / total * 100).toFixed(1) : 0}%</span>
            </div>
          ) : (
            <p className="text-[8px] text-gray-300 font-bold">
              {level === 0 ? 'Hover a segment for details · click to drill down' : 'Hover a segment for details'}
            </p>
          )}
        </div>
      </Card>

      {/* Right — Specific reasons (all at level 0, filtered at level 1) */}
      <Card>
        <SectionTitle
          title="Reason Breakdown"
          sub={level === 0 ? 'All reasons · sorted by count' : `${drillNotice} → Specific Reason`}
        />
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {allReasons.map(d => {
            const allTotal = attrData.summary.total || 1
            return (
              <div key={d.name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[9px] font-bold text-black flex-1 truncate">{d.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] text-gray-400 tabular-nums">{(d.value / allTotal * 100).toFixed(1)}%</span>
                  <span className="text-[9px] font-black tabular-nums w-8 text-right" style={{ color: d.color, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── Client-side aggregation helpers ───────────────────────────────────────────
function parseTrendMonth(label: string): { mo: number; yr: number } {
  const months: Record<string, number> = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }
  const [mon, yr] = label.split(' ')
  const fullYr = parseInt(yr) + (parseInt(yr) < 50 ? 2000 : 1900)
  return { mo: months[mon] ?? 1, yr: fullYr }
}

interface TrendRaw {
  month: string; starting_hc: number; ending_hc: number
  new_hire: number; attrition: number; attrition_pct: number; hc_growth_pct: number
}

function aggregateTrend(data: TrendRaw[], viewMode: string) {
  const groupKey = (d: TrendRaw): string => {
    const { mo, yr } = parseTrendMonth(d.month)
    if (viewMode === 'Q') return `Q${Math.ceil(mo / 3)} ${yr}`
    if (viewMode === 'S') return `S${mo <= 6 ? 1 : 2} ${yr}`
    if (viewMode === 'Y') return `${yr}`
    return d.month // 'M' — monthly as-is
  }

  // Preserve insertion order
  const map = new Map<string, TrendRaw[]>()
  for (const d of data) {
    const k = groupKey(d)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(d)
  }

  return [...map.entries()].map(([label, pts]) => {
    const startHC = pts[0].starting_hc
    const endHC   = pts[pts.length - 1].ending_hc
    const attrition = pts.reduce((s, p) => s + p.attrition, 0)
    const newHire   = pts.reduce((s, p) => s + p.new_hire,  0)
    const netHC     = endHC - startHC
    return {
      month:         label,
      total_hc:      endHC,
      attrition,
      new_hire:      newHire,
      net_hc:        netHC,
      growth_pct:    startHC > 0 ? parseFloat(((endHC - startHC) / startHC * 100).toFixed(2)) : 0,
      attrition_pct: startHC > 0 ? parseFloat((attrition / startHC * 100).toFixed(2)) : 0,
    }
  })
}


export default function AnalyticsDashboard({
  month, site, project, hcType, sto, unit = 'all', grouped = false, periodMonths = 12, viewMode = 'M', employees = [], isDataLoading = false
}: {
  month: string; site: string; project: string; hcType: string; sto: string
  unit?: string; grouped?: boolean; periodMonths?: number; viewMode?: string; employees?: any[]; isDataLoading?: boolean
}) {
  const [data, setData]       = useState<V3Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [attrData, setAttrData] = useState<AttrData | null>(null)

  // Trend series visibility (one entry per group key; controls both left & right chart)
  const [seriesVisible, setSeriesVisible] = useState<Record<string, boolean>>({
    total_hc: true, attrition: true, new_hire: true,
  })
  const toggleSeries = (key: string) => setSeriesVisible(v => ({ ...v, [key]: !v[key] }))

  useEffect(() => {
    if (isDataLoading) {
      setLoading(true);
      return;
    }
    setLoading(true);
    try {
      const { v3Data, attrData: newAttrData } = computeAnalyticsData(
        employees, month, site, project, hcType, sto, unit, periodMonths
      );
      setData(v3Data);
      setAttrData(newAttrData);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Failed to calculate analytics.");
    } finally {
      setLoading(false);
    }
  }, [employees, month, site, project, hcType, sto, unit, periodMonths, grouped, isDataLoading]);


  // Determine drilldown level from external filter props (must be before early returns)
  const drillLevel =
    sto !== 'all' && site !== 'all' ? 'project'
    : sto !== 'all'                  ? 'opg'
    : site !== 'all'                 ? 'project'
    :                                  'sto'

  const drillLevelLabel =
    drillLevel === 'sto'     ? 'STO'
    : drillLevel === 'opg'   ? 'OPG'
    :                          'Project'

  // STO rows — derived from projects data (must be before early returns)
  const sto_rows = useMemo(() => {
    const projects = data?.projects ?? []
    const map = new Map<string, { ending_hc: number; starting_hc: number; resign: number; count: number }>()
    for (const p of projects) {
      const key = p.sto || 'Unknown'
      const g = map.get(key) || { ending_hc: 0, starting_hc: 0, resign: 0, count: 0 }
      g.ending_hc   += p.ending_hc
      g.starting_hc += p.starting_hc
      g.resign      += p.resign
      g.count++
      map.set(key, g)
    }
    const totalEom = projects.reduce((s, p) => s + p.ending_hc, 0) || 1
    return [...map.entries()]
      .map(([name, g]) => ({
        name,
        ending_hc:     g.ending_hc,
        attrition_pct: g.starting_hc > 0 ? parseFloat((g.resign / g.starting_hc * 100).toFixed(2)) : 0,
        resign:        g.resign,
        count:         g.count,
        share:         parseFloat((g.ending_hc / totalEom * 100).toFixed(1)),
      }))
      .sort((a, b) => b.ending_hc - a.ending_hc)
  }, [data?.projects])

  // Project-level rows for the drilldown bar chart (must be before early returns)
  const proj_drill_rows = useMemo(() => {
    const projects = data?.projects ?? []
    const totalEom = projects.reduce((s, p) => s + p.ending_hc, 0) || 1
    return projects.map(p => ({
      name:          p.project,
      ending_hc:     p.ending_hc,
      attrition_pct: p.attrition_pct,
      resign:        p.resign,
      count:         1,
      share:         parseFloat((p.ending_hc / totalEom * 100).toFixed(1)),
    }))
  }, [data?.projects])

  // Performer grids — all 6 metrics, top 10 best + bottom 10 worst (must be before early returns)
  const performerData = useMemo(() => {
    const projs = data?.projects ?? []
    const metrics = [
      { key: 'ending_hc',     label: 'Total HC',      higherIsBetter: true,  fmt: (v: number) => v.toLocaleString()  },
      { key: 'growth_pct',    label: 'Growth %',      higherIsBetter: true,  fmt: (v: number) => `${Math.round(v)}%`  },
      { key: 'attrition_pct', label: 'Attrition %',   higherIsBetter: false, fmt: (v: number) => `${Math.round(v)}%`  },
      { key: 'resign',        label: 'Resign Count',   higherIsBetter: false, fmt: (v: number) => v.toString()        },
      { key: 'net',           label: 'Net HC',         higherIsBetter: true,  fmt: (v: number) => (v >= 0 ? '+' : '') + v },
      { key: 'new_hire',      label: 'New Hire',       higherIsBetter: true,  fmt: (v: number) => v.toString()        },
    ]
    return metrics.map(m => {
      const rows = projs.map(p => ({
        label: p.project,
        value: m.key === 'growth_pct'
          ? parseFloat(((p.ending_hc - p.starting_hc) / Math.max(1, p.starting_hc) * 100).toFixed(2))
          : (p as any)[m.key] as number,
      }))
      const asc  = [...rows].sort((a, b) => a.value - b.value)
      const desc = [...rows].sort((a, b) => b.value - a.value)
      return {
        ...m,
        topRows:    (m.higherIsBetter ? desc : asc).slice(0, 10),
        bottomRows: (m.higherIsBetter ? asc  : desc).slice(0, 10),
      }
    })
  }, [data?.projects])

  if (loading || !data) return <LoadingSpinner />
  if (error && !data) return (
    <div className="text-center py-24 text-[11px] font-bold text-active-red uppercase tracking-widest">{error}</div>
  )

  const { period, bom, eom, attrition, attrition_rate, joiner, prev, ytd, trend_12m, projects, opg_rows } = data

  // Spark arrays (last 6 months of trend)
  const last6 = trend_12m.slice(-6)
  const spark = {
    ending_hc:     last6.map(d => d.ending_hc),
    hc_growth_pct: last6.map(d => d.hc_growth_pct),
    attrition_pct: last6.map(d => d.attrition_pct),
    attrition:     last6.map(d => d.attrition),
    new_hire:      last6.map(d => d.new_hire),
  }

  // Trend data — aggregated by viewMode (M=monthly, Q=quarterly, S=semester, Y=yearly)
  const trendData = aggregateTrend(trend_12m, viewMode)

  // Period-aware KPI aggregation — for non-monthly views use the current & prior period groups
  const isMultiPeriod = viewMode !== 'M' && trendData.length > 0
  const currPeriodRow = trendData[trendData.length - 1]
  const prevPeriodRow = trendData.length > 1 ? trendData[trendData.length - 2] : null

  const kpiEomTotal    = isMultiPeriod ? currPeriodRow.total_hc       : eom.total
  const kpiAttrition   = isMultiPeriod ? currPeriodRow.attrition      : attrition.total
  const kpiAttrPct     = isMultiPeriod ? currPeriodRow.attrition_pct  : attrition_rate.all
  const kpiNewHire     = isMultiPeriod ? currPeriodRow.new_hire        : joiner.new_hire
  const kpiGrowthPct   = isMultiPeriod ? currPeriodRow.growth_pct     : data.hc_growth_pct
  const kpiPeriodLabel = isMultiPeriod ? currPeriodRow.month          : period.label
  const kpiPrevLabel   = isMultiPeriod && prevPeriodRow ? prevPeriodRow.month : period.prev_label

  // KPI deltas vs prior period (period-group for non-monthly, single prev month for monthly)
  const hcDelta      = kpiEomTotal  - (isMultiPeriod ? (prevPeriodRow?.total_hc ?? 0)      : prev.eom_total)
  const attrPctDelta = kpiAttrPct   - (isMultiPeriod ? (prevPeriodRow?.attrition_pct ?? 0) : prev.attrition_rate)
  const attrCntDelta = kpiAttrition - (isMultiPeriod ? (prevPeriodRow?.attrition ?? 0)     : prev.attrition)
  const nhDelta      = kpiNewHire   - (isMultiPeriod ? (prevPeriodRow?.new_hire ?? 0)      : prev.joiners)
  const growthDelta  = kpiGrowthPct - (isMultiPeriod
    ? (prevPeriodRow?.growth_pct ?? 0)
    : (prev.eom_total > 0 && bom.total > 0 ? parseFloat(((prev.eom_total - bom.total) / bom.total * 100).toFixed(2)) : 0)
  )

  const drillRows =
    drillLevel === 'sto'   ? sto_rows
    : drillLevel === 'opg' ? opg_rows
    :                        proj_drill_rows

  // Breadcrumb path based on active filters
  const breadcrumbs: string[] = ['All']
  if (sto  !== 'all') breadcrumbs.push(sto)
  if (site !== 'all') breadcrumbs.push(site)


  return (
    <div className="space-y-6">

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title={`Total Headcount — ${kpiPeriodLabel}`}
          value={kpiEomTotal.toLocaleString()}
          deltaValue={hcDelta}
          deltaLabel={`vs ${kpiPrevLabel}`}
          sparkValues={spark.ending_hc}
          sparkColor={BLUE}
          tooltip={
            <div className="space-y-2">
              <p className="font-black text-black uppercase tracking-widest text-[8px]">Headcount Movement</p>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest">Starting HC</p>
                  <p className="font-black text-black text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{bom.total.toLocaleString()}</p>
                  <p className="text-[8px] text-gray-400">BOM {period.label}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5 text-gray-300">
                  <span className="text-[8px] font-black" style={{ color: eom.total - bom.total >= 0 ? GREEN : RED }}>
                    {eom.total - bom.total >= 0 ? `+${(eom.total - bom.total).toLocaleString()}` : (eom.total - bom.total).toLocaleString()}
                  </span>
                  <span className="text-gray-300">→</span>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest">Ending HC</p>
                  <p className="font-black text-black text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>{eom.total.toLocaleString()}</p>
                  <p className="text-[8px] text-gray-400">EOM {period.label}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-1.5 space-y-0.5">
                <p className="text-[8px]">Agent: <span className="font-black text-black">{bom.agent.toLocaleString()} → {eom.agent.toLocaleString()}</span></p>
                <p className="text-[8px]">Support: <span className="font-black text-black">{bom.support.toLocaleString()} → {eom.support.toLocaleString()}</span></p>
              </div>
            </div>
          }
        />
        <KpiCard
          title={`HC Growth % — ${kpiPeriodLabel}`}
          value={`${kpiGrowthPct.toFixed(2)}%`}
          deltaValue={growthDelta}
          deltaLabel={`vs ${kpiPrevLabel}`}
          sparkValues={spark.hc_growth_pct}
          sparkColor={PURPLE}
        />
        <KpiCard
          title={`Attrition % — ${kpiPeriodLabel}`}
          value={`${kpiAttrPct.toFixed(2)}%`}
          deltaValue={attrPctDelta}
          deltaLabel={`vs ${kpiPrevLabel}`}
          lowerIsBetter
          sparkValues={spark.attrition_pct}
          sparkColor={RED}
        />
        <KpiCard
          title={`Attrition Count — ${kpiPeriodLabel}`}
          value={kpiAttrition.toLocaleString()}
          deltaValue={attrCntDelta}
          deltaLabel={`vs ${kpiPrevLabel}`}
          lowerIsBetter
          sparkValues={spark.attrition}
          sparkColor={ORANGE}
        />
        <KpiCard
          title={`New Hire — ${kpiPeriodLabel}`}
          value={kpiNewHire.toLocaleString()}
          deltaValue={nhDelta}
          deltaLabel={`vs ${kpiPrevLabel}`}
          sparkValues={spark.new_hire}
          sparkColor={GREEN}
          tooltip={
            <div className="space-y-1.5">
              <p className="font-black text-black uppercase tracking-widest text-[8px]">Formula</p>
              <p>COUNT DISTINCT employees where:</p>
              <ul className="space-y-1 pl-2">
                <li>• <span className="font-black text-black">hire_status = "New Hire"</span></li>
                <li>• <span className="font-black text-black">join_date_project</span> within selected period</li>
                <li>• Sourced from both <span className="font-black text-black">employees</span> and <span className="font-black text-black">resign</span> tables (catches same-month join &amp; resign)</li>
              </ul>
              <p className="text-[8px] text-gray-400 border-t border-gray-100 pt-1.5 mt-1">Excludes Transfer In (hire_status = "From Other PJ")</p>
            </div>
          }
        />
      </div>

      {/* ── Trend Chart — dual panel ────────────────────────────────────────────── */}
      <Card>
        <div className="mb-4">
          <div className="mb-3">
            <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Trend Chart</h3>
            <p className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest mt-0.5">
              {viewMode === 'M' ? 'Monthly'
               : viewMode === 'Q' ? 'Quarterly'
               : viewMode === 'S' ? 'Semesterly'
               : 'Yearly'} — {trendData[0]?.month ?? '?'} to {trendData[trendData.length - 1]?.month ?? '?'}
            </p>
          </div>
          {/* Legend row — all three series centered, New Hire is non-toggleable */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {TREND_SERIES.filter(s => s.key !== 'new_hire').map(s => {
              const on = seriesVisible[s.key]
              return (
                <button key={s.key} onClick={() => toggleSeries(s.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest"
                  style={{
                    borderColor: on ? s.color : '#E5E7EB',
                    background:  on ? `${s.color}12` : 'transparent',
                    color:       on ? s.color : GRAY,
                    opacity:     on ? 1 : 0.5,
                  }}
                >
                  <div className="w-4 h-0.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </button>
              )
            })}
            {/* New Hire — always on, non-toggleable */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest"
              style={{ borderColor: GREEN, background: `${GREEN}12`, color: GREEN }}>
              <div className="w-4 h-0.5 rounded-full" style={{ background: GREEN }} />
              New Hire #
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Left — stacked bar. Values animate to 0 when hidden (not removed from DOM), so stack order never shifts */}
          <div>
            <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest mb-2">Count — stacked · net change above</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData.map(d => ({
                    ...d,
                    // Set to 0 when hidden so bar animates out but stays in DOM at same stack position
                    total_hc_v:  seriesVisible.total_hc  ? d.total_hc  : 0,
                    attrition_v: seriesVisible.attrition ? d.attrition : 0,
                    new_hire_v:  seriesVisible.new_hire  ? d.new_hire  : 0,
                  }))}
                  margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: GRAY }} />
                  <YAxis axisLine={false} tickLine={false} width={38} tick={{ fontSize: 8, fontWeight: 700, fill: GRAY }}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const raw = payload[0]?.payload as any
                    const netHc = raw?.net_hc as number
                    return (
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[10px]">
                        <p className="font-black text-black uppercase tracking-wider mb-1">{label}</p>
                        {seriesVisible.total_hc  && <p style={{ color: BLUE }}  className="font-bold">Total HC: {raw?.total_hc?.toLocaleString()}</p>}
                        {seriesVisible.attrition  && <p style={{ color: RED }}   className="font-bold">Attrition #: {raw?.attrition?.toLocaleString()}</p>}
                        {seriesVisible.new_hire   && <p style={{ color: GREEN }} className="font-bold">New Hire #: {raw?.new_hire?.toLocaleString()}</p>}
                        {netHc !== undefined && (
                          <p className="font-bold border-t border-gray-100 pt-1 mt-1"
                            style={{ color: netHc >= 0 ? GREEN : RED }}>
                            Net HC: {netHc >= 0 ? `+${netHc}` : netHc}
                          </p>
                        )}
                      </div>
                    )
                  }} />
                  {/* Stack order is always: total_hc → attrition → new_hire. Never changes. */}
                  <Bar dataKey="total_hc_v" name="Total HC"   stackId="s" fill={BLUE}  radius={[0, 0, 3, 3]} />
                  <Bar dataKey="attrition_v" name="Attrition #" stackId="s" fill={RED} />
                  <Bar dataKey="new_hire_v"  name="New Hire #" stackId="s" fill={GREEN} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="net_hc" position="top"
                      content={({ x, y, width, value }: any) => {
                        const v = Number(value)
                        return (
                          <text x={Number(x) + Number(width) / 2} y={Number(y) - 3}
                            textAnchor="middle" fontSize={7} fontWeight={800}
                            fill={v >= 0 ? GREEN : RED}>
                            {v >= 0 ? `+${v}` : `${v}`}
                          </text>
                        )
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right — percentage data */}
          <div>
            <p className="text-[9px] font-black text-neutral-gray uppercase tracking-widest mb-2">Percentage</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-R-growth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={BLUE} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-R-attrpct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={RED} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: GRAY }} />
                  <YAxis axisLine={false} tickLine={false} width={38} tick={{ fontSize: 8, fontWeight: 700, fill: GRAY }}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<TIP />} />
                  {seriesVisible.total_hc && (
                    <Area type="monotone" dataKey="growth_pct" name="HC Growth %"
                      stroke={BLUE} strokeWidth={2} fill="url(#grad-R-growth)"
                      dot={false} activeDot={{ r: 4, fill: BLUE }} />
                  )}
                  {seriesVisible.attrition && (
                    <Area type="monotone" dataKey="attrition_pct" name="Attrition %"
                      stroke={RED} strokeWidth={2} fill="url(#grad-R-attrpct)"
                      dot={false} activeDot={{ r: 4, fill: RED }} />
                  )}
                  {!seriesVisible.total_hc && !seriesVisible.attrition && (
                    <text x="50%" y="50%" textAnchor="middle" fill={GRAY} fontSize={10} fontWeight={700}>
                      No % series visible
                    </text>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Attrition Drill-Down ──────────────────────────────────────────────────── */}
      {attrData && attrData.summary.total > 0 && (
        <AttritionDrillDown attrData={attrData} periodMonths={periodMonths} />
      )}

      {/* ── HC Drilldown (horizontal bar) ──────────────────────────────────────── */}
      <Card>
        <SectionTitle
          title="Headcount Breakdown"
          sub={`By ${drillLevelLabel} · ${drillRows.length} groups · EOM ${kpiPeriodLabel} · use filters to drill down`}
          right={
            <span className="text-[9px] font-bold text-neutral-gray bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              Total · <span className="text-black font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{eom.total.toLocaleString()}</span> HC
            </span>
          }
        />
        {/* Breadcrumb path (read-only — reflects external filter state) */}
        <div className="flex items-center gap-1.5 mb-4 text-[9px] font-black uppercase tracking-widest flex-wrap">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-gray-300">›</span>}
              <span className={`px-2 py-1 rounded ${idx === breadcrumbs.length - 1 ? 'bg-black text-white' : 'bg-gray-100 text-neutral-gray'}`}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
          <span className="text-gray-300">›</span>
          <span className="px-2 py-1 rounded bg-gray-50 text-neutral-gray border border-dashed border-gray-200">
            By {drillLevelLabel}
          </span>
        </div>
        <div className="space-y-1.5">
          {drillRows.map((r, i) => {
            const totalHC = drillRows.reduce((s, x) => s + x.ending_hc, 0) || 1
            const pct     = (r.ending_hc / totalHC * 100).toFixed(1)
            const barPct  = (r.ending_hc / totalHC * 100)
            const colors  = [BLUE, '#6366F1', PURPLE, '#A855F7', GRAY]
            const col     = colors[i % colors.length]
            return (
              <div key={r.name} className="flex items-center gap-3 py-2 px-3 rounded-xl">
                <span className="text-[9px] font-black text-neutral-gray w-5 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-black text-black truncate">{r.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-bold text-neutral-gray">{r.count} proj · attr {r.attrition_pct.toFixed(2)}%</span>
                      <span className="text-[11px] font-black text-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.ending_hc.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-neutral-gray w-8">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${barPct}%`, background: col }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Top 10 vs Bottom 10 Performers — 3×2 grid ──────────────────────────── */}
      <div>
        <div className="mb-3">
          <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Top 10 vs Bottom 10 Performers</h3>
          <p className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest mt-0.5">Best (green) · Worst (red) · By project · 6 metrics · {trendData[0]?.month ?? '?'} → {kpiPeriodLabel}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {performerData.map(m => (
            <Card key={m.key} className="p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-black mb-3">{m.label}</p>
              {projects.length < 2 ? (
                <p className="text-center py-4 text-[10px] font-bold text-neutral-gray">Need ≥2 projects</p>
              ) : (
                <TornadoChart topRows={m.topRows} bottomRows={m.bottomRows} fmt={m.fmt} />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Project Table ───────────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          title={`Project Breakdown — ${trendData[0]?.month ?? '?'} → ${kpiPeriodLabel}`}
          sub="Click any column header to sort · HC = period start/end, New Hire & Resign = cumulative over period"
          right={
            <span className="text-[9px] font-bold text-neutral-gray bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              {projects.length} projects
            </span>
          }
        />
        <ProjectTable projects={projects} />
      </Card>

      {/* Footer */}
      <p className="text-[9px] font-bold text-neutral-gray uppercase tracking-widest text-center">
        Trans-Force · Workforce Performance Summary · {period.label}
      </p>
    </div>
  )
}
