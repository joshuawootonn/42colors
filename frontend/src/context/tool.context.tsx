import React, { createContext, useContext, useState } from 'react';

export type Tool = 'brush' | 'eraser';
export interface ToolContext {
    toolType: Tool;
    setToolType: (tool: Tool) => void;
}

export const initialToolContext: ToolContext = {
    toolType: 'brush',
    setToolType: () => console.log('Tool context not initialized yet :('),
};

const ToolContext = createContext(initialToolContext);
export const useTool = () => useContext(ToolContext);

export const ToolsProvider: React.FC = ({ children }) => {
    const [currentTool, setCurrentTool] = useState<Tool>('brush');

    return <ToolContext.Provider value={{ toolType: currentTool, setToolType: setCurrentTool }}>{children}</ToolContext.Provider>;
};
