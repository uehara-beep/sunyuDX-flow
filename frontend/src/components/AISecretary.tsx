import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AISecretary.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AISecretary: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'こんにちは！AI秘書です。経営に関するご質問やデータ分析のご依頼など、何でもお気軽にお聞きください。\n\n例えば：\n・今月の利益率はどうですか？\n・コスト削減のアドバイスをください\n・来月の売上予測を教えて',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    '今月の利益率は？',
    'コスト削減のアドバイス',
    '売上予測を教えて',
    '問題のある工事は？',
  ];

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('利益率') || lowerMessage.includes('利益')) {
      return '現在の月次利益率は20.2%で、前月比+2.1ポイントと好調です。\n\n【工事別利益率】\n・広島自動車道 烏帽子橋工事: 21.5%\n・国道2号線 舗装工事: 18.2% ⚠️\n・市道改良工事: 25.0%\n\n国道2号線の利益率が目標20%を下回っています。外注費の見直しを検討することをお勧めします。';
    }

    if (lowerMessage.includes('コスト') || lowerMessage.includes('削減')) {
      return 'コスト削減に向けた提案です：\n\n1. **外注費の最適化**\n   現在予算比91.7%で推移。協力会社との価格交渉余地あり\n\n2. **機械費の共有化**\n   複数現場での機械共有により稼働率向上が見込めます\n\n3. **材料の一括発注**\n   3現場分をまとめて発注することで約5%のコスト削減が可能です\n\n詳細な分析レポートを作成しましょうか？';
    }

    if (lowerMessage.includes('予測') || lowerMessage.includes('売上')) {
      return '来月の売上予測をお伝えします：\n\n**予測売上**: ¥7,200万\n**予測利益**: ¥1,550万\n**予測利益率**: 21.5%\n\n【根拠】\n・広島自動車道工事の出来高が上昇予定\n・新規受注案件の着工開始\n・季節要因による稼働日数増加\n\nこの予測は過去6ヶ月のトレンドと受注状況を基にしています。';
    }

    if (lowerMessage.includes('問題') || lowerMessage.includes('アラート') || lowerMessage.includes('工事')) {
      return '注意が必要な工事をお知らせします：\n\n⚠️ **国道2号線 舗装工事**\n・利益率: 18.2%（目標20%未達）\n・原因: 外注費が予算を8%超過\n・対策案: 協力会社との再交渉\n\n📅 **県道改良工事**\n・請求書の期限超過あり\n・金額: ¥850万\n・対応: 本日中の確認推奨\n\n他にも詳しく知りたい項目はありますか？';
    }

    return 'ご質問ありがとうございます。\n\n現在、以下の情報にアクセスできます：\n・工事別の利益率・コスト分析\n・月次推移データ\n・請求書・入金状況\n・アラート情報\n\nもう少し具体的にお聞きいただければ、詳細な分析結果をお伝えできます。';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="page-container management">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/management')}>
          ← 経営部屋へ
        </button>
        <h1 className="page-title">AI秘書</h1>
        <p className="page-subtitle">経営データに基づくAIアシスタント</p>
      </header>

      <main className="page-content chat-layout">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    {message.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="quick-questions">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  className="quick-button"
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="input-row">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                rows={1}
              />
              <button
                className="send-button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                送信
              </button>
            </div>
          </div>
        </div>

        <aside className="chat-sidebar">
          <div className="sidebar-section">
            <h3>データソース</h3>
            <div className="data-sources">
              <div className="source-item active">
                <span className="source-icon">📊</span>
                <span>経営ダッシュボード</span>
              </div>
              <div className="source-item active">
                <span className="source-icon">📑</span>
                <span>請求書データ</span>
              </div>
              <div className="source-item active">
                <span className="source-icon">🏗️</span>
                <span>工事台帳</span>
              </div>
              <div className="source-item">
                <span className="source-icon">📅</span>
                <span>勤怠データ</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>最近の分析</h3>
            <div className="recent-analyses">
              <div className="analysis-item">
                <span className="analysis-title">月次利益分析</span>
                <span className="analysis-date">本日 10:30</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-title">コスト超過アラート</span>
                <span className="analysis-date">昨日 15:45</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-title">売上予測レポート</span>
                <span className="analysis-date">1/9 09:00</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default AISecretary;
