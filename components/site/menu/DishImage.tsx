'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { AnorMark } from '@/components/ui/AnorMark';
import { isOptimizableImage } from '@/lib/menu-format';
import type { DishPhoto } from '@/lib/types';

type DishImageProps = {
  photo: DishPhoto | undefined;
  sizes: string;
  priority?: boolean;
  rounded?: string;
};

/**
 * Every photo renders into a fixed 1:1 box: a shimmer on #F4F4F2 while it
 * loads, then a 200ms fade — no blank flash, no layout shift. No photo →
 * a branded tile instead of an empty cell.
 */
export function DishImage({ photo, sizes, priority = false, rounded = 'rounded-[10px]' }: DishImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = ref.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, []);

  if (!photo) return <PlaceholderTile rounded={rounded} />;

  return (
    <span className={`shimmer relative block aspect-square w-full overflow-hidden ${rounded}`} data-loaded={loaded}>
      <Image
        ref={ref}
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="dish-img object-cover"
        data-loaded={loaded}
        onLoad={() => setLoaded(true)}
        unoptimized={!isOptimizableImage(photo.src)}
      />
    </span>
  );
}

export function PlaceholderTile({ rounded = 'rounded-[10px]' }: { rounded?: string }) {
  return (
    <span aria-hidden="true" className={`flex aspect-square w-full items-center justify-center bg-accent/[0.07] ${rounded}`}>
      <AnorMark className="h-[36%] w-auto text-accent-ink/25" />
    </span>
  );
}
