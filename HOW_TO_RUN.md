# ▶️ SkillSwap — Website kaise chalayein

## 🟢 Har baar chalane ke liye (3 steps)

**1. Command Prompt kholo**
`Windows key` → `cmd` likho → **Enter**

**2. Project folder mein jaao aur run karo**
```bash
E:
cd E:\ALL_PROJECT\skillswap
npm run dev
```

**3. Browser mein kholo:** http://localhost:5174

## ✅ Terminal mein yeh dikhna chahiye

```
✅ In-memory MongoDB started
🌱 Demo data seeded
🚀 SkillSwap API running on http://localhost:5000
➜  Local:   http://localhost:5174/
```
Jab tak yeh lines na aayein, browser mat kholna (pehli baar 1–2 minute lag sakte hain).

## 🔑 Login

| Tarika | Kaise |
|---|---|
| Demo user | Login page → **👤 Demo user** → **Login** (`mohit@demo.com` / `demo123`) |
| Admin | **🛡️ Admin** → **Login** (`admin@skillswap.com` / `admin123`) |
| Google | **Continue with Google** → apna Gmail |
| Naya account | **Join Free** → form bharo |

Other demo users: `priya@demo.com`, `rahul@demo.com`, `sneha@demo.com` … (sabka password `demo123`)

## 💬 Real-time chat test

1. Normal Chrome window → `mohit@demo.com` / `demo123`
2. `Ctrl + Shift + N` (Incognito) → `priya@demo.com` / `demo123`
3. Dono mein **Chat** kholo aur message bhejo ⚡

## ⏹️ Website band karna

Terminal mein `Ctrl + C` → `Y` → **Enter**

## ⚙️ Pehli baar setup (sirf ek baar)

```bash
cd E:\ALL_PROJECT\skillswap
npm run setup
```

`server/.env` file (Google login ke liye):
```
MONGO_URI=
JWT_SECRET=skillswap_change_this_secret_2026
PORT=5000
CLIENT_URL=http://localhost:5174
GOOGLE_CLIENT_ID=<Google Console se copy kiya hua Client ID>
```

## ⚠️ Yaad rakhna

- Terminal **khula rakhna**, band kiya toh website band ho jayegi
- Abhi database **in-memory** hai, isliye har restart pe data fresh demo data se reset hota hai
- Permanent data ke liye `.env` mein `MONGO_URI` (MongoDB Atlas) daalo

## ❗ Common problems

| Problem | Fix |
|---|---|
| `'npm' is not recognized` | Node.js install karo: https://nodejs.org |
| `Port 5000 already in use` | Purana terminal band karo ya PC restart karo |
| Page khali/white | `Ctrl + Shift + R` (hard refresh) |
| Google button grey | `server/.env` check karo aur server restart karo |
| Google "origin_mismatch" | Client ID settings mein `http://localhost:5174` aur `http://localhost` add karo, 5–10 min wait |
| Google "Access blocked" | Google Console → Audience → Test users mein apna Gmail add karo |
| "11 vulnerabilities" warning | Ignore karo. `npm audit fix --force` mat chalana, isse packages toot sakte hain |
