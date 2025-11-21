import { useState, useRef } from 'react';
import { FiPaperclip, FiX, FiImage, FiFileText, FiMusic } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'pdf' | 'audio') => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const fileType = file.type;

    // Validar tipo de archivo
    if (fileType.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file, 'image');
    } else if (fileType === 'application/pdf') {
      setSelectedFile(file);
      setPreview(null);
      onFileSelect(file, 'pdf');
    } else if (fileType.startsWith('audio/')) {
      setSelectedFile(file);
      setPreview(null);
      onFileSelect(file, 'audio');
    } else {
      toast.error('Tipo de archivo no permitido. Solo imágenes, PDFs y audios');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    const type = selectedFile.type;
    if (type.startsWith('image/')) return <FiImage className="h-5 w-5" />;
    if (type === 'application/pdf') return <FiFileText className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <FiMusic className="h-5 w-5" />;
    return <FiPaperclip className="h-5 w-5" />;
  };

  return (
    <div>
      {selectedFile && (
        <div className="mb-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {preview && (
              <img src={preview} alt="Preview" className="h-12 w-12 object-cover rounded" />
            )}
            {!preview && (
              <div className="h-12 w-12 bg-primary-100 rounded flex items-center justify-center text-primary-600">
                {getFileIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      )}

      <label
        htmlFor="file-upload"
        className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          disabled
            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,audio/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <div className="flex items-center space-x-2">
          <FiPaperclip className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {selectedFile ? 'Cambiar archivo' : 'Adjuntar archivo (imagen, PDF, audio)'}
          </span>
        </div>
      </label>
    </div>
  );
}

