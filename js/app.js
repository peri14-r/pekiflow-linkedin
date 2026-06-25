// Pekiflow LinkedIn Content Dashboard — Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initNavigation();
  renderDashboard();
  renderPostLibrary();
  renderCalendar();
  renderHashtags();
  renderCreatePost();
  initOutreach();
  initModal();
  initMobileMenu();
}

// ─── Navigation ───
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      switchPage(page);
    });
  });
}

function switchPage(pageId) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update pages
  document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.add('active');

  // Update header title
  const titles = {
    dashboard: '📊 Dashboard',
    library: '📚 Post Library',
    create: '✍️ Create Post',
    calendar: '📅 Content Calendar',
    hashtags: '#️⃣ Hashtag Manager',
    outreach: '✉️ Outreach Hub'
  };
  document.getElementById('page-title').textContent = titles[pageId] || 'Dashboard';

  // Close mobile menu
  document.querySelector('.sidebar')?.classList.remove('open');
}

// ─── Dashboard ───
function renderDashboard() {
  const stats = getSavedPosts();
  const copiedCount = parseInt(localStorage.getItem('pf_copied_count') || '0');

  document.getElementById('stat-total-posts').textContent = POST_LIBRARY.length;
  document.getElementById('stat-saved').textContent = stats.length;
  document.getElementById('stat-copied').textContent = copiedCount;
  document.getElementById('stat-categories').textContent = Object.keys(CATEGORIES).length;

  // Render upcoming schedule
  renderUpcomingSchedule();
}

function renderUpcomingSchedule() {
  const container = document.getElementById('upcoming-schedule');
  if (!container) return;

  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let html = '';

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = days[date.getDay()];
    const schedule = WEEKLY_SCHEDULE[dayName];

    if (schedule) {
      const catInfo = CATEGORIES[schedule.type] || {};
      html += `
        <div class="schedule-item">
          <div class="schedule-day">
            <span class="day-name">${dayName.substring(0, 3)}</span>
            <span class="day-num">${date.getDate()}</span>
          </div>
          <div class="schedule-info">
            <h4>${catInfo.icon || ''} ${catInfo.label || schedule.type}</h4>
            <p>${schedule.tip}</p>
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = html;
}

// ─── Post Library ───
let currentFilter = 'all';
let currentTargetFilter = 'all';
let searchQuery = '';

function renderPostLibrary() {
  renderFilterChips();
  renderPosts();
  initSearch();
}

function switchTargetFeed(targetFeed, element) {
  currentTargetFilter = targetFeed;
  
  // Update active state in target feed buttons
  const buttons = document.querySelectorAll('.library-controls .filter-chip');
  buttons.forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  
  renderPosts();
}

function renderFilterChips() {
  const container = document.getElementById('filter-chips');
  if (!container) return;

  let html = `<button class="filter-chip active" data-filter="all">All Categories</button>`;
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    html += `<button class="filter-chip" data-filter="${key}">${cat.icon} ${cat.label}</button>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      renderPosts();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('search-posts');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderPosts();
  });
}

function renderPosts() {
  const container = document.getElementById('posts-grid');
  if (!container) return;

  let filtered = POST_LIBRARY;

  if (currentTargetFilter !== 'all') {
    filtered = filtered.filter(p => p.target === currentTargetFilter);
  }

  if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchQuery) ||
      p.content.toLowerCase().includes(searchQuery) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i>🔍</i>
        <h4>No posts found</h4>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => {
    const cat = CATEGORIES[post.category] || {};
    const preview = post.content.substring(0, 180) + '...';
    const imageHtml = post.image ? `
      <div style="width: 100%; height: 150px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-glass); margin-bottom: 12px;">
        <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    ` : '';

    return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-card-header">
          <span class="post-category-tag" style="background: ${cat.color}15; color: ${cat.color}">
            ${cat.icon || ''} ${cat.label || post.category}
          </span>
          <span style="font-size: 12px; color: var(--text-muted)">${post.postType}</span>
        </div>
        <div class="post-card-body" onclick="openPostModal(${post.id})">
          <div class="post-card-title">${post.emoji} ${post.title}</div>
          ${imageHtml}
          <div class="post-preview">${preview}</div>
        </div>
        <div class="post-card-footer">
          <div class="post-tags">
            ${post.tags.slice(0, 3).map(t => `<span class="post-tag">${t}</span>`).join('')}
          </div>
          <div class="post-actions">
            <button class="post-action-btn" title="View" onclick="openPostModal(${post.id})">
              <i>👁️</i>
            </button>
            <button class="post-action-btn copy-btn" title="Copy to clipboard" onclick="copyPost(${post.id}, this)">
              <i>📋</i>
            </button>
            <button class="post-action-btn" title="Use as template" onclick="useAsTemplate(${post.id})">
              <i>✏️</i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Copy Post ───
function copyPost(postId, btnElement) {
  const post = POST_LIBRARY.find(p => p.id === postId);
  if (!post) return;

  navigator.clipboard.writeText(post.content).then(() => {
    // Update button state
    if (btnElement) {
      btnElement.classList.add('copied');
      const origHTML = btnElement.innerHTML;
      btnElement.innerHTML = '<i>✅</i>';
      setTimeout(() => {
        btnElement.classList.remove('copied');
        btnElement.innerHTML = origHTML;
      }, 2000);
    }

    // Track copies
    const count = parseInt(localStorage.getItem('pf_copied_count') || '0') + 1;
    localStorage.setItem('pf_copied_count', count.toString());

    // Update dashboard stat
    const statEl = document.getElementById('stat-copied');
    if (statEl) statEl.textContent = count;

    showToast('Post copied to clipboard!', 'success');
  });
}

// ─── Modal ───
function initModal() {
  const overlay = document.getElementById('post-modal');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openPostModal(postId) {
  const post = POST_LIBRARY.find(p => p.id === postId);
  if (!post) return;

  const cat = CATEGORIES[post.category] || {};

  document.getElementById('modal-title').textContent = `${post.emoji} ${post.title}`;
  document.getElementById('modal-post-content').textContent = post.content;
  document.getElementById('modal-category').innerHTML = `
    <span class="post-category-tag" style="background: ${cat.color}15; color: ${cat.color}">
      ${cat.icon} ${cat.label}
    </span>
  `;

  // Dynamic Image handling
  const imgContainer = document.getElementById('modal-image-container');
  const imgEl = document.getElementById('modal-post-image');
  if (imgContainer && imgEl) {
    if (post.image) {
      imgEl.src = post.image;
      imgContainer.style.display = 'block';
    } else {
      imgContainer.style.display = 'none';
      imgEl.src = '';
    }
  }

  // Update modal buttons
  document.getElementById('modal-copy-btn').onclick = () => {
    navigator.clipboard.writeText(post.content).then(() => {
      const count = parseInt(localStorage.getItem('pf_copied_count') || '0') + 1;
      localStorage.setItem('pf_copied_count', count.toString());
      showToast('Post copied to clipboard!', 'success');
    });
  };

  document.getElementById('modal-edit-btn').onclick = () => {
    closeModal();
    useAsTemplate(post.id);
  };

  document.getElementById('post-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('post-modal')?.classList.remove('active');
}

// ─── Use as Template ───
function useAsTemplate(postId) {
  const post = POST_LIBRARY.find(p => p.id === postId);
  if (!post) return;

  switchPage('create');

  setTimeout(() => {
    const textarea = document.getElementById('post-editor');
    if (textarea) {
      textarea.value = post.content;
      updatePreview();
      updateCharCount();
    }

    const categorySelect = document.getElementById('post-category-select');
    if (categorySelect) categorySelect.value = post.category;
  }, 100);
}

// ─── Create Post ───
function renderCreatePost() {
  renderTemplateGrid();
  initEditor();
}

function renderTemplateGrid() {
  const container = document.getElementById('template-grid');
  if (!container) return;

  container.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => `
    <div class="template-card" data-category="${key}" onclick="loadRandomTemplate('${key}', this)">
      <span class="template-emoji">${cat.icon}</span>
      <span class="template-name">${cat.label}</span>
    </div>
  `).join('');
}

function loadRandomTemplate(category, element) {
  const posts = POST_LIBRARY.filter(p => p.category === category);
  if (posts.length === 0) return;

  const randomPost = posts[Math.floor(Math.random() * posts.length)];

  // Update active state
  document.querySelectorAll('.template-card').forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');

  // Load into editor
  const textarea = document.getElementById('post-editor');
  if (textarea) {
    textarea.value = randomPost.content;
    updatePreview();
    updateCharCount();
  }

  const categorySelect = document.getElementById('post-category-select');
  if (categorySelect) categorySelect.value = category;
}

function initEditor() {
  const textarea = document.getElementById('post-editor');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    updatePreview();
    updateCharCount();
  });
}

function updatePreview() {
  const textarea = document.getElementById('post-editor');
  const preview = document.getElementById('live-preview-content');
  if (!textarea || !preview) return;

  preview.textContent = textarea.value || 'Start typing your post...';
}

function updateCharCount() {
  const textarea = document.getElementById('post-editor');
  const counter = document.getElementById('char-count');
  if (!textarea || !counter) return;

  const len = textarea.value.length;
  const max = 3000;
  counter.textContent = `${len} / ${max} characters`;
  counter.className = 'char-count';

  if (len > 2700) counter.classList.add('danger');
  else if (len > 2400) counter.classList.add('warning');
}

function copyEditorContent() {
  const textarea = document.getElementById('post-editor');
  if (!textarea || !textarea.value) return;

  navigator.clipboard.writeText(textarea.value).then(() => {
    const count = parseInt(localStorage.getItem('pf_copied_count') || '0') + 1;
    localStorage.setItem('pf_copied_count', count.toString());
    showToast('Post copied to clipboard!', 'success');
  });
}

function clearEditor() {
  const textarea = document.getElementById('post-editor');
  if (textarea) {
    textarea.value = '';
    updatePreview();
    updateCharCount();
  }
  document.querySelectorAll('.template-card').forEach(t => t.classList.remove('active'));
}

function savePost() {
  const textarea = document.getElementById('post-editor');
  if (!textarea || !textarea.value.trim()) {
    showToast('Write something first!', 'warning');
    return;
  }

  const saved = getSavedPosts();
  saved.push({
    id: Date.now(),
    content: textarea.value,
    category: document.getElementById('post-category-select')?.value || 'hook',
    createdAt: new Date().toISOString()
  });

  localStorage.setItem('pf_saved_posts', JSON.stringify(saved));

  const statEl = document.getElementById('stat-saved');
  if (statEl) statEl.textContent = saved.length;

  showToast('Post saved!', 'success');
}

function getSavedPosts() {
  try {
    return JSON.parse(localStorage.getItem('pf_saved_posts') || '[]');
  } catch {
    return [];
  }
}

// ─── Calendar ───
let calendarDate = new Date();

function renderCalendar() {
  updateCalendarHeader();
  renderCalendarGrid();
}

function updateCalendarHeader() {
  const header = document.getElementById('calendar-month-label');
  if (!header) return;

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  header.textContent = `${months[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
}

function renderCalendarGrid() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month"><span class="day-number">${daysInPrevMonth - i}</span></div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayName = dayFullNames[date.getDay()];
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const schedule = WEEKLY_SCHEDULE[dayName];
    const cat = schedule ? CATEGORIES[schedule.type] : null;

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <span class="day-number${isToday ? '' : ''}">${day}</span>
        ${cat ? `<div class="calendar-event" style="background: ${cat.color}20; color: ${cat.color}; border-left: 2px solid ${cat.color}">${cat.icon} ${cat.label}</div>` : ''}
      </div>
    `;
  }

  // Next month days
  const totalCells = firstDay + daysInMonth;
  const remaining = 42 - totalCells;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day other-month"><span class="day-number">${i}</span></div>`;
  }

  grid.innerHTML = html;
}

function prevMonth() {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
}

// ─── Hashtags ───
function renderHashtags() {
  const container = document.getElementById('hashtag-sets-grid');
  if (!container) return;

  const labels = {
    core: { label: 'Core Brand', icon: '⚡' },
    coaching: { label: 'Coaching Niche', icon: '🎯' },
    ai: { label: 'AI & Technology', icon: '🤖' },
    business: { label: 'Business Growth', icon: '📈' },
    engagement: { label: 'Engagement', icon: '💬' }
  };

  container.innerHTML = Object.entries(HASHTAG_SETS).map(([key, tags]) => {
    const info = labels[key] || { label: key, icon: '#' };
    return `
      <div class="hashtag-card">
        <h4>${info.icon} ${info.label}</h4>
        <div class="hashtag-list">
          ${tags.map(t => `<span class="hashtag">${t}</span>`).join('')}
        </div>
        <button class="copy-all-btn" onclick="copyHashtags('${key}')">
          📋 Copy All Hashtags
        </button>
      </div>
    `;
  }).join('');
}

function copyHashtags(setKey) {
  const tags = HASHTAG_SETS[setKey];
  if (!tags) return;

  navigator.clipboard.writeText(tags.join(' ')).then(() => {
    showToast('Hashtags copied!', 'success');
  });
}

// ─── Toast Notifications ───
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i>${type === 'success' ? '✅' : '⚠️'}</i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// ─── Outreach Hub ───
let currentOutreachType = 'linkedin';
let currentOutreachStep = 1;

function initOutreach() {
  renderOutreachTemplates();
  renderLeadsList();
}

function switchOutreachType(type, element) {
  currentOutreachType = type;
  currentOutreachStep = 1;

  // Toggle active styling of campaign type buttons
  const buttons = document.querySelectorAll('#btn-seq-linkedin, #btn-seq-email');
  buttons.forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');

  renderOutreachTemplates();
}

function renderOutreachTemplates() {
  const container = document.getElementById('outreach-steps-container');
  const textEl = document.getElementById('outreach-template-text');
  if (!container || !textEl) return;

  const sequence = OUTREACH_SEQUENCES[currentOutreachType] || [];
  
  // Render step select buttons
  container.innerHTML = sequence.map(item => `
    <button class="outreach-step-btn ${item.step === currentOutreachStep ? 'active' : ''}" onclick="selectOutreachStep(${item.step})">
      <div class="step-number">${item.step}</div>
      <div class="step-info">
        <h4>${item.title}</h4>
        <span>⏱️ Delay: ${item.delay}</span>
      </div>
    </button>
  `).join('');

  // Load active step content
  const activeStep = sequence.find(item => item.step === currentOutreachStep);
  if (activeStep) {
    textEl.value = activeStep.content;
  }
}

function selectOutreachStep(stepNum) {
  currentOutreachStep = stepNum;
  renderOutreachTemplates();
}

function copyOutreachTemplate() {
  const textEl = document.getElementById('outreach-template-text');
  if (!textEl || !textEl.value) return;

  navigator.clipboard.writeText(textEl.value).then(() => {
    showToast('Outreach step copied!', 'success');
  });
}

// Leads CRM database helper methods
function getSavedLeads() {
  try {
    return JSON.parse(localStorage.getItem('pf_crm_leads') || '[]');
  } catch {
    return [];
  }
}

function saveLeadsList(leads) {
  localStorage.setItem('pf_crm_leads', JSON.stringify(leads));
}

function handleAddLead(event) {
  event.preventDefault();
  const nameInput = document.getElementById('lead-name');
  const contactInput = document.getElementById('lead-contact');
  const nicheSelect = document.getElementById('lead-niche');

  if (!nameInput || !contactInput) return;

  const leads = getSavedLeads();
  leads.push({
    id: Date.now(),
    name: nameInput.value.trim(),
    contact: contactInput.value.trim(),
    niche: nicheSelect?.value || 'Mindset Coach',
    status: 'new', // new, connect, dm, follow, booked, closed
    notes: '',
    createdAt: new Date().toISOString()
  });

  saveLeadsList(leads);
  renderLeadsList();

  // Reset form
  nameInput.value = '';
  contactInput.value = '';

  showToast('Lead added to CRM!', 'success');
}

function renderLeadsList() {
  const container = document.getElementById('crm-leads-list');
  if (!container) return;

  const leads = getSavedLeads();

  if (leads.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
          <i>👥</i> No leads added yet. Fill in the form above to start tracking.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = leads.map(lead => {
    return `
      <tr data-lead-id="${lead.id}">
        <td style="font-weight: 600; color: var(--text-primary);">${lead.name}</td>
        <td><span style="color: var(--text-secondary); font-size: 12px;">${lead.niche}</span></td>
        <td>
          <span style="font-family: monospace; color: var(--text-muted); font-size: 12px; word-break: break-all;">
            ${lead.contact}
          </span>
        </td>
        <td>
          <select class="status-badge status-${lead.status}" style="border: none; padding: 4px 6px; outline: none; cursor: pointer;" onchange="updateLeadStatus(${lead.id}, this.value)">
            <option value="new" class="status-new" ${lead.status === 'new' ? 'selected' : ''}>New Lead</option>
            <option value="connect" class="status-connect" ${lead.status === 'connect' ? 'selected' : ''}>LI Connect Sent</option>
            <option value="dm" class="status-dm" ${lead.status === 'dm' ? 'selected' : ''}>First pitch DM</option>
            <option value="follow" class="status-follow" ${lead.status === 'follow' ? 'selected' : ''}>Followed up</option>
            <option value="booked" class="status-booked" ${lead.status === 'booked' ? 'selected' : ''}>Call Booked</option>
            <option value="closed" class="status-closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed Win</option>
          </select>
        </td>
        <td>
          <button class="post-action-btn" title="Delete lead" style="border-color: rgba(239, 68, 68, 0.2); color: var(--accent-red);" onclick="deleteLead(${lead.id})">
            ✕
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateLeadStatus(leadId, newStatus) {
  const leads = getSavedLeads();
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
    lead.status = newStatus;
    saveLeadsList(leads);
    renderLeadsList();
    showToast('Lead status updated!', 'success');
  }
}

function deleteLead(leadId) {
  if (confirm('Are you sure you want to remove this lead?')) {
    let leads = getSavedLeads();
    leads = leads.filter(l => l.id !== leadId);
    saveLeadsList(leads);
    renderLeadsList();
    showToast('Lead deleted.', 'warning');
  }
}

// ─── Mobile Menu ───
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });
  }
}

function toggleMobileMenu() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}
