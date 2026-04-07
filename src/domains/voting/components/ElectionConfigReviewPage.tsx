"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActivatedSuccessModal from "@/features/electionConfig/components/ActivatedSuccessModal";
import BallotPreview from "@/features/electionConfig/components/BallotPreview";
import ConfigPageFallback from "@/features/electionConfig/components/ConfigPageFallback";
import ConfigSummaryCard from "@/features/electionConfig/components/ConfigSummaryCard";
import ConfirmActivateModal from "@/features/electionConfig/components/ConfirmActivateModal";
import PhoneMockup from "@/features/electionConfig/components/PhoneMockup";
import ScheduleSummaryCard from "@/features/electionConfig/components/ScheduleSummaryCard";
import { useElectionPublish } from "@/features/electionConfig/data/useElectionPublish";
import { buildElectionConfigPath, hasDraftAlreadyStarted } from "@/domains/voting/lib/electionConfig";
import { useWallet } from "@/hooks/useWallet";
import Modal2 from "@/components/Modal2";

const isTxCanceled = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  (error as { message?: string }).message === "tx_canceled";

export default function ElectionConfigReviewPage({
  electionId,
}: Readonly<{ electionId: string }>) {
  const router = useRouter();
  const actualElectionId = electionId || "";
  const {
    connectionState,
    transactionState,
    connectWallet,
    callCreateVoting,
    resetTransactionState,
  } = useWallet();
  const {
    votingEvent,
    ballotPreview,
    configSummary,
    loading,
    activateElection,
    activating,
    activationResult,
    copyToClipboard,
    refetch,
  } = useElectionPublish(actualElectionId);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const isReadyToPublish = configSummary
    ? configSummary.positionsOk && configSummary.partiesOk && configSummary.padronOk
    : false;

  const renderButtonText = () => {
    switch (connectionState) {
      case "disconnected":
        return "Conectarse a MetaMask para publicar";
      case "connecting":
        return "Conectando...";
      case "notInstalled":
        return "Instale la extensión MetaMask para publicar";
      case "connected":
        return "Confirmar y activar";
      default:
        return "Conectarse a MetaMask para publicar";
    }
  };

  const isPublishButtonDisabled = () =>
    !isReadyToPublish ||
    connectionState === "connecting" ||
    connectionState === "notInstalled" ||
    activating ||
    transactionState === "pending";

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (hasDraftAlreadyStarted(votingEvent)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe publicarse ni seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="py-8 flex-1">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-700 text-center mb-8">
            Así verán los votantes las papeletas. Revisa antes de publicar.
          </h1>

          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            <div className="w-full lg:w-auto flex flex-col items-center">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white">
                  Vista previa móvil
                </span>
              </div>
              <PhoneMockup>
                <BallotPreview parties={ballotPreview?.parties || []} />
              </PhoneMockup>
            </div>

            <div className="w-full lg:w-80 order-first lg:order-last space-y-4">
              {configSummary && <ConfigSummaryCard summary={configSummary} />}
              <ScheduleSummaryCard
                votingStart={votingEvent?.votingStart}
                votingEnd={votingEvent?.votingEnd}
                resultsPublishAt={votingEvent?.resultsPublishAt}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push(buildElectionConfigPath(actualElectionId, "cargos"))}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver a editar
            </button>

            <div className="w-full sm:w-auto text-center sm:text-right">
              <button
                type="button"
                onClick={
                  connectionState === "disconnected"
                    ? connectWallet
                    : () => setShowConfirmModal(true)
                }
                disabled={isPublishButtonDisabled()}
                className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-all ${
                  !isPublishButtonDisabled()
                    ? "bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {renderButtonText()}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Al activar, la votación será visible para votantes según horarios.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActivateModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          try {
            if (!votingEvent || !configSummary?.votersCount) {
              throw new Error("Could not load voting event data");
            }
            const nullifiers = await callCreateVoting(votingEvent, configSummary.votersCount);
            await activateElection(nullifiers);
            setShowConfirmModal(false);
            setShowSuccessModal(true);
          } catch (error: unknown) {
            setShowConfirmModal(false);
            if (isTxCanceled(error)) {
              return;
            }
            console.error("Error activating election:", error);
          }
        }}
        isLoading={activating || transactionState === "pending"}
      />

      <ActivatedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/elections");
        }}
        publicUrl={activationResult?.publicUrl || ""}
        shareText={activationResult?.shareText || ""}
        onCopyLink={copyToClipboard}
      />

      <Modal2
        isOpen={transactionState === "canceled"}
        onClose={resetTransactionState}
        title="Operación cancelada"
        type="info"
        showClose
        closeOnEscape
      >
        Operación cancelada por el usuario. No se ha publicado la votación.
      </Modal2>

      <Modal2
        isOpen={transactionState === "error"}
        onClose={resetTransactionState}
        title="Operación fallida"
        type="error"
        showClose
        closeOnEscape
      >
        Operación fallida. No se ha publicado la votación. Intenta nuevamente o contacta al soporte si el problema persiste.
      </Modal2>
    </div>
  );
}
