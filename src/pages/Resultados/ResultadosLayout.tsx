import {
  ChartBarIcon,
  UserGroupIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Link, Outlet } from "react-router-dom";

const ResultadosLayout = () => {
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-600 border-b border-gray-600 pb-4">
        Resultados Electorales
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/resultados/participacion">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg cursor-pointer transition">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
              <h3 className="ml-3 text-lg font-semibold text-gray-700">
                Participación
              </h3>
            </div>
          </div>
        </Link>
        <Link to="/resultados/generales">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg cursor-pointer transition">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
              <h3 className="ml-3 text-lg font-semibold text-gray-700">
                Resultados Generales
              </h3>
            </div>
          </div>
        </Link>
        <Link to="/resultados/localidad">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg cursor-pointer transition">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-blue-500" />
              <h3 className="ml-3 text-lg font-semibold text-gray-700">
                Resultados por Localidad
              </h3>
            </div>
          </div>
        </Link>
      </div>
      <Outlet />
    </div>
  );
};

export default ResultadosLayout;
