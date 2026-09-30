# 오늘 저녁 뭐 먹지?

네 단계의 카드 선택으로 한국의 날씨와 계절에 어울리는 저녁 메뉴 세 가지를 추천하는 정적 웹페이지입니다. `public/`이 배포할 웹 루트이며 API 키나 서버 설정이 필요하지 않습니다.

첫 화면에는 계절별 추천 원칙과 참고 사항을 안내하고, `guide.html`에는 24절기·날씨·맛·기분을 조합하는 기준을 설명합니다. `menu-library.html`에서는 추천 풀의 메인 메뉴 98종과 대표 재료를 검색할 수 있으며, `privacy.html`에는 메뉴 선택, 제휴 문의, 비회원 댓글, Google AdSense의 정보 처리 안내가 있습니다. 검색 노출을 위해 `robots.txt`와 `sitemap.xml`도 `public/`에 둡니다.

AdSense 스크립트는 긴 편집 가이드(`guide.html`)에만 둡니다. 추천 선택·결과·제휴 문의·댓글 화면과 단순 메뉴 색인 및 개인정보 안내에는 광고 스크립트를 넣지 않습니다. 광고 위치나 Auto ads 설정을 바꿀 때는 콘텐츠를 읽는 일을 방해하지 않는지 다시 확인하세요. 비회원 댓글은 Cloudflare D1에 저장되어 공개되며, 부적절한 글은 D1에서 삭제할 수 있습니다.

## 추천 흐름

1. 계절: 봄 / 여름 / 가을 / 겨울
2. 날씨: 추움 / 더움 / 보통 / 비
3. 당기는 맛: 추천에 맡기기 / 매콤함 / 기름지고 고소함 / 담백함
4. 오늘 기분: 스트레스 받음 / 울적함 / 지침 / 무난함 / 기분 좋은 일 / 위로가 필요함

실제 날씨와 명시적인 맛 선택을 우선합니다. 더운 날에는 냉면·메밀면·콩국수, 추운 날에는 뜨끈한 국물, 비 오는 날에는 전·부침개와 비 오는 날 어울리는 메인 메뉴를 추천합니다. 계절별 후보를 먼저 배치하고, 여름에는 순대국밥·설렁탕처럼 무거운 뜨거운 국물 메뉴를 제외합니다. 스트레스 받은 날에는 매콤한 음식, 울적한 날에는 따뜻하고 든든한 메뉴, 기분 좋은 날에는 특별한 메뉴, 위로가 필요한 날에는 편안한 메뉴를 우선합니다. 계절은 사용자가 선택하며 실제 날씨나 절기 날짜를 자동 조회하지 않습니다.

한식과 한국에서 접하기 쉬운 일식·중식·태국식·베트남 음식·멕시코 음식·양식 등 98종의 메인 메뉴를 17개 추천 음식군으로 구성했습니다. 곁들임이나 반찬 성격의 음식과 재료만 바뀐 비슷한 메뉴는 후보에서 제외했습니다. 술과 함께 즐기기 좋은 구이·찜·전골, 계절 음식과 속이 불편한 날을 위한 죽 메뉴도 포함합니다. 추천 결과는 각 메인 메뉴 사진을 배경으로 한 포토카드로 보여줍니다.

질문과 메뉴 데이터 및 추천 규칙은 `public/recommendations.js`, 화면 동작은 `public/app.js`, 반응형 스타일은 `public/styles.css`에 있습니다. 메뉴 선택 답변은 서버에 보내지 않습니다. 메뉴별 하트 수와 비회원 댓글은 Cloudflare Pages Functions가 D1에 익명으로 저장합니다. 하트 API는 `functions/api/reactions.js`, 댓글 API는 `functions/api/comments.js`이며, 테이블 SQL은 `migrations/0001_menu_reactions.sql`과 `migrations/0002_dinner_comments.sql`에 있습니다. Pages 프로젝트에서 D1 바인딩 변수 `REACTIONS_DB`를 연결하고 두 SQL 파일을 순서대로 실행해야 합니다.

공개 주소: https://dinnermenuweb.pages.dev/

## 로컬 실행

```bash
python3 -m http.server 8000 --directory public
```

브라우저에서 `http://localhost:8000`에 접속합니다. Windows에서 `python` 명령을 사용할 수도 있습니다.

위 Python 정적 서버에서는 Pages Function이 실행되지 않으므로 메뉴 하트와 댓글 API를 사용할 수 없습니다. 이를 확인하려면 Cloudflare Pages Functions와 `REACTIONS_DB` 바인딩이 설정된 Pages 환경이 필요합니다.

## GitHub → Cloudflare Pages 자동 배포

1. GitHub에 새 저장소를 만들고 이 폴더의 파일을 `main` 브랜치에 올립니다.
2. Cloudflare 대시보드의 **Workers & Pages → Create application → Pages → Connect to Git**에서 GitHub 저장소를 연결합니다.
3. Framework preset은 **None**, build command는 `exit 0`, build output directory는 `public`, production branch는 `main`으로 설정합니다.
4. 첫 배포가 완료되면 제공된 `*.pages.dev` 주소에서 결과를 확인합니다. 이후 `main` 브랜치에 push할 때마다 Cloudflare Pages가 자동으로 다시 배포합니다.

하트 집계와 비회원 댓글에는 Cloudflare D1이 필요합니다. Cloudflare 대시보드에서 D1 데이터베이스를 만든 뒤 Pages 프로젝트의 **Settings → Bindings → Add → D1 database binding**에서 변수 이름 `REACTIONS_DB`로 연결하고, D1 콘솔에서 `migrations/0001_menu_reactions.sql`과 `migrations/0002_dinner_comments.sql`을 순서대로 실행한 다음 Pages를 다시 배포합니다.

이미 다른 호스팅으로 공개된 버전과 주소는 별개입니다. 도메인을 옮길 때는 새 배포가 확인된 후 DNS와 공유 링크를 변경하세요.
