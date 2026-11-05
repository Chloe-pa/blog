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

const photoCredit = {
  name: 'Mikhail Nilov',
  profile: 'https://www.pexels.com/@mikhail-nilov/',
  page: 'https://www.pexels.com/photo/a-blue-painted-banana-7674927/',
  license: 'https://www.pexels.com/license/',
};

const mast = (kind) => {
  const listOn = kind === 'list' ? ' is-current' : '';
  const aboutOn = kind === 'about' ? ' is-current' : '';
  return `<header class="mast">
  <a class="brand" href="${url('index.html')}">chloe ha</a>
  <nav class="nav">
    <a href="${url('index.html')}">표지</a>
    <a class="${listOn.trim()}" href="${url('list.html')}">글 목록</a>
    <a class="${aboutOn.trim()}" href="${url('about.html')}">소개</a>
  </nav>
  <p class="mast-date">${esc(dotDate(latest))}</p>
</header>`;
};

const spine = () => `<div class="spine" aria-hidden="true"><span>chloe ha</span><span>블로그</span><span>${new Date().getFullYear()}</span></div>`;

const footer = () => `<footer class="colophon">
  <p>© ${new Date().getFullYear()} chloe ha</p>
  <nav>
    <a href="${url('index.html')}">표지</a>
    <a href="${url('list.html')}">글 목록</a>
    <a href="${url('about.html')}">소개</a>
  </nav>
</footer>`;

const head = (title) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111111">
<title>${esc(title)}</title>
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&family=UnifrakturMaguntia&display=swap">
<link rel="stylesheet" href="${url('style.css')}">
</head>`;

const page = (title, body, kind) => `${head(title)}
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

const rows = posts.map((p, i) => `<li>
  <a href="${url(`posts/${encodeURIComponent(p.slug)}.html`)}">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <span class="when"><time datetime="${esc(p.date)}">${esc(dotDate(p.date))}</time><span>${p.minutes}분</span></span>
    <span class="what"><strong>${esc(p.title)}</strong><span class="desc">${esc(p.description || '')}</span></span>
    <span class="go">읽기</span>
  </a>
</li>`).join('\n');

const spotAt = [
  { x: 0.30, y: 0.36, cls: '' },
  { x: 0.46, y: 0.30, cls: '' },
  { x: 0.78, y: 0.40, cls: 'edge-right' },
];

const spots = posts.map((p, i) => {
  const pos = spotAt[i] || { x: 0.5, y: 0.5, cls: '' };
  return `<a class="spot ${pos.cls}" data-x="${pos.x}" data-y="${pos.y}" href="${url(`posts/${encodeURIComponent(p.slug)}.html`)}"><span class="label">${esc(p.title)}</span></a>`;
}).join('\n');

const aboutSpot = `<a class="spot below" data-x="0.48" data-y="0.16" href="${url('about.html')}"><span class="label">소개</span></a>`;

const home = `${head('chloe ha의 블로그')}
<body class="page-home">
<a class="skip" href="#spots">링크로</a>
<main id="content">
  <div class="stage">
    <picture>
      <source media="(max-width: 800px)" srcset="${url('cover-mobile.webp')}" type="image/webp">
      <source srcset="${url('cover.webp')}" type="image/webp">
      <img src="${url('cover.jpg')}" alt="파란 바나나가 노란 색면과 빨간 색면 위에 놓여 있다." width="1920" height="2880" fetchpriority="high">
    </picture>
    <nav class="spots" id="spots" aria-label="숨은 링크">
      ${spots}
      ${aboutSpot}
    </nav>
  </div>
  <p class="sign">
    <span class="sign-name">chloe ha</span>
    <span class="sign-credit"><a href="${photoCredit.profile}" rel="noopener noreferrer">Photo ${esc(photoCredit.name)}</a> · <a href="${photoCredit.page}" rel="noopener noreferrer">Pexels</a></span>
  </p>
  <p class="hint"><span class="blink" aria-hidden="true"></span><span class="for-fine">look closer</span><span class="for-coarse">눌러 보세요</span></p>
</main>
<div class="cursor" aria-hidden="true"></div>
<noscript>
  <nav class="noscript-nav">
    ${posts.map((p) => `<a href="${url(`posts/${encodeURIComponent(p.slug)}.html`)}">${esc(p.title)}</a>`).join('')}
    <a href="${url('about.html')}">소개</a>
    <a href="${url('list.html')}">글 목록</a>
  </nav>
</noscript>
<script>
document.documentElement.classList.add('js');
(function () {
  var img = document.querySelector('.stage img');
  var spots = document.querySelectorAll('.spot');
  var cur = document.querySelector('.cursor');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function place() {
    if (!img.naturalWidth) return;
    var r = img.getBoundingClientRect();
    var scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    var ox = (r.width - dw) * 0.5;
    var oy = (r.height - dh) * 0.18;
    spots.forEach(function (s) {
      s.style.left = (ox + parseFloat(s.dataset.x) * dw) + 'px';
      s.style.top = (oy + parseFloat(s.dataset.y) * dh) + 'px';
    });
  }
  if (img.complete) place();
  img.addEventListener('load', place);
  window.addEventListener('resize', place);
  if (fine) {
    window.addEventListener('mousemove', function (e) {
      cur.style.setProperty('--x', e.clientX + 'px');
      cur.style.setProperty('--y', e.clientY + 'px');
      cur.classList.add('on');
    });
    window.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) cur.classList.remove('on');
    });
    spots.forEach(function (s) {
      s.addEventListener('pointerenter', function () { document.body.classList.add('hot'); });
      s.addEventListener('pointerleave', function () { document.body.classList.remove('hot'); });
    });
  }
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (coarse) {
    spots.forEach(function (s) {
      s.addEventListener('click', function (e) {
        if (!document.body.classList.contains('revealed')) {
          e.preventDefault();
          document.body.classList.add('revealed');
        }
      });
    });
  }
  document.querySelector('.stage').addEventListener('click', function (e) {
    if (e.target.closest('.spot')) return;
    if (coarse) document.body.classList.toggle('revealed');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) document.body.classList.toggle('revealed');
  });
})();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(out, 'index.html'), home);

const list = `<section class="index-section">
  <div class="index-head">
    <h2>최근 글</h2>
    <p><a href="${url('index.html')}">표지</a> · 최신순 · ${posts.length}편</p>
  </div>
  <ol class="index">${rows}</ol>
</section>`;
fs.writeFileSync(path.join(out, 'list.html'), page('글 목록', list, 'list'));

for (const p of posts) {
  const lede = p.description ? `<p class="lede">${esc(p.description)}</p>` : '';
  const body = `<div class="frame">
  <article class="sheet">
    <p class="meta"><time datetime="${esc(p.date)}">${esc(longDate(p.date))}</time><span>${p.minutes}분 읽기</span></p>
    <h1>${misreg(p.title, 'tight')}</h1>
    ${lede}
    <div class="prose">${decorate(marked.parse(p.body))}</div>
  </article>
  <p class="back"><a href="${url('list.html')}">← 글 목록</a><a href="${url('index.html')}">표지</a></p>
</div>`;
  fs.writeFileSync(path.join(out, 'posts', `${p.slug}.html`), page(p.title, body, 'post'));
}

const about = `<div class="frame">
  <article class="sheet">
    <p class="eyebrow"><span class="blackletter">Note</span></p>
    <h1>${misreg('소개', 'tight')}</h1>
    <div class="prose">${decorate(marked.parse(fs.readFileSync('about.md', 'utf8')))}</div>
    <p class="photo-credit">표지 사진 <a href="${photoCredit.profile}" rel="noopener noreferrer">${esc(photoCredit.name)}</a> · <a href="${photoCredit.page}" rel="noopener noreferrer">Pexels</a> · <a href="${photoCredit.license}" rel="noopener noreferrer">License</a></p>
  </article>
</div>`;
fs.writeFileSync(path.join(out, 'about.html'), page('소개', about, 'about'));

console.log(`빌드 완료: 글 ${posts.length}개 (base: ${base || '(relative)'})`);
