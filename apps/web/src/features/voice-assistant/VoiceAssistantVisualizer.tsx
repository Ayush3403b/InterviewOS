import { useEffect, useRef } from "react";

interface VoiceAssistantVisualizerProps {
  isActive: boolean;
  isAiSpeaking?: boolean;
  color?: string;
  height?: number;
}

export function VoiceAssistantVisualizer({
  isActive,
  isAiSpeaking = false,
  color = "#3b82f6",
  height = 80,
}: VoiceAssistantVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      if (!isActive && !isAiSpeaking) {
        // Flat baseline line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Draw multi-layered animated sine waves
      const waveCount = isAiSpeaking ? 4 : 3;
      const baseAmplitude = isAiSpeaking ? h * 0.35 : h * 0.25;

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        const waveColor = isAiSpeaking
          ? `rgba(168, 85, 247, ${0.4 + (i / waveCount) * 0.5})`
          : `rgba(59, 130, 246, ${0.35 + (i / waveCount) * 0.5})`;

        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 2 + i * 0.5;

        for (let x = 0; x < width; x++) {
          const frequency = 0.015 + i * 0.005;
          const amp = baseAmplitude * Math.sin((x / width) * Math.PI); // tapering edges
          const y = centerY + Math.sin(x * frequency + phase + i * 1.5) * amp;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += isAiSpeaking ? 0.08 : 0.05;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isAiSpeaking, color]);

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/60 p-4 border border-slate-800 backdrop-blur-md">
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[11px] font-mono font-medium">
        <span
          className={`h-2 w-2 rounded-full ${
            isAiSpeaking
              ? "bg-purple-500 animate-pulse"
              : isActive
              ? "bg-emerald-500 animate-ping"
              : "bg-slate-600"
          }`}
        />
        <span className="text-slate-400">
          {isAiSpeaking ? "AI Speaking" : isActive ? "Mic Active" : "Standby"}
        </span>
      </div>
    </div>
  );
}
