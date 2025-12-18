'use client';

import { useState } from 'react';
import { X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import SignatureCapture from './SignatureCapture';
import dynamic from 'next/dynamic';

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading PDF viewer...</div>,
});

interface SignDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  documentUrl?: string;
  onSign: (signatureData: string, reason?: string) => Promise<void>;
}

export default function SignDocumentModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  documentUrl,
  onSign,
}: SignDocumentModalProps) {
  const [step, setStep] = useState<'preview' | 'sign' | 'confirm'>('preview');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!signatureData) {
      setError('Please provide your signature');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      await onSign(signatureData, reason || undefined);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  const resetModal = () => {
    setStep('preview');
    setSignatureData(null);
    setReason('');
    setAgreedToTerms(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sign Document
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Document Signed Successfully!</h3>
              <p className="text-gray-600">Your signature has been recorded.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      1
                    </div>
                    <span className="font-medium">Preview</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200" />
                  <div className={`flex items-center space-x-2 ${step === 'sign' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'sign' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      2
                    </div>
                    <span className="font-medium">Sign</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200" />
                  <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      3
                    </div>
                    <span className="font-medium">Confirm</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {step === 'preview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Document: {documentName}</h3>
                      <p className="text-sm text-blue-700">
                        Please review the document before signing. By signing, you acknowledge that you have read and agree to the contents.
                      </p>
                    </div>

                    {documentUrl && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                        <PdfViewerClient fileUrl={documentUrl} />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => setStep('sign')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Proceed to Sign
                      </button>
                    </div>
                  </div>
                )}

                {step === 'sign' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Draw Your Signature</h3>
                      <p className="text-sm text-gray-600">
                        Use your mouse or touch screen to draw your signature in the box below.
                      </p>
                    </div>

                    <SignatureCapture
                      onSave={handleSignatureSave}
                      onCancel={() => setStep('preview')}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Signing (Optional)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Approved invoice, Reviewed contract, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {step === 'confirm' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">Review Your Signature</h3>
                      <p className="text-sm text-green-700">
                        Please review your signature and confirm that you want to sign this document.
                      </p>
                    </div>

                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <h4 className="font-medium text-gray-900 mb-2">Your Signature:</h4>
                      {signatureData && (
                        <img
                          src={signatureData}
                          alt="Your signature"
                          className="border border-gray-300 rounded bg-white max-h-32"
                        />
                      )}
                    </div>

                    {reason && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Reason:</h4>
                        <p className="text-gray-700">{reason}</p>
                      </div>
                    )}

                    <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-700">
                          I hereby certify that I have reviewed this document and agree to its contents. 
                          I understand that this electronic signature has the same legal effect as a handwritten signature.
                        </label>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        onClick={() => setStep('sign')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!agreedToTerms || isSigning}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSigning ? 'Signing...' : 'Confirm & Sign Document'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
