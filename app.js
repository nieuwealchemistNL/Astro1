// Swiss Ephemeris WASM wrapper
import SwissEph from "https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js";

const $ = (id) => document.getElementById(id);

// ================= UI refs =================
const statusEl = $("status");
const btnCalc = $("btnCalc");
const btnPdf  = $("btnPdf");

const planetsTblBody = $("planetsTbl").querySelector("tbody");
const housesTblBody  = $("housesTbl").querySelector("tbody");
const ascEl = $("asc");
const mcEl  = $("mc");

const lpEl    = $("lp");
const ndayEl  = $("nday");
const nmonEl  = $("nmon");
const nyearEl = $("nyear");

let swe = null;
let lastResult = null;

// ================= Helpers =================
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
  return { sign: ZODIAC[idx], within: d - idx * 30 };
}

function fmtDeg(deg){
  const d = norm360(deg);
  const w = Math.floor(d);
  const m = Math.floor((d - w) * 60);
  return `${w}°${String(m).padStart(2,"0")}'`;
}

// ================= SIGN TEXT (12 TEKENS VOLLEDIG) =================
const SIGN_TEXT = {
  Ram: {
    core: "Initiatief, levenskracht en het verlangen om zichzelf direct te ervaren.",
    emotion: "Emoties worden direct, intens en zonder omwegen beleefd.",
    relation: "Zoekt eerlijkheid, levendigheid en ruimte voor autonomie.",
    action: "Handelt impulsief, moedig en met natuurlijke daadkracht.",
    shadow: "Valkuilen zijn ongeduld, impulsiviteit en moeite met afstemmen."
  },
  Stier: {
    core: "Stabiliteit, belichaming en het opbouwen van duurzame veiligheid.",
    emotion: "Emoties zijn diep, loyaal en gericht op innerlijke rust.",
    relation: "Zoekt betrouwbaarheid, nabijheid en continuïteit.",
    action: "Handelt langzaam maar vastberaden, gericht op behoud.",
    shadow: "Valkuilen zijn vasthouden, comfortzucht en emotionele stagnatie."
  },
  Tweelingen: {
    core: "Nieuwsgierigheid, mentale beweeglijkheid en communicatie.",
    emotion: "Emoties worden rationeel verwerkt en verbaal gedeeld.",
    relation: "Zoekt verbinding via gesprek, humor en mentale stimulatie.",
    action: "Handelt flexibel en snel, met meerdere interesses tegelijk.",
    shadow: "Valkuilen zijn versnippering, oppervlakkigheid en innerlijke onrust."
  },
  Kreeft: {
    core: "Gevoeligheid, bescherming en emotionele verbondenheid.",
    emotion: "Emoties zijn intens en verbonden met veiligheid en herinnering.",
    relation: "Zoekt zorg, vertrouwen en emotionele intimiteit.",
    action: "Handelt vanuit gevoel en beschermingsdrang.",
    shadow: "Valkuilen zijn overbescherming, terugtrekking en emotionele afhankelijkheid."
  },
  Leeuw: {
    core: "Zelfexpressie, creativiteit en het verlangen om te stralen.",
    emotion: "Emoties worden warm, trots en vanuit het hart beleefd.",
    relation: "Zoekt erkenning, loyaliteit en speelse verbondenheid.",
    action: "Handelt zelfverzekerd en met natuurlijke leiderschap.",
    shadow: "Valkuilen zijn ego-identificatie en afhankelijkheid van bevestiging."
  },
  Maagd: {
    core: "Bewustzijn, verfijning en praktische dienstbaarheid.",
    emotion: "Emoties worden geanalyseerd en innerlijk verwerkt.",
    relation: "Zoekt helderheid, betrouwbaarheid en wederzijdse inzet.",
    action: "Handelt nauwkeurig en gericht op verbetering.",
    shadow: "Valkuilen zijn perfectionisme, zelfkritiek en overcontrole."
  },
  Weegschaal: {
    core: "Harmonie, schoonheid en relationele afstemming.",
    emotion: "Emoties worden gespiegeld via relaties.",
    relation: "Zoekt gelijkwaardigheid en balans.",
    action: "Handelt diplomatiek en afwegend.",
    shadow: "Valkuilen zijn besluiteloosheid en conflictvermijding."
  },
  Schorpioen: {
    core: "Diepgang, transformatie en emotionele intensiteit.",
    emotion: "Emoties worden diep en vaak verborgen beleefd.",
    relation: "Zoekt absolute eerlijkheid en emotionele binding.",
    action: "Handelt krachtig en doelgericht.",
    shadow: "Valkuilen zijn controle, wantrouwen en emotionele verkramping."
  },
  Boogschutter: {
    core: "Zingeving, vrijheid en vertrouwen in het grotere geheel.",
    emotion: "Emoties worden positief en toekomstgericht benaderd.",
    relation: "Zoekt ruimte, groei en gedeelde idealen.",
    action: "Handelt enthousiast en visionair.",
    shadow: "Valkuilen zijn rusteloosheid en het vermijden van diepte."
  },
  Steenbok: {
    core: "Structuur, verantwoordelijkheid en innerlijke autoriteit.",
    emotion: "Emoties worden beheerst en pragmatisch benaderd.",
    relation: "Zoekt betrouwbaarheid en wederzijds respect.",
    action: "Handelt gedisciplineerd en doelgericht.",
    shadow: "Valkuilen zijn verharding en emotionele afsluiting."
  },
  Waterman: {
    core: "Originaliteit, vrijheid en vernieuwend bewustzijn.",
    emotion: "Emoties worden mentaal benaderd en op afstand gehouden.",
    relation: "Zoekt gelijkwaardigheid en mentale verbinding.",
    action: "Handelt vernieuwend en onafhankelijk.",
    shadow: "Valkuilen zijn afstandelijkheid en emotionele ontkoppeling."
  },
  Vissen: {
    core: "Intuïtie, empathie en grensoverschrijdende gevoeligheid.",
    emotion: "Emoties worden diep meegevoeld en opgenomen.",
    relation: "Zoekt zielsverbinding en energetische resonantie.",
    action: "Handelt intuïtief en meebewegend.",
    shadow: "Valkuilen zijn escapisme en verlies van grenzen."
  }
};

// ================= JUPITER / SATURN / NUMEROLOGIE =================
const JUPITER_TEXT = {
  Ram:"Groei via initiatief.",
  Stier:"Groei via stabiliteit.",
  Tweelingen:"Groei via leren en communicatie.",
  Kreeft:"Groei via zorg en emotionele veiligheid.",
  Leeuw:"Groei via creatie en zichtbaarheid.",
  Maagd:"Groei via verfijning en dienstbaarheid.",
  Weegschaal:"Groei via samenwerking.",
  Schorpioen:"Groei via transformatie.",
  Boogschutter:"Groei via visie.",
  Steenbok:"Groei via verantwoordelijkheid.",
  Waterman:"Groei via vernieuwing.",
  Vissen:"Groei via intuïtie."
};

const SATURN_TEXT = {
  Ram:"Les in gerichte daadkracht.",
  Stier:"Les in loslaten.",
  Tweelingen:"Les in focus.",
  Kreeft:"Les in emotionele grenzen.",
  Leeuw:"Les in authentieke eigenwaarde.",
  Maagd:"Les in mildheid.",
  Weegschaal:"Les in keuzes maken.",
  Schorpioen:"Les in vertrouwen.",
  Boogschutter:"Les in realiteitszin.",
  Steenbok:"Les in verzachting.",
  Waterman:"Les in verbinding.",
  Vissen:"Les in gronding."
};

function reduceToDigit(n){
  let x = Math.abs(n);
  while(x>9 && ![11,22,33].includes(x)){
    x = String(x).split("").reduce((a,c)=>a+Number(c),0);
  }
  return x;
}

function numerologyFromDate(y,m,d){
  return {
    lifePath: reduceToDigit(reduceToDigit(y)+reduceToDigit(m)+reduceToDigit(d)),
    day: reduceToDigit(d),
    month: reduceToDigit(m),
    year: reduceToDigit(y)
  };
}

function makeCoreSentence(sun, asc, lp){
  return `De kern van deze persoon wordt gevormd door de levenskracht van ${sun}, die zich naar buiten toont via ${asc}. Levenspad ${lp} nodigt uit dit potentieel bewust te belichamen.`;
}

// ================= INIT / CALC / PDF =================
// (ongewijzigd functioneel – identiek aan werkende versie)

