import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatusBadge from '../components/UI/StatusBadge';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AdminQuickCreate = () => {
  const [step, setStep] = useState('upload'); // upload, review, assigned
  const [fileData, setFileData] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Upload and OCR mutation
  const uploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/upload/ocr-grievance`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        setFileData(data);
        setOcrData(data.ocr_data);
        setStep('review');
      },
    }
  );

  // Quick create mutation
  const quickCreateMutation = useMutation(
    async (grievanceData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/grievances/quick-create`,
        grievanceData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        setStep('review');
        setOcrData({
          ...ocrData,
          suggested_officer: data.suggested_officer,
          assignment_reason: data.assignment_reason,
          ready_to_assign: data.ready_to_assign,
          grievance_id: data.grievance.id,
          ticket_id: data.grievance.ticket_id,
        });
      },
    }
  );

  // One-click assign mutation
  const assignMutation = useMutation(
    async (assignData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/grievances/create-and-assign`,
        assignData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        setStep('assigned');
        setTimeout(() => {
          handleReset();
        }, 3000);
      },
    }
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      uploadMutation.mutate(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      uploadMutation.mutate(file);
    }
  };

  const handleQuickCreate = () => {
    if (!ocrData) return;

    quickCreateMutation.mutate({
      file_url: fileData?.file_url,
      citizen_name: ocrData.citizen_name || 'Unknown',
      citizen_phone: ocrData.phone || '+919999999999',
      summary: ocrData.summary,
      description: ocrData.description,
      category: ocrData.category,
      severity: ocrData.severity,
      location: ocrData.location,
      pincode: ocrData.pincode,
    });
  };

  const handleOneClickAssign = () => {
    if (!ocrData || !ocrData.suggested_officer) return;

    assignMutation.mutate({
      citizen_name: ocrData.citizen_name || 'Unknown',
      citizen_phone: ocrData.phone || '+919999999999',
      summary: ocrData.summary,
      description: ocrData.description,
      category: ocrData.category,
      severity: ocrData.severity,
      location: ocrData.location,
      pincode: ocrData.pincode,
      officer_id: ocrData.suggested_officer.id,
      department_id: ocrData.suggested_officer.department_id,
    });
  };

  const handleReset = () => {
    setStep('upload');
    setFileData(null);
    setOcrData(null);
    setSelectedFile(null);
  };

  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            ⚡ Elon Mode: Quick Create
          </h1>
        </div>
        <p className="text-gray-600">
          Upload complaint → AI processes everything → One-click assign
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {['Upload', 'AI Review', 'Assigned'].map((label, idx) => (
            <React.Fragment key={label}>
              <div
                className={`flex items-center gap-2 ${
                  step === ['upload', 'review', 'assigned'][idx]
                    ? 'text-blue-600'
                    : step === 'assigned' && idx < 2
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step === ['upload', 'review', 'assigned'][idx]
                      ? 'bg-blue-100 text-blue-600'
                      : step === 'assigned' && idx < 2
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step === 'assigned' && idx < 2 ? '✓' : idx + 1}
                </div>
                <span className="font-medium">{label}</span>
              </div>
              {idx < 2 && (
                <ArrowRight
                  className={`w-5 h-5 ${
                    step === 'assigned'
                      ? 'text-green-600'
                      : 'text-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploadMutation.isLoading}
              />

              {uploadMutation.isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 font-medium">
                    Processing with AI...
                  </p>
                  <p className="text-sm text-gray-500">
                    Extracting complaint details using Google Gemini
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload Complaint Document
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Drag and drop or click to upload (Image or PDF)
                  </p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    Choose File
                  </label>
                  {selectedFile && (
                    <p className="mt-4 text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </>
              )}
            </div>

            {uploadMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Upload Failed</p>
                  <p className="text-sm text-red-700 mt-1">
                    {uploadMutation.error?.response?.data?.error ||
                      'Failed to process file'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Review & AI Suggestions */}
        {step === 'review' && ocrData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Extracted Data */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  AI Extracted Data
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Summary */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {ocrData.summary || 'N/A'}
                  </p>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900 max-h-32 overflow-y-auto">
                    {ocrData.description || 'N/A'}
                  </p>
                </div>

                {/* Category & Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <StatusBadge status={ocrData.category || 'other'} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                      severityColors[ocrData.severity] ||
                      severityColors.medium
                    }`}
                  >
                    {ocrData.severity?.toUpperCase() || 'MEDIUM'}
                  </span>
                </div>

                {/* Citizen Info */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Citizen Name
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {ocrData.citizen_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {ocrData.phone || 'Not provided'}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {ocrData.location || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {ocrData.pincode || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Suggested Officer */}
            {ocrData.suggested_officer && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    🤖 AI Recommended Officer
                  </h2>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ocrData.suggested_officer.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ocrData.suggested_officer.role}
                      </p>
                      <p className="text-sm text-gray-600">
                        Department: {ocrData.suggested_officer.department_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Performance</p>
                      <p className="text-lg font-bold text-green-600">
                        {ocrData.suggested_officer.resolved_count}/
                        {ocrData.suggested_officer.total_assigned}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ocrData.suggested_officer.current_workload} active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>AI Reasoning:</strong> {ocrData.assignment_reason}
                  </p>
                </div>

                <button
                  onClick={handleOneClickAssign}
                  disabled={assignMutation.isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {assignMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      ⚡ ONE-CLICK ASSIGN
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Or Get AI Suggestion */}
            {!ocrData.suggested_officer && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <button
                  onClick={handleQuickCreate}
                  disabled={quickCreateMutation.isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {quickCreateMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Getting AI Suggestion...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get AI Officer Suggestion
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel & Start Over
            </button>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 'assigned' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ✅ Assigned Successfully!
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Ticket ID: <strong>{ocrData?.ticket_id}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Officer{' '}
              <strong>{ocrData?.suggested_officer?.name}</strong> has
              been notified
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to upload next complaint...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminQuickCreate;
