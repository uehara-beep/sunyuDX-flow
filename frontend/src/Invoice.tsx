
import React, { useState } from 'react'

export default function Invoice() {
  const [file, setFile] = useState<File|null>(null)
  const [msg, setMsg] = useState('')

  const upload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('http://localhost:8001/api/invoices/upload', { method:'POST', body: fd })
    const j = await r.json()
    setMsg('OCR失敗 → 逃げ道入力へ: ' + j.invoice_id)
  }

  return (
    <div className="card" style={{padding:14}}>
      <h3>請求書OCR（逃げ道あり）</h3>
      <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
      <button onClick={upload}>アップロード</button>
      <div>{msg}</div>
    </div>
  )
}
