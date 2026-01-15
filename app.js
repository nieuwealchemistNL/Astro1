// Swiss Ephemeris WASM wrapper (CDN import)
import SwissEph from 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';
// (De README laat zien dat dit de CDN import is) :contentReference[oaicite:2]{index=2}

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const btnCalc = $("btnCalc");
const btnPdf  = $("btnPdf");

const planetsTblBody = $("planetsTbl").querySelector("tbody");
const housesTblBody  = $("housesTbl").querySelector("tbody");
const ascEl = $("asc");
const mcEl  = $("mc");

const lpEl = $("lp");
const ndayEl = $("nday");
const nmonEl = $("nmon");
const nyearEl= $("nyear");

let swe = null;
let lastResult = null;

const ZODIAC = [
  "Ram","Stier","Tweelingen","Kreeft","Leeuw","Maagd",
  "Weegschaal","Schorpioen","Boogschutter","Steenbok","Waterman","Vissen"
];

function norm360(x){
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}
function toSign(deg){
  const d = norm360(deg);
  const idx = Math.floor(d / 30);
  const within = d - idx*30;
  return { sign: ZODIAC[idx], within };
}
function fmtDeg(deg){
const JUPITER_TEXT = {
  Ram: "Groei komt via initiatief, lef en het durven kiezen voor jezelf.",
  Stier: "Groei komt via stabiliteit, geduld en het opbouwen van iets dat blijft.",
  Tweelingen: "Groei komt via leren, netwerken, schrijven, praten en nieuwsgierig blijven.",
  Kreeft: "Groei komt via emotionele veiligheid, zorg, intuïtie en een sterk thuisgevoel.",
  Leeuw: "Groei komt via creatie, zichtbaarheid, leiderschap en spelen vanuit het hart.",
  Maagd: "Groei komt via vaardigheden, verfijning, dienstbaarheid en praktische verbetering.",
  Weegschaal: "Groei komt via samenwerking, diplomatie, schoonheid en balans in relaties.",
  Schorpioen: "Groei komt via diepgang, eerlijkheid, transformatie en emotionele moed.",
  Boogschutter: "Groei komt via visie, zingeving, reizen/leren en vertrouwen in het grotere plaatje.",
  Steenbok: "Groei komt via verantwoordelijkheid, structuur, lange termijn en doelen realiseren.",
  Waterman: "Groei komt via originaliteit, vernieuwing, community en denken buiten kaders.",
  Vissen: "Groei komt via empathie, verbeelding, spiritualiteit en vertrouwen op innerlijk weten."
};

const SATURN_TEXT = {
  Ram: "De les is tempo en impuls beheersen: kracht met richting in plaats van alleen snelheid.",
  Stier: "De les is loslaten van controle/zekerheid: flexibiliteit ontwikkelen zonder onrust.",
  Tweelingen: "De les is focus: minder versnippering, meer verdieping en afmaken wat je start.",
  Kreeft: "De les is emotionele grenzen: niet alles dragen, maar bewust kiezen wat van jou is.",
  Leeuw: "De les is ego vs. hart: eigenwaarde zonder afhankelijk te worden van bevestiging.",
  Maagd: "De les is mildheid: perfectionisme ombuigen naar gezonde standaarden.",
  Weegschaal: "De les is kiezen: harmonie zonder jezelf weg te cijferen of te blijven twijfelen.",
  Schorpioen: "De les is vertrouwen: controle en wantrouwen transformeren naar openheid met grenzen.",
  Boogschutter: "De les is realiteitszin: visie verbinden met discipline en concrete stappen.",
  Steenbok: "De les is zachtheid: verantwoordelijkheid dragen zonder verkramping of hardheid.",
  Waterman: "De les is verbinden: onafhankelijk blijven, maar niet emotioneel afstandelijk worden.",
  Vissen: "De les is gronding: gevoeligheid kanaliseren zonder te verdwijnen in escapisme."
};

const LIFE_PATH_TEXT = {
  1: "Levenspad 1 draait om zelfstandigheid, initiatief en je eigen koers durven volgen.",
  2: "Levenspad 2 draait om samenwerking, sensitiviteit en de kracht van verbinding.",
  3: "Levenspad 3 draait om expressie, creativiteit, communicatie en lichtheid brengen.",
  4: "Levenspad 4 draait om structuur, betrouwbaarheid en iets opbouwen dat stevig staat.",
  5: "Levenspad 5 draait om vrijheid, verandering, ervaring en leren door het leven zelf.",
  6: "Levenspad 6 draait om zorg, verantwoordelijkheid, harmonie en heling in relaties/omgeving.",
  7: "Levenspad 7 draait om verdieping, analyse, spiritualiteit en innerlijke waarheid zoeken.",
  8: "Levenspad 8 draait om kracht, leiding, manifestatie en gezond omgaan met materie/ambitie.",
  9: "Levenspad 9 draait om compassie, afronding, idealen en betekenisvol bijdragen.",
  11: "Levenspad 11 (master) draait om intuïtie, inspiratie en het verwoorden van hogere inzichten.",
  22: "Levenspad 22 (master) draait om groot bouwen: visie praktisch maken en duurzaam neerzetten.",
  33: "Levenspad 33 (master) draait om compassie in actie: heling, onderwijs en dienstbaarheid."
};

function makeTalentAndLesson(jupiterSign, saturnSign) {
  const talent = JUPITER_TEXT[jupiterSign] || "Groei komt via ontwikkeling van talent en vertrouwen.";
  const lesson = SATURN_TEXT[saturnSign] || "De les is volwassen worden in grenzen, discipline en richting.";
  return { talent, lesson };
}

function makeNumerologyThread(lifePath) {
  return LIFE_PATH_TEXT[lifePath] || `Levenspad ${lifePath} vormt de rode draad in ontwikkeling en keuzes.`;
}
  const d = norm360(deg);
  const whole = Math.floor(d);
  const min = Math.floor((d - whole) * 60);
  return `${whole}°${String(min).padStart(2,"0")}'`;
}

function reduceToDigit(n){
  // numerologie: reduceer naar 1-9, maar laat 11/22/33 staan
  let x = Math.abs(n);
  while (x > 9 && x !== 11 && x !== 22 && x !== 33){
    x = String(x).split("").reduce((a,c)=>a+Number(c),0);
  }
  return x;
}

function numerologyFromDate(y,m,d){
  const lp = reduceToDigit(reduceToDigit(y) + reduceToDigit(m) + reduceToDigit(d));
  return {
    lifePath: lp,
    day: reduceToDigit(d),
    month: reduceToDigit(m),
    year: reduceToDigit(y)
  };
}

function parseInputs(){
  const name = $("name").value.trim();
  const dateStr = $("date").value;
  const timeStr = $("time").value;
  const tz = Number($("tz").value);
  const lat = Number($("lat").value);
  const lon = Number($("lon").value);
  const hsys = $("hsys").value;
  const pages = Number($("pages").value);

  if(!dateStr) throw new Error("Kies een geboortedatum.");
  if(!timeStr) throw new Error("Kies een geboortetijd (minuten is genoeg).");
  if(Number.isNaN(tz)) throw new Error("Timezone is niet geldig.");
  if(Number.isNaN(lat) || Number.isNaN(lon)) throw new Error("Latitude/Longitude ontbreken of zijn ongeldig.");

  const [Y,M,D] = dateStr.split("-").map(Number);
  const [hh,mm] = timeStr.split(":").map(Number);

  return { name, Y, M, D, hh, mm, tz, lat, lon, hsys, pages };
}

async function init(){
  statusEl.textContent = "Swiss Ephemeris initialiseren…";
  swe = new SwissEph();
  await swe.initSwissEph();
  statusEl.textContent = "Klaar. Vul gegevens in en klik ‘Bereken’.";

  // defaults (handig)
  if(!$("date").value){
    $("date").value = "1980-08-04";
    $("time").value = "02:25";
    $("lat").value  = "52.0907";
    $("lon").value  = "5.1214";
    $("tz").value   = "2"; // augustus = vaak zomertijd
  }
}

function computeJulianDayUT(Y,M,D,hh,mm,tz){
  // input tijd is lokaal; SwissEph julday verwacht UT-uur (float)
  const localHour = hh + (mm/60);
  const utHour = localHour - tz;
  return swe.julday(Y, M, D, utHour);
}

function renderPlanets(planets){
  planetsTblBody.innerHTML = "";
  for(const p of planets){
    const s = toSign(p.lon);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.label}</td>
      <td>${fmtDeg(p.lon)}</td>
      <td>${s.sign} ${fmtDeg(s.within)}</td>
    `;
    planetsTblBody.appendChild(tr);
  }
}

function renderHouses(cusps, ascLon, mcLon){
  housesTblBody.innerHTML = "";
  for(let i=1;i<=12;i++){
    const lon = cusps[i];
    const s = toSign(lon);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td>${fmtDeg(lon)}</td>
      <td>${s.sign} ${fmtDeg(s.within)}</td>
    `;
    housesTblBody.appendChild(tr);
  }
  const ascS = toSign(ascLon);
  const mcS  = toSign(mcLon);
  ascEl.textContent = `${ascS.sign} ${fmtDeg(ascS.within)} (${fmtDeg(ascLon)})`;
  mcEl.textContent  = `${mcS.sign} ${fmtDeg(mcS.within)} (${fmtDeg(mcLon)})`;
}

function renderNumerology(n){
  lpEl.textContent = n.lifePath;
  ndayEl.textContent = n.day;
  nmonEl.textContent = n.month;
  nyearEl.textContent= n.year;
}

async function calculate(){
  btnCalc.disabled = true;
  btnPdf.disabled = true;

  try{
    const input = parseInputs();
    statusEl.textContent = "Berekenen…";

    const jdUT = computeJulianDayUT(input.Y,input.M,input.D,input.hh,input.mm,input.tz);

    // Flags: gebruik Swiss Ephemeris (SWIEPH)
    const flags = swe.SEFLG_SWIEPH;

    const planetDefs = [
      { id: swe.SE_SUN, label:"Zon" },
      { id: swe.SE_MOON, label:"Maan" },
      { id: swe.SE_MERCURY, label:"Mercurius" },
      { id: swe.SE_VENUS, label:"Venus" },
      { id: swe.SE_MARS, label:"Mars" },
      { id: swe.SE_JUPITER, label:"Jupiter" },
      { id: swe.SE_SATURN, label:"Saturnus" },
      { id: swe.SE_URANUS, label:"Uranus" },
      { id: swe.SE_NEPTUNE, label:"Neptunus" },
      { id: swe.SE_PLUTO, label:"Pluto" },
      { id: swe.SE_TRUE_NODE ?? swe.SE_MEAN_NODE, label:"Noordknoop" }
    ];

    const planets = planetDefs.map(def => {
      const res = swe.calc_ut(jdUT, def.id, flags);
      // res[0] = ecliptische lengte
      return { label: def.label, lon: res[0] };
    });

    // Huizen
    // In Swiss Ephemeris is house system een char zoals 'P', 'W', 'E', 'K'
    // Veel wrappers exposen dit als swe.houses(jdUT, lat, lon, hsys)
    const houseRes = swe.houses(jdUT, input.lat, input.lon, input.hsys);
    // Verwacht: { cusps: Array(13), ascmc: Array(?) } of [cusps, ascmc]
    let cusps, ascmc;

    if(Array.isArray(houseRes)){
      [cusps, ascmc] = houseRes;
    } else {
      cusps = houseRes.cusps;
      ascmc = houseRes.ascmc ?? houseRes.ascmc2 ?? houseRes.ascmcArray;
    }

    // In SwissEph: ascmc[0]=Asc, ascmc[1]=MC (vaak 0-based)
    const ascLon = ascmc?.[0] ?? ascmc?.[1] ?? null;
    const mcLon  = ascmc?.[1] ?? ascmc?.[0] ?? null;

    if(!cusps || cusps.length < 13) throw new Error("Huizenberekening gaf geen cusps terug (check lat/lon/tz).");
    if(ascLon === null || mcLon === null) throw new Error("ASC/MC ontbreken in house output (API mismatch).");

    const numerology = numerologyFromDate(input.Y, input.M, input.D);

    renderPlanets(planets);
    renderHouses(cusps, ascLon, mcLon);
    renderNumerology(numerology);

    lastResult = { input, jdUT, planets, cusps, ascLon, mcLon, numerology };
    btnPdf.disabled = false;

    statusEl.textContent = "Klaar. Je kunt nu PDF genereren.";
  } catch(err){
    console.error(err);
    statusEl.textContent = `⚠️ ${err.message || err}`;
  } finally {
    btnCalc.disabled = false;
  }
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight){
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function generatePdf(){
  if(!lastResult) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });

  const { input, planets, cusps, ascLon, mcLon, numerology } = lastResult;
  const totalPages = input.pages;

  // Marges
  const marginX = 14;
  let y = 18;

  // Pagina 1: Cover
  doc.setFont("helvetica","bold");
  doc.setFontSize(18);
  doc.text("Astrologie + Numerologie Profiel", marginX, y);
  y += 10;

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);

  const labelName = input.name ? input.name : "—";
  const dateLine = `${String(input.D).padStart(2,"0")}-${String(input.M).padStart(2,"0")}-${input.Y} ${String(input.hh).padStart(2,"0")}:${String(input.mm).padStart(2,"0")} (TZ ${input.tz >= 0 ? "+" : ""}${input.tz})`;
  const locLine  = `Locatie: lat ${input.lat}, lon ${input.lon} | Huizen: ${input.hsys}`;

  y = addWrappedText(doc, `Naam: ${labelName}\nGeboorte: ${dateLine}\n${locLine}`, marginX, y, 180, 5);
  y += 6;

  doc.setFont("helvetica","bold");
  doc.text("Numerologie (kern)", marginX, y);
  y += 6;

  doc.setFont("helvetica","normal");
  doc.text(`Life Path: ${numerology.lifePath} | Dag: ${numerology.day} | Maand: ${numerology.month} | Jaar: ${numerology.year}`, marginX, y);
  y += 10;

  doc.setFont("helvetica","italic");
  y = addWrappedText(
    doc,
    "Let op: dit rapport is bedoeld voor inzicht en zelfreflectie. Geen medische/psychologische diagnose.",
    marginX, y, 180, 5
  );

  // Pagina 2: Planeten tabel
  if(totalPages >= 2){
    doc.addPage();
    y = 18;
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text("Planetenposities (tropisch)", marginX, y);
    y += 8;

    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    planets.forEach(p=>{
      const s = toSign(p.lon);
      doc.text(`${p.label}: ${fmtDeg(p.lon)} — ${s.sign} ${fmtDeg(s.within)}`, marginX, y);
      y += 6;
      if(y > 280){ doc.addPage(); y = 18; }
    });
  }

  // Pagina 3: Huizen + ASC/MC
  if(totalPages >= 3){
    doc.addPage();
    y = 18;
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text("Huizen (cusps) + Hoeken", marginX, y);
    y += 10;

    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    const ascS = toSign(ascLon);
    const mcS  = toSign(mcLon);
    doc.text(`ASC: ${ascS.sign} ${fmtDeg(ascS.within)} (${fmtDeg(ascLon)})`, marginX, y); y += 6;
    doc.text(`MC:  ${mcS.sign} ${fmtDeg(mcS.within)} (${fmtDeg(mcLon)})`, marginX, y); y += 10;

    for(let i=1;i<=12;i++){
      const lon = cusps[i];
      const s = toSign(lon);
      doc.text(`Huis ${i}: ${fmtDeg(lon)} — ${s.sign} ${fmtDeg(s.within)}`, marginX, y);
      y += 6;
      if(y > 280){ doc.addPage(); y = 18; }
    }
  }

  // Extra pagina’s (4..N): placeholders die jij later kan vullen
  // (handig: je kunt hier later automatisch tekstmodules aanhaken)
// Pagina 4: Karakter & Dynamiek (automatisch)
if (totalPages >= 4) {
  doc.addPage();
  y = 18;

  doc.setFont("helvetica","bold");
  doc.setFontSize(14);
  doc.text("Karakter & Dynamiek", marginX, y);
  y += 10;

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);

  const sunLon   = planets.find(p=>p.label==="Zon")?.lon;
  const moonLon  = planets.find(p=>p.label==="Maan")?.lon;
  const venusLon = planets.find(p=>p.label==="Venus")?.lon;
  const marsLon  = planets.find(p=>p.label==="Mars")?.lon;

  const sunSign  = toSign(sunLon).sign;
  const moonSign = toSign(moonLon).sign;
  const venusSign= toSign(venusLon).sign;
  const marsSign = toSign(marsLon).sign;
  const ascSign  = toSign(ascLon).sign;

  const coreSentence = makeCoreSentence(sunSign, ascSign, numerology.lifePath);

  y = addWrappedText(doc, `Kernzin\n${coreSentence}\n`, marginX, y, 180, 5);

  y = addWrappedText(doc,
    `Emotionele stijl (${moonSign})\n${SIGN_TEXT[moonSign]?.emotion || "Emoties worden beleefd vanuit persoonlijke veiligheid en innerlijke verwerking."}\n`,
    marginX, y, 180, 5
  );

  y = addWrappedText(doc,
    `Relatiebehoefte (${venusSign})\n${SIGN_TEXT[venusSign]?.relation || "In relaties is verbinding, vertrouwen en wederzijds begrip belangrijk."}\n`,
    marginX, y, 180, 5
  );

  y = addWrappedText(doc,
    `Actie & wil (${marsSign})\n${SIGN_TEXT[marsSign]?.action || "Actie wordt gestuurd door motivatie, richting en volharding."}`,
    marginX, y, 180, 5
  );
}

// Pagina 5: Talenten & Uitdagingen (automatisch)
if (totalPages >= 5) {
  doc.addPage();
  y = 18;

  doc.setFont("helvetica","bold");
  doc.setFontSize(14);
  doc.text("Talenten & Uitdagingen", marginX, y);
  y += 10;

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);

  const jupiterLon = planets.find(p=>p.label==="Jupiter")?.lon;
  const saturnLon  = planets.find(p=>p.label==="Saturnus")?.lon;

  const jupiterSign = toSign(jupiterLon).sign;
  const saturnSign  = toSign(saturnLon).sign;

  const talent = (typeof JUPITER_TEXT !== "undefined" && JUPITER_TEXT[jupiterSign])
    ? JUPITER_TEXT[jupiterSign]
    : "Groei komt via ontwikkeling van talent, vertrouwen en het benutten van kansen.";

  const lesson = (typeof SATURN_TEXT !== "undefined" && SATURN_TEXT[saturnSign])
    ? SATURN_TEXT[saturnSign]
    : "De les is volwassen worden in grenzen, discipline en het bouwen van structuur.";

  const numThread = (typeof makeNumerologyThread === "function")
    ? makeNumerologyThread(numerology.lifePath)
    : `Levenspad ${numerology.lifePath} vormt de rode draad in ontwikkeling en keuzes.`;

  y = addWrappedText(doc, `Talent & Groei (Jupiter in ${jupiterSign})\n${talent}\n`, marginX, y, 180, 5);
  y = addWrappedText(doc, `Valkuil & Les (Saturnus in ${saturnSign})\n${lesson}\n`, marginX, y, 180, 5);
  y = addWrappedText(doc, `Numerologische rode draad\n${numThread}\n`, marginX, y, 180, 5);

  y = addWrappedText(doc,
    "Afsluiting\nGebruik dit profiel als kompas voor zelfinzicht en bewustwording. Het beschrijft aanleg en dynamiek, geen vaststaand lot.",
    marginX, y, 180, 5
  );
}

// Extra pagina’s (6..N): placeholders (alleen voor 10/15)
for (let p = 6; p <= totalPages; p++) {
  doc.addPage();
  y = 18;
  doc.setFont("helvetica","bold"); doc.setFontSize(14);
  doc.text(`Interpretatie / Notities (pagina ${p}/${totalPages})`, marginX, y);
  y += 10;

  doc.setFont("helvetica","normal"); doc.setFontSize(11);
  y = addWrappedText(doc,
    "Gebruik deze pagina om je eigen duiding te schrijven. Suggestie-structuur:\n" +
    "• Thema’s per huis (4e/7e/10e)\n" +
    "• Eventuele aspecten (later uit te breiden)\n" +
    "• Praktische reflectievragen\n\n" +
    "Tip: plak hier later jouw vaste tekstblokken.",
    marginX, y, 180, 5
  );
}

    y = 18;
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text(`Interpretatie / Notities (pagina ${p}/${totalPages})`, marginX, y);
    y += 10;

    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    y = addWrappedText(doc,
      "Gebruik deze pagina om je eigen duiding te schrijven. Suggestie-structuur:\n" +
      "• Kernzin (wie is deze persoon?)\n" +
      "• Emotionele dynamiek (Maan + 4e/8e huis)\n" +
      "• Relaties (Venus + 7e huis)\n" +
      "• Drive/actie (Mars + 1e/10e huis)\n" +
      "• Talent/kracht (Zon/Jupiter) vs. valkuil (Saturnus)\n" +
      "• Numerologie: Life Path als rode draad\n\n" +
      "Tip: plak hier later jouw vaste tekstblokken per teken/huis/planeet.",
      marginX, y, 180, 5
    );
  }

   const safeName = (input.name || "profiel").replace(/[^\w\-]+/g,"_").slice(0,40);
  doc.save(`astro_numerologie_${safeName}_${input.Y}-${String(input.M).padStart(2,"0")}-${String(input.D).padStart(2,"0")}.pdf`);
} // <-- sluit generatePdf() (precies één keer)

btnCalc.addEventListener("click", calculate);
btnPdf.addEventListener("click", generatePdf);

init().catch(err=>{
  console.error(err);
  statusEl.textContent = `⚠️ Init faalde: ${err.message || err}`;
});
