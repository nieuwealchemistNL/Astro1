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
  for(let p=4; p<=totalPages; p++){
    doc.addPage();
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
}

btnCalc.addEventListener("click", calculate);
btnPdf.addEventListener("click", generatePdf);

init().catch(err=>{
  console.error(err);
  statusEl.textContent = `⚠️ Init faalde: ${err.message || err}`;
});
