"use client";

import { useState } from "react";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Gestion() {
  const [vehiculo, setVehiculo] = useState({ numero_interno: "", marca: "", modelo: "", patente: "" });
  const [conductor, setConductor] = useState("");

  const agregarVehiculo = async () => {
    await addDoc(collection(db, "vehiculos"), vehiculo);
    alert("Vehículo agregado");
    setVehiculo({ numero_interno: "", marca: "", modelo: "", patente: "" });
  };

  const agregarConductor = async () => {
    await addDoc(collection(db, "conductores"), { nombre: conductor });
    alert("Conductor agregado");
    setConductor("");
  };

  return (
    <div className="container py-5">
      <h2 className="text-center">Gestión de Vehículos y Conductores 🚗</h2>
      
      <div className="card p-4 mb-4">
        <h5>Agregar Vehículo</h5>
        <input className="form-control mb-2" placeholder="Número Interno" value={vehiculo.numero_interno} onChange={(e) => setVehiculo({ ...vehiculo, numero_interno: e.target.value })} />
        <input className="form-control mb-2" placeholder="Marca" value={vehiculo.marca} onChange={(e) => setVehiculo({ ...vehiculo, marca: e.target.value })} />
        <input className="form-control mb-2" placeholder="Modelo" value={vehiculo.modelo} onChange={(e) => setVehiculo({ ...vehiculo, modelo: e.target.value })} />
        <input className="form-control mb-2" placeholder="Patente" value={vehiculo.patente} onChange={(e) => setVehiculo({ ...vehiculo, patente: e.target.value })} />
        <button className="btn btn-primary" onClick={agregarVehiculo}>Agregar Vehículo</button>
      </div>

      <div className="card p-4">
        <h5>Agregar Conductor</h5>
        <input className="form-control mb-2" placeholder="Nombre del Conductor" value={conductor} onChange={(e) => setConductor(e.target.value)} />
        <button className="btn btn-primary" onClick={agregarConductor}>Agregar Conductor</button>
      </div>
    </div>
  );
}
