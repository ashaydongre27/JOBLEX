const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge_inspect_' + Date.now());
  const port = 9333;

  console.log('Launching headless Edge on port', port);
  const browser = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1024',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  browser.on('error', (err) => console.error('Browser spawn error:', err));

  // Wait for remote debugging to open
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTab) {
        wsUrl = pageTab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    browser.kill();
    return;
  }

  console.log('Connecting to WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let idSeq = 1;
  const pending = new Map();
  const consoleMessages = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idSeq++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let loadEventResolve;
  const loadEventPromise = new Promise(r => { loadEventResolve = r; });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Page.loadEventFired') {
      if (loadEventResolve) loadEventResolve();
    } else if (msg.method === 'Console.messageAdded') {
      consoleMessages.push(msg.params.message);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(msg.params);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleMessages.push({ type: 'exception', details: msg.params.exceptionDetails });
    }
  };

  await new Promise(r => { ws.onopen = r; });
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Console.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:3000/...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await loadEventPromise;
  console.log('Page load event fired');

  // Wait 2s for Three.js and animations to initialize
  await new Promise(r => setTimeout(r, 2000));

  // Evaluate state in page
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const info = {};
      info.title = document.title;
      info.threeDefined = typeof THREE !== 'undefined';
      
      const canvas = document.querySelector('#three-canvas-container canvas');
      info.canvasExists = !!canvas;
      if (canvas) {
        info.canvasWidth = canvas.width;
        info.canvasHeight = canvas.height;
        info.canvasStyleWidth = canvas.style.width;
        info.canvasStyleHeight = canvas.style.height;
      }

      function getElemInfo(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          exists: true,
          display: cs.display,
          opacity: cs.opacity,
          visibility: cs.visibility,
          animationName: cs.animationName,
          animationDuration: cs.animationDuration,
          animationPlayState: cs.animationPlayState,
          zIndex: cs.zIndex,
          position: cs.position,
          transform: cs.transform,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          classes: el.className
        };
      }

      info.canvasContainer = getElemInfo('#three-canvas-container');
      info.hero = getElemInfo('#hero');
      info.bento = getElemInfo('#bento-showcase');
      info.node1 = getElemInfo('.node-float-1');
      info.node2 = getElemInfo('.node-float-2');
      info.node3 = getElemInfo('.node-float-3');
      info.node4 = getElemInfo('.node-float-4');
      info.extractionRing = getElemInfo('.extraction-ring');
      info.scrollLine = getElemInfo('.scroll-line-anim');
      info.ambientOrb1 = getElemInfo('.ambient-glow-orb-1');
      info.ambientOrb2 = getElemInfo('.ambient-glow-orb-2');
      info.ambientOrb3 = getElemInfo('.ambient-glow-orb-3');
      info.bentoAmbientOrb = getElemInfo('.ambient-orb');
      info.ctaOrb = getElemInfo('.cta-orb');
      info.cyberButton = getElemInfo('.cyber-button');
      
      const cyberBtnA = document.querySelector('.cyber-button .a');
      if (cyberBtnA) {
        const csAfter = window.getComputedStyle(cyberBtnA, '::after');
        info.cyberLaserAfter = {
          content: csAfter.content,
          animationName: csAfter.animationName,
          opacity: csAfter.opacity,
          filter: csAfter.filter
        };
      }

      const revealElems = document.querySelectorAll('.reveal-on-scroll, .reveal-from-left, .reveal-from-right, .reveal-scale');
      info.totalRevealElements = revealElems.length;
      info.revealedCount = Array.from(revealElems).filter(el => el.classList.contains('is-revealed')).length;

      const tiltCard = document.querySelector('.tilt-card');
      if (tiltCard) {
        info.tiltCard = {
          hasIsRevealed: tiltCard.classList.contains('is-revealed'),
          transform: window.getComputedStyle(tiltCard).transform
        };
      }

      const counters = document.querySelectorAll('[data-counter-target]');
      info.counters = Array.from(counters).map(c => ({
        target: c.getAttribute('data-counter-target'),
        text: c.innerText
      }));

      return info;
    })()`,
    returnByValue: true
  });

  console.log('=== PAGE DIAGNOSTICS ===');
  console.log(JSON.stringify(evalResult.result.value, null, 2));

  console.log('=== CONSOLE MESSAGES / ERRORS ===');
  console.log(consoleMessages);

  // Take a dark screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    const ssPath = path.join(__dirname, 'inspect_screenshot.png');
    fs.writeFileSync(ssPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Dark screenshot saved to', ssPath);
  }

  // Switch to light mode and inspect
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('joblex_theme', 'light');
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const screenshotLight = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotLight && screenshotLight.data) {
    const ssPathLight = path.join(__dirname, 'inspect_light.png');
    fs.writeFileSync(ssPathLight, Buffer.from(screenshotLight.data, 'base64'));
    console.log('Light screenshot saved to', ssPathLight);
  }

  ws.close();
  browser.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(console.error);
