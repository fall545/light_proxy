# light-proxy 发布包设计文档

> 本文档写发布包的**当前**结构与行为约束（包布局、路径 env 化、启停形态、更新链路、维护须知）。
> 使用说明见 [README.md](../README.md)。

## 1. 目标与形态

把 monorepo（`app/cli` 发布包 / `app/web` 前端 / `packages/server` 服务 / `packages/gateway` 网关 / `packages/protocol` 协议层）里的 server 单进程应用，构建为可发布的 npm 包 **`light-proxy`**：

```bash
npm i -g light-proxy
light-proxy start    # 后台启动（隐藏窗口，首次自动创建配置）
light-proxy stop     # 停止后台服务
```

发布形态是**完整单进程应用**（网关 `/v1/*` + 管理台 `/api/*` + 管理域 API + web-ui 静态托管），不是 SDK。包名与内部子包 `gateway` 的相似性已知并接受。

## 2. 包结构与发布流程

```
app/cli/
├── bin/light-proxy.js        # CLI shim（import dist/cli.js；npm bin 指向）
├── dist/server.js           # 服务本体（esbuild 从 server 源码构建 + shebang/createRequire banner）
├── dist/cli.js              # CLI（esbuild 从 packages/server/src/cli/bin.ts 构建，与 server 共享 proc/paths 原语）
├── dist/web-ui/             # web-ui vite 构建产物（服务进程托管于 http://127.0.0.1:<port>/）
├── scripts/build-server.ts | build-cli.ts  # 发布构建（esbuild 双入口，tsx 执行）
├── scripts/build-package.ts # 聚合 + 门禁（prepack：构建 server+cli → 拷 web-ui → 复制 example → shebang 校验）
├── scripts/lib/release-utils.ts  # 升级/发布脚本的纯函数层（版本号改写、前置校验、阶段参数、失败处置）
├── scripts/lib/exec.ts           # 命令执行底座（只有 Windows 的 npm/npx/pnpm 走 shell，git 直连以防参数被拆）
└── scripts/dev-upgrade.ts | release.ts  # 本地一键升级 / 发布（质检与发布两个阶段共用 release.ts）
```

发布 manifest 要点：`bin=bin/light-proxy.js`；`files` 白名单（bin/、dist/、example、README、LICENSE、docs）；**`dependencies` 为空**（全部逻辑 bundle 自包含），devDependencies 只放构建与测试工具；发布时用 `npm publish`（不改写 manifest，`prepack` 自动构建）。

构建链：`pnpm build:all` = web-ui（vite）→ server bundle（esbuild，含 gateway/protocol 源码）→ 发布包聚合（双 bundle + web-ui + 示例配置 + shebang 门禁）。产物校验由 `build-package.ts` 承担，缺 web-ui/dist 或示例配置直接失败。

发布链：本地分两步 —— `pnpm release:checks`（前置校验：工作区干净 + 有 remote + 不落后远端 → 质量闸 typecheck/test/format:check；只读不动 git）与 `pnpm release`（构建校验 → patch+1 → 提交 → 打 `v<版本>` tag → 推送）→ GitHub Actions 在 tag 上校验 tag 与 `app/cli/package.json` 版本一致后 `npm publish`（凭 `NPM_TOKEN`），真正的发版动作在 CI 侧。

## 3. 路径全 env 化（核心设计）

所有路径「env 优先、缺省公式兜底」，相对路径按当前工作目录展开，绝对路径原样：

| 配置 | 环境变量 | 缺省公式 | 包模式来源 |
| --- | --- | --- | --- |
| 应用目录（配置/数据基准） | `LIGHT_APP_DIR` | `packages/server/`（hereDir 推导） | CLI 注入（默认 `~/.light-proxy`） |
| 配置文件 | `LIGHT_CONFIG` | `<APP_DIR>/light.config.json` | CLI `--config` 或用户 env |
| 数据目录 | `LIGHT_DATA_DIR` | `<APP_DIR>/data` | CLI `--data-dir` 或用户 env |
| web-ui 静态资源 | `LIGHT_WEBUI_DIR`（可选覆盖） | 按模块位置推导：`dist/web-ui` 与 bundle 同级（包模式）；`app/web/dist`（仓库模式） | 服务进程启动时自解析 |

服务端不加载任何 `.env` / env 文件；环境变量一律由用户会话导出或 CLI 注入。约束与边界：

- **server 源码零模式分支**：`paths.ts` 只有「env ?? 公式」两种取值，不存在模式判断；仓库开发模式不设任何 env 即工作。
- **包模式必须经 CLI 启动**：绕过它裸跑 `dist/server.js` 时 env 未注入，会因找不到配置退出（报错信息指引）。官方入口始终是 `light-proxy start/stop`。
- **CLI 在转调前把路径参数统一转为绝对路径**：CLI 的 cwd 与 node 进程的工作目录不同，透传相对字符串会在另一基准下解析错位。
- **CLI 负责首次配置自愈**（server 端只读不建）：`ensureConfig()` 查找链与 server 端一致，创建后提示编辑或经管理台修改。

## 4. 启停与进程管理

- **start**：配置自愈 → 已运行检测（run.json + pid 存活）→ 端口预算（`--port` > `LIGHT_PORT` > 配置 `port`；被占则顺延到空闲端口并提示，顺延仅本次运行生效）→ `spawnDetached` → 轮询 run.json + HTTP 探活（端口真实可服务才算就绪）→ 首启自启自愈。
- **stop**：按 run.json 的 pid 杀进程树并清记录。`restart` = stop + start（保证最新参数生效）。
- **进程管理原语**（`packages/server/src/proc/`）：`run.json` 运行记录（pid/端口/startedAt/serverJs）；`spawnDetached`（日志重定向到 `<appDir>/logs/`）；`selfRespawn`（孵化后继进程后自身退出，`LIGHT_RESPAWNED=1` 的后继对 EADDRINUSE 重试绑定而非顺延端口）；`killTree`（Windows `taskkill /T /F`，POSIX 杀进程组）；`waitHttpOnline`；`installCrashRecovery`（uncaughtException → respawn，1 分钟 10 次封顶）。
- **开机自启**（`light-proxy autostart on|off`，跨平台、登录触发、免管理员）：Windows 写启动文件夹（`.vbs` 隐藏窗口入口 + appDir 内 `.cmd`，`chcp 65001` 统一日志编码）、macOS 写 LaunchAgent、Linux 写 systemd user unit；自启项内容含解释器路径与 `LIGHT_*` env 快照，保证登录启动与手动启动同参。
- **解释器解析**（`proc/interpreter.ts` + get-node）：服务依赖 `node:sqlite`（≥ 22.13），CLI 自身 node 过旧时解析/下载 node 22 再 spawn。
- **管理域不设生命周期入口**：启停统一走 CLI（管理台由服务本体托管，页面无法自举拉起已停止的服务）；管理域只留状态查询与设置类接口，每条路由带登录鉴权。

## 5. 更新链路

自动更新采用「启动时生效 + self-respawn 双跳」：

1. 检查（管理台请求惰性触发 + 定时检查每小时轮询，两通道共享互斥与墙钟节流；失败 10 分钟后可重试）发现新版本 → 写 `pendingUpdate` 标记 → respawn；
2. 新进程启动引导读到标记 → `npm i -g light-proxy@<版本>`（此时服务未起，无文件句柄冲突）→ 清标记 → 再 respawn 一次换新代码；
3. 安装失败：清标记、写 `lastApply` 错误，以旧版本继续启动。

开关是配置文件顶层 `autoUpdate`（运行状态 `lastCheck`/`lastApply`/`pendingUpdate` 存 `<appDir>/updater.json`）；源码运行（包根不在 `node_modules` 下）时更新域整体关闭，防 dev 会话误更新全局包；更新源可用 `LIGHT_UPDATE_REGISTRY` 覆盖（默认 npm 官方）。停机窗口 = npm 安装时长。

## 6. 跨包不变式（维护须知）

1. **`packages/gateway/src/index.ts` 必须保持零顶层副作用**：server 经 esbuild 全量内联 gateway 源码，任何 import 副作用都会执行。独立网关装配在 `src/standalone-app.ts`。
2. **`dist/web-ui/` 与 `dist/server.js` 同级**：`admin/webui-static.ts` 的缺省推导依赖此布局（`LIGHT_WEBUI_DIR` 可覆盖）。
3. **`light.config.json` 是配置唯一数据源**（原样读写，勿加转换层）。
4. **管理域 `gatewayBase` 每请求现算**：`ctx.port` 在 listen 后才回填，sub-app 创建时固化会得到 `:0`。
5. **esbuild ESM bundle 的 CJS 依赖需 `createRequire` banner**（三个构建脚本统一）：get-node 链路的 tmp-promise、pidusage 内部 `require("util")` 会抛 "Dynamic require"。

## 7. 验证基线（发布前回归清单）

- `pnpm -r test:coverage` / `pnpm -r typecheck` / `pnpm format:check` / `pnpm check:knip` 全绿（覆盖率为各包 vitest.config.ts 的门槛）。
- CLI 冒烟：`-h`、`config`（首次创建）、`start`（参数透传 + env 注入 + 鉴权 200/401）、`stop`（树杀 + 端口释放）、`restart`（运行中/未运行两态）。
- 仓库产物模式（零 env）与包模式（CLI 注入）双模式启动均正常。
- 包目录零读写（`ls` 包目录无新增文件）；`npm pack` 核对 tarball 无 `src/`/`test/`/真实配置。
- 实机升级：`pnpm upgrade:local` 走完 build + 安装 + 重启（`LIGHT_NO_INSTALL=1` 可只验构建链路）。
