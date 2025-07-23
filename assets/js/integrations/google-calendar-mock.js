// Google Calendar Mock Data for Testing

class GoogleCalendarMockIntegration {
    constructor() {
        this.isConnected = false;
        this.clientId = null;
        this.apiKey = null;
        
        // 테스트용 Mock 캘린더 데이터
        this.mockCalendars = [
            { 
                id: 'primary', 
                summary: '내 캘린더', 
                primary: true,
                backgroundColor: '#3788d8'
            },
            { 
                id: 'work_calendar', 
                summary: '업무 캘린더',
                backgroundColor: '#d50000'
            },
            { 
                id: 'personal_calendar', 
                summary: '개인 일정',
                backgroundColor: '#7cb342'
            }
        ];

        // 테스트용 Mock 이벤트 데이터
        this.mockEvents = [
            {
                id: 'event_001',
                summary: '팀 회의 - 주간 리뷰',
                description: '지난 주 성과 검토 및 이번 주 계획 수립',
                location: '대회의실',
                start: {
                    dateTime: this.getUpcomingDateTime(2), // 2시간 후
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(3), // 3시간 후
                    timeZone: 'Asia/Seoul'
                },
                attendees: [
                    { email: 'manager@company.com', responseStatus: 'accepted' },
                    { email: 'colleague1@company.com', responseStatus: 'accepted' },
                    { email: 'colleague2@company.com', responseStatus: 'needsAction' }
                ],
                created: '2024-01-10T09:00:00Z',
                updated: '2024-01-15T10:30:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_001'
            },
            {
                id: 'event_002',
                summary: '집중 개발 시간',
                description: '신규 기능 개발에 집중하는 시간\n방해 금지 모드',
                start: {
                    dateTime: this.getUpcomingDateTime(24), // 내일
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(26), // 내일 +2시간
                    timeZone: 'Asia/Seoul'
                },
                created: '2024-01-12T14:00:00Z',
                updated: '2024-01-15T16:20:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_002'
            },
            {
                id: 'event_003',
                summary: '병원 진료',
                description: '정기 건강검진',
                location: '서울대학교병원',
                start: {
                    dateTime: this.getUpcomingDateTime(48), // 2일 후
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(50), // 2일 후 +2시간
                    timeZone: 'Asia/Seoul'
                },
                created: '2024-01-05T08:30:00Z',
                updated: '2024-01-08T09:15:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_003'
            },
            {
                id: 'event_004',
                summary: '온라인 강의 - JavaScript 고급 패턴',
                description: 'Zoom 링크: https://zoom.us/j/123456789\n비밀번호: 1234',
                start: {
                    dateTime: this.getUpcomingDateTime(72), // 3일 후
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(74), // 3일 후 +2시간
                    timeZone: 'Asia/Seoul'
                },
                created: '2024-01-01T20:00:00Z',
                updated: '2024-01-10T21:30:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_004'
            },
            {
                id: 'event_005',
                summary: '클라이언트 미팅',
                description: '신규 프로젝트 제안서 발표\n준비물: 노트북, 제안서 인쇄본',
                location: '강남역 카페베네',
                start: {
                    dateTime: this.getUpcomingDateTime(96), // 4일 후
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(98), // 4일 후 +2시간
                    timeZone: 'Asia/Seoul'
                },
                attendees: [
                    { email: 'client@example.com', responseStatus: 'accepted' }
                ],
                created: '2024-01-08T11:00:00Z',
                updated: '2024-01-14T13:45:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_005'
            },
            {
                id: 'event_006',
                summary: '친구 생일 파티',
                description: '🎉 생일 축하 파티\n선물: 책',
                location: '홍대 펜션',
                start: {
                    dateTime: this.getUpcomingDateTime(144), // 6일 후
                    timeZone: 'Asia/Seoul'
                },
                end: {
                    dateTime: this.getUpcomingDateTime(150), // 6일 후 +6시간
                    timeZone: 'Asia/Seoul'
                },
                created: '2023-12-20T16:30:00Z',
                updated: '2024-01-12T18:00:00Z',
                htmlLink: 'https://calendar.google.com/event?eid=mock_006'
            }
        ];
    }

    // 미래 시간 생성 헬퍼
    getUpcomingDateTime(hoursFromNow) {
        const date = new Date();
        date.setHours(date.getHours() + hoursFromNow);
        return date.toISOString();
    }

    // Mock 연결
    async connect(credentials) {
        if (!credentials.clientId || !credentials.apiKey) {
            return {
                success: false,
                message: 'Client ID와 API Key가 필요합니다.'
            };
        }

        if (credentials.clientId.length < 10 || credentials.apiKey.length < 10) {
            return {
                success: false,
                message: 'Client ID와 API Key가 너무 짧습니다. (테스트용 Mock)'
            };
        }

        // 성공적인 연결 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
        
        this.clientId = credentials.clientId;
        this.apiKey = credentials.apiKey;
        this.isConnected = true;
        this.saveConnectionStatus();
        
        return {
            success: true,
            message: 'Google Calendar Mock 연결 성공! (테스트 모드)'
        };
    }

    // Mock 캘린더 목록 가져오기
    async getCalendars() {
        if (!this.isConnected) {
            throw new Error('연결되지 않음');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...this.mockCalendars];
    }

    // Mock 이벤트 가져오기
    async getEvents(calendarId = 'primary', timeMin = null, timeMax = null) {
        if (!this.isConnected) {
            throw new Error('연결되지 않음');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 시간 필터링 시뮬레이션
        let filteredEvents = [...this.mockEvents];
        
        if (timeMin) {
            const minTime = new Date(timeMin);
            filteredEvents = filteredEvents.filter(event => 
                new Date(event.start.dateTime) >= minTime
            );
        }
        
        if (timeMax) {
            const maxTime = new Date(timeMax);
            filteredEvents = filteredEvents.filter(event => 
                new Date(event.start.dateTime) <= maxTime
            );
        }
        
        return filteredEvents;
    }

    // 실제 GoogleCalendarIntegration과 동일한 메서드들
    saveConnectionStatus() {
        localStorage.setItem('google_calendar_mock_connected', this.isConnected);
        if (this.clientId) {
            localStorage.setItem('google_calendar_mock_client_id', this.clientId);
        }
        if (this.apiKey) {
            localStorage.setItem('google_calendar_mock_api_key', this.apiKey);
        }
    }

    restoreConnection() {
        this.isConnected = localStorage.getItem('google_calendar_mock_connected') === 'true';
        this.clientId = localStorage.getItem('google_calendar_mock_client_id');
        this.apiKey = localStorage.getItem('google_calendar_mock_api_key');
    }

    disconnect() {
        this.clientId = null;
        this.apiKey = null;
        this.isConnected = false;
        localStorage.removeItem('google_calendar_mock_connected');
        localStorage.removeItem('google_calendar_mock_client_id');
        localStorage.removeItem('google_calendar_mock_api_key');
    }

    // GoogleCalendarIntegration의 다른 메서드들 재사용
    convertToGTDTask(calendarEvent, calendarName) {
        return GoogleCalendarIntegration.prototype.convertToGTDTask.call(this, calendarEvent, calendarName);
    }

    inferContextsFromEvent(event) {
        return GoogleCalendarIntegration.prototype.inferContextsFromEvent.call(this, event);
    }

    detectEventType(event) {
        return GoogleCalendarIntegration.prototype.detectEventType.call(this, event);
    }

    buildEventDescription(event) {
        return GoogleCalendarIntegration.prototype.buildEventDescription.call(this, event);
    }

    calculateEventDuration(event) {
        return GoogleCalendarIntegration.prototype.calculateEventDuration.call(this, event);
    }

    async syncTasks() {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            const calendars = await this.getCalendars();
            const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
            
            const events = await this.getEvents(primaryCalendar.id);
            
            const gtdTasks = events
                .filter(event => event.summary)
                .map(event => this.convertToGTDTask(event, primaryCalendar.summary));

            return {
                success: true,
                tasks: gtdTasks,
                count: gtdTasks.length,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Google Calendar mock sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    // Mock 이벤트 생성
    async createEvent(clarityTask) {
        if (!this.isConnected) {
            throw new Error('Google Calendar Mock에 연결되어 있지 않습니다.');
        }

        // Mock 생성 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 700));

        const mockCalendarEvent = {
            id: `mock_${Date.now()}`,
            summary: clarityTask.name,
            description: clarityTask.description || '',
            start: {
                dateTime: clarityTask.dueDate || new Date().toISOString(),
                timeZone: 'Asia/Seoul'
            },
            end: {
                dateTime: clarityTask.dueDate ? 
                    new Date(new Date(clarityTask.dueDate).getTime() + 60 * 60 * 1000).toISOString() :
                    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                timeZone: 'Asia/Seoul'
            },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            htmlLink: `https://calendar.google.com/event?eid=mock_${Date.now()}`
        };

        // Mock 데이터에 추가
        this.mockEvents.push(mockCalendarEvent);

        return {
            success: true,
            calendarEvent: mockCalendarEvent,
            message: 'Mock Google Calendar에 이벤트가 생성되었습니다.'
        };
    }

    convertFromGTDTask(clarityTask) {
        return GoogleCalendarIntegration.prototype.convertFromGTDTask.call(this, clarityTask);
    }

    generateSyncStats(syncResult) {
        return GoogleCalendarIntegration.prototype.generateSyncStats.call(this, syncResult);
    }
}

// Mock 모드 토글 함수
window.toggleGoogleCalendarMockMode = function() {
    if (window.confirm('Google Calendar Mock 모드로 전환하시겠습니까?\\n실제 Google API가 작동하지 않을 때 사용하세요.')) {
        // Mock 인스턴스로 교체
        if (app && app.integrationManager) {
            app.integrationManager.integrations.set('google-calendar', new GoogleCalendarMockIntegration());
            alert('Google Calendar Mock 모드가 활성화되었습니다.\\n이제 임의의 Client ID와 API Key(10글자 이상)로 테스트할 수 있습니다.');
        }
    }
};

// 개발자 콘솔에 Mock 모드 활성화 안내
console.log(`
📅 Google Calendar 통합 테스트 도구
====================================

Google API 설정이 복잡하면 Mock 모드를 사용하세요:
1. toggleGoogleCalendarMockMode() 실행
2. 설정에서 임의의 Client ID와 API Key(10글자 이상) 입력
3. 테스트 데이터로 통합 기능 테스트

Mock 데이터:
- 3개의 캘린더 (내 캘린더, 업무, 개인)  
- 6개의 테스트 이벤트 (향후 일주일 일정)
- 다양한 이벤트 유형과 컨텍스트
`);

window.GoogleCalendarMockIntegration = GoogleCalendarMockIntegration;