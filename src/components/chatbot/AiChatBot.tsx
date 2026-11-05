import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useScholarship } from '../../context/ScholarshipContext';
import { ChatbotKnowledge, generateChatbotReply } from '../../services/chatbotService';

interface ChatMessageEntry {
  id: string;
  role: 'bot' | 'user';
  text: string;
  suggestions: string[];
}

const makeMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const AiChatBot: React.FC = () => {
  const {
    isChatbotOpen,
    openChatbot,
    closeChatbot,
    scholarships,
    faqs,
    downloads,
    siteSettings,
    currentUser
  } = useScholarship();

  const knowledge: ChatbotKnowledge = {
    scholarships,
    faqs,
    downloads,
    settings: siteSettings,
    userName: currentUser?.name?.split(' ')[0] ?? null
  };

  const knowledgeRef = useRef<ChatbotKnowledge>(knowledge);
  knowledgeRef.current = knowledge;

  const [messages, setMessages] = useState<ChatMessageEntry[]>(() => {
    const welcome = generateChatbotReply('สวัสดี', knowledge);
    return [{ id: makeMessageId(), role: 'bot', text: welcome.text, suggestions: welcome.suggestions }];
  });
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const replyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isChatbotOpen) return;
    const area = scrollAreaRef.current;
    if (area) area.scrollTop = area.scrollHeight;
    inputRef.current?.focus();
  }, [isChatbotOpen, messages, isTyping]);

  useEffect(
    () => () => {
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    },
    []
  );

  const askQuestion = (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || isTyping) return;

    setMessages(prev => [...prev, { id: makeMessageId(), role: 'user', text: question, suggestions: [] }]);
    setDraft('');
    setIsTyping(true);

    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    replyTimerRef.current = window.setTimeout(() => {
      const reply = generateChatbotReply(question, knowledgeRef.current);
      setMessages(prev => [
        ...prev,
        { id: makeMessageId(), role: 'bot', text: reply.text, suggestions: reply.suggestions }
      ]);
      setIsTyping(false);
    }, 550);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    askQuestion(draft);
  };

  const lastMessage = messages[messages.length - 1];
  const quickReplies = !isTyping && lastMessage?.role === 'bot' ? lastMessage.suggestions : [];

  return (
    <>
      {isChatbotOpen && (
        <div className="ai-chat-panel" role="dialog" aria-label="ผู้ช่วย AI ทุนการศึกษา">
          <div className="ai-chat-header">
            <div className="ai-chat-avatar">
              <Bot size={18} />
            </div>
            <div className="ai-chat-heading">
              <div className="ai-chat-title">ผู้ช่วย AI ทุนการศึกษา</div>
              <div className="ai-chat-status">
                <span className="ai-chat-status-dot" />
                ออนไลน์ ตอบจากข้อมูลบนเว็บไซต์
              </div>
            </div>
            <button type="button" className="ai-chat-close" onClick={closeChatbot} aria-label="ปิดหน้าต่างแชท">
              <X size={18} />
            </button>
          </div>

          <div className="ai-chat-body" ref={scrollAreaRef} role="log" aria-live="polite">
            {messages.map(message => (
              <div key={message.id} className={`ai-chat-row ${message.role}`}>
                {message.role === 'bot' && (
                  <div className="ai-chat-bubble-avatar">
                    <Sparkles size={13} />
                  </div>
                )}
                <div className={`ai-chat-bubble ${message.role}`}>{message.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-chat-row bot">
                <div className="ai-chat-bubble-avatar">
                  <Sparkles size={13} />
                </div>
                <div className="ai-chat-bubble bot ai-chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {quickReplies.length > 0 && (
            <div className="ai-chat-quick-replies">
              {quickReplies.map(reply => (
                <button
                  key={reply}
                  type="button"
                  className="ai-chat-chip"
                  onClick={() => askQuestion(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form className="ai-chat-inputbar" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="พิมพ์คำถามเกี่ยวกับทุนการศึกษา…"
              aria-label="พิมพ์คำถาม"
            />
            <button type="submit" disabled={!draft.trim() || isTyping} aria-label="ส่งคำถาม">
              <Send size={16} />
            </button>
          </form>

          <div className="ai-chat-disclaimer">
            คำตอบสร้างจากข้อมูลทุน เอกสาร และประกาศบนเว็บไซต์ — โปรดตรวจสอบกับเจ้าหน้าที่อีกครั้งก่อนยื่นสมัคร
          </div>
        </div>
      )}

      <button
        type="button"
        className={`ai-chat-launcher ${isChatbotOpen ? 'open' : ''}`}
        onClick={() => (isChatbotOpen ? closeChatbot() : openChatbot())}
        aria-label={isChatbotOpen ? 'ปิดผู้ช่วย AI' : 'เปิดผู้ช่วย AI ทุนการศึกษา'}
      >
        {isChatbotOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isChatbotOpen && <span className="ai-chat-launcher-label">ถาม AI</span>}
      </button>
    </>
  );
};
