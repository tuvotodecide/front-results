import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../store/auth/authSlice';
import { useGetMyActiveContractQuery } from '../store/reports/clientReportEndpoints';

export function useMyContract() {
  const { user, token } = useSelector(selectAuth);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    setShouldFetch(
      !!token && !!user && (user.role === 'MAYOR' || user.role === 'GOVERNOR')
    );
  }, [token, user]);

  const { data, isLoading, isError } = useGetMyActiveContractQuery(
    {},
    { skip: !shouldFetch }
  );

  return {
    hasContract: data?.hasContract ?? false,
    contract: data?.contract ?? null,
    isLoading,
    isError,
    shouldFetch,
  };
}