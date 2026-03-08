# OpenTA Feature Roadmap

> Last updated: March 8, 2026

## Overview

This roadmap outlines planned features for OpenTA - an AI-powered research assistant for Telkom University. Features are organized by phase, prioritizing user experience gaps and high-impact improvements.

---

## Current State

### ✅ Implemented Features

| Feature | Status | Location |
|---------|--------|----------|
| AI Chat Interface | Complete | `/` and `/[id]` pages |
| Browse Papers | Complete | `/browse` - Grid/list view, filters, pagination |
| Cari Dosen | Complete | `/cari-dosen` - Keyword + semantic search |
| Google SSO Auth | Complete | Better Auth integration |
| Conversation Management | Complete | Sidebar with recent chats, delete, history |
| Source Citations | Complete | Inline citations with hover cards |
| Filter Panel | Complete | Catalog type, year range, author, electronic access |
| Feedback Widget | Complete | Dialog component with DB storage |
| Streaming Responses | Complete | SSE with thinking tokens, step progress |
| Lecturer Web Enrichment | Complete | Exa AI integration for profiles |

### 🔒 Scaffolded (Ready to Activate)

```typescript
// From app-sidebar.tsx
{ title: "Workspace", url: "/workspace", icon: Folder }
{ title: "Saved Papers", url: "/saved", icon: Bookmark }
```

---

## Phase 1: User Experience Gaps

> **Goal**: Fill missing functionality gaps with high-impact, low-effort features

### 1.1 🔖 Saved Papers System

**Status**: ✅ Implemented (March 8, 2026 - See `docs/plans/2026-03-08-saved-papers-design.md`)

**Description**: Enable users to bookmark and organize papers for later reference.

**Scope**:
- Bookmark button on paper cards
- `/saved` page with saved papers list
- Collections/folders for organization
- Quick actions (remove, move to collection)
- Filter and search within saved papers

**Dependencies**: None (scaffolded in sidebar)

**Estimated Effort**: Medium

---

### 1.2 📝 Research Workspace

**Status**: 📋 Planned

**Description**: Personal space for managing research notes and connections.

**Scope**:
- Create personal notes on papers
- Link notes to conversations
- Rich text editor for notes
- Export notes as markdown
- Tag and categorize notes

**Dependencies**: Saved Papers System

**Estimated Effort**: Medium-High

---

### 1.3 🔍 Conversation Search

**Status**: 📋 Planned

**Description**: Search across past conversations to find relevant research.

**Scope**:
- Search input in sidebar
- Full-text search across messages
- Filter by date range
- Filter by topic/sources used
- Quick jump to conversation

**Dependencies**: None

**Estimated Effort**: Medium

---

## Phase 2: Research Workflow Enhancements

> **Goal**: Add tools that enhance the research process

### 2.1 📊 Citation Network Visualization

**Status**: 📋 Planned

**Description**: Visual representation of paper relationships and citations.

**Scope**:
- Interactive graph visualization
- Show citation relationships
- Identify research clusters
- Mermaid diagrams integration
- Click nodes to view papers

**Dependencies**: None

**Estimated Effort**: High

---

### 2.2 📤 Export Capabilities

**Status**: 📋 Planned

**Description**: Export research conversations and summaries in various formats.

**Scope**:
- Export conversation as PDF
- Export conversation as Markdown
- Generate research summaries
- Bibliography export (BibTeX, APA, MLA)
- Share conversation links

**Dependencies**: None

**Estimated Effort**: Medium

---

### 2.3 🎯 Paper Comparison Tool

**Status**: 📋 Planned

**Description**: Compare multiple papers side-by-side with AI assistance.

**Scope**:
- Select 2-3 papers from browse
- AI-generated comparison table
- Highlight methodology differences
- Side-by-side abstract analysis
- Key findings comparison

**Dependencies**: None

**Estimated Effort**: Medium-High

---

## Phase 3: Advanced Agent Features

> **Goal**: Leverage DSPy backend for autonomous research capabilities

### 3.1 🤖 Deep Research Agent

**Status**: 📋 Planned (Backend)

**Description**: Autonomous multi-step research with background processing.

**Scope**:
- Multi-step autonomous research
- Background task queue
- Email notification on completion
- Progress dashboard
- Intermediate results preview

**Dependencies**: DSPy backend enhancements

**Estimated Effort**: Very High

---

### 3.2 📚 Literature Review Generator

**Status**: 📋 Planned (Backend)

**Description**: AI-generated structured literature reviews.

**Scope**:
- Upload paper list or topic
- AI generates structured review
- Automatic categorization
- Gap analysis
- Export in academic formats

**Dependencies**: DSPy backend enhancements

**Estimated Effort**: Very High

---

### 3.3 💡 Research Ideas Explorer

**Status**: 📋 Planned (Backend)

**Description**: AI-powered research topic suggestions.

**Scope**:
- Based on reading history
- Suggest related topics
- Identify unexplored areas
- Connect with relevant lecturers
- Trending topics in field

**Dependencies**: DSPy backend enhancements, User activity tracking

**Estimated Effort**: High

---

## Phase 4: Collaboration & Social

> **Goal**: Enable teamwork and knowledge sharing

### 4.1 👥 Collaborative Research

**Status**: 📋 Planned

**Description**: Share and collaborate on research with team members.

**Scope**:
- Share conversations with team
- Comment on shared research
- Team workspaces
- Activity feeds
- Permission management

**Dependencies**: User roles system, Team management

**Estimated Effort**: Very High

---

### 4.2 🔗 Public Research Profiles

**Status**: 📋 Planned

**Description**: Public profiles showcasing research interests and activity.

**Scope**:
- Public profile page
- Research interests
- Published papers
- Collaboration requests
- Follow researchers

**Dependencies**: Collaboration features

**Estimated Effort**: High

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Saved Papers System | High | Medium | **P0** |
| Conversation Search | Medium | Medium | **P1** |
| Export Capabilities | High | Medium | **P1** |
| Research Workspace | High | Medium-High | **P2** |
| Paper Comparison | Medium | Medium-High | **P2** |
| Citation Network | High | High | **P3** |
| Deep Research Agent | Very High | Very High | **P3** |

---

## Technical Considerations

### Database Schema Additions

For **Saved Papers**:
```sql
CREATE TABLE saved_papers (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  catalog_id INTEGER REFERENCES catalog(id) ON DELETE CASCADE,
  collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, catalog_id)
);

CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints Needed

For **Saved Papers**:
- `GET /api/saved-papers` - List saved papers
- `POST /api/saved-papers` - Save a paper
- `DELETE /api/saved-papers/[id]` - Unsave paper
- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `PATCH /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

---

## Contributing

When picking up a feature from this roadmap:

1. Create a feature branch: `feature/saved-papers`
2. Create a design doc: `docs/plans/YYYY-MM-DD-saved-papers-design.md`
3. Break down into tasks in GitHub Issues
4. Submit PR with reference to roadmap section

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-08 | Initial roadmap creation |
