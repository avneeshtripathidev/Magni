/**
 * Formats and protects artist stage names to prevent client disintermediation / privacy breaches.
 * Ensures that full personal names/surnames are masked to safe single first names or moniker + suffix
 * (e.g. "Vishall Live", "Vishall", "Rajvi") without exposing surnames or surname initials (e.g. no "P." or "Pandey"),
 * while preserving valid single stage names ("Rajvi", "Dhruv"), band names ("Euphonic Band", "The Local Train"),
 * and DJ titles ("DJ Chinna", "DJ Rahul").
 *
 * @param {string} rawName - Legal or personal name of the artist (e.g., "VISHALL PANDEY")
 * @param {string} rawAlias - Stage name or alias (e.g., "Vishall pandey live", "Rajvi", "VIP Live")
 * @returns {string} - Safe display name (e.g., "Vishall Live", "Rajvi", "DJ Chinna")
 */
export function formatArtistDisplayName(rawName, rawAlias) {
  let candidate = (rawAlias && rawAlias.trim()) || (rawName && rawName.trim()) || 'Performer';
  
  // Collapse whitespace
  candidate = candidate.replace(/\s+/g, ' ').trim();

  // If already single word (e.g. "Rajvi", "Akum", "Dhruv", "Abhi")
  const parts = candidate.split(' ');
  if (parts.length === 1) {
    if (parts[0].length <= 4 && parts[0] === parts[0].toUpperCase()) {
      return parts[0]; // e.g. "AAA", "RDM", "VB", "NIIL"
    }
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }

  // Check if candidate starts with DJ / MC / RJ
  const firstLower = parts[0].toLowerCase();
  if (firstLower === 'dj' || firstLower === 'mc' || firstLower === 'rj') {
    const prefix = parts[0].toUpperCase();
    if (parts.length === 2) {
      const rest = parts[1].length <= 3 ? parts[1].toUpperCase() : parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${prefix} ${rest}`;
    } else {
      // E.g. "DJ Rahul Sharma" -> minimize to "DJ Rahul"
      const first = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${prefix} ${first}`;
    }
  }

  // Preserve established band names: "The ...", "... Band", "... Collective", "... Project", "... Trio", "... Quartet", "... Orchestra", "... Group"
  const isBand = /^(the\s|.*(band|collective|project|trio|quartet|orchestra|group)$)/i.test(candidate);
  if (isBand && !candidate.toLowerCase().includes('live')) {
    return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const suffixes = ['live', 'band', 'unplugged', 'music', 'acoustic', 'official', 'singer', 'session'];
  const lastLower = parts[parts.length - 1].toLowerCase();
  const hasSuffix = suffixes.includes(lastLower);

  // Preserve established dotted stage monikers like "M.D. Live", "H24 Live", "Rohit.j Live"
  // but NOT single initials like "P." or "Vishall P. Live"
  const isSingleInitial = parts.some(p => /^[A-Za-z]\.?$/.test(p) && p.toLowerCase() !== 'dj' && p.toLowerCase() !== 'mc');
  if (candidate.includes('.') && !isSingleInitial) {
    return candidate;
  }

  // If hasSuffix (e.g. "Vishall pandey live", "Vishall P. Live", "Vishall Live", "Aman Live", "VIP Live")
  if (hasSuffix) {
    const firstWord = parts[0];
    const first = (firstWord.length <= 3 && firstWord === firstWord.toUpperCase()) 
      ? firstWord 
      : firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    
    // Find suffix words at the end
    const suffixWords = parts.slice(1).filter(w => suffixes.includes(w.toLowerCase()));
    const suffixStr = suffixWords.length > 0 
      ? suffixWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1).toLowerCase();

    return `${first} ${suffixStr}`;
  }

  // No suffix, multiple words (e.g. "VISHALL PANDEY", "Vishall P.", "Rajvi Jigneshkumar Prajapati", "Sarvesh Gawas")
  const firstWord = parts[0];
  if (firstWord.length <= 4 && firstWord === firstWord.toUpperCase()) {
    return firstWord;
  }
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}
