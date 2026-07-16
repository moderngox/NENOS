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
    generating: string;
    submitError: string;
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
    step6: {
      title: string;
      helper: string;
      skinTitle: string;
      skinColors: { id: string; label: string; swatch: string }[];
      hairTitle: string;
      hairColors: { id: string; label: string; swatch: string }[];
      eyeTitle: string;
      eyeColors: { id: string; label: string; swatch: string }[];
      otherLabel: string;
      otherOptional: string;
      placeholder: string;
      cta: string;
    };
    step7: {
      title: (name: string) => string;
      subtitle: string;
      badge: string;
      counter: (count: number, max: number) => string;
      addTitle: string;
      addHelper: string;
      roleStepTitle: string;
      cancel: string;
      roles: { id: string; label: string; emoji: string }[];
      changeRole: string;
      nameLabel: string;
      ageLabel: string;
      photoLabel: string;
      photoOptional: string;
      addPhoto: string;
      skinLabel: string;
      hairLabel: string;
      eyeLabel: string;
      skinColors: { id: string; label: string; swatch: string }[];
      hairColors: { id: string; label: string; swatch: string }[];
      eyeColors: { id: string; label: string; swatch: string }[];
      descriptionLabel: string;
      descriptionOptional: string;
      descriptionPlaceholder: string;
      addCta: string;
      cancelCta: string;
      cta: string;
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
    disclaimer: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    emailLabel: string;
    passwordLabel: string;
    nameLabel: string;
    nameOptional: string;
    loginCta: string;
    signupCta: string;
    switchToSignup: string;
    switchToLogin: string;
    orDivider: string;
    continueWithGoogle: string;
    continueWithFacebook: string;
    logout: string;
    loggedInAs: (email: string) => string;
    login: string;
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
    redirecting: string;
    error: string;
  };
  orderConfirmed: {
    title: string;
    subtitle: string;
    stepPaid: string;
    stepPreparing: string;
    stepEmail: string;
    trackProgress: string;
    backHome: string;
  };
  library: {
    title: string;
    ready: string;
    inProgress: (min: number) => string;
    downloadPdf: string;
    readOnline: string;
    comingSoon: string;
    newBook: string;
    signedOutMessage: string;
    emptyMessage: string;
  };
  reader: {
    notPaidTitle: string;
    notPaidMessage: string;
    goToPayment: string;
    generatingTitle: string;
    generatingProgress: (done: number, total: number) => string;
    generatingHelper: string;
    errorMessage: string;
    retry: string;
    downloadPdf: string;
    frontCoverLabel: string;
    backCoverLabel: string;
    pageLabel: (page: number, total: number) => string;
    prev: string;
    next: string;
  };
  account: {
    title: string;
    ordersTab: string;
    booksTab: string;
    orderStatusPaid: string;
    orderStatusPending: string;
    orderStatusFailed: string;
    formatPrint: string;
    formatDigital: string;
    noOrders: string;
    noBooks: string;
    readOnline: string;
    downloadPdf: string;
    comingSoon: string;
    logout: string;
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
    stepShortTitles: [
      'PRÉNOM',
      'ÂGE',
      'TRAITS DE CARACTÈRE',
      'CONTEXTE DE L’HISTOIRE',
      'PHOTO (FACULTATIF)',
      'APPARENCE PHYSIQUE',
      'PERSONNAGES SECONDAIRES',
    ],
    back: '← Retour',
    next: 'Suivant →',
    skip: 'Passer cette étape →',
    generating: 'Création de ton histoire...',
    submitError: 'Une erreur est survenue. Réessaie.',
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
      cta: 'Utiliser cette photo →',
      skip: 'Passer cette étape — voir sans photo',
    },
    step6: {
      title: 'À quoi ressemble-t-il / elle ?',
      helper:
        'Facultatif — sans photo, ces détails nous aident à générer un avatar qui lui ressemble vraiment.',
      skinTitle: 'Couleur de peau',
      skinColors: [
        { id: 'tres_claire', label: 'Très claire', swatch: '#FFE0BD' },
        { id: 'claire', label: 'Claire', swatch: '#F1C27D' },
        { id: 'doree', label: 'Dorée', swatch: '#E0AC69' },
        { id: 'mate', label: 'Mate', swatch: '#C68642' },
        { id: 'brune', label: 'Brune', swatch: '#8D5524' },
        { id: 'foncee', label: 'Foncée', swatch: '#5C3317' },
        { id: 'autre', label: 'Autre', swatch: '' },
      ],
      hairTitle: 'Couleur des cheveux',
      hairColors: [
        { id: 'blond', label: 'Blond', swatch: '#D9B96C' },
        { id: 'chatain', label: 'Châtain', swatch: '#8A5A34' },
        { id: 'brun', label: 'Brun', swatch: '#4A2E1E' },
        { id: 'noir', label: 'Noir', swatch: '#161616' },
        { id: 'roux', label: 'Roux', swatch: '#C1502E' },
        { id: 'gris', label: 'Gris / Blanc', swatch: '#C4C4C6' },
        { id: 'chauve', label: 'Chauve', swatch: '#E3C39D' },
        { id: 'autre', label: 'Autre', swatch: '' },
      ],
      eyeTitle: 'Couleur des yeux',
      eyeColors: [
        { id: 'bleus', label: 'Bleus', swatch: '#2F5FDE' },
        { id: 'verts', label: 'Verts', swatch: '#4CA37A' },
        { id: 'noisette', label: 'Noisette', swatch: '#C7A23A' },
        { id: 'marrons', label: 'Marrons', swatch: '#6B4321' },
        { id: 'noirs', label: 'Noirs', swatch: '#161616' },
        { id: 'gris', label: 'Gris', swatch: '#A6A9B0' },
        { id: 'vairons', label: 'Vairons', swatch: 'conic-gradient(#2F5FDE 0deg 180deg, #6B4321 180deg 360deg)' },
        { id: 'autre', label: 'Autre', swatch: '' },
      ],
      otherLabel: 'Autres détails',
      otherOptional: 'Facultatif',
      placeholder: 'Ex : taches de rousseur, lunettes, cheveux bouclés...',
      cta: 'Suivant →',
    },
    step7: {
      title: (name) => `Qui accompagne ${name} ?`,
      subtitle: 'Famille, amis, animal... jusqu’à 3 personnages secondaires',
      badge: 'Facultatif',
      counter: (count, max) => `${count}/${max}`,
      addTitle: 'Ajouter un personnage',
      addHelper: 'Maman, papa, un ami, un animal de compagnie...',
      roleStepTitle: 'Quel rôle ?',
      cancel: 'Annuler',
      roles: [
        { id: 'maman', label: 'Maman', emoji: '👩' },
        { id: 'papa', label: 'Papa', emoji: '👨' },
        { id: 'frere_soeur', label: 'Frère / Sœur', emoji: '🧒' },
        { id: 'grand_parent', label: 'Grand-père / Grand-mère', emoji: '👴' },
        { id: 'copain', label: 'Copain / Copine', emoji: '🧑' },
        { id: 'parrain_marraine', label: 'Parrain / Marraine', emoji: '👫' },
        { id: 'animal', label: 'Animal', emoji: '🐾' },
        { id: 'doudou', label: 'Doudou', emoji: '🧸' },
        { id: 'autre', label: 'Autre', emoji: '👤' },
      ],
      changeRole: 'Changer de rôle',
      nameLabel: 'Prénom',
      ageLabel: 'Âge',
      photoLabel: 'Photo',
      photoOptional: 'Facultatif',
      addPhoto: 'Ajouter une photo',
      skinLabel: 'Couleur de peau (facultatif)',
      hairLabel: 'Couleur des cheveux (facultatif)',
      eyeLabel: 'Couleur des yeux (facultatif)',
      skinColors: [
        { id: 'tres_claire', label: 'Très claire', swatch: '#FFE0BD' },
        { id: 'claire', label: 'Claire', swatch: '#F1C27D' },
        { id: 'doree', label: 'Dorée', swatch: '#E0AC69' },
        { id: 'mate', label: 'Mate', swatch: '#C68642' },
        { id: 'brune', label: 'Brune', swatch: '#8D5524' },
        { id: 'foncee', label: 'Foncée', swatch: '#5C3317' },
      ],
      hairColors: [
        { id: 'blond_clair', label: 'Blond clair', swatch: '#E6D2A0' },
        { id: 'blond', label: 'Blond', swatch: '#D9B96C' },
        { id: 'chatain', label: 'Châtain', swatch: '#8A5A34' },
        { id: 'brun', label: 'Brun', swatch: '#4A2E1E' },
        { id: 'noir', label: 'Noir', swatch: '#161616' },
        { id: 'roux', label: 'Roux', swatch: '#C1502E' },
      ],
      eyeColors: [
        { id: 'bleu', label: 'Bleu', swatch: '#2F5FDE' },
        { id: 'vert', label: 'Vert', swatch: '#4CA37A' },
        { id: 'noisette', label: 'Noisette', swatch: '#C7A23A' },
        { id: 'marron', label: 'Marron', swatch: '#7A4B28' },
        { id: 'marron_fonce', label: 'Marron foncé', swatch: '#4A2E1E' },
      ],
      descriptionLabel: 'Description',
      descriptionOptional: 'Facultatif',
      descriptionPlaceholder: 'Ex : lunettes, barbe, taches de rousseur...',
      addCta: 'Ajouter',
      cancelCta: 'Annuler',
      cta: 'Créer mon livre →',
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
    disclaimer: 'Après commande, la préparation complète prend jusqu\'à 30 minutes — tu seras prévenu(e) par e-mail dès que ton livre sera prêt.',
  },
  auth: {
    loginTitle: 'Connexion',
    signupTitle: 'Créer un compte',
    emailLabel: 'E-mail',
    passwordLabel: 'Mot de passe',
    nameLabel: 'Prénom',
    nameOptional: 'Facultatif',
    loginCta: 'Se connecter',
    signupCta: 'Créer mon compte',
    switchToSignup: 'Pas encore de compte ? Créer un compte',
    switchToLogin: 'Déjà un compte ? Se connecter',
    orDivider: 'ou',
    continueWithGoogle: 'Continuer avec Google',
    continueWithFacebook: 'Continuer avec Facebook',
    logout: 'Se déconnecter',
    loggedInAs: (email) => `Connecté en tant que ${email}`,
    login: 'Connexion',
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
    redirecting: 'Redirection vers le paiement sécurisé...',
    error: 'Le paiement n’a pas pu démarrer. Réessaie.',
  },
  orderConfirmed: {
    title: 'Commande confirmée !',
    subtitle: 'Ton paiement a bien été reçu. Voici la suite :',
    stepPaid: 'Paiement confirmé',
    stepPreparing: 'Préparation de ton livre (jusqu\'à 30 min)',
    stepEmail: 'Un e-mail dès qu\'il est prêt — c\'est à ce moment que ta carte sera débitée',
    trackProgress: 'Suivre la préparation →',
    backHome: '← Retour à l’accueil',
  },
  library: {
    title: 'Mes livres',
    ready: '✓ Prêt',
    inProgress: (min) => `Génération en cours — env. ${min} min`,
    downloadPdf: 'Télécharger PDF',
    readOnline: 'Lire en ligne',
    comingSoon: 'Bientôt disponible',
    newBook: '+ Créer un nouveau livre',
    signedOutMessage: 'Connecte-toi pour voir tes livres.',
    emptyMessage: 'Tu n’as pas encore de livre. Créons-en un !',
  },
  reader: {
    notPaidTitle: 'Ce livre n’est pas encore disponible',
    notPaidMessage: 'Finalise ta commande pour débloquer la lecture complète de ce livre.',
    goToPayment: 'Aller au paiement →',
    generatingTitle: 'Préparation de ton livre en haute qualité ✨',
    generatingProgress: (done, total) => `Page ${done} / ${total}`,
    generatingHelper: 'Cela peut prendre quelques minutes — reste sur cette page.',
    errorMessage: 'Une erreur est survenue pendant la génération. Réessaie.',
    retry: 'Réessayer',
    downloadPdf: 'Télécharger le PDF',
    frontCoverLabel: 'Couverture',
    backCoverLabel: 'Fin',
    pageLabel: (page, total) => `Page ${page} / ${total}`,
    prev: '← Précédent',
    next: 'Suivant →',
  },
  account: {
    title: 'Mon compte',
    ordersTab: 'Commandes',
    booksTab: 'Mes livres',
    orderStatusPaid: 'Payée',
    orderStatusPending: 'En attente',
    orderStatusFailed: 'Paiement à vérifier',
    formatPrint: 'Livre imprimé + PDF',
    formatDigital: 'PDF + lecture web',
    noOrders: 'Aucune commande pour le moment.',
    noBooks: 'Aucun livre pour le moment.',
    readOnline: 'Lire en ligne',
    downloadPdf: 'Télécharger PDF',
    comingSoon: 'Bientôt disponible',
    logout: 'Se déconnecter',
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
    stepShortTitles: [
      'FIRST NAME',
      'AGE',
      'TRAITS',
      'STORY CONTEXT',
      'PHOTO (OPTIONAL)',
      'PHYSICAL APPEARANCE',
      'SECONDARY CHARACTERS',
    ],
    back: '← Back',
    next: 'Next →',
    skip: 'Skip this step →',
    generating: 'Creating your story...',
    submitError: 'Something went wrong. Please try again.',
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
      cta: 'Use this photo →',
      skip: 'Skip this step — continue without a photo',
    },
    step6: {
      title: 'What do they look like?',
      helper: 'Optional — without a photo, these details help us generate an avatar that really looks like them.',
      skinTitle: 'Skin tone',
      skinColors: [
        { id: 'tres_claire', label: 'Very fair', swatch: '#FFE0BD' },
        { id: 'claire', label: 'Fair', swatch: '#F1C27D' },
        { id: 'doree', label: 'Golden', swatch: '#E0AC69' },
        { id: 'mate', label: 'Tan', swatch: '#C68642' },
        { id: 'brune', label: 'Brown', swatch: '#8D5524' },
        { id: 'foncee', label: 'Dark', swatch: '#5C3317' },
        { id: 'autre', label: 'Other', swatch: '' },
      ],
      hairTitle: 'Hair color',
      hairColors: [
        { id: 'blond', label: 'Blond', swatch: '#D9B96C' },
        { id: 'chatain', label: 'Light brown', swatch: '#8A5A34' },
        { id: 'brun', label: 'Brown', swatch: '#4A2E1E' },
        { id: 'noir', label: 'Black', swatch: '#161616' },
        { id: 'roux', label: 'Red', swatch: '#C1502E' },
        { id: 'gris', label: 'Grey / White', swatch: '#C4C4C6' },
        { id: 'chauve', label: 'Bald', swatch: '#E3C39D' },
        { id: 'autre', label: 'Other', swatch: '' },
      ],
      eyeTitle: 'Eye color',
      eyeColors: [
        { id: 'bleus', label: 'Blue', swatch: '#2F5FDE' },
        { id: 'verts', label: 'Green', swatch: '#4CA37A' },
        { id: 'noisette', label: 'Hazel', swatch: '#C7A23A' },
        { id: 'marrons', label: 'Brown', swatch: '#6B4321' },
        { id: 'noirs', label: 'Black', swatch: '#161616' },
        { id: 'gris', label: 'Grey', swatch: '#A6A9B0' },
        { id: 'vairons', label: 'Two-toned', swatch: 'conic-gradient(#2F5FDE 0deg 180deg, #6B4321 180deg 360deg)' },
        { id: 'autre', label: 'Other', swatch: '' },
      ],
      otherLabel: 'Other details',
      otherOptional: 'Optional',
      placeholder: 'E.g.: freckles, glasses, curly hair...',
      cta: 'Next →',
    },
    step7: {
      title: (name) => `Who's with ${name}?`,
      subtitle: 'Family, friends, a pet... up to 3 secondary characters',
      badge: 'Optional',
      counter: (count, max) => `${count}/${max}`,
      addTitle: 'Add a character',
      addHelper: 'Mom, dad, a friend, a pet...',
      roleStepTitle: 'What role?',
      cancel: 'Cancel',
      roles: [
        { id: 'maman', label: 'Mom', emoji: '👩' },
        { id: 'papa', label: 'Dad', emoji: '👨' },
        { id: 'frere_soeur', label: 'Brother / Sister', emoji: '🧒' },
        { id: 'grand_parent', label: 'Grandpa / Grandma', emoji: '👴' },
        { id: 'copain', label: 'Friend', emoji: '🧑' },
        { id: 'parrain_marraine', label: 'Godparent', emoji: '👫' },
        { id: 'animal', label: 'Pet', emoji: '🐾' },
        { id: 'doudou', label: 'Stuffed animal', emoji: '🧸' },
        { id: 'autre', label: 'Other', emoji: '👤' },
      ],
      changeRole: 'Change role',
      nameLabel: 'First name',
      ageLabel: 'Age',
      photoLabel: 'Photo',
      photoOptional: 'Optional',
      addPhoto: 'Add a photo',
      skinLabel: 'Skin tone (optional)',
      hairLabel: 'Hair color (optional)',
      eyeLabel: 'Eye color (optional)',
      skinColors: [
        { id: 'tres_claire', label: 'Very fair', swatch: '#FFE0BD' },
        { id: 'claire', label: 'Fair', swatch: '#F1C27D' },
        { id: 'doree', label: 'Golden', swatch: '#E0AC69' },
        { id: 'mate', label: 'Tan', swatch: '#C68642' },
        { id: 'brune', label: 'Brown', swatch: '#8D5524' },
        { id: 'foncee', label: 'Dark', swatch: '#5C3317' },
      ],
      hairColors: [
        { id: 'blond_clair', label: 'Light blond', swatch: '#E6D2A0' },
        { id: 'blond', label: 'Blond', swatch: '#D9B96C' },
        { id: 'chatain', label: 'Light brown', swatch: '#8A5A34' },
        { id: 'brun', label: 'Brown', swatch: '#4A2E1E' },
        { id: 'noir', label: 'Black', swatch: '#161616' },
        { id: 'roux', label: 'Red', swatch: '#C1502E' },
      ],
      eyeColors: [
        { id: 'bleu', label: 'Blue', swatch: '#2F5FDE' },
        { id: 'vert', label: 'Green', swatch: '#4CA37A' },
        { id: 'noisette', label: 'Hazel', swatch: '#C7A23A' },
        { id: 'marron', label: 'Brown', swatch: '#7A4B28' },
        { id: 'marron_fonce', label: 'Dark brown', swatch: '#4A2E1E' },
      ],
      descriptionLabel: 'Description',
      descriptionOptional: 'Optional',
      descriptionPlaceholder: 'E.g.: glasses, beard, freckles...',
      addCta: 'Add',
      cancelCta: 'Cancel',
      cta: 'Create my book →',
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
    disclaimer: "After ordering, full preparation takes up to 30 minutes — you'll get an email as soon as your book is ready.",
  },
  auth: {
    loginTitle: 'Log in',
    signupTitle: 'Create an account',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    nameLabel: 'First name',
    nameOptional: 'Optional',
    loginCta: 'Log in',
    signupCta: 'Create my account',
    switchToSignup: "Don't have an account? Sign up",
    switchToLogin: 'Already have an account? Log in',
    orDivider: 'or',
    continueWithGoogle: 'Continue with Google',
    continueWithFacebook: 'Continue with Facebook',
    logout: 'Log out',
    loggedInAs: (email) => `Signed in as ${email}`,
    login: 'Log in',
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
    redirecting: 'Redirecting to secure payment...',
    error: 'Payment could not start. Please try again.',
  },
  orderConfirmed: {
    title: 'Order confirmed!',
    subtitle: "Your payment went through. Here's what happens next:",
    stepPaid: 'Payment confirmed',
    stepPreparing: 'Preparing your book (up to 30 min)',
    stepEmail: "An email once it's ready — that's when your card will be charged",
    trackProgress: 'Track progress →',
    backHome: '← Back to home',
  },
  library: {
    title: 'My books',
    ready: '✓ Ready',
    inProgress: (min) => `Generating — approx. ${min} min`,
    downloadPdf: 'Download PDF',
    readOnline: 'Read online',
    comingSoon: 'Coming soon',
    newBook: '+ Create a new book',
    signedOutMessage: 'Log in to see your books.',
    emptyMessage: "You don't have any books yet. Let's create one!",
  },
  reader: {
    notPaidTitle: 'This book isn’t available yet',
    notPaidMessage: 'Complete your order to unlock the full reading experience.',
    goToPayment: 'Go to payment →',
    generatingTitle: 'Preparing your book in high quality ✨',
    generatingProgress: (done, total) => `Page ${done} / ${total}`,
    generatingHelper: 'This can take a few minutes — stay on this page.',
    errorMessage: 'Something went wrong during generation. Please try again.',
    retry: 'Retry',
    downloadPdf: 'Download the PDF',
    frontCoverLabel: 'Cover',
    backCoverLabel: 'The end',
    pageLabel: (page, total) => `Page ${page} / ${total}`,
    prev: '← Previous',
    next: 'Next →',
  },
  account: {
    title: 'My account',
    ordersTab: 'Orders',
    booksTab: 'My books',
    orderStatusPaid: 'Paid',
    orderStatusPending: 'Pending',
    orderStatusFailed: 'Payment needs review',
    formatPrint: 'Printed book + PDF',
    formatDigital: 'PDF + web reading',
    noOrders: 'No orders yet.',
    noBooks: 'No books yet.',
    readOnline: 'Read online',
    downloadPdf: 'Download PDF',
    comingSoon: 'Coming soon',
    logout: 'Log out',
  },
};

export const dictionaries: Record<Lang, Strings> = { fr, en };
