import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: Step.DEFINE_DOMAIN, label: '确定领域' },
    { id: Step.SELECT_DB, label: '选择数据库' },
    { id: Step.RESULT, label: '获取结果' },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                currentStep >= step.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.id}
            </div>
            <span
              className={`text-xs mt-2 font-medium ${
                currentStep >= step.id ? 'text-indigo-700' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 max-w-[40px] ${
                currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;