# 🐛 Google Calendar 동기화 데이터 표시 문제 디버그 가이드

## 문제 상황
Google Calendar 동기화는 성공했지만 수신함이나 매트릭스에 데이터가 표시되지 않는 경우

---

## 🔍 1단계: 기본 진단

### 브라우저 콘솔 열기
1. **F12** 키 또는 **우클릭 → 검사** 
2. **Console** 탭으로 이동

### 디버그 명령 실행
```javascript
// 현재 작업 상태 확인
app.debugTasks()

// 통합 서비스 상태 확인  
app.debugIntegrations()

// 로컬 스토리지 확인
console.log('LocalStorage tasks:', JSON.parse(localStorage.getItem('tasks') || '[]'))
```

---

## 🔧 2단계: 일반적인 문제와 해결책

### 문제 1: 동기화는 성공했지만 0개 이벤트
**원인:** 캘린더에 향후 30일 내 이벤트가 없음

**해결책:**
```javascript
// Mock 모드로 테스트 데이터 사용
toggleGoogleCalendarSimpleMockMode()

// 또는 캘린더에 테스트 이벤트 추가 후 재동기화
```

### 문제 2: CORS 오류로 동기화 실패
**콘솔 오류:** `Failed to fetch` 또는 `CORS policy`

**해결책:**
1. Mock 모드 사용 (권장)
2. CORS Unblock 확장프로그램 설치
3. 브라우저 확장프로그램 방식

### 문제 3: 이벤트는 가져왔지만 화면에 표시되지 않음
**원인:** 렌더링 문제 또는 필터링 이슈

**해결책:**
```javascript
// 강제 렌더링
app.render()

// 수신함 작업 확인
console.log('Inbox tasks:', app.tasks.filter(t => !t.completed && !t.projectId))

// 외부 소스 작업만 확인
console.log('External tasks:', app.tasks.filter(t => t.source !== 'manual'))
```

---

## 📊 3단계: 상세 진단

### 데이터 흐름 추적
```javascript
// 1. 연결 상태 확인
const calendarIntegration = app.integrationManager.integrations.get('google-calendar')
console.log('Calendar connected:', calendarIntegration.isConnected)
console.log('Calendar URL:', calendarIntegration.calendarUrl)

// 2. 동기화 수동 실행 및 결과 확인
app.syncGoogleCalendar().then(() => {
    console.log('After sync - Total tasks:', app.tasks.length)
    console.log('Calendar tasks:', app.tasks.filter(t => t.source === 'google-calendar'))
})

// 3. UI 렌더링 상태 확인
console.log('Current page elements:')
console.log('Inbox list:', document.getElementById('inbox-task-list'))
console.log('Matrix elements:', document.querySelectorAll('[id$="-list"]'))
```

### Mock 데이터 테스트
```javascript
// Mock 모드 활성화
toggleGoogleCalendarSimpleMockMode()

// Mock 연결 테스트
app.connectGoogleCalendar({
    preventDefault: () => {},
    target: {
        querySelector: () => ({ textContent: 'Test', disabled: false })
    }
})
```

---

## ⚡ 4단계: 즉시 해결 방법

### 방법 1: 페이지 새로고침 후 재시도
```javascript
// 현재 상태 저장 확인
app.saveData()

// 페이지 새로고침 후 다시 동기화
location.reload()
```

### 방법 2: Mock 데이터로 기능 테스트
```javascript
// 1. Mock 모드 활성화
toggleGoogleCalendarSimpleMockMode()

// 2. 가짜 URL로 연결
// 설정 페이지에서: https://calendar.google.com/calendar/ical/test@gmail.com/public/basic.ics

// 3. 동기화 실행
// "동기화" 버튼 클릭

// 4. 결과 확인
app.debugTasks()
```

### 방법 3: 수동으로 테스트 데이터 추가
```javascript
// 직접 캘린더 작업 추가해서 UI 테스트
const testCalendarTask = {
    id: 'test-cal-' + Date.now(),
    name: '테스트 캘린더 이벤트',
    quadrant: 'q1',
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'google-calendar',
    contexts: ['@테스트', '@회의'],
    description: '📅 테스트용 캘린더 이벤트\n📍 테스트 장소\n⏱️ 1시간'
}

app.tasks.push(testCalendarTask)
app.saveData()
app.render()
```

---

## 🎯 5단계: 원인별 해결 매트릭스

| 증상 | 원인 | 해결책 |
|------|------|--------|
| "0개 이벤트 동기화" | 캘린더가 비어있음 | Mock 모드 또는 테스트 이벤트 추가 |
| "CORS 오류" | 브라우저 정책 차단 | CORS Unblock 확장프로그램 |
| "연결 실패" | URL 형식 오류 | iCal URL 형식 확인 |
| "데이터 있지만 UI 없음" | 렌더링 문제 | `app.render()` 강제 실행 |
| "동기화 후 사라짐" | 필터링 문제 | 날짜/우선순위 필터 확인 |

---

## 🔍 6단계: 고급 디버깅

### 네트워크 요청 추적
1. **F12 → Network 탭**
2. 동기화 실행
3. 실패한 요청의 **Response** 확인

### iCal 파싱 테스트
```javascript
// 실제 iCal 데이터 파싱 테스트
const integration = app.integrationManager.integrations.get('google-calendar')
integration.getEvents().then(events => {
    console.log('Raw events:', events)
    events.forEach(event => {
        console.log('Converted task:', integration.convertToGTDTask(event))
    })
})
```

### 로컬스토리지 직접 확인
```javascript
// 저장된 데이터 확인
const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
console.log('Stored tasks:', tasks.length)
console.log('Calendar tasks in storage:', tasks.filter(t => t.source === 'google-calendar'))

// 동기화 히스토리 확인
const syncHistory = JSON.parse(localStorage.getItem('sync_history') || '[]')
console.log('Sync history:', syncHistory.slice(0, 3))
```

---

## ✅ 성공 체크리스트

동기화가 정상 작동하면 다음이 모두 확인되어야 합니다:

- [ ] 콘솔에 "✅ X개의 캘린더 이벤트를 가져왔습니다" 메시지
- [ ] `app.debugTasks()`에서 `google-calendar` 소스 작업 확인
- [ ] 수신함에 📅 아이콘이 있는 작업들 표시
- [ ] 아이젠하워 매트릭스에 캘린더 이벤트 분배
- [ ] 설정 페이지 "동기화 현황"에 숫자 업데이트

---

## 🆘 최후의 수단

모든 방법이 실패하면:

1. **브라우저 캐시 삭제**
2. **시크릿 모드에서 테스트**
3. **다른 브라우저에서 테스트**
4. **Mock 모드로 기능 검증 후 이슈 리포트**

**Mock 모드 테스트 결과:** 모든 기능이 정상 작동한다면 실제 Google Calendar API 접근 문제입니다.