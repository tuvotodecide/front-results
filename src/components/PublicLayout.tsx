// Layout público sin sidebar para el landing
// Reutiliza Header existente con la prop hideSidebarToggle

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from './Header';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  // Funciones dummy ya que no hay sidebar en este layout
  const noopToggle = () => {};
  const [searchParams] = useSearchParams();
  // Con ?hideLogin=true la cabecera no se renderiza, así que no hay que compensar su altura
  const headerOffset =
    searchParams.get('hideLogin') === 'true' ? 0 : '64px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'auto',
      }}
    >
      <Header
        toggleSidebar={noopToggle}
        isSidebarOpen={false}
        hideSidebarToggle={true}
      />
      <main
        style={{
          marginTop: headerOffset, // Altura del header fijo
          flex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
