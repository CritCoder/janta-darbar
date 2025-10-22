import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showFooter = true,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  confirmDisabled = false,
  confirmVariant = 'primary',
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]} ${className}`}
            >
              {/* Header */}
              <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {showFooter && (
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={confirmLoading}
                  >
                    {cancelText}
                  </Button>
                  {onConfirm && (
                    <Button
                      variant={confirmVariant}
                      onClick={onConfirm}
                      loading={confirmLoading}
                      disabled={confirmDisabled}
                    >
                      {confirmText}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
