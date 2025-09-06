# AI Context Documentation for BalanceBookJS

## 📋 Purpose
This directory contains structured documentation designed to provide consistent context to AI assistants working on the BalanceBookJS project. Each document is written as both human-readable documentation and AI-optimized prompts.

## 🎯 How to Use This Documentation

### For AI Assistants:
1. **Always start by reading**: `00-project-context.md`
2. **Then read**: `01-architecture-overview.md`
3. **For specific tasks**: Navigate to the relevant improvement file in `/improvements/`
4. **Check completed work**: Review `/completed/` for already implemented features

### For Developers:
When starting a new chat session with an AI assistant, provide this initial prompt:
```
I'm working on the BalanceBookJS project located at [path].
Please read the following files in order:
1. /docs/ai-context/00-project-context.md
2. /docs/ai-context/01-architecture-overview.md
Then, I want to work on [specific improvement file].
```

## 📁 Directory Structure

### Core Documentation
- `00-project-context.md` - Essential project information and setup instructions
- `01-architecture-overview.md` - Current architecture, patterns, and conventions

### Improvements Directory (`/improvements/`)
Each improvement file follows the naming pattern: `XXX-feature-name.md`
- Numbers indicate suggested implementation order (can be adjusted)
- Each file is self-contained with all necessary context
- Files include success criteria and testing requirements

### Completed Directory (`/completed/`)
- Moved here after successful implementation
- Maintains implementation notes and lessons learned
- Reference for future similar implementations

## 📝 Creating New Improvement Documents
Use `improvements/_template.md` as a starting point for new feature requests.

## 🔄 Workflow
1. Create improvement document
2. Implement feature with AI assistance
3. Create PR following CONTRIBUTING.md conventions
4. After merge, move document to `/completed/` with implementation notes

## 🏷️ Improvement Categories

- **Architecture** (001-099): Core architectural changes
- **Features** (100-199): New functionality
- **Integrations** (200-299): External integrations
- **Performance** (300-399): Optimizations
- **Security** (400-499): Security enhancements
- **Testing** (500-599): Testing improvements
- **Documentation** (600-699): Documentation updates

## 📊 Current Status

### Priority Queue
1. TypeScript Migration (001)
2. Money Value Object (002)
3. General Ledger (003)
4. Financial Reports (004)
5. Multi-Currency Support (005)

### In Progress
- None

### Completed
- None (new documentation system)
