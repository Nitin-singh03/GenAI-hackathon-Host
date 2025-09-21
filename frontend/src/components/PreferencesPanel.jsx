import React from 'react';
import { X, Volume2 } from 'lucide-react';
import ComplexitySelector from './ComplexitySelector';

function PreferencesPanel({ preferences, setPreferences, onClose, onComplexityChange }) {
  const handleComplexityChange = (level) => {
    setPreferences(prev => ({
      ...prev,
      complexityLevel: level
    }));
    if (onComplexityChange) {
      onComplexityChange(level);
    }
  };

  const handleReadAloudToggle = () => {
    setPreferences(prev => ({
      ...prev,
      readAloudEnabled: !prev.readAloudEnabled
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Complexity Selector */}
          <ComplexitySelector
            selectedLevel={preferences.complexityLevel}
            onLevelChange={handleComplexityChange}
          />

          {/* Read Aloud Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              Audio Features
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium text-gray-900">Read Aloud</span>
                  <p className="text-sm text-gray-600">Enable text-to-speech for AI responses</p>
                </div>
              </div>
              <button
                onClick={handleReadAloudToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.readAloudEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    preferences.readAloudEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreferencesPanel;