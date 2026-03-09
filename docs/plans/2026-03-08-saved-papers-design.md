# Saved Papers System - Design Document

> **Date**: March 8, 2026
> **Status**: Approved
> **Approach**: SWR + Optimistic UI

## Overview

The Saved Papers System allows authenticated users to bookmark and organize research papers into collections for later reference. Users can add personal notes to saved papers and organize them into custom collections.

## Requirements Summary

| Requirement | Decision |
|------------|----------|
| Primary Use Case | Research Collection (organize into folders with notes) |
| Collection Structure | Multiple collections (paper can belong to many) |
| Notes | Single note per saved paper |
| Sharing | Private only (no sharing in this phase) |
| Save Locations | Browse cards, Chat citations, Dedicated /saved page |
| Auth Handling | Show bookmark, prompt login if unauthenticated |

---

## Data Model

### Schema

```typescript
// src/db/schema/saved-papers.ts

import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "@/lib/auth/schema";
import { catalog } from "./catalog";

// Collections table - user-created folders
export const collections = pgTable("collections", {
  id: serial().primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  color: varchar({ length: 7 }), // Hex color like "#3B82F6"
  icon: varchar({ length: 50 }), // Icon name like "folder", "star"
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Saved papers - junction table (many-to-many)
export const savedPapers = pgTable(
  "saved_papers",
  {
    id: serial().primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    catalogId: integer("catalog_id")
      .references(() => catalog.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: integer("collection_id").references(
      () => collections.id,
      { onDelete: "cascade" }
    ),
    note: text(), // Single note per saved paper
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Unique: one user can save same paper to same collection once
    index("saved_papers_user_catalog_collection_idx")
      .unique()
      .on(table.userId, table.catalogId, table.collectionId),
  ]
);
```

### Relations

```typescript
// src/db/schema/saved-papers.ts

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(user, {
    fields: [collections.userId],
    references: [user.id],
  }),
  savedPapers: many(savedPapers),
}));

export const savedPapersRelations = relations(savedPapers, ({ one }) => ({
  user: one(user, {
    fields: [savedPapers.userId],
    references: [user.id],
  }),
  catalog: one(catalog, {
    fields: [savedPapers.catalogId],
    references: [catalog.id],
  }),
  collection: one(collections, {
    fields: [savedPapers.collectionId],
    references: [collections.id],
  }),
}));
```

### Key Decisions

- `collectionId` can be `NULL` → represents "Uncategorized" (default)
- Many-to-many: Same paper can be saved to multiple collections via multiple rows
- `note` is per `(userId, catalogId, collectionId)` tuple
- Cascading deletes for clean data hygiene

---

## API Layer

### Endpoints

#### Saved Papers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-papers` | List user's saved papers |
| POST | `/api/saved-papers` | Save a paper |
| DELETE | `/api/saved-papers/[id]` | Unsave a paper |
| PATCH | `/api/saved-papers/[id]` | Update note |
| GET | `/api/saved-papers/status` | Check if paper is saved (lightweight) |

#### Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List user's collections |
| POST | `/api/collections` | Create collection |
| PATCH | `/api/collections/[id]` | Update collection |
| DELETE | `/api/collections/[id]` | Delete collection |

### Types

```typescript
interface SavedPaper {
  id: number;
  catalogId: number;
  collectionId: number | null;
  note: string | null;
  createdAt: string;
  // Joined from catalog
  title: string;
  author: string | null;
  abstract: string | null;
  publicationYear: number | null;
  catalogType: string | null;
  accessLink: string | null;
}

interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  paperCount: number; // Computed
  createdAt: string;
}

interface SaveStatus {
  isSaved: boolean;
  savedPaperId?: number;
  collectionIds: number[];
}
```

### Auth Requirements

- All endpoints require authentication
- Users can only access their own data (filter by `userId` from session)
- Return 401 if unauthenticated

---

## Hooks & State Management

### useSavedPapers

```typescript
// src/hooks/use-saved-papers.ts

interface UseSavedPapersOptions {
  collectionId?: number;
  page?: number;
  limit?: number;
}

export function useSavedPapers(options: UseSavedPapersOptions = {}) {
  // SWR for data fetching
  // Optimistic mutations for save/unsave
  // Returns: savedPapers, collections, pagination, isLoading, error, savePaper, unsavePaper
}
```

### useCollections

```typescript
// src/hooks/use-collections.ts

export function useCollections() {
  // SWR for collections list
  // CRUD operations with optimistic updates
  // Returns: collections, isLoading, error, createCollection, updateCollection, deleteCollection
}
```

### useSaveStatus

```typescript
// src/hooks/use-save-status.ts

export function useSaveStatus(catalogId: number) {
  // Lightweight check for save state
  // Used for bookmark icon display
  // Returns: isSaved, savedPaperId, collectionIds
}
```

---

## UI Components

### 1. SaveButton

**Location**: `src/components/save-button.tsx`

**Props**:
```typescript
interface SaveButtonProps {
  catalogId: number;
  variant: "icon" | "badge" | "button";
  size?: "sm" | "md";
  className?: string;
}
```

**Behavior**:
- Shows filled bookmark if saved, outline if not
- Unauthenticated: Opens login dialog
- Authenticated + not saved: Opens CollectionPicker
- Authenticated + saved: Shows quick unsave option

### 2. CollectionPicker

**Location**: `src/components/collection-picker.tsx`

**Props**:
```typescript
interface CollectionPickerProps {
  catalogId: number;
  existingCollections: Collection[];
  onSelect: (collectionId: number | null) => void;
  onCreateNew: (name: string) => void;
}
```

**UI**:
- List of user's collections with checkboxes
- "Create new collection" input
- Optional note text area
- Save button

### 3. CatalogCard (Updated)

**Changes to `src/components/catalog-card.tsx`**:
```tsx
<CardHeader>
  <div className="flex items-start justify-between gap-2 mb-2">
    <CardTitle>{item.title}</CardTitle>
    <SaveButton catalogId={item.id} variant="icon" />
  </div>
</CardHeader>
```

### 4. MessageSources (Updated)

**Changes to chat source citations**:
- Add SaveButton to citation hover card
- Use `variant="badge"` style for inline display

### 5. SavedPapersPage

**Location**: `src/app/saved/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ PageHeader: "Saved Papers" + CreateCollectionBtn │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│  Sidebar      │    Main Content                 │
│  - All Saved  │    - FilterBar                  │
│  - Collection1│    - PapersGrid                 │
│  - Collection2│      - SavedPaperCard           │
│  - ...        │      - SavedPaperCard           │
│  - Create New │    - Pagination                 │
│               │                                 │
└───────────────┴─────────────────────────────────┘
```

### 6. SavedPaperCard

**Location**: `src/components/saved-paper-card.tsx`

**Features**:
- Extended CatalogCard with note display/edit
- Collection badge
- Quick actions (move, unsave)
- Note inline editing

### 7. CollectionList

**Location**: `src/components/collection-list.tsx`

**Features**:
- List of collections with paper counts
- Edit/delete options on hover
- Selected state highlighting

---

## User Flows

### Flow 1: Save from Browse Page

```
1. User browses papers on /browse
2. User clicks bookmark icon on CatalogCard
3. If not authenticated → Login dialog appears
   - User signs in with Google
   - Returns to browse page, bookmark still clicked
4. If authenticated → CollectionPicker popover appears
5. User selects collection(s) or creates new one
6. User optionally adds note
7. User clicks "Save"
8. UI: Bookmark fills immediately (optimistic)
9. API call completes in background
```

### Flow 2: Save from Chat Citation

```
1. User views AI response with source citations
2. User hovers/clicks on citation
3. SaveButton (badge style) appears
4. Same flow as Browse (auth check → picker → save)
5. Saved state persists across conversations
```

### Flow 3: View Saved Papers

```
1. User clicks "Saved Papers" in sidebar
2. Redirects to /saved
3. Page loads with default collection ("All Saved")
4. Sidebar shows all collections with counts
5. Main area shows saved papers in grid/list
6. User can:
   - Filter by collection (sidebar click)
   - Search within saved papers
   - Sort by date saved, year, title
   - Edit notes inline
   - Move to different collection
   - Unsave (with confirmation)
```

### Flow 4: Create Collection

```
1. User clicks "Create Collection" button
2. Dialog opens with:
   - Name input (required)
   - Description textarea
   - Color picker (preset colors)
   - Icon picker (preset icons)
3. User fills form, clicks "Create"
4. Collection appears in sidebar
5. User can now save papers to this collection
```

### Flow 5: Edit Note

```
1. User views saved paper card
2. User clicks "Edit note" or clicks on note area
3. Inline textarea appears
4. User types note, clicks "Save" or presses Cmd+Enter
5. Note saves, displays below paper title
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Paper deleted from catalog | Show "Paper no longer available" badge, offer to remove |
| Collection deleted | Papers move to "Uncategorized" |
| Auth expired | Prompt re-login, preserve save action intent |
| Network error | Show toast, retry button, rollback optimistic update |
| Duplicate save attempt | Silently ignore or show "Already saved" toast |
| Save to deleted collection | API returns 404, UI refreshes collections |

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Database schema and migrations
2. API endpoints (CRUD)
3. Hooks (useSavedPapers, useCollections, useSaveStatus)

### Phase 2: UI Components
4. SaveButton component
5. CollectionPicker component
6. Update CatalogCard
7. Update chat source citations

### Phase 3: Saved Papers Page
8. SavedPapersPage layout
9. CollectionList sidebar
10. SavedPaperCard component
11. Note editing functionality

### Phase 4: Polish
12. Error handling and edge cases
13. Loading states and skeletons
14. Empty states
15. Toast notifications

---

## Files to Create/Modify

### New Files
```
src/
├── db/schema/saved-papers.ts
├── hooks/
│   ├── use-saved-papers.ts
│   ├── use-collections.ts
│   └── use-save-status.ts
├── app/
│   ├── saved/
│   │   └── page.tsx
│   └── api/
│       ├── saved-papers/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── status/route.ts
│       └── collections/
│           ├── route.ts
│           └── [id]/route.ts
├── components/
│   ├── save-button.tsx
│   ├── collection-picker.tsx
│   ├── saved-paper-card.tsx
│   └── collection-list.tsx
```

### Modified Files
```
src/
├── db/schema/index.ts (export saved-papers)
├── components/catalog-card.tsx (add SaveButton)
├── components/chat/message-sources.tsx (add SaveButton)
├── components/app-sidebar.tsx (uncomment Saved Papers nav item)
```

---

## Testing Checklist

- [x] Save paper from browse page (authenticated)
- [x] Save paper shows login prompt (unauthenticated)
- [x] Save paper from chat citation
- [x] Create new collection
- [x] Edit collection name/color/icon
- [x] Delete collection (papers move to uncategorized)
- [x] Edit note on saved paper
- [x] Move paper to different collection
- [ ] Unsave paper
- [x] Search within saved papers
- [x] Filter by collection
- [ ] Sort saved papers
- [x] Optimistic update on save (instant UI)
- [ ] Rollback on API error
- [ ] Handle paper deleted from catalog

---

## Future Considerations

These are **not** in scope for this implementation but noted for future phases:

- **Sharing**: Share collection via link
- **Collaboration**: Multiple users on same collection
- **Export**: Export saved papers as bibliography
- **AI Integration**: AI-suggested collections based on paper topics
- **Tags**: Tag system alongside collections
- **Advanced Notes**: Threaded notes with timestamps
