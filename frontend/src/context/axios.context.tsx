import axios, { AxiosInstance } from 'axios';
import { ConfigContext, configObj } from './config.context';
import React, { createContext, useContext } from 'react';

export const axiosClient = axios.create({
    baseURL: configObj.API_HOST,
});

export const AxiosContext = createContext(axiosClient);
export const useAxios = () => useContext(AxiosContext);

export interface AxiosProviderProps {
    value?: AxiosInstance;
}

export const AxiosProvider: React.FC<AxiosProviderProps> = ({ children, value }) => (
    <AxiosContext.Provider value={value || axiosClient}>{children}</AxiosContext.Provider>
);
