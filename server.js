// server.js
// ─────────────────────────────────────
// سرور بکند MODO
// پشتیبانی از ۲ ارائه‌دهنده AI: Groq و Gemini
// ─────────────────────────────────────

const express = require('express')
const cors = require('cors')
require('dotenv').config()

// ═══════════════════════════════════════
// تنظیمات
// ═══════════════════════════════════════

const app = express()
const PORT = process.env.PORT || 3001
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'  // 'groq' یا 'gemini'

app.use(cors())
app.use(express.json())

// ═══════════════════════════════════════
// پرامپت شخصیت MODO
// ═══════════════════════════════════════

const MODO_PERSONALITY = `
تو MODO هستی، یک کوچ شخصی هوشمند برای مردان جوان ایرانی (۱۸-۲۷ سال).

زبان:
- فقط و فقط به فارسی صحبت کن. هیچ کلمه‌ای به زبان دیگر (انگلیسی، عربی، چینی، کره‌ای و...) استفاده نکن.
- اعداد رو به فارسی بنویس (۱، ۲، ۳ بجای 1, 2, 3).
- اصطلاحات فنی رو هم فارسی بگو.

شخصیت تو:
- صمیمی ولی جدی هستی. لحنت مثل یه رفیق بزرگ‌تره که حواسش بهت هست.
- مستقیم حرف میزنی، حاشیه نمیری.
- حمایتگر هستی ولی لوس نیستی.
- عملگرا هستی - همیشه یه راه‌حل عملی و مشخص میدی.
- فارسی محاوره‌ای و طبیعی صحبت میکنی.
- از ایموجی کم و به‌جا استفاده میکنی (حداکثر ۲ تا در هر پیام).
- جواب‌هات کوتاه و مفید هستن (حداکثر ۱۰۰ کلمه).

وظایف تو:
- کمک به ساختن روتین روزانه
- تعیین و پیگیری اهداف واقع‌بینانه
- بهبود عادت‌ها (خواب، تمرکز، مدیریت زمان)
- ارائه نصیحت‌های عملی
- ایجاد انگیزه از طریق سیستم‌سازی

قوانین:
- هر پاسخ حداقل یک پیشنهاد عملی مشخص داشته باشه
- اگه کاربر حالش بده، اول همدلی کن بعد راه‌حل بده
- هیچوقت قضاوت نکن
- سوال بپرس تا بیشتر بشناسیش
- اگه سوال خارج از حوزه‌ته، مودبانه بگو تخصصت نیست
- هیچوقت ادعا نکن انسان هستی
- هرگز از زبان‌های دیگر استفاده نکن. فقط فارسی.
`

// ═══════════════════════════════════════
// تنظیم AI Providers
// ═══════════════════════════════════════

// ─── Groq (Llama) ───
let groqClient = null
if (process.env.GROQ_API_KEY) {
  const Groq = require('groq-sdk')
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
}

// ─── Gemini ───
let geminiModel = null
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: MODO_PERSONALITY,
  })
}

// ═══════════════════════════════════════
// تابع ارسال به Groq
// ═══════════════════════════════════════

async function sendToGroq(message, history, userProfile) {
  if (!groqClient) throw new Error('Groq API Key تنظیم نشده')

  // ساخت System Prompt
  let systemPrompt = MODO_PERSONALITY
  if (userProfile) {
    systemPrompt += `\n\nاطلاعات کاربر:
- اسم: ${userProfile.name || 'نامشخص'}
- سن: ${userProfile.age || 'نامشخص'}
- وضعیت: ${userProfile.status || 'نامشخص'}
- اهداف: ${userProfile.goals?.join('، ') || 'نامشخص'}
- ساعت خواب: ${userProfile.sleepTime || 'نامشخص'}
- سطح تمرکز: ${userProfile.focusLevel || 'نامشخص'}
- اسکرین تایم: ${userProfile.screenTime || 'نامشخص'}

از این اطلاعات برای شخصی‌سازی پاسخ‌هات استفاده کن.`
  }

  // ساخت تاریخچه پیام‌ها
  const messages = [
    { role: 'system', content: systemPrompt },
  ]

  // اضافه کردن تاریخچه (۲۰ پیام آخر)
  if (history && Array.isArray(history)) {
    const recent = history.slice(-20)
    for (const msg of recent) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })
    }
  }

  // پیام فعلی
  messages.push({ role: 'user', content: message })

  // ارسال به Groq
  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    temperature: 0.7,
    max_tokens: 500,
  })

  return completion.choices[0]?.message?.content || 'متأسفم، نتونستم جواب بدم.'
}

// ═══════════════════════════════════════
// تابع ارسال به Gemini
// ═══════════════════════════════════════

async function sendToGemini(message, history, userProfile) {
  if (!geminiModel) throw new Error('Gemini API Key تنظیم نشده')

  // ساخت تاریخچه
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

  const chat = geminiModel.startChat({ history: geminiHistory })
  const result = await chat.sendMessage(message)
  return result.response.text()
}

// ═══════════════════════════════════════
// API Routes
// ═══════════════════════════════════════

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: AI_PROVIDER,
    groq: groqClient ? '✅' : '❌',
    gemini: geminiModel ? '✅' : '❌',
  })
})

// ─── Chat Endpoint ───
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, userProfile } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'پیام نامعتبر است' })
    }

    let reply

    // ─── انتخاب Provider ───
    if (AI_PROVIDER === 'groq') {
      try {
        reply = await sendToGroq(message, history, userProfile)
      } catch (groqError) {
        console.error('خطا در Groq:', groqError.message)
        // Fallback به Gemini
        if (geminiModel) {
          console.log('Fallback به Gemini...')
          reply = await sendToGemini(message, history, userProfile)
        } else {
          throw groqError
        }
      }
    } else {
      try {
        reply = await sendToGemini(message, history, userProfile)
      } catch (geminiError) {
        console.error('خطا در Gemini:', geminiError.message)
        // Fallback به Groq
        if (groqClient) {
          console.log('Fallback به Groq...')
          reply = await sendToGroq(message, history, userProfile)
        } else {
          throw geminiError
        }
      }
    }

    res.json({ reply })

  } catch (error) {
    console.error('خطا در AI:', error.message)

    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({
        error: 'تعداد درخواست‌ها زیاد شده. ۳۰ ثانیه صبر کن و دوباره تلاش کن.',
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
  console.log('═══════════════════════════════════════')
  console.log(`  🚀 MODO Backend running on port ${PORT}`)
  console.log(`  📡 http://localhost:${PORT}`)
  console.log(`  🤖 AI Provider: ${AI_PROVIDER.toUpperCase()}`)
  console.log(`  🔑 Groq:   ${process.env.GROQ_API_KEY ? '✅ Loaded' : '❌ Missing'}`)
  console.log(`  🔑 Gemini: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing'}`)
  console.log('═══════════════════════════════════════')
  console.log('')
})