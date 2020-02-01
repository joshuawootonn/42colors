import React, { createContext, useContext } from 'react';
require('dotenv').config();

export interface ConfigContext {
    API_HOST: string;
}

export const configObj: ConfigContext = {
    API_HOST: process.env.REACT_APP_API_HOST || '',
};

const ConfigContext = createContext(configObj);
export const useConfig = () => useContext(ConfigContext);

interface ConfigProviderProps {
    value?: ConfigContext;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children, value }) => (
    <ConfigContext.Provider value={value || configObj}>{children}</ConfigContext.Provider>
);
