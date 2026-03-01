"use client";

interface DocumentPreviewModalProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  filePath,
  fileName,
  onClose,
}: DocumentPreviewModalProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isPDF = /\.pdf$/i.test(fileName);

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold ml-4"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 p-6 flex items-center justify-center">
          {isImage && (
            <img
              src={filePath}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
          {isPDF && (
            <iframe
              src={filePath}
              className="w-full h-[70vh] rounded-lg"
              title={fileName}
            />
          )}
          {!isImage && !isPDF && (
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-4">Preview not available for this file type.</p>
              
                <a href={filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}