const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'edge_test_scroll_' + Date.now());
  const port = 9339;

  const browser = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,900',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
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

  if (!wsUrl) { browser.kill(); return; }

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

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://localhost:3000' });
  // Wait 2.2s for preloader to fully complete and fade out
  await new Promise(r => setTimeout(r, 2200));

  // 1. Initial Hero at scrollY = 0 (Persona shifted right with peek opacity)
  const initialShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'inspect_initial_hero.png'), Buffer.from(initialShot.data, 'base64'));
  console.log('Saved scratch/inspect_initial_hero.png');

  // Check element transform at top of page
  const initTransform = await send('Runtime.evaluate', {
    expression: 'const el = document.getElementById("hero-interactive-persona-section"); ({ transform: el.style.transform, opacity: el.style.opacity });',
    returnByValue: true
  });
  console.log('At scrollY = 0:', initTransform.result.value);

  // 2. Scroll a little (scrollY = 120px)
  await send('Runtime.evaluate', {
    expression: 'window.scrollTo({ top: 120, behavior: "instant" }); updatePersonaScrollEntrance();'
  });
  await new Promise(r => setTimeout(r, 500));

  const scrolledTransform = await send('Runtime.evaluate', {
    expression: 'const el = document.getElementById("hero-interactive-persona-section"); ({ transform: el.style.transform, opacity: el.style.opacity });',
    returnByValue: true
  });
  console.log('At scrollY = 120:', scrolledTransform.result.value);

  const scrolledShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'inspect_scrolled_entrance.png'), Buffer.from(scrolledShot.data, 'base64'));
  console.log('Saved scratch/inspect_scrolled_entrance.png');

  // 3. Test in Light Mode
  await send('Runtime.evaluate', { expression: 'toggleTheme();' });
  await new Promise(r => setTimeout(r, 600));

  const lightShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'inspect_light_scrolled.png'), Buffer.from(lightShot.data, 'base64'));
  console.log('Saved scratch/inspect_light_scrolled.png');

  ws.close();
  browser.kill();
  console.log('All verification stages completed!');
}

run().catch(console.error);
