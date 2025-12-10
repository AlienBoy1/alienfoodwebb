require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zinger';

let db;
async function connectDb() {
  if (db) return db;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB');
  return db;
}

function ensureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not found in env — generating temporary keys (not persistent)');
    const keys = webpush.generateVAPIDKeys();
    webpush.setVapidDetails('mailto:francisco.sanchez.22s@utzmg.edu.mx', keys.publicKey, keys.privateKey);
    return keys;
  }
  webpush.setVapidDetails('mailto:francisco.sanchez.22s@utzmg.edu.mx', publicKey, privateKey);
  return { publicKey, privateKey };
}

// runtime endpoint to return public key
app.get('/push/vapid', async (req, res) => {
  try {
    const keys = ensureVapid();
    return res.json({ publicKey: keys.publicKey });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Error getting VAPID key' });
  }
});

// subscribe endpoint
app.post('/push/subscribe', async (req, res) => {
  try {
    const { subscription, userId, username } = req.body;
    if (!subscription || !userId) return res.status(400).json({ message: 'subscription and userId required' });
    const database = await connectDb();
    await database.collection('pushSubscriptions').updateOne(
      { userId },
      { $set: { userId, username: username || null, subscription, updatedAt: new Date() } },
      { upsert: true }
    );
    // try sending pending notifications
    const pending = await database.collection('pendingNotifications').find({ userId }).toArray();
    if (pending.length > 0) {
      for (const p of pending) {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(p.payload));
          await database.collection('pendingNotifications').deleteOne({ _id: p._id });
        } catch (e) {
          console.error('Error sending pending notification', e);
        }
      }
    }
    return res.json({ message: 'subscribed', subscription });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'internal error' });
  }
});

// unsubscribe endpoint
app.post('/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint, userId } = req.body;
    if (!endpoint || !userId) return res.status(400).json({ message: 'endpoint and userId required' });
    const database = await connectDb();
    await database.collection('pushSubscriptions').deleteOne({ userId, 'subscription.endpoint': endpoint });
    return res.json({ message: 'unsubscribed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'internal error' });
  }
});

// admin endpoint to send notification
app.post('/admin/send-notification', async (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET || 'change-me';
    const provided = req.headers['x-admin-secret'] || req.body.adminSecret;
    if (provided !== adminSecret) return res.status(401).json({ message: 'not authorized' });
    const { title, message, userId } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'title and message required' });
    const database = await connectDb();
    let subscriptions = [];
    if (userId && userId !== 'all') {
      subscriptions = await database.collection('pushSubscriptions').find({ userId }).toArray();
    } else {
      subscriptions = await database.collection('pushSubscriptions').find({}).toArray();
    }
    const payload = { title, body: message, icon: '/img/favicons/android-chrome-192x192.png', data: { url: '/' } };
    if (!subscriptions || subscriptions.length === 0) {
      if (userId && userId !== 'all') {
        await database.collection('pendingNotifications').insertOne({ userId, payload, createdAt: new Date() });
        return res.json({ message: 'user offline: saved for later', sent: 0 });
      }
      return res.status(404).json({ message: 'no subscriptions' });
    }
    const results = [];
    for (const s of subscriptions) {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify(payload));
        results.push({ userId: s.userId, success: true });
      } catch (e) {
        console.error('send error', e);
        if (e.statusCode === 410 || e.statusCode === 404) {
          await database.collection('pushSubscriptions').deleteOne({ _id: s._id });
        } else {
          await database.collection('pendingNotifications').insertOne({ userId: s.userId, payload, createdAt: new Date() });
        }
        results.push({ userId: s.userId, success: false, error: e.message });
      }
    }
    return res.json({ message: 'done', results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'internal error' });
  }
});

// Simple CRUD for users and dishes
app.get('/admin/users', async (req, res) => {
  try {
    const database = await connectDb();
    const users = await database.collection('users').find({}).toArray();
    res.json(users);
  } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.post('/admin/users', async (req, res) => {
  try { const database = await connectDb(); const doc = req.body; await database.collection('users').insertOne(doc); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.put('/admin/users/:id', async (req, res) => {
  try { const database = await connectDb(); const id = req.params.id; await database.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: req.body }); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.delete('/admin/users/:id', async (req, res) => {
  try { const database = await connectDb(); const id = req.params.id; await database.collection('users').deleteOne({ _id: new ObjectId(id) }); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});

app.get('/admin/dishes', async (req, res) => {
  try { const database = await connectDb(); const items = await database.collection('dishes').find({}).toArray(); res.json(items); } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.post('/admin/dishes', async (req, res) => {
  try { const database = await connectDb(); const doc = req.body; await database.collection('dishes').insertOne(doc); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.put('/admin/dishes/:id', async (req, res) => {
  try { const database = await connectDb(); const id = req.params.id; await database.collection('dishes').updateOne({ _id: new ObjectId(id) }, { $set: req.body }); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});
app.delete('/admin/dishes/:id', async (req, res) => {
  try { const database = await connectDb(); const id = req.params.id; await database.collection('dishes').deleteOne({ _id: new ObjectId(id) }); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: 'error' }); }
});

app.listen(PORT, () => {
  ensureVapid();
  console.log(`Backend listening on http://localhost:${PORT}`);
});
