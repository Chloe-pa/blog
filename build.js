// 사용법: node build.js  → dist/ 생성
// BASE_PATH: 사이트가 서빙되는 경로. GitHub Pages 프로젝트 사이트는 /blog
// 로컬에서 도메인 루트로 미리 보려면 BASE_PATH= node build.js
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const base = (process.env.BASE_PATH ?? '/blog').replace(/\/$/, '');
const url = (p) => {
  const rel = String(p).replace(/^\.\//, '').replace(/^\//, '');
  return base ? `${base}/${rel}` : rel;
};

const out = 'dist';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'posts'), { recursive: true });
for (const name of fs.readdirSync('static')) {
  const src = path.join('static', name);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(out, name));
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = String(lang || '').trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9_+-]/g, '');
      const label = language ? `<span class="code-lang">${esc(language)}</span>` : '';
      const cls = language ? ` class="language-${language}"` : '';
      return `<pre class="codeblock">${label}<code${cls}>${esc(text)}</code></pre>\n`;
    },
  },
});

const decorate = (html) => html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, inner) => {
  const cls = /⚠️|✏️/.test(inner) ? 'banner' : 'quote';
  return `<blockquote class="${cls}">${inner}</blockquote>`;
});

const parse = (f) => {
  const t = fs.readFileSync(f, 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${f}: front matter(---)가 필요합니다`);
  const meta = {};
  m[1].split('\n').filter(Boolean).forEach((l) => {
    const i = l.indexOf(':');
    if (i === -1) throw new Error(`${f}: front matter 형식 오류: ${l}`);
    meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  return { ...meta, body: m[2] };
};

const formatDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return String(iso || '');
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
};

const readingMinutes = (markdown) => {
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~\-]/g, ' ');
  const chars = text.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(chars / 500));
};

const leaf = (cls) => `<svg class="leaf ${cls}" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 70 C 40 40, 10 30, 16 12 C 36 16, 62 28, 58 50 C 54 64, 44 70, 40 70 Z" fill="#7dce55"/><path d="M40 68 C 40 40, 28 28, 18 16" stroke="#2f7a34" fill="none" stroke-width="2" stroke-linecap="round"/></svg>`;

const atmosphere = () => `<div class="atmosphere" aria-hidden="true"><div class="sky-fill"></div><div class="stars"></div><div class="blob blob-a"></div><div class="blob blob-b"></div><div class="blob blob-sun"></div><div class="sun"></div><div class="cloud cloud-1"></div><div class="cloud cloud-2"></div><div class="cloud cloud-3"></div>${leaf('leaf-1')}${leaf('leaf-2')}<span class="bubble b1"></span><span class="bubble b2"></span><span class="bubble b3"></span><span class="bubble b4"></span><span class="bubble b5"></span><span class="bubble b6"></span><span class="drop d1"></span><span class="drop d2"></span><span class="drop d3"></span></div>`;

const heroLand = () => `<div class="hero-land" aria-hidden="true"><svg viewBox="0 0 1440 240" preserveAspectRatio="xMidYMax slice"><path d="M0 90 C 180 20, 360 140, 560 80 C 780 10, 980 150, 1200 70 C 1320 30, 1400 80, 1440 55 L 1440 240 L 0 240 Z" fill="var(--hill)"/><path d="M0 150 C 220 100, 420 190, 700 140 C 980 90, 1200 180, 1440 120 L 1440 240 L 0 240 Z" fill="var(--hill-dark)"/><path d="M0 190 C 240 168, 480 214, 720 186 C 1000 154, 1240 210, 1440 176 L 1440 240 L 0 240 Z" fill="var(--water)"/><g fill="#fff" opacity=".9"><circle cx="180" cy="176" r="5"/><circle cx="210" cy="186" r="3.5"/><circle cx="148" cy="188" r="3"/></g><g fill="#ffd4e4" opacity=".95"><circle cx="260" cy="184" r="5"/><circle cx="286" cy="194" r="3.5"/></g><g fill="#ffe38a"><circle cx="1120" cy="168" r="4.5"/><circle cx="1148" cy="180" r="3"/></g></svg></div>`;

const coverMeadow = (i) => `<svg class="cover-svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sk${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd4ff"/><stop offset="1" stop-color="#e9fff4"/></linearGradient><radialGradient id="su${i}" cx="35%" cy="35%" r="65%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#ffe992"/><stop offset="1" stop-color="#ffc94a"/></radialGradient></defs><rect width="640" height="400" fill="url(#sk${i})"/><circle cx="500" cy="96" r="78" fill="#ffe992" opacity=".35"/><circle cx="500" cy="96" r="44" fill="url(#su${i})"/><g fill="#fff"><ellipse cx="150" cy="120" rx="58" ry="30"/><ellipse cx="198" cy="108" rx="40" ry="26"/><ellipse cx="112" cy="116" rx="32" ry="22"/><ellipse cx="390" cy="78" rx="36" ry="18"/><ellipse cx="424" cy="70" rx="22" ry="14"/></g><path d="M0 250 C 120 200, 230 300, 360 240 C 480 184, 540 280, 640 220 L 640 400 L 0 400 Z" fill="#8ed45a"/><path d="M0 318 C 150 270, 280 360, 430 310 C 530 276, 590 330, 640 300 L 640 400 L 0 400 Z" fill="#3f9e48"/><g fill="#fff"><circle cx="120" cy="338" r="8"/><circle cx="156" cy="356" r="5"/><circle cx="92" cy="358" r="4"/></g><g fill="#ffd0e0"><circle cx="210" cy="348" r="7"/><circle cx="242" cy="364" r="4"/></g><g fill="#fff" opacity=".7"><circle cx="70" cy="190" r="11"/><circle cx="88" cy="200" r="5"/></g></svg>`;

const coverLake = (i) => `<svg class="cover-svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="lk${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ecbff"/><stop offset=".55" stop-color="#d8fbff"/><stop offset="1" stop-color="#8fe7f2"/></linearGradient></defs><rect width="640" height="400" fill="url(#lk${i})"/><circle cx="120" cy="90" r="64" fill="#fff3b0" opacity=".45"/><circle cx="120" cy="90" r="34" fill="#fff6c8"/><g fill="#fff" opacity=".95"><ellipse cx="430" cy="100" rx="62" ry="28"/><ellipse cx="486" cy="90" rx="36" ry="22"/><ellipse cx="388" cy="96" rx="30" ry="18"/></g><path d="M0 210 C 140 170, 240 230, 360 190 C 500 140, 560 200, 640 170 L 640 250 L 0 250 Z" fill="#6fbf63"/><path d="M0 248 L 640 248 L 640 400 L 0 400 Z" fill="#7ad7ea"/><path d="M0 268 C 160 250, 300 292, 460 264 C 560 246, 600 270, 640 258 L 640 400 L 0 400 Z" fill="#b8f4ff" opacity=".55"/><ellipse cx="120" cy="300" rx="26" ry="8" fill="#fff" opacity=".45"/><g fill="#fff" opacity=".75"><circle cx="300" cy="300" r="6"/><circle cx="318" cy="312" r="3"/><circle cx="480" cy="286" r="5"/><circle cx="496" cy="298" r="2.5"/></g></svg>`;

const coverLeaves = (i) => `<svg class="cover-svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="lf${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9fff0"/><stop offset="1" stop-color="#9eecc8"/></linearGradient></defs><rect width="640" height="400" fill="url(#lf${i})"/><circle cx="480" cy="80" r="70" fill="#fff" opacity=".45"/><g fill="#5cbf63"><path d="M210 300 C 210 180, 70 140, 90 60 C 170 80, 300 140, 280 230 C 268 280, 236 300, 210 300 Z"/><path d="M400 320 C 430 200, 560 150, 590 70 C 500 100, 390 180, 410 270 C 418 300, 408 318, 400 320 Z"/></g><g fill="#8ee07a"><path d="M320 340 C 330 220, 230 160, 200 80 C 290 110, 420 190, 390 290 C 380 320, 346 340, 320 340 Z"/></g><g fill="none" stroke="#217a38" stroke-width="3" stroke-linecap="round"><path d="M210 292 C 200 180, 120 120, 96 72"/><path d="M330 330 C 340 210, 250 140, 210 92"/><path d="M408 310 C 450 200, 540 140, 574 84"/></g><g fill="#fff" opacity=".85"><circle cx="150" cy="150" r="8"/><circle cx="168" cy="162" r="4"/><circle cx="470" cy="180" r="7"/><circle cx="250" cy="120" r="5"/><circle cx="520" cy="240" r="6"/></g><circle cx="90" cy="250" r="16" fill="#fff" opacity=".35"/></svg>`;

const covers = [coverMeadow, coverLake, coverLeaves];

const pills = (date, minutes) => `<div class="meta"><time class="pill" datetime="${esc(date)}">${esc(formatDate(date))}</time><span class="pill">${minutes}분 읽기</span></div>`;

const page = (title, body, kind) => {
  const year = new Date().getFullYear();
  const homeOn = kind === 'home' || kind === 'post' ? ' is-current' : '';
  const aboutOn = kind === 'about' ? ' is-current' : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#7ec8ff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#071426">
<title>${esc(title)}</title>
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${url('style.css')}">
</head>
<body class="page-${kind}">
<a class="skip" href="#content">본문으로</a>
${atmosphere()}
<div class="page">
<header class="site-header">
  <div class="wrap">
    <div class="glass header-glass">
      <a class="logo" href="${url('index.html')}"><span class="logo-orb" aria-hidden="true"></span><span>chloe ha</span></a>
      <nav class="nav">
        <a class="btn btn-glass${homeOn}" href="${url('index.html')}">글 목록</a>
        <a class="btn btn-glass${aboutOn}" href="${url('about.html')}">소개</a>
      </nav>
    </div>
  </div>
</header>
<main id="content">${body}</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="glass footer-glass">
      <div>
        <p class="footer-name">chloe ha</p>
        <p class="footer-copy">© ${year} chloe ha</p>
      </div>
      <nav class="footer-nav">
        <a href="${url('index.html')}">글 목록</a>
        <a href="${url('about.html')}">소개</a>
      </nav>
    </div>
  </div>
</footer>
</div>
</body>
</html>`;
};

const posts = fs.readdirSync('posts').filter((f) => f.endsWith('.md')).map((f) => {
  const parsed = parse(path.join('posts', f));
  return {
    slug: f.replace(/\.md$/, ''),
    ...parsed,
    minutes: readingMinutes(parsed.body),
  };
}).sort((a, b) => String(b.date).localeCompare(String(a.date)));

for (const p of posts) {
  const lede = p.description ? `<p class="lede">${esc(p.description)}</p>` : '';
  const body = `<article class="narrow glass post-sheet">
    ${pills(p.date, p.minutes)}
    <h1>${esc(p.title)}</h1>
    ${lede}
    <div class="prose">${decorate(marked.parse(p.body))}</div>
  </article>
  <p class="back narrow"><a class="btn btn-glass" href="${url('index.html')}">← 글 목록으로</a></p>`;
  fs.writeFileSync(path.join(out, 'posts', `${p.slug}.html`), page(p.title, body, 'post'));
}

const cards = posts.map((p, i) => `<a class="pin" href="${url(`posts/${encodeURIComponent(p.slug)}.html`)}">
  <div class="pin-cover">${covers[i % covers.length](i)}</div>
  <div class="pin-body">
    ${pills(p.date, p.minutes)}
    <h2>${esc(p.title)}</h2>
    <p>${esc(p.description || '')}</p>
    <span class="card-cta">읽어보기</span>
  </div>
</a>`).join('\n');

const home = `<section class="hero">
  <div class="wrap">
    <div class="glass hero-glass">
      <p class="kicker"><span class="logo-orb small" aria-hidden="true"></span> 블로그</p>
      <h1>chloe ha의 블로그</h1>
      <p class="tagline">한 줄 소개가 들어갈 자리입니다.</p>
      <div class="hero-actions">
        <a class="btn btn-green" href="#posts">글 둘러보기</a>
        <a class="btn btn-glass" href="${url('about.html')}">소개</a>
      </div>
    </div>
  </div>
  ${heroLand()}
</section>
<section id="posts" class="posts">
  <div class="wrap">
    <div class="section-head">
      <h2>최근 글</h2>
      <span class="pill">${posts.length}편</span>
    </div>
    <div class="pin-grid">${cards}</div>
  </div>
</section>`;

fs.writeFileSync(path.join(out, 'index.html'), page('chloe ha의 블로그', home, 'home'));

const about = `<article class="narrow glass about-sheet">
  <p class="kicker"><span class="logo-orb small" aria-hidden="true"></span> 소개</p>
  <h1>소개</h1>
  <div class="prose">${decorate(marked.parse(fs.readFileSync('about.md', 'utf8')))}</div>
</article>`;
fs.writeFileSync(path.join(out, 'about.html'), page('소개', about, 'about'));

console.log(`빌드 완료: 글 ${posts.length}개 (base: ${base || '(relative)'})`);
