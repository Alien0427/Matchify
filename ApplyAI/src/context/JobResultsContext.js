"use client";
import { createContext, useState } from 'react';

export const JobResultsContext = createContext({
  jobResults: null,
  setJobResults: () => {},
});

export function JobResultsProvider({ children }) {
  const [jobResults, setJobResults] = useState(null);
  return (
    <JobResultsContext.Provider value={{ jobResults, setJobResults }}>
      {children}
    </JobResultsContext.Provider>
  );
} 