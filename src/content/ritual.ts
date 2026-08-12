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
   * Deeper background, shown behind a "read more" disclosure so the page stays
   * scannable. History, culture and the occasional practical detail.
   *
   * Anything here has to survive checking. A lot of what circulates about Chhath
   * mixes real history with invented health claims, so legends are framed as
   * legends and nothing asserts a medical benefit.
   */
  background?: readonly RitualItem[];
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
    background: [
      {
        label: 'Why everything is bamboo and clay',
        note: 'The festival runs almost entirely on things that rot down afterwards. Bamboo trays, earthen lamps, clay pots, fruit and grain. There is no idol to immerse and no plaster to sink, which is why Chhath is so often held up as the most environmentally gentle of the big Hindu festivals. That has slipped in recent years as plastic and thermocol have crept into the ghats.',
      },
      {
        label: 'A whole local economy',
        note: 'Bamboo weavers, potters, and fruit and sugarcane growers do a large part of their yearly business in the fortnight before Chhath. Buying the soop and daura new every year is part of how that works.',
      },
      {
        label: 'The kitchen turns into a temple',
        note: 'In many households the thekua is made on a stove kept only for these four days, often a fresh mud chulha. Nobody tastes anything while cooking, since the food is going to the sun first.',
      },
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
    background: [
      {
        label: 'No temple needed, ever',
        note: 'Bathing in moving water before taking a vow is old practice across Hindu tradition. What stands out in Chhath is that the river is not a stop on the way to somewhere holier. The river is where the whole thing happens. The Ganga is preferred where people can reach it, but a pond or a canal serves just as well.',
      },
      {
        label: 'The meal is chosen, not incidental',
        note: 'Rice, chana dal and lauki in ghee is deliberately plain and easy on the stomach. It is the last proper meal before two days that include thirty six hours without water, and it is meant to sit lightly.',
      },
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
    background: [
      {
        label: 'One of the hardest fasts kept anywhere',
        note: 'Thirty six hours with no food and no water is severe by any standard, and it is done in public, standing in cold river water twice. It is usually the women of the house who keep it, sometimes the same woman every year for decades.',
      },
      {
        label: 'Who is advised not to',
        note: 'Families now commonly tell pregnant women, older relatives and anyone diabetic to keep a lighter version or to let someone else hold the vrat that year. Plenty of households do exactly that without anyone thinking less of it.',
      },
      {
        label: 'The house goes quiet',
        note: 'While the vratti eats the kheer, the household stays silent. Only once she has finished do the others eat, and neighbours come by afterwards to take some of the same prasad.',
      },
    ],
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
    background: [
      {
        label: 'Thanking the sun on its way out',
        note: 'Almost every solar tradition salutes the sunrise. Doing it at sunset as well, and giving that offering equal weight, is what people from Bihar will tell you first about Chhath. The reading usually given is that you thank what is leaving before you ask anything of what is coming.',
      },
      {
        label: 'The one time of day you can look at it',
        note: 'Both arghya are made when the sun sits on the horizon and its light is passing through the most atmosphere, which is when it is at its weakest of the day. That is simply when the rites fall. The claims you will see online about curing skin and eye disease are not something the festival needs and not something evidence supports.',
      },
      {
        label: 'The ghat belongs to everyone',
        note: 'Roads close, neighbourhoods clean their stretch of bank for days beforehand, and strangers carry each other daura down the steps. In Patna and Bhagalpur the river fills for kilometres. People who otherwise never meet stand in the same water.',
      },
    ],
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
    background: [
      {
        label: 'A debt being paid, not a request',
        note: 'Kosi is not for asking. It is done by families whose earlier vow was granted, most often for a child being born or a marriage happening, and it is understood as settling that account. Households that have nothing outstanding simply do not perform it.',
      },
      {
        label: 'Counting the lamps',
        note: 'Twelve or twenty four are the usual numbers, though a family may light as many as they promised. The canopy is built at home in the courtyard on the night of Sandhya Arghya, then built again at the ghat before dawn.',
      },
      {
        label: 'Mostly unknown outside Bihar',
        note: 'Kosi is one of the parts of Chhath that travels least. Diaspora observances often keep the two arghya and drop this, which is a pity, because at night with the lamps lit under the cane it is the most striking thing in the festival.',
      },
    ],
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
    background: [
      {
        label: 'Dawn has her own hymns',
        note: 'Usha, the dawn, is one of the deities the Rigveda addresses directly, with her own set of hymns. Several traditions identify Chhathi Maiya with her, which puts this particular morning at the older end of anything still being performed in India.',
      },
      {
        label: 'How the fast ends',
        note: 'The vratti drinks water and takes the prasad right there at the bank, usually handed to her by an elder. Nobody waits to get home. Afterwards prasad goes to whoever is standing nearby, and refusing it is not really done.',
      },
      {
        label: 'The ghats empty within the hour',
        note: 'For four days the river is the centre of everything, and then by mid morning on the fourth day it is quiet again and everyone is on a train back to wherever they work.',
      },
    ],
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
    background: [
      {
        label: 'Why thekua and not something softer',
        note: 'Thekua is fried hard, made with jaggery and almost no moisture, so it keeps for days in an ordinary tin without refrigeration. That is exactly what a prasad needs to be when it has to sit at a riverbank overnight and then travel back with relatives.',
      },
      {
        label: 'Nothing is tasted first',
        note: 'The whole soop goes to the sun before any of it goes to a person. Cooks do not check the seasoning, and children are kept away from the kitchen while it is being made.',
      },
      {
        label: 'It is a harvest basket',
        note: 'Sugarcane, sweet potato, radish, turmeric and the winter fruit are all in season in Bihar in late autumn. The offering is essentially the first of the year\'s harvest handed back, which is what a thanksgiving festival looks like before anyone calls it that.',
      },
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
      { label: 'छठी मैया · Chhathi Maiya', note: "A motherly goddess people pray to for their children's long life. Who exactly she is depends on who you ask, which is worth reading about below." },
      { label: '36 hours', note: 'The nirjala fast runs thirty six hours with no food and no water. It is most often kept by women, called vratti or parvaitin.' },
    ],
    background: [
      {
        label: 'Nobody agrees on who Chhathi Maiya is',
        note: 'Several traditions identify her with Usha, the Vedic goddess of dawn. Others take her as Shashthi, the goddess of the sixth day after a birth who protects newborns, which fits both the name and the festival landing on the sixth day of the month. Folk telling in parts of Bihar calls her Surya\'s sister, while other accounts make her his consort. These have never been reconciled and probably never needed to be.',
      },
      {
        label: 'How far back it goes',
        note: 'Sun worship in India is as old as the written record, with the Rigveda carrying whole hymns to Surya. Chhath in its present form cannot be dated that precisely, but it is regularly described as one of the oldest Hindu observances still performed roughly as it always was, largely because it never acquired a priesthood or a temple to reform it.',
      },
      {
        label: 'The stories people tell',
        note: 'Karna, Surya\'s son in the Mahabharata and the ruler of Anga near modern Bhagalpur, is remembered as standing in the river offering water to his father. Another account has sage Dhaumya teaching the rite to Draupadi during the exile. In the Ramayana telling, Sita kept the vrat and was later blessed with twins. These are the stories the festival carries about itself rather than datable history.',
      },
      {
        label: 'A festival that migrated',
        note: 'Chhath belongs to Bihar, Jharkhand, eastern Uttar Pradesh and the Madhesh of Nepal, but labour migration carried it to Delhi, Mumbai and Kolkata, and indenture carried it much further, to Mauritius, Trinidad, Suriname and Fiji. India has nominated it for UNESCO\'s Intangible Cultural Heritage list in the 2026-27 cycle, as a joint bid with several of those countries. It has not been inscribed yet.',
      },
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
    background: [
      {
        label: 'The songs were never written for records',
        note: 'Chhath geet are folk songs in Bhojpuri, Maithili and Magahi, sung by groups of women walking to the ghat and working in the kitchen, and they were passed down at home rather than published. What Sharda Sinha did was record them, which is how a Bihari family in Delhi or Dubai can still have the right song playing on the right morning.',
      },
      {
        label: 'What the songs are about',
        note: 'Very little of it is abstract praise. The songs name things: the banana leaf the offering sits on, the bamboo pole carried to the river, the ghat at Patna, a brother, a husband, the wish for a son. Sung on the fourth morning they land differently than they read.',
      },
    ],
    note: 'Songs stream from YouTube. The rituals shown here follow the common Bihar and eastern Uttar Pradesh practice, which changes from family to family. The background notes draw on published accounts and the traditions differ between them, so treat them as context rather than authority.',
  },
];
