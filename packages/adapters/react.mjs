/**
 * React bridge: setState is injected by the React host. No DOM mutations,
 * React runtime import, global listeners or control of React-owned children.
 */
export function createReactStateAdapter(onDefinition) {
  if (typeof onDefinition !== 'function') throw new TypeError('React adapter requires a state callback');
  return {
    mount(_host, definition) {
      onDefinition(definition);
      let disposed = false;
      return {
        update(next) {
          if (disposed) throw new Error('React adapter already disposed');
          onDefinition(next);
        },
        dispose() { disposed = true; }
      };
    }
  };
}
