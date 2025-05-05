
import React from "react";

interface FileUploadProps {
  id: string;
  title: string;
  description: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload = ({ id, title, description, onChange }: FileUploadProps) => {
  return (
    <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
      <label htmlFor={id} className="cursor-pointer">
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <input id={id} type="file" accept=".csv" className="hidden" onChange={onChange} />
      </label>
    </div>
  );
};

export default FileUpload;
