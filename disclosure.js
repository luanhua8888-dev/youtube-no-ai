(function (root) {
  'use strict';
  const labels = new Set([
    'ai', 'made with ai', 'ai: content was made with ai', 'ai-generated', 'ai generated',
    'altered or synthetic content', 'tao bang ai', 'duoc tao bang ai',
    'noi dung da bi chinh sua hoac duoc tao tong hop', 'noi dung bi chinh sua hoac tong hop'
  ]);
  function isLabel(value) {
    return typeof value === 'string' && labels.has(root.YouTubeAIFilter.normalize(value));
  }
  function containsLabel(value) {
    if (!value || typeof value !== 'object') return false;
    return Object.entries(value).some(([key, child]) => {
      if (['label', 'simpleText', 'text', 'content'].includes(key) && isLabel(child)) return true;
      return child && typeof child === 'object' && containsLabel(child);
    });
  }
  // Only the current video's disclosure sections count. Related titles, comments,
  // descriptions and YouTube experiment flags must never mark the current video.
  function hasDisclosure(data) {
    if (!data || typeof data !== 'object') return false;
    return Object.entries(data).some(([key, child]) => {
      if (/^(secondaryResults|relatedVideo|comments|commentRenderer|videoRenderer|compactVideoRenderer|richItemRenderer)$/.test(key)) return false;
      if (key === 'videoPrimaryInfoRenderer') return containsLabel(child?.badges);
      if (/^(howThisWasMadeSection(?:ViewModel|Renderer)|videoContentDisclosureRenderer|aiDisclosureViewModel)$/.test(key)) return containsLabel(child);
      return child && typeof child === 'object' && hasDisclosure(child);
    });
  }
  function initialData(html) {
    const patterns = [/\b(?:var\s+)?ytInitialData\s*=\s*/g, /window\s*\[\s*["']ytInitialData["']\s*\]\s*=\s*/g];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html))) {
        const start = pattern.lastIndex;
        if (html[start] !== '{') continue;
        let depth = 0, quoted = false, escaped = false;
        for (let index = start; index < html.length; index++) {
          const char = html[index];
          if (quoted) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') quoted = false;
          } else if (char === '"') quoted = true;
          else if (char === '{') depth++;
          else if (char === '}' && --depth === 0) {
            try { return JSON.parse(html.slice(start, index + 1)); } catch { break; }
          }
        }
      }
    }
    return null;
  }
  function inspectHTML(html) {
    const data = initialData(html);
    return data ? hasDisclosure(data) : null;
  }
  function cardHasDisclosure(card) {
    return [...card.querySelectorAll('ytd-badge-supported-renderer, .yt-badge-shape, .badge-shape-wiz, .yt-badge-shape-wiz, [class*="badge"], [class*="Badge"], [class*="disclosure"], [class*="Disclosure"]')]
      .some(node => [node.textContent, node.getAttribute('aria-label'), node.getAttribute('title')].some(isLabel));
  }
  const api = { isLabel, hasDisclosure, initialData, inspectHTML, cardHasDisclosure };
  root.YouTubeAIDisclosure = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
