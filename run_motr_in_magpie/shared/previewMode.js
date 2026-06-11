/** True when URL requests demographics-only preview (no consent, Cambridge, or reading). */
export function isDemographicsPreviewMode() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get('preview') === 'demographics') return true;
  const hash = window.location.hash.replace(/^#/, '');
  return hash === 'demographics-preview' || hash === 'preview=demographics';
}

/** True when URL requests reading-only preview (instruction + reading trials, no upload). */
export function isReadingPreviewMode() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get('preview') === 'reading') return true;
  const hash = window.location.hash.replace(/^#/, '');
  return hash === 'reading-preview' || hash === 'preview=reading';
}

/** True when results must not be uploaded or persisted (reading preview implies this). */
export function isNoUploadMode() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get('noUpload') === '1') return true;
  return isReadingPreviewMode();
}
