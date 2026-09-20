/**
 * JOBLEX Institutional Real-Time Notification Engine
 * Provides live contextual alerts, unread counts, interactive dropdown,
 * and state persistence across page navigations.
 */

(function () {
  function getStorageKey() {
    try {
      const user = JSON.parse(localStorage.getItem('joblex_user') || localStorage.getItem('joblex_auth_user') || '{}');
      const uKey = user.email || user.id || 'guest';
      return `joblex_notifications_${uKey}`;
    } catch(e) {
      return 'joblex_notifications_guest';
    }
  }

  const DEFAULT_NOTIFICATIONS = [];

  let notifications = [];
  let currentFilter = 'all';

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  async function loadNotifications() {
    const storageKey = getStorageKey();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        notifications = JSON.parse(stored);
      } else {
        notifications = [];
      }
    } catch (e) {
      notifications = [];
    }

    // Connect to backend API for live notifications
    try {
      const user = JSON.parse(localStorage.getItem('joblex_user') || localStorage.getItem('joblex_auth_user') || '{}');
      const recipientId = user.email || user.id || (window.location.pathname.includes('industry') ? 'usr-industry-01' : (window.location.pathname.includes('academy') ? 'usr-academy-01' : 'usr-student-01'));
      const apiBase = window.JOBLEX_API_BASE || window.JOBLEX_API_URL || '/api';
      const token = localStorage.getItem('joblex_token');
      const res = await fetch(`${apiBase}/notifications?recipientId=${encodeURIComponent(recipientId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          const apiNotifs = data.notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.category || 'system',
            time: formatTimeAgo(n.createdAt || n.created_at),
            unread: !n.isRead && !n.is_read,
            link: n.actionUrl || n.action_url || '#',
            icon: n.category === 'interview_invite' ? 'event' : (n.category === 'new_opportunity' ? 'work' : 'notifications'),
            iconBg: n.category === 'interview_invite' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          }));
          notifications = apiNotifs;
          saveNotifications();
          updateBadgeUI();
          renderNotificationList();
        }
      }
    } catch (err) {
      console.warn('[Notifications] Remote fetch fallback to local:', err.message);
    }
    updateBadgeUI();
    renderNotificationList();
  }

  function saveNotifications() {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(notifications));
    } catch (e) {}
  }

  function getUnreadCount() {
    return notifications.filter(n => n.unread).length;
  }

  function updateBadgeUI() {
    const count = getUnreadCount();
    document.querySelectorAll('.notification-badge-indicator').forEach(badge => {
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.innerText = count > 9 ? '9+' : count;
      } else {
        badge.classList.add('hidden');
      }
    });

    const unreadPill = document.getElementById('notif-unread-count-pill');
    if (unreadPill) {
      unreadPill.innerText = `${count} Unread`;
      unreadPill.className = count > 0 
        ? 'text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60'
        : 'text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 font-bold';
    }
  }

  function renderNotificationList() {
    const listContainer = document.getElementById('notifications-items-list');
    if (!listContainer) return;

    const items = currentFilter === 'unread' 
      ? notifications.filter(n => n.unread) 
      : notifications;

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="py-10 text-center space-y-2 px-4">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 dark:text-gray-500 mx-auto">
            <span class="material-symbols-outlined text-[20px]">notifications_off</span>
          </div>
          <p class="text-xs font-semibold text-slate-700 dark:text-gray-300">All caught up!</p>
          <p class="text-[11px] text-slate-500 dark:text-gray-400">No ${currentFilter === 'unread' ? 'unread ' : ''}notifications at this time.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items.map(n => `
      <div onclick="JoblexNotifications.handleClickItem('${n.id}', '${n.link}')" class="p-3.5 transition-all duration-150 cursor-pointer border-b border-slate-100 dark:border-gray-800/80 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] flex items-start gap-3 relative ${n.unread ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''}">
        <div class="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${n.iconBg}">
          <span class="material-symbols-outlined text-[17px]">${n.icon}</span>
        </div>
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <h4 class="text-xs font-bold ${n.unread ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-700 dark:text-gray-300'} truncate">${n.title}</h4>
            <span class="text-[10px] font-mono text-slate-400 dark:text-gray-500 shrink-0">${n.time}</span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed">${n.message}</p>
        </div>
        ${n.unread ? `
          <span class="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 self-center absolute right-3" title="Unread"></span>
        ` : ''}
      </div>
    `).join('');
  }

  function createDropdownMarkup() {
    if (document.getElementById('joblex-notifications-dropdown')) return;

    const dropdown = document.createElement('div');
    dropdown.id = 'joblex-notifications-dropdown';
    dropdown.className = 'fixed right-4 sm:right-16 top-16 w-80 sm:w-96 max-w-[94vw] bg-white dark:bg-[#0c0e14] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden hidden transition-all duration-200';
    dropdown.style.backdropFilter = 'blur(16px)';

    dropdown.innerHTML = `
      <div class="p-3.5 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between bg-slate-50/50 dark:bg-gray-900/40">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px] text-purple-600 dark:text-purple-400">notifications</span>
            Notifications
          </h3>
          <span id="notif-unread-count-pill" class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60">0 Unread</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="JoblexNotifications.markAllRead()" class="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-950/40 transition">
            Mark all read
          </button>
          <button onclick="JoblexNotifications.close()" class="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition">
            ✕
          </button>
        </div>
      </div>

      <!-- Segmented Filter Tabs -->
      <div class="px-3 pt-2.5 pb-2 flex items-center gap-1 border-b border-slate-100 dark:border-gray-800/80 bg-white dark:bg-[#0c0e14]">
        <button id="notif-filter-all" onclick="JoblexNotifications.setFilter('all')" class="px-3 py-1 rounded-lg text-xs font-bold transition bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          All
        </button>
        <button id="notif-filter-unread" onclick="JoblexNotifications.setFilter('unread')" class="px-3 py-1 rounded-lg text-xs font-medium transition text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800">
          Unread Only
        </button>
      </div>

      <!-- Scrollable Message List -->
      <div id="notifications-items-list" class="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-gray-800">
        <!-- Rendered via JS -->
      </div>

      <!-- Footer Registry Link -->
      <div class="p-2.5 bg-slate-50 dark:bg-gray-900/60 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400">
        <span class="flex items-center gap-1 text-[10px] font-mono">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          NAAR Live Ledger Feed
        </span>
        <button onclick="JoblexNotifications.clearAll()" class="text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 font-medium transition">
          Clear All
        </button>
      </div>
    `;

    document.body.appendChild(dropdown);
  }

  function toggleDropdown(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const dropdown = document.getElementById('joblex-notifications-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  }

  function openDropdown() {
    const dropdown = document.getElementById('joblex-notifications-dropdown');
    if (!dropdown) return;
    renderNotificationList();
    updateBadgeUI();
    dropdown.classList.remove('hidden');
  }

  function closeDropdown() {
    const dropdown = document.getElementById('joblex-notifications-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }

  function setFilter(filter) {
    currentFilter = filter;
    const btnAll = document.getElementById('notif-filter-all');
    const btnUnread = document.getElementById('notif-filter-unread');

    if (filter === 'all') {
      if (btnAll) btnAll.className = 'px-3 py-1 rounded-lg text-xs font-bold transition bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      if (btnUnread) btnUnread.className = 'px-3 py-1 rounded-lg text-xs font-medium transition text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800';
    } else {
      if (btnAll) btnAll.className = 'px-3 py-1 rounded-lg text-xs font-medium transition text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800';
      if (btnUnread) btnUnread.className = 'px-3 py-1 rounded-lg text-xs font-bold transition bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
    }
    renderNotificationList();
  }

  async function markAllRead() {
    notifications.forEach(n => n.unread = false);
    saveNotifications();
    updateBadgeUI();
    renderNotificationList();
    try {
      const user = JSON.parse(localStorage.getItem('joblex_user') || localStorage.getItem('joblex_auth_user') || '{}');
      const recipientId = user.email || user.id || (window.location.pathname.includes('industry') ? 'usr-industry-01' : (window.location.pathname.includes('academy') ? 'usr-academy-01' : 'usr-student-01'));
      const apiBase = window.JOBLEX_API_BASE || window.JOBLEX_API_URL || '/api';
      await fetch(`${apiBase}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('joblex_token') ? { Authorization: `Bearer ${localStorage.getItem('joblex_token')}` } : {})
        }
      });
    } catch (e) {}
  }

  function clearAll() {
    notifications = [];
    saveNotifications();
    updateBadgeUI();
    renderNotificationList();
  }

  async function handleClickItem(id, link) {
    const item = notifications.find(n => n.id === id);
    if (item) {
      item.unread = false;
      saveNotifications();
      updateBadgeUI();
    }
    try {
      const apiBase = window.JOBLEX_API_BASE || window.JOBLEX_API_URL || '/api';
      await fetch(`${apiBase}/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
        headers: localStorage.getItem('joblex_token') ? { Authorization: `Bearer ${localStorage.getItem('joblex_token')}` } : {}
      });
    } catch (e) {}
    closeDropdown();
    if (link && link !== '#' && window.location.pathname.indexOf(link) === -1) {
      window.location.href = link;
    }
  }

  // Bind outside click listener
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('joblex-notifications-dropdown');
    if (!dropdown || dropdown.classList.contains('hidden')) return;

    const bellBtn = e.target.closest('#notification-bell-btn');
    if (!bellBtn && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  // Init on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
    createDropdownMarkup();
    updateBadgeUI();

    // Attach click to any notification bell buttons on the page
    document.querySelectorAll('#notification-bell-btn').forEach(btn => {
      btn.onclick = toggleDropdown;
    });
  });

  // Export public API
  window.JoblexNotifications = {
    toggle: toggleDropdown,
    open: openDropdown,
    close: closeDropdown,
    setFilter: setFilter,
    markAllRead: markAllRead,
    clearAll: clearAll,
    handleClickItem: handleClickItem,
    getUnreadCount: getUnreadCount
  };

  window.toggleNotificationsDropdown = toggleDropdown;

  /**
   * Non-blocking Toast UI Alert System
   */
  function showToast(message, title = 'Notification', type = 'info') {
    let container = document.getElementById('joblex-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'joblex-toast-container';
      container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-4 opacity-0 bg-slate-900/95 dark:bg-gray-900/95 text-white border-slate-700/80 backdrop-blur-md';

    let icon = 'notifications';
    let iconColor = 'text-purple-400';

    if (type === 'success') {
      icon = 'check_circle';
      iconColor = 'text-emerald-400';
    } else if (type === 'warning') {
      icon = 'warning';
      iconColor = 'text-amber-400';
    } else if (type === 'danger' || type === 'error') {
      icon = 'error';
      iconColor = 'text-rose-400';
    }

    toast.innerHTML = `
      <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-white/10 ${iconColor}">
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
      </div>
      <div class="flex-1 min-w-0 pr-2">
        ${title ? `<h4 class="text-xs font-bold text-white mb-0.5">${title}</h4>` : ''}
        <p class="text-[12px] text-gray-300 leading-relaxed font-normal">${message}</p>
      </div>
      <button class="toast-close-btn p-1 rounded-md text-gray-400 hover:text-white transition hover:bg-white/10 shrink-0">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    const removeToast = () => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    if (closeBtn) closeBtn.onclick = removeToast;

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(removeToast, 4500);
  }

  // Global exports and window.alert override
  window.showToast = showToast;
  window.alert = function (message) {
    let text = typeof message === 'object' ? (message?.message || JSON.stringify(message)) : String(message || '');
    let type = 'info';
    if (text.includes("Unexpected token") || text.includes('not valid JSON') || text.includes('non-JSON') || text.includes('The page could not be found')) {
      text = 'Authentication failed. Please verify your email and password or register a new account.';
      type = 'warning';
    } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed') || text.toLowerCase().includes('invalid')) {
      type = 'warning';
    }
    showToast(text, 'System Notification', type);
  };
})();

