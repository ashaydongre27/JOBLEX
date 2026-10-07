/**
 * JOBLEX Curated Institutions & Colleges Directory
 * Pre-populated master list for searchable asynchronous combobox with instant suggestions
 */

const COLLEGES_DIRECTORY = [
  { name: 'Indian Institute of Technology Bombay (IIT Bombay)', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Indian Institute of Technology Delhi (IIT Delhi)', city: 'New Delhi', state: 'Delhi' },
  { name: 'Indian Institute of Technology Madras (IIT Madras)', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Kanpur (IIT Kanpur)', city: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Indian Institute of Technology Kharagpur (IIT Kharagpur)', city: 'Kharagpur', state: 'West Bengal' },
  { name: 'Indian Institute of Technology Roorkee (IIT Roorkee)', city: 'Roorkee', state: 'Uttarakhand' },
  { name: 'Indian Institute of Technology Guwahati (IIT Guwahati)', city: 'Guwahati', state: 'Assam' },
  { name: 'Indian Institute of Technology Hyderabad (IIT Hyderabad)', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Birla Institute of Technology and Science (BITS Pilani)', city: 'Pilani', state: 'Rajasthan' },
  { name: 'BITS Pilani - Goa Campus', city: 'Goa', state: 'Goa' },
  { name: 'BITS Pilani - Hyderabad Campus', city: 'Hyderabad', state: 'Telangana' },
  { name: 'National Institute of Technology Tiruchirappalli (NIT Trichy)', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { name: 'National Institute of Technology Karnataka (NIT Surathkal)', city: 'Surathkal', state: 'Karnataka' },
  { name: 'National Institute of Technology Warangal (NIT Warangal)', city: 'Warangal', state: 'Telangana' },
  { name: 'National Institute of Technology Rourkela (NIT Rourkela)', city: 'Rourkela', state: 'Odisha' },
  { name: 'Delhi Technological University (DTU)', city: 'New Delhi', state: 'Delhi' },
  { name: 'Netaji Subhas University of Technology (NSUT)', city: 'New Delhi', state: 'Delhi' },
  { name: 'International Institute of Information Technology (IIIT) Hyderabad', city: 'Hyderabad', state: 'Telangana' },
  { name: 'International Institute of Information Technology (IIIT) Bangalore', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Vellore Institute of Technology (VIT)', city: 'Vellore', state: 'Tamil Nadu' },
  { name: 'Manipal Institute of Technology (MAHE)', city: 'Manipal', state: 'Karnataka' },
  { name: 'SRM Institute of Science and Technology', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Thapar Institute of Engineering and Technology', city: 'Patiala', state: 'Punjab' },
  { name: 'College of Engineering Pune (COEP)', city: 'Pune', state: 'Maharashtra' },
  { name: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal' },
  { name: 'All India Institute of Ayurveda (AIIA)', city: 'New Delhi', state: 'Delhi' },
  { name: 'National Institute of Ayurveda (NIA)', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Institute of Teaching and Research in Ayurveda (ITRA)', city: 'Jamnagar', state: 'Gujarat' },
  { name: 'Banaras Hindu University (BHU)', city: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'University of Delhi (DU)', city: 'New Delhi', state: 'Delhi' },
  { name: 'Jawaharlal Nehru University (JNU)', city: 'New Delhi', state: 'Delhi' },
  { name: 'Anna University', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Mumbai University', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'RV College of Engineering', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'BMS College of Engineering', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'PES University', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'MS Ramaiah Institute of Technology', city: 'Bengaluru', state: 'Karnataka' }
];

function searchColleges(query = '', limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return COLLEGES_DIRECTORY.slice(0, limit);
  }
  return COLLEGES_DIRECTORY.filter(item => 
    item.name.toLowerCase().includes(q) ||
    item.city.toLowerCase().includes(q) ||
    item.state.toLowerCase().includes(q)
  ).slice(0, limit);
}

const INSTITUTION_SYNONYMS = [
  ['aiia', 'all india institute of ayurveda', 'all india institute of ayurveda aiia', 'aiia new delhi'],
  ['iit', 'indian institute of technology'],
  ['nit', 'national institute of technology'],
  ['iiit', 'international institute of information technology'],
  ['aiims', 'all india institute of medical sciences'],
  ['nia', 'national institute of ayurveda'],
  ['itra', 'institute of teaching and research in ayurveda'],
  ['bhu', 'banaras hindu university', 'institute of medical sciences bhu'],
  ['niper', 'national institute of pharmaceutical education and research'],
  ['du', 'delhi university', 'university of delhi'],
  ['bits', 'birla institute of technology and science', 'bits pilani'],
  ['dtu', 'delhi technological university'],
  ['nsut', 'netaji subhas university of technology'],
  ['vit', 'vellore institute of technology']
];

function normalizeInstitutionName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function textMatchesAlias(normText, alias) {
  if (!normText || !alias) return false;
  if (normText === alias) return true;
  if (alias.length <= 5 || !alias.includes(' ')) {
    const words = normText.split(/\s+/);
    return words.includes(alias);
  }
  return normText.includes(alias) || alias.includes(normText);
}

function matchInstitutions(instA, instB) {
  if (!instA || !instB) return false;
  const aNorm = normalizeInstitutionName(instA);
  const bNorm = normalizeInstitutionName(instB);
  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;
  if (Math.min(aNorm.length, bNorm.length) >= 8 && (aNorm.includes(bNorm) || bNorm.includes(aNorm))) return true;

  for (const group of INSTITUTION_SYNONYMS) {
    const aMatches = group.some(alias => textMatchesAlias(aNorm, alias));
    const bMatches = group.some(alias => textMatchesAlias(bNorm, alias));
    if (aMatches && bMatches) return true;
  }
  return false;
}

module.exports = {
  COLLEGES_DIRECTORY,
  searchColleges,
  normalizeInstitutionName,
  matchInstitutions
};

