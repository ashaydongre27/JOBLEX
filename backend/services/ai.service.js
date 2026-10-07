/**
 * JOBLEX AI Orchestration Service
 * Powered by LangChain & LangGraph with Multi-Provider & Multi-Key Failover
 * Tier 1: NVIDIA NIM (nemotron-3-ultra-550b-a55b, nemotron-3.5-lightning-30b-a3b, llama-3.2-11b)
 * Tier 2: Google AI Studio Main Key (gemini-3.6-flash, gemini-3.5-flash, gemini-flash-latest)
 * Tier 3: Google AI Studio Backup Key (gemini-3.6-flash, gemini-3.5-flash, gemini-flash-latest)
 * Tier 4: Dynamic contextual fallback
 * Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
 */

let ChatGoogleGenerativeAI, SystemMessage, HumanMessage, AIMessage, StateGraph, END, START, Annotation, GoogleGenerativeAI;
try { ({ ChatGoogleGenerativeAI } = require('@langchain/google-genai')); } catch (e) {}
try { ({ SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages')); } catch (e) {}
try { ({ StateGraph, END, START, Annotation } = require('@langchain/langgraph')); } catch (e) {}
try { ({ GoogleGenerativeAI } = require('@google/generative-ai')); } catch (e) {}

/**
 * Retrieve sanitized Main Google API Key
 * Supports .env variable variations including gooleaistudiomain, GOOGLE_AI_STUDIO_MAIN, GEMINI_API_KEY
 */
function getMainApiKey() {
  const key = process.env.gooleaistudiomain ||
              process.env.GOOGLE_AI_STUDIO_MAIN ||
              process.env.GEMINI_API_KEY || 
              process.env.GOOGLE_API_KEY_MAIN || 
              process.env.GOOGLE_API_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '' || key.includes('your_gemini') || key.includes('placeholder')) {
    return null;
  }
  return key.trim();
}

/**
 * Retrieve sanitized Backup Google API Key
 * Supports .env variable variations including gooleaistudiobackup, GOOGLE_AI_STUDIO_BACKUP, GEMINI_API_KEY_BACKUP
 */
function getBackupApiKey() {
  const key = process.env.gooleaistudiobackup ||
              process.env.GOOGLE_AI_STUDIO_BACKUP ||
              process.env.GEMINI_API_KEY_BACKUP || 
              process.env.GOOGLE_API_KEY_BACKUP;
  if (!key || typeof key !== 'string' || key.trim() === '' || key.includes('your_gemini') || key.includes('placeholder')) {
    return null;
  }
  return key.trim();
}

/**
 * Check if at least one Google API key is configured
 */
function isGoogleApiConfigured() {
  return Boolean(getMainApiKey() || getBackupApiKey());
}

/**
 * Retrieve NVIDIA NIM API Key
 */
function getNvidiaApiKey() {
  const key = process.env.NVIDIA_API_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '' || key.includes('placeholder')) {
    return null;
  }
  return key.trim();
}

// Circuit Breaker Store for NVIDIA models: model -> { failureCount, firstFailure, trippedUntil }
const NVIDIA_CIRCUIT_BREAKER = new Map();

function isModelTripped(model) {
  const entry = NVIDIA_CIRCUIT_BREAKER.get(model);
  if (!entry) return false;
  if (Date.now() < entry.trippedUntil) return true;
  NVIDIA_CIRCUIT_BREAKER.delete(model);
  return false;
}

function recordModelFailure(model) {
  const now = Date.now();
  const entry = NVIDIA_CIRCUIT_BREAKER.get(model) || { failureCount: 0, firstFailure: now, trippedUntil: 0 };
  if (now - entry.firstFailure > 60000) {
    entry.failureCount = 1;
    entry.firstFailure = now;
  } else {
    entry.failureCount += 1;
  }
  if (entry.failureCount >= 3) {
    entry.trippedUntil = now + (5 * 60 * 1000);
    console.warn(`[NVIDIA Circuit Breaker]: Tripped OPEN for ${model} until ${new Date(entry.trippedUntil).toISOString()}`);
  }
  NVIDIA_CIRCUIT_BREAKER.set(model, entry);
}

function recordModelSuccess(model) {
  NVIDIA_CIRCUIT_BREAKER.delete(model);
}

/**
 * 12-Model NVIDIA NIM Fallback Cascade
 * Ordered by reasoning accuracy, schema compliance, latency, and availability
 */
const NVIDIA_CASCADE_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mistral-large-2-instruct',
  'qwen/qwen2.5-72b-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'deepseek-ai/deepseek-r1',
  'mistralai/mixtral-8x22b-instruct-v0.1',
  'meta/llama-3.1-405b-instruct',
  'google/gemma-2-27b-it',
  'meta/llama-3.2-11b-vision-instruct',
  'meta/llama-3.1-8b-instruct',
  'mistralai/mistral-7b-instruct-v0.3',
  'nvidia/nemotron-3-super-120b-a12b',
  'openai/gpt-oss-20b',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'moonshotai/kimi-k3'
];

async function callNvidiaModel({ prompt, systemInstruction = '', history = [], temperature = 0.7, maxTokens = 2048, enableThinking = false, timeoutMs = 12000, jsonMode = false }) {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) return null;

  const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  for (const h of history) {
    if (h.role && (h.content || h.text)) {
      messages.push({
        role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content || h.text
      });
    }
  }
  messages.push({ role: 'user', content: prompt });

  for (const model of NVIDIA_CASCADE_MODELS) {
    if (isModelTripped(model)) {
      continue;
    }

    try {
      const payload = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      };
      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }
      if (enableThinking && model.includes('nemotron')) {
        payload.chat_template_kwargs = { enable_thinking: true };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 12000);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!res.ok) {
          recordModelFailure(model);
          continue;
        }

        const data = await res.json();
        const choice = data?.choices?.[0]?.message;
        const text = choice?.content || choice?.reasoning || choice?.reasoning_content;

        if (text && text.trim()) {
          recordModelSuccess(model);
          return {
            text: text.trim(),
            reasoning: choice?.reasoning_content || choice?.reasoning || null,
            provider: model,
            keyType: 'nvidia-nim'
          };
        } else {
          recordModelFailure(model);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      recordModelFailure(model);
    }
  }

  return null;
}

/**
 * Sliding Window Rate-Limit Guard for Google AI Studio Free Tier
 * Free tier project limit: 15 Requests Per Minute (RPM) & 1,500 Requests Per Day (RPD).
 * We enforce a local ceiling of 14 RPM to prevent HTTP 429 RESOURCE_EXHAUSTED errors.
 */
const GOOGLE_REQUEST_TIMESTAMPS = [];
const GOOGLE_MAX_RPM = 14;

function canMakeGoogleRequest() {
  const now = Date.now();
  while (GOOGLE_REQUEST_TIMESTAMPS.length > 0 && now - GOOGLE_REQUEST_TIMESTAMPS[0] > 60000) {
    GOOGLE_REQUEST_TIMESTAMPS.shift();
  }
  return GOOGLE_REQUEST_TIMESTAMPS.length < GOOGLE_MAX_RPM;
}

function recordGoogleRequest() {
  GOOGLE_REQUEST_TIMESTAMPS.push(Date.now());
}

/**
 * Supported active Gemini models on Google AI Studio
 * Prioritizes high-throughput Flash models (15 RPM / 1M TPM / 1500 RPD)
 */
const GOOGLE_CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

const DEPRECATED_GOOGLE_MODELS = new Set();
const INVALID_GOOGLE_KEYS = new Set();
const GOOGLE_QUOTA_COOLDOWNS = new Map();

function isGoogleModelInCooldown(model) {
  const until = GOOGLE_QUOTA_COOLDOWNS.get(model);
  if (!until) return false;
  if (Date.now() < until) return true;
  GOOGLE_QUOTA_COOLDOWNS.delete(model);
  return false;
}

function recordGoogleModelCooldown(model, durationSec = 30) {
  GOOGLE_QUOTA_COOLDOWNS.set(model, Date.now() + (durationSec * 1000));
}

/**
 * Low-level Google generator using SDK -> LangChain -> REST fallback for a specific API key
 */
async function callGoogleModelWithKey(apiKey, { prompt, systemInstruction, history = [], temperature = 0.7, jsonMode = false }) {
  if (!apiKey || INVALID_GOOGLE_KEYS.has(apiKey)) return null;

  if (!canMakeGoogleRequest()) {
    console.warn('[Google AI Studio Free Tier Guard]: 14 RPM window reached. Throttling Google request.');
    return null;
  }
  recordGoogleRequest();

  // 1. Direct REST (Fastest, zero SDK overhead, supports Gemini 3.6 Flash natively)
  for (const modelName of GOOGLE_CANDIDATE_MODELS) {
    if (DEPRECATED_GOOGLE_MODELS.has(modelName) || isGoogleModelInCooldown(modelName)) continue;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 12000);

      const contents = [];
      if (Array.isArray(history) && history.length > 0) {
        history.forEach(h => {
          const textContent = h.text || h.content;
          if (textContent) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: textContent }]
            });
          }
        });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const reqBody = {
        contents,
        generationConfig: {
          temperature: temperature,
          responseMimeType: jsonMode ? 'application/json' : undefined
        }
      };
      if (systemInstruction) {
        reqBody.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const restRes = await fetch(endpoint, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
      });
      clearTimeout(timeoutId);

      if (restRes.ok) {
        const data = await restRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), model: `${modelName}-rest` };
        }
      } else {
        const errJson = await restRes.json().catch(() => ({}));
        const errStr = JSON.stringify(errJson);
        if (restRes.status === 404) {
          DEPRECATED_GOOGLE_MODELS.add(modelName);
        } else if (restRes.status === 429 || errStr.includes('Quota exceeded') || errStr.includes('429')) {
          recordGoogleModelCooldown(modelName, 45);
        } else if (restRes.status === 400 && errStr.includes('API key not valid')) {
          INVALID_GOOGLE_KEYS.add(apiKey);
          return null;
        }
      }
    } catch (restErr) {
      console.warn(`[Google REST ${modelName}]:`, restErr.message);
    }
  }

  // 2. Direct High-Speed Google Generative AI SDK (Fallback)
  if (GoogleGenerativeAI) {
    for (const modelName of GOOGLE_CANDIDATE_MODELS) {
      if (DEPRECATED_GOOGLE_MODELS.has(modelName) || isGoogleModelInCooldown(modelName)) continue;

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelConfig = {
          model: modelName,
          generationConfig: {
            temperature: temperature,
            responseMimeType: jsonMode ? 'application/json' : undefined
          }
        };
        if (systemInstruction) {
          modelConfig.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        const model = genAI.getGenerativeModel(modelConfig);

        let responseText = null;
        let timerId;
        const timeoutPromise = new Promise((_, r) => {
          timerId = setTimeout(() => r(new Error(`SDK timeout on ${modelName}`)), 3500);
        });

        try {
          let opPromise;
          if (Array.isArray(history) && history.length > 0) {
            const formattedHistory = history
              .filter(h => h.role && (h.text || h.content))
              .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text || h.content }]
              }));

            const chat = model.startChat({ history: formattedHistory });
            opPromise = chat.sendMessage(prompt);
          } else {
            opPromise = model.generateContent(prompt);
          }

          const result = await Promise.race([opPromise, timeoutPromise]);
          responseText = result.response.text();
        } finally {
          clearTimeout(timerId);
        }

        if (responseText && responseText.trim()) {
          return { text: responseText.trim(), model: modelName };
        }
      } catch (sdkErr) {
        if (sdkErr.message.includes('API key not valid') || sdkErr.message.includes('INVALID_ARGUMENT')) {
          INVALID_GOOGLE_KEYS.add(apiKey);
          console.warn('[Google AI Studio]: API key invalid. Bypassing Google provider for this key.');
          return null;
        }
        if (sdkErr.message.includes('429') || sdkErr.message.includes('Quota exceeded')) {
          recordGoogleModelCooldown(modelName, 45);
        }
        if (sdkErr.message.includes('404') || sdkErr.message.includes('no longer available')) {
          DEPRECATED_GOOGLE_MODELS.add(modelName);
        }
        console.warn(`[Google SDK ${modelName}]:`, sdkErr.message);
      }
    }
  }

  // 3. LangChain ChatGoogleGenerativeAI (Fallback)
  if (ChatGoogleGenerativeAI && HumanMessage) {
    for (const modelName of GOOGLE_CANDIDATE_MODELS) {
      if (DEPRECATED_GOOGLE_MODELS.has(modelName) || isGoogleModelInCooldown(modelName)) continue;

      try {
        const chat = new ChatGoogleGenerativeAI({
          apiKey: apiKey,
          model: modelName,
          temperature: temperature,
          maxRetries: 0
        });

        const messages = [];
        if (systemInstruction && SystemMessage) {
          messages.push(new SystemMessage(systemInstruction));
        }
        if (Array.isArray(history) && history.length > 0) {
          history.forEach(h => {
            const textContent = h.text || h.content;
            if (!textContent) return;
            if (h.role === 'user') messages.push(new HumanMessage(textContent));
            else if (AIMessage) messages.push(new AIMessage(textContent));
          });
        }
        messages.push(new HumanMessage(prompt));

        let lcTimerId;
        const lcTimeout = new Promise((_, reject) => {
          lcTimerId = setTimeout(() => reject(new Error(`LangChain ${modelName} timeout`)), 3500);
        });

        try {
          const response = await Promise.race([chat.invoke(messages), lcTimeout]);
          const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
          if (text && text.trim()) {
            return { text: text.trim(), model: `langchain-${modelName}` };
          }
        } finally {
          clearTimeout(lcTimerId);
        }
      } catch (lcErr) {
        if (lcErr.message.includes('429') || lcErr.message.includes('Quota exceeded')) {
          recordGoogleModelCooldown(modelName, 45);
        }
        if (lcErr.message.includes('404') || lcErr.message.includes('no longer available')) {
          DEPRECATED_GOOGLE_MODELS.add(modelName);
        }
        console.warn(`[LangChain ${modelName}]:`, lcErr.message);
      }
    }
  }

  return null;
}

/**
 * Node: Execute with NVIDIA NIM (Tier 1)
 */
async function runWithNvidiaNode(state) {
  const nvKey = getNvidiaApiKey();
  if (!nvKey) {
    return { error: 'NVIDIA API key not configured' };
  }

  try {
    const res = await callNvidiaModel({
      prompt: state.prompt,
      systemInstruction: state.systemInstruction,
      history: state.history,
      temperature: state.temperature
    });

    if (res && res.text) {
      return {
        resultText: res.text,
        provider: res.provider || 'nvidia/nemotron-3-ultra-550b-a55b',
        usedKeyType: 'nvidia'
      };
    }
  } catch (err) {
    console.warn('[LangGraph NVIDIA Error]:', err.message);
  }

  return { error: 'NVIDIA NIM generation failed or returned empty' };
}

/**
 * Node: Execute with Google AI Studio Main Key (Tier 2)
 */
async function runWithGoogleMainNode(state) {
  const mainKey = getMainApiKey();
  if (!mainKey) {
    return { error: 'Google Main API key not configured' };
  }

  try {
    const res = await callGoogleModelWithKey(mainKey, {
      prompt: state.prompt,
      systemInstruction: state.systemInstruction,
      history: state.history,
      temperature: state.temperature,
      jsonMode: state.jsonMode
    });

    if (res && res.text) {
      return {
        resultText: res.text,
        provider: `${res.model}-google-main`,
        usedKeyType: 'google-main'
      };
    }
  } catch (err) {
    console.warn('[LangGraph Google Main Key Error]:', err.message);
  }

  return { error: 'Google Main key generation failed or returned empty' };
}

/**
 * Node: Execute with Google AI Studio Backup Key (Tier 3)
 */
async function runWithGoogleBackupNode(state) {
  const backupKey = getBackupApiKey();
  if (!backupKey) {
    return { error: 'Google Backup API key not configured' };
  }

  console.log('[LangGraph Failover]: Routing request to Google AI Studio Backup Key...');

  try {
    const res = await callGoogleModelWithKey(backupKey, {
      prompt: state.prompt,
      systemInstruction: state.systemInstruction,
      history: state.history,
      temperature: state.temperature,
      jsonMode: state.jsonMode
    });

    if (res && res.text) {
      return {
        resultText: res.text,
        provider: `${res.model}-google-backup`,
        usedKeyType: 'google-backup'
      };
    }
  } catch (err) {
    console.warn('[LangGraph Google Backup Key Error]:', err.message);
  }

  return { error: 'Google Backup key generation failed or returned empty' };
}

/**
 * LangGraph State Definition & Graph Compilation
 * Sequence: NVIDIA NIM -> Google AI Studio Main -> Google AI Studio Backup -> END
 */
let multiProviderGraph = null;

if (StateGraph && Annotation && typeof Annotation.Root === 'function') {
  try {
    const OrchestrationState = Annotation.Root({
      prompt: Annotation(),
      systemInstruction: Annotation(),
      history: Annotation(),
      temperature: Annotation(),
      jsonMode: Annotation(),
      resultText: Annotation(),
      provider: Annotation(),
      usedKeyType: Annotation(),
      error: Annotation()
    });

    multiProviderGraph = new StateGraph(OrchestrationState)
      .addNode('nvidia_worker', runWithNvidiaNode)
      .addNode('google_main_worker', runWithGoogleMainNode)
      .addNode('google_backup_worker', runWithGoogleBackupNode)
      .addEdge(START, 'nvidia_worker')
      .addConditionalEdges('nvidia_worker', (state) => {
        return (state.resultText && state.resultText.trim()) ? END : 'google_main_worker';
      }, {
        [END]: END,
        google_main_worker: 'google_main_worker'
      })
      .addConditionalEdges('google_main_worker', (state) => {
        return (state.resultText && state.resultText.trim()) ? END : 'google_backup_worker';
      }, {
        [END]: END,
        google_backup_worker: 'google_backup_worker'
      })
      .addEdge('google_backup_worker', END)
      .compile();

    console.log('[LangGraph]: Multi-provider failover graph initialized (NVIDIA -> Google Main -> Google Backup)');
  } catch (err) {
    console.warn('[LangGraph Init Notice]: Could not compile LangGraph, falling back to direct sequential failover:', err.message);
    multiProviderGraph = null;
  }
}

/**
 * Public Failover Orchestrator Entrypoint
 * Attempts Tier 1: NVIDIA NIM -> Tier 2: Google Main -> Tier 3: Google Backup
 */
async function generateWithFailover({ prompt, systemInstruction = '', history = [], temperature = 0.7, jsonMode = false }) {
  const hasNvidia = Boolean(getNvidiaApiKey());
  const hasGoogle = isGoogleApiConfigured();

  if (!hasNvidia && !hasGoogle) {
    return null;
  }

  // 1. Execute with compiled LangGraph
  if (multiProviderGraph) {
    try {
      const finalState = await multiProviderGraph.invoke({
        prompt,
        systemInstruction,
        history,
        temperature,
        jsonMode
      });

      if (finalState && finalState.resultText && finalState.resultText.trim()) {
        return {
          text: finalState.resultText.trim(),
          provider: finalState.provider || 'langgraph-orchestrator',
          keyType: finalState.usedKeyType || 'langgraph'
        };
      }
    } catch (graphErr) {
      console.warn('[LangGraph Orchestrator Execution Failure]:', graphErr.message);
    }
    // Multi-provider graph has already exhausted configured tiers
    return null;
  }

  // Tier 2: Google Main Key
  const mainKey = getMainApiKey();
  if (mainKey) {
    try {
      const mainRes = await callGoogleModelWithKey(mainKey, { prompt, systemInstruction, history, temperature, jsonMode });
      if (mainRes && mainRes.text) {
        return { text: mainRes.text, provider: `${mainRes.model}-google-main`, keyType: 'google-main' };
      }
    } catch (e) {
      console.warn('[Direct Google Main Failure]:', e.message);
    }
  }

  // Tier 3: Google Backup Key
  const backupKey = getBackupApiKey();
  if (backupKey) {
    try {
      const backupRes = await callGoogleModelWithKey(backupKey, { prompt, systemInstruction, history, temperature, jsonMode });
      if (backupRes && backupRes.text) {
        return { text: backupRes.text, provider: `${backupRes.model}-google-backup`, keyType: 'google-backup' };
      }
    } catch (e) {
      console.warn('[Direct Google Backup Failure]:', e.message);
    }
  }

  return null;
}

module.exports = {
  getMainApiKey,
  getBackupApiKey,
  getNvidiaApiKey,
  isGoogleApiConfigured,
  callNvidiaModel,
  callGoogleModelWithKey,
  generateWithFailover,
  NVIDIA_CASCADE_MODELS,
  NVIDIA_MODELS_CASCADE: NVIDIA_CASCADE_MODELS,
  NVIDIA_CIRCUIT_BREAKER: {
    recordFailure: recordModelFailure,
    recordSuccess: recordModelSuccess,
    isOpen: isModelTripped,
    map: NVIDIA_CIRCUIT_BREAKER
  },
  googleRateLimiter: {
    canRequest: canMakeGoogleRequest,
    recordRequest: recordGoogleRequest,
    maxRpm: GOOGLE_MAX_RPM,
    timestamps: GOOGLE_REQUEST_TIMESTAMPS
  }
};
