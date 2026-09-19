'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A list that reorders in the browser the instant a move arrow is pressed,
 * while the server saves the new order in the background.
 *
 * The arrows call Server Actions, and once the page's data comes back the
 * whole list re-renders — too late for the rows to slide, because by then they
 * are new elements. Moving the row locally first means the same elements
 * change place, so Framer Motion can animate the move (`layout="position"` on
 * each row). `reset` puts the server's order back if the save fails, and the
 * list follows the server's data again as soon as fresh data arrives.
 */
export function useReorderList<T>(items: T[], keyOf: (item: T) => string | number) {
  const [list, setList] = useState(items);

  useEffect(() => setList(items), [items]);

  const move = useCallback(
    (key: string | number, direction: 'up' | 'down') => {
      setList((current) => {
        const from = current.findIndex((item) => keyOf(item) === key);
        const to = direction === 'up' ? from - 1 : from + 1;
        if (from < 0 || to < 0 || to >= current.length) return current;
        const next = current.slice();
        [next[from], next[to]] = [next[to], next[from]];
        return next;
      });
    },
    // keyOf is a stable accessor at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reset = useCallback(() => setList(items), [items]);

  return { list, move, reset };
}
