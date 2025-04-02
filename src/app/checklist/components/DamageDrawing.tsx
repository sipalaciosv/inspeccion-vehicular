"use client";
import type { CanvasPath } from "react-sketch-canvas"; // agrégalo arriba
import { useRef, useState } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Modal, Button } from "react-bootstrap";
import { useEffect } from "react"; // asegúrate de tener esto arriba


interface DamageDrawingProps {
  onSave: (dataUrl: string) => void;
}

export default function DamageDrawing({ onSave }: DamageDrawingProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [show, setShow] = useState(false);
  const [paths, setPaths] = useState<CanvasPath[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const cargarPaths = async () => {
      if (show && paths && canvasRef.current) {
        await canvasRef.current.clearCanvas();
        await canvasRef.current.loadPaths(paths);
      }
    };
    cargarPaths();
  }, [show, paths]);
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

        ctx.drawImage(baseImage, 0, 0, width, height);

        const overlayImage = new Image();
        overlayImage.src = sketchDataUrl;
        overlayImage.onload = async () => {
          ctx.drawImage(overlayImage, 0, 0, width, height);
          const finalDataUrl = combinedCanvas.toDataURL("image/png");
          const currentPaths = await canvasRef.current?.exportPaths();
            setPaths(currentPaths || null);
          onSave(finalDataUrl);
          setPreviewUrl(finalDataUrl);

          setShow(false); // cerrar el modal
        };
      };
    } catch (err) {
      console.error("Error generando imagen combinada:", err);
    }
  };

  return (
    <>
      <Button variant="outline-primary" onClick={() => setShow(true)}>
  Abrir dibujo de daños
</Button>

{previewUrl && (
  <div className="mt-3">
    <p className="mb-1"><strong>Vista previa del dibujo guardado:</strong></p>
    <img
      src={previewUrl}
      alt="Vista previa"
      style={{
        maxWidth: "200px",
        border: "1px solid #ccc",
        borderRadius: "8px"
      }}
    />
  </div>
)}
      <Modal show={show} onHide={() => setShow(false)} size="xl" centered backdrop="static">

    <Modal.Header>
      <Modal.Title>Dibujo de Choques / Rayaduras</Modal.Title>
      <Button
  variant="outline-secondary"
  onClick={async () => {
    const currentPaths = await canvasRef.current?.exportPaths();
    setPaths(currentPaths || null);
    setShow(false);
  }}
>
  Cerrar
</Button>

    </Modal.Header>
    <Modal.Body>
      <div style={{ position: "relative", width: "100%", height: "auto" }}>
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
    </Modal.Body>
    <Modal.Footer>
      <Button variant="danger" onClick={() => canvasRef.current?.undo()}>
        Deshacer
      </Button>
      <Button variant="warning" onClick={() => canvasRef.current?.clearCanvas()}>
        Limpiar
      </Button>
      <Button variant="success" onClick={handleSave}>
        Guardar dibujo
      </Button>
    </Modal.Footer>
  </Modal>


    </>
  );
}
