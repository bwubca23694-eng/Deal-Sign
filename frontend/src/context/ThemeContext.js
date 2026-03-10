import React, { createContext, useContext } from 'react';

// Dark theme removed — light only
const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={{ theme: 'light', toggle: () => {} }}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
