'use strict';

// A small clock independent of the page, so elapsed time survives a throttled tab.
const WoowooishPause = (() => {
  function createTimer(now = () => performance.now()) {
    const duration = 180000;
    let elapsed = 0;
    let startedAt = 0;
    let state = 'idle';

    function snapshot() {
      if (state === 'running') {
        elapsed = Math.min(duration, Math.max(0, now() - startedAt));
        if (elapsed >= duration) state = 'complete';
      }
      return {
        state,
        elapsed,
        remaining: Math.ceil((duration - elapsed) / 1000),
        phase: Math.min(2, Math.floor(elapsed / 60000)),
      };
    }

    return {
      snapshot,
      start() {
        if (state === 'running') return snapshot();
        if (state === 'complete') elapsed = 0;
        startedAt = now() - elapsed;
        state = 'running';
        return snapshot();
      },
      pause() {
        snapshot();
        if (state === 'running') state = 'paused';
        return snapshot();
      },
      reset() {
        elapsed = 0;
        state = 'idle';
        return snapshot();
      },
    };
  }
  return { createTimer };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = WoowooishPause;
