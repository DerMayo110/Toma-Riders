'use strict';

/* Besetzung (Fahrer + Porträts), Story-Kapitel und die Dialog-Engine. */

/* ================= Fahrer-Paletten ================= */
const HERO_PAL = {
  hero: true, skin: '#f1c7a0', shirt: '#17181d', arm: '#f1c7a0', pants: '#2b3a5e', shoe: '#f4f6fa',
  board: '#f5f7fb', edge: '#12b89a', stripe: '#ff3d81', glow: '94,242,255', dot: '#ffffff',
};

function suit(main, dark, helmet, hstripe, board, edge, extra) {
  return Object.assign({
    hero: false, skin: '#e8b88f', shirt: main, arm: main, pants: dark, shoe: '#20242c',
    helmet, hstripe, board, edge, stripe: main, glow: '94,242,255', dot: main,
  }, extra);
}

/* Gegner im freien Rennen */
const FREE_RIVALS = [
  { name: 'Vex',   skill: 1.10, pal: suit('#8f5bff', '#5b34b8', '#ffd23d', '#1b1e27', '#2b2140', '#ffd23d') },
  { name: 'Nova',  skill: 1.08, pal: suit('#ff8a2b', '#c85f10', '#ffffff', '#ff8a2b', '#fff3e0', '#ff8a2b') },
  { name: 'Brick', skill: 1.06, pal: suit('#e23b3b', '#9c1f1f', '#22252e', '#e23b3b', '#30333d', '#e23b3b') },
  { name: 'Zip',   skill: 1.04, pal: suit('#9be22b', '#5fa010', '#2b6cff', '#ffffff', '#1c3f99', '#9be22b') },
  { name: 'Kira',  skill: 1.02, pal: suit('#ff5fb0', '#c22f7f', '#39e0ff', '#ffffff', '#ffe3f2', '#39e0ff') },
];

const ECHO_PAL = Object.assign({}, HERO_PAL, {
  shirt: '#3a3d47', pants: '#2a2d36', shoe: '#aab0bc', board: '#8a909c', edge: '#5a606c', stripe: '#aab0bc',
  curls: ['#9aa0ad', '#858b98', '#b4bac6', '#70768a'], ghost: 0.55, glow: '180,190,210', dot: '#9aa0ad',
});
const SHADE = { ghost: 0.55, glow: '125,255,216', skin: '#9fd8c8' };

/* Fahrer der Story (god = Spezialfähigkeit im Rennen) */
const RACER = {
  kassia:    { name: 'Kassia',    skill: 1.10, pal: suit('#a3202a', '#5e1118', '#c98a3c', '#c98a3c', '#3a1418', '#ffd23d', { crest: '#ff3b3b' }) },
  lysandros: { name: 'Lysandros', skill: 1.07, pal: suit('#2f6fd0', '#1c448a', '#d9dde6', '#2f6fd0', '#e8eefc', '#2f6fd0', { crest: '#ffffff' }) },
  xanthe:    { name: 'Xanthe',    skill: 1.05, pal: suit('#e6b422', '#9a7410', '#6b4a2f', '#e6b422', '#fff6d6', '#e6b422', { crest: '#fff6d6' }) },
  theron:    { name: 'Theron',    skill: 1.03, pal: suit('#3f9a5a', '#236238', '#b8873f', '#3f9a5a', '#e3f5e8', '#3f9a5a', { crest: '#1b1e27' }) },
  phaidon:   { name: 'Phaidon',   skill: 1.00, pal: suit('#5ab0ff', '#2f6fb8', '#f2f5f9', '#5ab0ff', '#eaf4ff', '#5ab0ff') },
  talos:     { name: 'Talos-3',   skill: 1.06, pal: suit('#b87333', '#7a4a1c', '#d99a55', '#ff8a2b', '#3a2a1c', '#ff8a2b', { skin: '#b87333', aura: '255,140,40' }) },

  ares:    { name: 'Ares',    skill: 1.11, god: 'ares',   pal: suit('#8a1414', '#3a0a0a', '#2a2a30', '#ff2a2a', '#1a1a1e', '#ff2a2a', { crest: '#ff2a2a', aura: '255,60,40', size: 1.2, glow: '255,90,60' }) },
  hermes:  { name: 'Hermes',  skill: 1.12, god: 'hermes', pal: suit('#f5f0dc', '#c9b458', '#ffd23d', '#ffffff', '#fff7d6', '#ffd23d', { wings: '#ffffff', aura: '255,220,90', size: 1.12, glow: '255,230,120' }) },
  hades:   { name: 'Hades',   skill: 1.12, god: 'hades',  pal: suit('#1c1630', '#0c0a16', '#15131f', '#b06aff', '#0c0a16', '#b06aff', { cape: '#0c0a16', crown: '#b06aff', aura: '160,90,255', size: 1.2, glow: '176,106,255', dot: '#b06aff' }) },
  zeus:    { name: 'Zeus',    skill: 1.12, god: 'zeus',   pal: suit('#f7f9ff', '#c9d2ea', '#f7f9ff', '#ffd23d', '#ffffff', '#ffd23d', { cape: '#f7f9ff', crown: '#ffd23d', aura: '140,200,255', size: 1.25, glow: '170,220,255', dot: '#ffd23d' }) },
  athene:  { name: 'Athene',  skill: 1.07, pal: suit('#3f6fb8', '#24406e', '#d9dde6', '#ffd23d', '#e8eefc', '#ffd23d', { crest: '#e6e9ee', aura: '120,180,255', size: 1.15 }) },
  apollon: { name: 'Apollon', skill: 1.05, pal: suit('#ffb13c', '#c87a10', '#fff3d0', '#ffb13c', '#fff7e0', '#ffb13c', { crown: '#fff3d0', aura: '255,190,80', size: 1.15 }) },
  hermes2: { name: 'Hermes',  skill: 1.05, god: 'hermes', pal: null },
  ares2:   { name: 'Ares',    skill: 1.05, god: 'ares',   pal: null },

  shadeK: { name: 'Kassia †',  skill: 1.06, pal: suit('#3f8f80', '#235a50', '#6fbfae', '#b6ffe6', '#12302c', '#7dffd8', Object.assign({ crest: '#b6ffe6' }, SHADE)) },
  shadeP: { name: 'Phaidon †', skill: 1.02, pal: suit('#4f9f90', '#2c6a5e', '#8fd8c8', '#b6ffe6', '#12302c', '#7dffd8', SHADE) },

  kronos: { name: 'Kronos', skill: 1.13, god: 'kronos', pal: Object.assign({}, HERO_PAL, {
    skin: '#e3b48c', arm: '#e3b48c', shirt: '#2a2038', pants: '#1a1426', shoe: '#cfd3da', board: '#1a1426', edge: '#d0a0ff', stripe: '#d0a0ff',
    glow: '208,160,255', curls: WHITE_CURLS, cape: '#2a2038', aura: '200,140,255', size: 1.15, dot: '#d0a0ff',
  }) },
  echo1: { name: 'Toma #4.210', skill: 1.07, pal: ECHO_PAL },
  echo2: { name: 'Toma #2.048', skill: 1.05, pal: ECHO_PAL },
  echo3: { name: 'Toma #731',   skill: 1.03, pal: ECHO_PAL },
  echo4: { name: 'Toma #1',     skill: 1.00, pal: ECHO_PAL },
};
RACER.kassia3 = { name: 'Kassia', skill: 1.02, pal: RACER.kassia.pal };
RACER.hermes2.pal = RACER.hermes.pal;
RACER.ares2.pal = RACER.ares.pal;

/* Tomas Freunde fahren als Fadenbund mit: ally = Abstand, den sie vor Toma halten · lane = Stammspur.
   Sie zählen nicht in der Wertung, rempeln ihn nicht und geben ihm Windschatten. */
const BUDDY = { hero: false, buddy: true, board: '#f5f7fb' };
RACER.robin = { name: 'Robin', skill: 1.04, ally: 820, lane: -0.46, pal: Object.assign({}, BUDDY, {
  skin: '#efc39d', hair: '#2b1d15', hair2: '#4a3324', shirt: '#a6a8ab', arm: '#efc39d', pants: '#3d5a8a', shoe: '#2a2d36',
  edge: '#ff8a2b', stripe: '#ff8a2b', glow: '255,170,90', dot: '#ffb46a',
}) };
RACER.jario = { name: 'Jario', skill: 1.04, ally: 470, lane: 0.46, pal: Object.assign({}, BUDDY, {
  skin: '#f2cdb0', hair: '#7a5536', hair2: '#96704c', hairLong: true, shirt: '#20263f', arm: '#20263f', hood: '#151a2c', pants: '#2a3350', shoe: '#e9edf2',
  edge: '#5aa8ff', stripe: '#5aa8ff', glow: '120,180,255', dot: '#8fc0ff',
}) };

/* Martin Swagger: Tomas Rivale, Schützling des Apollon. Fährt in jedem Lauf mit und kommentiert Überholmanöver. */
RACER.martin = { name: 'Martin', skill: 1.09, rival: true, pal: {
  hero: false, buddy: true, skin: '#f3d2b8', hair: '#b98f5a', hair2: '#dcba84', shirt: '#bfc2c6', arm: '#bfc2c6', pants: '#2a2d33', shoe: '#f4f5f7',
  board: '#fff7e0', edge: '#ffb13c', stripe: '#ffb13c', glow: '255,200,90', dot: '#ffd76a', specs: 'rgba(245,247,250,.95)',
} };

/* ================= Porträts ================= */
const KAIRON_SPEC = {
  bg: ['#b98a4a', '#5a3d20'], skin: '#e3b48c', skin2: '#d6a37a', shirt: '#4a3a2c', trim: '#b8873f',
  hair: { kind: 'curls', cols: GREY_CURLS }, beard: { col: '#c9cdd6', full: true, len: 4 }, brow: '#a9aeb8',
  eyes: 'blind', band: '#2a2f3a', mouth: 'stern', old: true,
};

const CAST = {
  n: { name: '' },
  t: { name: '' },
  toma: { name: 'Toma Lioumba', col: '#7dffd8', hero: true },
  robin: { name: 'Robin Schallerbach', col: '#ffb46a', spec: {
    bg: ['#ffb46a', '#c85f10'], skin: '#efc39d', skin2: '#e2b189', shirt: '#a6a8ab', wide: 1.07,
    hair: { kind: 'short', cols: ['#2b1d15', '#4a3324'] }, beard: { col: 'rgba(45,30,22,.6)', short: true }, brow: '#2b1d15',
    eyes: 'normal', eyeCol: '#5a3a22', mouth: 'grin',
  } },
  jario: { name: 'Jario Magic', col: '#8fc0ff', spec: {
    bg: ['#8fc0ff', '#2a3f8a'], skin: '#f2cdb0', skin2: '#e6bb9a', shirt: '#20263f', wide: 0.94,
    hair: { kind: 'fringe', cols: ['#7a5536', '#96704c'] }, beard: { col: 'rgba(125,88,58,.26)', short: true }, brow: '#6a4a30',
    eyes: 'normal', eyeCol: '#6f8798', mouth: 'smirk',
  } },
  martin: { name: 'Martin Swagger', col: '#ffd76a', spec: {
    bg: ['#ffd76a', '#c87a10'], skin: '#f3d2b8', skin2: '#e8c2a4', shirt: '#bfc2c6', wide: 0.97,
    hair: { kind: 'short', cols: ['#b98f5a', '#dcba84'] }, brow: '#a07a4a',
    eyes: 'normal', eyeCol: '#6a7f8f', glasses: 'rgba(240,244,248,.95)', mouth: 'smirk',
  } },
  mila: { name: 'Mila', col: '#ffd76a', spec: {
    bg: ['#ffd76a', '#ff9a3c'], skin: '#f4cba4', skin2: '#eec19a', shirt: '#ff8fc2',
    hair: { kind: 'curls', cols: BLOND_CURLS, big: true }, brow: '#b98f3a', eyes: 'big', eyeCol: '#4f8f3a', mouth: 'grin',
  } },
  kairon: { name: 'Meister Kairon', col: '#e0b060', spec: KAIRON_SPEC },
  kronosB: { name: 'Kronos', col: '#d0a0ff', spec: Object.assign({}, KAIRON_SPEC, { bg: ['#7a3ad0', '#12061f'], ring: '#d0a0ff', shirt: '#2a2038', trim: '#d0a0ff' }) },
  kronos: { name: 'Kronos · Toma Lioumba', col: '#d0a0ff', spec: Object.assign({}, KAIRON_SPEC, {
    bg: ['#7a3ad0', '#12061f'], ring: '#d0a0ff', shirt: '#17181d', trim: '#d0a0ff',
    hair: { kind: 'curls', cols: WHITE_CURLS }, beard: { col: '#eceef3', full: true, len: 4 }, eyes: 'cracked', mouth: 'smirk',
  }) },
  kassia: { name: 'Kassia von Sparta', col: '#ff6b6b', spec: {
    bg: ['#d8454f', '#5e1118'], skin: '#d8a27a', skin2: '#c98f66', shirt: '#8a1f1f', trim: '#c98a3c',
    brow: '#3a2418', eyes: 'normal', eyeCol: '#5a3a22', mouth: 'smirk',
    head: 'spartan', headCol: '#d9a04e', headCol2: '#a8742c', crestCol: '#ff3b3b',
  } },
  kassiaG: { name: 'Kassia (Schatten)', col: '#9dffe6', spec: {
    bg: ['#2f7a68', '#0a1f1c'], ring: '#9dffe6', ghost: true, skin: '#a8dccc', skin2: '#8fc8b8', shirt: '#235a50', trim: '#7dffd8',
    brow: '#2c5a50', eyes: 'glow', eyeCol: '#b6ffe6', mouth: 'smirk', lip: '#4f8f80',
    head: 'spartan', headCol: '#6fbfae', headCol2: '#3f8f80', crestCol: '#b6ffe6',
  } },
  phaidon: { name: 'Phaidon', col: '#8fc8ff', spec: {
    bg: ['#8fd0ff', '#2f6fb8'], skin: '#efc49c', skin2: '#e3b48c', shirt: '#3f7ad8',
    hair: { kind: 'cap', cols: ['#6b4a2f', '#8a6444'] }, brow: '#5a3a22', eyes: 'big', eyeCol: '#6b4a2f', mouth: 'open',
  } },
  pythia: { name: 'Pythia · Orakel-Holo', col: '#7ff3ff', spec: { kind: 'mask', bg: ['#0f3a5a', '#061426'], ring: '#7ff3ff' } },
  moiren: { name: 'Die Moiren', col: '#ffffff', spec: { kind: 'hood', bg: ['#3a3446', '#0a0810'], ring: '#cfd3da' } },
  ares: { name: 'Ares', col: '#ff5a4a', spec: {
    bg: ['#c81e1e', '#1a0606'], ring: '#ff5a4a', skin: '#3a2a2a', shirt: '#3a0a0a', trim: '#ff2a2a',
    head: 'corinth', headCol: '#3a3a42', headCol2: '#17171c', crestCol: '#ff2a2a', eyeCol: '#ff3b2a',
  } },
  hermes: { name: 'Hermes', col: '#ffe08a', spec: {
    bg: ['#ffe08a', '#3f9ced'], skin: '#f2cba2', skin2: '#e6bb90', shirt: '#f5f0dc', trim: '#ffd23d',
    hair: { kind: 'cap', cols: ['#e8c860', '#f5dc8a'] }, brow: '#b9963a', eyes: 'normal', eyeCol: '#19a8e0', mouth: 'grin',
    head: 'wings', headCol: '#ffd23d', headCol2: '#e0a82a',
  } },
  hades: { name: 'Hades', col: '#c9a0ff', spec: {
    bg: ['#5a2aa0', '#07040f'], ring: '#b06aff', skin: '#cfd0e6', skin2: '#b9bad6', shirt: '#1a1426', trim: '#b06aff',
    hair: { kind: 'cap', cols: ['#15131f', '#2a2638'], long: true }, beard: { col: '#15131f', full: true, len: 1 }, brow: '#15131f',
    eyes: 'glow', eyeCol: '#b06aff', mouth: 'stern', lip: '#6a5a8a', head: 'crown', headCol: '#3a2a5a', crestCol: '#d0a0ff',
  } },
  zeus: { name: 'Zeus', col: '#aee0ff', spec: {
    bg: ['#4f9cff', '#122a6a'], ring: '#ffd23d', skin: '#e8b890', skin2: '#d9a57a', shirt: '#f7f9ff', trim: '#ffd23d',
    hair: { kind: 'cap', cols: ['#f4f5f8', '#d5d9e4'], long: true }, beard: { col: '#f4f5f8', full: true, len: 9 }, brow: '#e6e9ee',
    eyes: 'glow', eyeCol: '#9fe0ff', mouth: 'stern', old: true, head: 'laurel', headCol: '#ffd23d',
  } },
};

/* ================= Kapitel ================= */

const fmtDeaths = n => (n === 1 ? 'ein Mal' : n + ' Mal');
const HEROES = ['robin', 'jario'];       // Tomas Fadenbund: fährt in jedem Lauf mit

const CHAPTERS = [
  /* ---------- 1 ---------- */
  {
    title: 'Scheren und Fäden', track: 'piraeus', laps: 3, skill: 0.93,
    goal: { max: 3 }, goalText: 'Platz 3 oder besser',
    roster: ['kassia', 'martin', 'xanthe', 'theron', 'phaidon'],
    intro: [
      { bg: 'hellas' },
      ['t', 'HELLAS', 'Im Jahr der 112. Aether-Olympiade'],
      ['n', 'Marmor, Olivenhaine – und Aether. Seit Hephaistos\' Schmieden das blaue Feuer gezähmt haben, schweben Bretter über die Straßen von Athen bis Sparta.'],
      ['n', 'Einmal in jeder Generation rufen die Götter zum Agon der Fäden. Der Sieger hat einen Wunsch frei. Allen anderen schneiden die Moiren den Lebensfaden durch.'],
      ['n', 'Niemand meldet sich freiwillig. Fast niemand.'],
      { bg: 'workshop' },
      ['mila', 'Toma … du musst das nicht tun. Die Heiler sagen, mein Faden reicht noch bis zum Neumond. Das sind doch noch elf Tage!', 'sad'],
      ['toma', 'Elf Tage sind kein Leben, Mila. Ich hole dir ein ganzes.', 'stern'],
      ['robin', 'Falsch, Chef. WIR holen ihr ein ganzes. Oder dachtest du, wir lassen dich allein gegen Götter fahren?', 'smile'],
      ['toma', 'Robin?! Jario?! Nein. Vergesst es. Wer im Agon verliert, stirbt!', 'shock'],
      ['jario', 'Wissen wir. Deshalb haben wir uns heute früh eingeschrieben – mit dir, als Fadenbund. Altes Recht der Moiren: drei Fäden, ein Knoten.'],
      { bg: 'cg_bund' },
      ['n', 'Ein Fadenbund zählt als ein Fahrer. Kommt der Kapitän durch, kommen alle durch. Scheitert er, fällt die Schere nur einmal – und trifft alle drei.'],
      { bg: 'workshop' },
      ['toma', 'Ihr habt eure Leben an meins geknotet?! Seid ihr wahnsinnig?', 'angry'],
      ['robin', 'Seit der ersten Klasse. Toma Heroes – einer für alle. Außerdem fährst du schneller, wenn du Angst um uns hast.', 'smile'],
      { face: ['toma', 'smile'] },
      ['kairon', '… Ihr zwei. Das war so nicht vorgesehen.', 'stern'],
      ['jario', 'Vorgesehen? Von wem?', 'stern'],
      ['kairon', 'Von niemandem. Hier, Toma – dein Brett ist fertig. Aether-Kern aus eigener Fertigung. So etwas baut in ganz Hellas sonst keiner.'],
      ['jario', 'Stimmt. Ich habe den Kern durchgemessen. So etwas KANN in ganz Hellas keiner bauen. Woher kannst du es, Meister?'],
      ['kairon', 'Ich hatte viel Zeit zum Üben. Hört zu: Qualifikation im Hafen von Piräus. Platz drei oder besser für den Kapitän – sonst war es das. Für euch drei. Und für sie.'],
      { bg: 'piraeus' },
      ['pythia', 'ACHTUNG, STERBLICHE. Agon der Fäden, Lauf eins. Neu im Feld: ein Fadenbund aus Piräus, gemeldet als »Toma Heroes«. Die Moiren haben ihre Scheren geschliffen. Viel Vergnügen.'],
      ['martin', 'Lioumba! Du hast dich wirklich gemeldet? Mit dem Brett aus dem Hinterhof – und gleich zwei Schwimmflügeln dazu?', 'smile'],
      ['toma', 'Martin Swagger. Natürlich bist du hier.', 'stern'],
      ['martin', 'Schützling des Apollon, wenn ich bitten darf. Ich fahre allein, ich gewinne allein, und meinen Wunsch habe ich mir schon ausgesucht. Versuch einfach, im Bild zu bleiben.'],
      ['kairon', '… Swagger. Immer er.', 'stern'],
      ['robin', 'Wir fahren vor dir, Toma. Häng dich in unseren Windschatten, wenn du Schwung brauchst – dafür sind Freunde da!', 'smile'],
    ],
    win: [
      { bg: 'piraeus' },
      ['pythia', 'Qualifiziert: der Fadenbund »Toma Heroes«. Die Quote auf euer Überleben steigt auf … immerhin vier Prozent.'],
      ['robin', 'Vier Prozent! Das ist mehr, als Jario bei seiner Brettprüfung hatte!', 'smile'],
      ['jario', 'Ich bin beim dritten Mal durchgekommen. Fehlerfrei.'],
      ['martin', 'Nicht übel, Kurier. Für einen, der drei Fäden braucht, um ein einziges Rennen zu fahren.', 'smile'],
      ['kassia', 'Ein Kurier und zwei Anhängsel. Ihr fahrt, als hättet ihr nichts zu verlieren.'],
      ['toma', 'Wir haben alles zu verlieren. Genau deshalb.'],
      ['kassia', 'Kassia von Sparta. Merkt euch den Namen – ihr werdet ihn von hinten lesen.'],
      ['kairon', 'Nicht schlecht. Zu spät am Boost, zu früh auf der Bremse. Wie immer.'],
      ['toma', 'Wie immer? Das war mein erstes Rennen.', 'shock'],
      ['kairon', '… Natürlich. Der Versprecher eines alten Mannes. Weiter nach Athen.'],
      { face: ['toma', ''] },
      ['jario', 'Robin. Seine Sanduhr. Der Sand ist während des ganzen Rennens nicht gefallen. Kein einziges Korn.', 'stern'],
      ['robin', 'Dann ist sie halt verstopft. Komm – es gibt Souvlaki, und ich habe einen Gott von Hunger.', 'smile'],
    ],
  },
  /* ---------- 2 ---------- */
  {
    title: 'Der Letzte quert den Styx', track: 'akropolis', laps: 2, skill: 0.95,
    goal: { max: 3 }, goalText: 'Platz 3 oder besser',
    roster: ['kassia', 'martin', 'xanthe', 'theron', 'phaidon'],
    intro: [
      { bg: 'akropolis' },
      ['n', 'Athen. Über der Agora flimmern die Holo-Stelen, und auf der Akropolis summt der Parthenon wie ein Reaktor. Acht Bretter am Start. Wer als Letzter ankommt, kommt nirgends mehr an.'],
      ['phaidon', 'Toma! Ich bin Phaidon, aus Korinth. Ich fahr für meinen Vater, der hat Schulden bei einem Tempel … Glaubst du, die machen das wirklich? Das mit der Schere?'],
      ['toma', 'Bleib einfach in unserem Windschatten, Kleiner. Wir kommen alle durch.', 'smile'],
      ['robin', 'Genau! Die Toma Heroes nehmen dich mit. Ehrenmitglied Nummer vier – Jario, schreib ihn auf!', 'smile'],
      ['martin', 'Hör nicht auf die drei, Kleiner. Im Agon nimmt dich keiner mit. Fahr für dich – oder gar nicht.'],
      ['kairon', 'Versprecht nichts, was die Strecke nicht halten kann.'],
      ['pythia', 'Lauf zwei: Akropolis-Ring. Wer als Letzter die Linie quert, quert danach den Styx. Platz drei oder besser fürs Weiterkommen.'],
    ],
    win: [
      { bg: 'akropolis' },
      ['pythia', 'Letzter Platz: Phaidon von Korinth.'],
      ['phaidon', 'Nein, wartet – mein Brett hat gestottert, ich kann das erklären, ich –', 'shock'],
      { bg: 'cg_snip' },
      ['moiren', 'Schnipp.', 'snip'],
      ['n', 'Kein Blitz. Kein Schrei. Phaidons Brett schwebt noch drei Herzschläge lang weiter. Leer.'],
      { bg: 'akropolis' },
      ['toma', '… Er war fünfzehn.', 'sad'],
      ['robin', 'Ich hab ihm gesagt, wir nehmen ihn mit. Ich hab es ihm VERSPROCHEN, Toma.', 'sad'],
      ['martin', '… Ich hab ihm gesagt, er soll für sich fahren. Das war kein guter Rat.', 'sad'],
      ['kassia', 'Jetzt wisst ihr, wogegen ihr fahrt. Nicht gegen mich. Nicht gegen die anderen. Gegen die da oben.', 'stern'],
      ['kairon', 'Sieh nicht hin, Toma. Hinsehen macht langsam. Glaub mir.'],
      ['jario', '»Glaub mir.« Er hat nicht einmal gezuckt. Als hätte er das alles schon hundertmal gesehen.', 'stern'],
    ],
  },
  /* ---------- 3 ---------- */
  {
    title: 'Die Schmiede des Krieges', track: 'thermo', laps: 2, skill: 0.96,
    goal: { beat: 'Ares' }, goalText: 'Vor Ares ins Ziel kommen',
    roster: ['ares', 'martin', 'xanthe', 'kassia3', 'theron'],
    intro: [
      { bg: 'thermo' },
      ['n', 'Der Pass der Thermopylen. Unter dem Fels glühen die Schmieden des Hephaistos, und die Luft schmeckt nach Bronze.'],
      ['ares', 'STERBLICHE! Mir ist langweilig. Also fahre ich mit.'],
      ['pythia', 'Regeländerung durch göttliches Dekret: Wer hinter Ares ins Ziel kommt, verliert seinen Faden. Ares bittet, das nicht persönlich zu nehmen.'],
      ['ares', 'Doch. Nehmt es persönlich.'],
      ['pythia', 'Ausgenommen sind Sterbliche mit göttlichem Paten. Das betrifft derzeit … genau einen.'],
      ['martin', 'Schuldig. Apollon lässt grüßen.', 'smile'],
      ['jario', 'Netz und doppelter Boden. Und UNS nennt er Schwimmflügel.', 'stern'],
      ['kassia', 'Ein Gott auf der Strecke. In Sparta nennen wir das einen guten Tag zum Sterben.'],
      ['robin', 'Er rammt? Gut. Dann rammt er zuerst mich. Ich bin breiter als ihr zwei zusammen.', 'stern'],
      ['kairon', 'Ares rammt. Er kann nicht anders. Bleib aus seiner Linie, Toma, und lass ihn an den Amphoren zerschellen. Das Brett kann mehr, als du denkst – ich habe es für genau diesen Tag gebaut.'],
    ],
    win: [
      { bg: 'thermo' },
      ['ares', 'UNMÖGLICH! Ein Kurier! Auf einem Brett aus einer HINTERHOFSCHMIEDE!'],
      ['n', 'Im letzten Sektor hatte Ares Toma an die Planke gedrückt. Kassia war dazwischengefahren – und kam hinter dem Gott ins Ziel.'],
      ['toma', 'Kassia! Warum hast du das getan? Du hattest ihn doch fast!', 'shock'],
      ['kassia', 'Weil einer bis ganz nach oben kommen muss. Ihr drei fahrt füreinander. Ich nur für einen Namen.', 'smile'],
      { bg: 'cg_snip' },
      ['moiren', 'Schnipp.', 'snip'],
      { bg: 'thermo' },
      ['toma', 'NEIN!', 'angry quake'],
      { face: ['toma', 'sad'] },
      ['martin', 'Sie hätte ihn gehabt. Sie hat sich … für euch? So gewinnt man doch nicht. So darf man nicht gewinnen müssen.', 'shock'],
      ['kairon', '… Sie fällt jedes Mal an dieser Stelle. Jedes verdammte Mal.'],
      ['toma', 'Was hast du gerade gesagt?', 'stern'],
      ['kairon', 'Nichts. Der Wind. Weiter, Toma. Nach Kreta.'],
      ['jario', 'Das war nicht der Wind. »Wie immer.« »Glaub mir.« »Jedes Mal.« Toma, dein Meister redet über ein Rennen, das wir gerade zum ersten Mal fahren.', 'stern'],
      ['toma', 'Er hat das Brett gebaut, das uns drei am Leben hält, Jario. Lass gut sein.', 'stern'],
      ['robin', 'Streitet auf Kreta weiter. Bitte. Ich will hier weg.', 'sad'],
    ],
  },
  /* ---------- 4 ---------- */
  {
    title: 'Der Bote im Labyrinth', track: 'knossos', laps: 3, skill: 0.96,
    goal: { beat: 'Hermes' }, goalText: 'Vor Hermes ins Ziel kommen',
    roster: ['hermes', 'talos', 'martin', 'xanthe', 'theron'],
    intro: [
      { bg: 'knossos' },
      ['n', 'Kreta. Das Labyrinth von Knossos, neu verkabelt von den Daidalos-Werken. Irgendwo in der Mitte brüllt etwas mit sehr viel Hubraum.'],
      ['hermes', 'Toma Lioumba! Der Mann, der Ares blamiert hat. Ich bin Fan. Wirklich. Ich habe sogar gewettet – gegen dich, aber mit Bauchschmerzen.'],
      ['toma', 'Lass mich raten: Wer hinter dir ankommt, stirbt.', 'stern'],
      ['hermes', 'Schnell im Kopf, schnell auf dem Brett. Schade drum. Und dein Fadenbund! Der Breite und der Stille. Komisch – ich trage seit Äonen Botschaften durch dieses Rennen, und euch zwei habe ich noch NIE gesehen.'],
      ['robin', 'Wir sind auch zum ersten Mal hier, du Vogel.', 'stern'],
      ['hermes', 'Eben – das ist ja das Neue! Und Apollons Liebling ist auch wieder dabei. Sag, Swagger: Hat dir dein Pate je verraten, wer ihm deinen Namen genannt hat?'],
      ['martin', 'Apollon erkennt Talent, wenn er es sieht. Was soll die Frage?', 'stern'],
      ['hermes', 'Nur so ein Gedanke. Unter uns Boten, Toma: dein Schmied. Der Alte mit der Augenbinde. Frag ihn mal, warum seine Sanduhr nie leer wird.'],
      ['kairon', 'Hört nicht auf ihn. Hermes lügt schon, wenn er Luft holt.'],
      ['hermes', 'Stimmt! Aber diesmal nicht. Auf die Plätze!'],
    ],
    win: [
      { bg: 'knossos' },
      ['hermes', 'Hui. Also DAS hat seit … lass mich rechnen … noch nie jemand geschafft. Offiziell.'],
      ['toma', 'Offiziell?', 'shock'],
      { face: ['toma', 'stern'] },
      ['hermes', 'Ich bringe Botschaften, Toma. Auch in die Unterwelt. Und da unten führt jemand Buch. Dein Name steht drin. Nicht einmal. Tausende Male.'],
      ['jario', 'Und unsere? Robin Schallerbach. Jario Magic.', 'stern'],
      ['hermes', 'Kein einziges Mal. Nicht eine Zeile. Ihr zwei seid in dieser Geschichte brandneu – und glaubt mir, das hat mich mehr erschreckt als alles andere.'],
      ['martin', 'Und meiner?', 'stern'],
      ['hermes', 'Oh, du stehst auch drin, Swagger. Jedes Mal. Immer genau eine Zeile über ihm – bis auf dieses Mal.'],
      ['toma', 'Das ergibt keinen Sinn. Ich lebe.', 'shock'],
      ['hermes', 'Eben. Das ist ja das Unheimliche. Grüßt Hades von mir – ihr seid als Nächstes bei ihm eingeladen.'],
    ],
  },
  /* ---------- 5 ---------- */
  {
    title: '„Schon wieder, Toma Lioumba“', track: 'styx', laps: 2, skill: 0.97,
    goal: { beat: 'Hades' }, goalText: 'Vor Hades ins Ziel kommen',
    roster: ['hades', 'shadeK', 'martin', 'theron', 'shadeP'],
    intro: [
      { bg: 'styx' },
      ['n', 'Hinter Kap Tainaron führt die Strecke abwärts. Sehr weit abwärts. Wer im Agon so weit kommt, fährt lebend in den Hades ein – und meistens nicht wieder hinaus.'],
      ['hades', 'Toma Lioumba. Schon wieder.'],
      ['toma', 'Wir sind uns noch nie begegnet.'],
      { face: ['toma', 'shock'] },
      ['hades', 'Das sagst du jedes Mal. Meine Bücher sagen etwas anderes. Jemand stiehlt mir seit Äonen ein und dieselbe Seele – deine – und dreht sie zurück an den Start. Ich wüsste gern, wer.'],
      ['hades', 'Aber diese beiden … die kenne ich nicht. Zum ersten Mal seit Äonen steht etwas Neues an meinem Ufer. Die Schleife hat einen Knoten bekommen.'],
      ['jario', 'Schleife. Er hat »Schleife« gesagt.', 'shock'],
      ['hades', 'Dich dagegen kenne ich umso besser, Martin Swagger. In meinen Büchern stehst du fast immer ganz oben.'],
      ['martin', 'Fast?', 'stern'],
      ['hades', 'Dieses Mal nicht. Ich finde das erfrischend.'],
      ['kassiaG', 'Toma … ihr seid hier. Seid ihr etwa –?'],
      ['toma', 'Noch nicht. Kassia, wir holen dich hier raus. Dich und Phaidon. Ich schwör\'s.', 'stern'],
      ['hades', 'Ein Rennen durch mein Reich. Schlägst du mich, lasse ich euch zum Olymp. Verlierst du, bleibt ihr. Alle drei. Diesmal endgültig – dafür sorge ich.'],
      ['kairon', '… Er kann die Schleife nicht brechen. Fahr, Toma. Frag nicht.'],
      ['robin', 'Erst fahren. Dann fragen. Und danach, Meister, unterhalten wir zwei uns mal.', 'stern'],
    ],
    win: [
      { bg: 'styx' },
      ['hades', 'Bemerkenswert. Geht. Der Olymp erwartet euch.'],
      ['hades', 'Und, Toma – ein Rat von einem, der mit Toten Erfahrung hat: Der Mann, der dir das Brett gebaut hat, wirft keinen Schatten. Nicht einmal hier unten. Das tun nur Dinge, die älter sind als ich.'],
      ['toma', 'Kairon? Er ist ein alter Schmied aus Piräus.', 'shock'],
      ['hades', 'Piräus ist dreihundert Jahre alt. Ich habe nachgezählt.'],
      ['jario', 'Ich auch. In keinem Zunftregister von Piräus steht ein Kairon. Nicht in diesem Jahr. Nicht in den letzten dreihundert.', 'stern'],
      ['toma', 'Hört auf! Er war der Einzige, der an mich geglaubt hat, als –', 'angry'],
      ['robin', 'Hey. WIR haben an dich geglaubt. Zuerst. Und wir stehen noch hier, mit dem Hals in deiner Schlinge. Vergiss das nicht.', 'stern'],
      { face: ['toma', 'sad'] },
      ['kassiaG', 'Gewinnt da oben, ihr drei. Sonst lache ich euch hier unten persönlich aus.'],
    ],
  },
  /* ---------- 6 ---------- */
  {
    title: 'Über den Wolken', track: 'olymp', laps: 2, skill: 0.97,
    goal: { max: 1 }, goalText: 'Nur Platz 1 zählt',
    roster: ['zeus', 'hermes2', 'athene', 'ares2', 'martin'],
    intro: [
      { bg: 'olymp' },
      ['n', 'Der Olymp. Über den Wolken, über dem Wetter, über jedem Gesetz. Noch nie hat ein Sterblicher hier die Ziellinie gesehen.'],
      ['zeus', 'Toma Lioumba von Piräus. Du hast meinen Sohn gedemütigt, meinen Boten überholt und meinen Bruder in seinem eigenen Reich geschlagen.'],
      ['zeus', 'Ich bin beeindruckt. Das macht es nicht besser für dich.'],
      ['toma', 'Ich will nur den Wunsch. Ein Leben. Das meiner Schwester.'],
      ['zeus', 'Dann hol es dir. Letzter Lauf. Alle Götter, die noch stehen können, gegen deinen Fadenbund. Nur Platz eins zählt. Und achte auf den Himmel – ich verliere ungern.'],
      ['martin', 'Und gegen mich. Apollon lässt mich für sich fahren. Tut mir leid, Lioumba – der Wunsch gehört mir.', 'smile'],
      ['toma', 'Was wünscht sich einer, der schon alles hat?', 'stern'],
      ['martin', 'Einen Namen, den man in tausend Jahren noch kennt. Was denn sonst?'],
      ['kairon', 'Das ist er, Toma. Der letzte Lauf. Danach ist alles vorbei. Alles.'],
      ['toma', 'Du klingst nicht, als würdest du dich freuen.'],
      ['kairon', 'Ich freue mich seit sehr, sehr langer Zeit auf diesen Tag.'],
      ['robin', 'Egal, was da oben wartet: Wir fahren direkt vor dir. Wie immer.', 'smile'],
      ['toma', 'Wie immer.', 'smile'],
    ],
    win: [
      { bg: 'olymp' },
      ['pythia', 'Sieger des Agons der Fäden: der Fadenbund »Toma Heroes«. Meine Prognose lag bei null Komma null Prozent. Ich werde mich neu kalibrieren müssen.'],
      ['zeus', 'Ein Sterblicher. Auf einem Brett. Sprich deinen Wunsch, Toma Lioumba. Er sei dir gewährt.'],
      ['toma', 'Ich wünsche mir –', 'smile'],
      { face: ['toma', 'shock'] },
      ['kairon', 'Halt.', 'quake'],
      ['n', 'Der alte Schmied steht plötzlich neben dem Thron. Niemand hat ihn den Berg heraufkommen sehen. Der Sand in seiner Uhr läuft – zum ersten Mal – nach oben.'],
      ['zeus', '… Diese Stimme. Nein. Das ist nicht möglich. Du liegst im Tartaros! Ich habe dich selbst hinabgeworfen!', 'angry'],
      ['kronosB', 'Ares. Hermes. Hades. Du. Vier Siegel, mein Sohn. Vier Götter, besiegt von einem Sterblichen – nur so zerbrechen sie. Ich selbst durfte euch ja nie anrühren.', 'flash'],
      ['toma', 'Meister Kairon … was redest du da?', 'shock'],
      { face: ['toma', 'shock'] },
      ['kronosB', 'Kairon. Kronos. Ich war nie gut im Ausdenken von Namen. Ich bin die Zeit, Toma. Und ich habe dich gebaut. Genau wie das Brett.'],
      ['jario', 'Die Sanduhr. Der fehlende Schatten. Ich hab es die ganze Zeit gewusst – und konnte es nicht beweisen.', 'angry'],
      ['toma', 'Du hast mich benutzt. Die ganze Zeit. Phaidon. Kassia. Du hast gewusst, dass sie sterben!', 'angry'],
      ['kronosB', s => (s.deaths === 0
        ? 'Gewusst? Ich habe mitgezählt. Kassia fällt jedes Mal bei Ares. Und du – diesmal bist du kein einziges Mal gestorben. In den 4.211 Anläufen davor: jedes Mal. Ich habe immer die Sanduhr umgedreht.'
        : 'Gewusst? Ich habe mitgezählt. Kassia fällt jedes Mal bei Ares. Und du – allein in diesem Anlauf bist du ' + fmtDeaths(s.deaths) + ' gestorben. Wer, glaubst du, hat danach jedes Mal die Sanduhr umgedreht?')],
      ['toma', 'Warum ICH?!', 'angry quake'],
      { bg: 'cg_reveal' },
      ['n', 'Kronos löst die Augenbinde. Darunter: grüne Gläser. Gesprungen. Uralt. Und dahinter Augen, die Toma jeden Morgen im Spiegel sieht.', 'flash'],
      ['kronos', 'Weil ich du bin, Toma. Der Toma, der sein erstes Rennen verloren hat. Der zusah, wie Mila am Neumond starb. Der schwor, den Tod selbst abzuschaffen – und so lange rückwärts durch die Zeit fiel, bis er an ihrem Anfang ankam.'],
      { bg: 'olymp' },
      ['robin', 'Moment. Wenn du Toma bist – wo sind dann WIR? Wo sind dein Robin und dein Jario?', 'shock'],
      ['kronos', 'Zu Hause. In Sicherheit. Ich habe die Werkstatttür verriegelt, bevor ihr kamt – ich wollte euch nicht sterben sehen. Ich bin allein gefahren. Und ich habe allein verloren.', 'sad'],
      ['kronos', '4.211 Anläufe lang habe ich es danach genauso gehalten. Nur dieses eine Mal wart ihr schneller als ich. Ihr standet schon in der Liste der Moiren, als ich den Riegel vorschob.'],
      ['jario', '»Das war so nicht vorgesehen.« Dein erster Satz zu uns.', 'stern'],
      ['kronos', 'Und doch ist es der erste Anlauf, der bis hier oben reicht. Ein Rechenfehler, der mir endlich nützt.', 'smile'],
      ['martin', 'Moment. Sein erstes Rennen verloren – gegen wen?', 'stern'],
      ['kronos', 'Gegen dich, Swagger. Platz vier, eine Brettlänge hinter dir. 4.211 Anläufe lang warst du die Wand, an der ich zerschellt bin.'],
      ['kronos', 'Also habe ich dich behalten. Apollons Gunst, dein Brett, dein Ruf – alles von mir bestellt. Ein Toma wird nur schnell, wenn ein Swagger vor ihm fährt.'],
      ['martin', '… Mein Pate. Mein Brett. Alles – bestellt? Von DIR?', 'shock'],
      ['kronos', 'Dachtest du, die alten Griechen hätten Schwebebretter erfunden? ICH habe sie mitgebracht. Den Aether. Die Holos. Jede einzelne Schraube. Ich habe Hellas umgebaut, bis es einen Toma hervorbringt, der schnell genug ist.'],
      ['toma', 'Schnell genug wofür?', 'stern'],
      ['kronos', 'Für das hier. Die Siegel sind gebrochen. Jetzt halte ich die Zeit an – für immer. Kein Neumond mehr. Kein Schnipp. Mila stirbt nie. Und die beiden hier auch nicht.'],
      { face: ['toma', 'stern'] },
      ['zeus', 'Und sie leben nie! Eine Welt ohne nächste Sekunde ist ein Grab, Vater!', 'angry'],
      ['toma', 'Mila würde nie wieder lachen. Nie groß werden. Das ist kein Retten. Das ist Einfrieren.', 'sad'],
      ['robin', 'Für immer in derselben Sekunde stehen? Ohne nächste Kurve, ohne nächstes Essen? Ohne mich, alter Mann.', 'stern'],
      ['martin', 'Niemand macht aus Martin Swagger eine Übungspuppe. Lioumba – wenn dich je einer schlägt, dann ich. Nicht der da.', 'angry'],
      ['kronos', 'Dann haltet mich auf. Kein Rennen mehr – nur ihr, ich und der Sand in meiner Uhr. Aber sei gewarnt, Junge: Ich kenne jede Linie, die du fahren wirst. Ich bin sie alle schon gefahren.'],
      ['jario', 'Jede Linie von einem, der allein fährt. Wir sind drei.', 'smile'],
    ],
  },
  /* ---------- 7 ---------- */
  {
    title: 'Die Sanduhr', track: 'tartaros', laps: 2, skill: 0.98, finale: true, boss: true,
    goal: { boss: true }, goalText: 'Durchbrich Kronos\' Zeitschild, bevor der Sand durchläuft',
    roster: ['kronos'],
    intro: [
      { bg: 'tartaros' },
      ['n', 'Der Himmel reißt. Piräus, Athen, Knossos, der Styx – alle Strecken stürzen ineinander. Am Start steht nur noch einer: Kronos. Um ihn flimmern Schatten – all die Tomas, die allein gefahren sind und verloren haben.', 'quake'],
      ['kronos', 'Kein Rennen mehr, Junge. Nur ihr, ich und der Sand in meiner Uhr. Ist sie leer, steht die Zeit still.'],
      ['pythia', 'Lauf … Fehler. Lauf … Fehler. Ich finde kein Datum mehr. Viel Glück, ihr drei. Diesmal meine ich es ernst.'],
      ['jario', 'Sein Zeitschild hängt an der Sanduhr. Robin und ich bringen ihn abwechselnd zum Flackern – dann bist du dran, Toma. Mit vollem Boost mitten hinein.', 'stern'],
      ['robin', 'Und weich den Schatten aus. Oder fahr mit Boost durch sie durch. Das bist nicht mehr du – das ist nur, was er aus dir gemacht hat.', 'stern'],
      ['martin', 'Ich gehöre zu keinem Knoten – mich lässt der Riss nicht durch. Aber Apollons Gunst wollte ich sowieso nicht mehr. Nimm sie, Kurier: volle Energie. Mach was draus.', 'stern'],
      ['toma', 'Für Mila. Für Kassia. Für Phaidon. Und für jeden von mir, der allein fahren musste.', 'stern'],
      ['robin', 'Toma Heroes?', 'smile'],
      ['jario', 'Toma Heroes.', 'smile'],
      ['toma', 'Einer für alle.', 'smile'],
    ],
    win: [
      { bg: 'tartaros' },
      ['n', 'Der letzte Treffer. Der Zeitschild zerspringt wie Glas – und zum ersten Mal seit dem Anfang der Zeit weiß Kronos nicht, was als Nächstes kommt.', 'flash'],
      ['kronos', '… Mitten durch meinen Schild. Zwei, die ihn aufbrechen. Und als ich sie am Boden habe, knotet sich ausgerechnet Swagger an euch und hält mich fest. Das konnte ich in viertausend Anläufen nie. Ich hatte niemanden neben mir.', 'sad'],
      ['toma', 'Du hast immer nur zurückgeschaut. Und du warst immer allein. Ich nicht.', 'smile'],
      ['martin', 'Damit das klar ist: Ich hab mich nur drangeknotet, weil der Riss sonst zu war.', 'stern'],
      ['jario', 'Du hast dein Leben an unseres gehängt, Swagger. Freiwillig. Dafür gibt es ein Wort.', 'smile'],
      ['martin', '… Sprich es nicht aus.', 'sad'],
      ['zeus', 'Dein Wunsch steht noch aus, Toma Lioumba. Einer. Nur einer. Das Leben deiner Schwester?'],
      ['toma', '… Nein. Ich wünsche mir, dass es nie wieder einen Agon gibt. Gebt die Fäden zurück. Alle.', 'stern'],
      { bg: 'cg_knot' },
      ['moiren', '… Knoten. Knoten. Knoten.', 'flash'],
      { bg: 'olymp' },
      ['kassia', 'Kurierjunge?! Ich war gerade dabei, Hades im Würfeln zu schlagen!', 'shock'],
      ['phaidon', 'Bin ich … hab ich gewonnen?', 'smile'],
      ['robin', 'PHAIDON! Ehrenmitglied Nummer vier! Komm her, Kleiner!', 'smile'],
      ['robin', 'Und Swagger ist Nummer fünf. Keine Widerrede.', 'smile'],
      ['martin', 'Nächstes Mal ohne Götter, ohne Paten, ohne Sanduhr. Nur du und ich, Lioumba.', 'smile'],
      ['toma', 'Abgemacht, Swagger. Aber du fährst hinten.', 'smile'],
      ['toma', 'Und Mila? Ich hatte nur den einen Wunsch …', 'sad'],
      ['kronos', 'Sie braucht keinen Wunsch. Sie braucht Zeit. Und davon habe ich mehr gehortet als jeder andere.'],
      { bg: 'cg_sand' },
      ['n', 'Der alte Mann dreht seine Sanduhr ein letztes Mal um – und drückt sie Toma in die Hand. Der Sand rieselt. Ein ganzes Leben lang.'],
      { bg: 'olymp' },
      ['kronos', 'Sag ihr, ihr Bruder hat sein Versprechen gehalten. Hat nur ein paar Äonen gedauert.', 'smile'],
      ['kronos', 'Und ihr zwei – lasst euch nie wieder aussperren. Schon gar nicht von ihm.', 'smile'],
      { clear: true },
      ['n', 'Als Toma aufsieht, steht da niemand mehr. Nur eine gesprungene grüne Brille liegt im Staub.'],
      { bg: 'workshop_end' },
      ['mila', 'Toma! TOMA! Ich hab Hunger! Und ich will auch so ein Brett!'],
      ['robin', 'Endlich jemand mit den richtigen Prioritäten. Souvlaki für alle – Jario zahlt!', 'smile'],
      ['jario', 'Jario zahlt immer.', 'smile'],
      ['toma', '… Elf Tage, hm? Wir fangen mit Stützrädern an.', 'smile'],
      { bg: 'cg_hourglass' },
      ['n', 'Hellas behielt den Aether, die Bretter und die Holos. Niemand weiß mehr, wer sie erfunden hat. In einer kleinen Werkstatt in Piräus steht eine Sanduhr auf der Werkbank. Daneben lehnen drei Bretter.'],
      ['n', 'Manchmal – wenn keiner hinsieht – dreht sie sich von selbst um.'],
    ],
  },
];

const DEATH_QUOTES = [
  '»Nochmal, Toma.« – Meister Kairon dreht seine Sanduhr um.',
  '»Zu früh gebremst. Wie immer.« – Der Sand läuft rückwärts.',
  '»Die Moiren sind schnell. Sei schneller.« – Kairon dreht die Sanduhr um.',
  '»Das war noch nicht der Anlauf, den ich brauche.« – Der Sand läuft rückwärts.',
];
const DEATH_QUOTE_FINAL = '»Ich habe Zeit, Toma. Alle Zeit.« – Kronos dreht die Sanduhr um.';

/* ================= Dialog-Engine & Ablauf ================= */

const Story = (() => {
  const KEY = 'toma-riders-story';
  let save = { ch: 0, deaths: 0, done: false };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v.ch === 'number') save = { ch: clamp(v.ch | 0, 0, CHAPTERS.length), deaths: v.deaths | 0, done: !!v.done };
  } catch (err) { /* kein Speicher verfügbar: Story läuft trotzdem, nur ohne Spielstand */ }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (err) { /* siehe oben */ }
  };

  let cur = 0;
  let lines = [], li = 0, onDone = null;
  let talking = false, typing = false, full = '', shown = 0, acc = 0;
  let auto = false, autoT = 0;

  const FX = {
    snip() { Sfx.snip(); Cut.fx('snip'); },
    quake() { Sfx.crash(); Cut.fx('quake'); },
    flash() { Sfx.rewind(); Cut.fx('flash'); },
  };

  function lineDone() {
    typing = false;
    autoT = 0;
    $('vn').classList.add('done');
  }

  /* Eine Sequenz besteht aus Regieanweisungen ({ bg, clear, face }) und Zeilen ([Figur, Text, Zusätze]).
     Zusätze: Effekte (snip, quake, flash) und Mimik (angry, shock, sad, smile, stern). */
  function showLine() {
    while (li < lines.length && !Array.isArray(lines[li])) {
      const d = lines[li++];
      if (d.bg) Cut.bg(d.bg);
      if (d.clear) Cut.clear();
      if (d.face) Cut.face(d.face[0], d.face[1]);
    }
    if (li >= lines.length) { finish(); return; }
    const L = lines[li];
    const who = L[0], cast = CAST[who] || CAST.n;
    const vn = $('vn');
    vn.classList.toggle('narr', who === 'n');
    vn.classList.toggle('titlecard', who === 't');
    vn.classList.remove('done');
    if (who === 't') {
      $('vnBig').textContent = L[1];
      $('vnBigSub').textContent = L[2] || '';
      full = L[1];
      Cut.clear();
      lineDone();
      return;
    }
    full = typeof L[1] === 'function' ? L[1](save) : L[1];
    shown = 0;
    acc = 0;
    typing = true;
    $('vnLine').textContent = '';
    const nm = $('vnName');
    nm.textContent = cast.name;
    nm.style.background = cast.col || 'transparent';
    let ex = '';
    for (const f of (typeof L[2] === 'string' ? L[2].split(' ') : [])) {
      if (FX[f]) FX[f]();
      else ex = f;
    }
    if (who === 'n') Cut.narrate();
    else Cut.speak(who, ex);
  }

  function play(ls, cb) {
    lines = ls;
    li = 0;
    onDone = cb;
    talking = true;
    Cut.start();
    Sfx.musicStart();
    Sfx.duck(true);
    showUI('vn');
    showLine();
  }

  function finish() {
    talking = false;
    typing = false;
    Sfx.duck(false);
    const cb = onDone;
    onDone = null;
    if (cb) cb();
  }

  function advance() {
    if (!talking) return;
    if (typing) {
      shown = full.length;
      $('vnLine').textContent = full;
      lineDone();
      return;
    }
    li++;
    if (li >= lines.length) finish();
    else showLine();
  }

  function tick(dt) {
    if (!talking) return;
    if (typing) {
      acc += dt * 58;
      const before = shown;
      while (acc >= 1 && shown < full.length) { acc--; shown++; }
      if (shown !== before) {
        $('vnLine').textContent = full.slice(0, shown);
        if (shown % 3 === 0) Sfx.blip();
      }
      if (shown >= full.length) lineDone();
    } else if (auto) {
      autoT += dt;
      if (autoT > 1.3 + full.length * 0.05) advance();
    }
  }

  /* ---------- Kapitelablauf ---------- */
  function enter(i) {
    cur = i;
    const ch = CHAPTERS[i];
    mode = 'story';
    setupRace({ track: ch.track, laps: ch.laps, roster: ch.roster.concat(HEROES).map(k => RACER[k]), skill: ch.skill, boss: !!ch.boss });
    enterDemo();
    play(ch.intro, () => showCard(ch, i));
  }

  function showCard(ch, i) {
    $('cardKicker').textContent = ch.finale ? 'FINALE' : 'KAPITEL ' + (i + 1) + ' VON ' + CHAPTERS.length;
    $('cardTitle').textContent = ch.title;
    $('cardTrack').textContent = track.name + '  ·  ' + (ch.boss ? 'Bosskampf' : ch.laps + ' Runden');
    $('cardGoal').textContent = 'Ziel: ' + ch.goalText;
    $('cardStake').textContent = ch.boss
      ? 'Weich Zeitrissen und Echos aus – jeder Treffer franst den Fadenbund aus. Sobald Robin oder Jario den Zeitschild zum Flackern bringen: mit Boost in Kronos hinein.'
      : 'Scheiterst du, durchtrennen die Moiren euren Fadenbund – deinen Faden, Robins und Jarios. Tipp: In ihrem Windschatten bist du schneller.';
    showUI('card');
  }

  function go() {
    showUI(null);
    resetRace();
    startCountdown();
  }

  function goalOk(order) {
    const ch = CHAPTERS[cur];
    if (ch.boss) return bossWon();
    const pos = order.findIndex(r => r.isPlayer);
    if (ch.goal.beat) return pos < order.findIndex(r => r.name === ch.goal.beat);
    return pos + 1 <= ch.goal.max;
  }

  /* Für die Anzeige während des Rennens */
  function goalState() {
    const ch = CHAPTERS[cur];
    if (ch.goal.beat) {
      const g = racers.find(r => r.name === ch.goal.beat);
      return { text: 'BESIEGE ' + ch.goal.beat.toUpperCase(), ok: !!g && player.pos < g.pos };
    }
    return { text: ch.goal.max === 1 ? 'NUR PLATZ 1 ZÄHLT' : 'PLATZ ' + ch.goal.max + ' ODER BESSER', ok: player.pos <= ch.goal.max };
  }

  function raceDone(order) {
    const ch = CHAPTERS[cur];
    if (goalOk(order)) {
      showResults();
      return;
    }
    save.deaths++;
    persist();
    const pos = order.findIndex(r => r.isPlayer) + 1;
    $('deathSub').textContent = ch.boss ? bossFailText()
      : 'Platz ' + pos + ' – Ziel verfehlt (' + ch.goalText + '). Die Moiren haben euren Fadenbund durchtrennt – alle drei Fäden.';
    $('deathQuote').textContent = ch.finale ? DEATH_QUOTE_FINAL : DEATH_QUOTES[(save.deaths - 1) % DEATH_QUOTES.length];
    $('deathCount').textContent = 'Durchtrennte Fäden bisher: ' + save.deaths;
    showUI('death');
    Sfx.snip();
    flash = 1;
    shake = 18;
  }

  function next() {
    const ch = CHAPTERS[cur];
    enterDemo();
    play(ch.win, () => {
      save.ch = cur + 1;
      if (save.ch >= CHAPTERS.length) save.done = true;
      persist();
      if (save.ch >= CHAPTERS.length) ending();
      else enter(save.ch);
    });
  }

  function ending() {
    $('endStats').textContent = 'Durchtrennte Fäden: ' + save.deaths + '  ·  Neue Strecke im freien Rennen: »Tartaros – Der Zeitriss«';
    showUI('ending');
    Sfx.finish(1);
  }

  return {
    play, advance, tick, go, raceDone, next, goalState,
    talking: () => talking,
    toggleAuto() { auto = !auto; autoT = 0; return auto; },
    skip() { if (talking) finish(); },
    retry() { showUI(null); resetRace(); startCountdown(); },
    begin(fresh) {
      if (fresh || save.ch >= CHAPTERS.length) { save = { ch: 0, deaths: 0, done: save.done }; persist(); }
      enter(save.ch);
    },
    status() {
      const i = Math.min(save.ch, CHAPTERS.length - 1);
      return { ch: save.ch, total: CHAPTERS.length, title: CHAPTERS[i].title, done: save.done, deaths: save.deaths, finished: save.ch >= CHAPTERS.length };
    },
    isFinale: () => !!CHAPTERS[cur].finale,
  };
})();
