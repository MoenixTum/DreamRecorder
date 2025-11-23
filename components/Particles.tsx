import React, { useEffect, useRef } from 'react';

interface ParticlesProps {
  intensity: number;
}

const Particles: React.FC<ParticlesProps> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = 40 + Math.floor(intensity * 60);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, // Very slow, drift like dust
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5, // Small stars
        alpha: Math.random() * 0.5 + 0.1, 
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // White/Silver starlight
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * intensity})`; 
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 mix-blend-screen" />;
};

export default Particles;