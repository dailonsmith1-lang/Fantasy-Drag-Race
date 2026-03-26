import { useState, useEffect, useRef, useCallback } from "react";
import { persistRoom, fetchRoom, subscribeRoom } from "./firebase";
function genCode() { return Math.random().toString(36).substring(2, 7).toUpperCase(); }
function genPin() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function saveMyId(roomCode, id) { try { localStorage.setItem("fdr_" + roomCode, id); } catch {} }
function loadMyId(roomCode) { try { return localStorage.getItem("fdr_" + roomCode); } catch { return null; } }

// ─── Season 18 Queens ─────────────────────────────────────────────────────────
const S18 = [
  { name:"Athena Dion",         hometown:"Miami, FL",          bio:"Named after the Greek goddess, Athena brings legendary energy wherever she goes. Prolific drag mother with a dynasty spanning Miami and Mykonos — drag mother of Morphine Love Dion. Makes herstory this season competing alongside drag granddaughter Juicy Love Dion." },
  { name:"Briar Blush",         hometown:"Boston, MA",         bio:"Boston's pin-up princess: retro yet edgy, goth yet glamorous, sweet but with a sting. Named after the thorns on a rose, Briar's sharp wit and prickly personality prove she's not here to be liked — she's here to be remembered." },
  { name:"Ciara Myst",          hometown:"Indianapolis, IN",   bio:"A drag shapeshifter, prosthetics pro, and theatrical stagecraft performer. Political advocate who worked with Michelle Obama's When We All Vote campaign and is an ambassador for Drag Out the Vote." },
  { name:"Darlene Mitchell",    hometown:"Greentown, IN",      bio:"A country, camp queen blending soap opera glamour with Midwestern trailer trash panache. Known for her signature Peg Bundy-style hair. After 10 years in drag and a 5-year hiatus, she's back to see if RuPaul can coax her out of her bedroom." },
  { name:"DD Fuego",            hometown:"New York, NY",       bio:"Fiery and feisty, DD Fuego is a full-on production. Born in Monterrey, Mexico — a former production designer for TV and off-Broadway theater. High heat and maximum impact, DD Fuego leaves nothing on the stage but smoke." },
  { name:"Discord Addams",      hometown:"St. Petersburg, FL", bio:"A high-fashion punk rock maximalist serving looks packed with safety pins, studs, and unapologetic attitude. Known for playing guitar in a punk rock band — her goal is to trade the mosh pit for the runway." },
  { name:"Jane Don't",          hometown:"Seattle, WA",        bio:"Inspired by old-school funny ladies like Bette Midler and Joan Rivers — sharp jokes and even sharper shoulder pads. Drag sister of Bosco and Irene the Alien, Jane walks in ready to make her own mark." },
  { name:"Juicy Love Dion",     hometown:"Miami, FL",          bio:"Small in size, colossal in talent. Self-described Miami's Afro-Cuban dancing doll. Drag daughter of Morphine Love Dion and drag granddaughter of fellow competitor Athena Dion." },
  { name:"Kenya Pleaser",       hometown:"Columbia, SC",       bio:"Making niche Drag Race herstory as the first queen to compete from South Carolina. A fierce competitor ready to put her home state on the map." },
  { name:"Mandy Mango",         hometown:"Philadelphia, PA",   bio:"A larger-than-life queen bringing bold energy, sharp comedy, and irresistible charisma to the main stage. Mandy is here to prove she's the juiciest thing to ever hit the Werk Room." },
  { name:"Mia Starr",           hometown:"West Palm Beach, FL", bio:"A 1990s/early 2000s hip-hop dancing diva with world tour credits for Rihanna and Britney Spears, and a Super Bowl performance with JLo. She started drag 17 years ago, took a 14-year break to chase her dance career, and now she's back." },
  { name:"Myki Meeks",          hometown:"Orlando, FL",        bio:"Drag niece of Ginger Minj and Roxxxy Andrews. Gorgeously stupid and stupidly gorgeous — a comedy queen, thesp, and co-host of The Gig. Crowned Miss Glamorous Newcomer 2024/25 and opened for Chappell Roan." },
  { name:"Nini Coco",           hometown:"Denver, CO",         bio:"An anagram for Icon Icon — a Denver-based costume designer and 2023 Denver Drag Olympics champion. Here to serve looks she literally designed herself." },
  { name:"Vita VonTesse Starr", hometown:"Montgomery, AL",     bio:"Calling herself Queen V, Vita is a pageant powerhouse from the famed Starr drag family. A multi-titleholder who handcrafts show-stopping looks that match her stage presence. Elegance, precision, and flair for the dramatic." },
];
const ALL_QUEENS = S18.map(q => q.name);

// ─── Colors (poster palette) ──────────────────────────────────────────────────
const C = {
  bgDeep:"#1a0008", bgMid:"#3d0015", bgLight:"#6b0022",
  red:"#c0001a", crimson:"#8b0000",
  gold:"#f5c842", goldDark:"#c9960a",
  roseGold:"#d4855a", roseLight:"#f0a878",
  pink:"#e8407a", pinkLight:"#ff85b0",
  white:"#ffffff", offWhite:"#ffeedd",
  textMid:"#d4a0a0", textDim:"#8a5050",
  cardBorder:"#6b1530",
};

// ─── Spin Wheel ───────────────────────────────────────────────────────────────
function SpinWheel({ players, onResult }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const angleRef = useRef(0);
  const COLORS = ["#8b0000","#c0001a","#e8407a","#b5003a","#d4855a","#6b0022","#f0607a","#a01040","#e85080","#c04020","#7b0030","#f5a060","#9b1030","#d06040"];
  const n = players.length;

  const draw = useCallback((rot) => {
    const canvas = canvasRef.current;
    if (!canvas || n === 0) return;
    const ctx = canvas.getContext("2d"), cx = 150, cy = 150, r = 138;
    ctx.clearRect(0, 0, 300, 300);
    const arc = (2 * Math.PI) / n;
    players.forEach((p, i) => {
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, rot + i * arc, rot + (i + 1) * arc);
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = "#1a0008"; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot + i * arc + arc / 2);
      ctx.textAlign = "right"; ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(p.name.length > 13 ? p.name.slice(0, 13) + "…" : p.name, r - 8, 4);
      ctx.restore();
    });
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    cg.addColorStop(0, "#f5c842"); cg.addColorStop(1, "#8b5a00");
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = "#f5c842"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r - 4, cy - 11); ctx.lineTo(cx + r + 14, cy); ctx.lineTo(cx + r - 4, cy + 11);
    ctx.fillStyle = "#f5c842"; ctx.fill();
  }, [players, n]);

  useEffect(() => { draw(angleRef.current); }, [draw]);

  function spin() {
    if (spinning || n === 0) return;
    setSpinning(true);
    const total = (Math.random() * 6 + 8) * Math.PI * 2, dur = 4000, t0 = performance.now(), a0 = angleRef.current;
    function step(now) {
      const t = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - t, 4), cur = a0 + total * ease;
      angleRef.current = cur; draw(cur);
      if (t < 1) { requestAnimationFrame(step); return; }
      setSpinning(false);
      const arc = (2 * Math.PI) / n, norm = ((-cur % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      onResult(players[Math.floor(norm / arc) % n]);
    }
    requestAnimationFrame(step);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <canvas ref={canvasRef} width={300} height={300}
        style={{ borderRadius:"50%", boxShadow:"0 0 50px #e8407a44, 0 0 100px #c0001a22", display:"block" }} />
      <button onClick={spin} disabled={spinning || n === 0} style={S.goldBtn}>
        {spinning ? "SPINNING…" : "✨ SPIN THE WHEEL"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT — single return, screen controlled by state
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState("home"); // home | join | rejoin | pinSaved | room
  const [myPin, setMyPin]         = useState("");
  const [rejoinPin, setRejoinPin] = useState("");
  const [rejoinCode, setRejoinCode] = useState("");
  const [emergencyPid, setEmergencyPid] = useState(null);
  const [playerName, setName]     = useState("");
  const [joinCode, setJoinCode]   = useState("");
  const [msg, setMsg]             = useState("");
  const [room, setRoom]           = useState(null);
  const [myId, setMyId]           = useState(null);
  const [roomCode, setRoomCode]   = useState("");
  const [tab, setTab]             = useState("scoreboard");
  const syncRef = useRef(null);

  // persist on every room change
  useEffect(() => { if (room && roomCode) persistRoom(roomCode, room); }, [room, roomCode]);

  // real-time sync via Firebase
  useEffect(() => {
    if (screen !== "room" || !roomCode) return;
    const unsub = subscribeRoom(roomCode, (remote) => {
      if (remote && remote.ts > (room?.ts ?? 0)) setRoom(remote);
    });
    return () => unsub();
  }, [screen, roomCode]);

  function upd(fn) {
    setRoom(prev => ({ ...fn(prev), ts: Date.now() }));
  }

  const isHost = !!(room && myId && room.hostId === myId);
  const me = room?.players?.find(p => p.id === myId);
  const sorted = room ? [...room.players].sort((a, b) => b.points - a.points) : [];

  function doCreateRoom() {
    if (!playerName.trim()) { setMsg("Enter your name!"); return; }
    const code = genCode(), id = genCode(), pin = genPin();
    const r = {
      code, hostId: id, queens: ALL_QUEENS,
      players: [{ id, name: playerName.trim(), queen: null, points: 0, paid: true, eliminated: false, pin }],
      draftOrder: [], draftDone: false, episodes: [], polls: [],
      ts: Date.now()
    };
    setRoom(r); setMyId(id); setRoomCode(code); setMyPin(pin); setMsg("");
    saveMyId(code, id);
    setTab("draft"); setScreen("pinSaved");
  }

  async function doJoinRoom() {
    if (!playerName.trim()) { setMsg("Enter your name!"); return; }
    if (!joinCode.trim())   { setMsg("Enter a room code!"); return; }
    setMsg("Looking up room…");
    const code = joinCode.toUpperCase().trim();
    const remote = await fetchRoom(code);
    if (!remote) { setMsg("Room not found! Double-check the code."); return; }
    // Check if they already have a saved ID for this room (localStorage)
    const savedId = loadMyId(code);
    if (savedId) {
      const existing = remote.players.find(p => p.id === savedId);
      if (existing) {
        setRoom(remote); setMyId(savedId); setRoomCode(code);
        setMsg("");
        setTab(savedId === remote.hostId && !remote.draftDone ? "draft" : "scoreboard");
        setScreen("room"); return;
      }
    }
    // New player — generate PIN and add them
    const id = genCode(), pin = genPin();
    const updated = { ...remote, players: [...remote.players, { id, name: playerName.trim(), queen: null, points: 0, paid: false, eliminated: false, pin }], ts: Date.now() };
    setRoom(updated); setMyId(id); setRoomCode(code); setMyPin(pin);
    saveMyId(code, id);
    setMsg(""); setTab("scoreboard"); setScreen("pinSaved");
  }

  async function doRejoin() {
    if (!rejoinCode.trim()) { setMsg("Enter your room code!"); return; }
    if (!rejoinPin.trim())  { setMsg("Enter your PIN!"); return; }
    setMsg("Looking up room…");
    const code = rejoinCode.toUpperCase().trim();
    const remote = await fetchRoom(code);
    if (!remote) { setMsg("Room not found! Double-check the code."); return; }
    const player = remote.players.find(p => p.pin === rejoinPin.trim());
    if (!player) { setMsg("PIN not found! Check your PIN and try again."); return; }
    saveMyId(code, player.id);
    setRoom(remote); setMyId(player.id); setRoomCode(code);
    setMsg("");
    // Restore host to draft tab if draft not done, otherwise scoreboard
    setTab(player.id === remote.hostId && !remote.draftDone ? "draft" : "scoreboard");
    setScreen("room");
  }

  function emergencyReassign(pid, queen) {
    upd(r => ({ ...r, players: r.players.map(p => p.id === pid ? { ...p, queen } : p) }));
    setEmergencyPid(null);
  }

  function assignQueen(pid, queen) { upd(r => ({ ...r, players: r.players.map(p => p.id === pid ? { ...p, queen } : p) })); }
  function spinResult(player)      { upd(r => ({ ...r, draftOrder: [...r.draftOrder, player.id] })); }
  function lockDraft()             { upd(r => ({ ...r, draftDone: true })); }

  function logEpisode(form) {
    upd(r => {
      const ep = { episode: r.episodes.length + 1, ...form, ts: Date.now() };
      const players = r.players.map(p => {
        let pts = 0;
        if (form.winner              && p.queen === form.winner)              pts += 20;
        if (form.lipSyncWinner       && p.queen === form.lipSyncWinner)       pts += 5;
        if (form.miniChallengeWinner && p.queen === form.miniChallengeWinner) pts += 5;
        return { ...p, points: p.points + pts, eliminated: (form.eliminated && p.queen === form.eliminated) ? true : p.eliminated };
      });
      return { ...r, episodes: [...r.episodes, ep], players };
    });
  }

  function declareSeasonWinner(queenName) {
    upd(r => {
      const winner = r.players.find(p => p.queen === queenName);
      return { ...r, seasonWinner: winner ? winner.id : null };
    });
  }

  function addPoll(data)          { upd(r => ({ ...r, polls: [...r.polls, { id: genCode(), ...data, votes: {}, tootVotes: {}, closed: false, ts: Date.now() }] })); }
  function castVote(pid, ans)     { upd(r => ({ ...r, polls: r.polls.map(p => p.id !== pid ? p : { ...p, votes: { ...p.votes, [myId]: ans } }) })); }
  function castToot(pid, q, val)  { upd(r => ({ ...r, polls: r.polls.map(p => p.id !== pid ? p : { ...p, tootVotes: { ...p.tootVotes, [`${myId}_${q}`]: val } }) })); }
  function sealPoll(pid, correct) {
    upd(r => {
      const poll = r.polls.find(p => p.id === pid); if (!poll) return r;
      const players = r.players.map(pl => {
        const v = poll.votes[pl.id]; if (!v) return pl;
        let pts = 0;
        if (correct && poll.type === "elimination" && v === correct) pts += 10;
        if (correct && poll.type === "lipSync"     && v === correct) pts += 5;
        return { ...pl, points: pl.points + pts };
      });
      return { ...r, polls: r.polls.map(p => p.id === pid ? { ...p, closed: true, correct } : p), players };
    });
  }

  const TABS = [
    { id:"scoreboard", label:"🏆 Scores"   },
    { id:"queens",     label:"👸 Queens"   },
    { id:"draft",      label:"🎡 Draft"    },
    { id:"episodes",   label:"🎬 Episodes" },
    { id:"polls",      label:"📊 Polls"    },
    { id:"chaos",      label:"🃏 Chaos"    },
  ];

  // ── single return ──
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(170deg, ${C.bgDeep} 0%, ${C.bgMid} 50%, ${C.bgDeep} 100%)`, fontFamily:"sans-serif", position:"relative" }}>

      {/* Always-mounted styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#1a0008;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#6b0022;border-radius:3px;}
        select option{background:#2a000e;color:#fff;}

        @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
        @keyframes rayPulse{0%,100%{opacity:.15;}50%{opacity:.28;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}

        .gold-text{
          background:linear-gradient(90deg,#c9960a,#f5c842,#fff3a0,#f5c842,#c9960a);
          background-size:200% auto;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 3s linear infinite;
          font-family:'Cinzel',serif;
        }
        .rays{
          position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;
        }
        .rays::before,.rays::after{
          content:'';position:absolute;top:-30%;left:50%;transform:translateX(-50%);
          width:220%;height:170%;
          background:conic-gradient(from 255deg at 50% 18%,
            transparent 0deg,#c0001a1a 9deg,transparent 18deg,
            transparent 30deg,#e8407a14 39deg,transparent 48deg,
            transparent 62deg,#c0001a1a 71deg,transparent 80deg,
            transparent 95deg,#f5c84210 104deg,transparent 113deg,
            transparent 128deg,#e8407a14 137deg,transparent 146deg,
            transparent 165deg,#c0001a1a 174deg,transparent 183deg,
            transparent 200deg,#e8407a14 209deg,transparent 218deg,
            transparent 240deg,#c0001a1a 249deg,transparent 258deg);
          animation:rayPulse 4s ease-in-out infinite;
        }
        .rays::after{animation-delay:2s;opacity:.7;}

        .card{
          background:linear-gradient(145deg,#2a000e99,#1a000588);
          border:1px solid #6b1530;border-radius:14px;
          backdrop-filter:blur(8px);position:relative;overflow:hidden;
        }
        .card::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at top,#e8407a08 0%,transparent 70%);
          pointer-events:none;
        }
        .tab-btn{
          flex:1;min-width:0;padding:11px 4px;
          background:none;border:none;border-bottom:3px solid transparent;
          cursor:pointer;font-size:11px;white-space:nowrap;
          font-family:'Lato',sans-serif;color:#8a5050;
          transition:color .2s,border-color .2s;
        }
        .tab-btn.on{color:#f5c842;border-bottom-color:#f5c842;font-weight:700;}
        .tab-btn:hover:not(.on){color:#d4a0a0;}
        .qcard{
          background:linear-gradient(145deg,#2a000e99,#1a000588);
          border:1px solid #4a1020;border-radius:12px;padding:12px;
          cursor:pointer;transition:border-color .2s;position:relative;
        }
        .qcard:hover{border-color:#8b2030;}
        .qcard.open{background:linear-gradient(145deg,#3d0015cc,#2a000ecc);}
        .vbtn{
          background:linear-gradient(145deg,#2a000e99,#1a000588);
          border:2px solid #4a1020;border-radius:10px;padding:11px 14px;
          cursor:pointer;text-align:left;position:relative;overflow:hidden;
          transition:border-color .15s;width:100%;
        }
        .vbtn:hover:not(:disabled){border-color:#c0001a;}
        .vbtn.mine{border-color:#f5c842;background:linear-gradient(145deg,#3d200099,#2a100088);}
        .vbtn.win{border-color:#e8a020;}
        .vbtn:disabled{cursor:default;}
        .fade{animation:fadeUp .35s ease forwards;}
        .divider{height:2px;background:linear-gradient(90deg,#c0001a,#f5c842,transparent);border-radius:1px;margin:6px 0 18px;}
      `}</style>

      <div className="rays" />

      {/* ═══════════════════════════════════════════════════════
          HOME SCREEN
      ═══════════════════════════════════════════════════════ */}
      {screen === "home" && (
        <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:10 }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            {/* Glow orb */}
            <div style={{ width:220, height:220, borderRadius:"50%", background:"radial-gradient(ellipse,#f5c84218 0%,#e8407a0c 50%,transparent 70%)", filter:"blur(30px)", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-90%)", pointerEvents:"none" }} />
            <div style={{ fontSize:12, letterSpacing:5, color:C.offWhite, fontFamily:"'Cinzel',serif", marginBottom:12, opacity:.85 }}>
              IN SHADY TIMES, LET THERE BE LIGHT.
            </div>
            <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:42, fontWeight:900, lineHeight:1.1, marginBottom:8 }}>
              <span className="gold-text">Fantasy</span><br />
              <span className="gold-text">Drag Race</span>
            </h1>
            <div style={{ width:50, height:2, background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:"10px auto" }} />
            <p style={{ color:C.textMid, fontSize:12, letterSpacing:3, fontFamily:"'Lato',sans-serif" }}>SEASON 18</p>
          </div>
          <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:12 }}>
            <input
              placeholder="Your name"
              value={playerName}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doCreateRoom()}
              style={S.input}
            />
            <button onClick={doCreateRoom} style={S.goldBtn}>🏆 HOST A NEW GAME</button>
            <button onClick={() => { if (!playerName.trim()) { setMsg("Enter your name first!"); return; } setMsg(""); setScreen("join"); }} style={S.redBtn}>🔗 JOIN A GAME</button>
            <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.bgLight},transparent)`, margin:"4px 0" }} />
            <button onClick={() => { setMsg(""); setScreen("rejoin"); }}
              style={{ background:`linear-gradient(135deg,${C.bgMid},${C.bgDeep})`, border:`1px solid ${C.gold}`, color:C.gold, borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:.3 }}>
              🔑 RETURN TO MY GAME
            </button>
            {msg && <p style={{ color:C.pinkLight, textAlign:"center", fontSize:13, fontFamily:"'Lato',sans-serif" }}>{msg}</p>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PIN SAVED SCREEN
      ═══════════════════════════════════════════════════════ */}
      {screen === "pinSaved" && (
        <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:10 }}>
          <div style={{ width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔑</div>
            <h2 style={{ ...S.h2, marginBottom:8, textAlign:"center" }}>Save Your PIN!</h2>
            <p style={{ color:C.textMid, fontSize:14, marginBottom:24, fontFamily:"'Lato',sans-serif", lineHeight:1.6 }}>
              This is your personal PIN. If you ever lose access to the game, use this to rejoin as yourself with your queen and points intact.
            </p>
            <div style={{ background:`linear-gradient(135deg,${C.bgMid},${C.bgDeep})`, border:`2px solid ${C.gold}`, borderRadius:16, padding:"24px 32px", marginBottom:24 }}>
              <div style={{ color:C.textDim, fontSize:12, letterSpacing:3, fontFamily:"'Lato',sans-serif", marginBottom:8 }}>YOUR PIN</div>
              <div className="gold-text" style={{ fontSize:48, fontWeight:900, letterSpacing:8 }}>{myPin}</div>
            </div>
            <p style={{ color:C.pinkLight, fontSize:13, marginBottom:24, fontFamily:"'Lato',sans-serif" }}>
              ⚠️ Screenshot this or write it down — you won't see it again!
            </p>
            <button onClick={() => setScreen("room")} style={{ ...S.goldBtn, width:"100%" }}>
              ✅ I've Saved My PIN — Enter the Game
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          REJOIN SCREEN
      ═══════════════════════════════════════════════════════ */}
      {screen === "rejoin" && (
        <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:10 }}>
          <h2 style={{ ...S.h2, marginBottom:8 }}>Return to Your Game</h2>
          <p style={{ color:C.textMid, fontSize:14, marginBottom:20, fontFamily:"'Lato',sans-serif", lineHeight:1.6 }}>
            Enter your room code and PIN to pick up right where you left off — works for both hosts and players. Your queen, points, and host powers will all be restored.
          </p>
          <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:12 }}>
            <input placeholder="Room code  e.g.  XK9AB" value={rejoinCode}
              onChange={e => setRejoinCode(e.target.value.toUpperCase())}
              style={{ ...S.input, letterSpacing:4, fontWeight:700, fontSize:20, textAlign:"center" }} />
            <input placeholder="Your 6-digit PIN" value={rejoinPin}
              onChange={e => setRejoinPin(e.target.value.replace(/\D/g, "").slice(0,6))}
              style={{ ...S.input, letterSpacing:6, fontWeight:700, fontSize:24, textAlign:"center" }} />
            <button onClick={doRejoin} style={S.goldBtn}>🔑 REJOIN GAME</button>
            <button onClick={() => { setScreen("home"); setMsg(""); }} style={S.ghost}>← Back</button>
            {msg && <p style={{ color:C.pinkLight, fontSize:13, fontFamily:"'Lato',sans-serif" }}>{msg}</p>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          JOIN SCREEN
      ═══════════════════════════════════════════════════════ */}
      {screen === "join" && (
        <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:10 }}>
          <h2 style={S.h2}>Join a Room</h2>
          <p style={{ color:C.textMid, fontSize:14, marginBottom:20, fontFamily:"'Lato',sans-serif" }}>Enter the room code your host shared</p>
          <div style={{ width:"100%", maxWidth:320, display:"flex", flexDirection:"column", gap:12 }}>
            <input placeholder="Your name" value={playerName} onChange={e => setName(e.target.value)} style={S.input} />
            <input placeholder="Room code  e.g.  XK9AB" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              style={{ ...S.input, letterSpacing:4, fontWeight:700, fontSize:20, textAlign:"center" }} />
            <button onClick={doJoinRoom} style={S.redBtn}>JOIN ROOM 🔗</button>
            <button onClick={() => { setScreen("home"); setMsg(""); }} style={S.ghost}>← Back</button>
            {msg && <p style={{ color:C.pinkLight, fontSize:13, fontFamily:"'Lato',sans-serif" }}>{msg}</p>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ROOM
      ═══════════════════════════════════════════════════════ */}
      {screen === "room" && room && (
        <div style={{ minHeight:"100vh", paddingBottom:80, position:"relative", zIndex:10 }}>

          {/* Header */}
          <div style={{ background:"#1a0008ee", backdropFilter:"blur(16px)", padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.bgLight}`, position:"sticky", top:0, zIndex:50 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:900 }} className="gold-text">Fantasy Drag Race</div>
              <div style={{ color:C.textDim, fontSize:10, letterSpacing:2, fontFamily:"'Lato',sans-serif", marginTop:1 }}>SEASON 18</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ background:`linear-gradient(135deg,${C.bgMid},${C.bgDeep})`, border:`1px solid ${C.goldDark}`, borderRadius:8, padding:"3px 10px", display:"inline-block" }}>
                <span style={{ color:C.textDim, fontSize:10, fontFamily:"'Lato',sans-serif" }}>ROOM </span>
                <span className="gold-text" style={{ fontWeight:700, letterSpacing:3, fontSize:14 }}>{roomCode}</span>
              </div>
              {me && <div style={{ color:C.textDim, fontSize:11, marginTop:2, fontFamily:"'Lato',sans-serif" }}>{me.name}{isHost ? " 👑" : ""}</div>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.bgLight}`, background:"#1a0008cc", overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding:"18px 14px", maxWidth:680, margin:"0 auto" }}>

            {tab === "scoreboard" && <ScoreTab sorted={sorted} myId={myId} players={room.players} room={room} isHost={isHost} onEmergencyReassign={emergencyReassign} />}
            {tab === "queens"     && <QueensTab room={room} isHost={isHost} onAssign={assignQueen} />}
            {tab === "draft"      && <DraftTab room={room} isHost={isHost} onSpin={spinResult} onAssign={assignQueen} onLock={lockDraft} />}
            {tab === "episodes"   && <EpisodesTab room={room} isHost={isHost} onLog={logEpisode} onDeclare={declareSeasonWinner} />}
            {tab === "polls"      && <PollsTab room={room} myId={myId} isHost={isHost} onAdd={addPoll} onVote={castVote} onToot={castToot} onSeal={sealPoll} />}
            {tab === "chaos"      && <ChaosTab room={room} myId={myId} me={me} isHost={isHost} onUpdateRoom={upd} />}

          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCOREBOARD TAB
// ─────────────────────────────────────────────────────────────────────────────
function ScoreTab({ sorted, myId, players, room, isHost, onEmergencyReassign }) {
  const pool = players.filter(p => p.paid).length * 20;
  const [showPins, setShowPins] = useState(false);
  const [emergencyPid, setEmergencyPid] = useState(null);
  const [emergencyQueen, setEmergencyQueen] = useState("");
  const seasonWinner = room.seasonWinner ? players.find(p => p.id === room.seasonWinner) : null;
  const available = room.queens.filter(q => !players.some(p => p.queen === q));
  return (
    <div className="fade">
      <SecTitle>Scoreboard</SecTitle>
      <div className="card" style={{ padding:"12px 16px", marginBottom:18, display:"flex", gap:24, flexWrap:"wrap" }}>
        <StatBox label="Prize Pool"  value={`$${pool}`} gold />
        <StatBox label="Winner Gets" value="$300"       gold />
        <StatBox label="Players"     value={players.length} />
      </div>
      {/* Season winner banner */}
      {seasonWinner && (
        <div className="card" style={{ padding:"16px", marginBottom:18, border:`2px solid ${C.gold}`, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:4 }}>👑</div>
          <div className="gold-text" style={{ fontSize:20, fontWeight:900 }}>SEASON WINNER</div>
          <div style={{ color:C.white, fontSize:16, fontWeight:700, marginTop:4, fontFamily:"'Lato',sans-serif" }}>{seasonWinner.name}</div>
          <div style={{ color:C.textDim, fontSize:13, marginTop:2 }}>{seasonWinner.queen} · $300 🎉</div>
        </div>
      )}

      {/* Host tools */}
      {isHost && (
        <div style={{ marginBottom:16, display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={() => setShowPins(!showPins)}
            style={{ ...S.ghost, fontSize:12 }}>🔑 {showPins ? "Hide" : "View"} Player PINs</button>
          <button onClick={() => setEmergencyPid(emergencyPid ? null : "pick")}
            style={{ background:`${C.red}33`, border:`1px solid ${C.red}`, color:C.pinkLight, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontFamily:"'Lato',sans-serif" }}>
            ⚠️ Emergency Reassign
          </button>
        </div>
      )}

      {/* PIN list for host */}
      {isHost && showPins && (
        <div className="card" style={{ padding:"12px 16px", marginBottom:16, border:`1px solid ${C.gold}44` }}>
          <div style={{ color:C.gold, fontWeight:700, fontSize:13, marginBottom:10, fontFamily:"'Cinzel',serif" }}>Player PINs</div>
          {players.map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.bgLight}` }}>
              <span style={{ color:C.white, fontSize:13, fontFamily:"'Lato',sans-serif" }}>{p.name}</span>
              <span style={{ color:C.gold, fontWeight:700, letterSpacing:3, fontSize:13 }}>{p.pin || "—"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emergency reassign */}
      {isHost && emergencyPid && (
        <div className="card" style={{ padding:"14px 16px", marginBottom:16, border:`1px solid ${C.red}` }}>
          <div style={{ color:C.pinkLight, fontWeight:700, fontSize:14, marginBottom:12, fontFamily:"'Cinzel',serif" }}>⚠️ Emergency Queen Reassign</div>
          <div style={{ marginBottom:10 }}>
            <FL>Select Player</FL>
            <select value={emergencyPid === "pick" ? "" : emergencyPid}
              onChange={e => setEmergencyPid(e.target.value)}
              style={{ ...S.input, color: emergencyPid !== "pick" ? C.white : C.textDim }}>
              <option value="">— Select player —</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} {p.queen ? `(${p.queen})` : "(no queen)"}</option>)}
            </select>
          </div>
          {emergencyPid && emergencyPid !== "pick" && (
            <div style={{ marginBottom:10 }}>
              <FL>Assign New Queen</FL>
              <select value={emergencyQueen} onChange={e => setEmergencyQueen(e.target.value)}
                style={{ ...S.input, color: emergencyQueen ? C.white : C.textDim }}>
                <option value="">— Select queen —</option>
                {room.queens.filter(q => !players.some(p => p.queen === q)).map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            {emergencyPid && emergencyPid !== "pick" && emergencyQueen && (
              <button onClick={() => { onEmergencyReassign(emergencyPid, emergencyQueen); setEmergencyPid(null); setEmergencyQueen(""); }}
                style={{ ...S.redBtn, padding:"8px 16px", fontSize:13 }}>✓ Confirm Reassign</button>
            )}
            <button onClick={() => { setEmergencyPid(null); setEmergencyQueen(""); }} style={{ ...S.ghost, padding:"8px 12px", fontSize:12 }}>Cancel</button>
          </div>
        </div>
      )}

      {sorted.map((p, i) => (
        <div key={p.id} className="card" style={{
          display:"flex", alignItems:"center", padding:"12px 14px", marginBottom:10, gap:12,
          border:`1px solid ${p.id === myId ? C.gold : C.cardBorder}`,
          boxShadow: p.id === myId ? `0 0 18px ${C.gold}22` : "none",
          opacity: p.eliminated ? 0.6 : 1
        }}>
          <div style={{
            width:34, height:34, borderRadius:"50%", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:14, fontFamily:"'Cinzel',serif",
            background: i===0 ? `linear-gradient(135deg,${C.gold},${C.goldDark})`
                      : i===1 ? "linear-gradient(135deg,#d0d0d0,#999)"
                      : i===2 ? "linear-gradient(135deg,#cd7f32,#8b4513)"
                               : `linear-gradient(135deg,${C.bgMid},${C.bgDeep})`,
            color: i < 3 ? "#1a0008" : C.textDim,
            border: `1px solid ${i===0?C.gold:i===1?"#bbb":i===2?"#a06020":C.bgLight}`
          }}>{i + 1}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:C.white, fontWeight:700, fontSize:15, fontFamily:"'Lato',sans-serif" }}>
              {p.name}{p.id === myId ? " (you)" : ""}
            </div>
            <div style={{ color:C.textDim, fontSize:12, marginTop:2 }}>
              {p.queen ? `👑 ${p.queen}` : "No queen yet"}{p.eliminated ? " · ☠️ Out" : ""}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div className="gold-text" style={{ fontWeight:900, fontSize:24, lineHeight:1 }}>{p.points}</div>
            <div style={{ color:C.textDim, fontSize:11 }}>pts</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEENS TAB
// ─────────────────────────────────────────────────────────────────────────────
function QueensTab({ room, isHost, onAssign }) {
  const [open, setOpen]         = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [selPid, setSelPid]     = useState("");
  const unassigned = room.players.filter(p => !p.queen);

  function doAssign(qname) {
    if (!selPid) return;
    onAssign(selPid, qname);
    setAssigning(null); setSelPid("");
  }

  return (
    <div className="fade">
      <SecTitle>Season 18 Queens</SecTitle>
      <p style={{ color:C.textDim, fontSize:13, marginBottom:16, fontFamily:"'Lato',sans-serif" }}>
        Tap any queen to see her bio{isHost && !room.draftDone ? " or assign her to a player" : ""}.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {S18.map(q => {
          const owner  = room.players.find(p => p.queen === q.name);
          const isOpen = open === q.name;
          const bc     = owner ? (owner.eliminated ? C.red : C.gold) : isOpen ? C.pink : "#4a1020";
          return (
            <div key={q.name} className={`qcard${isOpen ? " open" : ""}`}
              onClick={() => setOpen(isOpen ? null : q.name)}
              style={{ borderColor: bc }}>
              {owner && (
                <div style={{
                  position:"absolute", top:7, right:7,
                  background: owner.eliminated ? `${C.red}22` : `${C.gold}22`,
                  border:`1px solid ${owner.eliminated ? C.red : C.goldDark}`,
                  borderRadius:20, padding:"1px 7px", fontSize:10,
                  color: owner.eliminated ? C.pinkLight : C.gold,
                  fontWeight:700, maxWidth:"56%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  fontFamily:"'Lato',sans-serif"
                }}>
                  {owner.eliminated ? "☠️ Out" : `👑 ${owner.name}`}
                </div>
              )}
              <div style={{ fontWeight:700, color:C.white, fontSize:13, paddingRight: owner ? 50 : 0, lineHeight:1.3, fontFamily:"'Lato',sans-serif" }}>{q.name}</div>
              <div style={{ color:C.textDim, fontSize:11, marginTop:3 }}>📍 {q.hometown}</div>
              {isOpen && (
                <div onClick={e => e.stopPropagation()} style={{ marginTop:10 }}>
                  <p style={{ color:C.textMid, fontSize:12, lineHeight:1.6, marginBottom:12, fontFamily:"'Lato',sans-serif" }}>{q.bio}</p>
                  {isHost && !owner && !room.draftDone && (
                    assigning === q.name ? (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        <select value={selPid} onChange={e => setSelPid(e.target.value)} style={{ ...S.input, padding:"8px 10px", fontSize:13, color: selPid ? C.white : C.textDim }}>
                          <option value="">— Select a player —</option>
                          {unassigned.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => doAssign(q.name)} disabled={!selPid}
                            style={{ ...S.goldBtn, flex:1, padding:"8px 0", fontSize:13, opacity: selPid ? 1 : 0.4, cursor: selPid ? "pointer" : "not-allowed" }}>
                            Assign 👑
                          </button>
                          <button onClick={() => { setAssigning(null); setSelPid(""); }} style={{ ...S.ghost, padding:"8px 12px", fontSize:12 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAssigning(q.name)} style={{ ...S.redBtn, width:"100%", padding:"8px 0", fontSize:13 }}>
                        + Assign to Player
                      </button>
                    )
                  )}
                  {owner && !owner.eliminated && <p style={{ color:C.gold, fontSize:12, marginTop:4, fontFamily:"'Lato',sans-serif" }}>Assigned to {owner.name}</p>}
                  {isHost && !owner && room.draftDone && <p style={{ color:C.pinkLight, fontSize:11, marginTop:4 }}>Draft is locked.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT TAB
// ─────────────────────────────────────────────────────────────────────────────
function DraftTab({ room, isHost, onSpin, onAssign, onLock }) {
  const [assigning, setAssigning] = useState(null);
  const [selQ, setSelQ]           = useState("");
  const unordered = room.players.filter(p => !room.draftOrder.includes(p.id));
  const ordered   = room.draftOrder.map(id => room.players.find(p => p.id === id)).filter(Boolean);
  const available = room.queens.filter(q => !room.players.some(p => p.queen === q));

  function doAssign(pid) {
    if (!selQ) return;
    onAssign(pid, selQ); setAssigning(null); setSelQ("");
  }

  return (
    <div className="fade">
      <SecTitle>Queen Draft</SecTitle>
      {!room.draftDone ? (
        <>
          <p style={{ color:C.textDim, fontSize:13, marginBottom:16, fontFamily:"'Lato',sans-serif" }}>
            {isHost ? "Step 1: Spin for each player to set draft order. Step 2: Assign each player a queen." : "Waiting for the host to run the draft…"}
          </p>
          {isHost && unordered.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <FL>🎡 Spin for Draft Order</FL>
              <SpinWheel players={unordered} onResult={onSpin} />
            </div>
          )}
          {ordered.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <FL>📋 Draft Order</FL>
              {ordered.map((p, i) => (
                <div key={p.id} className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", marginBottom:8, gap:8, flexWrap:"wrap" }}>
                  <div>
                    <span style={{ color:C.gold, fontWeight:700, marginRight:8, fontFamily:"'Cinzel',serif" }}>#{i+1}</span>
                    <span style={{ color:C.white, fontWeight:600, fontFamily:"'Lato',sans-serif" }}>{p.name}</span>
                  </div>
                  <div>
                    {p.queen ? <span style={{ color:C.gold, fontSize:13 }}>👑 {p.queen}</span>
                    : isHost ? (
                      assigning === p.id ? (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          <select value={selQ} onChange={e => setSelQ(e.target.value)}
                            style={{ background:C.bgDeep, color: selQ ? C.white : C.textDim, border:`1px solid ${C.bgLight}`, borderRadius:8, padding:"5px 8px", fontSize:12 }}>
                            <option value="">Pick a queen…</option>
                            {available.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                          <button onClick={() => doAssign(p.id)} disabled={!selQ}
                            style={{ ...S.goldBtn, padding:"5px 12px", fontSize:12, opacity: selQ ? 1 : 0.4 }}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => setAssigning(p.id)} style={{ ...S.redBtn, padding:"5px 12px", fontSize:12 }}>Assign Queen</button>
                      )
                    ) : <span style={{ color:C.textDim, fontSize:12 }}>Awaiting…</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isHost && unordered.length === 0 && ordered.every(p => p.queen) && (
            <button onClick={onLock} style={{ ...S.goldBtn, width:"100%" }}>🏁 LOCK DRAFT & START SEASON</button>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ padding:"12px 16px", marginBottom:16, border:`1px solid ${C.gold}44` }}>
            <span style={{ color:C.gold, fontWeight:600, fontFamily:"'Lato',sans-serif" }}>✅ Draft complete! The season has begun.</span>
          </div>
          {room.players.map(p => (
            <div key={p.id} className="card" style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", marginBottom:8 }}>
              <span style={{ color:C.white, fontWeight:600, fontFamily:"'Lato',sans-serif" }}>{p.name}</span>
              <span style={{ color:C.gold }}>{p.queen ? `👑 ${p.queen}` : "—"}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EPISODES TAB
// ─────────────────────────────────────────────────────────────────────────────
const BLANK = { theme:"", winner:"", lipSyncWinner:"", miniChallengeWinner:"", eliminated:"" };
const EP_FIELDS = [
  { key:"theme",               label:"🎭 Episode Theme",        type:"text",  req:false },
  { key:"winner",              label:"🏆 Episode Winner",        type:"queen", req:true  },
  { key:"lipSyncWinner",       label:"💄 Lip Sync Winner",       type:"queen", req:false },
  { key:"miniChallengeWinner", label:"🎯 Mini Challenge Winner", type:"queen", req:false },
  { key:"eliminated",          label:"☠️ Eliminated Queen",      type:"queen", req:false },
];

function EpisodesTab({ room, isHost, onLog, onDeclare }) {
  const [form, setForm] = useState(BLANK);
  const [open, setOpen] = useState(false);
  const [err,  setErr]  = useState("");

  function submit() {
    if (!form.winner) { setErr("Please select an episode winner."); return; }
    onLog(form); setForm(BLANK); setOpen(false); setErr("");
  }

  return (
    <div className="fade">
      <SecTitle>Episodes</SecTitle>
      {isHost && !open && (
        <button onClick={() => { setOpen(true); setErr(""); }} style={{ ...S.redBtn, marginBottom:18 }}>
          + Log Episode Result
        </button>
      )}
      {isHost && open && (
        <div className="card" style={{ padding:16, marginBottom:18, border:`1px solid ${C.pink}44` }}>
          <div style={{ color:C.pinkLight, fontWeight:700, fontSize:16, marginBottom:14, fontFamily:"'Cinzel',serif" }}>
            Episode {room.episodes.length + 1}
          </div>
          {EP_FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom:12 }}>
              <label style={{ color:C.textMid, fontSize:13, display:"block", marginBottom:5, fontFamily:"'Lato',sans-serif" }}>
                {f.label}{f.req && <span style={{ color:C.pinkLight, marginLeft:3 }}>*</span>}
              </label>
              {f.type === "text" ? (
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="Optional…" style={S.input} />
              ) : (
                <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ ...S.input, color: form[f.key] ? C.white : C.textDim }}>
                  <option value="">{f.req ? "Select a queen…" : "None / Skip"}</option>
                  {room.queens.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              )}
            </div>
          ))}
          {err && <p style={{ color:C.pinkLight, fontSize:13, marginBottom:10, fontFamily:"'Lato',sans-serif" }}>{err}</p>}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={submit} style={S.goldBtn}>💾 Save Episode</button>
            <button onClick={() => { setOpen(false); setErr(""); }} style={S.ghost}>Cancel</button>
          </div>
        </div>
      )}
      {/* Declare season winner */}
      {isHost && room.draftDone && !room.seasonWinner && (
        <SeasonWinnerPanel room={room} onDeclare={declareSeasonWinner} />
      )}
      {room.seasonWinner && (() => {
        const w = room.players.find(p => p.id === room.seasonWinner);
        return w ? (
          <div className="card" style={{ padding:"14px 16px", marginBottom:18, border:`2px solid ${C.gold}`, textAlign:"center" }}>
            <div className="gold-text" style={{ fontSize:16, fontWeight:900 }}>👑 Season Winner: {w.name} ({w.queen}) — $300!</div>
          </div>
        ) : null;
      })()}
      {room.episodes.length === 0 && <p style={{ color:C.textDim, fontFamily:"'Lato',sans-serif" }}>No episodes logged yet.</p>}
      {[...room.episodes].reverse().map((ep, i) => (
        <div key={i} className="card" style={{ padding:14, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ color:C.pinkLight, fontWeight:700, fontSize:15, fontFamily:"'Cinzel',serif" }}>Episode {ep.episode}</span>
            {ep.theme && <span style={{ color:C.textDim, fontSize:13 }}>{ep.theme}</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {ep.winner              && <Pip icon="🏆" label="Winner"      val={ep.winner}              col={C.gold} />}
            {ep.lipSyncWinner       && <Pip icon="💄" label="Lip Sync"    val={ep.lipSyncWinner}       col={C.pinkLight} />}
            {ep.miniChallengeWinner && <Pip icon="🎯" label="Mini Chall." val={ep.miniChallengeWinner} col={C.roseLight} />}
            {ep.eliminated          && <Pip icon="☠️" label="Eliminated"  val={ep.eliminated}          col={C.red} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonWinnerPanel({ room, onDeclare }) {
  const [queen, setQueen] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div className="card" style={{ padding:"16px", marginBottom:18, border:`2px solid ${C.gold}`, textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:8 }}>👑</div>
      <div style={{ color:C.white, fontWeight:700, fontSize:15, marginBottom:16, fontFamily:"'Lato',sans-serif" }}>
        Declare <span style={{ color:C.gold }}>{queen}</span> as the Season 18 winner?<br/>
        <span style={{ fontSize:13, color:C.textMid }}>This awards $300 to their player and cannot be undone.</span>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <button onClick={() => onDeclare(queen)} style={S.goldBtn}>👑 Confirm Winner</button>
        <button onClick={() => setConfirm(false)} style={S.ghost}>Cancel</button>
      </div>
    </div>
  );
  return (
    <div className="card" style={{ padding:"14px 16px", marginBottom:18, border:`1px solid ${C.gold}44` }}>
      <div style={{ color:C.gold, fontWeight:700, fontSize:14, marginBottom:12, fontFamily:"'Cinzel',serif" }}>🏆 Declare Season Winner</div>
      <select value={queen} onChange={e => setQueen(e.target.value)}
        style={{ ...S.input, color: queen ? C.white : C.textDim, marginBottom:10 }}>
        <option value="">Select the winning queen…</option>
        {room.queens.filter(q => room.players.some(p => p.queen === q)).map(q => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>
      {queen && (
        <button onClick={() => setConfirm(true)} style={{ ...S.goldBtn, width:"100%" }}>
          👑 Declare Winner
        </button>
      )}
    </div>
  );
}

function Pip({ icon, label, val, col }) {
  return (
    <div style={{ background:`${col}11`, border:`1px solid ${col}44`, borderRadius:10, padding:"7px 10px" }}>
      <div style={{ color:col, fontSize:11, fontWeight:700, fontFamily:"'Lato',sans-serif" }}>{icon} {label}</div>
      <div style={{ color:C.white, fontSize:13, fontWeight:600, marginTop:2 }}>{val}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POLLS TAB
// ─────────────────────────────────────────────────────────────────────────────
const PTYPES = [
  { id:"elimination",  label:"☠️ Who Gets Eliminated"  },
  { id:"lipSync",      label:"💄 Who Wins the Lip Sync" },
  { id:"bestOutfit",   label:"👗 Best Runway Outfit"    },
  { id:"seasonWinner", label:"🏆 Who Wins the Season"   },
  { id:"tootBoot",     label:"👢 Toot or Boot"          },
  { id:"custom",       label:"✏️ Custom Question"       },
];

function PollsTab({ room, myId, isHost, onAdd, onVote, onToot, onSeal }) {
  const [creating, setCreating]   = useState(false);
  const [pType, setPType]         = useState("elimination");
  const [question, setQuestion]   = useState("");
  const [chosen, setChosen]       = useState([]);
  const [customOpts, setCOpts]    = useState(["", ""]);
  const [imgs, setImgs]           = useState({});
  const [closingId, setClosingId] = useState(null);
  const [correct, setCorrect]     = useState("");

  const active = room.queens.filter(q => !room.players.find(p => p.queen === q && p.eliminated));
  const toggleQ = q => setChosen(p => p.includes(q) ? p.filter(x => x !== q) : [...p, q]);

  function handleImg(queen, e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setImgs(p => ({ ...p, [queen]: ev.target.result })); r.readAsDataURL(f);
  }

  function submit() {
    if (!question.trim()) return;
    let options, images = {};
    if (pType === "tootBoot")  { options = chosen.length ? chosen : active; images = imgs; }
    else if (pType === "custom") { options = customOpts.map(s => s.trim()).filter(Boolean); if (options.length < 2) return; }
    else                         { options = chosen.length ? chosen : active; }
    onAdd({ type: pType, question: question.trim(), options, images });
    setCreating(false); setQuestion(""); setChosen([]); setCOpts(["",""]); setImgs({}); setPType("elimination");
  }

  function cancel() { setCreating(false); setQuestion(""); setChosen([]); setCOpts(["",""]); setImgs({}); setPType("elimination"); }

  return (
    <div className="fade">
      <SecTitle>Polls</SecTitle>
      {isHost && !creating && (
        <button onClick={() => setCreating(true)} style={{ ...S.redBtn, marginBottom:18 }}>+ Create Poll</button>
      )}

      {isHost && creating && (
        <div className="card" style={{ padding:16, marginBottom:20, border:`1px solid ${C.pink}44` }}>
          <div style={{ color:C.pinkLight, fontWeight:700, fontSize:16, marginBottom:14, fontFamily:"'Cinzel',serif" }}>New Poll</div>

          <FL>Poll Type</FL>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
            {PTYPES.map(pt => (
              <button key={pt.id} onClick={() => { setPType(pt.id); setChosen([]); setCOpts(["",""]); }}
                style={{ background: pType===pt.id ? C.red : `${C.bgMid}88`, border:`1px solid ${pType===pt.id ? C.red : C.bgLight}`, borderRadius:20, padding:"6px 13px", color:C.white, cursor:"pointer", fontSize:12, fontWeight: pType===pt.id ? 700 : 400, fontFamily:"'Lato',sans-serif" }}>
                {pt.label}
              </button>
            ))}
          </div>

          <FL>Question *</FL>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. Who do you think will be eliminated?" style={{ ...S.input, marginBottom:16 }} />

          {/* Queen picker (non-tootBoot, non-custom) */}
          {pType !== "custom" && pType !== "tootBoot" && (
            <div style={{ marginBottom:16 }}>
              <FL>Answer Choices <span style={{ color:C.textDim, fontWeight:400, fontSize:11 }}>(tap to select · blank = all remaining queens)</span></FL>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {active.map(q => (
                  <button key={q} onClick={() => toggleQ(q)}
                    style={{ background: chosen.includes(q) ? C.red : `${C.bgMid}88`, border:`1px solid ${chosen.includes(q) ? C.red : C.bgLight}`, borderRadius:20, padding:"6px 13px", color:C.white, cursor:"pointer", fontSize:12, fontFamily:"'Lato',sans-serif" }}>
                    {chosen.includes(q) ? "✓ " : ""}{q}
                  </button>
                ))}
              </div>
              {chosen.length > 0 && <p style={{ color:C.gold, fontSize:12, marginTop:8 }}>{chosen.length} selected</p>}
            </div>
          )}

          {/* Toot or Boot */}
          {pType === "tootBoot" && (
            <div style={{ marginBottom:16 }}>
              <FL>Select Queens <span style={{ color:C.textDim, fontWeight:400, fontSize:11 }}>(blank = all remaining)</span></FL>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                {active.map(q => (
                  <button key={q} onClick={() => toggleQ(q)}
                    style={{ background: chosen.includes(q) ? C.pink : `${C.bgMid}88`, border:`1px solid ${chosen.includes(q) ? C.pink : C.bgLight}`, borderRadius:20, padding:"6px 13px", color:C.white, cursor:"pointer", fontSize:12 }}>
                    {chosen.includes(q) ? "✓ " : ""}{q}
                  </button>
                ))}
              </div>
              <FL>Outfit Photos <span style={{ color:C.textDim, fontWeight:400, fontSize:11 }}>(optional)</span></FL>
              {(chosen.length ? chosen : active).map(q => (
                <div key={q} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, background:`${C.bgDeep}88`, borderRadius:10, padding:"8px 12px", border:`1px solid ${C.bgLight}` }}>
                  {imgs[q]
                    ? <img src={imgs[q]} alt={q} style={{ width:50, height:50, borderRadius:8, objectFit:"cover", flexShrink:0, border:`1px solid ${C.gold}44` }} />
                    : <div style={{ width:50, height:50, borderRadius:8, background:C.bgMid, border:`1px dashed ${C.bgLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>👸</div>}
                  <div style={{ flex:1 }}>
                    <div style={{ color:C.white, fontWeight:600, fontSize:13, fontFamily:"'Lato',sans-serif" }}>{q}</div>
                    <label style={{ color:C.textMid, fontSize:11, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, marginTop:3, background:`${C.bgMid}88`, border:`1px solid ${C.bgLight}`, borderRadius:8, padding:"3px 9px" }}>
                      📷 {imgs[q] ? "Change" : "Add photo"}
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleImg(q, e)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom */}
          {pType === "custom" && (
            <div style={{ marginBottom:16 }}>
              <FL>Answer Choices *</FL>
              {customOpts.map((opt, i) => (
                <div key={i} style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <input value={opt} onChange={e => setCOpts(o => o.map((x,j) => j===i ? e.target.value : x))}
                    placeholder={`Option ${i+1}…`} style={{ ...S.input, flex:1 }} />
                  {customOpts.length > 2 && (
                    <button onClick={() => setCOpts(o => o.filter((_,j) => j!==i))}
                      style={{ background:"none", border:`1px solid ${C.bgLight}`, color:C.textMid, borderRadius:8, padding:"0 12px", cursor:"pointer", fontSize:18 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={() => setCOpts(o => [...o, ""])}
                style={{ background:"none", border:`1px dashed ${C.bgLight}`, color:C.textMid, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12 }}>
                + Add option
              </button>
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={submit} style={S.goldBtn}>🗳️ Create Poll</button>
            <button onClick={cancel} style={S.ghost}>Cancel</button>
          </div>
        </div>
      )}

      {room.polls.length === 0 && (
        <p style={{ color:C.textDim, fontFamily:"'Lato',sans-serif" }}>
          {isHost ? "No polls yet — create one above!" : "No polls yet. Check back soon!"}
        </p>
      )}

      {[...room.polls].reverse().map(poll => {
        const myVote = poll.votes?.[myId];
        const totalV = Object.keys(poll.votes || {}).length;
        const showRes = poll.closed || totalV >= room.players.length;
        const tlabel  = PTYPES.find(t => t.id === poll.type)?.label || poll.type;
        return (
          <div key={poll.id} className="card" style={{ padding:14, marginBottom:14, border:`1px solid ${poll.closed ? C.cardBorder : C.pink}44` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:8 }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
                <span style={{ background:C.bgMid, color:C.textMid, fontSize:11, borderRadius:6, padding:"2px 8px", border:`1px solid ${C.bgLight}`, fontFamily:"'Lato',sans-serif" }}>{tlabel}</span>
                {poll.closed && <span style={{ background:`${C.red}22`, color:C.pinkLight, fontSize:11, borderRadius:6, padding:"2px 8px", border:`1px solid ${C.red}44` }}>CLOSED</span>}
              </div>
              {isHost && !poll.closed && (
                closingId === poll.id ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                    {(poll.type === "elimination" || poll.type === "lipSync") && (
                      <select value={correct} onChange={e => setCorrect(e.target.value)}
                        style={{ background:C.bgDeep, color: correct ? C.white : C.textDim, border:`1px solid ${C.red}`, borderRadius:8, padding:"4px 8px", fontSize:12 }}>
                        <option value="">Set correct answer (optional)</option>
                        {(poll.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => { onSeal(poll.id, correct); setClosingId(null); setCorrect(""); }}
                        style={{ ...S.redBtn, padding:"5px 12px", fontSize:12 }}>✓ Close</button>
                      <button onClick={() => setClosingId(null)} style={{ ...S.ghost, padding:"5px 10px", fontSize:12 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setClosingId(poll.id)}
                    style={{ background:`${C.red}22`, border:`1px solid ${C.red}66`, color:C.pinkLight, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:11, flexShrink:0 }}>
                    Close Poll
                  </button>
                )
              )}
            </div>
            <p style={{ color:C.white, fontWeight:600, fontSize:15, margin:"0 0 12px", fontFamily:"'Lato',sans-serif" }}>{poll.question}</p>
            {poll.type === "tootBoot" ? (
              <TootVote poll={poll} myId={myId} onVote={onToot} />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(poll.options||[]).map(opt => {
                  const vc   = Object.values(poll.votes||{}).filter(v => v===opt).length;
                  const pct  = totalV > 0 ? Math.round(vc/totalV*100) : 0;
                  const mine = myVote === opt;
                  const win  = poll.correct && poll.correct === opt;
                  return (
                    <button key={opt} onClick={() => !poll.closed && !myVote && onVote(poll.id, opt)}
                      disabled={!!(poll.closed || myVote)}
                      className={`vbtn${mine?" mine":win&&showRes?" win":""}`}>
                      {showRes && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:pct+"%", background: mine?`${C.gold}22`:`${C.pink}18`, transition:"width .6s ease" }} />}
                      <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <span style={{ color: mine?C.gold:win&&showRes?C.roseLight:C.white, fontWeight:mine?700:400, fontSize:14, fontFamily:"'Lato',sans-serif" }}>
                          {opt}{mine?" ✓":""}{win&&showRes?" 🏆":""}
                        </span>
                        {showRes && <span style={{ color:C.textMid, fontSize:13, fontWeight:600, flexShrink:0 }}>{pct}% · {vc}</span>}
                      </div>
                    </button>
                  );
                })}
                {!myVote && !poll.closed && <p style={{ color:C.textDim, fontSize:12, marginTop:4, fontFamily:"'Lato',sans-serif" }}>👆 Tap to vote · Results shown after everyone votes</p>}
                {myVote  && !poll.closed && !showRes && <p style={{ color:C.gold, fontSize:12, marginTop:4, fontFamily:"'Lato',sans-serif" }}>✓ Voted! Waiting for others… ({totalV}/{room.players.length})</p>}
                {showRes && poll.correct && <p style={{ color:C.gold, fontSize:12, marginTop:4 }}>🏆 Correct: {poll.correct}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARDS OF CHAOS TAB
// ─────────────────────────────────────────────────────────────────────────────
const CARD_COST = 5;
const MAX_DRAWS = 2;

const CHAOS_CARDS = [
  { id:1,  emoji:"🃏", name:"Lip Sync for Your Life",              rarity:"RARE",      rarityColor:"#60a5fa", accent:"#c2185b", bg:"linear-gradient(160deg,#6d0030 0%,#180008 55%,#3d0018 100%)", action:"self",   description:"Double your points if your queen wins the lip sync this week.",                                    logAction:(p)=>    `${p} is betting it all on the lip sync — if their queen slays the stage, they walk away with double points. 🎤` },
  { id:2,  emoji:"👑", name:"Main Stage Moment",                   rarity:"LEGENDARY", rarityColor:"#fbbf24", accent:"#d4af37", bg:"linear-gradient(160deg,#7a5800 0%,#180008 55%,#5a3d00 100%)", action:"self",   description:"Triple points if your queen wins the maxi challenge.",                                               logAction:(p)=>    `${p} is going for the crown — if their queen takes the maxi challenge win, they score triple points. 👑` },
  { id:3,  emoji:"💀", name:"The Shantay",                         rarity:"UNCOMMON",  rarityColor:"#4ade80", accent:"#9c27b0", bg:"linear-gradient(160deg,#4a1070 0%,#180008 55%,#2a0050 100%)", action:"self",   description:"If your queen lands in the bottom 2 but survives, you get bonus points instead of losing them.",       logAction:(p)=>    `${p} is playing it risky — if their queen lands in the bottom 2 but survives, they earn bonus points instead of taking an L. 💀` },
  { id:4,  emoji:"🔮", name:"Read for Filth",                      rarity:"RARE",      rarityColor:"#60a5fa", accent:"#1e88e5", bg:"linear-gradient(160deg,#0d3a7a 0%,#180008 55%,#0a2550 100%)", action:"target", description:"Steal 5 points from another player this episode.",           targetLabel:"Who are you reading?",         logAction:(p,t)=>  `${p} read ${t} to filth and snatched 5 points straight out of their pocket. The library is officially open. 🔮`, pointEffect:5 },
  { id:5,  emoji:"🌪️", name:"Snatch the Crown",                    rarity:"LEGENDARY", rarityColor:"#fbbf24", accent:"#43a047", bg:"linear-gradient(160deg,#1a4d20 0%,#180008 55%,#0f3015 100%)", action:"target", description:"Swap one of your queens with another player's queen for one episode.", targetLabel:"Whose queen are you snatching?", logAction:(p,t)=> `${p} snatched a queen right out of ${t}'s lineup for this episode. Their roster just got a glow-up — or a curse. 🌪️` },
  { id:6,  emoji:"⚡", name:"Werk Room Sabotage",                   rarity:"UNCOMMON",  rarityColor:"#4ade80", accent:"#e53935", bg:"linear-gradient(160deg,#7a1010 0%,#180008 55%,#500a0a 100%)", action:"target", description:"Force another player to skip playing their card this episode.", targetLabel:"Who are you sabotaging?",      logAction:(p,t)=>  `${p} snuck into the werk room and cut the power on ${t} — their card is blocked this episode. ⚡` },
  { id:7,  emoji:"🎭", name:"Safe Word",                            rarity:"COMMON",    rarityColor:"#94a3b8", accent:"#78909c", bg:"linear-gradient(160deg,#2a3540 0%,#180008 55%,#1a2530 100%)", action:"self",   description:"Protect your score from any negative points this week.",                                            logAction:(p)=>    `${p} called it — Safe Word activated. No negative points can touch them this episode. 🎭` },
  { id:8,  emoji:"🌟", name:"Charisma, Uniqueness, Nerve & Talent", rarity:"LEGENDARY", rarityColor:"#fbbf24", accent:"#e91e8c", bg:"linear-gradient(160deg,#7a0050 0%,#180008 55%,#500035 100%)", action:"self",   description:"Multiplies your total score by 1.5x for the episode.",                                               logAction:(p)=>    `${p} said C.U.N.T. and meant it — every point this episode is multiplied by 1.5x. 🌟` },
  { id:9,  emoji:"🪞", name:"Mirror Mirror",                        rarity:"LEGENDARY", rarityColor:"#fbbf24", accent:"#7c83ff", bg:"linear-gradient(160deg,#1a1a5e 0%,#180008 55%,#0d0d3d 100%)", action:"target", description:"Copy the card effect of another player this episode.", targetLabel:"Who are you mirroring?",          logAction:(p,t)=>  `${p} held up the mirror — whatever card ${t} plays this episode, ${p} gets the same effect. 🪞` },
  { id:10, emoji:"🍵", name:"Spill the Tea",                        rarity:"UNCOMMON",  rarityColor:"#4ade80", accent:"#ff8f00", bg:"linear-gradient(160deg,#5a3000 0%,#180008 55%,#3d1d00 100%)", action:"target", description:"Reveal another player's card to the entire group.",         targetLabel:"Whose tea are you spilling?",  logAction:(p,t)=>  `${p} spilled ALL of ${t}'s tea — their card hand is now public knowledge. 🍵` },
  { id:11, emoji:"💸", name:"Point Heist",                          rarity:"RARE",      rarityColor:"#60a5fa", accent:"#00bfa5", bg:"linear-gradient(160deg,#004d40 0%,#180008 55%,#00332a 100%)", action:"gamble", description:"Flip a coin — heads you gain 10 points, tails you lose 5.",                                          logAction:(p,_,r)=> r==="win" ? `${p} flipped heads and won +10 points. Fortune favors the delusional. 💸` : `${p} flipped tails and lost 5 points. The drag gods are not pleased. 💸` },
  { id:12, emoji:"🧿", name:"Evil Eye",                             rarity:"RARE",      rarityColor:"#60a5fa", accent:"#651fff", bg:"linear-gradient(160deg,#1a0050 0%,#180008 55%,#0d0033 100%)", action:"target", description:"Curse another player — their top queen earns zero points this episode.", targetLabel:"Who are you cursing?", logAction:(p,t)=> `${p} put the evil eye on ${t} — their top queen earns zero points this episode. Light a candle. 🧿` },
  { id:13, emoji:"🎀", name:"Gag Gift",                             rarity:"UNCOMMON",  rarityColor:"#4ade80", accent:"#f06292", bg:"linear-gradient(160deg,#6d1a3a 0%,#180008 55%,#4a0d25 100%)", action:"gift",   description:"Give another player a random card from the deck.", targetLabel:"Who's getting the gift?",               logAction:(p,t,_,g)=> `${p} handed ${t} a mystery card${g?` — it's ${g.emoji} ${g.name}`:""}. Chaotic? Absolutely. 🎀` },
  { id:14, emoji:"🪦", name:"The Dead Card",                        rarity:"CURSED",    rarityColor:"#a855f7", accent:"#6b21a8", bg:"linear-gradient(160deg,#111 0%,#180008 55%,#0a0a0a 100%)",    action:"self",   description:"You drew the dead card — no scoring and no card play for you this episode.",                           logAction:(p)=>    `${p} pulled the dead card. No scoring, no card play, no mercy. 🪦` },
  { id:15, emoji:"🔁", name:"Ru-Do-Over",                           rarity:"LEGENDARY", rarityColor:"#fbbf24", accent:"#ff6d00", bg:"linear-gradient(160deg,#4a2000 0%,#180008 55%,#301400 100%)", action:"self",   description:"Cancel the last card played by anyone in the game.",                                                 logAction:(p)=>    `${p} played the Ru-Do-Over — the last card in the log has been cancelled. Ru said so. 🔁` },
  { id:16, emoji:"💋", name:"The Lip Service",                      rarity:"RARE",      rarityColor:"#60a5fa", accent:"#e040fb", bg:"linear-gradient(160deg,#6d0060 0%,#180008 55%,#4a0040 100%)", action:"self",   description:"Award yourself 10 bonus points for sheer audacity. No conditions.", pointEffect:10,                     logAction:(p)=>    `${p} played Lip Service and awarded themselves 10 bonus points for sheer audacity alone. 💋` },
  { id:17, emoji:"🕵️", name:"The Undercover Queen",                 rarity:"UNCOMMON",  rarityColor:"#4ade80", accent:"#b0bec5", bg:"linear-gradient(160deg,#1a1a1a 0%,#180008 55%,#111 100%)",    action:"self",   description:"Your score is hidden from all other players until final scoring.",                                    logAction:(p)=>    `${p} went undercover — their score is now hidden from everyone until final scoring. 🕵️` },
  { id:18, emoji:"🎲", name:"Chaos Theory",                         rarity:"CURSED",    rarityColor:"#a855f7", accent:"#ff4081", bg:"linear-gradient(160deg,#3d0020 0%,#180008 55%,#280015 100%)", action:"chaos",  description:"A random card effect is applied to a random player — even you. Pure chaos.",                         logAction:(p,t,_,r)=> `${p} unleashed Chaos Theory — ${r?`${r.emoji} ${r.name}`:"a random effect"} was applied to ${t||"a random player"}. 🎲` },
  { id:19, emoji:"🫶", name:"Sisterhood Bonus",                     rarity:"COMMON",    rarityColor:"#94a3b8", accent:"#ff8a65", bg:"linear-gradient(160deg,#3d1a00 0%,#180008 55%,#281000 100%)", action:"target", description:"Give 5 points to another player AND earn 5 points yourself.", targetLabel:"Who are you sharing the love with?", pointEffect:5, logAction:(p,t)=> `${p} played Sisterhood Bonus — ${t} gets 5 points AND ${p} gets 5 points. Love is in the werk room. 🫶` },
  { id:20, emoji:"👠", name:"Stiletto Strike",                      rarity:"RARE",      rarityColor:"#60a5fa", accent:"#f50057", bg:"linear-gradient(160deg,#5a0a40 0%,#180008 55%,#3d0028 100%)", action:"target", description:"Reduce another player's score by 10 points this episode.", targetLabel:"Who are you striking?",        logAction:(p,t)=>  `${p} brought down the stiletto on ${t} — 10 points deducted from their score this episode. 👠` },
];

function ChaosCard({ card, revealed }) {
  const [mouse, setMouse] = useState({ x:0.5, y:0.5 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const onMM = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({ x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height });
  };
  const tiltX = hovered && revealed ? (mouse.y-0.5)*-10 : 0;
  const tiltY = hovered && revealed ? (mouse.x-0.5)*10  : 0;
  return (
    <div ref={ref} style={{ width:200, height:290, perspective:1100, flexShrink:0 }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setMouse({x:.5,y:.5});}} onMouseMove={onMM}>
      <div style={{ width:"100%", height:"100%", position:"relative", transformStyle:"preserve-3d",
        transition:"transform 0.7s cubic-bezier(0.25,1.3,0.5,1)",
        transform: revealed ? `rotateY(180deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${hovered?1.03:1})` : `rotateY(0deg) scale(${hovered?1.04:1})`,
        filter: hovered && !revealed ? "drop-shadow(0 0 18px rgba(245,200,66,0.4))" : "none" }}>
        {/* Back */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", borderRadius:14,
          background:"linear-gradient(160deg,#4d0012 0%,#220006 55%,#160003 100%)", border:`2px solid ${C.goldDark}66`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden",
          boxShadow:"0 10px 30px rgba(0,0,0,0.7)" }}>
          <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"repeating-linear-gradient(45deg,#f5c842 0,#f5c842 1px,transparent 1px,transparent 14px),repeating-linear-gradient(-45deg,#f5c842 0,#f5c842 1px,transparent 1px,transparent 14px)" }} />
          <div style={{ position:"absolute", inset:10, border:`1px solid ${C.goldDark}22`, borderRadius:8 }} />
          <div style={{ fontSize:36, marginBottom:10, filter:"drop-shadow(0 0 12px rgba(245,200,66,0.6))" }}>🎭</div>
          <div style={{ color:C.gold, fontSize:9, fontWeight:700, letterSpacing:3.5, textTransform:"uppercase", fontFamily:"'Cinzel',serif" }}>Cards of Chaos</div>
          <div style={{ position:"absolute", inset:0, borderRadius:14, pointerEvents:"none",
            background: hovered ? "linear-gradient(135deg,rgba(245,200,66,0.15) 0%,transparent 50%)" : "linear-gradient(135deg,rgba(245,200,66,0.06) 0%,transparent 55%)", transition:"background 0.3s" }} />
        </div>
        {/* Front */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
          transform:"rotateY(180deg)", borderRadius:14, background:card.bg, border:`2px solid ${C.goldDark}88`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between",
          padding:"14px 14px 12px", overflow:"hidden", boxShadow:"0 10px 30px rgba(0,0,0,0.7)" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"50%", pointerEvents:"none", background:`radial-gradient(ellipse at 50% -10%,${card.accent}50 0%,transparent 65%)` }} />
          <div style={{ position:"absolute", inset:8, border:`1px solid ${C.goldDark}22`, borderRadius:8, pointerEvents:"none" }} />
          <div style={{ alignSelf:"flex-end", zIndex:2 }}>
            <span style={{ background:"rgba(0,0,0,0.5)", border:`1px solid ${card.rarityColor}55`, borderRadius:20, padding:"2px 8px", fontSize:7, fontWeight:800, letterSpacing:2, color:card.rarityColor, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>{card.rarity}</span>
          </div>
          <div style={{ fontSize:44, lineHeight:1, zIndex:2, filter:`drop-shadow(0 0 14px ${card.accent}cc)` }}>{card.emoji}</div>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:C.offWhite, fontSize:card.name.length>22?11:13, textAlign:"center", lineHeight:1.3, zIndex:2, padding:"0 2px" }}>{card.name}</div>
          <div style={{ width:"70%", height:1, zIndex:2, background:`linear-gradient(90deg,transparent,${card.accent}aa,${C.goldDark}99,${card.accent}aa,transparent)` }} />
          <div style={{ color:"rgba(255,238,221,0.72)", fontSize:10, textAlign:"center", lineHeight:1.5, fontFamily:"'Lato',sans-serif", zIndex:2, padding:"0 2px" }}>{card.description}</div>
          <div style={{ position:"absolute", inset:0, borderRadius:14, pointerEvents:"none", opacity:hovered?0.35:0.08,
            background:`radial-gradient(circle at ${mouse.x*100}% ${mouse.y*100}%,rgba(255,255,255,0.6) 0%,transparent 50%),linear-gradient(125deg,#f5c842 0%,#e8407a 25%,#7c83ff 50%,#00bfa5 75%,#f5c842 100%)`,
            mixBlendMode:"overlay", transition:"opacity 0.25s" }} />
        </div>
      </div>
    </div>
  );
}

function ChaosPlayerPicker({ card, players, myId, onSelect, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(6px)" }}>
      <div style={{ background:`linear-gradient(160deg,${C.bgMid},${C.bgDeep})`, border:`1px solid ${C.goldDark}66`, borderRadius:16, padding:"28px 24px", maxWidth:380, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.9)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:10, background:card.bg, border:`1px solid ${C.goldDark}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{card.emoji}</div>
          <div>
            <div style={{ color:C.gold, fontSize:13, fontWeight:700, fontFamily:"'Cinzel',serif", marginBottom:2 }}>{card.name}</div>
            <div style={{ color:C.textMid, fontSize:11, fontFamily:"'Lato',sans-serif" }}>{card.targetLabel}</div>
          </div>
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.goldDark}44,transparent)`, marginBottom:16 }} />
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
          {players.filter(p=>p.id!==myId).map(p => (
            <button key={p.id} onClick={()=>onSelect(p)}
              style={{ background:`${C.bgDeep}88`, border:`1px solid ${C.bgLight}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.15s", fontFamily:"'Lato',sans-serif", textAlign:"left" }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${C.bgMid}cc`;e.currentTarget.style.borderColor=C.goldDark;}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${C.bgDeep}88`;e.currentTarget.style.borderColor=C.bgLight;}}>
              <div style={{ flex:1 }}>
                <div style={{ color:C.white, fontSize:13, fontWeight:700 }}>{p.name}</div>
                <div style={{ color:C.textDim, fontSize:11 }}>{p.points} pts · {p.queen||"No queen"}</div>
              </div>
              <span style={{ color:C.textDim, fontSize:16 }}>›</span>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{ ...S.ghost, width:"100%", textAlign:"center" }}>Cancel</button>
      </div>
    </div>
  );
}

function ChaosGambleModal({ onResult }) {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult]     = useState(null);
  const flip = () => {
    setFlipping(true);
    setTimeout(() => {
      const won = Math.random() > 0.5;
      setResult(won ? "win" : "lose");
      setFlipping(false);
    }, 1200);
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }}>
      <div style={{ background:`linear-gradient(160deg,#003d35,${C.bgDeep})`, border:"1px solid rgba(0,191,165,0.4)", borderRadius:16, padding:"32px 28px", maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 24px 80px rgba(0,0,0,0.9)" }}>
        <div style={{ fontSize:28, marginBottom:6 }}>💸</div>
        <div style={{ color:"#00bfa5", fontSize:16, fontWeight:700, fontFamily:"'Cinzel',serif", marginBottom:8 }}>Point Heist</div>
        <div style={{ color:C.textMid, fontSize:12, fontFamily:"'Lato',sans-serif", marginBottom:24, lineHeight:1.6 }}>Flip the coin. Heads = +10 pts. Tails = −5 pts.</div>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
          <div style={{ width:70, height:70, borderRadius:"50%",
            background: result==="win" ? "linear-gradient(135deg,#ffd700,#b8860b)" : result==="lose" ? "linear-gradient(135deg,#555,#333)" : "linear-gradient(135deg,#f5c842,#8B6914)",
            border:`3px solid ${C.goldDark}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30,
            boxShadow: result==="win" ? "0 0 28px rgba(255,215,0,0.7)" : "0 0 12px rgba(0,0,0,0.4)",
            animation: flipping ? "chaos-spin 1.2s ease" : "none" }}>
            {flipping ? "🌀" : result==="win" ? "👑" : result==="lose" ? "💀" : "🪙"}
          </div>
        </div>
        <style>{`@keyframes chaos-spin{0%{transform:rotateY(0)}50%{transform:rotateY(900deg) scale(1.2)}100%{transform:rotateY(1800deg)}}`}</style>
        {result && (
          <div style={{ marginBottom:20 }}>
            <div style={{ color:result==="win"?"#ffd700":"#ef5350", fontSize:15, fontWeight:700, fontFamily:"'Cinzel',serif", marginBottom:4 }}>
              {result==="win" ? "HEADS! +10 points!" : "TAILS! −5 points."}
            </div>
            <div style={{ color:C.textDim, fontSize:11, fontFamily:"'Lato',sans-serif" }}>
              {result==="win" ? "Fortune favors the delusional, darling." : "The drag gods are displeased."}
            </div>
          </div>
        )}
        {!result && <button onClick={flip} disabled={flipping} style={{ ...S.goldBtn, width:"100%", opacity:flipping?.6:1 }}>{flipping?"Flipping…":"🪙 Flip the Coin"}</button>}
        {result  && <button onClick={()=>onResult(result)} style={{ ...S.goldBtn, width:"100%" }}>{result==="win"?"✨ Collect Winnings":"😤 Accept Fate"}</button>}
      </div>
    </div>
  );
}

function ChaosTab({ room, myId, me, isHost, onUpdateRoom }) {
  const chaosState  = room.chaos || {};
  const myState     = chaosState[myId] || { drawsLeft: MAX_DRAWS, points: me?.points || 0, usedIds:[], log:[] };
  const myDraws     = myState.drawsLeft ?? MAX_DRAWS;
  const myPts       = myState.points   ?? (me?.points || 0);
  const myUsedIds   = myState.usedIds  || [];
  const chaosLog    = chaosState.log   || [];
  const [phase, setPhase]       = useState("idle");
  const [drawnCard, setDrawnCard] = useState(null);
  const [glitter, setGlitter]   = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [gambleOpen, setGambleOpen]   = useState(false);
  const [flash, setFlash]             = useState(null);

  const available   = CHAOS_CARDS.filter(c => !myUsedIds.includes(c.id));
  const canAfford   = myPts >= CARD_COST;
  const canDraw     = canAfford && myDraws > 0;
  const isDrawPhase = phase === "flipping" || phase === "revealed";
  const otherPlayers = (room.players || []).filter(p => p.id !== myId);

  function saveChaosPatch(patch) {
    onUpdateRoom(r => ({ ...r, chaos: { ...(r.chaos||{}), ...patch } }));
  }

  function flashPoints(amt) {
    setFlash(amt > 0 ? `+${amt}` : `${amt}`);
    const newPts = myPts + amt;
    saveChaosPatch({ [myId]: { ...myState, points: newPts } });
    setTimeout(() => setFlash(null), 1800);
  }

  function handleShuffle() {
    if (!canDraw) return;
    setPhase("shuffling");
    setTimeout(() => setPhase("ready"), 700);
  }

  function handleDraw() {
    if (!canDraw) return;
    const card = available[Math.floor(Math.random() * available.length)];
    setDrawnCard(card);
    const newDraws = myDraws - 1;
    const newPts   = myPts - CARD_COST;
    setFlash(`−${CARD_COST}`);
    setTimeout(() => setFlash(null), 1800);
    saveChaosPatch({ [myId]: { ...myState, drawsLeft: newDraws, points: newPts } });
    setPhase("flipping");
    setTimeout(() => {
      setPhase("revealed");
      setTimeout(() => setGlitter(true), 60);
      setTimeout(() => setGlitter(false), 900);
    }, 720);
  }

  function handlePlayCard() {
    if (!drawnCard) return;
    if (drawnCard.action === "target" || drawnCard.action === "gift") { setPickerOpen(true); return; }
    if (drawnCard.action === "gamble") { setGambleOpen(true); return; }
    if (drawnCard.action === "chaos")  { handleChaosAction(); return; }
    commitPlay(drawnCard, null);
  }

  function handleSelectTarget(player) {
    setPickerOpen(false);
    if (drawnCard.action === "gift") {
      const pool = CHAOS_CARDS.filter(c => c.id !== drawnCard.id);
      const giftCard = pool[Math.floor(Math.random() * pool.length)];
      commitPlay(drawnCard, player, null, giftCard);
    } else {
      if (drawnCard.pointEffect) flashPoints(drawnCard.pointEffect);
      commitPlay(drawnCard, player);
    }
  }

  function handleGambleResult(result) {
    setGambleOpen(false);
    if (result === "win") flashPoints(+10);
    else                  flashPoints(-5);
    commitPlay(drawnCard, null, result);
  }

  function handleChaosAction() {
    const randomCard   = CHAOS_CARDS[Math.floor(Math.random() * CHAOS_CARDS.length)];
    const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    commitPlay(drawnCard, randomPlayer, null, randomCard);
  }

  function commitPlay(card, target, gamblerResult=null, extraCard=null) {
    if (card.pointEffect && card.action === "self") flashPoints(card.pointEffect);
    if (card.id === 15) {
      // Ru-Do-Over: remove last log entry
      const newLog = [...chaosLog].slice(1);
      saveChaosPatch({ log: newLog });
    }
    const time = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const entry = { id: Date.now().toString(), playerName: me?.name || "You", card, target: target ? { name: target.name } : null, gamblerResult, extraCard: extraCard || null, episode: room.episodes?.length + 1 || 1, time };
    const newLog = [entry, ...chaosLog];
    const newUsed = [...myUsedIds, card.id];
    saveChaosPatch({ [myId]: { ...myState, usedIds: newUsed }, log: newLog });
    setDrawnCard(null);
    setGlitter(false);
    setPhase("idle");
  }

  const palGold = C.gold;
  const font = "'Cinzel',serif";

  return (
    <div className="fade">
      <style>{`
        @keyframes chaos-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chaos-deck-shake{0%{transform:rotate(0)}20%{transform:rotate(-4deg) translateX(-8px)}40%{transform:rotate(4deg) translateX(8px)}60%{transform:rotate(-2deg)}80%{transform:rotate(2deg)}100%{transform:rotate(0)}}
        @keyframes chaos-btn-pulse{0%,100%{box-shadow:0 4px 16px rgba(245,200,66,0.25)}50%{box-shadow:0 4px 24px rgba(245,200,66,0.5)}}
      `}</style>

      {pickerOpen && drawnCard && <ChaosPlayerPicker card={drawnCard} players={room.players} myId={myId} onSelect={handleSelectTarget} onCancel={()=>setPickerOpen(false)} />}
      {gambleOpen && <ChaosGambleModal onResult={handleGambleResult} />}

      <SecTitle>Cards of Chaos</SecTitle>
      <p style={{ color:C.textMid, fontSize:12, marginBottom:20, fontFamily:"'Lato',sans-serif", lineHeight:1.6 }}>
        Spend {CARD_COST} pts to draw a card. You get {MAX_DRAWS} draws per season. Target cards let you affect other players. Pure chaos guaranteed.
      </p>

      {/* Balance bar */}
      <div className="card" style={{ padding:"12px 16px", marginBottom:18, display:"flex", gap:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <StatBox label="Your Balance" value={`${myPts} pts`} gold />
          {flash && (
            <div style={{ position:"absolute", top:-24, left:"50%", transform:"translateX(-50%)", color: flash.startsWith("+")?"#4ade80":"#ef5350", fontSize:15, fontWeight:800, fontFamily:font, whiteSpace:"nowrap", animation:"chaos-fade-up 1.8s ease forwards", pointerEvents:"none" }}>{flash}</div>
          )}
        </div>
        <StatBox label="Draws Left"   value={`${myDraws} / ${MAX_DRAWS}`} />
        <StatBox label="Card Cost"    value={`${CARD_COST} pts`} />
        <StatBox label="Cards Played" value={myUsedIds.length} />
      </div>

      {/* Warnings */}
      {myDraws === 0 && !isDrawPhase && (
        <div className="card" style={{ padding:"12px 16px", marginBottom:16, border:`1px solid ${C.red}44`, textAlign:"center" }}>
          <div style={{ color:C.pinkLight, fontSize:13, fontWeight:700, fontFamily:font }}>🚫 No draws remaining this season</div>
          <div style={{ color:C.textDim, fontSize:11, marginTop:4, fontFamily:"'Lato',sans-serif" }}>You've used both draws. See you next season!</div>
        </div>
      )}
      {myDraws > 0 && !canAfford && !isDrawPhase && (
        <div className="card" style={{ padding:"12px 16px", marginBottom:16, border:`1px solid ${C.red}44`, textAlign:"center" }}>
          <div style={{ color:C.pinkLight, fontSize:13, fontWeight:700, fontFamily:font }}>💸 Not enough points to draw</div>
          <div style={{ color:C.textDim, fontSize:11, marginTop:4, fontFamily:"'Lato',sans-serif" }}>You need {CARD_COST} pts — earn more by scoring this episode.</div>
        </div>
      )}

      {/* Deck + buttons */}
      {!isDrawPhase && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:22, marginBottom:32, animation:"chaos-fade-up 0.4s ease" }}>
          <div style={{ position:"relative", animation: phase==="shuffling" ? "chaos-deck-shake 0.7s ease" : "none" }}>
            {[3,2,1].map(i => (
              <div key={i} style={{ position:"absolute", inset:0, borderRadius:14, background:"linear-gradient(160deg,#4d0012,#160003)", border:`2px solid ${C.goldDark}22`, transform:`translate(${i*3}px,${i*3}px)`, zIndex:-i }} />
            ))}
            <div onClick={()=>{ if(phase==="ready"&&canDraw) handleDraw(); }} style={{ cursor: phase==="ready"&&canDraw ? "pointer" : "default" }}>
              <ChaosCard card={CHAOS_CARDS[0]} revealed={false} />
            </div>
            {phase !== "ready" && (
              <div style={{ position:"absolute", inset:0, borderRadius:14, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                <span style={{ color:`${palGold}55`, fontSize:9, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>{phase==="shuffling"?"Shuffling…":"Shuffle first"}</span>
              </div>
            )}
            {phase==="ready" && canDraw && (
              <div style={{ position:"absolute", inset:0, borderRadius:14, display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:12, pointerEvents:"none" }}>
                <span style={{ color:`${palGold}88`, fontSize:9, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Lato',sans-serif", background:"rgba(0,0,0,0.5)", padding:"2px 10px", borderRadius:20, border:`1px solid ${C.goldDark}33` }}>tap to draw</span>
              </div>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12, width:240 }}>
            {!canDraw ? (
              <div style={{ background:`${C.bgDeep}88`, border:`1px solid ${C.bgLight}`, color:C.textDim, borderRadius:8, padding:"13px", textAlign:"center", fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:font }}>
                🔒 {myDraws===0?"No Draws Left":"Not Enough Points"}
              </div>
            ) : phase !== "ready" ? (
              <button onClick={handleShuffle} disabled={phase==="shuffling"} style={{ ...S.goldBtn, animation:"chaos-btn-pulse 2.5s ease-in-out infinite", opacity:phase==="shuffling"?.7:1 }}>
                🔀 Shuffle the Deck
              </button>
            ) : (
              <button onClick={handleDraw} style={{ ...S.redBtn }}>
                🃏 Draw Your Card · {CARD_COST} pts
              </button>
            )}
          </div>
          <div style={{ color:C.textDim, fontSize:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
            {available.length} of {CHAOS_CARDS.length} cards remaining
          </div>
        </div>
      )}

      {/* Drawn card */}
      {isDrawPhase && drawnCard && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, marginBottom:32, animation:"chaos-fade-up 0.4s ease" }}>
          <div style={{ color:palGold, fontSize:10, letterSpacing:5, textTransform:"uppercase", fontFamily:font, opacity:phase==="revealed"?1:0, transition:"opacity 0.5s 0.3s" }}>✦ You Drew ✦</div>
          <ChaosCard card={drawnCard} revealed={phase==="revealed"} />
          {phase==="revealed" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, width:240, animation:"chaos-fade-up 0.4s ease 0.2s both" }}>
              {(drawnCard.action==="target"||drawnCard.action==="gift") && (
                <div style={{ textAlign:"center", color:C.textMid, fontSize:11, fontFamily:"'Lato',sans-serif" }}>🎯 {drawnCard.targetLabel}</div>
              )}
              <button onClick={handlePlayCard} style={{
                ...(drawnCard.action==="self" ? S.goldBtn : S.redBtn),
              }}>
                {drawnCard.action==="target"||drawnCard.action==="gift" ? "🎯 Choose Your Target"
                  : drawnCard.action==="gamble" ? "🪙 Flip the Coin"
                  : drawnCard.action==="chaos"  ? "🎲 Unleash the Chaos"
                  : "✨ Play This Card"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chaos Log */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.bgLight})` }} />
          <div style={{ color:palGold, fontSize:10, letterSpacing:4, textTransform:"uppercase", fontFamily:font, whiteSpace:"nowrap" }}>✦ Chaos Log ✦</div>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.bgLight},transparent)` }} />
        </div>
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <span style={{ background:`${C.goldDark}18`, border:`1px solid ${C.goldDark}33`, borderRadius:20, padding:"3px 14px", color:C.textDim, fontSize:9, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Lato',sans-serif" }}>
            Episode {(room.episodes?.length||0)+1} · Active
          </span>
        </div>
        {chaosLog.length === 0 ? (
          <div className="card" style={{ padding:"28px 20px", textAlign:"center", border:`1px dashed ${C.bgLight}` }}>
            <div style={{ color:C.textDim, fontSize:12, fontStyle:"italic", fontFamily:"'Lato',sans-serif" }}>
              No cards played yet.<br /><span style={{ fontSize:10 }}>Be the first to unleash chaos.</span>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {chaosLog.map((entry, i) => (
              <div key={entry.id} className="card" style={{ padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:12, animation:`chaos-fade-up 0.3s ease ${i*0.05}s both` }}>
                <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background:entry.card.bg, border:`1px solid ${entry.card.accent}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{entry.card.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ color:entry.card.accent, fontWeight:700, fontFamily:font, fontSize:12 }}>{entry.card.name}</span>
                    <span style={{ color:C.textDim, fontSize:10 }}>·</span>
                    <span style={{ color:palGold, fontWeight:700, fontFamily:"'Lato',sans-serif", fontSize:11 }}>{entry.playerName}</span>
                  </div>
                  <div style={{ color:C.textMid, fontSize:11, lineHeight:1.5, fontFamily:"'Lato',sans-serif" }}>
                    {entry.card.logAction(entry.playerName, entry.target?.name, entry.gamblerResult, entry.extraCard)}
                  </div>
                  <div style={{ color:C.textDim, fontSize:10, marginTop:4, fontFamily:"'Lato',sans-serif" }}>Ep {entry.episode} · {entry.time}</div>
                </div>
                <span style={{ fontSize:7, fontWeight:800, letterSpacing:2, color:entry.card.rarityColor, background:`${entry.card.rarityColor}18`, border:`1px solid ${entry.card.rarityColor}33`, borderRadius:20, padding:"2px 6px", textTransform:"uppercase", flexShrink:0, alignSelf:"center" }}>{entry.card.rarity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div style={{ textAlign:"center", marginBottom:showGallery?24:0 }}>
        <button onClick={()=>setShowGallery(v=>!v)} style={{ ...S.ghost, fontSize:11 }}>
          {showGallery?"▲ Hide Full Deck":"▼ View Full Deck"}
        </button>
      </div>
      {showGallery && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center", animation:"chaos-fade-up 0.4s ease" }}>
          {CHAOS_CARDS.map((card,i) => (
            <div key={card.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, animation:`chaos-fade-up 0.3s ease ${i*0.05}s both` }}>
              <ChaosCard card={card} revealed={true} />
              {card.action!=="self"&&card.action!=="gamble"&&card.action!=="chaos" && (
                <span style={{ background:`${C.pink}18`, border:`1px solid ${C.pink}44`, borderRadius:20, padding:"2px 8px", color:C.pinkLight, fontSize:8, letterSpacing:2, textTransform:"uppercase" }}>🎯 Targets Others</span>
              )}
              {myUsedIds.includes(card.id) && (
                <span style={{ color:C.textDim, fontSize:8, letterSpacing:2, textTransform:"uppercase" }}>— Played —</span>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop:40, color:C.textDim, fontSize:9, letterSpacing:2, textTransform:"uppercase", textAlign:"center", fontFamily:"'Lato',sans-serif" }}>
        ✦ {MAX_DRAWS} draws per season · {CARD_COST} pts per draw · May the best queen win ✦
      </p>
    </div>
  );
}

function TootVote({ poll, myId, onVote }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {(poll.options||[]).map(q => {
        const myV  = poll.tootVotes?.[`${myId}_${q}`];
        const img  = poll.images?.[q];
        const tots = poll.closed ? Object.entries(poll.tootVotes||{}).filter(([k,v]) => k.endsWith(`_${q}`) && v==="toot").length : null;
        const boos = poll.closed ? Object.entries(poll.tootVotes||{}).filter(([k,v]) => k.endsWith(`_${q}`) && v==="boot").length : null;
        return (
          <div key={q} style={{ background:`${C.bgDeep}88`, border:`1px solid ${C.bgLight}`, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:12 }}>
            {img
              ? <img src={img} alt={q} style={{ width:54, height:54, borderRadius:10, objectFit:"cover", flexShrink:0, border:`1px solid ${C.gold}44` }} />
              : <div style={{ width:54, height:54, borderRadius:10, background:C.bgMid, border:`1px solid ${C.bgLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>👸</div>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:C.white, fontWeight:700, fontSize:14, marginBottom:7, fontFamily:"'Lato',sans-serif" }}>{q}</div>
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={() => !poll.closed && onVote(poll.id, q, "toot")}
                  style={{ flex:1, background: myV==="toot" ? "#006b30aa" : `${C.bgDeep}88`, border:`2px solid ${myV==="toot" ? "#00c870" : "#1e4030"}`, borderRadius:20, padding:"7px 0", color: myV==="toot" ? "#00f080" : "#00a050", fontWeight:700, cursor: poll.closed?"default":"pointer", fontSize:13, fontFamily:"'Lato',sans-serif" }}>
                  👢 TOOT{poll.closed ? ` (${tots})` : myV==="toot" ? " ✓" : ""}
                </button>
                <button onClick={() => !poll.closed && onVote(poll.id, q, "boot")}
                  style={{ flex:1, background: myV==="boot" ? `${C.red}aa` : `${C.bgDeep}88`, border:`2px solid ${myV==="boot" ? C.red : "#401020"}`, borderRadius:20, padding:"7px 0", color: myV==="boot" ? C.white : C.pinkLight, fontWeight:700, cursor: poll.closed?"default":"pointer", fontSize:13, fontFamily:"'Lato',sans-serif" }}>
                  🥾 BOOT{poll.closed ? ` (${boos})` : myV==="boot" ? " ✓" : ""}
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {!poll.closed && <p style={{ color:C.textDim, fontSize:12, marginTop:2 }}>Tap Toot 👢 or Boot 🥾 for each queen</p>}
    </div>
  );
}

// ─── Tiny shared UI helpers ───────────────────────────────────────────────────
function SecTitle({ children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:22, fontWeight:700, color:C.white }}>{children}</h2>
      <div className="divider" />
    </div>
  );
}
function FL({ children }) {
  return <div style={{ color:C.pinkLight, fontWeight:600, fontSize:13, marginBottom:8, fontFamily:"'Lato',sans-serif" }}>{children}</div>;
}
function StatBox({ label, value, gold }) {
  return (
    <div>
      <div style={{ color:C.textDim, fontSize:10, letterSpacing:1, fontFamily:"'Lato',sans-serif" }}>{label.toUpperCase()}</div>
      {gold
        ? <div className="gold-text" style={{ fontWeight:900, fontSize:18 }}>{value}</div>
        : <div style={{ color:C.white, fontWeight:900, fontSize:18, fontFamily:"'Cinzel',serif" }}>{value}</div>}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const S = {
  input: { padding:"12px 14px", borderRadius:10, border:`1px solid ${C.bgLight}`, background:`${C.bgDeep}cc`, color:C.white, fontSize:15, outline:"none", width:"100%", display:"block", fontFamily:"'Lato',sans-serif" },
  goldBtn: { background:`linear-gradient(135deg,${C.goldDark},${C.gold},${C.roseLight})`, color:"#1a0008", border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:.5, boxShadow:`0 3px 20px ${C.gold}44`, fontFamily:"'Cinzel',serif" },
  redBtn:  { background:`linear-gradient(135deg,${C.crimson},${C.red},${C.pink})`, color:C.white, border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:.3, boxShadow:`0 3px 20px ${C.red}44`, fontFamily:"'Lato',sans-serif" },
  ghost:   { background:"none", border:`1px solid ${C.bgLight}`, color:C.textMid, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontFamily:"'Lato',sans-serif" },
  h2:      { fontFamily:"'Cinzel',serif", color:C.white, fontSize:28, marginBottom:8 },
};