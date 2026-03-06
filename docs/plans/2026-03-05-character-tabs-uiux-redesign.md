# Character Data Tabs — UI/UX Redesign Document

**Date:** 2026-03-05
**Author:** Designer
**Scope:** `CharacterDataTabs` and its six child panels

---

## 1. Aesthetic Direction

**Tone:** Warm-data-dense. Not a game UI pastiche, not a generic dashboard. The orange/cream/brown palette already signals "MapleStory" without needing pixel art chrome. The redesign leans into that warmth and adds structure through consistent elevation rhythm and deliberate typographic weight contrast.

**The one memorable thing:** Every panel has a tinted header strip — a thin `#f7931e` left-border accent bar on section titles — that makes each panel feel authored rather than assembled.

**What we are NOT doing:** gradients on gradients, card-inside-card nesting, icon decoration on every row, purple-on-white generic SaaS look.

---

## 2. Theme Token Reference (from `MuiThemeProvider.js`)

```
shape.borderRadius:      16   (px — all Cards/Papers)
primary.main:            #f7931e
primary.light:           #ffb347
primary.dark:            #cc6e00
secondary.main (light):  #8c6239
background.default:      #fff7ec  (light) / #1a1210 (dark)
background.paper:        #fff3e0  (light) / #2a1f1a (dark)
text.primary:            #4e342e  (light) / #f5e6d3 (dark)
text.secondary:          #6d4c41  (light) / #c4a882 (dark)
fontFamily:              Nunito (primary), Comic Neue (accent)
MuiButton borderRadius:  20
MuiPaper borderRadius:   20
```

**Gap:** `borderRadius: 2` is used inside panels but `shape.borderRadius = 16`. All inner containers should use `borderRadius: 2` (8 px) for tight inner boxes and `borderRadius: 'inherit'` for wrappers that sit inside a Card. The top-level Card already gets `borderRadius: 16` from the theme.

---

## 3. Problems Being Addressed (Priority Order)

| #   | Problem                                                             | Impact                                           |
| --- | ------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | `CharacterStats` fails silently — no error UI, no retry             | High: users see blank, think bug                 |
| 2   | `HyperStatPanel` nested tabs inside outer tabs                      | High: two levels of tabs is a UX anti-pattern    |
| 3   | `borderRadius: 2` vs theme `16` inconsistency                       | Medium: visible design incoherence               |
| 4   | `RuneSystems` empty state is English text                           | Medium: locale mismatch                          |
| 5   | No section descriptions / headers                                   | Medium: players don't know what each panel means |
| 6   | `CharacterStats` 2-col table breaks at 320 px                       | Medium: content overflow on small phones         |
| 7   | Skeleton placeholders in `RuneSystems` are dumb grey boxes          | Low: jarring                                     |
| 8   | No retry handler wired for Union Raider, Hyper Stat, Union Artifact | Medium: error state is terminal                  |

---

## 4. Tab Bar Redesign

### Current State

Plain MUI `Tabs` with `variant="scrollable"`. Labels only. No active indicator personality. borderBottom not rendered consistently across dark/light.

### Redesign Specification

**Variant:** Keep `variant="scrollable" scrollButtons="auto"`. Do not switch to fullWidth — 6 tabs at fullWidth on a 360 px phone would produce 60 px per tab, too cramped.

**Active indicator:** Replace the default 2 px bottom line with a **pill background** using `TabIndicator` override or `sx` on the active Tab. Pill should be `background: alpha(primary.main, 0.12)` with `borderRadius: 20` and no visible underline bar. This matches the button borderRadius (20) theme already set.

**Implementation path (MUI 7 sx-only):**

```
Tabs sx:
  '& .MuiTabs-indicator': { display: 'none' }
  '& .MuiTab-root.Mui-selected': {
    bgcolor: alpha(primary.main, 0.12),
    borderRadius: '20px',
    color: 'primary.main',
    fontWeight: 700,
  }
  '& .MuiTab-root': {
    fontWeight: 600,
    minHeight: 40,
    py: 0.75,
    px: 2,
    borderRadius: '20px',
    transition: 'background-color 150ms ease',
    '&:hover:not(.Mui-selected)': { bgcolor: alpha(primary.main, 0.06) }
  }
```

**Tab bar container:** Wrap `Tabs` in a `Box` with `sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.5, mb: 2 }}`. This creates a pill-tray effect that is theme-consistent.

**Tab labels with counts (where applicable):**

- "套裝效果" — add a `(N)` count badge using a small inline `Chip` once data loads. When loading, omit badge.
- "符文系統" — same, show total rune count.
- Other tabs: label only.

**Dark mode:** The pill-tray box uses `background.paper` which is `#2a1f1a` in dark mode. The selected pill `alpha(#f7931e, 0.15)` reads clearly on that background. No separate dark mode logic needed.

**Accessibility:**

- Keep existing `aria-label="角色資料分頁"` on Tabs.
- Add `id="tab-{index}"` and `aria-controls="tabpanel-{index}"` to each Tab.
- Wrap tab panel output Box with `role="tabpanel" id="tabpanel-{activeTab}" aria-labelledby="tab-{activeTab}"`.
- Keep existing `aria-live="polite"` on the panel Box.

**Tab order:** Unchanged — 能力值 / 聯盟戰地 / 極限屬性 / 套裝效果 / 聯盟神器 / 符文系統.

---

## 5. Shared Panel Patterns

These patterns MUST be applied consistently across all six panels.

### 5.1 Loading State

All panels should use the same loading skeleton pattern, not raw `CircularProgress`.

**Wireframe (text description):**

```
[ Skeleton line 60% width, height 20px ]
[ Skeleton line 40% width, height 16px ]
[ Skeleton rect 100% width, height 48px, borderRadius 8px ]
[ Skeleton rect 100% width, height 48px, borderRadius 8px ]
[ Skeleton rect 80% width, height 48px, borderRadius 8px ]
```

**Implementation:** A shared `<PanelSkeleton rows={N} />` component:

- `Skeleton variant="rectangular"` with `borderRadius: 1` (8 px), height 44, full width
- Default `rows={4}`, configurable per panel
- Wrapped in `Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1 }}`
- `RuneSystems` uses `rows={6}` shaped as card skeletons (see section 10)

**Why not CircularProgress:** The spinner gives no sense of what content shape is coming. Skeletons set spatial expectation and reduce perceived wait time.

### 5.2 Error State

Currently inconsistent: `CharacterStats` has no error UI; others use raw `Alert`.

**Unified pattern:**

```
Box sx={{ p: 3, textAlign: 'center' }}
  - WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
  - Typography variant="body2" color="text.secondary": 「{friendly message}」
  - Button variant="outlined" color="primary" size="small" onClick={onRetry}: 「重新載入」
    (omit Button if no onRetry prop)
```

**Friendly messages per panel:**

- CharacterStats: "無法載入能力值，請稍後再試"
- UnionRaider: "無法載入聯盟戰地資料"
- HyperStat: "無法載入極限屬性資料"
- SetEffect: "無法載入套裝效果資料"
- UnionArtifact: "無法載入聯盟神器資料"

**Retry wiring gap:** `CharacterDataTabs` currently has no retry handler for UnionRaider, HyperStat, or UnionArtifact. The redesign should add `onRetry` callbacks that call `fetchTabData` again with the same arguments. This is a logic fix required to make the error UI meaningful.

### 5.3 Empty State

**Unified pattern:**

```
Box sx={{ py: 6, textAlign: 'center' }}
  - InboxIcon or domain-specific icon, sx={{ fontSize: 48, color: alpha(text.secondary, 0.4), mb: 1.5 }}
  - Typography variant="body2" color="text.secondary": 「{message}」
```

**Per-panel messages:**

- CharacterStats: "尚無能力值資料"
- UnionRaider: "尚無聯盟戰地資料"
- HyperStat: "此預設尚未設定極限屬性"
- SetEffect: "尚無套裝效果資料"
- UnionArtifact: "尚無聯盟神器資料"
- RuneSystems: "尚無符文系統資料" (replace English text)

### 5.4 Panel Wrapper

Every panel's root element should follow this structure:

```
Box sx={{ mt: 1 }}  ← only needed if panel is the direct child rendered after Tabs
  {/* panel-specific content */}
```

Do NOT add extra border/padding boxes inside panels. The outer `CardContent sx={{ p: 3 }}` in `CharacterDataTabs` already provides the breathing room. The inner `border: '1px solid divider'` boxes in `UnionRaiderPanel`, `HyperStatPanel`, `SetEffectPanel`, `UnionArtifactPanel` should be removed — they create a visual double-frame effect.

**Exception:** `CharacterStats` groups benefit from separation. Replace `border: '1px solid divider'` with `bgcolor: alpha(primary.main, 0.05)` background tinting instead of a border. This gives visual grouping without border nesting.

### 5.5 Section Header Pattern (new)

Each panel should open with a concise descriptor for players who may not know what the tab contains. This is especially important for "聯盟戰地" and "聯盟神器" which are MapleStory-specific terms.

**Wireframe:**

```
Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
  Box sx={{ width: 3, height: 20, bgcolor: 'primary.main', borderRadius: 1, flexShrink: 0 }}
  Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}:
    「{description}」
```

**Descriptions per panel:**

- CharacterStats: "角色最終能力值，包含所有加成來源"
- UnionRaider: "聯盟戰地格子所提供的能力值加成"
- HyperStat: "極限屬性各項目的等級與加成效果"
- SetEffect: "目前裝備的套裝組合與生效的套裝效果"
- UnionArtifact: "聯盟神器水晶與效果等級"
- RuneSystems: "各地區符文目前等級與升級所需經驗"

The left-border accent bar (`Box sx={{ width: 3, ... bgcolor: 'primary.main' }}`) is the single consistent design motif added by this redesign. It appears on every panel header and creates a branded thread through all six tabs.

---

## 6. Per-Panel Redesign

### 6.1 CharacterStats

**Current problems:**

- Fails silently (no error state)
- Hard-coded `width: '40%'` / `width: '10%'` breaks on narrow screens
- `borderRadius: 2` on group boxes
- No section header

**Redesign:**

Add `error` and `onRetry` props. The component should follow the shared error pattern.

**Group display approach — replace 2-column table layout with responsive rows:**

On mobile (`xs`), each stat renders as a single full-width row with label left, value right:

```
[ STR                              412,520 ]
[ DEX                              310,044 ]
```

On desktop (`sm+`), keep 2-across layout but use `Grid` instead of hard-coded `Table` widths:

```
Grid container spacing={1}
  Grid size={{ xs: 12, sm: 6 }} for each stat
    Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75 }}
      Typography variant="body2" fontWeight={600}: stat name
      Typography variant="body2" color="primary.main" fontWeight={700}: stat value
```

**Group separation:** Instead of `border: '1px solid divider'`, use:

```
Box sx={{
  bgcolor: alpha(primary.main, 0.05),
  borderRadius: 2,
  p: 1.5,
  mb: 1.5,
}}
```

Group 1 (STR/DEX/INT/LUK/HP/MP): no special accent beyond the tinted bg.
Group 2 (星力/神秘力量/etc): same tinted bg. These are "prestige" stats — consider adding a subtle `primary.light` left-border to the group box to visually distinguish them.
Group 3 (other combat stats): same pattern as group 1.

**Typography:** Stat names use `fontWeight: 600`, values use `fontWeight: 700 color: primary.main` for numbers that matter. This is intentional — players scan for numbers, not labels.

---

### 6.2 UnionRaiderPanel

**Current problems:**

- Plain vertical list with no visual grouping
- Stats are raw strings like "STR 10%" — repetitive to read
- No retry handler wired from parent

**Redesign:**

The union raider stat strings are already human-readable (e.g. "STR 10%", "攻擊力 5%"). Rather than a bare table, render them as a **wrapping Chip row**:

```
Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}
  {stats.map((stat, i) =>
    <Chip key={i}
      label={stat}
      size="small"
      variant="outlined"
      sx={{ borderColor: 'primary.light', color: 'text.primary', fontWeight: 600 }}
    />
  )}
```

**Why chips:** The stat list is typically 30–50 items. A table forces vertical scrolling. Chips wrap naturally and allow the eye to scan in any direction. The orange border ties them to the theme.

**Wireframe (mobile, ~360px):**

```
[ STR 10% ] [ DEX 10% ] [ INT 10% ]
[ LUK 10% ] [ HP 5%   ] [ 攻擊力 5% ]
[ 魔法攻擊力 5% ] [ 暴擊確率 5% ]
...
```

**Section header:** "聯盟戰地格子所提供的能力值加成" with left-border accent.

---

### 6.3 HyperStatPanel — Nested Tab Fix

**Current problem:** Sub-tabs (預設 1 / 2 / 3) inside the outer tab system creates two levels of tab navigation. This is confusing — keyboard users must Tab into a second Tabs component, and mobile users get two sets of tap targets.

**Solution: Replace sub-tabs with a ToggleButtonGroup**

```
ToggleButtonGroup
  value={presetIndex}
  exclusive
  onChange={(_, v) => v !== null && setPresetIndex(v)}
  size="small"
  sx={{ mb: 2 }}
  aria-label="極限屬性預設選擇"

  ToggleButton value={0} sx={{ px: 2, borderRadius: '20px !important' }}:
    "預設 1" + (activePreset === '1' ? Chip label="使用中" size="small" : null)
  ToggleButton value={1}: "預設 2" + optional Chip
  ToggleButton value={2}: "預設 3" + optional Chip
```

**"使用中" indicator:** Currently appended to the label string as text. Instead, render it as a small `Chip` with `color="primary" size="small"` next to the button label. This makes the active preset scannable at a glance.

**Stat table redesign:** Keep the three-column layout (stat_type / Lv.N / increase) but improve:

- `stat_type`: `Typography variant="body2" fontWeight={600}`
- `Lv.N`: `Chip label={"Lv." + level} size="small" variant="outlined"` — consistent with other panels
- `stat_increase`: `Typography variant="body2" color="primary.main" fontWeight={700}`

**Layout wireframe (desktop):**

```
[ 預設 1 ] [ 預設 2 ] [ 預設 3 使用中 ]

stat_type            Lv.N     increase
─────────────────────────────────────────
力量                 [Lv.10]  +30,000
敏捷                 [Lv.8]   +24,000
暴擊傷害             [Lv.15]  +15%
```

---

### 6.4 SetEffectPanel

**Current problems:**

- `borderRadius: 2` container
- Accordion items have no visual weight — all look equally important
- `total_set_count` Chip is orange-outlined but very small (height: 20, fontSize: 0.7rem)

**Redesign:**

Keep the Accordion pattern — it is the right component for variable-length set data. Improve:

**AccordionSummary:**

```
Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}
  Typography variant="body2" fontWeight={700}: set_name
  Chip
    label=`${total_set_count}件`
    size="small"
    color="primary"
    variant="filled"   ← change from outlined to filled for more visual weight
    sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
```

**AccordionDetails — effect grouping:**

For each effect entry, use a clean label + value pair:

```
Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
  {activeEffects.map(effect =>
    Box sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: 'primary.light' }}
      Typography variant="caption" color="text.secondary" fontWeight={600}:
        "{effect.set_count}件"
      Typography variant="body2": effect.set_option
  )}
```

The left-border accent on each effect row reinforces the design motif from section headers.

**Sort order:** Render sets sorted by `total_set_count` descending — the set with the most pieces equipped is usually most relevant to the player.

**Empty accordion body:** Change "無主動效果" to "此套裝目前無生效的效果" for clarity.

---

### 6.5 UnionArtifactPanel

**Current problems:**

- Two sections (水晶 / 效果) feel disconnected — same flat table style
- Crystal cards show `crystal_option_name_1` only; options 2 and 3 are dropped
- `borderRadius: 2` container

**Redesign:**

**Crystals section — card grid layout:**

The crystal data is spatial — each crystal has a name, level, and up to 3 options. A table forces one option per row; a card grid can show all three options per crystal compactly.

```
Grid container spacing={1.5}
  {crystals.map(crystal =>
    Grid size={{ xs: 12, sm: 6, lg: 4 }}
      Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}
        Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          Typography variant="body2" fontWeight={700}: crystal.name
          Chip label=`Lv.${crystal.level}` size="small" color="primary" variant="outlined"
        Typography variant="caption" color="text.secondary": crystal.crystal_option_name_1
        {crystal.crystal_option_name_2 &&
          Typography variant="caption" color="text.secondary": crystal.crystal_option_name_2}
        {crystal.crystal_option_name_3 &&
          Typography variant="caption" color="text.secondary": crystal.crystal_option_name_3}
  )}
```

**Effects section — remain as list:**

Effects are already compact (name + level). Use the same Chip-level pattern as other panels:

```
Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
  {effects.map(effect =>
    Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.5 }}
      Typography variant="body2": effect.name
      Typography variant="body2" color="primary.main" fontWeight={700}: `Lv.${effect.level}`
  )}
```

**Section separation:** Replace `<Divider>` between crystals and effects with a `Box sx={{ height: 8 }}` gap + the section header pattern (left-border accent + subtitle).

---

### 6.6 RuneSystems

**Current problems:**

- Sub-tabs (祕法 / 真實 / 豪華真實) inside outer tabs — same nested-tab problem as HyperStat
- Empty state is English: "No rune data available"
- Skeleton placeholders are static grey boxes with fixed `width: 220`
- `RuneCard` has `minWidth: 200, maxWidth: 250` fixed — breaks flex layout on very narrow screens

**Nested tabs fix:**

If a character has runes of only one type, show no type selector at all — just the grid directly.

If a character has runes of 2+ types, replace the inner Tabs with a **ToggleButtonGroup** identical to the HyperStat fix:

```
ToggleButtonGroup
  value={activeTypeKey}
  exclusive
  onChange={(_, v) => v !== null && setActiveTypeKey(v)}
  size="small"
  sx={{ mb: 2, flexWrap: 'wrap' }}

  {availableTypes.map(type =>
    ToggleButton value={type.key}:
      `${type.label} (${filteredRunes[type.key].length})`
  )}
```

Adding the count `(N)` to each type button gives players immediate density information.

**RuneCard redesign:**

Remove fixed `minWidth/maxWidth`. Let the Grid column define the card width.

```
Card sx={{ borderRadius: 2, overflow: 'hidden' }}
  CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}
    Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
      img 40x40 (keep existing, reduce from 48 to 40 to give more room for text)
      Box sx={{ flex: 1, minWidth: 0 }}
        Typography variant="body2" fontWeight={700} noWrap: symbol_name
        Typography variant="caption" color="text.secondary":
          `Lv.${symbol_level} / ${getMaxLevel(rune)}  |  力量: ${symbol_force}`
    Box sx={{ mt: 1 }}
      LinearProgress value={progress} variant="determinate"
        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(primary.main, 0.15),
              '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
      Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.25 }}:
        `${progress.toFixed(1)}%`
```

**Horizontal layout** (icon left, text right) is more space-efficient than the current vertical stack, especially on mobile where `xs:12` makes each card full-width.

**Skeleton placeholders:** Replace the dumb grey boxes with `Skeleton` components matching the new card shape:

```
Card sx={{ borderRadius: 2 }}
  CardContent sx={{ p: 1.5 }}
    Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}
      Skeleton variant="rounded" width={40} height={40}
      Box sx={{ flex: 1 }}
        Skeleton variant="text" width="70%"
        Skeleton variant="text" width="50%"
    Skeleton variant="rounded" height={6} sx={{ borderRadius: 3 }}
```

**Empty state:** Change "No rune data available" to "尚無符文系統資料".

---

## 7. Mobile vs Desktop Layout Differences

### Tab Bar

| Breakpoint    | Behavior                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| xs (< 600px)  | `variant="scrollable"`, pill tray shows ~3 tabs at a time, scroll arrows visible |
| sm+ (≥ 600px) | Same scrollable variant, all 6 tabs likely visible without scrolling             |

Do not switch to `variant="fullWidth"` at any breakpoint — the label lengths are unequal and fullWidth creates awkward word wrapping.

### CharacterStats

| Breakpoint | Layout                                                              |
| ---------- | ------------------------------------------------------------------- |
| xs         | Single-column: each stat is full-width row, label left, value right |
| sm+        | Two-column Grid: stats paired side-by-side within each group box    |

### UnionRaider

| Breakpoint | Layout                            |
| ---------- | --------------------------------- |
| xs         | Chips wrap naturally, 2–3 per row |
| sm+        | Chips wrap, 4–6 per row           |

### HyperStat

| Breakpoint | ToggleButtonGroup                                                               |
| ---------- | ------------------------------------------------------------------------------- |
| xs         | `sx={{ flexWrap: 'wrap' }}` so buttons stack if needed (unlikely for 3 buttons) |
| sm+        | Buttons inline                                                                  |

### UnionArtifact Crystals

| Breakpoint | Grid                                              |
| ---------- | ------------------------------------------------- |
| xs         | `size={{ xs: 12 }}` — one crystal card per row    |
| sm         | `size={{ xs: 12, sm: 6 }}` — two columns          |
| lg+        | `size={{ xs: 12, sm: 6, lg: 4 }}` — three columns |

### RuneSystems

| Breakpoint | RuneCard Grid                                                              |
| ---------- | -------------------------------------------------------------------------- |
| xs         | `size={{ xs: 12 }}` — full width horizontal card                           |
| sm         | `size={{ xs: 12, sm: 6 }}` — two columns                                   |
| md+        | `size={{ xs: 12, sm: 6, md: 4 }}` — three columns (unchanged from current) |

---

## 8. Spacing and Typography System

### Spacing Rhythm

All panels use MUI's 8 px base unit. Target rhythm:

| Token      | Value | Usage                           |
| ---------- | ----- | ------------------------------- |
| `gap: 0.5` | 4px   | Tight inline gaps (icon + text) |
| `gap: 1`   | 8px   | Default item spacing in lists   |
| `gap: 1.5` | 12px  | Card-level spacing              |
| `gap: 2`   | 16px  | Section spacing                 |
| `p: 1.5`   | 12px  | Inner card padding              |
| `mb: 2`    | 16px  | Section header bottom margin    |
| `py: 6`    | 48px  | Empty state vertical padding    |

### Typography Scale (within panels)

| Role                       | Variant           | Weight | Color                   |
| -------------------------- | ----------------- | ------ | ----------------------- |
| Panel descriptor           | body2             | 400    | text.secondary + italic |
| Section title (水晶, 效果) | subtitle2         | 700    | text.primary            |
| Item label                 | body2             | 600    | text.primary            |
| Item value (numeric)       | body2             | 700    | primary.main            |
| Supporting info            | caption           | 400    | text.secondary          |
| Level badges               | Chip size="small" | —      | outlined or filled      |

**Do not introduce any new font family.** All text uses Nunito via the inherited theme.

---

## 9. Accessibility Checklist

### Tab Navigation

- [x] `aria-label` on `Tabs` component: "角色資料分頁"
- [ ] Add `id="char-tab-{n}"` and `aria-controls="char-tabpanel-{n}"` to each `Tab`
- [ ] Add `role="tabpanel"` `id="char-tabpanel-{activeTab}"` `aria-labelledby="char-tab-{activeTab}"` to the panel `Box`
- [x] `aria-live="polite"` on panel container (already present)

### HyperStat ToggleButtonGroup

- [ ] `aria-label="極限屬性預設選擇"` on `ToggleButtonGroup`
- [ ] `aria-pressed` handled automatically by MUI ToggleButton

### RuneSystems ToggleButtonGroup

- [ ] `aria-label="符文類型選擇"` on `ToggleButtonGroup`

### Loading States

- [ ] Skeleton elements should have `aria-busy="true"` on their container, removed when content loads
- [ ] `aria-live="polite"` already on outer panel Box covers announcements

### Color Contrast

- `primary.main #f7931e` on `background.paper #fff3e0`: ratio ~3.1:1 — passes AA for large text (18pt+), fails for small text. Use only for numeric values (body2 fontWeight 700) and Chip labels, never for body copy.
- `text.secondary #6d4c41` on `background.paper #fff3e0`: ratio ~4.8:1 — passes AA for all text.
- Dark mode: `primary.main #f7931e` on `background.paper #2a1f1a`: ratio ~5.2:1 — passes AA.

### Focus Management

- `ToggleButtonGroup` and `Accordion` receive native focus. No custom focus management needed.
- `CharacterStats` retry `Button` should be the first focusable element in the error state Box.

---

## 10. What Stays the Same

- `SetEffectPanel` Accordion pattern — correct component, only styling improved
- `RuneCard` LinearProgress — keep, just restyle colors and reduce height from 8 to 6 px
- `CharacterDataTabs` lazy-loading logic — works correctly, no changes needed
- `CharacterDataTabs` caching via `getCachedData/setCachedData` — keep
- Tab order: 能力值 / 聯盟戰地 / 極限屬性 / 套裝效果 / 聯盟神器 / 符文系統
- `SetEffectPanel`'s `activeEffects` filter (`set_count <= total_set_count`) — correct logic

---

## 11. Implementation Sequence

Implement in this order to allow incremental testing:

1. **Shared components first:** `PanelSkeleton`, `PanelError`, `PanelEmpty` — used by all panels
2. **CharacterDataTabs tab bar** — pill tray styling + ARIA attributes + retry wiring for the 3 missing panels
3. **CharacterStats** — add error state + Grid-based responsive layout + group background tinting
4. **HyperStatPanel** — swap Tabs → ToggleButtonGroup
5. **RuneSystems** — swap Tabs → ToggleButtonGroup + fix empty state + restyle RuneCard
6. **UnionRaiderPanel** — swap table → Chip flow
7. **UnionArtifactPanel** — crystal grid + option display fix
8. **SetEffectPanel** — minor polish only (filled Chip, left-border accent on effects)

---

## 12. Out of Scope

- URL fragment persistence (`#stats`, `#runes`) — noted in prior review, deferred
- Union Raider board visualization — explicitly deferred per prior review
- Server-side data fetching migration — architecture change, separate concern
- Dark mode palette changes — current tokens are correct
- Animation/transition on tab switch — the existing `aria-live` + instant render is sufficient; adding a fade transition risks layout thrash during lazy loads
