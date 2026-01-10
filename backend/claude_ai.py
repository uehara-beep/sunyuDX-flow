"""
Claude API統合モジュール
AI自動分類・提案機能
"""

import os
from typing import List, Dict, Any
from anthropic import Anthropic

# Claude API クライアント
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

def classify_cost_item_ai(item_name: str, amount: float) -> Dict[str, Any]:
    """
    AIで原価項目を5科目に自動分類
    
    Args:
        item_name: 項目名
        amount: 金額
    
    Returns:
        {
            'category': 'material' | 'labor' | 'equipment' | 'subcontract' | 'expense',
            'confidence': 0.0-1.0,
            'reason': '分類理由'
        }
    """
    if not os.getenv("ANTHROPIC_API_KEY"):
        # APIキーがない場合はキーワードベース
        return classify_cost_item_keyword(item_name)
    
    try:
        prompt = f"""
建設業の原価項目を以下の5科目に分類してください。

項目名: {item_name}
金額: ¥{amount:,}

5科目:
- material (材料費): 資材、材料など
- labor (労務費): 人工、作業員など
- equipment (機械費): 重機、機械リースなど
- subcontract (外注費): 下請業者、外注など
- expense (経費): その他の経費

JSON形式で回答してください:
{{
    "category": "material",
    "confidence": 0.95,
    "reason": "コンクリートなので材料費"
}}
"""
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        import json
        result_text = response.content[0].text
        # JSONを抽出（```json ``` を除去）
        result_text = result_text.replace('```json', '').replace('```', '').strip()
        result = json.loads(result_text)
        
        return result
        
    except Exception as e:
        print(f"Claude API エラー: {e}")
        # フォールバック: キーワードベース
        return classify_cost_item_keyword(item_name)

def classify_cost_item_keyword(item_name: str) -> Dict[str, Any]:
    """キーワードベースの分類（フォールバック）"""
    item_lower = item_name.lower()
    
    if any(word in item_lower for word in ['材料', '資材', '管', 'パイプ', 'コンクリート', '鋼材', 'セメント']):
        return {'category': 'material', 'confidence': 0.7, 'reason': 'キーワードマッチ'}
    elif any(word in item_lower for word in ['労務', '人工', '作業員', '技術者', '施工員']):
        return {'category': 'labor', 'confidence': 0.7, 'reason': 'キーワードマッチ'}
    elif any(word in item_lower for word in ['機械', '重機', 'リース', 'クレーン', 'バックホウ']):
        return {'category': 'equipment', 'confidence': 0.7, 'reason': 'キーワードマッチ'}
    elif any(word in item_lower for word in ['外注', '下請', '業者', '委託']):
        return {'category': 'subcontract', 'confidence': 0.7, 'reason': 'キーワードマッチ'}
    else:
        return {'category': 'expense', 'confidence': 0.5, 'reason': 'デフォルト'}

def suggest_budget_improvements_ai(budget_data: Dict[str, Any], historical_data: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    AIで実行予算の改善提案を生成
    
    Args:
        budget_data: 現在の実行予算データ
        historical_data: 過去の類似工事データ
    
    Returns:
        提案リスト
    """
    if not os.getenv("ANTHROPIC_API_KEY"):
        return generate_basic_suggestions(budget_data)
    
    try:
        # 過去データのサマリー
        past_summary = ""
        if historical_data:
            avg_material = sum(p.get('material_ratio', 0) for p in historical_data) / len(historical_data)
            avg_labor = sum(p.get('labor_ratio', 0) for p in historical_data) / len(historical_data)
            past_summary = f"過去の類似工事（{len(historical_data)}件）:\n材料費比率: {avg_material:.1%}\n労務費比率: {avg_labor:.1%}"
        
        # 現在の比率計算
        total = budget_data.get('budget_total', 1)
        material_ratio = budget_data.get('material', {}).get('total', 0) / total
        labor_ratio = budget_data.get('labor', {}).get('total', 0) / total
        
        prompt = f"""
建設業の実行予算を分析して、改善提案を3つ生成してください。

【現在の実行予算】
工事名: {budget_data.get('project_name', '')}
予算合計: ¥{total:,}
材料費: {material_ratio:.1%}
労務費: {labor_ratio:.1%}

【過去データ】
{past_summary if past_summary else '過去データなし'}

JSON配列で回答してください:
[
    {{"title": "提案タイトル", "description": "詳細説明", "impact": "期待される効果"}},
    ...
]
"""
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        import json
        result_text = response.content[0].text
        result_text = result_text.replace('```json', '').replace('```', '').strip()
        suggestions = json.loads(result_text)
        
        return suggestions
        
    except Exception as e:
        print(f"Claude API エラー: {e}")
        return generate_basic_suggestions(budget_data)

def generate_basic_suggestions(budget_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """基本的な提案を生成（フォールバック）"""
    total = budget_data.get('budget_total', 1)
    material_ratio = budget_data.get('material', {}).get('total', 0) / total
    labor_ratio = budget_data.get('labor', {}).get('total', 0) / total
    
    suggestions = []
    
    if material_ratio > 0.4:
        suggestions.append({
            'title': '材料費の見直し',
            'description': f'材料費が{material_ratio:.1%}を占めています。一括発注や代替材料の検討で10-15%削減できる可能性があります。',
            'impact': '予算削減: ¥{:,.0f}'.format(budget_data.get('material', {}).get('total', 0) * 0.1)
        })
    
    if labor_ratio > 0.3:
        suggestions.append({
            'title': '労務費の最適化',
            'description': f'労務費が{labor_ratio:.1%}を占めています。工程の見直しで効率化できる可能性があります。',
            'impact': '工期短縮: 5-10%'
        })
    
    suggestions.append({
        'title': '機械の効率的配置',
        'description': '重機の稼働率を上げることで、機械費を削減できます。',
        'impact': '機械費削減: 5-8%'
    })
    
    return suggestions

def analyze_project_risk_ai(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    AIでプロジェクトのリスク分析
    
    Args:
        project_data: プロジェクトデータ
    
    Returns:
        リスク分析結果
    """
    if not os.getenv("ANTHROPIC_API_KEY"):
        return analyze_project_risk_basic(project_data)
    
    try:
        prompt = f"""
建設プロジェクトのリスクを分析してください。

【プロジェクト情報】
工事名: {project_data.get('name', '')}
契約金額: ¥{project_data.get('contract_amount', 0):,}
実行予算: ¥{project_data.get('budget_amount', 0):,}
実績原価: ¥{project_data.get('actual_cost', 0):,}
粗利率: {project_data.get('profit_rate', 0):.1%}
進捗: {project_data.get('progress', 0):.0%}

JSON形式で回答してください:
{{
    "risk_level": "low" | "medium" | "high",
    "risks": [
        {{"type": "リスク種別", "description": "詳細", "severity": "影響度"}}
    ],
    "recommendations": ["対策1", "対策2", ...]
}}
"""
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        import json
        result_text = response.content[0].text
        result_text = result_text.replace('```json', '').replace('```', '').strip()
        result = json.loads(result_text)
        
        return result
        
    except Exception as e:
        print(f"Claude API エラー: {e}")
        return analyze_project_risk_basic(project_data)

def analyze_project_risk_basic(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """基本的なリスク分析（フォールバック）"""
    profit_rate = project_data.get('profit_rate', 0)
    progress = project_data.get('progress', 0)
    
    if profit_rate < 0.05:
        risk_level = "high"
        risks = [
            {'type': '赤字リスク', 'description': '粗利率が5%未満です', 'severity': '高'}
        ]
        recommendations = ['原価削減の緊急対策', '追加契約の交渉']
    elif profit_rate < 0.1:
        risk_level = "medium"
        risks = [
            {'type': '低収益', 'description': '粗利率が10%未満です', 'severity': '中'}
        ]
        recommendations = ['原価管理の徹底', '進捗管理の強化']
    else:
        risk_level = "low"
        risks = []
        recommendations = ['現在の管理体制を継続']
    
    return {
        'risk_level': risk_level,
        'risks': risks,
        'recommendations': recommendations
    }
