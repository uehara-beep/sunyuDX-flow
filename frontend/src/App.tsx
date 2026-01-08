import Estimate from './Estimate'
import Invoice from './Invoice'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { jget, jpost, jdel } from './api'
import { Project, Schedule, Assignment } from './types'
import { addDays, todayISO, startOfWeekISO, startOfMonthISO, endOfMonthISO, dowLabel } from './utils'

type ViewMode = 'WEEK' | 'MONTH'
type Tab = 'SCHEDULE' | 'ESTIMATE' | 'COST' | 'INVOICES' | 'SUBCON' | 'INVENTORY' | 'QUALITY' | 'MEASURE'

function rangeDates(from: string, to: string): string[] {
  const out: string[] = []
  let cur = from
  out.push(cur)
  while (cur < to) {
    cur = addDays(cur, 1)
    out.push(cur)
  }
  return out
}

function truncateNames(names: string[], max = 3): { shown: string[]; more: number } {
  if (names.length <= max) return { shown: names, more: 0 }
  return { shown: names.slice(0, max), more: names.length - max }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('SCHEDULE')
  const [mode, setMode] = useState<ViewMode>('WEEK')
  const [anchor, setAnchor] = useState<string>(todayISO())
  const [projects, setProjects] = useState<Project[]>([])
  const [items, setItems] = useState<Schedule[]>([])
  const [selected, setSelected] = useState<Schedule | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  const period = useMemo(() => {
    if (mode === 'WEEK') {
      const s = startOfWeekISO(anchor)
      const e = addDays(s, 6)
      return { from: s, to: e, cols: rangeDates(s, e) }
    }
    const s = startOfMonthISO(anchor)
    const e = endOfMonthISO(anchor)
    return { from: s, to: e, cols: rangeDates(s, e) }
  }, [mode, anchor])

  // swipe (mobile): left/right to move week/month
  const touch = useRef<{x:number,y:number}|null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy)) return
    // left: next, right: prev
    const step = mode === 'WEEK' ? 7 : 30
    setAnchor(addDays(anchor, dx < 0 ? step : -step))
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null)
        const ps = await jget<Project[]>('/api/projects')
        setProjects(ps)
      } catch (e:any) {
        setError(String(e?.message ?? e))
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        setError(null)
        const ss = await jget<Schedule[]>(`/api/schedule?date_from=${period.from}&date_to=${period.to}`)
        setItems(ss)
      } catch (e:any) {
        setError(String(e?.message ?? e))
      }
    })()
  }, [period.from, period.to])

  // build row model: one row per project
  const rows = useMemo(() => {
    const map = new Map<string, Record<string, Schedule[]>>()
    for (const p of projects) map.set(p.id, {})
    for (const it of items) {
      const r = map.get(it.project_id) ?? {}
      if (!r[it.date]) r[it.date] = []
      r[it.date].push(it)
      map.set(it.project_id, r)
    }
    // filter by search
    const ps = projects.filter(p => !q || p.name.includes(q))
    return ps.map(p => ({ project: p, byDate: map.get(p.id) ?? {} }))
  }, [projects, items, q])

  // unassigned employees (FIELD): in current period, those with no EMPLOYEE assignment anywhere
  const unassignedEmployees = useMemo(() => {
    const employees = new Set<string>()
    const assigned = new Set<string>()
    for (const it of items) {
      for (const a of it.assignments) {
        if (a.assignee_type === 'EMPLOYEE') {
          employees.add(a.assignee_name)
          assigned.add(a.assignee_name)
        }
      }
    }
    // NOTE: in real system, employees list comes from master; here we infer from data.
    const all = Array.from(employees)
    const un = all.filter(n => !assigned.has(n))
    return un
  }, [items])

  const openDrawer = (it: Schedule) => {
    setSelected(it)
    setSelectedProject(projects.find(p => p.id === it.project_id) ?? null)
  }

  const closeDrawer = () => setSelected(null)

  const addEmp = async () => {
    if (!selected) return
    const name = prompt('社員名を入力（例：佐藤）')
    if (!name) return
    const payload: Assignment = {
      id: crypto.randomUUID().replace(/-/g,''),
      assignee_type: 'EMPLOYEE',
      assignee_name: name,
      employee_user_id: null,
      subcon_is_lump_sum: false,
      headcount: null
    }
    await jpost(`/api/schedule/${selected.id}/assign`, payload)
    // reload period
    const ss = await jget<Schedule[]>(`/api/schedule?date_from=${period.from}&date_to=${period.to}`)
    setItems(ss)
    // reselect
    setSelected(selected)
  }

  const addSubcon = async (lump: boolean) => {
    if (!selected) return
    const name = prompt(lump ? '外注名（請負）' : '外注名（常用）')
    if (!name) return
    let headcount: number | null = null
    if (!lump) {
      const h = prompt('人数（常用のみ）', '2')
      headcount = h ? Number(h) : null
    }
    const payload: Assignment = {
      id: crypto.randomUUID().replace(/-/g,''),
      assignee_type: 'SUBCON',
      assignee_name: name,
      employee_user_id: null,
      subcon_is_lump_sum: lump,
      headcount
    }
    await jpost(`/api/schedule/${selected.id}/assign`, payload)
    const ss = await jget<Schedule[]>(`/api/schedule?date_from=${period.from}&date_to=${period.to}`)
    setItems(ss)
    setSelected(selected)
  }

  const delAssign = async (aid: string) => {
    if (!selected) return
    await jdel(`/api/schedule/${selected.id}/assign/${aid}`)
    const ss = await jget<Schedule[]>(`/api/schedule?date_from=${period.from}&date_to=${period.to}`)
    setItems(ss)
    // keep drawer with refreshed object
    const cur = ss.find(x => x.id === selected.id) ?? null
    setSelected(cur)
  }

  const notifyStaffing = async () => {
    const msg = `【人材不足】期間 ${period.from}〜${period.to}\n赤セルを確認してください。`
    await jpost('/api/notify/staffing', { message: msg })
    alert('通知（stub）を送信しました')
  }

  const excelCols = period.cols
  const colsStyle = { ['--cols' as any]: excelCols.length }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div style={{display:'flex', alignItems:'center', gap:10, fontWeight:800}}>
          <span style={{width:12,height:12,borderRadius:999,background:'var(--orange)',display:'inline-block'}} />
          <span>sunyuDX-flow</span>
        </div>
        <div className="small" style={{marginTop:6}}>Excel運用をそのままWeb化</div>

        <div style={{marginTop:14, display:'flex', flexDirection:'column', gap:8}}>
          {([
            ['SCHEDULE','工程表/配置'],
            ['ESTIMATE','見積→予算'],
            ['COST','原価/差異'],
            ['INVOICES','請求/OCR'],
            ['SUBCON','外注/注文'],
            ['INVENTORY','在庫(PD)'],
            ['QUALITY','品質'],
            ['MEASURE','出来高(3D)'],
          ] as any).map(([k,label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                width:'100%',
                justifyContent:'space-between',
                display:'flex',
                background: tab===k ? 'var(--blue-soft)' : 'transparent',
                borderColor: tab===k ? '#cfd8ff' : 'transparent'
              }}
            >
              <span style={{fontWeight:800}}>{label}</span>
              <span className="small">{tab===k?'●':''}</span>
            </button>
          ))}
        </div>

        <div style={{marginTop:16}} className="card">
          <div style={{padding:12, borderBottom:'1px solid var(--line)', fontWeight:800}}>表示ルール（固定）</div>
          <div style={{padding:12}} className="small">
            夜間＝黄色 / 人材不足＝赤（請負は対象外）<br/>
            社員は名前表示、外注はONE4等<br/>
            3名超は +N 省略
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button className={mode==='WEEK'?'btnPrimary':''} onClick={() => setMode('WEEK')}>週</button>
            <button className={mode==='MONTH'?'btnPrimary':''} onClick={() => setMode('MONTH')}>月</button>
          </div>

          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={() => setAnchor(addDays(anchor, mode==='WEEK'?-7:-30))}>←</button>
            <div style={{fontWeight:800}}>
              {period.from} 〜 {period.to}
            </div>
            <button onClick={() => setAnchor(addDays(anchor, mode==='WEEK'?7:30))}>→</button>
          </div>

          <input className="input" placeholder="現場検索" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btnAccent" onClick={notifyStaffing}>人材不足通知（工事）</button>
          <div className="small">スマホ：左右スワイプで前後へ</div>
        </div>

        {error && (
          <div style={{marginTop:10, padding:12, borderRadius:12, border:'1px solid var(--line)', background:'#fff'}}>
            <span style={{fontWeight:800, color:'#b91c1c'}}>エラー:</span> {error}
          </div>
        )}

        {tab === 'ESTIMATE' ? (<Estimate />) : tab === 'INVOICES' ? (<Invoice />) : tab !== 'SCHEDULE' ? (
          <div style={{marginTop:14}} className="card">
            <div style={{padding:14, borderBottom:'1px solid var(--line)', fontWeight:800}}>
              {tab}（v1: UI枠のみ）
            </div>
            <div style={{padding:14}} className="small">
              このプロジェクトは「工程表/配置」が最優先で完成済み。<br/>
              見積→予算、原価、OCR、外注、在庫、品質、出来高は次の実装フェーズでAPI/画面を接続していく。
            </div>
          </div>
        ) : (
          <div className="gridWrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {/* Excel Grid */}
            <div className="excelGrid" style={colsStyle as any}>
              <div className="excelRow excelHeader">
                <div className="cell cellHead leftHead">元請 / 現場名</div>
                {excelCols.map(d => (
                  <div key={d} className="cell cellHead">
                    <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
                      <span style={{fontWeight:800}}>{dowLabel(d)}</span>
                      <span className="small">{d}</span>
                    </div>
                  </div>
                ))}
              </div>

              {rows.map(({project, byDate}) => (
                <div key={project.id} className="excelRow">
                  <div className="cell leftHead">
                    <div style={{fontWeight:800}}>{project.name}</div>
                    <div className="small">{project.location_text ?? ''}</div>
                  </div>

                  {excelCols.map(d => {
                    const cellItems = (byDate[d] ?? [])
                    if (cellItems.length === 0) return <div key={d} className="cell cellBody" />
                    // show first item; if multiple, show stacked
                    return (
                      <div key={d} className="cell cellBody" style={{padding:8, display:'flex', flexDirection:'column', gap:8}}>
                        {cellItems.slice(0,2).map(it => {
                          const empNames = it.assignments.filter(a=>a.assignee_type==='EMPLOYEE').map(a=>a.assignee_name)
                          const sub = it.assignments.filter(a=>a.assignee_type==='SUBCON')
                          const {shown, more} = truncateNames(empNames, 3)
                          const bg = it.color_state === 'RED' ? 'bgRed' : it.color_state === 'YELLOW' ? 'bgYellow' : ''
                          return (
                            <div
                              key={it.id}
                              className={bg}
                              style={{border:'1px solid rgba(0,0,0,.08)', borderRadius:12, padding:8}}
                              onClick={() => openDrawer(it)}
                            >
                              <div style={{display:'flex', justifyContent:'space-between', gap:8, alignItems:'center'}}>
                                <div style={{fontWeight:800}}>{it.process_name}</div>
                                <div className="small">
                                  {it.quantity ?? ''}{it.unit ?? ''}
                                </div>
                              </div>
                              <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:6}}>
                                {it.is_night && <span className="nameChip">夜間</span>}
                                {it.color_state==='RED' && <span className="nameChip">不足</span>}
                                {it.is_subcontract_lump_sum && <span className="nameChip">請負</span>}
                              </div>
                              <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:6}}>
                                {shown.map(n => <span key={n} className="nameChip nameChipEmp">{n}</span>)}
                                {more>0 && <span className="nameChip">+{more}</span>}
                                {sub.map(s => {
                                  const tag = s.subcon_is_lump_sum ? `${s.assignee_name}(請負)` : `${s.assignee_name}${s.headcount?`(${s.headcount})`:''}`
                                  return <span key={s.id} className="nameChip nameChipSub">{tag}</span>
                                })}
                              </div>
                            </div>
                          )
                        })}
                        {cellItems.length > 2 && (
                          <div className="small" style={{paddingLeft:4}}>他 {cellItems.length-2} 件…</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Drawer */}
            <div className="drawer">
              <div className="card">
                <div style={{padding:14, borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:10}}>
                  <div style={{fontWeight:800}}>詳細パネル</div>
                  {selected && <button onClick={closeDrawer}>閉じる</button>}
                </div>
                {!selected ? (
                  <div style={{padding:14}} className="small">
                    セルをクリックすると詳細がここに出ます。<br/>
                    （項目は固定：日付/現場/工程/夜間/数量/配置/不足内訳/メモ/リンク）
                  </div>
                ) : (
                  <div style={{padding:14}}>
                    <div className="kv">
                      <label>日付</label><div style={{fontWeight:800}}>{selected.date}</div>
                      <label>現場</label><div style={{fontWeight:800}}>{selectedProject?.name ?? selected.project_id}</div>
                      <label>工程</label><div style={{fontWeight:800}}>{selected.process_name}</div>
                      <label>夜間</label><div>{selected.is_night ? 'ON（黄色）' : 'OFF'}</div>
                      <label>数量</label><div>{selected.quantity ?? ''}{selected.unit ?? ''}</div>
                      <label>外注</label><div>{selected.is_subcontract_lump_sum ? '請負（赤判定なし）' : '常用/なし'}</div>
                    </div>

                    <div className="sep" />

                    <div style={{fontWeight:800}}>配置</div>
                    <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
                      {selected.assignments.map(a => (
                        <div key={a.id} style={{display:'flex', justifyContent:'space-between', gap:8, alignItems:'center', border:'1px solid var(--line)', borderRadius:12, padding:10}}>
                          <div>
                            <div style={{fontWeight:800}}>
                              {a.assignee_type === 'EMPLOYEE' ? '社員' : '外注'}：{a.assignee_name}
                              {a.assignee_type==='SUBCON' && !a.subcon_is_lump_sum && a.headcount ? `（${a.headcount}）` : ''}
                              {a.assignee_type==='SUBCON' && a.subcon_is_lump_sum ? '（請負）' : ''}
                            </div>
                            <div className="small">ID: {a.id.slice(0,8)}</div>
                          </div>
                          <button onClick={() => delAssign(a.id)}>削除</button>
                        </div>
                      ))}
                      {selected.assignments.length === 0 && <div className="small">配置なし</div>}
                    </div>

                    <div className="rowBtns" style={{marginTop:12}}>
                      <button className="btnPrimary" onClick={addEmp}>社員を追加</button>
                      <button onClick={() => addSubcon(false)}>外注（常用）追加</button>
                      <button onClick={() => addSubcon(true)}>外注（請負）追加</button>
                    </div>

                    <div className="sep" />

                    <div style={{fontWeight:800}}>人材不足（赤）の内訳</div>
                    <div className="small" style={{marginTop:6}}>
                      必要人数：{selected.required_crew ?? '—'} / 社員配置数：{selected.assigned_employee_count}
                      {selected.color_state === 'RED' ? <span style={{marginLeft:8, fontWeight:800, color:'#b91c1c'}}>不足</span> : null}
                    </div>

                    <div className="sep" />

                    <div style={{fontWeight:800}}>メモ</div>
                    <div className="small" style={{marginTop:6}}>{selected.memo ?? '—'}</div>

                    <div className="sep" />
                    <div style={{fontWeight:800}}>関連リンク（v1は枠）</div>
                    <div className="small" style={{marginTop:6, lineHeight:1.8}}>
                      ・注文請書発行（外注）<br/>
                      ・日報一覧（当日/現場）<br/>
                      ・出来高（3D）<br/>
                      ・品質
                    </div>

                  </div>
                )}
              </div>

              <div style={{marginTop:14}} className="card">
                <div style={{padding:14, borderBottom:'1px solid var(--line)', fontWeight:800}}>未配置お知らせ（期間内）</div>
                <div style={{padding:14}} className="small">
                  {unassignedEmployees.length === 0 ? '未配置なし（この期間はOK）' : unassignedEmployees.map(n => `・${n}`).join('\n')}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
