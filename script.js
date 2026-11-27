/* ============ DONNÉES ============ */
const MOIS=['Octobre','Novembre','Décembre'];
const D={
  seuil:-20000,
  ca:{prev:[170000,200000,250000],reel:[150000,null,null]},
  dep:{prev:[100000,100000,110000],reel:[105785,null,null]},
  ben:{prev:[70000,100000,140000],reel:[44215,null,null]},
  cat:{labels:['Salaires','Licences','Abonnements','Matériel'],
    prev:[[62000,14000,9000,15000],[62000,13000,10000,15000],[66000,14000,11000,19000]],
    reel:[[64200,15100,9485,17000],null,null]}
};
const P=[
  {id:'cloud',nom:'CloudSync Pro',type:'Logiciel SaaS · abonnement',emoji:'☁️',color:'#6f86ff',
   ca:{prev:[60000,72000,95000],reel:[52000,null,null]},cl:{prev:[40,48,60],reel:[38,null,null]},cac:{prev:[300,290,280],reel:[312,null,null]}},
  {id:'secure',nom:'SecureBox',type:'Boîtier cybersécurité · matériel',emoji:'🛡️',color:'#ff8a5c',
   ca:{prev:[45000,50000,60000],reel:[41000,null,null]},cl:{prev:[15,18,22],reel:[14,null,null]},cac:{prev:[650,640,620],reel:[710,null,null]}},
  {id:'eco',nom:'EcoSensor',type:'Capteurs IoT · matériel',emoji:'🌿',color:'#2dd4a7',
   ca:{prev:[38000,44000,55000],reel:[33000,null,null]},cl:{prev:[24,28,34],reel:[22,null,null]},cac:{prev:[400,390,380],reel:[410,null,null]}},
  {id:'data',nom:'DataLens Analytics',type:'Licence BI · logiciel',emoji:'📊',color:'#c084fc',
   ca:{prev:[27000,34000,40000],reel:[24000,null,null]},cl:{prev:[10,12,16],reel:[9,null,null]},cac:{prev:[800,780,750],reel:[820,null,null]}}
];
const state={period:'0',metric:'ca',product:'all',rate:100,expenseRate:100};

/* ============ OUTILS ============ */
const $=s=>document.querySelector(s);
const eur=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const k=v=>(v/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' k€';
const signed=v=>(v>0?'+':v<0?'−':'')+eur.format(Math.abs(v));
const pct=v=>(v>0?'+':v<0?'−':'')+Math.abs(v*100).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %';
const sum=a=>a.reduce((x,y)=>x+y,0);
const idxs=()=>state.period==='q'?[0,1,2]:[+state.period];
const periodLabel=()=>state.period==='q'?'Trimestre T4':MOIS[+state.period]+' 2026';
function agg(prev,reel,ix){
  const have=ix.filter(i=>reel[i]!=null);
  return {prev:sum(ix.map(i=>prev[i])),reel:have.length?sum(have.map(i=>reel[i])):null,cmp:sum(have.map(i=>prev[i])),partial:have.length>0&&have.length<ix.length};
}
function seg(el,opts,get,set){
  el.innerHTML=opts.map(o=>`<button data-v="${o[0]}" class="${String(get())===o[0]?'on':''}">${o[1]}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);seg(el,opts,get,set);};
}
function niceStep(x){if(x<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(x))),f=x/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p;}
function legend(el,series,thr){
  el.innerHTML=series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')+(thr?`<span><i class="dash"></i>Seuil d’alerte (${eur.format(D.seuil)})</span>`:'');
}

/* ============ GRAPHIQUE EN BARRES (SVG) ============ */
function barChart(el,o){
  const {cats,series,threshold,hl}=o, fmt=o.fmt||k, axis=o.axis||(v=>v===0?'0':(v/1000).toLocaleString('fr-FR')+' k');
  const W=720,H=o.h||300,m={t:26,r:14,b:34,l:58},iw=W-m.l-m.r,ih=H-m.t-m.b;
  const vals=series.flatMap(s=>s.values).filter(v=>v!=null);
  if(threshold!=null)vals.push(threshold);
  const rawMax=Math.max(...vals,0)*1.12,rawMin=Math.min(...vals,0)*1.2;
  const st=niceStep((rawMax-rawMin)/5);
  const hi=Math.ceil(rawMax/st)*st,lo=Math.floor(rawMin/st)*st;
  const y=v=>m.t+ih*(hi-v)/(hi-lo);
  const gw=iw/cats.length,n=series.length,bw=Math.min(52,gw*.7/n),gap=6;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  const nt=Math.round((hi-lo)/st);
  for(let i=0;i<=nt;i++){const v=lo+i*st;s+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${m.l-8}" y="${y(v)+4}" text-anchor="end">${axis(v)}</text>`;}
  if(hl!=null)s+=`<rect class="hl" x="${m.l+hl*gw}" y="${m.t}" width="${gw}" height="${ih}" rx="10"/>`;
  s+=`<line class="zero" x1="${m.l}" x2="${W-m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  cats.forEach((c,ci)=>{
    const gx=m.l+ci*gw+gw/2,total=n*bw+(n-1)*gap,x0=gx-total/2;
    series.forEach((se,si)=>{
      const v=se.values[ci],x=x0+si*(bw+gap);
      if(v==null){s+=`<rect class="ghost" x="${x}" y="${y(0)-26}" width="${bw}" height="26" rx="6"/><text class="soon" x="${x+bw/2}" y="${y(0)-10}" text-anchor="middle">à venir</text>`;return;}
      const y0=y(0),yv=y(v),top=Math.min(y0,yv),h=Math.max(Math.abs(yv-y0),2);
      const tip=`${c} · ${se.name}\n${o.tipFmt?o.tipFmt(v):eur.format(v)}`;
      const color=se.colorFor?se.colorFor(v,ci):se.color;
      s+=`<rect class="bar" data-tip="${tip}" style="fill:${color};transform-origin:50% ${v>=0?'100%':'0%'};animation-delay:${(ci*n+si)*60}ms" x="${x}" y="${top}" width="${bw}" height="${h}" rx="6"/>`;
      s+=`<text class="val" x="${x+bw/2}" y="${v>=0?top-6:top+h+14}" text-anchor="middle">${fmt(v)}</text>`;
    });
    s+=`<text class="cat" x="${gx}" y="${H-10}" text-anchor="middle">${c}</text>`;
  });
  if(threshold!=null)s+=`<line class="thr" x1="${m.l}" x2="${W-m.r}" y1="${y(threshold)}" y2="${y(threshold)}"/><text class="thrt" x="${W-m.r}" y="${y(threshold)-6}" text-anchor="end">Seuil ${eur.format(threshold)}</text>`;
  el.innerHTML=s+'</svg>';
}

/* ============ ALERTE + JAUGE (octobre) ============ */
function renderAlert(){
  const b=D.ben.reel[0],s=D.seuil,m=b-s,p=D.ben.prev[0];
  let lvl='ok',ico='✅',t='Situation sous contrôle';
  if(b<=s){lvl='bad';ico='🚨';t='Seuil d’alerte franchi';}
  else if(m<40000){lvl='warn';ico='⚠️';t='Zone de vigilance';}
  $('#alert').innerHTML=`<div class="alert ${lvl}"><div class="ico">${ico}</div><div><b>${t}</b><p>Bénéfice réel d’octobre : <strong>${eur.format(b)}</strong>, soit <strong>${eur.format(m)}</strong> au-dessus du seuil d’alerte (${eur.format(s)}). Il reste toutefois <strong>${eur.format(p-b)}</strong> sous l’objectif de ${eur.format(p)} (${pct(b/p-1)}).</p></div></div>`;
  const lo=-40000,hi=160000,pos=v=>((v-lo)/(hi-lo)*100);
  $('#gauge').innerHTML=`<div class="gauge"><div class="zones"><i style="width:${pos(s)}%;background:var(--bad)"></i><i style="width:${pos(0)-pos(s)}%;background:var(--warn)"></i><i style="width:${100-pos(0)}%;background:var(--ok)"></i></div>
  <div class="mk up rm" style="left:${pos(b)}%"><b>Réel</b>${k(b)}</div>
  <div class="mk dn" style="left:${pos(p)}%"><b>Prévu</b>${k(p)}</div>
  <div class="mk dn thrm" style="left:${pos(s)}%"><b>Seuil</b>${k(s)}</div></div>`;
}

/* ============ KPI ============ */
function chipFor(a,inv,money=true){
  if(a.reel==null)return{chip:'<span class="chip mute">Réel à venir</span>',ratio:0,good:true};
  const e=a.reel-a.cmp,p=a.cmp?e/a.cmp:0,good=inv?e<=0:e>=0;
  return{chip:`<span class="chip ${good?'ok':'bad'}">${e>=0?'▲':'▼'} ${pct(p)}</span>`,ratio:a.cmp?a.reel/a.cmp:0,good};
}
function kpiHTML({icon,label,val,sub,chip,ratio,good}){
  const w=Math.max(0,Math.min(ratio,1.3))/1.3*100;
  return `<div class="kpi"><div class="kpi-top"><span>${icon} ${label}</span>${chip}</div><div class="kpi-val">${val}</div><div class="kpi-sub">${sub}</div><div class="pbar"><i class="${good?'ok':'bad'}" style="width:${w}%"></i><u style="left:${100/1.3}%"></u></div></div>`;
}
function subText(a){
  if(a.reel==null)return `Prévu : <b>${eur.format(a.prev)}</b>`;
  return a.partial?`Prévu à date : <b>${eur.format(a.cmp)}</b> · T4 : ${eur.format(a.prev)}`:`Prévu : <b>${eur.format(a.prev)}</b> · écart ${signed(a.reel-a.prev)}`;
}
function renderKPIs(){
  const ix=idxs(),ca=agg(D.ca.prev,D.ca.reel,ix),dep=agg(D.dep.prev,D.dep.reel,ix),ben=agg(D.ben.prev,D.ben.reel,ix);
  const mk=(icon,label,a,inv)=>{const c=chipFor(a,inv);return kpiHTML({icon,label,val:a.reel!=null?eur.format(a.reel):'—',sub:subText(a),...c});};
  const mg={prev:ben.prev/ca.prev,cmp:ca.cmp?ben.cmp/ca.cmp:0,reel:ca.reel?ben.reel/ca.reel:null};
  const f=v=>(v*100).toFixed(1).replace('.',',')+' %';
  let mchip='<span class="chip mute">Réel à venir</span>',mratio=0,mgood=true;
  if(mg.reel!=null){const e=mg.reel-mg.cmp;mgood=e>=0;mratio=mg.cmp?mg.reel/mg.cmp:0;mchip=`<span class="chip ${mgood?'ok':'bad'}">${e>=0?'▲ +':'▼ −'}${Math.abs(e*100).toFixed(1).replace('.',',')} pt</span>`;}
  $('#kpis').innerHTML=mk('💶','Chiffre d’affaires',ca,false)+mk('🧾','Dépenses',dep,true)+mk('📈','Bénéfice',ben,false)+
    kpiHTML({icon:'🎯',label:'Marge nette',val:mg.reel!=null?f(mg.reel):'—',sub:`Prévu : <b>${f(mg.prev)}</b>${mg.reel!=null&&mg.cmp?` · à date ${f(mg.cmp)}`:''}`,chip:mchip,ratio:mratio,good:mgood});
}

/* ============ GRAPHIQUE PRINCIPAL ============ */
function renderMain(){
  const M={ca:'Chiffre d’affaires',dep:'Dépenses',ben:'Bénéfices'};
  seg($('#metricSeg'),Object.entries(M).map(([a,b])=>[a,b]),()=>state.metric,v=>{state.metric=v;renderMain();});
  const series=[{name:'Prévu',color:'var(--prev)',values:D[state.metric].prev},{name:'Réel',color:'var(--reel)',values:D[state.metric].reel}];
  const thr=state.metric==='ben'?D.seuil:null;
  legend($('#legMain'),series,thr!=null);
  barChart($('#chartMain'),{cats:MOIS,series,threshold:thr,hl:state.period==='q'?null:+state.period,h:330});
}

/* ============ DÉPENSES PAR POSTE ============ */
function renderCats(){
  const ix=idxs();
  $('#catHint').textContent=periodLabel()+' · barre claire = prévu, barre pleine = réel (rouge si dépassement)';
  const rows=D.cat.labels.map((l,c)=>({l,a:agg(D.cat.prev.map(m=>m[c]),D.cat.reel.map(m=>m?m[c]:null),ix)}));
  const shown=a=>a.reel!=null?a.cmp:a.prev;
  const max=Math.max(...rows.flatMap(r=>[shown(r.a),r.a.reel||0]));
  $('#cats').innerHTML=rows.map(({l,a})=>{
    const has=a.reel!=null,e=has?a.reel-a.cmp:0;
    return `<div class="crow"><div class="cl"><b>${l}</b><span>${has?eur.format(a.reel):'—'} <em>/ ${eur.format(shown(a))}</em></span>${has?`<span class="chip sm ${e<=0?'ok':'bad'}">${signed(e)}</span>`:''}</div>
    <div class="dbar"><i class="p" style="width:${shown(a)/max*100}%"></i><i class="r ${has&&e>0?'over':''}" style="width:${has?a.reel/max*100:0}%"></i></div></div>`;
  }).join('');
}

/* ============ SIMULATEUR ============ */
function renderSim(){
  const r=state.rate/100,o=state.expenseRate/100;
  $('#rateOut').textContent=state.rate+' %';
  $('#expenseRateOut').textContent=state.expenseRate+' %';
  const ca=[D.ca.reel[0],D.ca.prev[1]*r,D.ca.prev[2]*r];
  const dep=[D.dep.reel[0],D.dep.prev[1]*o,D.dep.prev[2]*o];
  const ben=ca.map((c,i)=>c-dep[i]);
  const run=[ben[0],ben[0]+ben[1],ben[0]+ben[1]+ben[2]];
  const cum=run[2],cumPrev=sum(D.ben.prev),worst=Math.min(...ben,...run);
  let lvl,msg;
  if(worst<=D.seuil){lvl='bad';msg=`🚨 <b>Seuil d’alerte franchi</b> : point bas à ${eur.format(worst)} (seuil ${eur.format(D.seuil)}). Une action corrective est nécessaire.`;}
  else if(ben.slice(1).some(b=>b<0)||cum<.75*cumPrev){lvl='warn';msg=`⚠️ <b>Zone de vigilance</b> : bénéfice cumulé T4 de ${eur.format(cum)}, soit ${Math.round(cum/cumPrev*100)} % de l’objectif (${eur.format(cumPrev)}).`;}
  else{lvl='ok';msg=`✅ <b>Trajectoire saine</b> : bénéfice cumulé T4 de ${eur.format(cum)}, soit ${Math.round(cum/cumPrev*100)} % de l’objectif (${eur.format(cumPrev)}).`;}
  const cls=v=>v<=D.seuil?'bad':v<0?'warn':'ok';
  const tile=(t,v,s)=>`<div class="tile ${cls(v)}"><small>${t}</small><b>${eur.format(v)}</b><span>${s}</span></div>`;
  $('#simTiles').innerHTML=tile('Bénéfice nov.',ben[1],`CA ${k(ca[1])} · Dép. ${k(dep[1])}`)+tile('Bénéfice déc.',ben[2],`CA ${k(ca[2])} · Dép. ${k(dep[2])}`)+tile('Cumul T4',cum,`Objectif ${k(cumPrev)}`);
  $('#simAlert').innerHTML=`<div class="alert ${lvl}" style="padding:12px 14px"><p style="color:var(--txt)">${msg}</p></div>`;
  const series=[{name:'Bénéfice prévu',color:'var(--prev)',values:D.ben.prev},{name:'Bénéfice projeté (oct. = réel)',color:'var(--warn)',colorFor:v=>v<=D.seuil?'var(--bad)':'var(--warn)',values:ben}];
  legend($('#legSim'),series,true);
  barChart($('#chartSim'),{cats:MOIS,series,threshold:D.seuil,h:300});
}
function initSim(){
  $('#rate').oninput=e=>{state.rate=+e.target.value;renderSim();};
  $('#expenseRate').oninput=e=>{state.expenseRate=+e.target.value;renderSim();};
  const PR=[['Tendance actuelle',88,106],['Optimiste',100,100],['Pessimiste',70,115],['Crise',50,125]];
  $('#presets').innerHTML=PR.map((p,i)=>`<button data-i="${i}">${p[0]}</button>`).join('');
  $('#presets').onclick=e=>{const b=e.target.closest('button');if(!b)return;const p=PR[+b.dataset.i];state.rate=p[1];state.expenseRate=p[2];$('#rate').value=p[1];$('#expenseRate').value=p[2];renderSim();};
}

/* ============ PRODUITS ============ */
const costArr=(p,kk)=>p.cl[kk].map((c,i)=>c==null?null:c*p.cac[kk][i]);
const selP=()=>state.product==='all'?P:P.filter(p=>p.id===state.product);
function renderProducts(){
  const ix=idxs();
  $('#products').innerHTML=P.map(p=>{
    const ca=agg(p.ca.prev,p.ca.reel,ix),cl=agg(p.cl.prev,p.cl.reel,ix),co=agg(costArr(p,'prev'),costArr(p,'reel'),ix);
    const c=chipFor(ca,false),cacP=co.prev/cl.prev,cacR=cl.reel?co.reel/cl.reel:null;
    const circumference=2*Math.PI*18,progress=Math.min(1,Math.max(0,c.ratio));
    const progressLabel=ca.reel==null?'À venir':`${Math.round(c.ratio*100)} % atteint`;
    return `<div class="pcard ${state.product===p.id?'sel':''}" data-id="${p.id}" style="--pc:${p.color}">
      <div class="ph"><span class="em">${p.emoji}</span><div><b>${p.nom}</b><small>${p.type}</small></div></div>
      <div class="prow">CA <b>${ca.reel!=null?eur.format(ca.reel):'—'}</b> / ${eur.format(ca.prev)} ${c.chip}</div>
      <div class="product-progress ${ca.reel==null?'pending':''}">
        <svg class="progress-donut" viewBox="0 0 56 56" role="img" aria-label="Progression du chiffre d’affaires : ${progressLabel}">
          <circle class="progress-track" cx="28" cy="28" r="18"/>
          <circle class="progress-value" cx="28" cy="28" r="18" transform="rotate(-90 28 28)" style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference*(1-progress)}"/>
          <text class="progress-text" x="28" y="31" text-anchor="middle">${ca.reel==null?'—':Math.round(c.ratio*100)+'%'}</text>
        </svg>
        <div class="progress-caption"><b>Objectif de CA</b><small>${progressLabel}</small></div>
      </div>
      <div class="mini"><div><small>Clients acquis</small><b>${cl.reel??'—'}</b> <em>/ ${cl.prev}</em></div>
      <div><small>CAC moyen</small><b>${cacR!=null?eur.format(cacR):'—'}</b> <em>/ ${eur.format(cacP)}</em></div></div></div>`;
  }).join('');
}
$('#products').onclick=e=>{const c=e.target.closest('.pcard');if(!c)return;state.product=state.product===c.dataset.id?'all':c.dataset.id;renderProducts();renderAcq();};

/* ============ ACQUISITIONS ============ */
function series3(get){
  const L=selP();
  return ['prev','reel'].map(kk=>[0,1,2].map(i=>{const vs=L.map(p=>get(p,kk)[i]);return vs.some(v=>v==null)?null:sum(vs);}));
}
function renderAcq(){
  seg($('#prodSeg'),[['all','Tous'],...P.map(p=>[p.id,p.emoji+' '+p.nom])],()=>state.product,v=>{state.product=v;renderProducts();renderAcq();});
  const L=selP(),name=state.product==='all'?'tous les produits':L[0].nom;
  $('#acqHint').textContent='Périmètre : '+name+' · coût d’acquisition = nombre de nouveaux clients × CAC';
  const [clP,clR]=series3((p,kk)=>p.cl[kk]),[coP,coR]=series3(costArr);
  const sP=[{name:'Prévu',color:'var(--prev)'},{name:'Réel',color:'var(--reel)'}];
  legend($('#leg2'),sP);legend($('#leg3'),sP);
  barChart($('#chartCl'),{cats:MOIS,series:[{...sP[0],values:clP},{...sP[1],values:clR}],fmt:v=>String(v),axis:v=>String(v),tipFmt:v=>v+' clients',h:280});
  barChart($('#chartCost'),{cats:MOIS,series:[{...sP[0],values:coP},{...sP[1],values:coR}],h:280});
  // stats
  const caR=sum(L.map(p=>p.ca.reel[0])),caP=sum(L.map(p=>p.ca.prev[0]));
  const cacP=coP[0]/clP[0],cacR=coR[0]/clR[0];
  const stat=(t,v,s,chip)=>`<div class="tile"><small>${t}</small><b style="font-size:1.25rem">${v}</b><span>${s}</span>${chip||''}</div>`;
  const cChip=(r,p,inv)=>{const e=r/p-1,good=inv?e<=0:e>=0;return `<span class="chip sm ${good?'ok':'bad'}">${pct(e)}</span>`;};
  $('#acqStats').innerHTML=
    stat('Clients acquis · octobre',clR[0],`Prévu : ${clP[0]}`,cChip(clR[0],clP[0],false))+
    stat('Objectif clients T4',sum(clP),`Atteint à date : ${Math.round(clR[0]/sum(clP)*100)} %`)+
    stat('CAC moyen · octobre',eur.format(cacR),`Prévu : ${eur.format(cacP)}`,cChip(cacR,cacP,true))+
    stat('Coût d’acq. / CA · octobre',(coR[0]/caR*100).toFixed(1).replace('.',',')+' %',`Prévu : ${(coP[0]/caP*100).toFixed(1).replace('.',',')} %`);
  // tableau
  const cell=(p,r,f)=>`${f(p)} <small>→ ${r==null?'—':f(r)}</small>`;
  const row=(l,pa,ra,f)=>`<tr><td>${l}</td>${[0,1,2].map(i=>`<td>${cell(pa[i],ra[i],f)}</td>`).join('')}</tr>`;
  const cacPa=coP.map((c,i)=>c/clP[i]),cacRa=coR.map((c,i)=>c==null?null:c/clR[i]);
  $('#cacTable').innerHTML=`<table><thead><tr><th>Prévu → Réel</th>${MOIS.map(m=>`<th>${m}</th>`).join('')}</tr></thead><tbody>
    ${row('Nouveaux clients',clP,clR,v=>num(v))}${row('Coût d’acquisition total',coP,coR,v=>eur.format(v))}${row('CAC moyen',cacPa,cacRa,v=>eur.format(v))}</tbody></table>`;
}
const num=v=>String(Math.round(v));

/* ============ RÉCAP ============ */
function renderRecap(){
  const e=(r,p)=>r==null?'<td>—</td>':`<td class="${r-p>=0?'pos':'neg'}">${signed(r-p)}</td>`;
  const eInv=(r,p)=>r==null?'<td>—</td>':`<td class="${r-p<=0?'pos':'neg'}">${signed(r-p)}</td>`;
  const rows=MOIS.map((m,i)=>`<tr><td>${m}</td><td>${eur.format(D.ca.prev[i])}</td><td>${D.ca.reel[i]!=null?eur.format(D.ca.reel[i]):'—'}</td>${e(D.ca.reel[i],D.ca.prev[i])}
    <td>${eur.format(D.dep.prev[i])}</td><td>${D.dep.reel[i]!=null?eur.format(D.dep.reel[i]):'—'}</td>${eInv(D.dep.reel[i],D.dep.prev[i])}
    <td>${eur.format(D.ben.prev[i])}</td><td>${D.ben.reel[i]!=null?eur.format(D.ben.reel[i]):'—'}</td>${e(D.ben.reel[i],D.ben.prev[i])}</tr>`).join('');
  const T=a=>sum(a),R=a=>sum(a.filter(v=>v!=null));
  $('#recap').innerHTML=`<table><thead><tr><th>Mois</th><th>CA prévu</th><th>CA réel</th><th>Écart</th><th>Dép. prévues</th><th>Dép. réelles</th><th>Écart</th><th>Bén. prévu</th><th>Bén. réel</th><th>Écart</th></tr></thead><tbody>${rows}
    <tr class="total"><td>Total T4</td><td>${eur.format(T(D.ca.prev))}</td><td>${eur.format(R(D.ca.reel))} <small>(à date)</small></td><td></td><td>${eur.format(T(D.dep.prev))}</td><td>${eur.format(R(D.dep.reel))} <small>(à date)</small></td><td></td><td>${eur.format(T(D.ben.prev))}</td><td>${eur.format(R(D.ben.reel))} <small>(à date)</small></td><td></td></tr></tbody></table>`;
}

/* ============ INFOBULLE ============ */
const tip=$('#tip');
document.addEventListener('mousemove',e=>{
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(!t){tip.classList.remove('show');return;}
  tip.textContent=t.dataset.tip;tip.classList.add('show');
  tip.style.left=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8)+'px';tip.style.top=(e.clientY+14)+'px';
});

/* ============ DÉMARRAGE ============ */
function renderPeriod(){renderKPIs();renderMain();renderCats();renderProducts();}
seg($('#periodSeg'),[['0','Octobre<br><small>En cours</small>'],['1','Novembre<br><small>À venir</small>'],['2','Décembre<br><small>À venir</small>'],['q','Trimestre']],()=>state.period,v=>{state.period=v;renderPeriod();});
$('#themeBtn').onclick=()=>{const r=document.documentElement;r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';};
renderAlert();renderPeriod();initSim();renderSim();renderAcq();renderRecap();