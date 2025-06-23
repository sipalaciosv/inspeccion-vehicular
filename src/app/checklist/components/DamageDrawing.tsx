"use client";
import type { CanvasPath } from "react-sketch-canvas";
import { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Modal, Button, Form } from "react-bootstrap";
import Image from "next/image";


interface DamageDrawingProps {
  onSave: (dataUrl: string) => void;
  resetKey: number;
  clearPreview?: boolean;
}

export default function DamageDrawing({ onSave, resetKey, clearPreview = false }: DamageDrawingProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [show, setShow] = useState(false);
  const [paths, setPaths] = useState<CanvasPath[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [strokeWidth, setStrokeWidth] = useState(3); // 👉 nuevo estado

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      
    }
    setPaths(null);
  }, [resetKey]);

  useEffect(() => {
    if (clearPreview) setPreviewUrl(null);
  }, [clearPreview]);

  useEffect(() => {
    const cargarPaths = async () => {
      if (show && paths && paths.length > 0 && canvasRef.current) {
        await canvasRef.current.clearCanvas();
        await canvasRef.current.loadPaths(paths);
      }
    };
    cargarPaths();
  }, [show, paths]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sketchDataUrl = await canvas.exportImage("png");

    const baseImage = new window.Image();

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

      const overlayImage = new window.Image();

      overlayImage.src = sketchDataUrl;
      overlayImage.onload = async () => {
        ctx.drawImage(overlayImage, 0, 0, width, height);
        const finalDataUrl = combinedCanvas.toDataURL("image/png");

        const currentPaths = await canvas.exportPaths();
        setPaths(currentPaths || null);

        onSave(finalDataUrl);
        setPreviewUrl(finalDataUrl);
        setShow(false);
      };
    };
  };

  return (
    <>
      <Button variant="outline-primary" onClick={() => setShow(true)}>
        Abrir dibujo de daños
      </Button>

      {previewUrl && (
        <div className="mt-3">
          <p className="mb-1"><strong>Vista previa del dibujo guardado:</strong></p>
          <div style={{ maxWidth: "200px", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
  <Image
    src={previewUrl}
    alt="Vista previa"
    width={200}
    height={200}
    style={{ objectFit: "contain", borderRadius: "8px" }}
  />
</div>

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
          <div className="mb-3">
            <label><strong>Grosor del trazo: {strokeWidth}px</strong></label>
            <Form.Range
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(+e.target.value)}
            />
          </div>

          <div style={{ position: "relative", width: "100%", aspectRatio: "736 / 354" }}>
  <Image
    src="/bus1.jpg"
    alt="Bus"
    fill
    style={{ objectFit: "contain", border: "1px solid #ccc", zIndex: 1 }}
    sizes="(max-width: 1200px) 100vw, 736px"
  />
  <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
    <ReactSketchCanvas
      ref={canvasRef}
      strokeWidth={strokeWidth}
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
