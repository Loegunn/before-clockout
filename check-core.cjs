const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements={};function el(id){return elements[id]??={innerHTML:'',textContent:'',style:{},value:'',checked:false,showModal(){},close(){},addEventListener(){}}}let sandbox={document:{getElementById:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},console,setTimeout:()=>0,clearTimeout(){},window:{},confirm:()=>true,Date,Math,Set,Blob};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('engine.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('life.js','utf8'),sandbox);function run(code){return vm.runInContext(code,sandbox)}
run('const monthlyScheduler=ensureMonthlySupervision;ensureMonthlySupervision=()=>{};S=fresh()');
assert.equal(run('S.people.length'),70);assert.equal(run('S.people.filter(p=>p.level>=5).length'),50);
assert.equal(run("due(S.people[0]).next"),'2027-04-07');assert.equal(run("due(S.people[1]).follow"),'2027-04-14');assert.equal(run("due(S.people[1]).home"),'2027-04-30');
// a document must be submitted before a service counts
run("S.events.push({id:'t1',date:'2027-04-01',time:'09:00',duration:60,type:'home',people:[1],status:'planned'});execute(S.events[0])");assert.equal(run('visits()'),0);run('S.docs[0].uploaded=true');assert.equal(run('visits()'),1);
run("S.events.push({...S.events[0],id:'t2'});S.docs.push({...S.docs[0],id:'d2',event:'t2'})");assert.equal(run('visits()'),1);assert.equal(run("count('home')"),2);
// scheduling collision and batch duration
assert.ok(run("validateEvent({date:'2027-04-01',time:'09:30',duration:60,type:'phone',people:[2],overtime:false})").includes('冲突'));
assert.ok(run("validateEvent({date:'2027-04-01',time:'14:00',duration:10,type:'phone',people:[2,3],overtime:false})").includes('固定'));
// monthly report blocks crossover until materials are submitted
run("S.date='2027-04-30';S.docs.push({id:'blocked',date:'2027-04-30',type:'home',requirements:['跟进记录'],uploaded:false});advance()");assert.equal(run('S.date'),'2027-04-30');run("S.docs.at(-1).uploaded=true;advance()");assert.equal(run('S.date'),'2027-05-01');
// all views render without JS exceptions
for(const p of ['calendar','people','projects','system','finance','learning','review','rules'])run(`page='${p}';render()`);
// every modal can open; no fabricated project required
run("$('ftype').value='home';schedule();projectForm('case');projectForm('group');exception(1);expenseForm();leaveForm();assessment()");
// 2028 is leap year
assert.equal(run("add('2028-02-28',1)"),'2028-02-29');assert.equal(run("add('2028-02-29',1)"),'2028-03-01');
console.log('PASS: roster, deadlines, duplicate household counts, upload gating, conflicts, monthly gate, eight views, forms, leap year.');

// User-specified fixed durations, batching by household and phone recipient.
assert.equal(run("fixedDuration({type:'home',people:[1,2]})"),30);
assert.equal(run("fixedDuration({type:'home',people:[1,3]})"),60);
assert.equal(run("fixedDuration({type:'phone',people:[1,2]})"),20);
assert.equal(run("fixedDuration({type:'group',people:[]})"),60);
for(const t of ['small','policy','large']) assert.equal(run(`fixedDuration({type:'${t}',people:[]})`),60);
assert.equal(run("docDeadline({date:'2027-04-01'})"),'2027-04-05');
assert.equal(run("docDeadline({date:'2027-04-30'})"),'2027-04-30');
assert.equal(run("docDeadline({date:'2028-02-28'})"),'2028-02-29');
// Deadline gate blocks only beyond deadline, not before; work may execute on deadline.
run("S=fresh();S.date='2027-04-02';S.docs=[{id:'deadline',date:'2027-04-01',type:'training',requirements:['心得'],uploaded:false}];advance()");
assert.equal(run('S.date'),'2027-04-03');run('advance()');assert.equal(run('S.date'),'2027-04-04');run('advance()');assert.equal(run('S.date'),'2027-04-05');run('advance()');assert.equal(run('S.date'),'2027-04-05');
run("S.events=[{id:'credit',type:'paper',date:S.date,time:'09:00',duration:30,status:'planned',people:[]}];executeToday();executeToday()");
assert.equal(run('S.events[0].capacity'),30);
// Short but meaningful reflection accepted; empty reflection rejected without consuming time.
run("S.events.push({id:'training',type:'training',date:'2027-04-01',duration:120,people:[],status:'done'});S.docs[0].event='training'");
sandbox.document.querySelectorAll=sel=>sel==='input[name=attachment]:checked'?[{}]:[];
run("$('doctext').value='   ';uploadDoc('deadline')");assert.equal(run('S.docs[0].uploaded'),false);assert.equal(run('S.events[0].capacity'),30);
run("$('doctext').value='學到傾聽技巧';uploadDoc('deadline')");assert.equal(run('S.docs[0].uploaded'),true);assert.equal(run('S.events[0].capacity'),0);
run("advance()");assert.equal(run('S.date'),'2027-04-06');
console.log('PASS: fixed durations, household batching, two-day and month-end deadlines, idempotent same-day execution, short reflection upload.');
for(const p of ['home','actions','relations','history'])run(`page='${p}';render()`);
run("S=fresh();page='home';render();bookTalk(1,'讨论服务中的困惑');executeToday()");
assert.equal(run('life().relations[1]'),69);run('executeToday()');assert.equal(run('life().relations[1]'),69);
assert.equal(run("hours('supervision')"),0);
run("S.date='2027-04-05';chooseStory(0,0)");assert.equal(run('life().choices.length'),1);run('chooseStory(0,0)');assert.equal(run('life().choices.length'),1);
console.log('PASS: V2 pages, time-consuming communication, idempotent effects, no false supervision credit, persistent story choices.');

run('S=fresh();ensureMonthlySupervision=monthlyScheduler;ensureMonthlySupervision()');
assert.ok(run('S.events.length===1||S.events.length===2'));
assert.ok(run('S.events.every(e=>e.type==="supervision"&&!isOff(e.date)&&((minutes(e.time)>=540&&minutes(e.time)+e.duration<=720)||(minutes(e.time)>=840&&minutes(e.time)+e.duration<=1080)))'));
assert.ok([210,420].includes(run('S.events.reduce((n,e)=>n+e.duration,0)')));
const eventCount=run('S.events.length');run('ensureMonthlySupervision()');assert.equal(run('S.events.length'),eventCount);
run('S.date=S.events[0].date;const beforeSkill=life().skill;const expectedGrowth=S.events.reduce((n,e)=>n+e.duration/60,0);executeToday()');
assert.equal(run('life().skill-beforeSkill'),run('expectedGrowth'));
run('executeToday()');assert.equal(run('life().skill-beforeSkill'),run('expectedGrowth'));
assert.equal(run('hours("supervision")'),0);
run('S.docs.forEach(d=>d.uploaded=true)');assert.equal(run('hours("supervision")'),run('expectedGrowth'));
run('S.date="2027-05-01";ensureMonthlySupervision()');assert.ok(run('!!life().supervisionMonths["2027-05"].date'));
console.log('PASS: monthly supervision scheduling, lunch break, persistent dates, proportional growth, upload gating.');
run("ensureMonthlySupervision=()=>{};S=fresh();$('workperiod').value='am';S.events=[{id:'phone-direct',type:'phone',date:S.date,time:'09:00',duration:10,people:[1],status:'planned'}];executeToday();$('doctext').value='';const directId=S.docs[0].id");
sandbox.document.querySelectorAll=sel=>sel==='input[name=attachment]:checked'?[{}]:[];
run('uploadDoc(directId)');assert.equal(run('S.events.length'),1);
run("$('doctext').value='了解近况，下周回访';uploadDoc(directId)");
assert.equal(run('S.docs[0].uploaded'),true);assert.equal(run('S.events.length'),2);assert.equal(run('S.events[1].duration'),30);assert.equal(run('S.events[1].time'),'09:10');
run('uploadDoc(directId)');assert.equal(run('S.events.length'),2);
run("S=fresh();$('workperiod').value='am';S.events=[{id:'busy',type:'research',date:S.date,time:'09:00',duration:180,people:[],status:'planned'}]");
assert.equal(run("consume('paper',30)"),false);assert.equal(run('S.events.length'),1);
run("$('workperiod').value='pm'");assert.equal(run("consume('paper',30)"),true);assert.equal(run('S.events[1].time'),'14:00');
run("S=fresh();S.date='2027-04-03'");assert.equal(run("consume('paper',30)"),false);
run("S=fresh();S.expenses=[{id:'paid',amount:200,paid:true}];submitReimbursement('paid')");assert.equal(run('S.events.length'),0);
console.log('PASS: direct upload, invalid submission no charge, no duplicate charge, busy slot refusal, afternoon selection, weekend refusal, paid reimbursement guard.');
// AP and overtime expiry rules.
run("S=fresh();$('workperiod').value='auto'");
assert.equal(run("periodFree(S.date,'am')"),180);assert.equal(run("periodFree(S.date,'pm')"),240);
run("S.events.push({id:'ten',date:S.date,time:'09:00',duration:10,type:'phone',people:[1],status:'planned'})");
assert.equal(run("periodFree(S.date,'am')"),170);
assert.equal(run("expiryAfterThreeMonths('2027-04-10')"),'2027-07-10');
assert.equal(run("expiryAfterThreeMonths('2027-01-31')"),'2027-04-30');
assert.equal(run("expiryAfterThreeMonths('2027-11-30')"),'2028-02-29');
run("$('otdate').value=S.date;$('othours').value='0.5';$('otreason').value='补充文书';requestOvertime()");assert.equal(run('overtimeState().requests.length'),0);
run("$('othours').value='1';requestOvertime()");assert.equal(run('overtimeState().requests.length'),1);assert.equal(run('S.ot'),0);
run("S.events.push({id:'ot-task',date:S.date,time:'18:00',duration:30,type:'paper',people:[],overtime:true,status:'planned'});execute(S.events.at(-1))");assert.equal(run('S.ot'),1);run('execute(S.events.at(-1))');assert.equal(run('S.ot'),1);
run("S.date='2027-07-10';overtimeState()");assert.equal(run('S.ot'),0);
run("S=fresh();S.overtime={requests:[],ledger:[{id:'later',date:'2027-04-01',expires:'2027-07-01',minutes:240,remaining:240},{id:'earlier',date:'2027-03-01',expires:'2027-06-01',minutes:180,remaining:180}]}");
assert.equal(run("planCompensation([{date:'2027-05-03',minutes:240}])[0].id"),'earlier');
assert.equal(run("planCompensation([{date:'2027-07-01',minutes:60}])"),null);
run("S.leaves.push({from:S.date,to:S.date,status:'approved',period:'am'})");assert.equal(run("periodFree(S.date,'am')"),0);assert.equal(run("periodFree(S.date,'pm')"),240);
run("S=fresh();schedule('phone')");assert.ok(!elements.modal.innerHTML.includes('关联项目'));assert.ok(!elements.modal.innerHTML.includes('小组项目'));assert.ok(!elements.modal.innerHTML.includes('type="time"'));
run("schedule('group')");assert.ok(elements.modal.innerHTML.includes('小组项目'));
// Direct paperwork can use an approved overtime block and grants it only once.
run("S=fresh();$('workperiod').value='ot';$('otdate').value=S.date;$('othours').value='1';$('otreason').value='到期文书';requestOvertime()");
assert.equal(run("consume('paper',30)"),true);assert.equal(run('S.ot'),1);assert.equal(run("consume('paper',30)"),true);assert.equal(run('S.ot'),1);assert.equal(run("consume('paper',30)"),false);
console.log('PASS: AM/PM budgets, minimum overtime, approval vs completion, three-month expiry and leap-month edge, FIFO compensation, future expiry refusal, partial leave, service-specific forms, direct overtime paperwork.');

run("S=fresh()");
assert.equal(run("docDeadline({date:'2027-04-02'})"),'2027-04-06');
assert.equal(run("docDeadline({date:'2027-04-03'})"),'2027-04-06');
run("S.holidays['2027-04-05']={off:true,name:'测试假期'}");
assert.equal(run("docDeadline({date:'2027-04-01'})"),'2027-04-06');
run("S.holidays['2027-04-03']={off:false,name:'测试补班'}");
assert.equal(run("docDeadline({date:'2027-04-01'})"),'2027-04-03');
console.log('PASS: two working days, weekend progression, holiday exclusion, makeup workdays, existing month-end cap.');
