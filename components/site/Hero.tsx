'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

import { Action } from '@/components/ui/Action';
import { ease } from '@/lib/motion';
import { hero, images, story } from '@/lib/site';

/**
 * Photography-led, bottom-anchored. The type is set against the quiet corner of
 * the image rather than centred on top of it, and the only movement is a slow
 * settle on load plus a shallow parallax on scroll.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const parallax = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const scrim = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  const line = {
    hidden: { opacity: 0, y: '0.32em' },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="on-night relative isolate min-h-[100svh] overflow-hidden bg-night"
    >
      <motion.div
        aria-hidden="true"
        style={{ y: reduceMotion ? 0 : parallax }}
        className="absolute inset-0 -z-10 h-[118%]"
      >
        <motion.div
          initial={{ scale: reduceMotion ? 1 : 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease }}
          className="relative h-full w-full"
        >
          <Image
            src={images.hero.src}
            alt={images.hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: images.hero.focus }}
          />
        </motion.div>
      </motion.div>

      {/* Two scrims: one from the foot for the type, one raking across for depth. */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: reduceMotion ? 1 : scrim }}
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(var(--night))_2%,rgb(var(--night)/0.86)_26%,rgb(var(--night)/0.34)_62%,rgb(var(--night)/0.55)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgb(var(--night)/0.82)_0%,rgb(var(--night)/0.45)_38%,transparent_66%)]"
      />

      <div className="shell relative flex min-h-[100svh] flex-col justify-end pb-10 pt-32 md:pb-14 md:pt-40">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
          className="label flex items-center gap-4 text-gold-soft"
        >
          <span aria-hidden="true" className="block h-px w-10 bg-gold-soft/60" />
          {hero.eyebrow}
        </motion.p>

        <motion.h1
          id="hero-heading"
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.3, staggerChildren: 0.11 }}
          className="mt-7 text-display-hero text-on-night md:mt-9"
        >
          {hero.lines.map((text) => (
            <motion.span
              key={text}
              variants={line}
              transition={{ duration: 0.95, ease }}
              className="block overflow-hidden"
            >
              {text}
            </motion.span>
          ))}
          <motion.span
            variants={line}
            transition={{ duration: 0.95, ease }}
            className="block italic text-gold-soft"
          >
            {hero.accentLine}
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.85 }}
          className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end md:gap-10"
        >
          <p className="max-w-measure text-lead text-on-night-muted md:col-span-5 md:col-start-1">
            {hero.lead}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-5 md:col-start-8 md:justify-end">
            <Action href={hero.primaryCta.href} variant="solid">
              {hero.primaryCta.label}
            </Action>
            <Action href={hero.secondaryCta.href} variant="outline-night" withArrow>
              {hero.secondaryCta.label}
            </Action>
          </div>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease, delay: 1.1 }}
          className="mt-10 hidden border-t border-line-night pt-5 md:mt-16 md:grid md:grid-cols-3 md:gap-10"
        >
          {story.notes.map((note) => (
            <div key={note.label} className="flex items-baseline gap-4">
              <dt className="label text-on-night-muted">{note.label}</dt>
              <dd className="text-micro text-on-night">{note.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
