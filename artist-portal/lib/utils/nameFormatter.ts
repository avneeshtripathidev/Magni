/**
 * Formats and protects artist stage names to prevent client disintermediation / privacy breaches.
 * Ensures that full personal names/surnames are masked (e.g. "Vishall P. Live" or "Vishall P.")
 * while preserving valid single stage names ("Rajvi", "Dhruv"), band names ("Euphonic Band", "The Local Train"),
 * and DJ titles ("DJ Chinna").
 */
export function formatArtistDisplayName(rawName?: string | null, rawAlias?: string | null): string {
  let candidate = (rawAlias && rawAlias.trim()) || (rawName && rawName.trim()) || 'Performer';
  
  // Collapse whitespace
  candidate = candidate.replace(/\s+/g, ' ').trim();

  // If already single word (e.g. "Rajvi", "Akum", "Dhruv", "Abhi")
  const parts = candidate.split(' ');
  if (parts.length === 1) {
    if (parts[0].length <= 4 && parts[0] === parts[0].toUpperCase()) {
      return parts[0];
    }
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }

  // Preserve established initialisms / dotted stage monikers like "M.D. Live", "H24 Live", "Rohit.j Live"
  if (candidate.includes('.')) {
    return candidate;
  }

  const firstLower = parts[0].toLowerCase();
  // Handle DJ / MC / RJ
  if (firstLower === 'dj' || firstLower === 'mc' || firstLower === 'rj') {
    const prefix = parts[0].toUpperCase();
    if (parts.length === 2) {
      const rest = parts[1].length <= 3 ? parts[1].toUpperCase() : parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${prefix} ${rest}`;
    } else {
      const first = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase().replace(/\.$/, '');
      return `${prefix} ${first} ${lastInitial}.`;
    }
  }

  // Preserve established band names
  const isBand = /^(the\s|.*(band|collective|project|trio|quartet|orchestra|group)$)/i.test(candidate);
  if (isBand && !candidate.toLowerCase().includes('live')) {
    return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const lastLower = parts[parts.length - 1].toLowerCase();
  const suffixes = ['live', 'band', 'unplugged', 'music', 'acoustic', 'official', 'singer', 'session'];
  const hasSuffix = suffixes.includes(lastLower);

  // Case 1: 2 words with suffix, e.g. "Aman Live", "VIP Live" -> Safe
  if (parts.length === 2 && hasSuffix) {
    const first = parts[0].length <= 3 ? parts[0].toUpperCase() : parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const suffix = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return `${first} ${suffix}`;
  }

  // Case 2: 2 words without suffix, e.g. "VISHALL PANDEY" -> Mask to "Vishall P."
  if (parts.length === 2 && !hasSuffix) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastInitial = parts[1].charAt(0).toUpperCase().replace(/\.$/, '');
    return `${first} ${lastInitial}.`;
  }

  // Case 3: 3+ words with suffix, e.g. "Vishall pandey live" -> Mask to "Vishall P. Live"
  if (parts.length >= 3 && hasSuffix) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const surnameInitial = parts[1].charAt(0).toUpperCase().replace(/\.$/, '');
    const suffix = parts.slice(2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return `${first} ${surnameInitial}. ${suffix}`;
  }

  // Case 4: 3+ words without suffix, e.g. "Rajvi Jigneshkumar Prajapati" -> "Rajvi P."
  if (parts.length >= 3 && !hasSuffix) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase().replace(/\.$/, '');
    return `${first} ${surnameInitial}.`;
  }

  return candidate;
}
