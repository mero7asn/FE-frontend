import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key, ...args) => {
    const translations = {
      en: {
        // Nav
        home: 'Home', shop: 'Shop', about: 'About', contact: 'Contact', verify: 'Verify', gallery: 'Gallery',
        admin: 'Admin', adminLogin: 'Admin Login', logout: 'Logout', account: 'Account',
        // Product
        orderNow: 'Order Now', soldOut: 'Sold Out', featured: 'Featured',
        inStock: 'In Stock', price: 'Price', selectSize: 'Select Size',
        selectColor: 'Select Color', addToCart: 'Add to Cart',
        loading: 'Loading...', products: 'Products',
        sizeOutOfStock: 'Selected Size Out of Stock',
        sizeRecommendations: 'You might also like these shirts in Size {{value}}',
        // Home
        shopNow: 'Shop Now', nextDrop: 'Next Collection Drop Release',
        latestDrop: 'Latest Drop', viewCollection: 'View Collection',
        featuredCollection: 'Featured Collection', viewAll: 'View All Products',
        brandTitle: 'First Edition Philosophy',
        brandDesc: 'Every piece tells a story. Limited quantities. Numbered editions. Premium quality. We believe in exclusivity, craftsmanship, and timeless design.',
        learnMore: 'Learn More',
        heroTitle: 'FIRST EDITION',
        heroSubtitle: 'LIMITED EDITION PREMIUM STREETWEAR',
        days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs',
        // Shop
        shopCollection: 'Shop Collection', searchPlaceholder: 'Search products...',
        allCategories: 'All Categories', allSizes: 'All Sizes',
        allColors: 'All Colors', clearFilters: 'Clear Filters',
        loadingProducts: 'Loading products...', noProducts: 'No products found',
        newest: 'Newest', featuredSort: 'Featured',
        priceLow: 'Price: Low to High', priceHigh: 'Price: High to Low',
        // Product Detail
        leftInStock: 'left', contactWhatsapp: 'Contact us on WhatsApp to complete your purchase',
        confirmAvailability: "We'll confirm availability and payment details",
        fastResponse: 'Fast response during business hours',
        colorNotice: 'Colors may differ slightly due to different screen qualities',
        audiencePick: 'Audience Pick',
        currentlyUnavailable: 'Currently Unavailable',
        shippingNotice: '📦 Receive your T-shirt within 7 working days.',
        weAccept: 'We accept:',
        // Cart
        cartEmpty: 'Your Cart is Empty', continueShopping: 'Continue Shopping',
        shoppingCart: 'Shopping Cart', orderSummary: 'Order Summary',
        subtotal: 'Subtotal', shipping: 'Shipping',
        shippingNote: 'Calculated at checkout', total: 'Total',
        checkout: 'Proceed to Checkout', size: 'Size', color: 'Color',
        // Contact
        directSupport: 'Direct Support', contactUs: 'Contact Us',
        contactDesc: 'Reach out to us directly on WhatsApp for orders, sizing, and any questions.',
        whatsappChat: 'WhatsApp Chat',
        whatsappDesc: 'Connect instantly with us to place orders or get your questions answered.',
        startChatting: 'Start Chatting',
        // About
        aboutSubtitle: 'The Philosophy of Exclusivity',
        ourStory: 'Our Story',
        storyP1: 'First Edition (FE) was founded on a simple realization: modern fashion has lost its value of rarity. Mass-produced clothing has made fashion disposable. We reject the copy-paste culture.',
        storyP2: 'We produce premium streetwear in extremely limited batches. Each collection—what we call a "Drop"—is numbered and cataloged. Once a design is sold out, it is gone forever, archived in our history but never to be printed again.',
        threePillars: 'The Three Pillars',
        pillar1Title: 'Numbered Exclusivity', pillar1Desc: 'Every single item is part of a certified, limited run. It guarantees you are wearing something truly rare.',
        pillar2Title: 'Premium Craftsmanship', pillar2Desc: 'Heavyweight cotton, premium blends, and premium printing processes that stand the test of time.',
        pillar3Title: 'Never Repeated', pillar3Desc: 'Once a drop sells out, it is archived forever. No restocks, no reprints — your piece remains a one-of-a-kind moment in time.',
        heroPhrase: 'لِأَنَّكَ اسْتِثْنَائِيٌّ.. قِطْعَةٌ فَرِيدَةٌ صُمِّمَتْ لِتَكُونَ لَكَ وَحْدَكَ',
        heroTagline: 'Wearable Art. Strictly Limited. Never Re-released.',
        // Privacy & Terms
        privacySubtitle: 'Privacy', privacyTitle: 'Privacy Policy', privacyIntro: 'At First Edition, we prioritize your privacy. This policy explains what information we collect, how it is used, and the safeguards we maintain to protect it.',
        privacySection1Title: 'Data We Collect', privacySection1Text: 'We collect the information necessary to fulfill orders and provide exceptional service, including your name, shipping and billing address, contact details, order history, and payment verification data.',
        privacySection2Title: 'How We Use Your Information', privacySection2Text: 'We use your information to process orders, communicate order status, prevent fraud, improve our products and services, and comply with applicable legal obligations.',
        privacySection3Title: 'Security and Your Rights', privacySection3Text: 'We maintain physical, administrative, and technical safeguards to protect your information. You may request access, correction, or deletion of your personal data through our support channels.',
        termsSubtitle: 'Terms', termsTitle: 'Terms of Service', termsIntro: 'These Terms of Service govern your use of First Edition. By placing an order, you agree to the terms described here and our general service expectations.',
        termsSection1Title: 'Orders and Availability', termsSection1Text: 'All products are subject to availability. First Edition reserves the right to limit quantities, decline orders, cancel transactions, or adjust pricing before an order is confirmed.',
        termsSection2Title: 'Pricing and Payment', termsSection2Text: 'Orders are processed once payment is authorized. Unless otherwise stated, prices exclude shipping and handling. Confirmation of payment is required before fulfillment begins.',
        termsSection3Title: 'Returns and Dispute Resolution', termsSection3Text: 'If you have concerns about an order, contact our support team promptly. We aim to resolve issues fairly and in accordance with our return and refund policies.',
        // Footer
        footerAbout: 'About', footerContact: 'Contact', footerPrivacy: 'Privacy', footerTerms: 'Terms',
        footerDevelopedBy: 'This website is developed by Asher Media for Electronic services Commercial Register NO. 11615',
        // Gallery
        galleryKicker: 'The Archive',
        galleryTitle: 'Hall of Fame',
        gallerySubtitle: 'These pieces are gone forever. Sold out, never to return. A testament to those who moved first.',
        galleryEmpty: 'No archived pieces yet — check back after drops sell out.',
      },
      ar: {
        // Nav
        home: 'الرئيسية', shop: 'المتجر', about: 'من نحن', contact: 'تواصل معنا', verify: 'التحقق من الأصالة', gallery: 'المعرض',
        admin: 'لوحة التحكم', adminLogin: 'دخول المسؤول', logout: 'تسجيل الخروج', account: 'الحساب',
        // Product
        orderNow: 'اطلب الآن', soldOut: 'نفذت الكمية', featured: 'مميز',
        inStock: 'متوفر', price: 'السعر', selectSize: 'اختر المقاس',
        selectColor: 'اختر اللون', addToCart: 'أضف للسلة',
        loading: 'جاري التحميل...', products: 'المنتجات',
        sizeOutOfStock: 'المقاس المختار غير متوفر',
        sizeRecommendations: 'قد يعجبك أيضاً هذه التيشيرتات بالمقاس {{value}}',
        // Home
        shopNow: 'تسوق الآن', nextDrop: 'موعد إصدار المجموعة القادمة',
        latestDrop: 'أحدث إصدار', viewCollection: 'عرض المجموعة',
        featuredCollection: 'المجموعة المميزة', viewAll: 'عرض كل المنتجات',
        brandTitle: 'فلسفة القطعة الفريدة',
        brandDesc: 'نؤمن بالتميز؛ كل تصميم يصنع منه قطعتان فقط لكل مقاس. قطعتك ليست مجرد تيشرت، بل قصة تحكي أناقتك بكل معاني الندرة والفخامة والتميز.',
        learnMore: 'اعرف أكثر',
        heroTitle: 'FIRST EDITION',
        heroSubtitle: 'LIMITED EDITION PREMIUM STREETWEAR',
        days: 'أيام', hours: 'ساعات', mins: 'دقائق', secs: 'ثواني',
        // Shop
        shopCollection: 'تسوق المجموعة', searchPlaceholder: 'ابحث عن منتجات...',
        allCategories: 'كل الفئات', allSizes: 'كل المقاسات',
        allColors: 'كل الألوان', clearFilters: 'مسح الفلاتر',
        loadingProducts: 'جاري تحميل المنتجات...', noProducts: 'لا توجد منتجات',
        newest: 'الأحدث', featuredSort: 'المميز',
        priceLow: 'السعر: من الأقل للأعلى', priceHigh: 'السعر: من الأعلى للأقل',
        // Product Detail
        leftInStock: 'متبقي', contactWhatsapp: 'تواصل معنا عبر واتساب لإتمام طلبك',
        confirmAvailability: 'سنؤكد لك التوفر وتفاصيل الدفع',
        fastResponse: 'رد سريع خلال ساعات العمل',
        colorNotice: 'الألوان قد تختلف قليلاً بسبب جودة الشاشات المختلفة',
        audiencePick: 'اختيار الجمهور',
        currentlyUnavailable: 'غير متوفر حالياً',
        shippingNotice: '📦 استلم التيشيرت الخاص بك خلال 7 أيام عمل.',
        weAccept: 'نقبل الدفع عبر:',
        // Cart
        cartEmpty: 'سلتك فارغة', continueShopping: 'مواصلة التسوق',
        shoppingCart: 'سلة التسوق', orderSummary: 'ملخص الطلب',
        subtotal: 'المجموع الجزئي', shipping: 'الشحن',
        shippingNote: 'يحسب عند الدفع', total: 'الإجمالي',
        checkout: 'إتمام الشراء', size: 'المقاس', color: 'اللون',
        // Contact
        directSupport: 'دعم مباشر', contactUs: 'تواصل معنا',
        contactDesc: 'تواصل معنا مباشرة على واتساب للطلبات والمقاسات وأي استفسارات.',
        whatsappChat: 'محادثة واتساب',
        whatsappDesc: 'تواصل معنا فوراً لتقديم طلبك أو الحصول على إجابات لأسئلتك.',
        startChatting: 'ابدأ المحادثة',
        // About
        aboutSubtitle: 'فلسفة الحصرية',
        ourStory: 'قصتنا',
        storyP1: 'تأسست First Edition على إدراك بسيط: فقد الموضة الحديثة قيمة الندرة. أصبحت الملابس المنتجة بكميات ضخمة شيئاً مؤقتاً. نحن نرفض ثقافة النسخ واللصق.',
        storyP2: 'ننتج ملابس ستريت ويار راقية في دفعات محدودة للغاية. كل مجموعة — ما نسميه "الإصدار" — مرقمة ومؤرشفة. حالما ينفد التصميم، يختفي للأبد ولن يُطبع مجدداً.',
        threePillars: 'الركائز الثلاث',
        pillar1Title: 'حصرية مرقمة', pillar1Desc: 'كل قطعة جزء من دفعة محدودة معتمدة. ضمان بأنك ترتدي شيئاً نادراً حقاً.',
        pillar2Title: 'حرفية راقية', pillar2Desc: 'قطن ثقيل ومزيج فاخر وتقنيات طباعة متميزة تصمد أمام اختبار الزمن.',
        pillar3Title: 'لن يتكرر', pillar3Desc: 'حالما ينفد الإصدار، يُؤرشف للأبد. لا إعادة طباعة، لا مخزون جديد — قطعتك لحظة استثنائية لن تتكرر.',
        heroPhrase: 'لِأَنَّكَ اسْتِثْنَائِيٌّ.. قِطْعَةٌ فَرِيدَةٌ صُمِّمَتْ لِتَكُونَ لَكَ وَحْدَكَ',
        heroTagline: 'فن يُرتدى. محدود بشكل صارم. لن يُعاد إصداره أبداً.',
        // Privacy & Terms
        privacySubtitle: 'الخصوصية', privacyTitle: 'سياسة الخصوصية', privacyIntro: 'في First Edition، خصوصيتك أولوية. تشرح هذه السياسة المعلومات التي نجمعها، وكيف نستخدمها، والإجراءات التي نتخذها لحمايتها.',
        privacySection1Title: 'البيانات التي نجمعها', privacySection1Text: 'نقوم بجمع البيانات اللازمة لإتمام طلبك وتقديم خدمة مميزة، مثل الاسم، وعناوين الشحن والفوترة، وبيانات الاتصال، وسجل الطلبات، وبيانات التحقق من الدفع.',
        privacySection2Title: 'كيفية استخدام بياناتك', privacySection2Text: 'نستخدم بياناتك لمعالجة الطلبات، وإعلامك بحالة الشحن، وتحسين تجربة المنتج والخدمة، ومنع الاحتيال، والامتثال للمتطلبات القانونية.',
        privacySection3Title: 'الأمان وحقوقك', privacySection3Text: 'نطبق ضوابط إدارية وتقنية وفيزيائية لحماية بياناتك. يمكنك طلب الوصول أو التصحيح أو الحذف عبر قنوات الدعم المتاحة.',
        termsSubtitle: 'الشروط', termsTitle: 'شروط الخدمة', termsIntro: 'تنظم هذه الشروط استخدامك لموقع First Edition. عند تقديم طلب، فإنك توافق على الشروط الواردة أدناه وسياسة الخدمة العامة.',
        termsSection1Title: 'الطلبات والتوفر', termsSection1Text: 'تخضع جميع المنتجات للتوفر. تحتفظ First Edition بالحق في تقييد الكميات أو إلغاء الطلبات أو تعديل الأسعار قبل تأكيد الشراء.',
        termsSection2Title: 'الأسعار والدفع', termsSection2Text: 'يتم تنفيذ الطلبات بعد تفويض الدفع. الأسعار لا تشمل الشحن إلا إذا تم ذكر ذلك صراحة، ويتطلب تنفيذ الطلب تأكيد الدفع أولاً.',
        termsSection3Title: 'الإرجاع وتسوية النزاعات', termsSection3Text: 'إذا كنت بحاجة إلى مساعدة بخصوص طلبك، تواصل معنا فوراً. نسعى لحل القضايا بطريقة عادلة ووفق سياسة الإرجاع واللوائح المعمول بها.',
        // Footer
        footerAbout: 'من نحن', footerContact: 'تواصل معنا', footerPrivacy: 'الخصوصية', footerTerms: 'الشروط',
        footerDevelopedBy: 'تم تطوير هذا الموقع بواسطة عاشر ميديا للخدمات الإلكترونية سجل تجاري رقم ١١٦١٥',
        // Gallery
        galleryKicker: 'الأرشيف',
        galleryTitle: 'قاعة الشهرة',
        gallerySubtitle: 'هذه القطع رحلت إلى الأبد. نفذت ولن تعود. شاهد على من تحرك أولاً.',
        galleryEmpty: 'لا توجد قطع مؤرشفة بعد.',
      }
    };
    let translation = translations[language][key] || key;
    if (args.length > 0) {
      translation = translation.replace(/{{value}}/g, args[0]);
    }
    return translation;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL: language === 'ar'
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
