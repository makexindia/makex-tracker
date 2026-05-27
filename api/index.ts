export const config = {
  runtime: 'edge', 
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.substring(1); 

  if (!path || !/^\d+$/.test(path)) {
    return new Response("Not found", { status: 404 });
  }

  const itemNumber = path;
  const userAgent = req.headers.get("user-agent") || "Unknown User-Agent";
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "Unknown IP";
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  // Fetching Vercel's built-in Geo-IP Headers
  const city = req.headers.get("x-vercel-ip-city") || "Unknown City";
  const region = req.headers.get("x-vercel-ip-country-region") || "Unknown Region";
  const lat = req.headers.get("x-vercel-ip-latitude");
  const lon = req.headers.get("x-vercel-ip-longitude");
  
  let mapLink = "Location unknown";
  if (lat && lon) {
    mapLink = `[View on Google Maps](https://www.google.com/maps?q=${lat},${lon})`;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const PHONE_NUMBER = "918449996888";

  if (botToken && chatId) {
    // Upgraded Telegram Message Payload
    const tgMessage = `🚨 *Asset Scanned! (Item: ${itemNumber})*\n\n` +
                      `📍 *Location:* ${city}, ${region}\n` +
                      `🗺️ *Map:* ${mapLink}\n` +
                      `🕒 *Time:* ${timestamp}\n` +
                      `🌐 *IP:* \`${ip}\`\n` +
                      `📱 *Device:* \`${userAgent}\``;
                      
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
      await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: tgMessage, 
          parse_mode: "Markdown",
          disable_web_page_preview: true // Keeps the alert compact
        })
      });
    } catch (error) {
      console.error("Telegram notification failed:", error);
    }
  }

  const prefilledMessage = `Hi! I found your gear (Item ID: ${itemNumber}). Let me know when you see this message so we can figure out how to get it back to you.`;
  const encodedMessage = encodeURIComponent(prefilledMessage);
  
  const whatsappLink = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
  const smsLink = `sms:+918449996888?body=${encodedMessage}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset Scanner</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f3f4f6; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: white; padding: 30px 20px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-width: 90%; width: 400px; }
        h1 { color: #1f2937; font-size: 1.5rem; margin-bottom: 10px; }
        p { color: #4b5563; line-height: 1.5; margin-bottom: 25px; }
        .btn { display: block; width: 100%; padding: 14px 0; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; margin-bottom: 12px; box-sizing: border-box; }
        .btn-wa { background-color: #25D366; }
        .btn-wa:hover { background-color: #20BA56; }
        .btn-sms { background-color: #3b82f6; }
        .btn-sms:hover { background-color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Thank You for Scanning!</h1>
        <p>You have found item code: <strong>${itemNumber}</strong>.<br>Please use a button below to notify the owner.</p>
        <a href="${whatsappLink}" class="btn btn-wa">Notify via WhatsApp</a>
        <a href="${smsLink}" class="btn btn-sms">Notify via SMS</a>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}