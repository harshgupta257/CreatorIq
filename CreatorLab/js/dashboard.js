/* ════════════════════════════════════════════════════════════
   CreatorIQ Dashboard — JavaScript
   ════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════
   GLOBAL STATE
═══════════════════════════════════════ */
const State = {
  channel: null,
  channelId: null,
  allVideos: [],
  engagementChart: null,
  realVideosLoaded: false,
  realDataLoaded: false,
  instagramConnected: false,
  chartsInitialized: {},
  dateRange: '30D',
  activeTab: 'overview',
};

/* ═══════════════════════════════════════
   CHART.JS DEFAULTS
═══════════════════════════════════════ */
Chart.defaults.color = '#8b8fa8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

/* ═══════════════════════════════════════
   DEMO DATA
═══════════════════════════════════════ */
const DEMO = {
  engagement: {
    labels: (() => {
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      return days;
    })(),
    views:    [820,950,780,1100,1350,1020,1500,1800,2100,1750,1900,2300,2100,2450,2700,2500,2900,3100,2800,3300,3600,3200,3800,4100,3900,4300,4600,4200,4800,5100].map(v => v * 1000),
    likes:    [18,22,17,25,31,24,35,42,48,40,44,53,49,57,63,58,67,72,65,77,84,74,88,95,91,100,107,97,111,118].map(v => v * 100),
    comments: [3,4,3,5,6,4,7,8,9,8,9,10,9,11,12,11,13,14,12,15,16,14,17,18,17,19,21,19,22,24].map(v => v * 100),
  },

  sentiment: {
    positive: 68,
    neutral: 22,
    negative: 10,
  },

  topVideos: {
    labels: ['JS Mastery', 'React 19', 'Next.js 15', 'Python AI', 'CSS Tips', 'Node APIs'],
    values: [4.8, 3.9, 3.5, 3.1, 2.8, 2.4],
  },

  videos: [
    { title: 'JavaScript Mastery — Full Course 2026', views: '4.8M', likes: '124K', comments: '8.4K', engagement: '9.2%', sentiment: 'Positive', status: 'live' },
    { title: 'React 19 — Everything You Need to Know', views: '3.9M', likes: '98K', comments: '6.1K', engagement: '8.7%', sentiment: 'Positive', status: 'live' },
    { title: 'Build a SaaS with Next.js 15 & Stripe', views: '3.5M', likes: '87K', comments: '5.8K', engagement: '8.1%', sentiment: 'Neutral', status: 'live' },
    { title: 'Python for Data Science — Full Roadmap', views: '3.1M', likes: '76K', comments: '4.9K', engagement: '7.4%', sentiment: 'Positive', status: 'live' },
    { title: '10 CSS Tricks You Didn\'t Know Existed', views: '2.8M', likes: '64K', comments: '3.7K', engagement: '6.9%', sentiment: 'Positive', status: 'live' },
    { title: 'Node.js API Design — Best Practices', views: '2.4M', likes: '58K', comments: '3.2K', engagement: '6.3%', sentiment: 'Neutral', status: 'live' },
    { title: 'TypeScript Deep Dive — Advanced Types', views: '1.9M', likes: '47K', comments: '2.8K', engagement: '5.8%', sentiment: 'Negative', status: 'live' },
    { title: 'Deploying to AWS — Step by Step Guide', views: '1.6M', likes: '39K', comments: '2.1K', engagement: '5.2%', sentiment: 'Positive', status: 'live' },
  ],

  sentimentTimeline: {
    labels: (() => {
      const d = [];
      for (let i = 29; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        d.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      return d;
    })(),
    youtube:  [68,70,72,69,71,73,74,72,75,73,76,74,77,75,72,74,76,78,76,79,77,80,78,81,79,82,80,78,81,82],
    reddit:   [55,57,56,58,59,57,60,58,62,60,63,61,58,60,62,63,65,64,67,65,68,66,69,67,70,68,66,69,71,72],
    news:     [78,80,79,81,80,82,83,81,84,82,85,83,81,83,85,86,84,87,85,88,86,89,87,85,88,90,88,91,89,87],
  },

  trends: {
    labels: (() => {
      const d = [];
      for (let i = 11; i >= 0; i--) {
        const dt = new Date();
        dt.setMonth(dt.getMonth() - i);
        d.push(dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      }
      return d;
    })(),
    javascript: [45,52,48,61,58,67,63,72,69,78,74,82],
    react:      [38,44,41,53,49,58,55,64,60,71,67,75],
    python:     [55,60,57,66,63,72,68,77,74,83,79,87],
  },

  competitors: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    you:   [820, 940, 1020, 1190, 1310, 1480, 1640],
    comp1: [750, 800, 870, 920, 980, 1050, 1090],
    comp2: [430, 490, 520, 570, 610, 650, 680],
  },

  radar: {
    labels: ['Tutorials', 'Reviews', 'Opinions', 'Projects', 'Shorts', 'Vlogs'],
    you:   [90, 78, 72, 85, 68, 55],
    avg:   [65, 70, 60, 72, 75, 68],
  },

  wordCloud: [
    { text: 'amazing', weight: 5, color: '#4ade80' },
    { text: 'helpful', weight: 4, color: '#22d3ee' },
    { text: 'tutorial', weight: 4, color: '#6C63FF' },
    { text: 'love it', weight: 3, color: '#a78bfa' },
    { text: 'perfect', weight: 3, color: '#34d399' },
    { text: 'JavaScript', weight: 5, color: '#facc15' },
    { text: 'best channel', weight: 4, color: '#6C63FF' },
    { text: 'React', weight: 3, color: '#61dafb' },
    { text: 'awesome', weight: 5, color: '#4ade80' },
    { text: 'Next.js', weight: 3, color: '#ffffff' },
    { text: 'subscribe', weight: 2, color: '#ff4444' },
    { text: 'quality', weight: 3, color: '#22d3ee' },
    { text: 'underrated', weight: 2, color: '#fb923c' },
    { text: 'clear', weight: 3, color: '#a3e635' },
    { text: 'beginner', weight: 2, color: '#8b8fa8' },
    { text: 'advanced', weight: 2, color: '#f472b6' },
    { text: 'code', weight: 4, color: '#6C63FF' },
    { text: 'exciting', weight: 2, color: '#4ade80' },
    { text: 'boring', weight: 1, color: '#f87171' },
    { text: 'confusing', weight: 1, color: '#f87171' },
    { text: 'too fast', weight: 1, color: '#fb923c' },
  ],

  positiveComments: [
    { text: '"This is the best JavaScript tutorial I\'ve ever seen. Subscribed immediately after the first 5 minutes!"', source: 'yt', likes: '2.4K' },
    { text: '"Your channel helped me land my first dev job. Can\'t thank you enough for this content."', source: 'reddit', likes: '1.8K' },
    { text: '"Incredible production quality and depth of explanation. This is what YouTube was made for."', source: 'news', likes: '934' },
    { text: '"I\'ve been coding for 3 years and still learned 10 new things from this video. Absolute gem."', source: 'yt', likes: '761' },
  ],

  negativeComments: [
    { text: '"The audio quality in the last video was quite poor. Hard to follow the explanations."', source: 'yt', likes: '312' },
    { text: '"Too many sponsor segments. I get that you need income but it breaks the flow too much."', source: 'reddit', likes: '284' },
    { text: '"This felt very rushed compared to previous videos. Please slow down on complex topics."', source: 'yt', likes: '198' },
    { text: '"Some concepts were skipped over too quickly. Would have appreciated more depth here."', source: 'yt', likes: '143' },
  ],

  igPosts: [
    { emoji: '💻', bg: 'linear-gradient(135deg,#1a1c28,#252838)', likes: '12.4K', comments: '847' },
    { emoji: '🚀', bg: 'linear-gradient(135deg,#1e0a2e,#2d1054)', likes: '9.8K', comments: '612' },
    { emoji: '⚡', bg: 'linear-gradient(135deg,#0a1a1e,#0d3340)', likes: '11.2K', comments: '724' },
    { emoji: '🎯', bg: 'linear-gradient(135deg,#1a2210,#2a3818)', likes: '8.4K', comments: '531' },
    { emoji: '🔥', bg: 'linear-gradient(135deg,#2a0a0a,#4a1010)', likes: '15.1K', comments: '1.2K' },
    { emoji: '📱', bg: 'linear-gradient(135deg,#0a1a2a,#102840)', likes: '7.9K', comments: '489' },
    { emoji: '🌟', bg: 'linear-gradient(135deg,#1a1508,#2e2810)', likes: '10.6K', comments: '681' },
    { emoji: '🎨', bg: 'linear-gradient(135deg,#1a0a1e,#2d1048)', likes: '13.2K', comments: '892' },
  ],
};

/* ═══════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════ */
function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

function animateCounter(el, target, suffix = '', duration = 1800) {
  const start = 0;
  const startTime = performance.now();
  const isDecimal = target < 1000;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    if (isDecimal) {
      el.textContent = (eased * (target / 10)).toFixed(1) + '%';
    } else if (suffix === '/100') {
      el.textContent = Math.floor(eased * (target / 10)) + '/100';
    } else {
      el.textContent = formatNumber(current);
    }

    if (progress < 1) requestAnimationFrame(update);
    else {
      if (isDecimal) {
        el.textContent = (target / 10).toFixed(1) + '%';
      } else if (suffix === '/100') {
        el.textContent = Math.floor(target / 10) + '/100';
      } else {
        el.textContent = formatNumber(target);
      }
    }
  }
  requestAnimationFrame(update);
}

function getGradient(ctx, color1, color2, height = 300) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  return grad;
}

/* ═══════════════════════════════════════
   SIDEBAR TOGGLE
═══════════════════════════════════════ */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const mainWrapper = document.getElementById('mainWrapper');

  if (!sidebar || !toggle) return;

  toggle.addEventListener('click', () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  // Close sidebar on mobile overlay click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });

  // Sync sidebar nav items with tab buttons
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      switchTab(tab);
      if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
    });
  });
}

/* ═══════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════ */
function switchTab(tabName) {
  // Update content
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(`tab-${tabName}`);
  if (target) target.classList.add('active');

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-target="${tabName}"]`);
  if (btn) btn.classList.add('active');

  // Update nav items
  document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (navItem) navItem.classList.add('active');

  State.activeTab = tabName;

  // Lazy-initialize tab charts
  setTimeout(() => initTabCharts(tabName), 80);
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });

  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.dateRange = btn.textContent;
    });
  });
}

/* ═══════════════════════════════════════
   KPI CARDS SETUP
═══════════════════════════════════════ */
function initKPICards() {
  const cards = document.querySelectorAll('.kpi-card');
  cards.forEach(card => {
    const valueEl = card.querySelector('.kpi-value');
    if (!valueEl) return;
    const target = parseInt(valueEl.dataset.target);
    const suffix = valueEl.dataset.suffix || '';
    if (!isNaN(target)) animateCounter(valueEl, target, suffix, 2000);
  });
}

/* ═══════════════════════════════════════
   SPARKLINE CHARTS
═══════════════════════════════════════ */
function initSparklines() {
  const configs = [
    { id: 'spark1', data: [820,950,780,1100,1350,1020,1500,1800,2100,1750,2100,2450], color: '#6C63FF' },
    { id: 'spark2', data: [1190,1195,1200,1204,1208,1212,1215,1218,1222,1228,1234,1240], color: '#22d3ee' },
    { id: 'spark3', data: [7.8,7.9,8.0,7.8,8.1,8.2,8.3,8.1,8.4,8.3,8.5,8.47], color: '#4ade80' },
    { id: 'spark4', data: [82,80,81,83,80,79,81,82,80,79,80,78.2], color: '#fb923c' },
  ];

  configs.forEach(cfg => {
    const canvas = document.getElementById(cfg.id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grad = getGradient(ctx, `${cfg.color}40`, `${cfg.color}00`, 36);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: cfg.data.map((_, i) => i),
        datasets: [{
          data: cfg.data,
          borderColor: cfg.color,
          borderWidth: 2,
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }]
      },
      options: {
        responsive: false,
        animation: { duration: 1200 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      }
    });
  });
}

/* ═══════════════════════════════════════
   OVERVIEW CHARTS
═══════════════════════════════════════ */
function initOverviewCharts() {
  if (State.chartsInitialized.overview) return;
  State.chartsInitialized.overview = true;

  // ── Engagement Over Time ──
  const engCtx = document.getElementById('engagementChart');
  if (engCtx) {
    const ctx = engCtx.getContext('2d');
    const viewsGrad = getGradient(ctx, 'rgba(108,99,255,0.3)', 'rgba(108,99,255,0)', 260);
    const likesGrad = getGradient(ctx, 'rgba(34,211,238,0.2)', 'rgba(34,211,238,0)', 260);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: DEMO.engagement.labels,
        datasets: [
          {
            label: 'Views',
            data: DEMO.engagement.views,
            borderColor: '#6C63FF',
            backgroundColor: viewsGrad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#6C63FF',
          },
          {
            label: 'Likes',
            data: DEMO.engagement.likes,
            borderColor: '#22d3ee',
            backgroundColor: likesGrad,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#22d3ee',
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12, boxHeight: 3,
              color: '#8b8fa8',
              font: { size: 12 },
              usePointStyle: true,
            }
          },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { maxTicksLimit: 8, font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { callback: v => formatNumber(v), font: { size: 11 } },
          }
        }
      }
    });
  }

  // ── Sentiment Donut ──
  const sdCtx = document.getElementById('sentimentDonut');
  if (sdCtx) {
    new Chart(sdCtx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [68, 22, 10],
          backgroundColor: ['#4ade80', '#374151', '#f87171'],
          borderColor: '#13151e',
          borderWidth: 4,
          hoverBorderWidth: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: { label: c => ` ${c.label}: ${c.parsed}%` }
          }
        },
        animation: { animateRotate: true, duration: 1400 },
      }
    });
  }

  // ── Top Videos Bar ──
  const tvCtx = document.getElementById('topVideosBar');
  if (tvCtx) {
    const ctx = tvCtx.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: DEMO.topVideos.labels,
        datasets: [{
          label: 'Views (M)',
          data: DEMO.topVideos.values,
          backgroundColor: [
            'rgba(108,99,255,0.85)',
            'rgba(108,99,255,0.75)',
            'rgba(108,99,255,0.65)',
            'rgba(108,99,255,0.55)',
            'rgba(108,99,255,0.45)',
            'rgba(108,99,255,0.35)',
          ],
          borderColor: 'rgba(108,99,255,0.9)',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: { label: c => ` ${c.parsed.x}M views` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { callback: v => `${v}M`, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          }
        },
        animation: { duration: 1200 },
      }
    });
  }
}

/* ═══════════════════════════════════════
   YOUTUBE TAB
═══════════════════════════════════════ */
function initYouTubeTab() {
  if (State.chartsInitialized.youtube) return;
  State.chartsInitialized.youtube = true;

  // Only fill with demo if real data hasn't loaded yet
  const tbody = document.getElementById('videoTableBody');
  if (tbody && !State.realVideosLoaded) {
    DEMO.videos.forEach(v => {
      const sentClass = v.sentiment === 'Positive' ? 'pos' : v.sentiment === 'Negative' ? 'neg' : 'neu';
      const gradients = [
        'linear-gradient(135deg,#1a1c28,#252838)',
        'linear-gradient(135deg,#1e0a2e,#2d1054)',
        'linear-gradient(135deg,#0a1a1e,#0d3340)',
        'linear-gradient(135deg,#1a2210,#2a3818)',
      ];
      const bg = gradients[Math.floor(Math.random() * gradients.length)];
      const emojis = ['💻','🚀','⚡','🎯','🔥','📱','🌟','🎨'];
      const em = emojis[Math.floor(Math.random() * emojis.length)];

      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>
            <div class="vid-info">
              <div class="vid-thumb" style="background:${bg};">
                <span style="font-size:1.2rem;">${em}</span>
              </div>
              <span class="vid-title">${v.title}</span>
            </div>
          </td>
          <td style="color:#f0f2ff;font-weight:600;">${v.views}</td>
          <td>${v.likes}</td>
          <td>${v.comments}</td>
          <td style="color:#6C63FF;font-weight:600;">${v.engagement}</td>
          <td><span class="sentiment-pill ${sentClass}">${v.sentiment}</span></td>
          <td><div class="status-live">Live</div></td>
        </tr>
      `);
    });
  }

  // Posting Heatmap — only random if real data not loaded
  if (!State.realVideosLoaded) {
    buildHeatmap('postingHeatmap', 7, 12, true);
  }
}

/* ═══════════════════════════════════════
   HEATMAP BUILDER
═══════════════════════════════════════ */
function buildHeatmap(containerId, rows, cols, isPosting = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am', '2am', '4am'];

  container.style.gridTemplateColumns = `36px repeat(${cols}, 1fr)`;

  // Header row
  container.insertAdjacentHTML('beforeend', '<div style="grid-column:1;"></div>');
  hours.forEach(h => {
    container.insertAdjacentHTML('beforeend', `<div style="font-size:0.6rem;color:#52566b;text-align:center;padding-bottom:4px;">${h}</div>`);
  });

  // Data rows
  days.forEach((day, di) => {
    container.insertAdjacentHTML('beforeend', `<div style="font-size:0.65rem;color:#52566b;display:flex;align-items:center;">${day}</div>`);
    for (let ci = 0; ci < cols; ci++) {
      const intensity = Math.random();
      const highlight = isPosting && di === 1 && (ci === 5 || ci === 6); // Tue 4-6pm
      const opacity = highlight ? 1 : intensity * 0.85 + 0.05;
      const color = highlight
        ? `rgba(108,99,255,${opacity})`
        : `rgba(108,99,255,${opacity * 0.7})`;

      container.insertAdjacentHTML('beforeend', `
        <div style="
          background:${color};
          border-radius:4px;
          height:22px;
          transition:all 0.2s;
          cursor:pointer;
          ${highlight ? 'box-shadow:0 0 8px rgba(108,99,255,0.6);' : ''}
        " title="${day} ${hours[ci]}: ${Math.round(intensity * 100)} posts"></div>
      `);
    }
  });
}

/* ═══════════════════════════════════════
   SENTIMENT TAB
═══════════════════════════════════════ */
function initSentimentTab() {
  if (State.chartsInitialized.sentiment) return;
  State.chartsInitialized.sentiment = true;

  // Gauge Charts
  initGauge('gauge1', 72, '#4ade80');
  initGauge('gauge2', 58, '#facc15');
  initGauge('gauge3', 81, '#6C63FF');

  // Animate gauge values
  animateGaugeVal('gaugeVal1', 72);
  animateGaugeVal('gaugeVal2', 58);
  animateGaugeVal('gaugeVal3', 81);

  // Word Cloud
  buildWordCloud();

  // Sentiment Timeline
  const stCtx = document.getElementById('sentimentTimeline');
  if (stCtx) {
    const ctx = stCtx.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: DEMO.sentimentTimeline.labels,
        datasets: [
          {
            label: 'YouTube',
            data: DEMO.sentimentTimeline.youtube,
            borderColor: '#ff4444',
            backgroundColor: 'rgba(255,68,68,0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Reddit',
            data: DEMO.sentimentTimeline.reddit,
            borderColor: '#ff4500',
            backgroundColor: 'rgba(255,69,0,0.06)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'News',
            data: DEMO.sentimentTimeline.news,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34,211,238,0.06)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { boxWidth: 12, color: '#8b8fa8', font: { size: 11 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 7, font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, min: 40, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } } }
        }
      }
    });
  }

  // Comments
  buildComments();
}

function initGauge(canvasId, value, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const pct = value / 100;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [pct * 100, 100 - pct * 100],
        backgroundColor: [color, 'rgba(255,255,255,0.06)'],
        borderColor: 'transparent',
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }]
    },
    options: {
      responsive: false,
      cutout: '78%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 1400 },
    }
  });
}

function animateGaugeVal(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = target / 40;
  const interval = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.round(cur);
    if (cur >= target) clearInterval(interval);
  }, 40);
}

function buildWordCloud() {
  const container = document.getElementById('wordCloud');
  if (!container) return;

  DEMO.wordCloud.forEach(word => {
    const sizes = ['0.75rem', '0.85rem', '0.95rem', '1.1rem', '1.3rem'];
    const size = sizes[Math.min(word.weight - 1, sizes.length - 1)];
    container.insertAdjacentHTML('beforeend', `
      <span style="
        font-size:${size};
        color:${word.color};
        font-weight:${word.weight >= 4 ? 700 : 500};
        padding:4px 8px;
        border-radius:6px;
        background:${word.color}15;
        cursor:pointer;
        transition:all 0.2s;
        display:inline-block;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${word.text}</span>
    `);
  });
}

function buildComments() {
  const posContainer = document.getElementById('posComments');
  const negContainer = document.getElementById('negComments');

  if (posContainer) {
    DEMO.positiveComments.forEach(c => {
      posContainer.insertAdjacentHTML('beforeend', `
        <div class="comment-card pos-card">
          <div class="comment-text">${c.text}</div>
          <div class="comment-meta">
            <span class="comment-source ${c.source}">${c.source === 'yt' ? 'YouTube' : c.source === 'reddit' ? 'Reddit' : 'News'}</span>
            <span class="comment-likes">👍 ${c.likes}</span>
          </div>
        </div>
      `);
    });
  }

  if (negContainer) {
    DEMO.negativeComments.forEach(c => {
      negContainer.insertAdjacentHTML('beforeend', `
        <div class="comment-card neg-card">
          <div class="comment-text">${c.text}</div>
          <div class="comment-meta">
            <span class="comment-source ${c.source}">${c.source === 'yt' ? 'YouTube' : c.source === 'reddit' ? 'Reddit' : 'News'}</span>
            <span class="comment-likes">👎 ${c.likes}</span>
          </div>
        </div>
      `);
    });
  }
}

/* ═══════════════════════════════════════
   PREDICTIONS TAB
═══════════════════════════════════════ */
function initPredictionsTab() {
  if (State.chartsInitialized.predictions) return;
  State.chartsInitialized.predictions = true;

  // Viral Score Animation
  const viralProgress = document.getElementById('viralProgress');
  const viralScoreNum = document.getElementById('viralScoreNum');
  const targetScore = 87;
  const circumference = 502;

  if (viralProgress && viralScoreNum) {
    let currentScore = 0;
    const totalSteps = 60;
    const step = targetScore / totalSteps;
    let frame = 0;

    function animateViral() {
      frame++;
      currentScore = Math.min(currentScore + step, targetScore);
      const offset = circumference - (circumference * currentScore / 100);
      viralProgress.style.strokeDashoffset = offset;
      viralScoreNum.textContent = Math.round(currentScore);
      if (frame < totalSteps) requestAnimationFrame(animateViral);
    }
    setTimeout(() => requestAnimationFrame(animateViral), 300);
  }
  // Full data rendering is handled by updatePredictionsTab(data) when API responds
}

function updatePredictionsTab(data) {
  if (!data) return;


  const limited = data.limited_data === true;
  const viralData   = data.viral_potential_score || {};
  const score       = Math.round(viralData.score || 0);
  const scoreLabel  = viralData.label || '';
  const bestTime    = data.recommended_posting_time || {};
  const titleData   = data.title_pattern_insights || {};
  const topicPerf   = data.topic_performance || [];
  const durationData = data.duration_sweet_spot || {};
  const growthData  = data.growth_forecast || {};
  const predictions = data.video_predictions || [];
  const topics      = data.recommended_topics || [];
  const trainingRes = data.training_result || {};

  // ── Limited data warning ──────────────────────────────────────────────────
  const banner = document.getElementById('mlLimitedDataBanner');
  if (banner) banner.style.display = limited ? 'flex' : 'none';

  // ── Viral Score Circle (animated) ────────────────────────────────────────
  const viralScoreNum = document.getElementById('viralScoreNum');
  const viralProgress = document.getElementById('viralProgress');
  if (viralScoreNum && viralProgress) {
    const circumference = 2 * Math.PI * 80;
    let frame = 0, totalSteps = 60;
    function animateViral() {
      frame++;
      const currentScore = score * (frame / totalSteps);
      const offset = circumference - (circumference * currentScore / 100);
      viralProgress.style.strokeDashoffset = offset;
      viralScoreNum.textContent = Math.round(currentScore);
      if (frame < totalSteps) requestAnimationFrame(animateViral);
    }
    setTimeout(() => requestAnimationFrame(animateViral), 300);
  }

  // Viral tags
  const viralTagsEl = document.getElementById('viralTags');
  if (viralTagsEl) {
    const color  = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171';
    const limited_note = (limited || viralData.limited_data) ? '<span class="vtag" style="background:rgba(250,204,21,0.1);color:#facc15;border-color:rgba(250,204,21,0.3);">⚠️ Est.</span>' : '';
    viralTagsEl.innerHTML = `
      <span class="vtag" style="background:rgba(108,99,255,0.1);color:${color};border:1px solid ${color}40;">${scoreLabel}</span>
      <span class="vtag" style="background:rgba(34,211,238,0.08);color:#22d3ee;">${score >= 70 ? 'Going Viral' : score >= 40 ? 'Growing' : 'Needs Work'}</span>
      ${limited_note}`;
  }

  // ── Hero Stat Cards ───────────────────────────────────────────────────────
  // Best Upload Day
  const dayEl  = document.getElementById('mlBestDay');
  const hourEl = document.getElementById('mlBestHour');
  if (dayEl && bestTime.best_day) {
    dayEl.textContent  = bestTime.best_day;
    const h    = bestTime.best_hour_utc || 0;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr   = h % 12 || 12;
    if (hourEl) hourEl.textContent = `${hr}:00 ${ampm} UTC · Based on ${bestTime.based_on_videos || 0} videos`;
  }

  // Sweet Spot Duration
  const durEl  = document.getElementById('mlBestDuration');
  const durNote = document.getElementById('mlDurationNote');
  if (durEl && durationData.best_range) {
    durEl.textContent  = durationData.best_range;
    if (durNote) durNote.textContent = durationData.recommendation || '';
  }

  // Top Performing Topic
  const topTopicEl   = document.getElementById('mlTopTopic');
  const topTopicViews = document.getElementById('mlTopTopicViews');
  if (topTopicEl && topicPerf.length) {
    const top = topicPerf[0];
    topTopicEl.textContent = top.topic;
    if (topTopicViews) topTopicViews.textContent = `Avg ${formatNumber(top.avg_views)} views · ${top.video_count} videos`;
  }

  // Projected Views/Week
  const weeklyEl = document.getElementById('mlWeeklyViews');
  if (weeklyEl && growthData.slope_views_week) {
    weeklyEl.textContent = formatNumber(Math.abs(growthData.slope_views_week));
  }

  // Best Title Length
  const titleLenEl  = document.getElementById('mlBestTitleLen');
  const titleNoteEl = document.getElementById('mlTitleNote');
  if (titleLenEl && titleData.best_length_bucket) {
    titleLenEl.textContent = titleData.best_length_bucket;
    const boosts = [];
    if (titleData.numbers_boost_pct > 5) boosts.push(`Numbers: +${titleData.numbers_boost_pct}%`);
    if (titleData.questions_boost_pct > 5) boosts.push(`Questions: +${titleData.questions_boost_pct}%`);
    if (titleNoteEl) titleNoteEl.textContent = boosts.length ? boosts.join(' · ') : 'Analysed from your history';
  }

  // ML Model Type
  const modelTypeEl = document.getElementById('mlModelType');
  const modelNoteEl = document.getElementById('mlModelNote');
  if (modelTypeEl) {
    const mType = trainingRes.status === 'trained' ? 'RF + GBR' : 'Heuristic';
    modelTypeEl.textContent = mType;
    if (modelNoteEl) {
      modelNoteEl.textContent = trainingRes.status === 'trained'
        ? `R²=${trainingRes.r2_score || '?'} · ${trainingRes.samples || 0} videos`
        : limited ? '⚠️ < 10 videos — estimates only' : 'Statistical model';
    }
  }

  // ── Title Intelligence Card ───────────────────────────────────────────────
  const titleArea = document.getElementById('titleIntelligenceArea');
  if (titleArea) {
    if (titleData.limited_data) {
      titleArea.innerHTML = `<div style="padding:16px;background:rgba(250,204,21,0.06);border-radius:8px;border:1px solid rgba(250,204,21,0.2);font-size:13px;color:#facc15;">
        ⚠️ Limited data — upload more videos for personalised title analysis.
      </div>`;
    } else {
      const words = (titleData.top_title_words || []).slice(0, 8);
      const best  = titleData.best_example || {};

      const boostRow = (label, pct) => {
        const positive = pct >= 0;
        const color    = positive ? (pct > 5 ? '#4ade80' : '#8b8fa8') : '#f87171';
        const sign     = pct >= 0 ? '+' : '';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="font-size:13px;color:#d0d3e8;">${label}</span>
          <span style="font-size:13px;font-weight:700;color:${color};">${sign}${pct}%</span>
        </div>`;
      };

      titleArea.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div style="font-size:11px;color:#52566b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Impact on Your Views</div>
            ${boostRow('Numbers in title', titleData.numbers_boost_pct || 0)}
            ${boostRow('Question titles', titleData.questions_boost_pct || 0)}
            ${boostRow('Colon/Pipe separator', titleData.has_colon_boost_pct || 0)}
          </div>
          <div>
            <div style="font-size:11px;color:#52566b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Power Words (by avg views)</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${words.map(w => `<span style="padding:3px 10px;border-radius:20px;font-size:11px;background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.25);color:#a8a4ff;"
                title="Avg ${formatNumber(w.avg_views)} views in ${w.count} videos">${w.word}</span>`).join('')}
            </div>
          </div>
        </div>
        ${best.title ? `<div style="margin-top:14px;padding:10px 14px;background:rgba(74,222,128,0.06);border-radius:8px;border-left:3px solid #4ade80;">
          <div style="font-size:10px;color:#52566b;text-transform:uppercase;letter-spacing:.06em;">🏆 Your Best Performing Video</div>
          <div style="font-size:13px;color:#d0d3e8;margin-top:4px;">"${best.title}"</div>
          <div style="font-size:12px;color:#4ade80;margin-top:2px;">${formatNumber(best.views)} views</div>
        </div>` : ''}`;
    }
  }

  // ── Topic Performance Bar Chart (real tags) ───────────────────────────────
  const topicCanvas = document.getElementById('topicPerformanceChart');
  if (topicCanvas && topicPerf.length) {
    const ex = Chart.getChart(topicCanvas); if (ex) ex.destroy();
    const top8 = topicPerf.slice(0, 8);
    new Chart(topicCanvas, {
      type: 'bar',
      data: {
        labels:   top8.map(t => t.topic),
        datasets: [{
          data:            top8.map(t => t.avg_views),
          backgroundColor: top8.map((_, i) => `hsla(${240 - i * 20}, 70%, 65%, 0.75)`),
          borderRadius:    6,
          borderSkipped:   false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
            callbacks: { label: c => ` ${formatNumber(c.parsed.x)} avg views` } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', callback: v => formatNumber(v) } },
          y: { grid: { display: false }, ticks: { color: '#d0d3e8', font: { size: 11 } } }
        }
      }
    });
  } else if (topicCanvas && !topicPerf.length) {
    topicCanvas.parentElement.innerHTML = `<div style="text-align:center;padding:60px 0;font-size:13px;color:#52566b;">No tag data available yet.</div>`;
  }

  // ── Growth Forecast Chart ─────────────────────────────────────────────────
  const growthCanvas = document.getElementById('growthForecastChart');
  if (growthCanvas) {
    const ex = Chart.getChart(growthCanvas); if (ex) ex.destroy();
    const historical = growthData.historical || [];
    const forecast   = growthData.forecast_points || [];

    if (!historical.length && !forecast.length) {
      growthCanvas.parentElement.innerHTML = `<div style="text-align:center;padding:60px 0;font-size:13px;color:#52566b;">⚠️ Not enough data for growth forecast yet.</div>`;
    } else {
      const histLabels = historical.map((h, i) => i === 0 ? 'Start' : `Wk ${Math.round(h.week)}`);
      const histVals   = historical.map(h => h.cum_views);
      const foreLabels = forecast.map(f => f.label);
      const foreVals   = forecast.map(f => f.predicted_cum_views);

      const allLabels = [...histLabels, ...foreLabels];
      const allVals   = [...histVals, ...Array(foreLabels.length).fill(null)];
      const foreOnly  = [...Array(histLabels.length).fill(null), histVals[histVals.length - 1], ...foreVals.slice(1)];

      new Chart(growthCanvas, {
        data: {
          labels: allLabels,
          datasets: [
            {
              type: 'line', label: 'Historical (Cumulative Views)',
              data:          allVals,
              borderColor:   '#6C63FF', backgroundColor: 'rgba(108,99,255,0.12)',
              fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2,
              spanGaps: false,
            },
            {
              type: 'line', label: 'Est. Projection',
              data:           foreOnly,
              borderColor:    '#facc15', backgroundColor: 'rgba(250,204,21,0.06)',
              borderDash:     [6, 4], fill: true, tension: 0.3, pointRadius: 2, borderWidth: 2,
              spanGaps: false,
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8b8fa8', font: { size: 11 }, boxWidth: 14 } },
            tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
              callbacks: { label: c => ` ${formatNumber(c.parsed.y)} cum. views` } }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', maxTicksLimit: 10 } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', callback: v => formatNumber(v) } }
          }
        }
      });
    }
  }

  // ── Upload Time Heatmap (real data) ───────────────────────────────────────
  const heatmapData = bestTime.heatmap || {};
  buildTimeHeatmap(heatmapData, bestTime.best_day_idx, bestTime.best_hour_utc);

  // ── Video Predictions Table ───────────────────────────────────────────────
  const predEl = document.getElementById('mlVideoRecommendations');
  if (predEl && predictions.length) {
    predEl.innerHTML = predictions.slice(0, 5).map((p, i) => {
      const conf    = Math.round((p.confidence || 0) * 100);
      const confColor = conf >= 70 ? '#4ade80' : conf >= 45 ? '#facc15' : '#f87171';
      const predViews = formatNumber(p.predicted_views || 0);
      const actualV   = p.actual_views ? formatNumber(p.actual_views) : null;
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="font-size:18px;font-weight:800;color:#52566b;min-width:22px;">${i + 1}</div>
        ${p.thumbnail ? `<img src="${p.thumbnail}" style="width:52px;height:36px;object-fit:cover;border-radius:6px;">` : ''}
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:#d0d3e8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title || 'Untitled'}</div>
          <div style="font-size:11px;color:#52566b;margin-top:2px;">
            ${actualV ? `Actual: ${actualV} · ` : ''}Predicted: <strong style="color:#6C63FF">${predViews}</strong> views
          </div>
        </div>
        <div style="text-align:right;min-width:60px;">
          <div style="font-size:13px;font-weight:700;color:${confColor};">${conf}%</div>
          <div style="font-size:10px;color:#52566b;">confidence</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Content Recommendations ───────────────────────────────────────────────
  const recsEl = document.getElementById('contentRecsArea');
  if (recsEl) {
    const proven   = topics.filter(t => t.type === 'proven');
    const trending = topics.filter(t => t.type === 'trending');
    const all      = [...proven, ...trending].slice(0, 8);

    if (!all.length) {
      recsEl.innerHTML = `<div style="text-align:center;padding:32px;color:#52566b;font-size:13px;">No recommendations yet — load channel data first.</div>`;
    } else {
      recsEl.innerHTML = all.map(t => {
        const color = t.type === 'proven' ? '#6C63FF' : '#22d3ee';
        const label = t.type === 'proven' ? '✅ Proven' : '🔥 Trending';
        return `<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <div style="padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;
            background:${color}1a;color:${color};border:1px solid ${color}40;white-space:nowrap;margin-top:1px;">${label}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#d0d3e8;text-transform:capitalize;">${t.topic}</div>
            <div style="font-size:11px;color:#52566b;margin-top:1px;">${t.reason || ''}</div>
          </div>
        </div>`;
      }).join('');
    }
  }
}

// ── Upload Time Heatmap (accepts real data OR renders demo if empty) ──────────
function buildTimeHeatmap(heatmapData = {}, bestDayIdx, bestHour) {
  const container = document.getElementById('timeHeatmap');
  if (!container) return;
  container.innerHTML = '';

  const days      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours     = [6, 9, 12, 15, 18, 21];
  const hourLabels = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];

  const hasReal   = Object.keys(heatmapData).length > 0;

  // Build value matrix for normalization
  let maxViews = 1;
  const matrix = days.map((_, di) =>
    hours.map((h) => {
      const key = `${di}_${h}`;
      const val = heatmapData[key] || 0;
      if (val > maxViews) maxViews = val;
      return val;
    })
  );

  container.style.gridTemplateColumns = `40px repeat(${hours.length}, 1fr)`;

  // Header row
  container.insertAdjacentHTML('beforeend', '<div></div>');
  hourLabels.forEach(t => {
    container.insertAdjacentHTML('beforeend',
      `<div style="font-size:0.6rem;color:#52566b;text-align:center;padding-bottom:4px;">${t}</div>`);
  });

  days.forEach((day, di) => {
    container.insertAdjacentHTML('beforeend',
      `<div style="font-size:0.65rem;color:#52566b;display:flex;align-items:center;">${day}</div>`);
    hours.forEach((h, hi) => {
      const raw    = matrix[di][hi];
      const ratio  = hasReal ? (raw / maxViews) : ([0.2,0.3,0.4,0.5,0.7,0.4][hi] * [0.8,1,0.9,0.85,0.95,0.7,0.6][di]);
      const isBest = di === bestDayIdx && h === bestHour;
      const tooltip = hasReal
        ? `${day} ${hourLabels[hi]}: ${formatNumber(raw)} avg views`
        : `${day} ${hourLabels[hi]}: ${Math.round(ratio * 100)}% relative engagement`;
      container.insertAdjacentHTML('beforeend', `
        <div style="
          background:rgba(108,99,255,${(ratio * 0.9).toFixed(2)});
          border-radius:4px;height:22px;cursor:pointer;transition:all 0.2s;
          ${isBest ? 'box-shadow:0 0 10px rgba(108,99,255,0.7);outline:1.5px solid rgba(108,99,255,0.8);' : ''}
        " title="${tooltip}${isBest ? ' ⭐ BEST' : ''}"></div>`);
    });
  });

  if (!hasReal) {
    container.insertAdjacentHTML('afterend',
      `<div style="font-size:11px;color:#52566b;margin-top:8px;text-align:center;">
        ⚠️ Showing estimated pattern — upload more videos for your personalised heatmap
      </div>`);
  }
}



/* ═══════════════════════════════════════
   TRENDS TAB
═══════════════════════════════════════ */
function initTrendsTab() {
  if (State.chartsInitialized.trends) return;
  State.chartsInitialized.trends = true;

  // Google Trends Chart
  const trendsCtx = document.getElementById('trendsChart');
  if (trendsCtx) {
    const ctx = trendsCtx.getContext('2d');
    const jsGrad = getGradient(ctx, 'rgba(250,204,21,0.25)', 'rgba(250,204,21,0)', 260);
    const reactGrad = getGradient(ctx, 'rgba(97,218,251,0.2)', 'rgba(97,218,251,0)', 260);
    const pyGrad = getGradient(ctx, 'rgba(74,222,128,0.2)', 'rgba(74,222,128,0)', 260);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: DEMO.trends.labels,
        datasets: [
          {
            label: 'JavaScript',
            data: DEMO.trends.javascript,
            borderColor: '#facc15',
            backgroundColor: jsGrad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#facc15',
            pointHoverRadius: 6,
          },
          {
            label: 'React',
            data: DEMO.trends.react,
            borderColor: '#61dafb',
            backgroundColor: reactGrad,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#61dafb',
            pointHoverRadius: 5,
          },
          {
            label: 'Python',
            data: DEMO.trends.python,
            borderColor: '#4ade80',
            backgroundColor: pyGrad,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#4ade80',
            pointHoverRadius: 5,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { boxWidth: 14, color: '#8b8fa8', font: { size: 12 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, min: 0, max: 100, ticks: { font: { size: 11 } } }
        },
        animation: { duration: 1200 },
      }
    });
  }

  // Competitors Chart
  const compCtx = document.getElementById('competitorChart');
  if (compCtx) {
    const ctx = compCtx.getContext('2d');
    const youGrad = getGradient(ctx, 'rgba(108,99,255,0.3)', 'rgba(108,99,255,0)', 260);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: DEMO.competitors.labels,
        datasets: [
          {
            label: 'Your Channel',
            data: DEMO.competitors.you,
            borderColor: '#6C63FF',
            backgroundColor: youGrad,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#6C63FF',
          },
          {
            label: 'Competitor A',
            data: DEMO.competitors.comp1,
            borderColor: '#22d3ee',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#22d3ee',
          },
          {
            label: 'Competitor B',
            data: DEMO.competitors.comp2,
            borderColor: '#f87171',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#f87171',
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { boxWidth: 14, color: '#8b8fa8', font: { size: 12 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#1a1c28',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: c => ` ${c.dataset.label}: ${formatNumber(c.parsed.y * 1000)} subs` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 11 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { callback: v => `${v}K`, font: { size: 11 } }
          }
        },
        animation: { duration: 1200 },
      }
    });
  }
}

/* ═══════════════════════════════════════
   INSTAGRAM TAB
═══════════════════════════════════════ */
function initInstagramTab() {
  buildIgPosts();
}

function buildIgPosts() {
  const grid = document.getElementById('igPostGrid');
  if (!grid) return;
  grid.innerHTML = '';

  DEMO.igPosts.forEach(post => {
    grid.insertAdjacentHTML('beforeend', `
      <div class="ig-post-card">
        <div class="ig-post-thumb" style="background:${post.bg};">
          ${post.emoji}
        </div>
        <div class="ig-post-info">
          <div class="ig-post-stat">
            <span>❤️ ${post.likes}</span>
            <span>💬 ${post.comments}</span>
          </div>
        </div>
      </div>
    `);
  });
}

/* ═══════════════════════════════════════
   TAB CHART LAZY INIT
═══════════════════════════════════════ */
function initTabCharts(tabName) {
  switch (tabName) {
    case 'overview':    initOverviewCharts(); break;
    case 'youtube':     initYouTubeTab(); break;
    case 'sentiment':   initSentimentTab(); break;
    case 'predictions': initPredictionsTab(); break;
    case 'trends':      initTrendsTab(); break;
    case 'instagram':   initInstagramTab(); break;
  }
}

/* ═══════════════════════════════════════
   ANALYZE BUTTON
═══════════════════════════════════════ */
function initAnalyzeBtn() {
  const btn = document.getElementById('analyzeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => fetchRealChannelData(true));
}

/* ═══════════════════════════════════════
   REAL DATA LOADER
═══════════════════════════════════════ */
async function fetchRealChannelData(manual = false) {
  const stored = localStorage.getItem('creatoriq_channel');
  if (!stored) {
    if (manual) showToast('No channel found — go back to landing page', 'error');
    initKPICards(); // show demo values
    return;
  }

  // main.js stores a plain string, not JSON
  const channelInput = stored.trim();
  console.log('[CreatorIQ] Channel from localStorage:', channelInput);
  if (!channelInput) { initKPICards(); return; }

  // Show loading
  const btn = document.getElementById('analyzeBtn');
  const spinner = document.getElementById('analyzeBtnSpinner');
  const text = document.getElementById('analyzeBtnText');
  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'block';
  if (text) text.style.display = 'none';

  try {
    // 1 — Channel info
    const chRes = await fetch(`http://localhost:5000/api/youtube/channel?url=${encodeURIComponent(channelInput)}`, { signal: AbortSignal.timeout(12000) });
    if (!chRes.ok) {
      if (chRes.status === 404) {
        // Channel genuinely not found — show helpful error, not generic 'demo mode'
        const errData = await chRes.json().catch(() => ({}));
        const tried = channelInput;
        const msg = document.createElement('div');
        msg.style.cssText = `position:fixed;inset:0;background:rgba(10,10,15,0.92);display:flex;align-items:center;
          justify-content:center;z-index:9999;font-family:'Inter',sans-serif;`;
        msg.innerHTML = `<div style="max-width:480px;padding:40px;background:#1a1a2e;border-radius:16px;
            border:1px solid rgba(255,255,255,0.1);text-align:center;">
          <div style="font-size:40px;margin-bottom:16px;">🔍</div>
          <h2 style="color:#f0f2ff;margin:0 0 12px;font-size:20px;">Channel Not Found</h2>
          <p style="color:#8b8fa8;font-size:14px;margin:0 0 20px;line-height:1.6;">
            Could not find a YouTube channel for <strong style="color:#a8a4ff">"${tried}"</strong>.<br>
            Make sure you're using the exact YouTube handle.
          </p>
          <div style="background:rgba(108,99,255,0.08);border:1px solid rgba(108,99,255,0.2);border-radius:10px;padding:16px;margin-bottom:20px;text-align:left;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#52566b;margin-bottom:8px;">How to find your handle:</div>
            <div style="font-size:13px;color:#d0d3e8;line-height:1.8;">
              1. Go to <strong>youtube.com/your_channel</strong><br>
              2. Look at the URL — it shows <strong>@YourHandle</strong><br>
              3. Example: <code style="background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:3px;">@thinkkagainnn</code>
            </div>
          </div>
          <button onclick="this.closest('div[style*=fixed]').remove();window.location.href='index.html';"
            style="background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;border:none;
                   padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;width:100%;">
            ← Go Back & Try Again
          </button>
        </div>`;
        document.body.appendChild(msg);
        if (btn) btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (text) text.style.display = 'flex';
        return;
      }
      throw new Error('channel');
    }

    const chJson = await chRes.json();
    if (!chJson.success) throw new Error(chJson.error || 'channel error');
    const ch = chJson.data;
    State.channelId = ch.channel_id;
    State.realDataLoaded = true;
    updateChannelHeader(ch);
    updateKPIViews(ch);

    // 2 — Videos
    const vRes = await fetch(`http://localhost:5000/api/youtube/videos?channel_id=${ch.channel_id}`, { signal: AbortSignal.timeout(15000) });
    if (vRes.ok) {
      const vJson = await vRes.json();
      if (vJson.success && vJson.data) {
        const videos = vJson.data.videos || [];
        const engRate = vJson.data.engagement_rate || {};
        const postFreq = vJson.data.posting_frequency || {};
        const bestTimes = vJson.data.best_posting_times || {};
        if (videos.length) {
          State.allVideos = videos;
          State.realVideosLoaded = true;
          updateVideoTable(videos);
          updateTopVideosChart(videos);
          updateEngagementChart(videos);
          updateEngagementKPI(engRate);
          updatePostingInfo(postFreq, bestTimes);
        }
      }
    }

    // 3 — Sentiment
    const sRes = await fetch(`http://localhost:5000/api/sentiment/analyze?channel_id=${ch.channel_id}&channel_name=${encodeURIComponent(ch.title)}`, { signal: AbortSignal.timeout(20000) });
    if (sRes.ok) {
      const sJson = await sRes.json();
      if (sJson.success && sJson.data) updateSentimentDisplay(sJson.data);
    }

    // 4 — Predictions (ML)
    try {
      const pRes = await fetch(`http://localhost:5000/api/predictions?channel_id=${ch.channel_id}`, { signal: AbortSignal.timeout(20000) });
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson.success && pJson.data) updatePredictionsTab(pJson.data);
      }
    } catch (e) { console.warn('Predictions fetch failed:', e); }

    // 5 — Trends (pass channel_id so backend uses video tags, not channel name)
    try {
      const tRes = await fetch(
        `http://localhost:5000/api/trends?query=${encodeURIComponent(ch.title)}&channel_id=${ch.channel_id}`,
        { signal: AbortSignal.timeout(40000) }   // tag extraction + pytrends takes longer
      );
      if (tRes.ok) {
        const tJson = await tRes.json();
        if (tJson.success && tJson.data) updateTrendsTab(tJson.data);
      }
    } catch (e) { console.warn('Trends fetch failed:', e); }

    // 6 — Build competitor suggestions based on channel title + tags
    const channelTags = (State.allVideos || []).flatMap(v => v.tags || []);
    buildCompetitorSuggestions(ch.title, channelTags);
    State.channel = ch; // store for competitor comparison

    // Mark backend as live (green dot)
    const dot = document.getElementById('backendStatusDot');
    if (dot) { dot.style.background = '#4ade80'; dot.title = 'Backend connected — live data'; }
    showToast(`✅ Live data loaded for ${ch.title}!`, 'success');
  } catch (err) {
    console.warn('[CreatorIQ] Real data fetch failed:', err);
    initKPICards();
    if (manual) showToast('Could not reach backend — showing demo data', 'info');
    else showToast('⚡ Backend offline — showing demo data. Start backend with: python app.py', 'warning');
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (text) text.style.display = 'flex';
  }
}

function updateChannelHeader(ch) {
  // Header pill
  document.querySelectorAll('#channelNameDisplay, #ytChannelName').forEach(el => { if (el) el.textContent = ch.title; });

  // YouTube tab avatar initials
  const avatarEl = document.querySelector('.yt-avatar-placeholder');
  if (avatarEl) {
    const words = ch.title.split(' ');
    const initials = (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
    if (ch.thumbnail) {
      avatarEl.style.backgroundImage = `url(${ch.thumbnail})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.textContent = initials;
    }
  }

  // YouTube tab channel stats spans
  const statsSpans = document.querySelectorAll('.yt-channel-stats span');
  if (statsSpans[0]) statsSpans[0].textContent = `${formatNumber(ch.subscriber_count)} subscribers`;
  if (statsSpans[2]) statsSpans[2].textContent = `${formatNumber(ch.video_count)} videos`;
  if (statsSpans[4] && ch.published_at) {
    const yr = new Date(ch.published_at).getFullYear();
    const mo = new Date(ch.published_at).toLocaleString('en-US', { month: 'short' });
    statsSpans[4].textContent = `Joined ${mo} ${yr}`;
  }
}

function updateKPIViews(ch) {
  // Scope to overview tab to avoid hitting Instagram tab KPI cards
  const kpiCards = document.querySelectorAll('#tab-overview .kpi-card');
  if (kpiCards[0]) { const v = kpiCards[0].querySelector('.kpi-value'); if (v) v.textContent = formatNumber(ch.view_count); }
  if (kpiCards[1]) { const v = kpiCards[1].querySelector('.kpi-value'); if (v) v.textContent = formatNumber(ch.subscriber_count); }
}

function updateVideoTable(videos) {
  const tbody = document.getElementById('videoTableBody');
  if (!tbody) return;
  tbody.innerHTML = ''; // clear demo rows
  State.realVideosLoaded = true;
  videos.slice(0, 10).forEach(v => {
    const eng = v.view_count > 0 ? (((v.like_count + v.comment_count) / v.view_count) * 100).toFixed(2) : '0.00';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>
          <div class="vid-info">
            <div class="vid-thumb" style="background:linear-gradient(135deg,#1a1c28,#252838);overflow:hidden;">
              ${v.thumbnail ? `<img src="${v.thumbnail}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '🎬'}
            </div>
            <span class="vid-title">${v.title}</span>
          </div>
        </td>
        <td style="color:#f0f2ff;font-weight:600;">${formatNumber(v.view_count)}</td>
        <td>${formatNumber(v.like_count)}</td>
        <td>${formatNumber(v.comment_count)}</td>
        <td style="color:#6C63FF;font-weight:600;">${eng}%</td>
        <td><span class="sentiment-pill neu">—</span></td>
        <td><div class="status-live">Live</div></td>
      </tr>
    `);
  });
}

function updateTopVideosChart(videos) {
  const canvas = document.getElementById('topVideosBar');
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  const top6 = videos.slice(0, 6);
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: top6.map(v => v.title.length > 22 ? v.title.substring(0, 22) + '…' : v.title),
      datasets: [{ label: 'Views (M)', data: top6.map(v => +(v.view_count / 1e6).toFixed(2)), backgroundColor: ['rgba(108,99,255,0.85)','rgba(108,99,255,0.75)','rgba(108,99,255,0.65)','rgba(108,99,255,0.55)','rgba(108,99,255,0.45)','rgba(108,99,255,0.35)'], borderColor: 'rgba(108,99,255,0.9)', borderWidth: 0, borderRadius: 6, borderSkipped: false }]
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10, callbacks: { label: c => ` ${c.parsed.x}M views` } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => `${v}M`, font: { size: 11 } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } }, animation: { duration: 1200 } }
  });
}

function updateEngagementChart(videos) {
  const canvas = document.getElementById('engagementChart');
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  if (!videos || !videos.length) return;
  const sorted = [...videos].sort((a, b) => new Date(a.published_at) - new Date(b.published_at)).slice(-30);
  const labels = sorted.map(v => new Date(v.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const ctx = canvas.getContext('2d');
  const viewsGrad = ctx.createLinearGradient(0, 0, 0, 260); viewsGrad.addColorStop(0, 'rgba(108,99,255,0.3)'); viewsGrad.addColorStop(1, 'rgba(108,99,255,0)');
  const likesGrad = ctx.createLinearGradient(0, 0, 0, 260); likesGrad.addColorStop(0, 'rgba(34,211,238,0.2)'); likesGrad.addColorStop(1, 'rgba(34,211,238,0)');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Views', data: sorted.map(v => v.view_count), borderColor: '#6C63FF', backgroundColor: viewsGrad, borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#6C63FF' },
        { label: 'Likes', data: sorted.map(v => v.like_count), borderColor: '#22d3ee', backgroundColor: likesGrad, borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#22d3ee' },
        { label: 'Comments', data: sorted.map(v => v.comment_count), borderColor: '#4ade80', backgroundColor: 'transparent', borderWidth: 1.5, fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, hidden: true },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, boxHeight: 3, color: '#8b8fa8', font: { size: 12 }, usePointStyle: true, filter: i => !i.hidden } }, tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, callbacks: { label: c => ` ${c.dataset.label}: ${formatNumber(c.parsed.y)}` } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 8, font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => formatNumber(v), font: { size: 11 } } } } }
  });
  State.engagementChart = chart;
}

function updateSentimentDisplay(data) {
  if (!data) return;

  const ytSent      = data.youtube_sentiment  || {};
  const rdSent      = data.reddit_sentiment   || {};
  const nwSent      = data.news_sentiment     || {};
  const combined    = data.combined_sentiment || {};
  const rdConnected = data.reddit_connected   === true;

  /* ── Helper: draw a half-donut gauge ── */
  function drawGauge(canvasId, value, color) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ex = Chart.getChart(c); if (ex) ex.destroy();
    new Chart(c.getContext('2d'), {
      type: 'doughnut',
      data: { datasets: [{ data: [value, 100 - value], backgroundColor: [color, 'rgba(255,255,255,0.06)'], borderColor: 'transparent', borderWidth: 0, circumference: 180, rotation: 270 }] },
      options: { responsive: false, cutout: '78%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { animateRotate: true, duration: 1200 } }
    });
  }

  /* ── 1. YouTube gauge ── */
  const ytPos = Math.round(ytSent.positive_pct || 0);
  const ytNeu = Math.round(ytSent.neutral_pct  || 0);
  const ytNeg = Math.round(ytSent.negative_pct || 0);
  drawGauge('gauge1', ytPos, '#4ade80');
  const v1 = document.getElementById('gaugeVal1'); if (v1) v1.textContent = ytPos;
  const sp = document.getElementById('ytPos'); if (sp) sp.textContent = ytPos;
  const sn = document.getElementById('ytNeu'); if (sn) sn.textContent = ytNeu;
  const sg = document.getElementById('ytNeg'); if (sg) sg.textContent = ytNeg;

  /* ── 2. Reddit gauge — show Not Connected if no real data ── */
  const rdConnEl   = document.getElementById('redditGaugeConnected');
  const rdDisconEl = document.getElementById('redditGaugeDisconnected');
  if (rdConnected) {
    if (rdConnEl)   rdConnEl.style.display   = 'block';
    if (rdDisconEl) rdDisconEl.style.display = 'none';
    const rdPos = Math.round(rdSent.positive_pct || 0);
    const rdNeu = Math.round(rdSent.neutral_pct  || 0);
    const rdNeg = Math.round(rdSent.negative_pct || 0);
    drawGauge('gauge2', rdPos, '#facc15');
    const v2 = document.getElementById('gaugeVal2'); if (v2) v2.textContent = rdPos;
    const rp = document.getElementById('rdPos'); if (rp) rp.textContent = rdPos;
    const rn = document.getElementById('rdNeu'); if (rn) rn.textContent = rdNeu;
    const rg = document.getElementById('rdNeg'); if (rg) rg.textContent = rdNeg;
  } else {
    if (rdConnEl)   rdConnEl.style.display   = 'none';
    if (rdDisconEl) rdDisconEl.style.display = 'flex';
  }

  /* ── 3. News gauge ── */
  const nwPos = Math.round(nwSent.positive_pct || 0);
  const nwNeu = Math.round(nwSent.neutral_pct  || 0);
  const nwNeg = Math.round(nwSent.negative_pct || 0);
  drawGauge('gauge3', nwPos, '#6C63FF');
  const v3 = document.getElementById('gaugeVal3'); if (v3) v3.textContent = nwPos;
  const np = document.getElementById('newsPos'); if (np) np.textContent = nwPos;
  const nn = document.getElementById('newsNeu'); if (nn) nn.textContent = nwNeu;
  const ng = document.getElementById('newsNeg'); if (ng) ng.textContent = nwNeg;

  /* ── 4. Update Overview sentiment donut + KPI ── */
  const cPos = Math.round(combined.positive_pct || ytPos);
  const cNeu = Math.round(combined.neutral_pct  || ytNeu);
  const cNeg = Math.round(combined.negative_pct || ytNeg);
  const donut = document.getElementById('sentimentDonut');
  if (donut) {
    const ex = Chart.getChart(donut); if (ex) ex.destroy();
    new Chart(donut.getContext('2d'), {
      type: 'doughnut',
      data: { labels: ['Positive','Neutral','Negative'], datasets: [{ data: [cPos, cNeu, cNeg], backgroundColor: ['#4ade80','#374151','#f87171'], borderColor: '#13151e', borderWidth: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10, callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } } }, animation: { animateRotate: true, duration: 1400 } }
    });
  }
  const kpiCards = document.querySelectorAll('#tab-overview .kpi-card');
  if (kpiCards[3]) { const v = kpiCards[3].querySelector('.kpi-value'); if (v) v.textContent = `${cPos}/100`; }
  const legendStrongs = document.querySelectorAll('#tab-overview .donut-legend .legend-item strong');
  if (legendStrongs[0]) legendStrongs[0].textContent = `${cPos}%`;
  if (legendStrongs[1]) legendStrongs[1].textContent = `${cNeu}%`;
  if (legendStrongs[2]) legendStrongs[2].textContent = `${cNeg}%`;

  /* ── 5. Word Cloud from real word_frequency ── */
  const wf = data.word_frequency || [];
  const wcEl = document.getElementById('wordCloud');
  if (wcEl && wf.length > 0) {
    wcEl.innerHTML = '';
    const maxCount = wf[0]?.count || 1;
    const colors = ['#6C63FF','#22d3ee','#4ade80','#facc15','#f472b6','#fb923c','#a78bfa','#34d399'];
    wf.slice(0, 35).forEach((item, i) => {
      const word = item.word || item;
      const count = item.count || 1;
      const size  = 12 + Math.round((count / maxCount) * 20);
      const color = colors[i % colors.length];
      const opacity = 0.6 + (count / maxCount) * 0.4;
      wcEl.insertAdjacentHTML('beforeend',
        `<span style="font-size:${size}px;color:${color};opacity:${opacity.toFixed(2)};
          font-weight:${size > 24 ? 700 : 500};padding:4px 8px;cursor:default;
          transition:all 0.2s;display:inline-block;"
          title="${count} mentions">${word}</span>`);
    });
  }

  /* ── 6. Sentiment Timeline from real sentiment_over_time ── */
  // API structure: [{ period: "2026-04", average_compound: 0.28, label: "positive", count: 4 }, ...]
  const timeSeries = data.sentiment_over_time || [];
  const stCanvas = document.getElementById('sentimentTimeline');
  if (stCanvas && timeSeries.length > 0) {
    const ex = Chart.getChart(stCanvas); if (ex) ex.destroy();

    // Map compound (-1..+1) to a 0..100 sentiment score
    const labels    = timeSeries.map(d => d.period || d.date || '');
    const scoreData = timeSeries.map(d => Math.round(((d.average_compound || 0) + 1) / 2 * 100));
    const counts    = timeSeries.map(d => d.count || 0);
    const barColors = timeSeries.map(d =>
      d.label === 'positive' ? 'rgba(74,222,128,0.7)' :
      d.label === 'negative' ? 'rgba(248,113,113,0.7)' :
                               'rgba(108,99,255,0.5)'
    );

    new Chart(stCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sentiment Score (0=negative, 100=positive)',
            data: scoreData,
            backgroundColor: barColors,
            borderRadius: 6,
            borderSkipped: false,
            yAxisID: 'yScore',
          },
          {
            label: 'Comments analysed',
            data: counts,
            type: 'line',
            borderColor: '#6C63FF',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: '#6C63FF',
            tension: 0.4,
            yAxisID: 'yCount',
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#8b8fa8', boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            callbacks: {
              label: c => c.datasetIndex === 0
                ? ` Sentiment: ${c.parsed.y}/100 (${timeSeries[c.dataIndex]?.label || ''})`
                : ` Comments: ${c.parsed.y}`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8fa8', font: { size: 11 } } },
          yScore: {
            position: 'left', min: 0, max: 100,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { callback: v => `${v}`, color: '#8b8fa8', font: { size: 11 } },
            title: { display: true, text: 'Sentiment Score', color: '#52566b', font: { size: 10 } }
          },
          yCount: {
            position: 'right', beginAtZero: true,
            grid: { display: false },
            ticks: { callback: v => `${v} cmt`, color: '#6C63FF', font: { size: 10 } },
            title: { display: true, text: 'Comments', color: '#6C63FF', font: { size: 10 } }
          }
        }
      }
    });
  } else if (stCanvas) {
    const ex = Chart.getChart(stCanvas); if (ex) ex.destroy();
  }

  /* ── 7. Top Comments (by likes for positive) ── */
  const posContainer = document.getElementById('posComments');
  const negContainer = document.getElementById('negComments');

  const posComments = ytSent.top_positive_comments || [];
  const negComments = ytSent.top_negative_comments || [];

  function renderComment(c) {
    // c can be a string (old) or a full comment dict (new backend)
    const isObj = typeof c === 'object' && c !== null;
    const text   = isObj ? (c.text || '') : c;
    const author = isObj ? (c.author || 'Viewer')  : 'Viewer';
    const likes  = isObj ? (c.likes || 0)  : 0;
    const clean  = text.replace(/&#39;/g,"'").replace(/<[^>]*>/g,'').substring(0, 200);
    return `<div class="comment-card" style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;">
      <div style="font-size:13px;color:#d0d3e8;line-height:1.6;margin-bottom:8px;">"${clean}"</div>
      <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:#52566b;">
        <span style="color:#8b8fa8;">👤 ${author}</span>
        ${likes > 0 ? `<span style="color:#4ade80;">👍 ${formatNumber(likes)} likes</span>` : ''}
        <span class="comment-source yt">YouTube</span>
      </div>
    </div>`;
  }

  if (posContainer) {
    if (posComments.length > 0) {
      posContainer.innerHTML = posComments.map(renderComment).join('');
    } else {
      posContainer.innerHTML = '<div style="color:#52566b;font-size:13px;padding:16px;text-align:center;">No positive comments found yet</div>';
    }
  }
  if (negContainer) {
    if (negComments.length > 0) {
      negContainer.innerHTML = negComments.map(renderComment).join('');
    } else {
      negContainer.innerHTML = '<div style="color:#52566b;font-size:13px;padding:16px;text-align:center;">No critical comments found</div>';
    }
  }
}

function updateEngagementKPI(engRate) {
  if (!engRate) return;
  const rate = (engRate.average_engagement_rate || 0).toFixed(2);
  // Overview KPI card (scoped to overview tab)
  const kpiCards = document.querySelectorAll('#tab-overview .kpi-card');
  if (kpiCards[2]) { const v = kpiCards[2].querySelector('.kpi-value'); if (v) v.textContent = `${rate}%`; }
  // YouTube tab stat pill
  const statPills = document.querySelectorAll('.yt-channel-actions .stat-pill-val');
  if (statPills[0]) statPills[0].textContent = `${rate}%`;
}

function updatePostingInfo(postFreq, bestTimes) {
  // Best day (class selector — no ID in HTML)
  if (postFreq.best_days && postFreq.best_days.length) {
    const dayEl = document.querySelector('.best-time-day');
    if (dayEl) dayEl.textContent = postFreq.best_days[0];
  }
  // Best hours
  if (bestTimes.best_hour !== undefined) {
    const h = bestTimes.best_hour;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    const hr2 = (hr % 12) + 2;
    const hoursEl = document.querySelector('.best-time-hours');
    if (hoursEl) hoursEl.textContent = `${hr}:00 ${ampm} – ${hr2}:00 ${ampm}`;
  }
  // Build real data heatmap
  if (postFreq.day_distribution && Object.keys(postFreq.day_distribution).length) {
    buildRealHeatmap(postFreq.day_distribution, bestTimes.avg_views_by_hour || {});
  }
}

function buildRealHeatmap(dayDist, hourViews) {
  const container = document.getElementById('postingHeatmap');
  if (!container) return;
  container.innerHTML = '';
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayKeys = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const hours = ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm','12am','2am','4am'];
  const hourNums = [6,8,10,12,14,16,18,20,22,0,2,4];
  const maxDay = Math.max(...dayKeys.map(k => dayDist[k] || 0), 1);
  const maxHour = Math.max(...hourNums.map(h => Number(hourViews[String(h)] || 0)), 1);
  container.style.gridTemplateColumns = `36px repeat(${hours.length}, 1fr)`;
  container.insertAdjacentHTML('beforeend', '<div style="grid-column:1;"></div>');
  hours.forEach(h => container.insertAdjacentHTML('beforeend', `<div style="font-size:0.6rem;color:#52566b;text-align:center;padding-bottom:4px;">${h}</div>`));
  days.forEach((day, di) => {
    container.insertAdjacentHTML('beforeend', `<div style="font-size:0.65rem;color:#52566b;display:flex;align-items:center;">${day}</div>`);
    const dayIntensity = (dayDist[dayKeys[di]] || 0) / maxDay;
    hourNums.forEach(hNum => {
      const hourIntensity = Number(hourViews[String(hNum)] || 0) / maxHour;
      const combined = dayIntensity * 0.5 + hourIntensity * 0.5;
      const opacity = combined * 0.9 + 0.05;
      const highlight = combined > 0.65;
      container.insertAdjacentHTML('beforeend', `<div style="background:rgba(108,99,255,${opacity.toFixed(2)});border-radius:4px;height:22px;transition:all 0.2s;cursor:pointer;${highlight ? 'box-shadow:0 0 8px rgba(108,99,255,0.5);' : ''}" title="${day} ${hNum}:00 — ${formatNumber(Number(hourViews[String(hNum)] || 0))} avg views"></div>`);
    });
  });
}

/* ═══════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════ */
function showToast(message, type = 'info') {
  const colors = { success: '#4ade80', error: '#f87171', info: '#6C63FF', warning: '#facc15' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 18px; border-radius:10px;
    background:#1a1c28; border:1px solid ${colors[type]}40;
    color:#f0f2ff; font-size:0.85rem; font-weight:500;
    box-shadow:0 8px 30px rgba(0,0,0,0.4);
    display:flex; align-items:center; gap:10px;
    animation:slideUp 0.3s ease;
    font-family:'Inter',sans-serif;
  `;

  const dot = document.createElement('span');
  dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${colors[type]};flex-shrink:0;`;
  toast.appendChild(dot);
  toast.appendChild(document.createTextNode(message));

  // Add slide-up animation
  if (!document.getElementById('toastStyles')) {
    const s = document.createElement('style');
    s.id = 'toastStyles';
    s.textContent = '@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}';
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ═══════════════════════════════════════
   INSTAGRAM MODAL
═══════════════════════════════════════ */
window.openInstagramModal = function () {
  document.getElementById('igModal').classList.add('open');
};

window.closeInstagramModal = function () {
  document.getElementById('igModal').classList.remove('open');
};

window.connectInstagram = function () {
  const username = document.getElementById('igUsernameInput').value.trim();
  if (!username) {
    showToast('Please enter your Instagram username', 'error');
    return;
  }

  const btn = document.querySelector('.btn-modal-connect');
  btn.textContent = 'Connecting…';
  btn.disabled = true;

  setTimeout(() => {
    closeInstagramModal();
    State.instagramConnected = true;

    // Show connected view
    const cta = document.getElementById('igCTA');
    const connected = document.getElementById('igConnected');
    if (cta) cta.style.display = 'none';
    if (connected) connected.style.display = 'block';

    // Update header button
    const connectBtn = document.getElementById('connectIgBtn');
    if (connectBtn) {
      connectBtn.textContent = '✓ Instagram Connected';
      connectBtn.style.background = 'rgba(74,222,128,0.15)';
      connectBtn.style.border = '1px solid rgba(74,222,128,0.3)';
      connectBtn.style.color = '#4ade80';
      connectBtn.style.boxShadow = 'none';
      connectBtn.style.animation = 'none';
    }

    buildIgPosts();
    showToast(`@${username} connected successfully!`, 'success');
    btn.textContent = 'Authorize with Instagram';
    btn.disabled = false;
  }, 2000);
};

/* ═══════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════ */
function initNotifications() {
  const btn = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');

  if (!btn || !panel) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  });

  document.querySelector('.notif-mark-all')?.addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    const badge = document.querySelector('.notif-badge');
    if (badge) badge.style.display = 'none';
  });
}

/* ═══════════════════════════════════════
   CHANNEL FROM localStorage
═══════════════════════════════════════ */
function loadChannelInfo() {
  const stored = localStorage.getItem('creatoriq_channel');
  if (stored) {
    try {
      State.channel = JSON.parse(stored);
      const el = document.getElementById('channelNameDisplay');
      const ytName = document.getElementById('ytChannelName');
      if (el && State.channel.name) el.textContent = State.channel.name;
      if (ytName && State.channel.name) ytName.textContent = State.channel.name;
    } catch (e) {
      console.warn('Could not parse channel from localStorage');
    }
  }
}

/* ═══════════════════════════════════════
   DATA SOURCE STATUS CHECK
═══════════════════════════════════════ */
async function checkDataSources() {
  try {
    const res = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const json = await res.json();
    const keys = json?.data?.api_keys_configured || {};

    // Update each source badge dynamically
    function setBadgeStatus(cssClass, connected) {
      const badge = document.querySelector(`.source-badge.${cssClass}`);
      if (!badge) return;
      const status = badge.querySelector('.source-status');
      const check = badge.querySelector('.source-check');
      if (connected) {
        if (status) { status.textContent = '● Connected'; status.className = 'source-status connected'; }
        if (check) check.textContent = '✓';
        badge.style.opacity = '1';
      } else {
        if (status) { status.textContent = '● Not Connected'; status.className = 'source-status disconnected'; }
        if (check) { check.textContent = '⚡'; check.style.color = '#facc15'; }
        badge.style.opacity = '0.55';
      }
    }

    setBadgeStatus('youtube', keys.youtube !== false);
    setBadgeStatus('reddit',  keys.reddit  === true);
    setBadgeStatus('trends',  true);
    setBadgeStatus('news',    true);

    // Update header dot to green (backend is up)
    const dot = document.getElementById('backendStatusDot');
    if (dot && dot.style.background !== 'rgb(74, 222, 128)') {
      dot.style.background = '#facc15'; dot.title = 'Backend connected';
    }
  } catch (e) {
    console.warn('Health check failed:', e);
  }
}

/* ═══════════════════════════════════════
   DATE RANGE FILTER (7D / 30D / 90D / 1Y)
═══════════════════════════════════════ */
function initDateRangeFilter() {
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.dateRange = btn.textContent.trim();
      if (State.allVideos.length) {
        const filtered = filterVideosByDateRange(State.allVideos, State.dateRange);
        const toUse = filtered.length >= 2 ? filtered : State.allVideos.slice(-10);
        updateEngagementChart(toUse);
        updateTopVideosChart(toUse);
      }
    });
  });
}

function filterVideosByDateRange(videos, range) {
  const daysMap = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 };
  const days = daysMap[range] || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return videos.filter(v => new Date(v.published_at) >= cutoff);
}

/* ═══════════════════════════════════════
   CHART FILTER BUTTONS (Views / Likes / Comments) — TOGGLE mode
═══════════════════════════════════════ */
function initEngagementChartFilters() {
  const chartCard = document.querySelector('#tab-overview .chart-card.wide');
  if (!chartCard) return;
  chartCard.querySelectorAll('.chart-filter').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      // TOGGLE: clicking active button turns it off (unless it's the last active one)
      const allBtns = Array.from(chartCard.querySelectorAll('.chart-filter'));
      const activeCount = allBtns.filter(b => b.classList.contains('active')).length;
      if (btn.classList.contains('active') && activeCount === 1) return; // keep at least 1
      btn.classList.toggle('active');

      if (State.engagementChart) {
        allBtns.forEach((b, i) => {
          State.engagementChart.data.datasets[i].hidden = !b.classList.contains('active');
        });
        State.engagementChart.update('none'); // 'none' = no animation for instant feedback
      }
    });
  });
}

/* ═══════════════════════════════════════
   SEARCH BAR
═══════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      showToast(`Searching for "${input.value.trim()}"…`, 'info');
    }
  });

  // ⌘K / Ctrl+K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}


/* ═══════════════════════════════════════
   TRENDS TAB — real API wiring
═══════════════════════════════════════ */
function updateTrendsTab(data) {
  if (!data) return;

  const keyword      = data.keyword_used || data.query || 'topic';
  const iotData      = data.interest_over_time || [];
  const relQueries   = (data.related_queries || {}).top    || [];
  const risingQ      = (data.related_queries || {}).rising || [];
  const geoData      = data.geographic_interest || {};
  const rateLimited  = data.rate_limited === true;
  const wordFreq     = data.word_frequency || [];
  const topKeywords  = data.topic_keywords || [keyword];

  // ── 0. Always-visible Google Trends info strip + rate-limited warning ──
  const existingBanner = document.getElementById('trendsBanner');
  if (existingBanner) existingBanner.remove();

  const kws_preview = topKeywords.slice(0, 3);
  const trendsUrl   = `https://trends.google.com/trends/explore?q=${kws_preview.map(encodeURIComponent).join('%2C')}`;

  const banner = document.createElement('div');
  banner.id = 'trendsBanner';

  if (rateLimited) {
    // Yellow warning — no data available at all
    banner.style.cssText = `background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.25);
      border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;
      align-items:center;gap:12px;font-size:13px;color:#d0d3e8;`;
    banner.innerHTML = `
      <span style="font-size:20px;">⚠️</span>
      <span style="flex:1;">
        <strong style="color:#facc15;">Google Trends Rate Limited</strong> — Google is temporarily
        blocking automated requests. Showing channel topic data from video tags instead.
        <a href="${trendsUrl}" target="_blank" rel="noopener"
           style="color:#6C63FF;text-decoration:none;margin-left:8px;font-weight:600;">
          🔗 Open Google Trends directly →
        </a>
      </span>`;
  } else {
    // Blue info strip — always visible when data loads (or even when empty/filtered)
    banner.style.cssText = `background:rgba(108,99,255,0.07);border:1px solid rgba(108,99,255,0.2);
      border-radius:10px;padding:10px 16px;margin-bottom:14px;display:flex;
      align-items:center;gap:12px;font-size:12.5px;color:#8b8fa8;`;
    banner.innerHTML = `
      <span style="font-size:16px;">📈</span>
      <span style="flex:1;">
        Tracking: <strong style="color:#a8a4ff;">${kws_preview.join(' · ')}</strong>
        &nbsp;·&nbsp; Data via Google Trends (pytrends)
        <a href="${trendsUrl}" target="_blank" rel="noopener"
           style="color:#6C63FF;text-decoration:none;margin-left:10px;font-weight:600;font-size:12px;">
          🔗 Open on Google Trends →
        </a>
      </span>`;
  }

  const trendsTab = document.getElementById('tab-trends');
  if (trendsTab) trendsTab.insertBefore(banner, trendsTab.firstChild);

  // ── 1. Update subtitle ──
  const subtitle = document.getElementById('trendsChartSubtitle');
  if (subtitle) {
    subtitle.textContent = rateLimited
      ? `Channel topic profile for "${topKeywords.join('", "')}" (Google Trends unavailable)`
      : `Search interest for "${keyword}" over the last 3 months`;
  }

  // ── 1. Interest over time chart — multi-line, one series per keyword ──
  const tCanvas = document.getElementById('trendsChart');
  // kws = actual keywords that have chart data (from keywords_in_data field)
  const kws = (data.keywords_in_data && data.keywords_in_data.length > 0)
    ? data.keywords_in_data
    : topKeywords;

  // Remove any previous fallback message
  const prevFallback = tCanvas ? tCanvas.parentNode.querySelector('.trends-fallback') : null;
  if (prevFallback) prevFallback.remove();
  if (tCanvas) tCanvas.style.display = 'block';

  if (tCanvas && iotData.length > 0) {
    const existing = Chart.getChart(tCanvas);
    if (existing) existing.destroy();

    const labels = iotData.map(d => d.date || d.week || '');

    // Color palette for up to 5 keywords
    const KW_COLORS = [
      { line: '#6C63FF', fill: 'rgba(108,99,255,0.15)' },
      { line: '#22d3ee', fill: 'rgba(34,211,238,0.12)'  },
      { line: '#4ade80', fill: 'rgba(74,222,128,0.12)'  },
      { line: '#facc15', fill: 'rgba(250,204,21,0.12)'  },
      { line: '#f472b6', fill: 'rgba(244,114,182,0.12)' },
    ];

    const ctx2d = tCanvas.getContext('2d');
    const datasets = kws.map((kw, i) => {
      const col = KW_COLORS[i % KW_COLORS.length];
      const values = iotData.map(d => {
        if (d[kw] !== undefined) return Number(d[kw]);
        if (d.value !== undefined && i === 0) return Number(d.value);
        for (const k of Object.keys(d)) {
          if (k !== 'date' && k !== 'week' && k !== 'isPartial') return Number(d[k]) || 0;
        }
        return 0;
      });
      const grad = ctx2d.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, col.fill);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      return {
        label: kw,
        data: values,
        borderColor: col.line,
        backgroundColor: grad,
        borderWidth: 2.5,
        fill: i === 0,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: col.line,
      };
    });

    new Chart(ctx2d, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, labels: { color: '#8b8fa8', boxWidth: 14, font: { size: 11 }, padding: 16 } },
          tooltip: {
            backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12,
            callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}/100` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 10, font: { size: 10 }, color: '#8b8fa8' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, min: 0, max: 100,
               ticks: { callback: v => v, font: { size: 11 }, color: '#8b8fa8' } }
        }
      }
    });

    // Update subtitle with actual keywords
    if (subtitle) subtitle.textContent = `Search interest: "${kws.join('" vs "')}" — last 3 months`;

  } else {
    // No real Google Trends data (rate limited or all-zero) — show word cloud
    if (tCanvas) {
      const ex = Chart.getChart(tCanvas); if (ex) ex.destroy();
      tCanvas.style.display = 'none';
    }

    if (wordFreq.length > 0) {
      const cloud = document.createElement('div');
      cloud.className = 'trends-fallback';
      cloud.style.cssText = 'padding:20px;line-height:2.4;text-align:center;';
      const maxC = wordFreq[0]?.count || 1;
      const cloudColors = ['#6C63FF','#22d3ee','#4ade80','#facc15','#f472b6','#fb923c','#a78bfa'];
      cloud.innerHTML = '<div style="font-size:11px;color:#52566b;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Channel Topic Profile (from video tags)</div>' +
        wordFreq.slice(0, 20).map((item, i) => {
          const sz = 13 + Math.round((item.count / maxC) * 18);
          const cl = cloudColors[i % cloudColors.length];
          return `<span style="font-size:${sz}px;color:${cl};padding:4px 8px;font-weight:${sz>24?700:500};
            display:inline-block;opacity:${(0.6+(item.count/maxC)*0.4).toFixed(2)};" title="${item.count} uses in tags">${item.word}</span>`;
        }).join(' ');
      if (tCanvas) tCanvas.parentNode.appendChild(cloud);
    } else if (tCanvas) {
      const msg = document.createElement('div');
      msg.className = 'trends-fallback';
      msg.style.cssText = 'color:#52566b;font-size:13px;padding:40px;text-align:center;line-height:1.8;';
      msg.innerHTML = `No Google Trends data available for <strong style="color:#a8a4ff">${topKeywords.join(', ')}</strong>`;
      tCanvas.parentNode.appendChild(msg);
    }
  }


  // ── 2. Related search terms ──
  const relEl = document.getElementById('relatedTerms');
  const allTerms = [...relQueries, ...risingQ];
  if (relEl) {
    if (allTerms.length > 0) {
      // Real pytrends data available
      const maxVal = Math.max(...allTerms.map(q => Number(q.value) || 0), 1);
      relEl.innerHTML = allTerms.slice(0, 12).map((q, i) => {
        const termText = q.query || q.topic || String(q);
        const val      = Number(q.value) || 0;
        const pct      = Math.min(Math.round((val / maxVal) * 100), 100);
        const isRising = risingQ.includes(q);
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px;color:#52566b;width:18px;text-align:right;">${i + 1}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;color:#f0f2ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${termText}</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:4px;">
              <div style="height:4px;background:${isRising ? '#facc15' : '#6C63FF'};border-radius:2px;width:${pct}%;"></div>
            </div>
          </div>
          ${isRising
            ? `<span style="font-size:10px;color:#facc15;background:rgba(250,204,21,0.1);padding:2px 6px;border-radius:4px;white-space:nowrap;">🔥 Rising</span>`
            : `<span style="font-size:12px;font-weight:600;color:#6C63FF;">${val}</span>`
          }
        </div>`;
      }).join('');
    } else if (wordFreq.length > 0) {
      // Rate-limited fallback: show channel topic keywords ranked by frequency
      const maxC = wordFreq[0]?.count || 1;
      relEl.innerHTML = `<div style="font-size:11px;color:#52566b;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">
        Top Topics in Your Videos (${wordFreq.length} keywords found)</div>` +
        wordFreq.slice(0, 15).map((item, i) => {
          const pct = Math.round((item.count / maxC) * 100);
          return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:11px;color:#52566b;width:18px;text-align:right;">${i+1}</span>
            <div style="flex:1;">
              <div style="font-size:13px;color:#f0f2ff;font-weight:500;">${item.word}</div>
              <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:3px;">
                <div style="height:4px;background:linear-gradient(90deg,#6C63FF,#22d3ee);border-radius:2px;width:${pct}%;"></div>
              </div>
            </div>
            <span style="font-size:12px;font-weight:600;color:#6C63FF;">${item.count}x</span>
          </div>`;
        }).join('');
    } else {
      relEl.innerHTML = `<div style="color:#52566b;font-size:13px;padding:20px;text-align:center;">No related queries found for "${keyword}"</div>`;
    }
  }

  // ── 3. Geographic interest — top countries ranked list ──
  const geoKeys = Object.keys(geoData).filter(k => geoData[k] > 0);
  if (geoKeys.length > 0) {
    // Sort by value
    geoKeys.sort((a, b) => geoData[b] - geoData[a]);
    const maxGeo = geoData[geoKeys[0]] || 1;

    // Country code → name map (common ones)
    const COUNTRY_NAMES = {
      US:'United States', IN:'India', GB:'United Kingdom', CA:'Canada', AU:'Australia',
      DE:'Germany', FR:'France', BR:'Brazil', JP:'Japan', MX:'Mexico', PK:'Pakistan',
      NG:'Nigeria', ID:'Indonesia', KE:'Kenya', ZA:'South Africa', PH:'Philippines',
      BD:'Bangladesh', EG:'Egypt', GH:'Ghana', MY:'Malaysia', SG:'Singapore',
      NL:'Netherlands', IT:'Italy', ES:'Spain', SE:'Sweden', NO:'Norway',
      NZ:'New Zealand', AE:'UAE', SA:'Saudi Arabia', KR:'South Korea', TH:'Thailand',
    };
    const FLAG_OFFSET = 127397; // Unicode flag offset
    const toFlag = code => code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + FLAG_OFFSET)).join('');

    // Update the SVG map ellipses if they exist, then also build list
    const SVG_MAP = { US:'140,155', GB:'275,110', CA:'130,110', AU:'480,255', IN:'420,185', BR:'195,250', DE:'310,130', FR:'310,130' };
    const svgEl = document.querySelector('#tab-trends .world-svg');
    if (svgEl) {
      const ellipses = svgEl.querySelectorAll('ellipse');
      const texts    = svgEl.querySelectorAll('text');
      // Map known positions to real countries
      const codeOrder = Object.keys(SVG_MAP);
      geoKeys.slice(0, codeOrder.length).forEach((code, i) => {
        const pos = SVG_MAP[codeOrder[i]];
        if (!pos) return;
        const [cx, cy] = pos.split(',');
        const intensity = geoData[code] / maxGeo;
        const opacity   = (0.4 + intensity * 0.6).toFixed(2);
        if (ellipses[i]) {
          ellipses[i].setAttribute('opacity', opacity);
          ellipses[i].setAttribute('fill', '#6C63FF');
        }
        if (texts[i]) texts[i].textContent = `${toFlag(code)} ${geoData[code]}`;
      });
    }

    // Replace the static geo card content with a ranked list
    const geoCard = document.querySelector('#tab-trends .geo-map-placeholder');
    if (geoCard) {
      const listHTML = geoKeys.slice(0, 10).map((code, i) => {
        const name    = COUNTRY_NAMES[code] || code;
        const val     = geoData[code];
        const barPct  = Math.round((val / maxGeo) * 100);
        const flag    = toFlag(code);
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:18px;">${flag}</span>
          <div style="flex:1;">
            <div style="font-size:13px;color:#f0f2ff;font-weight:500;">${name}</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:3px;">
              <div style="height:4px;background:linear-gradient(90deg,#6C63FF,#22d3ee);border-radius:2px;width:${barPct}%;"></div>
            </div>
          </div>
          <span style="font-size:13px;font-weight:700;color:#6C63FF;">${val}</span>
        </div>`;
      }).join('');
      geoCard.innerHTML = `<div style="padding:4px 0;">${listHTML}</div>`;
    }
  }
}

/* ═══════════════════════════════════════
   COMPETITOR INTELLIGENCE TAB
═══════════════════════════════════════ */

// Competitor state — tracked channels
const CompetitorState = {
  list: [],          // [{title, channel_id, subscriber_count, view_count, video_count, published_at, thumbnail, tags:[]}]
  maxCompetitors: 3,
};

// ── Niche suggestion map based on channel content keywords ──
const NICHE_SUGGESTIONS = {
  spiritual:    ['@OshoWorld', '@SadhguruOfficial', '@JaiGurudevOfficial', '@SpirituallyYours'],
  motivation:   ['@BEAMindset', '@BrianTracy', '@MotivationArk', '@TomBilyeu'],
  philosophy:   ['@TheSchoolOfLife', '@Philosophize This', '@WireScienceTV'],
  meditation:   ['@YogaWithAdriene', '@HeadspaceOfficial', '@InsightTimer'],
  overthinking: ['@HealthyGamer', '@Psychology In Seattle', '@AnxietyCoach'],
  default:      ['@Veritasium', '@Kurzgesagt', '@TED', '@NowThisNews', '@VICE'],
};

function buildCompetitorSuggestions(channelTitle, channelTags) {
  const suggestions = document.getElementById('competitorSuggestions');
  if (!suggestions) return;

  const titleLower = (channelTitle || '').toLowerCase();
  const tagsStr    = (channelTags || []).join(' ').toLowerCase();
  const combined   = titleLower + ' ' + tagsStr;

  let list = NICHE_SUGGESTIONS.default;
  if (combined.match(/osho|buddha|spiritual|enlighten|consciousness|awareness/))
    list = NICHE_SUGGESTIONS.spiritual;
  else if (combined.match(/overthink|anxiety|stress|mental|psychology|mind/))
    list = NICHE_SUGGESTIONS.overthinking;
  else if (combined.match(/meditat|yoga|mindful|breath|calm|peace/))
    list = NICHE_SUGGESTIONS.meditation;
  else if (combined.match(/philosoph|stoic|existence|meaning|wisdom/))
    list = NICHE_SUGGESTIONS.philosophy;
  else if (combined.match(/motivat|success|goal|mindset|discipline|hustle/))
    list = NICHE_SUGGESTIONS.motivation;

  suggestions.innerHTML = list.slice(0, 5).map(s =>
    `<button onclick="document.getElementById('competitorInput').value='${s}';addCompetitor();"
      style="padding:6px 14px;border-radius:20px;border:1px solid rgba(108,99,255,0.4);background:rgba(108,99,255,0.1);
             color:#a8a4ff;font-size:13px;cursor:pointer;transition:all 0.2s;white-space:nowrap;"
      onmouseover="this.style.background='rgba(108,99,255,0.25)'"
      onmouseout="this.style.background='rgba(108,99,255,0.1)'">${s}</button>`
  ).join('');
}

// ── Health score: A-F grade from 5 metrics ──
function calcHealthScore(ch) {
  let score = 0;
  const subs    = ch.subscriber_count || 0;
  const views   = ch.view_count       || 0;
  const videos  = ch.video_count      || 1;
  const avgVpV  = Math.round(views / videos);
  const ageYrs  = Math.max(1, (Date.now() - new Date(ch.published_at).getTime()) / (1000 * 60 * 60 * 24 * 365));
  const growthProxy = subs / ageYrs; // subs gained per year

  // Points (0-20 each → max 100)
  if (subs > 1_000_000) score += 20; else if (subs > 100_000) score += 15; else if (subs > 10_000) score += 10; else if (subs > 1_000) score += 5;
  if (avgVpV > 100_000) score += 20; else if (avgVpV > 10_000) score += 15; else if (avgVpV > 1_000) score += 10; else if (avgVpV > 100) score += 5;
  if (videos > 500) score += 20; else if (videos > 100) score += 15; else if (videos > 50) score += 12; else if (videos > 10) score += 8;
  if (growthProxy > 100_000) score += 20; else if (growthProxy > 10_000) score += 15; else if (growthProxy > 1_000) score += 10; else if (growthProxy > 100) score += 5;
  const vsr = views / Math.max(1, subs); // views per subscriber
  if (vsr > 50) score += 20; else if (vsr > 20) score += 15; else if (vsr > 5) score += 10; else if (vsr > 1) score += 5;

  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#22d3ee' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#f87171';
  return { score, grade, color };
}

// ── Add a competitor ──
async function addCompetitor() {
  const input  = document.getElementById('competitorInput');
  const handle = (input && input.value.trim()) || '';
  if (!handle) { showToast('Enter a channel name or @handle', 'warning'); return; }

  if (CompetitorState.list.length >= CompetitorState.maxCompetitors) {
    showToast(`Max ${CompetitorState.maxCompetitors} competitors allowed. Remove one first.`, 'warning');
    return;
  }
  // Prevent duplicates
  if (CompetitorState.list.some(c => c.title.toLowerCase() === handle.toLowerCase().replace('@',''))) {
    showToast('Channel already added', 'info'); return;
  }

  const btn = document.getElementById('compareBtn');
  if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

  try {
    const r = await fetch(`http://localhost:5000/api/youtube/channel?url=${encodeURIComponent(handle)}`,
      { signal: AbortSignal.timeout(15000) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Channel not found');
    }
    const json = await r.json();
    if (!json.success) throw new Error(json.error || 'not found');

    const ch = json.data;
    // Avoid adding own channel
    if (State.channelId && ch.channel_id === State.channelId) {
      showToast('That\'s your own channel!', 'info'); return;
    }

    // Initialize empty tags array — will be filled by video fetch below
    ch.tags = [];

    CompetitorState.list.push(ch);
    if (input) input.value = '';
    renderCompetitorDashboard();  // render immediately with basic data

    // Now fetch their videos in background to get tags for content gap analysis
    // Show interim message in gap section
    const gapArea = document.getElementById('contentGapArea');
    if (gapArea) {
      gapArea.innerHTML = `<div style="color:#52566b;font-size:13px;display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;width:12px;height:12px;border:2px solid #6C63FF;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
        Fetching ${ch.title}'s videos to find content gaps…
      </div>`;
    }

    try {
      const vRes = await fetch(
        `http://localhost:5000/api/youtube/videos?channel_id=${ch.channel_id}`,
        { signal: AbortSignal.timeout(20000) }
      );
      if (vRes.ok) {
        const vJson = await vRes.json();
        if (vJson.success && vJson.data) {
          const videos = vJson.data.videos || [];
          // Collect all tags from competitor's videos (both raw tags and title words)
          const rawTags   = videos.flatMap(v => (v.tags || []));
          const titleWords = videos.flatMap(v =>
            (v.title || '').toLowerCase().split(/\s+/)
              .filter(w => w.length > 3)
              .map(w => w.replace(/[^a-z0-9]/g, ''))
              .filter(w => w.length > 3)
          );
          ch.tags = [...rawTags, ...titleWords];

          // Re-render with real tag data
          renderCompetitorDashboard();
          showToast(`✅ Loaded ${ch.title}'s content (${videos.length} videos)`, 'success');
        }
      }
    } catch (e) {
      console.warn('Could not fetch competitor videos for gap analysis:', e);
      if (gapArea) {
        gapArea.innerHTML = `<div style="color:#52566b;font-size:13px;">
          Could not load ${ch.title}'s videos — content gap analysis unavailable for this competitor.
        </div>`;
      }
    }

    showToast(`✅ Added ${ch.title}`, 'success');
  } catch (err) {
    console.warn('Competitor fetch failed:', err);
    showToast(`Could not find: ${handle}`, 'error');
  } finally {
    if (btn) { btn.textContent = '+ Add Competitor'; btn.disabled = false; }
  }
}


// ── Remove a competitor ──
function removeCompetitor(idx) {
  CompetitorState.list.splice(idx, 1);
  renderCompetitorDashboard();
}

// ── Main render function ──
function renderCompetitorDashboard() {
  const mine        = State.channel || {};
  const competitors = CompetitorState.list;
  const all         = competitors.length > 0 ? [{ ...mine, _isMe: true }, ...competitors] : [];

  const placeholder = document.getElementById('competitorPlaceholder');
  const results     = document.getElementById('competitorResults');
  if (!results) return;

  if (competitors.length === 0) {
    if (placeholder) placeholder.style.display = 'block';
    results.style.display = 'none';
    renderCompetitorChips();
    return;
  }
  if (placeholder) placeholder.style.display = 'none';
  results.style.display = 'block';

  renderCompetitorChips();
  renderHealthScoreCards(all);
  renderMetricsTable(all);
  renderSubsChart(all);
  renderEfficiencyChart(all);
  renderContentGapAnalysis(mine, competitors);
  renderStrategicInsights(mine, competitors);
}

// ── Chip pills showing added competitors ──
function renderCompetitorChips() {
  const chips = document.getElementById('competitorChips');
  if (!chips) return;
  chips.innerHTML = CompetitorState.list.map((c, i) =>
    `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;
      background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);font-size:13px;color:#22d3ee;">
      ${c.thumbnail ? `<img src="${c.thumbnail}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;">` : ''}
      ${c.title}
      <button onclick="removeCompetitor(${i})" style="background:none;border:none;color:#52566b;cursor:pointer;
        font-size:14px;padding:0;line-height:1;margin-left:2px;" title="Remove">✕</button>
    </span>`
  ).join('');
}

// ── Channel palette ──
const CH_COLORS = ['#6C63FF', '#22d3ee', '#4ade80', '#facc15'];

// ── Health Score Cards ──
function renderHealthScoreCards(all) {
  const row = document.getElementById('healthScoreRow');
  if (!row) return;
  const cols = all.length <= 2 ? `repeat(${all.length}, 1fr)` : `repeat(${Math.min(all.length, 4)}, 1fr)`;
  row.style.gridTemplateColumns = cols;

  row.innerHTML = all.map((ch, i) => {
    const { score, grade, color } = calcHealthScore(ch);
    const accentColor = ch._isMe ? '#6C63FF' : CH_COLORS[i] || '#22d3ee';
    const label = ch._isMe ? '⭐ Your Channel' : '🆚 Competitor';
    const views  = ch.view_count || 0;
    const videos = Math.max(1, ch.video_count || 1);
    const avgVpV = Math.round(views / videos);
    return `
      <div class="chart-card" style="padding:20px;border-top:3px solid ${accentColor};position:relative;">
        <div style="position:absolute;top:16px;right:16px;font-size:28px;font-weight:800;color:${color};opacity:0.9;">${grade}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          ${ch.thumbnail
            ? `<img src="${ch.thumbnail}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${accentColor};">`
            : `<div style="width:44px;height:44px;border-radius:50%;background:${accentColor};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;">${(ch.title||'?')[0]}</div>`}
          <div>
            <div style="font-size:14px;font-weight:700;color:#f0f2ff;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ch.title || '—'}</div>
            <div style="font-size:11px;color:${accentColor};font-weight:600;margin-top:2px;">${label}</div>
          </div>
        </div>
        <!-- Score bar -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#52566b;margin-bottom:4px;">
            <span>Channel Score</span><span style="color:${color};font-weight:600;">${score}/100</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;">
            <div style="height:6px;background:${color};border-radius:3px;width:${score}%;transition:width 0.8s ease;"></div>
          </div>
        </div>
        <!-- 3 mini stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
          <div style="padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;">
            <div style="font-size:14px;font-weight:700;color:#f0f2ff;">${formatNumber(ch.subscriber_count || 0)}</div>
            <div style="font-size:10px;color:#52566b;margin-top:2px;">Subs</div>
          </div>
          <div style="padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;">
            <div style="font-size:14px;font-weight:700;color:#f0f2ff;">${formatNumber(avgVpV)}</div>
            <div style="font-size:10px;color:#52566b;margin-top:2px;">Avg Views</div>
          </div>
          <div style="padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;">
            <div style="font-size:14px;font-weight:700;color:#f0f2ff;">${ch.video_count || 0}</div>
            <div style="font-size:10px;color:#52566b;margin-top:2px;">Videos</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Head-to-Head Metrics Table ──
function renderMetricsTable(all) {
  const el = document.getElementById('metricsTable');
  if (!el || all.length < 2) return;

  // For each metric, find the winner
  const metrics = [
    { label: 'Subscribers',        key: ch => ch.subscriber_count || 0,                          fmt: formatNumber, icon: '👥', higherWins: true  },
    { label: 'Total Views',         key: ch => ch.view_count || 0,                                fmt: formatNumber, icon: '👁', higherWins: true  },
    { label: 'Videos Published',    key: ch => ch.video_count || 0,                               fmt: v => v,       icon: '🎬', higherWins: true  },
    { label: 'Avg Views / Video',   key: ch => Math.round((ch.view_count||0)/Math.max(1,ch.video_count||1)), fmt: formatNumber, icon: '📈', higherWins: true },
    { label: 'Views / Subscriber',  key: ch => Number(((ch.view_count||0)/Math.max(1,ch.subscriber_count||1)).toFixed(1)), fmt: v => v + 'x', icon: '⚡', higherWins: true },
    { label: 'Channel Age (yrs)',   key: ch => Number(((Date.now()-new Date(ch.published_at).getTime())/(1000*60*60*24*365)).toFixed(1)), fmt: v => v + ' yrs', icon: '📅', higherWins: false },
  ];

  const colColors = all.map((_, i) => CH_COLORS[i] || '#22d3ee');
  const colLabels = all.map(ch => ch._isMe ? `⭐ ${(ch.title||'You').split(' ').slice(0,2).join(' ')}` : (ch.title||'').split(' ').slice(0,2).join(' '));

  let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
        <th style="text-align:left;padding:10px 8px;color:#52566b;font-weight:600;">Metric</th>
        ${all.map((_, i) => `<th style="text-align:center;padding:10px 8px;color:${colColors[i]};font-weight:700;">${colLabels[i]}</th>`).join('')}
        <th style="text-align:center;padding:10px 8px;color:#52566b;font-weight:600;">Winner</th>
      </tr>
    </thead><tbody>`;

  metrics.forEach((m, mi) => {
    const vals   = all.map(ch => m.key(ch));
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const winVal = m.higherWins ? maxVal : minVal;
    const winIdx = vals.indexOf(winVal);

    html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);${mi%2===0?'background:rgba(255,255,255,0.02)':''}">
      <td style="padding:10px 8px;color:#d0d3e8;font-weight:500;">${m.icon} ${m.label}</td>
      ${vals.map((v, i) => {
        const isWinner = v === winVal && vals.filter(x => x === winVal).length === 1;
        const isTie    = vals.every(x => x === vals[0]);
        return `<td style="text-align:center;padding:10px 8px;">
          <span style="font-weight:${isWinner?700:400};color:${isWinner?colColors[i]:'#8b8fa8'};">
            ${m.fmt(v)}${isWinner?' ✓':''}
          </span>
        </td>`;
      }).join('')}
      <td style="text-align:center;padding:10px 8px;">
        ${vals.every(x => x === vals[0])
          ? `<span style="font-size:11px;color:#52566b;">Tie</span>`
          : `<span style="font-size:11px;font-weight:700;color:${colColors[winIdx]};">${colLabels[winIdx].replace('⭐ ','')}</span>`}
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

// ── Subscribers bar chart ──
function renderSubsChart(all) {
  const canvas = document.getElementById('subsChart');
  if (!canvas) return;
  const ex = Chart.getChart(canvas); if (ex) ex.destroy();
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: all.map(ch => ch._isMe ? '⭐ You' : (ch.title||'').split(' ')[0]),
      datasets: [{
        data: all.map(ch => ch.subscriber_count || 0),
        backgroundColor: all.map((_, i) => CH_COLORS[i] || '#22d3ee'),
        borderRadius: 8, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { backgroundColor: '#1a1c28', borderColor: 'rgba(255,255,255,0.1)', borderWidth:1, padding:10,
          callbacks: { label: c => ` ${formatNumber(c.parsed.y)} subscribers` } }
      },
      scales: {
        x: { grid: { display:false }, ticks: { color:'#8b8fa8', font:{size:11} } },
        y: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { callback: v => formatNumber(v), color:'#8b8fa8' } }
      }
    }
  });
}

// ── Avg views/video efficiency chart ──
function renderEfficiencyChart(all) {
  const canvas = document.getElementById('efficiencyChart');
  if (!canvas) return;
  const ex = Chart.getChart(canvas); if (ex) ex.destroy();
  const efficiencies = all.map(ch => Math.round((ch.view_count||0) / Math.max(1, ch.video_count||1)));
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: all.map(ch => ch._isMe ? '⭐ You' : (ch.title||'').split(' ')[0]),
      datasets: [{
        data: efficiencies,
        backgroundColor: all.map((_, i) => CH_COLORS[i] || '#22d3ee'),
        borderRadius: 8, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display:false },
        tooltip: { backgroundColor:'#1a1c28', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, padding:10,
          callbacks: { label: c => ` ${formatNumber(c.parsed.y)} avg views/video` } }
      },
      scales: {
        x: { grid: { display:false }, ticks: { color:'#8b8fa8', font:{size:11} } },
        y: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { callback: v => formatNumber(v), color:'#8b8fa8' } }
      }
    }
  });
}

// ── Content Gap Analysis ──
function renderContentGapAnalysis(mine, competitors) {
  const area = document.getElementById('contentGapArea');
  if (!area || competitors.length === 0) return;

  // Common words to exclude from gap analysis
  const GAP_STOPWORDS = new Set([
    'this','that','with','from','have','your','their','what','when','then',
    'them','they','will','been','more','also','just','into','about','there',
    'which','would','could','video','watch','like','share','subscribe','hindi',
    'english','part','full','2024','2025','2026','channel','short','live',
    'best','most','every','know','think','says','said','good','great','just',
  ]);

  // Normalize a tag/title into individual searchable words
  function tokenize(tagOrTitle) {
    return (tagOrTitle || '')
      .toLowerCase()
      .split(/[\s,|#]+/)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 3 && !GAP_STOPWORDS.has(w));
  }

  // Build my word set from State.allVideos tags + titles
  const myWords = new Set();
  (State.allVideos || []).forEach(v => {
    (v.tags || []).forEach(tag  => tokenize(tag).forEach(w  => myWords.add(w)));
    tokenize(v.title || '').forEach(w => myWords.add(w));
  });

  // Check if any competitor still loading tags
  const loadingComp = competitors.find(c => c.tags === undefined || (c.tags.length === 0 && !c._tagsAttempted));
  if (loadingComp && competitors.every(c => (c.tags || []).length === 0)) {
    area.innerHTML = `<div style="color:#52566b;font-size:13px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:12px;height:12px;border:2px solid #6C63FF;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
      Loading competitor videos for content gap analysis…
    </div>`;
    return;
  }

  // Collect competitor words with frequency across channels
  const gaps = {};   // word → { count: N (videos), channels: Set of competitor indices }
  competitors.forEach((comp, ci) => {
    const compWords = new Set();
    (comp.tags || []).forEach(tag => tokenize(tag).forEach(w => compWords.add(w)));
    compWords.forEach(w => {
      if (!myWords.has(w)) {
        if (!gaps[w]) gaps[w] = { count: 0, channelSet: new Set() };
        gaps[w].count++;
        gaps[w].channelSet.add(ci);
      }
    });
  });

  // Sort by number of competitors covering the topic, then by frequency
  const sorted = Object.entries(gaps)
    .map(([word, info]) => ({ word, channels: info.channelSet.size, count: info.count }))
    .sort((a, b) => b.channels - a.channels || b.count - a.count)
    .slice(0, 30);

  if (sorted.length === 0) {
    const hasAnyTags = competitors.some(c => (c.tags || []).length > 0);
    area.innerHTML = `<div style="color:#52566b;font-size:13px;padding:12px 0;">
      ${hasAnyTags
        ? 'No unique content gaps found — your topics overlap heavily with this competitor. Try adding a different channel in your niche.'
        : 'Competitor video data is still loading. Refresh to check for content gaps.'}
    </div>`;
    return;
  }

  area.innerHTML = `
    <div style="font-size:12px;color:#52566b;margin-bottom:12px;">
      Found <strong style="color:#a8a4ff;">${sorted.length}</strong> topics competitors cover that may be missing from your channel:
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
      ${sorted.map(item => {
        const allCover = item.channels >= competitors.length;
        return `<span
          title="${item.channels} of ${competitors.length} competitor(s) cover this topic"
          style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:default;
            border:1px solid ${allCover ? 'rgba(250,204,21,0.35)' : 'rgba(34,211,238,0.25)'};
            background:${allCover ? 'rgba(250,204,21,0.07)' : 'rgba(34,211,238,0.06)'};
            color:${allCover ? '#facc15' : '#22d3ee'};">
          ${item.word}${allCover ? ' 🔥' : ''}
        </span>`;
      }).join('')}
    </div>
    <div style="font-size:12px;color:#52566b;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;">
      🔥 = Covered by <em>all</em> your competitors — highest-priority content opportunities.<br>
      Click any tag to search YouTube for content ideas.
    </div>`;

  // Make tags clickable to YouTube search
  area.querySelectorAll('span[title]').forEach(el => {
    const word = el.textContent.trim().replace(' 🔥', '');
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(word)}`, '_blank');
    });
  });
}



// ── Strategic Insights ──
function renderStrategicInsights(mine, competitors) {
  const area = document.getElementById('insightsArea');
  if (!area || competitors.length === 0) return;

  const insights = [];
  const mineAvg = Math.round((mine.view_count||0) / Math.max(1, mine.video_count||1));
  const mineSubs = mine.subscriber_count || 0;
  const mineVSR  = (mine.view_count||0) / Math.max(1, mineSubs);

  competitors.forEach(comp => {
    const compAvg  = Math.round((comp.view_count||0) / Math.max(1, comp.video_count||1));
    const compSubs = comp.subscriber_count || 0;
    const compVSR  = (comp.view_count||0) / Math.max(1, compSubs);
    const shortName = (comp.title||'Competitor').split(' ').slice(0,2).join(' ');

    // Insight 1: Avg views per video gap
    if (compAvg > mineAvg * 1.5) {
      const ratio = (compAvg / Math.max(1, mineAvg)).toFixed(1);
      insights.push({
        icon: '🎯', type: 'gap', color: '#f87171',
        title: `${shortName} gets ${ratio}× more views per video`,
        body: `Their avg is ${formatNumber(compAvg)} vs your ${formatNumber(mineAvg)}. Study their titles, thumbnails, and posting cadence — this is where the biggest gain is.`,
      });
    } else if (mineAvg > compAvg * 1.5) {
      insights.push({
        icon: '✅', type: 'win', color: '#4ade80',
        title: `Your videos outperform ${shortName} in avg views`,
        body: `Your avg ${formatNumber(mineAvg)} vs their ${formatNumber(compAvg)}. Your content quality is stronger — focus on growing subscribers to amplify this.`,
      });
    }

    // Insight 2: Subscriber gap
    if (compSubs > mineSubs * 2) {
      insights.push({
        icon: '📣', type: 'gap', color: '#facc15',
        title: `${shortName} has ${formatNumber(Math.round(compSubs/Math.max(1,mineSubs)))}× more subscribers`,
        body: `With ${formatNumber(compSubs)} subs vs your ${formatNumber(mineSubs)}, they have more reach. Analyse their community posts, Shorts strategy, and upload frequency.`,
      });
    }

    // Insight 3: Views/Subscriber ratio
    if (mineVSR > compVSR * 1.3) {
      insights.push({
        icon: '⚡', type: 'win', color: '#22d3ee',
        title: `Your audience is more engaged than ${shortName}`,
        body: `Your views/subscriber ratio is ${mineVSR.toFixed(1)}× vs their ${compVSR.toFixed(1)}×. Your existing subscribers watch more of your content — leverage this with a membership or Patreon.`,
      });
    }

    // Insight 4: Video count
    if (comp.video_count > (mine.video_count||0) * 2) {
      insights.push({
        icon: '📅', type: 'gap', color: '#fb923c',
        title: `${shortName} publishes more consistently`,
        body: `They have ${comp.video_count} videos vs your ${mine.video_count||0}. Increasing upload frequency — even by 1 video/week — can significantly accelerate the YouTube algorithm.`,
      });
    }
  });

  // Always add a general insight
  const bestComp = competitors.reduce((a, b) => (b.subscriber_count||0) > (a.subscriber_count||0) ? b : a);
  insights.push({
    icon: '🔍', type: 'info', color: '#a78bfa',
    title: 'Study the #1 competitor\'s top videos',
    body: `Go to ${bestComp.title}'s channel, filter by "Most Popular". Identify which topics, formats, and thumbnails perform best in your niche — then create your own unique take on those.`,
  });

  if (insights.length === 0) {
    insights.push({
      icon: '🏆', type: 'win', color: '#4ade80',
      title: 'You\'re competitive in your niche!',
      body: 'Your channel metrics are strong relative to this competitor. Keep your current content strategy and focus on scaling distribution.',
    });
  }

  area.innerHTML = insights.map(ins => `
    <div style="display:flex;gap:14px;padding:14px;border-radius:10px;margin-bottom:10px;
      background:rgba(255,255,255,0.03);border-left:3px solid ${ins.color};">
      <span style="font-size:24px;flex-shrink:0;margin-top:2px;">${ins.icon}</span>
      <div>
        <div style="font-size:14px;font-weight:600;color:#f0f2ff;margin-bottom:4px;">${ins.title}</div>
        <div style="font-size:13px;color:#8b8fa8;line-height:1.6;">${ins.body}</div>
      </div>
    </div>`).join('');
}

// Keep old compareCompetitor as alias for backward compat (used nowhere now, but safety)
function compareCompetitor() { addCompetitor(); }


/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadChannelInfo();
  initSidebar();
  initTabs();
  initSearch();
  initNotifications();
  initAnalyzeBtn();

  // Date range buttons
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Init overview (default tab) with slight delay for layout
  setTimeout(() => {
    initOverviewCharts();
    initSparklines();
    initKPICards(); // show demo values immediately (real data will overwrite when API responds)
    checkDataSources();
    initEngagementChartFilters();
    initDateRangeFilter();
    fetchRealChannelData(false);
  }, 300);

  // Wire keyboard shortcut ⌘K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) { input.focus(); input.select(); }
    }
  });

  // Close modal on overlay click
  document.getElementById('igModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('igModal')) {
      closeInstagramModal();
    }
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInstagramModal();
  });

  console.log('✅ CreatorIQ Dashboard initialized');
});
