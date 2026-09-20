const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testScroll() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge_scroll_' + Date.now());
  const port = 9335;

  const browser = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,1024',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTab) { wsUrl = pageTab.webSocketDebuggerUrl; break; }
    } catch(e) {}
  }

  const ws = new WebSocket(wsUrl);
  let idSeq = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idSeq++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let loadResolve;
  const loadPromise = new Promise(r => { loadResolve = r; });
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg.result);
      pending.delete(msg.id);
    } else if (msg.method === 'Page.loadEventFired') {
      if (loadResolve) loadResolve();
    }
  };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await loadPromise;

  // Scroll down to 1400px (Bento section)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 1400);
      window.dispatchEvent(new Event('scroll'));
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const ssBento = await send('Page.captureScreenshot', { format: 'png' });
  if (ssBento && ssBento.data) {
    fs.writeFileSync(path.join(__dirname, 'inspect_bento.png'), Buffer.from(ssBento.data, 'base64'));
    console.log('Saved scratch/inspect_bento.png');
  }

  // Scroll down to 3000px (Synergy section)
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 3000);
      window.dispatchEvent(new Event('scroll'));
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const ssSynergy = await send('Page.captureScreenshot', { format: 'png' });
  if (ssSynergy && ssSynergy.data) {
    fs.writeFileSync(path.join(__dirname, 'inspect_synergy.png'), Buffer.from(ssSynergy.data, 'base64'));
    console.log('Saved scratch/inspect_synergy.png');
  }

  // Check revealed elements now
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const revealElems = document.querySelectorAll('.reveal-on-scroll, .reveal-from-left, .reveal-from-right, .reveal-scale');
      return {
        total: revealElems.length,
        revealed: Array.from(revealElems).filter(el => el.classList.contains('is-revealed')).length,
        unrevealed: Array.from(revealElems).filter(el => !el.classList.contains('is-revealed')).map(el => el.className)
      };
    })()`,
    returnByValue: true
  });
  console.log('Scroll reveal check:', evalResult.result.value);

  ws.close();
  browser.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e) {}
}

testScroll().catch(console.error);
