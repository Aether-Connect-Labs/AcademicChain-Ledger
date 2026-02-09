import React from 'react';
import { render, screen } from '@testing-library/react';
import HolographicStudio from './HolographicStudio';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('HolographicStudio Component', () => {
  it('renders the studio interface with correct elements', () => {
    render(
      <BrowserRouter>
        <HolographicStudio />
      </BrowserRouter>
    );

    // Check Left Sidebar
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('Holográfico')).toBeInTheDocument();
    expect(screen.getByText('Vista Previa')).toBeInTheDocument();
    
    // Check Config Sections
    expect(screen.getByText('Configuración de Página')).toBeInTheDocument();
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
    expect(screen.getByText('Vertical')).toBeInTheDocument();
    
    // Check Document Types
    expect(screen.getByText('Tipo de Documento')).toBeInTheDocument();
    expect(screen.getByText('Certificado')).toBeInTheDocument();
    
    // Check Central Content (Certificate Text)
    expect(screen.getByText(/UNIVERSIDAD SAEKO/i)).toBeInTheDocument();
    expect(screen.getByText(/KARLA GUZMÁN BATRES/i)).toBeInTheDocument();
    expect(screen.getByText(/MAESTRÍA EN INGENIERÍA DEL SOFTWARE/i)).toBeInTheDocument();
    
    // Check Right Sidebar
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Color de Fondo')).toBeInTheDocument();
    expect(screen.getByText('Textura')).toBeInTheDocument();
    expect(screen.getByText('Capas (2)')).toBeInTheDocument();
    expect(screen.getByText('Agregar QR de Transparencia')).toBeInTheDocument();
  });
});
