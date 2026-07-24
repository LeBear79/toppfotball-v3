const STORAGE_KEY = "toppfotball-v2";

const feedbackBanks = {
  intros: [
    "Sterk tur!",
    "Dette var skikkelig bra!",
    "Du ga deg ikke!",
    "Herlig innsats!",
    "For en fin økt!",
    "Du jobbet som en lagspiller!",
    "Dette var en tur med fart i!",
    "Du tok et nytt steg i dag!"
  ],
  motor: [
    "Motoren din fikk en skikkelig boost. Det hjelper deg å løpe mer i kamp og fortsatt ha krefter igjen.",
    "Du trente opp motoren. Da blir det lettere å ta mange løp og følge motspilleren helt hjem.",
    "Denne turen gjorde kondisen bedre. Det er gull når kampen varer lenge."
  ],
  strength: [
    "Beina ble sterkere. Det hjelper deg i skudd, spurter og tøffe dueller.",
    "Du bygde beinstyrke. Det gjør det lettere å skyte hardt og komme raskt i gang.",
    "Sterkere bein gjør deg bedre rustet til å stå imot når du kjemper om ballen."
  ],
  balance: [
    "Balansen ble bedre. Det hjelper deg når du finter, vender og tar imot ballen.",
    "Du trente kroppen på å holde seg stødig. Det er nyttig når du blir presset av en motspiller.",
    "Bedre balanse gjør det lettere å ha kontroll på ballen når du skifter retning."
  ],
  mindset: [
    "Viljestyrken vokste. Det hjelper deg å fortsette selv når du blir sliten.",
    "Du trente hodet på å ikke gi opp. Det er akkurat det gode lagspillere gjør.",
    "Denne turen gjorde deg tøffere. Det kan hjelpe deg å holde fokus helt til dommeren blåser av."
  ],
  endings: [
    "Fortsett sånn!",
    "Dette lover bra!",
    "Du blir bedre for hver tur!",
    "Bra jobbet!",
    "Neste nivå er nærmere nå!",
    "Dette kan du være stolt av!"
  ]
};

let appData = loadData();

document.addEventListener("DOMContentLoaded", () => {
  ensureProfile();
  bindEvents();
  setDefaultDate();
  renderAll();
});

function createProfile(name = "") {
  return {
    id: makeId(),
    name,
    favoritePlayer: "",
    image: "",
    favoritePlayerImage: "",
    trips: [],
    stats: { xp: 0, motor: 0, strength: 0, balance: 0, mindset: 0 },
    recentFeedback: []
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const profile = createProfile();
  return { activeProfileId: profile.id, profiles: [profile] };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function ensureProfile() {
  if (!appData.profiles?.length) {
    const profile = createProfile();
    appData = { activeProfileId: profile.id, profiles: [profile] };
  }
  if (!appData.profiles.some(p => p.id === appData.activeProfileId)) {
    appData.activeProfileId = appData.profiles[0].id;
  }
}

function activeProfile() {
  return appData.profiles.find(p => p.id === appData.activeProfileId);
}

function bindEvents() {
  document.getElementById("profile-form").addEventListener("submit", saveProfile);
  document.getElementById("trip-form").addEventListener("submit", saveTrip);
  document.getElementById("profile-selector").addEventListener("change", e => {
    appData.activeProfileId = e.target.value;
    saveData();
    renderAll();
  });
  document.getElementById("new-profile-button").addEventListener("click", () => {
    const p = createProfile();
    appData.profiles.push(p);
    appData.activeProfileId = p.id;
    saveData();
    renderAll();
    document.getElementById("profile-name").focus();
  });
  document.getElementById("delete-profile-button").addEventListener("click", deleteProfile);
}

async function saveProfile(e) {
  e.preventDefault();
  const p = activeProfile();
  p.name = document.getElementById("profile-name").value.trim();
  p.favoritePlayer = document.getElementById("favorite-player").value.trim();

  const profileFile = document.getElementById("profile-image").files[0];
  const playerFile = document.getElementById("favorite-player-image").files[0];

  if (profileFile) p.image = await readImage(profileFile);
  if (playerFile) p.favoritePlayerImage = await readImage(playerFile);

  saveData();
  renderAll();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function deleteProfile() {
  if (appData.profiles.length === 1) {
    alert("Du må ha minst én bruker.");
    return;
  }
  const p = activeProfile();
  if (!confirm(`Vil du slette ${p.name || "denne brukeren"}?`)) return;
  appData.profiles = appData.profiles.filter(x => x.id !== p.id);
  appData.activeProfileId = appData.profiles[0].id;
  saveData();
  renderAll();
}

function saveTrip(e) {
  e.preventDefault();
  const p = activeProfile();

  const trip = {
    id: makeId(),
    name: value("trip-name"),
    date: value("trip-date"),
    distance: numberValue("trip-distance"),
    elevation: numberValue("trip-elevation"),
    speed: numberValue("trip-speed"),
    effort: numberValue("trip-effort"),
    newPeak: value("trip-new-peak") === "ja"
  };

  const gains = {
    motor: clamp(Math.round(trip.distance / 2 + trip.speed / 4), 1, 8),
    strength: clamp(Math.round(trip.elevation / 120 + trip.effort / 2), 1, 8),
    balance: clamp(Math.round(trip.elevation / 220 + (trip.newPeak ? 2 : 0)), 1, 6),
    mindset: clamp(Math.round(trip.effort + (trip.newPeak ? 1 : 0)), 1, 7)
  };

  trip.gains = gains;
  trip.xp = Math.max(10, Math.round(
    trip.distance * 8 + trip.elevation * 0.08 + trip.effort * 7 +
    (trip.newPeak ? 20 : 0) + Object.values(gains).reduce((a,b)=>a+b,0)
  ));
  trip.feedback = makeFeedback(p, gains);

  p.trips.unshift(trip);
  p.stats.xp += trip.xp;
  Object.keys(gains).forEach(k => p.stats[k] += gains[k]);

  saveData();
  e.target.reset();
  setDefaultDate();
  renderAll();
  document.getElementById("feedback-title").scrollIntoView({ behavior: "smooth", block: "center" });
}

function makeFeedback(profile, gains) {
  const strongest = Object.entries(gains).sort((a,b)=>b[1]-a[1])[0][0];
  const intro = pickFresh(profile, feedbackBanks.intros, "intro");
  const body = pickFresh(profile, feedbackBanks[strongest], strongest);
  const ending = pickFresh(profile, feedbackBanks.endings, "ending");
  return `${intro} ${body} ${ending}`;
}

function pickFresh(profile, bank, key) {
  profile.recentFeedback ||= [];
  const recent = profile.recentFeedback.filter(x => x.key === key).map(x => x.text);
  const choices = bank.filter(x => !recent.includes(x));
  const pool = choices.length ? choices : bank;
  const text = pool[Math.floor(Math.random() * pool.length)];
  profile.recentFeedback.push({ key, text });
  profile.recentFeedback = profile.recentFeedback.slice(-12);
  return text;
}

function renderAll() {
  const p = activeProfile();
  renderProfileSelector();
  renderProfileForm(p);
  renderHero(p);
  renderProgress(p);
  renderFeedback(p);
  renderTrips(p);
}

function renderProfileSelector() {
  const select = document.getElementById("profile-selector");
  select.innerHTML = appData.profiles.map((p,i) =>
    `<option value="${p.id}">${escapeHtml(p.name || `Ny bruker ${i+1}`)}</option>`
  ).join("");
  select.value = appData.activeProfileId;
}

function renderProfileForm(p) {
  document.getElementById("profile-name").value = p.name;
  document.getElementById("favorite-player").value = p.favoritePlayer;
  document.getElementById("profile-image").value = "";
  document.getElementById("favorite-player-image").value = "";
}

function renderHero(p) {
  document.getElementById("profile-name-display").textContent = p.name || "Ny bruker";
  document.getElementById("favorite-player-display").textContent = p.favoritePlayer || "Ikke valgt";
  document.getElementById("favorite-player-tagline").textContent =
    p.favoritePlayer ? "Rask. Smart. Din store helt!" : "Last opp bilde og velg spiller";
  const level = Math.floor(p.stats.xp / 500) + 1;
  document.getElementById("hero-level").textContent = level;
  document.getElementById("hero-xp").textContent = `${p.stats.xp} XP`;
  showImage("profile-image-display","profile-image-placeholder",p.image,initials(p.name)||"TF");
  showImage("player-image-display","player-image-placeholder",p.favoritePlayerImage,initials(p.favoritePlayer)||"10");
  showImage("feedback-player-image","feedback-player-placeholder",p.favoritePlayerImage,initials(p.favoritePlayer)||"10");
}

function renderProgress(p) {
  const tripGoal = nextGoal(p.trips.length, 2);
  document.getElementById("trip-count").textContent = p.trips.length;
  document.getElementById("trip-goal").textContent = tripGoal;
  const tripPercent = Math.round((p.trips.length / tripGoal) * 100);
  setBar("trip-progress", tripPercent);
  document.getElementById("trip-progress-percent").textContent = `${tripPercent}%`;

  renderSkill("motor", p.stats.motor);
  renderSkill("strength", p.stats.strength);
  renderSkill("balance", p.stats.balance);
  renderSkill("mindset", p.stats.mindset);

  const currentXp = p.stats.xp % 500;
  const xpPercent = Math.round(currentXp / 500 * 100);
  document.getElementById("total-xp").textContent = p.stats.xp;
  document.getElementById("xp-remaining").textContent = `${500-currentXp} XP igjen`;
  setBar("xp-progress", xpPercent);
}

function renderSkill(key, points) {
  const percent = Math.min(100, points * 8);
  const level = Math.floor(points / 10) + 1;
  document.getElementById(`skill-${key}`).textContent = `${percent}%`;
  document.getElementById(`skill-${key}-level`).textContent = `NIVÅ ${level}`;
  setBar(`skill-${key}-bar`, percent);
}

function renderFeedback(p) {
  const latest = p.trips[0];
  document.getElementById("feedback-title").textContent =
    latest ? `Godt jobbet, ${p.name || "spiller"}!` : `Klar for første tur, ${p.name || "spiller"}?`;
  document.getElementById("feedback-text").textContent =
    latest ? latest.feedback : "Registrer en tur for å få en morsom fotballtilbakemelding.";
}

function renderTrips(p) {
  const list = document.getElementById("trip-list");
  if (!p.trips.length) {
    list.innerHTML = `<div class="empty-state">Ingen turer registrert ennå.</div>`;
    return;
  }
  list.innerHTML = p.trips.map(t => `
    <div class="trip-item">
      <div class="trip-icon">▲</div>
      <div>
        <strong>${escapeHtml(formatDate(t.date))}</strong>
        <span>${formatNumber(t.distance,1)} km · ${Math.round(t.elevation)} hm · ${formatNumber(t.speed,1)} km/t</span>
        <span class="trip-xp">+${t.xp} XP</span>
      </div>
      <button class="delete-trip" data-id="${t.id}" type="button">Slett</button>
    </div>
  `).join("");
  list.querySelectorAll(".delete-trip").forEach(btn =>
    btn.addEventListener("click", () => deleteTrip(btn.dataset.id))
  );
}

function deleteTrip(id) {
  const p = activeProfile();
  const t = p.trips.find(x => x.id === id);
  if (!t || !confirm(`Vil du slette turen "${t.name}"?`)) return;
  p.trips = p.trips.filter(x => x.id !== id);
  recalcStats(p);
  saveData();
  renderAll();
}

function recalcStats(p) {
  p.stats = { xp:0,motor:0,strength:0,balance:0,mindset:0 };
  p.trips.forEach(t => {
    p.stats.xp += t.xp || 0;
    Object.keys(t.gains || {}).forEach(k => p.stats[k] += t.gains[k] || 0);
  });
}

function showImage(imgId, placeholderId, src, fallback) {
  const img = document.getElementById(imgId);
  const ph = document.getElementById(placeholderId);
  if (src) { img.src = src; img.hidden = false; ph.hidden = true; }
  else { img.hidden = true; ph.hidden = false; ph.textContent = fallback; }
}

function nextGoal(value, step) {
  return value < step ? step : (Math.floor(value / step) + 1) * step;
}
function setBar(id, percent) { document.getElementById(id).style.width = `${clamp(percent,0,100)}%`; }
function value(id) { return document.getElementById(id).value.trim(); }
function numberValue(id) { return Number(document.getElementById(id).value); }
function setDefaultDate() { document.getElementById("trip-date").value = new Date().toISOString().slice(0,10); }
function clamp(v,min,max){ return Math.min(Math.max(v,min),max); }
function makeId(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function initials(s){ return String(s||"").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join(""); }
function formatNumber(v,d=0){ return new Intl.NumberFormat("nb-NO",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v); }
function formatDate(s){ return new Intl.DateTimeFormat("nb-NO",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${s}T12:00:00`)); }
function escapeHtml(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
