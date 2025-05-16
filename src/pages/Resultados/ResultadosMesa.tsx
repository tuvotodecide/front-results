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
      <div className="">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Search Input */}
          <div className="mb-8">
            <Formik
              initialValues={{ searchTerm: "" }}
              validationSchema={Yup.object({
                searchTerm: Yup.string().required("Ingrese un número de mesa"),
              })}
              onSubmit={handleSearch}
            >
              {({ errors, touched }) => (
                <Form>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <div className="flex-1">
                      <Field
                        name="searchTerm"
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese el número de mesa..."
                      />
                      {errors.searchTerm && touched.searchTerm && (
                        <div className="text-red-500 text-sm mt-1">
                          {errors.searchTerm}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>{" "}
          {/* Ballot Details */}
          {ballotData ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Mesa {ballotData.tableNumber}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Section */}
                <div className="relative bg-gray-50 rounded-lg overflow-hidden min-h-[300px] border border-gray-200">
                  {ballotData.imageUrl ? (
                    <>
                      <img
                        src={ballotData.imageUrl}
                        alt={`Acta de la mesa ${ballotData.tableNumber}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setIsImageModalOpen(true)}
                      />
                      <ModalImage
                        isOpen={isImageModalOpen}
                        onClose={() => setIsImageModalOpen(false)}
                        imageUrl={ballotData.imageUrl}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full p-6 text-gray-500">
                      <p>No hay imagen disponible para esta acta</p>
                    </div>
                  )}
                </div>

                {/* Transcription Section */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Ultima actualización
                      </p>
                      <p className="font-medium">{ballotData.lastUpdated}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Actas contabilizadas
                      </p>
                      <p className="font-medium">{ballotData.ballotCount}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Votos válidos</p>
                      <p className="font-medium">
                        {ballotData.votes?.validVotes}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Votos en blanco</p>
                      <p className="font-medium">
                        {ballotData.votes?.blankVotes}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Votos nulos</p>
                      <p className="font-medium">
                        {ballotData.votes?.nullVotes}
                      </p>
                    </div>
                  </div>

                  {/* Party Votes */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Votos por partido
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="w-2/3 px-6 py-3 text-sm font-semibold text-gray-500 text-left border-b border-gray-200">
                              Partido
                            </th>
                            <th className="w-1/3 px-6 py-3 text-sm font-semibold text-gray-500 text-right border-b border-gray-200">
                              Total Votos
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ballotData.votes?.partyVotes.map((party) => (
                            <tr key={party._id} className="hover:bg-gray-50">
                              <td className="w-2/3 px-6 py-4 text-sm text-gray-500 text-left border-b border-gray-200">
                                Partido {party.partyId}
                              </td>
                              <td className="w-1/3 px-6 py-4 font-medium text-right border-b border-gray-200">
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
            <p className="text-gray-500 text-center py-4">
              Ingrese un número de mesa para ver sus detalles
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultadosMesa;
