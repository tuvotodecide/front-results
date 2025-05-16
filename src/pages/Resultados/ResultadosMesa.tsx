import { useState } from "react";
import { Formik, Form, Field } from "formik";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import * as Yup from "yup";
import { useLazyGetResultsByTableNumberQuery } from "../../store/resultados/resultadosEndpoints";

interface SearchResult {
  tableNumber: string;
  lastUpdated: string;
  ballotCount: number;
  processingStatus: object;
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

  const handleSearch = async (values: { searchTerm: string }) => {
    getResultsByTableNumber(values.searchTerm)
      .unwrap()
      .then((res) => {
        console.log("Search results:", res);
        setBallotData(res);
      })
      .catch((err) => {
        console.error("Error fetching results:", err);
        setBallotData(null);
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
          </div>

          {/* Ballot Details */}
          {ballotData ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Mesa {ballotData.tableNumber}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Ultima actualización</p>
                  <p className="font-medium">{ballotData.lastUpdated}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Actas contabilizadas</p>
                  <p className="font-medium">{ballotData.ballotCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Votos válidos</p>
                  <p className="font-medium">{ballotData.votes?.validVotes}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Votos en blanco</p>
                  <p className="font-medium">{ballotData.votes?.blankVotes}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Votos nulos</p>
                  <p className="font-medium">{ballotData.votes?.nullVotes}</p>
                </div>
              </div>

              {/* Party Votes */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Votos por partido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ballotData.votes?.partyVotes.map((partyVote) => (
                    <div
                      key={partyVote._id}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <p className="text-sm text-gray-500">
                        Partido {partyVote.partyId}
                      </p>
                      <p className="font-medium">{partyVote.votes}</p>
                    </div>
                  ))}
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
