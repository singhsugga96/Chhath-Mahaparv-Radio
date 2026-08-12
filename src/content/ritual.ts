/**
 * Every piece of user-facing copy on the page.
 *
 * Kept in one data file rather than scattered through markup so that factual
 * and linguistic corrections can be made without touching layout, which matters
 * here because ritual practice varies by family and region and the Hindi needs a
 * native speaker's review.
 *
 * House style: plain sentences, no em dashes, and nothing that reads like a
 * brochure. Say what happens and let it be.
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
   * Optional caveat shown in smaller type, used where the page's compressed sky
   * deliberately differs from the rite's real timing.
   */
  note?: string;
}

export const SECTIONS: readonly RitualSection[] = [
  {
    id: 'intro',
    titleHi: 'छठ पूजा',
    titleEn: 'Chhath Puja',
    bodyHi: 'चार दिन का पर्व, जिसमें सूरज को अर्घ्य दिया जाता है।',
    bodyEn:
      'Four days of prayer to the sun. Scroll down and the sky moves with you, from this early hour before dawn all the way to the sunrise that ends the fast.',
  },
  {
    id: 'preparation',
    titleHi: 'तैयारी',
    titleEn: 'Getting ready',
    bodyHi:
      'पर्व से पहले घर की सफ़ाई होती है। गेहूँ धोकर सुखाया और पिसा जाता है, और रसोई पूरी तरह सात्विक हो जाती है।',
    bodyEn:
      'The days before Chhath go into getting ready. The house is cleaned top to bottom, wheat is washed, dried and ground for thekua, and the kitchen turns fully satvik. No onion, no garlic, no meat, and it stays that way until the fast is broken.',
    items: [
      { label: 'सूप · Soop', note: 'A flat bamboo tray that holds the offerings.' },
      { label: 'दउरा · Daura', note: 'The big basket everything is carried to the river in.' },
      { label: 'नया बाँस · New bamboo', note: 'Both are bought fresh each year from local weavers.' },
    ],
  },
  {
    id: 'nahay-khay',
    day: 'दिन 1 · Day 1',
    titleHi: 'नहाय खाय',
    titleEn: 'Nahay Khay',
    bodyHi:
      'व्रती नदी या तालाब में स्नान करते हैं, हो सके तो गंगा में, और उसके बाद एक सात्विक भोजन करते हैं।',
    bodyEn:
      'The name simply means bathe and eat. People bathe in a river or a pond, in the Ganga if they can reach it, and then sit down to one plain meal. Everything that follows is done in that state of purity.',
    items: [
      { label: 'भात · Rice', note: 'Plain, cooked in ghee.' },
      { label: 'चना दाल · Chana dal', note: 'Split chickpea lentils.' },
      { label: 'लौकी · Lauki', note: 'Bottle gourd, the vegetable this meal is known for.' },
    ],
  },
  {
    id: 'kharna',
    day: 'दिन 2 · Day 2',
    titleHi: 'खरना',
    titleEn: 'Kharna',
    bodyHi:
      'सूर्योदय से सूर्यास्त तक बिना अन्न-जल का उपवास। सांझ को खीर और पूरी सूर्य को अर्पित कर व्रत खोला जाता है, और उसी के साथ छत्तीस घंटे का निर्जला व्रत शुरू हो जाता है।',
    bodyEn:
      'A whole day of fasting, sunrise to sunset, without even water. At dusk it is broken with kheer and puri that go to Surya first. That same meal is the last food and the last water for the next thirty six hours, because the nirjala fast begins the moment it ends.',
    note: 'The sky here shows afternoon, though the meal itself happens at dusk. The page folds four days into one.',
  },
  {
    id: 'sandhya-arghya',
    day: 'दिन 3 · Day 3, sunset',
    titleHi: 'संध्या अर्घ्य',
    titleEn: 'Sandhya Arghya',
    bodyHi:
      'व्रती जल में खड़े होकर डूबते सूरज को अर्घ्य देते हैं। घाट पर पूरा परिवार साथ होता है।',
    bodyEn:
      'At sunset the vratti stands in the water and offers arghya to the setting sun, giving thanks for the light of the day that is ending. The soop is packed and carried down to the ghat in the daura, and the whole family walks along.',
  },
  {
    id: 'kosi-bharai',
    day: 'दिन 3 · Day 3, night',
    titleHi: 'कोसी भराई',
    titleEn: 'Kosi Bharai',
    bodyHi:
      'पाँच से सात गन्ने बाँधकर मंडप बनाया जाता है, और उसके नीचे बारह से चौबीस दीये जलाए जाते हैं।',
    bodyEn:
      'Five to seven sugarcane stalks are tied together into a canopy, and twelve to twenty four earthen lamps are lit underneath it with thekua and fruit set inside. Families whose wish was granted do this to give thanks. It is done a second time between three and four in the morning, before everyone leaves for the ghat again.',
  },
  {
    id: 'usha-arghya',
    day: 'दिन 4 · Day 4, sunrise',
    titleHi: 'उषा अर्घ्य',
    titleEn: 'Usha Arghya',
    bodyHi:
      'भोर से पहले फिर जल में। उगते सूरज को आख़िरी अर्घ्य, और उसके बाद छत्तीस घंटे का व्रत खुलता है।',
    bodyEn:
      'Back in the water before first light. The last arghya goes to the rising sun, asking for the light still to come. Once it is done the thirty six hour fast is finally broken with the prasad. This is what the whole festival has been building towards.',
  },
  {
    id: 'prasad',
    titleHi: 'प्रसाद',
    titleEn: "What goes in the soop",
    bodyHi:
      'ठेकुआ इस पर्व की पहचान है। उसके साथ गन्ना, केला, नारियल, हल्दी और मौसमी फल।',
    bodyEn:
      'Almost everything in the soop comes out of the season itself, offered as thanks for what the year has given.',
    items: [
      { label: 'ठेकुआ · Thekua', note: 'Wheat flour, jaggery and ghee, often with cardamom or grated coconut, pressed into rounds and fried. The one thing everyone knows Chhath by.' },
      { label: 'कसार · Kasar', note: 'Balls of rice flour and jaggery.' },
      { label: 'गन्ना · Sugarcane', note: 'Whole stalks, the same ones the Kosi canopy is made from.' },
      { label: 'केला · Banana', note: 'Offered on the stem wherever possible.' },
      { label: 'नारियल · Coconut', note: 'Whole, with the husk still on.' },
      { label: 'हल्दी · Turmeric', note: 'Fresh root, with the leaves attached.' },
      { label: 'मौसमी फल · Seasonal fruit', note: 'Sweet potato, radish, lemon, guava, orange, pomegranate.' },
    ],
  },
  {
    id: 'unique',
    titleHi: 'क्या खास है',
    titleEn: 'What makes Chhath different',
    bodyHi:
      'न पुरोहित, न मूर्ति, न मंदिर। व्रती ख़ुद जल में खड़े होकर अर्घ्य देते हैं।',
    bodyEn:
      'In most festivals there is a priest, an idol, a temple. Chhath has none of them.',
    items: [
      { label: 'Both suns', note: 'It is the only festival that worships the setting sun as well as the rising one. Thanks for the light that has gone, and a prayer for the light still coming.' },
      { label: 'No one in between', note: 'No priest, no idol, no temple. The person fasting stands in the water and makes the offering themselves.' },
      { label: 'छठी मैया · Chhathi Maiya', note: "In folk tradition she is Surya's sister, a motherly goddess people pray to for their children's long life." },
      { label: '36 hours', note: 'The nirjala fast runs thirty six hours with no food and no water. It is most often kept by women, called vratti or parvaitin.' },
    ],
  },
  {
    id: 'credits',
    titleHi: 'शारदा सिन्हा',
    titleEn: 'The voice of Chhath',
    bodyHi:
      'इस सूची की ज़्यादातर आवाज़ शारदा सिन्हा की है, जिन्हें बिहार कोकिला कहा जाता था।',
    bodyEn:
      "Most of the voices here are Sharda Sinha's. For decades her Chhath songs played in every house through these four days, from the grinding of the wheat right up to the last arghya. She died on 5 November 2024, the first day of Chhath that year, one day after her final Chhath song came out.",
    note: 'Songs stream from YouTube. The rituals shown here follow the common Bihar and eastern Uttar Pradesh practice, which changes from family to family.',
  },
];
