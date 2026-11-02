// Every word on the page lives here, so the story can be edited without touching layout code.

export const PHOTOS = {
  hero: '/images/hero.jpg',
  firstAdventure: '/images/gallery-first-adventure.jpg',
  bestFriends: '/images/story-best-friends.jpg',
  fallingInLove: '/images/story-falling-in-love.jpg',
  nightWalks: '/images/story-night-walks.jpg',
  home: '/images/story-each-others-home.jpg',
}

export const HERO_TAGLINE = 'my best friend, my partner, my entire world'

export const INTRO =
  'In a world of billions, my heart found only one home. Best friends first, then everything else: night drives, street food at 1am, fish fry by the ocean, and a thousand tiny moments that quietly turned into us. This little world was built entirely for you, my Thangamailu.'

export const CHAPTERS = [
  {
    title: 'Best Friends',
    photo: PHOTOS.bestFriends,
    body: 'Before we were anything else, we were best friends. Two people who found in each other a comfort like no other: talking for hours, laughing about everything, building a world where just being together was enough.',
    quote: 'Sami, I knew you were special the moment you made me laugh until it hurt.',
  },
  {
    title: 'Falling In Love',
    photo: PHOTOS.fallingInLove,
    body: 'There was a quiet, unplanned moment when I looked at you differently. Every conversation grew longer. Every goodbye grew harder. Friendship quietly became something I had no words for, and I realized I was falling.',
    quote: 'Papa, falling in love with you was the best accident of my life.',
  },
  {
    title: 'Night Walks & Long Drives',
    photo: PHOTOS.nightWalks,
    body: "We don't do sunrises, we own the night. Street food hunts at 1am. Long drives with the windows down. Night walks that stretched longer than planned. In all that dark and quiet, we built something luminous.",
    quote: 'Chloo, every late-night drive with you feels like the whole world belongs to us.',
  },
  {
    title: "Each Other's Home",
    photo: PHOTOS.home,
    body: 'Home stopped being a place. You became my most comfortable person: feeding you before I eat, finding you the perfect dress, the way you pick out things for me too. That is home. That is us.',
    quote: 'Thangamailu, wherever you are is exactly where I want to be.',
  },
]

export const FOOD = [
  { icon: '🍽️', title: 'I Feed You, Always', body: 'I feed you before I even take a bite myself. Watching you enjoy the food I hand you is the best part of eating together.', quote: 'Sami, my favorite thing is feeding you before I eat.' },
  { icon: '🌙', title: 'Night Street Food Hunts', body: 'The city lights, the late-night stalls, the warmth of street food at 1am. That is our kind of romance.', quote: 'Chloo, nothing hits like street food at midnight with you.' },
  { icon: '🍗', title: 'Fish Fry & Chicken', body: 'You love fish fry. You love chicken. And I love feeding you both, a quiet kind of joy that is hard to put into words.', quote: 'Every bite is better when it comes from you, Thangoo.' },
  { icon: '🍛', title: 'Thalappakatti Biriyani', body: 'Dindigul Thalappakatti Biriyani became one of my favorites, not just for the food, but for who I was sitting across from.', quote: 'My favorite biriyani will always remind me of you, Papa.' },
]

export const JOURNEYS = [
  {
    city: 'Pondicherry',
    emoji: '🌊',
    sub: 'Where the ocean whispered our secrets',
    photo: '/images/gallery/photo-e4181.webp',
    body: "Cobblestone streets, French colonial charm, late-night food hunts by the shore. Pondicherry wasn't just a trip, it was where we discovered how beautiful the world looks through each other's eyes.",
    highlights: ['Night walks along Promenade Beach 🌙', 'Fish fry by the ocean, I fed you every bite 🐟', 'Getting lost in the French Quarter after dark 🏛️'],
    quote: 'Every Pondicherry night reminds me of you, Thangoo.',
  },
  {
    city: 'Bangalore',
    emoji: '🌿',
    sub: 'The city where we found our rhythm',
    photo: '/images/gallery/photo-5133.webp',
    body: 'Gardens, night markets, and long drives. Bangalore made us two explorers in a big city, finding fridge magnets and little toys that remind us of a place long after we leave.',
    highlights: ['Late-night street food hunts 🌙', 'The drive back to Vellore, our first night drive together 🚗', 'Finding the perfect fridge magnets to remember it by 🧲'],
    quote: 'That Bangalore night drive to Vellore, one of my favorite memories, Chloo.',
  },
  {
    city: 'Comic Con Chennai',
    emoji: '🪄',
    sub: 'The day you made me a wizard · 2026',
    photo: '/images/gallery/photo-comicon.webp',
    body: "You bought me my Harry Potter costume, scarf and all, and came with me to Comic Con Chennai. You spent the whole day by my side in the crowds and the cosplay chaos, cheering me on and making my big day feel like magic.",
    highlights: ['You picked my Harry Potter costume for me 🧣', 'A whole day together among the cosplayers 🎭', 'You cheered me on at every moment of the event 💛'],
    quote: 'Sami, you made me feel like the hero of my own story.',
  },
]

export const LETTER = {
  greeting: 'My Dearest Papa,',
  paragraphs: [
    'Life gave me countless roads, but every meaningful journey somehow led me to you.',
    'From our night drives and late street food hunts, to the dress I found for you and the one you found for me, to every fish fry night where I fed you before myself, you transformed ordinary moments into unforgettable memories.',
    'That night drive from Bangalore to Vellore: years in the making, one perfect night.',
    'You are the calm in my chaos, the warmth in every late night, and the dream in my future.',
    'My Sami, my Chloo, my Thangoo, my everything, thank you for loving me the way you do.',
  ],
  signoff: 'Forever yours, always. ❤️',
}

export const FOREVER = ['Every road we travelled.', 'Every meal we shared.', 'Every laugh we created.', 'Every memory we made.']

// The gallery, oldest first. `note` is written on the back of each photo (tap a card to flip it).
// Web versions of the phone photos in photos-source/ (1600px WebP plus a
// small thumbnail for the strip).
const gallery = (id: string) => ({ src: `/images/gallery/photo-${id}.webp`, thumb: `/images/gallery/photo-${id}-thumb.webp` })

export const GALLERY = [
  { ...gallery('3147'), title: ['Green', 'Escapes'], caption: 'Just us and a little bit of green', note: "Just a fence, some grass and you. That's all it takes for me to be happy." },
  { ...gallery('e4181'), title: ['Just', 'Us'], caption: 'My favourite view, always', note: "No filters, no plans. My favourite kind of picture is the one where you're right next to me." },
  { ...gallery('4485'), title: ['Our', 'Home'], caption: 'Wherever you are is home', note: "This hug says everything. Wherever you are, Sami, that is home." },
  { ...gallery('e4632'), title: ['Under the', 'Stars'], caption: 'Every night shines brighter with you', note: "Everyone was looking at the lights. I was looking at you." },
  { ...gallery('5133'), title: ['Café', 'Dates'], caption: 'Breakfast at The Rameshwaram Cafe', note: "Good food, better company. I'd wait in any queue if you're the one waiting with me." },
  { ...gallery('5675'), title: ['Under the', 'Blossoms'], caption: 'Pink trees, and you', note: "The tree was pretty. You were prettier. Pink suits you, Thangoo." },
  { ...gallery('6102'), title: ['By the', 'Water'], caption: 'Long drives and open skies', note: "Open roads, open skies, and your hand in mine. Let's never stop going places." },
]

// Her portrait with the background removed (from photos-source/IMG_E3364.HEIC), on the Letter tab and in the menu.
export const HER = {
  cutout: '/images/her-cutout.webp',
  face: '/images/her-face.webp',
  alt: 'Sri, smiling',
  caption: 'the girl this letter is for',
}

// "Us": our story, told as an animated walkthrough. `chat` lines are replayed as messages
// (her: from Sami, me: from me), `big` appears as the moment of the scene.
export type TaleChat = { from: 'her' | 'me'; text: string }
export const TALE = {
  title: 'Her Heart Knew First',
  parts: [
    {
      kicker: 'Part 1',
      title: 'The Seed of Friendship',
      text: [
        'Our story began eight years ago at TCS. What started as simple desk chats and shared office breaks quickly turned into a deep, unshakable friendship.',
        "We didn't meet outside very often, but distance never stood in our way. WhatsApp became our daily bridge: endless texts, shared jokes and late-night conversations kept us closer than ever as the years flew by.",
      ],
    },
    {
      kicker: 'Part 2',
      title: 'The Secret & the Misunderstanding',
      text: [
        'She told me she was in love with someone, and had been holding on to those feelings for over a year. Completely unaware that the person in her heart was me, I was her biggest cheerleader: go ahead, propose to him, don\'t hold back.',
        'Then, on 4 November 2024, around 6 PM, I left home and reached the station for my train from Chennai to Hyderabad. We were texting back and forth…',
      ],
      chat: [
        { from: 'her', text: "If he says no, I'll just tell my parents your name as my lover." },
        { from: 'me', text: "I don't want to be anyone's backup option or alternative." },
      ] as TaleChat[],
    },
    {
      kicker: 'Part 3',
      title: 'The Realization',
      song: 'Narumugaye',
      chat: [{ from: 'her', text: "If you don't understand, don't leave words! If you ever come to know the truth, you will regret it!" }] as TaleChat[],
      text: [
        'I was standing on the steps of the train compartment, looking out at the passing night, with Narumugaye playing in my earphones. As her message sank in, the music, the moment and the truth aligned in my head like lightning.',
      ],
      big: 'It was me. She was in love with me all along.',
      after: 'A sudden wave of pure, unfiltered happiness.',
    },
    {
      kicker: 'Part 4',
      title: 'Floating & Happy Tears',
      text: [
        'I had to cross to another platform over the footbridge, carrying a heavy backpack with two laptops. I felt no weight at all. It felt like I was floating across that bridge.',
        'Later, on a Rapido bike to the bus stop, the cool night wind hit my face and the tears started flowing, out of sheer joy. On the bus, they kept coming.',
      ],
      big: 'She has been waiting for more than a year. I must not make her wait any longer.',
    },
    {
      kicker: 'Part 5',
      title: 'I AM IN',
      text: [
        'I took three days to think about everything: eight years of friendship, our bond, and how to give her my heart the right way.',
        'Friday, 8 November 2024. Lying on the sofa at my Hyderabad home, texting her casually, when out of nowhere…',
      ],
      chat: [
        { from: 'her', text: 'Shall we go to honeymoon?' },
        { from: 'me', text: 'I AM IN.' },
        { from: 'her', text: 'I said honeymoon! Not everyone or friends can go to a honeymoon!' },
        { from: 'me', text: "I know. I'm in." },
      ] as TaleChat[],
      after: 'And just like that, eight years of best friendship turned into the most beautiful love story.',
    },
  ],
}

// My round portrait (from photos-source/IMG_20230611_131703.jpg), next to hers on the story's cover.
export const ME = { face: '/images/him-face.webp', alt: 'Me' }
