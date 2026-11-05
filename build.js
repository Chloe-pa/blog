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

const dotDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  return m ? `${m[1]}.${m[2]}.${m[3]}` : String(iso || '');
};

const longDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : String(iso || '');
};

const readingMinutes = (markdown) => {
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~\-]/g, ' ');
  return Math.max(1, Math.ceil(text.replace(/\s/g, '').length / 500));
};

const misreg = (text, cls) => {
  const t = esc(text);
  return `<span class="misreg ${cls}"><span class="ghost ghost-pink" aria-hidden="true">${t}</span><span class="ghost ghost-blue" aria-hidden="true">${t}</span><span class="ink">${t}</span></span>`;
};

const posts = fs.readdirSync('posts').filter((f) => f.endsWith('.md')).map((f) => {
  const parsed = parse(path.join('posts', f));
  return { slug: f.replace(/\.md$/, ''), ...parsed, minutes: readingMinutes(parsed.body) };
}).sort((a, b) => String(b.date).localeCompare(String(a.date)));

const latest = posts[0]?.date || '';

const ticker = () => {
  const bit = posts.map((p) => `<span class="tick">${esc(p.title)}</span><span class="sep">/</span>`).join('');
  const run = bit.repeat(2);
  return `<div class="marquee" aria-hidden="true"><div class="marquee-track">${run}${run}</div></div>`;
};

const mast = (kind) => {
  const listOn = kind === 'home' || kind === 'post' ? ' is-current' : '';
  const aboutOn = kind === 'about' ? ' is-current' : '';
  return `<header class="mast">
  <a class="brand" href="${url('index.html')}">chloe ha</a>
  <nav class="nav">
    <a class="${listOn.trim()}" href="${url('index.html')}">글 목록</a>
    <a class="${aboutOn.trim()}" href="${url('about.html')}">소개</a>
  </nav>
  <p class="mast-date">${esc(dotDate(latest))}</p>
</header>`;
};

const spine = () => `<div class="spine" aria-hidden="true"><span>chloe ha</span><span>블로그</span><span>${new Date().getFullYear()}</span></div>`;

const footer = () => `<footer class="colophon">
  <p>© ${new Date().getFullYear()} chloe ha</p>
  <nav>
    <a href="${url('index.html')}">글 목록</a>
    <a href="${url('about.html')}">소개</a>
  </nav>
</footer>`;

const page = (title, body, kind) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f3efe6">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0e0e0c">
<title>${esc(title)}</title>
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&family=UnifrakturMaguntia&display=swap">
<link rel="stylesheet" href="${url('style.css')}">
</head>
<body class="page-${kind}">
<a class="skip" href="#content">본문으로</a>
<div class="grain" aria-hidden="true"></div>
${spine()}
${ticker()}
${mast(kind)}
<main id="content">${body}</main>
${footer()}
</body>
</html>`;

const stampDate = (() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(latest).trim());
  return m ? `${m[2]}<br>${m[3]}` : '';
})();

const rows = posts.map((p, i) => `<li>
  <a href="${url(`posts/${encodeURIComponent(p.slug)}.html`)}">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <span class="when"><time datetime="${esc(p.date)}">${esc(dotDate(p.date))}</time><span>${p.minutes}분</span></span>
    <span class="what"><strong>${esc(p.title)}</strong><span class="desc">${esc(p.description || '')}</span></span>
    <span class="go">읽기</span>
  </a>
</li>`).join('\n');

const count = String(posts.length).padStart(2, '0');

const home = `<section class="cover">
  <div class="posters" aria-hidden="true">
    <div class="poster poster-blue"></div>
    <div class="poster poster-pink"></div>
    <div class="tape"></div>
    <div class="stamp"><span>${stampDate}</span></div>
  </div>
  <div class="cover-copy">
    <p class="eyebrow"><span class="blackletter">blog</span><span class="eyebrow-date">${esc(dotDate(latest))}</span></p>
    <h1>
      ${misreg('chloe ha', 'latin')}
      <span class="of">의</span>
      ${misreg('블로그', 'hangul')}
    </h1>
    <p class="tagline"><span>한 줄 소개가 들어갈 자리입니다.</span></p>
  </div>
  <p class="count-block"><span class="count-num">${count}</span><span class="count-label">편</span></p>
</section>
<section class="index-section">
  <div class="index-head">
    <h2>최근 글</h2>
    <p>최신순 · ${posts.length}편</p>
  </div>
  <ol class="index">${rows}</ol>
</section>`;

fs.writeFileSync(path.join(out, 'index.html'), page('chloe ha의 블로그', home, 'home'));

for (const p of posts) {
  const lede = p.description ? `<p class="lede">${esc(p.description)}</p>` : '';
  const body = `<div class="frame">
  <article class="sheet">
    <p class="meta"><time datetime="${esc(p.date)}">${esc(longDate(p.date))}</time><span>${p.minutes}분 읽기</span></p>
    <h1>${misreg(p.title, 'tight')}</h1>
    ${lede}
    <div class="prose">${decorate(marked.parse(p.body))}</div>
  </article>
  <p class="back"><a href="${url('index.html')}">← 글 목록으로</a></p>
</div>`;
  fs.writeFileSync(path.join(out, 'posts', `${p.slug}.html`), page(p.title, body, 'post'));
}

const about = `<div class="frame">
  <article class="sheet">
    <p class="eyebrow"><span class="blackletter">Note</span></p>
    <h1>${misreg('소개', 'tight')}</h1>
    <div class="prose">${decorate(marked.parse(fs.readFileSync('about.md', 'utf8')))}</div>
  </article>
</div>`;
fs.writeFileSync(path.join(out, 'about.html'), page('소개', about, 'about'));

console.log(`빌드 완료: 글 ${posts.length}개 (base: ${base || '(relative)'})`);
