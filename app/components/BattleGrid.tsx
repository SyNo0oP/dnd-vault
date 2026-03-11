"use client";
import { useEffect, useRef } from "react";

interface Monster {
  name: string;
  x: number;
  y: number;
}

interface GridProps {
  mapUrl: string;
  gridType: "square" | "hex" | "none";
  gridSize: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  hasFog?: boolean;
  monsters?: Monster[];
  onUpdateMonsters?: (monsters: Monster[]) => void;
}

export default function BattleGrid({
  mapUrl,
  gridType,
  gridSize,
  opacity,
  offsetX,
  offsetY,
  hasFog,
  monsters = [],
  onUpdateMonsters,
}: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || gridType === "none") return;

    canvas.width = img.width;
    canvas.height = img.height;
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
      const hDist = Math.sqrt(3) * r;
      const vDist = r * 1.5;
      for (let row = -1; row < canvas.height / vDist + 1; row++) {
        for (let col = -1; col < canvas.width / hDist + 1; col++) {
          const x = col * hDist + (row % 2 === 0 ? 0 : hDist / 2) + offsetX;
          const y = row * vDist + offsetY;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 2; // Pointy topped
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
  }, [gridType, gridSize, opacity, offsetX, offsetY, mapUrl]);

  const handleDragEnd = (e: React.DragEvent, index: number) => {
    if (!imgRef.current || !onUpdateMonsters) return;

    const rect = imgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let snapX, snapY;

    if (gridType === "square") {
      snapX =
        Math.floor((mouseX - offsetX) / gridSize) * gridSize +
        offsetX +
        gridSize / 2;
      snapY =
        Math.floor((mouseY - offsetY) / gridSize) * gridSize +
        offsetY +
        gridSize / 2;
    } else {
      // MATHS HEXAGONE (Pointy Topped)
      const r = gridSize / 2;
      const hDist = Math.sqrt(3) * r;
      const vDist = r * 1.5;

      const row = Math.round((mouseY - offsetY) / vDist);
      const col = Math.round(
        (mouseX - offsetX - (row % 2 === 0 ? 0 : hDist / 2)) / hDist,
      );

      snapX = col * hDist + (row % 2 === 0 ? 0 : hDist / 2) + offsetX;
      snapY = row * vDist + offsetY;
    }

    const tokenSize = gridSize * 0.7;
    const updatedMonsters = [...monsters];
    updatedMonsters[index] = {
      ...updatedMonsters[index],
      x: snapX - tokenSize / 2,
      y: snapY - tokenSize / 2,
    };
    onUpdateMonsters(updatedMonsters);
  };

  return (
    <div
      className="relative inline-block border-2 border-transparent"
      onDragOver={(e) => e.preventDefault()} // Obligatoire pour autoriser le drop
    >
      <img
        ref={imgRef}
        src={mapUrl}
        alt="Map"
        className="block max-w-full h-auto select-none rounded-xl"
        onLoad={drawGrid}
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
      />

      {monsters.map((monster, i) => {
        const tokenSize = gridSize * 0.7;
        return (
          <div
            key={i}
            draggable
            onDragEnd={(e) => handleDragEnd(e, i)}
            className="absolute z-50 cursor-grab active:cursor-grabbing group"
            style={{
              left: `${monster.x}px`,
              top: `${monster.y}px`,
              width: `${tokenSize}px`,
              height: `${tokenSize}px`,
              transition: "left 0.1s, top 0.1s", // Petite fluidité de placement
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-amber-500 bg-slate-800 shadow-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
              <span className="text-[8px] font-black text-white uppercase px-1 pointer-events-none">
                {monster.name.substring(0, 3)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
