import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Animate elements matching `selector` inside the container ref.
 * Runs once on mount with staggered fadeInUp.
 */
export function useGsapStagger(selector = '.gsap-fade', options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll(selector);
    if (els.length === 0) return;

    gsap.fromTo(
      els,
      {
        opacity: 0,
        y: options.y ?? 40,
        scale: options.scale ?? 0.97,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration ?? 0.7,
        stagger: options.stagger ?? 0.1,
        ease: options.ease ?? 'power3.out',
        delay: options.delay ?? 0.1,
      }
    );
  }, [selector]);

  return containerRef;
}

/**
 * Animate a single element ref on mount.
 */
export function useGsapReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        y: options.y ?? 30,
        scale: options.scale ?? 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration ?? 0.8,
        ease: options.ease ?? 'power3.out',
        delay: options.delay ?? 0,
      }
    );
  }, []);

  return ref;
}

/**
 * GSAP timeline for hero text reveal effect.
 */
export function useGsapHero() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      ref.current.querySelector('.hero-title'),
      { opacity: 0, y: 50, clipPath: 'inset(100% 0 0 0)' },
      { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 1 }
    )
      .fromTo(
        ref.current.querySelector('.hero-subtitle'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.4'
      )
      .fromTo(
        ref.current.querySelectorAll('.hero-stat'),
        { opacity: 0, y: 25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
        '-=0.3'
      );
  }, []);

  return ref;
}

/**
 * Animate data-loaded content (for when API data arrives).
 */
export function useGsapOnData(data, selector = '.gsap-fade') {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const els = containerRef.current.querySelectorAll(selector);
    if (els.length === 0) return;

    gsap.fromTo(
      els,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.05,
      }
    );
  }, [data, selector]);

  return containerRef;
}
