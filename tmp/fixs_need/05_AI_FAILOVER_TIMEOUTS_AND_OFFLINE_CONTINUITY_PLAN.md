# Fix Plan 05: Multi-Provider AI Failover Resilience & Stream Rate-Limiter Guard

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/services/ai.service.js`, `backend/routes/zulu.routes.js`, and `backend/routes/resume.routes.js`
- **Issue**:
  The system implements an advanced 4-tier failover orchestrator:
  1. NVIDIA NIM (12 models)
  2. Google AI Studio Main
  3. Google AI Studio Backup
  4. Local heuristic / dynamic fallback
  
  However, in high-frequency user interactions (such as rapid Zulu AI chat queries or automated resume parsings), external LLM APIs can return `429 Too Many Requests` or slow network timeouts (exceeding 20-30 seconds).
  If a network request hangs without an explicit timeout, client requests can freeze or show a perpetual spinner.

## 2. Potential Failure Scenarios
1. External NVIDIA or Google endpoint takes 40+ seconds to respond, locking user chat UI in `src/students/student-zulu.html`.
2. Resume analyzer times out on complex multi-page PDF text, causing parsing failure instead of transparently falling back to local NLP extraction.

## 3. Step-by-Step Resolution Plan
1. **Per-Provider AbortController Timeout Guard**:
   In `backend/services/ai.service.js`:
   - Enforce an explicit 12-second timeout per provider attempt using `AbortController`:
     ```javascript
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 12000);
     ```
   - If an API call exceeds 12 seconds, immediately abort and advance to the next tier in the failover cascade.
2. **Contextual Fallback Continuity**:
   - Ensure `generateSmartZuluResponse` in `backend/routes/zulu.routes.js` extracts candidate's current career roadmap phase and recent quiz performance to construct rich, personalized responses even when completely offline.
3. **Verification**:
   - Test Zulu chat and resume analysis with simulated API delays and verify instant seamless failover within < 3 seconds.
