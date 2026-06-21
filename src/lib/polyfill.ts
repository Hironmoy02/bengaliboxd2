import * as v8 from 'v8';

if (typeof process !== 'undefined' && !process.getBuiltinModule) {
  process.getBuiltinModule = function (name: string) {
    if (name === 'v8' || name === 'node:v8') {
      return v8;
    }
    try {
      return require(name);
    } catch {
      return null;
    }
  };
}
