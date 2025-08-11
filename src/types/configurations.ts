// Base interface for creating a configuration (without server-generated fields)
export interface CreateConfigurationType {
  name: string;
  votingStartDate: string;
  votingEndDate: string;
  resultsStartDate: string;
  allowDataModification: boolean;
}

// Interface for updating a configuration (partial fields, excluding server-generated ones)
export interface UpdateConfigurationType {
  name: string;
  votingStartDate: string;
  votingEndDate: string;
  resultsStartDate: string;
  allowDataModification: boolean;
  isActive?: boolean;
}

// Full interface for configuration data from the server (with all server-generated fields)
export interface ConfigurationType {
  id: string;
  name: string;
  votingStartDate: string;
  votingEndDate: string;
  resultsStartDate: string;
  votingStartDateBolivia: string;
  votingEndDateBolivia: string;
  resultsStartDateBolivia: string;
  isActive: boolean;
  allowDataModification: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
