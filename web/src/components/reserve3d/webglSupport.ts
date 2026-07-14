type WebGLContextName = 'webgl2' | 'webgl' | 'experimental-webgl';

let webGLSupportConfirmed = false;

export function supportsWebGL(): boolean {
  if (webGLSupportConfirmed) {
    return true;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (
    typeof window.WebGL2RenderingContext === 'undefined' &&
    typeof window.WebGLRenderingContext === 'undefined'
  ) {
    return false;
  }

  const canvas = document.createElement('canvas');
  const contextNames: WebGLContextName[] = ['webgl2', 'webgl', 'experimental-webgl'];

  for (const contextName of contextNames) {
    try {
      const context = canvas.getContext(contextName as 'webgl2' | 'webgl');

      if (context) {
        webGLSupportConfirmed = true;
        return true;
      }
    } catch {
      // A browser may reject one context type while still supporting the next one.
    }
  }

  return false;
}
