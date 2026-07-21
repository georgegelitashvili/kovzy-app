import React from 'react';
import ErrorWrapper from '../generate/ErrorWrapper';
import useErrorHandler from '../../hooks/useErrorHandler';

/**
 * Higher-Order Component that adds error handling to any component
 * 
 * @param {React.ComponentType} Component The component to wrap with error handling
 * @returns {React.ComponentType} A wrapped component with error handling
 */
export const withErrorHandling = (Component) => {
  return (props) => {
    const errorHandler = useErrorHandler();
    
    return (
      <ErrorWrapper>
        <Component {...props} errorHandler={errorHandler} />
      </ErrorWrapper>
    );
  };
};
