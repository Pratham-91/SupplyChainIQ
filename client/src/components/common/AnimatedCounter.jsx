import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter — smooth ease-out-cubic number animation.
 * Re-triggers whenever `value` changes.
 */
export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startValRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    startValRef.current = display;
    startTimeRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = startValRef.current + (target - startValRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInt = Number.isInteger(typeof value === 'number' ? value : parseFloat(value));
  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: isInt ? 0 : 1,
    maximumFractionDigits: isInt ? 0 : 1,
  });

  return (
    <span className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
}
