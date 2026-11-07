# opencode-desktop-theme — skill

教 OpenCode **创建、移植、调试 OpenCode Desktop 主题**的 skill：双层贡献模型、
已验证的 DOM 钩子清单、暗色模式机制、`desktop-theme.json` 完整格式、零依赖
插件脚手架，以及一个直接可用的 `app.asar` 自省工具。

> 方法论来自一次完整实战：把 Typora 主题
> **[rizo](https://github.com/kcflan/rizo)**（kcflan 的双色 risograph 主题，
> 强烈推荐去原仓库看设计）移植到 OpenCode Desktop。移植产物因原主题许可
> （禁止再分发/发布衍生主题）**不在本仓库中** —— 但 skill 里记录的方法、
> 钩子与踩坑完全适用于任何主题移植。

## 安装

```sh
git clone https://github.com/kaister1231/opencode-desktop-theme-skill
ln -s $PWD/opencode-desktop-theme-skill/skills/opencode-desktop-theme \
      ~/.config/opencode/skills/opencode-desktop-theme
```

装好后说「给 Desktop 做个主题 / 移植 xx 编辑器主题」即可触发，
或用 `@opencode-desktop-theme` 显式加载。

## 内容

```
skills/opencode-desktop-theme/
├── SKILL.md                       # 主流程：模型 → 工作流 → 已知坑
├── references/
│   ├── dom-hooks.md               # 已验证 DOM 钩子表 + 主题应用机制
│   ├── plugin-guide.md            # 插件脚手架/构建/注册/Theme JSON 格式
│   └── asar-introspection.md      # app 更新后重新核实钩子的方法
└── scripts/asar_pull.mjs          # 零依赖 asar 解包器（list/pull）
```

核心要点速览：

- Desktop 没有"安装主题文件"入口 —— 一切通过 **GUI 插件**：
  `ctx.add(Theme, json)`（配色，用户在设置里选）+ `ctx.add(Style, css)`
  （排版，加载即生效）。
- 暗色钩子是 `<html data-color-scheme="dark">`；`data-theme` 存的是主题 ID。
- 排版 CSS 必须 scope 在 `[data-component=markdown]` 下。
- 钩子不是稳定 API，app 更新后用 `scripts/asar_pull.mjs` 重新核实。

## 许可

- `skills/` 目录内容为本仓库原创，MIT（见 `LICENSE`）。
- 请尊重你所用主题素材的原许可 —— 本仓库不含任何第三方主题内容。
