# ibira.js

> Biblioteca JavaScript pública com código para operações básicas como fetch em APIs

**Version:** 0.1.0-alpha  
**Status:** 🚧 Early Development

---

## 📚 Documentation

For comprehensive documentation, guides, and resources, see **[INDEX.md](./INDEX.md)** - your complete guide to the repository.

## 🎯 Overview

**ibira.js** is a JavaScript library for fetching and caching API data with observer pattern support. It provides:

- 🔄 **Observer pattern** for reactive data updates
- 💾 **Built-in caching** mechanism
- 🎯 **Promise-based** async/await API
- 🛡️ **Comprehensive error handling**
- 🧩 **Low coupling and high cohesion** design

## 🚀 Quick Start

```javascript
import { IbiraAPIFetcher, IbiraAPIFetchManager } from './src/ibira.js';

// Simple usage with IbiraAPIFetcher
const fetcher = new IbiraAPIFetcher('https://api.example.com/data');
await fetcher.fetchData();
console.log(fetcher.data);

// Advanced usage with IbiraAPIFetchManager
const manager = new IbiraAPIFetchManager();
const data = await manager.fetch('https://api.example.com/data');
```

## 📖 Key Resources

- **[Complete Documentation Index](./INDEX.md)** - All guides and documentation
- **[JavaScript Best Practices](./.github/JAVASCRIPT_BEST_PRACTICES.md)** - Coding standards
- **[TDD Guide](./.github/TDD_GUIDE.md)** - Test-driven development
- **[Referential Transparency](./.github/REFERENTIAL_TRANSPARENCY.md)** - Pure functions guide

## 🤝 Contributing

Please read our comprehensive guides before contributing:

1. [JavaScript Best Practices](./.github/JAVASCRIPT_BEST_PRACTICES.md)
2. [TDD Guide](./.github/TDD_GUIDE.md)
3. [Code Review Guide](./.github/CODE_REVIEW_GUIDE.md)

See the full [Documentation Index](./INDEX.md) for all available resources.

## 📝 License

MIT License - Copyright (c) 2025 Marcelo Pereira Barbosa

## 🔗 Links

- **Repository:** https://github.com/mpbarbosa/ibira.js
- **Documentation Index:** [INDEX.md](./INDEX.md)
