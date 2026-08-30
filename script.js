const html = document.documentElement;
const metaDescription = document.getElementById("meta-description");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-img");
const closeButton = document.getElementById("lightbox-close");
const triggers = document.querySelectorAll(".gallery-trigger");
const languageButtons = document.querySelectorAll("[data-lang-switch]");
const sliderTrack = document.getElementById("slider-track");
const sliderViewport = document.getElementById("slider-viewport");
const sliderPrev = document.getElementById("slider-prev");
const sliderNext = document.getElementById("slider-next");
const sliderSlides = sliderTrack ? Array.from(sliderTrack.children) : [];
const menuToggles = document.querySelectorAll("[data-menu-toggle]");
const siteMenu = document.getElementById("site-menu");
const siteHeaderSticky = document.getElementById("site-header");
const heroSection = document.querySelector(".hero");
const menuLinks = siteMenu ? siteMenu.querySelectorAll("a") : [];

const translations = {
  en: {
    pageTitle: "The Dental Lounge | Dr. Karim Elshibiny",
    pageDescription:
      "The Dental Lounge by Dr. Karim Elshibiny offers modern laser and cosmetic dentistry with comfort-first care in New Cairo.",
    brandAria: "The Dental Lounge home",
    brandName: "The Dental Lounge",
    logoAlt: "The Dental Lounge logo",
    navPrimary: "Primary",
    navAbout: "About",
    navServices: "Services",
    navGallery: "Gallery",
    navMore: "More Images",
    navContact: "Contact",
    headerContact: "Contact",
    searchAria: "Open gallery",
    menuOpenAria: "Open menu",
    menuCloseAria: "Close menu",
    aboutJumpAria: "Go to services",
    heroTitleBefore: "Caring for Your ",
    heroTitleEm: "Smile",
    heroTitleAfter: ", One Visit at a Time.",
    heroText:
      "Your smile is more than just an expression — it's a reflection of your confidence, health, and happiness. At The Dental Lounge, Dr. Karim Elshibiny delivers comfort-first laser and cosmetic care.",
    heroCta: "Set Appointment",
    heroContactChip: "Contact ↗",
    heroHighlightsAria: "Clinic highlights",
    highlightOne: "Advanced laser technology",
    highlightTwo: "Gentle, patient-focused care",
    highlightThree: "Located in New Cairo",
    heroDoctorAlt: "Dr. Karim Elshibiny standing inside The Dental Lounge clinic",
    aboutLabel: "About Us",
    aboutImgOneAlt: "Smile treatment before during and after result",
    aboutDoctorAlt: "Dr. Karim Elshibiny",
    aboutLeadBefore: "We create lasting relationships — built on ",
    aboutLeadEmOne: "trust and care",
    aboutLeadMid: ". Our team is committed to making ",
    aboutLeadEmTwo: "every visit comfortable",
    aboutLeadAfter: ", and fit for you.",
    aboutBody:
      "Under the care of Dr. Karim Elshibiny, The Dental Lounge focuses on modern laser dentistry and cosmetic treatments in a calm, patient-friendly clinic environment.",
    trustOneValue: "Laser-focused",
    trustOneLabel: "Precision care",
    trustTwoValue: "New Cairo",
    trustTwoLabel: "Ozone Medical Center",
    trustThreeValue: "Comfort-first",
    trustThreeLabel: "Patient experience",
    solutionsTitle: "Comprehensive solutions for the perfect smile",
    solutionsSide:
      "Take a step toward a perfect smile with modern laser technology and personalized care.",
    solutionsLaserTitle: "Laser dentistry solution",
    solutionsLaserText:
      "Precise, comfort-first laser treatments for gum reshaping, whitening support, and faster healing.",
    solutionsLaserAlt: "Laser dentistry technology",
    solutionsLaserAria: "View laser gallery",
    solutionsDoctorTitle: "Find the right dentist for you",
    solutionsDoctorAlt: "Dr. Karim Elshibiny",
    solutionsBook: "Book Consultation",
    solutionsSmileTitle: "Smile results with precision",
    solutionsSmileText:
      "Because every smile deserves careful planning, modern tools, and confident results.",
    solutionsSmileAlt: "Before and after smile result",
    solutionsSmileAria: "View smile results",
    servicesLabel: "Our Services",
    servicesHeading: "Focused treatments with modern technology",
    servicesIntro:
      "A selection of laser-supported and cosmetic dentistry services offered with precision and patient comfort in mind.",
    service1Title: "Gingivectomy",
    service1Text: "Removes excess gum tissue and reshapes the gum line.",
    service2Title: "Frenectomy",
    service2Text: "Releases abnormal frenum attachments quickly and comfortably.",
    service3Title: "Teeth Whitening",
    service3Text: "Removes stains and discoloration for a brighter smile.",
    service4Title: "TMJ Pain Therapy",
    service4Text: "Relieves pain and inflammation in jaw muscles and TMJ.",
    service5Title: "Oral Ulcer Removal",
    service5Text: "Relieves pain and promotes faster healing of mouth ulcers.",
    service6Title: "Perio Pockets Treatment",
    service6Text: "Reduces bacteria and inflammation in periodontal pockets.",
    service7Title: "Endodontic Treatment",
    service7Text:
      "Disinfects root canals effectively and supports faster recovery.",
    service8Title: "Oral Surgeries",
    service8Text: "Precise cutting, minimal bleeding, and faster recovery.",
    galleryLabel: "Gallery",
    galleryHeading: "Clinic highlights & smile results",
    galleryIntro:
      "Explore treatment imagery, clinic visuals, and before-and-after results from The Dental Lounge.",
    galleryFeatureAlt: "Before, during, and after orthodontic smile result",
    galleryFeatureCaption: "Before • During • After",
    baBrandThe: "THE",
    baBrandDental: "DENTAL",
    baBrandLounge: "LOUNGE",
    baBefore: "Before",
    baDuring: "During",
    baAfter: "After",
    baFilterAll: "Before • During • After",
    baFiltersAria: "Before and after filters",
    galleryDoctorAlt: "Dr. Karim Elshibiny inside the clinic",
    galleryDoctorCaption: "Meet Dr. Karim Elshibiny",
    galleryLaserAlt: "Biolase epicX laser dentistry technology poster",
    galleryLaserCaption: "Laser Technology",
    galleryFrenectomyAlt: "Frenectomy by laser before and after result",
    galleryFrenectomyCaption: "Frenectomy Result",
    sliderLabel: "More Images",
    sliderHeading: "More clinic & treatment highlights",
    sliderIntro:
      "Browse more visuals from the clinic, treatment technology, and smile cases in a rotating slider.",
    sliderPrev: "Previous images",
    sliderNext: "Next images",
    sliderImage1Alt: "Additional clinic gallery image 1",
    sliderImage2Alt: "Additional clinic gallery image 2",
    sliderImage3Alt: "Additional clinic gallery image 3",
    sliderImage4Alt: "Additional clinic gallery image 4",
    sliderImage5Alt: "Additional clinic gallery image 5",
    sliderImage6Alt: "Additional clinic gallery image 6",
    sliderImage7Alt: "Additional clinic gallery image 7",
    sliderImage8Alt: "Additional clinic gallery image 8",
    sliderImage9Alt: "Additional clinic gallery image 9",
    sliderImage10Alt: "Additional clinic gallery image 10",
    contactLabel: "Contact",
    contactHeading: "Book your visit",
    contactClinic: "The Dental Lounge",
    contactAddress:
      "A 41 Ozone Medical Center, New Cairo, Al Narges Buildings",
    contactNote: "Laser & cosmetic dentistry. Appointments by request.",
    contactCall: "Call",
    contactWhatsapp: "WhatsApp",
    contactDirections: "Get Directions",
    contactImageAlt: "The Dental Lounge contact and clinic information card",
    bookingTitle: "Book a consultation",
    bookingIntro:
      "Choose a service, date, and available time. This is a demo booking flow with sample slots.",
    bookingName: "Full name",
    bookingNamePlaceholder: "Ahmed Hassan",
    bookingPhone: "Phone",
    bookingPhonePlaceholder: "+20 1xx xxx xxxx",
    bookingEmail: "Email (optional)",
    bookingEmailPlaceholder: "you@email.com",
    bookingService: "Service",
    bookingServicePlaceholder: "Select a service",
    bookingServiceConsult: "General consultation",
    bookingDate: "Preferred date",
    bookingDatePlaceholder: "Select a date",
    bookingTime: "Available times",
    bookingTimeHint: "Pick a free slot for the selected date.",
    bookingNotes: "Notes (optional)",
    bookingNotesPlaceholder:
      "Any symptoms, preferred doctor notes, or questions…",
    bookingSubmit: "Confirm consultation",
    bookingWhatsapp: "Send on WhatsApp",
    bookingSuccess:
      "Request received (demo). We’ll confirm your slot shortly.",
    bookingError: "Please complete name, phone, service, date, and time.",
    bookingBooked: "Booked",
    footerTagline:
      "Modern laser and cosmetic dentistry with comfort-first care in New Cairo.",
    footerNavAria: "Footer navigation",
    footerText: "© The Dental Lounge",
    lightboxAria: "Expanded gallery image",
    lightboxCloseAria: "Close gallery image",
  },
  ar: {
    pageTitle: "The Dental Lounge | د. كريم الشيبيني",
    pageDescription:
      "تقدم The Dental Lounge مع د. كريم الشيبيني طب أسنان تجميلي وعلاجات ليزر حديثة برعاية مريحة للمرضى في القاهرة الجديدة.",
    brandAria: "العودة إلى الصفحة الرئيسية لـ The Dental Lounge",
    brandName: "The Dental Lounge",
    logoAlt: "شعار The Dental Lounge",
    navPrimary: "التنقل الرئيسي",
    navAbout: "من نحن",
    navServices: "الخدمات",
    navGallery: "المعرض",
    navMore: "صور إضافية",
    navContact: "تواصل معنا",
    headerContact: "تواصل",
    searchAria: "فتح المعرض",
    menuOpenAria: "فتح القائمة",
    menuCloseAria: "إغلاق القائمة",
    aboutJumpAria: "الانتقال إلى الخدمات",
    heroTitleBefore: "نعتني بـ",
    heroTitleEm: "ابتسامتك",
    heroTitleAfter: "، في كل زيارة.",
    heroText:
      "ابتسامتك أكثر من مجرد تعبير — فهي انعكاس لثقتك وصحتك وسعادتك. في The Dental Lounge، يقدم د. كريم الشيبيني رعاية ليزر وتجميل مريحة تركز على المريض.",
    heroCta: "احجز موعدًا",
    heroContactChip: "تواصل ↗",
    heroHighlightsAria: "مميزات العيادة",
    highlightOne: "تقنيات ليزر متقدمة",
    highlightTwo: "رعاية لطيفة تركز على المريض",
    highlightThree: "في القاهرة الجديدة",
    heroDoctorAlt: "د. كريم الشيبيني داخل عيادة The Dental Lounge",
    aboutLabel: "من نحن",
    aboutImgOneAlt: "نتيجة علاج ابتسامة قبل وأثناء وبعد",
    aboutDoctorAlt: "د. كريم الشيبيني",
    aboutLeadBefore: "نبني علاقات طويلة الأمد قائمة على ",
    aboutLeadEmOne: "الثقة والرعاية",
    aboutLeadMid: ". يلتزم فريقنا بجعل ",
    aboutLeadEmTwo: "كل زيارة مريحة",
    aboutLeadAfter: " ومناسبة لك.",
    aboutBody:
      "بإشراف د. كريم الشيبيني، تركز The Dental Lounge على طب الأسنان بالليزر والعلاجات التجميلية في بيئة هادئة تراعي راحة المريض.",
    trustOneValue: "تركيز على الليزر",
    trustOneLabel: "رعاية دقيقة",
    trustTwoValue: "القاهرة الجديدة",
    trustTwoLabel: "Ozone Medical Center",
    trustThreeValue: "الراحة أولًا",
    trustThreeLabel: "تجربة المريض",
    solutionsTitle: "حلول شاملة للابتسامة المثالية",
    solutionsSide:
      "ابدأ خطواتك نحو ابتسامة مثالية بتقنيات الليزر الحديثة ورعاية مخصصة لك.",
    solutionsLaserTitle: "حلول طب الأسنان بالليزر",
    solutionsLaserText:
      "علاجات ليزر دقيقة ومريحة لإعادة تشكيل اللثة ودعم التبييض والتعافي الأسرع.",
    solutionsLaserAlt: "تقنية طب الأسنان بالليزر",
    solutionsLaserAria: "عرض معرض الليزر",
    solutionsDoctorTitle: "اختر طبيب الأسنان المناسب لك",
    solutionsDoctorAlt: "د. كريم الشيبيني",
    solutionsBook: "احجز استشارة",
    solutionsSmileTitle: "نتائج ابتسامة بدقة عالية",
    solutionsSmileText:
      "لأن كل ابتسامة تستحق تخطيطًا دقيقًا وأدوات حديثة ونتائج تبعث على الثقة.",
    solutionsSmileAlt: "نتيجة ابتسامة قبل وبعد",
    solutionsSmileAria: "عرض نتائج الابتسامة",
    servicesLabel: "خدماتنا",
    servicesHeading: "علاجات دقيقة بتقنيات حديثة",
    servicesIntro:
      "مجموعة من خدمات الليزر وطب الأسنان التجميلي المقدمة بدقة مع الاهتمام براحة المريض.",
    service1Title: "قص اللثة التجميلي",
    service1Text: "إزالة الزيادة من أنسجة اللثة وإعادة تشكيل خط اللثة.",
    service2Title: "قص اللجام",
    service2Text: "تحرير اللجام غير الطبيعي بسرعة وراحة أكبر.",
    service3Title: "تبييض الأسنان",
    service3Text: "إزالة التصبغات والبقع للحصول على ابتسامة أكثر إشراقًا.",
    service4Title: "علاج آلام مفصل الفك",
    service4Text: "تخفيف الألم والالتهاب في عضلات الفك ومفصل الفك.",
    service5Title: "إزالة تقرحات الفم",
    service5Text: "تخفيف الألم والمساعدة على التئام أسرع لتقرحات الفم.",
    service6Title: "علاج الجيوب اللثوية",
    service6Text: "تقليل البكتيريا والالتهاب داخل الجيوب اللثوية.",
    service7Title: "علاج الجذور",
    service7Text: "تعقيم قنوات الجذور بفعالية مع دعم التعافي بشكل أسرع.",
    service8Title: "جراحات الفم",
    service8Text: "دقة أعلى ونزيف أقل وتعافٍ أسرع بعد الإجراء.",
    galleryLabel: "المعرض",
    galleryHeading: "من داخل العيادة ونتائج الابتسامة",
    galleryIntro:
      "استكشف صور العيادة والتقنيات المستخدمة ونتائج قبل وبعد من The Dental Lounge.",
    galleryFeatureAlt: "نتيجة ابتسامة قبل وأثناء وبعد العلاج",
    galleryFeatureCaption: "قبل • أثناء • بعد",
    baBrandThe: "THE",
    baBrandDental: "DENTAL",
    baBrandLounge: "LOUNGE",
    baBefore: "قبل",
    baDuring: "أثناء",
    baAfter: "بعد",
    baFilterAll: "قبل • أثناء • بعد",
    baFiltersAria: "فلاتر قبل وبعد",
    galleryDoctorAlt: "د. كريم الشيبيني داخل العيادة",
    galleryDoctorCaption: "تعرف على د. كريم الشيبيني",
    galleryLaserAlt: "ملصق تقنية الليزر بايوليز epicX",
    galleryLaserCaption: "تقنية الليزر",
    galleryFrenectomyAlt: "نتيجة قص اللجام بالليزر قبل وبعد",
    galleryFrenectomyCaption: "نتيجة قص اللجام",
    sliderLabel: "صور إضافية",
    sliderHeading: "المزيد من صور العيادة والحالات",
    sliderIntro:
      "تصفح المزيد من صور العيادة والتقنيات المستخدمة وحالات الابتسامة داخل سلايدر متحرك.",
    sliderPrev: "الصور السابقة",
    sliderNext: "الصور التالية",
    sliderImage1Alt: "صورة إضافية من العيادة 1",
    sliderImage2Alt: "صورة إضافية من العيادة 2",
    sliderImage3Alt: "صورة إضافية من العيادة 3",
    sliderImage4Alt: "صورة إضافية من العيادة 4",
    sliderImage5Alt: "صورة إضافية من العيادة 5",
    sliderImage6Alt: "صورة إضافية من العيادة 6",
    sliderImage7Alt: "صورة إضافية من العيادة 7",
    sliderImage8Alt: "صورة إضافية من العيادة 8",
    sliderImage9Alt: "صورة إضافية من العيادة 9",
    sliderImage10Alt: "صورة إضافية من العيادة 10",
    contactLabel: "تواصل معنا",
    contactHeading: "احجز زيارتك",
    contactClinic: "The Dental Lounge",
    contactAddress: "A 41 Ozone Medical Center، New Cairo، Al Narges Buildings",
    contactNote: "طب الأسنان التجميلي والليزر. المواعيد بالحجز المسبق.",
    contactCall: "اتصال",
    contactWhatsapp: "واتساب",
    contactDirections: "الاتجاهات",
    contactImageAlt: "بطاقة معلومات التواصل الخاصة بـ The Dental Lounge",
    bookingTitle: "احجز استشارة",
    bookingIntro:
      "اختر الخدمة والتاريخ والوقت المتاح. هذا نموذج تجريبي بمواعيد وهمية.",
    bookingName: "الاسم بالكامل",
    bookingNamePlaceholder: "أحمد حسن",
    bookingPhone: "الهاتف",
    bookingPhonePlaceholder: "+20 1xx xxx xxxx",
    bookingEmail: "البريد (اختياري)",
    bookingEmailPlaceholder: "you@email.com",
    bookingService: "الخدمة",
    bookingServicePlaceholder: "اختر خدمة",
    bookingServiceConsult: "استشارة عامة",
    bookingDate: "التاريخ المفضل",
    bookingDatePlaceholder: "اختر تاريخًا",
    bookingTime: "الأوقات المتاحة",
    bookingTimeHint: "اختر موعدًا متاحًا للتاريخ المحدد.",
    bookingNotes: "ملاحظات (اختياري)",
    bookingNotesPlaceholder: "أي أعراض أو ملاحظات أو أسئلة…",
    bookingSubmit: "تأكيد الاستشارة",
    bookingWhatsapp: "إرسال عبر واتساب",
    bookingSuccess: "تم استلام الطلب (تجريبي). سنؤكد الموعد قريبًا.",
    bookingError: "يرجى إكمال الاسم والهاتف والخدمة والتاريخ والوقت.",
    bookingBooked: "محجوز",
    footerTagline:
      "طب أسنان تجميلي وليزر حديث برعاية مريحة للمرضى في القاهرة الجديدة.",
    footerNavAria: "روابط التذييل",
    footerText: "© The Dental Lounge",
    lightboxAria: "صورة معرض مكبرة",
    lightboxCloseAria: "إغلاق صورة المعرض",
  },
};

let previousFocus = null;
let sliderTimer = null;

function translateNodes(language) {
  const copy = translations[language];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (copy[key]) {
      element.textContent = copy[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (copy[key]) {
      element.setAttribute("placeholder", copy[key]);
    }
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const key = element.dataset.i18nAlt;
    if (copy[key]) {
      element.setAttribute("alt", copy[key]);
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (copy[key]) {
      element.setAttribute("aria-label", copy[key]);
    }
  });

  document.querySelectorAll(".gallery-trigger").forEach((trigger) => {
    const altKey = trigger.dataset.altKey;
    if (altKey && copy[altKey]) {
      trigger.dataset.alt = copy[altKey];
    }
  });

  document.title = copy.pageTitle;
  metaDescription.setAttribute("content", copy.pageDescription);
  html.lang = language;
  html.dir = language === "ar" ? "rtl" : "ltr";
}

function updateLanguageButtons(language) {
  languageButtons.forEach((button) => {
    const isActive = button.dataset.langSwitch === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function sliderStepSize() {
  const slideWidth = sliderSlides[0]?.getBoundingClientRect().width || 0;
  return slideWidth + 16;
}

function moveSlider(step) {
  if (!sliderTrack) {
    return;
  }

  const amount = sliderStepSize();
  const delta = amount * step;
  const maxScroll = sliderTrack.scrollWidth - sliderTrack.clientWidth;
  const nextScroll = sliderTrack.scrollLeft + delta;

  if (nextScroll >= maxScroll - amount / 2) {
    sliderTrack.scrollTo({ left: 0, behavior: "smooth" });
    return;
  }

  if (nextScroll <= 0 && step < 0) {
    sliderTrack.scrollTo({ left: maxScroll, behavior: "smooth" });
    return;
  }

  sliderTrack.scrollBy({ left: delta, behavior: "smooth" });
}

function startSliderAutoplay() {
  if (!sliderTrack) {
    return;
  }

  clearInterval(sliderTimer);
  sliderTimer = window.setInterval(() => {
    moveSlider(1);
  }, 3500);
}

function updateMenuPushOffset() {
  if (!siteMenu || siteMenu.hidden) {
    return;
  }

  document.documentElement.style.setProperty(
    "--menu-push",
    `${siteMenu.offsetHeight}px`
  );
}

function setMenuOpen(isOpen) {
  if (!siteMenu) {
    return;
  }

  siteMenu.hidden = !isOpen;
  document.body.classList.toggle("menu-open", isOpen);

  if (isOpen) {
    requestAnimationFrame(() => {
      updateMenuPushOffset();
    });
  } else {
    document.documentElement.style.removeProperty("--menu-push");
  }

  menuToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    const copy = translations[html.lang === "ar" ? "ar" : "en"];
    toggle.setAttribute(
      "aria-label",
      isOpen ? copy.menuCloseAria : copy.menuOpenAria
    );
  });
}

function updateStickyHeader() {
  if (!siteHeaderSticky || !heroSection) {
    return;
  }

  const threshold = heroSection.offsetHeight * 0.72;
  const isVisible = window.scrollY > threshold;

  siteHeaderSticky.classList.toggle("is-visible", isVisible);
  siteHeaderSticky.setAttribute("aria-hidden", isVisible ? "false" : "true");
  document.documentElement.style.setProperty(
    "--site-header-height",
    isVisible ? "72px" : "0px"
  );

  if (document.body.classList.contains("menu-open")) {
    updateMenuPushOffset();
  }
}

function getCurrentCopy() {
  return translations[html.lang === "ar" ? "ar" : "en"];
}

function formatBookingDate(date) {
  const locale = html.lang === "ar" ? "ar-EG" : "en-GB";
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function buildDummySchedule() {
  const schedule = {};
  const baseSlots = [
    "10:00",
    "10:30",
    "11:00",
    "12:00",
    "13:30",
    "15:00",
    "16:00",
    "17:30",
    "18:30",
  ];

  for (let offset = 1; offset <= 10; offset += 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    if (date.getDay() === 5) {
      continue;
    }

    const key = date.toISOString().slice(0, 10);
    const bookedIndexes = new Set([
      (offset * 2) % baseSlots.length,
      (offset * 3 + 1) % baseSlots.length,
    ]);

    schedule[key] = {
      label: formatBookingDate(date),
      slots: baseSlots.map((time, index) => ({
        time,
        available: !bookedIndexes.has(index),
      })),
    };
  }

  return schedule;
}

function initBookingForm() {
  const form = document.getElementById("booking-form");
  const dateSelect = document.getElementById("booking-date");
  const timeGrid = document.getElementById("time-slot-grid");
  const timeInput = document.getElementById("booking-time");
  const success = document.getElementById("booking-success");
  const error = document.getElementById("booking-error");
  const whatsappLink = document.getElementById("booking-whatsapp");

  if (!form || !dateSelect || !timeGrid || !timeInput) {
    return;
  }

  let schedule = buildDummySchedule();

  const refreshDateOptions = () => {
    schedule = buildDummySchedule();
    const previous = dateSelect.value;
    const copy = getCurrentCopy();

    dateSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = copy.bookingDatePlaceholder;
    dateSelect.appendChild(placeholder);

    Object.entries(schedule).forEach(([value, entry]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = entry.label;
      dateSelect.appendChild(option);
    });

    if (previous && schedule[previous]) {
      dateSelect.value = previous;
    }
  };

  const renderTimeSlots = (dateKey) => {
    const copy = getCurrentCopy();
    timeGrid.innerHTML = "";
    timeInput.value = "";

    if (!dateKey || !schedule[dateKey]) {
      return;
    }

    schedule[dateKey].slots.forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time-slot";
      button.textContent = slot.available
        ? slot.time
        : `${slot.time} · ${copy.bookingBooked}`;
      button.disabled = !slot.available;
      button.classList.toggle("is-booked", !slot.available);
      button.setAttribute("aria-pressed", "false");
      button.dataset.time = slot.time;

      if (slot.available) {
        button.addEventListener("click", () => {
          timeGrid.querySelectorAll(".time-slot").forEach((item) => {
            item.classList.remove("is-selected");
            item.setAttribute("aria-pressed", "false");
          });
          button.classList.add("is-selected");
          button.setAttribute("aria-pressed", "true");
          timeInput.value = slot.time;
          error.hidden = true;
        });
      }

      timeGrid.appendChild(button);
    });
  };

  const buildWhatsAppUrl = (payload) => {
    const lines = [
      "Consultation request — The Dental Lounge",
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      payload.email ? `Email: ${payload.email}` : null,
      `Service: ${payload.serviceLabel}`,
      `Date: ${payload.dateLabel}`,
      `Time: ${payload.time}`,
      payload.notes ? `Notes: ${payload.notes}` : null,
    ].filter(Boolean);

    return `https://wa.me/201111922252?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
  };

  refreshDateOptions();
  renderTimeSlots(dateSelect.value);

  dateSelect.addEventListener("change", () => {
    success.hidden = true;
    error.hidden = true;
    renderTimeSlots(dateSelect.value);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    success.hidden = true;
    error.hidden = true;

    const copy = getCurrentCopy();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const service = form.service.value;
    const date = form.date.value;
    const time = timeInput.value;
    const notes = form.notes.value.trim();

    if (!name || !phone || !service || !date || !time) {
      error.textContent = copy.bookingError;
      error.hidden = false;
      return;
    }

    const serviceOption = form.service.selectedOptions[0];
    const payload = {
      name,
      phone,
      email,
      service,
      serviceLabel: serviceOption ? serviceOption.textContent : service,
      date,
      dateLabel: schedule[date]?.label || date,
      time,
      notes,
    };

    whatsappLink.href = buildWhatsAppUrl(payload);
    success.textContent = copy.bookingSuccess;
    success.hidden = false;

    const bookedSlot = schedule[date]?.slots.find(
      (slot) => slot.time === time
    );
    if (bookedSlot) {
      bookedSlot.available = false;
    }
    renderTimeSlots(date);
  });

  whatsappLink.addEventListener("click", (event) => {
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const service = form.service.value;
    const date = form.date.value;
    const time = timeInput.value;

    if (!name || !phone || !service || !date || !time) {
      event.preventDefault();
      error.textContent = getCurrentCopy().bookingError;
      error.hidden = false;
      return;
    }

    const serviceOption = form.service.selectedOptions[0];
    whatsappLink.href = buildWhatsAppUrl({
      name,
      phone,
      email: form.email.value.trim(),
      service,
      serviceLabel: serviceOption ? serviceOption.textContent : service,
      date,
      dateLabel: schedule[date]?.label || date,
      time,
      notes: form.notes.value.trim(),
    });
  });

  window.refreshBookingFormLanguage = () => {
    refreshDateOptions();
    renderTimeSlots(dateSelect.value);
  };
}

function applyLanguage(language) {
  translateNodes(language);
  updateLanguageButtons(language);
  localStorage.setItem("dental-lounge-language", language);
  setMenuOpen(false);
  if (typeof window.refreshBookingFormLanguage === "function") {
    window.refreshBookingFormLanguage();
  }
}

if (siteMenu && menuToggles.length) {
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMenuOpen(siteMenu.hidden);
    });
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("menu-open")) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest("[data-menu-toggle]")
    ) {
      return;
    }

    setMenuOpen(false);
  });
}

window.addEventListener("scroll", updateStickyHeader, { passive: true });
window.addEventListener("resize", () => {
  updateStickyHeader();
  if (document.body.classList.contains("menu-open")) {
    updateMenuPushOffset();
  }
});

function openLightbox(src, alt, trigger) {
  previousFocus = trigger || document.activeElement;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeLightbox() {
  if (lightbox.hidden) {
    return;
  }

  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.style.overflow = "";

  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
}

triggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openLightbox(trigger.dataset.full, trigger.dataset.alt, trigger);
  });
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.langSwitch);
  });
});

if (sliderPrev && sliderNext && sliderViewport) {
  sliderPrev.addEventListener("click", () => {
    moveSlider(-1);
    startSliderAutoplay();
  });

  sliderNext.addEventListener("click", () => {
    moveSlider(1);
    startSliderAutoplay();
  });

  sliderViewport.addEventListener("mouseenter", () => {
    clearInterval(sliderTimer);
  });

  sliderViewport.addEventListener("mouseleave", startSliderAutoplay);
}

closeButton.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (
    event.target instanceof HTMLElement &&
    event.target.dataset.closeLightbox === "true"
  ) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

function initBeforeAfterFilter() {
  const showcase = document.getElementById("ba-showcase");
  if (!showcase) {
    return;
  }

  const filterButtons = showcase.querySelectorAll("[data-ba-filter]");
  const galleryCards = document.querySelectorAll("[data-gallery-category]");

  const applyFilter = (filter) => {
    showcase.dataset.baFilter = filter;

    filterButtons.forEach((button) => {
      const isActive = button.dataset.baFilter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    galleryCards.forEach((card) => {
      const category = card.dataset.galleryCategory;
      const showResultsOnly =
        filter === "before" || filter === "during" || filter === "after";
      const shouldShow = !showResultsOnly || category === "results";
      card.classList.toggle("is-filter-hidden", !shouldShow);
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.baFilter || "all");
    });
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll(".scroll-reveal");
  if (!items.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          entry.target.classList.remove("is-out-view");
          return;
        }

        entry.target.classList.remove("is-in-view");
        entry.target.classList.add("is-out-view");
      });
    },
    {
      threshold: [0, 0.12, 0.28],
      rootMargin: "0px 0px -6% 0px",
    }
  );

  items.forEach((item) => observer.observe(item));
}

function initHeroReveal() {
  const heroItems = document.querySelectorAll(".hero .scroll-reveal");

  if (!heroItems.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroItems.forEach((item) => item.classList.add("is-in-view"));
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroItems.forEach((item) => {
        item.classList.add("is-in-view");
        item.classList.remove("is-out-view");
      });
    });
  });
}

const storedLanguage = localStorage.getItem("dental-lounge-language");
const initialLanguage = storedLanguage === "ar" ? "ar" : "en";
applyLanguage(initialLanguage);
updateStickyHeader();
initBookingForm();
if (typeof window.refreshBookingFormLanguage === "function") {
  window.refreshBookingFormLanguage();
}
initBeforeAfterFilter();
initScrollReveal();
initHeroReveal();
startSliderAutoplay();
