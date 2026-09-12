#!/usr/bin/env node
/**
 * Seed clinic_knowledge with ~100 draft question-and-answer entries.
 *
 * Every row is inserted UNPUBLISHED. The column defaults to true, so this is
 * explicit — and search_clinic_knowledge() filters on is_published, so nothing
 * here can reach a patient until someone at the clinic has read it and
 * published it in Admin → Knowledge.
 *
 * Entries tagged `needs_clinic_input` deliberately route the patient to a
 * colleague instead of stating something we do not know (prices, insurance,
 * parking, policies). They are safe exactly as written, but the clinic should
 * replace them with real answers before publishing.
 *
 * No entry gives clinical advice. Urgent symptoms route to a person.
 *
 *   node --env-file=.env.local scripts/seed-clinic-knowledge.mjs --dry-run
 *   node --env-file=.env.local scripts/seed-clinic-knowledge.mjs
 *
 * Idempotent: an entry whose title already exists is skipped.
 */
import { createClient } from "@supabase/supabase-js";

const HUMAN_EN = "reply “human” and a colleague will help";
const HUMAN_AR = "اكتب «موظف» وأحد الزملاء هيساعدك";

/** [category, title, title_ar, body, body_ar, needsClinicInput] */
const ENTRIES = [
  // ─── visiting ───
  ["visiting", "Do I need an appointment, or can I walk in?", "لازم أحجز ولا ممكن آجي من غير ميعاد؟",
    "We see patients by appointment so the dentist has time set aside for you. I can show you open times and help you book.",
    "بنستقبل المرضى بمواعيد عشان الدكتور يكون متفرغ ليك. أقدر أوريك المواعيد المتاحة وأساعدك تحجز.", false],
  ["visiting", "How early should I arrive for my appointment?", "أوصل قبل ميعادي بقد إيه؟",
    "Please arrive about 10 minutes early, especially on your first visit, so reception can check you in.",
    "يُفضّل توصل قبل ميعادك بحوالي ١٠ دقايق، خصوصًا في أول زيارة، عشان الاستقبال يسجّل بياناتك.", true],
  ["visiting", "What should I bring to my first visit?", "أجيب معايا إيه في أول زيارة؟",
    "Bring a photo ID, any recent dental X-rays or reports, and a list of the medicines you take.",
    "هات بطاقتك الشخصية، وأي أشعة أو تقارير أسنان حديثة، وقائمة بالأدوية اللي بتاخدها.", false],
  ["visiting", "Is there parking near the clinic?", "فيه مكان للركن جنب العيادة؟",
    `A colleague can tell you about parking near the clinic — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يقولك على أماكن الركن جنب العيادة — ${HUMAN_AR}.`, true],
  ["visiting", "Can I bring someone with me?", "ممكن آجي ومعايا حد؟",
    "Yes, you are welcome to bring a family member or a friend.",
    "أيوه، أهلًا بيك تيجي ومعاك حد من العيلة أو صاحبك.", true],
  ["visiting", "Is the clinic wheelchair accessible?", "العيادة مناسبة للكرسي المتحرك؟",
    `A colleague will confirm access details before your visit — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك تفاصيل الوصول قبل زيارتك — ${HUMAN_AR}.`, true],
  ["visiting", "How long does a first visit take?", "أول زيارة بتاخد وقت قد إيه؟",
    "A first visit usually takes about one appointment slot. The dentist will tell you if treatment needs more time.",
    "أول زيارة غالبًا بتاخد مدة ميعاد واحد، والدكتور هيقولك لو العلاج محتاج وقت أكتر.", false],
  ["visiting", "Can you send me directions to the clinic?", "ممكن توصفلي مكان العيادة؟",
    "I can share our address, and a colleague can send you a location pin to open in Maps.",
    "أقدر أبعتلك العنوان، وأحد الزملاء يقدر يبعتلك لوكيشن تفتحه على الخريطة.", false],
  ["visiting", "Is the clinic open on a particular day?", "العيادة فاتحة يوم معيّن؟",
    "Our open days and hours are in our schedule, and I can check a specific day for you.",
    "أيام ومواعيد العمل موجودة في جدولنا، وأقدر أشوفلك يوم معيّن.", false],
  ["visiting", "Is there a waiting area?", "فيه مكان للانتظار؟",
    "Yes, there is a waiting area at reception.",
    "أيوه، فيه مكان انتظار عند الاستقبال.", true],

  // ─── booking ───
  ["booking", "How do I book an appointment?", "أحجز ميعاد إزاي؟",
    "Tell me the service you need and I will show you the open times. If you are not sure which service, a General consultation is the best start.",
    "قولي الخدمة اللي محتاجها وأنا أوريك المواعيد المتاحة. ولو مش متأكد من الخدمة، الكشف والاستشارة هو أحسن بداية.", false],
  ["booking", "I don't know which service I need.", "مش عارف محتاج خدمة إيه.",
    "That's completely fine. Book a General consultation — the dentist will examine you and recommend what you need.",
    "مفيش أي مشكلة. احجز كشف واستشارة، والدكتور هيكشف عليك ويقولك محتاج إيه.", false],
  ["booking", "Can I change my appointment time?", "ممكن أغيّر ميعادي؟",
    "Yes. Tell me which appointment you want to move and I will show you other open times.",
    "أيوه. قولي أنهي ميعاد عايز تغيّره وأنا أوريك مواعيد تانية متاحة.", false],
  ["booking", "How do I cancel my appointment?", "ألغي ميعادي إزاي؟",
    "Reply to your reminder with “cancel”, or tell me here which appointment you want to cancel.",
    "رد على رسالة التذكير بكلمة «إلغاء»، أو قولي هنا أنهي ميعاد عايز تلغيه.", false],
  ["booking", "Will I get a reminder before my appointment?", "هيجيلي تذكير قبل الميعاد؟",
    "Yes, we send a WhatsApp reminder the day before your appointment.",
    "أيوه، بنبعت تذكير على واتساب قبل ميعادك بيوم.", true],
  ["booking", "What happens if I am late?", "لو اتأخرت هيحصل إيه؟",
    "Please let us know as soon as you can. If you are very late we may need to move you to another time so others are not kept waiting.",
    "بلغنا بأسرع وقت. لو التأخير كبير ممكن نحتاج ننقلك لميعاد تاني عشان باقي المرضى ميستنوش.", true],
  ["booking", "What if there are no times that suit me?", "لو مفيش ميعاد مناسب ليا؟",
    "A colleague can add you to our waitlist, and we will message you if an earlier time opens up.",
    "أحد الزملاء يقدر يضيفك لقائمة الانتظار، وهنبعتلك لو فضي ميعاد أقرب.", false],
  ["booking", "Can I book for someone else?", "ممكن أحجز لحد تاني؟",
    "Yes. Just tell me their name and the service they need.",
    "أيوه. قولي اسمه والخدمة اللي محتاجها.", false],
  ["booking", "Can I book more than one appointment?", "ممكن أحجز أكتر من ميعاد؟",
    "Yes — tell me each service and I will help you find the times, one at a time.",
    "أيوه — قولي كل خدمة وأنا أساعدك تلاقي المواعيد واحدة واحدة.", false],
  ["booking", "How far ahead can I book?", "أقدر أحجز قبلها بقد إيه؟",
    "You can book from the open times I can see, which usually cover the next few weeks.",
    "تقدر تحجز من المواعيد المتاحة اللي قدامي، وغالبًا بتغطي الأسابيع الجاية.", false],
  ["booking", "Will I get a booking confirmation?", "هيجيلي تأكيد للحجز؟",
    "Yes, you will receive a confirmation message once your booking is made.",
    "أيوه، هتوصلك رسالة تأكيد بعد ما الحجز يتم.", true],
  ["booking", "Can I book with a specific dentist?", "ممكن أحجز مع دكتور معيّن؟",
    `A colleague can tell you which dentist is available at each time — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يقولك مين الدكتور المتاح في كل ميعاد — ${HUMAN_AR}.`, true],
  ["booking", "Is my appointment still on?", "ميعادي لسه قايم؟",
    "I can see your upcoming appointments and tell you the date and time. A colleague can confirm any other details.",
    "أقدر أشوف مواعيدك الجاية وأقولك التاريخ والساعة، وأحد الزملاء يقدر يأكد أي تفاصيل تانية.", false],
  ["booking", "What if I miss my appointment?", "لو مجيتش الميعاد؟",
    "Please tell us if you cannot come, so the time can go to someone else. We are happy to book you a new time.",
    "لو مش هتقدر تيجي بلغنا، عشان الميعاد يروح لحد تاني. وإحنا نحجزلك ميعاد جديد بكل سرور.", true],

  // ─── money ───
  ["money", "How much does a consultation cost?", "الكشف بكام؟",
    `A colleague will confirm the current consultation fee — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك سعر الكشف الحالي — ${HUMAN_AR}.`, true],
  ["money", "How much will my treatment cost?", "العلاج هيتكلف كام؟",
    "The cost depends on what the dentist recommends after examining you. A colleague will give you the price before treatment.",
    "التكلفة بتعتمد على اللي الدكتور هيقترحه بعد الكشف، وأحد الزملاء هيقولك السعر قبل العلاج.", true],
  ["money", "Do you accept insurance?", "بتقبلوا تأمين؟",
    `A colleague can tell you which insurance providers we work with — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يقولك شركات التأمين اللي بنتعامل معاها — ${HUMAN_AR}.`, true],
  ["money", "What payment methods do you accept?", "بتقبلوا طرق دفع إيه؟",
    `A colleague will confirm the payment methods we accept — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك طرق الدفع المتاحة — ${HUMAN_AR}.`, true],
  ["money", "Can I pay in instalments?", "ممكن أقسّط؟",
    `A colleague can tell you whether instalments are available for your treatment — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يقولك لو فيه تقسيط متاح لعلاجك — ${HUMAN_AR}.`, true],
  ["money", "Do I need to pay a deposit to book?", "لازم أدفع عربون عشان أحجز؟",
    `A colleague will confirm whether a deposit is needed — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك لو محتاج تدفع عربون — ${HUMAN_AR}.`, true],
  ["money", "Can I get a receipt?", "ممكن آخد فاتورة؟",
    "Yes, reception can give you a receipt for any payment.",
    "أيوه، الاستقبال يقدر يديك فاتورة لأي مبلغ تدفعه.", true],
  ["money", "Do you have any offers or discounts?", "فيه عروض أو خصومات؟",
    `A colleague can tell you about any current offers — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يقولك على العروض الحالية — ${HUMAN_AR}.`, true],
  ["money", "Is the price different for children?", "السعر للأطفال مختلف؟",
    `A colleague will confirm prices for children — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك أسعار الأطفال — ${HUMAN_AR}.`, true],
  ["money", "Can I know the price before treatment starts?", "ممكن أعرف السعر قبل ما العلاج يبدأ؟",
    "Yes — after your consultation the dentist can explain the plan, and a colleague can give you the cost.",
    "أيوه — بعد الكشف الدكتور يشرحلك الخطة، وأحد الزملاء يقولك التكلفة.", true],

  // ─── services ───
  ["services", "What is a General consultation?", "يعني إيه كشف واستشارة؟",
    "A visit where the dentist examines your teeth and gums, answers your questions and recommends any treatment you need.",
    "زيارة الدكتور بيكشف فيها على سنانك ولثتك، ويجاوب على أسئلتك، ويقترح أي علاج محتاجه.", false],
  ["services", "Do you do teeth cleaning?", "بتعملوا تنظيف أسنان؟",
    "Please book a General consultation. The dentist will check your teeth and arrange a cleaning if you need one.",
    "احجز كشف واستشارة، والدكتور هيكشف على سنانك ويرتبلك تنظيف لو محتاجه.", true],
  ["services", "What is teeth whitening?", "يعني إيه تبييض الأسنان؟",
    "A cosmetic treatment that lightens the colour of your teeth. The dentist checks first whether it suits you.",
    "علاج تجميلي بيفتّح لون سنانك. الدكتور بيتأكد الأول إنه مناسب ليك.", false],
  ["services", "Do you offer laser teeth whitening?", "بتعملوا تبييض أسنان بالليزر؟",
    "Yes, laser teeth whitening is one of our treatments. The dentist will confirm it suits you at your visit.",
    "أيوه، تبييض الأسنان بالليزر من علاجاتنا، والدكتور هيأكد إنه مناسب ليك في الزيارة.", false],
  ["services", "What are dental implants?", "يعني إيه زراعة الأسنان؟",
    "An implant replaces a missing tooth with an artificial root that holds a new tooth. The dentist assesses whether it is right for you.",
    "الزرعة بتعوّض سنة ناقصة بجذر صناعي بيشيل سنة جديدة، والدكتور بيقيّم إذا كانت مناسبة ليك.", false],
  ["services", "What are crowns and veneers?", "يعني إيه التيجان والفينير؟",
    "A crown covers and protects a tooth; veneers are thin covers on the front of teeth that improve how they look.",
    "التاج بيغطي السنة ويحميها، والفينير قشرة رفيعة على واجهة السنان بتحسّن شكلها.", false],
  ["services", "Do you offer braces?", "بتعملوا تقويم أسنان؟",
    "Yes, we offer orthodontic treatment with braces. Start with a consultation so the dentist can plan it.",
    "أيوه، بنعمل تقويم أسنان. ابدأ بكشف عشان الدكتور يخطط للعلاج.", false],
  ["services", "What are aligners?", "يعني إيه الـ Aligners؟",
    "Clear, removable trays that gradually straighten teeth — an alternative to braces in suitable cases.",
    "قوالب شفافة بتتشال وبتتركب، بتعدّل السنان بالتدريج، وبديل للتقويم في الحالات المناسبة.", false],
  ["services", "Do you treat children?", "بتعالجوا الأطفال؟",
    "Yes, we offer pediatric dentistry for children.",
    "أيوه، عندنا طب أسنان أطفال.", false],
  ["services", "What is root canal treatment?", "يعني إيه علاج العصب؟",
    "Treatment that cleans the inside of a tooth so it can be kept rather than removed. Only the dentist can decide if you need it.",
    "علاج بينظّف جوه السنة عشان نحافظ عليها بدل ما تتخلع، والدكتور بس هو اللي يقرر لو محتاجه.", false],
  ["services", "What is gum treatment?", "يعني إيه علاج اللثة؟",
    "Care for the gums and the tissues around the teeth. The dentist examines you to see what is needed.",
    "عناية باللثة والأنسجة اللي حوالين السنان، والدكتور بيكشف عليك يشوف إيه المطلوب.", false],
  ["services", "Do you do tooth extractions?", "بتخلعوا أسنان؟",
    "Yes, including surgical extractions. The dentist decides whether a tooth needs to come out.",
    "أيوه، وبنعمل خلع جراحي كمان. والدكتور هو اللي يقرر لو السنة محتاجة تتخلع.", false],
  ["services", "What is a removable prosthesis?", "يعني إيه التركيبات المتحركة؟",
    "A full or partial denture you can take out, used to replace missing teeth.",
    "طقم كامل أو جزئي بيتشال، بيعوّض السنان الناقصة.", false],
  ["services", "Which laser treatments do you offer?", "بتقدموا علاجات ليزر إيه؟",
    "Our laser treatments include gum reshaping, gum depigmentation, mouth ulcer removal, frenectomy, laser whitening, and some root canal and gum pocket treatments.",
    "علاجات الليزر عندنا بتشمل تحديد اللثة، وإزالة تصبغ اللثة، وإزالة قرح الفم، واستئصال اللجام، والتبييض بالليزر، وبعض علاجات العصب وجيوب اللثة.", false],
  ["services", "What is gum depigmentation?", "يعني إيه إزالة تصبغ اللثة؟",
    "A laser treatment that lightens dark patches on the gums for a more even colour.",
    "علاج بالليزر بيفتّح البقع الغامقة في اللثة عشان يبقى لونها متساوي.", false],
  ["services", "What is a frenectomy?", "يعني إيه استئصال اللجام؟",
    "A small laser procedure that releases the tissue attaching the lip or tongue when it is too tight. The dentist decides if it is needed.",
    "إجراء بسيط بالليزر بيفك النسيج اللي بيربط الشفايف أو اللسان لما يكون مشدود، والدكتور هو اللي يقرر لو محتاجه.", false],
  ["services", "What is a gingivectomy?", "يعني إيه قطع اللثة؟",
    "A laser procedure that reshapes or removes excess gum tissue.",
    "إجراء بالليزر بيعيد تشكيل اللثة أو يشيل الزيادة منها.", false],
  ["services", "Do you offer treatment for jaw (TMJ) muscles?", "بتعالجوا عضلات الفك (TMJ)؟",
    `We offer laser therapy for the jaw muscles and joint. A colleague can arrange for the dentist to see you — ${HUMAN_EN}.`,
    `بنقدم علاج بالليزر لعضلات ومفصل الفك، وأحد الزملاء يرتبلك ميعاد مع الدكتور — ${HUMAN_AR}.`, false],
  ["services", "Do you do oral surgery?", "بتعملوا جراحات فم؟",
    "Yes, we perform oral surgery. The dentist assesses you at a consultation first.",
    "أيوه، بنعمل جراحات فم، والدكتور بيقيّم حالتك في الكشف الأول.", false],
  ["services", "Can you remove mouth ulcers?", "بتشيلوا قرح الفم؟",
    "We offer laser removal of mouth ulcers. The dentist needs to examine you first.",
    "بنشيل قرح الفم بالليزر، بس لازم الدكتور يكشف عليك الأول.", false],
  ["services", "Do you do root canal treatment for children?", "بتعملوا علاج عصب للأطفال؟",
    "Yes, including pulpectomy for children, when the dentist decides it is needed.",
    "أيوه، ومنها استئصال اللب للأطفال، لما الدكتور يقرر إنه محتاجه.", false],
  ["services", "Do you treat gum pockets?", "بتعالجوا جيوب اللثة؟",
    "Yes, we offer laser treatment for gum pockets after the dentist examines you.",
    "أيوه، بنعالج جيوب اللثة بالليزر بعد ما الدكتور يكشف عليك.", false],
  ["services", "Which treatment is right for me?", "أنهي علاج مناسب ليا؟",
    "Only the dentist can recommend treatment after examining you. A General consultation is the right first step.",
    "الدكتور بس هو اللي يقدر يقترح العلاج بعد الكشف، والكشف والاستشارة هو أول خطوة صح.", false],
  ["services", "Can I get a second opinion?", "ممكن آخد رأي تاني؟",
    "Yes — book a General consultation and bring any previous reports or X-rays.",
    "أيوه — احجز كشف واستشارة وهات معاك أي تقارير أو أشعة قديمة.", false],
  ["services", "Do you do check-ups for braces?", "بتعملوا متابعة للتقويم؟",
    "Yes — tell me you need an orthodontic check and I will show you open times.",
    "أيوه — قولي إنك محتاج متابعة تقويم وأنا أوريك المواعيد المتاحة.", false],

  // ─── after a visit (logistics only — never clinical advice) ───
  ["after_visit", "Will the clinic contact me after my visit?", "العيادة هتتواصل معايا بعد الزيارة؟",
    "Yes, we send a short message the day after your visit to check how you are.",
    "أيوه، بنبعت رسالة قصيرة تاني يوم الزيارة نطمن عليك.", true],
  ["after_visit", "When should I come back for a check-up?", "أرجع للمتابعة إمتى؟",
    "The dentist will tell you when to come back, and we send a reminder when a routine check-up is due.",
    "الدكتور هيقولك ترجع إمتى، وبنبعتلك تذكير لما ميعاد المتابعة الدورية ييجي.", true],
  ["after_visit", "I have a question about my treatment.", "عندي سؤال عن العلاج بتاعي.",
    "Tell me here and a colleague will pass your question to the dentist.",
    "قولي هنا وأحد الزملاء هيوصّل سؤالك للدكتور.", false],
  ["after_visit", "How do I get a copy of my records or X-rays?", "أجيب نسخة من ملفي أو الأشعة إزاي؟",
    `A colleague can arrange copies of your records — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يجهزلك نسخة من ملفك — ${HUMAN_AR}.`, true],
  ["after_visit", "How do I book my follow-up visit?", "أحجز ميعاد المتابعة إزاي؟",
    "Tell me you need a follow-up and I will show you open times.",
    "قولي إنك محتاج متابعة وأنا أوريك المواعيد المتاحة.", false],
  ["after_visit", "I lost my appointment details.", "ضاعت مني تفاصيل ميعادي.",
    "I can see your upcoming appointments here and tell you the date and time.",
    "أقدر أشوف مواعيدك الجاية وأقولك التاريخ والساعة.", false],
  ["after_visit", "Can I give feedback about my visit?", "ممكن أقول رأيي في الزيارة؟",
    "Of course — tell me here and it will reach the clinic team.",
    "طبعًا — قولي هنا وهيوصل لفريق العيادة.", false],
  ["after_visit", "Can I leave a review?", "ممكن أكتب تقييم؟",
    `Thank you! A colleague can send you a link — ${HUMAN_EN}.`,
    `شكرًا ليك! أحد الزملاء يقدر يبعتلك اللينك — ${HUMAN_AR}.`, true],

  // ─── children ───
  ["children", "From what age can children visit?", "الأطفال ممكن ييجوا من سن كام؟",
    `A colleague will confirm the age we start seeing children — ${HUMAN_EN}.`,
    `أحد الزملاء هيأكدلك من سن كام بنستقبل الأطفال — ${HUMAN_AR}.`, true],
  ["children", "Can a parent stay with the child?", "ينفع الأهل يفضلوا مع الطفل؟",
    "Yes, a parent or guardian stays with the child during the visit.",
    "أيوه، ولي الأمر بيفضل مع الطفل طول الزيارة.", true],
  ["children", "How do I book for my child?", "أحجز لابني إزاي؟",
    "Tell me your child's name and what they need, and I will show you open times.",
    "قولي اسم ابنك واللي محتاجه، وأنا أوريك المواعيد المتاحة.", false],
  ["children", "My child is scared of the dentist.", "ابني خايف من الدكتور.",
    "Let us know when you book, so the team can take extra time to make your child comfortable.",
    "بلغنا وإنت بتحجز، عشان الفريق ياخد وقته ويطمّن ابنك.", false],
  ["children", "Do you use laser treatments for children?", "بتستخدموا الليزر في علاج الأطفال؟",
    "Some of our laser treatments are used for children when the dentist decides they suit the child.",
    "بعض علاجات الليزر عندنا بتتعمل للأطفال لما الدكتور يقرر إنها مناسبة.", false],
  ["children", "Does my child need to bring anything?", "ابني محتاج يجيب حاجة معاه؟",
    "Just bring any previous dental reports and tell us about any medicines your child takes.",
    "هات أي تقارير أسنان قديمة، وقولنا على أي أدوية ابنك بياخدها.", false],
  ["children", "Can I book my family together?", "ممكن أحجز للعيلة كلها مع بعض؟",
    "Yes — tell me each person and I will look for times close together.",
    "أيوه — قولي كل واحد وأنا أدور على مواعيد جنب بعض.", false],
  ["children", "Is there a dentist for children?", "فيه دكتور أسنان أطفال؟",
    `We offer pediatric dentistry. A colleague can tell you who will see your child — ${HUMAN_EN}.`,
    `عندنا طب أسنان أطفال، وأحد الزملاء يقولك مين هيكشف على ابنك — ${HUMAN_AR}.`, true],

  // ─── urgent (routing only — never advice) ───
  ["urgent", "I have severe tooth pain.", "عندي ألم شديد في سناني.",
    "I'm sorry you are in pain. I am passing you to a colleague straight away so the clinic can help you.",
    "سلامتك. هحوّلك لأحد الزملاء فورًا عشان العيادة تساعدك.", false],
  ["urgent", "My face is swollen.", "وشي وارم.",
    "I'm passing you to a colleague straight away. If you have any trouble breathing or swallowing, go to the nearest emergency department now.",
    "هحوّلك لأحد الزملاء فورًا. ولو عندك أي صعوبة في التنفس أو البلع، روح أقرب طوارئ حالًا.", false],
  ["urgent", "A tooth was knocked out.", "سنة وقعت بسبب خبطة.",
    "I'm passing you to a colleague straight away so the clinic can advise you quickly.",
    "هحوّلك لأحد الزملاء فورًا عشان العيادة تقولك تعمل إيه بسرعة.", false],
  ["urgent", "My mouth is bleeding and it won't stop.", "بقي بينزف ومش بيقف.",
    "I'm passing you to a colleague straight away. If the bleeding is heavy, go to the nearest emergency department now.",
    "هحوّلك لأحد الزملاء فورًا. ولو النزيف شديد، روح أقرب طوارئ حالًا.", false],
  ["urgent", "Do you see dental emergencies?", "بتستقبلوا حالات الطوارئ؟",
    `For anything urgent, message us and a colleague will respond as quickly as possible — ${HUMAN_EN}.`,
    `لأي حالة عاجلة ابعتلنا وأحد الزملاء هيرد بأسرع وقت — ${HUMAN_AR}.`, true],
  ["urgent", "The clinic is closed and I need help.", "العيادة مقفولة ومحتاج مساعدة.",
    "Leave your message and a colleague will reply when the clinic opens. For a serious emergency, go to the nearest emergency department.",
    "سيب رسالتك وأحد الزملاء هيرد أول ما العيادة تفتح. ولو الحالة طارئة وخطيرة، روح أقرب طوارئ.", false],
  ["urgent", "My filling or crown came out.", "الحشو أو التاج وقع.",
    "A colleague will arrange for the dentist to see you. I'm passing your message on now.",
    "أحد الزملاء هيرتبلك ميعاد مع الدكتور، وهوصّل رسالتك دلوقتي.", false],
  ["urgent", "I have a problem after my treatment.", "عندي مشكلة بعد العلاج.",
    "I'm passing you to a colleague straight away so the dental team can help.",
    "هحوّلك لأحد الزملاء فورًا عشان فريق الأسنان يساعدك.", false],

  // ─── the assistant itself ───
  ["assistant", "Am I talking to a real person?", "أنا بكلم شخص حقيقي؟",
    "You are chatting with the clinic's automated assistant. Reply “human” any time to reach a person.",
    "إنت بتكلم المساعد الآلي للعيادة. اكتب «موظف» في أي وقت عشان تكلم شخص.", false],
  ["assistant", "How do I talk to a person?", "أكلم موظف إزاي؟",
    "Just reply “human” (or «موظف») and a colleague will take over.",
    "اكتب «موظف» بس، وأحد الزملاء هيكمل معاك.", false],
  ["assistant", "Can the assistant book for me?", "المساعد يقدر يحجزلي؟",
    "It can show you open times and help you book. A colleague confirms bookings when needed.",
    "يقدر يوريك المواعيد المتاحة ويساعدك تحجز، وأحد الزملاء بيأكد الحجز لما يكون محتاج.", false],
  ["assistant", "Can the assistant give me medical advice?", "المساعد يقدر يديني نصيحة طبية؟",
    "No. Medical questions always go to the dental team, so the assistant passes them to a colleague.",
    "لأ. الأسئلة الطبية دايمًا بتروح لفريق الأسنان، فالمساعد بيحوّلها لأحد الزملاء.", false],
  ["assistant", "How do I stop getting messages from the clinic?", "أوقف رسايل العيادة إزاي؟",
    "Reply STOP and we will stop sending you reminders and updates.",
    "ابعت كلمة STOP وهنوقف رسايل التذكير والتحديثات.", false],
  ["assistant", "Is my information private?", "بياناتي في أمان؟",
    "Your messages are used by the clinic only to help with your care and appointments.",
    "رسايلك العيادة بتستخدمها بس عشان تساعدك في علاجك ومواعيدك.", true],
  ["assistant", "Why did I get a message from the clinic?", "ليه وصلتني رسالة من العيادة؟",
    "We send reminders and follow-ups about your appointments. Reply STOP if you would rather not receive them.",
    "بنبعت تذكيرات ومتابعات خاصة بمواعيدك. ابعت STOP لو مش عايز توصلك.", false],
  ["assistant", "The assistant doesn't understand me.", "المساعد مش فاهمني.",
    "Sorry about that — reply “human” and a colleague will help you directly.",
    "آسفين على كده — اكتب «موظف» وأحد الزملاء هيساعدك بنفسه.", false],

  // ─── the clinic ───
  ["clinic", "Who are the dentists?", "مين الدكاترة؟",
    `A colleague can tell you about our dentists — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يعرّفك على الدكاترة — ${HUMAN_AR}.`, true],
  ["clinic", "Which languages can I use?", "أقدر أتكلم بأنهي لغة؟",
    "You can message us in Arabic or English.",
    "تقدر تكلمنا بالعربي أو الإنجليزي.", false],
  ["clinic", "Are your instruments sterilised?", "الأدوات بتتعقم؟",
    "Yes, instruments are sterilised between patients.",
    "أيوه، الأدوات بتتعقم بين كل مريض والتاني.", true],
  ["clinic", "Can I call the clinic?", "ممكن أكلم العيادة تليفون؟",
    "Yes — our phone number is in our contact details, and you can keep messaging us here too.",
    "أيوه — رقمنا موجود في بيانات التواصل، وتقدر تكمل كلامك معانا هنا كمان.", false],
  ["clinic", "Do you have female dentists?", "فيه دكاترة ستات؟",
    `A colleague will let you know — ${HUMAN_EN}.`,
    `أحد الزملاء هيقولك — ${HUMAN_AR}.`, true],
  ["clinic", "Do you offer home visits?", "بتعملوا زيارات في البيت؟",
    `A colleague will let you know — ${HUMAN_EN}.`,
    `أحد الزملاء هيقولك — ${HUMAN_AR}.`, true],
  ["clinic", "Can I get a medical certificate?", "ممكن آخد شهادة طبية؟",
    `A colleague can help with certificates after your visit — ${HUMAN_EN}.`,
    `أحد الزملاء يقدر يساعدك في الشهادة بعد الزيارة — ${HUMAN_AR}.`, true],
  ["clinic", "Can I send you my X-ray?", "ممكن أبعتلك الأشعة؟",
    "Yes, you can send it here. The dental team will look at it — the assistant cannot read images.",
    "أيوه، ابعتها هنا وفريق الأسنان هيشوفها — المساعد مش بيقدر يقرا الصور.", false],
];

const TAG_SEED = "seeded-draft";
const TAG_NEEDS_INPUT = "needs_clinic_input";

function validate(entries) {
  const problems = [];
  const titles = new Set();
  entries.forEach((e, i) => {
    if (e.length !== 6) problems.push(`#${i}: expected 6 fields, got ${e.length}`);
    for (const [j, v] of e.slice(0, 5).entries()) {
      if (typeof v !== "string" || !v.trim()) problems.push(`#${i}: field ${j} is empty`);
    }
    if (titles.has(e[1])) problems.push(`#${i}: duplicate title "${e[1]}"`);
    titles.add(e[1]);
  });
  return problems;
}

const dryRun = process.argv.includes("--dry-run");
const problems = validate(ENTRIES);
if (problems.length) {
  console.error("Seed data is invalid:\n  " + problems.join("\n  "));
  process.exit(1);
}

const byCategory = {};
let needsInput = 0;
for (const e of ENTRIES) {
  byCategory[e[0]] = (byCategory[e[0]] ?? 0) + 1;
  if (e[5]) needsInput += 1;
}
console.log(`${ENTRIES.length} entries (${needsInput} need clinic input):`);
for (const [c, n] of Object.entries(byCategory)) console.log(`  ${c.padEnd(12)} ${n}`);

if (dryRun) {
  console.log("\n--dry-run: nothing written.");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: readError } = await db
  .from("clinic_knowledge")
  .select("title, sort_order")
  .is("deleted_at", null);
if (readError) {
  console.error("Could not read clinic_knowledge:", readError.message);
  process.exit(1);
}
const existingTitles = new Set((existing ?? []).map((r) => r.title));
const startOrder = Math.max(0, ...(existing ?? []).map((r) => r.sort_order ?? 0)) + 10;

const rows = ENTRIES.filter((e) => !existingTitles.has(e[1])).map((e, i) => ({
  title: e[1],
  title_ar: e[2],
  body: e[3],
  body_ar: e[4],
  tags: [TAG_SEED, e[0], ...(e[5] ? [TAG_NEEDS_INPUT] : [])],
  sort_order: startOrder + i,
  is_published: false,
}));

if (rows.length === 0) {
  console.log("\nAll entries already exist. Nothing to insert.");
  process.exit(0);
}

for (let i = 0; i < rows.length; i += 50) {
  const { error } = await db.from("clinic_knowledge").insert(rows.slice(i, i + 50));
  if (error) {
    console.error(`Insert failed at batch ${i / 50 + 1}:`, error.message);
    process.exit(1);
  }
}
console.log(`\nInserted ${rows.length} unpublished entries. Skipped ${ENTRIES.length - rows.length} that already existed.`);
console.log("Review and publish them in Admin → Knowledge.");
