import{h as v,a as rc,A as api}from"./index-Lk1a9x.js";
// light: shared helpers for KeysView / MonitorView (hand-written chunk, render functions only)
const STYLE_ID="light-ui-style";
function ensureStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
.lt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
.lt-head h2{margin:0;font-size:20px;font-weight:600}
.lt-head .lt-sub{color:var(--el-text-color-secondary);font-size:13px;margin-top:4px}
.lt-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lt-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px}
.lt-tile{border:1px solid var(--el-border-color-lighter);border-radius:8px;padding:14px 16px;background:var(--el-bg-color)}
.lt-tile .lt-label{font-size:12px;color:var(--el-text-color-secondary)}
.lt-tile .lt-value{font-size:26px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}
.lt-tile .lt-unit{font-size:13px;font-weight:400;color:var(--el-text-color-secondary);margin-left:4px}
.lt-section{margin-bottom:20px}
.lt-section h3{font-size:15px;margin:0 0 10px;display:flex;align-items:center;gap:8px}
.lt-num{font-variant-numeric:tabular-nums}
.lt-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.lt-muted{color:var(--el-text-color-secondary);font-size:12px}
.lt-tags{display:flex;gap:4px;flex-wrap:wrap}
.lt-keybox{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--el-fill-color-light);padding:10px 12px;border-radius:6px;word-break:break-all;margin:8px 0}
.lt-speed{font-weight:600;font-variant-numeric:tabular-nums}
.lt-speed.zero{color:var(--el-text-color-placeholder);font-weight:400}
`;document.head.appendChild(s)}
const C=n=>rc(n);
function el(name,props,slots){return v(C(name),props||null,slots)}
function txt(s){return String(s)}
function fmtTokens(n){if(n==null)return"-";n=Number(n);if(n>=1e9)return(n/1e9).toFixed(2)+"B";if(n>=1e6)return(n/1e6).toFixed(2)+"M";if(n>=1e4)return(n/1e3).toFixed(1)+"k";return String(Math.round(n))}
function fmtRate(n){return n==null?"-":Number(n).toFixed(1)}
function fmtMs(ms){if(ms==null)return"-";if(ms<1e3)return ms+"ms";if(ms<6e4)return(ms/1e3).toFixed(1)+"s";return Math.floor(ms/6e4)+"m"+Math.round(ms%6e4/1e3)+"s"}
function fmtTime(t){if(!t)return"-";const d=new Date(t);return d.toLocaleString()}
function ago(t){if(!t)return"从未";const s=Math.round((Date.now()-t)/1e3);if(s<60)return s+" 秒前";if(s<3600)return Math.round(s/60)+" 分钟前";if(s<86400)return Math.round(s/3600)+" 小时前";return Math.round(s/86400)+" 天前"}
function col(props,cell){return el("el-table-column",props,cell?{default:({row,$index})=>cell(row,$index)}:void 0)}
export{ensureStyle as s,el as e,v as h,txt as t,fmtTokens as T,fmtRate as R,fmtMs as M,fmtTime as F,ago as G,col as c,api as A};
