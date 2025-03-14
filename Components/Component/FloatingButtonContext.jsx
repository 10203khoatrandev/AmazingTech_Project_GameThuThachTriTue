import React, { createContext, useState } from 'react';

export const FloatingButtonContext = createContext();

export const FloatingButtonProvider = ({ children }) => {
  const [createdRoom, setCreatedRoom] = useState(null);

  return (
    <FloatingButtonContext.Provider value={{ createdRoom, setCreatedRoom }}>
      {children}
    </FloatingButtonContext.Provider>
  );
};