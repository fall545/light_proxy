// web-ui 运行时配置（部署后可直接改这个文件，无需重新构建）
// 标准形态：服务进程托管本目录（http://127.0.0.1:<port>/），API_BASE 留空即全同源，无需修改。
//   API_BASE：管理台 API 与管理域接口（/api/*、/status、/harness…）的基地址。
//             留空 = 同源；仅当把 dist 部署到其他静态服务器时填写，如 "http://192.168.1.10:29770"。
window.__ELLM_CONFIG__ = {
  API_BASE: "",
};
