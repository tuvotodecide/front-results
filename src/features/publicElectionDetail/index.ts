// Exports para la feature de detalle de elección pública

export { default as PublicElectionDetailPage } from './PublicElectionDetailPage';
export { publicElectionRepository } from './data/PublicElectionRepository.mock';
export type {
  PublicElectionStatus,
  Candidate,
  ElectionSchedule,
  ElectionResults,
  PublicElectionDetail,
  IPublicElectionRepository,
} from './types';
