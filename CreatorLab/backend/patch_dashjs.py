"""Patch dashboard.js: replace single-line trends chart with multi-line chart."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')

JS_PATH = r'C:\Users\harsh\OneDrive\Desktop\RESUMEEEEE\New folder\CreatorLab\js\dashboard.js'

with open(JS_PATH, encoding='utf-8') as f:
    content = f.read()

OLD = '  // \u2500\u2500 1. Interest over time chart \u2500\u2500'
NEW_CHART = '''  // \u2500\u2500 1. Interest over time chart \u2014 multi-line, one series per keyword \u2500\u2500
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
    if (subtitle) subtitle.textContent = `Search interest: "${kws.join('" vs "')}" \u2014 last 3 months`;

  } else {
    // No real Google Trends data (rate limited or all-zero) \u2014 show word cloud
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

  // (old code below this marker will be removed)
  const _SKIP_OLD_CHART_CODE = true;
  if (!_SKIP_OLD_CHART_CODE) {'''

# Find where the old chart block starts
START_MARKER = '  // \u2500\u2500 1. Interest over time chart \u2500\u2500'
END_MARKER   = '  // \u2500\u2500 2. Related search terms \u2500\u2500'

start_idx = content.find(START_MARKER)
end_idx   = content.find(END_MARKER)

if start_idx == -1:
    print('START not found. Trying alt...')
    START_MARKER = '  // \u2500\u2500 1. Interest over time chart'
    start_idx = content.find(START_MARKER)

if start_idx == -1 or end_idx == -1:
    print(f'start_idx={start_idx}, end_idx={end_idx}')
    print('FAILED: markers not found')
    sys.exit(1)

print(f'Found chart block: chars {start_idx}..{end_idx}')
print('First 80 chars of block:', repr(content[start_idx:start_idx+80]))

new_content = content[:start_idx] + NEW_CHART + '\n\n  ' + content[end_idx:]

with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('dashboard.js patched successfully')
