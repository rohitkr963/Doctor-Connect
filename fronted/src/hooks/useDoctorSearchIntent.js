// Hook to extract doctor search intent and parameters from user message
export default function useDoctorSearchIntent() {
  // Returns: { isDoctorSearch, name, specialty, city }
  function parse(message) {
    if (!message) return { isDoctorSearch: false };
    const msg = message.toLowerCase();
    // Basic intent detection
    const doctorWords = ['find doctor', 'doctor', 'specialist', 'physician', 'consult', 'neuro', 'cardio', 'ortho', 'derma', 'dentist', 'pediatric', 'gyne', 'urolog', 'nephro', 'gastro', 'pulmo', 'ophthal', 'psychi', 'onco'];
    const isDoctorSearch = doctorWords.some(word => msg.includes(word));
    if (!isDoctorSearch) return { isDoctorSearch: false };
    // Extract name (word after 'doctor' or 'dr')
    let name = '';
    const nameMatch = msg.match(/doctor\s+([a-z]+)/i) || msg.match(/dr\.?\s*([a-z]+)/i);
    if (nameMatch) name = nameMatch[1];
    // Extract specialty
    const specialties = ['neurologist', 'cardiologist', 'dentist', 'orthopedic', 'dermatologist', 'pediatrician', 'gynecologist', 'ent', 'psychiatrist', 'oncologist', 'urologist', 'nephrologist', 'gastroenterologist', 'pulmonologist', 'ophthalmologist', 'general physician'];
    let specialty = specialties.find(spec => msg.includes(spec));
    // Extract city/location
    let city = '';
    const cityMatch = msg.match(/in\s+([a-z ]+)/i);
    if (cityMatch) city = cityMatch[1].trim();
    return { isDoctorSearch, name, specialty, city };
  }
  return { parse };
}
