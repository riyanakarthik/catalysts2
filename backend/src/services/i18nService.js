const MESSAGES = {
  premiumCalculated: {
    en: 'Weekly premium calculated successfully.',
    hi: 'साप्ताहिक प्रीमियम सफलतापूर्वक गणना किया गया।',
    kn: 'ವಾರದ ಪ್ರೀಮಿಯಂ ಯಶಸ್ವಿಯಾಗಿ ಲೆಕ್ಕಿಸಲಾಗಿದೆ.'
  },
  policyCreated: {
    en: 'Policy created successfully.',
    hi: 'पॉलिसी सफलतापूर्वक बनाई गई।',
    kn: 'ಪಾಲಿಸಿ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ.'
  },
  paymentVerified: {
    en: 'Payment verified and policy activated.',
    hi: 'भुगतान सत्यापित हुआ और पॉलिसी सक्रिय हो गई।',
    kn: 'ಪಾವತಿ ಪರಿಶೀಲನೆಗೊಂಡು ಪಾಲಿಸಿ ಸಕ್ರಿಯವಾಗಿದೆ.'
  },
  triggerProcessed: {
    en: 'Trigger processed successfully.',
    hi: 'ट्रिगर सफलतापूर्वक प्रोसेस हुआ।',
    kn: 'ಟ್ರಿಗರ್ ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕ್ರಿಯೆಯಾಯಿತು.'
  },
  workerDashboard: {
    en: 'Worker dashboard fetched successfully.',
    hi: 'वर्कर डैशबोर्ड सफलतापूर्वक प्राप्त हुआ।',
    kn: 'ಕಾರ್ಮಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಪಡೆದಿದೆ.'
  },
  adminDashboard: {
    en: 'Admin dashboard fetched successfully.',
    hi: 'एडमिन डैशबोर्ड सफलतापूर्वक प्राप्त हुआ।',
    kn: 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಪಡೆದಿದೆ.'
  },
  claimsFetched: {
    en: 'Claims fetched successfully.',
    hi: 'क्लेम सफलतापूर्वक प्राप्त हुए।',
    kn: 'ಕ್ಲೈಮ್‌ಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪಡೆದಿವೆ.'
  },
  policiesFetched: {
    en: 'Policies fetched successfully.',
    hi: 'पॉलिसियाँ सफलतापूर्वक प्राप्त हुईं।',
    kn: 'ಪಾಲಿಸಿಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪಡೆದಿವೆ.'
  }
};

function normalizeLanguage(input) {
  const value = String(input || '').toLowerCase();
  if (value.startsWith('hi')) return 'hi';
  if (value.startsWith('kn')) return 'kn';
  return 'en';
}

function getLanguage(req) {
  return normalizeLanguage(
    req.headers['x-language'] ||
    req.query.lang ||
    req.headers['accept-language']
  );
}

function t(req, key) {
  const lang = getLanguage(req);
  return MESSAGES[key]?.[lang] || MESSAGES[key]?.en || key;
}

module.exports = {
  getLanguage,
  t
};
