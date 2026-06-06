/** True when URL requests demographics-only preview (no consent, Cambridge, or reading). */
export function isDemographicsPreviewMode() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get('preview') === 'demographics') return true;
  const hash = window.location.hash.replace(/^#/, '');
  return hash === 'demographics-preview' || hash === 'preview=demographics';
}
