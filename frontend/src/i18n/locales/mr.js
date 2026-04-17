const mr = {
  // साइडबार नॅव्हिगेशन
  nav: {
    dashboard: 'डॅशबोर्ड',
    emiTransactions: 'EMI व्यवहार',
    financialHealth: 'आर्थिक आरोग्य',
    supportHub: 'सहाय्य केंद्र',
    aiInsights: 'AI अंतर्दृष्टी',
    signOut: 'साइन आउट',
    premiumTier: 'प्रीमियम ग्रोथ टियर',
    growthMember: 'ग्रोथ सदस्य',
  },

  // स्वागत / हिरो
  welcome: {
    title: 'पुन्हा स्वागत, {name}',
    subtitle: 'तुमची आर्थिक प्रोफाइल VittChetak ML इंजिनद्वारे सक्रियपणे निरीक्षित आहे। डेटा पूर्णपणे सिंक आहे।',
    totalDebt: 'एकूण सक्रिय कर्ज',
    riskExposure: 'जोखीम पातळी',
    high: 'उच्च',
    low: 'कमी',
  },

  // आरोग्य स्कोर
  health: {
    healthScore: 'आरोग्य स्कोर',
    fraudShield: 'फसवणूक सुरक्षा',
    highSecurity: 'उच्च सुरक्षा',
    riskAlert: 'जोखीम इशारा',
  },

  // AI चेतावणी बॅनर
  warning: {
    title: '🚨 AI सक्रिय चूक अंदाज',
    description: 'तुमच्या सध्याच्या उत्पन्न-कर्ज गुणोत्तरावर आधारित, आमचे ML इंजिन 30 दिवसांत तुमच्या आगामी EMI चुकविण्याची उच्च शक्यता दर्शवते। विनाशकारी डिफॉल्ट टाळण्यासाठी आम्हाला तुमचे कर्ज पुनर्रचना करू द्या।',
    contactAdmin: 'बँक प्रशासकाशी संपर्क करा',
  },

  // EMI व्यवहार तक्ता
  emi: {
    title: 'EMI व्यवहार नोंदी',
    viewStatement: 'विवरण पहा',
    date: 'तारीख',
    description: 'वर्णन',
    amount: 'रक्कम',
    status: 'स्थिती',
    payNow: 'आता भरा',
    restructured: 'प्रशासकाने पुनर्रचित ✓',
    noEmi: 'कोणतीही EMI नियोजित नाही.',
  },

  // स्थिती लेबल
  status: {
    paid: 'भरले',
    pending: 'प्रलंबित',
    overdue: 'थकबाकी',
  },

  // सहाय्य केंद्र
  support: {
    title: 'सहाय्य आणि संसाधने',
    prepayTitle: 'मी EMI प्रीपे करू शकतो का?',
    prepayDesc: 'तुमच्या कर्ज कालावधीच्या पहिल्या 6 महिन्यांनंतर शून्य दंडासह प्रीपेमेंट उपलब्ध आहे.',
    changeBankTitle: 'पेमेंट बँक बदला',
    changeBankDesc: 'सेटिंग्जमध्ये तुमचे NACH मँडेट अपडेट करून तुमचे प्राथमिक पेमेंट खाते बदला.',
    directHelp: 'थेट मदत हवी?',
    directHelpDesc: 'बँक प्रशासकाशी वाटाघाटी किंवा शंका निरसनासाठी थेट प्लॅटफॉर्मवर चॅट करा.',
    chatWithAdmin: 'प्रशासकाशी चॅट करा',
  },

  // शॉक सिम्युलेटर
  shock: {
    title: 'बाजार आघात अहवाल',
    desc: 'गंभीर वैद्यकीय आणीबाणी किंवा नोकरी गेल्याचे अनुकरण करा आणि ML स्कोर तात्काळ घसरताना पहा.',
    button: 'संकट अनुकरण करा',
    processing: 'प्रक्रिया होत आहे...',
  },

  // चॅट मॉडल
  chat: {
    title: 'बँक प्रशासक संवाद',
    subtitle: 'एक लाइव्ह प्रतिनिधी याचे स्पष्टपणे पुनरावलोकन करेल.',
    noPrior: 'पूर्वीचा संवाद नाही. खाली संभाषण सुरू करा.',
    placeholder: 'तुमचा संदेश टाइप करा...',
  },

  // शोध
  search: {
    placeholder: 'व्यवहार किंवा टूल्स शोधा...',
  },

  // बँड
  band: {
    excellent: 'उत्कृष्ट',
    good: 'चांगले',
    moderate: 'मध्यम',
    at_risk: 'जोखमीत',
    critical: 'गंभीर',
  },

  // ॲडमिन पोर्टल
  admin: {
    sidebar: {
      portfolioOverview: 'पोर्टफोलिओ विहंगावलोकन',
      flaggedAccounts: 'ध्वजांकित खाती',
      interventionQueue: 'हस्तक्षेप रांग',
      msmeMonitor: 'MSME मॉनिटर',
      fraudReview: 'फसवणूक पुनरावलोकन',
      auditTrail: 'ऑडिट ट्रेल',
      settings: 'सेटिंग्ज',
      newAnalysis: 'नवीन विश्लेषण'
    },
    dashboard: {
      title: 'पोर्टफोलिओ इंटेलिजन्स',
      stableEcosystem: 'स्थिर परिसंस्था',
      marketConditions: 'बाजार परिस्थिती',
      searchPlaceholder: 'खाती शोधा...',
      riskHeatmap: 'जोखीम हीटमॅप: प्रादेशिक एक्सपोजर',
      riskIntensity: 'उत्पादन आणि भौगोलिक क्लस्टरनुसार जोखीम तीव्रता',
      lowRisk: 'कमी जोखीम',
      critical: 'गंभीर',
      segmentBreakdown: 'सेगमेंट ब्रेकडाउन',
      assetDistribution: 'पोर्टफोलिओ प्रकारानुसार मालमत्ता वितरण',
      msmeCredits: 'MSME क्रेडिट्स',
      retailLoans: 'रिटेल कर्जे',
      riskScoreDistribution: 'जोखीम स्कोर वितरण',
      scoreDescription: 'क्रेडिट स्कोर स्तरांवर (0-100) लोकसंख्या घनता',
      lastWeek: 'मागील आठवडा',
      current: 'वर्तमान',
      safe: 'सुरक्षित',
      default: 'डिफॉल्ट',
      aiRecommended: 'AI शिफारस केलेल्या क्रिया',
      insightsGenerated: 'अंतर्दृष्टी {time} मिनिटांपूर्वी व्युत्पन्न',
      outcomes: 'हस्तक्षेप निकाल',
      outcomesDesc: 'मासिक यश दर (%)',
      accountsFlagged: 'आज ध्वजांकित केलेली खाती',
      p1Critical: 'P1 गंभीर प्रकरणे',
      interventionsPending: 'हस्तक्षेप प्रलंबित',
      recoveryRate: 'रिकव्हरी दर 30 दिवस'
    }
  },

  // MSME विशिष्ट
  msme: {
    sidebarRole: 'VittChetak बिझनेस',
    searchPlaceholder: 'अंतर्दृष्टी शोधा...',
    restructuringReady: 'तुमची सानुकूल पुनर्रचना योजना तयार आहे.',
    vittChetakVerified: 'VittChetak सत्यापित मदत',
    adminMessage: 'प्रशासकाचा अधिकृत संदेश',
    restructuringDescription: 'आमच्या AI विश्लेषकांनी आणि बँक प्रशासकांनी तुमचा मदत प्रस्ताव अंतिम केला आहे. ही योजना स्वीकारल्याने तुमची तात्काळ EMI कमी होईल आणि तुमच्या क्रेडिट स्कोरचे संरक्षण होईल.',
    acceptPlan: 'योजना स्वीकारा आणि लागू करा',
    accepted: 'योजना स्वीकारली',
    reject: 'नाकारा',
    viewStatement: 'तपशीलवार विवरण पहा',
    shockSimulator: 'शॉक सिम्युलेटर',
    overview: 'विहंगावलोकन',
    transactions: 'व्यवहार',
    health: 'आरोग्य',
    creditLimit: 'क्रेडिट मर्यादा',
    utilization: 'वापर',
    activeLoans: 'सक्रिय कर्जे',
    nextRepayment: 'पुढील परतफेड',
  },

  // फसवणूक मॉड्यूल
  fraud: {
    title: 'फसवणूक तपासणी लॅब',
    stats: {
      avgScore: 'सरासरी फसवणूक स्कोर',
      topSignal: 'टॉप अलर्ट सिग्नल',
      reviewAccounts: 'पुनरावलोकनाखालील खाती'
    },
    tabs: {
      all: 'सर्व प्रकरणे',
      review: 'पुनरावलोकनाखालील',
      suspicious: 'संशयास्पद',
      escalated: 'वाढवलेली',
      cleared: 'क्लिअर केलेली'
    },
    table: {
      account: 'खाते',
      exposure: 'एक्सपोजर',
      signals: 'सिग्नल',
      actions: 'कृती',
      score: 'स्कोर'
    },
    investigation: {
      panelTitle: 'थेट तपासणी: {name}',
      auditTimeline: 'ऑडिट टाइमलाइन',
      scoreHistory: 'स्कोर इतिहास',
      indicators: 'जोखीम निर्देशक',
      decision: 'अधिकृत निर्णय घ्या',
      syncAudit: 'थेट ML ऑडिट सिंक करा',
      lastSynced: 'शेवटचे सिंक: {time}',
      moneyFlow: 'सर्कुलर मनी फ्लो (थेट ग्राफ)',
      netWorthTrend: 'HNI नेट वर्थ डायव्हर्जन्स',
      clear: 'क्लिअर करा',
      suspicious: 'संशयास्पद',
      escalate: 'वाढवा'
    }
  }
};

export default mr;
