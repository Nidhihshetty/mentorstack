"use client";

import { useRef, ReactNode } from 'react';
import gsap from 'gsap';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  onClick?: () => void;
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  hoverScale = 1.03,
  onClick 
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: hoverScale,
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`cursor-pointer transition-all ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
