// Google Calendar Simple Mock Integration for CORS Testing

class GoogleCalendarSimpleMockIntegration {
    constructor() {
        this.isConnected = false;
        this.calendarId = null;
        this.calendarUrl = null;
        this.calendarName = null;
        
        // Mock iCal 데이터 (실제 Google Calendar 형식)
        this.mockICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:테스트 캘린더
X-WR-TIMEZONE:Asia/Seoul
BEGIN:VEVENT
DTSTART:${this.formatICalDateTime(this.getUpcomingDateTime(2))}
DTEND:${this.formatICalDateTime(this.getUpcomingDateTime(3))}
DTSTAMP:20240120T120000Z
UID:event001@google.com
CREATED:20240115T090000Z
LAST-MODIFIED:20240118T140000Z
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:중요한 팀 회의
DESCRIPTION:분기별 성과 검토 및 다음 분기 계획 수립\\n준비물: 성과 보고서\\, 프로젝트 현황
LOCATION:본사 대회의실 A
END:VEVENT
BEGIN:VEVENT
DTSTART:${this.formatICalDateTime(this.getUpcomingDateTime(26))}
DTEND:${this.formatICalDateTime(this.getUpcomingDateTime(27))}
DTSTAMP:20240120T120000Z
UID:event002@google.com
CREATED:20240112T100000Z
LAST-MODIFIED:20240117T160000Z
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:고객사 프레젠테이션
DESCRIPTION:신규 프로젝트 제안 발표\\n참석자: 고객사 임원진 3명
LOCATION:강남역 스타벅스
END:VEVENT
BEGIN:VEVENT
DTSTART:${this.formatICalDateTime(this.getUpcomingDateTime(50))}
DTEND:${this.formatICalDateTime(this.getUpcomingDateTime(52))}
DTSTAMP:20240120T120000Z
UID:event003@google.com
CREATED:20240110T080000Z
LAST-MODIFIED:20240116T120000Z
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:병원 진료 예약
DESCRIPTION:정기 건강검진\\n담당의: 김의사
LOCATION:서울대학교병원 내과
END:VEVENT
BEGIN:VEVENT
DTSTART:${this.formatICalDateTime(this.getUpcomingDateTime(74))}
DTEND:${this.formatICalDateTime(this.getUpcomingDateTime(76))}
DTSTAMP:20240120T120000Z
UID:event004@google.com
CREATED:20240108T140000Z
LAST-MODIFIED:20240115T100000Z
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:온라인 교육 - React 고급 과정
DESCRIPTION:Zoom 링크: https://zoom.us/j/123456789\\n패스워드: react2024
END:VEVENT
BEGIN:VEVENT
DTSTART:${this.formatICalDateTime(this.getUpcomingDateTime(98))}
DTEND:${this.formatICalDateTime(this.getUpcomingDateTime(104))}
DTSTAMP:20240120T120000Z
UID:event005@google.com
CREATED:20240105T200000Z
LAST-MODIFIED:20240114T180000Z
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:주말 가족 모임
DESCRIPTION:할머니 생신잔치\\n선물: 꽃바구니 준비
LOCATION:할머니댁
END:VEVENT
END:VCALENDAR`;
    }

    // 미래 시간 생성 헬퍼 (시간 단위)
    getUpcomingDateTime(hoursFromNow) {
        const date = new Date();
        date.setHours(date.getHours() + hoursFromNow);
        return date;
    }

    // iCal 날짜 형식 변환
    formatICalDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }

    // Mock 연결 (CORS 문제 시뮬레이션)
    async connect(calendarInfo) {
        try {
            // URL 유효성 검사
            if (!calendarInfo.url || !calendarInfo.url.includes('google.com')) {
                return {
                    success: false,
                    message: '올바른 Google Calendar URL이 아닙니다.'
                };
            }

            // Mock 연결 성공 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.calendarId = 'mock-calendar@gmail.com';
            this.calendarUrl = calendarInfo.url;
            this.calendarName = calendarInfo.name || 'Mock Google Calendar';
            this.isConnected = true;
            this.saveConnectionStatus();
            
            return {
                success: true,
                message: 'Google Calendar Mock 연결 성공! (CORS 해결 테스트용)'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Mock 이벤트 가져오기
    async getEvents() {
        if (!this.isConnected) {
            throw new Error('캘린더에 연결되어 있지 않습니다.');
        }

        try {
            // 실제 네트워크 지연 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const events = this.parseICalData(this.mockICalData);
            return events.filter(event => event !== null);
            
        } catch (error) {
            console.error('Mock Calendar events fetch error:', error);
            throw error;
        }
    }

    // 실제 GoogleCalendarSimpleIntegration의 메서드들 재사용
    extractCalendarId(url) {
        return GoogleCalendarSimpleIntegration.prototype.extractCalendarId.call(this, url);
    }

    buildICalUrl(calendarId) {
        return GoogleCalendarSimpleIntegration.prototype.buildICalUrl.call(this, calendarId);
    }

    parseICalData(icalData) {
        return GoogleCalendarSimpleIntegration.prototype.parseICalData.call(this, icalData);
    }

    parseEventProperty(event, property, value) {
        return GoogleCalendarSimpleIntegration.prototype.parseEventProperty.call(this, event, property, value);
    }

    unescapeICalText(text) {
        return GoogleCalendarSimpleIntegration.prototype.unescapeICalText.call(this, text);
    }

    parseICalDateTime(dateTimeStr, isDateOnly = false) {
        return GoogleCalendarSimpleIntegration.prototype.parseICalDateTime.call(this, dateTimeStr, isDateOnly);
    }

    processEvent(rawEvent) {
        return GoogleCalendarSimpleIntegration.prototype.processEvent.call(this, rawEvent);
    }

    buildEventUrl(eventId) {
        return GoogleCalendarSimpleIntegration.prototype.buildEventUrl.call(this, eventId);
    }

    convertToGTDTask(calendarEvent) {
        return GoogleCalendarSimpleIntegration.prototype.convertToGTDTask.call(this, calendarEvent);
    }

    inferContextsFromEvent(event) {
        return GoogleCalendarSimpleIntegration.prototype.inferContextsFromEvent.call(this, event);
    }

    detectEventType(event) {
        return GoogleCalendarSimpleIntegration.prototype.detectEventType.call(this, event);
    }

    buildEventDescription(event) {
        return GoogleCalendarSimpleIntegration.prototype.buildEventDescription.call(this, event);
    }

    calculateEventDuration(event) {
        return GoogleCalendarSimpleIntegration.prototype.calculateEventDuration.call(this, event);
    }

    syncTasks() {
        return GoogleCalendarSimpleIntegration.prototype.syncTasks.call(this);
    }

    saveConnectionStatus() {
        localStorage.setItem('google_calendar_simple_mock_connected', this.isConnected);
        if (this.calendarId) {
            localStorage.setItem('google_calendar_simple_mock_id', this.calendarId);
        }
        if (this.calendarUrl) {
            localStorage.setItem('google_calendar_simple_mock_url', this.calendarUrl);
        }
        if (this.calendarName) {
            localStorage.setItem('google_calendar_simple_mock_name', this.calendarName);
        }
    }

    restoreConnection() {
        this.isConnected = localStorage.getItem('google_calendar_simple_mock_connected') === 'true';
        this.calendarId = localStorage.getItem('google_calendar_simple_mock_id');
        this.calendarUrl = localStorage.getItem('google_calendar_simple_mock_url');
        this.calendarName = localStorage.getItem('google_calendar_simple_mock_name');
    }

    disconnect() {
        this.calendarId = null;
        this.calendarUrl = null;
        this.calendarName = null;
        this.isConnected = false;
        
        localStorage.removeItem('google_calendar_simple_mock_connected');
        localStorage.removeItem('google_calendar_simple_mock_id');
        localStorage.removeItem('google_calendar_simple_mock_url');
        localStorage.removeItem('google_calendar_simple_mock_name');
    }

    generateSyncStats(syncResult) {
        return GoogleCalendarSimpleIntegration.prototype.generateSyncStats.call(this, syncResult);
    }
}

// Mock 모드 토글 함수
window.toggleGoogleCalendarSimpleMockMode = function() {
    if (window.confirm('Google Calendar Mock 모드로 전환하시겠습니까?\\n\\nCORS 오류로 실제 캘린더 접근이 안 될 때 사용합니다.\\n실제 Google Calendar iCal 형식의 Mock 데이터로 테스트할 수 있습니다.')) {
        // Mock 인스턴스로 교체
        if (app && app.integrationManager) {
            app.integrationManager.integrations.set('google-calendar', new GoogleCalendarSimpleMockIntegration());
            alert('Google Calendar Mock 모드가 활성화되었습니다!\\n\\n이제 임의의 Google Calendar URL로 테스트할 수 있습니다.\\n실제 iCal 형식의 5개 이벤트가 포함되어 있습니다.');
        }
    }
};

// 개발자 콘솔에 안내 메시지
console.log(`
📅 Google Calendar CORS 해결 방법
=================================

CORS 오류 발생 시 다음 중 하나를 선택하세요:

🔧 임시 해결책:
1. Chrome 확장프로그램 'CORS Unblock' 설치
2. toggleGoogleCalendarSimpleMockMode() 실행하여 Mock 테스트

🛠️ 완전 해결책:
1. 서버사이드 프록시 구현
2. 브라우저 확장프로그램으로 CORS 비활성화
3. Chrome을 --disable-web-security 플래그로 실행

Mock 데이터에는 실제 Google Calendar 형식의 5개 이벤트가 포함되어 있습니다.
`);

window.GoogleCalendarSimpleMockIntegration = GoogleCalendarSimpleMockIntegration;