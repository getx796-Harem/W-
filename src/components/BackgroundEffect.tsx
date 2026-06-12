import React, { useEffect, useRef } from "react";

interface BackgroundEffectProps {
  glowColor?: string;
  gridColor?: string;
  speed?: number;
}

export const BackgroundEffect: React.FC<BackgroundEffectProps> = ({
  glowColor = "rgba(102, 252, 241, 0.08)", // Nexus Cyan
  gridColor = "rgba(69, 162, 158, 0.04)",   // Nexus Muted Teal
  speed = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle emitter setup
    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      char: string;
    }

    const particles: Particle[] = [];
    const characters = "010101XYZΩΔΦΨ_#@[]{}";
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 10,
        speed: (Math.random() * 1.5 + 0.5) * speed,
        opacity: Math.random() * 0.4 + 0.1,
        char: characters[Math.floor(Math.random() * characters.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let lastTime = 0;
    const render = (time: number) => {
      // Background base (Nexus Deep Slate Dark)
      ctx.fillStyle = "#0B0C10";
      ctx.fillRect(0, 0, width, height);

      // 1. Draw glowing background grid lines
      const gridSize = 45;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw a central cosmic radial gradient for depth
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(31, 40, 51, 0.25)"); // Steel Blue translucent glow
      gradient.addColorStop(0.5, "rgba(11, 12, 16, 0.7)");
      gradient.addColorStop(1, "rgba(11, 12, 16, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw cyber node dots at intersections
      ctx.fillStyle = "rgba(102, 252, 241, 0.08)";
      for (let x = 0; x < width; x += gridSize * 2) {
        for (let y = 0; y < height; y += gridSize * 2) {
          // Subtle variance to make it pulse
          const pulse = Math.sin(time * 0.002 + x * 0.01 + y * 0.01) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 1 + pulse * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Draw falling glowing stream letters (data stream in brand-cyan)
      ctx.font = "11px 'JetBrains Mono', monospace";
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(102, 252, 241, ${p.opacity * (0.6 + Math.sin(time * 0.005 + p.x) * 0.4)})`;
        ctx.fillText(p.char, p.x, p.y);

        // Update particle
        p.y += p.speed;
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        // Periodically swap character
        if (Math.random() < 0.02) {
          p.char = characters[Math.floor(Math.random() * characters.length)];
        }
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [speed, glowColor, gridColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};
