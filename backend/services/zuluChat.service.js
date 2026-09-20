const { supabase, isConfigured } = require('../config/supabase');
const { randomUUID } = require('crypto');

function generateUuid() {
  try {
    return randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

function isValidUuid(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// Fallback in-memory chat store mapped by userId
const defaultSessId = generateUuid();
const memorySessions = [
  {
    id: defaultSessId,
    user_id: 'usr-student-01',
    title: 'Dabur R&D Competencies',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const memoryMessages = {
  [defaultSessId]: [
    {
      id: generateUuid(),
      session_id: defaultSessId,
      user_id: 'usr-student-01',
      sender: 'zulu',
      message: 'Namaste, I am **Zulu**, your specialized Ayush Career & Research Counselor. How can I assist your career roadmap today?',
      provider: 'zulu-ai-engine',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: generateUuid(),
      session_id: defaultSessId,
      user_id: 'usr-student-01',
      sender: 'user',
      message: 'What are high-demand competencies for Dabur R&D?',
      provider: null,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: generateUuid(),
      session_id: defaultSessId,
      user_id: 'usr-student-01',
      sender: 'zulu',
      message: '**Key Competencies for Dabur R&D Roles**:\n\n• **Analytical Standardization**: High-Performance Thin-Layer Chromatography (HPTLC) fingerprinting and HPLC quantification.\n• **Regulatory Compliance**: Good Laboratory Practice (GLP) and Ayurvedic Pharmacopoeia of India (API) standards.\n• **In-Silico Drug Discovery**: Molecular docking using AutoDock and Python phytochemical analytics.\n• **Formulation Stability**: Accelerated thermal and humidity stability testing for botanical extracts.',
      provider: 'zulu-ai-engine',
      created_at: new Date(Date.now() - 3590000).toISOString()
    }
  ]
};

/**
 * Fetch all sessions for a specific user
 */
async function getUserSessions(userId = 'usr-student-01') {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('zulu_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('[ZuluChatService] Supabase session fetch fallback:', e.message);
    }
  }

  // Filter in-memory sessions strictly by userId
  let userSessions = memorySessions.filter(s => s.user_id === userId);
  
  // Auto-seed initial welcome session if user has no sessions yet
  if (userSessions.length === 0) {
    const newSessId = generateUuid();
    const defaultSess = {
      id: newSessId,
      user_id: userId,
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memorySessions.unshift(defaultSess);
    memoryMessages[newSessId] = [
      {
        id: generateUuid(),
        session_id: newSessId,
        user_id: userId,
        sender: 'zulu',
        message: 'Namaste, I am **Zulu**, your specialized Ayush Career & Research Counselor. How can I assist your career roadmap today?',
        provider: 'zulu-ai-engine',
        created_at: new Date().toISOString()
      }
    ];
    return [defaultSess];
  }

  return userSessions;
}

/**
 * Create a new chat session for a specific user
 */
async function createSession(userId = 'usr-student-01', initialTitle = 'New Conversation') {
  const newId = generateUuid();
  const now = new Date().toISOString();

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('zulu_chat_sessions')
        .insert([{ id: newId, user_id: userId, title: initialTitle }])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('[ZuluChatService] Supabase session insert fallback:', e.message);
    }
  }

  const memSession = {
    id: newId,
    user_id: userId,
    title: initialTitle,
    created_at: now,
    updated_at: now
  };
  memorySessions.unshift(memSession);
  memoryMessages[newId] = [
    {
      id: generateUuid(),
      session_id: newId,
      user_id: userId,
      sender: 'zulu',
      message: 'Namaste, I am **Zulu**, your specialized Ayush Career & Research Counselor. How can I assist your career roadmap today?',
      provider: 'zulu-ai-engine',
      created_at: now
    }
  ];
  return memSession;
}

/**
 * Fetch messages for a session (with user ownership validation)
 */
async function getSessionMessages(sessionId, userId = 'usr-student-01') {
  if (isConfigured && supabase && isValidUuid(sessionId)) {
    try {
      let query = supabase
        .from('zulu_chat_messages')
        .select('*')
        .eq('session_id', sessionId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('[ZuluChatService] Supabase messages fetch fallback:', e.message);
    }
  }

  const msgs = memoryMessages[sessionId] || [];
  return userId ? msgs.filter(m => m.user_id === userId) : msgs;
}

/**
 * Add a message exchange to a session for a specific user
 */
async function addMessageToSession(sessionId, userId, sender, messageText, provider = null) {
  const now = new Date().toISOString();
  let targetSessionId = sessionId;
  if (!isValidUuid(targetSessionId)) {
    const userSess = memorySessions.find(s => s.user_id === userId);
    targetSessionId = userSess ? userSess.id : generateUuid();
  }

  if (isConfigured && supabase && isValidUuid(targetSessionId)) {
    try {
      const msgId = generateUuid();
      const { data, error } = await supabase
        .from('zulu_chat_messages')
        .insert([{
          id: msgId,
          session_id: targetSessionId,
          user_id: userId,
          sender: sender,
          message: messageText,
          provider: provider || 'zulu-ai-engine'
        }])
        .select()
        .single();

      if (sender === 'user') {
        const titleSnippet = messageText.length > 35 ? messageText.substring(0, 35) + '...' : messageText;
        const { data: curSess } = await supabase
          .from('zulu_chat_sessions')
          .select('title')
          .eq('id', targetSessionId)
          .maybeSingle();

        const updates = { updated_at: now };
        if (!curSess || curSess.title === 'New Conversation' || curSess.title === 'Zulu AI') {
          updates.title = titleSnippet;
        }

        await supabase
          .from('zulu_chat_sessions')
          .update(updates)
          .eq('id', targetSessionId);
      }

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('[ZuluChatService] Supabase message insert fallback:', e.message);
    }
  }

  if (!memoryMessages[targetSessionId]) {
    memoryMessages[targetSessionId] = [];
  }

  const msgObj = {
    id: generateUuid(),
    session_id: targetSessionId,
    user_id: userId,
    sender: sender,
    message: messageText,
    provider: provider || 'zulu-ai-engine',
    created_at: now
  };
  memoryMessages[targetSessionId].push(msgObj);

  const sessionObj = memorySessions.find(s => s.id === targetSessionId);
  if (sessionObj) {
    sessionObj.updated_at = now;
    if (sender === 'user' && (sessionObj.title === 'New Conversation' || sessionObj.title === 'Zulu AI')) {
      sessionObj.title = messageText.length > 35 ? messageText.substring(0, 35) + '...' : messageText;
    }
  }

  return msgObj;
}

/**
 * Delete a chat session for a specific user
 */
async function deleteSession(sessionId, userId = 'usr-student-01') {
  if (isConfigured && supabase && isValidUuid(sessionId)) {
    try {
      // Verify session ownership before deleting messages and session
      const { data: sessionData } = await supabase
        .from('zulu_chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (sessionData) {
        await supabase
          .from('zulu_chat_messages')
          .delete()
          .eq('session_id', sessionId);

        await supabase
          .from('zulu_chat_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId);
      }
    } catch (e) {
      console.warn('[ZuluChatService] Supabase session delete fallback:', e.message);
    }
  }

  const idx = memorySessions.findIndex(s => s.id === sessionId && s.user_id === userId);
  if (idx !== -1) memorySessions.splice(idx, 1);
  delete memoryMessages[sessionId];

  return { success: true };
}

module.exports = {
  getUserSessions,
  createSession,
  getSessionMessages,
  addMessageToSession,
  deleteSession
};
