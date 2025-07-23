# 🔒 CORS 문제 완전 해결 가이드

## 문제 상황
```
Access to fetch at 'https://calendar.google.com/calendar/ical/...' 
has been blocked by CORS policy
```

Google Calendar의 iCal URL에 브라우저에서 직접 접근하면 CORS(Cross-Origin Resource Sharing) 정책에 의해 차단됩니다.

---

## 🚀 즉시 사용 가능한 해결 방법

### 방법 1: Mock 모드 사용 (가장 쉬움)
```javascript
// 브라우저 콘솔에서 실행
toggleGoogleCalendarSimpleMockMode()
```

**장점:**
- ✅ 즉시 사용 가능
- ✅ 실제 Google Calendar 형식의 데이터로 테스트
- ✅ 모든 기능 완전 동작

**사용법:**
1. 설정 페이지에서 "Calendar Mock" 버튼 클릭
2. 임의의 Google Calendar URL 입력
3. 5개의 실제 이벤트로 즉시 테스트 시작

---

### 방법 2: CORS Unblock 확장프로그램 (권장)

**Chrome 확장프로그램 설치:**
1. Chrome 웹스토어에서 "CORS Unblock" 검색
2. 확장프로그램 설치 및 활성화
3. 실제 Google Calendar URL로 테스트

**Firefox 확장프로그램:**
- "CORS Everywhere" 확장프로그램 사용

---

### 방법 3: Chrome 플래그 실행
```bash
# Windows
chrome.exe --user-data-dir="c:/temp/chrome" --disable-web-security --disable-features=VizDisplayCompositor

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir="/tmp/chrome" --disable-web-security --disable-features=VizDisplayCompositor

# Linux
google-chrome --user-data-dir="/tmp/chrome" --disable-web-security --disable-features=VizDisplayCompositor
```

⚠️ **주의**: 이 방법은 보안 위험이 있으므로 테스트 목적으로만 사용하세요.

---

## 🛠️ 개발용 완전 해결 방법

### 방법 4: 로컬 프록시 서버 구축

**Node.js 기반 간단 프록시:**

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/calendar-proxy', async (req, res) => {
    try {
        const calendarUrl = req.query.url;
        const response = await fetch(calendarUrl);
        const icalData = await response.text();
        res.setHeader('Content-Type', 'text/calendar');
        res.send(icalData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Calendar proxy server running on http://localhost:3001');
});
```

**사용법:**
```bash
npm install express cors node-fetch
node proxy-server.js
```

**프론트엔드에서 사용:**
```javascript
const proxyUrl = `http://localhost:3001/calendar-proxy?url=${encodeURIComponent(calendarUrl)}`;
```

---

## 🌐 프로덕션 해결 방법

### 방법 5: 서버사이드 통합

**백엔드 API 엔드포인트:**
```python
# Python Flask 예시
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/api/calendar/sync', methods=['POST'])
def sync_calendar():
    calendar_url = request.json.get('url')
    
    try:
        response = requests.get(calendar_url)
        response.raise_for_status()
        
        ical_data = response.text
        # iCal 데이터 파싱 및 처리
        
        return jsonify({
            'success': True,
            'data': parsed_events
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 📱 현재 구현된 자동 해결책

코드에 이미 **3단계 폴백 시스템**이 구현되어 있습니다:

```javascript
// 자동으로 여러 프록시 서비스를 시도
const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(calendarUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`,
    `https://cors-anywhere.herokuapp.com/${calendarUrl}`
];
```

**작동 순서:**
1. allorigins.win 프록시 시도
2. 실패 시 corsproxy.io 시도  
3. 최종적으로 cors-anywhere 시도
4. 모든 프록시 실패 시 사용자에게 해결 방법 안내

---

## 🎯 권장 사용법 (상황별)

### 개발/테스트 단계
```
1순위: Mock 모드 (toggleGoogleCalendarSimpleMockMode)
2순위: CORS Unblock 확장프로그램
3순위: Chrome --disable-web-security 플래그
```

### 데모/프리젠테이션
```
1순위: Mock 모드 (안정적이고 예측 가능)
2순위: 미리 설정된 CORS 확장프로그램
```

### 실제 서비스 운영
```
1순위: 백엔드 API 통합
2순위: 서버사이드 프록시
3순위: 안정적인 CORS 프록시 서비스
```

---

## ✅ 현재 상황 해결책

**당장 테스트하고 싶다면:**
1. 설정 페이지에서 **"Calendar Mock"** 버튼 클릭
2. 아무 Google Calendar URL이나 입력 (형식만 맞으면 됨)
3. 5개의 실제 이벤트로 모든 기능 테스트 완료

**실제 캘린더 연동을 원한다면:**
1. **CORS Unblock** 확장프로그램 설치
2. 확장프로그램 활성화
3. 실제 Google Calendar iCal URL 사용

---

## 🔍 문제 진단

브라우저 콘솔에서 다음 정보를 확인하세요:

```javascript
// 현재 사용 중인 프록시 확인
console.log('Trying proxy: ...');

// CORS 오류 상세 정보
Network 탭에서 실패한 요청의 Response Headers 확인
```

**일반적인 오류 메시지와 해결책:**
- `Failed to fetch` → 네트워크 연결 확인
- `CORS policy` → 위 해결 방법 중 하나 적용
- `404 Not Found` → Google Calendar 공개 설정 확인

---

**🎉 결론: Mock 모드를 사용하면 즉시 모든 기능을 테스트할 수 있습니다!**