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

  shadeT: { name: 'Theron †',      skill: 1.06, pal: suit('#3f8f80', '#235a50', '#6fbfae', '#b6ffe6', '#12302c', '#7dffd8', SHADE) },
  shade6: { name: 'Der Praktikant †', skill: 1.02, pal: suit('#4f9f90', '#2c6a5e', '#8fd8c8', '#b6ffe6', '#12302c', '#7dffd8', SHADE) },

  kronos: { name: 'Kronos', skill: 1.13, god: 'kronos', pal: suit('#2a2038', '#1a1426', '#2a2038', '#e8c877', '#1a1426', '#d0a0ff',
    { skin: '#d9cfe8', cape: '#2a2038', crown: '#e8c877', aura: '200,140,255', size: 1.15, glow: '208,160,255', dot: '#d0a0ff' }) },
  /* Echos im Bosskampf: Stürze, die Kronos Toma andichten will */
  echo1: { name: 'Toma von vorhin', skill: 1.07, pal: ECHO_PAL },
  echo2: { name: 'Toma von gestern', skill: 1.05, pal: ECHO_PAL },
  echo3: { name: 'Toma von gleich', skill: 1.03, pal: ECHO_PAL },
  echo4: { name: 'Toma von nie',    skill: 1.00, pal: ECHO_PAL },
};
RACER.kassia3 = { name: 'Kassia', skill: 1.02, pal: RACER.kassia.pal };
RACER.hermes2.pal = RACER.hermes.pal;
RACER.ares2.pal = RACER.ares.pal;

/* Tomas Freunde fahren als Schwurbund mit: ally = Abstand, den sie vor Toma halten · lane = Stammspur.
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

/* Martin Swagger: Tomas Kollege und Rivale. Gründet in Hellas sein eigenes Team, die Argonauten (mit Xanthe und Theron).
   Fährt in jedem Lauf mit und kommentiert Überholmanöver. */
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
  kairon: { name: 'Kairon · Stimme im Brett', col: '#e0b060', spec: KAIRON_SPEC },
  /* Kairon ohne Augenbinde (Finale): Er sieht seinen alten Freund zum ersten Mal wieder an */
  kaironR: { name: 'Meister Kairon', col: '#e8c877', spec: Object.assign({}, KAIRON_SPEC, {
    bg: ['#7a3ad0', '#12061f'], ring: '#e8c877', shirt: '#2a2038', trim: '#e8c877', eyes: 'glow', eyeCol: '#e8c877',
  }) },
  kronos: { name: 'Kronos · Der Erste Fremde', col: '#d0a0ff', spec: {
    bg: ['#7a3ad0', '#12061f'], ring: '#d0a0ff', skin: '#d9cfe8', skin2: '#c4b8d8', shirt: '#2a2038', trim: '#d0a0ff',
    hair: { kind: 'cap', cols: ['#f4f5f8', '#d5d9e4'], long: true }, beard: { col: '#f4f5f8', full: true, len: 12 }, brow: '#e6e9ee',
    eyes: 'glow', eyeCol: '#e8c877', mouth: 'stern', lip: '#8a7aa6', old: true, head: 'crown', headCol: '#2a2038', crestCol: '#e8c877',
  } },
  xanthe: { name: 'Xanthe · Argonauten', col: '#f0cf5a', spec: {
    bg: ['#f0cf5a', '#9a7410'], skin: '#e9bd94', skin2: '#dcab80', shirt: '#e6b422', wide: 0.95,
    hair: { kind: 'fringe', cols: ['#e9c860', '#f5dc8a'], long: true }, brow: '#b9963a', eyes: 'normal', eyeCol: '#4f8f3a', mouth: 'smirk',
  } },
  theron: { name: 'Theron · Argonauten', col: '#7fd89a', spec: {
    bg: ['#6fcf8a', '#1f5a34'], skin: '#c98f66', skin2: '#b87d55', shirt: '#3f9a5a', wide: 1.1,
    hair: { kind: 'short', cols: ['#1b1e27', '#3a3f4c'] }, beard: { col: '#1b1e27', full: true, len: 2 }, brow: '#1b1e27',
    eyes: 'normal', eyeCol: '#3a2a1a', mouth: 'stern',
  } },
  kassia: { name: 'Kassia von Sparta', col: '#ff6b6b', spec: {
    bg: ['#d8454f', '#5e1118'], skin: '#d8a27a', skin2: '#c98f66', shirt: '#8a1f1f', trim: '#c98a3c',
    brow: '#3a2418', eyes: 'normal', eyeCol: '#5a3a22', mouth: 'smirk',
    head: 'spartan', headCol: '#d9a04e', headCol2: '#a8742c', crestCol: '#ff3b3b',
  } },
  theronG: { name: 'Theron (Schatten)', col: '#9dffe6', spec: {
    bg: ['#2f7a68', '#0a1f1c'], ring: '#9dffe6', ghost: true, skin: '#a8dccc', skin2: '#8fc8b8', shirt: '#235a50', wide: 1.1,
    hair: { kind: 'short', cols: ['#2c5a50', '#3f8f80'] }, beard: { col: '#2c5a50', full: true, len: 2 }, brow: '#2c5a50',
    eyes: 'glow', eyeCol: '#b6ffe6', mouth: 'stern', lip: '#4f8f80',
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
/* »Ticket von K.«: Toma, Robin und Jario sind Softwareentwickler in Neo-Skyline, Martin Swagger ist ihr Kollege.
   Ein uraltes Ticket führt sie in den Serverraum zu einem antiken Schwebebrett – Martin fasst es an, und alle vier
   landen in der Sagenwelt Hellas. Dort nennen sich die drei »Toma Heroes«; Martin gründet mit zwei Einheimischen
   sein eigenes Team. Im Brett steckt der Geist des Schmieds Kairon. Heim führt nur das Tor des Königs, und das
   öffnet sich für den Sieger des Großen Agon. Wer dort verliert, dem schneiden die Moiren den Faden.
   Ton: düster, mit trockenem Humor. Namenskarten (['t', …]) stellen die großen Figuren vor. */

const fmtDeaths = n => (n === 1 ? 'ein Mal' : n + ' Mal');
const HEROES = ['robin', 'jario'];       // Tomas Schwurbund: fährt in jedem Lauf mit

const CHAPTERS = [
  /* ---------- 1 ---------- */
  {
    title: 'Ticket von K.', track: 'piraeus', laps: 3, skill: 0.93,
    goal: { max: 3 }, goalText: 'Platz 3 oder besser',
    roster: ['kassia', 'martin', 'xanthe', 'theron', 'phaidon'],
    intro: [
      { bg: 'neosky' },
      ['t', 'NEO-SKYLINE', 'Freitag · 23:41 Uhr · Noch im Büro'],
      ['n', 'Toma Lioumba ist Softwareentwickler. Robin Schallerbach und Jario Magic auch. Freitagnacht, vierzigster Stock – und im Ticketsystem leuchtet ein Eintrag, den keiner von ihnen angelegt hat.'],
      ['jario', 'Priorität: Blocker. Offen seit zwölftausend Tagen. Zugewiesen an: Toma Lioumba. Text: »Zeit läuft falsch. Bitte zurücksetzen. – K.«', 'stern'],
      ['robin', 'Zwölftausend Tage? Das Ticket ist älter als wir. Schließ es als »nicht nachvollziehbar«, und wir gehen Souvlaki essen.', 'smile'],
      ['toma', 'Es ist mir zugewiesen. Was mir zugewiesen ist, bringe ich zu Ende.', 'stern'],
      ['jario', 'Anhang: »Hardware im Serverraum, unterste Ebene.« … Wir haben eine unterste Ebene?'],
      ['n', 'Sie haben eine. Ganz hinten, hinter Schränken, die niemand mehr kennt, steckt ein uraltes Schwebebrett an einem Server. Am Brett klebt ein vergilbter Zettel: »NICHT ANFASSEN. LÄUFT.«'],
      ['t', 'MARTIN SWAGGER', 'Kollege · Spielt freitags Änderungen ein · Hält sich für schön'],
      ['martin', 'Lioumba! Ihr auch noch da? Ich arbeite gern lange. Vor allem, wenn es jemand sieht. Oh – was ist DAS denn Hübsches?', 'smile'],
      ['toma', 'Swagger. Da steht »Nicht anfassen«.', 'stern'],
      ['martin', 'Auf jedem Zettel, auf dem »Nicht anfassen« steht, fehlt nur ein Wort: »Martin«.'],
      ['n', 'Er fasst es an.', 'quake'],
      ['kairon', 'WER VON EUCH IST DER RITTER?', 'flash'],
      ['n', 'Ein Licht wie ein Blitz von innen. Dann ist der Serverraum leer. Vier Entwickler. Vier Pendlerbretter. Weg.'],
      { bg: 'hellas' },
      ['t', 'HELLAS', 'Eine Sage. Leider bewohnt.'],
      ['pythia', 'Willkommen in Hellas. Sie wurden gerufen, um den König zu stürzen. Bitte bleiben Sie ruhig. Mein Ruf gilt dem Ritter, der das Erste Brett reitet. Ich hatte EINEN bestellt. Sie sind vier. Und keiner davon ist Ritter.'],
      ['robin', 'Wir sind Softwareentwickler!', 'angry'],
      ['pythia', 'Das wird in der Prophezeiung nicht erwähnt. Was ist ein Softwareentwickler?'],
      ['jario', 'Jemand, der Probleme löst, die es ohne ihn nicht gäbe.'],
      ['pythia', 'Zur Hausordnung: Über Hellas herrscht König Zeus mit seiner Tafel der Götter-Ritter. Fremde werden bei Sichtkontakt geschnitten – Lebensfaden, Schere, Schnipp. Ausgenommen sind Teilnehmer des Großen Agon. Bis sie verlieren.'],
      ['jario', 'Und der Weg nach Hause?', 'stern'],
      ['pythia', 'Das Tor des Königs, auf dem Olymp. Es öffnet sich für den Sieger. Anmeldung beim Veranstalter. Er wartet schon. Er wartet immer schon.'],
      { bg: 'workshop' },
      ['n', 'Das Brett zieht. Durch drei Gassen, über einen Hinterhof, in eine Schmiede, in der seit Äonen kein Feuer mehr gebrannt hat. Dann redet es wieder.'],
      ['kairon', 'Zwölftausend Jahre im Holz. Zwölftausend! Und wer weckt mich? Einer, der beruflich auf Tasten drückt.', 'angry'],
      ['toma', 'Softwareentwickler.', 'stern'],
      ['kairon', 'Meister Kairon. Ich habe dieses Brett gebaut, und ich stecke darin, seit es keinen Reiter mehr hat. Du willst heim, Lehrling? Dann fährst du den Agon. Mit Haltung. Du stehst auf mir, wie du vermutlich arbeitest: krumm und ohne Plan.'],
      ['robin', 'Toma. Dein Anhang beleidigt dich.', 'smile'],
      ['toma', 'Es ist der Anhang zu einem Ticket. Das Ticket ist von K. Ich löse es. Danach fahren wir heim.', 'stern'],
      ['kairon', '… Von K. Natürlich. Unterste Ebene.', 'stern'],
      ['jario', 'Du kennst den, der es geschrieben hat?', 'stern'],
      ['kairon', 'Ich kenne die Ebene. Erst der Agon, Lehrling. Fragen danach.'],
      { bg: 'piraeus' },
      ['t', 'HERMES', 'Götterbote · Veranstalter · Liest das Kleingedruckte nicht vor'],
      ['hermes', 'Sterbliche, Unsterbliche, Zahlende! Der Große Agon – präsentiert von mir! Sieben Läufe, ein Sieger, ein Tor nach Hause. Teilnahme auf eigene Gefahr und eigenen Faden. Und jetzt: Teamname? Ohne Namen kein Faden. Ohne Faden … nun ja.'],
      ['martin', 'Team »Argonauten«. Kapitän: ich. Besatzung: die zwei da. Ich kenne sie seit zehn Minuten. Großartige Leute.', 'smile'],
      ['xanthe', 'Er hat uns einen »Bonus« versprochen. Wir wissen nicht, was das ist.'],
      ['theron', 'Klang gut.'],
      ['toma', 'Swagger. Du gründest ein EIGENES Team?', 'shock'],
      ['martin', 'Ich arbeite nicht in fremden Teams, Lioumba. Ich leite sie. Möge der Bessere heimkommen.', 'smile'],
      ['hermes', 'Und ihr drei? Name!'],
      ['robin', 'TOMA HEROES!', 'smile'],
      ['toma', 'Warum MEIN Name?', 'shock'],
      ['robin', 'Dir ist das Ticket zugewiesen. Und »Robin Heroes« klingt wie eine Hähnchenkette.', 'smile'],
      ['jario', '»Jario Heroes« klingt wie eine Fehlermeldung. Ich bin dafür.'],
      ['t', 'TOMA HEROES', 'Drei Entwickler · Ein Knoten · Kein Plan'],
      { bg: 'cg_bund' },
      ['n', 'Die Moiren binden jedem Fahrer einen Faden ums Handgelenk. Robin und Jario halten ihre Hände zu Tomas. Drei Fäden, ein Knoten – ein Schwurbund: Kommt der Kapitän durch, kommen alle durch. Fällt er, fällt die Schere einmal. Für alle drei.'],
      { bg: 'piraeus' },
      ['toma', 'Dann hört es jeder, der hier eine Schere hält: Wir sind die Toma Heroes. Wir sind hier, um ein Ticket zu schließen. Danach gehen wir heim.', 'stern'],
      ['kassia', 'Fremde im Agon. Kassia von Sparta, Ritterin des Ares. Ich fahre seit zehn Jahren für einen Platz an der Tafel. Ihr fahrt seit zehn Minuten. Bleibt mir aus der Linie.', 'stern'],
      ['pythia', 'Lauf eins: Hafen von Piräus. Platz drei oder besser kommt weiter. Die Moiren bitten darum, beim Schneiden nicht zu zappeln.'],
      ['robin', 'Wir fahren vor dir, Toma. Häng dich in unseren Windschatten, wenn du Schwung brauchst – dafür sind Freunde da!', 'smile'],
    ],
    win: [
      { bg: 'piraeus' },
      ['pythia', 'Qualifiziert: »Toma Heroes«. Ihre Überlebenschance wurde soeben auf vier Prozent angehoben. Glückwunsch.'],
      ['robin', 'Vier Prozent! Das ist mehr, als Martin je getestet hat!', 'smile'],
      ['martin', 'Mein Code braucht keine Tests. Er hat Selbstvertrauen.', 'smile'],
      ['kairon', 'Zu spät am Boost, zu früh auf der Bremse, und in Kurve vier hast du mit den Armen gerudert. Der letzte Reiter dieses Bretts hat NIE gerudert.'],
      ['toma', 'Wer war der letzte Reiter?', 'stern'],
      ['kairon', '… Ein Fremder. Wie du. Lange her. Lenk nicht ab – Arme!'],
      ['n', 'Auf dem Weg vom Kai hält eine alte Frau Toma am Ärmel fest. Ihre Sonnenuhr geht nach. »Kannst du mal kurz draufschauen?« Toma nickt.'],
      ['jario', 'Wir sind auf der Flucht vor einer Schere, und du nimmst ANFORDERUNGEN an?', 'shock'],
      ['toma', 'Es ist nur eine Kleinigkeit.', 'stern'],
      ['jario', 'Das hast du beim letzten Mal auch gesagt. Das waren drei Wochen.'],
      ['martin', 'Rührend. Xanthe, notier das: Der Mann schließt JEDES Ticket. Den muss man gar nicht überholen. Man muss ihm nur das richtige Ticket schreiben.', 'smile'],
      ['xanthe', 'Notiert, Kapitän. Und Theron fragt, wann der Bonus kommt.'],
      ['theron', 'Eilt nicht.'],
    ],
  },
  /* ---------- 2 ---------- */
  {
    title: 'Hausordnung', track: 'akropolis', laps: 2, skill: 0.95,
    goal: { max: 3 }, goalText: 'Platz 3 oder besser',
    roster: ['kassia', 'martin', 'xanthe', 'theron', 'phaidon'],
    intro: [
      { bg: 'akropolis' },
      ['n', 'Athen. Die Sonnenuhr geht wieder richtig. Toma hat dafür nur eine Nacht gebraucht und nebenbei »mal kurz« zwei Brunnen und eine Wassermühle mitgemacht. Auf der Akropolis warten die Tribünen – und drei Frauen mit einer Schere.'],
      ['phaidon', 'Seid ihr die Fremden? Die von JENSEITS der Sage? Ich bin Phaidon, Knappe der Ritterin Kassia! Darf ich ein Autogramm? Auf mein Brett? Auf meinen Arm?', 'smile'],
      ['kassia', 'Phaidon. Ein Knappe bettelt nicht um Tinte.', 'stern'],
      ['phaidon', 'Jawohl, Ritterin! … Auf den Arm wäre trotzdem gut.'],
      ['toma', 'Arm her. »Geprüft und freigegeben. T. Lioumba.«', 'smile'],
      ['n', 'Theron, der Größte der Argonauten, rückt dem Jungen im Vorbeigehen wortlos den Helm gerade. Es ist das Längste, was man ihn bisher hat tun sehen.'],
      ['xanthe', 'Er redet nicht viel. Aber gestern hat er den Kapitän aus dem Hafenbecken gezogen. Zweimal. Der Kapitän wollte beweisen, dass er übers Wasser fahren kann.', 'smile'],
      ['martin', 'Ich KANN übers Wasser fahren. Das Wasser war nur nicht so weit.'],
      ['hermes', 'Lauf zwei! Und weil mein König Spannung liebt, eine kleine Regeländerung: Wer als Letzter die Linie quert, wird noch im Ziel geschnitten. Steht alles im Kleingedruckten.'],
      ['jario', 'In WELCHEM Kleingedruckten?', 'angry'],
      ['hermes', 'In dem, das ich gerade schreibe.'],
      ['jario', 'Er ändert die Anforderungen im laufenden Betrieb. Ich hasse diesen Mann.', 'stern'],
      ['kairon', 'Hör zu, Lehrling. Ab hier ist das kein Spiel mehr. Ich habe den Agon schon einmal einen guten Mann fressen sehen. Fahr sauber – und sieh nicht zurück.', 'stern'],
      ['pythia', 'Lauf zwei: Akropolis-Ring. Platz drei oder besser kommt weiter. Der Letzte nicht.'],
    ],
    win: [
      { bg: 'akropolis' },
      ['n', 'Letzte Gerade. Xanthes Brett stottert – ein Aether-Leck, zwei Längen vor der Linie. Sie wird Letzte. Sie weiß es. Alle wissen es.'],
      ['n', 'Theron sagt nichts. Er nimmt nur das Gas weg.'],
      ['xanthe', 'Theron? THERON! Fahr weiter, du Ochse! FAHR!', 'shock'],
      ['theron', 'Kapitän. Bring sie heim.', 'smile'],
      { bg: 'cg_snip' },
      ['moiren', 'Schnipp.', 'snip'],
      ['n', 'Kein Blitz. Kein Schrei. Sein Brett rollt noch drei Herzschläge lang weiter und bleibt vor Xanthes Füßen liegen.'],
      { bg: 'akropolis' },
      ['martin', '… Steh auf. Theron. Steh auf, das ist eine Anweisung. Ich bin dein Kapitän, ich –', 'angry'],
      ['xanthe', 'Martin. Er ist weg.', 'sad'],
      ['hermes', 'Tragisch! Wirklich. Die Quoten für Lauf drei ziehen übrigens kräftig an –'],
      ['robin', 'Noch EIN Wort, Flügelschuh. Ein einziges.', 'angry'],
      ['kassia', '… In zehn Jahren Agon habe ich keinen Ritter gesehen, der das getan hätte. Und der da kannte seinen Kapitän seit drei Tagen.', 'sad'],
      ['toma', 'Martin. Wenn du –', 'sad'],
      ['martin', 'Fass mich nicht an, Lioumba. Ich habe ihn in dieses Team geholt. Zehn Minuten Gespräch am Hafen. Ich hole ihn auch wieder zurück. Egal, was es kostet.', 'angry'],
      ['kairon', 'Weiter, Lehrling. Wer im Agon stehen bleibt, ist der Nächste.', 'sad'],
      ['jario', '»Schon einmal einen guten Mann fressen sehen.« Er redet von jemand Bestimmtem. Und er will nicht, dass wir fragen.', 'stern'],
    ],
  },
  /* ---------- 3 ---------- */
  {
    title: 'Der Erste Ritter', track: 'thermo', laps: 2, skill: 0.96,
    goal: { beat: 'Ares' }, goalText: 'Vor Ares ins Ziel kommen',
    roster: ['ares', 'martin', 'xanthe', 'kassia3', 'phaidon'],
    intro: [
      { bg: 'thermo' },
      ['n', 'Die Thermopylen. Ab hier, sagt das Kleingedruckte, fährt in jedem Lauf ein Ritter der Tafel mit. Wer hinter ihm ins Ziel kommt, hat verloren.'],
      ['t', 'ARES', 'Kriegsgott · Erster Ritter der Tafel · Hat noch nie in einer Schlange gewartet'],
      ['ares', 'FREMDER! Man sagt, du behebst jeden Fehler. Dann behebe MICH! HA! Das war ein Wortspiel. Ich habe es selbst gemacht.'],
      ['toma', 'Du bist kein Fehler. Du bist eine Funktion, die niemand bestellt hat.', 'stern'],
      ['ares', 'ER HAT GEANTWORTET! Kassia! Hast du das gehört? Ich habe kein Wort verstanden! Ich werde ihn zermalmen und danach vermissen!'],
      ['kassia', 'Mein Herr. Es heißt, Ritter beschützen die Schwachen. In Athen ist ein Mann für seine Gefährtin gestorben. Wir haben zugesehen.', 'stern'],
      ['ares', 'Ritter beschützen den KÖNIG, Mädchen. Alles andere ist Gymnastik.'],
      ['martin', 'Lioumba. Ich fahre heute nicht gegen dich. Ich fahre, um nicht nachzudenken. Bleib mir trotzdem vom Leib.', 'stern'],
      ['kairon', 'Ares fährt wie ein Rammbock und denkt wie einer. Bleib aus seiner Linie und lass ihn an den Amphoren zerschellen. Und Lehrling: Arme ruhig.'],
      ['robin', 'Wenn er rammt, rammt er zuerst mich. Ich bin breiter als ihr zwei zusammen, und seit Athen bin ich WÜTEND.', 'stern'],
    ],
    win: [
      { bg: 'thermo' },
      ['ares', 'GESCHLAGEN! Von einem Tastendrücker! Auf einem Brett, das mich BELEIDIGT hat!'],
      ['kairon', 'Ich habe nur gesagt, dein Helm ist zu eng. Für das, was drin sein sollte.', 'smile'],
      ['ares', 'Diese Stimme. Der alte Schmied? DER Schmied? Fremder – weißt du, worauf du da stehst? Das ist das Erste Brett. Das Brett des –'],
      ['kairon', 'Ares. Halt. Den. Mund.', 'angry'],
      { face: ['toma', 'shock'] },
      ['ares', '… Der König wird es erfahren. Das letzte Mal, als ein Fremder auf diesem Brett den Agon gewann, haben wir zwölftausend Jahre lang aufgeräumt.'],
      ['toma', 'Kairon. Wer ist vor mir auf diesem Brett gefahren?', 'stern'],
      ['kairon', 'Jemand, der auch nur heimwollte. Mehr sage ich nicht, Lehrling. Noch nicht.', 'sad'],
      ['kassia', 'Fremder. Der Mann, der in Athen gestorben ist. Wie hieß er?', 'stern'],
      ['toma', 'Theron.'],
      ['kassia', 'Ich ritze den Namen in mein Brett. Das tut man bei uns für Ritter.', 'stern'],
      ['phaidon', 'Aber Ritterin, er war doch gar kein –'],
      ['kassia', 'Doch, Phaidon. Er war.'],
      ['n', 'Martin Swagger steht daneben und tut, als müsse er an seinem Brett etwas festziehen. Sehr lange.'],
    ],
  },
  /* ---------- 4 ---------- */
  {
    title: 'Kleingedrucktes', track: 'knossos', laps: 3, skill: 0.96,
    goal: { beat: 'Hermes' }, goalText: 'Vor Hermes ins Ziel kommen',
    roster: ['hermes', 'talos', 'martin', 'xanthe', 'lysandros'],
    intro: [
      { bg: 'knossos' },
      ['n', 'Kreta. Im Labyrinth von Knossos hat Hermes Wettbuden aufgestellt, einen Andenkenstand und ein Schild: »Für verlorene Fäden wird nicht gehaftet.«'],
      ['t', 'HERMES', 'Zweiter Ritter der Tafel · Gott der Boten UND der Diebe · Ein Interessenkonflikt auf zwei Beinen'],
      ['hermes', 'Kollegen! Ich darf doch Kollegen sagen? Ich überbringe Nachrichten, ihr schreibt welche, die keiner liest – wir sind praktisch verwandt. Heute fahre ich selbst mit. Wer hinter mir ankommt: Schnipp. Paragraph neun.'],
      ['jario', 'Es gibt keinen Paragraph neun. Ich habe das Regelwerk gelesen. Alles. Es hört bei acht auf.', 'stern'],
      ['robin', 'Du hast die ANLEITUNG gelesen? Freiwillig?', 'shock'],
      ['hermes', 'Jetzt gibt es einen.'],
      ['robin', 'Toma. Der Andenkenstand verkauft Figuren von uns. MEINE ist dicker als ich!', 'angry'],
      ['jario', 'Sie ist maßstabsgetreu.'],
      ['n', 'Swagger und der Gott reden abseits. Leise. Als Swagger zurückkommt, sieht er niemandem in die Augen.'],
      ['xanthe', 'Kapitän? Was wollte er von dir?'],
      ['martin', 'Nichts. Ein Angebot für die Zeit nach dem Agon. Fahr.', 'stern'],
      ['kairon', 'Hermes hält sich an keine Linie – er kauft sie. Fahr deine eigene, Lehrling. Und trau heute keinem, der dir etwas schenken will.'],
      ['pythia', 'Lauf vier: Labyrinth von Knossos. Ziel: vor Hermes ankommen. Der Veranstalter weist darauf hin, dass der Veranstalter gewinnen wird.'],
    ],
    win: [
      { bg: 'knossos' },
      ['hermes', 'Hui. Das stand so nicht im Kleingedruckten.'],
      ['jario', 'Paragraph zehn. Habe ich eben reingeschrieben, ohne dass es jemand gegengelesen hat: »Der Veranstalter beantwortet nach einer Niederlage drei Fragen.«', 'smile'],
      ['hermes', 'Du gefällst mir, Stiller. Frag.'],
      ['jario', 'Wer hat das Ticket in unser System gestellt?', 'stern'],
      ['hermes', 'Ich. Zugestellt in eure Warteschlange, Priorität Blocker, samt Anhang im Keller. Ein Gott der Boten weiß, wem man so etwas zuweist: dem, der jedes Ticket zu Ende bringt.'],
      ['toma', 'Und Martin?', 'stern'],
      ['hermes', 'Den brauchte ich für den Zettel. Wo »Nicht anfassen« steht, muss ja einer anfassen. Dafür gibt es in jeder Firma genau einen Mann. Ich habe gewartet, bis er lange blieb.'],
      ['martin', 'Ich war … eingeplant?', 'shock'],
      ['toma', 'Dritte Frage. Für wen arbeitest du?', 'angry'],
      ['hermes', 'Für den, der das Ticket geschrieben hat. Für wen sonst? Ich bin nur der Bote.'],
      { face: ['toma', 'shock'] },
      ['kairon', 'Lehrling. Wir müssen reden. Aber nicht hier.', 'sad'],
      ['hermes', 'Grüßt Hades von mir! Und zieht eine Nummer – ohne Nummer geht bei ihm gar nichts.'],
    ],
  },
  /* ---------- 5 ---------- */
  {
    title: 'Bitte ziehen Sie eine Nummer', track: 'styx', laps: 2, skill: 0.97,
    goal: { beat: 'Hades' }, goalText: 'Vor Hades ins Ziel kommen',
    roster: ['hades', 'shadeT', 'martin', 'xanthe', 'shade6'],
    intro: [
      { bg: 'styx' },
      ['n', 'Die Unterwelt. Am Ufer des Styx steht ein Automat. Er gibt Nummern aus. Die Schlange davor reicht bis in die Dunkelheit.'],
      ['t', 'HADES', 'Dritter Ritter der Tafel · Herr der Toten · Seit Äonen ohne Urlaub'],
      ['hades', 'Nummer 4.211.906. Ihr seid nicht tot und habt trotzdem eine Nummer gezogen. Das ist … höflich. Das macht hier sonst niemand.'],
      ['toma', 'Ohne Nummer wird nichts bearbeitet. Das weiß jeder.', 'stern'],
      ['jario', 'Vier Millionen offene Vorgänge. Das ist kein Totenreich. Das ist eine Warteschlange, um die sich keiner kümmert.'],
      ['hades', 'Ich mag sie. Schade. Wer hinter mir ins Ziel kommt, bleibt gleich hier – das spart mir Formulare.'],
      ['theronG', '… Kapitän?'],
      ['martin', 'Theron! Theron, ich bin es. Ich hole dich hier raus. Ich habe einen Weg, ich habe –', 'shock'],
      ['theronG', 'Du siehst müde aus, Kapitän. Hat Xanthe gegessen? Sie vergisst das immer.'],
      ['xanthe', 'Du Ochse. Du verdammter, sturer Ochse.', 'sad'],
      ['hades', 'Die sechs dort hinten solltet ihr euch auch ansehen. Sie fahren hier jeden Tag ihre Runden.'],
      ['n', 'Sechs Schatten auf sechs Brettern. Fremde Kleider. Ein Rucksack mit Laptopfach. Einer trägt ein Schlüsselband mit einem Logo, das Toma jeden Morgen am Empfang sieht.'],
      ['jario', 'Das ist unsere Firma. Toma … das ist der Praktikant von vor drei Jahren. Alle dachten, er hätte gekündigt.', 'shock'],
      ['pythia', 'Die Helden eins bis sechs. Gerufen, um den König zu stürzen. Statistisch gesehen sind Sie mein siebter Versuch. Ich wollte es Ihnen schonender mitteilen. Es gab kein Formular dafür.'],
      ['hades', 'Sieben vor euch, genau genommen. Der Erste steht nicht hier. Der Erste hat gewonnen.'],
      ['kairon', 'Fahr, Lehrling. Danach erzähle ich dir alles. Ich schwöre es bei dem Holz, in dem ich stecke.', 'sad'],
      ['robin', 'Erst fahren. Dann reden. Und danach, Pythia, unterhalten wir zwei uns über »schonend«.', 'stern'],
    ],
    win: [
      { bg: 'styx' },
      ['hades', 'Geschlagen. Bitte unterschreiben Sie hier, dass ich es gesehen habe. Danke. Der Durchschlag ist für Sie.'],
      ['toma', 'Kairon. Jetzt.', 'stern'],
      ['kairon', 'Der Erste Fremde. Vor zwölftausend Jahren gerufen – wie du. Aus demselben Turm wie du. Ich war sein Schmied und sein Freund. Ich habe ihm dieses Brett gebaut, und er hat damit den Agon gewonnen.', 'sad'],
      ['kairon', 'Er wollte nur heim. Aber das Tor ging nicht auf – nicht für einen König, und zum König hatten sie ihn gemacht. Also baute er ein Stundenglas, groß wie ein Berg, um die Zeit zurückzusetzen. Bis zu der Nacht, in der er gerufen wurde.', 'sad'],
      ['jario', 'Alles auf Anfang. Ohne Sicherung.', 'stern'],
      ['kairon', 'Hellas. Die Götter. Jeder Mensch aus zwölftausend Jahren – nie gewesen. Die Tafel hat ihn in den Tartaros gekettet. Ich habe das Herzstück aus seinem Glas gebrochen und mich damit im Brett verkrochen. Ein einziges Korn.', 'sad'],
      ['kairon', s => (s.deaths === 0
        ? 'Du bist in diesem Agon nicht ein Mal gefallen, Lehrling. Wärst du es – das Korn hätte dich zurück an den Start gesetzt. Im Kleinen tut es, was er im Großen will.'
        : 'Du bist in diesem Agon ' + fmtDeaths(s.deaths) + ' gefallen, Lehrling. Du weißt es nur nicht mehr: Das Korn hat dich jedes Mal zurück an den Start gesetzt. Im Kleinen tut es, was er im Großen will.'), 'stern'],
      ['robin', 'Moment. Wir sind GESTORBEN? Und keiner sagt was? Ich hätte vorher gern noch was gegessen!', 'shock'],
      ['jario', '»Zeit läuft falsch. Bitte zurücksetzen. – K.« Zwölftausend Tage bei uns. Zwölftausend Jahre hier.', 'stern'],
      ['kairon', 'Kronos. So nennen sie ihn heute. Bei euch hieß er anders. Er hat mir erzählt, er habe in jener Nacht »Bereitschaft« gehabt. Ich habe nie verstanden, was das ist. Nur, dass sie nie aufgehört hat.', 'sad'],
      ['toma', 'Er steht noch auf der Liste. Ganz unten. »K. Ronos, Haustechnik.« Alle dachten, das sei ein Tippfehler.', 'shock'],
      ['n', 'Am Ufer steht Martin Swagger vor einem Schatten, der ihn fragt, ob Xanthe gegessen hat. Er hat jedes Wort gehört. Vor allem eines: zurücksetzen.'],
    ],
  },
  /* ---------- 6 ---------- */
  {
    title: 'Nicht anfassen', track: 'olymp', laps: 2, skill: 0.97,
    goal: { max: 1 }, goalText: 'Nur Platz 1 zählt',
    roster: ['zeus', 'hermes2', 'athene', 'ares2', 'martin'],
    intro: [
      { bg: 'olymp' },
      ['n', 'Der Olymp. Hinter dem Thron steht ein Tor aus Licht. Dahinter, ganz schwach, hört man Lüfter rauschen.'],
      ['t', 'ZEUS', 'König von Hellas · Herr der Tafel · Schneidet Fremde aus Prinzip'],
      ['zeus', 'Der Siebte. Die Seherin gibt nicht auf. Weißt du, warum ich euch schneiden lasse, Fremder? Nicht aus Bosheit. Der Erste von euch hätte fast die Welt gelöscht, weil er Heimweh hatte.'],
      ['toma', 'Sechs von unseren Leuten stehen an einem Ufer und fahren im Kreis. Die hatten auch Heimweh.', 'stern'],
      ['zeus', 'Sechs gegen alle, die je gelebt haben. Ich habe gerechnet. Ein König muss rechnen.'],
      ['robin', 'Dann rechne mal mit DREI, Blitzbirne.', 'angry'],
      ['zeus', 'Letzter Lauf. Gewinnst du, öffnet sich das Tor – so will es das Gesetz, und das breche nicht einmal ich. Aber das Brett bleibt hier. Niemand fasst es je wieder an. Und es kommt NIE in die Nähe des Tartaros.'],
      ['toma', 'Es gehört zu einem Ticket. Das Ticket ist offen.', 'stern'],
      ['kairon', 'Lehrling! Ein einziges Mal in deinem Leben: Lass etwas OFFEN. Ich bitte dich.', 'shock'],
      ['toma', 'Darüber reden wir nach dem Rennen.'],
      ['martin', 'Ich fahre mit. Viel Glück, Lioumba. Ehrlich gemeint. … Und verzeih mir.', 'sad'],
      ['jario', '»Verzeih mir«? Wofür?', 'stern'],
      ['robin', 'Egal, was kommt: Wir fahren direkt vor dir. Wie immer.', 'smile'],
      ['toma', 'Wie immer.', 'smile'],
    ],
    win: [
      { bg: 'olymp' },
      ['pythia', 'Sieger des Großen Agon: »Toma Heroes«. Die Prophezeiung ist erfüllt. Ich drucke Ihnen eine Bestätigung aus.'],
      ['zeus', 'Ein Tastendrücker. … Das Gesetz gilt. Das Tor ist offen. Geht heim, ihr drei.', 'sad'],
      ['n', 'Das Tor aus Licht schwingt auf. Dahinter: Serverschränke. Neonröhren. Der Geruch von kaltem Kaffee.', 'flash'],
      ['robin', 'Das ist unser Keller! Toma, das ist UNSER Keller! Wir sind –', 'smile'],
      ['n', 'Ein Brett schießt von hinten zwischen ihnen hindurch. Eine Hand greift nach unten – und reißt den Kern aus Tomas Brett.', 'quake'],
      ['kairon', 'LEHRLING –', 'shock'],
      ['martin', 'Es tut mir leid, Lioumba. Das war das Angebot: Bring K. sein Korn, und er setzt die Zeit zurück. Bis vor Athen. Bis vor die Schere. Theron war in MEINEM Team.', 'sad'],
      ['toma', 'Martin! Er setzt nicht bis Athen zurück. Er setzt ALLES zurück!', 'angry'],
      ['martin', 'Dann hat es Theron nie gegeben. Dann hat ihn wenigstens auch nie jemand geschnitten.', 'sad'],
      ['n', 'Der Boden reißt. Swagger stürzt sich mit dem Korn in den Riss – hinab in den Tartaros.', 'quake'],
      ['xanthe', 'MARTIN! Du Idiot! Du eitler, dummer, treuer IDIOT!', 'angry'],
      ['jario', 'Er hat es angefasst. Schon wieder.', 'stern'],
      ['zeus', 'Es ist geschehen. Geht durch das Tor, Fremde. Rettet wenigstens euch. In einer Stunde gibt es dieses Hellas nicht mehr – und niemanden, der sich daran erinnert.', 'sad'],
      ['robin', 'Toma. Das Tor ist offen. Es ist Freitagnacht. Keiner würde es uns übel nehmen.', 'sad'],
      ['toma', 'Das Ticket von K. ist nicht gelöst. Und es ist MIR zugewiesen.', 'stern'],
      ['jario', 'Er sagt es wirklich.', 'smile'],
      ['toma', 'Was mir zugewiesen ist, bringe ich zu Ende. Wir fahren runter.', 'stern'],
      ['kassia', 'Dann fahrt nicht allein. Ich halte euch den Riss offen – und wenn die Tafel etwas dagegen hat, soll sie es mit mir ausmachen.', 'stern'],
      ['phaidon', 'Und ich halte der Ritterin den Helm!', 'smile'],
    ],
  },
  /* ---------- 7 ---------- */
  {
    title: 'Feierabend', track: 'tartaros', laps: 2, skill: 0.98, finale: true, boss: true,
    goal: { boss: true }, goalText: 'Zerbrich Kronos\' Zeitschild, bevor der Sand durchläuft',
    roster: ['kronos'],
    intro: [
      { bg: 'tartaros' },
      ['n', 'Der Tartaros. Alle Strecken des Agon stürzen ineinander. In der Mitte steht ein Stundenglas, hoch wie ein Berg. Davor sitzt ein Mann an einem Klapptisch. Auf dem Tisch liegt ein Telefon, das seit zwölftausend Jahren nicht geklingelt hat.', 'quake'],
      ['t', 'KRONOS', 'Der Erste Fremde · König a. D. · Hat seit 12.000 Jahren Bereitschaft'],
      ['kronos', 'Endlich. Zwölftausend Jahre Bearbeitungszeit. Ihr Entwickler werdet auch nicht schneller.'],
      ['kronos', 'Ich hatte Bereitschaft. Eine einzige Nacht. Jemand sagte: »Kannst du mal kurz nach dem alten Server sehen?« Ich habe nachgesehen. Seitdem sehe ich nach. Ich will nur Feierabend, Kollege. Ist das zu viel verlangt?'],
      ['toma', 'Für deinen Feierabend verschwindet jeder, der hier je gelebt hat.', 'stern'],
      ['kronos', s => (s.deaths === 0
        ? 'Sie verschwinden nicht. Sie waren dann nur nie da. Ein sauberer Neuanfang. Du bist in diesem Agon nicht ein Mal gefallen – du hast mein Korn nie gebraucht. Ich brauche es. Seit zwölftausend Jahren.'
        : 'Sie verschwinden nicht. Sie waren dann nur nie da. Ein sauberer Neuanfang. Und tu nicht so fremd: ' + fmtDeaths(s.deaths) + ' bist du gefallen, und jedes Mal hat mein Korn dich zurückgesetzt. Du hast denselben Trost genommen wie ich.')],
      ['martin', 'Lioumba … Er hat mich ausgelacht. Er setzt nicht bis Athen zurück. Ich habe Theron zum zweiten Mal umgebracht.', 'sad'],
      ['xanthe', 'Heul später, Kapitän! Der Riss lässt uns nicht zu dir durch. Aber unsere Aether-Reserven gehen durch. Lioumba – alles auf dein Brett.', 'stern'],
      ['jario', 'Sein Zeitschild hängt am Glas. Robin und ich bringen ihn abwechselnd zum Flackern – dann bist du dran, Toma. Mit vollem Boost mitten hinein.', 'stern'],
      ['robin', 'Und weich den Echos aus. Oder fahr mit Boost durch sie durch. Das bist nicht du – das sind nur die Stürze, die er dir andichten will.', 'stern'],
      ['pythia', 'Lauf … Fehler. Für diesen Lauf existiert keine Prophezeiung. Ich drücke Ihnen die Daumen. Ich habe keine. Es ist symbolisch gemeint.'],
      ['toma', 'Ticket von K. Ich übernehme.', 'stern'],
      ['robin', 'Toma Heroes?', 'smile'],
      ['jario', 'Toma Heroes.', 'smile'],
      ['toma', 'Einer für alle.', 'smile'],
    ],
    win: [
      { bg: 'tartaros' },
      ['n', 'Der letzte Treffer. Der Zeitschild zerspringt. Das Stundenglas bekommt einen Riss – und zum ersten Mal seit zwölftausend Jahren fällt darin ein Korn nach unten.', 'flash'],
      ['kronos', '… Zwei, die meinen Schild aufbrechen. Ein Kollege, der sich an euch knotet. Ich war in jener Nacht allein. Man hat mir gesagt, für Bereitschaft reicht einer.', 'sad'],
      ['toma', 'Reicht nie.'],
      ['n', 'Toma hebt das Korn aus den Scherben. Dann setzt er sich an den Klapptisch und schlägt die Liste auf, die dort seit zwölftausend Jahren liegt.'],
      ['toma', 'Ticket von K.: »Zeit läuft falsch. Bitte zurücksetzen.« Ich habe es geprüft. Die Zeit läuft richtig. Abgelehnt.', 'stern'],
      ['kronos', 'ABGELEHNT? Nach zwölftausend Jahren?!', 'shock'],
      ['toma', 'Der Fehler liegt woanders. Du stehst seit zwölftausend Tagen auf der Bereitschaftsliste, und niemand hat dich je abgelöst. Das behebe ich jetzt. Übergabe: Ich übernehme.', 'stern'],
      { bg: 'cg_reveal' },
      ['n', 'Aus dem Korn steigt der alte Schmied. Er löst die Binde, die er sich umgelegt hat, als er nicht mehr mit ansehen konnte, was aus seinem Freund wurde.', 'flash'],
      { bg: 'tartaros' },
      ['kaironR', 'Nimm an, du sturer Esel. Das Tor ist für dich nie aufgegangen, weil du es als König versucht hast. Als einer, der einfach Feierabend macht, hättest du durchgehen können.', 'smile'],
      ['kronos', 'Kairon. Du hast dich zwölftausend Jahre vor mir versteckt.', 'sad'],
      ['kaironR', 'Ich habe zwölftausend Jahre auf einen gewartet, der dich ablöst, statt für dich die Welt abzureißen. Hat gedauert. Tastendrücker.'],
      ['kronos', 'Da draußen wartet niemand mehr auf mich. Der Kaffee ist kalt.', 'sad'],
      ['toma', 'Dann geh trotzdem heim. In dem Korn ist noch eine Stunde. Deine eigene. Feierabend, Kollege.', 'smile'],
      { bg: 'cg_sand' },
      ['n', 'Kronos streicht seinen Namen aus der Liste. Die Schrift ist die eines jungen Mannes. Dann nimmt er das Korn, klemmt sich das Telefon unter den Arm – und zerfällt, den alten Schmied neben sich, zu Sand, der nach oben rieselt.'],
      { bg: 'olymp' },
      ['zeus', 'Das Tor ist noch offen, Sieger. Und nach dem Gesetz steht dir die Krone zu. So ist es auch dem Ersten ergangen.'],
      ['toma', 'Ich habe Montag um neun eine Besprechung. Die Krone gebe ich als Fundsache ab.', 'stern'],
      ['kassia', 'Ich verwahre sie, bis sich der Eigentümer meldet. Das kann dauern.', 'smile'],
      ['zeus', 'Dann nenne deinen Preis. Einen. Der Sieger hat einen Wunsch.'],
      ['martin', 'Lioumba. Ich habe kein Recht, dich um irgendetwas –', 'sad'],
      ['toma', 'Theron. Knotet seinen Faden wieder an. Und die Sechs vom Ufer kommen mit durch das Tor. Das ist EIN Wunsch. Es ist ein Sammelticket.', 'stern'],
      { bg: 'cg_knot' },
      ['moiren', '… Sammelticket. Knoten.', 'flash'],
      { bg: 'olymp' },
      ['theron', 'Kapitän. Du siehst furchtbar aus. Kommt jetzt der Bonus?', 'smile'],
      ['martin', 'Halt den Mund. Halt einfach den Mund, du Ochse.', 'sad'],
      ['xanthe', 'Er weint. Notiert.', 'smile'],
      ['martin', 'Lioumba. Ich schulde dir ein Brett, einen Freund und eine Welt. Ich zahle in Raten. Und ich fasse nie wieder etwas an.', 'sad'],
      ['jario', 'Das glaubt dir keiner.', 'smile'],
      ['toma', 'Fang klein an, Martin. Mein Code liegt seit einer Woche bei dir zur Durchsicht.', 'smile'],
      { bg: 'neosky' },
      ['n', 'Neo-Skyline, 23:43 Uhr. Zwei Minuten sind vergangen. Zehn Leute stehen vor einem Büroturm im Regen und wissen nicht, wohin mit ihren Händen. Tomas Telefon zeigt siebzehn verpasste Anrufe. Der achtzehnte kommt gerade.'],
      ['mila', 'TOMA! Du hast gesagt, du bist um sieben da! Es ist fast Mitternacht! Das Essen ist KALT!', 'angry'],
      ['toma', '… Ich weiß. Ich mache es warm. Und ich bringe neun Leute mit.', 'smile'],
      ['robin', 'Zehn. Ich zähle doppelt.', 'smile'],
      ['jario', 'Jario zahlt nicht.'],
      { bg: 'cg_hourglass' },
      ['n', 'In Hellas steht seither eine Krone im Fundbüro. In einer erloschenen Schmiede in Piräus liegt eine alte Augenbinde neben einer Sanduhr, in der kein Korn mehr ist.'],
      ['n', 'Und auf einer Bereitschaftsliste in einem Keller in Neo-Skyline steht ein neuer Name: T. Lioumba. Darunter, in krakeliger Schrift: »Danke. K.«'],
    ],
  },
];

const DEATH_QUOTES = [
  '»Aufstehen, Lehrling.« – Im Kern des Bretts dreht sich ein einzelnes Sandkorn.',
  '»Das habe ich nicht gesehen. Ich trage eine Binde.« – Das Korn setzt die Zeit zurück.',
  '»Zu früh gebremst. Tastendrücker.« – Im Brett läuft der Sand rückwärts.',
  '»Noch einmal. Und diesmal mit Haltung.« – Das Korn dreht sich.',
];
const DEATH_QUOTE_FINAL = '»Noch einmal von vorn? Darin bin ich Meister.« – Kronos dreht sein Glas um.';

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
      $('vnBig').classList.toggle('long', L[1].length > 8);
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
      ? 'Weich Zeitrissen und Echos aus – jeder Treffer franst den Schwurbund aus. Sobald Robin oder Jario den Zeitschild zum Flackern bringen: mit Boost in Kronos hinein.'
      : 'Scheiterst du, durchtrennen die Moiren euren Schwurbund – deinen Faden, Robins und Jarios. Tipp: In ihrem Windschatten bist du schneller.';
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
      : 'Platz ' + pos + ' – Ziel verfehlt (' + ch.goalText + '). Die Moiren haben euren Schwurbund durchtrennt – alle drei Fäden.';
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
    /* Einstieg in ein frei gewähltes Kapitel (Kapitelwahl im Menü). Der Spielstand springt mit, damit
       »Story fortsetzen« von dort weiterführt; nach einer abgeschlossenen Story beginnt die Zählung neu. */
    beginAt(i) {
      save = { ch: clamp(i | 0, 0, CHAPTERS.length - 1), deaths: save.ch >= CHAPTERS.length ? 0 : save.deaths, done: save.done };
      persist();
      enter(save.ch);
    },
    chapters: () => CHAPTERS.map(c => ({ title: c.title, track: c.track, laps: c.laps, boss: !!c.boss, finale: !!c.finale, goalText: c.goalText })),
    status() {
      const i = Math.min(save.ch, CHAPTERS.length - 1);
      return { ch: save.ch, total: CHAPTERS.length, title: CHAPTERS[i].title, done: save.done, deaths: save.deaths, finished: save.ch >= CHAPTERS.length };
    },
    isFinale: () => !!CHAPTERS[cur].finale,
  };
})();
