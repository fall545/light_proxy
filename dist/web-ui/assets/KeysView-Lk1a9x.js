import{d as defineComponent,r as ref,p as computed,l as onMounted,E as MessageBox,ah as Message}from"./index-Lk1a9x.js";
import{s as ensureStyle,e as el,h,T as fmtTokens,F as fmtTime,G as ago,c as col,A as api}from"./lightUi-Lk1a9x.js";
// light: 密钥管理（创建 / 编辑 / 删除 / 启停 / 配额：限额或不限）
const toast=(m,t="success")=>Message({message:m,type:t,duration:t==="error"?6e3:3e3});
const KeysView=defineComponent({name:"KeysView",setup(){
ensureStyle();
const keys=ref([]),loading=ref(!1),saving=ref(!1);
const dlg=ref(!1),editing=ref(null);
const form=ref({name:"",unlimited:!0,quota:1e6,enabled:!0});
const created=ref(null);
const load=async()=>{loading.value=!0;try{keys.value=(await api.get("/api/keys")).keys??[]}catch(e){toast(e.message||"加载失败","error")}finally{loading.value=!1}};
const openCreate=()=>{editing.value=null;form.value={name:"",unlimited:!0,quota:1e6,enabled:!0};dlg.value=!0};
const openEdit=k=>{editing.value=k;form.value={name:k.name,unlimited:k.quota===null,quota:k.quota??1e6,enabled:k.enabled};dlg.value=!0};
const submit=async()=>{const f=form.value;if(!f.name.trim()){toast("请填写名称","warning");return}
const body={name:f.name.trim(),quota:f.unlimited?null:Number(f.quota),enabled:f.enabled};saving.value=!0;
try{if(editing.value){await api.put(`/api/keys/${editing.value.id}`,body);toast("已保存")}else{const r=await api.post("/api/keys",body);created.value=r;toast("密钥已创建")}dlg.value=!1;await load()}catch(e){toast(e.message||"保存失败","error")}finally{saving.value=!1}};
const toggle=async(k,val)=>{try{await api.put(`/api/keys/${k.id}`,{enabled:val});k.enabled=val;toast(val?`已启用「${k.name}」`:`已禁用「${k.name}」`)}catch(e){toast(e.message||"操作失败","error");await load()}};
const resetUsage=async k=>{try{await MessageBox.confirm(`将「${k.name}」的已用量清零？`,"重置用量",{type:"warning",confirmButtonText:"重置",cancelButtonText:"取消"})}catch{return}
try{await api.put(`/api/keys/${k.id}`,{resetUsage:!0});toast("用量已清零");await load()}catch(e){toast(e.message||"操作失败","error")}};
const remove=async k=>{try{await MessageBox.confirm(`删除后使用「${k.name}」(${k.prefix}…) 的客户端将立即无法访问，且不可恢复。`,"删除密钥",{type:"warning",confirmButtonText:"删除",cancelButtonText:"取消",confirmButtonClass:"el-button--danger"})}catch{return}
try{await api.del(`/api/keys/${k.id}`);toast("已删除");await load()}catch(e){toast(e.message||"删除失败","error")}};
const copy=async s=>{try{await navigator.clipboard.writeText(s);toast("已复制到剪贴板")}catch{toast("复制失败，请手动选择复制","error")}};
const stats=computed(()=>({total:keys.value.length,enabled:keys.value.filter(k=>k.enabled).length,exhausted:keys.value.filter(k=>k.exhausted).length,used:keys.value.reduce((a,k)=>a+k.used,0)}));
onMounted(load);
const quotaCell=k=>{if(k.quota===null)return h("div",null,[el("el-tag",{type:"success",size:"small","disable-transitions":!0},{default:()=>"不限"}),h("div",{class:"lt-muted",style:"margin-top:4px"},`已用 ${fmtTokens(k.used)} tokens`)]);
const pct=k.quota===0?100:Math.min(100,Math.round(k.used/k.quota*1e3)/10);
return h("div",{style:"min-width:160px"},[el("el-progress",{percentage:pct,status:k.exhausted?"exception":pct>=80?"warning":"",strokeWidth:8}),h("div",{class:"lt-muted lt-num"},`${fmtTokens(k.used)} / ${fmtTokens(k.quota)} tokens${k.exhausted?" · 已用尽":""}`)])};
return()=>h("div",null,[
h("div",{class:"lt-head"},[h("div",null,[h("h2",null,"密钥管理"),h("div",{class:"lt-sub"},"为每个客户端签发独立的 API Key（lsk- 前缀），可单独启停与设置 token 配额。masterKey 仍可用，不受配额限制。")]),
h("div",{class:"lt-actions"},[el("el-button",{onClick:load,loading:loading.value},{default:()=>"刷新"}),el("el-button",{type:"primary",onClick:openCreate},{default:()=>"新建密钥"})])]),
h("div",{class:"lt-tiles"},[tile("密钥总数",stats.value.total),tile("已启用",stats.value.enabled),tile("配额用尽",stats.value.exhausted),tile("累计消耗",fmtTokens(stats.value.used),"tokens")]),
el("el-table",{data:keys.value,border:!0,stripe:!0,"empty-text":"还没有密钥，点击「新建密钥」创建",style:"width:100%"},{default:()=>[
col({label:"名称",prop:"name","min-width":140},k=>h("div",null,[h("div",{style:"font-weight:600"},k.name),h("div",{class:"lt-mono lt-muted"},k.prefix+"…")])),
col({label:"状态",width:110,align:"center"},k=>el("el-switch",{modelValue:k.enabled,"onUpdate:modelValue":val=>toggle(k,val),"inline-prompt":!0,"active-text":"启用","inactive-text":"禁用"})),
col({label:"配额","min-width":200},quotaCell),
col({label:"请求数",width:100,align:"right"},k=>h("span",{class:"lt-num"},String(k.requests))),
col({label:"最近使用",width:130},k=>h("span",{title:fmtTime(k.lastUsedAt)},ago(k.lastUsedAt))),
col({label:"创建时间",width:170},k=>h("span",{class:"lt-muted"},fmtTime(k.createdAt))),
col({label:"操作",width:220,fixed:"right"},k=>h("div",{class:"lt-actions"},[el("el-button",{size:"small",onClick:()=>openEdit(k)},{default:()=>"编辑"}),el("el-button",{size:"small",onClick:()=>resetUsage(k)},{default:()=>"重置用量"}),el("el-button",{size:"small",type:"danger",plain:!0,onClick:()=>remove(k)},{default:()=>"删除"})]))]}),
el("el-dialog",{modelValue:dlg.value,"onUpdate:modelValue":x=>dlg.value=x,title:editing.value?`编辑密钥 · ${editing.value.name}`:"新建密钥",width:"460px"},{
default:()=>el("el-form",{"label-width":"80px",onSubmit:e=>e.preventDefault()},{default:()=>[
el("el-form-item",{label:"名称",required:!0},{default:()=>el("el-input",{modelValue:form.value.name,"onUpdate:modelValue":x=>form.value.name=x,maxlength:64,placeholder:"如：team-a / ci-bot",onKeyup:e=>{e.key==="Enter"&&submit()}})}),
el("el-form-item",{label:"配额"},{default:()=>el("el-radio-group",{modelValue:form.value.unlimited,"onUpdate:modelValue":x=>form.value.unlimited=x},{default:()=>[el("el-radio",{value:!0},{default:()=>"不限"}),el("el-radio",{value:!1},{default:()=>"限额"})]})}),
form.value.unlimited?null:el("el-form-item",{label:"上限"},{default:()=>h("div",{style:"display:flex;align-items:center;gap:8px"},[el("el-input-number",{modelValue:form.value.quota,"onUpdate:modelValue":x=>form.value.quota=x??0,min:0,step:1e5,"step-strictly":!1,style:"width:200px"}),h("span",{class:"lt-muted"},"tokens（输入+输出+缓存）")])}),
el("el-form-item",{label:"启用"},{default:()=>el("el-switch",{modelValue:form.value.enabled,"onUpdate:modelValue":x=>form.value.enabled=x})})]}),
footer:()=>[el("el-button",{onClick:()=>dlg.value=!1},{default:()=>"取消"}),el("el-button",{type:"primary",loading:saving.value,onClick:submit},{default:()=>editing.value?"保存":"创建"})]}),
el("el-dialog",{modelValue:created.value!==null,"onUpdate:modelValue":x=>{x||(created.value=null)},title:"密钥已创建",width:"520px","close-on-click-modal":!1},{
default:()=>created.value?[el("el-alert",{type:"warning",closable:!1,"show-icon":!0,title:"完整密钥只显示这一次，关闭后无法再次查看，请立即复制保存。"}),h("div",{class:"lt-keybox"},created.value.key),h("div",{class:"lt-muted"},`名称：${created.value.name} · 配额：${created.value.quota===null?"不限":fmtTokens(created.value.quota)+" tokens"}`)]:null,
footer:()=>[el("el-button",{type:"primary",onClick:()=>copy(created.value?.key??"")},{default:()=>"复制密钥"}),el("el-button",{onClick:()=>created.value=null},{default:()=>"我已保存"})]})])}});
function tile(label,value,unit){return h("div",{class:"lt-tile"},[h("div",{class:"lt-label"},label),h("div",{class:"lt-value"},[String(value),unit?h("span",{class:"lt-unit"},unit):null])])}
export{KeysView as default};
