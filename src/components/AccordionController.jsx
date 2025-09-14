// src/components/AccordionController.jsx
import React, { createContext, useContext, useState } from 'react';

const AccordionContext = createContext();

export function AccordionProvider({ children }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (sectionId) => {
    const newState = openSection === sectionId ? null : sectionId;
    setOpenSection(newState);

    // Auto-scroll cuando se expande
    if (newState === sectionId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-accordion="${sectionId}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',  // Cambiar de 'start' a 'center'
            inline: 'nearest'
          });
        }
      }, 150);
    }
  };

  const isOpen = (sectionId) => openSection === sectionId;

  return (
    <AccordionContext.Provider value={{ toggleSection, isOpen }}>
      {children}
    </AccordionContext.Provider>
  );
}

export function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within AccordionProvider');
  }
  return context;
}

export function useAccordionSection(sectionId) {
  const { toggleSection, isOpen } = useAccordion();

  return {
    isOpen: isOpen(sectionId),
    toggle: () => toggleSection(sectionId)
  };
}