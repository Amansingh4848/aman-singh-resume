/* Resolution-independent artwork with explicit GPU/memory budgets. */
((scope) => {
  'use strict';
  const UHD_PIXELS = 3840 * 2160;
  function canvasSize(width, height, dpr = 1, quality = 'ultra', layer = 'ambient') {
    width = Number.isFinite(width) && width > 0 ? width : 1;
    height = Number.isFinite(height) && height > 0 ? height : 1;
    dpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    const ultra = quality === 'ultra';
    const budget = layer === 'core' ? 2048 * 2048 : ultra ? UHD_PIXELS : 1920 * 1080;
    const maxWidth = layer === 'ambient' && ultra ? 3840 : 4096;
    const maxHeight = layer === 'ambient' && ultra ? 2160 : 4096;
    const ratio = Math.min(dpr, ultra ? 2 : 1.5, Math.sqrt(budget / (width * height)), maxWidth / width, maxHeight / height);
    const pixelWidth = Math.max(1, Math.floor(width * ratio));
    const pixelHeight = Math.max(1, Math.floor(height * ratio));
    return { width:pixelWidth, height:pixelHeight, scaleX:pixelWidth / width, scaleY:pixelHeight / height };
  }
  const api = Object.freeze({ canvasSize, UHD_PIXELS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else scope.PortfolioMotionQuality = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
