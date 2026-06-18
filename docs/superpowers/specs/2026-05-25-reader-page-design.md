# Reader Page Design
Date: 2026-05-25

## Goal
A personal English reading coach at `heyhelen.art/reader`. The user pastes a URL or uploads a PDF; the AI proactively marks key passages; clicking a highlight reveals an explanation; clicking "深入学习" opens a Feynman + Socratic chatbot.

---

## Layout

### Page structure
```
┌─────────────────────────────────────┐
│  URL input bar + PDF upload button  │
├─────────────────────────────────────┤
│                                     │
│         Article (full width)        │
│    with 4-color highlight marks     │
│                                     │
├─────────────────────────────────────┤
│   Bottom drawer (slides up on       │
│   highlight click, expands for      │
│   chatbot)                          │
└─────────────────────────────────────┘
```

### Highlight colour system
Each of the 4 AI-detected types gets a distinct underline colour + matching translucent background:

| Type | Colour | Style |
|------|--------|-------|
| `key-argument` | Green `#7ec668` | solid underline |
| `vocabulary` | Blue `#64a8e0` | solid underline |
| `complex-sentence` | Orange `#e09664` | dashed underline |
| `related-concept` | Purple `#b482dc` | dotted underline |

### Bottom drawer — detail mode
Triggered by tapping any highlight. Contains:
1. **Term / phrase** + type badge (小标签)
2. **English explanation** (one sentence, plain language)
3. **Chinese explanation** (一句话中文)
4. Two action buttons:
   - `💬 深入学习` → expands drawer to chat mode
   - `＋ 加入词库` → saves to Prisma Word table, button changes to `✓ 已保存`

### Bottom drawer — chat mode
Triggered by "深入学习". Drawer expands upward to fill ~60% of viewport; article shrinks to a top strip showing the active highlight in context.

Chat sequence (auto-initiated by AI, maps to `/api/concept` phases):
1. **Feynman phase** (`phase: 'explain'`): AI opens by asking the user to explain the concept in their own words. First message is AI-generated and auto-sent on drawer open.
2. **Socratic phase** (`phase: 'socratic'`): After the user's first reply, all subsequent AI turns use Socratic mode — one focused question per turn, no direct answers. The phase switches automatically after the first user message.

Chat ends when the user taps a close button or swipes the drawer down.

---

## Components

```
src/app/reader/
  page.tsx                 ← route entry, orchestrates state

src/components/reader/
  UrlInput.tsx             ← URL field + PDF upload, triggers session creation
  ArticleView.tsx          ← renders article HTML, overlays highlights
  HighlightMark.tsx        ← individual <mark> span, handles click
  BottomDrawer.tsx         ← animated container (detail | chat | closed)
  DrawerDetail.tsx         ← term + EN/CN explanation + action buttons
  ConceptChat.tsx          ← Feynman/Socratic chat interface
  VocabButton.tsx          ← "加入词库" with saved state
```

---

## State

```ts
type DrawerMode = 'closed' | 'detail' | 'chat'

// page.tsx state
session:          Session | null        // from /api/reader/session SSE
loadingState:     'idle' | 'loading' | 'ready' | 'error'
activeHighlight:  Highlight | null
drawerMode:       DrawerMode
chatHistory:      { role: 'user' | 'assistant'; content: string }[]
```

Highlights stream in via SSE as the session loads — each `highlight` event appends to `session.highlights` and triggers a re-render of `ArticleView`.

---

## Data flow

```
User pastes URL
  → UrlInput calls POST /api/reader/session (SSE)
  → 'session' event → sets title, rawText, html
  → 'highlight' events (streaming) → appends to highlights[]
  → ArticleView re-renders with each new highlight

User clicks highlight
  → sets activeHighlight, drawerMode = 'detail'
  → DrawerDetail fetches nothing (data already in highlight.preview)
  → "＋ 加入词库" → POST /api/reader/vocabulary

User clicks "深入学习"
  → drawerMode = 'chat'
  → ConceptChat auto-sends first Feynman prompt to POST /api/concept
  → SSE response streams into chat bubble
  → User replies, AI responds (Socratic), loop continues
```

---

## API surface used by this page

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/reader/session` | POST | SSE: extract + detect highlights |
| `/api/reader/vocabulary` | POST | Save word to vocabulary |
| `/api/reader/vocabulary` | GET | Show saved words (future vocabulary page) |
| `/api/concept` | POST | SSE: Feynman/Socratic chat (existing endpoint) |

---

## Styling

- Follows heyhelen's existing dark theme (Mantine + Tailwind)
- Article rendered in `font-family: Georgia, serif`, `max-width: 680px`, centred
- Drawer: `position: fixed; bottom: 0; width: 100%`, animated with CSS `transform: translateY`
- Mobile-first; no special desktop-only layout

---

## Out of scope (this iteration)

- Playwright extraction for SPA pages (X.com, Substack) — Python backend still handles this separately
- Vocabulary review / flashcard mode
- Related reading recommendations
- Auth-gating the reader page (open to all heyhelen visitors for now)
