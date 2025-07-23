# 🔧 Clarity Matrix 문제해결 가이드

## SSL/HTTPS 오류 해결방법

### 문제 증상
- 수신함, 프로젝트, 완료 페이지에서 "SSL 오류" 또는 "이 사이트에 연결할 수 없음" 메시지
- 브라우저가 HTTP 대신 HTTPS로 접속을 시도

### 원인
브라우저의 HSTS (HTTP Strict Transport Security) 캐시 때문에 발생하는 문제입니다.

### 해결방법

#### 1. Chrome 브라우저
1. 주소창에 `chrome://net-internals/#hsts` 입력
2. "Delete domain security policies" 섹션에서 `localhost` 입력
3. "Delete" 버튼 클릭
4. 브라우저 새로고침

#### 2. Firefox 브라우저  
1. 주소창에 `about:config` 입력
2. `security.tls.insecure_salt_warnings` 검색
3. false로 설정
4. 브라우저 재시작

#### 3. Safari 브라우저
1. 개발자 메뉴 → 비어있음 → 캐시 지우기
2. 또는 시크릿 모드에서 접속

#### 4. 모든 브라우저 공통 방법
- **시크릿/프라이빗 모드**에서 `http://localhost:3000` 접속
- **하드 리프레시**: `Ctrl+Shift+R` (Windows/Linux) 또는 `Cmd+Shift+R` (Mac)
- **브라우저 완전 재시작**

#### 5. 대체 포트 사용
서버를 다른 포트로 실행:
```bash
PORT=3001 npm run dev
```
그리고 `http://localhost:3001`로 접속

### 확인 방법
- 개발자 도구(F12) → Network 탭에서 요청이 HTTP로 가는지 확인
- CSS 파일이 정상적으로 로드되는지 확인

## 현재 서버 상태
- 개발 모드: 모든 HTTPS 강제 기능 비활성화됨
- 캐시: 비활성화됨 (no-cache 헤더)
- 보안 헤더: 개발 편의를 위해 제거됨

## 추가 문제시 연락처
서버 로그 확인: `npm run dev`로 실행 시 콘솔 메시지 확인