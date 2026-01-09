import React, { useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001";

type BudgetRow = {
  row_no: number;
  name: string;
  category: "労務" | "外注" | "材料" | "機械" | "経費" | string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  vendor?: string | null;
  note?: string | null;
};

type ImportResult = {
  source_filename: string;
  rows: BudgetRow[];
  summary: Record<string, number>;
};

export default function Estimate() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [err, setErr] = useState<string>("");

  const totals = useMemo(() => {
    if (!result) return null;
    return result.summary || {};
  }, [result]);

  const onImport = async () => {
    if (!file) return;
    setErr("");
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(`${API_BASE}/api/estimate/import`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as ImportResult;
      setResult(data);
    } catch (e: any) {
      setErr(e?.message || "取込に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "8px 0 12px" }}>見積 → 予算明細</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={onImport}
          disabled={!file || loading}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: loading ? "#eee" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "取込中..." : "取込"}
        </button>
      </div>

      {err && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 10,
            background: "#f8d7da",
            color: "#842029",
            border: "1px solid #f5c2c7",
            whiteSpace: "pre-wrap",
          }}
        >
          {err}
        </div>
      )}

      {result && (
        <>
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #eee",
            }}
          >
            <div style={{ fontSize: 12, color: "#666" }}>取込元</div>
            <div style={{ fontWeight: 700 }}>{result.source_filename}</div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
              {["労務", "外注", "材料", "機械", "経費"].map((k) => (
                <div key={k} style={{ fontSize: 13 }}>
                  <span style={{ color: "#666" }}>{k}：</span>{" "}
                  <b>¥{Math.round(totals?.[k] || 0).toLocaleString()}</b>
                </div>
              ))}
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "#666" }}>合計：</span>{" "}
                <b>¥{Math.round(totals?.["grand_total"] || 0).toLocaleString()}</b>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f3f0" }}>
                  {["No", "区分", "項目", "数量", "単位", "単価", "金額", "業者", "備考"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        fontSize: 12,
                        borderBottom: "1px solid #eee",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.row_no}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {r.row_no}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {r.category}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1" }}>
                      {r.name}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {Number(r.quantity || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {r.unit || ""}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      ¥{Math.round(r.unit_price || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      ¥{Math.round(r.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {r.vendor || ""}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f1f1", fontSize: 12 }}>
                      {r.note || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
