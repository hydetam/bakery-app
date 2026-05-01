import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCqrfu4bNhve0FBL27x3CCascgpgUzf4B4",
  authDomain: "bakery-app-50527.firebaseapp.com",
  projectId: "bakery-app-50527",
  storageBucket: "bakery-app-50527.firebasestorage.app",
  messagingSenderId: "398592218692",
  appId: "1:398592218692:web:71cc0d824944df252f8e11"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

async function dbLoad(key, fallback) {
  try {
    const snap = await getDoc(doc(db, "bakery", key));
    return snap.exists() ? snap.data().value : fallback;
  } catch { return fallback; }
}
async function dbSave(key, val) {
  try { await setDoc(doc(db, "bakery", key), { value: val }); } catch (e) { console.error(e); }
}

const REC_KEY = "recipes";
const CAT_KEY = "categories";
const DEFAULT_CATS = ["麵包", "蛋糕", "酥皮", "餅乾", "泡芙"];
const ADMIN_PASSWORD = "350350";
const UNITS = ["g", "kg", "ml", "L", "茶匙", "湯匙", "顆", "片", "適量"];

function fmt(n) { if (isNaN(n)) return "—"; return n % 1 === 0 ? String(n) : n.toFixed(1); }
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function emptyRecipe(cats) {
  return { id: newId(), category: cats[0]||"麵包", name: "", mode: "fixed", pieceWeight: "", baseQty: 1, baseUnit: "顆", wastePct: 0, ingredients: [{ id: newId(), name: "", amount: "", unit: "g", pct: "" }], subRecipes: [], steps: [{text:"",img:""}], notes: "" };
}

function emptySubRecipe() {
  return { id: newId(), name: "", mode: "fixed", pieceWeight: "", wastePct: 0, isDefault: false, selectionType: "optional", ingredients: [{ id: newId(), name: "", amount: "", unit: "g", pct: "" }] };
}

const P = { bg:"#faf6f0", card:"#ffffff", border:"rgba(180,140,80,0.22)", gold:"#b5813a", goldLight:"#8a5e1e", goldDim:"rgba(181,129,58,0.1)", muted:"#a08060", text:"#2d1f0e", soft:"#5a3e22", red:"#c0392b", redDim:"rgba(192,57,43,0.1)" };
const iCss = { width:"100%", background:"#fff", border:`1px solid ${P.border}`, borderRadius:8, color:P.text, padding:"9px 12px", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", boxShadow:"inset 0 1px 3px rgba(0,0,0,0.04)" };
const lCss = { display:"block", fontSize:10, letterSpacing:".22em", color:P.gold, textTransform:"uppercase", marginBottom:6 };

const Btn = ({ v="p", onClick, children, style={} }) => (
  <button onClick={onClick} style={{ padding:v==="p"?"11px 22px":"8px 16px", background:v==="p"?`linear-gradient(135deg,${P.gold},#9a6a10)`:"rgba(255,255,255,0.05)", border:v==="p"?"none":`1px solid ${P.border}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit", color:v==="p"?"#120e00":P.soft, fontSize:v==="p"?14:13, fontWeight:v==="p"?700:400, letterSpacing:".06em", transition:"all .18s", ...style }}>{children}</button>
);

export default function App() {
  const [tab, setTab] = useState("calc");
  const [recipes, setRecipes] = useState([]);
  const [cats, setCats] = useState(DEFAULT_CATS);
  const [ready, setReady] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([dbLoad(REC_KEY,[]), dbLoad(CAT_KEY,DEFAULT_CATS)])
      .then(([r,c]) => { setRecipes(r); setCats(c); setReady(true); });
  }, []);

  const saveRec = useCallback(async r => { setRecipes(r); setSaving(true); await dbSave(REC_KEY,r); setSaving(false); },[]);
  const saveCat = useCallback(async c => { setCats(c); setSaving(true); await dbSave(CAT_KEY,c); setSaving(false); },[]);

  const submitPw = () => {
    if (pwInput===ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(false); setPwInput(""); }
    else { setPwError(true); setPwInput(""); }
  };
  const lockAdmin = () => { setAdminUnlocked(false); setTab("calc"); };

  return (
    <div style={{ minHeight:"100vh", background:P.bg, color:P.text, fontFamily:"'Noto Serif TC','Georgia',serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;600;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box} input::placeholder,textarea::placeholder{color:${P.muted}} select option{background:#ffffff;color:#2d1f0e} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${P.muted};border-radius:4px} @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu .28s ease both} input[type=number]::-webkit-inner-spin-button{opacity:.35} @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}} .shake{animation:shake .35s ease}`}</style>

      <nav style={{ position:"sticky",top:0,zIndex:100,height:52,background:"rgba(250,246,240,0.96)",backdropFilter:"blur(14px)",borderBottom:`1px solid ${P.border}`,boxShadow:"0 1px 8px rgba(180,140,80,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px" }}>
        <span style={{ fontSize:15,fontWeight:700,color:P.goldLight,letterSpacing:".08em" }}>⚖️ 配方計算機</span>
        <div style={{ display:"flex",gap:2,alignItems:"center" }}>
          {saving&&<span style={{fontSize:11,color:P.muted,marginRight:8}}>儲存中…</span>}
          <button onClick={()=>setTab("calc")} style={{ padding:"6px 14px",border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:12,background:tab==="calc"?P.gold:"transparent",color:tab==="calc"?"#120e00":P.muted,fontWeight:tab==="calc"?700:400,transition:"all .18s" }}>計算機</button>
          <button onClick={()=>setTab("admin")} style={{ padding:"6px 14px",border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:12,background:tab==="admin"?P.gold:"transparent",color:tab==="admin"?"#120e00":P.muted,fontWeight:tab==="admin"?700:400,transition:"all .18s" }}>{adminUnlocked?"食譜後台":"食譜後台 🔒"}</button>
          {adminUnlocked&&tab==="admin"&&<button onClick={lockAdmin} style={{ marginLeft:4,padding:"4px 10px",border:`1px solid ${P.border}`,borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:11,background:"transparent",color:P.muted }}>登出</button>}
        </div>
      </nav>

      {!ready
        ? <div style={{textAlign:"center",padding:80,color:P.muted}}>連線中…</div>
        : tab==="calc" ? <CalcView recipes={recipes}/>
        : adminUnlocked ? <AdminView recipes={recipes} cats={cats} save={saveRec} saveCat={saveCat}/>
        : <PasswordScreen input={pwInput} setInput={setPwInput} error={pwError} onSubmit={submitPw} onCancel={()=>setTab("calc")}/>
      }
    </div>
  );
}

function PasswordScreen({ input, setInput, error, onSubmit, onCancel }) {
  return (
    <div style={{ maxWidth:360,margin:"80px auto",padding:"0 20px",textAlign:"center" }}>
      <div style={{ fontSize:36,marginBottom:16 }}>🔒</div>
      <h2 style={{ margin:"0 0 6px",fontSize:20,fontWeight:700,color:P.goldLight }}>配方後台</h2>
      <p style={{ color:P.muted,fontSize:13,marginBottom:28 }}>請輸入管理員密碼</p>
      <div className={error?"shake":""} style={{ marginBottom:12 }}>
        <input type="password" style={{ ...iCss,fontSize:18,textAlign:"center",letterSpacing:".2em",borderColor:error?P.red:P.border }} placeholder="••••••••" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSubmit()} autoFocus/>
        {error&&<div style={{ color:P.red,fontSize:12,marginTop:8 }}>密碼錯誤，請再試一次</div>}
      </div>
      <div style={{ display:"flex",gap:8 }}>
        <Btn v="s" onClick={onCancel} style={{ flex:1 }}>取消</Btn>
        <Btn v="p" onClick={onSubmit} style={{ flex:1 }}>進入後台</Btn>
      </div>
    </div>
  );
}

function CalcView({ recipes }) {
  const [cat, setCat] = useState("");
  const [rid, setRid] = useState("");
  const [qty, setQty] = useState("");
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedMultiIds, setSelectedMultiIds] = useState(new Set());
  const [result, setResult] = useState(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const allCats = [...new Set(recipes.map(r=>r.category))];
  const filtered = recipes.filter(r=>r.category===cat);
  const sel = recipes.find(r=>r.id===rid);

  function calcRows(mode, ingredients, pieceWeight, baseQty, n, waste) {
    if (mode==="fixed") {
      const ratio=n/(baseQty||1)*waste;
      return ingredients.filter(i=>i.name).map(i=>({ name:i.name, base:i.unit==="適量"?"適量":(i.amount?`${i.amount} ${i.unit}`:"—"), result:i.unit==="適量"?"適量":(isNaN(parseFloat(i.amount))?"—":`${fmt(parseFloat(i.amount)*ratio)} ${i.unit}`) }));
    } else if (mode==="total") {
      const totalG=(parseFloat(pieceWeight)||0)*n*waste;
      return ingredients.filter(i=>i.name).map(i=>{const p=parseFloat(i.pct);return{name:i.name,base:`${isNaN(p)?"—":p}%`,result:i.unit==="適量"?"適量":(isNaN(p)?"—":`${fmt(totalG*p/100)} g`)};});
    } else {
      const totalDough=(parseFloat(pieceWeight)||0)*n*waste;
      const pctSum=ingredients.filter(i=>i.name).reduce((a,i)=>{const p=parseFloat(i.pct);return a+(isNaN(p)?0:p);},0);
      const flourG=pctSum>0?totalDough*100/pctSum:0;
      return ingredients.filter(i=>i.name).map(i=>{const p=parseFloat(i.pct);const g=isNaN(p)?null:flourG*p/100;return{name:i.name,base:`${isNaN(p)?"—":p}%`,result:i.unit==="適量"?"適量":(g===null?"—":`${fmt(g)} g`)};});
    }
  }

  function calculate() {
    if (!sel||!qty||parseFloat(qty)<=0) return;
    const n=parseFloat(qty), waste=1+(parseFloat(sel.wastePct)||0)/100;
    const rows=calcRows(sel.mode,sel.ingredients,sel.pieceWeight,sel.baseQty,n,waste);
    // calc selected sub-recipe
    const subResults=[];
    if (selectedSubId) {
      const sub=(sel.subRecipes||[]).find(s=>s.id===selectedSubId);
      if (sub) { const sw=1+(parseFloat(sub.wastePct)||0)/100; subResults.push({name:sub.name||"配料",rows:calcRows(sub.mode,sub.ingredients,sub.pieceWeight||sel.pieceWeight,sel.baseQty,n,sw)}); }
    }
    selectedMultiIds.forEach(sid=>{
      const sub=(sel.subRecipes||[]).find(s=>s.id===sid);
      if (sub) { const sw=1+(parseFloat(sub.wastePct)||0)/100; subResults.push({name:sub.name||"配料",rows:calcRows(sub.mode,sub.ingredients,sub.pieceWeight||sel.pieceWeight,sel.baseQty,n,sw)}); }
    });
    setResult({sel,qty:n,rows,waste,wastePct:sel.wastePct,subResults}); setStepsOpen(false);
  }

  const modeTag={fixed:"固定克數",total:"總量比例",baker:"烘焙師%"};
  return (
    <div style={{maxWidth:540,margin:"0 auto",padding:"36px 18px 80px"}}>
      <PageHeader sub="選擇配方開始計算" title="配方計算機"/>
      {recipes.length===0?<Empty icon="📋" text="尚無食譜" sub="請先至「食譜後台」建立食譜"/>:<>
        <CStep n={1} label="選擇類型"><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{allCats.map(c=><Chip key={c} on={cat===c} onClick={()=>{setCat(c);setRid("");setQty("");setResult(null);}}>{c}</Chip>)}</div></CStep>
        {cat&&<CStep n={2} label="選擇品項" cls="fu">
          {filtered.length===0?<div style={{color:P.muted,fontSize:13}}>此類型尚無食譜</div>
            :<div style={{display:"flex",flexDirection:"column",gap:7}}>{filtered.map(r=>(
              <button key={r.id} onClick={()=>{const defSub=(r.subRecipes||[]).find(s=>s.isDefault&&s.selectionType!=="multi"); const defMulti=new Set((r.subRecipes||[]).filter(s=>s.isDefault&&s.selectionType==="multi").map(s=>s.id)); setRid(r.id);setQty("");setSelectedSubId(defSub?defSub.id:null);setSelectedMultiIds(defMulti);setResult(null);}} style={{padding:"11px 15px",borderRadius:10,textAlign:"left",fontFamily:"inherit",cursor:"pointer",border:`1px solid ${rid===r.id?P.gold:P.border}`,background:rid===r.id?P.goldDim:"rgba(255,255,255,0.02)",color:P.text,fontSize:14,display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .18s"}}>
                <span style={{fontWeight:rid===r.id?600:400}}>{r.name}</span>
                <span style={{fontSize:10,color:P.muted,background:"rgba(255,255,255,0.06)",padding:"2px 8px",borderRadius:100}}>{modeTag[r.mode]}</span>
              </button>
            ))}</div>}
        </CStep>}
        {sel&&(()=>{
          const reqSubs=(sel.subRecipes||[]).filter(s=>s.selectionType==="required");
          const optSubs=(sel.subRecipes||[]).filter(s=>!s.selectionType||s.selectionType==="optional");
          const multiSubs=(sel.subRecipes||[]).filter(s=>s.selectionType==="multi");
          return(<>
            {reqSubs.length>0&&<CStep n={3} label="必選配料（請選一項）" cls="fu">
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {reqSubs.map(sub=>(
                  <button key={sub.id} onClick={()=>setSelectedSubId(sub.id)} style={{padding:"7px 14px",borderRadius:100,fontSize:13,border:`1px solid ${selectedSubId===sub.id?P.gold:P.border}`,background:selectedSubId===sub.id?P.goldDim:"transparent",color:selectedSubId===sub.id?P.gold:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>
                    {sub.isDefault?"★ ":""}{sub.name||"配料"}
                  </button>
                ))}
              </div>
              {!selectedSubId&&reqSubs.length>0&&<div style={{fontSize:11,color:P.red,marginTop:6}}>⚠ 請選擇一項</div>}
            </CStep>}
            {optSubs.length>0&&<CStep n={3+(reqSubs.length>0?1:0)} label="配料（可選）" cls="fu">
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                <button onClick={()=>setSelectedSubId(null)} style={{padding:"7px 14px",borderRadius:100,fontSize:13,border:`1px solid ${selectedSubId===null?P.gold:P.border}`,background:selectedSubId===null?P.goldDim:"transparent",color:selectedSubId===null?P.gold:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>不需要</button>
                {optSubs.map(sub=>(
                  <button key={sub.id} onClick={()=>setSelectedSubId(sub.id)} style={{padding:"7px 14px",borderRadius:100,fontSize:13,border:`1px solid ${selectedSubId===sub.id?P.gold:P.border}`,background:selectedSubId===sub.id?P.goldDim:"transparent",color:selectedSubId===sub.id?P.gold:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>
                    {sub.isDefault?"★ ":""}{sub.name||"配料"}
                  </button>
                ))}
              </div>
            </CStep>}
            {multiSubs.length>0&&<CStep n={3+(reqSubs.length>0?1:0)+(optSubs.length>0?1:0)} label="加選配料（可多選）" cls="fu">
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {multiSubs.map(sub=>{
                  const chk=selectedMultiIds.has(sub.id);
                  return(
                    <button key={sub.id} onClick={()=>setSelectedMultiIds(prev=>{const n=new Set(prev);chk?n.delete(sub.id):n.add(sub.id);return n;})} style={{padding:"7px 14px",borderRadius:100,fontSize:13,border:`1px solid ${chk?P.gold:P.border}`,background:chk?P.goldDim:"transparent",color:chk?P.gold:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s",display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:14,height:14,borderRadius:3,border:`1px solid ${chk?P.gold:P.muted}`,background:chk?P.gold:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}}>{chk?"✓":""}</span>
                      {sub.isDefault?"★ ":""}{sub.name||"配料"}
                    </button>
                  );
                })}
              </div>
            </CStep>}
          </>);
        })()}
        {sel&&<CStep n={(sel.subRecipes||[]).length>0?((sel.subRecipes||[]).filter(s=>s.selectionType==="required").length>0?1:0)+((sel.subRecipes||[]).filter(s=>!s.selectionType||s.selectionType==="optional").length>0?1:0)+((sel.subRecipes||[]).filter(s=>s.selectionType==="multi").length>0?1:0)+3:3} label={`製作數量（${sel.baseUnit}）`} cls="fu">
          {sel.mode!=="fixed"&&sel.pieceWeight&&<div style={{fontSize:12,color:P.muted,marginBottom:10,padding:"8px 12px",background:P.goldDim,borderRadius:7,lineHeight:1.5}}>{sel.mode==="total"?`每${sel.baseUnit}總重 ${sel.pieceWeight}g，各食材按比例分配`:`每${sel.baseUnit}總重 ${sel.pieceWeight}g，系統自動反推麵粉量再按烘焙師比例計算`}</div>}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input type="number" min="1" style={{...iCss,fontSize:22,fontWeight:600,textAlign:"center",flex:1}} placeholder="例：25" value={qty} onChange={e=>{setQty(e.target.value);setResult(null);}} onKeyDown={e=>e.key==="Enter"&&calculate()}/>
            <span style={{color:P.muted,fontSize:15,whiteSpace:"nowrap"}}>{sel.baseUnit}</span>
          </div>
          {parseFloat(sel.wastePct)>0&&<div style={{fontSize:11,color:P.muted,marginTop:5}}>將自動加入 {sel.wastePct}% 耗損</div>}
          <Btn v="p" onClick={calculate} style={{width:"100%",marginTop:12,padding:13,fontSize:15}}>計算食材用量</Btn>
        </CStep>}
        {result&&<div className="fu" style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:14,overflow:"hidden",marginTop:4}}>
          <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${P.border}`}}>
            <div style={{fontSize:10,color:P.gold,letterSpacing:".2em",marginBottom:4}}>計算結果</div>
            <div style={{fontSize:18,fontWeight:700}}>{result.sel.name} × {result.qty} {result.sel.baseUnit}</div>
            <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap"}}>

              {parseFloat(result.wastePct)>0&&<span style={{fontSize:11,color:P.muted}}>📦 含 {result.wastePct}% 耗損</span>}
            </div>
          </div>
          <div style={{padding:"4px 0"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px 120px",padding:"7px 18px",fontSize:10,color:P.muted,letterSpacing:".14em",borderBottom:`1px solid rgba(215,178,88,0.07)`}}><span>食材</span><span style={{textAlign:"right"}}>基準</span><span style={{textAlign:"right"}}>需要量</span></div>
            {result.rows.map((row,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 120px",padding:"11px 18px",alignItems:"center",borderBottom:i<result.rows.length-1?`1px solid rgba(215,178,88,0.06)`:"none"}}>
                <span style={{fontSize:14}}>{row.name}</span>
                <span style={{textAlign:"right",fontSize:12,color:P.muted}}>{row.base}</span>
                <span style={{textAlign:"right",fontSize:15,fontWeight:600,color:P.goldLight}}>{row.result}</span>
              </div>
            ))}
          </div>
          {result.subResults&&result.subResults.length>0&&result.subResults.map((sr,si)=>(
            <div key={si}>
              <div style={{padding:"10px 18px",background:P.goldDim,borderTop:`1px solid ${P.border}`,borderBottom:`1px solid ${P.border}`}}>
                <span style={{fontSize:11,color:P.gold,letterSpacing:".15em",fontWeight:600}}>配料：{sr.name}</span>
              </div>
              <div style={{padding:"4px 0"}}>
                {sr.rows.map((row,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 120px",padding:"10px 18px",alignItems:"center",borderBottom:i<sr.rows.length-1?`1px solid ${P.border}`:"none"}}>
                    <span style={{fontSize:14,color:P.text}}>{row.name}</span>
                    <span style={{textAlign:"right",fontSize:12,color:P.muted}}>{row.base}</span>
                    <span style={{textAlign:"right",fontSize:15,fontWeight:600,color:P.gold}}>{row.result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {result.sel.steps?.some(s=>s)&&<div style={{borderTop:`1px solid ${P.border}`}}>
            <button onClick={()=>setStepsOpen(x=>!x)} style={{width:"100%",padding:"12px 18px",background:"transparent",border:"none",color:P.gold,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>📋 製作步驟 / 備註</span><span style={{fontSize:10}}>{stepsOpen?"▲ 收起":"▼ 展開"}</span>
            </button>
            {stepsOpen&&<div style={{padding:"0 18px 16px"}} className="fu">
              {result.sel.steps.filter(s=>s&&(s.text||s)).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:9}}>
                  <span style={{minWidth:20,height:20,borderRadius:"50%",background:P.goldDim,color:P.gold,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</span>
                  <div>
                    <span style={{fontSize:13,color:P.soft,lineHeight:1.65}}>{s.text||s}</span>
                    {s.img&&<img src={s.img} alt="" onError={e=>e.target.style.display="none"} style={{display:"block",marginTop:8,width:"100%",maxWidth:300,borderRadius:8,border:`1px solid ${P.border}`,objectFit:"cover"}}/>}
                  </div>
                </div>
              ))}
              {result.sel.notes&&<div style={{marginTop:10,padding:"9px 13px",background:P.goldDim,borderRadius:7,fontSize:12,color:P.muted,lineHeight:1.6}}>💡 {result.sel.notes}</div>}
            </div>}
          </div>}
        </div>}
      </>}
    </div>
  );
}

function AdminView({ recipes, cats, save, saveCat }) {
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [fCat, setFCat] = useState("全部");
  const [catInput, setCatInput] = useState("");
  const [showCatMgr, setShowCatMgr] = useState(false);

  const startNew=()=>{setEditing(emptyRecipe(cats));setMode("edit");};
  const startEdit=r=>{setEditing(JSON.parse(JSON.stringify(r)));setMode("edit");};
  const handleSave=async rec=>{const upd=recipes.find(r=>r.id===rec.id)?recipes.map(r=>r.id===rec.id?rec:r):[...recipes,rec];await save(upd);setMode("list");};
  const handleDel=async id=>{if(!confirm("確定刪除此食譜？"))return;await save(recipes.filter(r=>r.id!==id));};
  const addCat=async()=>{const v=catInput.trim();if(!v||cats.includes(v))return;await saveCat([...cats,v]);setCatInput("");};
  const removeCat=async c=>{if(!confirm(`刪除「${c}」類型？`))return;await saveCat(cats.filter(x=>x!==c));};

  if (mode==="edit") return <RecipeEditor recipe={editing} cats={cats} onSave={handleSave} onCancel={()=>setMode("list")}/>;

  const allC=["全部",...new Set(recipes.map(r=>r.category))];
  const shown=fCat==="全部"?recipes:recipes.filter(r=>r.category===fCat);
  const mL={fixed:"固定克數",total:"總量比例",baker:"烘焙師%"};

  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"36px 18px 80px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <PageHeader sub="管理所有配方" title="配方後台" small/>
        <div style={{display:"flex",gap:8}}>
          <Btn v="s" onClick={()=>setShowCatMgr(x=>!x)}>⚙ 管理類型</Btn>
          <Btn v="p" onClick={startNew}>＋ 新增食譜</Btn>
        </div>
      </div>
      {showCatMgr&&<div className="fu" style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:12,padding:16,marginBottom:20}}>
        <div style={{fontSize:10,letterSpacing:".2em",color:P.gold,marginBottom:12}}>類型管理</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input style={{...iCss,flex:1}} placeholder="新增類型…" value={catInput} onChange={e=>setCatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}/>
          <Btn v="p" onClick={addCat} style={{whiteSpace:"nowrap",padding:"9px 16px"}}>新增</Btn>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {cats.map(c=>(
            <div key={c} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.04)",border:`1px solid ${P.border}`,borderRadius:100,padding:"4px 6px 4px 12px"}}>
              <span style={{fontSize:13,color:P.text}}>{c}</span>
              <button onClick={()=>removeCat(c)} style={{width:18,height:18,borderRadius:"50%",background:P.redDim,border:"none",color:P.red,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
            </div>
          ))}
        </div>
      </div>}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>{allC.map(c=><Chip key={c} on={fCat===c} onClick={()=>setFCat(c)} sm>{c}</Chip>)}</div>
      {shown.length===0?<Empty icon="📭" text="尚無食譜" sub="點擊「新增食譜」開始建立"/>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {shown.map(r=>(
            <div key={r.id} style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:11,padding:"14px 16px",boxShadow:"0 1px 6px rgba(180,140,80,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                  <STag>{r.category}</STag><STag blue>{mL[r.mode]}</STag>
                  <span style={{fontSize:15,fontWeight:600}}>{r.name||"（未命名）"}</span>
                </div>
                <div style={{fontSize:12,color:P.muted}}>{r.ingredients.filter(i=>i.name).length}種食材{parseFloat(r.wastePct)>0&&` · 耗損${r.wastePct}%`}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <Btn v="s" onClick={()=>startEdit(r)}>編輯</Btn>
                <Btn v="s" onClick={()=>handleDel(r.id)} style={{color:P.red,borderColor:"rgba(200,80,80,.25)"}}>刪除</Btn>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

function RecipeEditor({ recipe, cats, onSave, onCancel }) {
  const [f, setF] = useState(recipe);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const addIng=()=>setF(p=>({...p,ingredients:[...p.ingredients,{id:newId(),name:"",amount:"",unit:"g",pct:""}]}));
  const removeIng=id=>setF(p=>({...p,ingredients:p.ingredients.filter(i=>i.id!==id)}));
  const setIng=(id,k,v)=>setF(p=>({...p,ingredients:p.ingredients.map(i=>i.id===id?{...i,[k]:v}:i)}));
  const addStep=()=>setF(p=>({...p,steps:[...p.steps,{text:"",img:""}]}));
  const removeStep=idx=>setF(p=>({...p,steps:p.steps.filter((_,i)=>i!==idx)}));
  const setStep=(idx,k,v)=>setF(p=>({...p,steps:p.steps.map((s,i)=>i===idx?{...s,[k]:v}:s)}));
  const save=()=>{if(!f.name.trim()){alert("請輸入食譜名稱");return;}onSave(f);};
  const isRatio=f.mode!=="fixed";
  const MODES=[
    {val:"fixed",label:"固定克數",desc:"直接填每份的克數（如：每顆可頌用高筋麵粉 80g、奶油 40g）"},
    {val:"total",label:"總量比例　所有食材合計 100%",desc:"填每份成品總重，各食材填佔總重的 %"},
    {val:"baker",label:"烘焙師比例　麵粉 = 100%",desc:"填每份成品的總重量（如：每顆60g），系統自動反推麵粉量，其他食材填相對麵粉的 %"},
  ];
  const pctSum=isRatio?f.ingredients.reduce((a,i)=>{const p=parseFloat(i.pct);return a+(isNaN(p)?0:p);},0):0;

  // Sub-recipe helpers
  const addSub=()=>setF(p=>({...p,subRecipes:[...(p.subRecipes||[]),emptySubRecipe()]}));
  const removeSub=id=>setF(p=>({...p,subRecipes:p.subRecipes.filter(s=>s.id!==id)}));
  const setSub=(id,k,v)=>setF(p=>({...p,subRecipes:p.subRecipes.map(s=>s.id===id?{...s,[k]:v}:s)}));
  const addSubIng=sid=>setF(p=>({...p,subRecipes:p.subRecipes.map(s=>s.id===sid?{...s,ingredients:[...s.ingredients,{id:newId(),name:"",amount:"",unit:"g",pct:""}]}:s)}));
  const removeSubIng=(sid,iid)=>setF(p=>({...p,subRecipes:p.subRecipes.map(s=>s.id===sid?{...s,ingredients:s.ingredients.filter(i=>i.id!==iid)}:s)}));
  const setSubIng=(sid,iid,k,v)=>setF(p=>({...p,subRecipes:p.subRecipes.map(s=>s.id===sid?{...s,ingredients:s.ingredients.map(i=>i.id===iid?{...i,[k]:v}:i)}:s)}));

  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"36px 18px 80px"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28}}>
        <Btn v="s" onClick={onCancel} style={{padding:"7px 14px"}}>← 返回</Btn>
        <h2 style={{margin:0,fontSize:19,fontWeight:700,color:P.goldLight}}>{recipe.name?`編輯：${recipe.name}`:"新增食譜"}</h2>
      </div>
      <Sec title="基本資訊"><G2>
        <Fld label="類型"><select style={iCss} value={f.category} onChange={e=>set("category",e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></Fld>
        <Fld label="食譜名稱"><input style={iCss} placeholder="例：可頌、戚風蛋糕" value={f.name} onChange={e=>set("name",e.target.value)}/></Fld>
      </G2></Sec>
      <Sec title="食譜模式"><div style={{display:"flex",flexDirection:"column",gap:8}}>
        {MODES.map(m=>(
          <label key={m.val} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",borderRadius:9,cursor:"pointer",border:`1px solid ${f.mode===m.val?P.gold:P.border}`,background:f.mode===m.val?P.goldDim:"transparent",transition:"all .18s"}}>
            <input type="radio" name="mode" value={m.val} checked={f.mode===m.val} onChange={()=>set("mode",m.val)} style={{marginTop:3,accentColor:P.gold}}/>
            <div><div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:3}}>{m.label}</div><div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{m.desc}</div></div>
          </label>
        ))}
      </div></Sec>
      <Sec title="份量設定"><G2>
        {!isRatio?<>
          <Fld label="基準數量"><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="number" min="1" style={{...iCss,flex:1}} placeholder="1" value={f.baseQty} onChange={e=>set("baseQty",parseFloat(e.target.value)||1)}/><input style={{...iCss,width:72}} placeholder="顆" value={f.baseUnit} onChange={e=>set("baseUnit",e.target.value)}/></div><div style={{fontSize:11,color:P.muted,marginTop:4}}>下方食材是「做這個數量」的用量</div></Fld>
          <Fld label="耗損率 (%)"><input type="number" min="0" max="50" step="0.5" style={iCss} placeholder="0" value={f.wastePct} onChange={e=>set("wastePct",e.target.value)}/></Fld>
        </>:<>
          <Fld label={f.mode==="total"?"每份成品總重 (g)":"每份成品總重 (g)"}><input type="number" min="1" style={iCss} placeholder={f.mode==="total"?"例：200":"例：80"} value={f.pieceWeight} onChange={e=>set("pieceWeight",e.target.value)}/><div style={{fontSize:11,color:P.muted,marginTop:4}}>{f.mode==="total"?"每顆成品的總麵糰重量":"每顆成品的總重量（如：每顆60g），系統自動反推麵粉量"}</div></Fld>
          <Fld label="單位"><input style={iCss} placeholder="顆 / 個 / 條" value={f.baseUnit} onChange={e=>set("baseUnit",e.target.value)}/></Fld>
          <Fld label="耗損率 (%)"><input type="number" min="0" max="50" step="0.5" style={iCss} placeholder="0" value={f.wastePct} onChange={e=>set("wastePct",e.target.value)}/></Fld>
        </>}
      </G2></Sec>
      <Sec title={isRatio?"食材比例":`食材用量（每 ${f.baseQty} ${f.baseUnit}）`}>
        {isRatio&&<div style={{fontSize:11,color:pctSum>101||(pctSum<99&&pctSum>0)?P.red:P.muted,marginBottom:12,padding:"8px 12px",background:P.goldDim,borderRadius:7,display:"flex",justifyContent:"space-between"}}><span>{f.mode==="total"?"各食材 % 加總應約等於 100%":"麵粉填 100，其他填相對麵粉的 %"}</span>{pctSum>0&&<span style={{fontWeight:600}}>目前合計：{pctSum.toFixed(1)}%</span>}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
          {f.ingredients.map((ing,idx)=>(
            <div key={ing.id} style={{display:"flex",gap:6,alignItems:"center"}}>
              <input style={{...iCss,flex:2,padding:"7px 10px"}} placeholder={`食材 ${idx+1}`} value={ing.name} onChange={e=>setIng(ing.id,"name",e.target.value)}/>
              {!isRatio?<><input type="number" style={{...iCss,width:80,padding:"7px 8px",textAlign:"right"}} placeholder="用量" value={ing.amount} onChange={e=>setIng(ing.id,"amount",e.target.value)}/><select style={{...iCss,width:76,padding:"7px 5px",fontSize:13}} value={ing.unit} onChange={e=>setIng(ing.id,"unit",e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></>
              :<><input type="number" style={{...iCss,width:90,padding:"7px 8px",textAlign:"right"}} placeholder="%" value={ing.pct} onChange={e=>setIng(ing.id,"pct",e.target.value)}/><span style={{color:P.muted,fontSize:13,whiteSpace:"nowrap"}}>%</span></>}
              <button onClick={()=>removeIng(ing.id)} style={{width:30,height:30,borderRadius:6,flexShrink:0,background:P.redDim,border:`1px solid rgba(200,80,80,.2)`,color:P.red,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          ))}
        </div>
        <DashBtn onClick={addIng}>＋ 新增食材</DashBtn>
      </Sec>

      {/* Sub-recipes collapsible section */}
      <div style={{marginBottom:22}}>
        <button onClick={addSub} style={{width:"100%",padding:"11px 16px",background:"transparent",border:`1px dashed ${P.border}`,borderRadius:11,color:P.gold,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          ＋ 新增配料 ／ 餡料子配方
        </button>
        {(f.subRecipes||[]).map((sub,si)=>{
          const subIsRatio=sub.mode!=="fixed";
          const subPctSum=subIsRatio?sub.ingredients.reduce((a,i)=>{const p=parseFloat(i.pct);return a+(isNaN(p)?0:p);},0):0;
          return(
          <div key={sub.id} style={{marginTop:10,background:P.card,border:`1px solid ${P.borderActive||"rgba(215,178,88,0.35)"}`,borderRadius:11,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:`1px solid ${P.border}`}}>
              <span style={{fontSize:11,color:P.gold,letterSpacing:".1em"}}>子配方 {si+1}</span>
              <input style={{...iCss,flex:1,padding:"6px 10px",fontSize:13}} placeholder="名稱（如：卡士達餡、草莓醬）" value={sub.name} onChange={e=>setSub(sub.id,"name",e.target.value)}/>
              {/* selectionType selector */}
              {[["optional","可選"],["required","必選"],["multi","多選"]].map(([val,label])=>(
                <button key={val} onClick={()=>setSub(sub.id,"selectionType",val)} style={{padding:"3px 9px",borderRadius:100,fontSize:10,border:`1px solid ${(sub.selectionType||"optional")===val?P.gold:P.border}`,background:(sub.selectionType||"optional")===val?P.goldDim:"transparent",color:(sub.selectionType||"optional")===val?P.gold:P.muted,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
              ))}
              <button onClick={()=>setF(p=>({...p,subRecipes:p.subRecipes.map(s=>({...s,isDefault:s.id===sub.id?!sub.isDefault:false}))}))} style={{padding:"3px 9px",borderRadius:100,fontSize:10,border:`1px solid ${sub.isDefault?P.gold:P.border}`,background:sub.isDefault?P.goldDim:"transparent",color:sub.isDefault?P.gold:P.muted,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{sub.isDefault?"★ 預設":"☆ 設預設"}</button>
              <button onClick={()=>removeSub(sub.id)} style={{width:28,height:28,borderRadius:6,flexShrink:0,background:P.redDim,border:`1px solid rgba(200,80,80,.2)`,color:P.red,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{padding:"12px 14px"}}>
              {/* Mode */}
              <div style={{marginBottom:12}}>
                <label style={{...lCss,marginBottom:8}}>計算模式</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[["fixed","固定克數"],["total","總量比例"],["baker","烘焙師%"]].map(([val,label])=>(
                    <button key={val} onClick={()=>setSub(sub.id,"mode",val)} style={{padding:"5px 12px",borderRadius:100,fontSize:12,border:`1px solid ${sub.mode===val?P.gold:P.border}`,background:sub.mode===val?P.goldDim:"transparent",color:sub.mode===val?P.goldLight:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>{label}</button>
                  ))}
                </div>
              </div>
              {/* Piece weight for ratio modes */}
              {subIsRatio&&<div style={{marginBottom:12}}>
                <label style={lCss}>{sub.mode==="total"?"每份子配方總重 (g)":"每份子配方成品總重 (g)"}</label>
                <input type="number" min="1" style={iCss} placeholder="例：30" value={sub.pieceWeight||""} onChange={e=>setSub(sub.id,"pieceWeight",e.target.value)}/>
                <div style={{fontSize:11,color:P.muted,marginTop:4}}>配一份主配方（{f.baseQty}{f.baseUnit}）所需的子配方重量</div>
              </div>}
              {/* Waste */}
              <div style={{marginBottom:12}}><label style={lCss}>耗損率 (%)</label><input type="number" min="0" max="50" step="0.5" style={iCss} placeholder="0" value={sub.wastePct||0} onChange={e=>setSub(sub.id,"wastePct",e.target.value)}/></div>
              {/* Ingredients */}
              <label style={lCss}>{subIsRatio?"食材比例":"食材用量"}</label>
              {subIsRatio&&subPctSum>0&&<div style={{fontSize:11,color:subPctSum>101||(subPctSum<99)?P.red:P.muted,marginBottom:8}}>目前合計：{subPctSum.toFixed(1)}%</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
                {sub.ingredients.map((ing,idx)=>(
                  <div key={ing.id} style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input style={{...iCss,flex:2,padding:"6px 9px",fontSize:13}} placeholder={`食材 ${idx+1}`} value={ing.name} onChange={e=>setSubIng(sub.id,ing.id,"name",e.target.value)}/>
                    {!subIsRatio?<><input type="number" style={{...iCss,width:76,padding:"6px 8px",textAlign:"right",fontSize:13}} placeholder="用量" value={ing.amount} onChange={e=>setSubIng(sub.id,ing.id,"amount",e.target.value)}/><select style={{...iCss,width:72,padding:"6px 4px",fontSize:12}} value={ing.unit} onChange={e=>setSubIng(sub.id,ing.id,"unit",e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></>
                    :<><input type="number" style={{...iCss,width:80,padding:"6px 8px",textAlign:"right",fontSize:13}} placeholder="%" value={ing.pct} onChange={e=>setSubIng(sub.id,ing.id,"pct",e.target.value)}/><span style={{color:P.muted,fontSize:12}}>%</span></>}
                    <button onClick={()=>removeSubIng(sub.id,ing.id)} style={{width:26,height:26,borderRadius:6,flexShrink:0,background:P.redDim,border:`1px solid rgba(200,80,80,.2)`,color:P.red,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                ))}
              </div>
              <DashBtn onClick={()=>addSubIng(sub.id)}>＋ 新增食材</DashBtn>
            </div>
          </div>
        );})}
      </div>

      <Sec title="製作步驟">
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
          {f.steps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{minWidth:22,height:22,borderRadius:"50%",background:P.goldDim,color:P.gold,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0,marginTop:7}}>{i+1}</span>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                <textarea style={{...iCss,resize:"vertical",minHeight:58,lineHeight:1.6}} placeholder={`步驟 ${i+1} 說明`} value={s.text||""} onChange={e=>setStep(i,"text",e.target.value)}/>
                <StepImgUploader img={s.img||""} onImg={url=>setStep(i,"img",url)} onClear={()=>setStep(i,"img","")}/>
              </div>
              <button onClick={()=>removeStep(i)} style={{width:28,height:28,marginTop:7,borderRadius:6,flexShrink:0,background:P.redDim,border:`1px solid rgba(200,80,80,.2)`,color:P.red,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          ))}
        </div>
        <DashBtn onClick={addStep}>＋ 新增步驟</DashBtn>
      </Sec>
      <Sec title="備註 ／ 小技巧"><textarea style={{...iCss,minHeight:76,lineHeight:1.6,resize:"vertical"}} placeholder="例：奶油需提前回溫…" value={f.notes} onChange={e=>set("notes",e.target.value)}/></Sec>
      <div style={{display:"flex",gap:10}}>
        <Btn v="p" onClick={save} style={{flex:1,padding:13,fontSize:15}}>儲存食譜</Btn>
        <Btn v="s" onClick={onCancel} style={{padding:"13px 20px"}}>取消</Btn>
      </div>
    </div>
  );
}

function StepImgUploader({ img, onImg, onClear }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("請選擇圖片檔案"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("圖片不能超過 5MB"); return; }
    setUploading(true); setError("");
    try {
      const storageRef = ref(storage, `steps/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onImg(url);
    } catch (e) { setError("上傳失敗，請重試"); console.error(e); }
    setUploading(false);
  };

  if (img) return (
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <img src={img} alt="" style={{width:56,height:56,objectFit:"cover",borderRadius:8,border:`1px solid ${P.border}`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:11,color:P.muted,marginBottom:4}}>已上傳照片</div>
        <button onClick={onClear} style={{fontSize:11,color:P.red,background:"transparent",border:`1px solid rgba(200,80,80,.25)`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>移除照片</button>
      </div>
    </div>
  );

  return (
    <div>
      <label style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"transparent",border:`1px dashed ${P.border}`,borderRadius:8,cursor:uploading?"not-allowed":"pointer",color:P.muted,fontSize:12}}>
        <span>{uploading?"上傳中…":"📷 上傳步驟照片（選填）"}</span>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} style={{display:"none"}}/>
      </label>
      {error&&<div style={{fontSize:11,color:P.red,marginTop:4}}>{error}</div>}
    </div>
  );
}

function PageHeader({sub,title,small}){return(<div style={{marginBottom:small?0:30}}><div style={{fontSize:10,letterSpacing:".26em",color:P.gold,marginBottom:6}}>{sub}</div><h2 style={{margin:0,fontSize:small?20:26,fontWeight:700,color:P.goldLight}}>{title}</h2>{!small&&<div style={{width:36,height:2,background:P.gold,marginTop:10}}/>}</div>);}
function CStep({n,label,children,cls=""}){return(<div className={cls} style={{marginBottom:22}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{width:22,height:22,borderRadius:"50%",background:P.goldDim,color:P.gold,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</span><span style={{...lCss,marginBottom:0}}>{label}</span></div>{children}</div>);}
function Sec({title,children}){return(<div style={{marginBottom:22}}><div style={{fontSize:10,letterSpacing:".22em",color:P.gold,marginBottom:10}}>{title}</div><div style={{background:P.card,border:`1px solid ${P.border}`,borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(180,140,80,0.08)"}}>{children}</div></div>);}
function Fld({label,children}){return<div><label style={lCss}>{label}</label>{children}</div>;}
function G2({children}){return<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14}}>{children}</div>;}
function Chip({on,onClick,children,sm}){return<button onClick={onClick} style={{padding:sm?"4px 12px":"7px 16px",borderRadius:100,fontSize:sm?11:13,border:`1px solid ${on?P.gold:P.border}`,background:on?P.goldDim:"transparent",color:on?P.goldLight:P.soft,cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}>{children}</button>;}
function STag({children,blue}){return<span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:blue?"rgba(100,160,220,0.13)":P.goldDim,color:blue?"#80b4e0":P.gold,letterSpacing:".08em"}}>{children}</span>;}
function DashBtn({onClick,children}){return<button onClick={onClick} style={{width:"100%",padding:8,background:"transparent",border:`1px dashed ${P.border}`,borderRadius:8,color:P.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;}
function Empty({icon,text,sub}){return(<div style={{textAlign:"center",padding:"52px 20px",border:`1px dashed ${P.border}`,borderRadius:14,color:P.muted}}><div style={{fontSize:28,marginBottom:10}}>{icon}</div><div style={{fontSize:14,marginBottom:4}}>{text}</div>{sub&&<div style={{fontSize:12}}>{sub}</div>}</div>);}
