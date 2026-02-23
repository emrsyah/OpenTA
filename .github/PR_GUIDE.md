# Pull Request Guide

## Quick Reference: PR Title Format

```
[type]: [brief description]

Examples:
- feat(chat): add citation support with inline references
- fix(auth): resolve session expiration issue
- refactor(db): migrate from Prisma to Drizzle ORM
- style(ui): improve button hover states
- docs(readme): update installation instructions
- chore(deps): upgrade Next.js to v16
- perf(chat): optimize message rendering
- test(auth): add unit tests for OAuth flow
```

## Type Labels

| Type | Icon | Description |
|------|------|-------------|
| `feat` | 🎉 Feature | New feature |
| `fix` | 🐛 Bug Fix | Bug fix |
| `refactor` | 🧹 Refactor | Code refactoring |
| `style` | 🎨 Style | UI/styling changes |
| `docs` | 📚 Docs | Documentation only |
| `chore` | 🔧 Chore | Build/config changes |
| `perf` | 🚀 Performance | Performance improvements |
| `test` | ✅ Test | Test additions/changes |

## Best Practices

### 1. Keep Summaries Concise
- ✅ Good: "Add Google SSO authentication"
- ❌ Bad: "I added the ability for users to sign in with Google which was really hard..."

### 2. Group Related Changes
- Make one PR for one feature/fix
- If changes are unrelated, split into multiple PRs

### 3. Provide Context
- Explain WHY, not just WHAT
- Link to related issues/docs
- Add screenshots for UI changes

### 4. Keep PRs Small
- Aim for < 500 lines changed
- Easier to review, less risky to merge
- Large refactorings should be broken into steps

### 5. Test Before PR
- Run linter: `bun lint`
- Build: `bun build`
- Test manually if needed

## Example Good PR

### Title
```
feat(chat): add citation support with inline references
```

### Summary
```
Adds citation functionality to chat messages, allowing users to hover over
citations to see source details. This addresses user feedback requesting
better source attribution in AI responses.
```

### Changes
- ✅ Citation hover cards with source metadata
- ✅ Inline citation markers in messages
- ✅ Link to original paper source
