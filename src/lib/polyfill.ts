// Polyfill for process.getBuiltinModule needed by Mongoose 9 in Next.js 16 serverless runtime
/* eslint-disable @typescript-eslint/no-require-imports */

if (typeof process !== 'undefined' && !process.getBuiltinModule) {
  process.getBuiltinModule = function (name: string) {
    const builtinModules: Record<string, () => unknown> = {
      v8: () => {
        try { return require('v8'); } catch { return null; }
      },
      'node:v8': () => {
        try { return require('v8'); } catch { return null; }
      },
      dns: () => {
        try { return require('dns'); } catch { return null; }
      },
      'node:dns': () => {
        try { return require('dns'); } catch { return null; }
      },
    };

    const loader = builtinModules[name];
    if (loader) {
      try { return loader(); } catch { return null; }
    }

    try { return require(name); } catch { return null; }
  };
}
