const EVENT_FEED = 'https://nach-dev.github.io/tcg-event-scraper/site/data/raven-forge-events.json';
const LOCAL_EVENT_FEED = './data/raven-forge-events.json';
const DAY_MS = 86400000;
const list = document.querySelector('#event-list');
const status = document.querySelector('#event-status');
const dayTabs = document.querySelector('#day-tabs');
const weekLabel = document.querySelector('#week-label');
let events = [];
let weekOffset = 0;
let selectedDay = null;

function safeText(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
}
function localDate(value) { return new Date(`${value.slice(0, 10)}T12:00:00`); }
function isoDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function addDays(date, days) { return new Date(date.getTime() + days * DAY_MS); }
function startOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  return addDays(copy, -((copy.getDay() + 6) % 7));
}

function flattenFeed(payload) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const seen = new Set();
  return (Array.isArray(payload?.events) ? payload.events : []).filter(event => {
    if (!event.verified_store || !event.game_type || !event.event_date) return false;
    if (/^(upcoming|event details)$/i.test(event.event_name || '')) return false;
    const date = localDate(event.event_date);
    const key = `${event.game_type}|${event.event_date}|${event.event_name}`.toLowerCase();
    if (Number.isNaN(date.getTime()) || date < today || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b) => `${a.event_date}${a.event_time_display || ''}`.localeCompare(`${b.event_date}${b.event_time_display || ''}`));
}

function eventLabel(event) {
  return (event.event_type || 'Event').replace(/^Play\s*-?\s*/i,'').replace(/Store Calendar/i,'Weekly play') || 'Event';
}
function weekDates() {
  const start = addDays(startOfWeek(new Date()), weekOffset * 7);
  return Array.from({length:7}, (_,index) => addDays(start,index));
}

function renderWeek() {
  const days = weekDates();
  const start = days[0];
  const end = days[6];
  weekLabel.textContent = `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} â€“ ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  const available = new Set(events.map(event => event.event_date));
  const todayIso = isoDate(new Date());
  if (!selectedDay || !days.some(day => isoDate(day) === selectedDay)) {
    selectedDay = days.some(day => isoDate(day) === todayIso) ? todayIso : null;
    if (!selectedDay || !available.has(selectedDay)) selectedDay = days.map(isoDate).find(date => available.has(date)) || isoDate(days[0]);
  }
  dayTabs.innerHTML = days.map(day => {
    const value = isoDate(day);
    const count = events.filter(event => event.event_date === value).length;
    return `<button type="button" role="tab" data-date="${value}" class="${value === selectedDay ? 'active' : ''}" aria-selected="${value === selectedDay}">${day.toLocaleDateString('en-US',{weekday:'short'})}<small>${day.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small><small class="event-count">${count} event${count === 1 ? '' : 's'}</small></button>`;
  }).join('');
  dayTabs.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { selectedDay = button.dataset.date; renderWeek(); }));
  renderDay();
}

function renderEvent(event) {
  const time = event.event_time_display || 'Time TBD';
  const description = event.location_text || 'Raven Forge Games Â· Sanford, NC';
  const isCalendar = /calendar/i.test(event.source_site || '');
  const link = event.source_url && !isCalendar ? `<a class="event-source" href="${safeText(event.source_url)}" target="_blank" rel="noreferrer">View / register â†—</a>` : '';
  return `<article class="event-row"><div class="event-time">${safeText(time)}</div><div class="event-name"><b>${safeText(event.event_name)}</b><small>${safeText(description)}</small></div><div class="event-meta">${safeText(event.game_type)} Â· ${safeText(eventLabel(event))}</div>${link}</article>`;
}

function renderDay() {
  const dayEvents = events.filter(event => event.event_date === selectedDay);
  const selected = localDate(selectedDay);
  status.textContent = `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} on ${selected.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}.`;
  if (!dayEvents.length) {
    list.innerHTML = '<div class="empty-day">No events are currently scheduled for this day.</div>';
    return;
  }
  list.innerHTML = dayEvents.map(renderEvent).join('');
}

async function loadEvents() {
  for (const url of [EVENT_FEED, LOCAL_EVENT_FEED]) {
    try {
      const response = await fetch(url,{cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      events = flattenFeed(await response.json());
      renderWeek();
      return;
    } catch (error) { console.warn(`Could not load event feed from ${url}`,error); }
  }
  status.textContent = 'The Raven Forge event schedule is temporarily unavailable.';
}

document.querySelector('#previous-week').addEventListener('click', () => { weekOffset -= 1; selectedDay = null; renderWeek(); });
document.querySelector('#next-week').addEventListener('click', () => { weekOffset += 1; selectedDay = null; renderWeek(); });
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded',open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); }));
document.querySelector('.newsletter form').addEventListener('submit', event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = 'Thanks!';
  setTimeout(() => { button.textContent = 'Join â†’'; },1800);
});

document.querySelector('#host-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const lines = [
    `Contact name: ${data.get('contact_name')}`, `Email: ${data.get('email')}`, `Phone: ${data.get('phone') || 'Not provided'}`, '',
    `Event name: ${data.get('event_name')}`, `Event / game type: ${data.get('game_type')}`, `Description: ${data.get('description')}`, '',
    `Preferred date: ${data.get('preferred_date')}`, `Time: ${data.get('start_time')}â€“${data.get('end_time') || 'TBD'}`, `Expected players: ${data.get('players')}`,
    `Recurrence: ${data.get('recurrence')}`, `Recurring details: ${data.get('recurrence_details') || 'None'}`, `Entry fee: ${data.get('entry_fee') || 'Not provided'}`, '',
    `Logistics / prizes / registration: ${data.get('logistics') || 'None provided'}`, '',
    'Acknowledgment accepted: Submission is not a confirmed reservation or event approval.'
  ];
  const subject = `Event request: ${data.get('event_name')}`;
  window.location.href = `mailto:admin@ravenforgegames.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
});

loadEvents();
