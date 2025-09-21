const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    content: { type: String, required: true },
    summaries: {
      beginner: { type: String },
      moderate: { type: String },
      expert: { type: String }
    },
    structuredData: {
      importantDates: {
        startDate: String,
        endDate: String,
        leaseTerm: String,
        noticeDeadlines: String,
        renewalDate: String
      },
      parties: {
        landlord: String,
        tenant: String,
        witnesses: String,
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
      },
      financialSummary: {
        monthlyRent: String,
        securityDeposit: String,
        annualEscalation: String,
        lateFees: String,
        additionalCosts: String,
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
      },
      keyCovenants: {
        useOfPremises: String,
        sublettingClause: String,
        maintenanceResponsibility: String,
        terminationConditions: String,
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
      },
      riskHighlights: [{
        clause: String,
        risk: { type: String, enum: ['low', 'medium', 'high'] },
        reason: String,
        impact: String
      }],
      overallRiskAssessment: {
        level: { type: String, enum: ['low', 'medium', 'high'] },
        reason: String,
        recommendations: String
      }
    },
    comprehensiveSummary: {
      documentSummary: {
        title: String,
        overview: String,
        keyPoints: [String]
      },
      keyDates: {
        summary: String,
        criticalDeadlines: [String]
      },
      financialOverview: {
        summary: String,
        keyAmounts: [String],
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        riskReason: String
      },
      keyRestrictions: {
        summary: String,
        importantRules: [String],
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        riskReason: String
      },
      overallRiskAssessment: {
        level: { type: String, enum: ['low', 'medium', 'high'] },
        riskAnalysis: String,
        recommendations: String,
        warningFlags: [String]
      }
    },
    isProcessed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
