// Viteプロキシ使用時は空文字（相対パス）、直接接続時はURL指定
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// エラーメッセージをユーザーフレンドリーに変換
function formatError(error: unknown, url: string): Error {
  if (error instanceof TypeError && String(error).includes('Failed to fetch')) {
    console.error('API Connection Error:', error, 'URL:', url);
    return new Error(
      'サーバーに接続できません。\n' +
      '・バックエンド(localhost:8000)が起動しているか確認\n' +
      '・ネットワーク接続を確認'
    );
  }
  if (error instanceof Error) {
    // CORS error
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return new Error('CORSエラー: バックエンドの設定を確認してください');
    }
    return error;
  }
  return new Error(String(error));
}

async function ok(r: Response, url: string) {
  if (!r.ok) {
    const text = await r.text();
    console.error('API Error:', r.status, text, 'URL:', url);
    // 短いエラーメッセージに変換
    if (text.length > 200) {
      if (text.includes('does not exist') || text.includes('relation')) {
        throw new Error('DBテーブルが未作成です。管理者に連絡してください。');
      }
      throw new Error(`サーバーエラー (${r.status})`);
    }
    throw new Error(text || `HTTPエラー: ${r.status}`);
  }
  return r;
}

export async function jget<T>(p: string): Promise<T> {
  const url = API_BASE + p;
  try {
    const r = await ok(await fetch(url), url);
    return r.json();
  } catch (e) {
    throw formatError(e, url);
  }
}

export async function jpost<T>(p: string, b?: any): Promise<T> {
  const url = API_BASE + p;
  try {
    const r = await ok(await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: b ? JSON.stringify(b) : undefined
    }), url);
    return r.json();
  } catch (e) {
    throw formatError(e, url);
  }
}

export async function jdel<T>(p: string): Promise<T> {
  const url = API_BASE + p;
  try {
    const r = await ok(await fetch(url, { method: "DELETE" }), url);
    return r.json();
  } catch (e) {
    throw formatError(e, url);
  }
}

export async function jpatch<T>(p: string, b?: any): Promise<T> {
  const url = API_BASE + p;
  try {
    const r = await ok(await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: b ? JSON.stringify(b) : undefined
    }), url);
    return r.json();
  } catch (e) {
    throw formatError(e, url);
  }
}

export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  return jget('/health');
}
