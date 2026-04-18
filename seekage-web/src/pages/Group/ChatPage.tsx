import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function ChatPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, chat, addChat } = useData();
  const t = T[lang];
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const group = groups.find((g) => g.groupId === decoded);
  const isSchool = group?.portal === 'school';

  const msgs = chat.filter((m) => m.subjectId === subjectId);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length]);

  function send() {
    if (!text.trim()) return;
    addChat({
      id: Date.now(),
      subjectId,
      text: text.trim(),
      senderId: user?.id || 0,
      senderName: user?.name || 'You',
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    });
    setText('');
  }

  return (
    <div className={`chat-page ${isSchool ? 'green' : ''}`}>
      <div className="chat-list" ref={listRef}>
        {msgs.length === 0 && <div className="empty">Say hi to your class.</div>}
        {msgs.map((m) => {
          const isMe = m.senderId === user?.id;
          return (
            <div key={m.id} className={`msg-row ${isMe ? 'me' : ''}`}>
              {!isMe && <div className="sender-name">{m.senderName}</div>}
              <div className={`bubble ${isMe ? (isSchool ? 'bubble-me green-me' : 'bubble-me') : 'bubble-them'}`}>
                <div>{m.text}</div>
                <div className="bubble-time">{m.time}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="input-bar">
        <input className="input" placeholder={t.typeMessage}
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className={`send-btn ${isSchool ? 'green' : ''}`} onClick={send}>➤</button>
      </div>
    </div>
  );
}
