import React, { useState, useCallback } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  "http://127.0.0.1:8000";

interface EstimateItem {
  item_no: number;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  remarks: string;
}

interface ParsedEstimateData {
  project_name: string;
  client_name: string;
  estimate_date: string;
  items: EstimateItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface GenerateResponse {
  estimate_number: string;
  budget_number: string;
  invoice_number: string;
  files: {
    estimate_excel: string;
    estimate_pdf: string;
    budget_excel: string;
    invoice_excel: string;
    invoice_pdf: string;
  };
}

export default function EstimateUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedEstimateData | null>(null);
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setParsedData(null);
    setGenerateResult(null);
    setError("");
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    setParsedData(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(API_BASE + "/api/estimate/upload", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(errText);
      }
      const data = (await r.json()) as ParsedEstimateData;
      setParsedData(data);
    } catch (e: any) {
      setError(e?.message || "アップロードに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setError("");
    setGenerating(true);
    setGenerateResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(API_BASE + "/api/estimate/generate", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(errText);
      }
      const data = (await r.json()) as GenerateResponse;
      setGenerateResult(data);
    } catch (e: any) {
      setError(e?.message || "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }, [file]);

  const downloadFile = (path: string) => {
    window.open(API_BASE + "/api/estimate/download/" + encodeURIComponent(path), "_blank");
  };

  const downloadBtnStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "8px 0 16px", fontWeight: 800 }}>見積アップロード</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: loading ? "#eee" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "解析中..." : "解析"}
        </button>
        <button
          onClick={handleGenerate}
          disabled={!file || generating}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: generating ? "#94a3b8" : "#3b82f6",
            color: "#fff",
            cursor: generating ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {generating ? "生成中..." : "見積・予算・請求 生成"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {parsedData && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>解析結果</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", marginBottom: 16 }}>
            <span style={{ color: "#6b7280" }}>案件名:</span>
            <span style={{ fontWeight: 600 }}>{parsedData.project_name || "-"}</span>
            <span style={{ color: "#6b7280" }}>得意先:</span>
            <span style={{ fontWeight: 600 }}>{parsedData.client_name || "-"}</span>
            <span style={{ color: "#6b7280" }}>見積日:</span>
            <span>{parsedData.estimate_date || "-"}</span>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <span style={{ color: "#6b7280", fontSize: 12 }}>小計</span>
              <div style={{ fontWeight: 700, fontSize: 18 }}>¥{(parsedData.subtotal || 0).toLocaleString()}</div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: 12 }}>消費税</span>
              <div style={{ fontWeight: 700, fontSize: 18 }}>¥{(parsedData.tax || 0).toLocaleString()}</div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontSize: 12 }}>合計</span>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#2563eb" }}>¥{(parsedData.total || 0).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["No", "項目", "仕様", "数量", "単位", "単価", "金額", "備考"].map((h) => (
                    <th key={h} style={{ padding: "10px 8px", textAlign: "left", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(parsedData.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>{item.item_no}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>{item.name}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", fontSize: 12, color: "#6b7280" }}>{item.specification}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>{item.quantity?.toLocaleString()}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6" }}>{item.unit}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>¥{item.unit_price?.toLocaleString()}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", textAlign: "right", fontWeight: 600 }}>¥{item.amount?.toLocaleString()}</td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", fontSize: 12, color: "#6b7280" }}>{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {generateResult && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#166534" }}>生成完了</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", marginBottom: 16 }}>
            <span style={{ color: "#6b7280" }}>見積番号:</span>
            <span style={{ fontWeight: 600 }}>{generateResult.estimate_number}</span>
            <span style={{ color: "#6b7280" }}>予算番号:</span>
            <span style={{ fontWeight: 600 }}>{generateResult.budget_number}</span>
            <span style={{ color: "#6b7280" }}>請求番号:</span>
            <span style={{ fontWeight: 600 }}>{generateResult.invoice_number}</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {generateResult.files?.estimate_excel && (
              <button onClick={() => downloadFile(generateResult.files.estimate_excel)} style={downloadBtnStyle}>
                見積Excel
              </button>
            )}
            {generateResult.files?.estimate_pdf && (
              <button onClick={() => downloadFile(generateResult.files.estimate_pdf)} style={downloadBtnStyle}>
                見積PDF
              </button>
            )}
            {generateResult.files?.budget_excel && (
              <button onClick={() => downloadFile(generateResult.files.budget_excel)} style={downloadBtnStyle}>
                予算Excel
              </button>
            )}
            {generateResult.files?.invoice_excel && (
              <button onClick={() => downloadFile(generateResult.files.invoice_excel)} style={downloadBtnStyle}>
                請求Excel
              </button>
            )}
            {generateResult.files?.invoice_pdf && (
              <button onClick={() => downloadFile(generateResult.files.invoice_pdf)} style={downloadBtnStyle}>
                請求PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
