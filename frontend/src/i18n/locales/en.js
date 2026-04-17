const en = {
  // Sidebar Navigation
  nav: {
    dashboard: 'Dashboard',
    emiTransactions: 'EMI Transactions',
    financialHealth: 'Financial Health',
    supportHub: 'Support Hub',
    aiInsights: 'AI Insights',
    signOut: 'Sign Out',
    premiumTier: 'Premium Growth Tier',
    growthMember: 'Growth Member',
  },

  // Welcome / Hero
  welcome: {
    title: 'Welcome back, {name}',
    subtitle: 'Your financial profile is actively monitored by VittChetak ML Engine. Data synced perfectly.',
    totalDebt: 'Total Active Debt',
    riskExposure: 'Risk Exposure',
    high: 'HIGH',
    low: 'LOW',
  },

  // Health Scores
  health: {
    healthScore: 'Health Score',
    fraudShield: 'Fraud Shield',
    highSecurity: 'High Security',
    riskAlert: 'Risk Alert',
  },

  // AI Warning Banner
  warning: {
    title: '🚨 AI Proactive Delinquency Prediction',
    description: 'Based on your current income-to-debt ratio, our ML Engine projects a high probability of missing your upcoming EMIs within 30 days. Let us help you restructuring your loans to avoid a catastrophic default.',
    contactAdmin: 'Contact Bank Admin',
  },

  // EMI Transaction Table
  emi: {
    title: 'EMI Transaction Logs',
    viewStatement: 'View Statement',
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    status: 'Status',
    payNow: 'Pay Now',
    restructured: 'Admin Restructured ✓',
    noEmi: 'No EMIs scheduled.',
  },

  // Status Labels
  status: {
    paid: 'PAID',
    pending: 'PENDING',
    overdue: 'OVERDUE',
  },

  // Support Hub
  support: {
    title: 'Support & Resources',
    prepayTitle: 'Can I prepay my EMI?',
    prepayDesc: 'Prepayments are available after the first 6 months of your loan tenure with zero penalties.',
    changeBankTitle: 'Change Repayment Bank',
    changeBankDesc: 'Switch your primary repayment account by updating your NACH mandate in the settings.',
    directHelp: 'Need direct help?',
    directHelpDesc: 'Chat with the Bank Admin regarding negotiations or clear doubts directly within the platform.',
    chatWithAdmin: 'Chat with Admin',
  },

  // Shock Simulator
  shock: {
    title: 'Report Market Shock',
    desc: 'Simulate a severe Medical Emergency or Job Loss to watch algorithmic scoring plummet instantly.',
    button: 'Simulate Crisis Event',
    processing: 'Processing...',
  },

  // Chat Modal
  chat: {
    title: 'Bank Admin Communication',
    subtitle: 'A live representative will review this explicitly.',
    noPrior: 'No prior communication. Start a conversation below.',
    placeholder: 'Type your message...',
  },

  // Search
  search: {
    placeholder: 'Search transactions or tools...',
  },

  // Bands
  band: {
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    at_risk: 'At Risk',
    critical: 'Critical',
  },

  // Admin Portal
  admin: {
    sidebar: {
      portfolioOverview: 'Portfolio Overview',
      flaggedAccounts: 'Flagged Accounts',
      interventionQueue: 'Intervention Queue',
      msmeMonitor: 'MSME Monitor',
      fraudReview: 'Fraud Review',
      auditTrail: 'Audit Trail',
      settings: 'Settings',
      newAnalysis: 'New Analysis'
    },
    dashboard: {
      title: 'Portfolio Intelligence',
      stableEcosystem: 'Stable Ecosystem',
      marketConditions: 'Market Conditions',
      searchPlaceholder: 'Search accounts...',
      riskHeatmap: 'Risk Heatmap: Regional Exposure',
      riskIntensity: 'Risk Intensity by product and geographical cluster',
      lowRisk: 'Low Risk',
      critical: 'Critical',
      segmentBreakdown: 'Segment Breakdown',
      assetDistribution: 'Asset distribution by portfolio type',
      msmeCredits: 'MSME Credits',
      retailLoans: 'Retail Loans',
      riskScoreDistribution: 'Risk Score Distribution',
      scoreDescription: 'Population density across credit score tiers (0-100)',
      lastWeek: 'Last Week',
      current: 'Current',
      safe: 'Safe',
      default: 'Default',
      aiRecommended: 'AI Recommended Actions',
      insightsGenerated: 'Insights generated {time} mins ago',
      outcomes: 'Intervention Outcomes',
      outcomesDesc: 'Monthly success rate (%)',
      accountsFlagged: 'Accounts Flagged Today',
      p1Critical: 'P1 Critical Cases',
      interventionsPending: 'Interventions Pending',
      recoveryRate: 'Recovery Rate 30d',
      totalExposure: 'Total Exposure',
      activeUsers: 'Active Users',
      systemLoad: 'System Load'
    }
  },

  // MSME Specific
  msme: {
    sidebarRole: 'VittChetak Business',
    searchPlaceholder: 'Search insights...',
    restructuringReady: 'Your Custom Restructuring Plan is Ready.',
    vittChetakVerified: 'VittChetak Verified Relief',
    adminMessage: 'Official Message from Admin',
    restructuringDescription: 'Our AI analysts and bank admins have finalized your relief proposal. Accepting this plan will lower your immediate EMIs and protect your credit score.',
    acceptPlan: 'Accept & Apply Plan',
    accepted: 'Plan Accepted',
    reject: 'Reject',
    viewStatement: 'View Detailed Statement',
    shockSimulator: 'Shock Simulator',
    overview: 'Overview',
    transactions: 'Transactions',
    health: 'Health',
    creditLimit: 'Credit Limit',
    utilization: 'Utilization',
    activeLoans: 'Active Loans',
    nextRepayment: 'Next Repayment',
    businessHealthScore: 'Business Health Score',
    cashFlowTrend: 'Cash Flow Trend',
    projectedRevenue: 'Projected Revenue',
    taxComplianceStatus: 'Tax Compliance Status',
    inventoryTurnover: 'Inventory Turnover',
  },

  // Fraud Module
  fraud: {
    title: 'Fraud Investigation Lab',
    stats: {
      avgScore: 'Avg Fraud Score',
      topSignal: 'Top Alert Signal',
      reviewAccounts: 'Accounts Under Review'
    },
    tabs: {
      all: 'All Cases',
      review: 'Under Review',
      suspicious: 'Suspicious',
      escalated: 'Escalated',
      cleared: 'Cleared'
    },
    table: {
      account: 'Account',
      exposure: 'Exposure',
      signals: 'Signals',
      actions: 'Actions',
      score: 'Score'
    },
    investigation: {
      panelTitle: 'Live Investigation: {name}',
      auditTimeline: 'Audit Timeline',
      scoreHistory: 'Score History',
      indicators: 'Risk Indicators',
      decision: 'Take Official Decision',
      syncAudit: 'Sync Live ML Audit',
      lastSynced: 'Last synced: {time}',
      moneyFlow: 'Circular Money Flow (Live Graph)',
      netWorthTrend: 'HNI Net Worth Divergence',
      clear: 'Clear',
      suspicious: 'Suspicious',
      escalate: 'Escalate'
    }
  },

  // Flagged Accounts
  flagged: {
    title: 'Flagged Accounts',
    count: '{count} accounts under active risk surveillance',
    searchPlaceholder: 'Search by name or ID...',
    table: {
      customer: 'Customer',
      segment: 'Segment',
      health: 'Health',
      pattern: 'Pattern',
      fraud: 'Fraud Score',
      priority: 'Priority',
      status: 'Status',
      shapSignals: 'SHAP Feature Signals',
      aiRecommendation: 'AI Recommendation',
      sendIntervention: 'Send Intervention',
      fullProfile: 'Full 360° Profile',
      noAccounts: 'No accounts match your filters.'
    }
  },

  // Interventions
  interventions: {
    title: 'Intervention Queue',
    batchActions: 'Batch Actions',
    processBatch: 'Process Flagged Batch',
    customer: 'Customer',
    riskPattern: 'Risk Pattern',
    aiIntervention: 'AI Suggested Intervention',
    actions: 'Actions',
    approve: 'Approve',
    modify: 'Modify',
    reject: 'Reject'
  }
};

export default en;
