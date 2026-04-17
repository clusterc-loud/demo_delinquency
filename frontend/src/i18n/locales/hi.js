const hi = {
  // साइडबार नेविगेशन
  nav: {
    dashboard: 'डैशबोर्ड',
    emiTransactions: 'EMI लेन-देन',
    financialHealth: 'वित्तीय स्वास्थ्य',
    supportHub: 'सहायता केंद्र',
    aiInsights: 'AI अंतर्दृष्टि',
    signOut: 'साइन आउट',
    premiumTier: 'प्रीमियम ग्रोथ टियर',
    growthMember: 'ग्रोथ सदस्य',
  },

  // स्वागत / हीरो
  welcome: {
    title: 'स्वागत है, {name}',
    subtitle: 'आपकी वित्तीय प्रोफ़ाइल VittChetak ML इंजन द्वारा सक्रिय रूप से निगरानी में है। डेटा पूरी तरह सिंक है।',
    totalDebt: 'कुल सक्रिय ऋण',
    riskExposure: 'जोखिम स्तर',
    high: 'उच्च',
    low: 'कम',
  },

  // स्वास्थ्य स्कोर
  health: {
    healthScore: 'स्वास्थ्य स्कोर',
    fraudShield: 'धोखाधड़ी सुरक्षा',
    highSecurity: 'उच्च सुरक्षा',
    riskAlert: 'जोखिम चेतावनी',
  },

  // AI चेतावनी बैनर
  warning: {
    title: '🚨 AI सक्रिय चूक पूर्वानुमान',
    description: 'आपकी वर्तमान आय-ऋण अनुपात के आधार पर, हमारा ML इंजन 30 दिनों के भीतर आपकी आगामी EMI छूटने की उच्च संभावना का अनुमान लगाता है। विनाशकारी डिफ़ॉल्ट से बचने के लिए हमें आपके ऋण को पुनर्गठित करने दें।',
    contactAdmin: 'बैंक व्यवस्थापक से संपर्क करें',
  },

  // EMI लेन-देन तालिका
  emi: {
    title: 'EMI लेन-देन विवरण',
    viewStatement: 'विवरण देखें',
    date: 'तारीख',
    description: 'विवरण',
    amount: 'राशि',
    status: 'स्थिति',
    payNow: 'अभी भुगतान करें',
    restructured: 'व्यवस्थापक द्वारा पुनर्गठित ✓',
    noEmi: 'कोई EMI निर्धारित नहीं है।',
  },

  // स्थिति लेबल
  status: {
    paid: 'भुगतान हो गया',
    pending: 'लंबित',
    overdue: 'अतिदेय',
  },

  // सहायता केंद्र
  support: {
    title: 'सहायता और संसाधन',
    prepayTitle: 'क्या मैं EMI प्रीपे कर सकता हूँ?',
    prepayDesc: 'आपकी ऋण अवधि के पहले 6 महीनों के बाद शून्य दंड के साथ प्रीपेमेंट उपलब्ध है।',
    changeBankTitle: 'भुगतान बैंक बदलें',
    changeBankDesc: 'सेटिंग्स में अपने NACH मैंडेट को अपडेट करके अपना प्राथमिक भुगतान खाता बदलें।',
    directHelp: 'सीधी मदद चाहिए?',
    directHelpDesc: 'बैंक व्यवस्थापक से बातचीत या शंका समाधान के लिए सीधे प्लेटफॉर्म पर चैट करें।',
    chatWithAdmin: 'व्यवस्थापक से चैट करें',
  },

  // शॉक सिम्युलेटर
  shock: {
    title: 'बाज़ार आघात रिपोर्ट',
    desc: 'गंभीर चिकित्सा आपातकाल या नौकरी छूटने का अनुकरण करें और ML स्कोर तुरंत गिरते देखें।',
    button: 'संकट अनुकरण करें',
    processing: 'प्रक्रिया हो रही है...',
  },

  // चैट मॉडल
  chat: {
    title: 'बैंक व्यवस्थापक संचार',
    subtitle: 'एक लाइव प्रतिनिधि इसकी स्पष्ट समीक्षा करेगा।',
    noPrior: 'कोई पूर्व संचार नहीं। नीचे बातचीत शुरू करें।',
    placeholder: 'अपना संदेश टाइप करें...',
  },

  // खोज
  search: {
    placeholder: 'लेन-देन या टूल खोजें...',
  },

  // बैंड
  band: {
    excellent: 'उत्कृष्ट',
    good: 'अच्छा',
    moderate: 'मध्यम',
    at_risk: 'जोखिम में',
    critical: 'गंभीर',
  },

  // एडमिन पोर्टल
  admin: {
    sidebar: {
      portfolioOverview: 'पोर्टफोलियो अवलोकन',
      flaggedAccounts: 'फ्लैग किए गए खाते',
      interventionQueue: 'हस्तक्षेप कतार',
      msmeMonitor: 'MSME मॉनिटर',
      fraudReview: 'धोखाधड़ी समीक्षा',
      auditTrail: 'ऑडिट ट्रेल',
      settings: 'सेटिंग्स',
      newAnalysis: 'नया विश्लेषण'
    },
    dashboard: {
      title: 'पोर्टफोलियो इंटेलिजेंस',
      stableEcosystem: 'स्थिर पारिस्थितिकी तंत्र',
      marketConditions: 'बाजार की स्थिति',
      searchPlaceholder: 'खाते खोजें...',
      riskHeatmap: 'जोखिम हीटमैप: क्षेत्रीय एक्सपोजर',
      riskIntensity: 'उत्पाद और भौगोलिक क्लस्टर द्वारा जोखिम तीव्रता',
      lowRisk: 'कम जोखिम',
      critical: 'गंभीर',
      segmentBreakdown: 'सेगमेंट ब्रेकडाउन',
      assetDistribution: 'पोर्टफोलियो प्रकार द्वारा संपत्ति वितरण',
      msmeCredits: 'MSME क्रेडिट',
      retailLoans: 'रिटेल लोन',
      riskScoreDistribution: 'जोखिम स्कोर वितरण',
      scoreDescription: 'क्रेडिट स्कोर स्तरों (0-100) में जनसंख्या घनत्व',
      lastWeek: 'पिछले सप्ताह',
      current: 'वर्तमान',
      safe: 'सुरक्षित',
      default: 'डिफ़ॉल्ट',
      aiRecommended: 'AI अनुशंसित कार्य',
      insightsGenerated: 'अंतर्दृष्टि {time} मिनट पहले उत्पन्न हुई',
      outcomes: 'हस्तक्षेप परिणाम',
      outcomesDesc: 'मासिक सफलता दर (%)',
      accountsFlagged: 'आज फ्लैग किए गए खाते',
      p1Critical: 'P1 महत्वपूर्ण मामले',
      interventionsPending: 'हस्तक्षेप लंबित',
      recoveryRate: 'रिकवरी दर 30 दिन'
    }
  },

  // MSME विशिष्ट
  msme: {
    sidebarRole: 'VittChetak बिजनेस',
    searchPlaceholder: 'अन्तर्दृष्टि खोजें...',
    restructuringReady: 'आपकी कस्टम पुनर्गठन योजना तैयार है।',
    vittChetakVerified: 'VittChetak सत्यापित राहत',
    adminMessage: 'व्यवस्थापक की ओर से आधिकारिक संदेश',
    restructuringDescription: 'हमारे AI विश्लेषकों और बैंक व्यवस्थापकों ने आपके राहत प्रस्ताव को अंतिम रूप दिया है। इस योजना को स्वीकार करने से आपकी तत्काल EMI कम हो जाएगी और आपके क्रेडिट स्कोर की रक्षा होगी।',
    acceptPlan: 'योजना स्वीकार करें और लागू करें',
    accepted: 'योजना स्वीकार कर ली गई है',
    reject: 'अस्वीकार करें',
    viewStatement: 'विस्तृत विवरण देखें',
    shockSimulator: 'शॉक सिम्युलेटर',
    overview: 'अवलोकन',
    transactions: 'लेन-देन',
    health: 'स्वास्थ्य',
    creditLimit: 'क्रेडिट सीमा',
    utilization: 'उपयोग',
    activeLoans: 'सक्रिय ऋण',
    nextRepayment: 'अगला पुनर्भुगतान',
  },

  // धोखाधड़ी मॉड्यूल
  fraud: {
    title: 'धोखाधड़ी जांच लैब',
    stats: {
      avgScore: 'औसत धोखाधड़ी स्कोर',
      topSignal: 'शीर्ष अलर्ट सिग्नल',
      reviewAccounts: 'समीक्षा के तहत खाते'
    },
    tabs: {
      all: 'सभी मामले',
      review: 'समीक्षा के तहत',
      suspicious: 'संदिग्ध',
      escalated: 'बढ़ाया गया',
      cleared: 'साफ़ किया गया'
    },
    table: {
      account: 'खाता',
      exposure: 'एक्सपोजर',
      signals: 'सिग्नल',
      actions: 'कार्य',
      score: 'स्कोर'
    },
    investigation: {
      panelTitle: 'लाइव जांच: {name}',
      auditTimeline: 'ऑडिट समयरेखा',
      scoreHistory: 'स्कोर इतिहास',
      indicators: 'जोखिम संकेतक',
      decision: 'आधिकारिक निर्णय लें',
      syncAudit: 'लाइव ML ऑडिट सिंक करें',
      lastSynced: 'पिछला सिंक: {time}',
      moneyFlow: 'सर्कुलर मनी फ्लो (लाइव ग्राफ)',
      netWorthTrend: 'HNI नेट वर्थ डाइवर्जेंस',
      clear: 'साफ़ करें',
      suspicious: 'संदिग्ध',
      escalate: 'बढ़ाना'
    }
  }
};

export default hi;
