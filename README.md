# 오늘 저녁 뭐 먹지?

사용자 조건에 맞춰 저녁 메뉴 세 가지를 추천하는 정적 웹페이지입니다. `public/`이 배포할 웹 루트이며 API 키나 서버 설정이 필요하지 않습니다.

## 로컬 실행

```bash
python3 -m http.server 8000 --directory public
```

브라우저에서 `http://localhost:8000`에 접속합니다. Windows에서 `python` 명령을 사용할 수도 있습니다.

## GitHub → Cloudflare Pages 자동 배포

1. GitHub에 새 저장소를 만들고 이 폴더의 파일을 `main` 브랜치에 올립니다.
2. Cloudflare 대시보드의 **Workers & Pages → Create application → Pages → Connect to Git**에서 GitHub 저장소를 연결합니다.
3. Framework preset은 **None**, build command는 `exit 0`, build output directory는 `public`, production branch는 `main`으로 설정합니다.
4. 첫 배포가 완료되면 제공된 `*.pages.dev` 주소에서 결과를 확인합니다. 이후 `main` 브랜치에 push할 때마다 Cloudflare Pages가 자동으로 다시 배포합니다.

이미 다른 호스팅으로 공개된 버전과 주소는 별개입니다. 도메인을 옮길 때는 새 배포가 확인된 후 DNS와 공유 링크를 변경하세요.
