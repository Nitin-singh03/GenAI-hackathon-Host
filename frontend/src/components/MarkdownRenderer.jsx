import React from 'react';

function MarkdownRenderer({ content }) {
  if (!content) return null;

  const renderContent = () => {
    const lines = content.split('\n');
    const elements = [];
    let key = 0;
    let inList = false;
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key++} className="mb-4 space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={key++} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('• ') || line.startsWith('* ') || line.startsWith('- ')) {
        inList = true;
        const cleanLine = line.replace(/^[•*-] /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        listItems.push(cleanLine);
      } else if (line.length > 0) {
        flushList();
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        elements.push(
          <p key={key++} className="mb-3 text-gray-700 leading-relaxed" 
             dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      } else {
        flushList();
      }
    }

    flushList(); // Flush any remaining list items
    return elements;
  };

  return (
    <div className="prose prose-gray max-w-none">
      {renderContent()}
    </div>
  );
}

export default MarkdownRenderer;