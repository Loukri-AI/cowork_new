# Loukri AI CoWork — Rebranding Notes

This repository is a branded distribution of **goose** (the open-source AI agent,
Apache-2.0), productized as **Loukri AI CoWork** for VVIT, with **TokenKey
(tokenkey.in)** as the only AI service provider.

- **Upstream:** https://github.com/aaif-goose/goose
- **Pinned upstream commit:** `1e83e89f556fc60fd396df1fd0f2992f8b2f2dc1` (2026-09-18, shallow import)
- **License:** Apache-2.0 (preserved; this distribution modifies branding and the provider set)
- **Inference:** TokenKey — `https://tokenkey.in/v1` (OpenAI-compatible; docs: https://tokenkey.in/docs)

## What was changed vs upstream

### Provider: TokenKey only

| Change | File(s) |
|---|---|
| Bundled `tokenkey` declarative provider — engine `openai`, base URL `https://tokenkey.in/v1/chat/completions`, key env `TOKENKEY_API_KEY`, models `tk-auto` (default) + `tk-base` | `crates/goose-providers/src/declarative/definitions/tokenkey.json` (new), `crates/goose-providers/src/declarative.rs` (added to `expose_declarative_providers!`) |
| Registry filter — after every registry (re)load, everything except `tokenkey` is removed, including user-created `custom_*` providers | `crates/goose/src/providers/init.rs` (`apply_distro_provider_filter`), `crates/goose/src/providers/provider_registry.rs` (`retain_providers`) |
| Desktop onboarding renders the TokenKey key form directly (no provider picker, no local-model card, no custom-provider modal) | `ui/desktop/src/components/onboarding/ProviderSelector.tsx` |
| Settings: "Add Provider" card removed; local-inference section force-disabled | `ui/desktop/src/components/settings/providers/ProviderGrid.tsx`, `ui/desktop/src/acp/capabilities.ts` |
| Default provider/model fallbacks: `tokenkey` / `tk-auto` | `ui/desktop/src/main.ts` (`getBundledConfig`) |
| Skills platform extension disabled by default (the global skills index added ~8k tokens to every request) | `crates/goose/src/agents/platform_extensions/mod.rs` |
| No goose-docs.ai / aaif-goose links remain in the UI: quickstart link → tokenkey.in/docs, issue links → Loukri-AI/cowork_new, docs buttons removed | `ui/desktop/src/components/**` |
| Telemetry disabled by default (`GOOSE_DISABLE_TELEMETRY=1` on the backend process) | `ui/desktop/src/gooseServe.ts` |
| Agent identity in system prompt | `crates/goose/src/prompts/system.md` |

Users authenticate with **their own** `tk_live_...` key from the TokenKey console,
entered on first run (stored in goose's secret store: Windows keyring or
`%APPDATA%\Block\goose\secrets.yaml`). The base URL is compiled into the provider
definition and cannot be changed from the UI.

### Adding tk-32b / tk-coder when they go live

Edit `crates/goose-providers/src/declarative/definitions/tokenkey.json` and add the
models to the `models` array, then rebuild. (`dynamic_models: false` keeps the list
curated; flip it to `true` to fetch `GET /v1/models` live instead.)

### Branding

- Product name **Loukri AI CoWork**, executable `LoukriCoWork.exe`,
  npm package `loukri-cowork`, installer `LoukriAICoWorkSetup.exe` (Squirrel).
- Icons in `ui/desktop/src/images/` are generated from `brand/loukri-ai-icon.png`
  (script pattern: sharp + png-to-ico). Tray icons ship in full color for the
  Windows taskbar. `icon.icns` is still the upstream macOS icon — regenerate
  before any macOS build.
- In-app logo components render the bundled PNG:
  `ui/desktop/src/components/icons/Goose.tsx` (keeps the legacy `Goose`/`Rain`
  export names), `GooseLogo.tsx`, `FlyingBird.tsx` (pulses instead of flying).
- **Jarvis design language** applied to both built-in themes:
  cream `#fcf6e6` / ink `#0f172c` / accent `#f0a06f`, Inter + JetBrains Mono
  (bundled via `@fontsource-variable/*`). Light (cream) is the default theme.
  Tokens: `ui/desktop/src/theme/theme-tokens.ts`, `ui/desktop/src/styles/main.css`.
- All user-visible "Goose" strings renamed to "CoWork" / "Loukri AI CoWork"
  (component `defaultMessage`s, all 16 i18n catalogs, menus, dialogs, tray,
  notifications, error paths).

### Deliberately unchanged (internal)

- The `goose://` deep-link scheme, `GOOSE_*` env vars, `goosed`/`goose.exe`
  binary name, config directory (`%APPDATA%\Block\goose`), session partition
  `persist:goose`, and the `.goosehints` convention — renaming these would break
  backend compatibility and shared links for no visible benefit.
- The update feed points at `Loukri-AI/cowork_new` (this repository). Until it
  publishes releases with `latest.yml`, update checks simply find nothing — they
  can never pull an upstream goose build over this distribution.

## Building for Windows (local)

Requirements: Node ≥ 24.10, pnpm ≥ 10.30, Rust (pinned 1.96.1 via rust-toolchain.toml),
MSVC target, and **LLVM** (`winget install LLVM.LLVM`) — bindgen (used by the vendored
v8 crate) needs `libclang.dll`.

```bash
# 1. Build the Rust CLI (goose.exe)
#    local-inference is excluded on purpose: it pulls llama.cpp and is
#    disabled in this distribution's UI anyway.
rustup target add x86_64-pc-windows-msvc
export LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cargo build --release --target x86_64-pc-windows-msvc -p goose-cli --bin goose \
  --no-default-features \
  --features "code-mode,aws-providers,telemetry,nostr,otel,rustls-tls,live-voice,system-keyring,update"
cp target/x86_64-pc-windows-msvc/release/goose.exe ui/desktop/src/bin/

# 2. Stage uv.exe / uvx.exe / npx.cmd for the Windows bundle
cd ui/desktop && node scripts/prepare-platform-binaries.js

# 3. Build the desktop app + installer
pnpm run make        # Squirrel Setup.exe + zip in ui/desktop/out/
```

Artifacts land in `ui/desktop/out/` (`LoukriCoWork-<version> Setup.exe`, zip,
and `loukricowork-<version>-full.nupkg`).

## Verifying the provider restriction (CLI, no GUI)

```bash
GOOSE_DISABLE_TELEMETRY=1 ./target/x86_64-pc-windows-msvc/release/goose.exe acp
# send initialize + goose/providersList_unstable over the ACP channel —
# "tokenkey" must be the only non-custom_ provider
```
