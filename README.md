# 🎯 Clarity Matrix - GTD 통합 관리 시스템

Getting Things Done (GTD) 방법론을 기반으로 한 웹 기반 작업 관리 시스템입니다.

## ✨ 주요 기능

### 📋 GTD 핵심 기능
- **수신함**: 모든 작업을 한 곳에서 수집
- **오늘 할 일**: 시간 기반 작업 필터링
- **아이젠하워 매트릭스**: 4분면 우선순위 관리
- **프로젝트 관리**: 다중 프로젝트 구조
- **완료 목록**: 성과 추적 및 분석

### 🔗 외부 도구 통합
- **📋 Todoist**: 양방향 동기화
- **📅 Google Calendar**: 일정 → 작업 자동 변환
- **🎯 JIRA**: 이슈 → GTD 작업 매핑

### 🛠️ 고급 기능
- **지능적 컨텍스트 추론**: 자동 태그 생성
- **드래그 앤 드롭**: 직관적인 우선순위 조정
- **설정 지속성**: 자동 백업 및 복원
- **데이터 내보내기/가져오기**: 완전한 이식성

---

## 🚀 빠른 시작

### 방법 1: 웹 서버로 실행 (권장)

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 접속
# http://localhost:3000
```

### 방법 2: 파일로 직접 열기

```bash
# 브라우저에서 직접 열기
open design/main.html  # Mac
start design/main.html # Windows
```

---

## 📦 설치 및 배포

### 로컬 개발 환경

```bash
# 저장소 클론
git clone <repository-url>
cd clarity-matrix-gtd

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 프로덕션 배포

```bash
# 프로덕션 서버 실행
npm start

# 또는 PM2로 데몬 실행
npm install -g pm2
pm2 start server.js --name "clarity-matrix"
pm2 startup
pm2 save
```

### Docker 배포 (선택사항)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Docker 이미지 빌드
docker build -t clarity-matrix .

# 컨테이너 실행
docker run -p 3000:3000 clarity-matrix
```

---

## 🔧 외부 통합 설정

### 📋 Todoist 연동

1. [Todoist 설정](https://todoist.com/app/settings/integrations)에서 API 토큰 생성
2. 앱 설정에서 "Todoist 연결" 클릭
3. API 토큰 입력 후 연결

**Mock 테스트**: 개발자 도구에서 "Todoist Mock" 버튼 클릭

### 📅 Google Calendar 연동

1. Google Calendar에서 공유할 캘린더 선택
2. "설정 및 공유" → "공개로 사용 설정"
3. "캘린더 통합" → "공개 주소(iCal 형식)" URL 복사
4. 앱 설정에서 URL 입력

### 🎯 JIRA 연동

1. [Atlassian 계정 설정](https://id.atlassian.com/manage-profile/security/api-tokens)에서 API 토큰 생성
2. 앱 설정에서 JIRA 정보 입력:
   - 베이스 URL: `https://your-domain.atlassian.net`
   - 사용자명: 이메일 주소
   - API 토큰: 생성한 토큰
   - 프로젝트 키: 예) PROJ, DEV

**Mock 테스트**: 개발자 도구에서 "JIRA Mock" 버튼 클릭

---

## 📖 사용 가이드

### GTD 워크플로우

1. **수집**: 모든 작업을 수신함에 입력
2. **정리**: 아이젠하워 매트릭스로 우선순위 분류
3. **검토**: "오늘 할 일"에서 실행할 작업 확인  
4. **실행**: 컨텍스트별로 작업 수행
5. **완료**: 성과 추적 및 회고

### 아이젠하워 매트릭스

- **Q1 (긴급 & 중요)**: 즉시 처리 필요
- **Q2 (중요)**: 계획적 처리 - 가장 중요한 영역
- **Q3 (긴급)**: 위임하거나 빠르게 처리
- **Q4 (나중에)**: 제거하거나 여유시간에 처리

### 통합 동기화 전략

- **자동 동기화**: 5-15분 간격으로 설정
- **수동 동기화**: 필요시 즉시 실행
- **충돌 해결**: 수동 입력 우선, 최신 데이터 유지

---

## 🛡️ 보안 및 프라이버시

### 데이터 저장
- **로컬 저장**: 모든 데이터는 브라우저 localStorage에 저장
- **서버 무관**: 서버는 정적 파일만 제공, 데이터 저장 안함
- **암호화**: API 토큰은 브라우저에서만 사용

### API 접근 권한
- **Todoist**: 읽기/쓰기 권한 (양방향 동기화)
- **Google Calendar**: 읽기 전용 (공개 캘린더만)
- **JIRA**: 프로젝트 범위 읽기/쓰기

### 백업 및 복원
- **자동 백업**: 설정 변경 시 자동 백업 생성
- **수동 내보내기**: JSON 파일로 모든 데이터 내보내기
- **설정 복원**: 백업 파일에서 설정 복원 가능

---

## 🔍 문제 해결

### CORS 오류 해결
```
Error: Access to fetch has been blocked by CORS policy
```
**해결책**:
1. Mock 모드 사용 (가장 쉬움)
2. CORS Unblock 브라우저 확장프로그램 설치
3. Chrome `--disable-web-security` 플래그로 실행

### 동기화 문제 해결
```javascript
// 브라우저 콘솔에서 디버그
app.debugTasks()           // 현재 작업 상태 확인
app.debugIntegrations()    // 통합 서비스 상태 확인
app.showStorageInfo()      // 저장소 정보 확인
```

### 데이터 복구
```javascript
// 백업에서 설정 복원
app.restoreSettingsFromBackup()

// 모든 설정 초기화
app.storageManager.resetAllSettings()
```

---

## 📁 프로젝트 구조

```
clarity-matrix-gtd/
├── design/                 # HTML 페이지들
│   ├── main.html           # 메인 대시보드
│   ├── inbox.html          # 수신함
│   ├── today.html          # 오늘 할 일
│   ├── eisenhower_matrix.html  # 4분면 매트릭스
│   └── settings.html       # 설정 및 통합 관리
├── assets/
│   ├── css/
│   │   └── style.css       # 전체 스타일시트
│   └── js/
│       ├── app.js          # 메인 애플리케이션
│       ├── storage-manager.js  # 설정 관리자
│       └── integrations/   # 외부 통합 모듈들
├── server.js               # Express 웹 서버
├── package.json            # 프로젝트 설정
└── README.md              # 이 파일
```

---

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 🙏 감사의 말

- **Getting Things Done**: David Allen의 GTD 방법론
- **아이젠하워 매트릭스**: Dwight D. Eisenhower의 우선순위 관리법
- **외부 API**: Todoist, Google Calendar, JIRA의 훌륭한 API 지원

---

## 📞 지원 및 문의

- **이슈 신고**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **문서**: `/docs` 폴더 참조

**Happy Productivity! 🚀**