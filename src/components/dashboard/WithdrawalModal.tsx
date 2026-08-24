import React from 'react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
  mainBalance?: number;
  profitBalance?: number;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = () => {
  // Inert withdrawal placeholder pending upcoming withdrawal workflow instructions
  return null;
};
