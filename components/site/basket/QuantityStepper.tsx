'use client';

import { MinusIcon, PlusIcon } from '@/components/ui/icons';

type QuantityStepperProps = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  increaseLabel: string;
  decreaseLabel: string;
  quantityLabel: string;
  size?: 'md' | 'lg';
};

/** The stepper used inside the basket and the dish sheet (the card uses the morphing AddControl). */
export function QuantityStepper({ quantity, onIncrease, onDecrease, increaseLabel, decreaseLabel, quantityLabel, size = 'md' }: QuantityStepperProps) {
  const button = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  return (
    <div className={`flex items-center rounded-full bg-accent text-white ${size === 'lg' ? 'h-12' : 'h-9'}`}>
      <button type="button" onClick={onDecrease} aria-label={decreaseLabel} className={`tap hit-44 flex items-center justify-center rounded-full ${button}`}>
        <MinusIcon size={size === 'lg' ? 20 : 16} />
      </button>
      <span aria-label={quantityLabel} className={`text-center font-semibold tabular-nums ${size === 'lg' ? 'min-w-[2.5rem] text-[17px]' : 'min-w-[1.75rem] text-[15px]'}`}>
        {quantity}
      </span>
      <button type="button" onClick={onIncrease} aria-label={increaseLabel} className={`tap hit-44 flex items-center justify-center rounded-full ${button}`}>
        <PlusIcon size={size === 'lg' ? 20 : 16} />
      </button>
    </div>
  );
}
