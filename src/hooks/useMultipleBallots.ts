import { useEffect, useState } from 'react';
import { useLazyGetBallotQuery } from '../store/ballots/ballotsEndpoints';
import { BallotType } from '../types';

interface UseMultipleBallotsResult {
  ballots: BallotType[];
  loading: boolean;
  error: boolean;
}

export const useMultipleBallots = (ballotIds: string[]): UseMultipleBallotsResult => {
  const [ballots, setBallots] = useState<BallotType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [getBallot] = useLazyGetBallotQuery();

  useEffect(() => {
    if (ballotIds.length === 0) {
      setBallots([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    setBallots([]);

    // Fetch ballots sequentially to avoid too many concurrent requests
    const fetchBallots = async () => {
      const fetchedBallots: BallotType[] = [];
      
      try {
        for (const ballotId of ballotIds) {
          try {
            const result = await getBallot(ballotId).unwrap();
            fetchedBallots.push(result);
          } catch (err) {
            console.warn(`Failed to fetch ballot ${ballotId}:`, err);
            // Continue with other ballots even if one fails
          }
        }
        
        setBallots(fetchedBallots);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ballots:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchBallots();
  }, [ballotIds.join(','), getBallot]);

  return { ballots, loading, error };
};