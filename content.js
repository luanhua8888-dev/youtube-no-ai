(() => {
  'use strict';
  const filter = globalThis.YouTubeAIFilter;
  const disclosure = globalThis.YouTubeAIDisclosure;
  const selector = [
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer',
    'ytd-grid-video-renderer', 'ytd-reel-item-renderer', 'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model', 'yt-shorts-lockup-view-model'
  ].join(',');
  let settings = filter.cleanSettings();
  let timer;
  let previousURL = location.href;
  const states = new Map();
  const revealed = new Set();
  // Per-tab bounded cache; no viewing data is stored permanently.
  const labelCache = new Map();
  const queued = new Set();
  const pendingCards = new Map();
  const queue = [];
  let activeChecks = 0;
  let lastCheckStart = 0;
  let queueTimer;
  const visibility = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const video = pendingCards.get(entry.target);
      pendingCards.delete(entry.target);
      visibility.unobserve(entry.target);
      if (video) enqueueCheck(video.id);
    }
  }, { rootMargin: '200px' }) : null;
  function cachedLabel(id) {
    const cached = labelCache.get(id);
    return cached && cached.expires > Date.now() ? cached : null;
  }
  function enqueueCheck(id) {
    if (!settings.enabled || !settings.checkLabels || typeof fetch !== 'function' || !/^[\w-]{11}$/.test(id) || cachedLabel(id) || queued.has(id)) return;
    queued.add(id);
    queue.push(id);
    pumpChecks();
  }
  function watchLabel(card, video) {
    if (!settings.enabled || !settings.checkLabels || cachedLabel(video.id)) return;
    if (visibility) {
      pendingCards.set(card, video);
      visibility.observe(card);
    } else enqueueCheck(video.id);
  }
  function pumpChecks() {
    if (!settings.enabled || !settings.checkLabels) {
      queue.splice(0).forEach(id => queued.delete(id));
      return;
    }
    if (activeChecks >= 2 || !queue.length) return;
    // Space requests out as well as limiting concurrency.
    const delay = Math.max(0, 700 - (Date.now() - lastCheckStart));
    clearTimeout(queueTimer);
    queueTimer = setTimeout(async () => {
      if (!settings.enabled || !settings.checkLabels) { pumpChecks(); return; }
      const id = queue.shift();
      if (!id) return;
      activeChecks++;
      lastCheckStart = Date.now();
      pumpChecks();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let marked = null;
      try {
        const response = await fetch(`/watch?v=${encodeURIComponent(id)}&hl=en`, {
          credentials: 'omit', signal: controller.signal
        });
        if (response.ok) marked = disclosure.inspectHTML(await response.text());
      } catch { /* Unknown is not evidence that the video is AI. */ }
      finally {
        clearTimeout(timeout);
        labelCache.set(id, { marked, expires: Date.now() + (marked === null ? 10 * 60 * 1000 : 60 * 60 * 1000) });
        if (labelCache.size > 500) labelCache.delete(labelCache.keys().next().value);
        queued.delete(id);
        activeChecks--;
        schedule();
        pumpChecks();
      }
    }, delay);
  }
  function extract(card) {
    const titleNode = card.querySelector('#video-title, #video-title-link, .yt-lockup-metadata-view-model__title, .shortsLockupViewModelHostMetadataTitle, h3');
    const link = card.querySelector('a[href*="watch?v="], a[href*="/shorts/"], a[href*="/live/"]');
    if (!link) return null;
    const title = titleNode?.textContent?.trim() || link.getAttribute('aria-label') || link.getAttribute('title') || '';
    const channelLink = card.querySelector('ytd-channel-name a, #channel-name a, a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]');
    const path = channelLink ? new URL(channelLink.href, location.origin).pathname : '';
    const channel = {
      name: channelLink?.textContent?.trim() || card.querySelector('ytd-channel-name, #channel-name')?.textContent?.trim() || '',
      path,
      handle: path.startsWith('/@') ? path.slice(1) : ''
    };
    const url = new URL(link.href, location.origin);
    const id = url.searchParams.get('v') || (/\/(?:shorts|live)\/([^/?]+)/.exec(url.pathname)?.[1]) || url.pathname;
    const description = card.querySelector('#description-text, .metadata-snippet-text')?.textContent?.trim() || '';
    const aiLabel = disclosure.cardHasDisclosure(card) || (settings.checkLabels && cachedLabel(id)?.marked === true);
    return { title, channel, description, id, aiLabel };
  }
  function restore(card, state) {
    card.classList.remove('yt-noai-hidden');
    state?.placeholder?.remove();
    states.delete(card);
  }
  function placeholder(video, result) {
    const box = document.createElement('div');
    box.className = 'yt-noai-placeholder';
    const heading = document.createElement('strong');
    heading.textContent = 'Đã lọc video AI';
    const reason = document.createElement('span');
    reason.textContent = result.reason;
    const show = document.createElement('button');
    show.type = 'button';
    show.textContent = 'Hiện video';
    show.addEventListener('click', () => { revealed.add(video.id); schedule(); });
    box.append(heading, reason, show);
    if (video.channel.path || video.channel.name) {
      const allow = document.createElement('button');
      allow.type = 'button';
      allow.textContent = 'Cho phép kênh';
      allow.addEventListener('click', async () => {
        try {
          const saved = await chrome.storage.local.get('settings');
          const latest = filter.cleanSettings(saved.settings);
          latest.allowedChannels = [...new Set([...latest.allowedChannels, video.channel.path || video.channel.name])];
          await chrome.storage.local.set({ settings: latest });
        } catch { reason.textContent = 'Không lưu được. Hãy tải lại trang YouTube.'; }
      });
      box.append(allow);
    }
    return box;
  }
  function scan() {
    if (location.href !== previousURL) { revealed.clear(); previousURL = location.href; }
    for (const [card, state] of states) {
      if (!card.isConnected) restore(card, state);
    }
    const cards = [...document.querySelectorAll(selector)].filter(card => !card.parentElement?.closest(selector));
    const liveCards = new Set(cards);
    for (const [card] of pendingCards) {
      if (!liveCards.has(card) || !settings.enabled || !settings.checkLabels) {
        visibility?.unobserve(card);
        pendingCards.delete(card);
      }
    }
    for (const [card, state] of states) if (!liveCards.has(card)) restore(card, state);
    for (const card of cards) {
      const video = extract(card);
      if (video && !video.aiLabel && !revealed.has(video.id)) watchLabel(card, video);
      const result = video && !revealed.has(video.id) ? filter.classify(video, settings) : null;
      const old = states.get(card);
      if (!result) { if (old) restore(card, old); continue; }
      const signature = JSON.stringify([video, result, settings.compact]);
      if (old?.signature === signature && (settings.compact || old.placeholder?.isConnected)) continue;
      if (old) restore(card, old);
      const box = settings.compact ? null : placeholder(video, result);
      if (box) card.before(box);
      card.classList.add('yt-noai-hidden');
      states.set(card, { signature, placeholder: box });
    }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(scan, 120); }
  const observer = new MutationObserver(records => {
    if (records.some(record => {
      const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (element?.closest('.yt-noai-placeholder')) return false;
      if (record.type !== 'childList') return true;
      return [...record.addedNodes, ...record.removedNodes].some(node => !(node.nodeType === Node.ELEMENT_NODE && node.matches('.yt-noai-placeholder')));
    })) schedule();
  });
  chrome.storage.local.get('settings').then(saved => {
    settings = filter.cleanSettings(saved.settings);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'title', 'aria-label'] });
    scan();
  }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      settings = filter.cleanSettings(changes.settings.newValue);
      pumpChecks();
      schedule();
    }
  });
  document.addEventListener('yt-navigate-finish', schedule);
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type === 'noai-status') {
      // Flush the debounced scan so the count reflects the current DOM/settings.
      clearTimeout(timer);
      scan();
      reply({ hidden: states.size });
    }
  });
})();
