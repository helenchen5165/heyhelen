# Reader — Domain Glossary

## Reader

A personal English-reading tool built for **one user** (the author). Target reader profile: Chinese-native with foundational English ability, needs to engage with complex texts — investment memos, academic papers, research reports. Can read independently but struggles with dense vocabulary, complex syntax, or domain-specific concepts.

**Authentication**: Not required. The reader is single-user and personal. No login gate for any reader feature, including the Vocabulary Bank.

---

## Terms

### Translate Flow
User-initiated action. The reader selects a passage and asks for translation. Priority order: (1) accurate Chinese translation, (2) contextual explanation to deepen understanding. The translation is the goal; explanation is secondary support.

### Explain Flow
User-initiated action. The reader selects a passage and asks for explanation. Priority order: (1) explain the meaning, (2) deepen understanding via Feynman or Socratic questioning. Translation is not the goal here.

### Deepening
The second phase of both flows — after initial translation or explanation, the system engages the reader with questions (Socratic or Feynman-style) to help them truly internalize the concept, not just understand it superficially.

### Pre-read Annotation (预读标注)
Highlights automatically detected by the AI before the reader starts reading. Signals "this is worth noticing." Types: `key-argument`, `vocabulary`, `complex-sentence`, `related-concept`. Clicking opens the drawer in detail mode.

**Quality standard**: 8–15 highlights per article. Prioritise `key-argument` (author's core claims) and `vocabulary` (domain-specific terms). At most 2–3 `complex-sentence` picks (hardest to parse only). `related-concept` for ideas worth exploring further. Fewer but accurate is better than many but noisy.

**Visual grouping** (two colors):
- `key-argument` + `related-concept` → conceptual highlights (same color)
- `vocabulary` + `complex-sentence` → language difficulty highlights (same color)

**Known issue**: Current detection finds too few highlights. Under-detection is the active bug. Color grouping not yet implemented (all highlights currently render the same style).

### Active Help Request (主动求助)
Reader manually selects text and triggers Explain or Translate. Signals "I don't understand this." Always opens the drawer in chat mode directly.

### Drawer Actions
Both Pre-read Annotations and Active Help Requests expose the same two actions in the drawer's top-right corner:
- **加入词库** — save the term/passage to the reader's personal Vocabulary Bank
- **深入学习** — enter Deepening mode (Socratic/Feynman questioning)

### Vocabulary Bank (词库)
The reader's personal language accumulation library. Stores terms, sentences, and concepts worth remembering — saved from any reading session. Not a bookmark or history; it carries learning intent. The reader returns to it to review and consolidate what they've encountered across all their reading.

### Source
The content a reader brings into a Session. Three types:
- **URL** — a web article; server fetches and extracts via Readability
- **PDF** — uploaded file; parsed server-side via pdf-parse
- **Text paste** *(planned)* — raw text pasted directly; primary use case is X.com long threads and other SPA-rendered pages that can't be fetched server-side

SPA domains (X.com, LinkedIn, etc.) are currently blocked at the URL path with an explicit error.

### Session
A single continuous reading of one article or document. Starts when the reader submits a URL or uploads a PDF; ends when they load a new source. **Currently in-memory only** — refreshing the page restarts the session (re-extracts article, re-detects highlights, chat history lost).

> **Future: Session Persistence** — sessions should be saved to the database so readers can resume where they left off, including highlights and chat history. Requires authentication. Not yet implemented.

---

## Future Work

- **Session Persistence**: Save sessions to DB keyed by URL/file hash. Restore highlights and chat history on return visit. Requires user login.
- **Highlight Color Groups**: `key-argument` + `related-concept` in one color; `vocabulary` + `complex-sentence` in another. Currently all highlights render the same style.
- **Highlight Quality**: Improve detection prompt to consistently produce 8–15 accurate highlights per article.
- **Text Paste Source**: Add a "Paste text" tab to UrlInput. Extend `SessionSource` with `{ text: string; title?: string }`. Primary use case: long X.com threads and other SPA content (LinkedIn, WeChat articles) that can't be server-rendered. X.com is currently blocked with a "browser rendering required" error.
