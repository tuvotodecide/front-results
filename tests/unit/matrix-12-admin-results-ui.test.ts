import { describe, expect, it } from "vitest";
import { getDeterministicPartyColor, getPartyColor } from "@/legacy/resultados/partyColors";
import { getResultsLabels } from "@/legacy/resultados/resultsLabels";
import {
  resetResults,
  resultsSlice,
  setCurrentBallot,
  setCurrentTable,
  setFilterIds,
  setFilters,
  setQueryParamsResults,
} from "@/store/resultados/resultadosSlice";
import {
  FIVE_MINUTES_MS,
  isAnyElectionInAutoRefreshWindow,
  isElectionInAutoRefreshWindow,
} from "@/utils/electionAutoRefreshWindow";
import { buildGeneralResultsLink } from "@/utils/resultsGeneralLink";
import { buildResultsTableLink } from "@/utils/resultsTableLink";

const refreshElection = {
  votingStartDate: "2026-04-18T12:00:00.000Z",
  resultsStartDate: "2026-04-18T20:00:00.000Z",
};

const reducer = resultsSlice.reducer;

describe("MX-12 | Resultados administrativos y reportes | Frontend Admin", () => {
  it("[MX-12][RES-ACC-P0-001][UNITARIA] resuelve la ventana temporal administrativa en los límites configurados", () => {
    const opensAt = Date.parse("2026-04-18T11:00:00.000Z");
    const closesAt = Date.parse("2026-04-18T19:30:00.000Z");

    expect(isElectionInAutoRefreshWindow(refreshElection, opensAt - 1)).toBe(false);
    expect(isElectionInAutoRefreshWindow(refreshElection, opensAt)).toBe(true);
    expect(isElectionInAutoRefreshWindow(refreshElection, closesAt - 1)).toBe(true);
    expect(isElectionInAutoRefreshWindow(refreshElection, closesAt)).toBe(false);
  });

  it("[MX-12][RES-ACC-P0-002][UNITARIA] conserva el alcance territorial recibido al construir la consulta administrativa", () => {
    expect(
      buildGeneralResultsLink({
        electionId: "election-2026",
        electionType: "municipal",
        departmentId: "dep-lp",
        municipalityId: "mun-lp",
      }),
    ).toBe(
      "/resultados?electionId=election-2026&electionType=municipal&department=dep-lp&municipality=mun-lp",
    );
  });

  it("[MX-12][RES-ACC-P1-003][UNITARIA] restablece el estado administrativo sin conservar mesa, acta ni filtros previos", () => {
    let state = reducer(undefined, { type: "results/initial" });
    state = reducer(state, setCurrentTable("LP-001-01"));
    state = reducer(state, setCurrentBallot("ballot-1"));
    state = reducer(
      state,
      setFilters({
        department: "La Paz",
        province: "Murillo",
        municipality: "La Paz",
        electoralLocation: "Recinto Central",
        electoralSeat: "Asiento 1",
      }),
    );

    expect(reducer(state, resetResults())).toEqual(reducer(undefined, { type: "results/initial" }));
  });

  it("[MX-12][RES-SUM-P0-002][UNITARIA] distingue las etiquetas de resultado preliminar y final por tipo de elección", () => {
    expect(getResultsLabels("municipal")).toEqual({
      primary: "Resultados Alcalde",
      secondary: "Resultados Concejales",
    });
    expect(getResultsLabels("presidential")).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
  });

  it("[MX-12][RES-SUM-P0-003][UNITARIA] conserva el cero recibido al serializar la navegación del detalle", () => {
    expect(buildResultsTableLink("LP-001-00", { electionId: "election-2026" })).toBe(
      "/resultados/mesa/LP-001-00?electionId=election-2026",
    );
    expect(getDeterministicPartyColor("Partido sin votos")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("[MX-12][RES-SUM-P1-004][UNITARIA] usa el catálogo conocido y un color estable para partidos no catalogados", () => {
    expect(getPartyColor(" MAS-IPSP ")).toBe("#2245a9");
    expect(getDeterministicPartyColor("Partido nuevo")).toBe(
      getDeterministicPartyColor("partido nuevo"),
    );
  });

  it("[MX-12][RES-CAT-P0-001][UNITARIA] selecciona títulos principales y secundarios coherentes para municipal, departamental y presidencial", () => {
    expect(getResultsLabels("municipal").secondary).toBe("Resultados Concejales");
    expect(getResultsLabels("departamental").secondary).toBe(
      "Resultados Asambleísta por Territorio",
    );
    expect(getResultsLabels("presidential").secondary).toBe("Resultados Diputados");
  });

  it("[MX-12][RES-CAT-P1-002][UNITARIA] mantiene los paneles primario y secundario como categorías separadas", () => {
    const labels = getResultsLabels("departamental");

    expect(labels.primary).toBe("Resultados Gobernador");
    expect(labels.secondary).toBe("Resultados Asambleísta por Territorio");
    expect(labels.primary).not.toBe(labels.secondary);
  });

  it("[MX-12][RES-TER-P0-001][UNITARIA] mantiene los identificadores territoriales en el estado que consume la pantalla", () => {
    const state = reducer(
      reducer(undefined, { type: "results/initial" }),
      setFilterIds({
        departmentId: "dep-lp",
        provinceId: "prov-murillo",
        municipalityId: "mun-lp",
        electoralLocationId: "loc-central",
        electoralSeatId: "seat-1",
      }),
    );

    expect(state.filterIds).toEqual({
      departmentId: "dep-lp",
      provinceId: "prov-murillo",
      municipalityId: "mun-lp",
      electoralLocationId: "loc-central",
      electoralSeatId: "seat-1",
    });
  });

  it("[MX-12][RES-TER-P0-002][UNITARIA] no añade territorio administrativo cuando el enlace sólo recibe el alcance autorizado", () => {
    expect(
      buildGeneralResultsLink({
        electionId: "election-2026",
        departmentId: "dep-lp",
      }),
    ).toBe("/resultados?electionId=election-2026&department=dep-lp");
  });

  it("[MX-12][RES-TER-P1-003][UNITARIA] preserva el código de mesa al navegar desde un agregado territorial", () => {
    expect(
      buildResultsTableLink("LP-001-01", {
        electionId: "election-2026",
        electionType: "departamental",
      }),
    ).toBe("/resultados/mesa/LP-001-01?electionId=election-2026&electionType=departamental");
  });

  it("[MX-12][RES-MES-P1-004][UNITARIA] conserva mesa, elección y tipo al abrir el detalle contado", () => {
    expect(
      buildResultsTableLink("LP-001-01", {
        electionId: "election-2026",
        electionType: "municipal",
      }),
    ).toContain("electionId=election-2026");
    expect(buildResultsTableLink("LP-001-01", { electionType: "municipal" })).toContain(
      "electionType=municipal",
    );
  });

  it("[MX-12][RES-ACT-P0-001][UNITARIA] conserva el identificador de acta seleccionado en el estado de resultados", () => {
    const state = reducer(reducer(undefined, { type: "results/initial" }), setCurrentBallot("ballot-42"));

    expect(state.currentBallot).toBe("ballot-42");
  });

  it("[MX-12][RES-ACT-P0-002][UNITARIA] mantiene la referencia de mesa mientras se revisan versiones de acta", () => {
    const state = reducer(reducer(undefined, { type: "results/initial" }), setCurrentTable("LP-001-01"));

    expect(state.currentTable).toBe("LP-001-01");
  });

  it("[MX-12][RES-FIL-P1-001][UNITARIA] serializa sólo los filtros públicos que recibe la navegación", () => {
    const state = reducer(
      reducer(undefined, { type: "results/initial" }),
      setQueryParamsResults("electionId=election-2026&department=dep-lp&municipality=mun-lp"),
    );

    expect(state.queryParamsResults).toBe(
      "electionId=election-2026&department=dep-lp&municipality=mun-lp",
    );
  });

  it("[MX-12][RES-UPD-P1-002][UNITARIA] activa cinco minutos sólo dentro de la ventana y nunca con fechas inválidas", () => {
    expect(FIVE_MINUTES_MS).toBe(5 * 60 * 1000);
    expect(
      isElectionInAutoRefreshWindow(refreshElection, Date.parse("2026-04-18T12:00:00.000Z")),
    ).toBe(true);
    expect(
      isElectionInAutoRefreshWindow(
        { votingStartDate: "inválida", resultsStartDate: refreshElection.resultsStartDate },
        Date.parse("2026-04-18T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("[MX-12][RES-REP-P1-001][UNITARIA] conserva los filtros del reporte de actividad en el estado de resultados", () => {
    const state = reducer(
      reducer(undefined, { type: "results/initial" }),
      setFilters({
        department: "La Paz",
        province: "",
        municipality: "La Paz",
        electoralLocation: "",
        electoralSeat: "",
      }),
    );

    expect(state.filters.department).toBe("La Paz");
    expect(state.filters.municipality).toBe("La Paz");
  });

  it("[MX-12][RES-REP-P1-002][UNITARIA] conserva el contexto de contrato activo dentro del enlace administrativo", () => {
    expect(buildGeneralResultsLink({ electionId: "election-2026", departmentId: "dep-lp" })).toBe(
      "/resultados?electionId=election-2026&department=dep-lp",
    );
  });

  it("[MX-12][RES-REP-P1-003][UNITARIA] conserva la mesa relacionada para la navegación de auditoría", () => {
    const state = reducer(reducer(undefined, { type: "results/initial" }), setCurrentTable("LP-001-02"));

    expect(state.currentTable).toBe("LP-001-02");
  });

  it("[MX-12][RES-CON-P1-003][UNITARIA] no crea estado adicional cuando se reitera la misma consulta", () => {
    const initial = reducer(undefined, { type: "results/initial" });
    const first = reducer(initial, setQueryParamsResults("electionId=election-2026"));
    const repeated = reducer(first, setQueryParamsResults("electionId=election-2026"));

    expect(repeated).toEqual(first);
  });

  it("[MX-12][RES-SEC-P0-001][UNITARIA] no inventa parámetros territoriales al construir una URL sin alcance", () => {
    expect(buildGeneralResultsLink({ electionId: "election-2026" })).toBe(
      "/resultados?electionId=election-2026",
    );
  });

  it("[MX-12][RES-SEC-P0-002][UNITARIA] no transforma un identificador de acta en información personal", () => {
    expect(buildResultsTableLink("LP-001-01", { electionId: "election-2026" })).not.toContain(
      "dni",
    );
    expect(buildResultsTableLink("LP-001-01", { electionId: "election-2026" })).not.toContain(
      "token",
    );
  });

  it("[MX-12][RES-TRA-P1-003][UNITARIA] mantiene el identificador de la fuente disponible al navegar a su mesa", () => {
    expect(buildResultsTableLink("LP-001-01")).toBe("/resultados/mesa/LP-001-01");
  });

  it("[MX-12][RES-UX-P2-001][UNITARIA] reconoce una elección actualizable sin alterar el orden de navegación", () => {
    expect(
      isAnyElectionInAutoRefreshWindow(
        [
          { votingStartDate: "2026-04-18T02:00:00.000Z", resultsStartDate: "2026-04-18T03:00:00.000Z" },
          refreshElection,
        ],
        Date.parse("2026-04-18T12:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
