const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const prisma = require("../utils/prisma");

function resolveCredentialPath(rawPath) {
  if (!rawPath) return "";
  if (path.isAbsolute(rawPath)) return rawPath;

  const cwdPath = path.resolve(process.cwd(), rawPath);
  if (fs.existsSync(cwdPath)) return cwdPath;

  return path.resolve(__dirname, "..", "..", rawPath);
}

function getSheetConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const worksheet = process.env.GOOGLE_SHEET_WORKSHEET || "Sheet1";
  const credentialsPath = resolveCredentialPath(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  return {
    enabled: Boolean(sheetId && credentialsPath && fs.existsSync(credentialsPath)),
    sheetId,
    worksheet,
    credentialsPath
  };
}

function getTelegramConfig() {
  return {
    enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  };
}

function getIntegrationStatus() {
  const sheet = getSheetConfig();
  const telegram = getTelegramConfig();

  return {
    googleSheets: {
      enabled: sheet.enabled,
      worksheet: sheet.worksheet,
      missing: sheet.enabled ? [] : [
        !process.env.GOOGLE_SHEET_ID && "GOOGLE_SHEET_ID",
        !process.env.GOOGLE_APPLICATION_CREDENTIALS && "GOOGLE_APPLICATION_CREDENTIALS",
        process.env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(sheet.credentialsPath) && "GOOGLE_APPLICATION_CREDENTIALS file"
      ].filter(Boolean)
    },
    telegram: {
      enabled: telegram.enabled,
      missing: telegram.enabled ? [] : [
        !process.env.TELEGRAM_BOT_TOKEN && "TELEGRAM_BOT_TOKEN",
        !process.env.TELEGRAM_CHAT_ID && "TELEGRAM_CHAT_ID"
      ].filter(Boolean)
    }
  };
}

async function appendSaleToSheet(sale, staff) {
  const config = getSheetConfig();
  if (!config.enabled) return { skipped: true, reason: "Google Sheets env is not configured" };

  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.sheetId,
    range: `${config.worksheet}!A:F`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date(sale.createdAt).toISOString(),
        Number(sale.amount),
        sale.note || "",
        sale.staffId || "",
        staff?.name || "",
        staff?.email || ""
      ]]
    }
  });

  return { skipped: false, worksheet: config.worksheet };
}

async function sendTelegramMessage(text) {
  const config = getTelegramConfig();
  if (!config.enabled) return { skipped: true, reason: "Telegram env is not configured" };

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.description || "Telegram sendMessage failed");

  return { skipped: false, messageId: data.result?.message_id };
}

function dayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  return { start, end };
}

async function sendDemiSalesAlertIfNeeded() {
  const { start, end } = dayRange();
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: start, lte: end } } });
  const todayTotal = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const threshold = Number(process.env.STORE_ALERT_THRESHOLD || 500);

  if (todayTotal >= threshold) {
    return { skipped: true, reason: "ยอดขายวันนี้ถึงเป้าแล้ว", threshold, todayTotal };
  }

  const message = [
    "โมจิ Alert - Lom Wong Cafe",
    `ยอดขายวันนี้: ${todayTotal.toLocaleString("th-TH")} บาท`,
    `เป้าหมาย: ${threshold.toLocaleString("th-TH")} บาท`,
    "สถานะ: ยอดขายวันนี้ต่ำกว่าเป้า"
  ].join("\n");

  const telegram = await sendTelegramMessage(message);
  return { skipped: false, threshold, todayTotal, message, telegram };
}

module.exports = {
  appendSaleToSheet,
  getIntegrationStatus,
  sendDemiSalesAlertIfNeeded,
  sendTelegramMessage
};
