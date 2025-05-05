
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle } from "lucide-react";

interface ValidationMessageProps {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const ValidationMessage = ({ type, message }: ValidationMessageProps) => {
  if (!message) return null;
  
  return (
    <Alert className={`mb-4 ${
      type === 'success' ? 'bg-green-50 border-green-200' : 
      type === 'error' ? 'bg-red-50 border-red-200' : 
      'bg-amber-50 border-amber-200'}`}
    >
      {type === 'success' && <Check className="h-4 w-4 text-green-500 mr-2" />}
      {type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 mr-2" />}
      <AlertDescription className="flex items-center">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default ValidationMessage;
