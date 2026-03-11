"use client";
import { useEffect, useRef } from "react";

interface GridProps {
  mapUrl: string;
  gridType: "square" | "hex" | "none";
  gridSize: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export default function BattleGrid({
  mapUrl,
  gridType,
  gridSize,
  opacity,
  offsetX,
  offsetY,
}: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || gridType === "none") return;

    // Aligner la taille du canvas sur l'image affichée
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 1;

    if (gridType === "square") {
      for (let x = offsetX % gridSize; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = offsetY % gridSize; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (gridType === "hex") {
      const r = gridSize / 2;
      const hDist = r * Math.sqrt(3);
      const vDist = r * 1.5;
      for (let row = -1; row < canvas.height / vDist + 1; row++) {
        for (let col = -1; col < canvas.width / hDist + 1; col++) {
          const x = col * hDist + (row % 2 === 0 ? 0 : hDist / 2) + offsetX;
          const y = row * vDist + offsetY;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6;
            ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  };

  useEffect(() => {
    drawGrid();
    window.addEventListener("resize", drawGrid);
    return () => window.removeEventListener("resize", drawGrid);
  }, [gridType, gridSize, opacity, offsetX, offsetY, mapUrl]);

  return (
    <div className="relative w-full flex justify-center items-start overflow-hidden bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
      <img
        ref={imgRef}
        src={mapUrl}
        alt="Map"
        className="max-w-full h-auto"
        onLoad={drawGrid}
      />
      <canvas ref={canvasRef} className="absolute top-0 pointer-events-none" />
    </div>
  );
}
