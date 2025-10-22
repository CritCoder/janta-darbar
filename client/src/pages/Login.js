import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Login = () => {
  const { sendOtp, verifyOtp, loading } = useAuth();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const dropdownRef = useRef(null);
  const [isRegister, setIsRegister] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+91',
    flag: '🇮🇳',
    name: 'India'
  });
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    otp: '',
    language: currentLanguage
  });
  const [errors, setErrors] = useState({});

  const countries = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore' },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!otpSent) {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number (10 digits required)';
      }
      
      if (isRegister && !formData.name) {
        newErrors.name = 'Name is required';
      }
    } else {
      if (!formData.otp) {
        newErrors.otp = 'OTP is required';
      } else if (!/^\d{6}$/.test(formData.otp)) {
        newErrors.otp = 'Invalid OTP (6 digits required)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Combine country code with phone number
    const phoneWithCountryCode = selectedCountry.code + formData.phone;
    
    if (!otpSent) {
      // Send OTP
      const result = await sendOtp(phoneWithCountryCode);
      if (result.success) {
        setOtpSent(true);
      }
    } else {
      // Verify OTP
      const result = await verifyOtp(phoneWithCountryCode, formData.otp);
      if (result.success) {
        // Navigation will be handled by the auth context
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-white text-2xl font-bold">ज</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">जनता दरबार</h1>
          <p className="text-gray-600">शंभू राजा देशाई</p>
        </div>

        {/* Language Selector */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  changeLanguage(language.code);
                  setFormData(prev => ({ ...prev, language: language.code }));
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  currentLanguage === language.code
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {language.flag} {language.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 relative"
        >
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">
                  {isRegister ? 'Registering...' : otpSent ? 'Verifying OTP...' : 'Sending OTP...'}
                </p>
              </div>
            </div>
          )}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegister ? 'नोंदणी करा' : otpSent ? 'OTP प्रविष्ट करा' : 'लॉगिन करा'}
            </h2>
            <p className="text-gray-600">
              {isRegister
                ? 'जनता दरबार मध्ये सामील व्हा'
                : otpSent
                  ? 'आपल्या मोबाइलवर पाठवलेला OTP प्रविष्ट करा'
                  : 'आपल्या खात्यात लॉगिन करा'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  नाव
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="आपले नाव प्रविष्ट करा"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                मोबाइल क्रमांक
              </label>
              <div className="flex">
                {/* Country Code Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    disabled={otpSent}
                    className={`flex items-center px-3 py-3 border-r-0 border rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } ${otpSent ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <span className="text-lg mr-2">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium">{selectedCountry.code}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  {/* Country Dropdown */}
                  {showCountryDropdown && !otpSent && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-lg mr-3">{country.flag}</span>
                          <span className="text-sm font-medium mr-2">{country.code}</span>
                          <span className="text-sm text-gray-600">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={otpSent}
                  className={`flex-1 px-4 py-3 border rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } ${otpSent ? 'bg-gray-100' : ''}`}
                  placeholder="9876543210"
                  maxLength="10"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {otpSent && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  OTP कोड
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="6 अंकी OTP प्रविष्ट करा"
                  maxLength="6"
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    मोबाइल क्रमांक बदला
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                isRegister 
                  ? 'नोंदणी करा' 
                  : otpSent 
                    ? 'OTP सत्यापित करा' 
                    : 'लॉगिन करा'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {isRegister 
                ? 'आधीपासून खाते आहे? लॉगिन करा' 
                : 'नवीन आहेत? नोंदणी करा'
              }
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-500 text-sm"
        >
          <p>© 2024 जनता दरबार. सर्व हक्क राखीव.</p>
          <p className="mt-1">महाराष्ट्र राज्य</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
