
const state = {
  scope: 'both', // both | riley | quinn
  view: 'week', // today | week | changes | actionables | activities | quinn
  data: null,
};

async function loadData() {
  const res = await fetch('./sample_data.json?_=' + Date.now());
  state.data = await res.json();
  document.querySelector('#generatedAt').textContent = state.data.generated_at;
  render();
}

function setScope(s) {
  state.scope = s;
  document.querySelectorAll('.profile-toggle button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-scope="${s}"]`).classList.add('active');
  render();
}

function setView(v) {
  state.view = v;
  document.querySelectorAll('.actions button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-view="${v}"]`).classList.add('active');
  render();
}

function matchesScope(item) {
  if (state.scope === 'both') return true;
  if (state.scope === 'riley') return (item.student || '').toLowerCase() === 'riley';
  if (state.scope === 'quinn') return (item.student || '').toLowerCase() === 'quinn';
  return true;
}

function formatWhen(start, end) {
  if (!start && !end) return 'No date listed';
  try {
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const optsDate = { year:'numeric', month:'short', day:'numeric'};
    const optsTime = { hour:'numeric', minute:'2-digit' };
    const datePart = isNaN(s) ? start : s.toLocaleDateString(undefined, optsDate);
    const timePart = isNaN(s) ? '' : (s.getHours()===0 && s.getMinutes()===0 ? '' : ' @ ' + s.toLocaleTimeString(undefined, optsTime));
    if (e && !isNaN(e)) {
      const endTime = (e.getHours()===0 && e.getMinutes()===0) ? '' : ' – ' + e.toLocaleTimeString(undefined, optsTime);
      return datePart + timePart + endTime;
    }
    return datePart + timePart;
  } catch {
    return start || '';
  }
}

function itemCard(item) {
  const who = `[${item.student || '—'} – ${item.school}]`;
  const when = item.start ? formatWhen(item.start, item.end) : (item.due ? `Due: ${item.due}` : '');
  const metaBits = [];
  if (when) metaBits.push(when);
  if (item.type) metaBits.push(item.type.toUpperCase());
  const meta = metaBits.join(' • ');
  const src = item.source ? `Source: ${item.source}` : '';
  const crawled = item.crawled_at ? `Last crawled: ${item.crawled_at}` : '';
  const delta = item.delta ? `<div class="small">${item.delta}</div>` : '';
  const why = item.why ? `<div class="small">${item.why}</div>` : '';

  return `
  <div class="card">
    <div class="title">${who} ${item.title}</div>
    <div class="meta">${meta}</div>
    ${why}
    ${delta}
    <div><a href="${item.url}" target="_blank" rel="noopener noreferrer">View source</a></div>
    <div class="small">${src}${src && crawled ? ' • ' : ''}${crawled}</div>
  </div>`;
}

function render() {
  if (!state.data) return;
  let items = [];
  switch(state.view) {
    case 'today': items = state.data.today || []; break;
    case 'week': items = state.data.this_week || []; break;
    case 'actionables': items = state.data.actionables || []; break;
    case 'changes': items = state.data.changes || []; break;
    case 'activities': items = state.data.activities || []; break;
    case 'quinn': items = state.data.quinn_resources || []; break;
    default: items = [];
  }
  items = items.filter(matchesScope);

  // Sort: "today" and "week" should be chronological by start/due, others vary
  if (state.view === 'today' || state.view === 'week' || state.view === 'actionables') {
    items.sort((a,b)=> {
      const aKey = a.start || a.due || '';
      const bKey = b.start || b.due || '';
      return aKey.localeCompare(bKey);
    });
  } else if (state.view === 'changes') {
    // newest first for changes
    items.sort((a,b)=> (b.crawled_at||'').localeCompare(a.crawled_at||''));
  }

  const main = document.querySelector('.main');
  main.innerHTML = items.length ? items.map(itemCard).join('') :
    `<div class="card"><div class="title">No items for this view.</div>
      <div class="small">Try a different view or tap Refresh.</div></div>`;
}

function refreshNow() {
  // In the stub, just re-load the sample file.
  loadData();
}

window.addEventListener('load', async () => {
  // PWA: register service worker when hosted over HTTPS
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./sw.js'); } catch (e) {}
  }
  await loadData();
  // default view = combined week
  setScope('both');
  setView('week');
});
