import type { FormData } from "../page";

interface ChecklistSectionProps {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  setImages: React.Dispatch<React.SetStateAction<{ [key: string]: File | null }>>;
}

const secciones: { [key: string]: string[] } = {
  "Sistema de Luces": [
    "Luz delantera alta", "Luz delantera baja", "Luces de emergencia",
    "Luces neblineros", "Luces direccionales delanteras", "Luces direccionales traseras", "Luces de salón"
  ],
  "Estado de Llantas y Neumáticos": [
    "Llanta y neumático pos. 1", "Llanta y neumático pos. 2", "Llanta y neumático pos. 3",
    "Llanta y neumático pos. 4", "Llanta y neumático pos. 5", "Llanta y neumático pos. 6",
    "Llanta y neumático pos. 7", "Llanta y neumático pos. 8", "Llanta de repuesto"
  ],
  "Parte Exterior": [
    "Parabrisas delantero", "Parabrisas trasero", "Limpia parabrisas",
    "Vidrio de ventanas", "Espejos laterales", "Tapa de estanque combustible"
  ],
  "Parte Interna": [
    "Estado de tablero/indicadores operativos", "Maxi brake", "Freno de servicio",
    "Cinturón de seguridad conductor", "Cinturón de pasajeros", "Orden, limpieza y baño",
    "Dirección", "Bocina", "Asientos", "Luces del salón de pasajeros"
  ],
  "Accesorios de Seguridad": [
    "Conos de seguridad (3)", "Extintor (pasillo y cabina)", "Gata hidráulica",
    "Chaleco reflectante", "Cuñas de seguridad (2)", "Botiquín", "Llave de rueda",
    "Barrote de llave rueda", "Tubo de fuerza (1 metro)", "Multiplicador de fuerza", "Triangulos de seguridad (2)"
  ],
  "Documentación": [
    "Revisión técnica", "Certificado de gases", "Permiso de Circulación",
    "SOAP (seguro obligatorio)", "Padrón (inscripción)", "Cartolas de recorrido",
    "Licencia de conducir", "Tarjeta SiB"
  ],
};

export default function ChecklistSection({ form, setForm, setImages }: ChecklistSectionProps) {
  const opciones = ["B", "M", "NA"];

  const handleCheckboxChange = (item: string, opcion: string) => {
    setForm((prevForm: FormData) => ({
      ...prevForm,
      checklist: { ...prevForm.checklist, [item]: opcion },
    }));
  };

  const handleFileChange = (item: string, file: File | null) => {
    setImages((prev: { [key: string]: File | null }) => ({
      ...prev,
      [item]: file,
    }));
  };

  return (
    <div className="container">
      {Object.entries(secciones).map(([titulo, items]) => (
        <div className="card mb-4" key={titulo}>
          <div className="card-header bg-primary text-white">
            {titulo}
          </div>
          <div className="card-body">
            <div className="row">
              {items.map((item: string) => (
                <div className="col-md-6 mb-3" key={item}>
                  <div className="border rounded p-3 h-100 shadow-sm">
                    <div className="fw-bold mb-2">{item}</div>
                    <div className="d-flex gap-3 mb-2">
                      {opciones.map(op => (
                        <div className="form-check form-check-inline" key={op}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={item}
                            value={op}
                            id={`${item}-${op}`}
                            checked={form.checklist[item] === op}
                            onChange={() => handleCheckboxChange(item, op)}
                          />
                          <label className="form-check-label" htmlFor={`${item}-${op}`}>
                            {op}
                          </label>
                        </div>
                      ))}
                    </div>
                    {form.checklist[item] === "M" && (
                      <div>
                        <label className="form-label">Adjuntar imagen:</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => handleFileChange(item, e.target.files?.[0] || null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
