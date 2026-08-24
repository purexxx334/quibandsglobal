import React from 'react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAsset?: string;
  onSuccess?: () => void;
}

/**
 * Withdrawal System Modal
 * Clean canvas ready for step-by-step custom implementation.
 */
export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Scrapped as requested - ready to build each step from scratch
  return null;
};
