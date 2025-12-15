# ibira.js Source Code Structure

This directory contains the source code for ibira.js, organized following the Node.js API pattern.

## Directory Structure

```
src/
├── index.js                  # Main entry point - exports public API
├── core/                     # Core business logic
│   ├── IbiraAPIFetcher.js    # Main fetcher class with caching
│   └── IbiraAPIFetchManager.js # Manager for multiple fetchers
├── utils/                    # Utility classes and helpers
│   ├── DefaultCache.js       # Default cache implementation
│   └── DefaultEventNotifier.js # Event notification system
└── config/                   # Configuration
    └── version.js            # Version information
```

## Module Organization

### Core (`/core`)
Contains the main business logic and core classes:
- **IbiraAPIFetcher**: The primary class for fetching and caching API data
- **IbiraAPIFetchManager**: Coordinates multiple fetchers and handles race conditions

### Utils (`/utils`)
Helper classes and utility functions:
- **DefaultCache**: Map-based cache with LRU eviction and expiration
- **DefaultEventNotifier**: Observer pattern implementation for event handling

### Config (`/config`)
Configuration and constants:
- **version**: Semantic versioning information

## Import Examples

```javascript
// Import main classes
import { IbiraAPIFetcher, IbiraAPIFetchManager } from 'ibira.js';

// Import utilities if needed
import { DefaultCache, DefaultEventNotifier } from 'ibira.js';

// Import version info
import { VERSION } from 'ibira.js';
```

## Design Principles

1. **Modular**: Each file has a single responsibility
2. **Testable**: Pure functions and dependency injection enable easy testing
3. **Maintainable**: Clear separation of concerns
4. **Scalable**: Easy to add new features in appropriate directories

## Adding New Features

- **New core functionality**: Add to `/core`
- **New utilities**: Add to `/utils`
- **New configuration**: Add to `/config`
- **Export public API**: Update `index.js`
