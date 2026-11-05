# chloe ha의 블로그

마크다운으로 글을 쓰고, `main`에 푸시하면 GitHub Actions가 정적 HTML을 만들어 [https://chloe-pa.github.io/blog/](https://chloe-pa.github.io/blog/)에 배포합니다.

## 새 글 추가

`posts/YYYY-MM-DD-slug.md` 파일을 만듭니다. 파일 이름은 날짜와 슬러그로 짓고, 맨 위에는 `title`, `date`, `description` 프론트매터를 넣습니다.

```markdown
---
title: 글 제목
date: YYYY-MM-DD
description: 목록에 보일 짧은 설명
---

본문을 여기에 작성합니다.
```

소개 문구는 `about.md`를 수정합니다. 글 목록은 날짜가 최신인 글이 위로 옵니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 `npm ci`와 `node build.js`를 실행하고, 만들어진 `dist/`를 GitHub Pages로 배포합니다. 사이트 주소는 `/blog/` 하위 경로입니다. 배포가 동작하려면 저장소 Settings > Pages > Source가 **GitHub Actions**여야 합니다.

로컬에서 같은 경로로 빌드하려면:

```bash
npm ci
BASE_PATH=/blog node build.js
```
