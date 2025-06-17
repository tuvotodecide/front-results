import { useState } from "react";
import { Formik, Form, Field } from "formik";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import * as Yup from "yup";
import { useLazyGetResultsByTableNumberQuery } from "../../store/resultados/resultadosEndpoints";
import ModalImage from "../../components/ModalImage";

interface SearchResult {
  tableNumber: string;
  lastUpdated: string;
  ballotCount: number;
  processingStatus: object;
  imageUrl?: string; // Add this line
  votes: {
    validVotes: number;
    nullVotes: number;
    blankVotes: number;
    partyVotes: Array<{
      partyId: string;
      _id: string;
      votes: number;
    }>;
  };
}

const ResultadosMesa = () => {
  const [getResultsByTableNumber] = useLazyGetResultsByTableNumberQuery();
  const [ballotData, setBallotData] = useState<SearchResult | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleSearch = async (values: { searchTerm: string }) => {
    getResultsByTableNumber(values.searchTerm)
      .unwrap()
      .then((res) => {
        console.log("Search results:", res);
        const newRes = {
          ...res,
          imageUrl:
            "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1xw:0.74975xh;0,0.190xh&resize=1200:*",
        };
        setBallotData(newRes);
      })
      .catch((err) => {
        console.error("Error fetching results:", err);
        setBallotData(null);
      });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8">
        {/* Search Input */}
        <div className="mb-10 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Resultados por Mesa
          </h1>
          <Formik
            initialValues={{ searchTerm: "" }}
            validationSchema={Yup.object({
              searchTerm: Yup.string().required("Ingrese un número de mesa"),
            })}
            onSubmit={handleSearch}
          >
            {({ errors, touched }) => (
              <Form>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Field
                      name="searchTerm"
                      type="text"
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      placeholder="Ingrese el número de mesa..."
                    />
                    {errors.searchTerm && touched.searchTerm && (
                      <div className="absolute -bottom-6 left-0 text-red-500 text-sm">
                        {errors.searchTerm}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Ballot Details */}
        {ballotData ? (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Mesa {ballotData.tableNumber}
              </h2>
              <span className="text-sm text-gray-500">
                Última actualización: {ballotData.lastUpdated}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="relative bg-white rounded-xl overflow-hidden shadow-md transition-transform duration-300 hover:scale-[1.02] border border-gray-100">
                {ballotData.imageUrl ? (
                  <>
                    <img
                      src={ballotData.imageUrl}
                      alt={`Acta de la mesa ${ballotData.tableNumber}`}
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setIsImageModalOpen(true)}
                    />
                    <ModalImage
                      isOpen={isImageModalOpen}
                      onClose={() => setIsImageModalOpen(false)}
                      imageUrl={ballotData.imageUrl}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[400px] bg-gray-50">
                    <p className="text-gray-400 text-lg">
                      No hay imagen disponible
                    </p>
                  </div>
                )}
              </div>

              {/* Transcription Section */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Actas contabilizadas
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {ballotData.ballotCount}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Votos válidos
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {ballotData.votes?.validVotes}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Votos en blanco
                    </p>
                    <p className="text-2xl font-bold text-gray-600">
                      {ballotData.votes?.blankVotes}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Votos nulos
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {ballotData.votes?.nullVotes}
                    </p>
                  </div>
                </div>

                {/* Party Votes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                      Votos por partido
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="w-2/3 px-6 py-4 text-sm font-semibold text-gray-600 text-left">
                            Partido
                          </th>
                          <th className="w-1/3 px-6 py-4 text-sm font-semibold text-gray-600 text-right">
                            Total Votos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ballotData.votes?.partyVotes.map((party) => (
                          <tr
                            key={party._id}
                            className="transition-colors duration-200 hover:bg-blue-50/50"
                          >
                            <td className="w-2/3 px-6 py-4 text-sm text-gray-600 text-left border-t border-gray-100">
                              <span className="font-medium">
                                Partido {party.partyId}
                              </span>
                            </td>
                            <td className="w-1/3 px-6 py-4 text-lg font-semibold text-right border-t border-gray-100">
                              {party.votes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Ingrese un número de mesa para ver sus detalles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosMesa;
