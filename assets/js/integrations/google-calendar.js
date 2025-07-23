// Google Calendar Integration Module

class GoogleCalendarIntegration {
    constructor() {
        this.clientId = null;
        this.apiKey = null;
        this.isConnected = false;
        this.accessToken = null;
        this.refreshToken = null;
        
        // Google Calendar API 설정
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
        
        this.gapi = null;
        this.tokenClient = null;
    }

    // Google API 초기화
    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined') {
                reject(new Error('Google API 라이브러리가 로드되지 않았습니다.'));
                return;
            }

            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: this.clientId,
                        discoveryDocs: [this.discoveryDoc],
                        scope: this.scopes
                    });
                    
                    this.gapi = gapi;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // OAuth 연결
    async connect(credentials) {
        try {
            this.clientId = credentials.clientId;
            this.apiKey = credentials.apiKey;

            if (!this.clientId || !this.apiKey) {
                return {
                    success: false,
                    message: 'Client ID와 API Key가 필요합니다.'
                };
            }

            // Google API 초기화
            await this.initializeGoogleAPI();

            // OAuth 인증
            const authInstance = gapi.auth2.getAuthInstance();
            
            if (authInstance.isSignedIn.get()) {
                // 이미 로그인된 상태
                this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
                this.isConnected = true;
            } else {
                // 로그인 필요
                const user = await authInstance.signIn();
                this.accessToken = user.getAuthResponse().access_token;
                this.isConnected = true;
            }

            this.saveConnectionStatus();
            return {
                success: true,
                message: 'Google Calendar 연결 성공!'
            };

        } catch (error) {
            console.error('Google Calendar connection error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 연결 상태 저장
    saveConnectionStatus() {
        localStorage.setItem('google_calendar_connected', this.isConnected);
        if (this.accessToken) {
            localStorage.setItem('google_calendar_token', this.accessToken);
        }
        if (this.clientId) {
            localStorage.setItem('google_calendar_client_id', this.clientId);
        }
        if (this.apiKey) {
            localStorage.setItem('google_calendar_api_key', this.apiKey);
        }
    }

    // 연결 상태 복원
    restoreConnection() {
        this.isConnected = localStorage.getItem('google_calendar_connected') === 'true';
        this.accessToken = localStorage.getItem('google_calendar_token');
        this.clientId = localStorage.getItem('google_calendar_client_id');
        this.apiKey = localStorage.getItem('google_calendar_api_key');
    }

    // 캘린더 목록 가져오기
    async getCalendars() {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            const response = await gapi.client.calendar.calendarList.list();
            return response.result.items || [];
        } catch (error) {
            console.error('Google Calendar list fetch error:', error);
            throw error;
        }
    }

    // 이벤트 가져오기 (지정된 기간)
    async getEvents(calendarId = 'primary', timeMin = null, timeMax = null) {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            // 기본값: 오늘부터 30일간
            if (!timeMin) {
                timeMin = new Date().toISOString();
            }
            if (!timeMax) {
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 30);
                timeMax = maxDate.toISOString();
            }

            const response = await gapi.client.calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin,
                timeMax: timeMax,
                showDeleted: false,
                singleEvents: true,
                maxResults: 250,
                orderBy: 'startTime'
            });

            return response.result.items || [];
        } catch (error) {
            console.error('Google Calendar events fetch error:', error);
            throw error;
        }
    }

    // 이벤트를 GTD 작업으로 변환
    convertToGTDTask(calendarEvent, calendarName = 'Google Calendar') {
        const now = new Date();
        const startTime = new Date(calendarEvent.start.dateTime || calendarEvent.start.date);
        const endTime = new Date(calendarEvent.end.dateTime || calendarEvent.end.date);
        
        // 시간 기반 우선순위 결정
        let quadrant = 'q2'; // 기본적으로 중요하지만 긴급하지 않음
        
        const hoursUntilEvent = (startTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilEvent <= 2) {
            quadrant = 'q1'; // 2시간 이내 = 긴급&중요
        } else if (hoursUntilEvent <= 24) {
            quadrant = calendarEvent.location ? 'q1' : 'q3'; // 24시간 이내, 장소있음=중요
        }

        // 컨텍스트 추론
        const contexts = this.inferContextsFromEvent(calendarEvent);

        return {
            id: `calendar-${calendarEvent.id}`,
            name: calendarEvent.summary || '제목 없는 일정',
            description: this.buildEventDescription(calendarEvent),
            quadrant: quadrant,
            completed: false,
            createdAt: calendarEvent.created || new Date().toISOString(),
            updatedAt: calendarEvent.updated || new Date().toISOString(),
            dueDate: calendarEvent.start.dateTime || calendarEvent.start.date,
            startTime: calendarEvent.start.dateTime || calendarEvent.start.date,
            endTime: calendarEvent.end.dateTime || calendarEvent.end.date,
            location: calendarEvent.location,
            attendees: calendarEvent.attendees?.map(a => a.email) || [],
            calendar: calendarName,
            contexts: contexts,
            source: 'google-calendar',
            externalId: calendarEvent.id,
            externalUrl: calendarEvent.htmlLink,
            eventType: this.detectEventType(calendarEvent),
            originalData: calendarEvent
        };
    }

    // 이벤트에서 컨텍스트 추론
    inferContextsFromEvent(event) {
        const contexts = [];
        const text = `${event.summary || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase();

        // 위치 기반 컨텍스트
        if (event.location) {
            if (text.includes('회의실') || text.includes('office')) contexts.push('@회의');
            else if (text.includes('집') || text.includes('home')) contexts.push('@집');
            else if (text.includes('카페') || text.includes('cafe')) contexts.push('@외출');
            else contexts.push('@외출');
        } else {
            // 온라인 이벤트 추정
            if (text.includes('zoom') || text.includes('meet') || text.includes('teams')) {
                contexts.push('@온라인');
            }
        }

        // 참석자 기반 컨텍스트
        if (event.attendees && event.attendees.length > 1) {
            contexts.push('@회의');
        } else if (event.attendees && event.attendees.length === 1) {
            contexts.push('@1:1');
        }

        // 이벤트 유형별 컨텍스트
        const eventType = this.detectEventType(event);
        switch (eventType) {
            case 'meeting':
                contexts.push('@회의');
                break;
            case 'focus':
                contexts.push('@집중');
                break;
            case 'travel':
                contexts.push('@이동');
                break;
            case 'personal':
                contexts.push('@개인');
                break;
        }

        // 중복 제거
        return [...new Set(contexts)];
    }

    // 이벤트 유형 감지
    detectEventType(event) {
        const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
        
        // 회의 키워드
        if (text.includes('회의') || text.includes('미팅') || text.includes('meeting') || 
            (event.attendees && event.attendees.length > 0)) {
            return 'meeting';
        }
        
        // 집중 작업 키워드
        if (text.includes('작업') || text.includes('개발') || text.includes('집중') || 
            text.includes('study') || text.includes('work')) {
            return 'focus';
        }
        
        // 이동 키워드
        if (text.includes('이동') || text.includes('출장') || text.includes('여행') || 
            text.includes('travel')) {
            return 'travel';
        }
        
        // 개인 일정 키워드
        if (text.includes('개인') || text.includes('병원') || text.includes('운동') ||
            text.includes('식사') || text.includes('휴식')) {
            return 'personal';
        }
        
        return 'general';
    }

    // 이벤트 설명 생성
    buildEventDescription(event) {
        let description = event.description || '';
        
        // 메타 정보 추가
        const meta = [];
        
        if (event.location) {
            meta.push(`📍 ${event.location}`);
        }
        
        if (event.attendees && event.attendees.length > 0) {
            meta.push(`👥 ${event.attendees.length}명 참석`);
        }
        
        const duration = this.calculateEventDuration(event);
        if (duration) {
            meta.push(`⏱️ ${duration}`);
        }
        
        if (meta.length > 0) {
            description = description ? `${description}\n\n${meta.join('\n')}` : meta.join('\n');
        }
        
        return description;
    }

    // 이벤트 지속 시간 계산
    calculateEventDuration(event) {
        if (!event.start.dateTime || !event.end.dateTime) return null;
        
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return diffMins > 0 ? `${diffHours}시간 ${diffMins}분` : `${diffHours}시간`;
        }
        return `${diffMins}분`;
    }

    // 전체 동기화
    async syncTasks(options = {}) {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            // 기본 캘린더의 이벤트 가져오기
            const calendars = await this.getCalendars();
            const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
            
            if (!primaryCalendar) {
                throw new Error('사용 가능한 캘린더를 찾을 수 없습니다.');
            }

            // 이벤트 가져오기 (향후 30일)
            const events = await this.getEvents(primaryCalendar.id);
            
            // GTD 작업으로 변환
            const gtdTasks = events
                .filter(event => event.summary) // 제목이 있는 이벤트만
                .map(event => this.convertToGTDTask(event, primaryCalendar.summary));

            return {
                success: true,
                tasks: gtdTasks,
                count: gtdTasks.length,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Google Calendar sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    // 이벤트 생성 (양방향 동기화용)
    async createEvent(clarityTask) {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            const calendarEvent = this.convertFromGTDTask(clarityTask);
            
            const response = await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: calendarEvent
            });

            return {
                success: true,
                calendarEvent: response.result,
                message: 'Google Calendar에 이벤트가 생성되었습니다.'
            };
        } catch (error) {
            console.error('Google Calendar event creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // GTD 작업을 Google Calendar 이벤트로 변환
    convertFromGTDTask(clarityTask) {
        const startTime = clarityTask.dueDate ? new Date(clarityTask.dueDate) : new Date();
        const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1시간 기본

        const event = {
            summary: clarityTask.name,
            description: clarityTask.description || '',
            start: {
                dateTime: startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        // 컨텍스트에서 위치 추출
        if (clarityTask.contexts) {
            const locationContext = clarityTask.contexts.find(ctx => 
                ctx.includes('회의실') || ctx.includes('사무실') || ctx.includes('카페')
            );
            if (locationContext) {
                event.location = locationContext.replace('@', '');
            }
        }

        return event;
    }

    // 연결 해제
    disconnect() {
        if (this.gapi && this.gapi.auth2) {
            const authInstance = this.gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                authInstance.signOut();
            }
        }
        
        this.accessToken = null;
        this.isConnected = false;
        
        localStorage.removeItem('google_calendar_connected');
        localStorage.removeItem('google_calendar_token');
        localStorage.removeItem('google_calendar_client_id');
        localStorage.removeItem('google_calendar_api_key');
    }

    // 동기화 통계 생성
    generateSyncStats(syncResult) {
        if (!syncResult.success) return null;

        const stats = {
            total: syncResult.tasks.length,
            byQuadrant: { q1: 0, q2: 0, q3: 0, q4: 0 },
            byEventType: {},
            upcoming24h: 0,
            thisWeek: 0
        };

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        syncResult.tasks.forEach(task => {
            // 사분면별 통계
            stats.byQuadrant[task.quadrant]++;
            
            // 이벤트 유형별 통계
            const eventType = task.eventType || 'general';
            stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
            
            // 시간대별 통계
            const taskDate = new Date(task.startTime);
            if (taskDate <= tomorrow) stats.upcoming24h++;
            if (taskDate <= nextWeek) stats.thisWeek++;
        });

        return stats;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.GoogleCalendarIntegration = GoogleCalendarIntegration;