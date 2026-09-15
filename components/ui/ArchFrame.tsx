import Image from 'next/image';

import type { ImageAsset } from '@/lib/site';

type ArchFrameProps = {
  image: ImageAsset;
  /** Tailwind aspect utility, e.g. 'aspect-[3/4]'. Reserved up front — no layout shift. */
  ratio?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Turns off the arch for a plain rectangular plate. */
  square?: boolean;
};

/**
 * An image in the house frame. The arch is the brand's recurring geometry, so
 * it is used on the two or three images that carry the most weight — never on
 * every picture, which would turn a motif into wallpaper.
 */
export function ArchFrame({
  image,
  ratio = 'aspect-[3/4]',
  sizes,
  priority = false,
  className = '',
  square = false,
}: ArchFrameProps) {
  return (
    <div
      className={`relative ${ratio} overflow-hidden bg-paper-alt ${
        square ? '' : 'arch-mask'
      } ${className}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ objectPosition: image.focus ?? '50% 50%' }}
      />
    </div>
  );
}
