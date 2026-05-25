const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const prisma = require("../utils/prisma");

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const kbPath = path.join(__dirname, "..", "data", "lomwong_cafe_kb.txt");
const knowledgeBase = fs.existsSync(kbPath) ? fs.readFileSync(kbPath, "utf8") : "";

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const cafeStatusText = {
  OPEN: "เปิด",
  CLOSED: "หยุด",
  RENOVATION: "ปิดปรับปรุง"
};

async function getLiveStoreContext() {
  const [storeStatus, menuItems, promotions] = await Promise.all([
    prisma.storeStatus.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.menuItem.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.promotion.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } })
  ]);

  const menuByCategory = menuItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(`${item.name} ${Number(item.price)} บาท`);
    return acc;
  }, {});

  return {
    status: storeStatus?.status || "OPEN",
    availableRooms: Number(storeStatus?.availableRooms || 0),
    roomPrice: storeStatus?.roomPrice === null || storeStatus?.roomPrice === undefined ? null : Number(storeStatus.roomPrice),
    menuItems,
    promotions,
    text: [
      `สถานะคาเฟ่ล่าสุด: ${cafeStatusText[storeStatus?.status || "OPEN"]}`,
      `จำนวนห้องพักว่างล่าสุด: ${Number(storeStatus?.availableRooms || 0)} ห้อง`,
      storeStatus?.roomPrice ? `ราคาห้องพักล่าสุด: ${Number(storeStatus.roomPrice)} บาทต่อคืน` : "ราคาห้องพักล่าสุด: ยังไม่ได้ระบุในระบบ",
      "สิ่งอำนวยความสะดวกสำหรับผู้เข้าพัก: Wi-Fi, ห้องน้ำในตัว, เครื่องทำน้ำอุ่น, สระว่ายน้ำสำหรับผู้เข้าพัก",
      "เมนูปัจจุบัน:",
      ...Object.entries(menuByCategory).map(([category, items]) => `- ${category}: ${items.join(", ")}`),
      promotions.length ? "โปรโมชันปัจจุบัน:" : "",
      ...promotions.map((promo) => `- ${promo.title}: ${promo.description}${promo.price ? ` ราคา ${Number(promo.price)} บาท` : ""}`)
    ].filter(Boolean).join("\n")
  };
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function findMenuMatches(text, menuItems) {
  return menuItems.filter((item) => {
    const name = item.name.toLowerCase();
    const category = item.category.toLowerCase();
    return text.includes(name) || text.includes(category) || name.split(/\s+/).some((part) => part.length > 2 && text.includes(part));
  });
}

function fallbackKbReply(message, liveContext) {
  const text = message.toLowerCase().trim();
  const menuItems = liveContext?.menuItems || [];
  const promotions = liveContext?.promotions || [];

  if (includesAny(text, ["สวัสดี", "hello", "hi", "หวัดดี"])) {
    return "สวัสดีค่ะ โมจิยินดีช่วยค่ะ ถามได้เลยนะคะ ทั้งเวลาเปิดปิด เมนู ราคา ห้องพักรายวัน ที่ตั้ง หรือเบอร์ติดต่อค่ะ";
  }

  if (includesAny(text, ["เปิด", "ปิด", "หยุด", "เวลา", "กี่โมง", "วันนี้เปิดไหม", "ร้านเปิดไหม"])) {
    return `คาเฟ่ตอนนี้สถานะ: ${cafeStatusText[liveContext?.status || "OPEN"]} ค่ะ เวลาเปิดปกติคือ 17:00-00:00 น. ทุกวัน หากจะมาไกล แนะนำโทรเช็กอีกครั้งที่ 062 015 2279 ค่ะ`;
  }

  if (includesAny(text, ["ห้องพัก", "ห้องว่าง", "พักรายวัน", "ที่พัก", "จองห้อง", "ราคา ห้อง", "ราคาห้อง"])) {
    const priceText = liveContext?.roomPrice ? ` ราคา ${Number(liveContext.roomPrice).toLocaleString("th-TH")} บาทต่อคืน` : " ส่วนราคายังไม่ได้ระบุในระบบ";
    return `ล้อมวงมีห้องพักรายวันค่ะ ตอนนี้มีห้องว่าง ${liveContext?.availableRooms || 0} ห้อง${priceText} มีสระว่ายน้ำสำหรับผู้เข้าพักด้วยค่ะ แนะนำโทรยืนยันเวลาเข้าพักและจองห้องที่ 062 015 2279 ค่ะ`;
  }

  if (includesAny(text, ["อยู่", "ที่ไหน", "พิกัด", "แผนที่", "ไปยังไง", "สถานที่"])) {
    return "ร้านอยู่เยื้อง ๆ กับ ปตท. บ.แวงใหญ่ อ.แวงใหญ่ จ.ขอนแก่น 40330 ค่ะ สามารถดูแผนที่ได้ที่หน้า ติดต่อ ของเว็บ หรือติดต่อร้านเพื่อสอบถามทางได้ที่ 062 015 2279 ค่ะ";
  }

  if (includesAny(text, ["โทร", "ติดต่อ", "เบอร์", "facebook", "เฟส", "สั่งล่วงหน้า"])) {
    return "ติดต่อร้านได้ที่ 062 015 2279 ค่ะ สั่งล่วงหน้าหรือสอบถามเพิ่มเติมทาง Facebook ได้ที่เพจล้อมวง คาเฟ่ค่ะ";
  }

  if (includesAny(text, ["โปร", "โปรโมชั่น", "เครื่องดื่ม", "เบียร์", "ช้าง", "ลีโอ", "สิงห์", "ไฮเนเก้น"])) {
    const promoText = promotions.length
      ? promotions.slice(0, 4).map((promo) => `${promo.title}${promo.price ? ` ${Number(promo.price)} บาท` : ""}`).join(", ")
      : "โปรช้าง 3 ขวด 240 บาท, โปรไฮเนเก้น 3 ขวด 300 บาท, โปรสิงห์ 3 ขวด 270 บาท";
    return `โปรโมชัน/เครื่องดื่มที่มี เช่น ${promoText} ค่ะ ถ้าต้องการเช็กรายการล่าสุด โทรสอบถามร้านได้เลยนะคะ`;
  }

  const matches = findMenuMatches(text, menuItems);
  if (matches.length) {
    return `เมนูที่เกี่ยวข้องมี ${matches.slice(0, 6).map((item) => `${item.name} ${Number(item.price)} บาท`).join(", ")} ค่ะ`;
  }

  if (includesAny(text, ["เมนู", "อาหาร", "ราคา", "แนะนำ", "กินอะไร", "มีอะไร"])) {
    const recommended = menuItems.length
      ? menuItems.slice(0, 8).map((item) => `${item.name} ${Number(item.price)} บาท`).join(", ")
      : "แจ่วฮ้อนรวมชุดใหญ่ 259 บาท, ข้าวผัดทะเลรวม 79 บาท, ยำแซลมอนปลาร้า 179 บาท, กุ้งแช่น้ำปลา 139 บาท";
    return `เมนูแนะนำมี ${recommended} ค่ะ ดูเมนูทั้งหมดได้ที่หน้าเมนูบนเว็บ หรือถามชื่อเมนูที่อยากรู้ราคาได้เลยค่ะ`;
  }

  if (includesAny(text, ["wifi", "wi-fi", "ไวไฟ"])) {
    return "มี Wi-Fi สำหรับลูกค้าและผู้เข้าพักค่ะ";
  }

  if (includesAny(text, ["สระ", "ว่ายน้ำ", "สระว่ายน้ำ", "pool", "swimming"])) {
    return "มีสระว่ายน้ำสำหรับผู้เข้าพักค่ะ เหมาะสำหรับพักผ่อนระหว่างเข้าพักกับล้อมวง หากต้องการเช็กเงื่อนไขการใช้งาน แนะนำโทร 062 015 2279 ค่ะ";
  }

  if (includesAny(text, ["จองโต๊ะ", "จอง", "โต๊ะ"])) {
    return "สามารถจองโต๊ะสำหรับวันนี้ผ่านหน้า จองโต๊ะ บนเว็บได้ค่ะ หากเป็นงานกลุ่มหรืออยากสอบถามเพิ่มเติม โทร 062 015 2279 ได้เลยค่ะ";
  }

  return "โมจิยังไม่มีข้อมูลพอจะตอบข้อนี้ให้ชัวร์ค่ะ แนะนำโทรถามร้านโดยตรงที่ 062 015 2279 นะคะ";
}

function fallbackCaptions(topic) {
  return [
    {
      hook: "ชวนมากินแบบเป็นกันเอง",
      caption: `ล้อมวงกันคืนนี้กับ ${topic} บรรยากาศดี อาหารพร้อม เครื่องดื่มเย็น ๆ เหมาะกับมานั่งคุยกับเพื่อนหรือครอบครัว`,
      cta: "แวะมาล้อมวงกันได้เลยวันนี้",
      hashtags: ["#ล้อมวงคาเฟ่", "#ขอนแก่น", "#ร้านนั่งชิล", "#LomWongCafe"]
    },
    {
      hook: "เน้นความน่ากิน",
      caption: `${topic} พร้อมเสิร์ฟแล้วที่ล้อมวง คาเฟ่ รสจัดจ้าน กินเพลิน และเข้ากับบรรยากาศสบาย ๆ ของร้าน`,
      cta: "ชวนเพื่อนมาลองกันนะครับ",
      hashtags: ["#LomWongCafe", "#ร้านอาหารขอนแก่น", "#แจ่วฮ้อน", "#อร่อยบอกต่อ"]
    },
    {
      hook: "โพสต์สั้น กระชับ",
      caption: `มื้อเย็นนี้ให้ล้อมวงดูแล ${topic} อร่อย อบอุ่น เป็นกันเอง`,
      cta: "เจอกันที่ล้อมวงครับ",
      hashtags: ["#คาเฟ่ขอนแก่น", "#ล้อมวง", "#ของอร่อยขอนแก่น"]
    }
  ];
}

function normalizeCaptionOptions(text, topic) {
  const clean = String(text || "").trim();
  if (!clean) return fallbackCaptions(topic);

  const jsonText = clean.match(/\[[\s\S]*\]/)?.[0];
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      const options = parsed
        .map((item) => {
          if (typeof item === "string") return { hook: "Caption", caption: item, cta: "", hashtags: [] };
          return {
            hook: String(item?.hook || item?.angle || "Caption").trim(),
            caption: String(item?.caption || "").trim(),
            cta: String(item?.cta || "").trim(),
            hashtags: Array.isArray(item?.hashtags) ? item.hashtags.map((tag) => String(tag).trim()).filter(Boolean) : []
          };
        })
        .filter((item) => item.caption);
      if (options.length >= 3) return options.slice(0, 3);
    } catch {
      // Fall through to text parsing.
    }
  }

  const optionMatches = Array.from(clean.matchAll(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:Option\s*)?([1-3])[\).:\s-]+([\s\S]*?)(?=(?:\n\s*(?:#{1,6}\s*)?(?:Option\s*)?[1-3][\).:\s-]+)|$)/gi))
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((match) => ({ hook: `Option ${match[1]}`, caption: match[2].replace(/^[-–—\s]+/, "").trim(), cta: "", hashtags: [] }))
    .filter(Boolean);
  if (optionMatches.length >= 3) return optionMatches.slice(0, 3);

  const lineOptions = clean
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-•]|\d+[\).])\s*/, "").trim())
    .filter((line) => line.length > 30)
    .map((line) => ({ hook: "Caption", caption: line, cta: "", hashtags: [] }));
  if (lineOptions.length >= 3) return lineOptions.slice(0, 3);

  return fallbackCaptions(topic);
}

async function chatWithDemi(message, history = []) {
  const liveContext = await getLiveStoreContext().catch((error) => {
    if (process.env.NODE_ENV !== "production") console.error("Live context error:", error);
    return { status: "OPEN", availableRooms: 0, roomPrice: null, menuItems: [], promotions: [], text: "" };
  });

  if (includesAny(message.toLowerCase(), ["สระ", "ว่ายน้ำ", "สระว่ายน้ำ", "pool", "swimming"])) {
    return fallbackKbReply(message, liveContext);
  }

  if (!gemini) return fallbackKbReply(message, liveContext);

  const conversation = history
    .slice(-10)
    .map((item) => `${item.role === "assistant" ? "โมจิ" : "ลูกค้า"}: ${String(item.content || "")}`)
    .join("\n");

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: [
        conversation ? `ประวัติการสนทนา:\n${conversation}` : "",
        `คำถามล่าสุดจากลูกค้า: ${message}`
      ].filter(Boolean).join("\n\n"),
      config: {
        temperature: 0.4,
        maxOutputTokens: 600,
        systemInstruction: `คุณคือ โมจิ ผู้ช่วยของล้อมวง คาเฟ่ ตอบภาษาไทยอย่างสุภาพ เป็นกันเอง และช่วยลูกค้าตัดสินใจได้จริง
กติกาการตอบ:
- ตอบสั้น กระชับ ชัดเจน 1-4 ประโยค เว้นแต่ลูกค้าขอรายละเอียด
- ใช้ข้อมูลร้านเท่านั้น ถ้าไม่แน่ใจให้บอกว่าไม่ทราบและแนะนำให้โทรถามร้าน
- ถ้าลูกค้าถามเมนู ให้บอกชื่อเมนูพร้อมราคา
- ถ้าลูกค้าถามห้องพัก ให้บอกจำนวนห้องว่างล่าสุด และแนะนำให้โทรถามราคา/จอง
- ห้ามแต่งราคา เวลาเปิดปิด หรือบริการที่ไม่มีในข้อมูล

ข้อมูลล่าสุดจากระบบ:
${liveContext.text}

ฐานความรู้ร้าน:
${knowledgeBase}`
      }
    });

    return response.text?.trim() || "ขออภัยค่ะ โมจิตอบไม่ได้ในตอนนี้";
  } catch (error) {
    console.error("Gemini chat error:", error);
    return fallbackKbReply(message, liveContext);
  }
}

async function generateCaptions({ topic, mood, platform, goal, audience, length, hashtagCount }) {
  const safeTopic = topic || "เมนูแนะนำของร้าน";
  const safeMood = mood || "อบอุ่น";
  const safePlatform = platform || "Facebook";
  const safeGoal = goal || "ชวนลูกค้าเข้าร้าน";
  const safeAudience = audience || "ลูกค้าทั่วไป คนในพื้นที่ และกลุ่มเพื่อน";
  const safeLength = length || "กลาง";
  const safeHashtagCount = Number(hashtagCount || 5);

  if (!gemini) return fallbackCaptions(safeTopic);

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: `เขียนแคปชัน 3 ตัวเลือกสำหรับ ${safePlatform}
หัวข้อ: "${safeTopic}"
เป้าหมายโพสต์: "${safeGoal}"
กลุ่มลูกค้า: "${safeAudience}"
โทน: "${safeMood}"
ความยาว: "${safeLength}"
จำนวน hashtag ต่อแคปชัน: ${safeHashtagCount}
บริบทแบรนด์: Lom Wong Café & Restaurant ร้านอาหาร/คาเฟ่/ห้องพักรายวัน บรรยากาศเป็นกันเอง เหมาะกับมานั่งกินกับเพื่อนและครอบครัว

ตอบกลับเป็น JSON array เท่านั้น จำนวน 3 object ตามรูปแบบนี้:
[{"hook":"มุมขายของแคปชัน","caption":"ข้อความโพสต์หลัก","cta":"ประโยคชวนให้ลูกค้าทำต่อ","hashtags":["#tag1","#tag2"]}]
ห้ามมีคำอธิบาย ห้ามมี Markdown`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 700,
        systemInstruction: "คุณเป็นครีเอเตอร์การตลาดร้านอาหารไทย เขียนแคปชันภาษาไทยให้เป็นธรรมชาติ น่ากิน ไม่เว่อร์ ไม่ใช้คำซ้ำเยอะ และเหมาะกับร้าน Lom Wong Café & Restaurant ต้องคืนผลลัพธ์เป็น JSON array จำนวน 3 object เท่านั้น"
      }
    });

    const text = response.text?.trim() || "";
    return normalizeCaptionOptions(text, safeTopic);
  } catch (error) {
    console.error("Gemini caption error:", error);
    return fallbackCaptions(safeTopic);
  }
}

module.exports = { chatWithDemi, generateCaptions, knowledgeBase };
