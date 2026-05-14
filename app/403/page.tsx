export default function Forbidden() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">
          Acceso denegado
        </h1>
        <p className="text-zinc-600 mt-2">
          No tienes permisos para ver esta sección.
        </p>
      </div>
    </div>
  );
}