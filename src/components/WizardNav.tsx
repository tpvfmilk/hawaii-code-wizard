
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardNavProps {
  steps: string[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onStepClick: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

const WizardNav = ({ 
  steps, 
  currentStep, 
  onNext, 
  onPrevious, 
  onStepClick,
  isStepComplete
}: WizardNavProps) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden md:flex items-center space-x-2">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <button
                onClick={() => onStepClick(index)}
                className={cn(
                  "flex items-center justify-center",
                  "transition-colors",
                  "hover:text-primary",
                  currentStep === index ? "text-primary font-medium" : "text-gray-500",
                  isStepComplete(index) && currentStep !== index ? "text-green-500" : ""
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full mr-2 text-sm",
                  currentStep === index ? "bg-primary text-white" : "bg-gray-200",
                  isStepComplete(index) && currentStep !== index ? "bg-green-500 text-white" : ""
                )}>
                  {isStepComplete(index) ? <Check className="w-4 h-4" /> : index + 1}
                </span>
                <span className="hidden lg:inline">{step}</span>
              </button>
              
              {index < steps.length - 1 && (
                <div className="w-8 h-1 bg-gray-200" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="md:hidden text-sm font-medium">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={onNext}
          disabled={currentStep === steps.length - 1}
        >
          {currentStep === steps.length - 2 ? "Finish" : "Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default WizardNav;
