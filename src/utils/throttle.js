export function throttle(fn, delay = 500) {
  let last = 0;

  return function (...args) {
    const now = Date.now();
    if (now - last < delay) return;
    last = now;
    fn.apply(this, args);
  };
}
