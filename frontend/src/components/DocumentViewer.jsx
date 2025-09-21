import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Users, DollarSign, FileText, Download, AlertTriangle, Clock } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

// Utility function to decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;lt;/g, '<')
    .replace(/&amp;gt;/g, '>')
    .replace(/&amp;/g, '&');
};

function DocumentViewer({ document, onGenerateSummary, loading }) {
  const [expandedSections, setExpandedSections] = useState({
    summary: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!document) return null;

  const { content } = document;

  const structuredData = document.structuredData;
  
  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRiskIcon = (level) => {
    switch(level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const createInfoCard = (title, icon, data, riskLevel = null) => {
    const validData = data.filter(item => item.value && item.value !== 'Not specified');
    if (validData.length === 0) return null;
    
    return {
      title,
      icon,
      data: validData,
      riskLevel
    };
  };
  
  const infoCards = [
    createInfoCard('Parties Involved', <Users className="w-5 h-5 text-emerald-600" />, [
      { label: 'Landlord/Lessor', value: structuredData?.parties?.landlord },
      { label: 'Tenant/Lessee', value: structuredData?.parties?.tenant },
      { label: 'Witnesses', value: structuredData?.parties?.witnesses }
    ], structuredData?.parties?.riskLevel),
    createInfoCard('Financial Summary', <DollarSign className="w-5 h-5 text-green-600" />, [
      { label: 'Monthly Rent', value: structuredData?.financialSummary?.monthlyRent },
      { label: 'Security Deposit', value: structuredData?.financialSummary?.securityDeposit },
      { label: 'Annual Escalation', value: structuredData?.financialSummary?.annualEscalation },
      { label: 'Late Fees', value: structuredData?.financialSummary?.lateFees },
      { label: 'Additional Costs', value: structuredData?.financialSummary?.additionalCosts }
    ], structuredData?.financialSummary?.riskLevel),
    createInfoCard('Key Covenants & Restrictions', <FileText className="w-5 h-5 text-purple-600" />, [
      { label: 'Use of Premises', value: structuredData?.keyCovenants?.useOfPremises },
      { label: 'Subletting Clause', value: structuredData?.keyCovenants?.sublettingClause },
      { label: 'Maintenance Responsibility', value: structuredData?.keyCovenants?.maintenanceResponsibility },
      { label: 'Termination Conditions', value: structuredData?.keyCovenants?.terminationConditions }
    ], structuredData?.keyCovenants?.riskLevel)
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Document Overview</h2>
          <div className="flex gap-2">
            {document.needsSummary && (
              <button 
                onClick={onGenerateSummary}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Generate Summary
              </button>
            )}
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              <Download className="w-4 h-4" />
              Export Summary
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">File Name:</span>
              <span className="text-gray-900 ml-2">{document.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Language:</span>
              <span className="text-gray-900 ml-2">{content.language}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Summary Overview */}
      {(structuredData || document.comprehensiveSummary) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {document.comprehensiveSummary?.documentSummary?.title || 'Document Summary'}
            </h2>
            {document.comprehensiveSummary?.documentSummary?.overview && (
              <p className="text-gray-700 mb-4">
                {decodeHtmlEntities(document.comprehensiveSummary.documentSummary.overview)}
              </p>
            )}
            {document.comprehensiveSummary?.documentSummary?.keyPoints && (
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Key Points:</h3>
                <ul className="space-y-1">
                  {document.comprehensiveSummary.documentSummary.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm text-gray-700">
                        {decodeHtmlEntities(point)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Dates */}
            {(document.comprehensiveSummary?.keyDates || structuredData?.importantDates) && (
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Key Dates
                </h3>
                {document.comprehensiveSummary?.keyDates ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {decodeHtmlEntities(document.comprehensiveSummary.keyDates.summary)}
                    </p>
                    {document.comprehensiveSummary.keyDates.criticalDeadlines?.map((deadline, index) => (
                      <div key={index} className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                        <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Critical:</span>
                        <p className="font-semibold text-red-800">
                          {decodeHtmlEntities(deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {structuredData.importantDates.startDate && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start:</span>
                        <p className="font-semibold text-gray-900">{structuredData.importantDates.startDate}</p>
                      </div>
                    )}
                    {structuredData.importantDates.endDate && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">End:</span>
                        <p className="font-semibold text-gray-900">{structuredData.importantDates.endDate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Financial Overview */}
            {(document.comprehensiveSummary?.financialOverview || structuredData?.financialSummary) && (
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Overview
                  {(document.comprehensiveSummary?.financialOverview?.riskLevel || structuredData?.financialSummary?.riskLevel) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(document.comprehensiveSummary?.financialOverview?.riskLevel || structuredData?.financialSummary?.riskLevel)}`}>
                      {getRiskIcon(document.comprehensiveSummary?.financialOverview?.riskLevel || structuredData?.financialSummary?.riskLevel)}
                    </span>
                  )}
                </h3>
                {document.comprehensiveSummary?.financialOverview ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {decodeHtmlEntities(document.comprehensiveSummary.financialOverview.summary)}
                    </p>
                    {document.comprehensiveSummary.financialOverview.keyAmounts?.map((amount, index) => (
                      <div key={index}>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount:</span>
                        <p className="font-semibold text-gray-900">
                          {decodeHtmlEntities(amount)}
                        </p>
                      </div>
                    ))}
                    {document.comprehensiveSummary.financialOverview.riskReason && (
                      <p className="text-xs text-gray-600 italic">
                        {decodeHtmlEntities(document.comprehensiveSummary.financialOverview.riskReason)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {structuredData.financialSummary.monthlyRent && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Rent:</span>
                        <p className="font-semibold text-gray-900">{structuredData.financialSummary.monthlyRent}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Key Restrictions */}
            {(document.comprehensiveSummary?.keyRestrictions || structuredData?.keyCovenants) && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Restrictions
                  {(document.comprehensiveSummary?.keyRestrictions?.riskLevel || structuredData?.keyCovenants?.riskLevel) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(document.comprehensiveSummary?.keyRestrictions?.riskLevel || structuredData?.keyCovenants?.riskLevel)}`}>
                      {getRiskIcon(document.comprehensiveSummary?.keyRestrictions?.riskLevel || structuredData?.keyCovenants?.riskLevel)}
                    </span>
                  )}
                </h3>
                {document.comprehensiveSummary?.keyRestrictions ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {decodeHtmlEntities(document.comprehensiveSummary.keyRestrictions.summary)}
                    </p>
                    {document.comprehensiveSummary.keyRestrictions.importantRules?.map((rule, index) => (
                      <div key={index} className="bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                        <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Rule:</span>
                        <p className="text-sm text-orange-800">
                          {decodeHtmlEntities(rule)}
                        </p>
                      </div>
                    ))}
                    {document.comprehensiveSummary.keyRestrictions.riskReason && (
                      <p className="text-xs text-gray-600 italic">
                        {decodeHtmlEntities(document.comprehensiveSummary.keyRestrictions.riskReason)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {structuredData.keyCovenants.useOfPremises && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Use:</span>
                        <p className="text-sm text-gray-900">{structuredData.keyCovenants.useOfPremises.substring(0, 50)}...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Risk Assessment */}
      {(structuredData?.overallRiskAssessment || document.comprehensiveSummary?.overallRiskAssessment) && (
        <div className={`rounded-xl border-2 p-6 mb-6 ${getRiskColor((structuredData?.overallRiskAssessment?.level || document.comprehensiveSummary?.overallRiskAssessment?.level))}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{getRiskIcon(structuredData?.overallRiskAssessment?.level || document.comprehensiveSummary?.overallRiskAssessment?.level)}</span>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-wide">
                {(structuredData?.overallRiskAssessment?.level || document.comprehensiveSummary?.overallRiskAssessment?.level)} Risk Document
              </h3>
              <p className="text-sm opacity-90">Overall Assessment</p>
            </div>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-3">
            <h4 className="font-semibold mb-2">Risk Analysis:</h4>
            <p className="text-sm">
              {decodeHtmlEntities(structuredData?.overallRiskAssessment?.reason || document.comprehensiveSummary?.overallRiskAssessment?.riskAnalysis)}
            </p>
          </div>
          {(structuredData?.overallRiskAssessment?.recommendations || document.comprehensiveSummary?.overallRiskAssessment?.recommendations) && (
            <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                ⚠️ Recommendations:
              </h4>
              <p className="text-sm font-medium">
                {decodeHtmlEntities(structuredData?.overallRiskAssessment?.recommendations || document.comprehensiveSummary?.overallRiskAssessment?.recommendations)}
              </p>
            </div>
          )}
          {document.comprehensiveSummary?.overallRiskAssessment?.warningFlags && (
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                🚩 Warning Flags:
              </h4>
              <ul className="space-y-1">
                {document.comprehensiveSummary.overallRiskAssessment.warningFlags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-sm font-medium">
                      {decodeHtmlEntities(flag)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Risk Highlights */}
      {structuredData?.riskHighlights && structuredData.riskHighlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Risk Highlights
          </h3>
          <div className="space-y-3">
            {structuredData.riskHighlights.map((risk, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${getRiskColor(risk.risk)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{getRiskIcon(risk.risk)}</span>
                  <span className="font-semibold text-sm uppercase">{risk.risk} Risk</span>
                </div>
                <p className="text-sm font-medium mb-1">{risk.clause}</p>
                <p className="text-sm text-gray-600 mb-1">{risk.reason}</p>
                <p className="text-sm font-medium">Impact: {risk.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Cards */}
      <div className="space-y-4">
        {infoCards.length > 0 ? infoCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {card.icon}
                  <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                </div>
                {card.riskLevel && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(card.riskLevel)}`}>
                    {getRiskIcon(card.riskLevel)} {card.riskLevel.toUpperCase()} RISK
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {card.data.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600 font-medium">{item.label}:</span>
                    <span className="text-gray-900 font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No structured data found in this document</p>
            <p className="text-sm text-gray-400 mt-1">The document may not contain standard legal terms</p>
          </div>
        )}

        {/* Full Summary - Collapsible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
            </div>
            {expandedSections.summary ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {expandedSections.summary && (
            <div className="p-6">
              <div className="prose prose-gray max-w-none">
                <MarkdownRenderer content={decodeHtmlEntities(content.fullSummary)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentViewer;