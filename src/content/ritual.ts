/**
 * Every piece of user-facing copy on the page.
 *
 * Kept in one data file rather than scattered through markup so that factual
 * and linguistic corrections can be made without touching layout — which
 * matters here, because ritual practice varies by family and region and the
 * Hindi needs a native speaker's review.
 *
 * Section ids must match the ids in `lib/narrative.ts`, which anchors each one
 * to a point on the symbolic day. The order here IS the page order.
 */

/** A bullet in a section's list, e.g. one prasad item. */
export interface RitualItem {
  /** Short label, Hindi where natural. */
  label: string;
  /** One-line explanation in English. */
  note: string;
}

/** One narrative section of the page. */
export interface RitualSection {
  /** Must match a `Stage.id` in `lib/narrative.ts`. */
  id: string;
  /** Day marker, e.g. "दिन 1 · Day 1". Omitted for non-day sections. */
  day?: string;
  /** Section heading in Hindi. */
  titleHi: string;
  /** Section heading in transliteration or English. */
  titleEn: string;
  /** Lead paragraph, Hindi. */
  bodyHi: string;
  /** Lead paragraph, English. */
  bodyEn: string;
  /** Optional bullet list. */
  items?: readonly RitualItem[];
  /**
   * Optional caveat shown in smaller type — used where the page's compressed
   * sky deliberately differs from the rite's real timing.
   */
  note?: string;
}

export const SECTIONS: readonly RitualSection[] = [
  {
    id: 'intro',
    titleHi: 'छठ पूजा',
    titleEn: 'Chhath Puja',
    bodyHi: 'सूर्य को अर्घ्य — चार दिन का महापर्व।',
    bodyEn:
      'A four-day festival offered to the sun. Scroll to walk through it — the sky moves with you, from this pre-dawn hour to the sunrise that ends the fast.',
  },
  {
    id: 'preparation',
    titleHi: 'तैयारी',
    titleEn: 'Preparation',
    bodyHi:
      'पर्व से पहले घर की सफाई होती है, गेहूँ धोकर सुखाया और पिसा जाता है, और रसोई पूरी तरह सात्विक हो जाती है।',
    bodyEn:
      'Before the four days begin, the house is cleaned thoroughly. Wheat is washed, dried and ground for thekua. The kitchen turns strictly satvik — no onion, no garlic, no meat — and stays that way until the fast is broken.',
    items: [
      { label: 'सूप · Soop', note: 'A flat bamboo winnowing tray that holds the offerings.' },
      { label: 'दउरा · Daura', note: 'The large bamboo basket that carries everything to the ghat.' },
      { label: 'नया बाँस · New bamboo', note: 'Both are bought new each year from local weavers.' },
    ],
  },
  {
    id: 'nahay-khay',
    day: 'दिन 1 · Day 1',
    titleHi: 'नहाय खाय',
    titleEn: 'Nahay Khay',
    bodyHi:
      'व्रती नदी या तालाब में स्नान करते हैं — यदि सम्भव हो तो गंगा में — और उसके बाद एक सात्विक भोजन करते हैं।',
    bodyEn:
      '"Bathe and eat." Devotees bathe in a river or pond, ideally the Ganga, then eat a single pure meal. It marks the entry into ritual purity, and everything after it is bound by that state.',
    items: [
      { label: 'भात · Rice', note: 'Plain, cooked in ghee.' },
      { label: 'चना दाल · Chana dal', note: 'Split chickpea lentils.' },
      { label: 'लौकी · Lauki', note: 'Bottle gourd — the traditional vegetable of this meal.' },
    ],
  },
  {
    id: 'kharna',
    day: 'दिन 2 · Day 2',
    titleHi: 'खरना',
    titleEn: 'Kharna',
    bodyHi:
      'सूर्योदय से सूर्यास्त तक निर्जल उपवास। सांझ को खीर और पूरी सूर्य को अर्पित कर व्रत खोला जाता है — और उसी क्षण छत्तीस घंटे का निर्जला व्रत शुरू हो जाता है।',
    bodyEn:
      'A full day of fasting with nothing at all, sunrise to sunset. At dusk it is broken with kheer and puri, offered first to Surya. That meal is also the last food and the last water for thirty-six hours — the nirjala fast begins the moment it ends.',
    note: 'The sky here reads as afternoon; the rite itself happens at dusk. The page compresses four days into one symbolic arc.',
  },
  {
    id: 'sandhya-arghya',
    day: 'दिन 3 · Day 3, sunset',
    titleHi: 'संध्या अर्घ्य',
    titleEn: 'Sandhya Arghya',
    bodyHi:
      'व्रती जल में खड़े होकर डूबते सूर्य को अर्घ्य देते हैं। घाट पर पूरा परिवार साथ होता है।',
    bodyEn:
      'The vratti stands in the water at sunset and offers arghya to the setting sun — thanks for the light already given. The soop is packed and carried to the ghat in the daura, and the whole family gathers on the bank.',
  },
  {
    id: 'kosi-bharai',
    day: 'दिन 3 · Day 3, night',
    titleHi: 'कोसी भराई',
    titleEn: 'Kosi Bharai',
    bodyHi:
      'पाँच से सात गन्ने बाँधकर मंडप बनाया जाता है, और उसके नीचे बारह से चौबीस दीये जलाए जाते हैं।',
    bodyEn:
      'Five to seven sugarcane stalks are tied into a canopy, and twelve to twenty-four earthen lamps are lit beneath it with thekua and fruit placed inside. It is performed by those whose vow has been granted, as a celebratory repayment — then repeated between three and four in the morning, before the family leaves again for the ghat.',
  },
  {
    id: 'usha-arghya',
    day: 'दिन 4 · Day 4, sunrise',
    titleHi: 'उषा अर्घ्य',
    titleEn: 'Usha Arghya',
    bodyHi:
      'भोर से पहले फिर जल में। उगते सूर्य को अंतिम अर्घ्य, और उसके बाद छत्तीस घंटे का व्रत खुलता है।',
    bodyEn:
      'Back in the water before first light. The final arghya goes to the rising sun — a prayer for the light still to come. When it is done, the thirty-six hour waterless fast is broken with the prasad. This is the climax of the festival.',
  },
  {
    id: 'prasad',
    titleHi: 'प्रसाद',
    titleEn: 'What is in the soop',
    bodyHi:
      'ठेकुआ इस पर्व की पहचान है। उसके साथ गन्ना, केला, नारियल, हल्दी और मौसमी फल।',
    bodyEn:
      'The produce is a thanksgiving for the harvest — nothing in the soop is bought for show, and most of it is whatever the season has actually given.',
    items: [
      { label: 'ठेकुआ · Thekua', note: 'Wheat flour, jaggery and ghee, often with cardamom or grated coconut, pressed into discs and deep-fried. The signature prasad.' },
      { label: 'कसार · Kasar', note: 'Balls of rice flour and jaggery.' },
      { label: 'गन्ना · Sugarcane', note: 'Whole stalks — also the material of the Kosi canopy.' },
      { label: 'केला · Banana', note: 'Offered on the stem where possible.' },
      { label: 'नारियल · Coconut', note: 'Whole, with the husk.' },
      { label: 'हल्दी · Turmeric root', note: 'Fresh, with the leaves still attached.' },
      { label: 'मौसमी फल · Seasonal fruit', note: 'Sweet potato, radish, lemon, guava, orange, pomegranate.' },
    ],
  },
  {
    id: 'unique',
    titleHi: 'क्या खास है',
    titleEn: 'What makes Chhath unlike any other',
    bodyHi:
      'न पुरोहित, न मूर्ति, न मंदिर। व्रती स्वयं जल में खड़े होकर अर्घ्य देते हैं।',
    bodyEn:
      'Most festivals put something between the worshipper and the god. This one removes it.',
    items: [
      { label: 'Both suns', note: 'The only festival that worships the setting sun as well as the rising one — gratitude for the light already given, and a prayer for the light to come.' },
      { label: 'No intermediary', note: 'No priest, no idol, no temple. The fasting person stands in the water and offers directly.' },
      { label: 'छठी मैया · Chhathi Maiya', note: "Held in folk tradition to be Surya's sister — a protective maternal goddess, invoked for children's long life." },
      { label: '36 hours', note: 'The nirjala fast runs without food or water, most often kept by women, called vratti or parvaitin.' },
    ],
  },
  {
    id: 'credits',
    titleHi: 'शारदा सिन्हा',
    titleEn: 'The voice of Chhath',
    bodyHi:
      'इस सूची की अधिकांश आवाज़ शारदा सिन्हा की है — बिहार कोकिला।',
    bodyEn:
      'Most of the voices you have been listening to are Sharda Sinha\'s. For decades her Chhath geet played in every house through these four days, from the grinding of the wheat to the last arghya. She died on 5 November 2024 — the first day of Chhath that year — one day after releasing her final Chhath song.',
    note: 'Songs stream from YouTube. Ritual details follow the common Bihar and eastern Uttar Pradesh form; practice varies by family and region.',
  },
];
