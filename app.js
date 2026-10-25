const DEFAULT_TARGETS={calories:2700,protein:150,carbs:368,fat:70,fiber:30,sugar:67,sodium:2300,cholesterol:300};
const NUTRIENTS=[
 {key:"calories",label:"Calories",unit:"kcal",goal:2700},{key:"protein",label:"Protein",unit:"g",goal:150},
 {key:"carbs",label:"Carbs",unit:"g",goal:368},{key:"fat",label:"Fat",unit:"g",goal:70},
 {key:"fiber",label:"Fiber",unit:"g",goal:30},{key:"sugar",label:"Sugar",unit:"g",goal:67},
 {key:"sodium",label:"Sodium",unit:"mg",goal:2300},{key:"cholesterol",label:"Cholesterol",unit:"mg",goal:300}
];
const MEALS=Array.from({length:10},(_,i)=>`Meal ${i+1}`);
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
let foods=[], entries=[], targets={...DEFAULT_TARGETS}, editId=null;
function load(){try{entries=JSON.parse(localStorage.getItem("fitlog_entries")||"[]")}catch{entries=[]}try{targets={...DEFAULT_TARGETS,...JSON.parse(localStorage.getItem("fitlog_targets")||"{}")}}catch{}}
async function loadFoods(){try{const r=await fetch("foods.json");foods=await r.json()}catch{foods=[]}try{const custom=JSON.parse(localStorage.getItem("fitlog_custom_foods")||"[]");custom.forEach(f=>{if(!foods.some(x=>x.name===f.name))foods.push(f)})}catch{}}
function persist(){localStorage.setItem("fitlog_entries",JSON.stringify(entries))}
function persistFoods(){localStorage.setItem("fitlog_custom_foods",JSON.stringify(foods))}
function fmt(n){return (Number(n)||0).toLocaleString(undefined,{maximumFractionDigits:1})}
function nutrient(food,grams,key){return (Number(food?.[key])||0)*(Number(grams)||0)/100}
function totals(list){const t={};NUTRIENTS.forEach(n=>t[n.key]=list.reduce((s,e)=>s+nutrient(foods.find(f=>f.name===e.food),e.grams,n.key),0));return t}
function selectedEntries(){return entries.filter(e=>e.date===$("logDate").value)}
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",2200)}
function setTab(tab){document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===tab));document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(tab==="log")renderLog();if(tab==="foods")renderFoodList();window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
$("logDate").value=today();
$("todayBtn").onclick=()=>{$("logDate").value=today();renderAll()};
$("logDate").addEventListener("change",renderAll);
function renderTargets(){ $("targetFields").innerHTML=NUTRIENTS.map(n=>`<div class="field"><label>${n.label} target (${n.unit})</label><input type="number" min="0" step="any" data-target="${n.key}" value="${targets[n.key]}"></div>`).join("")}
$("saveTargets").onclick=()=>{document.querySelectorAll("[data-target]").forEach(i=>targets[i.dataset.target]=Number(i.value)||0);localStorage.setItem("fitlog_targets",JSON.stringify(targets));renderAll();toast("Targets saved")};
function renderDashboard(){const list=selectedEntries(),t=totals(list);$("summaryDate").textContent=$("logDate").value;$("entryCount").textContent=`${list.length} entr${list.length===1?"y":"ies"}`;
$("metrics").innerHTML=NUTRIENTS.map(n=>{const v=t[n.key],goal=Number(targets[n.key])||0,pct=goal?Math.min(100,v/goal*100):0;return `<div class="metric"><div class="label">${n.label}</div><div class="value">${fmt(v)}<span style="font-size:11px;font-weight:600"> ${n.unit}</span></div><div class="goal">Target ${fmt(goal)} ${n.unit}</div><div class="bar"><i style="width:${pct}%"></i></div></div>`}).join("");
$("mealButtons").innerHTML=MEALS.map((m,i)=>{const c=list.filter(e=>e.meal===m).length;return `<button class="mealbtn" data-meal="${m}"><strong>${m}</strong><span>${c?`${c} food item${c===1?"":"s"}`:"Tap to add food"}</span></button>`}).join("");
document.querySelectorAll("[data-meal]").forEach(b=>b.onclick=()=>{resetForm();$("mealSelect").value=b.dataset.meal;setTab("log")});
$("todayFoods").innerHTML=list.length?list.map(e=>foodRow(e,true)).join(""):`<div class="empty">No foods logged for this date yet.<br>Tap a meal above or use + Food.</div>`;
$("todayFoods").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));$("todayFoods").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteEntry(b.dataset.delete));
}
function foodRow(e,compact=false){const f=foods.find(x=>x.name===e.food),cal=nutrient(f,e.grams,"calories"),pro=nutrient(f,e.grams,"protein"),carb=nutrient(f,e.grams,"carbs"),fat=nutrient(f,e.grams,"fat");return `<div class="foodrow"><div class="foodrowtop"><div><strong>${esc(e.food)}</strong><div class="small">${esc(e.meal)} · ${fmt(e.grams)} g${e.note?" · "+esc(e.note):""}</div></div><span class="pill">${fmt(cal)} kcal</span></div><div class="nutrientline">Protein ${fmt(pro)} g · Carbs ${fmt(carb)} g · Fat ${fmt(fat)} g</div><div class="actions" style="margin-top:9px"><button class="btn secondary sm" data-edit="${e.id}">Edit</button><button class="btn danger sm" data-delete="${e.id}">Delete</button></div></div>`}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderMealOptions(){$("mealSelect").innerHTML=MEALS.map(m=>`<option>${m}</option>`).join("")}
function renderFoodOptions(){$("foodSelect").innerHTML='<option value="">Choose food…</option>'+foods.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(f=>`<option value="${esc(f.name)}">${esc(f.name)}</option>`).join("")}
function preview(){const f=foods.find(x=>x.name===$("foodSelect").value),g=Number($("grams").value);$("foodPreview").textContent=f&&g>0?`${fmt(nutrient(f,g,"calories"))} kcal · ${fmt(nutrient(f,g,"protein"))} g protein · ${fmt(nutrient(f,g,"carbs"))} g carbs · ${fmt(nutrient(f,g,"fat"))} g fat (estimated)`:"Choose a food and enter the amount in grams to preview nutrition."}
$("foodSelect").onchange=preview;$("grams").oninput=preview;
function resetForm(){editId=null;$("foodForm").reset();$("formTitle").textContent="Add food consumed";$("saveFood").textContent="Add to daily log";$("cancelEdit").style.display="none";renderMealOptions();preview()}
$("cancelEdit").onclick=resetForm;
$("foodForm").onsubmit=e=>{e.preventDefault();const food=$("foodSelect").value,grams=Number($("grams").value);if(!foods.some(f=>f.name===food)||!(grams>0))return toast("Choose a food and enter a valid weight.");const obj={id:editId||String(Date.now()),date:$("logDate").value,meal:$("mealSelect").value,food,grams,note:$("timeNote").value.trim()};if(editId){entries=entries.map(x=>x.id===editId?obj:x)}else entries.push(obj);persist();resetForm();renderAll();toast(editId?"Food entry updated":"Food added to log");setTab("dashboard")};
function editEntry(id){const e=entries.find(x=>x.id===id);if(!e)return;editId=id;setTab("log");$("mealSelect").value=e.meal;$("foodSelect").value=e.food;$("grams").value=e.grams;$("timeNote").value=e.note||"";$("formTitle").textContent="Edit food entry";$("saveFood").textContent="Save changes";$("cancelEdit").style.display="block";preview();window.scrollTo({top:0,behavior:"smooth"})}
function deleteEntry(id){if(!confirm("Delete this food entry?"))return;entries=entries.filter(x=>x.id!==id);persist();renderAll();toast("Entry deleted")}
function renderLog(){const list=selectedEntries();$("logEntries").innerHTML=list.length?list.map(e=>foodRow(e)).join(""):`<div class="empty">Nothing logged on this date.</div>`;$("logEntries").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));$("logEntries").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteEntry(b.dataset.delete))}
function renderFoodList(){const q=$("foodSearch").value.toLowerCase();const list=foods.filter(f=>f.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));$("foodCount").textContent=`${foods.length} foods`;$("foodList").innerHTML=list.map(f=>`<div class="foodrow"><strong>${esc(f.name)}</strong><div class="nutrientline">${fmt(f.calories)} kcal · P ${fmt(f.protein)} g · C ${fmt(f.carbs)} g · F ${fmt(f.fat)} g per 100 g</div></div>`).join("")||'<div class="empty">No foods match your search.</div>'}
$("foodSearch").oninput=renderFoodList;
$("customFoodForm").onsubmit=e=>{e.preventDefault();const name=$("newName").value.trim();if(foods.some(f=>f.name.toLowerCase()===name.toLowerCase()))return toast("That food name already exists.");const f={name,calories:Number($("newCalories").value),protein:Number($("newProtein").value),carbs:Number($("newCarbs").value),fat:Number($("newFat").value),fiber:Number($("newFiber").value),sugar:Number($("newSugar").value),sodium:Number($("newSodium").value),cholesterol:Number($("newCholesterol").value)};foods.push(f);persistFoods();renderFoodOptions();renderFoodList();e.target.reset();toast("Custom food saved")};
$("exportCsv").onclick=()=>{const list=selectedEntries(),head=["Date","Meal","Food","Weight_g",...NUTRIENTS.map(n=>n.key)];const rows=list.map(e=>[e.date,e.meal,e.food,e.grams,...NUTRIENTS.map(n=>nutrient(foods.find(f=>f.name===e.food),e.grams,n.key))]);download([head,...rows].map(r=>r.map(csv).join(",")).join("\n"),`food-log-${$("logDate").value}.csv`,"text/csv")};
function csv(v){return '"'+String(v??"").replace(/"/g,'""')+'"'}
function download(content,name,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$("backupBtn").onclick=()=>download(JSON.stringify({version:1,entries,targets,foods},null,2),"food-intake-backup.json","application/json");
$("restoreFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const d=JSON.parse(await file.text());if(!Array.isArray(d.entries)||!Array.isArray(d.foods))throw Error();if(!confirm("Restore this backup? It will replace the current food log and custom food database."))return;entries=d.entries;targets={...DEFAULT_TARGETS,...d.targets};foods=d.foods;persist();localStorage.setItem("fitlog_targets",JSON.stringify(targets));persistFoods();renderFoodOptions();renderTargets();renderAll();toast("Backup restored")}catch{toast("That backup file is not valid.")}e.target.value=""};
function renderAll(){renderTargets();renderDashboard();renderLog();renderFoodList()}
load();
loadFoods().then(()=>{renderMealOptions();renderFoodOptions();renderTargets();renderAll();preview()});
