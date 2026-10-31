/**
 * i18n string definitions for English and Telugu.
 * Matches Section 18 Table and accessibility guidelines.
 */

export interface Strings {
  app_name: string;
  choose_language: string;
  continue: string;
  ask_voice: string;
  or_type: string;
  send: string;
  listening: string;
  speak_again: string;
  check_words: string;
  listen_again: string;
  ask_assistant: string;
  check_eligibility: string;
  browse_schemes: string;
  required_documents: string;
  application_guide: string;
  nearby_centres: string;
  need_help: string;
  eligible: string;
  not_eligible: string;
  cannot_decide: string;
  yes: string;
  no: string;
  dont_know: string;
  required: string;
  optional: string;
  confirm_office: string;
  source: string;
  last_verified: string;
  official: string;
  gov_portal: string;
  cross_check: string;
  offline_bar: string;
  err_voice: string;
  err_server: string;
  err_offline: string;
  not_submit: string;
  final_decision: string;
}

export const enStrings: Strings = {
  app_name: "Government Sahayak",
  choose_language: "Choose your language",
  continue: "Continue",
  ask_voice: "Ask by voice",
  or_type: "Or type your question",
  send: "Send",
  listening: "Listening…",
  speak_again: "Speak again",
  check_words: "Please check the words",
  listen_again: "Listen again",
  ask_assistant: "Ask the Assistant",
  check_eligibility: "Check Eligibility",
  browse_schemes: "Browse Schemes",
  required_documents: "Required Documents",
  application_guide: "Application Guide",
  nearby_centres: "Nearby Centres",
  need_help: "Need help",
  eligible: "Eligible",
  not_eligible: "Not eligible",
  cannot_decide: "Cannot decide yet",
  yes: "Yes",
  no: "No",
  dont_know: "Don't know",
  required: "Required",
  optional: "Optional",
  confirm_office: "Confirm at the office",
  source: "Source",
  last_verified: "Last verified",
  official: "Official",
  gov_portal: "Government portal",
  cross_check: "Cross-check only",
  offline_bar: "You are offline. Showing saved information.",
  err_voice: "Sorry, I couldn't understand the voice input. Please try again or type.",
  err_server: "Sorry, something went wrong on our side. Please try again in a moment.",
  err_offline: "No internet. Please check your connection and try again.",
  not_submit: "This app does not submit applications for you.",
  final_decision: "The final decision is made by the government department.",
};

export const teStrings: Strings = {
  app_name: "గవర్నమెంట్ సహాయక్",
  choose_language: "భాషను ఎంచుకోండి",
  continue: "కొనసాగించు",
  ask_voice: "మాట్లాడి అడగండి",
  or_type: "లేదా టైప్ చేయండి",
  send: "పంపండి",
  listening: "వింటున్నాను…",
  speak_again: "మళ్లీ చెప్పండి",
  check_words: "దయచేసి పదాలను సరిచూడండి",
  listen_again: "మళ్లీ వినండి",
  ask_assistant: "అడగండి",
  check_eligibility: "అర్హత తనిఖీ",
  browse_schemes: "పథకాల జాబితా",
  required_documents: "కావలసిన పత్రాలు",
  application_guide: "దరఖాస్తు మార్గదర్శి",
  nearby_centres: "దగ్గరలోని కేంద్రాలు",
  need_help: "సహాయం కావాలి",
  eligible: "అర్హులు",
  not_eligible: "అర్హులు కారు",
  cannot_decide: "ఇప్పుడే నిర్ణయించలేము",
  yes: "అవును",
  no: "కాదు",
  dont_know: "తెలియదు",
  required: "తప్పనిసరి",
  optional: "ఐచ్ఛికం",
  confirm_office: "కార్యాలయంలో నిర్ధారించుకోండి",
  source: "ఆధారం",
  last_verified: "చివరిగా ధృవీకరించిన తేదీ",
  official: "అధికారిక",
  gov_portal: "ప్రభుత్వ పోర్టల్",
  cross_check: "సరిచూసుకోవడానికి మాత్రమే",
  offline_bar: "ఇంటర్నెట్ లేదు. సేవ్ చేసిన సమాచారం చూపిస్తున్నాము.",
  err_voice: "క్షమించండి, మీ వాయిస్ అర్థం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.",
  err_server: "క్షమించండి, మా వైపు ఏదో సమస్య వచ్చింది. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
  err_offline: "ఇంటర్నెట్ లేదు. కనెక్షన్ చూసి మళ్లీ ప్రయత్నించండి.",
  not_submit: "ఈ యాప్ మీ తరపున దరఖాస్తు సమర్పించదు.",
  final_decision: "తుది నిర్ణయం ప్రభుత్వ శాఖ తీసుకుంటుంది.",
};

export function getStrings(lang: "te" | "en" | string): Strings {
  return lang === "te" ? teStrings : enStrings;
}
