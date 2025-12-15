// ibira.js - Main entry point
// A JavaScript library for fetching and caching API data with observer pattern support.
// JSON response handling and robust error management.
// Version: 0.1.0-alpha
// Repository: https://github.com/mpbarbosa/ibira.js
// Copyright (c) 2025 Marcelo Pereira Barbosa
// Author: Marcelo Pereira Barbosa
// License: MIT

export { IbiraAPIFetcher } from './core/IbiraAPIFetcher.js';
export { IbiraAPIFetchManager } from './core/IbiraAPIFetchManager.js';
export { DefaultCache } from './utils/DefaultCache.js';
export { DefaultEventNotifier } from './utils/DefaultEventNotifier.js';
export { VERSION } from './config/version.js';
