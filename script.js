const COLORS = ["#f4c66a","#75d6d0","#ff8d7d","#a99af5","#f28fc2","#9bd17c","#f3a65f","#80b9ed"];
const ICONS = ["●","◆","▲","★","✚","⬟","✦","■"];
const QUIZ = [
 {q:"Siapa presiden Indonesia yang memimpin pada masa Orde Baru?",a:["Soekarno","Soeharto","B. J. Habibie","Abdurrahman Wahid"],c:1,why:"Soeharto memimpin Indonesia pada masa Orde Baru."},
 {q:"Apa nama program pembangunan lima tahun pada masa Orde Baru?",a:["Repelita","Reformasi","Dwifungsi","Trikora"],c:0,why:"Repelita adalah Rencana Pembangunan Lima Tahun."},
 {q:"Organisasi politik yang menjadi salah satu peserta pemilu pada masa Orde Baru adalah ...",a:["Golkar","VOC","BPUPKI","PPKI"],c:0,why:"Golkar menjadi kekuatan politik dominan pada masa Orde Baru."},
 {q:"Peristiwa yang menandai berakhirnya masa Orde Baru terjadi pada tahun ...",a:["1965","1971","1998","2004"],c:2,why:"Soeharto mengundurkan diri pada 21 Mei 1998."},
 {q:"Apa istilah penyederhanaan partai politik pada tahun 1973?",a:["Fusi partai","Revolusi hijau","Otonomi daerah","Nasakom"],c:0,why:"Pada 1973 partai-partai disederhanakan melalui penggabungan atau fusi."},
 {q:"Kebijakan yang dikenal dengan istilah Revolusi Hijau berhubungan dengan bidang ...",a:["Pendidikan","Pertanian","Transportasi","Pertahanan"],c:1,why:"Revolusi Hijau mendorong peningkatan produksi pertanian."},
 {q:"Krisis yang ikut mendorong berakhirnya Orde Baru pada 1997–1998 adalah ...",a:["Krisis moneter","Krisis minyak 1973","Krisis pangan 1960","Krisis internet"],c:0,why:"Krisis moneter Asia berdampak besar terhadap ekonomi Indonesia."},
 {q:"Salah satu tuntutan Reformasi 1998 adalah ...",a:["Menghapus pemilu","Pemberantasan KKN","Mengembalikan kolonialisme","Membubarkan sekolah"],c:1,why:"Pemberantasan korupsi, kolusi, dan nepotisme menjadi tuntutan penting Reformasi."},
 {q:"Pemilu pertama pada masa Orde Baru diselenggarakan pada tahun ...",a:["1969","1971","1977","1982"],c:1,why:"Pemilu pertama masa Orde Baru dilaksanakan pada 1971."},
 {q:"Kepanjangan KKN dalam tuntutan Reformasi adalah ...",a:["Kerja, Karya, Nasional","Korupsi, Kolusi, Nepotisme","Komando, Keamanan, Negara","Keadilan, Kesejahteraan, Nasional"],c:1,why:"KKN adalah Korupsi, Kolusi, dan Nepotisme."}
];
// Petak spesial: jalur lompatan dan kemunduran. Petak kuis tersebar di papan.
const JUMPS = {4:14,9:31,20:38,28:46,40:59,51:67,63:81,71:91,17:7,54:34,62:19,87:24,95:75,99:78};
const QUIZ_CELLS = new Set([6,13,22,29,36,44,49,57,65,73,80,89,96]);
const CHALLENGES = {16:"Arsip dibuka: maju 2 petak.",33:"Jeda refleksi: mundur 2 petak.",47:"Temukan fakta baru: maju 3 petak.",76:"Jalan terhambat: mundur 3 petak.",84:"Dokumen penting ditemukan: maju 2 petak."};
const board = document.getElementById("board");
const setupScreen = document.getElementById("setupScreen"), gameScreen = document.getElementById("gameScreen");
const playerInputs = document.getElementById("playerInputs");
let players=[], current=0, busy=false, quizPending=false, quizIndex=0, turnHadExtra=false;
const $ = id => document.getElementById(id);

function makeInputs(){
 playerInputs.innerHTML="";
 const count=playerInputs.dataset.count ? Number(playerInputs.dataset.count) : 2;
 for(let i=0;i<count;i++){
  const row=document.createElement("div"); row.className="player-input";
  row.innerHTML=`<span class="player-color" style="background:${COLORS[i]}"></span><input maxlength="16" aria-label="Nama pemain ${i+1}" placeholder="Nama pemain ${i+1}" value="${playerInputs.dataset.names?.split("|")[i] || (i===0?"Pemain 1":i===1?"Pemain 2":"Pemain "+(i+1))}"><button class="remove-player" type="button" aria-label="Hapus pemain">×</button>`;
  row.querySelector("button").onclick=()=>{if(playerInputs.children.length>2){saveInputNames();playerInputs.dataset.count=playerInputs.children.length-1;makeInputs();}};
  playerInputs.appendChild(row);
 }
 updateCount();
}
function saveInputNames(){playerInputs.dataset.names=[...playerInputs.querySelectorAll("input")].map(x=>x.value).join("|");}
function updateCount(){$("playerCount").textContent=`${playerInputs.children.length} / 8 pemain`;$("addPlayer").disabled=playerInputs.children.length>=8;$("addPlayer").style.opacity=playerInputs.children.length>=8?".4":"1";}
playerInputs.dataset.count=2; makeInputs();
$("addPlayer").onclick=()=>{if(playerInputs.children.length<8){saveInputNames();playerInputs.dataset.count=playerInputs.children.length+1;makeInputs();}};
$("startGame").onclick=()=>{
 const names=[...playerInputs.querySelectorAll("input")].map((x,i)=>x.value.trim()||`Pemain ${i+1}`);
 players=names.map((name,i)=>({name,color:COLORS[i],icon:ICONS[i],pos:1}));
 current=0;busy=false;setupScreen.classList.add("hidden");gameScreen.classList.remove("hidden");$("eventLog").innerHTML="";log("Permainan dimulai. Semoga beruntung!");render();
};
$("newGame").onclick=()=>{gameScreen.classList.add("hidden");setupScreen.classList.remove("hidden");$("questionModal").classList.add("hidden");$("winnerModal").classList.add("hidden");};
$("playAgain").onclick=()=>{$("winnerModal").classList.add("hidden");$("newGame").click();};

function buildBoard(){
 board.innerHTML="";
 for(let row=9;row>=0;row--){
  const nums=Array.from({length:10},(_,i)=>row*10+i+1);
  if(row%2===1)nums.reverse();
  nums.forEach(n=>{
   const cell=document.createElement("div");cell.className="cell";cell.id=`cell-${n}`;
   if(JUMPS[n])cell.classList.add(JUMPS[n]>n?"special-up":"special-down");
   if(QUIZ_CELLS.has(n))cell.classList.add("quiz-cell");
   const label=JUMPS[n]? (JUMPS[n]>n?"LOMPAT":"MUNDUR") : QUIZ_CELLS.has(n)?"MISI KUIS":CHALLENGES[n]?"EVENT":n===1?"MULAI":n===100?"FINISH":"";
   const symbol=JUMPS[n]?(JUMPS[n]>n?"↗":"↘"):QUIZ_CELLS.has(n)?"✦":CHALLENGES[n]?"!":"";
   cell.innerHTML=`<span class="cell-num">${String(n).padStart(2,"0")}</span><span class="cell-label">${label}</span><span class="cell-symbol">${symbol}</span><div class="tokens" id="tokens-${n}"></div>`;
   board.appendChild(cell);
  });
 }
}
function render(){
 buildBoard();
 players.forEach(p=>{const spot=$(`tokens-${p.pos}`);if(spot){const t=document.createElement("span");t.className="token";t.style.background=p.color;t.textContent=p.icon;spot.appendChild(t);}});
 $("currentPlayer").innerHTML=`<span class="player-color" style="background:${players[current].color}"></span>${escapeHtml(players[current].name)}`;
 $("rollDice").disabled=busy;$("rollDice").style.opacity=busy?".55":"1";
 $("scoreboard").innerHTML=players.map((p,i)=>`<div class="score-row"><span class="player-color" style="background:${p.color}"></span><span class="score-name">${escapeHtml(p.name)} ${i===current?"•":""}</span><span class="score-pos">${p.pos}/100</span></div>`).join("");
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function log(msg){const el=document.createElement("div");el.className="log-item";el.textContent=msg;$("eventLog").prepend(el);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
$("rollDice").onclick=async()=>{
 if(busy||!players.length)return;busy=true;render();
 const die=$("dice");die.classList.add("rolling");
 let roll=1;for(let i=0;i<10;i++){roll=1+Math.floor(Math.random()*6);die.textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][roll-1];await sleep(55);}
 die.classList.remove("rolling");
 const p=players[current], start=p.pos, next=Math.min(100,start+roll);
 $("turnMessage").textContent=`${p.name} mendapatkan angka ${roll}.`;
 log(`${p.name} melempar ${roll} dan bergerak dari ${start} ke ${next}.`);
 p.pos=next;render();await sleep(450);
 if(p.pos===100){finish(p);return;}
 if(JUMPS[p.pos]){const from=p.pos,to=JUMPS[from];$("turnMessage").textContent=to>from?"Jalur lompatan ditemukan!":"Ada tantangan di depan!";log(`${p.name} ${to>from?"melompat":"mundur"} dari petak ${from} ke ${to}.`);p.pos=to;render();await sleep(500);}
 if(CHALLENGES[p.pos]){log(`${p.name}: ${CHALLENGES[p.pos]}`);$("turnMessage").textContent=CHALLENGES[p.pos];const m=CHALLENGES[p.pos].match(/(maju|mundur) (\d+)/i);if(m){p.pos=Math.max(1,Math.min(99,p.pos+(m[1].toLowerCase()==="maju"?1:-1)*Number(m[2])));render();}}
 if(QUIZ_CELLS.has(p.pos)){busy=false;showQuiz();return;}
 endTurn();
};
function endTurn(){busy=false;current=(current+1)%players.length;$("turnMessage").textContent=`Sekarang giliran ${players[current].name}.`;render();}
function showQuiz(){
 busy=true;quizPending=true;const q=QUIZ[quizIndex++%QUIZ.length];
 $("questionText").textContent=q.q;$("answerFeedback").textContent="";$("continueTurn").classList.add("hidden");
 const opts=$("answerOptions");opts.innerHTML="";
 q.a.forEach((a,i)=>{const b=document.createElement("button");b.className="answer-option";b.textContent=String.fromCharCode(65+i)+". "+a;b.onclick=()=>{
  [...opts.children].forEach((x,j)=>{x.disabled=true;if(j===q.c)x.classList.add("correct");else if(j===i)x.classList.add("wrong");});
  const correct=i===q.c;$("answerFeedback").textContent=correct?"Tepat! "+q.why:"Belum tepat. "+q.why;
  if(!correct){players[current].pos=Math.max(1,players[current].pos-2);log(`${players[current].name} belum tepat menjawab; mundur 2 petak.`);render();}
  else log(`${players[current].name} menjawab kuis dengan benar.`);
  $("continueTurn").classList.remove("hidden");
 };opts.appendChild(b);});
 $("questionModal").classList.remove("hidden");
}
$("continueTurn").onclick=()=>{$("questionModal").classList.add("hidden");quizPending=false;if(players[current].pos>=100)finish(players[current]);else endTurn();};
function finish(p){busy=true;render();$("winnerTitle").textContent=`${p.name} menang!`;$("winnerText").textContent="Kamu berhasil mencapai petak ke-100 dan menyelesaikan perjalanan sejarah. Terima kasih sudah bermain!";$("winnerModal").classList.remove("hidden");log(`${p.name} menjadi pemenang!`);}
buildBoard();
