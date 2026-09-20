import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import JoblexApiClient from '../../services/api';

export default function ZuluChat() {
  const { user } = useAuth();
  const userId = user?.email || user?.id || 'usr-student-01';

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const endOfMessagesRef = useRef(null);

  // Load student chat sessions on component mount or user change
  useEffect(() => {
    loadStudentSessions();
  }, [userId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadStudentSessions = async () => {
    try {
      const res = await JoblexApiClient.getZuluSessions(userId);
      let sessionList = res.sessions || [];
      
      if (sessionList.length === 0) {
        const newRes = await JoblexApiClient.createZuluSession(userId, 'New Conversation');
        if (newRes && newRes.session) {
          sessionList = [newRes.session];
        }
      }

      setSessions(sessionList);
      if (sessionList.length > 0) {
        await switchSession(sessionList[0].id);
      }
    } catch (err) {
      console.error('[Zulu React Load Error]:', err);
    }
  };

  const switchSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    try {
      const res = await JoblexApiClient.getZuluMessages(sessionId, userId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('[Zulu React Messages Fetch Error]:', err);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await JoblexApiClient.createZuluSession(userId, 'New Conversation');
      if (res && res.session) {
        setSessions(prev => [res.session, ...prev]);
        await switchSession(res.session.id);
      }
    } catch (err) {
      console.error('[Zulu React Create Session Error]:', err);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();

    try {
      await JoblexApiClient.deleteZuluSession(sessionId, userId);
      if (window.showToast) window.showToast('Chat thread deleted', 'Zulu AI', 'info');
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);

      if (updatedSessions.length === 0) {
        await handleCreateNewSession();
      } else {
        await switchSession(updatedSessions[0].id);
      }
    } catch (err) {
      console.error('[Zulu React Delete Session Error]:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setIsTyping(true);

    // Optimistically add user message to state
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      message: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newRes = await JoblexApiClient.createZuluSession(userId, userText.substring(0, 30));
      if (newRes && newRes.session) {
        activeSessionId = newRes.session.id;
        setCurrentSessionId(activeSessionId);
        setSessions(prev => [newRes.session, ...prev]);
      }
    }

    const studentContext = {
      studentName: user?.name || 'Student Scholar',
      institution: user?.institution || 'Academic University / Institute',
      department: user?.department || 'Higher Education & Technology',
      xp: user?.xp || 1450,
      streak: user?.streak || 7,
      targetRole: 'Technology & Research Professional'
    };

    try {
      const res = await JoblexApiClient.askZulu(userText, studentContext, activeSessionId, userId);
      const replyText = (res && res.reply)
        ? res.reply
        : `Based on current industry demand from Dabur and Himalaya, mastering Phytochemistry alongside Python data analytics will position you in the top 5% of applicants. Check your Career Roadmap to start the next module!`;

      const zuluMsg = {
        id: `msg-${Date.now()}`,
        sender: 'zulu',
        message: replyText,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, zuluMsg]);

      // Update session title in session list if it was default
      setSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId && (s.title === 'New Conversation' || s.title === 'Zulu AI')) {
          return { ...s, title: userText.length > 30 ? userText.substring(0, 30) + '...' : userText };
        }
        return s;
      }));
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'zulu',
        message: "I am processing your inquiry. Make sure to check the AI Resume Analyzer to identify missing competencies for your target role!",
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "What are high-demand competencies for Dabur R&D?",
    "How to prevent skill decay freeze from expiring?",
    "Which MoUs are active between colleges and pharma?",
    "Explain HPTLC fingerprinting standards under API"
  ];

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="relative flex flex-col max-w-4xl mx-auto h-[540px] sm:h-[640px] bg-gray-900/80 rounded-3xl border border-purple-500/30 backdrop-blur-xl overflow-hidden shadow-2xl w-full">
      {/* Top Header Bar */}
      <div className="bg-gray-950/90 px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-500/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-[0_0_12px_#a855f7] relative">
            ✨
            <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-gray-900 rounded-full animate-ping"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[320px]">
              {currentSession?.title || 'Zulu AI Counselor'}
            </h3>
            <p className="text-[10px] sm:text-xs text-purple-300/80">
              Student ID: <span className="font-mono text-cyan-300">{userId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-purple-500/30 text-purple-200 font-bold text-xs transition flex items-center gap-1.5"
            title="View Chat History"
          >
            <span>📜</span>
            <span className="hidden sm:inline">History ({sessions.length})</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleCreateNewSession}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1"
            title="Start New Conversation"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-10 sm:py-16 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-3xl text-white mx-auto shadow-xl">
              ✨
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Namaste, <span className="text-purple-300">{user?.name || 'Scholar'}</span> 🌿
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              I am **Zulu**, your specialized AI Career & Research Counselor. Ask any question to start this private chat thread!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-gray-900/90 border border-purple-500/30 text-gray-100 rounded-bl-none shadow-sm space-y-1'
              }`}>
                {msg.message}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-900/90 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm">
              <span className="text-xs text-purple-300 mr-1.5">Zulu is thinking...</span>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 sm:px-6 py-2 bg-black/40 border-t border-gray-800/80 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
        {quickPrompts.map((q, i) => (
          <button
            key={i}
            onClick={() => { setInput(q); }}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-[11px] border border-gray-700 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-gray-950/90 border-t border-purple-500/20 flex gap-2 sm:gap-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Zulu about skills, Dabur internships, electives..."
          className="flex-1 bg-gray-900 border border-purple-500/30 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition disabled:opacity-40 shrink-0 shadow-md"
        >
          Send ➔
        </button>
      </form>

      {/* Slide-over Chat History Drawer */}
      {showHistoryDrawer && (
        <div 
          className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex justify-end transition-all animate-fade-in"
          onClick={() => setShowHistoryDrawer(false)}
        >
          <div 
            className="w-80 h-full bg-[#080814] border-l border-purple-500/30 p-4 flex flex-col justify-between shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs uppercase font-extrabold text-purple-400 tracking-wider flex items-center gap-1.5">
                  <span>📜</span> <span>Saved Conversations</span>
                </span>
                <button 
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Student: {user?.name || 'Ashay'}</span>
                <button
                  onClick={() => { handleCreateNewSession(); setShowHistoryDrawer(false); }}
                  className="text-xs text-purple-400 font-bold hover:underline"
                >
                  + New Chat
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {sessions.map(s => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => { switchSession(s.id); setShowHistoryDrawer(false); }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? 'bg-purple-950/60 border-purple-500/60 text-purple-100 shadow-sm'
                          : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs shrink-0">{isActive ? '💬' : '📜'}</span>
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="text-xs font-bold truncate max-w-[150px]">{s.title || 'Zulu AI'}</span>
                          <span className="text-[9px] opacity-70 font-mono">
                            {s.updated_at ? new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Delete thread"
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>Syncing with Supabase DB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
