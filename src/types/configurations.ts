// Election types accepted by the backend (ElectionType enum in back-results)
export type ElectionConfigType =
  | 'presidential'
  | 'departamental'
  | 'municipal'
  | 'referendum'
  | 'congress'
  | 'parlacen';

export type ElectionConfigRound = 1 | 2;

// Base interface for creating a configuration (without server-generated fields)
export interface CreateConfigurationType {
  name: string;
  votingStartDate: string;
  votingEndDate: string;
  resultsStartDate: string;
  allowDataModification: boolean;
  type?: ElectionConfigType;
  round?: ElectionConfigRound;
}

// Interface for updating a configuration (partial fields, excluding server-generated ones)
export interface UpdateConfigurationType {
  name: string;
  votingStartDate: string;
  votingEndDate: string;
  resultsStartDate: string;
  allowDataModification: boolean;
  isActive?: boolean;
  type?: ElectionConfigType;
  round?: ElectionConfigRound;
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
  type?: ElectionConfigType;
  round?: number;
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
