import { FormData } from "../page";

interface ChecklistSectionProps {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
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
    "Barrote de llave rueda", "Tubo de fuerza (1 metro)", "Multiplicador de fuerza"
  ],
  "Documentación": [
    "Revisión técnica", "Certificado de gases", "Permiso de Circulación", 
    "SOAP (seguro obligatorio)", "Padrón (inscripción)", "Cartolas de recorrido", 
    "Licencia de conducir", "Tarjeta SiB"
  ],
};

export default function ChecklistSection({ form, setForm }: ChecklistSectionProps) {
  const opciones = ["B", "M", "NA"];

  const handleCheckboxChange = (item: string, opcion: string) => {
    setForm(prevForm => ({
      ...prevForm,
      checklist: { ...prevForm.checklist, [item]: opcion },
    }));
  };

  return (
    <div>
      {Object.entries(secciones).map(([titulo, items]) => (
        <div className="card mb-4" key={titulo}>
          <div className="card-header bg-primary text-white">{titulo}</div>
          <div className="card-body">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Ítem</th>
                  {opciones.map(op => <th key={op} className="text-center">{op}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item}>
                    <td>{item}</td>
                    {opciones.map(op => (
                      <td key={op} className="text-center">
                        <input
                          type="radio"
                          name={item}
                          value={op}
                          checked={form.checklist[item] === op}
                          onChange={() => handleCheckboxChange(item, op)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
