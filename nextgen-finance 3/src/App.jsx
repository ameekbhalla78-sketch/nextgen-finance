
// ╔══════════════════════════════════════════════════════════════════════╗
// ║  NEXTGEN FINANCE v3  —  nextgenfinance.com                          ║
// ║  A STOCK MARKET SIMULATION PLATFORM FOR HIGH SCHOOL STUDENTS        ║
// ║  ⚠️  100% SIMULATED — No real money, no real trades, learn only ⚠️  ║
// ╚══════════════════════════════════════════════════════════════════════╝
//
// FIREBASE SETUP (replace with your config at your domain):
// 1. Go to console.firebase.google.com → New Project → "nextgen-finance"
// 2. Enable Authentication → Email/Password
// 3. Enable Firestore Database (start in test mode)
// 4. Copy your config below
// 5. Deploy: firebase init hosting → firebase deploy
//    Your app will live at: https://nextgenfinance.com (after DNS setup)
//
// DNS SETUP FOR YOUR DOMAIN:
// In your domain registrar (GoDaddy/Namecheap/Cloudflare etc):
//   A record:     @ → 151.101.1.195  (Firebase Hosting IP)
//   CNAME record: www → your-project.web.app
// Then in Firebase Console → Hosting → Add custom domain → nextgenfinance.com
//
// FILE STRUCTURE:
// src/
//   App.jsx          ← This file (main app)
//   firebase.js      ← Firebase config (create separately)
//   index.html       ← Entry point
// public/
//   favicon.ico
// firebase.json      ← Firebase hosting config

import { useState, useEffect, useMemo, useRef } from "react";

// ── AUTH & STORAGE: Uses localStorage for in-browser persistence ──────────────
// All user data is saved locally. To upgrade to Firebase later:
// 1. npm install firebase
// 2. Create firebase.js with your config
// 3. Replace localStorage calls with Firestore reads/writes
// ─────────────────────────────────────────────────────────────────────────────

// ── Claude AI API ─────────────────────────────────────────────────────────────
async function askClaude(prompt, system = "") {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: system || "You are a friendly finance educator for high school students. This is a SIMULATION app — no real money is involved. Use simple, engaging language with zero financial jargon. Always remind users this is for learning only.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("") || "";
  } catch { return "AI unavailable right now. Try again in a moment!"; }
}

// ── SIMULATION DISCLAIMER ─────────────────────────────────────────────────────
const DISCLAIMER = "⚠️ SIMULATION ONLY — All prices, trades, and data are 100% virtual. This is a learning tool, not financial advice. No real money is ever involved.";

// ── STOCK DATA (simulated — prices are illustrative, not real-time) ───────────
const STOCKS = [
  { symbol:"AAPL", name:"Apple Inc.",        price:211.45, change:2.3,  sector:"Technology",    logo:"🍎", marketCap:"3.2T", pe:29, vol:"58.2M", desc:"Makes iPhones, Macs, AirPods, and runs the App Store. One of the most recognizable brands on earth.", founded:1976, employees:"160K+", hq:"Cupertino, CA" },
  { symbol:"TSLA", name:"Tesla Inc.",         price:178.22, change:-1.8, sector:"Automotive",    logo:"⚡", marketCap:"568B", pe:52, vol:"112M",  desc:"Builds electric cars and solar energy products. Also runs Autopilot, one of the most advanced self-driving systems.", founded:2003, employees:"127K+", hq:"Austin, TX" },
  { symbol:"MSFT", name:"Microsoft Corp.",    price:415.30, change:1.1,  sector:"Technology",    logo:"🪟", marketCap:"3.1T", pe:35, vol:"21.4M", desc:"Makes Windows, Xbox, and Azure cloud. Also owns LinkedIn and has a huge stake in OpenAI.", founded:1975, employees:"220K+", hq:"Redmond, WA" },
  { symbol:"GOOGL", name:"Alphabet Inc.",     price:175.80, change:0.7,  sector:"Technology",    logo:"🔍", marketCap:"2.2T", pe:23, vol:"24.1M", desc:"Google's parent company. Owns Google Search, YouTube, Google Maps, Android, and Google Cloud.", founded:1998, employees:"182K+", hq:"Mountain View, CA" },
  { symbol:"AMZN", name:"Amazon.com Inc.",    price:201.50, change:3.2,  sector:"E-Commerce",   logo:"📦", marketCap:"2.1T", pe:41, vol:"35.6M", desc:"World's largest online store, but AWS cloud services actually make most of the profit.", founded:1994, employees:"1.5M+", hq:"Seattle, WA" },
  { symbol:"NVDA", name:"NVIDIA Corp.",       price:875.40, change:4.5,  sector:"Semiconductors",logo:"🖥️",marketCap:"2.1T", pe:68, vol:"42.3M", desc:"Makes the GPUs powering AI, gaming, and data centers. The pick-and-shovel play of the AI revolution.", founded:1993, employees:"29K+",  hq:"Santa Clara, CA" },
  { symbol:"META", name:"Meta Platforms",     price:526.70, change:-0.5, sector:"Social Media",  logo:"🌐", marketCap:"1.3T", pe:26, vol:"18.7M", desc:"Owns Facebook, Instagram, and WhatsApp — apps used by over 3 billion people daily.", founded:2004, employees:"67K+",  hq:"Menlo Park, CA" },
  { symbol:"NFLX", name:"Netflix Inc.",       price:638.90, change:2.1,  sector:"Entertainment", logo:"🎬", marketCap:"275B", pe:44, vol:"4.2M",  desc:"World's #1 streaming service with 260M+ subscribers. Produces original movies and shows globally.", founded:1997, employees:"13K+",  hq:"Los Gatos, CA" },
  { symbol:"DIS",  name:"Walt Disney Co.",    price:103.20, change:-0.9, sector:"Entertainment", logo:"🏰", marketCap:"188B", pe:72, vol:"11.8M", desc:"Theme parks, Disney+, Marvel, Star Wars, Pixar — a massive entertainment empire.", founded:1923, employees:"220K+", hq:"Burbank, CA" },
  { symbol:"SPOT", name:"Spotify Technology", price:315.60, change:1.6,  sector:"Music",         logo:"🎵", marketCap:"63B",  pe:88, vol:"2.1M",  desc:"The world's most popular music and podcast streaming platform with 600M+ monthly listeners.", founded:2006, employees:"9K+",   hq:"Stockholm, Sweden" },
  { symbol:"COIN", name:"Coinbase Global",    price:225.30, change:-3.1, sector:"Crypto/Finance",logo:"🪙", marketCap:"54B",  pe:31, vol:"8.3M",  desc:"The largest US crypto exchange. Revenue swings wildly with crypto market cycles.", founded:2012, employees:"3.4K+", hq:"San Francisco, CA" },
  { symbol:"PYPL", name:"PayPal Holdings",    price:68.40,  change:0.4,  sector:"Fintech",       logo:"💳", marketCap:"75B",  pe:17, vol:"9.6M",  desc:"Digital payments pioneer — Venmo, PayPal, and Braintree all under one roof.", founded:1998, employees:"27K+",  hq:"San Jose, CA" },
  { symbol:"RBLX", name:"Roblox Corp.",       price:41.20,  change:5.2,  sector:"Gaming",        logo:"🎮", marketCap:"26B",  pe:0,  vol:"18.9M", desc:"The massive gaming and metaverse platform where 70M+ daily users create and play user-generated worlds.", founded:2004, employees:"2.5K+", hq:"San Mateo, CA" },
  { symbol:"SNAP", name:"Snap Inc.",          price:14.80,  change:-2.3, sector:"Social Media",  logo:"👻", marketCap:"24B",  pe:0,  vol:"22.4M", desc:"Makes Snapchat and AR glasses. Popular with Gen Z but faces tough competition from Instagram and TikTok.", founded:2011, employees:"5.3K+", hq:"Santa Monica, CA" },
  { symbol:"ABNB", name:"Airbnb Inc.",        price:152.30, change:1.8,  sector:"Travel",        logo:"🏠", marketCap:"97B",  pe:17, vol:"7.2M",  desc:"The world's largest home-sharing marketplace, connecting travelers with unique local stays worldwide.", founded:2008, employees:"6.9K+", hq:"San Francisco, CA" },
  { symbol:"SQ",   name:"Block Inc.",         price:68.90,  change:2.7,  sector:"Fintech",       logo:"⬛", marketCap:"42B",  pe:0,  vol:"6.8M",  desc:"Formerly Square — runs Cash App, Square POS, and Bitcoin trading. Jack Dorsey's post-Twitter project.", founded:2009, employees:"13K+",  hq:"Oakland, CA" },
];

// ── OPPORTUNITIES (real programs, all info accurate as of 2025) ───────────────
const OPPORTUNITIES = [
  { id:1,  title:"Goldman Sachs Summer Analyst",      org:"Goldman Sachs",       type:"Internship",  tags:["Finance","Business"],       paid:true,  deadline:"Jan 15, 2026", location:"New York, NY",     grades:["11","12"], remote:false, desc:"Immersive 10-week program at a top Wall Street firm. Work on real investment banking, sales & trading, or asset management projects alongside senior professionals.", link:"https://goldmansachs.com/careers" },
  { id:2,  title:"DECA Nationals 2026",               org:"DECA Inc.",           type:"Competition", tags:["Business","Marketing"],     paid:false, deadline:"Mar 1, 2026",  location:"Nationwide",       grades:["9","10","11","12"], remote:false, desc:"The world's largest high school business competition. Compete in 60+ categories including finance, marketing, and entrepreneurship. Top performers earn scholarships.", link:"https://deca.org" },
  { id:3,  title:"Girls Who Code Summer Program",     org:"Girls Who Code",      type:"Program",     tags:["Technology"],               paid:false, deadline:"Feb 28, 2026", location:"Remote",           grades:["9","10","11"], remote:true, desc:"Free 6-week virtual program teaching HTML, CSS, Python, and web development. No coding experience needed. Comes with mentorship from women in tech.", link:"https://girlswhocode.com" },
  { id:4,  title:"JP Morgan Freshman Experience",     org:"JP Morgan",           type:"Program",     tags:["Finance","Technology"],     paid:true,  deadline:"Dec 1, 2025",  location:"Multiple Cities",  grades:["9"], remote:false, desc:"Exclusive program for 9th graders to explore careers in banking and technology at JPMorgan offices. One of the most competitive early-access programs in finance.", link:"https://jpmorgan.com/careers" },
  { id:5,  title:"Stock Market Game Competition",     org:"SIFMA Foundation",   type:"Competition", tags:["Finance"],                  paid:false, deadline:"Ongoing",      location:"Online",           grades:["9","10","11","12"], remote:true, desc:"Manage a virtual $100,000 portfolio over 10 weeks competing against schools nationwide. Top performers earn awards and can qualify for state finals.", link:"https://sifma.org" },
  { id:6,  title:"Microsoft TEALS Program",           org:"Microsoft",           type:"Program",     tags:["Technology"],               paid:false, deadline:"Rolling",      location:"Remote",           grades:["11","12"], remote:true, desc:"Partner with Microsoft engineers as a classroom volunteer mentor bringing CS education to underserved communities. Great leadership experience for college apps.", link:"https://microsoft.com/teals" },
  { id:7,  title:"Coca-Cola Scholars Program",        org:"Coca-Cola Foundation",type:"Scholarship", tags:["Business","Finance"],       paid:true,  deadline:"Oct 31, 2025", location:"Nationwide",       grades:["12"], remote:false, desc:"$20,000 scholarship for 150 high-achieving seniors annually. Merit-based with strong focus on leadership, community impact, and academic excellence.", link:"https://coca-colascholarsfoundation.org" },
  { id:8,  title:"YC Startup School",                 org:"Y Combinator",       type:"Program",     tags:["Technology","Business"],    paid:false, deadline:"Rolling",      location:"Online",           grades:["10","11","12"], remote:true, desc:"Free 10-week program from the world's top startup accelerator. Learn to build and pitch companies with direct mentorship from YC partners and alumni.", link:"https://startupschool.org" },
  { id:9,  title:"Wharton Global Youth Program",      org:"UPenn Wharton",      type:"Program",     tags:["Finance","Business"],       paid:true,  deadline:"Apr 1, 2026",  location:"Philadelphia, PA", grades:["10","11"], remote:false, desc:"Live on Wharton's campus and learn finance, entrepreneurship, and leadership from top professors. One of the most prestigious pre-college business programs.", link:"https://globalyouth.wharton.upenn.edu" },
  { id:10, title:"Congressional App Challenge",        org:"US Congress",        type:"Competition", tags:["Technology"],               paid:false, deadline:"Nov 1, 2025",  location:"Nationwide",       grades:["9","10","11","12"], remote:true, desc:"Build an app and compete at the congressional district level. Winners are invited to Washington DC and their apps are displayed in the US Capitol.", link:"https://congressionalappchallenge.us" },
  { id:11, title:"MIT Launch Entrepreneurship",        org:"MIT",                type:"Program",     tags:["Technology","Business"],    paid:true,  deadline:"Feb 1, 2026",  location:"Cambridge, MA",    grades:["11","12"], remote:false, desc:"Launch a real startup at MIT over the summer. Get mentored by MIT professors, alumni entrepreneurs, and VCs. Some past ventures have raised real funding.", link:"https://entrepreneurship.mit.edu/launch" },
  { id:12, title:"Blackrock Future Advisor Program",  org:"BlackRock",          type:"Program",     tags:["Finance"],                  paid:true,  deadline:"Mar 15, 2026", location:"New York, NY",     grades:["11","12"], remote:false, desc:"Shadowing and mentorship program at the world's largest asset management firm ($10T AUM). Exposure to portfolio management, risk, and ESG investing.", link:"https://blackrock.com/careers" },
];

// ── LESSONS (full content + quizzes) ─────────────────────────────────────────
const LESSONS = [
  { id:1,  title:"What is a Stock?",           category:"Basics",    duration:"5 min",  xp:50,  icon:"📈", difficulty:"Beginner",
    content:"A stock represents a tiny piece of ownership in a real company. When you buy one share of Apple, you literally own a small fraction of Apple Inc. Companies sell stocks to raise money to grow their business — build new products, hire people, expand globally. As a stockholder, you profit if the company grows (the stock price goes up) or loses if it struggles. This is the foundation of how the stock market works — and why learning about it now is such a huge advantage.",
    quiz:[
      { q:"What does owning one share of Apple mean?", opts:["You lent Apple money","You own a tiny piece of Apple","You work at Apple","Apple owes you money"], ans:1 },
      { q:"Why do companies sell stocks to the public?", opts:["To pay government taxes","To raise money to grow","To reduce their value","To give away free shares"], ans:1 },
      { q:"Where are stocks bought and sold?", opts:["At a bank","At a grocery store","On a stock exchange","At the post office"], ans:2 },
    ]},
  { id:2,  title:"How Prices Change",          category:"Basics",    duration:"6 min",  xp:60,  icon:"🎢", difficulty:"Beginner",
    content:"Stock prices move based on supply and demand — just like sneakers or concert tickets. If more people want to buy a stock than sell it, the price goes up. If more want to sell, it goes down. But what drives that? Mostly news and expectations. Good earnings, a hit product launch, or positive economic news can send a stock soaring. Bad news, lawsuits, or competition can tank it. Remember — in our simulation, prices move randomly to mimic real market behavior without any actual financial data.",
    quiz:[
      { q:"If more people want to BUY a stock than sell it, what happens to the price?", opts:["It falls","It stays the same","It rises","It resets to zero"], ans:2 },
      { q:"What primarily moves stock prices?", opts:["The weather","Supply and demand driven by news and expectations","Government orders","Company wishes"], ans:1 },
    ]},
  { id:3,  title:"Understanding ETFs",         category:"Investing", duration:"7 min",  xp:75,  icon:"🧺", difficulty:"Beginner",
    content:"An ETF (Exchange-Traded Fund) is like a basket of stocks bundled into one investment. Instead of buying Apple, Google, and Microsoft separately, you could buy one ETF that holds all three — and hundreds more. Famous ETFs like SPY track the S&P 500 (the 500 largest US companies). ETFs are cheaper, more diversified, and less risky than picking individual stocks. Most professional investors and even billionaires keep most of their money in index ETFs rather than trying to pick winners.",
    quiz:[
      { q:"What is an ETF?", opts:["A single company stock","A bundle of multiple investments","A government savings account","A type of cryptocurrency"], ans:1 },
      { q:"What does SPY track?", opts:["Gold prices","Bitcoin","The S&P 500 — 500 largest US companies","Apple's stock only"], ans:2 },
      { q:"Why might someone prefer an ETF over a single stock?", opts:["Higher risk","More expensive","Instant diversification","Better than any individual stock always"], ans:2 },
    ]},
  { id:4,  title:"Diversification 101",        category:"Strategy",  duration:"6 min",  xp:60,  icon:"🌍", difficulty:"Beginner",
    content:"\"Don't put all your eggs in one basket\" — this ancient saying is the #1 rule of investing. Diversification means spreading your money across different stocks, sectors, and even asset types. If you own only Tesla and it crashes 40%, you lose 40% of your portfolio. But if Tesla is 10% of a diverse portfolio, that same crash only costs you 4%. In our simulation, try to hold stocks from at least 3-4 different sectors (tech, entertainment, fintech, etc.) and see how your portfolio becomes more stable.",
    quiz:[
      { q:"What does diversification mean?", opts:["Putting all money in one hot stock","Spreading investments to reduce risk","Only investing in tech stocks","Selling everything when markets drop"], ans:1 },
      { q:"If Tesla (10% of your portfolio) drops 40%, how much does your overall portfolio lose?", opts:["40%","10%","4%","0%"], ans:2 },
    ]},
  { id:5,  title:"Understanding Risk & Reward", category:"Strategy", duration:"8 min",  xp:80,  icon:"⚖️", difficulty:"Intermediate",
    content:"In investing, risk and reward are always linked — you can't have high returns without accepting higher risk. A government savings account earns maybe 5% but is nearly risk-free. A startup could 10x your money or go to zero. Stocks fall somewhere in between. Your 'risk tolerance' is how much loss you can emotionally and financially handle. As a student with no real money on the line in this simulation, you can afford to be aggressive and learn from taking risks — which is exactly the point of simulating before you ever invest real money.",
    quiz:[
      { q:"Higher potential returns in investing typically come with:", opts:["Lower risk","Higher risk","Zero risk","Guaranteed returns"], ans:1 },
      { q:"What is 'risk tolerance'?", opts:["How much money you have","How much loss you can handle","How fast you want to trade","Your credit score"], ans:1 },
    ]},
  { id:6,  title:"The Magic of Compound Growth", category:"Basics", duration:"6 min",  xp:70,  icon:"🔢", difficulty:"Beginner",
    content:"Compound growth is called the 'eighth wonder of the world' by many investors. Here's why: if you invest $1,000 and earn 10%, you have $1,100. Next year, you earn 10% on $1,100 — not $1,000. That extra $10 might seem tiny, but over 30 years, that original $1,000 becomes $17,449. Over 40 years? $45,259. This is why starting early is the single biggest advantage young people have over older investors. Every year you wait is exponentially more expensive.",
    quiz:[
      { q:"Compound growth means:", opts:["Only earning interest on original investment","Earning returns on your returns over time","Fixed annual payments","Interest paid by the government"], ans:1 },
      { q:"$1,000 invested at 10%/year for 30 years becomes approximately:", opts:["$4,000","$10,000","$17,000","$1,300"], ans:2 },
    ]},
  { id:7,  title:"Reading a Stock Chart",      category:"Analysis",  duration:"10 min", xp:100, icon:"📊", difficulty:"Intermediate",
    content:"Stock charts show price over time — but there's a lot more to read. A 'candlestick' chart shows the open, close, high, and low price for each day. Green candles = price went UP that day. Red candles = price went DOWN. The thin lines (wicks) show the highest and lowest prices touched. Volume bars at the bottom show how many shares were traded — high volume usually means the move is more significant. In our simulation, you'll see simplified line charts, but real platforms like Robinhood and Fidelity use candlestick charts.",
    quiz:[
      { q:"On a candlestick chart, a GREEN candle means:", opts:["The stock fell that day","The stock rose that day","No trading happened","The company had good news"], ans:1 },
      { q:"High trading VOLUME on a price move means:", opts:["Less significant move","More significant move","The market is closed","Nothing important"], ans:1 },
    ]},
  { id:8,  title:"Bull vs Bear Markets",       category:"Analysis",  duration:"7 min",  xp:80,  icon:"🐂", difficulty:"Intermediate",
    content:"A 'bull market' is when stock prices rise broadly for an extended period — investors are optimistic and buying. A 'bear market' is the opposite: prices fall 20%+ from recent highs and fear dominates. The S&P 500 has been in a bull market about 78% of the time historically. Bear markets are painful but historically temporary — the market has always recovered and hit new highs eventually. Knowing the difference helps you stay calm when markets drop (they always do) and not panic-sell at the worst time.",
    quiz:[
      { q:"A 'bull market' is characterized by:", opts:["Falling prices and fear","Rising prices and optimism","Stable prices","Only tech stocks rising"], ans:1 },
      { q:"Historically, the stock market after a bear market has:", opts:["Never recovered","Always hit new all-time highs","Stayed flat forever","Gone to zero"], ans:1 },
    ]},
  { id:9,  title:"What is Market Cap?",        category:"Analysis",  duration:"5 min",  xp:55,  icon:"🏗️", difficulty:"Beginner",
    content:"Market capitalization (market cap) is the total value of all a company's shares. Formula: Stock Price × Total Shares. Apple's market cap is ~$3.2 trillion, making it one of the most valuable companies ever. Market cap categories: Mega-cap ($200B+), Large-cap ($10-200B), Mid-cap ($2-10B), Small-cap ($300M-2B), Micro-cap (under $300M). Larger companies are usually safer but slower growing. Smaller companies can be riskier but grow faster. In our simulator, check each stock's market cap in the details panel.",
    quiz:[
      { q:"Market cap = ?", opts:["Revenue × Profit","Stock Price × Total Shares","Total employees × salary","Total assets − debts"], ans:1 },
      { q:"Which is generally considered SAFER (lower risk)?", opts:["Micro-cap company","Small-cap company","Large-cap company (like Apple or Microsoft)","All are equally risky"], ans:2 },
    ]},
  { id:10, title:"P/E Ratio Explained",        category:"Analysis",  duration:"8 min",  xp:90,  icon:"🔬", difficulty:"Advanced",
    content:"The Price-to-Earnings (P/E) ratio tells you how much investors are paying per dollar of profit. Formula: Stock Price ÷ Earnings Per Share. A P/E of 20 means investors pay $20 for every $1 of annual earnings. High P/E (like NVDA at 68) = investors expect HUGE future growth. Low P/E (like PayPal at 17) = expectations are modest or the stock may be undervalued. There's no perfect P/E — context matters enormously. Growth companies command high P/Es; mature companies have lower ones. Compare within the same industry for useful insights.",
    quiz:[
      { q:"P/E Ratio = ?", opts:["Price ÷ Earnings","Price × Earnings","Profit ÷ Expenses","Revenue ÷ Shares"], ans:0 },
      { q:"A very HIGH P/E ratio usually means:", opts:["The company is losing money","Investors expect strong future growth","The stock is cheap","The company pays big dividends"], ans:1 },
    ]},
  { id:11, title:"Short Selling Explained",    category:"Advanced",  duration:"9 min",  xp:110, icon:"📉", difficulty:"Advanced",
    content:"Short selling is betting a stock will FALL. Here's how it works: you 'borrow' shares and sell them immediately. Later, you buy them back at (hopefully) a lower price and return them, pocketing the difference. Example: borrow TSLA at $200, sell it. It falls to $150. You buy back at $150, return shares, profit $50/share. The risk: if the stock RISES, your losses are theoretically unlimited — this is why short selling is very high-risk and best left to professionals. Our simulation doesn't support real short selling (it would require borrowing mechanics), but understanding it helps you understand market dynamics.",
    quiz:[
      { q:"Short selling profits when:", opts:["The stock rises","The stock falls","The stock stays flat","The company goes public"], ans:1 },
      { q:"Why is short selling riskier than regular buying?", opts:["It's cheaper","Losses can be unlimited if the stock rises","It requires a broker","It's slower"], ans:1 },
    ]},
  { id:12, title:"Dividends & Passive Income", category:"Investing", duration:"7 min",  xp:75,  icon:"💰", difficulty:"Intermediate",
    content:"Some companies pay 'dividends' — regular cash payments to shareholders, usually quarterly. If you own 100 shares of a company paying a $2/share annual dividend, you receive $200/year just for holding the stock. Dividend-paying stocks (like banks and utilities) tend to be more stable but grow slower. The 'dividend yield' is the annual dividend ÷ stock price. A 3% yield on a $100 stock means $3/year per share. Reinvesting dividends automatically (DRIP) is one of the most powerful long-term wealth building strategies available.",
    quiz:[
      { q:"A dividend is:", opts:["A type of debt","Regular cash paid to shareholders","A stock price decrease","A trading fee"], ans:1 },
      { q:"If a stock pays $2 annual dividend and costs $50/share, the yield is:", opts:["2%","4%","10%","25%"], ans:1 },
    ]},
];

// ── CHALLENGES ────────────────────────────────────────────────────────────────
const BASE_CHALLENGES = [
  { id:1,  title:"Paper Trader",        desc:"Make your first simulated trade",             xp:100, badge:"🌱", target:1,  metric:"trades",    category:"Trading" },
  { id:2,  title:"Diversifier",         desc:"Hold 4 different stocks simultaneously",      xp:200, badge:"🌍", target:4,  metric:"holdings",  category:"Portfolio" },
  { id:3,  title:"Scholar",             desc:"Complete 3 lessons in the Learn Hub",         xp:150, badge:"📚", target:3,  metric:"lessons",   category:"Learning" },
  { id:4,  title:"Green Portfolio",     desc:"Achieve a +5% simulated portfolio gain",      xp:300, badge:"💹", target:5,  metric:"gain_pct",  category:"Performance" },
  { id:5,  title:"Opportunity Scout",   desc:"Save 3 real-world opportunities",             xp:100, badge:"🎯", target:3,  metric:"saved_opps",category:"Career" },
  { id:6,  title:"Market Watcher",      desc:"Add 5 stocks to your watchlist",              xp:75,  badge:"👁️",  target:5,  metric:"watchlist", category:"Research" },
  { id:7,  title:"Quiz Champion",       desc:"Score 100% on any 3 lesson quizzes",         xp:175, badge:"🏆", target:3,  metric:"perfect_quizzes", category:"Learning" },
  { id:8,  title:"Big Mover",           desc:"Execute a trade worth $1,000+ simulated",    xp:150, badge:"💼", target:1,  metric:"big_trades",category:"Trading" },
  { id:9,  title:"Comeback Kid",        desc:"Recover from a -10% loss back to neutral",   xp:400, badge:"🦅", target:1,  metric:"comebacks", category:"Performance" },
  { id:10, title:"Sector Spread",       desc:"Hold stocks from 5 different sectors",        xp:250, badge:"🗂️", target:5,  metric:"sectors",   category:"Portfolio" },
  { id:11, title:"Note Taker",          desc:"Add trade notes to 5 different trades",       xp:100, badge:"📝", target:5,  metric:"noted_trades",category:"Research" },
  { id:12, title:"AI Explorer",         desc:"Read 8 AI stock explanations",                xp:120, badge:"🤖", target:8,  metric:"ai_reads",  category:"Learning" },
];

// ── MARKET SCENARIOS (for simulator) ─────────────────────────────────────────
const SCENARIOS = [
  { id:"tech_boom",    label:"Tech Boom",       emoji:"🚀", desc:"AI and tech stocks surge. High risk, massive upside.", color:"#3b82f6", returns:[0.22,0.35,0.18,-0.08,0.28], sectors:{ Technology:0.6, Semiconductors:0.2, Other:0.2 } },
  { id:"balanced",     label:"Balanced Growth", emoji:"⚖️", desc:"Diversified across sectors. Steady, moderate growth.", color:"#10b981", returns:[0.09,0.12,0.05,0.11,0.08],  sectors:{ Technology:0.3, Finance:0.25, Consumer:0.25, Other:0.2 } },
  { id:"recession",    label:"Bear Market",     emoji:"🐻", desc:"Economic slowdown. Defensive stocks protect best.", color:"#ef4444", returns:[-0.18,-0.05,0.03,0.08,0.12],  sectors:{ Consumer:0.4, Finance:0.3, Other:0.3 } },
  { id:"dividend",     label:"Dividend Focus",  emoji:"💰", desc:"Income-generating stocks. Slow but reliable growth.", color:"#f59e0b", returns:[0.06,0.07,0.06,0.08,0.07],  sectors:{ Finance:0.4, Consumer:0.35, Other:0.25 } },
  { id:"yolo",         label:"High Risk YOLO",  emoji:"🎰", desc:"All in on volatile names. Could win big or lose big.", color:"#8b5cf6", returns:[0.45,-0.35,0.60,-0.20,0.50], sectors:{ Crypto:0.4, Gaming:0.3, Growth:0.3 } },
];

// ── MOCK LEADERBOARD PEERS ────────────────────────────────────────────────────
const PEERS = [
  { name:"Alex K.",    avatar:"AK", color:"#3b82f6", value:13240, gain:32.4, xp:2840, streak:14, lvl:6, school:"Lincoln High" },
  { name:"Priya M.",   avatar:"PM", color:"#8b5cf6", value:12680, gain:26.8, xp:2260, streak:9,  lvl:5, school:"Westview HS" },
  { name:"Jordan L.",  avatar:"JL", color:"#10b981", value:12150, gain:21.5, xp:1980, streak:6,  lvl:4, school:"Eastside HS" },
  { name:"Sam T.",     avatar:"ST", color:"#f59e0b", value:11820, gain:18.2, xp:1620, streak:4,  lvl:4, school:"Central High" },
  { name:"Maya R.",    avatar:"MR", color:"#06b6d4", value:11340, gain:13.4, xp:1240, streak:2,  lvl:3, school:"North Academy" },
  { name:"Chris B.",   avatar:"CB", color:"#ec4899", value:10980, gain:9.8,  xp:980,  streak:1,  lvl:2, school:"South Tech" },
];

// ── NEWS FEED (simulated — for educational context) ───────────────────────────
const SIM_NEWS = [
  { id:1, headline:"🤖 NVIDIA Reports Record AI Chip Demand", tag:"Semiconductors", impact:"+", symbol:"NVDA", time:"2h ago", sim:true },
  { id:2, headline:"📱 Apple Announces Next-Gen iPhone Features", tag:"Technology", impact:"+", symbol:"AAPL", time:"4h ago", sim:true },
  { id:3, headline:"⚡ Tesla Deliveries Miss Analyst Estimates", tag:"Automotive", impact:"-", symbol:"TSLA", time:"5h ago", sim:true },
  { id:4, headline:"🌐 Meta's AR Glasses See Surge in Pre-Orders", tag:"Social Media", impact:"+", symbol:"META", time:"6h ago", sim:true },
  { id:5, headline:"📦 Amazon Web Services Wins Major Gov Contract", tag:"E-Commerce", impact:"+", symbol:"AMZN", time:"8h ago", sim:true },
  { id:6, headline:"🎮 Roblox Monthly Active Users Hit New Record", tag:"Gaming", impact:"+", symbol:"RBLX", time:"10h ago", sim:true },
  { id:7, headline:"🪙 Coinbase Revenue Down as Crypto Volume Slows", tag:"Crypto", impact:"-", symbol:"COIN", time:"12h ago", sim:true },
];

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt    = (n, d=2) => n?.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}) ?? "0.00";
const fmtUSD = n => "$" + fmt(n);
const fmtPct = n => (n>=0?"+":"") + fmt(n) + "%";
const fmtXP  = n => n?.toLocaleString() ?? "0";
const fmtK   = n => n >= 1000 ? (n/1000).toFixed(1)+"k" : n.toString();
const now    = () => new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
const todayStr = () => new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

function genSpark(base, change, pts=24) {
  const arr = [base];
  for (let i=1;i<pts;i++) {
    const d = (Math.random()-0.49+change*0.01)*base*0.009;
    arr.push(Math.max(0.01, arr[i-1]+d));
  }
  return arr;
}
function genHistory(days=30, start=10000, volatility=0.008) {
  const arr = [start];
  for (let i=1;i<days;i++) {
    const d = (Math.random()-0.47)*arr[i-1]*volatility;
    arr.push(Math.max(5000, arr[i-1]+d));
  }
  return arr;
}
function simulatePrice(base, sym) {
  const seed = sym.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const wave = Math.sin(Date.now()/5000+seed)*0.002 + Math.sin(Date.now()/13000+seed*2)*0.001;
  return parseFloat((base*(1+wave)).toFixed(2));
}
function getLevel(xp) {
  const lvl = Math.floor(xp/500)+1;
  return { lvl, progress:(xp%500)/500, nextXP:Math.ceil((xp+1)/500)*500, currentLvlXP:xp%500 };
}
function calcPortfolio(portfolio, prices) {
  return Object.entries(portfolio).reduce((s,[sym,h])=>s+h.shares*(prices[sym]||STOCKS.find(x=>x.symbol===sym)?.price||0),0);
}
const SECTOR_COLORS = {"Technology":"#3b82f6","Automotive":"#ef4444","Social Media":"#8b5cf6","Entertainment":"#f59e0b","Semiconductors":"#06b6d4","E-Commerce":"#10b981","Music":"#ec4899","Crypto/Finance":"#f59e0b","Fintech":"#6366f1","Gaming":"#84cc16","Travel":"#fb923c","Basics":"#94a3b8"};

// ══════════════════════════════════════════════════════════════════════════════
// ── CSS ───────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg:    #050810;
  --bg2:   #0b0f1e;
  --bg3:   #101628;
  --bg4:   #162035;
  --bg5:   #1c2840;
  --bg6:   #243050;
  --line:  rgba(255,255,255,0.055);
  --line2: rgba(255,255,255,0.11);
  --line3: rgba(255,255,255,0.2);
  --tx:    #e8eeff;
  --tx2:   #7080a0;
  --tx3:   #3a4a68;
  --blue:  #3b82f6; --blue2: #60a5fa; --blue3: rgba(59,130,246,0.1); --blueg: rgba(59,130,246,0.04);
  --grn:   #10b981; --grn2:  #34d399; --grn3:  rgba(16,185,129,0.1);
  --red:   #ef4444; --red2:  #f87171; --red3:  rgba(239,68,68,0.1);
  --gld:   #f59e0b; --gld2:  #fbbf24; --gld3:  rgba(245,158,11,0.1);
  --pur:   #8b5cf6; --pur2:  #a78bfa; --pur3:  rgba(139,92,246,0.1);
  --tl:    #06b6d4; --tl2:   #22d3ee; --tl3:   rgba(6,182,212,0.1);
  --pk:    #ec4899; --pk2:   #f472b6; --pk3:   rgba(236,72,153,0.1);
  --r:     13px; --r2: 9px; --r3: 6px;
  --ff:    'Sora', sans-serif;
  --mono:  'JetBrains Mono', monospace;
}

html { height:100%; }
body { height:100%; font-family:var(--ff); background:var(--bg); color:var(--tx); font-size:13.5px; line-height:1.6; -webkit-font-smoothing:antialiased; margin:0; }
#root { height:100%; display:flex; }
.app { display:flex; width:100%; height:100%; overflow:hidden; }

/* ── Sidebar ── */
.sb { width:222px; min-width:222px; height:100%; background:var(--bg2); border-right:1px solid var(--line); display:flex; flex-direction:column; overflow-y:auto; overflow-x:hidden; }
.sb::-webkit-scrollbar { width:0; }
.sb-top { padding:18px 16px 14px; border-bottom:1px solid var(--line); }
.sb-brand { display:flex; align-items:center; gap:10px; }
.sb-gem { width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg,var(--blue),var(--pur)); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.sb-name { font-size:16px; font-weight:800; letter-spacing:-.3px; }
.sb-tag { font-size:9px; color:var(--tx3); font-weight:500; margin-top:-2px; text-transform:uppercase; letter-spacing:.08em; }
.sim-pill { display:flex; align-items:center; gap:5px; margin-top:10px; padding:4px 8px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:100px; }
.sim-dot { width:5px; height:5px; border-radius:50%; background:var(--gld); }
.sim-text { font-size:9px; font-weight:700; color:var(--gld2); text-transform:uppercase; letter-spacing:.1em; }
.sb-nav { padding:8px 8px; flex:1; }
.sb-sec { margin-bottom:4px; }
.sb-sec-lbl { font-size:8.5px; text-transform:uppercase; letter-spacing:.12em; color:var(--tx3); font-weight:700; padding:6px 8px 4px; }
.ni { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:var(--r3); color:var(--tx2); cursor:pointer; font-size:12.5px; font-weight:500; transition:all .13s; margin-bottom:1px; user-select:none; position:relative; }
.ni:hover { background:var(--bg3); color:var(--tx); }
.ni.on { background:var(--blue3); color:var(--blue2); font-weight:600; }
.ni .ni-ic { font-size:14px; width:20px; text-align:center; flex-shrink:0; }
.ni .ni-badge { margin-left:auto; background:var(--red); color:#fff; font-size:8px; font-weight:800; border-radius:100px; padding:1px 5px; min-width:15px; text-align:center; }
.ni .ni-new { margin-left:auto; font-size:8px; font-weight:700; color:var(--grn2); background:var(--grn3); border-radius:100px; padding:1px 5px; }
.sb-foot { padding:10px 8px 14px; border-top:1px solid var(--line); }
.uc { display:flex; align-items:center; gap:9px; padding:8px; border-radius:var(--r3); cursor:pointer; transition:background .13s; }
.uc:hover { background:var(--bg3); }
.xp-mini { height:3px; background:var(--bg5); border-radius:100px; overflow:hidden; margin-top:3px; }
.xp-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,var(--blue),var(--pur)); transition:width .5s; }

/* ── Main ── */
.main { flex:1; height:100%; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column; min-width:0; }
.main::-webkit-scrollbar { width:4px; }
.main::-webkit-scrollbar-thumb { background:var(--bg5); border-radius:100px; }

/* Ticker */
.ticker { background:var(--bg2); border-bottom:1px solid var(--line); padding:6px 0; flex-shrink:0; overflow:hidden; }
.ticker-in { display:flex; gap:28px; animation:tickScroll 55s linear infinite; white-space:nowrap; }
@keyframes tickScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.tick { display:flex; align-items:center; gap:5px; font-size:11.5px; font-family:var(--mono); }

/* Sim Banner */
.sim-banner { background:linear-gradient(135deg,rgba(245,158,11,.06),rgba(245,158,11,.02)); border-bottom:1px solid rgba(245,158,11,.15); padding:7px 24px; display:flex; align-items:center; gap:8px; flex-shrink:0; }
.sim-banner-text { font-size:11px; color:var(--gld2); font-weight:600; }

/* Page */
.page { padding:22px 28px 40px; max-width:1120px; width:100%; }
.pg-hd { margin-bottom:20px; }
.pg-title { font-size:21px; font-weight:800; letter-spacing:-.3px; margin-bottom:3px; }
.pg-sub { color:var(--tx2); font-size:12.5px; }

/* Cards */
.card { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r); padding:18px; }
.card-sm { padding:14px 16px; }
.card-xs { padding:10px 13px; }
.card-glow:hover { border-color:var(--line2); box-shadow:0 0 24px rgba(59,130,246,.05); }
.sl { font-size:9.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--tx3); font-weight:700; margin-bottom:5px; }
.sv { font-size:22px; font-weight:800; letter-spacing:-.5px; }
.ss { font-size:11px; color:var(--tx2); margin-top:2px; }

/* Grids */
.g2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }

/* Badges */
.bd { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:100px; font-size:10px; font-weight:700; }
.b-blue { background:var(--blue3); color:var(--blue2); }
.b-grn  { background:var(--grn3);  color:var(--grn2); }
.b-red  { background:var(--red3);  color:var(--red2); }
.b-gld  { background:var(--gld3);  color:var(--gld2); }
.b-pur  { background:var(--pur3);  color:var(--pur2); }
.b-tl   { background:var(--tl3);   color:var(--tl2); }
.b-pk   { background:var(--pk3);   color:var(--pk2); }
.b-dim  { background:var(--bg4);   color:var(--tx2); }

/* Buttons */
.btn { padding:7px 15px; border-radius:var(--r3); font-size:12.5px; font-weight:700; cursor:pointer; border:none; font-family:var(--ff); transition:all .13s; display:inline-flex; align-items:center; justify-content:center; gap:5px; letter-spacing:-.1px; }
.btn-blue  { background:var(--blue); color:#fff; }
.btn-blue:hover  { background:#2563eb; transform:translateY(-1px); }
.btn-grn   { background:var(--grn);  color:#fff; }
.btn-grn:hover   { background:#059669; }
.btn-red   { background:var(--red);  color:#fff; }
.btn-red:hover   { background:#dc2626; }
.btn-ghost { background:var(--bg4); color:var(--tx); border:1px solid var(--line2); }
.btn-ghost:hover { background:var(--bg5); }
.btn-outline { background:transparent; color:var(--tx2); border:1px solid var(--line2); }
.btn-outline:hover { color:var(--tx); border-color:var(--line3); }
.btn-sm  { padding:4px 10px; font-size:11.5px; }
.btn-lg  { padding:10px 20px; font-size:14px; }
.btn-xl  { padding:13px 28px; font-size:15px; border-radius:var(--r2); }
.btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; }

/* Input */
.inp { background:var(--bg3); border:1px solid var(--line2); border-radius:var(--r3); color:var(--tx); font-family:var(--ff); font-size:13px; padding:8px 12px; outline:none; transition:border .13s; width:100%; }
.inp:focus { border-color:var(--blue); }
.inp::placeholder { color:var(--tx3); }
select.inp { cursor:pointer; }
textarea.inp { resize:vertical; }

/* Progress bar */
.prog { height:4px; background:var(--bg4); border-radius:100px; overflow:hidden; }
.prog-fill { height:100%; border-radius:100px; transition:width .5s; }

/* Section header */
.sh { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
.sh-t { font-size:13.5px; font-weight:700; letter-spacing:-.2px; }
.sh-l { font-size:11.5px; color:var(--blue2); cursor:pointer; font-weight:600; }
.sh-l:hover { text-decoration:underline; }

/* Tabs */
.tabs { display:flex; border-bottom:1px solid var(--line); margin-bottom:16px; gap:0; }
.tab { padding:7px 16px; font-size:12.5px; color:var(--tx2); cursor:pointer; border-bottom:2px solid transparent; transition:all .13s; margin-bottom:-1px; font-weight:600; }
.tab:hover { color:var(--tx); }
.tab.on { color:var(--blue2); border-bottom-color:var(--blue); }

/* Pills */
.pills { display:flex; gap:5px; flex-wrap:wrap; }
.pill { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid var(--line2); background:var(--bg3); color:var(--tx2); transition:all .12s; }
.pill.on { background:var(--blue3); border-color:var(--blue); color:var(--blue2); }
.pill:hover { color:var(--tx); }

/* Search */
.search { display:flex; align-items:center; gap:8px; background:var(--bg2); border:1px solid var(--line2); border-radius:var(--r3); padding:7px 12px; }
.search input { background:none; border:none; color:var(--tx); font-family:var(--ff); font-size:13px; outline:none; flex:1; }
.search input::placeholder { color:var(--tx3); }

/* Table */
.tbl { width:100%; border-collapse:collapse; }
.tbl th { font-size:9.5px; text-transform:uppercase; letter-spacing:.09em; color:var(--tx3); font-weight:700; padding:8px 12px; text-align:left; border-bottom:1px solid var(--line); }
.tbl td { padding:11px 12px; border-bottom:1px solid var(--line); font-size:12.5px; }
.tbl tr:last-child td { border-bottom:none; }
.tbl tbody tr { cursor:pointer; transition:background .1s; }
.tbl tbody tr:hover td { background:var(--bg3); }

/* Modal */
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:300; padding:16px; backdrop-filter:blur(6px); }
.modal { background:var(--bg2); border:1px solid var(--line2); border-radius:18px; padding:24px; width:100%; max-width:560px; max-height:92vh; overflow-y:auto; position:relative; animation:fadeUp .2s ease; }
.modal::-webkit-scrollbar { width:0; }
.modal-close { position:absolute; top:14px; right:14px; background:var(--bg4); border:none; color:var(--tx2); width:27px; height:27px; border-radius:50%; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all .13s; }
.modal-close:hover { color:var(--tx); background:var(--bg5); }

/* Auth */
.auth-wrap { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; padding:20px; overflow:auto; position:relative; }
.auth-bg { position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,.06) 0%, transparent 70%); pointer-events:none; }
.auth-box { position:relative; z-index:1; width:100%; max-width:440px; }
.auth-card { background:var(--bg2); border:1px solid var(--line2); border-radius:20px; padding:32px; }
.auth-logo { text-align:center; margin-bottom:22px; }
.auth-logo-title { font-size:28px; font-weight:800; letter-spacing:-.5px; margin-bottom:2px; }
.auth-logo-sub { font-size:12px; color:var(--tx2); }
.auth-sim-note { background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.2); border-radius:var(--r3); padding:10px 14px; margin-bottom:18px; }
.auth-sim-note p { font-size:11.5px; color:var(--gld2); line-height:1.6; }
.f-lbl { font-size:10.5px; color:var(--tx2); font-weight:700; margin-bottom:5px; text-transform:uppercase; letter-spacing:.06em; }
.f-grp { margin-bottom:13px; }
.err { background:var(--red3); border:1px solid rgba(239,68,68,.25); border-radius:var(--r3); padding:9px 12px; color:var(--red2); font-size:12.5px; margin-bottom:13px; }
.step-dots { display:flex; gap:5px; justify-content:center; margin-bottom:20px; }
.step-dot { width:28px; height:3px; border-radius:100px; background:var(--bg5); transition:background .3s; }
.step-dot.on { background:var(--blue); }

/* Watchlist item */
.wl { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line); cursor:pointer; transition:background .1s; border-radius:var(--r3); padding:8px 6px; }
.wl:last-child { border-bottom:none; }
.wl:hover { background:var(--bg3); }

/* Stock logo */
.s-logo { display:flex; align-items:center; justify-content:center; background:var(--bg3); border-radius:10px; font-size:20px; flex-shrink:0; }

/* Leaderboard */
.lb-row { display:flex; align-items:center; gap:11px; padding:11px 16px; border-bottom:1px solid var(--line); }
.lb-row:last-child { border-bottom:none; }
.lb-row.me { background:rgba(59,130,246,.04); border-left:2px solid var(--blue); }
.lb-rank { font-size:15px; font-weight:800; width:22px; text-align:center; font-family:var(--mono); }

/* Lesson card */
.lsn { background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); padding:14px; cursor:pointer; transition:all .13s; }
.lsn:hover { border-color:var(--line2); background:var(--bg4); }
.lsn.done { border-color:rgba(16,185,129,.3); }
.quiz-opt { padding:10px 13px; border:1px solid var(--line2); border-radius:var(--r3); cursor:pointer; transition:all .13s; font-size:13px; margin-bottom:6px; }
.quiz-opt:hover { border-color:var(--blue); background:var(--blue3); }
.quiz-opt.correct { border-color:var(--grn); background:var(--grn3); color:var(--grn2); }
.quiz-opt.wrong { border-color:var(--red); background:var(--red3); color:var(--red2); }
.quiz-opt.neutral { opacity:.5; pointer-events:none; }

/* AI box */
.ai-box { background:linear-gradient(135deg,rgba(59,130,246,.06),rgba(139,92,246,.06)); border:1px solid rgba(59,130,246,.15); border-radius:var(--r2); padding:15px; }
.ai-hd { display:flex; align-items:center; gap:6px; margin-bottom:9px; font-size:10px; font-weight:800; color:var(--blue2); text-transform:uppercase; letter-spacing:.1em; }
.ai-box p { font-size:12.5px; line-height:1.78; color:var(--tx2); }

/* Opp card */
.opp { background:var(--bg2); border:1px solid var(--line); border-radius:var(--r2); padding:15px; cursor:pointer; transition:all .13s; }
.opp:hover { border-color:var(--line2); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.2); }

/* Challenge card */
.ch-card { background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); padding:14px; transition:all .13s; }
.ch-card.done { border-color:rgba(16,185,129,.3); background:rgba(16,185,129,.03); }

/* Toasts */
.notif { position:fixed; bottom:18px; right:18px; background:var(--bg2); border:1px solid var(--line2); border-radius:var(--r2); padding:11px 16px; min-width:210px; max-width:300px; z-index:400; animation:fadeUp .22s ease; box-shadow:0 8px 32px rgba(0,0,0,.4); }
.xp-toast { position:fixed; top:18px; right:18px; background:linear-gradient(135deg,var(--gld),var(--gld2)); color:#000; font-weight:800; font-size:13px; padding:8px 18px; border-radius:100px; z-index:500; animation:fadeUp .25s ease, toastFade .3s ease 1.8s forwards; box-shadow:0 4px 20px rgba(245,158,11,.4); }
@keyframes toastFade { to{opacity:0;transform:translateY(-8px)} }
.badge-toast { position:fixed; top:18px; left:50%; transform:translateX(-50%); background:var(--bg2); border:1px solid var(--line2); border-radius:var(--r2); padding:14px 22px; z-index:500; animation:fadeUp .25s ease, toastFade .3s ease 3.2s forwards; text-align:center; min-width:220px; box-shadow:0 8px 40px rgba(0,0,0,.5); }

/* Animations */
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes spinA { to{transform:rotate(360deg)} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

.spin { width:17px; height:17px; border:2px solid var(--line2); border-top-color:var(--blue); border-radius:50%; animation:spinA .65s linear infinite; }
.pulse-dot { width:6px; height:6px; border-radius:50%; background:var(--grn); animation:pulse 2s infinite; }
.shimmer { background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:var(--r3); }

/* Charts  */
.chart-area { position:relative; }

/* Score meter */
.score-ring { display:inline-flex; align-items:center; justify-content:center; position:relative; }

/* News item */
.news-item { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); }
.news-item:last-child { border-bottom:none; }

/* Portfolio goal */
.goal-bar-wrap { background:var(--bg3); border:1px solid var(--line); border-radius:var(--r2); padding:14px; margin-bottom:10px; }

/* Color helpers */
.grn { color:var(--grn2); } .red { color:var(--red2); } .gld { color:var(--gld2); }
.mut { color:var(--tx2); } .blu { color:var(--blue2); } .pur { color:var(--pur2); }
.mono { font-family:var(--mono); }

/* Feed */
.feed-it { display:flex; align-items:flex-start; gap:9px; padding:9px 0; border-bottom:1px solid var(--line); }
.feed-it:last-child { border-bottom:none; }
.feed-dot { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; margin-top:1px; }

/* Scenario card */
.sc-card { border:1px solid var(--line); border-radius:var(--r2); padding:14px; cursor:pointer; transition:all .13s; }
.sc-card:hover { border-color:var(--line2); }
.sc-card.on { border-width:2px; }

/* Trade log */
.trade-log-item { display:flex; align-items:center; gap:10px; padding:9px 14px; border-bottom:1px solid var(--line); font-size:12px; }
.trade-log-item:last-child { border-bottom:none; }

/* Dark mode toggle placeholder */
.theme-toggle { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:var(--r3); cursor:pointer; transition:background .13s; }
.theme-toggle:hover { background:var(--bg3); }

/* Responsive */
@media(max-width:768px) {
  .sb { display:none; }
  .page { padding:14px 14px 60px; }
  .g4 { grid-template-columns:1fr 1fr; }
  .g3 { grid-template-columns:1fr 1fr; }
  .g2 { grid-template-columns:1fr; }
}

/* Scrollbar */
::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--bg5); border-radius:100px; }
`;

// ══════════════════════════════════════════════════════════════════════════════
// ── CHART COMPONENTS ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function Sparkline({ data, color, w=80, h=28 }) {
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`);
  const area=`M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
      <path d={area} fill={color} opacity=".1"/>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LineChart({ history, color="#3b82f6", W=560, H=140 }) {
  const pad={t:12,r:10,b:28,l:54};
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b;
  const min=Math.min(...history)*.996, max=Math.max(...history)*1.004, range=max-min;
  const pts=history.map((v,i)=>`${pad.l+(i/(history.length-1))*iW},${pad.t+((max-v)/range)*iH}`);
  const [lx,ly]=pts[pts.length-1].split(",").map(Number);
  const area=`M ${pts[0].split(",")[0]},${pad.t+iH} L ${pts.join(" L ")} L ${lx},${pad.t+iH} Z`;
  const ySteps=[min,(min+max)/2,max];
  const xLabels=["Start","1W","2W","3W","Now"];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id={`lg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ySteps.map((v,i)=>{
        const y=pad.t+((max-v)/range)*iH;
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="rgba(255,255,255,.035)" strokeWidth="1"/>
          <text x={pad.l-5} y={y+4} textAnchor="end" fill="#3a4a68" fontSize="9" fontFamily="Sora">${Math.round(v/100)/10}k</text>
        </g>;
      })}
      <path d={area} fill={`url(#lg${color.replace("#","")})`}/>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="3.5" fill={color}/>
      <circle cx={lx} cy={ly} r="7" fill={color} opacity=".15"/>
      {xLabels.map((l,i)=>{
        const x=pad.l+(i/(xLabels.length-1))*iW;
        return <text key={l} x={x} y={H-6} textAnchor="middle" fill="#3a4a68" fontSize="9" fontFamily="Sora">{l}</text>;
      })}
    </svg>
  );
}

function MultiLineChart({ lines, W=440, H=130 }) {
  const all=lines.flatMap(l=>l.data);
  const pad={t:10,r:8,b:24,l:46};
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b;
  const min=Math.min(...all)*.98, max=Math.max(...all)*1.02, range=max-min;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {[min,(min+max)/2,max].map((v,i)=>{
        const y=pad.t+((max-v)/range)*iH;
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="rgba(255,255,255,.035)" strokeWidth="1"/>
          <text x={pad.l-4} y={y+4} textAnchor="end" fill="#3a4a68" fontSize="8" fontFamily="Sora">${Math.round(v/100)/10}k</text>
        </g>;
      })}
      {lines.map(line=>{
        const pts=line.data.map((v,i)=>`${pad.l+(i/(line.data.length-1))*iW},${pad.t+((max-v)/range)*iH}`);
        return <polyline key={line.id} points={pts.join(" ")} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
      })}
    </svg>
  );
}

function PieChart({ data, size=100 }) {
  const total=data.reduce((s,d)=>s+d.value,0);
  let angle=-90;
  const slices=data.map(d=>{
    const deg=(d.value/total)*360;
    const s=angle; angle+=deg;
    return {...d,s,e:angle};
  });
  const polar=(deg,r=38)=>({x:50+r*Math.cos(deg*Math.PI/180),y:50+r*Math.sin(deg*Math.PI/180)});
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {slices.map((s,i)=>{
        const st=polar(s.s), en=polar(s.e);
        const large=(s.e-s.s)>180?1:0;
        return <path key={i} d={`M 50 50 L ${st.x} ${st.y} A 38 38 0 ${large} 1 ${en.x} ${en.y} Z`} fill={s.color} opacity=".85"/>;
      })}
      <circle cx="50" cy="50" r="22" fill="var(--bg2)"/>
    </svg>
  );
}

function MiniGauge({ value, max=100, color="#3b82f6", size=60 }) {
  const pct=Math.min(1,value/max);
  const r=24, cx=30, cy=30;
  const circ=2*Math.PI*r;
  const dash=pct*circ*0.75;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg4)" strokeWidth="5" strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round"/>
      <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize="10" fontWeight="800" fontFamily="Sora">{Math.round(pct*100)}%</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SMALL COMPONENTS ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function Notif({ msg, type="success", onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  const colors={success:["var(--grn2)","✓"],error:["var(--red2)","✕"],info:["var(--blue2)","ℹ"]};
  const [color,icon]=colors[type]||colors.success;
  return (
    <div className="notif">
      <div style={{fontSize:11,fontWeight:800,color,marginBottom:2}}>{icon} {type.toUpperCase()}</div>
      <div style={{fontSize:12.5}}>{msg}</div>
    </div>
  );
}

function XPToast({ xp, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,2200);return()=>clearTimeout(t);},[]);
  return <div className="xp-toast">+{xp} XP ⚡</div>;
}

function BadgeToast({ badge, title, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3600);return()=>clearTimeout(t);},[]);
  return (
    <div className="badge-toast">
      <div style={{fontSize:36,marginBottom:6}}>{badge}</div>
      <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>Challenge Complete!</div>
      <div style={{color:"var(--tx2)",fontSize:12}}>{title}</div>
    </div>
  );
}

function Avatar({ name, color, size=34, fontSize=12 }) {
  const initials=name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color||"linear-gradient(135deg,var(--blue),var(--pur))",display:"flex",alignItems:"center",justifyContent:"center",fontSize,fontWeight:700,color:"#fff",flexShrink:0}}>
      {initials}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function AuthScreen({ onLogin }) {
  const [mode,setMode]=useState("login");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",email:"",password:"",grade:"",school:"",interests:[],riskTolerance:"moderate",goals:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleI=(i)=>set("interests",form.interests.includes(i)?form.interests.filter(x=>x!==i):[...form.interests,i]);

  const INTERESTS=["Finance","Technology","Business","Marketing","Entrepreneurship","Economics","Data Science","Law"];
  const GRADES=["9","10","11","12","College Freshman"];
  const RISK_OPTS=[{v:"conservative",l:"🛡️ Conservative",d:"Safety first, slow and steady"},{v:"moderate",l:"⚖️ Balanced",d:"Mix of growth and stability"},{v:"aggressive",l:"🚀 Aggressive",d:"High risk, high reward"}];

  const doAuth=async()=>{
    if(mode==="login"){
      if(!form.email||!form.password){setErr("Fill in all fields.");return;}
      setLoading(true);setErr("");
      await new Promise(r=>setTimeout(r,700));
      const db=JSON.parse(localStorage.getItem("ngf3_db")||"{}");
      if(!db[form.email]){setErr("No account found with that email.");setLoading(false);return;}
      onLogin(db[form.email],form.email);
      setLoading(false);
    } else {
      if(step===1){
        if(!form.name||!form.email||!form.password){setErr("Fill in all fields.");return;}
        if(form.password.length<6){setErr("Password must be 6+ characters.");return;}
        setErr("");setStep(2);return;
      }
      if(step===2){setErr("");setStep(3);return;}
      setLoading(true);setErr("");
      await new Promise(r=>setTimeout(r,800));
      const db=JSON.parse(localStorage.getItem("ngf3_db")||"{}");
      if(db[form.email]){setErr("Email already registered.");setLoading(false);setStep(1);return;}
      const user={
        name:form.name,email:form.email,grade:form.grade,school:form.school,
        interests:form.interests,riskTolerance:form.riskTolerance,goals:form.goals,
        // Simulation account — $10,000 virtual money
        balance:10000, portfolio:{}, watchlist:["AAPL","NVDA","AMZN","RBLX"],
        tradeHistory:[], tradeNotes:{}, aiReads:0,
        xp:0,streak:1,badges:[],completedLessons:[],perfectQuizzes:0,bigTrades:0,notedTrades:0,
        challenges:BASE_CHALLENGES.map(c=>({...c,progress:0,done:false})),
        history:genHistory(30,10000,.005),
        savedOpps:[], applicationTracker:[], goals_portfolio:[],
        activityFeed:[{text:"Welcome to NextGen Finance! Your simulation starts with $10,000 🎉",icon:"🎉",color:"var(--blue3)",ts:Date.now()}],
        notifications:[{id:1,msg:"Welcome! You have $10,000 in virtual money to start your investing simulation.",read:false,ts:Date.now()}],
        lastLogin:Date.now(), comebacks:0, sectors:0,
      };
      db[form.email]=user;
      localStorage.setItem("ngf3_db",JSON.stringify(db));
      onLogin(user,form.email);
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-bg"/>
      <div className="auth-box">
        <div className="auth-logo">
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
            <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,var(--blue),var(--pur))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📊</div>
            <div className="auth-logo-title">NextGen Finance</div>
          </div>
          <div className="auth-logo-sub">The stock market simulation platform for students</div>
        </div>

        <div className="auth-sim-note">
          <p>⚠️ <strong>100% Simulation</strong> — This is a learning tool. All trades use virtual money. No real investing occurs. Perfect for building skills before you ever touch real markets.</p>
        </div>

        <div className="auth-card">
          <div className="tabs">
            <div className={`tab ${mode==="login"?"on":""}`} onClick={()=>{setMode("login");setStep(1);setErr("");}}>Sign In</div>
            <div className={`tab ${mode==="signup"?"on":""}`} onClick={()=>{setMode("signup");setStep(1);setErr("");}}>Create Account</div>
          </div>

          {mode==="signup"&&<div className="step-dots">{[1,2,3].map(s=><div key={s} className={`step-dot ${step>=s?"on":""}`}/>)}</div>}
          {err&&<div className="err">{err}</div>}

          {mode==="login"?(
            <>
              <div className="f-grp"><div className="f-lbl">Email</div><input className="inp" type="email" placeholder="you@school.edu" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
              <div className="f-grp"><div className="f-lbl">Password</div><input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAuth()}/></div>
              <button className="btn btn-blue btn-xl" style={{width:"100%"}} onClick={doAuth} disabled={loading}>
                {loading?<div className="spin"/>:"Sign In →"}
              </button>
            </>
          ):step===1?(
            <>
              <p style={{fontSize:12,color:"var(--tx2)",marginBottom:14}}>Step 1: Create your account</p>
              <div className="f-grp"><div className="f-lbl">Full Name</div><input className="inp" placeholder="Your name" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
              <div className="f-grp"><div className="f-lbl">Email</div><input className="inp" type="email" placeholder="you@school.edu" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
              <div className="f-grp"><div className="f-lbl">Password (6+ characters)</div><input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)}/></div>
              <button className="btn btn-blue btn-xl" style={{width:"100%"}} onClick={doAuth}>Continue →</button>
            </>
          ):step===2?(
            <>
              <p style={{fontSize:12,color:"var(--tx2)",marginBottom:14}}>Step 2: Tell us about yourself so we can personalize your experience</p>
              <div className="g2" style={{marginBottom:13}}>
                <div className="f-grp" style={{marginBottom:0}}><div className="f-lbl">Grade</div>
                  <select className="inp" value={form.grade} onChange={e=>set("grade",e.target.value)}>
                    <option value="">Select grade</option>
                    {GRADES.map(g=><option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div className="f-grp" style={{marginBottom:0}}><div className="f-lbl">School (optional)</div><input className="inp" placeholder="Your school" value={form.school} onChange={e=>set("school",e.target.value)}/></div>
              </div>
              <div className="f-grp">
                <div className="f-lbl">Interests (pick all that apply)</div>
                <div className="pills" style={{marginTop:6}}>
                  {INTERESTS.map(i=><div key={i} className={`pill ${form.interests.includes(i)?"on":""}`} onClick={()=>toggleI(i)}>{i}</div>)}
                </div>
              </div>
              <div className="f-grp">
                <div className="f-lbl">Risk Tolerance for Simulation</div>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:6}}>
                  {RISK_OPTS.map(o=>(
                    <div key={o.v} onClick={()=>set("riskTolerance",o.v)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:"var(--r3)",border:`1px solid ${form.riskTolerance===o.v?"var(--blue)":"var(--line2)"}`,background:form.riskTolerance===o.v?"var(--blue3)":"var(--bg3)",cursor:"pointer",transition:"all .13s"}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:12.5}}>{o.l}</div>
                        <div style={{fontSize:11,color:"var(--tx2)"}}>{o.d}</div>
                      </div>
                      {form.riskTolerance===o.v&&<div style={{color:"var(--blue2)",fontWeight:800}}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-blue btn-xl" style={{width:"100%"}} onClick={doAuth}>Continue →</button>
            </>
          ):(
            <>
              <p style={{fontSize:12,color:"var(--tx2)",marginBottom:14}}>Step 3: Optional — set your goals</p>
              <div className="f-grp"><div className="f-lbl">Career Goals (optional)</div><textarea className="inp" rows={3} placeholder="e.g. I want to learn about investing before college, explore a finance career, understand how the stock market works..." value={form.goals} onChange={e=>set("goals",e.target.value)}/></div>
              <div style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:"var(--r3)",padding:"12px 14px",marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:13,color:"var(--gld2)",marginBottom:3}}>🎮 You start with $10,000 in simulated money</div>
                <div style={{fontSize:11.5,color:"var(--tx2)"}}>Practice investing, learn from mistakes, and build real skills — all risk-free. This is not real money.</div>
              </div>
              <button className="btn btn-blue btn-xl" style={{width:"100%"}} onClick={doAuth} disabled={loading}>
                {loading?<div className="spin"/>:"Launch My Simulation 🚀"}
              </button>
            </>
          )}
          <div style={{textAlign:"center",marginTop:12,fontSize:10.5,color:"var(--tx3)"}}>Free forever · 100% simulation · No real money</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DASHBOARD ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function Dashboard({ user, prices, onNav, onStockClick }) {
  const portVal=calcPortfolio(user.portfolio,prices);
  const total=user.balance+portVal;
  const gain=total-10000, gainPct=(gain/10000)*100;
  const { lvl, progress }=getLevel(user.xp||0);
  const watchStocks=STOCKS.filter(s=>user.watchlist.includes(s.symbol)).slice(0,4);
  const unread=(user.notifications||[]).filter(n=>!n.read).length;
  const feed=(user.activityFeed||[]).slice(-4).reverse();
  const activeChallenges=(user.challenges||[]).filter(c=>!c.done).slice(0,3);

  const recStocks=useMemo(()=>{
    const interests=(user.interests||[]).map(i=>i.toLowerCase());
    const byInterest=STOCKS.filter(s=>interests.some(i=>s.sector.toLowerCase().includes(i)));
    const notOwned=STOCKS.filter(s=>!user.portfolio[s.symbol]);
    return (byInterest.length>0?byInterest:notOwned).filter(s=>!user.portfolio[s.symbol]).slice(0,3);
  },[user.interests,user.portfolio]);

  return (
    <div className="page">
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div className="pg-title">Hey {user.name.split(" ")[0]} 👋</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
            <div className="pulse-dot"/><span style={{fontSize:11.5,color:"var(--tx2)"}}>Simulation Running</span>
            <span style={{color:"var(--tx3)"}}>·</span>
            <span style={{fontSize:11.5}}>🔥 {user.streak||1}d streak</span>
            <span style={{color:"var(--tx3)"}}>·</span>
            <span className="bd b-gld">Lvl {lvl}</span>
            {unread>0&&<span className="bd b-red" onClick={()=>onNav("notifications")} style={{cursor:"pointer"}}>🔔 {unread} new</span>}
          </div>
        </div>
        <div style={{fontSize:11,color:"var(--tx3)",textAlign:"right"}}>{todayStr()}</div>
      </div>

      {/* Sim reminder */}
      <div style={{background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.1)",borderRadius:"var(--r3)",padding:"7px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:12}}>⚠️</span>
        <span style={{fontSize:11,color:"var(--gld2)",fontWeight:600}}>SIMULATION — All values below are virtual. No real money involved.</span>
      </div>

      {/* Stats row */}
      <div className="g4" style={{marginBottom:12}}>
        {[
          {l:"Simulated Portfolio",v:fmtUSD(total),s:fmtPct(gainPct),sc:gain>=0?"var(--grn2)":"var(--red2)"},
          {l:"Virtual Cash",v:fmtUSD(user.balance),s:"Available to invest"},
          {l:"Stock Holdings",v:fmtUSD(portVal),s:`${Object.keys(user.portfolio).length} positions`},
          {l:"XP Level",v:`${fmtXP(user.xp||0)} XP`,s:`Level ${lvl} · ${Math.round(progress*100)}%`},
        ].map(s=>(
          <div key={s.l} className="card card-sm card-glow">
            <div className="sl">{s.l}</div>
            <div className="sv" style={{fontSize:18}}>{s.v}</div>
            <div className="ss" style={{color:s.sc||"var(--tx2)"}}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div className="card card-xs" style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:700}}>Level {lvl} Progress</span>
          <span style={{fontSize:11,color:"var(--tx2)"}}>{fmtXP(user.xp||0)} XP · Next level at {fmtXP(Math.ceil(((user.xp||0)+1)/500)*500)} XP</span>
        </div>
        <div className="prog"><div className="prog-fill" style={{width:`${progress*100}%`,background:"linear-gradient(90deg,var(--blue),var(--pur))"}}/></div>
      </div>

      {/* Chart + Watchlist */}
      <div className="g2" style={{marginBottom:12}}>
        <div className="card">
          <div className="sh">
            <div className="sh-t">Simulated Portfolio Growth</div>
            <span className={`bd ${gain>=0?"b-grn":"b-red"}`}>{fmtPct(gainPct)} all time</span>
          </div>
          <LineChart history={user.history||[10000]} color={gain>=0?"#10b981":"#ef4444"}/>
          <div style={{display:"flex",gap:16,marginTop:10,paddingTop:10,borderTop:"1px solid var(--line)"}}>
            {[{l:"Today",v:fmtPct(gainPct/30)},{l:"This Week",v:fmtPct(gainPct/4)},{l:"All Time",v:fmtPct(gainPct)}].map(s=>(
              <div key={s.l} style={{fontSize:11}}>
                <div style={{color:"var(--tx3)",marginBottom:1}}>{s.l}</div>
                <div style={{fontWeight:700,color:gainPct>=0?"var(--grn2)":"var(--red2)"}}>{s.v}</div>
              </div>
            ))}
            <div style={{marginLeft:"auto",fontSize:11}}>
              <div style={{color:"var(--tx3)",marginBottom:1}}>Best day</div>
              <div style={{fontWeight:700,color:"var(--grn2)"}}>+{fmt(Math.max(...(user.history||[10000]).map((v,i,a)=>i===0?0:((v-a[i-1])/a[i-1])*100)).toFixed(2))}%</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="sh"><div className="sh-t">Watchlist</div><span className="sh-l" onClick={()=>onNav("stocks")}>All markets →</span></div>
          {watchStocks.map(s=>{
            const p=prices[s.symbol]||s.price, up=s.change>=0;
            return (
              <div key={s.symbol} className="wl" onClick={()=>onStockClick(s)}>
                <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                  <div className="s-logo" style={{width:32,height:32,fontSize:16}}>{s.logo}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:12.5}}>{s.symbol}</div>
                    <div style={{fontSize:10.5,color:"var(--tx2)"}}>{s.name.split(" ")[0]}</div>
                  </div>
                </div>
                <Sparkline data={genSpark(s.price,s.change)} color={up?"#10b981":"#ef4444"} w={58} h={24}/>
                <div style={{textAlign:"right",marginLeft:8,minWidth:60}}>
                  <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:12.5}}>${fmt(p)}</div>
                  <div style={{fontSize:10.5,color:up?"var(--grn2)":"var(--red2)",fontWeight:700}}>{fmtPct(s.change)}</div>
                </div>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-sm" style={{width:"100%",marginTop:10}} onClick={()=>onNav("stocks")}>+ Explore All Stocks</button>
        </div>
      </div>

      {/* Challenges + Simulated News */}
      <div className="g2" style={{marginBottom:12}}>
        <div className="card">
          <div className="sh"><div className="sh-t">Active Challenges</div><span className="sh-l" onClick={()=>onNav("challenges")}>View all →</span></div>
          {activeChallenges.length===0?(
            <div style={{textAlign:"center",padding:"20px 0",color:"var(--tx2)",fontSize:13}}>🎉 All challenges complete!</div>
          ):activeChallenges.map(c=>(
            <div key={c.id} style={{display:"flex",gap:10,padding:"9px 11px",background:"var(--bg3)",borderRadius:"var(--r3)",marginBottom:8,border:"1px solid var(--line)"}}>
              <span style={{fontSize:22}}>{c.badge}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:700}}>{c.title}</div>
                <div style={{fontSize:11,color:"var(--tx2)",marginBottom:5}}>{c.desc}</div>
                <div className="prog">
                  <div className="prog-fill" style={{width:`${Math.min(100,(c.progress||0)/c.target*100)}%`,background:"var(--blue)"}}/>
                </div>
              </div>
              <span className="bd b-gld" style={{fontSize:9,alignSelf:"flex-start"}}>{c.xp}XP</span>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={()=>onNav("challenges")}>View All Challenges</button>
        </div>
        <div className="card">
          <div className="sh">
            <div className="sh-t">Simulated News Feed</div>
            <span className="bd b-gld" style={{fontSize:9}}>SIMULATED</span>
          </div>
          {SIM_NEWS.slice(0,4).map(n=>(
            <div key={n.id} className="news-item">
              <div style={{fontSize:11.5,color:n.impact==="+"?"var(--grn2)":"var(--red2)",fontWeight:800,marginTop:1}}>{n.impact}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,lineHeight:1.4}}>{n.headline}</div>
                <div style={{fontSize:10.5,color:"var(--tx3)",marginTop:2}}>{n.symbol} · {n.time} · <span style={{color:"var(--gld2)"}}>⚠️ simulated</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended + Activity */}
      <div className="g2">
        <div className="card">
          <div className="sh"><div className="sh-t">Recommended for You</div><span className="sh-l" onClick={()=>onNav("stocks")}>See all →</span></div>
          {recStocks.length===0?<div style={{color:"var(--tx2)",fontSize:12,textAlign:"center",padding:"16px 0"}}>Complete your profile to get recommendations!</div>
          :recStocks.map(s=>{
            const p=prices[s.symbol]||s.price, up=s.change>=0;
            return (
              <div key={s.symbol} onClick={()=>onStockClick(s)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:"var(--bg3)",borderRadius:"var(--r3)",marginBottom:7,cursor:"pointer",border:"1px solid var(--line)",transition:"all .13s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--line2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--line)"}>
                <div className="s-logo" style={{width:34,height:34,fontSize:18}}>{s.logo}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12.5}}>{s.symbol} — {s.name.split(" ")[0]}</div>
                  <div style={{fontSize:10.5,color:"var(--tx2)"}}>{s.sector}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:12.5}}>${fmt(p)}</div>
                  <div style={{fontSize:10.5,color:up?"var(--grn2)":"var(--red2)",fontWeight:700}}>{fmtPct(s.change)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="sh"><div className="sh-t">Recent Activity</div></div>
          {feed.length===0?<div style={{color:"var(--tx2)",fontSize:12,textAlign:"center",padding:"20px 0"}}>Your activity will appear here.</div>
          :feed.map((a,i)=>(
            <div key={i} className="feed-it">
              <div className="feed-dot" style={{background:a.color||"var(--bg4)"}}>{a.icon}</div>
              <div>
                <div style={{fontSize:12}}>{a.text}</div>
                <div style={{fontSize:10.5,color:"var(--tx3)",marginTop:1}}>{a.ts?new Date(a.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"Just now"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MARKETS PAGE ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function MarketsPage({ stocks, prices, user, onStockClick }) {
  const [search,setSearch]=useState("");
  const [sector,setSector]=useState("All");
  const [sort,setSort]=useState("symbol");
  const sectors=["All",...new Set(stocks.map(s=>s.sector))];
  const sorted=[...stocks].filter(s=>
    (s.name.toLowerCase().includes(search.toLowerCase())||s.symbol.toLowerCase().includes(search.toLowerCase()))&&
    (sector==="All"||s.sector===sector)
  ).sort((a,b)=>sort==="change"?b.change-a.change:sort==="price"?(prices[b.symbol]||b.price)-(prices[a.symbol]||a.price):a.symbol.localeCompare(b.symbol));

  const gainers=stocks.filter(s=>s.change>0).sort((a,b)=>b.change-a.change).slice(0,3);
  const losers=stocks.filter(s=>s.change<0).sort((a,b)=>a.change-b.change).slice(0,3);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Markets</div><div className="pg-sub">Simulated stocks for learning — prices update every few seconds</div></div>

      <div style={{background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.1)",borderRadius:"var(--r3)",padding:"7px 12px",marginBottom:14,fontSize:11,color:"var(--gld2)",fontWeight:600}}>
        ⚠️ All prices below are SIMULATED for educational purposes. They do not reflect real-time market data.
      </div>

      {/* Movers summary */}
      <div className="g2" style={{marginBottom:14}}>
        <div className="card card-sm">
          <div style={{fontSize:11,color:"var(--grn2)",fontWeight:800,marginBottom:8,textTransform:"uppercase",letterSpacing:".08em"}}>📈 Top Gainers (Simulated)</div>
          {gainers.map(s=>(
            <div key={s.symbol} onClick={()=>onStockClick(s)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",cursor:"pointer",borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex",gap:7,alignItems:"center"}}><span>{s.logo}</span><span style={{fontWeight:700,fontSize:12}}>{s.symbol}</span></div>
              <span style={{color:"var(--grn2)",fontWeight:800,fontSize:12,fontFamily:"var(--mono)"}}>{fmtPct(s.change)}</span>
            </div>
          ))}
        </div>
        <div className="card card-sm">
          <div style={{fontSize:11,color:"var(--red2)",fontWeight:800,marginBottom:8,textTransform:"uppercase",letterSpacing:".08em"}}>📉 Top Losers (Simulated)</div>
          {losers.map(s=>(
            <div key={s.symbol} onClick={()=>onStockClick(s)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",cursor:"pointer",borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex",gap:7,alignItems:"center"}}><span>{s.logo}</span><span style={{fontWeight:700,fontSize:12}}>{s.symbol}</span></div>
              <span style={{color:"var(--red2)",fontWeight:800,fontSize:12,fontFamily:"var(--mono)"}}>{fmtPct(s.change)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="search" style={{marginBottom:12}}>
        <span style={{color:"var(--tx3)"}}>🔍</span>
        <input placeholder="Search by name or ticker (e.g. AAPL, Tesla)..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {search&&<span style={{cursor:"pointer",color:"var(--tx3)"}} onClick={()=>setSearch("")}>✕</span>}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div className="pills">{sectors.map(s=><div key={s} className={`pill ${sector===s?"on":""}`} onClick={()=>setSector(s)}>{s}</div>)}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,color:"var(--tx3)"}}>Sort:</span>
          {[["symbol","A-Z"],["change","% Change"],["price","Price"]].map(([v,l])=>(
            <div key={v} className={`pill ${sort===v?"on":""}`} onClick={()=>setSort(v)}>{l}</div>
          ))}
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 68px 80px 80px",padding:"8px 14px",borderBottom:"1px solid var(--line)"}}>
          {["Stock","Price","Change","Chart","Market Cap","Action"].map(h=><div key={h} style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:".09em",color:"var(--tx3)",fontWeight:700}}>{h}</div>)}
        </div>
        {sorted.map(s=>{
          const p=prices[s.symbol]||s.price, up=s.change>=0, owned=user.portfolio[s.symbol];
          return (
            <div key={s.symbol} onClick={()=>onStockClick(s)} style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 68px 80px 80px",padding:"11px 14px",borderBottom:"1px solid var(--line)",cursor:"pointer",alignItems:"center",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div className="s-logo" style={{width:34,height:34,fontSize:18}}>{s.logo}</div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontWeight:800,fontSize:12.5}}>{s.symbol}</span>
                    {owned&&<span className="bd b-blue" style={{fontSize:8}}>{owned.shares}sh</span>}
                    {user.watchlist.includes(s.symbol)&&<span style={{fontSize:10}}>👁️</span>}
                  </div>
                  <div style={{fontSize:10.5,color:"var(--tx2)"}}>{s.name}</div>
                </div>
              </div>
              <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:12.5}}>${fmt(p)}</div>
              <div className={up?"grn":"red"} style={{fontWeight:800,fontSize:12}}>{fmtPct(s.change)}</div>
              <Sparkline data={genSpark(s.price,s.change)} color={up?"#10b981":"#ef4444"} w={60} h={24}/>
              <div style={{fontSize:11.5,color:"var(--tx2)"}}>{s.marketCap}</div>
              <button className="btn btn-blue btn-sm" onClick={e=>{e.stopPropagation();onStockClick(s);}}>Trade</button>
            </div>
          );
        })}
        {sorted.length===0&&<div style={{textAlign:"center",padding:"40px",color:"var(--tx2)"}}>No stocks match your search.</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STOCK MODAL ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function StockModal({ stock, user, prices, onClose, onTrade, onWatchlist }) {
  const [shares,setShares]=useState(1);
  const [mode,setMode]=useState("buy");
  const [tab,setTab]=useState("overview");
  const [note,setNote]=useState(user.tradeNotes?.[stock.symbol]||"");
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const price=prices[stock.symbol]||stock.price;
  const owned=user.portfolio[stock.symbol];
  const cost=shares*price;
  const up=stock.change>=0;
  const onWatchlist_=user.watchlist.includes(stock.symbol);

  const loadAI=async()=>{
    setAiLoading(true);
    const text=await askClaude(`Explain ${stock.name} (${stock.symbol}) for a high school student using our SIMULATION app. Write 3 short paragraphs:
1. What this company actually does (use a fun real-world analogy a teenager would get)
2. Why the simulated price is ${stock.change>=0?"up":"down"} ${Math.abs(stock.change)}% today (keep it educational, note this is simulated)
3. One potential upside and one risk a beginner should know — remind them this is a simulation for learning, not real investing
Max 100 words total. Be conversational and avoid jargon.`);
    setAiText(text);
    setAiLoading(false);
  };

  useEffect(()=>{if(tab==="overview")loadAI();},[tab]);

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Stock header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div className="s-logo" style={{width:46,height:46,borderRadius:13,fontSize:26}}>{stock.logo}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:19,letterSpacing:"-.3px"}}>{stock.symbol}</div>
            <div style={{color:"var(--tx2)",fontSize:12}}>{stock.name} · <span style={{color:SECTOR_COLORS[stock.sector]||"var(--tx2)"}}>{stock.sector}</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:22}}>${fmt(price)}</div>
            <div className={up?"grn":"red"} style={{fontWeight:700,fontSize:12}}>{fmtPct(stock.change)} today</div>
          </div>
        </div>

        {/* Sim label */}
        <div style={{background:"rgba(245,158,11,.06)",borderRadius:"var(--r3)",padding:"5px 10px",marginBottom:12,fontSize:10.5,color:"var(--gld2)",fontWeight:700,textAlign:"center"}}>⚠️ SIMULATED PRICE — For learning only</div>

        {/* Sparkline */}
        <div style={{marginBottom:14}}><Sparkline data={genSpark(stock.price,stock.change,50)} color={up?"#10b981":"#ef4444"} w={510} h={54}/></div>

        {/* Quick stats */}
        <div className="g3" style={{marginBottom:14}}>
          {[{l:"Market Cap",v:stock.marketCap},{l:"P/E Ratio",v:stock.pe||"N/A"},{l:"Daily Volume",v:stock.vol},{l:"HQ",v:stock.hq?.split(",")[1]?.trim()||stock.hq},{l:"Founded",v:stock.founded},{l:"Employees",v:stock.employees}].slice(0,3).map(s=>(
            <div key={s.l} style={{textAlign:"center",padding:"8px",background:"var(--bg3)",borderRadius:"var(--r3)"}}>
              <div style={{fontSize:9,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".09em",marginBottom:2}}>{s.l}</div>
              <div style={{fontWeight:800,fontSize:12.5}}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <div className={`tab ${tab==="overview"?"on":""}`} onClick={()=>setTab("overview")}>AI Overview</div>
          <div className={`tab ${tab==="trade"?"on":""}`} onClick={()=>setTab("trade")}>Trade</div>
          <div className={`tab ${tab==="details"?"on":""}`} onClick={()=>setTab("details")}>Details</div>
          <div className={`tab ${tab==="notes"?"on":""}`} onClick={()=>setTab("notes")}>My Notes</div>
        </div>

        {tab==="overview"&&(
          <div className="ai-box">
            <div className="ai-hd">✦ AI Explainer <span style={{marginLeft:"auto",fontSize:9,color:"var(--tx3)",fontWeight:500,cursor:"pointer",textTransform:"none"}} onClick={loadAI}>Refresh ↺</span></div>
            {aiLoading?<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Generating beginner-friendly explanation...</span></div>
            :<p style={{whiteSpace:"pre-wrap"}}>{aiText}</p>}
          </div>
        )}

        {tab==="trade"&&(
          <div style={{background:"var(--bg3)",borderRadius:"var(--r2)",padding:16}}>
            <div style={{background:"rgba(245,158,11,.06)",borderRadius:"var(--r3)",padding:"7px 12px",marginBottom:14,fontSize:11,color:"var(--gld2)",fontWeight:600}}>
              🎮 SIMULATION TRADE — Virtual money only. No real transactions occur.
            </div>
            <div className="tabs"><div className={`tab ${mode==="buy"?"on":""}`} onClick={()=>setMode("buy")}>Buy</div><div className={`tab ${mode==="sell"?"on":""}`} onClick={()=>setMode("sell")}>Sell {owned?`(${owned.shares} owned)`:""}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Shares</div>
                <input className="inp" type="number" min="1" value={shares} onChange={e=>setShares(Math.max(1,parseInt(e.target.value)||1))}/>
              </div>
              <div style={{textAlign:"center",padding:"0 8px"}}>
                <div style={{fontSize:10,color:"var(--tx3)",marginBottom:3}}>Virtual Cost</div>
                <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:18}}>{fmtUSD(cost)}</div>
              </div>
            </div>
            <div style={{fontSize:11.5,color:"var(--tx2)",marginBottom:12}}>
              Virtual cash: <strong style={{color:"var(--tx)"}}>{fmtUSD(user.balance)}</strong>
              {owned&&<> · Holding: <strong style={{color:"var(--tx)"}}>{owned.shares} shares (avg ${fmt(owned.avgCost)})</strong></>}
            </div>
            <div style={{display:"flex",gap:10}}>
              {mode==="buy"?(
                <button className="btn btn-grn btn-lg" style={{flex:1}} disabled={user.balance<cost||shares<1} onClick={()=>onTrade("buy",stock,shares,price)}>
                  {user.balance>=cost?`🟢 Simulate Buy ${shares}sh · ${fmtUSD(cost)}`:"Insufficient virtual cash"}
                </button>
              ):(
                <button className="btn btn-red btn-lg" style={{flex:1}} disabled={!owned||owned.shares<shares} onClick={()=>onTrade("sell",stock,shares,price)}>
                  {owned&&owned.shares>=shares?`🔴 Simulate Sell ${shares}sh · ${fmtUSD(cost)}`:"Not enough shares"}
                </button>
              )}
              <button className={`btn btn-ghost`} onClick={()=>onWatchlist(stock.symbol)} title={onWatchlist_?"Remove from watchlist":"Add to watchlist"}>
                {onWatchlist_?"👁️":"➕"}
              </button>
            </div>
          </div>
        )}

        {tab==="details"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{l:"Full Name",v:stock.name},{l:"Sector",v:stock.sector},{l:"Founded",v:stock.founded},{l:"Headquarters",v:stock.hq},{l:"Employees",v:stock.employees},{l:"Market Cap",v:stock.marketCap},{l:"P/E Ratio",v:stock.pe||"N/A"},{l:"Daily Volume",v:stock.vol}].map(f=>(
              <div key={f.l} style={{padding:"10px 12px",background:"var(--bg3)",borderRadius:"var(--r3)"}}>
                <div style={{fontSize:9.5,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>{f.l}</div>
                <div style={{fontWeight:700,fontSize:12.5}}>{f.v}</div>
              </div>
            ))}
            <div style={{gridColumn:"1/-1",padding:"12px",background:"var(--bg3)",borderRadius:"var(--r3)"}}>
              <div style={{fontSize:9.5,color:"var(--tx3)",textTransform:"uppercase",marginBottom:5}}>About</div>
              <div style={{fontSize:12,lineHeight:1.7,color:"var(--tx2)"}}>{stock.desc}</div>
            </div>
          </div>
        )}

        {tab==="notes"&&(
          <div>
            <div style={{fontSize:12,color:"var(--tx2)",marginBottom:10}}>Add personal research notes for {stock.symbol}. This helps you remember why you made each simulated trade.</div>
            <textarea className="inp" rows={5} placeholder={`Why do you find ${stock.symbol} interesting? What's your simulated thesis? What risks do you see?`} value={note} onChange={e=>setNote(e.target.value)} style={{marginBottom:10}}/>
            <button className="btn btn-blue" onClick={()=>onTrade("note",stock,0,0,note)}>💾 Save Note</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PORTFOLIO PAGE ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function PortfolioPage({ user, prices, onStockClick }) {
  const [tab,setTab]=useState("holdings");
  const holdings=Object.entries(user.portfolio).map(([sym,h])=>{
    const stock=STOCKS.find(s=>s.symbol===sym);
    const cp=prices[sym]||stock?.price||0;
    const cv=h.shares*cp, inv=h.shares*h.avgCost, gain=cv-inv;
    return {...h,sym,stock,cp,cv,inv,gain,gainPct:inv>0?(gain/inv)*100:0};
  });
  const portVal=holdings.reduce((s,h)=>s+h.cv,0);
  const totalInv=holdings.reduce((s,h)=>s+h.inv,0);
  const totalGain=portVal-totalInv;

  const sectorMap=holdings.reduce((acc,h)=>{
    const sec=h.stock?.sector||"Other";
    acc[sec]=(acc[sec]||0)+h.cv;
    return acc;
  },{});
  const pieData=Object.entries(sectorMap).map(([name,value],i)=>({name,value,color:SECTOR_COLORS[name]||"#94a3b8"}));

  const goals=user.goals_portfolio||[];
  const tradeLog=user.tradeHistory||[];

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">My Simulated Portfolio</div><div className="pg-sub">⚠️ All values are virtual — no real money</div></div>
      <div className="g4" style={{marginBottom:14}}>
        {[
          {l:"Total Invested",v:fmtUSD(totalInv)},
          {l:"Current Value",v:fmtUSD(portVal)},
          {l:"Simulated P&L",v:(totalGain>=0?"+":"")+fmtUSD(totalGain),c:totalGain>=0?"var(--grn2)":"var(--red2)"},
          {l:"Virtual Cash Left",v:fmtUSD(user.balance)},
        ].map(s=>(
          <div key={s.l} className="card card-sm">
            <div className="sl">{s.l}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:800,color:s.c||"var(--tx)"}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <div className={`tab ${tab==="holdings"?"on":""}`} onClick={()=>setTab("holdings")}>Holdings</div>
        <div className={`tab ${tab==="analytics"?"on":""}`} onClick={()=>setTab("analytics")}>Analytics</div>
        <div className={`tab ${tab==="goals"?"on":""}`} onClick={()=>setTab("goals")}>Goals</div>
        <div className={`tab ${tab==="log"?"on":""}`} onClick={()=>setTab("log")}>Trade Log</div>
      </div>

      {tab==="holdings"&&(
        holdings.length===0?(
          <div className="card" style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:48,marginBottom:14}}>📊</div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:8}}>No simulated holdings yet</div>
            <div style={{color:"var(--tx2)",marginBottom:16}}>Head to Markets and make your first simulated trade!</div>
          </div>
        ):(
          <div className="card" style={{padding:0}}>
            <table className="tbl">
              <thead><tr>{["Stock","Shares","Avg Cost","Price","Value","P&L","Return",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>{holdings.map(h=>(
                <tr key={h.sym} onClick={()=>h.stock&&onStockClick(h.stock)}>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{h.stock?.logo}</span><div><div style={{fontWeight:800}}>{h.sym}</div><div style={{fontSize:10.5,color:"var(--tx2)"}}>{h.stock?.name}</div></div></div></td>
                  <td style={{fontWeight:700,fontFamily:"var(--mono)"}}>{h.shares}</td>
                  <td style={{fontFamily:"var(--mono)"}}>{fmtUSD(h.avgCost)}</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:700}}>${fmt(h.cp)}</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:800}}>{fmtUSD(h.cv)}</td>
                  <td className={h.gain>=0?"grn":"red"} style={{fontWeight:700,fontFamily:"var(--mono)"}}>{(h.gain>=0?"+":"")+fmtUSD(h.gain)}</td>
                  <td><span className={`bd ${h.gainPct>=0?"b-grn":"b-red"}`}>{fmtPct(h.gainPct)}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();h.stock&&onStockClick(h.stock);}}>Trade</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      )}

      {tab==="analytics"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="g2">
            <div className="card">
              <div className="sh"><div className="sh-t">Sector Diversification</div></div>
              {pieData.length===0?<div style={{color:"var(--tx2)",textAlign:"center",padding:"30px 0"}}>No holdings yet</div>:(
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  <PieChart data={pieData} size={100}/>
                  <div style={{flex:1}}>
                    {pieData.map(d=>(
                      <div key={d.name} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
                        <span style={{fontSize:12,flex:1}}>{d.name}</span>
                        <span style={{fontSize:11,color:"var(--tx2)",fontFamily:"var(--mono)"}}>{Math.round((d.value/portVal)*100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="sh"><div className="sh-t">Simulated Growth History</div></div>
              <LineChart history={user.history||[10000]} color={totalGain>=0?"#10b981":"#ef4444"}/>
            </div>
          </div>
          <div className="card card-sm">
            <div className="sh-t" style={{marginBottom:12}}>Performance Metrics</div>
            <div className="g4">
              {[
                {l:"Simulated Return",v:fmtPct((portVal+user.balance-10000)/10000*100)},
                {l:"Positions",v:holdings.length},
                {l:"Sectors Held",v:Object.keys(sectorMap).length},
                {l:"Trades Made",v:(user.tradeHistory||[]).length},
              ].map(m=>(
                <div key={m.l} style={{textAlign:"center",padding:"10px",background:"var(--bg3)",borderRadius:"var(--r3)"}}>
                  <div style={{fontSize:10,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{m.l}</div>
                  <div style={{fontWeight:800,fontSize:16,fontFamily:"var(--mono)"}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="goals"&&(
        <div>
          <div style={{marginBottom:14,padding:"12px 14px",background:"var(--bg3)",borderRadius:"var(--r2)",fontSize:12,color:"var(--tx2)"}}>
            Set virtual portfolio goals to stay motivated. E.g. "Reach $12,000" or "Achieve +20% gain"
          </div>
          {goals.length===0?(
            <div className="card" style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:10}}>🎯</div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>No goals set yet</div>
              <div style={{color:"var(--tx2)",fontSize:12}}>Use the goals feature in Settings → Profile to set portfolio milestones!</div>
            </div>
          ):goals.map((g,i)=>{
            const current=user.balance+portVal;
            const pct=Math.min(100,(current/g.target)*100);
            return (
              <div key={i} className="goal-bar-wrap">
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:13}}>{g.label}</div>
                  <div style={{fontSize:12,color:"var(--tx2)"}}>{fmtUSD(current)} / {fmtUSD(g.target)}</div>
                </div>
                <div className="prog"><div className="prog-fill" style={{width:`${pct}%`,background:"linear-gradient(90deg,var(--blue),var(--grn))"}}/></div>
                <div style={{fontSize:11,color:"var(--tx2)",marginTop:6}}>{Math.round(pct)}% complete</div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="log"&&(
        <div className="card" style={{padding:0}}>
          {tradeLog.length===0?(
            <div style={{textAlign:"center",padding:"40px",color:"var(--tx2)"}}>No trades yet. Start simulating!</div>
          ):tradeLog.slice().reverse().slice(0,30).map((t,i)=>(
            <div key={i} className="trade-log-item" style={{borderBottom:i<Math.min(tradeLog.length,30)-1?"1px solid var(--line)":"none"}}>
              <div className={`bd ${t.action==="buy"?"b-grn":"b-red"}`} style={{fontSize:9}}>{t.action.toUpperCase()}</div>
              <span style={{fontWeight:700}}>{t.symbol}</span>
              <span style={{color:"var(--tx2)"}}>{t.shares} shares</span>
              <span style={{fontFamily:"var(--mono)",fontWeight:700}}>@ ${fmt(t.price)}</span>
              <span style={{fontFamily:"var(--mono)",color:"var(--tx2)"}}>= {fmtUSD(t.shares*t.price)}</span>
              <span style={{marginLeft:"auto",fontSize:10.5,color:"var(--tx3)"}}>{new Date(t.ts).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── LEARN HUB ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function LearnPage({ user, onComplete }) {
  const [selected,setSelected]=useState(null);
  const [quizIdx,setQuizIdx]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [done,setDone]=useState(false);
  const [tab,setTab]=useState("all");
  const completed=user.completedLessons||[];
  const categories=[...new Set(LESSONS.map(l=>l.category))];
  const DIFF_COLOR={Beginner:"b-grn",Intermediate:"b-gld",Advanced:"b-red"};

  const answer=(idx)=>{
    const q=selected.quiz[quizIdx];
    const correct=idx===q.ans;
    setAnswers(a=>[...a,{correct,idx}]);
    setTimeout(()=>{
      if(quizIdx+1<selected.quiz.length){setQuizIdx(i=>i+1);}
      else{setDone(true);onComplete(selected,answers.every(a=>a.correct)&&correct);}
    },900);
  };

  if(selected&&!done){
    const q=selected.quiz[quizIdx];
    const lastAns=answers[quizIdx];
    return (
      <div className="page">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(null)}>← Back</button>
          <div style={{flex:1,padding:"0 20px"}}>
            <div className="prog"><div className="prog-fill" style={{width:`${(quizIdx/selected.quiz.length)*100}%`,background:"var(--blue)"}}/></div>
          </div>
          <span style={{fontSize:12,color:"var(--tx2)"}}>{quizIdx+1}/{selected.quiz.length}</span>
        </div>
        <div style={{fontSize:20,marginBottom:10}}>{selected.icon}</div>
        <div style={{fontWeight:800,fontSize:19,letterSpacing:"-.3px",marginBottom:3}}>{selected.title}</div>
        <div className="card" style={{marginBottom:16,marginTop:14}}>
          <div style={{fontSize:12,color:"var(--tx2)",marginBottom:16,lineHeight:1.8}}>{selected.content}</div>
        </div>
        <div className="card">
          <div style={{fontSize:11.5,color:"var(--tx2)",marginBottom:10}}>Question {quizIdx+1} of {selected.quiz.length}:</div>
          <div style={{fontWeight:800,fontSize:16,marginBottom:18,letterSpacing:"-.2px"}}>{q.q}</div>
          {q.opts.map((opt,i)=>{
            let cls="quiz-opt";
            if(lastAns!==undefined){
              if(i===q.ans)cls+=" correct";
              else if(i===lastAns.idx&&!lastAns.correct)cls+=" wrong";
              else cls+=" neutral";
            }
            return <div key={i} className={cls} onClick={()=>!lastAns&&answer(i)}>{opt}</div>;
          })}
        </div>
      </div>
    );
  }

  if(selected&&done){
    const correct=answers.filter(a=>a.correct).length;
    const pct=Math.round((correct/selected.quiz.length)*100);
    const perfect=pct===100;
    return (
      <div className="page" style={{textAlign:"center",maxWidth:500,margin:"0 auto"}}>
        <div style={{fontSize:70,marginBottom:16}}>{perfect?"🏆":"🎓"}</div>
        <div style={{fontWeight:800,fontSize:24,letterSpacing:"-.5px",marginBottom:6}}>{perfect?"Perfect Score!":"Lesson Complete!"}</div>
        <div style={{color:"var(--tx2)",marginBottom:24}}>{correct}/{selected.quiz.length} correct · {pct}% accuracy</div>
        {!completed.includes(selected.id)&&(
          <div style={{display:"inline-block",background:"var(--gld3)",border:"1px solid rgba(245,158,11,.25)",borderRadius:"var(--r)",padding:"16px 28px",marginBottom:24}}>
            <div style={{fontFamily:"var(--mono)",fontSize:32,fontWeight:800,color:"var(--gld2)"}}>+{selected.xp} XP</div>
            <div style={{fontSize:12,color:"var(--tx2)"}}>Added to your profile!</div>
            {perfect&&<div style={{fontSize:12,color:"var(--grn2)",marginTop:4}}>🌟 Perfect quiz bonus!</div>}
          </div>
        )}
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-blue btn-lg" onClick={()=>setSelected(null)}>Back to Lessons</button>
          <button className="btn btn-ghost" onClick={()=>{setQuizIdx(0);setAnswers([]);setDone(false);}}>Redo Quiz</button>
        </div>
      </div>
    );
  }

  const visibleLessons=tab==="all"?LESSONS:tab==="incomplete"?LESSONS.filter(l=>!completed.includes(l.id)):LESSONS.filter(l=>l.category===tab);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Learn Hub</div><div className="pg-sub">Build real investing knowledge with interactive lessons and quizzes</div></div>
      <div className="g3" style={{marginBottom:16}}>
        <div className="card card-sm">
          <div className="sl">Completed</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <MiniGauge value={completed.length} max={LESSONS.length} color="#10b981" size={52}/>
            <div><div style={{fontWeight:800,fontSize:18}}>{completed.length}/{LESSONS.length}</div><div style={{fontSize:11,color:"var(--tx2)"}}>lessons</div></div>
          </div>
        </div>
        <div className="card card-sm"><div className="sl">XP from Learning</div><div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:20,color:"var(--gld2)"}}>{LESSONS.filter(l=>completed.includes(l.id)).reduce((s,l)=>s+l.xp,0)}</div><div style={{fontSize:11,color:"var(--tx2)"}}>out of {LESSONS.reduce((s,l)=>s+l.xp,0)} total XP</div></div>
        <div className="card card-sm"><div className="sl">Perfect Quizzes</div><div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:20,color:"var(--pur2)"}}>{user.perfectQuizzes||0}</div><div style={{fontSize:11,color:"var(--tx2)"}}>100% accuracy</div></div>
      </div>
      <div className="prog" style={{marginBottom:18}}><div className="prog-fill" style={{width:`${(completed.length/LESSONS.length)*100}%`,background:"linear-gradient(90deg,var(--blue),var(--pur))"}}/></div>

      <div className="tabs">
        {[{v:"all",l:`All (${LESSONS.length})`},{v:"incomplete",l:`To Do (${LESSONS.filter(l=>!completed.includes(l.id)).length})`},...categories.map(c=>({v:c,l:c}))].map(t=>(
          <div key={t.v} className={`tab ${tab===t.v?"on":""}`} onClick={()=>setTab(t.v)}>{t.l}</div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
        {visibleLessons.map(l=>{
          const isDone=completed.includes(l.id);
          return (
            <div key={l.id} className={`lsn ${isDone?"done":""}`} onClick={()=>{setSelected(l);setQuizIdx(0);setAnswers([]);setDone(false);}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:28}}>{l.icon}</div>
                <div style={{display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}>
                  <span className={`bd ${DIFF_COLOR[l.difficulty]||"b-dim"}`} style={{fontSize:9}}>{l.difficulty}</span>
                  {isDone&&<span className="bd b-grn" style={{fontSize:9}}>✓ Done</span>}
                </div>
              </div>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{l.title}</div>
              <div style={{fontSize:11,color:"var(--tx2)",marginBottom:10}}>{l.category} · {l.duration} · {l.quiz.length}Q</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span className="bd b-gld" style={{fontSize:9}}>+{l.xp} XP</span>
                <button className="btn btn-blue btn-sm" style={{fontSize:11}}>{isDone?"Redo":"Start"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── AI COACH PAGE ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function AICoachPage({ user, prices }) {
  const [messages,setMessages]=useState([
    {role:"assistant",text:"Hey! I'm your NextGen Finance AI Coach 🎓 I'm here to help you understand investing concepts, analyze your simulated portfolio, and prepare for real opportunities. Ask me anything — I'll always remind you that this is a simulation for learning, not real investing advice!"}
  ]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);

  const portVal=calcPortfolio(user.portfolio,prices);
  const total=user.balance+portVal;

  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[messages]);

  const QUICK = [
    "Explain my simulated portfolio performance",
    "What does P/E ratio mean?",
    "Should I diversify more?",
    "How does compound interest work?",
    "What's the difference between stocks and ETFs?",
    "How do I use this simulation to learn?",
  ];

  const send=async(text=input)=>{
    if(!text.trim()||loading)return;
    const userMsg={role:"user",text};
    setMessages(m=>[...m,userMsg]);
    setInput("");
    setLoading(true);
    const context=`The student's simulated portfolio: ${Object.keys(user.portfolio).length} positions, virtual total value $${total.toFixed(0)}, balance $${user.balance.toFixed(0)}, XP: ${user.xp||0}, lessons completed: ${(user.completedLessons||[]).length}/${LESSONS.length}. Risk tolerance: ${user.riskTolerance}. Always remind them this is a simulation.`;
    const reply=await askClaude(`${context}\n\nStudent asks: ${text}`,"You are a supportive AI financial coach for a high school student using a STOCK MARKET SIMULATION app. This is NOT real investing — always clarify this. Teach concepts clearly, praise curiosity, and give actionable learning advice. Keep responses under 120 words. Never give real investment advice.");
    setMessages(m=>[...m,{role:"assistant",text:reply}]);
    setLoading(false);
  };

  return (
    <div className="page" style={{display:"flex",flexDirection:"column",flex:1,paddingBottom:0}}>
      <div className="pg-hd"><div className="pg-title">AI Coach</div><div className="pg-sub">Your personal finance tutor — powered by Claude AI</div></div>
      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        {QUICK.map(q=><button key={q} className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>send(q)}>{q}</button>)}
      </div>
      <div style={{flex:1,overflowY:"auto",background:"var(--bg2)",border:"1px solid var(--line)",borderRadius:"var(--r)",padding:16,marginBottom:12,display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:10,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,var(--blue),var(--pur))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🤖</div>}
            <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.role==="user"?"var(--blue3)":"var(--bg3)",border:`1px solid ${m.role==="user"?"var(--blue)":"var(--line)"}`,fontSize:13,lineHeight:1.7,color:m.role==="user"?"var(--blue2)":"var(--tx)"}}>
              {m.text}
            </div>
            {m.role==="user"&&<Avatar name={user.name} size={28} fontSize={10}/>}
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,var(--blue),var(--pur))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div><div style={{padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--line)",borderRadius:"12px 12px 12px 4px",display:"flex",alignItems:"center",gap:6}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Thinking...</span></div></div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:10,paddingBottom:20}}>
        <input className="inp" placeholder="Ask anything about investing concepts, your simulation, or career paths..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
        <button className="btn btn-blue" disabled={!input.trim()||loading} onClick={()=>send()}>Send</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SCENARIO SIMULATOR ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ScenarioPage() {
  const [selected,setSelected]=useState("balanced");
  const [years,setYears]=useState(5);
  const [initial,setInitial]=useState(10000);
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const sc=SCENARIOS.find(s=>s.id===selected);

  let final=initial;
  sc.returns.slice(0,years).forEach(r=>(final*=(1+r)));
  const totalRet=((final-initial)/initial)*100;

  const allLines=SCENARIOS.map(s=>{
    let v=initial;
    const data=[initial,...s.returns.slice(0,years).map(r=>(v=v*(1+r)))];
    return {id:s.id,color:s.color,data};
  });

  useEffect(()=>{
    const load=async()=>{
      setAiLoading(true);
      const t=await askClaude(`Explain the "${sc.label}" investing strategy in our SIMULATION app to a high school student. 2-3 short paragraphs: what it means, who it suits, key risks and rewards. Always note this is educational simulation, not real advice. Max 80 words.`);
      setAiText(t);setAiLoading(false);
    };load();
  },[selected]);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Strategy Simulator</div><div className="pg-sub">⚠️ Simulated projections only — explore different investing approaches risk-free</div></div>
      <div className="g3" style={{marginBottom:18}}>
        {SCENARIOS.map(s=>(
          <div key={s.id} className={`sc-card ${selected===s.id?"on":""}`} onClick={()=>setSelected(s.id)} style={{borderColor:selected===s.id?s.color:"var(--line)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:s.color}}/>
              <div style={{fontWeight:800,fontSize:13}}>{s.emoji} {s.label}</div>
            </div>
            <div style={{fontSize:11.5,color:"var(--tx2)"}}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="g2" style={{marginBottom:14}}>
        <div className="card">
          <div className="sh"><div className="sh-t">Projected Returns Comparison</div><span className="bd b-gld" style={{fontSize:9}}>SIMULATED</span></div>
          <MultiLineChart lines={allLines}/>
          <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap"}}>
            {SCENARIOS.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:3,background:s.color,borderRadius:2}}/><span style={{fontSize:11,color:"var(--tx2)"}}>{s.emoji} {s.label}</span></div>)}
          </div>
          <div style={{display:"flex",gap:16,marginTop:14,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:10,color:"var(--tx3)",textTransform:"uppercase",marginBottom:4}}>Starting Amount</div>
              <input className="inp" type="number" value={initial} onChange={e=>setInitial(Math.max(100,parseInt(e.target.value)||100))} style={{width:130}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:"var(--tx3)",textTransform:"uppercase",marginBottom:4}}>Years: {years}</div>
              <input type="range" min="1" max="5" value={years} onChange={e=>setYears(parseInt(e.target.value))} style={{marginTop:10,width:130}}/>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="sh-t" style={{marginBottom:12}}>{sc.emoji} {sc.label} — Your Projection</div>
          <div style={{padding:"14px 0"}}>
            <div style={{fontSize:11,color:"var(--tx2)",marginBottom:4}}>Starting with {fmtUSD(initial)} · {years} year{years>1?"s":""}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:32,fontWeight:800,color:sc.color}}>{fmtUSD(Math.round(final))}</div>
            <div style={{fontSize:14,color:"var(--tx2)",marginTop:2}}>
              <span className={totalRet>=0?"grn":"red"} style={{fontWeight:800}}>{fmtPct(totalRet)}</span> return (simulated)
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {Object.entries(sc.sectors).map(([s,pct])=>(
              <div key={s} style={{padding:"5px 10px",background:"var(--bg3)",borderRadius:"var(--r3)",fontSize:11}}>
                <span style={{color:"var(--tx2)"}}>{s}: </span><strong>{pct}%</strong>
              </div>
            ))}
          </div>
          <div className="ai-box">
            <div className="ai-hd">✦ AI Strategy Explainer</div>
            {aiLoading?<div style={{display:"flex",gap:8,alignItems:"center"}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Loading...</span></div>
            :<p style={{fontSize:12}}>{aiText}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MARKET MOOD BOARD ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function MoodPage({ prices }) {
  const fearGreed = useMemo(() => {
    const gainers = STOCKS.filter(s => s.change > 0).length;
    const score = Math.round((gainers / STOCKS.length) * 100);
    return score;
  }, []);

  const getMood = (score) => {
    if (score >= 75) return { label: "Extreme Greed", color: "#10b981", emoji: "🤑" };
    if (score >= 55) return { label: "Greed",         color: "#34d399", emoji: "😄" };
    if (score >= 45) return { label: "Neutral",        color: "#f59e0b", emoji: "😐" };
    if (score >= 25) return { label: "Fear",           color: "#f87171", emoji: "😰" };
    return                  { label: "Extreme Fear",   color: "#ef4444", emoji: "😱" };
  };

  const mood = getMood(fearGreed);

  const sectorPerf = STOCKS.reduce((acc, s) => {
    if (!acc[s.sector]) acc[s.sector] = { total: 0, count: 0 };
    acc[s.sector].total += s.change;
    acc[s.sector].count++;
    return acc;
  }, {});

  const sectorAvgs = Object.entries(sectorPerf)
    .map(([name, d]) => ({ name, avg: parseFloat((d.total / d.count).toFixed(2)) }))
    .sort((a, b) => b.avg - a.avg);

  const maxAbs = Math.max(...sectorAvgs.map(s => Math.abs(s.avg)), 1);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Market Mood Board</div><div className="pg-sub">⚠️ Simulated sentiment indicators — for learning only</div></div>

      {/* Fear & Greed Meter */}
      <div className="card" style={{marginBottom:12,textAlign:"center",padding:"28px 20px"}}>
        <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".12em",color:"var(--tx3)",fontWeight:700,marginBottom:12}}>Simulated Fear & Greed Index</div>
        <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
          <MiniGauge value={fearGreed} max={100} color={mood.color} size={120}/>
        </div>
        <div style={{fontSize:52,marginBottom:8}}>{mood.emoji}</div>
        <div style={{fontFamily:"var(--mono)",fontSize:32,fontWeight:800,color:mood.color,marginBottom:4}}>{fearGreed}</div>
        <div style={{fontWeight:700,fontSize:18,color:mood.color,marginBottom:8}}>{mood.label}</div>
        <div style={{fontSize:12,color:"var(--tx2)",maxWidth:380,margin:"0 auto",lineHeight:1.7}}>
          {fearGreed >= 55
            ? "Most simulated stocks are rising today. In real markets, this can signal investors are optimistic — but also that prices may be stretched."
            : fearGreed >= 45
            ? "The simulated market is mixed today. Investors are uncertain — a good time to review your portfolio balance."
            : "Most simulated stocks are falling today. In real markets, fear often creates buying opportunities for patient investors."}
        </div>
        <div style={{marginTop:16,padding:"8px 16px",background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.15)",borderRadius:"var(--r3)",display:"inline-block",fontSize:11,color:"var(--gld2)"}}>⚠️ This is a simulated indicator — not real market data</div>
      </div>

      {/* Sector Heat Map */}
      <div className="card" style={{marginBottom:12}}>
        <div className="sh"><div className="sh-t">Sector Performance Heat Map (Simulated)</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sectorAvgs.map(s => {
            const pct = (s.avg / maxAbs) * 100;
            const up = s.avg >= 0;
            return (
              <div key={s.name} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:130,fontSize:12,fontWeight:600,color:"var(--tx2)",flexShrink:0}}>{s.name}</div>
                <div style={{flex:1,height:28,background:"var(--bg4)",borderRadius:"var(--r3)",overflow:"hidden",position:"relative"}}>
                  <div style={{
                    position:"absolute", top:0, bottom:0,
                    left: up ? "50%" : `${50 + pct/2}%`,
                    width:`${Math.abs(pct)/2}%`,
                    background: up ? "var(--grn)" : "var(--red)",
                    opacity:.75, transition:"width .6s",
                    borderRadius:"var(--r3)"
                  }}/>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:10,fontWeight:700,fontFamily:"var(--mono)",color:up?"var(--grn2)":"var(--red2)"}}>
                    {fmtPct(s.avg)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Stock Movers */}
      <div className="g2">
        <div className="card">
          <div className="sh-t" style={{marginBottom:12,color:"var(--grn2)"}}>📈 Top Gainers Today</div>
          {[...STOCKS].sort((a,b)=>b.change-a.change).slice(0,5).map(s=>(
            <div key={s.symbol} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>{s.logo}</span><div><div style={{fontWeight:700,fontSize:12}}>{s.symbol}</div><div style={{fontSize:10,color:"var(--tx2)"}}>{s.sector}</div></div></div>
              <span style={{fontFamily:"var(--mono)",fontWeight:800,color:"var(--grn2)",fontSize:13}}>{fmtPct(s.change)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="sh-t" style={{marginBottom:12,color:"var(--red2)"}}>📉 Top Losers Today</div>
          {[...STOCKS].sort((a,b)=>a.change-b.change).slice(0,5).map(s=>(
            <div key={s.symbol} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>{s.logo}</span><div><div style={{fontWeight:700,fontSize:12}}>{s.symbol}</div><div style={{fontSize:10,color:"var(--tx2)"}}>{s.sector}</div></div></div>
              <span style={{fontFamily:"var(--mono)",fontWeight:800,color:"var(--red2)",fontSize:13}}>{fmtPct(s.change)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STOCK COMPARE TOOL ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ComparePage({ prices }) {
  const [stockA, setStockA] = useState("AAPL");
  const [stockB, setStockB] = useState("MSFT");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const A = STOCKS.find(s => s.symbol === stockA);
  const B = STOCKS.find(s => s.symbol === stockB);
  const pA = prices[stockA] || A?.price || 0;
  const pB = prices[stockB] || B?.price || 0;

  const METRICS = [
    { label: "Simulated Price", aVal: fmtUSD(pA), bVal: fmtUSD(pB), winner: pA > pB ? "a" : "b" },
    { label: "Daily Change",    aVal: fmtPct(A?.change||0), bVal: fmtPct(B?.change||0), winner: (A?.change||0) > (B?.change||0) ? "a" : "b", color: true },
    { label: "Market Cap",      aVal: A?.marketCap, bVal: B?.marketCap },
    { label: "P/E Ratio",       aVal: A?.pe||"N/A", bVal: B?.pe||"N/A" },
    { label: "Sector",          aVal: A?.sector, bVal: B?.sector },
    { label: "Employees",       aVal: A?.employees, bVal: B?.employees },
    { label: "Founded",         aVal: A?.founded, bVal: B?.founded },
  ];

  const loadAI = async () => {
    setAiLoading(true);
    const text = await askClaude(
      `Compare ${A?.name} (${stockA}) and ${B?.name} (${stockB}) for a high school student using a stock simulation app. In 3 short paragraphs: 1) Key difference in what these companies do 2) Which looks stronger based on simulated metrics and why 3) What type of investor each stock might suit. Note this is for educational simulation. Max 100 words.`
    );
    setAiText(text);
    setAiLoading(false);
  };

  useEffect(() => { loadAI(); }, [stockA, stockB]);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Stock Comparison</div><div className="pg-sub">Compare two simulated stocks side by side</div></div>

      {/* Stock selectors */}
      <div className="g2" style={{marginBottom:16}}>
        {[{label:"Stock A", val:stockA, set:setStockA, stock:A, price:pA},{label:"Stock B", val:stockB, set:setStockB, stock:B, price:pB}].map((col,ci)=>(
          <div key={ci} className="card" style={{borderColor:ci===0?"var(--blue)":"var(--pur)",borderWidth:2}}>
            <div style={{fontSize:10,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{col.label}</div>
            <select className="inp" value={col.val} onChange={e=>col.set(e.target.value)} style={{marginBottom:12}}>
              {STOCKS.map(s=><option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div className="s-logo" style={{width:44,height:44,fontSize:26}}>{col.stock?.logo}</div>
              <div>
                <div style={{fontWeight:800,fontSize:16}}>{col.stock?.symbol}</div>
                <div style={{fontSize:11.5,color:"var(--tx2)"}}>{col.stock?.name}</div>
                <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:18,marginTop:2}}>${fmt(col.price)}</div>
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:"var(--bg3)",borderRadius:"var(--r3)",fontSize:12,color:"var(--tx2)",lineHeight:1.6}}>{col.stock?.desc}</div>
          </div>
        ))}
      </div>

      {/* Metrics table */}
      <div className="card" style={{padding:0,marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"10px 16px",borderBottom:"1px solid var(--line)"}}>
          {["Metric", A?.symbol||"A", B?.symbol||"B"].map(h=><div key={h} style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:".09em",color:"var(--tx3)",fontWeight:700}}>{h}</div>)}
        </div>
        {METRICS.map((m,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"11px 16px",borderBottom:i<METRICS.length-1?"1px solid var(--line)":"none",alignItems:"center"}}>
            <div style={{fontSize:12,color:"var(--tx2)"}}>{m.label}</div>
            <div style={{fontWeight:700,fontSize:13,color:m.color&&(A?.change||0)>0?"var(--grn2)":m.color?"var(--red2)":"var(--tx)",background:m.winner==="a"?"rgba(59,130,246,.08)":"transparent",borderRadius:"var(--r3)",padding:"2px 6px",display:"inline-block"}}>{m.aVal}{m.winner==="a"&&" ✓"}</div>
            <div style={{fontWeight:700,fontSize:13,color:m.color&&(B?.change||0)>0?"var(--grn2)":m.color?"var(--red2)":"var(--tx)",background:m.winner==="b"?"rgba(139,92,246,.08)":"transparent",borderRadius:"var(--r3)",padding:"2px 6px",display:"inline-block"}}>{m.bVal}{m.winner==="b"&&" ✓"}</div>
          </div>
        ))}
      </div>

      {/* Sparklines side by side */}
      <div className="g2" style={{marginBottom:12}}>
        {[{s:A,p:pA},{s:B,p:pB}].map((x,i)=>(
          x.s&&<div key={i} className="card">
            <div className="sh"><div className="sh-t">{x.s.symbol} — 24h Trend</div><span className={`bd ${x.s.change>=0?"b-grn":"b-red"}`}>{fmtPct(x.s.change)}</span></div>
            <Sparkline data={genSpark(x.s.price,x.s.change,40)} color={x.s.change>=0?"#10b981":"#ef4444"} w={240} h={60}/>
          </div>
        ))}
      </div>

      {/* AI Comparison */}
      <div className="ai-box">
        <div className="ai-hd">✦ AI Comparison — {A?.symbol} vs {B?.symbol}<span style={{marginLeft:"auto",fontSize:9,color:"var(--tx3)",fontWeight:400,cursor:"pointer",textTransform:"none"}} onClick={loadAI}>Refresh ↺</span></div>
        {aiLoading
          ? <div style={{display:"flex",gap:8,alignItems:"center"}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Generating comparison...</span></div>
          : <p style={{fontSize:13,lineHeight:1.78}}>{aiText}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── TRADING TOURNAMENT ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const TOURNAMENTS = [
  { id:1, name:"Weekly Sprint",    duration:"7 days",  prize:"🥇 500 XP",  desc:"Best % gain in 7 days wins. Resets every Monday.",        status:"active",   endsIn: 3*24*60*60 },
  { id:2, name:"Tech Stock Blitz", duration:"48 hours",prize:"🏆 300 XP",  desc:"Only tech stocks count. Highest gain in 48h wins.",        status:"active",   endsIn: 18*60*60 },
  { id:3, name:"Bear Market Drill",duration:"3 days",  prize:"🛡️ 400 XP",  desc:"Lose the least money when all stocks drop. Strategy wins.",status:"upcoming", endsIn: 0 },
  { id:4, name:"Diversifier Cup",  duration:"5 days",  prize:"🌍 350 XP",  desc:"Must hold 5+ sectors. Best balanced return wins.",         status:"upcoming", endsIn: 0 },
];

function TournamentPage({ user, prices }) {
  const [joined, setJoined] = useState([]);
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    const tick = () => {
      const now = {};
      TOURNAMENTS.forEach(t => {
        if (t.endsIn <= 0) { now[t.id] = "Starting soon"; return; }
        const s = t.endsIn - Math.floor((Date.now() % (t.endsIn * 1000)) / 1000);
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        now[t.id] = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
      });
      setCountdown(now);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const portVal = calcPortfolio(user.portfolio, prices);
  const total = user.balance + portVal;
  const gain = ((total - 10000) / 10000) * 100;
  const { lvl } = getLevel(user.xp || 0);

  const MOCK_STANDINGS = [
    { name:"Alex K.", avatar:"AK", color:"#3b82f6", gain:14.2, value:11420 },
    { name:"Priya M.", avatar:"PM", color:"#8b5cf6", gain:11.8, value:11180 },
    { name:user.name.split(" ")[0]+" (You)", avatar:user.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), color:"#10b981", gain, value:total, isMe:true },
    { name:"Jordan L.", avatar:"JL", color:"#f59e0b", gain:8.4,  value:10840 },
    { name:"Sam T.",    avatar:"ST", color:"#ef4444", gain:3.1,  value:10310 },
  ].sort((a,b)=>b.gain-a.gain);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Trading Tournaments</div><div className="pg-sub">⚠️ Simulated competitions — virtual money only, XP prizes</div></div>

      {/* Active tournaments */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:"var(--tx3)",fontWeight:700,marginBottom:10}}>Active Now</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {TOURNAMENTS.filter(t=>t.status==="active").map(t=>{
            const isJoined = joined.includes(t.id);
            return (
              <div key={t.id} className="card card-glow" style={{borderColor:isJoined?"var(--grn)":"var(--line)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span className="bd b-grn" style={{fontSize:9}}>🟢 LIVE</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:"var(--gld2)"}}>⏱ {countdown[t.id]||"--:--:--"}</span>
                </div>
                <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{t.name}</div>
                <div style={{fontSize:12,color:"var(--tx2)",marginBottom:10,lineHeight:1.6}}>{t.desc}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <span style={{fontSize:11,color:"var(--tx2)"}}>⏳ {t.duration}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"var(--gld2)"}}>{t.prize}</span>
                </div>
                <button
                  className={`btn ${isJoined?"btn-ghost":"btn-blue"}`}
                  style={{width:"100%"}}
                  onClick={()=>setJoined(j=>isJoined?j.filter(x=>x!==t.id):[...j,t.id])}
                >
                  {isJoined ? "✓ Joined — Leave" : "Join Tournament"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:"var(--tx3)",fontWeight:700,marginBottom:10}}>Upcoming</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {TOURNAMENTS.filter(t=>t.status==="upcoming").map(t=>(
            <div key={t.id} className="card" style={{opacity:.7}}>
              <span className="bd b-gld" style={{fontSize:9,marginBottom:10,display:"inline-block"}}>⏳ UPCOMING</span>
              <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{t.name}</div>
              <div style={{fontSize:12,color:"var(--tx2)",marginBottom:10}}>{t.desc}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"var(--tx2)"}}>⏳ {t.duration}</span>
                <span style={{fontSize:12,fontWeight:700,color:"var(--gld2)"}}>{t.prize}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live standings */}
      {joined.length > 0 && (
        <div className="card" style={{padding:0}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--line)"}}>
            <div className="sh-t">Live Standings — {TOURNAMENTS.find(t=>t.id===joined[0])?.name}</div>
            <div style={{fontSize:11,color:"var(--gld2)",marginTop:2}}>⚠️ Simulated rankings — updates as you trade</div>
          </div>
          {MOCK_STANDINGS.map((e,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:i<MOCK_STANDINGS.length-1?"1px solid var(--line)":"none",background:e.isMe?"rgba(16,185,129,.04)":"transparent",borderLeft:e.isMe?"2px solid var(--grn)":"2px solid transparent"}}>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:16,width:24,color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7c2f":"var(--tx3)"}}>{i+1}</div>
              <Avatar name={e.name} color={e.color} size={32} fontSize={10}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{e.name}</div>
                <div style={{fontSize:11,color:"var(--tx2)"}}>{fmtUSD(e.value)}</div>
              </div>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:14,color:e.gain>=0?"var(--grn2)":"var(--red2)"}}>{fmtPct(e.gain)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FINANCE GLOSSARY ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const GLOSSARY = [
  { term:"Stock",         cat:"Basics",    def:"A share of ownership in a company. Buying one share of Apple means you own a tiny piece of Apple Inc." },
  { term:"Bull Market",   cat:"Markets",   def:"When stock prices rise broadly over time. Investors are optimistic and buying. The opposite of a bear market." },
  { term:"Bear Market",   cat:"Markets",   def:"When stock prices fall 20%+ from recent highs. Fear takes over and investors sell. Bear markets are historically temporary." },
  { term:"Portfolio",     cat:"Basics",    def:"The total collection of all your investments — every stock, ETF, and asset you own together." },
  { term:"Diversification",cat:"Strategy", def:"Spreading money across different stocks, sectors, and assets to reduce risk. Don't put all eggs in one basket." },
  { term:"ETF",           cat:"Investing", def:"Exchange-Traded Fund. A bundle of many stocks in one investment. SPY tracks the S&P 500 — 500 companies at once." },
  { term:"P/E Ratio",     cat:"Analysis",  def:"Price-to-Earnings ratio. Stock price divided by annual earnings per share. High P/E = high growth expectations." },
  { term:"Market Cap",    cat:"Analysis",  def:"Total value of all a company's shares. Price × Total Shares. Apple's is ~$3.2 trillion — making it one of the most valuable companies ever." },
  { term:"Dividend",      cat:"Investing", def:"Regular cash payments companies make to shareholders, usually quarterly. A $2 annual dividend on 100 shares = $200/year passive income." },
  { term:"Volatility",    cat:"Risk",      def:"How much a stock's price swings up and down. High volatility = bigger moves in both directions. Higher risk AND reward." },
  { term:"Compound Growth",cat:"Basics",   def:"Earning returns on your returns. $1,000 at 10%/year for 30 years = $17,449. This is why starting to invest young is so powerful." },
  { term:"Short Selling", cat:"Advanced",  def:"Betting a stock will fall. You borrow shares, sell them, buy back cheaper later. Losses can be unlimited if wrong — very risky." },
  { term:"Liquidity",     cat:"Markets",   def:"How easily an asset can be bought or sold without affecting its price. Cash is perfectly liquid. Real estate is not." },
  { term:"Index Fund",    cat:"Investing", def:"A fund that tracks a market index like the S&P 500. Cheap, diversified, and historically beats most actively managed funds." },
  { term:"ROI",           cat:"Analysis",  def:"Return on Investment. How much you gained or lost relative to what you invested. (Gain ÷ Cost) × 100 = ROI %." },
  { term:"Blue Chip",     cat:"Analysis",  def:"Large, established, financially stable companies with a long track record. Apple, Microsoft, and Coca-Cola are blue chips." },
  { term:"IPO",           cat:"Markets",   def:"Initial Public Offering. When a private company sells shares to the public for the first time on a stock exchange." },
  { term:"Recession",     cat:"Markets",   def:"An economic decline where GDP falls for 2+ consecutive quarters. Stock markets usually fall during recessions." },
  { term:"Hedge",         cat:"Strategy",  def:"An investment made to reduce the risk of another. Like buying insurance for your portfolio against market crashes." },
  { term:"Ticker Symbol", cat:"Basics",    def:"The short code used to identify a stock on an exchange. AAPL = Apple, TSLA = Tesla, MSFT = Microsoft." },
];

function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [sel, setSel] = useState(null);
  const [aiDef, setAiDef] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const cats = ["All", ...new Set(GLOSSARY.map(g => g.cat))];

  const filtered = GLOSSARY.filter(g =>
    (cat === "All" || g.cat === cat) &&
    g.term.toLowerCase().includes(search.toLowerCase())
  );

  const openTerm = async (g) => {
    setSel(g);
    setAiDef("");
    setAiLoading(true);
    const text = await askClaude(`Explain "${g.term}" to a high school student in 2-3 sentences using a real-world analogy they'd relate to. Then give one example of how it applies in our stock simulation app. Max 60 words. Be conversational and fun.`);
    setAiDef(text);
    setAiLoading(false);
  };

  const CAT_COLORS = { Basics:"b-blue", Markets:"b-grn", Strategy:"b-pur", Investing:"b-gld", Analysis:"b-tl", Risk:"b-red", Advanced:"b-pk" };

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Finance Glossary</div><div className="pg-sub">{GLOSSARY.length} terms — tap any to get an AI explanation</div></div>

      <div className="search" style={{marginBottom:12}}>
        <span style={{color:"var(--tx3)"}}>🔍</span>
        <input placeholder="Search terms..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {search&&<span style={{cursor:"pointer",color:"var(--tx3)"}} onClick={()=>setSearch("")}>✕</span>}
      </div>
      <div className="pills" style={{marginBottom:18}}>
        {cats.map(c=><div key={c} className={`pill ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</div>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}}>
        {filtered.map(g=>(
          <div key={g.term} onClick={()=>openTerm(g)} style={{padding:"13px 15px",background:"var(--bg2)",border:"1px solid var(--line)",borderRadius:"var(--r2)",cursor:"pointer",transition:"all .13s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--line2)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--line)";e.currentTarget.style.transform="translateY(0)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <span className={`bd ${CAT_COLORS[g.cat]||"b-dim"}`} style={{fontSize:8}}>{g.cat}</span>
              <span style={{fontSize:12,color:"var(--tx3)"}}>→</span>
            </div>
            <div style={{fontWeight:800,fontSize:14,marginBottom:5}}>{g.term}</div>
            <div style={{fontSize:11.5,color:"var(--tx2)",lineHeight:1.5}}>{g.def.slice(0,70)}...</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px",color:"var(--tx2)"}}>No terms match your search.</div>}
      </div>

      {sel&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="modal" style={{maxWidth:480}}>
            <button className="modal-close" onClick={()=>setSel(null)}>✕</button>
            <span className={`bd ${CAT_COLORS[sel.cat]||"b-dim"}`} style={{marginBottom:12,display:"inline-block"}}>{sel.cat}</span>
            <div style={{fontFamily:"var(--mono)",fontSize:24,fontWeight:800,marginBottom:10}}>{sel.term}</div>
            <div style={{fontSize:13.5,color:"var(--tx2)",lineHeight:1.75,marginBottom:18}}>{sel.def}</div>
            <div className="ai-box">
              <div className="ai-hd">✦ AI Analogy & Example</div>
              {aiLoading
                ? <div style={{display:"flex",gap:8,alignItems:"center"}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Generating explanation...</span></div>
                : <p style={{fontSize:13,lineHeight:1.78}}>{aiDef}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── WEEKLY PROGRESS REPORT ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ReportPage({ user, prices }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const portVal = calcPortfolio(user.portfolio, prices);
  const total = user.balance + portVal;
  const gain = ((total - 10000) / 10000) * 100;
  const { lvl } = getLevel(user.xp || 0);
  const lessons = (user.completedLessons || []).length;
  const trades = (user.tradeHistory || []).length;
  const holdings = Object.keys(user.portfolio).length;
  const sectors = [...new Set(Object.keys(user.portfolio).map(sym => STOCKS.find(s=>s.symbol===sym)?.sector).filter(Boolean))];

  const stats = [
    { l:"Simulated Return",   v: fmtPct(gain),          color: gain>=0?"var(--grn2)":"var(--red2)" },
    { l:"Portfolio Value",    v: fmtUSD(total) },
    { l:"Total Trades",       v: trades },
    { l:"Lessons Completed",  v: `${lessons}/${LESSONS.length}` },
    { l:"XP Earned",          v: fmtXP(user.xp||0) },
    { l:"Current Level",      v: `Level ${lvl}` },
    { l:"Positions Held",     v: holdings },
    { l:"Sectors Covered",    v: sectors.length },
  ];

  const generate = async () => {
    setLoading(true);
    const text = await askClaude(
      `Write a personalized weekly progress report for a high school student using a stock market SIMULATION app named ${user.name.split(" ")[0]}. Their stats: simulated return ${fmtPct(gain)}, portfolio value ${fmtUSD(total)}, trades made: ${trades}, lessons completed: ${lessons}/${LESSONS.length}, XP: ${user.xp||0}, level ${lvl}, holding ${holdings} stocks across sectors: ${sectors.join(", ")||"none yet"}, streak: ${user.streak||1} days. Write 4 short sections: 1) 🎯 This Week's Highlights (what they did well) 2) 📈 Portfolio Analysis (what their simulation performance shows they're learning) 3) 📚 Knowledge Progress (how their learning is coming along) 4) 🚀 This Week's Goals (3 specific actionable next steps). Be encouraging, specific, and always note this is a simulation. Max 200 words total.`,
      "You write personalized educational progress reports for student investors using a simulation app. Be warm, specific, motivating, and educational."
    );
    setReport(text);
    setLoading(false);
    setGenerated(true);
  };

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Progress Report</div><div className="pg-sub">Your personalized AI-generated weekly simulation summary</div></div>

      {/* Stats snapshot */}
      <div className="g4" style={{marginBottom:16}}>
        {stats.map(s=>(
          <div key={s.l} className="card card-sm">
            <div className="sl">{s.l}</div>
            <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:17,color:s.color||"var(--tx)"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {!generated ? (
        <div className="card" style={{textAlign:"center",padding:"50px 20px"}}>
          <div style={{fontSize:52,marginBottom:16}}>📋</div>
          <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>Generate Your Weekly Report</div>
          <div style={{color:"var(--tx2)",fontSize:13,marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
            Get a personalized AI analysis of your simulation performance, learning progress, and specific goals for next week.
          </div>
          <button className="btn btn-blue btn-xl" onClick={generate} disabled={loading}>
            {loading ? <><div className="spin"/> Generating your report...</> : "✨ Generate My Report"}
          </button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={{fontWeight:800,fontSize:16}}>Weekly Report — {user.name.split(" ")[0]}</div>
                <div style={{fontSize:11,color:"var(--tx2)"}}>{todayStr()} · ⚠️ Based on simulated data</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
                {loading?<div className="spin"/>:"↺ Regenerate"}
              </button>
            </div>
            <div style={{fontSize:13.5,lineHeight:1.9,color:"var(--tx2)",whiteSpace:"pre-wrap"}}>{report}</div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[{label:"Share Report",icon:"📤"},{label:"Save as PDF",icon:"💾"},{label:"Set Goals",icon:"🎯"}].map(b=>(
              <button key={b.label} className="btn btn-ghost btn-sm" style={{fontSize:11}}>{b.icon} {b.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// ── LEADERBOARD ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function LeaderboardPage({ user, prices }) {
  const portVal=calcPortfolio(user.portfolio,prices);
  const total=user.balance+portVal;
  const gain=((total-10000)/10000)*100;
  const {lvl}=getLevel(user.xp||0);
  const [tab,setTab]=useState("global");

  const me={name:user.name,avatar:user.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),color:"#3b82f6",value:total,gain,xp:user.xp||0,streak:user.streak||1,lvl,school:user.school||"Your School",isMe:true};
  const global=[...PEERS,me].sort((a,b)=>b.value-a.value);
  const myRank=global.findIndex(e=>e.isMe)+1;

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Leaderboard</div><div className="pg-sub">⚠️ Simulated portfolio rankings — all values are virtual</div></div>

      <div className="g4" style={{marginBottom:18}}>
        {[{l:"Your Rank",v:`#${myRank} of ${global.length}`},{l:"Simulated Value",v:fmtUSD(total)},{l:"Total Return",v:fmtPct(gain),c:gain>=0?"var(--grn2)":"var(--red2)"},{l:"XP Points",v:fmtXP(user.xp||0)}].map(s=>(
          <div key={s.l} className="card card-sm" style={{textAlign:"center"}}>
            <div className="sl">{s.l}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:20,fontWeight:800,color:s.c||"var(--tx)"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Podium */}
      <div style={{display:"flex",justifyContent:"center",alignItems:"flex-end",gap:10,marginBottom:24}}>
        {[1,0,2].map(idx=>{
          const e=global[idx]; if(!e)return null;
          const podH=[110,80,65][idx===0?1:idx===1?0:2];
          const rank=idx+1;
          const medals=["🥇","🥈","🥉"];
          return (
            <div key={idx} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{fontSize:idx===1?28:20}}>{medals[rank-1]}</div>
              <Avatar name={e.name} color={e.color} size={idx===1?48:38} fontSize={idx===1?14:11}/>
              <div style={{textAlign:"center",maxWidth:70}}>
                <div style={{fontSize:11.5,fontWeight:700}}>{e.name.split(" ")[0]}</div>
                <div style={{fontSize:10.5,color:"var(--grn2)",fontWeight:700}}>{fmtPct(e.gain)}</div>
              </div>
              <div style={{width:74,height:podH,background:"var(--bg3)",borderRadius:"4px 4px 0 0",border:"1px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:17,color:"var(--tx3)"}}>{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabs"><div className={`tab ${tab==="global"?"on":""}`} onClick={()=>setTab("global")}>Global</div><div className={`tab ${tab==="xp"?"on":""}`} onClick={()=>setTab("xp")}>XP Rankings</div></div>

      <div className="card" style={{padding:0}}>
        {[...global].sort((a,b)=>tab==="xp"?b.xp-a.xp:b.value-a.value).map((e,i)=>(
          <div key={i} className={`lb-row ${e.isMe?"me":""}`}>
            <div className="lb-rank" style={{color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7c2f":"var(--tx3)"}}>{i+1}</div>
            <Avatar name={e.name} color={e.color} size={34} fontSize={11}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontWeight:700,fontSize:12.5}}>{e.name}</span>
                {e.isMe&&<span className="bd b-blue" style={{fontSize:8}}>YOU</span>}
              </div>
              <div style={{fontSize:10.5,color:"var(--tx2)"}}>Lvl {e.lvl||1} · 🔥 {e.streak}d · {fmtXP(e.xp)} XP · {e.school}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:13.5}}>{fmtUSD(e.value)}</div>
              <div style={{fontSize:11,color:e.gain>=0?"var(--grn2)":"var(--red2)",fontWeight:700}}>{fmtPct(e.gain)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CHALLENGES PAGE ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ChallengesPage({ user }) {
  const [filter,setFilter]=useState("All");
  const cats=["All",...new Set(BASE_CHALLENGES.map(c=>c.category))];
  const chs=user.challenges||BASE_CHALLENGES.map(c=>({...c,progress:0,done:false}));
  const shown=filter==="All"?chs:chs.filter(c=>c.category===filter);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Challenges</div><div className="pg-sub">Complete milestones to earn XP and badges</div></div>
      <div className="g3" style={{marginBottom:18}}>
        <div className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:32}}>⚡</div>
          <div><div style={{fontFamily:"var(--mono)",fontSize:24,fontWeight:800,color:"var(--gld2)"}}>{fmtXP(user.xp||0)}</div><div style={{fontSize:11,color:"var(--tx2)"}}>Total XP Earned</div></div>
        </div>
        <div className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:32}}>🔥</div>
          <div><div style={{fontFamily:"var(--mono)",fontSize:24,fontWeight:800}}>{user.streak||1}</div><div style={{fontSize:11,color:"var(--tx2)"}}>Day Streak</div></div>
        </div>
        <div className="card card-sm" style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:32}}>🏅</div>
          <div><div style={{fontFamily:"var(--mono)",fontSize:24,fontWeight:800}}>{chs.filter(c=>c.done).length}/{chs.length}</div><div style={{fontSize:11,color:"var(--tx2)"}}>Completed</div></div>
        </div>
      </div>
      <div className="pills" style={{marginBottom:16}}>
        {cats.map(c=><div key={c} className={`pill ${filter===c?"on":""}`} onClick={()=>setFilter(c)}>{c}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:11}}>
        {shown.map(c=>(
          <div key={c.id} className={`ch-card ${c.done?"done":""}`}>
            <div style={{fontSize:32,marginBottom:9}}>{c.badge}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
              <div style={{fontWeight:800,fontSize:13}}>{c.title}</div>
              {c.done&&<span className="bd b-grn" style={{fontSize:9}}>✓ Done</span>}
            </div>
            <div style={{fontSize:11.5,color:"var(--tx2)",marginBottom:10}}>{c.desc}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span className="bd b-gld" style={{fontSize:9}}>+{c.xp} XP</span>
              <span style={{fontSize:11,color:"var(--tx2)",fontFamily:"var(--mono)"}}>{Math.min(c.progress||0,c.target)}/{c.target}</span>
            </div>
            <div className="prog"><div className="prog-fill" style={{width:`${Math.min(100,((c.progress||0)/c.target)*100)}%`,background:c.done?"var(--grn)":"linear-gradient(90deg,var(--blue),var(--pur))"}}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ProfilePage({ user, onLogout, onAddGoal }) {
  const {lvl,progress,nextXP}=getLevel(user.xp||0);
  const [goalInput,setGoalInput]=useState("");
  const [goalTarget,setGoalTarget]=useState(12000);

  return (
    <div className="page">
      <div className="pg-hd"><div className="pg-title">Profile & Settings</div></div>
      <div className="g2" style={{marginBottom:14}}>
        <div className="card">
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
            <Avatar name={user.name} size={56} fontSize={18}/>
            <div>
              <div style={{fontWeight:800,fontSize:18,letterSpacing:"-.3px"}}>{user.name}</div>
              <div style={{color:"var(--tx2)",fontSize:12,marginBottom:5}}>{user.email}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <span className="bd b-gld">Level {lvl}</span>
                {user.grade&&<span className="bd b-blue">Grade {user.grade}</span>}
                {user.school&&<span className="bd b-dim">{user.school}</span>}
              </div>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:5}}>
              <span style={{color:"var(--tx2)"}}>Level {lvl} Progress</span>
              <span style={{fontFamily:"var(--mono)"}}>{fmtXP(user.xp||0)} / {fmtXP(nextXP)} XP</span>
            </div>
            <div className="prog"><div className="prog-fill" style={{width:`${progress*100}%`,background:"linear-gradient(90deg,var(--blue),var(--pur))"}}/></div>
          </div>
          <div className="g2" style={{marginBottom:14}}>
            {[{l:"Lessons",v:(user.completedLessons||[]).length},{l:"Streak",v:`${user.streak||1}d 🔥`},{l:"Trades",v:(user.tradeHistory||[]).length},{l:"Saved Opps",v:(user.savedOpps||[]).length}].map(s=>(
              <div key={s.l} style={{textAlign:"center",padding:"8px",background:"var(--bg3)",borderRadius:"var(--r3)"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:800}}>{s.v}</div>
                <div style={{fontSize:10,color:"var(--tx2)"}}>{s.l}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{width:"100%",color:"var(--red2)",borderColor:"rgba(239,68,68,.3)"}} onClick={onLogout}>Sign Out</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card card-sm">
            <div className="sh-t" style={{marginBottom:10}}>Interests</div>
            {user.interests?.length>0?<div className="pills">{user.interests.map(i=><span key={i} className="bd b-blue">{i}</span>)}</div>:<div style={{color:"var(--tx2)",fontSize:12}}>No interests set</div>}
          </div>
          <div className="card card-sm">
            <div className="sh-t" style={{marginBottom:8}}>Risk Profile</div>
            <span className={`bd ${user.riskTolerance==="aggressive"?"b-red":user.riskTolerance==="conservative"?"b-grn":"b-gld"}`}>{user.riskTolerance||"moderate"}</span>
          </div>
          {user.goals&&<div className="card card-sm"><div className="sh-t" style={{marginBottom:8}}>Career Goals</div><div style={{fontSize:12,color:"var(--tx2)",lineHeight:1.7}}>{user.goals}</div></div>}
          <div className="card card-sm">
            <div className="sh-t" style={{marginBottom:10}}>Add Portfolio Goal</div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input className="inp" placeholder="Goal name" value={goalInput} onChange={e=>setGoalInput(e.target.value)} style={{flex:1}}/>
              <input className="inp" type="number" value={goalTarget} onChange={e=>setGoalTarget(parseInt(e.target.value)||10000)} style={{width:90}}/>
            </div>
            <button className="btn btn-blue btn-sm" onClick={()=>{if(goalInput)onAddGoal({label:goalInput,target:goalTarget});setGoalInput("");setGoalTarget(12000);}}>Add Goal</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="sh-t" style={{marginBottom:14}}>About This App</div>
        <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.15)",borderRadius:"var(--r3)",padding:"14px 16px",fontSize:12.5,lineHeight:1.8,color:"var(--tx2)"}}>
          <strong style={{color:"var(--gld2)"}}>⚠️ IMPORTANT DISCLAIMER:</strong> NextGen Finance is a 100% educational simulation platform. All stock prices are simulated and do not reflect real market data. All trades use virtual money. No real financial transactions ever occur. This platform is designed to help students learn about investing concepts in a safe, risk-free environment before they ever engage with real markets. Always consult a licensed financial advisor for real investment decisions.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATIONS PAGE ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function NotifsPage({ user, onMarkRead }) {
  const notifs=user.notifications||[];
  return (
    <div className="page">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div className="pg-title">Notifications</div>
        <button className="btn btn-ghost btn-sm" onClick={onMarkRead}>Mark all read</button>
      </div>
      <div className="card" style={{padding:0}}>
        {notifs.length===0?<div style={{textAlign:"center",padding:"50px",color:"var(--tx2)"}}>No notifications yet.</div>
        :notifs.slice().reverse().map((n,i)=>(
          <div key={i} style={{display:"flex",gap:12,padding:"13px 18px",borderBottom:i<notifs.length-1?"1px solid var(--line)":"none",background:n.read?"transparent":"rgba(59,130,246,.03)"}}>
            <div style={{fontSize:18,marginTop:1}}>🔔</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5}}>{n.msg}</div>
              <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{n.ts?new Date(n.ts).toLocaleString():"Just now"}</div>
            </div>
            {!n.read&&<div style={{width:6,height:6,background:"var(--blue)",borderRadius:"50%",marginTop:5,flexShrink:0}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DAILY BRIEF MODAL ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function DailyBriefModal({ prices, onClose }) {
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const load=async()=>{
      const movers=STOCKS.sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,4);
      const t=await askClaude(`Write a fun, energetic daily market briefing for high school students (max 3 sentences). Today's simulated movers: ${movers.map(s=>`${s.name} ${s.change>0?"+":""}${s.change}%`).join(", ")}. Start with a hook, explain 1-2 moves simply, end with a learning tip. Always note this is a simulation.`);
      setText(t);setLoading(false);
    };load();
  },[]);

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
          <div style={{fontSize:28}}>📰</div>
          <div>
            <div style={{fontWeight:800,fontSize:17}}>Simulated Daily Brief</div>
            <div style={{fontSize:11,color:"var(--tx2)"}}>{todayStr()} · ⚠️ Educational simulation</div>
          </div>
        </div>
        <div style={{background:"var(--bg3)",borderRadius:"var(--r2)",padding:14,margin:"14px 0"}}>
          {loading?<div style={{display:"flex",gap:8,alignItems:"center"}}><div className="spin"/><span style={{fontSize:12,color:"var(--tx2)"}}>Generating today's brief...</span></div>
          :<p style={{fontSize:13.5,lineHeight:1.8,color:"var(--tx2)"}}>{text}</p>}
        </div>
        <div className="sh-t" style={{marginBottom:10}}>Today's Simulated Movers</div>
        {STOCKS.sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,5).map(s=>{
          const p=prices[s.symbol]||s.price, up=s.change>=0;
          return (
            <div key={s.symbol} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--line)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>{s.logo}</span><div><div style={{fontWeight:700,fontSize:12.5}}>{s.symbol}</div><div style={{fontSize:10.5,color:"var(--tx2)"}}>{s.name.split(" ")[0]}</div></div></div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontFamily:"var(--mono)",fontSize:12}}>${fmt(p)}</span>
                <span style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:12,color:up?"var(--grn2)":"var(--red2)"}}>{fmtPct(s.change)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN APP ──────────────────────────────────────────════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [user,setUser]=useState(null);
  const [email,setEmail]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [selStock,setSelStock]=useState(null);
  const [prices,setPrices]=useState(()=>{const p={};STOCKS.forEach(s=>p[s.symbol]=s.price);return p;});
  const [notif,setNotif]=useState(null);
  const [xpToast,setXpToast]=useState(null);
  const [badgeToast,setBadgeToast]=useState(null);
  const [showBrief,setShowBrief]=useState(false);

  // Live price simulation
  useEffect(()=>{
    const iv=setInterval(()=>{
      setPrices(prev=>{
        const u={...prev};
        STOCKS.forEach(s=>{u[s.symbol]=simulatePrice(prev[s.symbol]||s.price,s.symbol);});
        return u;
      });
    },3000);
    return()=>clearInterval(iv);
  },[]);

  const save=(u,em)=>{
    const db=JSON.parse(localStorage.getItem("ngf3_db")||"{}");
    db[em||email]=u;
    localStorage.setItem("ngf3_db",JSON.stringify(db));
  };

  const addFeed=(u,text,icon,color)=>({...u,activityFeed:[...(u.activityFeed||[]),{text,icon,color,ts:Date.now()}].slice(-25)});
  const addNotif=(u,msg)=>({...u,notifications:[...(u.notifications||[]),{id:Date.now(),msg,read:false,ts:Date.now()}]});

  const evalChallenges=(u,newTrades,newHoldings,newLessons,newGainPct,newSaved,newBigTrades,newNotedTrades,newAiReads)=>{
    const challenges=(u.challenges||BASE_CHALLENGES.map(c=>({...c,progress:0,done:false}))).map(c=>{
      if(c.done)return c;
      let prog=c.progress||0;
      const map={trades:newTrades,holdings:newHoldings,lessons:newLessons,gain_pct:newGainPct,saved_opps:newSaved,watchlist:(u.watchlist||[]).length,big_trades:newBigTrades,noted_trades:newNotedTrades,ai_reads:newAiReads,sectors:Object.keys((u.portfolio||{})).reduce((acc,sym)=>{const s=STOCKS.find(x=>x.symbol===sym);return s?acc.add(s.sector):acc;},new Set()).size};
      if(map[c.metric]!==undefined)prog=Math.max(prog,map[c.metric]);
      const done=prog>=c.target;
      return{...c,progress:prog,done};
    });
    const newDone=challenges.filter((c,i)=>c.done&&!(u.challenges||BASE_CHALLENGES.map(c=>({...c,done:false})))[i]?.done);
    return{challenges,newDone};
  };

  const handleLogin=(u,em)=>{setUser(u);setEmail(em);setPage("dashboard");};

  const handleTrade=(action,stock,shares,price,note)=>{
    if(action==="note"){
      setUser(prev=>{
        const updated={...prev,tradeNotes:{...(prev.tradeNotes||{}),[stock.symbol]:note}};
        save(updated);return updated;
      });
      setNotif("Note saved!");
      return;
    }
    setUser(prev=>{
      let portfolio={...prev.portfolio};
      let balance=prev.balance;
      const cost=shares*price;
      if(action==="buy"){
        if(balance<cost)return prev;
        balance-=cost;
        const ex=portfolio[stock.symbol];
        if(ex){const tot=ex.shares+shares;portfolio[stock.symbol]={shares:tot,avgCost:(ex.shares*ex.avgCost+cost)/tot};}
        else portfolio[stock.symbol]={shares,avgCost:price};
      } else {
        if(!portfolio[stock.symbol]||portfolio[stock.symbol].shares<shares)return prev;
        balance+=cost;
        const ns=portfolio[stock.symbol].shares-shares;
        if(ns===0)delete portfolio[stock.symbol];
        else portfolio[stock.symbol]={...portfolio[stock.symbol],shares:ns};
      }
      const portVal=calcPortfolio(portfolio,prices);
      const history=[...(prev.history||[10000]),balance+portVal].slice(-60);
      const gainPct=((balance+portVal-10000)/10000)*100;
      const bigTrades=(prev.bigTrades||0)+(cost>=1000?1:0);
      const notedTrades=Object.keys(prev.tradeNotes||{}).length;
      const tradeHistory=[...(prev.tradeHistory||[]),{action,symbol:stock.symbol,shares,price,ts:Date.now()}];
      const {challenges,newDone}=evalChallenges({...prev,portfolio},tradeHistory.length,Object.keys(portfolio).length,(prev.completedLessons||[]).length,gainPct,(prev.savedOpps||[]).length,bigTrades,notedTrades,prev.aiReads||0);
      const xpGained=10+newDone.reduce((s,c)=>s+c.xp,0);
      let updated={...prev,balance,portfolio,history,challenges,tradeHistory,bigTrades,xp:(prev.xp||0)+xpGained};
      updated=addFeed(updated,`${action==="buy"?"📈 Bought":"📉 Sold"} ${shares} share${shares>1?"s":""} of ${stock.symbol} (simulated)`,action==="buy"?"📈":"📉",action==="buy"?"var(--grn3)":"var(--red3)");
      if(newDone.length>0){updated=addNotif(updated,`🏅 Challenge complete: "${newDone[0].title}"! +${newDone[0].xp} XP`);setBadgeToast({badge:newDone[0].badge,title:newDone[0].title});}
      save(updated);
      if(xpGained>10)setXpToast(xpGained);
      return updated;
    });
    setNotif(`${action==="buy"?"✓ Bought":"✓ Sold"} ${shares} shares of ${stock.symbol} (simulated)`);
    setSelStock(null);
  };

  const handleWatchlist=(sym)=>{
    setUser(prev=>{
      const wl=prev.watchlist.includes(sym)?prev.watchlist.filter(s=>s!==sym):[...prev.watchlist,sym];
      const updated={...prev,watchlist:wl};
      const {challenges}=evalChallenges(updated,(prev.tradeHistory||[]).length,Object.keys(prev.portfolio).length,(prev.completedLessons||[]).length,0,(prev.savedOpps||[]).length,prev.bigTrades||0,Object.keys(prev.tradeNotes||{}).length,prev.aiReads||0);
      const u2={...updated,challenges};
      save(u2);return u2;
    });
  };

  const handleLessonComplete=(lesson,perfect)=>{
    setUser(prev=>{
      if((prev.completedLessons||[]).includes(lesson.id))return prev;
      const completedLessons=[...(prev.completedLessons||[]),lesson.id];
      const perfectQuizzes=(prev.perfectQuizzes||0)+(perfect?1:0);
      const {challenges,newDone}=evalChallenges({...prev,completedLessons,perfectQuizzes},(prev.tradeHistory||[]).length,Object.keys(prev.portfolio).length,completedLessons.length,0,(prev.savedOpps||[]).length,prev.bigTrades||0,Object.keys(prev.tradeNotes||{}).length,prev.aiReads||0);
      let updated={...prev,completedLessons,perfectQuizzes,xp:(prev.xp||0)+lesson.xp,challenges};
      updated=addFeed(updated,`📚 Completed: "${lesson.title}"`,  "📚","var(--pur3)");
      updated=addNotif(updated,`📚 Lesson complete! "${lesson.title}" +${lesson.xp} XP`);
      if(newDone.length>0)setBadgeToast({badge:newDone[0].badge,title:newDone[0].title});
      save(updated);setXpToast(lesson.xp);return updated;
    });
  };

  const handleMarkAllRead=()=>{
    setUser(prev=>{const u={...prev,notifications:(prev.notifications||[]).map(n=>({...n,read:true}))};save(u);return u;});
  };
  const handleAddGoal=(goal)=>{
    setUser(prev=>{const u={...prev,goals_portfolio:[...(prev.goals_portfolio||[]),goal]};save(u);setNotif("Goal added!");return u;});
  };

  if(!user)return <><style>{CSS}</style><AuthScreen onLogin={handleLogin}/></>;

  const unread=(user.notifications||[]).filter(n=>!n.read).length;
  const portVal=calcPortfolio(user.portfolio,prices);
  const total=user.balance+portVal;
  const {lvl,progress}=getLevel(user.xp||0);

  const NAV=[
    {section:"Main",items:[
      {id:"dashboard",icon:"◈",label:"Dashboard"},
      {id:"markets",icon:"📈",label:"Markets"},
      {id:"portfolio",icon:"💼",label:"Portfolio"},
    ]},
    {section:"Learn & AI",items:[
      {id:"learn",icon:"📚",label:"Learn Hub"},
      {id:"coach",icon:"🤖",label:"AI Coach",badge_new:true},
      {id:"scenarios",icon:"🧪",label:"Simulator"},
    ]},
    {section:"Compete",items:[
      {id:"challenges",icon:"⚡",label:"Challenges"},
      {id:"leaderboard",icon:"🏆",label:"Leaderboard"},
    ]},
    {section:"Explore",items:[
      {id:"mood",      icon:"🌡️", label:"Market Mood"},
      {id:"compare",   icon:"⚖️", label:"Compare Stocks"},
      {id:"tournament",icon:"🏆", label:"Tournaments",badge_new:true},
      {id:"glossary",  icon:"📖", label:"Glossary"},
      {id:"report",    icon:"📋", label:"My Report",badge_new:true},
    ]},
    {section:"Account",items:[
      {id:"notifications",icon:"🔔",label:"Notifications",badge:unread>0?unread:null},
      {id:"profile",icon:"👤",label:"Profile"},
    ]},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Sidebar */}
        <aside className="sb">
          <div className="sb-top">
            <div className="sb-brand">
              <div className="sb-gem">📊</div>
              <div><div className="sb-name">NextGen Finance</div><div className="sb-tag">nextgenfinance.com</div></div>
            </div>
            <div className="sim-pill"><div className="sim-dot"/><div className="sim-text">Simulation Mode</div></div>
          </div>
          <nav className="sb-nav">
            {NAV.map(sec=>(
              <div key={sec.section} className="sb-sec">
                <div className="sb-sec-lbl">{sec.section}</div>
                {sec.items.map(n=>(
                  <div key={n.id} className={`ni ${page===n.id?"on":""}`} onClick={()=>setPage(n.id)}>
                    <span className="ni-ic">{n.icon}</span>
                    {n.label}
                    {n.badge&&<span className="ni-badge">{n.badge}</span>}
                    {n.badge_new&&<span className="ni-new">NEW</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="uc" onClick={()=>setPage("profile")}>
              <Avatar name={user.name} size={34} fontSize={11}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name.split(" ")[0]}</div>
                <div style={{fontSize:10,color:"var(--tx2)"}}>Lvl {lvl} · {fmtUSD(total)}</div>
                <div className="xp-mini"><div className="xp-fill" style={{width:`${progress*100}%`}}/></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main">
          {/* Ticker */}
          <div className="ticker">
            <div className="ticker-in">
              {[...STOCKS,...STOCKS].map((s,i)=>{
                const p=prices[s.symbol]||s.price, up=s.change>=0;
                return (
                  <span key={i} className="tick">
                    <span style={{fontWeight:700}}>{s.logo} {s.symbol}</span>
                    <span style={{color:"var(--tx2)"}}>${fmt(p)}</span>
                    <span style={{color:up?"var(--grn2)":"var(--red2)",fontWeight:700}}>{fmtPct(s.change)}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sim banner */}
          <div className="sim-banner">
            <span style={{fontSize:14}}>⚠️</span>
            <span className="sim-banner-text">SIMULATION PLATFORM — All prices, trades & data are 100% virtual. No real money involved. For educational purposes only.</span>
            <button className="btn btn-ghost btn-sm" style={{marginLeft:"auto",fontSize:11}} onClick={()=>setShowBrief(true)}>📰 Daily Brief</button>
          </div>

          {/* Pages */}
          {page==="dashboard"    &&<Dashboard     user={user} prices={prices} onNav={setPage} onStockClick={setSelStock}/>}
          {page==="markets"      &&<MarketsPage   user={user} stocks={STOCKS} prices={prices} onStockClick={setSelStock}/>}
          {page==="portfolio"    &&<PortfolioPage user={user} prices={prices} onStockClick={setSelStock}/>}
          {page==="learn"        &&<LearnPage     user={user} onComplete={handleLessonComplete}/>}
          {page==="coach"        &&<AICoachPage   user={user} prices={prices}/>}
          {page==="scenarios"    &&<ScenarioPage/>}
          {page==="challenges"   &&<ChallengesPage user={user}/>}
          {page==="leaderboard"  &&<LeaderboardPage user={user} prices={prices}/>}
          {page==="mood"        &&<MoodPage       prices={prices}/>}
          {page==="compare"     &&<ComparePage    prices={prices}/>}
          {page==="tournament"  &&<TournamentPage user={user} prices={prices}/>}
          {page==="glossary"    &&<GlossaryPage/>}
          {page==="report"      &&<ReportPage     user={user} prices={prices}/>}
          {page==="notifications"&&<NotifsPage    user={user} onMarkRead={handleMarkAllRead}/>}
          {page==="profile"      &&<ProfilePage   user={user} onLogout={()=>{setUser(null);setEmail(null);setPage("dashboard");}} onAddGoal={handleAddGoal}/>}
        </main>
      </div>

      {/* Modals */}
      {selStock&&<StockModal stock={selStock} user={user} prices={prices} onClose={()=>setSelStock(null)} onTrade={handleTrade} onWatchlist={handleWatchlist}/>}
      {showBrief&&<DailyBriefModal prices={prices} onClose={()=>setShowBrief(false)}/>}

      {/* Toasts */}
      {notif&&<Notif msg={notif} onClose={()=>setNotif(null)}/>}
      {xpToast&&<XPToast xp={xpToast} onClose={()=>setXpToast(null)}/>}
      {badgeToast&&<BadgeToast badge={badgeToast.badge} title={badgeToast.title} onClose={()=>setBadgeToast(null)}/>}
    </>
  );
}
