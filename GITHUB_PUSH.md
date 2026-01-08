# GitHub への push 手順（このプロジェクト用）

## 1) Git 初期化（まだなら）
```bash
cd sunyuDX-flow
git init
git add .
git commit -m "init: sunyuDX-flow v1"
```

## 2) GitHub に新規リポジトリ作成
- GitHubで `sunyuDX-flow` を作る（空でOK / README不要）

## 3) リモート追加＆push
```bash
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## DBについて
- ローカル動作確認用に `sunyuDX.db` を同梱しています。
- GitHubにDBを置きたくない場合は `.gitignore` に `sunyuDX.db` を追加してください。

```gitignore
sunyuDX.db
backend/sunyuDX.db
*.db
```
