import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReturnToState {
  returnTo?: string;
}

export const useBackToList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const buildReturnTo = useCallback(() => {
    return `${location.pathname}${location.search}`;
  }, [location.pathname, location.search]);

  const goBackToList = useCallback(
    (fallbackPath: string) => {
      const state = (location.state as ReturnToState | null) || null;
      const returnTo = state?.returnTo;

      if (returnTo && typeof returnTo === 'string') {
        navigate(returnTo);
        return;
      }

      navigate(fallbackPath);
    },
    [location.state, navigate],
  );

  return {
    buildReturnTo,
    goBackToList,
  };
};
