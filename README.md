# DevLens AI

> Understand complex codebases, architecture, and documentation before writing a single line of code.

## Problem

Modern software projects are becoming increasingly complex. Developers often spend days or even weeks understanding an unfamiliar repository before they can contribute effectively.

Some common challenges include:

- Understanding project architecture
- Navigating large codebases
- Identifying dependencies and module relationships
- Reading outdated or incomplete documentation
- Understanding business logic before implementing features

While existing AI tools can explain code snippets, they rarely provide a complete understanding of an entire repository.

## Solution

DevLens AI is an AI-powered codebase intelligence platform that helps developers quickly understand unfamiliar repositories.

By analyzing project structure, source code, and documentation, DevLens AI generates meaningful insights that help developers understand how a project works before making changes.

The goal is simple:

> Spend less time understanding codebases and more time building features.

---

## Features

### Repository Analysis

- Analyze repository structure
- Understand project architecture
- Explore modules and dependencies
- Review folder organization

### AI-Powered Insights

- Architecture explanations
- Component breakdowns
- Business logic understanding
- Codebase summaries

### Documentation Assistance

- Generate repository documentation
- Improve developer onboarding
- Explain project workflows
- Create developer-friendly summaries

### Developer Experience

- Clean and responsive interface
- Fast repository processing
- Secure authentication
- Modern user experience

---

## Use Cases

### New Developers

Understand unfamiliar repositories quickly and reduce onboarding time.

### Students

Learn how real-world projects are structured and organized.

### Freelancers

Analyze client codebases before implementing new features.

### Development Teams

Improve knowledge sharing and reduce dependency on senior developers.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Routes
- OpenRouter API

### Database

- PostgreSQL
- Drizzle ORM

### Authentication

- Clerk

### Deployment

- Vercel

---

## Architecture

```text
User
 │
 ▼
DevLens AI
 │
 ├── Authentication (Clerk)
 │
 ├── Repository Processing
 │
 ├── AI Analysis Engine
 │     ├── Architecture Analysis
 │     ├── Code Understanding
 │     ├── Documentation Insights
 │     └── Repository Summary
 │
 ├── Database (PostgreSQL)
 │
 └── Dashboard UI
```

---

## Core Workflow

### 1. Connect Repository

Users provide a repository for analysis.

### 2. Process Project Structure

DevLens AI analyzes project files, folders, and code structure.

### 3. Generate Insights

The AI engine generates:

- Architecture overview
- Component explanations
- Codebase summaries
- Documentation insights

### 4. Explore Results

Developers review insights through a simple dashboard.

---

## Project Goals

### Current Goal

Help developers understand codebases faster.

### Long-Term Vision

Become the developer's first step before contributing to any unfamiliar project.

Future capabilities may include:

- Dependency visualization
- Code smell detection
- Refactoring suggestions
- Architecture diagrams
- Security analysis
- VS Code integration

---

## Why DevLens AI?

Most developers spend significant time understanding existing code before writing new code.

DevLens AI helps reduce that friction by transforming repositories into understandable insights.

Instead of asking:

> "Where do I start?"

Developers can focus on:

> "What should I build next?"

---

## Local Development

### Clone Repository

```bash
git clone https://github.com/your-username/devlens-ai.git
cd devlens-ai
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```env
DATABASE_URL=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FALLBACK_MODEL=google/gemma-4-31b-it:free
```

### Run Development Server

```bash
npm run dev
```

---

## Deployment

The application is deployed on Vercel.

```bash
vercel deploy
```

---

## Status

### Phase 1 — MVP ✅

Completed:

- Authentication
- Repository Analysis
- Architecture Insights
- Documentation Assistance
- Responsive UI
- Database Integration
- Vercel Deployment

### Phase 2 — Planned

- Dependency Graphs
- Code Smell Detection
- Refactoring Suggestions
- Architecture Visualization
- Saved Analysis History

---

## Author

**Ausaf Elahi**

Software Engineering Student | Full Stack Developer

GitHub: https://github.com/ausafelahi

---

## License

MIT License
