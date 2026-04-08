
import { useSelector } from "react-redux";
import { useGetProfileQuery } from "../../store/auth/authEndpoints";
import { selectAuth } from "../../store/auth/authSlice";


export default function Perfil() {
  const { token, user } = useSelector(selectAuth);

  // opcional: refrescar al entrar
  const { data, isLoading } = useGetProfileQuery(undefined, { skip: !token });

  const u = data || user;

  if (!token) return null;
  if (isLoading && !u) return <div className="p-6">Cargando...</div>;
  if (!u) return <div className="p-6">Sin datos de perfil.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mi perfil</h1>

      <div className="bg-white border rounded-lg p-4 space-y-2">
        <div><b>Nombre:</b> {u.name}</div>
        <div><b>Email:</b> {u.email}</div>
        <div><b>Rol:</b> {u.role}</div>
        <div><b>Status:</b> {u.status ?? (u.active ? "ACTIVE" : "PENDING")}</div>

        <hr className="my-3" />

        <div><b>DepartmentId:</b> {u.departmentId || "—"}</div>
        <div><b>DepartmentName:</b> {u.departmentName || "—"}</div>
        <div><b>MunicipalityId:</b> {u.municipalityId || "—"}</div>
        <div><b>MunicipalityName:</b> {u.municipalityName || "—"}</div>
      </div>
    </div>
  );
}
