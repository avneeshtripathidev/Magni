"use client";

import React, { useRef, memo } from 'react'

function TiltCard({ children, className = '', ...props }) {
  const ref = useRef(null)
  const rafRef = useRef(null)

  function handleMouseMove(e) {
    // Only animate on devices with fine pointer (mouse/trackpad), not touch/mobile
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`
    })
  }

  function handleMouseLeave() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <article
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </article>
  )
}

export default memo(TiltCard);
