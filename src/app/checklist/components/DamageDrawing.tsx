"use client";
import { useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

interface DamageDrawingProps {
  onSave: (dataUrl: string) => void;
}

export default function DamageDrawing({ onSave }: DamageDrawingProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const handleSave = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const sketchDataUrl = await canvas.exportImage("png");
  
      const baseImage = new Image();
      baseImage.src = "/bus1.jpg";
  
      baseImage.onload = async () => {
        const width = baseImage.width;
        const height = baseImage.height;
  
        const combinedCanvas = document.createElement("canvas");
        combinedCanvas.width = width;
        combinedCanvas.height = height;
        const ctx = combinedCanvas.getContext("2d");
        if (!ctx) return;
  
        // Fondo: imagen del bus
        ctx.drawImage(baseImage, 0, 0, width, height);
  
        // Encima: dibujo del usuario
        const overlayImage = new Image();
        overlayImage.src = sketchDataUrl;
        overlayImage.onload = () => {
          ctx.drawImage(overlayImage, 0, 0, width, height);
          const finalDataUrl = combinedCanvas.toDataURL("image/png");
          onSave(finalDataUrl); // ✔️ Enviamos la imagen compuesta
        };
      };
    } catch (err) {
      console.error("Error generando imagen combinada:", err);
    }
  };
  

  return (
    <div className="mb-4">
      <div style={{ position: "relative", width: "100%", maxWidth: "800px" }}>
        <img
          src="/bus1.jpg"
          alt="Bus"
          style={{ width: "100%", display: "block", border: "1px solid #ccc" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={3}
            strokeColor="red"
            canvasColor="transparent"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>

      <div className="d-flex gap-2 mt-2 flex-wrap">
  <button type="button" className="btn btn-danger" onClick={() => canvasRef.current?.undo()}>
    Deshacer
  </button>
  <button type="button" className="btn btn-warning" onClick={() => canvasRef.current?.clearCanvas()}>
    Limpiar todo
  </button>
  <button type="button" className="btn btn-success" onClick={handleSave}>
    Guardar Dibujo
  </button>
</div>
        <div className="text-center mt-2">
            <small style={{ color: "#888" }}>
            Dibuja sobre la imagen para marcar daños o rayaduras.
            </small>
        </div>
    </div>
  );
}
