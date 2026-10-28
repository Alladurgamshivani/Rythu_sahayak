const ERROR_TRANSLATIONS = {
  NETWORK_ERROR: [
    "The service is temporarily unavailable. Please try again shortly.",
    "సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
  ],
  CONFIGURATION_ERROR: [
    "The application is not configured to reach its service. Please contact the administrator.",
    "సేవకు కనెక్ట్ అయ్యేలా అప్లికేషన్ కాన్ఫిగర్ చేయబడలేదు. దయచేసి నిర్వాహకుడిని సంప్రదించండి.",
  ],
  INVALID_CREDENTIALS: [
    "The username or password is incorrect. Please try again.",
    "వినియోగదారు పేరు లేదా పాస్‌వర్డ్ తప్పుగా ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
  ],
  SESSION_EXPIRED: [
    "Your session has expired. Please sign in again.",
    "మీ సెషన్ గడువు ముగిసింది. దయచేసి మళ్లీ లాగిన్ చేయండి.",
  ],
  NOT_FOUND: [
    "The requested record could not be found.",
    "అభ్యర్థించిన రికార్డు కనుగొనబడలేదు.",
  ],
  ALREADY_REVIEWED: [
    "This application has already been reviewed and cannot receive another decision in this demo.",
    "ఈ నమూనాలో ఇప్పటికే సమీక్షించిన దరఖాస్తుకు మళ్లీ నిర్ణయం ఇవ్వలేరు.",
  ],
  VALIDATION_ERROR: [
    "Please check the information and try again.",
    "దయచేసి వివరాలను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
  ],
  SERVER_ERROR: [
    "Something went wrong on our side. Please try again shortly.",
    "సర్వర్‌లో సమస్య ఏర్పడింది. దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
  ],
  REQUEST_ERROR: [
    "We could not complete that request. Please try again.",
    "ఆ అభ్యర్థనను పూర్తి చేయలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.",
  ],
};

export function t(language, english, telugu) {
  return language === "te" ? telugu : english;
}

export function errorMessage(language, error) {
  const code = typeof error === "string" ? error : error?.code;
  const pair = ERROR_TRANSLATIONS[code] || ERROR_TRANSLATIONS.REQUEST_ERROR;
  return pair[language === "te" ? 1 : 0];
}

export function statusLabel(language, status) {
  const labels = {
    PENDING: ["Pending", "పెండింగ్‌లో ఉంది"],
    APPROVED: ["Approved", "ఆమోదించబడింది"],
    REJECTED: ["Rejected", "తిరస్కరించబడింది"],
    RETURNED: ["Returned for correction", "సవరణ కోసం తిరిగి పంపబడింది"],
  };
  const pair = labels[status];
  return pair ? pair[language === "te" ? 1 : 0] : t(language, "Unknown status", "తెలియని స్థితి");
}

export function actionLabel(language, action) {
  const labels = {
    APPROVE: ["Approve", "ఆమోదించండి"],
    REJECT: ["Reject", "తిరస్కరించండి"],
    RETURN_FOR_CORRECTION: ["Return for correction", "సవరణ కోసం తిరిగి పంపండి"],
  };
  const pair = labels[action];
  return pair ? pair[language === "te" ? 1 : 0] : t(language, "Unknown action", "తెలియని చర్య");
}
