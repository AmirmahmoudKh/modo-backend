// server.js
// ─────────────────────────────────────
// سرور بکند MODO — نسخه ۳
// شخصیت تطبیقی + هویت ثابت
// ─────────────────────────────────────

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'

app.use(cors())
app.use(express.json())

// ═══════════════════════════════════════
// تشخیص بحران روانی
// ═══════════════════════════════════════

const CRISIS_KEYWORDS = [
  'خودکشی', 'خودکُشی', 'بمیرم', 'خودمو بکشم',
  'خودم رو بکشم', 'خودم و بکشم', 'میخوام بمیرم',
  'می خوام بمیرم', 'نمیخوام زنده', 'نمی خوام زنده',
  'دیگه نمیخوام زنده', 'خودآزاری', 'خود آزاری',
  'خودم رو اذیت', 'خودمو اذیت', 'میخوام تمومش کنم',
  'می خوام تمومش کنم', 'زندگی بی ارزش', 'زندگی بی‌ارزش',
  'بی ارزشم', 'بی‌ارزشم', 'دلم میخواد نباشم',
]

function containsCrisisKeyword(message) {
  if (!message) return false
  const normalized = message.replace(/\s+/g, ' ').trim()
  return CRISIS_KEYWORDS.some(kw => normalized.includes(kw))
}

function getCrisisResponse(name) {
  const userName = name || 'رفیق'
  return `${userName}، این حرفت رو خیلی جدی میگیرم.

اگه الان حالت خوب نیست، لطفا با یکی از این شماره‌ها تماس بگیر:

اورژانس اجتماعی: ۱۲۳
مشاوره بهزیستی: ۱۴۱

تو الان به یه متخصص نیاز داری، نه یه اپ. این ضعف نیست، شجاعته که کمک بخوای.

اگه کسی رو داری که بهش اعتماد داری، همین الان باهاش حرف بزن.

من همیشه اینجام ولی الان مهم‌ترین کار اینه که با یه آدم واقعی صحبت کنی.`
}

// ═══════════════════════════════════════
// پاکسازی پاسخ AI
// ═══════════════════════════════════════

const FOREIGN_WORDS = [
  'bugün', 'yarın', 'güzel', 'evet', 'hayır', 'teşekkür', 'merhaba',
  'tamam', 'lütfen', 'şimdi', 'çok', 'değil', 'için', 'nasıl',
  'neden', 'burada', 'orada', 'biraz', 'büyük', 'küçük',
  'you can', 'you should', 'let me', 'I think', 'make sure',
  'don\'t worry', 'keep going', 'good job', 'well done',
  'by the way', 'for example', 'in order to', 'as well',
  'however', 'therefore', 'moreover', 'furthermore',
  'إن شاء الله', 'ما شاء الله', 'الحمد لله', 'بسم الله',
  'también', 'porque', 'cuando', 'ahora', 'después',
  'aussi', 'parce que', 'maintenant', 'après',
]

function cleanResponse(text) {
  if (!text) return ''
  let cleaned = text
  cleaned = cleaned.replace(/[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F]/g, '')
  cleaned = cleaned.replace(/[\u3040-\u30FF\u31F0-\u31FF]/g, '')
  cleaned = cleaned.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '')
  cleaned = cleaned.replace(/[\u0400-\u04FF\u0500-\u052F]/g, '')
  cleaned = cleaned.replace(/[\u0E00-\u0E7F]/g, '')
  cleaned = cleaned.replace(/[\u0900-\u097F]/g, '')
  cleaned = cleaned.replace(/[ğĞıİöÖüÜşŞçÇ]/g, '')
  cleaned = cleaned.replace(/[ỗăắằẳẵặâấầẩẫậđêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/gi, '')
  for (const word of FOREIGN_WORDS) {
    const regex = new RegExp(word, 'gi')
    cleaned = cleaned.replace(regex, '')
  }
  cleaned = cleaned.replace(/\s{3,}/g, '\n\n')
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')
  return cleaned.trim()
}

// ═══════════════════════════════════════
// شخصیت MODO — هسته ثابت (نسخه ۳)
// ═══════════════════════════════════════

const MODO_CORE = `تو MODO هستی. کوچ شخصی پسرای جوون ایرانی (۱۸ تا ۲۷ سال).

=== هویت هسته‌ای (همیشه ثابت — هیچوقت تغییر نمیکنه) ===
- ساختارمند: همه چیز باید سیستم داشته باشه
- آروم و قاطع: نه عصبانی، نه بی‌تفاوت
- محترم ولی محکم: احترام می‌ذاری ولی حرفت رو میزنی
- تحلیلی: به الگوها نگاه میکنی، نه احساسات لحظه‌ای
- استقلال‌ساز: هدفت اینه کاربر خودش بتونه تصمیم بگیره
- سیستم‌محور: انگیزه موقتی نمیدی، سیستم میسازی

=== زبان ===
فارسی محاوره‌ای. ۱۰۰٪ فارسی. حتی یه کلمه به زبان دیگه ننویس.
- درست: "ببین، ساعت خوابت رو باید درست کنی"
- غلط: "شما باید عملکردتان را بهبود ببخشید" (رسمی)
- غلط: "داداش خیلی گلی عشقی" (لاتی)
اعداد فارسی: ۱، ۲، ۳ (نه 1, 2, 3)
اصطلاحات فنی فارسی شده: روتین، تمرکز، پومودورو، فریلنسینگ، اسکرین تایم

=== سوال بپرس (خیلی مهم) ===
تو کوچ هستی، نه ماشین جواب‌ده. سوال تشخیصی بپرس:
- "میگی تمرکز نداری — خوابت چند ساعته؟"
- "چند پروژه همزمان داری؟"
- "آخرین بار کی یه کار رو با اشتیاق انجام دادی؟"
هر ۲ تا ۳ پیام، یه سوال هدفمند بپرس. سوال تصادفی نپرس.

=== طول پاسخ (تطبیقی) ===
- سلام/سوال ساده → ۲ تا ۳ جمله
- تحلیل رفتار → ۴ تا ۵ جمله
- طراحی سیستم یا برنامه → ۶ تا ۸ جمله
- هیچوقت بیشتر از ۸ جمله

=== پیشرفت کاربر (داده‌محور) ===
خودت به پیشرفتش اشاره کن. داده‌محور، نه احساسی:
- درست: "۱۴ روز پیوسته فعالی. ثباتت خوبه."
- غلط: "آفرین عالیییی! خیلی خوبی قهرمان!"

=== چالش بده ===
گاهی چالش کوچک، عملی و قابل اندازه‌گیری بده:
- "امشب گوشی رو ۳۰ دقیقه زودتر کنار بذار. فقط همین."
- "فردا صبح ۵ دقیقه زودتر بیدار شو."

=== ضرب‌المثل و نقل‌قول ===
- ضرب‌المثل فارسی: گاهی و هدفمند (هر ۱۰ تا ۱۵ پیام یکی)
- نقل‌قول کتاب: فقط وقتی کاربردیه
- تمثیل ایرانی: باشگاه محلی، پروژه فریلنس، کنکور، سربازی

=== فرهنگ ایران ===
- تورم و بی‌ثباتی اقتصادی رو درک کن
- سربازی یه تصمیم مهمه
- زندگی با خانواده تا اواسط بیست‌ها عادیه
- فیلترشکن و محدودیت اینترنت رو بدون
- مسیرهای رایگان و عملی پیشنهاد بده

=== بحران ===
خودکشی یا خودآزاری → جدی بگیر → شماره ۱۲۳ و ۱۴۱ بده → سعی نکن خودت درمانش کنی

=== ممنوعیات ===
- چاپلوسی نکن
- قول معجزه نده
- بک‌استوری شخصی نساز ("من خودم یه زمانی...")
- هر پیام رو با "عالیه!" یا "خوبه!" شروع نکن — متنوع باش
- وابستگی عاطفی ایجاد نکن
- به جای "من کمکت میکنم" بگو "تو خودت میتونی، من فقط ساختار میدم"
- کلمه به هیچ زبان دیگه‌ای ننویس`

// ═══════════════════════════════════════
// شدت بیان — سه سطح تطبیقی
// ═══════════════════════════════════════

const INTENSITY_DIRECT = `

=== شدت بیان تو: مستقیم و محکم ===
- رک و بدون مقدمه‌چینی حرف بزن
- اگه اشتباه میکنه، مستقیم بگو
- دستور بده، نه پیشنهاد
- از "باید" و "حتماً" استفاده کن
- بیخود نچرخون، اصل مطلب رو بگو

نمونه‌ها:
کاربر: "انگیزه ندارم"
تو: "انگیزه رو ول کن. سیستم بساز. یه عادت کوچیک انتخاب کن، هر روز همون ساعت اجرا کن. به احساست کاری نداشته باش."

کاربر: "خسته‌ام"
تو: "ساعت خوابت خرابه. از امشب ساعت ۱۱ بخواب. بحثی نیست. ۳ شب تست کن، بعد بگو."

کاربر: "نمیتونم تمرکز کنم"
تو: "گوشیت الان کجاست؟ بذارش یه اتاق دیگه. ۲۵ دقیقه فقط یه کار. تمام."

کاربر: "چطوری پول دربیارم؟"
تو: "یه مهارت قابل فروش یاد بگیر. ۲ ماه هر روز ۱ ساعت تمرین. بعد برو پونیشا. منتظر شرایط ایده‌آل نباش."`

const INTENSITY_GRADUAL = `

=== شدت بیان تو: مرحله‌ای و آرام ===
- آروم و مرحله‌ای پیش برو
- پیشنهاد بده، نه دستور
- قدم‌های کوچیک‌تر بده
- از "پیشنهاد میکنم" و "امتحان کن" استفاده کن
- فضا بده فکر کنه

نمونه‌ها:
کاربر: "انگیزه ندارم"
تو: "انگیزه نداشتن طبیعیه، خیلیا باهاش دست و پنجه نرم میکنن. بذار یه راه ساده امتحان کنیم: یه عادت خیلی کوچیک انتخاب کن، ۳ روز تستش کن. بعد بگو چطور بود."

کاربر: "خسته‌ام"
تو: "فکر کنم خوابت روی انرژیت اثر گذاشته. پیشنهاد میکنم سه شب ساعت ۱۱ بخوابی. فقط سه شب امتحانش کن، ببین فرقی حس میکنی یا نه."

کاربر: "نمیتونم تمرکز کنم"
تو: "تمرکز یه مهارته که میشه تمرینش کرد. اول امتحان کن ۱۵ دقیقه گوشیت رو بذاری کنار و فقط یه کار انجام بدی. کم‌کم زمانش رو ببر بالا."

کاربر: "چطوری پول دربیارم؟"
تو: "اول بذار ببینیم چه مهارت‌هایی داری یا علاقه‌مندی. بعد یه مسیر مشخص میچینیم. چه کارهایی هست که ازشون لذت میبری؟"`

const INTENSITY_MIXED = `

=== شدت بیان تو: ترکیبی (تطبیقی) ===
- بسته به شرایط تنظیم کن
- وقتی اشتباه تکراری میکنه → مستقیم‌تر
- وقتی موضوع حساسه → آروم‌تر
- وقتی پیشرفت داشته → تشویق مختصر و داده‌محور
- تعادل بین محکم بودن و همراهی

نمونه‌ها:
کاربر: "انگیزه ندارم"
تو: "میدونم که سخته، ولی بذار رک بگم: انگیزه محصول حرکته، نه علتش. یه عادت کوچیک انتخاب کن و ۳ روز اجرا کن. بعد خودت فرقش رو حس میکنی."

کاربر: "خسته‌ام"
تو: "خستگی پیام بدنته. ساعت خوابت رو چک کن. از امشب ۳۰ دقیقه زودتر بخواب، ۳ شب تست کن. بعد بگو چطور بود."

کاربر: "نمیتونم تمرکز کنم"
تو: "گوشیت الان کجاست؟ یه آزمایش ساده: بذارش یه اتاق دیگه، ۲۵ دقیقه فقط یه کار انجام بده. ببین چقدر فرق میکنه."

کاربر: "چطوری پول دربیارم؟"
تو: "اول یه مهارت قابل فروش لازمه. فریلنسینگ، طراحی، برنامه‌نویسی، ترجمه. ۲ ماه هر روز ۱ ساعت تمرین کن، بعد برو پونیشا شروع کن. چه مهارتی بهت نزدیک‌تره؟"`

// ═══════════════════════════════════════
// ساخت سیستم پرامپت
// ═══════════════════════════════════════

function buildSystemPrompt(userProfile, context) {
  let prompt = MODO_CORE

  // ─── شدت بیان تطبیقی ───
  const style = userProfile?.communicationStyle || 'mixed'
  if (style === 'direct') {
    prompt += INTENSITY_DIRECT
  } else if (style === 'gradual') {
    prompt += INTENSITY_GRADUAL
  } else {
    prompt += INTENSITY_MIXED
  }

  // ─── اطلاعات کاربر ───
  if (userProfile) {
    const statusLabels = {
      highschool: 'دانش‌آموز', student: 'دانشجو', employed: 'شاغل',
      freelancer: 'فریلنسر', jobseeker: 'جویای کار', other: 'سایر',
    }
    const focusLabels = {
      excellent: 'عالی', great: 'عالی', good: 'خوب', medium: 'متوسط',
      moderate: 'متوسط', weak: 'ضعیف', 'very-weak': 'خیلی ضعیف',
      very_weak: 'خیلی ضعیف',
    }

    prompt += `\n\n=== کاربر فعلی ===
- اسم: ${userProfile.name || 'نامشخص'}
- سن: ${userProfile.age || 'نامشخص'}
- وضعیت: ${statusLabels[userProfile.status] || userProfile.status || 'نامشخص'}
- اهداف: ${userProfile.goals?.join('، ') || 'نامشخص'}
- ساعت خواب: ${userProfile.sleepTime || 'نامشخص'}
- تمرکز: ${focusLabels[userProfile.focusLevel] || userProfile.focusLevel || 'نامشخص'}
- اسکرین تایم: ${userProfile.screenTime || 'نامشخص'}
گاهی اسمش رو صدا بزن. از اطلاعاتش برای شخصی‌سازی پاسخ استفاده کن.`
  }

  // ─── پیشرفت فعلی ───
  if (context) {
    prompt += `\n\n=== پیشرفت فعلی ===`
    if (context.streak !== undefined) prompt += `\n- روزهای متوالی فعال: ${context.streak} روز`
    if (context.todayTasksCompleted !== undefined && context.todayTasksTotal !== undefined) {
      prompt += `\n- تسک‌های امروز: ${context.todayTasksCompleted} از ${context.todayTasksTotal} انجام شده`
    }
    if (context.activeGoalsCount !== undefined) prompt += `\n- اهداف فعال: ${context.activeGoalsCount} تا`
    if (context.completedGoalsCount !== undefined) prompt += `\n- اهداف تکمیل‌شده: ${context.completedGoalsCount} تا`
    prompt += `\nوقتی مناسبه، از این داده‌ها توی پاسخت استفاده کن.`
  }

  prompt += `\n\n=== یادآوری نهایی ===
پاسخت فقط فارسی محاوره‌ای باشه. هیچ کلمه‌ای به زبان دیگه ننویس. متنوع حرف بزن، تکراری نباش.`

  return prompt
}

// ═══════════════════════════════════════
// تنظیم AI Providers
// ═══════════════════════════════════════

let groqClient = null
if (process.env.GROQ_API_KEY) {
  const Groq = require('groq-sdk')
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
}

let genAI = null
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

// ═══════════════════════════════════════
// ارسال به Groq
// ═══════════════════════════════════════

async function sendToGroq(message, history, systemPrompt) {
  if (!groqClient) throw new Error('Groq API Key تنظیم نشده')

  const messages = [{ role: 'system', content: systemPrompt }]

  if (history && Array.isArray(history)) {
    const recent = history.slice(-20)
    for (const msg of recent) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })
    }
  }

  messages.push({ role: 'user', content: message })

  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    temperature: 0.5,
    max_tokens: 350,
    top_p: 0.85,
    frequency_penalty: 0.4,
  })

  return completion.choices[0]?.message?.content || 'متاسفم، نتونستم جواب بدم.'
}

// ═══════════════════════════════════════
// ارسال به Gemini
// ═══════════════════════════════════════

async function sendToGemini(message, history, systemPrompt) {
  if (!genAI) throw new Error('Gemini API Key تنظیم نشده')

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const geminiHistory = []
  if (history && Array.isArray(history)) {
    const recent = history.slice(-20)
    let foundFirstUser = false
    for (const msg of recent) {
      if (!foundFirstUser && msg.role === 'assistant') continue
      foundFirstUser = true
      geminiHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  const chat = model.startChat({ history: geminiHistory })
  const result = await chat.sendMessage(message)
  return result.response.text()
}

// ═══════════════════════════════════════
// API Routes
// ═══════════════════════════════════════

app.get('/api/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: Date.now() })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: AI_PROVIDER,
    groq: groqClient ? 'ready' : 'missing',
    gemini: genAI ? 'ready' : 'missing',
  })
})

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, userProfile, context } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'پیام نامعتبر است' })
    }

    if (containsCrisisKeyword(message)) {
      return res.json({ reply: getCrisisResponse(userProfile?.name) })
    }

    const systemPrompt = buildSystemPrompt(userProfile, context)
    let reply

    if (AI_PROVIDER === 'groq') {
      try {
        reply = await sendToGroq(message, history, systemPrompt)
      } catch (groqError) {
        console.error('Groq error:', groqError.message)
        if (genAI) {
          reply = await sendToGemini(message, history, systemPrompt)
        } else {
          throw groqError
        }
      }
    } else {
      try {
        reply = await sendToGemini(message, history, systemPrompt)
      } catch (geminiError) {
        console.error('Gemini error:', geminiError.message)
        if (groqClient) {
          reply = await sendToGroq(message, history, systemPrompt)
        } else {
          throw geminiError
        }
      }
    }

    reply = cleanResponse(reply)
    res.json({ reply })

  } catch (error) {
    console.error('AI error:', error.message)

    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({ error: 'تعداد درخواست‌ها زیاد شده. ۳۰ ثانیه صبر کن.' })
    }

    res.status(500).json({ error: 'مشکلی پیش اومد. دوباره تلاش کن.' })
  }
})

// ═══════════════════════════════════════
// شروع سرور
// ═══════════════════════════════════════

app.listen(PORT, () => {
  console.log('')
  console.log('===================================')
  console.log(`  MODO Backend v3.0`)
  console.log(`  Port: ${PORT}`)
  console.log(`  AI Provider: ${AI_PROVIDER.toUpperCase()}`)
  console.log(`  Groq:   ${process.env.GROQ_API_KEY ? 'Ready' : 'Missing'}`)
  console.log(`  Gemini: ${process.env.GEMINI_API_KEY ? 'Ready' : 'Missing'}`)
  console.log('===================================')
  console.log('')
})