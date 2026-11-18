# frontend2

[English](#english) | [中文](#中文)

---

## English

An alternative frontend for multivisor. It is a fully standalone frontend project that lives alongside the default frontend (`../src`) at the repository root: sources, dependencies and tooling are not shared, so the two frontends do not affect each other.

frontend2 involves no backend changes: the `multivisor/` backend code is untouched. frontend2 only talks to the backend through its existing HTTP API, and the production build simply writes its output into the backend's existing static directory.

### Why this project exists

The default frontend aims to be generic and simple, with an English-only interface. In day-to-day operations work we needed a UI better suited to ops scenarios, mainly:

- **Layout and UI logic improvements**: restructured page layout and components for denser, clearer process/node information
- **Bilingual UI and themes**: Chinese/English switching, light and dark themes
- **Select-all and bulk actions**: select all processes, restart/stop in bulk, with confirmation before acting and unified result feedback
- **Connection status and event stream**: the heart indicator at the bottom-left shows connection status in real time; the event stream recovers automatically after a disconnect, connection state is determined by polling, and manual refresh/recovery entries are kept

To avoid affecting the default frontend, the whole codebase lives in a separate `frontend2` directory with its own build configuration and dependency manifest. The two frontends can coexist and evolve independently; build whichever one you need.

### Directory layout

- Default frontend: `src/` at the repository root; run commands from the repository root
- frontend2: this directory; run commands from here (or use `npm --prefix`, see below)

### Common commands

Run from this directory:

    cd frontend2
    npm ci                  # install dependencies (exact install from the lockfile; npm install also works)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (proxies `/api` to `localhost:22000`) |
| `npm test` | Run the unit tests |
| `npm run build` | Build for production |

To run from the repository root without entering this directory, use `--prefix` to point npm at the project root:

| Command | Description |
| --- | --- |
| `npm --prefix frontend2 run dev` | Start the frontend2 dev server |
| `npm --prefix frontend2 test` | Run the frontend2 unit tests |
| `npm --prefix frontend2 run build` | Build frontend2 for production |

The default frontend is still built from the repository root with `npm run dev` / `npm test` / `npm run build`.

### Build output

The production build is written to `../multivisor/server/dist`, the static directory served by the Flask backend. This location is shared with the default frontend: **whichever frontend is built last is the one served**. To switch between the two UIs, simply rebuild from the corresponding directory; the sources never interfere with each other.

---

## 中文

multivisor 的另一套前端界面。它是一个完全独立的前端项目，与仓库根目录的默认前端（`../src`）并存：源码、依赖和工具链互不共享，互不影响。

frontend2 不涉及任何后端改动：`multivisor/` 后端代码保持原样，frontend2 仅通过现有的 HTTP API 与后端交互；生产构建也只是把产物写入后端已有的静态目录，不修改后端代码。

### 为什么创建这个项目

默认前端追求通用简洁，界面以英文为主。在实际使用中，我们需要更适合运维场景的界面，主要包括：

- **布局与 UI 逻辑优化**：重构页面布局与组件结构，进程/节点信息展示更密集清晰
- **双语与主题**：中文/英文界面切换，深浅双主题
- **全选与批量操作**：支持全选进程，批量重启/停止，操作前确认、结果统一反馈
- **连接状态与事件流**：左下角心形指示器实时显示连接状态；事件流断开后自动恢复，连接状态由轮询判定，并保留手动刷新/恢复入口

为了避免这些改动影响默认前端，整套代码被放入独立的 `frontend2` 目录，并自带完整的构建配置和依赖清单。两套前端可以并存、独立演进，使用者可以按需选择构建哪一套。

### 目录定位

- 默认前端：仓库根目录的 `src/`，命令在仓库根目录执行
- frontend2：本目录，命令在本目录（或用 `npm --prefix`，见下文）执行

### 常用命令

在本目录内执行：

    cd frontend2
    npm ci                  # 安装依赖（按 lockfile 精确安装，也可用 npm install）

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（`/api` 代理到 `localhost:22000`） |
| `npm test` | 运行单元测试 |
| `npm run build` | 生产构建 |

不进入本目录、在仓库根目录执行时，用 `--prefix` 指定项目根：

| 命令 | 说明 |
| --- | --- |
| `npm --prefix frontend2 run dev` | 启动 frontend2 开发服务器 |
| `npm --prefix frontend2 test` | 运行 frontend2 单元测试 |
| `npm --prefix frontend2 run build` | 生产构建 frontend2 |

默认前端仍按原方式在仓库根目录执行 `npm run dev` / `npm test` / `npm run build`。

### 构建产物

生产构建输出到 `../multivisor/server/dist`，即后端 Flask 服务的静态目录。该目录与默认前端共用：**哪套前端最后构建，服务端就使用哪一套**。切换两套界面只需在对应目录重新执行构建，源码互不干扰。