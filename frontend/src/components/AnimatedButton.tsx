"use client";

import { useRef, ReactNode, MouseEvent } from 'react';
import gsap from 'gsap';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function AnimatedButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  variant = 'primary'
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current && !disabled) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current && !disabled) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
    onClick?.(e);
  };

  const variantClasses = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
