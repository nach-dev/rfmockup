const EVENT_FEED = 'https://nach-dev.github.io/tcg-event-scraper/site/data/raven-forge-events.json';
const LOCAL_EVENT_FEED = './data/raven-forge-events.json';
const ALLOWED_GAMES = new Set(['Magic: The Gathering', 'Pokémon', 'Disney Lorcana', 'One Piece', 'Gundam Card Game']);

const list = document.querySelector('#event-list');
const status = document.querySelector('#event-status');
let officialEvents = [];
let sourceStatuses = [];
let activeGame = 'all';

function safeText(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function flattenFeed(payload) {
  sourceStatuses = Array.isArray(payload?.sources) ? payload.sources : [];
  return (Array.isArray(payload?.events) ? payload.events : []).filter(event => {
    if (!event.verified_store || !ALLOWED_GAMES.has(event.game_type) || !event.event_date) return false;
    const date = new Date(`${event.event_date.slice(0, 10)}T12:00:00`);
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    return !Number.isNaN(date.getTime()) && date >= cutoff;
  }).sort((a, b) => a.event_date.localeCompare(b.event_date));
}

function eventLabel(event) {
  if (event.kind === 'release') return 'Release';
  return (event.event_type || 'Official event').replace(/^Play\s*-?\s*/i, '') || 'Official event';
}

function renderEvents() {
  const filtered = officialEvents.filter(event => activeGame === 'all' || event.game_type === activeGame).slice(0, 8);
  const source = sourceStatuses.find(item => item.game_type === activeGame);
  if (filtered.length) {
    status.textContent = `Showing ${filtered.length} upcoming Raven Forge event${filtered.length === 1 ? '' : 's'}.`;
  } else if (activeGame === 'all') {
    status.textContent = 'No upcoming Raven Forge events are currently listed by the connected official sources.';
  } else if (source?.status === 'connected') {
    status.textContent = `No upcoming Raven Forge ${activeGame} events are currently listed on the official event site.`;
  } else {
    status.textContent = `${activeGame} is not connected to a public Raven Forge store page yet. No unverified events will be shown.`;
  }

  list.innerHTML = filtered.map(event => {
    const date = new Date(`${event.event_date.slice(0, 10)}T12:00:00`);
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const description = event.location_text || 'Raven Forge Games · Sanford, NC';
    return `<article class="event-row">
      <div class="event-time">${safeText(dateLabel)}</div>
      <div class="event-name"><b>${safeText(event.event_name)}</b><small>${safeText(description)}</small></div>
      <div class="event-meta">${safeText(event.game_type)} · ${safeText(eventLabel(event))}</div>
      <a class="event-source" href="${safeText(event.source_url || '#')}" target="_blank" rel="noreferrer">Official source ↗</a>
    </article>`;
  }).join('');
}

async function loadEvents() {
  for (const url of [EVENT_FEED, LOCAL_EVENT_FEED]) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      officialEvents = flattenFeed(await response.json());
      renderEvents();
      return;
    } catch (error) {
      console.warn(`Could not load event feed from ${url}`, error);
    }
  }
  status.textContent = 'The Raven Forge event feed is temporarily unavailable. Please check the official event links.';
  list.innerHTML = '';
}

document.querySelectorAll('.game-tabs button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.game-tabs button').forEach(item => {
    item.classList.remove('active');
    item.setAttribute('aria-selected', 'false');
  });
  button.classList.add('active');
  button.setAttribute('aria-selected', 'true');
  activeGame = button.dataset.game;
  renderEvents();
}));

const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));

document.querySelector('.newsletter form').addEventListener('submit', event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = 'Thanks!';
  setTimeout(() => { button.textContent = 'Join →'; }, 1800);
});

loadEvents();
