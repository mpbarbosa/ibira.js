# Migration Guide: Node.js API Pattern Structure

## Overview

The ibira.js project has been refactored to follow the Node.js API pattern folder structure. This provides better code organization, maintainability, and scalability.

## What Changed

### Before (Monolithic Structure)
```
src/
└── ibira.js  # Single file with all code (~1200 lines)
```

### After (Modular Structure)
```
src/
├── index.js                    # Main entry point
├── core/                       # Core business logic
│   ├── IbiraAPIFetcher.js
│   └── IbiraAPIFetchManager.js
├── utils/                      # Utility classes
│   ├── DefaultCache.js
│   └── DefaultEventNotifier.js
└── config/                     # Configuration
    └── version.js
```

## Breaking Changes

### ❌ None!

**The public API remains exactly the same.** All imports continue to work:

```javascript
// These imports work exactly as before
import { IbiraAPIFetcher, IbiraAPIFetchManager } from 'ibira.js';

// Additional exports are now available
import { DefaultCache, DefaultEventNotifier, VERSION } from 'ibira.js';
```

## For Contributors

### When adding new features:

1. **Core functionality**: Add to `src/core/`
2. **Utilities/Helpers**: Add to `src/utils/`
3. **Configuration**: Add to `src/config/`
4. **Always export**: Update `src/index.js` to export new public APIs

### File naming conventions:
- Use PascalCase for class files: `MyClass.js`
- Use camelCase for utility files: `myHelper.js`
- One primary export per file

## Benefits

✅ **Better Organization**: Related code grouped logically  
✅ **Easier Testing**: Isolated modules are easier to test  
✅ **Improved Maintainability**: Smaller files are easier to understand  
✅ **Better IDE Support**: Clearer module boundaries improve autocomplete  
✅ **Scalability**: Easy to add new features without bloating files  

## Testing

All existing tests pass without modification (except import path):

```bash
npm test          # Run all tests
npm run validate  # Validate syntax
npm run test:all  # Run validation + tests
```

## Questions?

If you have any questions about the new structure, please open an issue on GitHub.
