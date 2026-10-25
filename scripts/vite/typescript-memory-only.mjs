// CodeAtlas only parses supplied source strings. Workers expose a partial Node
// process object, which TypeScript mistakes for a full filesystem-backed host.
// Disable that host detection only inside the pinned TypeScript application bundle.
// Do not change process or Node globals for the rest of the application.
export function memoryOnlyTypescript(source) {
  const detector = /function isNodeLikeSystem\(\)\s*\{\s*return typeof process !== "undefined" && !!process\.nextTick && !process\.browser && typeof require !== "undefined";\s*\}/;
  if (!detector.test(source)) throw new Error('TypeScript host detection changed; review the memory-only parser adapter before upgrading.');
  return source.replace(detector, 'function isNodeLikeSystem() { return false; }');
}
export function typescriptMemoryOnly() {
  return { name: 'codeatlas-typescript-memory-only', enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\\\', '/').split('?')[0].endsWith('/typescript/lib/typescript.js')) return null;
      return { code: memoryOnlyTypescript(code), map: null };
    }
  };
}
