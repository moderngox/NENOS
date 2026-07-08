export type Lang = 'fr' | 'en';

export interface Strings {
  nav: { how: string; examples: string; pricing: string; myBooks: string; account: string };
  landing: {
    headline: string;
    subtitle: string;
    cta: string;
    exampleTitle: string;
    exampleQuote: string;
    badgeIllustrated: string;
    badgeRealName: string;
  };
  wizard: {
    stepLabel: (step: number, total: number, title: string) => string;
    stepShortTitles: string[];
    back: string;
    next: string;
    skip: string;
    step1: { title: string; placeholder: string; helper: string };
    step2: { title: string; helper: string };
    step3: {
      traitsTitle: string;
      traits: string[];
      universeTitle: string;
      universes: { id: string; label: string }[];
    };
    step4: {
      title: string;
      helper: string;
      placeholder: string;
      charHint: string;
      skip: string;
    };
    step5: {
      title: string;
      helper: string;
      dropTitle: string;
      dropHelper: string;
      formats: string[];
      maxSize: string;
      privacy: string;
      cta: string;
      skip: string;
    };
    livePreview: string;
    yearsOld: string;
  };
  revelation: {
    heroReady: string;
    previewTitle: string;
    previewBadge: string;
    pagesCaption: string;
    unlockCta: (price: string) => string;
  };
  payment: {
    title: string;
    chooseFormat: string;
    formatPrint: string;
    formatDigital: string;
    summary: string;
    delivery: string;
    deliveryValue: string;
    total: string;
    cta: string;
    security: string;
  };
  library: {
    title: string;
    ready: string;
    inProgress: (min: number) => string;
    downloadPdf: string;
    readOnline: string;
    comingSoon: string;
    newBook: string;
  };
}

export const fr: Strings = {
  nav: { how: 'Comment ça marche', examples: 'Exemples', pricing: 'Tarifs', myBooks: 'Mes livres', account: 'Compte' },
  landing: {
    headline: 'Le livre où TON enfant est le héros ★',
    subtitle:
      'Un livre illustré personnalisé, créé en quelques minutes avec le prénom, le visage et les traits de caractère de votre enfant.',
    cta: 'Créer le livre →',
    exampleTitle: 'Un exemple de livre',
    exampleQuote: '"Léa, 6 ans, terrassée de joie de se voir en héroïne !"',
    badgeIllustrated: 'Illustré',
    badgeRealName: 'Prénom réel',
  },
  wizard: {
    stepLabel: (step, total, title) => `ÉTAPE ${step} / ${total} — ${title}`,
    stepShortTitles: ['PRÉNOM', 'ÂGE', 'TRAITS DE CARACTÈRE', 'CONTEXTE DE L’HISTOIRE', 'PHOTO (FACULTATIF)'],
    back: '← Retour',
    next: 'Suivant →',
    skip: 'Passer cette étape →',
    step1: {
      title: 'Comment s’appelle ton héros ?',
      placeholder: 'Prénom',
      helper: 'On l’utilisera pour personnaliser toute l’histoire.',
    },
    step2: {
      title: 'Quel âge a-t-il / elle ?',
      helper: 'Ça nous aide à adapter le niveau de l’histoire et de l’illustration.',
    },
    step3: {
      traitsTitle: 'Il/elle est plutôt...',
      traits: ['Courageux', 'Rigolo', 'Curieux', 'Gentil', 'Rêveur', 'Bricoleur'],
      universeTitle: 'Univers de l’aventure',
      universes: [
        { id: 'pirates', label: 'Pirates' },
        { id: 'space', label: 'Espace' },
        { id: 'forest', label: 'Forêt magique' },
      ],
    },
    step4: {
      title: 'Une idée d’histoire ?',
      helper: 'Facultatif — décris une scène, un objet, un copain imaginaire... on l’intègre à l’histoire générée.',
      placeholder:
        'Ex. : une aventure où il/elle sauve un petit dragon qui a peur du noir, avec son doudou lapin comme meilleur ami...',
      charHint: 'caractères',
      skip: 'Passer — laisser l’IA imaginer l’histoire',
    },
    step5: {
      title: 'Une photo pour un avatar tout ressemblant',
      helper: 'Facultatif — sans photo, on génère un avatar à partir de l’âge et des traits choisis.',
      dropTitle: 'Glisser une photo',
      dropHelper: 'ou appuyer pour choisir',
      formats: ['JPG / PNG', 'Max 10 Mo', '🔒 Non partagée'],
      maxSize: 'Max 10 Mo',
      privacy: '🔒 Non partagée',
      cta: 'Créer mon livre →',
      skip: 'Passer cette étape — voir sans photo',
    },
    livePreview: 'APERÇU EN DIRECT',
    yearsOld: 'ans',
  },
  revelation: {
    heroReady: 'Ton héros est prêt ! ✨',
    previewTitle: 'Aperçu — 2 premières pages',
    previewBadge: 'APERÇU',
    pagesCaption: '32 pages illustrées · PDF + version imprimée en option',
    unlockCta: (price) => `Débloquer le livre complet — ${price}`,
  },
  payment: {
    title: 'Ton livre est prêt à être commandé',
    chooseFormat: 'Choisis ton format',
    formatPrint: 'Livre imprimé + PDF',
    formatDigital: 'PDF + lecture web seulement',
    summary: 'Récapitulatif',
    delivery: 'Livraison',
    deliveryValue: 'Offerte',
    total: 'Total',
    cta: 'Payer et recevoir mon livre',
    security: '🔒 Paiement sécurisé · satisfait ou remboursé',
  },
  library: {
    title: 'Mes livres',
    ready: '✓ Prêt',
    inProgress: (min) => `Génération en cours — env. ${min} min`,
    downloadPdf: 'Télécharger PDF',
    readOnline: 'Lire en ligne',
    comingSoon: 'Bientôt disponible',
    newBook: '+ Créer un nouveau livre',
  },
};

export const en: Strings = {
  nav: { how: 'How it works', examples: 'Examples', pricing: 'Pricing', myBooks: 'My books', account: 'Account' },
  landing: {
    headline: 'The book where YOUR child is the hero ★',
    subtitle:
      'A personalized illustrated book, created in minutes with your child’s name, face and personality.',
    cta: 'Create the book →',
    exampleTitle: 'A book example',
    exampleQuote: '"Lea, 6, over the moon to see herself as the hero!"',
    badgeIllustrated: 'Illustrated',
    badgeRealName: 'Real name',
  },
  wizard: {
    stepLabel: (step, total, title) => `STEP ${step} / ${total} — ${title}`,
    stepShortTitles: ['FIRST NAME', 'AGE', 'TRAITS', 'STORY CONTEXT', 'PHOTO (OPTIONAL)'],
    back: '← Back',
    next: 'Next →',
    skip: 'Skip this step →',
    step1: {
      title: 'What’s your hero’s name?',
      placeholder: 'First name',
      helper: 'We’ll use it to personalize the whole story.',
    },
    step2: {
      title: 'How old are they?',
      helper: 'This helps us tailor the story and artwork.',
    },
    step3: {
      traitsTitle: 'They’re more...',
      traits: ['Brave', 'Funny', 'Curious', 'Kind', 'Dreamy', 'Handy'],
      universeTitle: 'Adventure world',
      universes: [
        { id: 'pirates', label: 'Pirates' },
        { id: 'space', label: 'Space' },
        { id: 'forest', label: 'Magic forest' },
      ],
    },
    step4: {
      title: 'Got a story idea?',
      helper: 'Optional — describe a scene, an object, an imaginary friend... we’ll weave it into the generated story.',
      placeholder:
        'E.g.: an adventure where they save a baby dragon afraid of the dark, with their bunny plush as best friend...',
      charHint: 'characters',
      skip: 'Skip — let the AI imagine the story',
    },
    step5: {
      title: 'A photo for a more lifelike avatar',
      helper: 'Optional — without a photo, we generate an avatar from the age and traits you picked.',
      dropTitle: 'Drop a photo',
      dropHelper: 'or tap to choose',
      formats: ['JPG / PNG', 'Max 10 MB', '🔒 Never shared'],
      maxSize: 'Max 10 MB',
      privacy: '🔒 Never shared',
      cta: 'Create my book →',
      skip: 'Skip this step — continue without a photo',
    },
    livePreview: 'LIVE PREVIEW',
    yearsOld: 'yo',
  },
  revelation: {
    heroReady: 'Your hero is ready! ✨',
    previewTitle: 'Sneak peek — first 2 pages',
    previewBadge: 'PREVIEW',
    pagesCaption: '32 illustrated pages · PDF + optional printed copy',
    unlockCta: (price) => `Unlock the full storybook — ${price}`,
  },
  payment: {
    title: 'Your book is ready to order',
    chooseFormat: 'Choose your format',
    formatPrint: 'Printed book + PDF',
    formatDigital: 'PDF + web reading only',
    summary: 'Summary',
    delivery: 'Shipping',
    deliveryValue: 'Free',
    total: 'Total',
    cta: 'Pay and receive my book',
    security: '🔒 Secure payment · money-back guarantee',
  },
  library: {
    title: 'My books',
    ready: '✓ Ready',
    inProgress: (min) => `Generating — approx. ${min} min`,
    downloadPdf: 'Download PDF',
    readOnline: 'Read online',
    comingSoon: 'Coming soon',
    newBook: '+ Create a new book',
  },
};

export const dictionaries: Record<Lang, Strings> = { fr, en };
