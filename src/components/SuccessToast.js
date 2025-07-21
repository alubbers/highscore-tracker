"use strict";

/**
 * SuccessToast component for displaying success notifications
 * Uses React Bootstrap Toast component with auto-dismiss functionality
 * Provides consistent growl-style messaging across the application
 */

import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

/**
 * @typedef {Object} SuccessToastProps
 * @property {boolean} show - Whether the toast should be visible
 * @property {() => void} onClose - Callback when toast is closed or auto-dismissed
 * @property {string} title - Toast title/heading
 * @property {string} message - Toast message content
 * @property {number} [delay] - Auto-dismiss delay in milliseconds (default: 4000)
 * @property {string} [variant] - Bootstrap variant for styling (default: 'success')
 */

/**
 * SuccessToast component displays a dismissible notification toast
 * Automatically dismisses after specified delay and provides consistent styling
 * @param {SuccessToastProps} props - Component props
 * @returns {JSX.Element} The rendered SuccessToast component
 */
export const SuccessToast = ({
  show,
  onClose,
  title,
  message,
  delay = 4000,
  variant = "success"
}) => {
  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{
        position: 'fixed',
        zIndex: 1050,
        top: '20px',
        right: '20px'
      }}
    >
      <Toast
        show={show}
        onClose={onClose}
        delay={delay}
        autohide
        bg={variant}
        className="text-white"
      >
        <Toast.Header className={`bg-${variant} text-white border-0`}>
          <svg
            className="rounded me-2"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            focusable="false"
            role="img"
          >
            <rect width="100%" height="100%" fill="currentColor" />
            <text x="50%" y="50%" fill="white" dy=".3em" textAnchor="middle" fontSize="12">
              ✓
            </text>
          </svg>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body>
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default SuccessToast;
