"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

export default function GestionVehiculos() {
  interface Vehiculo {
    id: string;
    numero_interno: string;
    marca: string;
    modelo: string;
    patente: string;
    color: string;
    ano: string;
  }
  
  const [vehiculo, setVehiculo] = useState<Omit<Vehiculo, "id">>({
    numero_interno: "",
    marca: "",
    modelo: "",
    patente: "",
    color: "",
    ano: ""
  });
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoEditando, setVehiculoEditando] = useState<Vehiculo | null>(null);

  const [mostrarToast, setMostrarToast] = useState(false);

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    const snapshot = await getDocs(collection(db, "vehiculos"));
    setVehiculos(snapshot.docs.map(doc => ({
      id: doc.id,
      numero_interno: doc.data().numero_interno || "",
      marca: doc.data().marca || "",
      modelo: doc.data().modelo || "",
      patente: doc.data().patente || "",
      color: doc.data().color || "",
      ano: doc.data().ano || ""
    })));
  };

  const agregarVehiculo = async () => {
    await addDoc(collection(db, "vehiculos"), vehiculo);
    setVehiculo({ numero_interno: "", marca: "", modelo: "", patente: "", color: "", ano: "" });
    await cargarVehiculos();
  };

  const actualizarVehiculo = async () => {
    if (!vehiculoEditando) return;
    await updateDoc(doc(db, "vehiculos", vehiculoEditando.id), {
      numero_interno: vehiculoEditando.numero_interno,
      marca: vehiculoEditando.marca,
      modelo: vehiculoEditando.modelo,
      patente: vehiculoEditando.patente,
      color: vehiculoEditando.color,
      ano: vehiculoEditando.ano,
    });
    setVehiculoEditando(null);
    setMostrarToast(true);
    await cargarVehiculos();
    setTimeout(() => setMostrarToast(false), 3000);
  };

  return (
    <div className="container py-4">
      <h2 className="text-center">Gestión de Vehículos 🚗</h2>

      {/* Formulario de Agregar */}
      <div className="card p-4 mb-4">
        <h5>Agregar Vehículo</h5>
        {["numero_interno", "marca", "modelo", "patente", "color", "ano"].map(campo => (
          <input key={campo}
            className="form-control mb-2"
            placeholder={campo.replace("_", " ").toUpperCase()}
            value={vehiculo[campo as keyof typeof vehiculo]}
            onChange={(e) => setVehiculo({ ...vehiculo, [campo]: e.target.value })}
          />
        ))}
        <button className="btn btn-primary" onClick={agregarVehiculo}>Agregar Vehículo</button>
      </div>

      {/* Tabla de Vehículos */}
      <div className="card p-4">
        <h5>Vehículos Registrados</h5>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>N° Interno</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Patente</th>
              <th>Color</th>
              <th>Año</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map(v => (
              <tr key={v.id}>
                <td>{v.numero_interno}</td>
                <td>{v.marca}</td>
                <td>{v.modelo}</td>
                <td>{v.patente}</td>
                <td>{v.color}</td>
                <td>{v.ano}</td>
                <td>
                  <button className="btn btn-sm btn-warning" onClick={() => setVehiculoEditando(v)}>Modificar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {vehiculoEditando && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Vehículo</h5>
                <button type="button" className="btn-close" onClick={() => setVehiculoEditando(null)}></button>
              </div>
              <div className="modal-body">
                {["numero_interno", "marca", "modelo", "patente", "color", "ano"].map(campo => (
                  <input key={campo}
                    className="form-control mb-2"
                    placeholder={campo.replace("_", " ").toUpperCase()}
                    value={vehiculoEditando[campo as keyof typeof vehiculoEditando]}

                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, [campo]: e.target.value })}
                  />
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setVehiculoEditando(null)}>Cancelar</button>
                <button
  className="btn btn-primary"
  onClick={() => actualizarVehiculo()}
>
  Guardar Cambios
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de éxito */}
      {mostrarToast && (
        <div className="toast-container position-fixed top-0 end-0 p-3">
          <div className="toast show bg-success text-white">
            <div className="toast-body">Vehículo actualizado correctamente ✅</div>
          </div>
        </div>
      )}
    </div>
  );
}
