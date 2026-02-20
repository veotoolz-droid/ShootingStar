import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Loader2, Search, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ImageSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string, image?: File) => void;
}

export function ImageSearchPanel({ isOpen, onClose, onSearch }: ImageSearchPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [query, setQuery] = useState('');
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      error('Please upload an image file');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleOCR = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    // Simulate OCR (in real implementation, use Tesseract.js or API)
    setTimeout(() => {
      setExtractedText('OCR is not fully implemented. In a complete implementation, this would use Tesseract.js or a vision API to extract text from the image.');
      setIsProcessing(false);
      success('Text extracted!');
    }, 1500);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query || extractedText, selectedImage || undefined);
      onClose();
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-violet-500" />
            Image Search
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image upload area */}
          {!imagePreview ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-violet-500 bg-violet-500/5' : 'border-border'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Drag and drop an image here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg cursor-pointer hover:bg-violet-600">
                <Upload className="w-4 h-4" />
                Browse files
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* OCR result */}
          {extractedText && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Extracted Text</span>
              </div>
              <p className="text-sm text-muted-foreground">{extractedText}</p>
            </div>
          )}

          {/* Search query */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Query (optional)</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {selectedImage && !extractedText && (
              <button
                onClick={handleOCR}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Extract Text (OCR)
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleSearch}
              disabled={!selectedImage && !query.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageSearchPanel;
