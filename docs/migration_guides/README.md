# Migration & Adoption Guides

## 📚 Overview

This directory contains guides for adopting new features in BalanceBookJS. 

**Important**: All migrations are **OPTIONAL**. BalanceBookJS maintains backward compatibility, so existing code continues to work without changes. These guides are for developers who want to adopt new features for their benefits.

## 📋 Available Guides

| Feature | Guide | Status | Benefits |
|---------|-------|--------|----------|
| Money Value Object | [002_MONEY_OBJECTS_ADOPTION_GUIDES.md](./002_MONEY_OBJECTS_ADOPTION_GUIDES.md) | ✅ Complete | Precise calculations, multi-currency support, no floating-point errors |

## 🎯 Guide Naming Convention

Guides follow this naming pattern:
```
XXX_FEATURE_NAME_ADOPTION_GUIDES.md
```

Where:
- `XXX` = The improvement number from `/docs/ai-context/improvements/`
- `FEATURE_NAME` = Descriptive name in UPPER_SNAKE_CASE

## 📝 Guide Structure

Each adoption guide should include:

1. **Clarification** that it's NOT a breaking change
2. **Decision criteria** - When to adopt vs. when to keep existing code
3. **Adoption strategies** - Multiple approaches for gradual adoption
4. **Migration patterns** - Code examples and patterns
5. **Common pitfalls** - What to avoid
6. **Resources** - Links to documentation and examples

## 🚀 Philosophy

Our migration philosophy:
- **No forced migrations** - Backward compatibility is sacred
- **Gradual adoption** - Adopt features at your own pace
- **Mix and match** - Old and new code can coexist
- **Clear benefits** - Only adopt if it solves your problems
- **Easy rollback** - You can always go back to the old way

## 🔄 Creating New Guides

When adding a new optional feature:

1. Create the guide in this directory
2. Follow the naming convention
3. Use [002_MONEY_OBJECTS_ADOPTION_GUIDES.md](./002_MONEY_OBJECTS_ADOPTION_GUIDES.md) as a template
4. Update this README.md with the new guide
5. Emphasize that adoption is OPTIONAL

## 📚 Related Documentation

- [Project README](../../README.md) - Main project documentation
- [AI Context Docs](../ai-context/) - Technical implementation details
- [Improvements](../ai-context/improvements/) - Feature specifications
- [Contributing](../../CONTRIBUTING.md) - How to contribute
