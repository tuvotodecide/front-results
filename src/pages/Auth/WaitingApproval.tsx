import React from "react";
import { Link } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";

const WaitingApproval: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img src={tuvotoDecideImage} alt="Logo" className="h-20 w-auto mb-6" />
          
          {/* Icono de Reloj / Espera */}
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#459151" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Registro exitoso</h1>
          <p className="text-[#459151] font-semibold text-lg mb-4">En espera de aprobación</p>
          
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              Tu solicitud ha sido enviada correctamente. Un administrador revisará tus datos para activar tu cuenta.
            </p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 italic">
              Recibirás un mensaje una vez que tu acceso sea autorizado.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <Link
            to="/"
            style={{ backgroundColor: "#459151" }}
            className="block w-full text-white font-bold py-3 rounded-xl transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WaitingApproval;