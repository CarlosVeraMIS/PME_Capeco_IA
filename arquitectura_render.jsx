import { useState, useEffect } from "react";

const C = {
  navy:"#0F2340",gov:"#3B82F6",govBg:"rgba(59,130,246,0.1)",govBdr:"rgba(59,130,246,0.3)",
  bro:"#F59E0B",broBg:"rgba(245,158,11,0.1)",broBdr:"rgba(245,158,11,0.3)",
  sil:"#06B6D4",silBg:"rgba(6,182,212,0.1)",silBdr:"rgba(6,182,212,0.3)",
  gol:"#F97316",golBg:"rgba(249,115,22,0.12)",golBdr:"rgba(249,115,22,0.35)",
  ag:"#A78BFA",agBg:"rgba(167,139,250,0.1)",agBdr:"rgba(167,139,250,0.3)",
  api:"#FB7185",apiBg:"rgba(251,113,133,0.1)",apiBdr:"rgba(251,113,133,0.3)",
  prod:"#34D399",prodBg:"rgba(52,211,153,0.1)",prodBdr:"rgba(52,211,153,0.3)",
  cl:"#FCD34D",clBg:"rgba(252,211,77,0.1)",clBdr:"rgba(252,211,77,0.3)",
  or:"#E8500D",
};

const LAYERS = [
  { id:"src",  num:"①", name:"Fuentes de Datos", color:C.gov, bg:"rgba(148,163,184,0.04)", bdr:"rgba(148,163,184,0.15)",
    nodes:[
      {id:"mysql",  icon:"🗄️", name:"Azure MySQL CAPECO",  sub:"163,914 reg · 150 cols",      c:C.gov, detail:"db_capeco · data_capeco_full · 49 distritos · 2019–2025 · Read-only via IngestAgent"},
      {id:"open",   icon:"🏛️", name:"Open Data Lima",       sub:"Licencias edif. · Sprint 2",   c:"#94A3B8",detail:"datosabiertos.gob.pe · Obras antes del censo CAPECO · Mensual"},
      {id:"nexo",   icon:"🌐", name:"Nexo Inmobiliario",    sub:"Precio LISTA · Q3",            c:"#94A3B8",detail:"Portal ASEI · Precio de oferta (no cierre) · SpreadAgent lo compara vs PME"},
      {id:"bcrp",   icon:"📊", name:"BCRP API",             sub:"USD/PEN · Q3 2026",            c:"#94A3B8",detail:"Tipo de cambio histórico · Normalización de precios en moneda constante"},
      {id:"sunarp", icon:"⚖️", name:"SUNARP",               sub:"Transferencias · Q4",          c:"#94A3B8",detail:"Precios de cierre escriturados · Latencia 2-3 meses · Acuerdo institucional"},
    ]},
  { id:"gov",  num:"②", name:"Governance — Transversal · Activo en todo el pipeline", color:C.gov, bg:C.govBg, bdr:C.govBdr,
    nodes:[
      {id:"cv",  icon:"📄", name:"ContractValid Agent",  sub:"G5 · Pre-ingesta",      c:C.gov, pulse:true,  detail:"Valida Data Contract A3. Verifica schema + SLA 15 días. STOP si falla."},
      {id:"sw",  icon:"🔭", name:"SchemaWatch Agent",    sub:"G1+G7 · 150 campos",    c:C.gov,             detail:"Inventario automático. Detecta campo nuevo, eliminado o tipo cambiado."},
      {id:"pi",  icon:"🔐", name:"PIIScan Agent",        sub:"G2 · PII 0/1/2",        c:C.gov,             detail:"Detecta teléfonos, RUC, nombres. Sugiere nivel PII. DA aprueba."},
      {id:"sl",  icon:"📏", name:"SLAMonitor Agent",     sub:"G3+G9 · Completitud",   c:C.gov,             detail:"Completitud vs A8. Degradación >5% → alerta. STOP si campo Core bajo umbral."},
      {id:"au",  icon:"📝", name:"Audit Agent",          sub:"G4 · Append-only",      c:C.gov, pulse:true,  detail:"Log inmutable de cada acceso PII. user+timestamp+query_hash. Reporte semanal."},
      {id:"gr",  icon:"📊", name:"GovReport Agent",      sub:"G8 · Lun 08:00",        c:C.gov, pulse:true,  detail:"Reporte governance semanal. SLAs + audit + semáforo. Email auto a CAPECO."},
    ]},
  { id:"bro",  num:"③", name:"Bronze Layer — Raw Inmutable", color:C.bro, bg:C.broBg, bdr:C.broBdr,
    nodes:[
      {id:"ing",  icon:"📥", name:"IngestAgent",         sub:"L1+L9 · MySQL→Parquet", c:C.bro, detail:"Lee MySQL read-only. Parquet + SHA256 + manifest.json. Sprint 1 manual → Sprint 2 Azure Data Factory."},
      {id:"bsn",  icon:"📦", name:"Bronze Snapshot",     sub:"PII completa · 7 años", c:C.bro, detail:"bronze/capeco/raw/ · Todos los 150 campos incluyendo PII · Inmutable · SHA256."},
      {id:"li",   icon:"🔗", name:"LineageAgent",        sub:"G10 · Trazabilidad",    c:C.bro, detail:"Registra rows, sha256, timestamp, schema_diff. Traza cualquier valor Gold hasta Bronze."},
    ]},
  { id:"sil",  num:"④", name:"Silver Layer — Limpio · Tipado · Sin PII-2", color:C.sil, bg:C.silBg, bdr:C.silBdr,
    nodes:[
      {id:"dq",   icon:"🔍", name:"DataQuality Agent v2", sub:"L2+L3+L4 · D12",      c:C.sil, detail:"GPS Lima · Dedup COD+TRIM+ANIO · Precio ±3σ · PII-2 check · SLA · STOP si error crítico."},
      {id:"no",   icon:"🏷️", name:"Normalization Agent",  sub:"L5+L6 · D14",         c:C.sil, detail:"TREBOL→Trébol · 'No precisan'→NULL · PII-2 hash · snake_case · Distritos INEI."},
      {id:"dg",   icon:"🤖", name:"DictGen (Claude API)",  sub:"P7 · aliases.json",   c:C.cl,  detail:"Genera descripciones de negocio para 150 campos. DA revisa. 80% auto, 20% humano."},
      {id:"sly",  icon:"🥈", name:"Silver Certificado",    sub:"0 dup · GPS · PII-2✓",c:C.sil, detail:"silver/capeco/cleaned/ · QA valida COUNT Bronze ≥ COUNT Silver · Normalizado."},
    ]},
  { id:"gol",  num:"⑤", name:"Gold Layer — Certificado · Particionado por Producto", color:C.gol, bg:C.golBg, bdr:C.golBdr,
    nodes:[
      {id:"gc",   icon:"🥇", name:"GoldCert Agent",       sub:"L7+L8+L12 · DE firma", c:C.gol, detail:"Calcula PRECIO_X_M2 · ABSORCION_PCT · FASE_CODIGO · TIENE_MARCA_REAL. Certifica y particiona."},
      {id:"gca",  icon:"📊", name:"Gold / PME CAPECO",    sub:"PII-0 · 163,914 reg.", c:C.gol, detail:"gold/pme-capeco/ · Todos los campos PII-0 + métricas. Sin datos personales."},
      {id:"gcp",  icon:"🏗️", name:"Gold / PME Proveedores",sub:"22,596 obras · A10⚠", c:C.or,  detail:"gold/pme-proveedores/ · PII-1 (TELEFONO) solo si A10 firmado. Flag dinámico runtime."},
    ]},
  { id:"api",  num:"⑥", name:"API Interna + OrchestratorAgent", color:C.api, bg:C.apiBg, bdr:C.apiBdr,
    nodes:[
      {id:"ar",   icon:"🔌", name:"API REST Interna (B7)", sub:"JWT · RBAC · <200ms",  c:C.api, detail:"/obras /metricas /export · JWT+RBAC A5 · Rate limit 100 req/min · Cache Redis 15min."},
      {id:"oc",   icon:"🎯", name:"Orchestrator Agent",    sub:"13 pasos · Fail-fast", c:C.ag, pulse:true, detail:"Dirige pipeline completo con fail-fast. Sprint 1: Python · Sprint 2+: Azure Data Factory."},
      {id:"cc",   icon:"💻", name:"Claude Code + MCP",     sub:"Terminal · D1 setup",  c:C.cl,  detail:"Acceso directo db_capeco desde terminal. Inventario A1 en <5 min. Sin pegar outputs."},
    ]},
  { id:"agt",  num:"⑦", name:"Agentes de Producto", color:C.ag, bg:C.agBg, bdr:C.agBdr,
    nodes:[
      {id:"al",   icon:"🔔", name:"AlertAgent v2",         sub:"P1+P10+P11",           c:C.ag,  detail:"Obras nuevas + precio >5% + paralizadas. Email + webhook CRM + WhatsApp API."},
      {id:"rp",   icon:"📄", name:"ReportAgent v2",        sub:"P2 · PDF <60seg",      c:C.ag,  detail:"PDF trimestral desde Gold. Firma CAPECO×MIS. Demo Día 60 en vivo."},
      {id:"co",   icon:"💬", name:"CopilotAgent (Claude)", sub:"P3 · NL→SQL→Gold",    c:C.cl,  detail:"Lenguaje natural → SQL → Gold → prosa. RBAC respetado. Audit log por query."},
      {id:"sp",   icon:"📈", name:"SpreadAgent",           sub:"P4 · Q3 2026",         c:C.ag,  detail:"PME cierre vs Nexo lista. Spread % por distrito. Outlier >20% alerta."},
      {id:"tm",   icon:"🏠", name:"TasamAgent",            sub:"P5 · Tasamelo D48",    c:C.ag,  detail:"GPS → 20 comparables Gold → hedónico → precio ±IC. <30 seg. Proto Sprint 3."},
      {id:"br",   icon:"🤝", name:"BrokerAgent",           sub:"P6 · Matching",        c:C.ag,  detail:"Perfil proveedor → obras en ventana → Top 20 + contacto si A10. Webhook CRM."},
    ]},
  { id:"prd",  num:"⑧", name:"Productos PME — Gold como única fuente de verdad", color:C.prod, bg:C.prodBg, bdr:C.prodBdr,
    nodes:[
      {id:"pc",   icon:"📊", name:"PME CAPECO",            sub:"Precio cierre real",   c:C.prod, detail:"Dashboard precio cierre real · Absorción · Stock · Histórico 2019–2025."},
      {id:"pp",   icon:"🏗️", name:"PME Proveedores ⚡",   sub:"MVP Día 45",           c:C.or,   detail:"22,596 obras · Mapa · Filtros · Ficha · Excel · AlertAgent. Genera caja en 60 días."},
      {id:"ts",   icon:"🎯", name:"Tasamelo",              sub:"Beta Sprint 3",        c:C.prod, detail:"Valuación 30 seg via GPS + comparables Gold. Firma CAPECO."},
      {id:"ap",   icon:"🔌", name:"API PME Pública",       sub:"Proptechs · Fintechs", c:C.prod, detail:"REST · JWT · Sandbox · USD 290–1,490/mes. Swagger auto."},
      {id:"ac",   icon:"🎓", name:"PME Académico",         sub:"Convenio CAPECO",      c:C.prod, detail:"Acceso histórico 2019–2025 · .edu.pe · Tesis e investigación."},
      {id:"rt",   icon:"📋", name:"Reporte Trimestral",    sub:"Auto · Firma CAPECO",  c:C.prod, detail:"ReportAgent genera PDF auto. <60 seg. Demo Día 60 en vivo ante CAPECO."},
    ]},
];

const PIPE = [
  {t:"ContractValid",c:C.gov},{t:"SchemaWatch",c:C.gov},{t:"IngestAgent",c:C.bro},
  {t:"DataQuality",c:C.ag},{t:"PIIScan",c:C.gov},{t:"Normalize",c:C.sil},
  {t:"SLAMonitor",c:C.gov},{t:"GoldCert",c:C.gol},{t:"LineageLog",c:C.bro},
  {t:"AuditLog",c:C.gov},{t:"CacheFlush",c:"#475569"},{t:"AlertAgent",c:C.prod},{t:"GovReport",c:C.gov},
];

const CONN_LABELS = [
  "ContractValidAgent + SchemaWatchAgent → pre-ingesta",
  "IngestAgent → Bronze + SHA256 + manifest inmutable",
  "DataQualityAgent + NormalizationAgent → Silver",
  "GoldCertAgent → certifica + particiona por producto",
  "API REST interna B7 · JWT + RBAC A5 · Redis cache",
  "Agentes de producto leen Gold exclusivamente via API",
  "Productos PME ← Gold certificado · única fuente de verdad",
];

function Particle({color,delay,dur}) {
  return (
    <div style={{
      position:"absolute", top:"50%", marginTop:-4,
      width:8, height:8, borderRadius:"50%",
      background:color, boxShadow:`0 0 8px ${color}`,
      animation:`pflow ${dur}s ${delay}s linear infinite`, opacity:0,
    }}/>
  );
}

function Node({n, selected, onClick}) {
  const [hov, setHov] = useState(false);
  const sel = selected?.id === n.id;
  return (
    <div
      onClick={()=>onClick(n)}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        flex:1, minWidth:100, maxWidth:190,
        background: sel?`${n.c}22`:hov?`${n.c}15`:`${n.c}08`,
        border:`1.5px solid ${sel?n.c:hov?`${n.c}77`:`${n.c}33`}`,
        borderRadius:8, padding:"9px 10px",
        cursor:"pointer", userSelect:"none",
        transition:"all .18s",
        transform: sel?"translateY(-3px)":hov?"translateY(-2px)":"none",
        boxShadow: sel?`0 6px 18px ${n.c}44`:hov?`0 3px 12px ${n.c}22`:"none",
        position:"relative",
      }}
    >
      {n.pulse && (
        <div style={{
          position:"absolute", top:7, right:7,
          width:6, height:6, borderRadius:"50%",
          background:n.c, animation:"pls 2s ease-in-out infinite",
        }}/>
      )}
      <div style={{fontSize:16, marginBottom:3}}>{n.icon}</div>
      <div style={{fontSize:11, fontWeight:700, color:n.c, lineHeight:1.25, marginBottom:2}}>{n.name}</div>
      <div style={{fontSize:9.5, color:"#64748B", fontFamily:"monospace"}}>{n.sub}</div>
    </div>
  );
}

function Layer({L, selected, onClick}) {
  return (
    <div style={{
      background:L.bg, border:`1px solid ${L.bdr}`,
      borderRadius:10, padding:"10px 12px",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:8}}>
        <div style={{
          fontFamily:"monospace", fontSize:10, fontWeight:700,
          color:"#475569", background:"#0D1628",
          border:`1px solid ${L.bdr}`, borderRadius:5, padding:"1px 7px",
        }}>{L.num}</div>
        <div style={{fontSize:11, fontWeight:700, color:L.color}}>{L.name}</div>
      </div>
      <div style={{display:"flex", gap:7, flexWrap:"wrap"}}>
        {L.nodes.map(n => <Node key={n.id} n={n} selected={selected} onClick={onClick}/>)}
      </div>
    </div>
  );
}

function Conn({from, to, label}) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:6, padding:"0 10px", height:34, position:"relative"}}>
      <div style={{flex:1, height:1, background:`linear-gradient(90deg,${from}44,${to}66,transparent)`, position:"relative", overflow:"visible"}}>
        {[0,.55,1.1].map((d,i)=><Particle key={i} color={to} delay={d} dur={1.8}/>)}
      </div>
      <div style={{
        background:"#0D1628", border:`1px solid ${to}33`,
        borderRadius:20, padding:"3px 11px",
        fontSize:9.5, fontWeight:600, color:to,
        fontFamily:"monospace", whiteSpace:"nowrap", flexShrink:0,
        boxShadow:`0 0 10px ${to}18`,
      }}>{label}</div>
      <div style={{flex:1, height:1, background:`linear-gradient(90deg,${to}44,transparent)`}}/>
    </div>
  );
}

export default function App() {
  const [sel, setSel] = useState(null);
  const [pStep, setPStep] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=> setPStep(s=>(s+1)%PIPE.length), 520);
    return ()=>clearInterval(t);
  },[]);

  const handle = n => setSel(p=> p?.id===n.id ? null : n);

  return (
    <div style={{
      background:"#080E1A", minHeight:"100vh",
      fontFamily:"'Space Grotesk',system-ui,sans-serif", color:"#E2E8F0",
      fontSize:13,
    }}>
      <style>{`
        @keyframes pflow{0%{left:-8px;opacity:0}10%{opacity:1}90%{opacity:1}100%{left:calc(100% + 8px);opacity:0}}
        @keyframes pls{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(.65)}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slidein{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#0D1628}
        ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}
      `}</style>

      <div style={{maxWidth:1280, margin:"0 auto", padding:"18px 20px"}}>

        {/* HEADER */}
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div>
            <div style={{display:"inline-block", background:C.or, color:"#fff", fontFamily:"monospace", fontSize:9.5, fontWeight:700, letterSpacing:".1em", padding:"2px 9px", borderRadius:3, marginBottom:5}}>ARQUITECTURA · PME CAPECO × MIS</div>
            <div style={{fontSize:20, fontWeight:800, letterSpacing:"-.02em", marginBottom:2}}>
              Data Lake + Governance + <span style={{color:C.ag}}>Agentes IA</span>
            </div>
            <div style={{fontSize:11, color:"#64748B"}}>Bronze → Silver → Gold · 34 agentes · 28 automáticos · Plan 60 días · Haz click en cualquier nodo</div>
          </div>
          <div style={{display:"flex", gap:8, flexShrink:0}}>
            {[{n:"34",l:"Agentes",c:C.ag},{n:"28",l:"Automáticos",c:C.prod},{n:"163k",l:"Registros",c:C.gol},{n:"D60",l:"Demo",c:C.or}].map(k=>(
              <div key={k.n} style={{textAlign:"center", background:"#0D1628", border:"1px solid rgba(255,255,255,.07)", borderRadius:8, padding:"7px 12px"}}>
                <div style={{fontSize:17, fontWeight:700, color:k.c, fontFamily:"monospace"}}>{k.n}</div>
                <div style={{fontSize:9.5, color:"#64748B"}}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex", gap:14}}>

          {/* DIAGRAM */}
          <div style={{flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:0}}>
            {/* Legend */}
            <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:12}}>
              {[{c:C.gov,l:"Governance"},{c:C.bro,l:"Bronze"},{c:C.sil,l:"Silver"},{c:C.gol,l:"Gold"},{c:C.ag,l:"Agentes"},{c:C.prod,l:"Productos"},{c:C.cl,l:"Claude API"},{c:C.api,l:"API interna"}].map(lg=>(
                <div key={lg.l} style={{display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, color:"#94A3B8", padding:"2px 7px", borderRadius:4, border:"1px solid rgba(255,255,255,.05)", background:"rgba(255,255,255,.02)"}}>
                  <div style={{width:7, height:7, borderRadius:2, background:lg.c}}/>
                  {lg.l}
                </div>
              ))}
            </div>

            {LAYERS.map((L,i)=>(
              <div key={L.id}>
                <Layer L={L} selected={sel} onClick={handle}/>
                {i<LAYERS.length-1 && <Conn from={L.color} to={LAYERS[i+1].color} label={CONN_LABELS[i]}/>}
              </div>
            ))}

            {/* Pipeline */}
            <div style={{marginTop:12, background:"#0D1628", border:"1px solid rgba(255,255,255,.07)", borderRadius:9, padding:"11px 13px"}}>
              <div style={{fontFamily:"monospace", fontSize:9, fontWeight:600, color:"#475569", letterSpacing:".1em", textTransform:"uppercase", marginBottom:8}}>// OrchestratorAgent · 13 pasos gobernados · fail-fast · animación en tiempo real</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:4, alignItems:"center"}}>
                {PIPE.map((p,i)=>{
                  const active = i===pStep;
                  return (
                    <div key={i} style={{display:"flex", alignItems:"center", gap:4}}>
                      <div style={{
                        fontFamily:"monospace", fontSize:9.5, fontWeight:700,
                        padding:"3px 8px", borderRadius:4,
                        background: active?`${p.c}2a`:`${p.c}0d`,
                        border:`1px solid ${active?p.c:`${p.c}33`}`,
                        color: active?p.c:`${p.c}88`,
                        transition:"all .3s",
                        boxShadow: active?`0 0 10px ${p.c}44`:"none",
                        transform: active?"translateY(-2px)":"none",
                      }}>{i+1} {p.t}</div>
                      {i<PIPE.length-1 && <span style={{color:"#1E293B", fontSize:11}}>→</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PANEL */}
          <div style={{width:240, flexShrink:0, display:"flex", flexDirection:"column", gap:9}}>

            {/* Detail */}
            {sel ? (
              <div style={{background:"#0D1628", border:`1px solid ${sel.c}44`, borderRadius:11, padding:14, animation:"slidein .18s ease"}}>
                <div style={{fontSize:26, marginBottom:7}}>{sel.icon}</div>
                <div style={{fontSize:12, fontWeight:700, color:sel.c, marginBottom:3, lineHeight:1.2}}>{sel.name}</div>
                <div style={{fontFamily:"monospace", fontSize:9.5, color:"#64748B", marginBottom:9}}>{sel.sub}</div>
                <div style={{width:28, height:2, borderRadius:1, background:sel.c, marginBottom:9, opacity:.6}}/>
                <div style={{fontSize:10.5, color:"#94A3B8", lineHeight:1.7}}>{sel.detail}</div>
                <button onClick={()=>setSel(null)} style={{marginTop:11, width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:6, padding:"5px", color:"#64748B", fontSize:10, cursor:"pointer", fontFamily:"inherit"}}>✕ cerrar</button>
              </div>
            ) : (
              <div style={{background:"#0D1628", border:"1px solid rgba(255,255,255,.06)", borderRadius:11, padding:14, textAlign:"center"}}>
                <div style={{fontSize:26, marginBottom:7}}>👆</div>
                <div style={{fontSize:10.5, color:"#475569", lineHeight:1.65}}>Click en cualquier nodo para ver detalle completo del agente</div>
              </div>
            )}

            {/* Agent groups */}
            <div style={{background:"#0D1628", border:"1px solid rgba(255,255,255,.06)", borderRadius:11, padding:13}}>
              <div style={{fontFamily:"monospace", fontSize:9, color:"#475569", letterSpacing:".1em", textTransform:"uppercase", marginBottom:9}}>// agentes por grupo</div>
              {[{l:"Governance",n:10,c:C.gov,s:"G1–G10"},{l:"Data Lake",n:12,c:C.bro,s:"L1–L12"},{l:"Producto/IA",n:8,c:C.ag,s:"P1–P8"},{l:"Claude API",n:4,c:C.cl,s:"P7–P12"}].map(g=>(
                <div key={g.l} style={{marginBottom:8}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:3}}>
                    <span style={{fontSize:10.5, fontWeight:600, color:g.c}}>{g.l}</span>
                    <span style={{fontFamily:"monospace", fontSize:10.5, color:g.c}}>{g.n}</span>
                  </div>
                  <div style={{height:4, borderRadius:2, background:"rgba(255,255,255,.05)", overflow:"hidden"}}>
                    <div style={{height:"100%", borderRadius:2, background:g.c, opacity:.7, width:`${(g.n/34)*100}%`, transition:"width 1s"}}/>
                  </div>
                  <div style={{fontFamily:"monospace", fontSize:8.5, color:"#334155", marginTop:1}}>{g.s}</div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div style={{background:"#0D1628", border:"1px solid rgba(255,255,255,.06)", borderRadius:11, padding:13}}>
              <div style={{fontFamily:"monospace", fontSize:9, color:"#475569", letterSpacing:".1em", textTransform:"uppercase", marginBottom:9}}>// milestones 60 días</div>
              {[
                {d:"D1", l:"MCP MySQL + Governance", c:C.gov},
                {d:"D5", l:"Bronze · IngestAgent", c:C.bro},
                {d:"D15",l:"Silver + 3 agentes", c:C.sil},
                {d:"D20",l:"Gold certificado · Pipeline", c:C.gol},
                {d:"D35",l:"PME Proveedores MVP", c:C.or},
                {d:"D45",l:"Staging con datos reales", c:C.ag},
                {d:"D52",l:"ReportAgent · BrokerAgent", c:C.prod},
                {d:"D55",l:"🔒 Code Freeze", c:"#475569"},
                {d:"D60",l:"🎯 Demo ante CAPECO", c:C.or},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex", gap:7, marginBottom:5, alignItems:"flex-start"}}>
                  <div style={{fontFamily:"monospace", fontSize:8.5, fontWeight:700, color:m.c, background:`${m.c}12`, border:`1px solid ${m.c}28`, borderRadius:3, padding:"1px 5px", flexShrink:0, minWidth:30, textAlign:"center"}}>{m.d}</div>
                  <div style={{fontSize:10, color:"#94A3B8", lineHeight:1.4, paddingTop:1}}>{m.l}</div>
                </div>
              ))}
            </div>

            {/* Compliance */}
            <div style={{background:"#0D1628", border:`1px solid ${C.govBdr}`, borderRadius:11, padding:13}}>
              <div style={{fontFamily:"monospace", fontSize:9, color:C.gov, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8}}>// compliance auto</div>
              {["Data Contracts A3+A4 firmados","PII 0/1/2 clasificado auto","Audit log append-only","SLA monitoreado por campo","Linaje Bronze→Silver→Gold","RBAC por producto (A5)","Reporte semanal a CAPECO","Sign-off A10 CAPECO"].map((item,i)=>(
                <div key={i} style={{display:"flex", gap:5, marginBottom:4, fontSize:10, color:"#64748B"}}>
                  <span style={{color:C.prod, flexShrink:0}}>✓</span>{item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
