"use client";
import { useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

interface FirmaCanvasProps {
  onSave: (dataUrl: string) => void;
}

export default function FirmaCanvas({ onSave }: FirmaCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [show, setShow] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await canvasRef.current.exportImage("png");
    setPreviewUrl(dataUrl);
    onSave(dataUrl);
    setShow(false);
  };

  return (
    <>
      <Button variant="outline-dark" onClick={() => setShow(true)}>Firmar</Button>

      {previewUrl && (
        <div className="mt-2">
          <strong>Vista previa de la firma:</strong><br />
          <img src={previewUrl} alt="Firma" style={{ maxWidth: "200px", border: "1px solid #ccc" }} />
        </div>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header>
          <Modal.Title>Firma Digital</Modal.Title>
          <Button variant="outline-secondary" onClick={() => setShow(false)}>Cerrar</Button>
        </Modal.Header>
        <Modal.Body>
          <div style={{ border: "1px solid #ccc", height: 300 }}>
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={3}
              strokeColor="black"
              canvasColor="white"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => canvasRef.current?.undo()}>Deshacer</Button>
          <Button variant="warning" onClick={() => canvasRef.current?.clearCanvas()}>Limpiar</Button>
          <Button variant="success" onClick={handleSave}>Guardar Firma</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
