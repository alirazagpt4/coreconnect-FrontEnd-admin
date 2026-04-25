import React, { createContext, useState, useContext } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [open, setOpen] = useState(true);
    const toggleDrawer = () => setOpen(!open);

    return (
        <SidebarContext.Provider value={{ open, toggleDrawer }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);