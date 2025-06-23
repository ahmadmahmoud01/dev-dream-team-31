// Create src/components/chat/InteractiveButtons.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface InteractiveButtonsProps {
  buttons: Array<{
    id: string;
    text: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
  }>;
  onButtonClick: (action: string) => void;
  language: 'ar' | 'en';
}

const InteractiveButtons: React.FC<InteractiveButtonsProps> = ({
  buttons,
  onButtonClick,
  language
}) => {
  const getButtonVariant = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'outline';
      case 'success':
        return 'default';
      case 'danger':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getButtonClassName = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'secondary':
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
      {buttons.map((button) => (
        <Button
          key={button.id}
          onClick={() => onButtonClick(button.action)}
          variant={getButtonVariant(button.variant)}
          className={`transition-all duration-200 ${getButtonClassName(button.variant)}`}
          size="sm"
        >
          {button.text}
        </Button>
      ))}
    </div>
  );
};

export default InteractiveButtons;
