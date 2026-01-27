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

// Election type with period flags
export interface ElectionStatusType extends ConfigurationType {
  type: 'municipal' | 'departamental' | 'presidential';
  round: number;
  isVotingPeriod: boolean;
  isResultsPeriod: boolean;
}

// Interface for configuration status response from the server
export interface ConfigurationStatusType {
  hasActiveConfigs: boolean;
  currentTime: string;
  currentTimeBolivia: string;
  elections: ElectionStatusType[];
  // Legacy single config support (backward compatibility)
  isVotingPeriod?: boolean;
  isResultsPeriod?: boolean;
  hasActiveConfig?: boolean;
  config?: ConfigurationType;
}
