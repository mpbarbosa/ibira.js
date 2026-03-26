# ibira.js Structure Diagram

Visual representation of the Node.js API pattern structure in ibira.js.

## Project Structure Tree

```text
ibira.js/
│
├── 📦 Package Root
│   ├── package.json                 # NPM configuration
│   ├── babel.config.mjs             # Babel transpilation
│   ├── README.md                    # Project overview
│   └── MIGRATION.md                 # Migration guide
│
├── 📂 src/                          # Source code (Node.js API Pattern)
│   │
│   ├── 🎯 index.js                  # Main entry point
│   │   └── Exports: IbiraAPIFetcher, IbiraAPIFetchManager,
│   │                DefaultCache, DefaultEventNotifier, VERSION
│   │
│   ├── 📂 core/                     # Core business logic
│   │   ├── IbiraAPIFetcher.js       # Main fetcher class
│   │   │   ├── Static Factory Methods (6)
│   │   │   ├── Cache Operations (5 private)
│   │   │   ├── Network Operations (4 private)
│   │   │   ├── Pure Operations (3)
│   │   │   ├── Side Effect Operations (2)
│   │   │   └── Observer Pattern (3)
│   │   │
│   │   └── IbiraAPIFetchManager.js  # Multi-fetcher coordinator
│   │       ├── Fetcher Management (2)
│   │       ├── Fetch Operations (2)
│   │       ├── Cache Management (7)
│   │       ├── Cleanup Operations (3)
│   │       ├── Configuration (4)
│   │       ├── Monitoring (3)
│   │       └── Observer Pattern (2)
│   │
│   ├── 📂 utils/                    # Utility classes
│   │   ├── DefaultCache.js          # LRU cache implementation
│   │   │   ├── Map-like interface (7 methods)
│   │   │   └── LRU eviction strategy
│   │   │
│   │   └── DefaultEventNotifier.js  # Observer pattern
│   │       ├── Observer management (4 methods)
│   │       └── Event broadcasting
│   │
│   ├── 📂 config/                   # Configuration
│   │   └── version.js               # Semantic versioning
│   │       └── VERSION object (0.4.16-alpha)
│   │
│   └── 📄 README.md                 # Source documentation
│
├── 📂 __tests__/                    # Test suite
│   └── IbiraAPIFetcher.test.js      # Unit tests (40+ tests)
│
└── 📂 docs/                         # Documentation
    ├── INDEX.md                     # Documentation index
    ├── NODE_API_PATTERN.md          # This comprehensive guide
    ├── ARCHITECTURE.md              # Architecture overview
    ├── IBIRA_API_FETCHER.md         # API reference
    ├── MIGRATION_GUIDE.md           # Migration guide
    ├── TEST_RESULTS.md              # Test coverage
    ├── STRUCTURE_DIAGRAM.md         # This file
    └── referential_transparency/    # FP documentation
        ├── REFERENTIAL_TRANSPARENCY.md
        ├── PURE_SOLUTION.md
        └── VERIFICATION_REPORT.md
```

## Module Dependency Graph

```text
┌─────────────────────────────────────────────────────────┐
│                     index.js                            │
│              (Public API Entry Point)                   │
│   Exports: All public classes and constants             │
└─────────────────┬───────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│    core/    │      │    utils/    │
│             │      │              │
│ • Fetcher   │◄─────┤ • Cache      │
│ • Manager   │      │ • Notifier   │
└──────┬──────┘      └──────────────┘
       │                     ▲
       │                     │
       └─────────────────────┘
                  │
                  ▼
          ┌──────────────┐
          │   config/    │
          │  • version   │
          └──────────────┘
```

## Class Relationship Diagram

```text
                    IbiraAPIFetchManager
                            │
                            │ manages
                            │
                            ▼
                    IbiraAPIFetcher
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         DefaultCache          DefaultEventNotifier
                │                       │
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    Application Code
                    (Your Implementation)
```

## Data Flow Diagram

### Fetch Request Flow

```text
User Request
     │
     ▼
┌─────────────────┐
│  fetch(url)     │ Entry point
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Cache     │ Cache lookup
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Hit│         │Miss
    │         │
    ▼         ▼
┌─────┐   ┌─────────────┐
│Return│   │Network Call │
│Cache │   └──────┬──────┘
└─────┘          │
                 ▼
           ┌────────────┐
           │ Parse JSON │
           └──────┬─────┘
                  │
                  ▼
           ┌────────────┐
           │Store Cache │
           └──────┬─────┘
                  │
                  ▼
           ┌────────────┐
           │Notify Obs. │
           └──────┬─────┘
                  │
                  ▼
           ┌────────────┐
           │Return Data │
           └────────────┘
```

### Pure Functional Flow

```text
fetchDataPure(cacheState, time, network)
     │
     ▼
┌─────────────────────┐
│ Compute Operations  │ Pure computation
│ No side effects     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Return Result:      │
│ • success           │
│ • data              │
│ • cacheOperations   │ Description of what
│ • events            │ should happen
│ • newCacheState     │
│ • meta              │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ _applySideEffects   │ Apply side effects
│ • Update cache      │
│ • Notify observers  │
└─────────────────────┘
```

## Layer Architecture

```text
┌──────────────────────────────────────────────────────┐
│                  Application Layer                    │
│              (User code using ibira.js)              │
└───────────────────────┬──────────────────────────────┘
                        │ imports from
                        ▼
┌──────────────────────────────────────────────────────┐
│                   Entry Layer (index.js)              │
│           Single point of entry for all exports       │
└───────────────────────┬──────────────────────────────┘
                        │ re-exports from
                        ▼
┌──────────────────────────────────────────────────────┐
│                   Core Layer (core/)                  │
│            Business logic and main classes            │
│  • IbiraAPIFetcher      • IbiraAPIFetchManager       │
└───────────────────────┬──────────────────────────────┘
                        │ uses
                        ▼
┌──────────────────────────────────────────────────────┐
│                  Utility Layer (utils/)               │
│              Reusable helpers and services            │
│  • DefaultCache         • DefaultEventNotifier       │
└───────────────────────┬──────────────────────────────┘
                        │ uses
                        ▼
┌──────────────────────────────────────────────────────┐
│              Configuration Layer (config/)            │
│                Constants and settings                 │
│                    • VERSION                          │
└──────────────────────────────────────────────────────┘
```

## File Size Distribution

```text
Core Classes (Large - 400-700 lines each)
│
├── IbiraAPIFetcher.js          ████████████████████ (700 lines)
└── IbiraAPIFetchManager.js     ███████████████      (480 lines)

Utilities (Small - 40-60 lines each)
│
├── DefaultCache.js             ████                 (60 lines)
└── DefaultEventNotifier.js     ███                  (50 lines)

Config (Tiny - 10-20 lines)
│
└── version.js                  ██                   (20 lines)

Entry Point (Small)
│
└── index.js                    ████                 (72 lines)

Total Source: ~1,382 lines (vs 1,261 lines in monolithic version)
```

## Import Pattern

```javascript
// Application Code
import {
  IbiraAPIFetcher,        // from core/IbiraAPIFetcher.js
  IbiraAPIFetchManager,   // from core/IbiraAPIFetchManager.js
  DefaultCache,           // from utils/DefaultCache.js
  DefaultEventNotifier,   // from utils/DefaultEventNotifier.js
  VERSION                 // from config/version.js
} from 'ibira.js';

// Internal Module Imports
// IbiraAPIFetcher.js imports:
import { DefaultCache } from '../utils/DefaultCache.js';
import { DefaultEventNotifier } from '../utils/DefaultEventNotifier.js';

// IbiraAPIFetchManager.js imports:
import { IbiraAPIFetcher } from './IbiraAPIFetcher.js';
```

## Design Pattern Map

```text
┌─────────────────────────────────────────────────┐
│         Design Patterns in ibira.js             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Factory Pattern                                │
│  └─ IbiraAPIFetcher static methods             │
│     • withDefaultCache()                        │
│     • withExternalCache()                       │
│     • pure()                                    │
│                                                 │
│  Dependency Injection                           │
│  └─ Constructor parameters                      │
│     • cache (required)                          │
│     • eventNotifier (optional)                  │
│                                                 │
│  Observer Pattern                               │
│  └─ DefaultEventNotifier                        │
│     • subscribe()                               │
│     • notify()                                  │
│                                                 │
│  Strategy Pattern                               │
│  └─ Interchangeable components                  │
│     • Cache implementations                     │
│     • Event notifiers                           │
│                                                 │
│  Pure Functional Core                           │
│  └─ Imperative Shell                            │
│     • fetchDataPure() - pure                    │
│     • fetchData() - with side effects           │
│                                                 │
│  Singleton-like (Manager)                       │
│  └─ IbiraAPIFetchManager                        │
│     • Coordinates multiple fetchers             │
│     • Shared global cache                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Test Coverage Map

```text
┌─────────────────────────────────────────────────┐
│            Test Coverage Distribution            │
├─────────────────────────────────────────────────┤
│                                                 │
│  IbiraAPIFetcher.test.js                        │
│  ├─ Immutability Tests         ████ (4 tests)  │
│  ├─ Dependency Injection       ███  (3 tests)  │
│  ├─ Pure Functions             ████████ (8)    │
│  ├─ Practical Methods          ████████ (8)    │
│  ├─ Static Factory Methods     █████ (5 tests) │
│  ├─ Cache Management           ███  (3 tests)  │
│  ├─ Error Handling             ████ (4 tests)  │
│  ├─ Observer Pattern           ████ (4 tests)  │
│  └─ Performance                ██   (2 tests)  │
│                                                 │
│  Total: 41 tests (40 passed, 1 skipped)        │
│  Coverage: 75%+ across all metrics              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Deployment View

```text
┌─────────────────────────────────────────────┐
│           NPM Package Structure              │
├─────────────────────────────────────────────┤
│                                             │
│  ibira.js/                                  │
│  ├── src/                                   │
│  │   ├── index.js        ◄─── main entry   │
│  │   ├── core/                             │
│  │   ├── utils/                            │
│  │   └── config/                           │
│  │                                          │
│  ├── package.json                           │
│  │   └── "main": "src/index.js"            │
│  │                                          │
│  ├── README.md                              │
│  ├── MIGRATION.md                           │
│  └── docs/                                  │
│                                             │
│  Published to NPM as: ibira.js              │
│  Import: import { ... } from 'ibira.js'     │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Version**: 1.0.0
**Last Updated**: December 15, 2025
**See Also**: [NODE_API_PATTERN.md](./NODE_API_PATTERN.md) for detailed documentation
