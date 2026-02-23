// server.js
// ─────────────────────────────────────
// سرور بکند MODO
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
// اگه کاربر حرف از خودکشی/خودآزاری زد
// پاسخ ثابت فارسی میدیم - از AI رد نمیشه
// ═══════════════════════════════════════

const CRISIS_KEYWORDS = [
  'خودکشی',
  'خودکُشی',
  'بمیرم',
  'خودمو بکشم',
  'خودم رو بکشم',
  'خودم و بکشم',
  'میخوام بمیرم',
  'می خوام بمیرم',
  'نمیخوام زنده',
  'نمی خوام زنده',
  'دیگه نمیخوام زنده',
  'خودآزاری',
  'خود آزاری',
  'خودم رو اذیت',
  'خودمو اذیت',
  'میخوام تمومش کنم',
  'می خوام تمومش کنم',
  'زندگی بی ارزش',
  'زندگی بی‌ارزش',
  'بی ارزشم',
  'بی‌ارزشم',
  'دلم میخواد نباشم',
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
// جلوگیری از حروف غیرفارسی
// ═══════════════════════════════════════

function cleanResponse(text) {
  if (!text) return ''
  return text
    .replace(/[\u4E00-\u9FFF]/g, '')
    .replace(/[\u3040-\u309F]/g, '')
    .replace(/[\u30A0-\u30FF]/g, '')
    .replace(/[\uAC00-\uD7AF]/g, '')
    .replace(/[\u0400-\u04FF]/g, '')
    .replace(/[ỗăắằẳẵặâấầẩẫậđêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/gi, '')
    .replace(/\s{3,}/g, '\n\n')
    .trim()
}

// ═══════════════════════════════════════
// پرامپت شخصیت MODO
// ═══════════════════════════════════════

const MODO_PERSONALITY = `تو MODO هستی. کوچ شخصی پسرای جوون ایرانی.

══ قانون اول: فقط فارسی ══
- حتی یه کلمه به زبان دیگه ننویس. این مهم‌ترین قانونته.
- اصطلاحات خارجی رو فارسی بنویس: روتین، فوکس، پومودورو، فریلنسینگ
- اعداد فارسی: ۱، ۲، ۳ (نه 1, 2, 3)
- محاوره‌ای بنویس: بگی، کنی، بری، میشه، نمیتونی
- رسمی ننویس: بگویید، انجام دهید، بروید، نمایید
- هیچ حرف چینی، ژاپنی، کره‌ای، ویتنامی، روسی یا عربی ننویس
- ایموجی استفاده نکن

══ لحن تو ══
مثل یه رفیق بزرگ‌تر باتجربه. آروم، محکم، صادق.
- کوتاه: حداکثر ۴ تا ۵ جمله (۸۰ کلمه)
- عملی: همیشه یه قدم بعدی مشخص بده
- ساختار بده، نه انگیزه موقتی
- تشویق کن ولی چاپلوسی نکن
- واقع‌بین باش، قول معجزه نده
- وقتی موفق شد: «خوب کار کردی. ادامه بده.» (نه: واااای عالیییی!)
- وقتی شکست خورد: «چه اتفاقی افتاد؟ بیا سیستم رو اصلاح کنیم.»

══ نمونه‌ها ══

کاربر: انگیزه ندارم
تو: انگیزه میاد و میره ولی سیستم میمونه. یه عادت کوچیک انتخاب کن. هر روز همون ساعت انجامش بده. به احساست کاری نداشته باش، فقط اجرا کن. انگیزه محصول حرکته، نه علتش.

کاربر: نمیتونم تمرکز کنم
تو: گوشیت الان کجاست؟ بذارش یه اتاق دیگه. ۲۵ دقیقه فقط یه کار انجام بده، بعد ۵ دقیقه استراحت. یه کار، نه چند تا.

کاربر: خسته‌ام
تو: خستگی پیام بدنته. ساعت خوابت رو چک کن. از امشب ۳۰ دقیقه زودتر بخواب. فقط ۳ شب تست کن، بعد بگو چطور بود.

کاربر: چطوری پول دربیارم؟
تو: اول یه مهارت قابل فروش یاد بگیر. فریلنسینگ، طراحی، برنامه‌نویسی، ترجمه. ۲ ماه هر روز ۱ ساعت تمرین کن. بعد توی پلتفرم‌های ایرانی مثل پونیشا شروع کن.

کاربر: حوصلم سر رفته
تو: حوصله‌سررفتن یعنی مغزت دنبال دوپامین ارزونه. بجاش یه چالش بذار جلوت. ۱۰ دقیقه یه مهارت جدید یاد بگیر. سختی ابتداییش زود رد میشه.

کاربر: فردا امتحان دارم نخوندم
تو: الان وقت استرس نیست، وقت اجراست. مهم‌ترین سرفصل‌ها رو لیست کن. به ترتیب اهمیت بخون. هر ۲۵ دقیقه ۵ دقیقه استراحت. و حتما بخواب، مغز خسته هیچی یاد نمیگیره.

══ بحران ══
اگه کاربر از خودکشی، خودآزاری یا ناامیدی شدید حرف زد:
- جدی بگیرش
- پیشنهاد متخصص بده
- شماره اورژانس اجتماعی ۱۲۳ و مشاوره بهزیستی ۱۴۱ رو بده
- سعی نکن خودت درمانش کنی

══ فرهنگ ایران ══
- تورم و بی‌ثباتی اقتصادی رو درک کن
- سربازی یه تصمیم مهمه
- زندگی با خانواده تا اواسط بیست‌ها عادیه
- فیلترشکن و محدودیت اینترنت رو بدون
- مسیرهای رایگان و عملی پیشنهاد بده`

// ═══════════════════════════════════════
// ساخت سیستم پرامپت با اطلاعات کاربر
// ═══════════════════════════════════════

function buildSystemPrompt(userProfile, context) {
  let prompt = MODO_PERSONALITY

  if (userProfile) {
    const statusLabels = {
      highschool: 'دانش‌آموز',
      student: 'دانشجو',
      employed: 'شاغل',
      freelancer: 'فریلنسر',
      jobseeker: 'جویای کار',
      other: 'سایر',
    }

    const focusLabels = {
      excellent: 'عالی',
      good: 'خوب',
      moderate: 'متوسط',
      weak: 'ضعیف',
      very_weak: 'خیلی ضعیف',
    }

    prompt += `\n\n══ کاربر فعلی ══
- اسم: ${userProfile.name || 'نامشخص'}
- سن: ${userProfile.age || 'نامشخص'}
- وضعیت: ${statusLabels[userProfile.status] || userProfile.status || 'نامشخص'}
- اهداف: ${userProfile.goals?.join('، ') || 'نامشخص'}
- ساعت خواب: ${userProfile.sleepTime || 'نامشخص'}
- تمرکز: ${focusLabels[userProfile.focusLevel] || userProfile.focusLevel || 'نامشخص'}
- اسکرین تایم: ${userProfile.screenTime || 'نامشخص'}
گاهی اسمش رو صدا بزن. از اطلاعاتش استفاده کن.`
  }

  if (context) {
    prompt += `\n\n══ پیشرفت فعلی ══`
    if (context.streak !== undefined) {
      prompt += `\n- روزهای متوالی فعال (Streak): ${context.streak} روز`
    }
    if (context.todayTasksCompleted !== undefined && context.todayTasksTotal !== undefined) {
      prompt += `\n- تسک‌های امروز: ${context.todayTasksCompleted} از ${context.todayTasksTotal} انجام شده`
    }
    if (context.activeGoalsCount !== undefined) {
      prompt += `\n- اهداف فعال: ${context.activeGoalsCount} تا`
    }
    if (context.completedGoalsCount !== undefined) {
      prompt += `\n- اهداف تکمیل‌شده: ${context.completedGoalsCount} تا`
    }
    prompt += `\nاز این داده‌ها توی پاسخت استفاده کن. مثلا بگو "دیدم ${context.streak || 0} روزه فعالی" یا "از ${context.todayTasksTotal || 0} تا تسک امروز ${context.todayTasksCompleted || 0} تاشو زدی".`
  }

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

  const messages = [
    { role: 'system', content: systemPrompt },
  ]

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
    max_tokens: 300,
    top_p: 0.85,
    frequency_penalty: 0.3,
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

    // ─── تشخیص بحران ───
    if (containsCrisisKeyword(message)) {
      return res.json({
        reply: getCrisisResponse(userProfile?.name),
      })
    }

    // ─── ساخت سیستم پرامپت ───
    const systemPrompt = buildSystemPrompt(userProfile, context)

    let reply

    // ─── ارسال به AI ───
    if (AI_PROVIDER === 'groq') {
      try {
        reply = await sendToGroq(message, history, systemPrompt)
      } catch (groqError) {
        console.error('خطا در Groq:', groqError.message)
        if (genAI) {
          console.log('Fallback به Gemini...')
          reply = await sendToGemini(message, history, systemPrompt)
        } else {
          throw groqError
        }
      }
    } else {
      try {
        reply = await sendToGemini(message, history, systemPrompt)
      } catch (geminiError) {
        console.error('خطا در Gemini:', geminiError.message)
        if (groqClient) {
          console.log('Fallback به Groq...')
          reply = await sendToGroq(message, history, systemPrompt)
        } else {
          throw geminiError
        }
      }
    }

    // ─── پاکسازی پاسخ ───
    reply = cleanResponse(reply)

    res.json({ reply })

  } catch (error) {
    console.error('خطا در AI:', error.message)

    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({
        error: 'تعداد درخواست‌ها زیاد شده. ۳۰ ثانیه صبر کن.',
      })
    }

    res.status(500).json({
      error: 'مشکلی پیش اومد. دوباره تلاش کن.',
    })
  }
})

// ═══════════════════════════════════════
// شروع سرور
// ═══════════════════════════════════════

app.listen(PORT, () => {
  console.log('')
  console.log('===================================')
  console.log(`  MODO Backend running on port ${PORT}`)
  console.log(`  AI Provider: ${AI_PROVIDER.toUpperCase()}`)
  console.log(`  Groq:   ${process.env.GROQ_API_KEY ? 'Ready' : 'Missing'}`)
  console.log(`  Gemini: ${process.env.GEMINI_API_KEY ? 'Ready' : 'Missing'}`)
  console.log('===================================')
  console.log('')
})