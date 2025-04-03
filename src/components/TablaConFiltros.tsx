// components/TablaConFiltros.tsx
import { useState, useEffect } from "react";

interface Columna<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  datos: T[];
  columnas: Columna<T>[];
  elementosPorPagina?: number;
  onBuscar?: (texto: string, item: T) => boolean;
}

export default function TablaConFiltros<T>({ datos, columnas, elementosPorPagina = 10, onBuscar }: Props<T>) {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = onBuscar
    ? datos.filter(item => onBuscar(busqueda, item))
    : datos;

  const totalPaginas = Math.ceil(filtrados.length / elementosPorPagina);
  const paginaDatos = filtrados.slice(
    (pagina - 1) * elementosPorPagina,
    pagina * elementosPorPagina
  );

  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  return (
    <>
      {/* Filtro */}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-light">
            <tr>
              {columnas.map(col => (
                <th key={col.key as string}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginaDatos.map((item, i) => (
              <tr key={i}>
                {columnas.map(col => (
                  <td key={col.key as string}>
                    {col.render ? col.render(item) : String(item[col.key])}
                  </td>
                ))}
              </tr>
            ))}
            {paginaDatos.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="text-center">
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            <li className={`page-item ${pagina === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPagina(p => p - 1)}>Anterior</button>
            </li>
            {Array.from({ length: totalPaginas }, (_, i) => (
              <li key={i} className={`page-item ${pagina === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPagina(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${pagina === totalPaginas ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPagina(p => p + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
