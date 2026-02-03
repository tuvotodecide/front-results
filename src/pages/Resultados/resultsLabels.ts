export type ResultsElectionType =
  | "municipal"
  | "departamental"
  | "presidential"
  | "mayor"
  | "governor"
  | null
  | undefined;

export const getResultsLabels = (type: ResultsElectionType) => {
  if (type === "municipal" || type === "mayor") {
    return {
      primary: "Resultados Alcalde",
      secondary: "Resultados Concejales",
    };
  }

  if (type === "departamental" || type === "governor") {
    return {
      primary: "Resultados Gobernadores",
      secondary: "Resultados Asambleistas",
    };
  }

  return {
    primary: "Resultados Presidenciales",
    secondary: "Resultados Diputados",
  };
};
