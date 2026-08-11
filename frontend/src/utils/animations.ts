import gsap from 'gsap';

/**
 * GSAP Animation Utilities for MentorStack
 * Provides reusable animation functions for consistent UX
 */

// Fade in stagger animation for lists
export const fadeInStagger = (elements: HTMLElement[] | NodeListOf<Element>, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    ...options
  };

  gsap.from(elements, defaults);
};

// Scale bounce animation for cards
export const scaleBounce = (element: HTMLElement, options = {}) => {
  const defaults = {
    scale: 1.05,
    duration: 0.3,
    ease: 'back.out(1.7)',
    ...options
  };

  gsap.to(element, defaults);
};

// Reset scale animation
export const scaleReset = (element: HTMLElement) => {
  gsap.to(element, {
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  });
};

// Slide in from side
export const slideIn = (elements: HTMLElement[] | NodeListOf<Element>, direction: 'left' | 'right' = 'left', options = {}) => {
  const defaults = {
    opacity: 0,
    x: direction === 'left' ? -50 : 50,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    ...options
  };

  gsap.from(elements, defaults);
};

// Button pulse animation
export const buttonPulse = (element: HTMLElement) => {
  gsap.to(element, {
    scale: 1.1,
    duration: 0.2,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1
  });
};

// Smooth color transition
export const colorTransition = (element: HTMLElement, color: string) => {
  gsap.to(element, {
    backgroundColor: color,
    duration: 0.3,
    ease: 'power2.inOut'
  });
};

// Rotate and scale for icons
export const iconHover = (element: HTMLElement) => {
  gsap.to(element, {
    rotation: 360,
    scale: 1.2,
    duration: 0.5,
    ease: 'back.out(2)'
  });
};

// Reset icon
export const iconReset = (element: HTMLElement) => {
  gsap.to(element, {
    rotation: 0,
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  });
};

// Shake animation for errors
export const shake = (element: HTMLElement) => {
  gsap.timeline()
    .to(element, { x: -10, duration: 0.1 })
    .to(element, { x: 10, duration: 0.1 })
    .to(element, { x: -10, duration: 0.1 })
    .to(element, { x: 10, duration: 0.1 })
    .to(element, { x: 0, duration: 0.1 });
};

// Success checkmark animation
export const successPop = (element: HTMLElement) => {
  gsap.fromTo(element,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)' }
  );
};

// Loading shimmer effect
export const shimmer = (element: HTMLElement) => {
  gsap.to(element, {
    backgroundPosition: '200% center',
    duration: 1.5,
    ease: 'none',
    repeat: -1
  });
};

// Smooth scroll to element
export const smoothScrollTo = (target: string | HTMLElement) => {
  gsap.to(window, {
    scrollTo: target,
    duration: 1,
    ease: 'power2.inOut'
  });
};
