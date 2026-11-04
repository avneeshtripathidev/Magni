/**
 * Magnevents Programmatic SEO Content & FAQ Generators
 * Generates authoritative, localized, and intent-focused content blocks
 * for live entertainment, singers, bands, DJs, and emcees across India.
 */

export function generateOverview(category, city) {
  const cityLabel = (!city || city === 'All Cities') ? 'India' : city;
  const catName = category === 'All' ? 'Artists' : category;
  const catLower = catName.toLowerCase();
  const isDJ = catLower.includes('dj');
  const isBand = catLower.includes('band') || catLower.includes('qawwali');
  const isSufi = catLower.includes('sufi') || catLower.includes('ghazal') || catLower.includes('gazal');
  const isAcoustic = catLower.includes('acoustic') || catLower.includes('guitarist');
  const isComedian = catLower.includes('comedian') || catLower.includes('standup');
  const isAnchor = catLower.includes('anchor') || catLower.includes('emcee');
  const pluralCat = isDJ ? 'DJs' : (catName.endsWith('s') ? catName : `${catName}s`);
  
  if (isDJ) {
    return `
      <p style="margin-bottom: 16px;">
        Looking to book the best <strong>wedding & club DJs in ${cityLabel}</strong>? Whether you are planning a high-octane wedding Sangeet, a stylish cocktail party, or an intimate private gathering, professional sound and DJ console setups define the celebration. Magnevents connects you directly with top verified club and wedding DJs in ${cityLabel}.
      </p>
      <p style="margin-bottom: 16px;">
        Every DJ booking package includes professional Pioneer DJ consoles, club-standard JBL/RCF sound and intelligent beam lighting, plus customized setlists spanning Bollywood remixes, Punjabi party anthems, Commercial EDM, and Retro classics. Book verified DJs in ${cityLabel} today with direct pricing, 0% agency commission, and a 100% Artist Arrival Guarantee.
      </p>
    `;
  }

  if (isBand) {
    return `
      <p style="margin-bottom: 16px;">
        Looking to hire an electrifying <strong>live music band in ${cityLabel}</strong>? From 4-to-6-piece Bollywood fusion bands to energetic rock, pop, and Sufi ensembles, live instruments create an unmatched stage atmosphere for weddings, corporate annual galas, and college festivals.
      </p>
      <p style="margin-bottom: 16px;">
        Magnevents offers direct access to ${cityLabel}'s top live bands complete with acoustic drum kits, bassists, lead guitarists, keyboardists, and vocalists. Experience transparent pricing, verified performance live videos, full technical stage rider coordination, and a 100% Artist Arrival Guarantee.
      </p>
    `;
  }

  if (isSufi) {
    return `
      <p style="margin-bottom: 16px;">
        Planning an enchanting <strong>Sufi night or Ghazal mehfil in ${cityLabel}</strong>? Soulful acoustic melodies, classical harmonium, and expressive tabla beats create a magical, intimate ambiance for wedding Sangeet ceremonies, anniversary dinners, and private farmhouse celebrations.
      </p>
      <p style="margin-bottom: 16px;">
        Browse our curated roster of verified Sufi and Ghazal singers in ${cityLabel} specializing in the timeless compositions of Nusrat Fateh Ali Khan, Jagjit Singh, and contemporary Bollywood Sufi hits. Book directly with zero agency markup and guaranteed performer arrival.
      </p>
    `;
  }

  if (isAcoustic) {
    return `
      <p style="margin-bottom: 16px;">
        Want to host an intimate <strong>acoustic singer or guitarist for your house party in ${cityLabel}</strong>? There is nothing quite like having a talented vocalist perform unplugged Bollywood, indie pop, and retro classics right in your living room or terrace garden.
      </p>
      <p style="margin-bottom: 16px;">
        Magnevents delivers compact, high-fidelity acoustic setups suitable for apartments, villas, and backyard gatherings starting from just ₹5,999. Enjoy direct artist booking, transparent pricing, and unforgettable singalongs with friends and family.
      </p>
    `;
  }

  if (isAnchor) {
    return `
      <p style="margin-bottom: 16px;">
        Need an engaging <strong>event anchor or emcee in ${cityLabel}</strong>? A charismatic host keeps your audience captivated, manages timeline transitions smoothly, and energizes wedding sangeets, corporate galas, and family milestones.
      </p>
      <p style="margin-bottom: 16px;">
        Book bilingual (English & Hindi) verified anchors in ${cityLabel} experienced in crowd engagement, interactive games, and formal stage protocol with 0% agency markup.
      </p>
    `;
  }

  if (isComedian) {
    return `
      <p style="margin-bottom: 16px;">
        Looking to hire a hilarious <strong>stand-up comedian in ${cityLabel}</strong>? Stand-up comedy is the ultimate crowd-pleaser for corporate annual meets, private club gatherings, and festive celebrations.
      </p>
      <p style="margin-bottom: 16px;">
        Magnevents connects you with verified observational and corporate-clean comedians in ${cityLabel}. Review past performance clips and book directly with full pricing transparency.
      </p>
    `;
  }

  return `
    <p style="margin-bottom: 16px;">
      Looking to book the best <strong>${pluralCat} in ${cityLabel}</strong>? Whether you are planning a grand wedding celebration, an intimate house party, or a prestigious corporate event, hiring the right live entertainment makes all the difference. Magnevents offers a verified roster of highly rated ${pluralCat.toLowerCase()} available for hire across ${cityLabel}.
    </p>
    <p style="margin-bottom: 16px;">
      Our direct booking marketplace makes it simple to discover local talent. Every performer profile includes verified live performance videos, authentic client reviews, and direct pricing starting from ₹5,999. Book your verified ${catName.toLowerCase()} in ${cityLabel} today with 0% agency fees and a 100% Artist Arrival Guarantee.
    </p>
  `;
}

export function generateServices(category, city) {
  const cityLabel = (!city || city === 'All Cities') ? 'India' : city;
  const catName = category === 'All' ? 'Artist' : category;
  const catLower = catName.toLowerCase();
  const isDJ = catLower.includes('dj');
  const isBand = catLower.includes('band');
  const isSufi = catLower.includes('sufi') || catLower.includes('ghazal');
  const isAcoustic = catLower.includes('acoustic') || catLower.includes('guitarist');

  if (isDJ) {
    return [
      { title: `Wedding Sangeet & Baraat`, desc: `High-voltage wedding DJ sets accompanied by live Punjabi Dhol masters to keep your dance floor packed all night in ${cityLabel}.` },
      { title: `Cocktails & Club After-Parties`, desc: `Seamless transitions of Commercial EDM, Tech House, and Bollywood chartbusters with intelligent moving head lights.` },
      { title: `Private House & Terrace Parties`, desc: `Compact Pioneer DJ console setups with crystal-clear sound, wireless mics, and personalized playlists tailored to your guests.` }
    ];
  }

  if (isBand) {
    return [
      { title: `Wedding Sangeet & Reception Galas`, desc: `Full 4 to 6-piece live bands performing high-energy Bollywood medleys, Punjabi folk, and retro rock for grand celebrations in ${cityLabel}.` },
      { title: `Corporate Events & Annual Meets`, desc: `Sophisticated live instrumental and vocal sets tailored for corporate awards, product launches, and gala dinners.` },
      { title: `College Fests & Public Concerts`, desc: `High-impact rock and fusion band performances engineered for large crowds with complete stage sound coordination.` }
    ];
  }

  if (isSufi) {
    return [
      { title: `Sangeet Sufi Nights`, desc: `Soulful qawwali and Sufi Bollywood medleys creating an unforgettable spiritual and celebratory mood in ${cityLabel}.` },
      { title: `Intimate Ghazal Mehfils`, desc: `Classic Jagjit Singh, Mehdi Hassan, and contemporary ghazals with acoustic harmonium, flute, and tabla accompaniment.` },
      { title: `Private Farmhouse Gatherings`, desc: `Warm baithak-style acoustic musical evenings for private dinners, milestone birthdays, and anniversaries.` }
    ];
  }

  if (isAcoustic) {
    return [
      { title: `Living Room & Terrace Gigs`, desc: `Unplugged acoustic guitarists and singers performing Bollywood retro, pop, and indie singalongs with compact sound in ${cityLabel}.` },
      { title: `Cocktails & Sundowners`, desc: `Laid-back golden hour melodies and acoustic percussion perfect for poolside parties and open-air celebrations.` },
      { title: `Birthday & Anniversary Celebrations`, desc: `Personalized live musical dedications and interactive crowd-favorite songs to celebrate loved ones.` }
    ];
  }
  
  return [
    { title: `Weddings & Pre-Wedding Sangeet`, desc: `Hire a soulful ${catName.toLowerCase()} in ${cityLabel} to make your special milestone unforgettable.` },
    { title: `Corporate Events & Gala Dinners`, desc: `Professional ${catName.toLowerCase()}s ideal for corporate galas, product launches, and annual celebrations in ${cityLabel}.` },
    { title: `Private House Parties & Gigs`, desc: `Engage your guests with an interactive ${catName.toLowerCase()} right in your home or private venue.` }
  ];
}

export function generateFAQs(category, city) {
  const cityLabel = (!city || city === 'All Cities') ? 'India' : city;
  const catName = category === 'All' ? 'Artist' : category;
  const catLower = catName.toLowerCase();
  const isDJ = catLower.includes('dj');
  const isBand = catLower.includes('band');
  const isSufi = catLower.includes('sufi') || catLower.includes('ghazal');
  const isAcoustic = catLower.includes('acoustic') || catLower.includes('guitarist');

  if (isDJ) {
    return [
      {
        question: `How much does it cost to hire a DJ in ${cityLabel}?`,
        answer: `The cost of booking a professional DJ in ${cityLabel} typically ranges from ₹15,000 for house parties to ₹60,000+ for full wedding setups including sound, dhol, and stage lighting. Magnevents guarantees direct artist pricing with 0% agency markup.`
      },
      {
        question: `Do DJs in ${cityLabel} provide their own sound and lighting setups?`,
        answer: `Yes! You can book complete DJ packages including Pioneer CDJ/XDJ consoles, high-output JBL/RCF sound systems, wireless mics, stage trusses, moving head beams, and cold pyro spark machines.`
      },
      {
        question: `Can I customize the playlist and music genres for my event?`,
        answer: `Absolutely. Once booked, your dedicated Magnevents entertainment coordinator will connect you with the DJ to finalize must-play songs, favorite genres (Bollywood, Punjabi, EDM, 90s, English Pop), and do-not-play lists.`
      }
    ];
  }

  if (isBand) {
    return [
      {
        question: `What is the cost of booking a live band in ${cityLabel}?`,
        answer: `Live bands in ${cityLabel} typically range from ₹35,000 for an acoustic 3-piece setup to ₹1,50,000+ for a full 5-to-6-piece wedding or corporate band with live drums and stage sound engineering.`
      },
      {
        question: `What technical and sound equipment does a live band require?`,
        answer: `Full bands require a PA system with vocal microphones, drum mic kits, stage monitors, a multi-channel digital mixer, and direct input (DI) boxes. Magnevents can coordinate complete stage sound riders for your venue in ${cityLabel}.`
      },
      {
        question: `Can the band perform both Bollywood and Western songs?`,
        answer: `Yes! Our verified bands in ${cityLabel} specialize in versatile multilingual setlists, seamlessly blending high-energy Bollywood medleys, Punjabi folk, Sufi, and Western pop/rock classics.`
      }
    ];
  }

  if (isSufi) {
    return [
      {
        question: `How much does a Sufi or Ghazal night cost in ${cityLabel}?`,
        answer: `A Sufi or Ghazal performance in ${cityLabel} typically starts from ₹20,000 for an acoustic vocalist with harmonium/tabla, and ranges to ₹80,000+ for a complete ensemble with flute, keyboard, and sound production.`
      },
      {
        question: `What is the ideal venue setup for a Sufi mehfil?`,
        answer: `Sufi and Ghazal performances shine with baithak-style floor seating (gaddas and bolsters) or banquet round tables, accompanied by warm, ambient lighting and crisp acoustic monitors.`
      },
      {
        question: `Can we request specific compositions by Nusrat Fateh Ali Khan or Jagjit Singh?`,
        answer: `Yes, our Sufi and Ghazal artists welcome curated request lists including classic qawwalis, vintage ghazals, and modern acoustic Sufi anthems.`
      }
    ];
  }

  if (isAcoustic) {
    return [
      {
        question: `How much does an acoustic singer for a house party cost in ${cityLabel}?`,
        answer: `Acoustic solo singers and guitarists for private parties in ${cityLabel} start from ₹5,999 to ₹15,000, which includes their personal guitar, vocal mic, and a compact portable sound system.`
      },
      {
        question: `Does an acoustic singer need a large room or stage setup?`,
        answer: `Not at all. Acoustic performers require just a 2x2 meter space and a single regular domestic power outlet. Their compact sound towers deliver studio-quality acoustic sound without overpowering home living rooms.`
      },
      {
        question: `Can guests sing along and make live song requests?`,
        answer: `Yes! Interactive crowd engagement is a hallmark of our acoustic house party artists. Guests frequently sing along to Bollywood unplugged, pop hits, and 90s nostalgia.`
      }
    ];
  }

  return [
    {
      question: `How much does it cost to hire a ${catName} in ${cityLabel}?`,
      answer: `The cost of hiring a verified ${catName} in ${cityLabel} starts from ₹5,999 for solo intimate gigs and ranges to ₹60,000+ for grand wedding and corporate events. Magnevents offers transparent pricing on all artist profiles with 0% agency markup.`
    },
    {
      question: `How do I book a ${catName} for an event in ${cityLabel}?`,
      answer: `Browse our curated roster of ${catName}s in ${cityLabel}, review their live performance videos and authentic client reviews, and submit an instant booking inquiry or date lock. Our concierge coordinates all scheduling details seamlessly.`
    },
    {
      question: `Do the ${catName}s in ${cityLabel} bring their own sound equipment?`,
      answer: `Most solo performers carry personal instruments and portable sound gear. For larger weddings or galas in ${cityLabel}, complete professional sound and lighting setups can be arranged directly through Magnevents.`
    }
  ];
}

export function generateRelatedLinks(category, city) {
  const cityLabel = (!city || city === 'All Cities') ? 'India' : city;
  const otherCategories = ['Live Band', 'Singer', 'DJ', 'Comedian', 'Musician'].filter(c => c.toLowerCase() !== category.toLowerCase());
  
  return otherCategories.map(cat => ({
    title: `${cat} in ${cityLabel}`,
    url: `/${cat.toLowerCase().replace(/ /g, '-')}-in-${cityLabel.toLowerCase().replace(/ /g, '-')}`
  }));
}
