import React from 'react';
import { FileText, Mail, AlertTriangle } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">DocuSimplify</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Making legal documents accessible and understandable for everyone through 
              AI-powered simplification and analysis.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200">
              <Mail className="w-4 h-4" />
              <span>support@docusimplify.com</span>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Important Notice
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              This AI tool provides general information only and does not constitute 
              legal advice. Always consult with qualified legal professionals for 
              specific legal matters.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 DocuSimplify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;