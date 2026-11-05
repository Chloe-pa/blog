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

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = (title, body) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="${url('style.css')}"></head><body><header><div class="wrap"><a class="logo" href="${url('index.html')}">chloe ha의 블로그</a><nav><a href="${url('index.html')}">글 목록</a><a href="${url('about.html')}">소개</a></nav></div></header><main class="wrap">${body}</main><footer>© ${new Date().getFullYear()} chloe ha</footer></body></html>`;
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
const posts = fs.readdirSync('posts').filter((f) => f.endsWith('.md')).map((f) => ({ slug: f.replace(/\.md$/, ''), ...parse(path.join('posts', f)) })).sort((a, b) => b.date.localeCompare(a.date));
for (const p of posts) {
  fs.writeFileSync(path.join(out, 'posts', `${p.slug}.html`), page(p.title, `<article><h1>${esc(p.title)}</h1><p class="meta">${esc(p.date)}</p>${marked.parse(p.body)}</article><p><a href="${url('index.html')}">← 글 목록으로</a></p>`));
}
fs.writeFileSync(path.join(out, 'index.html'), page('chloe ha의 블로그', `<h1>최근 글</h1><ul class="post-list">${posts.map((p) => `<li><h2><a href="${url(`posts/${p.slug}.html`)}">${esc(p.title)}</a></h2><div class="meta">${esc(p.date)}</div><p>${esc(p.description || '')}</p></li>`).join('')}</ul>`));
fs.writeFileSync(path.join(out, 'about.html'), page('소개', `<h1>소개</h1>${marked.parse(fs.readFileSync('about.md', 'utf8'))}`));
console.log(`빌드 완료: 글 ${posts.length}개 (base: ${base || '(relative)'})`);
