/**
 * ASMR Static Background — High-Density Kinetic Particle Canvas
 * Features:
 * - High-density particle system using HTML5 Canvas
 * - Reactive "magnetic vortex" swirl & pull effect on mouse hover / touch
 * - Velocity & proximity based "friction glow"
 * - Glass-shard and charcoal-dust aesthetic with sharp diamond shard geometry
 * - Dynamic mobile calibration (300 particles on mobile / touch vs 1000 on desktop)
 * - Dual-theme reactivity (Obsidian dark mode vs Mineral bone light mode)
 * - Smooth motion-blur persistence and screen wrap physics
 */
(function initASMRBackground() {
  'use strict';

  function setup() {
    const canvas = document.getElementById('asmr-static-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);

    const PARTICLE_COUNT = prefersReducedMotion ? 60 : (isMobile ? 300 : 1000);
    const MAGNETIC_RADIUS = isMobile ? 180 : 280;
    const VORTEX_STRENGTH = 0.07;
    const PULL_STRENGTH = 0.12;

    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let particles = [];
    const mouse = { x: -1000, y: -1000 };

    function isDark() {
      return document.documentElement.classList.contains('dark');
    }

    class Particle {
      constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 0;
        this.alpha = 0;
        this.color = '';
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.frictionGlow = 0;
        this.isGlass = false;
        this.reset();
      }

      reset() {
        this.x = Math.random() * (width || window.innerWidth);
        this.y = Math.random() * (height || window.innerHeight);
        this.size = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        // 70% Charcoal, 30% Glass
        this.isGlass = Math.random() > 0.7;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.updateColor();
      }

      updateColor() {
        if (isDark()) {
          this.color = this.isGlass ? '240, 245, 255' : '90, 95, 105';
        } else {
          this.color = this.isGlass ? '165, 115, 60' : '45, 55, 50';
        }
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAGNETIC_RADIUS && dist > 1) {
          const force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;

          // Magnetic center pull
          this.vx += (dx / dist) * force * PULL_STRENGTH;
          this.vy += (dy / dist) * force * PULL_STRENGTH;

          // Swirl vortex motion (perpendicular to radius)
          this.vx += (dy / dist) * force * VORTEX_STRENGTH * 10;
          this.vy -= (dx / dist) * force * VORTEX_STRENGTH * 10;

          // Friction glow based on proximity
          this.frictionGlow = force * 0.7;
        } else {
          this.frictionGlow *= 0.92;
        }

        // Apply velocities
        this.x += this.vx;
        this.y += this.vy;

        // Friction / Damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Background micro-jitter (frozen static feel)
        this.vx += (Math.random() - 0.5) * 0.04;
        this.vy += (Math.random() - 0.5) * 0.04;

        this.rotation += this.rotationSpeed + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;

        // Screen wrap
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const dark = isDark();
        const finalAlpha = Math.min(this.alpha + this.frictionGlow, 0.92);
        ctx.fillStyle = `rgba(${this.color}, ${finalAlpha})`;

        if (this.frictionGlow > 0.28) {
          ctx.shadowBlur = 8 * this.frictionGlow;
          ctx.shadowColor = dark
            ? `rgba(180, 220, 255, ${this.frictionGlow * 0.9})`
            : `rgba(45, 85, 66, ${this.frictionGlow * 0.8})`;
        }

        // Sharp diamond shard geometry
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 2.5);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 2.5);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    function init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function render() {
      // Slight motion blur background clear
      ctx.fillStyle = isDark() ? 'rgba(10, 10, 12, 0.20)' : 'rgba(247, 247, 245, 0.25)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    function handleMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
    }

    function handleTouchMove(e) {
      if (e.touches && e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    // Watch for theme toggles to update particle colors
    const themeObserver = new MutationObserver(() => {
      particles.forEach(p => p.updateColor());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    init();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
