import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetConfigurationsQuery,
  useGetConfigurationStatusQuery,
} from "../store/configurations/configurationsEndpoints";
import { RootState } from "../store";
import {
  hydrateElectionFromStorage,
  setSelectedElection,
} from "../store/election/electionSlice";

export default function ElectionSelector() {
  const dispatch = useDispatch();
  const { data: configs } = useGetConfigurationsQuery();
  const { data: status } = useGetConfigurationStatusQuery();
  const selectedId = useSelector(
    (s: RootState) => s.election.selectedElectionId
  );

  useEffect(() => {
    dispatch(hydrateElectionFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId && status?.config?.id) {
      dispatch(
        setSelectedElection({ id: status.config.id, name: status.config.name })
      );
    }
  }, [dispatch, selectedId, status]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    const name = configs?.find((c) => c.id === id)?.name ?? null;
    dispatch(setSelectedElection({ id, name }));
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-gray-600">Elección:</span>
      <select
        value={selectedId ?? ""}
        onChange={onChange}
        className="border rounded px-2 py-1 text-sm  w-auto"
      >
        {status?.config?.id && (
          <option value={status.config.id}>
            {status.config.name} (activa)
          </option>
        )}
        {configs?.map((cfg) => (
          <option key={cfg.id} value={cfg.id}>
            {cfg.name}
          </option>
        ))}
        <option value="">(usar activa)</option>
      </select>
    </div>
  );
}
