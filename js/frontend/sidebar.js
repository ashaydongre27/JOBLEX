/**
 * JOBLEX Shared Sidebar & Mobile Menu Controller
 * Provides consistent sidebar collapse/expand and mobile drawer functionality
 * across all portal pages (Student, Academy, Industry)
 */

(function() {
  'use strict';

  // ─── Sidebar Collapse/Expand ───
  function initSidebarCollapse(sidebarId, collapseBtnId, collapsedWidth = 'w-20', expandedWidth = 'w-64') {
    const sidebar = document.getElementById(sidebarId);
    const collapseBtn = document.getElementById(collapseBtnId);
    const mainContent = document.querySelector('main.flex-1') || document.querySelector('.flex-1.overflow-y-auto');
    
    if (!sidebar || !collapseBtn) return;

    // Load saved state from localStorage
    const storageKey = `joblex_sidebar_${sidebarId}`;
    const isCollapsed = localStorage.getItem(storageKey) === 'true';
    
    if (isCollapsed) {
      sidebar.classList.remove(expandedWidth);
      sidebar.classList.add(collapsedWidth);
      collapseBtn.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_right</span>';
      sidebar.querySelectorAll('.sidebar-text-label').forEach(el => el.classList.add('hidden'));
    }

    collapseBtn.addEventListener('click', () => {
      const currentlyCollapsed = sidebar.classList.contains(collapsedWidth);
      
      if (currentlyCollapsed) {
        // Expand
        sidebar.classList.remove(collapsedWidth);
        sidebar.classList.add(expandedWidth);
        collapseBtn.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_left</span>';
        sidebar.querySelectorAll('.sidebar-text-label').forEach(el => el.classList.remove('hidden'));
        localStorage.setItem(storageKey, 'false');
      } else {
        // Collapse
        sidebar.classList.remove(expandedWidth);
        sidebar.classList.add(collapsedWidth);
        collapseBtn.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_right</span>';
        sidebar.querySelectorAll('.sidebar-text-label').forEach(el => el.classList.add('hidden'));
        localStorage.setItem(storageKey, 'true');
      }
    });
  }

  // ─── Mobile Drawer ───
  function initMobileDrawer(drawerId, toggleBtnSelector, closeBtnSelector) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    // Toggle button (hamburger menu in header)
    const toggleBtns = document.querySelectorAll(toggleBtnSelector);
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        drawer.classList.toggle('hidden');
      });
    });

    // Close button (X in drawer)
    const closeBtns = document.querySelectorAll(closeBtnSelector);
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        drawer.classList.add('hidden');
      });
    });

    // Close on backdrop click
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.add('hidden');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
        drawer.classList.add('hidden');
      }
    });
  }

  // ─── Active Navigation Highlighting ───
  function initActiveNavHighlight(sidebarId, currentPageHref) {
    const sidebar = document.getElementById(sidebarId);
    if (!sidebar) return;

    const navLinks = sidebar.querySelectorAll('a[href]');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPageHref || currentPageHref.endsWith(href))) {
        link.classList.add('sidebar-active');
      }
    });
  }

  // ─── Initialize All Sidebars ───
  function initAllSidebars() {
    // Student Portal
    if (document.getElementById('student-sidebar')) {
      initSidebarCollapse('student-sidebar', 'sidebar-collapse-btn');
      initMobileDrawer('mobile-drawer', '[onclick*="toggleMobileMenu"]', '[onclick*="closeMobileMenu"]');
      initActiveNavHighlight('student-sidebar', window.location.pathname);
    }

    // Academy Portal
    if (document.getElementById('academy-sidebar')) {
      initSidebarCollapse('academy-sidebar', 'academy-sidebar-collapse-btn');
      initMobileDrawer('academy-mobile-drawer', '[onclick*="toggleAcademyMobileMenu"]', '[onclick*="closeAcademyMobileMenu"]');
      initActiveNavHighlight('academy-sidebar', window.location.pathname);
    }

    // Industry Portal
    if (document.getElementById('industry-sidebar')) {
      initSidebarCollapse('industry-sidebar', 'industry-sidebar-collapse-btn');
      initMobileDrawer('industry-mobile-drawer', '[onclick*="toggleIndustryMobileMenu"]', '[onclick*="closeIndustryMobileMenu"]');
      initActiveNavHighlight('industry-sidebar', window.location.pathname);
    }
  }

  // ─── Legacy Function Aliases (for backward compatibility) ───
  window.toggleSidebarCollapse = function() {
    const sidebar = document.getElementById('student-sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (sidebar && btn) btn.click();
  };

  window.toggleAcademySidebarCollapse = function() {
    const sidebar = document.getElementById('academy-sidebar');
    const btn = document.getElementById('academy-sidebar-collapse-btn');
    if (sidebar && btn) btn.click();
  };

  window.toggleIndustrySidebarCollapse = function() {
    const sidebar = document.getElementById('industry-sidebar');
    const btn = document.getElementById('industry-sidebar-collapse-btn');
    if (sidebar && btn) btn.click();
  };

  window.toggleMobileMenu = function() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) {
      drawer.classList.toggle('hidden');
      document.body.classList.toggle('mobile-menu-open', !drawer.classList.contains('hidden'));
    }
  };

  window.closeMobileMenu = function() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      document.body.classList.remove('mobile-menu-open');
    }
  };

  window.toggleAcademyMobileMenu = function() {
    const drawer = document.getElementById('academy-mobile-drawer');
    if (drawer) {
      drawer.classList.toggle('hidden');
      document.body.classList.toggle('mobile-menu-open', !drawer.classList.contains('hidden'));
    }
  };

  window.closeAcademyMobileMenu = function() {
    const drawer = document.getElementById('academy-mobile-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      document.body.classList.remove('mobile-menu-open');
    }
  };

  window.toggleIndustryMobileMenu = function() {
    const drawer = document.getElementById('industry-mobile-drawer');
    if (drawer) {
      drawer.classList.toggle('hidden');
      document.body.classList.toggle('mobile-menu-open', !drawer.classList.contains('hidden'));
    }
  };

  window.closeIndustryMobileMenu = function() {
    const drawer = document.getElementById('industry-mobile-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      document.body.classList.remove('mobile-menu-open');
    }
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSidebars);
  } else {
    initAllSidebars();
  }

  // Expose for manual initialization if needed
  window.JoblexSidebar = {
    initSidebarCollapse,
    initMobileDrawer,
    initActiveNavHighlight,
    initAllSidebars
  };
})();