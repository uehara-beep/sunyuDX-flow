
import React, { useState } from 'react'
import { jpost } from './api'

export default function Estimate() {
  const [file, setFile] = useState<File|null>(null)
  const [msg, setMsg] = useState('')

  const upload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('http://localhost:8000/api/estimates/import/excel', { method:'POST', body: fd })
    const j = await r.json()
    setMsg('取込完了: ' + j.estimate_id)
  }

  return (
    <div className="card" style={{padding:14}}>
      <h3>見積 → 予算明細</h3>
      <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
      <button onClick={upload}>取込</button>
      <div>{msg}</div>
    </div>
  )
}
