import { FormData } from "../PageContent";

interface VehicleProps {
  vehiculo: FormData["vehiculo"];
}

export default function VehicleInfo({ vehiculo }: VehicleProps) {
  if (!vehiculo.marca) return null;

  return (
    <div className="card-body">
      <h5>Datos del Vehículo:</h5>
      <p><strong>Marca:</strong> {vehiculo.marca}</p>
      <p><strong>Modelo:</strong> {vehiculo.modelo}</p>
      <p><strong>Patente:</strong> {vehiculo.patente}</p>
      <p><strong>Año:</strong> {vehiculo.ano}</p>
      <p><strong>Color:</strong> {vehiculo.color}</p>
    </div>
  );
}
