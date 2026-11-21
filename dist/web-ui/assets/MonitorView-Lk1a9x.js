import{d as defineComponent,r as ref,p as computed,l as onMounted,y as onUnmounted}from"./index-Lk1a9x.js";
import{s as ensureStyle,e as el,h,T as fmtTokens,R as fmtRate,M as fmtMs,F as fmtTime,c as col,A as api}from"./lightUi-Lk1a9x.js";
// light: 实时监控（按密钥 / 按请求 / 按上游模型），轮询 /api/monitor/live
const keyTag=name=>el("el-tag",{type:"primary",size:"small",effect:"plain","disable-transitions":!0},{default:()=>name});
const modelTag=(name,live)=>el("el-tag",{type:live?"success":"info",size:"small",effect:live?"dark":"plain","disable-transitions":!0},{default:()=>name});
const speed=n=>h("span",{class:n>0?"lt-speed":"lt-speed zero"},n>0?`${fmtRate(n)} tok/s`:"0");
const tokCell=t=>h("div",{class:"lt-num"},[h("div",null,`入 ${fmtTokens(t.inputTokens)} · 出 ${fmtTokens(t.outputTokens)}`),t.cacheReadTokens||t.cacheWriteTokens?h("div",{class:"lt-muted"},`缓存读 ${fmtTokens(t.cacheReadTokens)} · 写 ${fmtTokens(t.cacheWriteTokens)}`):null]);
const reqCell=t=>h("span",{class:"lt-num"},[String(t.requests),t.errors?h("span",{style:"color:var(--el-color-danger);margin-left:6px"},`(${t.errors} 失败)`):null]);
const MonitorView=defineComponent({name:"MonitorView",setup(){
ensureStyle();
const snap=ref(null),err=ref(""),auto=ref(!0),interval=ref(2e3),lastAt=ref(0);let timer=null,busy=!1;
const load=async()=>{if(busy)return;busy=!0;try{snap.value=await api.get("/api/monitor/live");err.value="";lastAt.value=Date.now()}catch(e){err.value=e.message||"加载失败"}finally{busy=!1}};
const arm=()=>{timer&&clearInterval(timer);timer=null;auto.value&&(timer=setInterval(load,interval.value))};
onMounted(()=>{load();arm()});onUnmounted(()=>{timer&&clearInterval(timer)});
const keys=computed(()=>(snap.value?.keys??[]).slice().sort((a,b)=>b.inFlight-a.inFlight||b.tokensPerSec-a.tokensPerSec||b.totals.requests-a.totals.requests));
const ups=computed(()=>(snap.value?.upstreams??[]).slice().sort((a,b)=>b.inFlight-a.inFlight||b.tokensPerSec-a.tokensPerSec||b.totals.outputTokens-a.totals.outputTokens));
const reqs=computed(()=>(snap.value?.requests??[]).slice().sort((a,b)=>b.elapsedMs-a.elapsedMs));
return()=>{const s=snap.value;return h("div",null,[
h("div",{class:"lt-head"},[h("div",null,[h("h2",null,"实时监控"),h("div",{class:"lt-sub"},s?`速度为最近 ${s.windowMs/1e3}s 滑动窗口；累计数据自 ${fmtTime(s.since)}（服务启动）起统计 · 更新于 ${new Date(lastAt.value).toLocaleTimeString()}`:"加载中…")]),
h("div",{class:"lt-actions"},[el("el-switch",{modelValue:auto.value,"onUpdate:modelValue":x=>{auto.value=x;arm()},"active-text":"自动刷新"}),
el("el-select",{modelValue:interval.value,"onUpdate:modelValue":x=>{interval.value=x;arm()},style:"width:96px",size:"default"},{default:()=>[1e3,2e3,5e3].map(ms=>el("el-option",{key:ms,value:ms,label:`${ms/1e3} 秒`}))}),
el("el-button",{onClick:load},{default:()=>"刷新"})])]),
err.value?el("el-alert",{type:"error",title:err.value,closable:!1,"show-icon":!0,style:"margin-bottom:12px"}):null,
h("div",{class:"lt-tiles"},[tile("总输出速度",s?fmtRate(s.totalTokensPerSec):"-","tok/s"),tile("进行中请求",s?s.inFlight:"-"),tile("活跃密钥",s?s.keys.filter(k=>k.inFlight>0).length:"-",s?`/ ${s.keys.length}`:""),tile("活跃上游模型",s?s.upstreams.filter(u=>u.inFlight>0).length:"-",s?`/ ${s.upstreams.length}`:"")]),
h("div",{class:"lt-section"},[h("h3",null,["按密钥",h("span",{class:"lt-muted"},"展开行查看该密钥下每个模型的速度与用量")]),
el("el-table",{data:keys.value,border:!0,"row-key":"keyId","empty-text":"暂无数据（还没有请求经过网关）"},{default:()=>[
el("el-table-column",{type:"expand"},{default:({row})=>h("div",{style:"padding:4px 16px 8px 48px"},[el("el-table",{data:row.models.slice().sort((a,b)=>b.inFlight-a.inFlight||b.tokensPerSec-a.tokensPerSec),size:"small"},{default:()=>[
col({label:"模型","min-width":200},m=>modelTag(m.model,m.inFlight>0)),
col({label:"进行中",width:90,align:"right"},m=>h("span",{class:"lt-num"},String(m.inFlight))),
col({label:"实时速度",width:130,align:"right"},m=>speed(m.tokensPerSec)),
col({label:"Token 消耗","min-width":200},m=>tokCell(m.totals)),
col({label:"请求数",width:120,align:"right"},m=>reqCell(m.totals))]})])}),
col({label:"密钥","min-width":150},k=>keyTag(k.keyName)),
col({label:"进行中",width:90,align:"right"},k=>h("span",{class:"lt-num",style:k.inFlight?"font-weight:600":""},String(k.inFlight))),
col({label:"实时速度",width:130,align:"right"},k=>speed(k.tokensPerSec)),
col({label:"正在调用的模型","min-width":220},k=>k.activeModels.length?h("div",{class:"lt-tags"},k.activeModels.map(m=>modelTag(m,!0))):h("span",{class:"lt-muted"},"空闲")),
col({label:"Token 消耗","min-width":200},k=>tokCell(k.totals)),
col({label:"请求数",width:120,align:"right"},k=>reqCell(k.totals))]})]),
h("div",{class:"lt-section"},[h("h3",null,["进行中的请求",h("span",{class:"lt-muted"},`${reqs.value.length} 个`)]),
el("el-table",{data:reqs.value,border:!0,"row-key":"id","empty-text":"当前没有进行中的请求"},{default:()=>[
col({label:"请求 ID",width:150},r=>h("span",{class:"lt-mono",title:r.id},r.id.slice(-12))),
col({label:"密钥","min-width":120},r=>keyTag(r.keyName)),
col({label:"模型","min-width":170},r=>modelTag(r.model,!0)),
col({label:"上游","min-width":190},r=>h("span",{class:"lt-mono"},r.upstream)),
col({label:"状态",width:110},r=>el("el-tag",{type:r.phase==="waiting"?"warning":"success",size:"small","disable-transitions":!0},{default:()=>r.phase==="waiting"?"等待首字":"生成中"})),
col({label:"已耗时",width:90,align:"right"},r=>h("span",{class:"lt-num"},fmtMs(r.elapsedMs))),
col({label:"首字",width:90,align:"right"},r=>h("span",{class:"lt-num"},fmtMs(r.ttftMs))),
col({label:"实时速度",width:130,align:"right"},r=>speed(r.tokensPerSec)),
col({label:"已输出",width:100,align:"right"},r=>h("span",{class:"lt-num",title:"流式期间为估算值"},"≈"+fmtTokens(r.outputTokens)))]})]),
h("div",{class:"lt-section"},[h("h3",null,["按上游模型"]),
el("el-table",{data:ups.value,border:!0,"empty-text":"暂无数据"},{default:()=>[
col({label:"上游模型 @ 地址","min-width":260},u=>h("span",{class:"lt-mono"},u.upstream||"-")),
col({label:"进行中",width:90,align:"right"},u=>h("span",{class:"lt-num"},String(u.inFlight))),
col({label:"实时速度",width:130,align:"right"},u=>speed(u.tokensPerSec)),
col({label:"Token 消耗","min-width":200},u=>tokCell(u.totals)),
col({label:"请求数",width:120,align:"right"},u=>reqCell(u.totals))]})]),
h("div",{class:"lt-section"},[h("h3",null,["最近完成",h("span",{class:"lt-muted"},"最近 50 条")]),
el("el-table",{data:s?.recent??[],border:!0,size:"small","empty-text":"暂无"},{default:()=>[
col({label:"完成时间",width:100},r=>h("span",{class:"lt-num"},new Date(r.finishedAt).toLocaleTimeString())),
col({label:"密钥","min-width":110},r=>keyTag(r.keyName)),
col({label:"模型","min-width":160},r=>modelTag(r.model,!1)),
col({label:"状态",width:80},r=>el("el-tag",{type:r.status>=400||r.error?"danger":"success",size:"small","disable-transitions":!0},{default:()=>String(r.status)})),
col({label:"首字",width:80,align:"right"},r=>h("span",{class:"lt-num"},fmtMs(r.ttftMs))),
col({label:"总耗时",width:90,align:"right"},r=>h("span",{class:"lt-num"},fmtMs(r.durationMs))),
col({label:"平均速度",width:120,align:"right"},r=>r.tokensPerSec==null?h("span",{class:"lt-muted"},"-"):speed(r.tokensPerSec)),
col({label:"Tokens 入/出",width:130,align:"right"},r=>h("span",{class:"lt-num"},`${fmtTokens(r.inputTokens)} / ${fmtTokens(r.outputTokens)}`)),
col({label:"错误","min-width":160,"show-overflow-tooltip":!0},r=>r.error?h("span",{style:"color:var(--el-color-danger)"},r.error):h("span",{class:"lt-muted"},"-"))]})])])}}});
function tile(label,value,unit){return h("div",{class:"lt-tile"},[h("div",{class:"lt-label"},label),h("div",{class:"lt-value"},[String(value),unit?h("span",{class:"lt-unit"},unit):null])])}
export{MonitorView as default};
