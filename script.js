const STORAGE_KEY = "toppfotball-v2";
const APP_VERSION = "0.3.3";

const skillProfiles = {
  motor: {
    identity: "lagets motor",
    cardName: "Lagets motor",
    effects: [
      "En sterk motor gjør at du kan ta flere løp og fortsatt ha krefter igjen når kampen skal avgjøres.",
      "God utholdenhet hjelper deg å jobbe både i angrep og forsvar gjennom hele kampen.",
      "Når motoren blir bedre, kan du holde farten oppe lenger og hjelpe laget i flere situasjoner."
    ]
  },
  strength: {
    identity: "en storskytter",
    cardName: "Storskytter",
    effects: [
      "Sterke bein kan gjøre deg raskere, gi deg hardere skudd og mer kraft i duellene.",
      "Beinstyrke hjelper deg i spurter, hopp og når du skal stå imot en motspiller.",
      "Mer kraft i beina kan gi bedre akselerasjon og gjøre skuddene dine vanskeligere å stoppe."
    ]
  },
  balance: {
    identity: "en ballmester",
    cardName: "Ballmester",
    effects: [
      "God balanse gjør det lettere å vende raskt, finte og beholde kontrollen på ballen.",
      "Bedre kroppskontroll hjelper deg å holde deg på beina når du blir presset av en motspiller.",
      "Balansen gjør det lettere å ta imot ballen og skifte retning uten å miste kontrollen."
    ]
  },
  mindset: {
    identity: "lagets kriger",
    cardName: "Lagets kriger",
    effects: [
      "Viljestyrken gjør deg tøffere, slik at du kan jobbe lengre og hardere for å hjelpe laget til seier.",
      "Sterk vilje hjelper deg å fortsette å kjempe selv når du blir sliten eller kampen blir vanskelig.",
      "Når du ikke gir opp, kan du vinne tilbake ballen og løfte lagkameratene dine helt til kampen er over."
    ]
  }
};

const feedbackBanks = {
  openings: [
    "Denne turen tok deg ett steg nærmere å bli",
    "Innsatsen din på denne turen utviklet deg videre som",
    "I dag bygget du videre på egenskapene til",
    "Denne turen gjorde deg litt mer klar til å bli",
    "Arbeidet du la ned i dag førte deg nærmere rollen som",
    "Dagens tur ga deg verdifull trening på veien mot å bli"
  ],
  connectors: [
    "Det kan bli en sterk kombinasjon på fotballbanen.",
    "Sammen er dette egenskaper som kan gjøre deg vanskelig å stoppe.",
    "Dette er en kombinasjon mange trenere setter stor pris på.",
    "De to egenskapene kan hjelpe deg i mange viktige situasjoner i en kamp.",
    "Når disse utvikles sammen, kan du bidra både med kvalitet og innsats."
  ],
  endings: [
    "Alle lag trenger en slik spiller!",
    "Slike spillere betyr mye for laget!",
    "Fortsett slik – utviklingen vil merkes på banen!",
    "Dette er arbeid du kan være skikkelig stolt av!",
    "Hver tur bygger en litt bedre fotballspiller!",
    "Det blir spennende å se hva du får til videre!",
    "Ta med deg den samme innsatsen til neste trening!",
    "Du er på vei i riktig retning!"
  ]
};

const feedbackTemplates = [
  ({ opening, identities, effect1, effect2, connector, ending }) =>
    `${opening} ${identities}. ${effect1} ${effect2} ${ending}`,
  ({ opening, identities, effect1, effect2, connector, ending }) =>
    `${opening} ${identities}. ${connector} ${effect1} ${effect2} ${ending}`,
  ({ identities, effect1, effect2, connector, ending }) =>
    `Dagens sterke sider var ${identities}. ${effect1} ${connector} ${effect2} ${ending}`,
  ({ identities, effect1, effect2, connector, ending }) =>
    `Du viste egenskaper som passer for ${identities}. ${effect1} ${effect2} ${connector} ${ending}`,
  ({ opening, identities, effect1, effect2, ending }) =>
    `${opening} ${identities}. På banen betyr det blant annet dette: ${effect1} ${effect2} ${ending}`,
  ({ identities, effect1, effect2, ending }) =>
    `Denne gangen utviklet du særlig det som kjennetegner ${identities}. ${effect1} ${effect2} ${ending}`
];

const skillTiers = [
  { label: "I", min: 0, max: 10, icons: 1 },
  { label: "II", min: 10, max: 25, icons: 2 },
  { label: "III", min: 25, max: 45, icons: 3 },
  { label: "ELITE", min: 45, max: 70, icons: 4 }
];

const xpRanks = [
  { title: "Nytt talent", trophy: "◆", medalName: "Talentmerket" },
  { title: "Lovende spiller", trophy: "◇", medalName: "Bronsemerket" },
  { title: "Kampklar", trophy: "⬟", medalName: "Sølvmerket" },
  { title: "Lagspiller", trophy: "⬢", medalName: "Gullmerket" },
  { title: "Nøkkelspiller", trophy: "★", medalName: "Stjernemerket" },
  { title: "Stjernespiller", trophy: "✦", medalName: "Mestermerket" },
  { title: "Toppfotballspiller", trophy: "♛", medalName: "Toppmerket" },
  { title: "Klubblegende", trophy: "🏆", medalName: "Legendepokalen" }
];



let appData = loadData();

document.addEventListener("DOMContentLoaded", async () => {
  ensureProfile();
  bindEvents();
  setDefaultDate();
  renderAll();
  await optimizeStoredImages();
});

function createProfile(name = "") {
  return {
    id: makeId(),
    name,
    age: null,
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

function saveData(showError = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    return true;
  } catch (error) {
    console.error("Kunne ikke lagre Toppfotball-data:", error);
    if (showError) {
      alert("Det er ikke nok lagringsplass i nettleseren. Bildene blir nå gjort mindre. Prøv å lagre én gang til.");
    }
    return false;
  }
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
  document.getElementById("new-profile-button").addEventListener("click", async () => {
    await optimizeStoredImages();
    const previousActiveId = appData.activeProfileId;
    const p = createProfile();
    appData.profiles.push(p);
    appData.activeProfileId = p.id;
    if (!saveData()) {
      appData.profiles = appData.profiles.filter(profile => profile.id !== p.id);
      appData.activeProfileId = previousActiveId;
      renderAll();
      return;
    }
    renderAll();
    document.getElementById("profile-name").focus();
  });
  document.getElementById("delete-profile-button").addEventListener("click", deleteProfile);
  document.getElementById("export-backup-button").addEventListener("click", exportBackup);
  document.getElementById("import-backup-input").addEventListener("change", importBackup);

  const cameraInput = document.getElementById("profile-camera");
  const galleryInput = document.getElementById("profile-image");
  const imageStatus = document.getElementById("profile-image-status");

  document.getElementById("take-profile-photo-button").addEventListener("click", () => {
    cameraInput.click();
  });

  cameraInput.addEventListener("change", () => {
    if (cameraInput.files[0]) {
      galleryInput.value = "";
      imageStatus.textContent = "Nytt bilde fra kameraet er klart. Trykk Lagre bruker.";
    }
  });

  galleryInput.addEventListener("change", () => {
    if (galleryInput.files[0]) {
      cameraInput.value = "";
      imageStatus.textContent = "Bildet er valgt. Trykk Lagre bruker.";
    }
  });
  document.getElementById("rank-up-close").addEventListener("click", closeRankCelebration);
  document.getElementById("trip-date-button").addEventListener("click", () => {
    const dateInput = document.getElementById("trip-date");
    if (typeof dateInput.showPicker === "function") dateInput.showPicker();
    else dateInput.focus();
  });
  document.getElementById("rank-up-overlay").addEventListener("click", e => {
    if (e.target.id === "rank-up-overlay") closeRankCelebration();
  });
}

function exportBackup() {
  const status = document.getElementById("backup-status");
  try {
    const backup = {
      app: "Toppfotball",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      data: appData
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Toppfotball-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "Sikkerhetskopien er laget. Lagre filen på et trygt sted.";
  } catch (error) {
    console.error("Kunne ikke lage sikkerhetskopi:", error);
    status.textContent = "Sikkerhetskopien kunne ikke lages.";
  }
}

async function importBackup(event) {
  const input = event.target;
  const status = document.getElementById("backup-status");
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const importedData = parsed?.data ?? parsed;

    if (!isValidBackupData(importedData)) {
      throw new Error("Filen inneholder ikke gyldige Toppfotball-data.");
    }

    const profileCount = importedData.profiles.length;
    const tripCount = importedData.profiles.reduce((sum, profile) => sum + (profile.trips?.length || 0), 0);
    const confirmed = confirm(
      `Vil du gjenopprette ${profileCount} bruker${profileCount === 1 ? "" : "e"} og ${tripCount} tur${tripCount === 1 ? "" : "er"}? Dagens data i appen blir erstattet.`
    );
    if (!confirmed) {
      status.textContent = "Gjenopprettingen ble avbrutt.";
      return;
    }

    const previousData = appData;
    appData = normalizeImportedData(importedData);
    ensureProfile();
    if (!saveData(false)) {
      appData = previousData;
      throw new Error("Det var ikke nok lagringsplass til sikkerhetskopien.");
    }

    renderAll();
    status.textContent = "Dataene er gjenopprettet.";
  } catch (error) {
    console.error("Kunne ikke gjenopprette sikkerhetskopi:", error);
    alert(error.message || "Sikkerhetskopien kunne ikke leses.");
    status.textContent = "Gjenopprettingen mislyktes.";
  } finally {
    input.value = "";
  }
}

function isValidBackupData(data) {
  return Boolean(
    data &&
    Array.isArray(data.profiles) &&
    data.profiles.every(profile => profile && typeof profile === "object" && Array.isArray(profile.trips || []))
  );
}

function normalizeImportedData(data) {
  const profiles = data.profiles.map(profile => ({
    ...createProfile(profile.name || ""),
    ...profile,
    id: profile.id || makeId(),
    age: Number.isInteger(Number(profile.age)) ? Number(profile.age) : null,
    trips: Array.isArray(profile.trips) ? profile.trips : [],
    stats: profile.stats && typeof profile.stats === "object"
      ? { xp: 0, motor: 0, strength: 0, balance: 0, mindset: 0, ...profile.stats }
      : { xp: 0, motor: 0, strength: 0, balance: 0, mindset: 0 },
    recentFeedback: Array.isArray(profile.recentFeedback) ? profile.recentFeedback : []
  }));

  const activeProfileId = profiles.some(profile => profile.id === data.activeProfileId)
    ? data.activeProfileId
    : profiles[0]?.id;

  return { ...data, profiles, activeProfileId };
}

async function saveProfile(e) {
  e.preventDefault();
  const p = activeProfile();
  const name = document.getElementById("profile-name").value.trim();
  const age = Number(document.getElementById("profile-age").value);

  if (!name) {
    alert("Skriv inn navn på brukeren.");
    return;
  }
  if (!Number.isInteger(age) || age < 4 || age > 99) {
    alert("Skriv inn en gyldig alder mellom 4 og 99 år.");
    return;
  }

  p.name = name;
  p.age = age;
  p.favoritePlayer = document.getElementById("favorite-player").value.trim();

  const cameraFile = document.getElementById("profile-camera").files[0];
  const galleryFile = document.getElementById("profile-image").files[0];
  const profileFile = cameraFile || galleryFile;
  const playerFile = document.getElementById("favorite-player-image").files[0];

  const oldImage = p.image;
  const oldPlayerImage = p.favoritePlayerImage;

  try {
    if (profileFile) p.image = await compressImageFile(profileFile);
    if (playerFile) p.favoritePlayerImage = await compressImageFile(playerFile);

    if (!saveData()) {
      p.image = oldImage;
      p.favoritePlayerImage = oldPlayerImage;
      return;
    }

    document.getElementById("profile-image-status").textContent = "Brukeren er lagret.";
    renderAll();
  } catch (error) {
    console.error("Kunne ikke behandle bildet:", error);
    p.image = oldImage;
    p.favoritePlayerImage = oldPlayerImage;
    alert("Bildet kunne ikke behandles. Prøv et annet bilde.");
  }
}

function compressImageFile(file, maxSize = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Kunne ikke lese bildet."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Kunne ikke åpne bildet."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl, maxSize = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onerror = () => reject(new Error("Kunne ikke optimalisere lagret bilde."));
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.src = dataUrl;
  });
}

async function optimizeStoredImages() {
  let changed = false;
  try {
    for (const profile of appData.profiles || []) {
      for (const key of ["image", "favoritePlayerImage"]) {
        const original = profile[key];
        if (original && original.length > 180000) {
          const optimized = await compressDataUrl(original);
          if (optimized !== original) {
            profile[key] = optimized;
            changed = true;
          }
        }
      }
    }
    if (changed) saveData(false);
  } catch (error) {
    console.warn("Optimalisering av gamle bilder ble hoppet over:", error);
  }
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

  if (!Number.isInteger(Number(p.age)) || Number(p.age) < 4) {
    alert("Legg inn og lagre brukerens alder før du registrerer en tur.");
    document.getElementById("profile-age").focus();
    return;
  }

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

  const previousVisits = p.trips.filter(existingTrip =>
    normalizeTripName(existingTrip.name) === normalizeTripName(trip.name)
  ).length;
  trip.visitNumber = previousVisits + 1;
  trip.newPeakBonus = trip.newPeak ? 50 : 0;
  trip.milestoneBonus = !trip.newPeak && trip.visitNumber >= 2 && trip.visitNumber % 2 === 0 ? 25 : 0;

  const gains = {
    motor: clamp(Math.round(trip.distance / 2 + trip.speed / 4), 1, 8),
    strength: clamp(Math.round(trip.elevation / 120 + trip.effort / 2), 1, 8),
    balance: clamp(Math.round(trip.elevation / 220 + (trip.newPeak ? 2 : 0)), 1, 6),
    mindset: clamp(Math.round(trip.effort + (trip.newPeak ? 1 : 0)), 1, 7)
  };

  trip.gains = gains;
  trip.originalBaseXp = Math.max(10, Math.round(
    trip.distance * 8 + trip.elevation * 0.08 + trip.effort * 7 +
    Object.values(gains).reduce((a,b)=>a+b,0)
  ));
  trip.ageAtRegistration = Number(p.age);
  trip.ageFactor = getAgeFactor(trip.ageAtRegistration);
  trip.baseXp = Math.max(10, Math.round(trip.originalBaseXp * trip.ageFactor));
  trip.xp = trip.baseXp + trip.newPeakBonus + trip.milestoneBonus;

  const previousXp = p.stats.xp;
  const previousRankIndex = getXpRankIndex(previousXp);
  const newRankIndex = getXpRankIndex(previousXp + trip.xp);
  trip.rankUp = newRankIndex > previousRankIndex ? newRankIndex : null;
  trip.feedback = makeFeedback(p, gains, trip.xp, trip.rankUp, trip);

  p.trips.unshift(trip);
  p.stats.xp += trip.xp;
  Object.keys(gains).forEach(k => p.stats[k] += gains[k]);

  saveData();
  e.target.reset();
  setDefaultDate();
  renderAll();
  document.getElementById("feedback-title").scrollIntoView({ behavior: "smooth", block: "center" });
}


function getAgeFactor(age) {
  const numericAge = Number(age);
  if (numericAge <= 8) return 1.40;
  if (numericAge <= 10) return 1.30;
  if (numericAge <= 12) return 1.20;
  if (numericAge <= 15) return 1.10;
  return 1.00;
}

function makeFeedback(profile, gains, xpEarned, rankUpIndex = null, trip = null) {
  const strongest = Object.entries(gains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);

  const [firstKey, secondKey] = strongest;
  const first = skillProfiles[firstKey];
  const second = skillProfiles[secondKey];
  const opening = pickFresh(profile, feedbackBanks.openings, "opening", 3);
  const connector = pickFresh(profile, feedbackBanks.connectors, "connector", 3);
  const firstEffect = pickFresh(profile, first.effects, `${firstKey}-effect`, 2);
  const secondEffect = pickFresh(profile, second.effects, `${secondKey}-effect`, 2);
  const ending = pickFresh(profile, feedbackBanks.endings, "ending", 4);
  const template = pickFresh(profile, feedbackTemplates, "template", 3);
  const identities = `${first.identity} og ${second.identity}`;

  const mainText = template({ opening, identities, effect1: firstEffect, effect2: secondEffect, connector, ending });
  const bonusParts = [];
  if (trip?.newPeakBonus) {
    bonusParts.push(`Du oppdaget en ny topp og fikk ${trip.newPeakBonus} bonus-XP.`);
  }
  if (trip?.milestoneBonus) {
    bonusParts.push(`Dette var gang nummer ${trip.visitNumber} på denne turen, og du fikk ${trip.milestoneBonus} bonus-XP for å nå en ny turmilepæl.`);
  }
  const bonusText = bonusParts.length ? ` ${bonusParts.join(" ")}` : "";
  const ageText = trip?.ageFactor > 1
    ? ` Alderstilpasningen ga deg ${trip.baseXp - trip.originalBaseXp} ekstra XP på den vanlige turbelønningen.`
    : "";
  const xpText = `${ageText} Denne turen ga deg totalt ${xpEarned} XP!`;
  const rankText = rankUpIndex !== null
    ? ` Gratulerer – du er nå ${xpRanks[rankUpIndex].title}!`
    : "";
  const text = `${mainText}${bonusText}${xpText}${rankText}`;
  profile.recentFullFeedback ||= [];
  profile.recentFullFeedback.push(text);
  profile.recentFullFeedback = profile.recentFullFeedback.slice(-6);
  return text;
}

function pickFresh(profile, bank, key, memorySize = 2) {
  profile.recentFeedback ||= [];
  const recent = profile.recentFeedback
    .filter(x => x.key === key)
    .slice(-memorySize)
    .map(x => x.index);
  const availableIndexes = bank.map((_, index) => index).filter(index => !recent.includes(index));
  const pool = availableIndexes.length ? availableIndexes : bank.map((_, index) => index);
  const index = pool[Math.floor(Math.random() * pool.length)];
  profile.recentFeedback.push({ key, index });
  profile.recentFeedback = profile.recentFeedback.slice(-40);
  return bank[index];
}


function renderAll() {
  const p = activeProfile();
  renderProfileSelector();
  renderProfileForm(p);
  renderHero(p);
  renderProgress(p);
  renderFeedback(p);
  renderTrips(p);
  maybeShowRankCelebration(p);
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
  document.getElementById("profile-age").value = Number.isInteger(Number(p.age)) && Number(p.age) > 0 ? p.age : "";
  document.getElementById("favorite-player").value = p.favoritePlayer;
  document.getElementById("profile-image").value = "";
  document.getElementById("profile-camera").value = "";
  document.getElementById("profile-image-status").textContent = "";
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
  const heroRank = xpRanks[Math.min(level - 1, xpRanks.length - 1)];
  document.getElementById("hero-rank-title").textContent = heroRank.title;
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

  const xpLevel = Math.floor(p.stats.xp / 500) + 1;
  const currentXp = p.stats.xp % 500;
  const xpPercent = Math.round(currentXp / 500 * 100);
  const rankIndex = getXpRankIndex(p.stats.xp);
  const rank = xpRanks[rankIndex];
  document.getElementById("total-xp").textContent = p.stats.xp;
  document.getElementById("xp-rank-title").textContent = rank.title;
  document.getElementById("xp-trophy").textContent = rank.trophy;
  document.getElementById("xp-trophy").dataset.level = String(rankIndex + 1);
  document.getElementById("xp-trophy").setAttribute("aria-label", `${rank.medalName}: ${rank.title}`);
  document.getElementById("xp-medal-name").textContent = rank.medalName;
  const isFinalRank = rankIndex === xpRanks.length - 1;
  document.getElementById("xp-remaining").textContent = isFinalRank
    ? "Høyeste nivå"
    : `${500-currentXp} XP igjen`;
  setBar("xp-progress", isFinalRank ? 100 : xpPercent);
}

function renderSkill(key, rawPoints) {
  const points = Math.max(0, Number(rawPoints) || 0);
  const tier = getSkillTier(points);
  const tierLength = tier.max - tier.min;
  const progressInTier = Math.max(0, points - tier.min);
  const isMaxedElite = tier.label === "ELITE" && points >= tier.max;
  const percent = isMaxedElite
    ? 100
    : Math.floor((progressInTier / tierLength) * 100);

  const percentElement = document.getElementById(`skill-${key}`);
  const levelElement = document.getElementById(`skill-${key}-level`);
  const iconsElement = document.getElementById(`skill-${key}-icons`);

  if (percentElement) percentElement.textContent = `${clamp(percent, 0, 100)}%`;
  if (levelElement) levelElement.textContent = `NIVÅ ${tier.label}`;
  if (iconsElement) {
    iconsElement.textContent = Array(tier.icons).fill(getSkillIcon(key)).join(" ");
    iconsElement.setAttribute("aria-label", `${tier.icons} nivåsymboler`);
  }
  setBar(`skill-${key}-bar`, percent);
}

function getSkillTier(rawPoints) {
  const points = Math.max(0, Number(rawPoints) || 0);
  return skillTiers.find(tier => points >= tier.min && points < tier.max)
    || skillTiers[skillTiers.length - 1];
}

function getSkillIcon(key) {
  return { motor: "⚡", strength: "↯", balance: "↔", mindset: "★" }[key];
}


function getXpRankIndex(xp) {
  return Math.min(Math.floor(Math.max(0, Number(xp) || 0) / 500), xpRanks.length - 1);
}

function maybeShowRankCelebration(profile) {
  const latest = profile.trips[0];
  if (!latest || latest.rankUp === null || latest.rankUp === undefined || latest.rankCelebrated) return;

  const rank = xpRanks[latest.rankUp];
  document.getElementById("rank-up-symbol").textContent = rank.trophy;
  document.getElementById("rank-up-title").textContent = rank.title;
  document.getElementById("rank-up-medal").textContent = rank.medalName;
  const overlay = document.getElementById("rank-up-overlay");
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("show"));

  latest.rankCelebrated = true;
  saveData();
}

function closeRankCelebration() {
  const overlay = document.getElementById("rank-up-overlay");
  overlay.classList.remove("show");
  window.setTimeout(() => { overlay.hidden = true; }, 250);
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
        <strong>${escapeHtml(t.name || formatDate(t.date))}</strong>
        <span>${escapeHtml(formatDate(t.date))} · ${formatNumber(t.distance,1)} km · ${Math.round(t.elevation)} hm · ${formatNumber(t.speed,1)} km/t</span>
        ${t.newPeakBonus ? `<span>Ny topp: +${t.newPeakBonus} bonus-XP</span>` : ""}
        ${t.milestoneBonus ? `<span>Turmilepæl ${t.visitNumber}: +${t.milestoneBonus} bonus-XP</span>` : ""}
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

function normalizeTripName(name) {
  return String(name || "")
    .trim()
    .toLocaleLowerCase("nb-NO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
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
