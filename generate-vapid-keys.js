// Script para generar VAPID keys para notificaciones push
const webpush = require("web-push");

console.log("🔑 Generando VAPID keys...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("✅ VAPID Keys generadas:\n");
console.log("Public Key:");
console.log(vapidKeys.publicKey);
console.log("\nPrivate Key:");
console.log(vapidKeys.privateKey);
console.log("\n📝 Agrega estas keys a tu archivo .env.local:");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log("\n💡 También agrega la public key a tu código frontend:");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);

