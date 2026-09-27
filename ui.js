(() => {
const $ = id => document.getElementById(id);
let lang = localStorage.getItem('qos-lang') || 'en';
const T = {
  en: {
    tag:'Password, maze, and four toys.',
    homeTitle:'Six things you can tap.',
    homeP:'Pick a card.',
    tour:'Tour',
    pinTitle:'Toy lock. Not a real password.',
    mazeTitle:'Find the way out.',
    mazeHint:'Blue start. Red end. Green path.',
    slitTitle:'Fire dots at holes.',
    atomTitle:'Give energy. Watch the jump.',
    cloudTitle:'Scan. Dots make a cloud.',
    bounceTitle:'Some bounce. Some sneak.',
    model:'Toy model',
    next:'Next',
    skip:'Skip'
  },
  hi: {
    tag:'ताला, भाला-भूलऽ, और चार खेल.',
    homeTitle:'छह चीज़ें दबाएं.',
    homeP:'एक कार्ड चुनें.',
    tour:'गाइड',
    pinTitle:'खिलौना ताला. असली पासवर्ड नहीं.',
    mazeTitle:'रास्ता ढूंढो.',
    mazeHint:'नीला शुरू. लाल अंत. हरा रास्ता.',
    slitTitle:'छेदों पर बिंदु चलाओ.',
    atomTitle:'ऊर्जा दो. छलांग देखो.',
    cloudTitle:'स्कैन. बिंदु बादल बनते हैं.',
    bounceTitle:'कुछ टकराते हैं. कुछ निकल जाते हैं.',
    model:'सरल मॉडल',
    next:'आगे',
    skip:'छोड़ो'
  }
};
function applyLang(){
  const t=T[lang]||T.en;
  document.documentElement.lang = lang;
  const set=(id,v)=>{ const el=$(id); if(el) el.textContent=v; };
  set('uiTag', t.tag);
  set('homeTitle', t.homeTitle);
  set('homeP', t.homeP);
  set('pinTitle', t.pinTitle);
  set('mazeTitle', t.mazeTitle);
  set('mazeHint', t.mazeHint);
  set('slitTitle', t.slitTitle);
  set('atomTitle', t.atomTitle);
  set('cloudTitle', t.cloudTitle);
  set('bounceTitle', t.bounceTitle);
  document.querySelectorAll('[data-model]').forEach(el=>el.textContent=t.model);
  const tb=$('tourBtn'); if(tb) tb.textContent='? '+t.tour;
  const nx=$('tourNext'); if(nx) nx.textContent=t.next;
  const sk=$('tourSkip'); if(sk) sk.textContent=t.skip;
  const sel=$('langSel'); if(sel) sel.value=lang;
}
const tour = [
  {hash:'#/overview', text:{en:'Home. Pick a room or press Next.', hi:'घर. कोई कमरा चुनें.'}},
  {hash:'#/grover', text:{en:'Password room. Read the grey box: this laptop fakes Grover. k = π√N/4 queries.', hi:'ताला. पेटी बॉक्स पढ़ो: यह लैपटॉप ही गणन करता है.'}},
  {hash:'#/maze', text:{en:'Maze. Wave search moves a number on every open square. Green path is a normal readout.', hi:'भाला-भूलऽ. लहर खुली जगह पर चलती है. हरा रास्ता बाद में खींचती है.'}},
  {hash:'#/slit', text:{en:'Two holes. Toy stripes. Fire 200.', hi:'दो छेद. 200 बार चलाओ.'}},
  {hash:'#/atom', text:{en:'Add energy. Release. Toy steps, not a lab atom.', hi:'ऊर्जा दो. छोड़ो.'}},
  {hash:'#/cloud', text:{en:'Scan 80 times. Cloud of looks.', hi:'80 बार स्कैन.'}},
  {hash:'#/bounce', text:{en:'Change the wall. Launch. Toy leak formula.', hi:'दीवार बदलो. चलाओ.'}}
];
let tourI=-1;
function showTour(i){
  tourI=i;
  const box=$('tourBox');
  if(i<0||i>=tour.length){ box.classList.remove('on'); return; }
  box.classList.add('on');
  location.hash = tour[i].hash;
  $('tourText').textContent = tour[i].text[lang] || tour[i].text.en;
  $('tourStep').textContent = (i+1)+' / '+tour.length;
}
window.applyLang = applyLang;
$('langSel').onchange = ()=>{ lang=$('langSel').value; localStorage.setItem('qos-lang', lang); applyLang(); };
$('tourBtn').onclick = ()=>showTour(0);
$('tourNext').onclick = ()=>showTour(tourI+1);
$('tourSkip').onclick = ()=>showTour(-1);
applyLang();
})();
