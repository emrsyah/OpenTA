# Open TA Tel-U

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=flat-square&logo=postgresql)
![DSPy](https://img.shields.io/badge/DSPy-Framework-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**AI-Powered Co-Researcher for Telkom University**

An agent-native research workspace that helps you discover, analyze, and synthesize academic papers from Telkom University alumni.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Open TA Tel-U is an **AI-powered co-researcher** designed to accelerate academic research. Unlike traditional paper repositories, this is an **agent-native workspace** where AI agents actively help you:

- 🔍 **Discover** relevant papers from Telkom University's vast research database
- 🧠 **Synthesize** knowledge across multiple papers and sources
- 🔬 **Run deep research** tasks with autonomous agents that can perform multi-step investigations
- 📊 **Generate insights** through context engineering and agent harness patterns

Built with **DSPy** for declarative agent programming, the system uses **context engineering** to maintain research context and **agent harness** patterns to orchestrate complex research workflows.

### Vision

To create an AI research assistant that doesn't just retrieve papers, but **actively collaborates** in the research process—helping researchers find connections, synthesize knowledge, and accelerate discovery at Telkom University.

## ✨ Features

### 🚀 Current Features

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Research Assistant** | DSPy-powered agents for research queries | ✅ Implemented |
| **Paper Discovery** | Search Tel-U alumni papers with semantic search | ✅ Implemented |
| **Conversation Management** | Persistent research sessions with history | ✅ Implemented |
| **Source Citations** | Inline citations with paper metadata | ✅ Implemented |
| **JWT Backend Auth** | Secure auth for DSPy backend service | ✅ Implemented |

### 📋 Planned Features

- [ ] **Deep Research Agent** - Autonomous agents that run long-form research tasks
- [ ] **Experiment Simulation** - Agents that can propose and validate hypotheses
- [ ] **Literature Review Agent** - Automated systematic reviews
- [ ] **Ideas Exploration** - Agents that can explore ideas and concepts
- [ ] **Citation Network Analysis** - Visualize paper relationships
- [ ] **Multi-Agent Collaboration** - Specialized agents working together
- [ ] **Research Task Queuing** - Schedule and track long-running research
- [ ] **Export Research Reports** - Generate comprehensive research summaries

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Pages      │  │  Components  │  │   Hooks & Utils     │  │
│  │  (App Router)│  │   (UI + Chat)│  │  (State Management) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
            ┌───────▼────────┐  ┌───▼────────────┐
            │  API Routes    │  │ better-auth    │
            │  (Next.js)     │  │   Sessions     │
            └───────┬────────┘  └────────────────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
┌───────▼─────┐ ┌──▼──────────┐ └───┐
│   PostgreSQL │ │  DSPy       │     │
│   Database   │ │  Backend    │     │
│  (Drizzle)   │ │  (FastAPI)  │     │
│              │ │  + Agents   │     │
└──────────────┘ └─────────────┘     │
      │                                │
      └────────────────────────────────┘
           Context + Research Flow
```

### Agent Architecture

#### Research Agent Flow

1. **User Query** → Research question or task
2. **Context Engineering** → Gather relevant papers, history, and domain knowledge
3. **Agent Harness** → Route to appropriate DSPy agent (search, synthesize, analyze)
4. **DSPy Execution** → Agent runs reasoning chain with tools
5. **Response Generation** → Structured research output with citations

```
┌─────────────┐     Research Task    ┌──────────────────┐
│   User      │────────────────────▶│ Agent Harness    │
└─────────────┘                     │ (Orchestrator)   │
                                     └────────┬─────────┘
                                              │
                               ┌──────────────┼──────────────┐
                               │              │              │
                        ┌──────▼─────┐ ┌────▼─────┐ ┌────▼────────┐
                        │  Search    │ │ Analyze  │ │  Synthesize │
                        │  Agent     │ │  Agent   │ │   Agent     │
                        └──────┬─────┘ └────┬─────┘ └────┬────────┘
                               │            │            │
                               └────────────┼────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │  Context Engineering   │
                               │  (Paper DB + History)   │
                               └────────────────────────┘
```

### DSPy Agent System

**Search Agent**: Find relevant papers using semantic search  
**Analysis Agent**: Extract key insights, methodologies, findings  
**Synthesis Agent**: Combine multiple papers into coherent answer  
**Deep Research Agent** (Planned): Run multi-step investigations with subtasks

### Tech Stack

#### Frontend (Next.js)
- **Framework**: [Next.js 16.1.6](https://nextjs.org/) (App Router, React Server Components)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + shadcn
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Streamdown**: [Streamdown](https://streamdown.dev/) (code, math, mermaid, CJK support)

#### Backend (DSPy Agents)
- **Agent Framework**: [DSPy](https://github.com/stanfordnlp/dspy) (Declarative agent programming)
- **FastAPI**: REST API for agent endpoints
- **Principle - Agent Harness** : [Agent Harness](https://www.philschmid.de/agent-harness-2026)

#### Database & ORM
- **Database**: [PostgreSQL](https://www.postgresql.org/) with vector search
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Migrations**: [Drizzle Kit](https://kit.drizzle.team/)
- **Vector Embeddings**: pgvector for semantic search with [Voyage AI](https://voyageai.com/)

#### Authentication
- **Auth Library**: [better-auth 1.4.18](https://www.better-auth.com/)
- **OAuth**: Google SSO
- **Session Management**: JWT-based stateless sessions
- **Backend Security**: JWT token validation for DSPy service

#### Development Tools
- **Package Manager**: [Bun](https://bun.sh/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Type Checking**: TypeScript 5

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- [Node.js 20+](https://nodejs.org/) or [Bun](https://bun.sh/)
- [PostgreSQL 14+](https://www.postgresql.org/download/) with pgvector
- [Python 3.10+](https://www.python.org/downloads/) (for DSPy backend)
- Google Cloud Project (for OAuth)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/open-ta-telyu.git
cd open-ta-telyu
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure your environment variables:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/openta

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-chars-long
BETTER_AUTH_URL=http://localhost:3000

# Backend API Shared Secret (for DSPy service)
BACKEND_API_SECRET=your-backend-api-secret-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate secrets with:
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Push database schema
bun run db:push

# (Optional) Open Drizzle Studio to inspect database
bun run db:studio
```

### 5. Run Development Server

```bash
# Frontend
bun run dev

# Backend (separate repository)
cd open-ta-backend
python -m uvicorn main:app --reload
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
open-ta-telyu/ (Frontend)
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (research interface)
│   │   ├── browse/            # Paper browse page
│   │   ├── [id]/              # Research session page
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # better-auth endpoints
│   │   │   ├── chat/          # Proxy to DSPy backend
│   │   │   ├── conversations/ # Session CRUD
│   │   │   └── catalog/       # Paper search
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── chat/              # Chat/research components
│   │   ├── browse/            # Browse page components
│   │   ├── auth/              # Authentication components
│   │   └── ai-elements/       # AI response elements
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   │   ├── auth/              # Auth utilities (JWT generation)
│   │   └── db/                # Database functions
│   └── db/                    # Database schema
│       ├── schema/            # Drizzle schema definitions
│       └── migrations/        # SQL migrations
├── public/                    # Static assets
├── scripts/                   # Utility scripts
├── drizzle.config.ts          # Drizzle ORM config
├── biome.json                 # Biome linter config
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies

open-ta-backend/ (DSPy Agents - Separate Repo)
├── agents/                    # DSPy agent definitions
├── context/                   # Context engineering modules
├── harness/                   # Agent orchestration patterns
├── tools/                     # Agent tools (search, retrieve, etc.)
└── main.py                    # FastAPI application
```

## 🔌 API Endpoints

### Authentication (better-auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/google` | GET | Initiate Google OAuth |
| `/api/auth/sign-out` | POST | Sign out user |
| `/api/auth/session` | GET | Get current session |

### Research Sessions (Conversations)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/conversations` | GET | List user research sessions | ✅ |
| `/api/conversations` | POST | Create new research session | ✅ |
| `/api/conversations/[id]` | DELETE | Delete research session | ✅ |
| `/api/conversations/[id]/messages` | GET | Get session history | ✅ |

### Research (DSPy Backend)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/chat` | POST | Stream agent research response | ✅ |

### Paper Catalog

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/catalog` | POST | Search research papers | ❌ |

## 🔒 Authentication & Agent Security

### Session Flow

1. **User Sign-In**: Redirects to Google OAuth
2. **Session Creation**: better-auth creates session in database
3. **JWT Generation**: Frontend generates short-lived JWT for DSPy backend
4. **Agent Verification**: DSPy service validates JWT signature
5. **Request Processing**: User ID extracted from verified JWT

```
┌─────────────┐     OAuth      ┌──────────────┐
│   User      │───────────────▶│  Google OAuth │
└─────────────┘                 └──────┬───────┘
                                      │
                                      │ callback
                                      ▼
                               ┌──────────────┐
                               │  better-auth │
                               │   Session    │
                               └──────┬───────┘
                                      │
                                      │ JWT Generation
                                      ▼
┌─────────────┐   Bearer JWT   ┌──────────────┐
│   Next.js   │───────────────▶│ DSPy Backend  │
│  Frontend   │                │  (Verified)   │
└─────────────┘                └───────────────┘
```

## 🗄️ Database Schema

### Core Tables

**conversations** (Research Sessions)
```sql
- id: varchar(128) PK (nanoid)
- user_id: text FK → user.id
- title: text
- is_incognito: boolean
- research_context: jsonb  -- Agent context state
- created_at: timestamp
- updated_at: timestamp
```

**messages** (Research Interactions)
```sql
- id: serial PK
- conversation_id: varchar(128) FK → conversations.id
- question: text
- answer: text
- sources: jsonb  -- Paper citations and references
- agent_reasoning: jsonb  -- DSPy trace (optional)
- search_query: text
- created_at: timestamp
```

**catalog** (Tel-U Research Papers)
```sql
- id: serial PK
- title: text
- catalog_number: varchar(100)
- catalog_type: enum
- author: text
- abstract: text
- embedding: vector(1024)  -- For semantic search
- publication_year: smallint
```

## 🚢 Deployment

### Environment Variables (Production)

```bash
# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com

# Production Database (Supabase/Neon/Railway with pgvector)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth (Use strong secrets in production!)
BETTER_AUTH_SECRET=production-secret-min-32-chars
BETTER_AUTH_URL=https://your-domain.com
BACKEND_API_SECRET=backend-api-secret-min-32-chars

# Google OAuth (Production)
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-client-secret
```

### Deployment Platforms

#### Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
bun install -g vercel

# Deploy
vercel --prod
```

**Environment Variables**: Set in Vercel Dashboard → Settings → Environment Variables

#### Docker Deployment

```dockerfile
# Dockerfile (example)
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

```bash
docker build -t open-ta-telyu .
docker run -p 3000:3000 --env-file .env open-ta-telyu
```

### Database Migration

```bash
# Run migrations on production
bun run db:push

# Or use Drizzle migrate
bun run db:migrate
```

## 🧪 Testing

```bash
# Run linter
bun run lint

# Format code
bun run format

# Type check (if using tsc)
tsc --noEmit
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/open-ta-telyu.git`
3. **Create** a branch: `git checkout -b feature/your-feature-name`
4. **Make** your changes
5. **Test** thoroughly
6. **Commit**: `git commit -m "feat: add your feature"`
7. **Push**: `git push origin feature/your-feature-name`
8. **Open** a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- Use **Biome** for linting and formatting
- Follow **TypeScript** best practices
- Write **meaningful** commit messages
- Add **comments** for complex logic
- Update **documentation** for new features

### Pull Request Guidelines

- Describe **what** you changed and **why**
- Link to **related issues**
- Ensure all **checks pass**
- Request **review** from maintainers
- Keep PRs **focused** and **atomic**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Inspiration**: DSPy framework, Agent research patterns
- **Libraries**: [Next.js](https://nextjs.org/), [better-auth](https://www.better-auth.com/), [DSPy](https://github.com/stanfordnlp/dspy), [Drizzle ORM](https://orm.drizzle.team/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Research**: Telkom University academic community

## 🔗 Related Repositories

- **[open-ta-backend](https://github.com/yourusername/open-ta-telyu-dspy)** - DSPy agent implementation
- **[context-engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)** - Context management system
- **[agent-harness](https://www.philschmid.de/agent-harness-2026)** - Agent orchestration patterns

## 📧 Contact

- **Project Maintainer**: [Emirsyah](mailto:muhammademir48@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/open-ta-telyu/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/open-ta-telyu/discussions)

---

<div align="center">

**Built with ❤️ for the Telkom University academic community**

**Accelerating research through AI collaboration**

[⬆ Back to Top](#open-ta-telu)

</div>
