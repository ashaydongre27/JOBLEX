/**
 * JOBLEX 3D Constellation & Ambient Particle Canvas
 * Theme-reactive neural/academic constellation with connective lines,
 * mouse parallax reactivity, and scroll-depth tracking.
 */
(function() {
  'use strict';

  const container = document.getElementById('three-canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const particleCount = 320;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  // Palette definitions
  const darkPalette = [
    new THREE.Color('#4EBA87'), // Sage glow
    new THREE.Color('#D4973B'), // Ochre glow
    new THREE.Color('#E07A48'), // Terracotta glow
    new THREE.Color('#94A3B8')  // Starlight slate
  ];

  const lightPalette = [
    new THREE.Color('#2D5542'), // Deep botanical sage
    new THREE.Color('#855828'), // Institutional ochre
    new THREE.Color('#944C23'), // Warm terracotta
    new THREE.Color('#44403C')  // Warm mineral charcoal
  ];

  const colors = new Float32Array(particleCount * 3);

  function isDarkTheme() {
    return document.documentElement.classList.contains('dark');
  }

  function assignColors() {
    const palette = isDarkTheme() ? darkPalette : lightPalette;
    for (let i = 0; i < particleCount; i++) {
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  // Initialize particle positions & velocities across wider bounds
  const bounds = { x: 28, y: 22, z: 14 };
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * bounds.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;

    velocities.push({
      x: (Math.random() - 0.5) * 0.008,
      y: (Math.random() - 0.5) * 0.008,
      z: (Math.random() - 0.5) * 0.004
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  assignColors();

  const pointsMaterial = new THREE.PointsMaterial({
    size: isDarkTheme() ? 0.15 : 0.13,
    vertexColors: true,
    transparent: true,
    opacity: isDarkTheme() ? 0.90 : 0.80,
    blending: THREE.NormalBlending
  });

  const points = new THREE.Points(geometry, pointsMaterial);
  scene.add(points);

  // Dynamic Connective Constellation Lines
  const maxLineConnections = 280;
  const linePositions = new Float32Array(maxLineConnections * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: isDarkTheme() ? 0x4eba87 : 0x2d5542,
    transparent: true,
    opacity: isDarkTheme() ? 0.42 : 0.32,
    blending: THREE.NormalBlending
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // Mouse Parallax
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Scroll Parallax
  let targetScrollY = 0;
  let currentScrollY = 0;

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY || document.documentElement.scrollTop;
  }, { passive: true });

  // Theme Observer
  const themeObserver = new MutationObserver(() => {
    assignColors();
    const dark = isDarkTheme();
    pointsMaterial.size = dark ? 0.15 : 0.13;
    pointsMaterial.opacity = dark ? 0.90 : 0.80;
    lineMaterial.color.set(dark ? 0x4eba87 : 0x2d5542);
    lineMaterial.opacity = dark ? 0.42 : 0.32;
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation Loop
  let frameCount = 0;
  function animate() {
    requestAnimationFrame(animate);

    // Mouse interpolation (smooth spring feel)
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    // Scroll interpolation
    currentScrollY += (targetScrollY - currentScrollY) * 0.05;

    if (!prefersReducedMotion) {
      const camY = -currentScrollY * 0.002;
      camera.position.x = mouseX * 1.2;
      camera.position.y = camY - mouseY * 0.8;
      camera.lookAt(0, camY, 0);

      // Particle physics update with vertical wrapping around camY
      const pos = geometry.attributes.position.array;
      const halfY = bounds.y / 2;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] += velocities[i].x;
        pos[i3 + 1] += velocities[i].y;
        pos[i3 + 2] += velocities[i].z;

        // Bounce back in horizontal and depth boundary
        if (Math.abs(pos[i3]) > bounds.x / 2) velocities[i].x *= -1;
        if (Math.abs(pos[i3 + 2]) > bounds.z / 2) velocities[i].z *= -1;

        // Wrap vertically relative to current camera scroll position (camY)
        if (pos[i3 + 1] > camY + halfY) {
          pos[i3 + 1] = camY - halfY + 0.2;
        } else if (pos[i3 + 1] < camY - halfY) {
          pos[i3 + 1] = camY + halfY - 0.2;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Update connective lines every 2 frames for 60fps efficiency
      frameCount++;
      if (frameCount % 2 === 0) {
        let lineIdx = 0;
        const linePos = lineGeometry.attributes.position.array;
        const connectDistance = 3.4;

        for (let i = 0; i < particleCount && lineIdx < maxLineConnections; i++) {
          const ix = pos[i * 3];
          const iy = pos[i * 3 + 1];
          const iz = pos[i * 3 + 2];

          for (let j = i + 1; j < particleCount && lineIdx < maxLineConnections; j++) {
            const jx = pos[j * 3];
            const jy = pos[j * 3 + 1];
            const jz = pos[j * 3 + 2];

            const dx = ix - jx;
            const dy = iy - jy;
            const dz = iz - jz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectDistance) {
              const base = lineIdx * 6;
              linePos[base] = ix;
              linePos[base + 1] = iy;
              linePos[base + 2] = iz;
              linePos[base + 3] = jx;
              linePos[base + 4] = jy;
              linePos[base + 5] = jz;
              lineIdx++;
            }
          }
        }

        // Zero out unused line segments
        for (let k = lineIdx * 6; k < maxLineConnections * 6; k++) {
          linePos[k] = 0;
        }
        lineGeometry.attributes.position.needsUpdate = true;
      }

      points.rotation.y += 0.0004;
      lines.rotation.y += 0.0004;
    }

    renderer.render(scene, camera);
  }

  animate();
})();
