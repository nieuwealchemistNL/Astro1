// Swiss Ephemeris WASM wrapper (CDN import)
import SwissEph from "https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js";

const $ = (id) => document.getElementById(id);

// UI refs
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
const nyearEl = $("nyear");

const chartImgInput = $("chartImg");

let swe = null;
let lastResult = null;

// Uploaded chart image (dataURL)
let chartImageDataUrl = null;
let chartImageFormat = null; // "PNG" | "JPEG"

// ================= Basics =================
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
  const within = d - idx * 30;
  return { sign: ZODIAC[idx], within };
}

function fmtDeg(deg){
  const d = norm360(deg);
  const whole = Math.floor(d);
  const min = Math.floor((d - whole) * 60);
  return `${whole}°${String(min).padStart(2,"0")}'`;
}

// ================= Text modules (premium feel) =================

// 1) Planeet = onderwerp
const PLANET_MEANING = {
  "Zon": "identiteit, zelfexpressie, vitaliteit en creatiekracht",
  "Maan": "emoties, veiligheid, hechting en je innerlijke behoeften",
  "Mercurius": "denken, taal, communicatie en informatieverwerking",
  "Venus": "liefde, verbinding, waarden, schoonheid en aantrekkingskracht",
  "Mars": "drive, wil, daadkracht, grenzen en hoe je voor jezelf opkomt",
  "Jupiter": "groei, vertrouwen, kansen, wijsheid en levensvisie",
  "Saturnus": "structuur, verantwoordelijkheid, grenzen en de les van volwassenheid",
  "Uranus": "vrijheid, vernieuwing, doorbraken en jouw unieke afwijking van de norm",
  "Neptunus": "intuïtie, mystiek, verbeelding, idealen en gevoeligheid",
  "Pluto": "transformatie, macht, diepgaande waarheid en loslaten van oude lagen",
  "Noordknoop": "richting van ontwikkeling, groei en zielsthema’s"
};

// 2) Teken = stijl (incl. sleutelzin)
const SIGN_TEXT = {
  Ram: {
    core:"initiatief, vuur en directe zelfexpressie",
    emotion:"Je gevoel beweegt snel en eerlijk: je voelt het, je zegt het, je handelt.",
    relation:"Je houdt van levendigheid en eerlijkheid; ruimte is essentieel.",
    action:"Je zet energie direct om in actie en neemt graag het voortouw.",
    shadow:"Ongeduld, impulsiviteit of botsen door te snel te gaan.",
    key:"Sleutel: vertraag één tel, kies richting, dan ga je dóór."
  },
  Stier: {
    core:"stabiliteit, belichaming en duurzame veiligheid",
    emotion:"Je gevoel zoekt rust en zekerheid; je hecht aan wat betrouwbaar is.",
    relation:"Trouw, aanraking en continuïteit zijn belangrijker dan drama.",
    action:"Je bouwt stap voor stap; langzaam maar onverzettelijk.",
    shadow:"Vasthouden, comfortzone, weerstand tegen verandering.",
    key:"Sleutel: beweeg mee in kleine stappen; flexibiliteit is ook veiligheid."
  },
  Tweelingen: {
    core:"nieuwsgierigheid, taal en mentale flexibiliteit",
    emotion:"Je verwerkt gevoel via woorden: praten, schrijven, begrijpen.",
    relation:"Je valt op intelligentie, humor en speels contact.",
    action:"Je schakelt snel en ziet opties; je leert door variatie.",
    shadow:"Versnippering, onrust, te veel tegelijk waardoor je diepte mist.",
    key:"Sleutel: kies één draad per keer en maak hem af."
  },
  Kreeft: {
    core:"gevoeligheid, bescherming en emotionele verbondenheid",
    emotion:"Je voelt intens en zoekt geborgenheid; sfeer beïnvloedt je sterk.",
    relation:"Je wilt veiligheid, loyaliteit en ‘thuis’ bij iemand kunnen landen.",
    action:"Je beweegt vanuit gevoel; je beschermt wat je lief is.",
    shadow:"Terugtrekken, overdragen, te veel dragen voor anderen.",
    key:"Sleutel: grenzen zijn liefde; zorg ook voor jouw bedding."
  },
  Leeuw: {
    core:"creatie, hartkracht en zichtbaarheid",
    emotion:"Je gevoelens zijn warm en loyaal; je wilt oprecht kunnen stralen.",
    relation:"Je hebt waardering nodig; liefde is ook spelen en genieten.",
    action:"Je bent moedig als je hart aan staat; je durft te leiden.",
    shadow:"Trots, overcompenseren, bevestiging zoeken buiten jezelf.",
    key:"Sleutel: kies expressie boven bewijsdrang."
  },
  Maagd: {
    core:"verfijning, bewustzijn en praktische verbetering",
    emotion:"Je voelt precies waar iets ‘niet klopt’ en wil het beter maken.",
    relation:"Je hecht aan betrouwbaarheid en echte inzet, niet aan woorden.",
    action:"Je werkt consistent, slim en detailgericht.",
    shadow:"Perfectionisme, zelfkritiek, overcontrole.",
    key:"Sleutel: ‘goed genoeg’ is een kracht — zachtheid maakt je effectiever."
  },
  Weegschaal: {
    core:"harmonie, schoonheid en afstemming",
    emotion:"Je gevoel zoekt balans; spanning los je het liefst elegant op.",
    relation:"Je verlangt gelijkwaardigheid, respect en een mooie dynamiek.",
    action:"Je handelt diplomatiek en strategisch; je weegt zorgvuldig af.",
    shadow:"Twijfel, conflictvermijding, jezelf verliezen in afstemming.",
    key:"Sleutel: kies helder; echte harmonie ontstaat door waarheid."
  },
  Schorpioen: {
    core:"diepgang, transformatie en emotionele intensiteit",
    emotion:"Je voelt krachtig; je vertrouwt pas als het echt is.",
    relation:"Je zoekt loyaliteit en emotionele eerlijkheid; half werk voelt leeg.",
    action:"Je bent vastberaden, met sterke innerlijke focus.",
    shadow:"Controle, wantrouwen, vasthouden aan pijn of macht.",
    key:"Sleutel: kwetsbaarheid met grenzen — dat is jouw echte kracht."
  },
  Boogschutter: {
    core:"zingeving, vrijheid en visie",
    emotion:"Je gevoel wil perspectief; je herstelt door betekenis.",
    relation:"Je verlangt ruimte en groei; samen leren en beleven.",
    action:"Je handelt optimistisch en doelgericht als er een ‘waarom’ is.",
    shadow:"Rusteloosheid, wegrelativeren, diepte vermijden.",
    key:"Sleutel: blijf aanwezig — visie + eerlijk voelen maakt je wijs."
  },
  Steenbok: {
    core:"structuur, verantwoordelijkheid en innerlijke autoriteit",
    emotion:"Je voelt liever privé; je stabiliseert door controle en planning.",
    relation:"Je toont liefde door loyaliteit, betrouwbaarheid en dragen.",
    action:"Je bouwt duurzaam, met discipline en lange adem.",
    shadow:"Verharding, werkvlucht, te streng voor jezelf.",
    key:"Sleutel: zachtheid is geen zwakte — het is emotionele volwassenheid."
  },
  Waterman: {
    core:"originaliteit, vrijheid en vernieuwing",
    emotion:"Je verwerkt gevoel vaak via denken; je hebt ruimte nodig.",
    relation:"Vriendschap, gelijkwaardigheid en mentale klik zijn essentieel.",
    action:"Je handelt vernieuwend en eigenzinnig; je doorbreekt patronen.",
    shadow:"Afstandelijkheid, ontkoppelen, ‘boven’ het gevoel gaan zitten.",
    key:"Sleutel: laat je hart meedoen — verbinding is jouw evolutie."
  },
  Vissen: {
    core:"intuïtie, empathie en subtiele gevoeligheid",
    emotion:"Je voelt mee, diep; je pikt sferen en onderstromen snel op.",
    relation:"Je zoekt zielsresonantie en zachte openheid.",
    action:"Je handelt intuïtief; je volgt signalen en timing.",
    shadow:"Escapisme, grenzen verliezen, te veel dragen van anderen.",
    key:"Sleutel: gronding + grenzen maken je gave veilig en krachtig."
  }
};

// 3) Huizen focus: 1/4/7/10
const HOUSE_MEANING = {
  1: "Identiteit & uitstraling (hoe je binnenkomt, je stijl, je ‘ik’).",
  4: "Thuis & wortels (veiligheid, familiepatronen, innerlijke basis).",
  7: "Relaties & spiegel (partnerschap, projectie, gelijkwaardigheid).",
  10:"Roeping & werk (richting, reputatie, maatschappelijke plek)."
};

function houseFocusText(houseNr, sign){
  const s = SIGN_TEXT[sign];
  if(!s){
    return `${HOUSE_MEANING[houseNr]} Dit gebied vraagt om bewuste aandacht en ontwikkeling.`;
  }
  return `${HOUSE_MEANING[houseNr]} In ${sign}: je benadert dit met ${s.core}. ${s.key}`;
}

// 4) Korte vraagsets (coach-waardig)
function questionsForRelationship(){
  return [
    "Wat heb ik nodig om me veilig én vrij te voelen in verbinding?",
    "Waar pas ik me aan uit angst voor conflict, en wat is de waarheid daaronder?"
  ];
}
function questionsForDrive(){
  return [
    "Wat is mijn natuurlijke tempo als ik niet ‘moet’ van mezelf?",
    "Wat vermijd ik door ‘aardig’ te blijven — en wat wil ik eigenlijk?"
  ];
}
function questionsForTalent(){
  return [
    "Waar gaat groei moeiteloos als ik consistent blijf?",
    "Welke structuur helpt mij om mijn potentieel te belichamen?"
  ];
}

// ================= Numerology =================
function reduceToDigit(n){
  let x = Math.abs(n);
  while(x > 9 && x !== 11 && x !== 22 && x !== 33){
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

function makeNumerologyThread(lifePath){
  const map = {
    1:"Levenspad 1 vraagt om leiderschap, autonomie en kiezen voor jouw koers.",
    2:"Levenspad 2 vraagt om samenwerking, sensitiviteit en gezonde afstemming.",
    3:"Levenspad 3 vraagt om expressie, creatie en jouw stem laten horen.",
    4:"Levenspad 4 vraagt om structuur, vakmanschap en duurzaam bouwen.",
    5:"Levenspad 5 vraagt om vrijheid, verandering en leren door ervaring.",
    6:"Levenspad 6 vraagt om verantwoordelijkheid, harmonie en heling in verbinding.",
    7:"Levenspad 7 vraagt om verdieping, studie, innerlijke waarheid en vertrouwen.",
    8:"Levenspad 8 vraagt om kracht, manifestatie en volwassen omgaan met ambitie.",
    9:"Levenspad 9 vraagt om afronding, compassie en betekenisvolle bijdrage.",
    11:"Levenspad 11 vraagt om intuïtie, inspiratie en het dragen van een visie.",
    22:"Levenspad 22 vraagt om groot bouwen: visie praktisch en duurzaam neerzetten.",
    33:"Levenspad 33 vraagt om heling in actie: liefde, onderwijs en dienstbaarheid."
  };
  return map[lifePath] || `Levenspad ${lifePath} vormt de rode draad van jouw ontwikkeling.`;
}

function makeCoreSentence(sunSign, ascSign, lifePath){
  return `Zon in ${sunSign} als kern, Ascendant in ${ascSign} als uitstraling. ${makeNumerologyThread(lifePath)}`;
}

// ================= Inputs =================
function parseInputs(){
  const name = $("name").value.trim();
  const place = $("place").value.trim();
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

  return { name, place, Y, M, D, hh, mm, tz, lat, lon, hsys, pages };
}

// ================= Chart upload (Optie A) =================
function handleChartUpload(file){
  if(!file){
    chartImageDataUrl = null;
    chartImageFormat = null;
    return;
  }
  const isPng = file.type === "image/png";
  const isJpg = file.type === "image/jpeg";
  if(!isPng && !isJpg){
    chartImageDataUrl = null;
    chartImageFormat = null;
    statusEl.textContent = "⚠️ Alleen PNG of JPG toegestaan voor de horoscooptekening.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    chartImageDataUrl = String(reader.result);
    chartImageFormat = isPng ? "PNG" : "JPEG";
    statusEl.textContent = "Horoscooptekening geladen. (Wordt in PDF geplaatst.)";
  };
  reader.readAsDataURL(file);
}

// ================= Init =================
async function init(){
  statusEl.textContent = "Swiss Ephemeris initialiseren…";
  btnPdf.disabled = true;

  swe = new SwissEph();
  await swe.initSwissEph();

  // defaults (handig)
  if(!$("date").value){
    $("name").value = "marit visser";
    $("place").value = "Harmelen, Utrecht, Nederland";
    $("date").value = "1980-08-04";
    $("time").value = "02:25";
    $("lat").value  = "52.0882";
    $("lon").value  = "4.9633";
    $("tz").value   = "2";
  }

  chartImgInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0] || null;
    handleChartUpload(file);
  });

  statusEl.textContent = "Klaar. Vul gegevens in en klik ‘Bereken’.";
}

function computeJulianDayUT(Y,M,D,hh,mm,tz){
  const localHour = hh + (mm/60);
  const utHour = localHour - tz;
  return swe.julday(Y, M, D, utHour);
}

// ================= Rendering =================
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

// ================= House mapping helper =================
function getHouseIndex(planetLon, cusps){
  const lon = norm360(planetLon);

  function inArc(x, start, end){
    x = norm360(x); start = norm360(start); end = norm360(end);
    if(start <= end) return x >= start && x < end;
    return x >= start || x < end;
  }

  for(let h=1; h<=12; h++){
    const start = cusps[h];
    const end   = cusps[h===12 ? 1 : h+1];
    if(inArc(lon, start, end)) return h;
  }
  return null;
}

// ================= Calculate =================
async function calculate(){
  btnCalc.disabled = true;
  btnPdf.disabled = true;

  try{
    const input = parseInputs();
    statusEl.textContent = "Berekenen…";

    const jdUT = computeJulianDayUT(input.Y,input.M,input.D,input.hh,input.mm,input.tz);
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
      { id: (swe.SE_TRUE_NODE ?? swe.SE_MEAN_NODE), label:"Noordknoop" }
    ];

    const planets = planetDefs.map(def => {
      const res = swe.calc_ut(jdUT, def.id, flags);
      return { label: def.label, lon: res[0] };
    });

    const houseRes = swe.houses(jdUT, input.lat, input.lon, input.hsys);
    let cusps, ascmc;
    if(Array.isArray(houseRes)){
      [cusps, ascmc] = houseRes;
    } else {
      cusps = houseRes.cusps;
      ascmc = houseRes.ascmc ?? houseRes.ascmc2 ?? houseRes.ascmcArray;
    }

    const ascLon = ascmc?.[0];
    const mcLon  = ascmc?.[1];

    if(!cusps || cusps.length < 13) throw new Error("Huizenberekening gaf geen cusps terug (check lat/lon/tz).");
    if(ascLon == null || mcLon == null) throw new Error("ASC/MC ontbreken in house output (API mismatch).");

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

// ================= PDF helpers =================
function addWrappedText(doc, text, x, y, maxWidth, lineHeight){
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSectionTitle(doc, title, x, y){
  doc.setFont("helvetica","bold");
  doc.setFontSize(13);
  doc.text(title, x, y);
  return y + 7;
}

function getPlanet(planets, label){
  return planets.find(p => p.label === label)?.lon ?? null;
}

function generatePdf(){
  if(!lastResult) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });

  const { input, planets, cusps, ascLon, mcLon, numerology } = lastResult;
  const totalPages = input.pages;

  const marginX = 14;
  const maxW = 180;
  let y = 16;

  // ================= Page 1: Kernprofiel + (optioneel) tekening =================
  doc.setFont("helvetica","bold");
  doc.setFontSize(18);
  doc.text("Astrologie + Numerologie Profiel", marginX, y);
  y += 8;

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);

  const labelName = input.name ? input.name : "—";
  const dateLine = `${String(input.D).padStart(2,"0")}-${String(input.M).padStart(2,"0")}-${input.Y} ${String(input.hh).padStart(2,"0")}:${String(input.mm).padStart(2,"0")} (TZ ${input.tz >= 0 ? "+" : ""}${input.tz})`;
  const locLine  = input.place ? `Plaats: ${input.place} | lat ${input.lat}, lon ${input.lon}` : `Locatie: lat ${input.lat}, lon ${input.lon}`;
  const hLine    = `Huizen: ${input.hsys}`;

  y = addWrappedText(doc, `Naam: ${labelName}\nGeboorte: ${dateLine}\n${locLine}\n${hLine}`, marginX, y, maxW, 5);
  y += 4;

  // chart image (if uploaded)
  if(chartImageDataUrl && chartImageFormat){
    // reserve space
    const imgX = marginX;
    const imgW = 182;  // almost full width
    const imgH = 90;   // controlled height
    try{
      doc.addImage(chartImageDataUrl, chartImageFormat, imgX, y, imgW, imgH);
      y += imgH + 6;
    } catch(e){
      // If image fails, continue without crashing
      y = addWrappedText(doc, "⚠️ Horoscooptekening kon niet geplaatst worden (formaat/te groot). Probeer een kleinere PNG/JPG.", marginX, y, maxW, 5);
      y += 4;
    }
  }

  const sunLon   = getPlanet(planets, "Zon");
  const moonLon  = getPlanet(planets, "Maan");
  const venusLon = getPlanet(planets, "Venus");
  const marsLon  = getPlanet(planets, "Mars");
  const jupLon   = getPlanet(planets, "Jupiter");
  const satLon   = getPlanet(planets, "Saturnus");

  const sunSign  = sunLon != null ? toSign(sunLon).sign : "—";
  const moonSign = moonLon!= null ? toSign(moonLon).sign : "—";
  const ascSign  = toSign(ascLon).sign;

  y = addSectionTitle(doc, "Jouw kern (samenvatting)", marginX, y);
  const coreSentence = makeCoreSentence(sunSign, ascSign, numerology.lifePath);

  const strength = `Kracht: ${SIGN_TEXT[sunSign]?.core || "jouw natuurlijke kernkwaliteit"} + ${SIGN_TEXT[ascSign]?.core || "jouw uitstraling"}`
  const pitfall  = `Valkuil: ${SIGN_TEXT[moonSign]?.shadow || "terugkerende emotionele valkuil"}`
  const key      = `Sleutel: ${SIGN_TEXT[moonSign]?.key || "kies een volwassen sleutel voor balans"}`

  y = addWrappedText(doc,
    `${coreSentence}\n\nZon in ${sunSign}: ${SIGN_TEXT[sunSign]?.core || ""}.\nMaan in ${moonSign}: ${SIGN_TEXT[moonSign]?.emotion || ""}\nASC in ${ascSign}: ${SIGN_TEXT[ascSign]?.core || ""}.\n\n${strength}\n${pitfall}\n${key}\n\nNumerologie: Life Path ${numerology.lifePath} — ${makeNumerologyThread(numerology.lifePath)}`,
    marginX, y, maxW, 5
  );

  doc.setFont("helvetica","italic");
  doc.setFontSize(10);
  y += 2;
  addWrappedText(doc,
    "Let op: dit rapport is bedoeld voor zelfreflectie en richting. Geen medische/psychologische diagnose.",
    marginX, y, maxW, 4.5
  );

  // ================= Page 2: Planeten duiding =================
  if(totalPages >= 2){
    doc.addPage();
    y = 16;

    doc.setFont("helvetica","bold");
    doc.setFontSize(15);
    doc.text("Planeten: jouw innerlijke systemen", marginX, y);
    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    const corePlanets = ["Zon","Maan","Mercurius","Venus","Mars","Jupiter","Saturnus"];

    for(const pName of corePlanets){
      const lon = getPlanet(planets, pName);
      if(lon == null) continue;
      const s = toSign(lon);
      const st = SIGN_TEXT[s.sign];

      y = addSectionTitle(doc, `${pName} in ${s.sign} (${fmtDeg(s.within)})`, marginX, y);
      const meaning = PLANET_MEANING[pName] || "belangrijke thema’s in jouw systeem";
      const line1 = `${pName} staat voor ${meaning}.`;
      const line2 = `In ${s.sign} werkt dit via ${st?.core || "een specifieke stijl"}.`;
      const line3 = (pName === "Maan")
        ? `Jouw emotionele stijl: ${st?.emotion || ""}\nValkuil: ${st?.shadow || ""}\n${st?.key || ""}`
        : (pName === "Venus")
          ? `In verbinding: ${st?.relation || ""}\nValkuil: ${st?.shadow || ""}\n${st?.key || ""}`
          : (pName === "Mars")
            ? `In actie: ${st?.action || ""}\nSabotage: ${st?.shadow || ""}\n${st?.key || ""}`
            : `Schaduw: ${st?.shadow || ""}\n${st?.key || ""}`;

      y = addWrappedText(doc, `${line1}\n${line2}\n${line3}`, marginX, y, maxW, 5);
      y += 3;

      if(y > 270){ doc.addPage(); y = 16; }
    }
  }

  // ================= Page 3: Focusgebieden 1/4/7/10 =================
  if(totalPages >= 3){
    doc.addPage();
    y = 16;

    doc.setFont("helvetica","bold");
    doc.setFontSize(15);
    doc.text("Focusgebieden: waar het leven je vormt", marginX, y);
    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    const house1 = toSign(cusps[1]).sign;
    const house4 = toSign(cusps[4]).sign;
    const house7 = toSign(cusps[7]).sign;
    const house10= toSign(cusps[10]).sign;

    y = addSectionTitle(doc, `Huis 1 in ${house1}`, marginX, y);
    y = addWrappedText(doc, houseFocusText(1, house1), marginX, y, maxW, 5);

    y += 2; y = addSectionTitle(doc, `Huis 4 in ${house4}`, marginX, y);
    y = addWrappedText(doc, houseFocusText(4, house4), marginX, y, maxW, 5);

    y += 2; y = addSectionTitle(doc, `Huis 7 in ${house7}`, marginX, y);
    y = addWrappedText(doc, houseFocusText(7, house7), marginX, y, maxW, 5);

    y += 2; y = addSectionTitle(doc, `Huis 10 in ${house10}`, marginX, y);
    y = addWrappedText(doc, houseFocusText(10, house10), marginX, y, maxW, 5);

    // Extra: welke planeten vallen in 1/4/7/10
    const housePlanets = {};
    for(const p of planets){
      const h = getHouseIndex(p.lon, cusps);
      if(h == null) continue;
      if([1,4,7,10].includes(h)){
        housePlanets[h] = housePlanets[h] || [];
        housePlanets[h].push(p.label);
      }
    }

    y += 6;
    y = addSectionTitle(doc, "Planeten in jouw focusgebieden", marginX, y);
    const listLine = (hn) => housePlanets[hn]?.length ? housePlanets[hn].join(", ") : "—";
    y = addWrappedText(doc,
      `Huis 1: ${listLine(1)}\nHuis 4: ${listLine(4)}\nHuis 7: ${listLine(7)}\nHuis 10: ${listLine(10)}`,
      marginX, y, maxW, 5
    );
  }

  // ================= Page 4: Relaties + Drive/werkstijl =================
  if(totalPages >= 4){
    doc.addPage();
    y = 16;

    doc.setFont("helvetica","bold");
    doc.setFontSize(15);
    doc.text("Relaties & Drive", marginX, y);
    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    const venusSign = toSign(venusLon).sign;
    const marsSign  = toSign(marsLon).sign;
    const house7Sign = toSign(cusps[7]).sign;
    const house10Sign= toSign(cusps[10]).sign;

    // Relaties
    y = addSectionTitle(doc, "Relaties (liefde/verbinding)", marginX, y);
    y = addWrappedText(doc,
      `Venus in ${venusSign}: ${SIGN_TEXT[venusSign]?.relation}\n` +
      `Huis 7 in ${house7Sign}: je zoekt in partnerschap ${SIGN_TEXT[house7Sign]?.core}.\n` +
      `Valkuil: ${SIGN_TEXT[venusSign]?.shadow}\n` +
      `${SIGN_TEXT[venusSign]?.key}\n\n` +
      `Reflectievragen:\n• ${questionsForRelationship()[0]}\n• ${questionsForRelationship()[1]}`,
      marginX, y, maxW, 5
    );

    y += 6;

    // Drive/werkstijl
    y = addSectionTitle(doc, "Drive & werkstijl", marginX, y);
    y = addWrappedText(doc,
      `Mars in ${marsSign}: ${SIGN_TEXT[marsSign]?.action}\n` +
      `Huis 10 in ${house10Sign}: jouw roeping beweegt richting ${SIGN_TEXT[house10Sign]?.core}.\n` +
      `Sabotage: ${SIGN_TEXT[marsSign]?.shadow}\n` +
      `${SIGN_TEXT[marsSign]?.key}\n\n` +
      `Reflectievragen:\n• ${questionsForDrive()[0]}\n• ${questionsForDrive()[1]}`,
      marginX, y, maxW, 5
    );
  }

  // ================= Page 5: Talent/groei + Les + micro-acties =================
  if(totalPages >= 5){
    doc.addPage();
    y = 16;

    doc.setFont("helvetica","bold");
    doc.setFontSize(15);
    doc.text("Talent, groei & jouw route", marginX, y);
    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    const jSign = toSign(jupLon).sign;
    const sSign = toSign(satLon).sign;

    y = addSectionTitle(doc, "Talent & groei (Jupiter)", marginX, y);
    y = addWrappedText(doc,
      `Jupiter in ${jSign}: ${JUPITER_TEXT[jSign] || "Groei komt via vertrouwen en kansen zien."}\n` +
      `${SIGN_TEXT[jSign]?.key || ""}`,
      marginX, y, maxW, 5
    );

    y += 4;
    y = addSectionTitle(doc, "Les & volwassenheid (Saturnus)", marginX, y);
    y = addWrappedText(doc,
      `Saturnus in ${sSign}: ${SATURN_TEXT[sSign] || "De les is structuur en volwassen grenzen ontwikkelen."}\n` +
      `${SIGN_TEXT[sSign]?.key || ""}`,
      marginX, y, maxW, 5
    );

    y += 4;
    y = addSectionTitle(doc, "Jouw succesformule", marginX, y);
    y = addWrappedText(doc,
      `Wanneer je groei (${jSign}) koppelt aan structuur (${sSign}), ontstaat duurzame kracht. ${makeNumerologyThread(numerology.lifePath)}`,
      marginX, y, maxW, 5
    );

    y += 4;
    y = addSectionTitle(doc, "Micro-acties (deze week)", marginX, y);
    const acts = [
      `Kies 1 focus (geen 3): maak het af. (${SIGN_TEXT[ascSign]?.key || "Werk met focus."})`,
      `Plan 1 eerlijk gesprek: benoem jouw behoefte in 1 zin.`,
      `Maak 1 ‘structuur-anker’: vaste tijd/plek voor jouw ontwikkeling (15 min per dag).`
    ];
    y = addWrappedText(doc, `• ${acts[0]}\n• ${acts[1]}\n• ${acts[2]}\n\nReflectievragen:\n• ${questionsForTalent()[0]}\n• ${questionsForTalent()[1]}`, marginX, y, maxW, 5);
  }

  // ================= Extra pages (6..N) placeholders =================
  for(let p=6; p<=totalPages; p++){
    doc.addPage();
    y = 16;
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text(`Notities / Verdieping (pagina ${p}/${totalPages})`, marginX, y);
    y += 10;
    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    y = addWrappedText(doc,
      "Gebruik deze pagina voor extra duiding, aspecten, tijdlijnen, of verdiepende reflectie.\n\n" +
      "Suggesties:\n" +
      "• Noordknoop: zielsthema’s\n" +
      "• Aspecten (Zon–Maan, Venus–Mars)\n" +
      "• Jaarfocus / transit-notities\n" +
      "• Concrete rituelen / oefeningen",
      marginX, y, maxW, 5
    );
  }

  const safeName = (input.name || "profiel").replace(/[^\w\-]+/g,"_").slice(0,40);
  doc.save(`astro_numerologie_${safeName}_${input.Y}-${String(input.M).padStart(2,"0")}-${String(input.D).padStart(2,"0")}.pdf`);
}

// Wire up
btnCalc.addEventListener("click", calculate);
btnPdf.addEventListener("click", generatePdf);

init().catch(err=>{
  console.error(err);
  statusEl.textContent = `⚠️ Init faalde: ${err.message || err}`;
});
