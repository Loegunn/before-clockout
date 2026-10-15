'use strict';
// Original life-simulation presentation over the workflow engine.
function life(){if(!S.life)S.life={mood:75,skill:30,trust:50,relations:[65,65,65],stories:[],choices:[],onboard:false};return S.life}
const clamp=n=>Math.max(0,Math.min(100,n));
const colleagues=[['陈主任','站点主任','工作协调、请假审批','👩🏻‍💼'],['林社工','社区搭档','共同指标、服务分工','🧑🏻‍💼'],['周督导','专业督导','专业反思、服务边界','👨🏻‍🏫']];
types.rest=['短暂休整',30];types.talk=['同事沟通',30];
Object.assign(names,{home:'今天，慢慢做好',actions:'把时间留给重要的事',relations:'与你一起工作的人',history:'这一年，留下了什么'});
let actionCategory='front';
function story(text){life().stories.unshift({id:uid(),date:S.date,text})}
function freeSlot(duration,date=S.date){if(isOff(date)||S.leaves.some(l=>l.status==='approved'&&date>=l.from&&date<=l.to))return null;for(const [a,b] of [[540,720],[840,1080]])for(let t=a;t+duration<=b;t+=10)if(!S.events.some(e=>e.date===date&&e.status!=='cancelled'&&t<minutes(e.time)+e.duration&&t+duration>minutes(e.time)))return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');return null}
function freeMinutes(){if(isOff(S.date)||S.leaves.some(l=>l.status==='approved'&&S.date>=l.from&&S.date<=l.to))return 0;let total=0;for(const [a,b] of [[540,720],[840,1080]])for(let t=a;t<b;t++)if(!S.events.some(e=>e.date===S.date&&e.status!=='cancelled'&&t>=minutes(e.time)&&t<minutes(e.time)+e.duration))total++;return total}
function quick(type,person){selected=S.date;schedule(type,person);const slot=freeSlot(types[type][1]);if(slot)$('ftime').value=slot;else toast('今天没有足够普通工作空档，请选其他日期或调整日程')}
const coreExecute=execute;
execute=function(e){if(e.status!=='planned')return;let l=life();if(e.type==='rest'||e.type==='talk'){e.status='done';if(e.overtime)S.ot+=e.duration/60;if(e.type==='rest'){S.fatigue=clamp(S.fatigue-8);l.mood=clamp(l.mood+5);story('你留了30分钟休整，重新整理注意力。')}else{if(Number.isInteger(e.colleague))l.relations[e.colleague]=clamp(l.relations[e.colleague]+4);l.skill=clamp(l.skill+1);story(e.title+'。沟通已完成；正式督导时数仍需另行预约、参与和登记。')}return}coreExecute(e);S.fatigue=clamp(S.fatigue+Math.ceil(e.duration/90));if(e.type==='supervision')l.skill=clamp(l.skill+e.duration/60);else if(['training','case'].includes(e.type))l.skill=clamp(l.skill+1);if(['home','phone','group'].includes(e.type))l.trust=clamp(l.trust+0.5);story('完成「'+(e.title||types[e.type][0])+'」'+e.duration+'分钟。'+(S.docs.some(d=>d.event===e.id)?'请预留文书时间，按期登记。':''))};
function todayHasConflict(){const ev=S.events.filter(e=>e.date===S.date&&e.status!=='cancelled');return ev.some((e,i)=>ev.slice(i+1).some(x=>(e.status==='planned'||x.status==='planned')&&minutes(e.time)<minutes(x.time)+x.duration&&minutes(e.time)+e.duration>minutes(x.time)))}
const originalExecuteToday=executeToday;
executeToday=function(){if(todayHasConflict())return toast('今天的工作时间重叠，请在日历改期后再执行');originalExecuteToday()};
const coreAdvance=advance;
advance=function(){if(todayHasConflict())return toast('今天的工作时间重叠，请在日历改期后再执行');const date=S.date;coreAdvance();if(date!==S.date){S.fatigue=clamp(S.fatigue-3);life().mood=clamp(life().mood+1);save()}};
const dilemmas=[
 ['门没打开','预约入户的陈伯不愿开门，隔着门说今天不想见人。',[['尊重意愿，商量另约','记录拒访情况，先评估是否可以电话跟进。',2,2],['请家属协助沟通','先征询本人同意，再联系家属协助约时间。',1,1],['坚持今天必须入户','对方感到被催促。指标不能替代知情同意。',-5,-2]]],
 ['临时多了一项工作','搭档正在处理紧急转介，请你协助整理明天的小组材料。',[['先看日历再协商','你们明确了分工和交付时间，避免口头包办。',2,2],['一口答应全部包下','你获得感谢，但压力增加；仍需自行排入日历。',1,-4],['说明现有期限','先保证已预约服务，提出可协助的部分。',1,2]]],
 ['相片里的个人信息','活动照片拍到了对象的证件资料，正准备上传。',[['遮挡信息并核对同意','记录只保留服务所需内容，检查后再上传。',3,2],['先问督导如何处理','专业讨论不自动替代材料整理时间。',2,1],['直接上传原图','模拟反馈：可能暴露个人资料，需要撤回并修正。',-6,-3]]],
 ['报销材料差一张','活动结束，供应商还没有提供合规发票。',[['及时补齐并保留沟通记录','报销仍需全部材料；不要等到月底才处理。',2,1],['联系财务确认补交流程','先核实要求，安排追踪和报销整理时间。',2,1],['借其他发票代替','模拟反馈：材料与真实支出不对应，不能通过核验。',-6,-3]]],
 ['小组有人缺席','招募了8名组员，但其中两人本节临时有事。',[['如实记录并了解原因','招募人数与每节出席不同；及时评估参与障碍。',3,2],['与组员协商下一节时间','调整需兼顾其他成员，也要更新日历。',2,1],['替缺席者签名','模拟反馈：签到不真实，需要纠正。',-6,-3]]],
 ['培训还是赶材料','培训证明还未下载，明天已有两份服务记录到期。',[['先预留到期文书时段','把培训证明下载和心得登记也加入后续安排。',2,2],['核对日历分开安排','确认两项工作均有实际时间，再处理。',2,2],['留到月底一起补','两日上传期限仍然有效；逾期会阻止推进。',-2,-3]]],
 ['照顾者说很累','电访中，照顾者说最近很疲惫，希望有人听一听。',[['了解需要并另约服务','保持倾听，评估支持需要，必要时预约个案评估。',3,2],['与督导讨论支持方向','不随意承诺资源，先核实可提供的支持。',2,2],['只问完名单上的问题','模拟反馈：完成数量不代表回应了真实需要。',-3,-1]]],
 ['临近评估','主任提醒准备阶段材料，服务预约也已经排满。',[['按统计期间核对证据','区分已完成服务与已上传材料，列出缺项。',2,2],['与搭档分工核对','社区共同指标只计算一次，说明责任和来源。',2,2],['把下月服务提前算进去','模拟反馈：统计期间不能调整来弥补缺口。',-5,-3]]]
];
function pendingStory(){let day=+S.date.slice(-2),key=mo(S.date);return day>=5&&!life().choices.some(c=>c.key===key)}
function scenario(){let idx=(+S.date.slice(0,4)*12 + +S.date.slice(5,7))%dilemmas.length,d=dilemmas[idx];show(`<h2>${d[0]}</h2><p>${d[1]}</p><p class="muted">虚构训练情境 · 选择不会自动完成服务或材料。</p>${d[2].map((c,i)=>`<p><button class="choice" onclick="chooseStory(${idx},${i})"><strong>${c[0]}</strong></button></p>`).join('')}<button onclick="closeModal()">稍后处理</button>`)}
function chooseStory(idx,n){if(!pendingStory())return closeModal();let d=dilemmas[idx],c=d[2][n];life().choices.push({key:mo(S.date),date:S.date,title:d[0],choice:c[0]});life().trust=clamp(life().trust+c[2]);life().mood=clamp(life().mood+c[3]);story(d[0]+'：'+c[0]+'。'+c[1]);save();show(`<h2>选择之后</h2><p>${c[1]}</p><p class="muted">状态变化是教学模拟，不代表正式评估分数。相关工作仍须安排日程。</p><button class="primary" onclick="closeModal()">回到今天</button>`)}
function social(i){show(`<h2>与${colleagues[i][0]}沟通</h2><p>把问题说清楚，也给彼此留出时间。</p>${['协商近期工作安排','讨论服务中的困惑','说明工作量与支持需要'].map(t=>`<p><button onclick="bookTalk(${i},'${t}')">${t} · 30分钟</button></p>`).join('')}<p class="muted">每位同事每天一次。非正式交流不计督导时数。</p><button onclick="closeModal()">返回</button>`)}
function bookTalk(i,t){if(S.events.some(e=>e.type==='talk'&&e.date===S.date&&e.colleague===i&&e.status!=='cancelled'))return toast('今天已安排与这位同事沟通');let time=freeSlot(30);if(!time)return toast('今天没有30分钟空档，请先调整日历');S.events.push({id:uid(),type:'talk',date:S.date,time,duration:30,people:[],colleague:i,title:'与'+colleagues[i][0]+t,status:'planned',overtime:false});closeModal();save();toast('已安排30分钟沟通，执行后生效')}
function rest(){if(S.events.some(e=>e.type==='rest'&&e.date===S.date&&e.status!=='cancelled'))return toast('今天已经安排休整');let time=freeSlot(30);if(!time)return toast('今天无可用工作空档；休息日推进日期会恢复状态');S.events.push({id:uid(),type:'rest',date:S.date,time,duration:30,people:[],title:'短暂休整',status:'planned',overtime:false});save()}
render=function(){ensureMonthlySupervision();let l=life();$('nav').innerHTML=[['home','◉','今天'],['actions','ϟ','行动'],['relations','♧','关系'],['calendar','▦','日历'],['history','▤','记录']].map(([p,i,n])=>`<button class="${page===p?'active':''}" onclick="nav('${p}')"><span>${i}</span>${n}</button>`).join('');$('section').textContent='穗榕社区 · 一线社工实训';$('heading').textContent=names[page]||'下班之前';$('date').textContent=S.date+' · 周'+'日一二三四五六'[dt(S.date).getDay()];$('timeleft').textContent=S.finished?'这一年已完成':freeMinutes()+' 分钟可安排';$('profile').innerHTML=`<div class="profile-top"><div class="identity"><span class="portrait">🧑🏻‍💼</span><div><b>社区新人</b><small>一个社区，两位同行者</small></div></div><span class="timebadge">${isOff(S.date)?'休息日':'工作日'} · 第${Math.floor((dt(S.date)-dt('2027-04-01'))/864e5)+1}天</span></div><div class="meters">${[['精力',100-S.fatigue,'#eb665c'],['心情',l.mood,'#e4ad43'],['专业成长',l.skill,'#3188ed'],['居民信任',l.trust,'#50aa75'],['压力',S.fatigue,'#8365c5']].map(([t,n,c])=>`<div class="meter"><div class="row"><b>${t}</b><small>${Math.round(n)}</small></div><div class="track"><i style="width:${clamp(n)}%;background:${c}"></i></div></div>`).join('')}</div>`;let urgent=S.docs.filter(d=>!d.uploaded&&docDeadline(d)<=add(S.date,1));$('notice').innerHTML=urgent.length?`<div class="warn">${urgent.length}份文书临近截止。<button onclick="nav('system')">处理文书 →</button></div>`:'';({home:renderHome,actions:renderActions,relations:renderRelations,history:renderHistory,calendar:renderCalendar,people:renderPeople,projects:renderProjects,system:renderSystem,finance:renderFinance,learning:renderLearning,review:renderReview,rules:renderRules}[page]||renderHome)()};
function renderHome(){let events=S.events.filter(e=>e.date===S.date&&e.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time));$('content').innerHTML=`<div class="hero"><span class="chapter">第一年 · ${S.date<'2027-07'?'认识社区':S.date<'2027-10'?'建立连接':S.date<'2028-01'?'在忙碌中成长':'回望与继续'}</span><h2>下班之前，<br>还有一件值得做好的事。</h2><p>安排服务，也给记录、学习和自己留出时间。</p><button class="primary" onclick="nav('actions')">安排今天的行动 →</button></div><div class="quickstats">${[['本月探访',visits()+' / 15户','review'],['待上传',S.docs.filter(d=>!d.uploaded).length+'份','system'],['培训累计',hours('training').toFixed(1)+'小时','learning']].map(([n,v,p])=>`<button onclick="nav('${p}')"><small>${n}</small><b>${v}</b></button>`).join('')}</div><div class="split"><div class="card"><div class="toolbar"><h2>今天的安排</h2><button onclick="executeToday()">执行今日工作</button></div>${events.map(e=>`<div class="listitem row"><div><small>${e.time} · ${e.duration}分钟</small><h3>${esc(e.title||types[e.type][0])}</h3></div><span class="tag">${e.status==='done'?'已完成':'已预约'}</span></div>`).join('')||'<p class="muted">日历还是空的。月初先核对街道名单、申请活动经费，再预约服务。</p>'}<p class="muted">执行工作后，前往服务系统填写并上传材料；完成不等于已登记。</p></div><div><div class="card"><h2>工作中的一刻</h2>${pendingStory()?'<p>一段新的社区故事，等你作出选择。</p><button class="primary" onclick="scenario()">看看发生了什么 →</button>':'<p>先听见需要，再决定下一步。</p><button onclick="nav(\'relations\')">找同事聊聊</button>'}</div><div class="card"><h3>本月别忘记</h3><p>${S.roster[mo(S.date)]?'✓ 已核对街道名单':'○ 核对街道对象名单'}<br>○ 安排培训与督导<br>○ 当月服务、文书、报销清零</p><button onclick="nav('review')">查看月结与评估</button></div></div></div><div class="card"><h3>站点消息</h3>${S.logs.slice(0,3).map(l=>`<p><small>${l.date}</small><br>${esc(l.text)}</p>`).join('')||'<p class="muted">欢迎来到穗榕社区。所有居民与事件均为虚构。</p>'}</div>`}
const categories={front:['一线服务',['home','phone','case','group','small','policy','large','org','team','vol']],desk:['文书行政',['paper','fund','reimburse','roster','research','plan','report']],learn:['学习支持',['training','supervision','charity']]};
function renderActions(){let hints={home:'选择家庭，每户30分钟；当月15户。',phone:'每人10分钟；记录实际联系内容。',case:'先建个案并准备项目材料。',group:'先招募至少8人，整组预算200元。',small:'先申请预算，活动后需五项材料。',policy:'先申请预算，实际参与者需登记。',large:'共同指标，登记实际参与人次。',paper:'直接填写上传，成功后自动扣30分钟。',fund:'月初安排申请时间，再进入经费页。',reimburse:'准备四项凭证，直接提交并扣30分钟。',training:'游戏时间模拟观看，登记证明与心得。',supervision:'正式督导需预约、参与并登记。'};$('content').innerHTML=`<div class="linkgrid">${[['people','社区名册'],['projects','个案与小组'],['system','服务系统'],['finance','经费报销'],['learning','培训督导'],['review','月结评估']].map(([p,n])=>`<button onclick="nav('${p}')">${n} →</button>`).join('')}</div><div class="tabs">${Object.entries(categories).map(([k,v])=>`<button class="${actionCategory===k?'active':''}" onclick="actionCategory='${k}';render()">${v[0]}</button>`).join('')}</div><div class="grid">${categories[actionCategory][1].map(t=>`<div class="card taskcard"><div class="task-head"><span class="task-icon">${t==='home'?'⌂':t==='phone'?'☏':t==='training'?'▤':'✧'}</span><h3>${types[t][0]}</h3></div><p class="muted">${hints[t]||'先规划服务内容与参与对象，再预留记录时间。'}</p><div class="bottom"><span class="cost">◷ ${types[t][1]}分钟${['home','phone'].includes(t)?'起':''}</span><button onclick="quick('${t}')">安排 ＋</button></div></div>`).join('')}</div><div class="card"><h3>也照顾好自己</h3><button onclick="rest()">短暂休整 · 30分钟</button> <button onclick="leaveForm()">申请请假／调休</button><p class="muted">加班余额 ${S.ot.toFixed(1)}小时。普通沟通与休整不计专业服务指标。</p></div>`}
function renderRelations(){$('content').innerHTML=`<p class="muted">关系数值仅用于模拟沟通体验。服务质量不等于让所有人满意。</p><div class="grid">${colleagues.map((p,i)=>`<div class="card"><div class="task-head"><span class="avatar">${p[3]}</span><div><h2>${p[0]}</h2><span class="tag">${p[1]}</span></div></div><p>${p[2]}</p>${bar('协作默契',life().relations[i],100)}<button onclick="social(${i})">沟通 · 30分钟</button></div>`).join('')}</div><div class="card"><div class="toolbar"><h2>社区里的牵挂</h2><button onclick="nav('people')">完整名册 →</button></div>${S.people.slice().sort((a,b)=>due(a).next.localeCompare(due(b).next)).slice(0,6).map(p=>`<div class="listitem row"><div><b>${esc(p.name)}</b> <span class="tag">${p.level}级</span><p>${p.need}</p><small>跟进期限 ${due(p).next}</small></div><button onclick="quick('phone',${p.id})">预约电访</button></div>`).join('')}</div>`}
function renderHistory(){$('content').innerHTML=`<div class="toolbar"><p>每一次安排，都成为这一年的一部分。</p><button onclick="exportSave()">导出存档</button></div><div class="card"><h2>月度回顾</h2>${S.closed.map(m=>`<details><summary>${m.month} · ${m.gaps.length?'仍有'+m.gaps.length+'项待改善':'全部完成'}</summary><p>${esc(m.gaps.join('；')||'本月流程已完成。')}</p></details>`).join('')||'<p class="muted">完成第一个月后，这里会留下你的月结回顾。</p>'}</div><div class="card"><h2>工作手记</h2>${life().stories.slice(0,150).map(s=>`<div class="story"><small class="stamp">${s.date}</small><p>${esc(s.text)}</p></div>`).join('')||'<p>2027年4月1日，你接过了穗榕社区的工作名册。</p>'}</div>`}
function onboarding(n=0){const pages=[['🗓️','安排你的一年','你是一名驻点社工，从2027年4月开始，陪伴一个社区走过一年。','行动会占用真实日历中的分钟。先看用时，再预约对象和项目。','工作日09:00—12:00、14:00—18:00。也要留出文书时间。'],['🤝','回应需要，也照顾自己','在探访、个案、小组与临时工作之间，学习安排与协商。','服务完成后，两日内写记录并上传；月末材料和报销必须清零。','状态条是模拟反馈。督导、培训和休整也需要安排时间。'],['📖','回顾你的第一年','选择会留下记录。每次月结，看看哪些工作完成了，哪些需要调整。','10月评估4—9月；3月评估10—2月。培训与督导别拖到最后。','所有内容用于流程实训；虚构对象、模拟附件，不上传真实居民资料。']];let p=pages[n];show(`<div class="onboard"><div style="text-align:right"><button onclick="finishIntro()">跳过</button></div><div class="art">${p[0]}</div><h2>${p[1]}</h2><p>${p[2]}</p><div class="hint">${p[3]}</div><div class="hint">${p[4]}</div><div class="dots">${pages.map((_,i)=>i===n?'━':'●').join('　')}</div><div class="modalfoot">${n?`<button onclick="onboarding(${n-1})">上一页</button>`:''}<button class="primary" onclick="${n===2?'finishIntro()':'onboarding('+(n+1)+')'}">${n===2?'开始第一天':'下一页'}</button></div></div>`)}
function finishIntro(){life().onboard=true;closeModal();save()}

// One appointment per month. Full days are split around the two-hour lunch break.
function ensureMonthlySupervision(){
 if(S.finished)return;
 const l=life(),month=mo(S.date);l.supervisionMonths??={};
 if(l.supervisionMonths[month]?.date)return;
 let entry=l.supervisionMonths[month];
 if(!entry)entry=l.supervisionMonths[month]={full:Math.random()<0.5};
 const parts=entry.full?[[540,180],[840,240]]:[[840,210]];
 let days=[];
 for(let date=S.date;mo(date)===month;date=add(date,1)){
  if(isOff(date)||S.leaves.some(l=>l.status==='approved'&&date>=l.from&&date<=l.to))continue;
  if(parts.some(([start,len])=>S.events.some(e=>e.date===date&&e.status!=='cancelled'&&start<minutes(e.time)+e.duration&&start+len>minutes(e.time))))continue;
  days.push(date);
 }
 if(!days.length){if(!entry.warned){S.logs.unshift({date:S.date,text:'本月双百督导待排期：没有完整空档，请调整日程，系统会再次尝试安排。'});entry.warned=true;}return;}
 const date=days[Math.floor(Math.random()*days.length)];entry.date=date;
 for(const [start,duration] of parts)S.events.push({id:uid(),date,time:String(Math.floor(start/60)).padStart(2,'0')+':'+String(start%60).padStart(2,'0'),duration,type:'supervision',people:[],project:'',status:'planned',overtime:false,monthlySupervision:month,title:'双百督导 · '+(entry.full?'全天（'+(start===540?'上午':'下午')+'）':'半天')});
 S.logs.unshift({date:S.date,text:'双百督导通知：'+date+'，'+(entry.full?'09:00—12:00、14:00—18:00，共7小时':'14:00—17:30，共3.5小时')+'。已预留日历；完成后需上传督导记录。专业成长每完成1小时增加1点（上限100）。'});
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}
}

// Direct document submission: reserve actual working time only after validation.
const legacyConsume=consume;
function directWorkSlot(duration,period='auto'){
 if(isOff(S.date)||S.leaves.some(l=>l.status==='approved'&&S.date>=l.from&&S.date<=l.to))return null;
 const ranges=period==='am'?[[540,720]]:period==='pm'?[[840,1080]]:[[540,720],[840,1080]];
 for(const [a,b] of ranges)for(let t=a;t+duration<=b;t+=5){
  if(!S.events.some(e=>e.date===S.date&&e.status!=='cancelled'&&t<minutes(e.time)+e.duration&&t+duration>minutes(e.time)))return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
 }
 return null;
}
consume=function(kind,needed){
 if(!['paper','reimburse'].includes(kind))return legacyConsume(kind,needed);
 const available=S.events.filter(e=>e.type===kind&&e.status==='done'&&mo(e.date)===mo(S.date)&&e.date<=S.date&&e.capacity>0).reduce((n,e)=>n+e.capacity,0);
 const missing=Math.max(0,needed-available),period=$('workperiod')?.value||'auto';
 const time=missing?directWorkSlot(missing,period):null;
 if(missing&&!time)return false;
 if(missing){S.events.push({id:uid(),date:S.date,time,duration:missing,type:kind,people:[],status:'done',capacity:missing,overtime:false,title:kind==='paper'?'填写并提交文书':'整理并提交报销',directSubmission:true});S.fatigue=clamp(S.fatigue+1);}
 return legacyConsume(kind,needed);
};
const workflowShow=show;
show=function(html){
 if(/onclick="(?:uploadDoc|submitReimbursement|submitProject|confirmFinish)\(/.test(html))html=html.replace('<div class="modalfoot">','<label for="workperiod">使用今天的工作时段</label><select id="workperiod"><option value="auto">自动选择空闲时段</option><option value="am">上午 · 09:00—12:00</option><option value="pm">下午 · 14:00—18:00</option></select><p class="muted">无需先安排文书。提交成功后自动记入日历；时段不足时保留表单，方便调整。</p><div class="modalfoot">');
 workflowShow(html);
};

page='home';render();if(!life().onboard)onboarding();
