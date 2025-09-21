import React from 'react';
import { GraduationCap, Briefcase, Heart } from 'lucide-react';

function ComplexitySelector({ selectedLevel, onLevelChange }) {
  const levels = [
    {
      id: 'expert',
      name: 'Expert',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Detailed legal explanations with technical terms',
      color: 'blue'
    },
    {
      id: 'moderate',
      name: 'Moderate',
      icon: <GraduationCap className="w-5 h-5" />,
      description: 'Clear explanations without overly complex language',
      color: 'emerald'
    },
    {
      id: 'beginner',
      name: 'Beginner',
      icon: <Heart className="w-5 h-5" />,
      description: 'Simple, easy-to-understand explanations',
      color: 'purple'
    }
  ];

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50',
      emerald: isSelected 
        ? 'bg-emerald-600 text-white border-emerald-600' 
        : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50',
      purple: isSelected 
        ? 'bg-purple-600 text-white border-purple-600' 
        : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
    };
    return colors[color];
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        Explanation Complexity Level
      </label>
      <div className="space-y-2">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onLevelChange(level.id)}
            className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${
              getColorClasses(level.color, selectedLevel === level.id)
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {level.icon}
              <span className="font-semibold">{level.name}</span>
            </div>
            <p className="text-sm opacity-90">
              {level.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ComplexitySelector;