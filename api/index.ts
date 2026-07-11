export const config = {
  runtime: 'edge', 
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.substring(1); 

  // 1. SPAM FILTER: Reject non-numeric paths
  if (!path || !/^\d+$/.test(path)) {
    return new Response("Not found", { status: 404 });
  }

  const itemNumber = path;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const PHONE_NUMBER = "919837106272";

  // =====================================================================
  // 2. HANDLE BACKGROUND POST REQUEST (Exact Location & Device Data)
  // =====================================================================
  if (req.method === "POST") {
    try {
      const data = await req.json();
      
      if (botToken && chatId) {
        const tgMessage = `🎯 *Precise Location Acquired! (Item: ${itemNumber})*\n\n` +
                          `📍 *GPS Map:* [View Exact Location](http://googleusercontent.com/maps.google.com/?q=${data.lat},${data.lon})\n` +
                          `📏 *Accuracy:* Within ${data.accuracy} meters\n` +
                          `🔋 *Battery:* ${data.battery}\n` +
                          `📶 *Network:* ${data.network}`;
                          
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: "Markdown", disable_web_page_preview: true })
        });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      return new Response("Failed to process data", { status: 400 });
    }
  }

  // =====================================================================
  // 3. HANDLE INITIAL GET REQUEST (Serve Page & IP Geo-Location)
  // =====================================================================
  const userAgent = req.headers.get("user-agent") || "Unknown User-Agent";
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "Unknown IP";
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const rawCity = req.headers.get("x-vercel-ip-city") || "Unknown City";
  const city = decodeURIComponent(rawCity); 
  const region = decodeURIComponent(req.headers.get("x-vercel-ip-country-region") || "Unknown Region");
  
  if (botToken && chatId) {
    const tgMessage = `🚨 *Initial Scan (Item: ${itemNumber})*\n\n` +
                      `🗺️ *IP Region:* ${city}, ${region}\n` +
                      `🕒 *Time:* ${timestamp}\n` +
                      `🌐 *IP:* \`${ip}\`\n` +
                      `📱 *Device:* \`${userAgent}\`\n\n` +
                      `_Waiting to see if user grants exact GPS permission..._`;
                      
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    // AWAIT added here to prevent Vercel from killing the process before sending
    try {
      await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: "Markdown" })
      });
    } catch (error) {
      console.error("Initial Telegram ping failed:", error);
    }
  }

  // Generate Webpage Links
  const prefilledMessage = `Hi! I found your gear (Item ID: ${itemNumber}). Let me know when you see this message so we can figure out how to get it back to you.`;
  const encodedMessage = encodeURIComponent(prefilledMessage);
  
  const whatsappLink = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
  const smsLink = `sms:+918449996888?body=${encodedMessage}`;

  // =====================================================================
  // 4. THE UI (HTML/CSS/JS)
  // =====================================================================
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
        .btn { display: block; width: 100%; padding: 14px 0; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; margin-bottom: 12px; box-sizing: border-box; border: none; cursor: pointer; }
        .btn-loc { background-color: #4f46e5; }
        .btn-loc:hover { background-color: #4338ca; }
        .btn-wa { background-color: #25D366; }
        .btn-wa:hover { background-color: #20BA56; }
        .btn-sms { background-color: #3b82f6; }
        .btn-sms:hover { background-color: #2563eb; }
        .trust-banner { background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #4338ca; text-align: left; }
        .quote-banner { margin-top: 25px; padding-top: 20px; border-top: 1px dashed #e5e7eb; font-style: italic; color: #6b7280; font-size: 0.95rem; line-height: 1.5; }
        .quote-thanks { font-size: 0.8rem; font-style: normal; color: #9ca3af; margin-top: 8px; display: block; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Thank You for Scanning!</h1>
        
        <div class="trust-banner">
          <strong>📍 Help find this gear:</strong> Tapping the button below securely shares the map coordinates so the owner knows exactly where this was found.
        </div>

        <p>You found item code: <strong>${itemNumber}</strong></p>
        
        <button id="locBtn" class="btn btn-loc">📍 Share Exact Location</button>
        <a href="${whatsappLink}" class="btn btn-wa">Notify via WhatsApp</a>
        <a href="${smsLink}" class="btn btn-sms">Notify via SMS</a>

        <div class="quote-banner">
          "The good you put out into the world always has a way of coming back to you."
          <span class="quote-thanks">Thank You For Your Kindness</span>
        </div>
      </div>

      <script>
        // Background data collection (Battery & Network)
        async function captureAndSendAdvancedData(lat, lon, accuracy) {
          let batteryInfo = "Unknown";
          let networkInfo = "Unknown";

          try {
            if (navigator.getBattery) {
              const battery = await navigator.getBattery();
              const level = Math.round(battery.level * 100);
              const isCharging = battery.charging ? "⚡ (Charging)" : "🔋";
              batteryInfo = \`\${level}% \${isCharging}\`;
            }
          } catch (e) {}

          try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection && connection.effectiveType) {
              networkInfo = connection.effectiveType.toUpperCase();
            }
          } catch (e) {}

          // Push to Vercel (using keepalive)
          fetch(window.location.pathname, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon, accuracy, battery: batteryInfo, network: networkInfo }),
            keepalive: true
          });
        }

        // Attach to the physical button click (Bypasses iOS Security)
        document.getElementById('locBtn').addEventListener('click', function() {
          const btn = this;
          btn.innerText = "⏳ Requesting...";

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                captureAndSendAdvancedData(
                  position.coords.latitude, 
                  position.coords.longitude, 
                  Math.round(position.coords.accuracy)
                );
                btn.innerText = "✅ Location Sent!";
                btn.style.backgroundColor = "#10b981"; // Turns Green
                btn.disabled = true;
              },
              (error) => {
                console.log("Location denied or failed.");
                btn.innerText = "❌ Location Denied";
                btn.style.backgroundColor = "#ef4444"; // Turns Red
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          } else {
            btn.innerText = "❌ Not Supported";
            btn.style.backgroundColor = "#6b7280"; // Turns Gray
          }
        });
      </script>
    </body>
    </html>
  `;

  // 5. CACHE-BUSTING HEADERS (Fixes Cloudflare & Safari Caching)
  return new Response(html, {
    headers: { 
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    },
  });
}
