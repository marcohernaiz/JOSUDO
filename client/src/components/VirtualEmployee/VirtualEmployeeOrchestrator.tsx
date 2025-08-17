import { useState } from 'react';
import { PersonaSelector, type Persona } from './PersonaSelector';
import { RoleCustomization, type RoleCustomization as RoleCustomizationData } from './RoleCustomization';
import { FirstConversation, type OnboardingData } from './FirstConversation';

interface VirtualEmployeeOrchestratorProps {
  onEmployeeCreated: (employeeData: EmployeeCreationData) => void;
}

export interface EmployeeCreationData {
  persona: Persona;
  customization: RoleCustomizationData;
  onboardingData: OnboardingData;
}

type FlowStep = 'persona-selection' | 'role-customization' | 'first-conversation';

export const VirtualEmployeeOrchestrator: React.FC<VirtualEmployeeOrchestratorProps> = ({
  onEmployeeCreated
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('persona-selection');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [roleCustomization, setRoleCustomization] = useState<RoleCustomizationData | null>(null);

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setCurrentStep('role-customization');
  };

  const handleCustomizationComplete = (customization: RoleCustomizationData) => {
    setRoleCustomization(customization);
    setCurrentStep('first-conversation');
  };

  const handleOnboardingComplete = (onboardingData: OnboardingData) => {
    if (selectedPersona && roleCustomization) {
      const employeeData: EmployeeCreationData = {
        persona: selectedPersona,
        customization: roleCustomization,
        onboardingData
      };
      onEmployeeCreated(employeeData);
    }
  };

  const handleBackToPersonas = () => {
    setCurrentStep('persona-selection');
    setSelectedPersona(null);
    setRoleCustomization(null);
  };

  const handleBackToCustomization = () => {
    setCurrentStep('role-customization');
  };

  switch (currentStep) {
    case 'persona-selection':
      return <PersonaSelector onPersonaSelect={handlePersonaSelect} />;
    
    case 'role-customization':
      return selectedPersona ? (
        <RoleCustomization
          persona={selectedPersona}
          onCustomizationComplete={handleCustomizationComplete}
          onBack={handleBackToPersonas}
        />
      ) : null;
    
    case 'first-conversation':
      return selectedPersona && roleCustomization ? (
        <FirstConversation
          persona={selectedPersona}
          customization={roleCustomization}
          onOnboardingComplete={handleOnboardingComplete}
          onBack={handleBackToCustomization}
        />
      ) : null;

    default:
      return <PersonaSelector onPersonaSelect={handlePersonaSelect} />;
  }
};