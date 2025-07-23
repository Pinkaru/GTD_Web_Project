// Google Calendar Simple Integration (공유 캘린더 방식)

class GoogleCalendarSimpleIntegration {
    constructor() {
        this.isConnected = false;
        this.calendarId = null;
        this.calendarUrl = null;
        this.calendarName = null;
    }

    // 공유 캘린더 연결 (훨씬 간단!)
    async connect(calendarInfo) {
        try {
            // 캘린더 ID 추출 (여러 형식 지원)
            this.calendarId = this.extractCalendarId(calendarInfo.url);
            this.calendarName = calendarInfo.name || 'Google Calendar';

            if (!this.calendarId) {
                return {
                    success: false,
                    message: '올바른 캘린더 URL이 아닙니다.'
                };
            }

            // 캘린더 URL 저장 (연결 테스트는 실제 동기화 시점에 수행)
            this.calendarUrl = calendarInfo.url.includes('ical') ? 
                calendarInfo.url : this.buildICalUrl(this.calendarId);
            
            this.isConnected = true;
            this.saveConnectionStatus();
            
            return {
                success: true,
                message: 'Google Calendar 연결 설정 완료! 동기화를 통해 데이터를 가져와보세요.'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 캘린더 URL에서 ID 추출
    extractCalendarId(url) {
        // 다양한 Google Calendar URL 형식 지원
        const patterns = [
            // 공유 URL 형식: calendar.google.com/calendar/embed?src=...
            /[?&]src=([^&]+)/,
            // iCal URL 형식: calendar.google.com/calendar/ical/.../basic.ics
            /\/calendar\/ical\/([^\/]+)/,
            // 단순 이메일 형식
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return decodeURIComponent(match[1]);
            }
        }

        // URL이 아니라 직접 이메일인 경우
        if (url.includes('@')) {
            return url;
        }

        return null;
    }

    // iCal URL 생성
    buildICalUrl(calendarId) {
        // Google Calendar의 공개 iCal URL 형식
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    }

    // iCal 데이터 파싱
    parseICalData(icalData) {
        const events = [];
        const lines = icalData.split(/\r?\n/);
        let currentEvent = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT' && currentEvent) {
                if (currentEvent.summary) {
                    events.push(this.processEvent(currentEvent));
                }
                currentEvent = null;
            } else if (currentEvent && line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const property = line.substring(0, colonIndex);
                const value = line.substring(colonIndex + 1);

                this.parseEventProperty(currentEvent, property, value);
            }
        }

        return events;
    }

    // 이벤트 속성 파싱
    parseEventProperty(event, property, value) {
        switch (property) {
            case 'SUMMARY':
                event.summary = this.unescapeICalText(value);
                break;
            case 'DESCRIPTION':
                event.description = this.unescapeICalText(value);
                break;
            case 'LOCATION':
                event.location = this.unescapeICalText(value);
                break;
            case 'DTSTART':
            case 'DTSTART;VALUE=DATE':
                event.startTime = this.parseICalDateTime(value, property.includes('DATE'));
                break;
            case 'DTEND':
            case 'DTEND;VALUE=DATE':
                event.endTime = this.parseICalDateTime(value, property.includes('DATE'));
                break;
            case 'CREATED':
                event.created = this.parseICalDateTime(value);
                break;
            case 'LAST-MODIFIED':
                event.updated = this.parseICalDateTime(value);
                break;
            case 'UID':
                event.id = value;
                break;
            case 'URL':
                event.url = value;
                break;
        }
    }

    // iCal 텍스트 언이스케이프
    unescapeICalText(text) {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }

    // iCal 날짜/시간 파싱
    parseICalDateTime(dateTimeStr, isDateOnly = false) {
        if (isDateOnly) {
            // YYYYMMDD 형식 (날짜만)
            const year = dateTimeStr.substring(0, 4);
            const month = dateTimeStr.substring(4, 6);
            const day = dateTimeStr.substring(6, 8);
            return new Date(year, month - 1, day).toISOString();
        } else {
            // YYYYMMDDTHHMMSSZ 형식 (날짜+시간)
            const year = dateTimeStr.substring(0, 4);
            const month = dateTimeStr.substring(4, 6);
            const day = dateTimeStr.substring(6, 8);
            const hour = dateTimeStr.substring(9, 11);
            const minute = dateTimeStr.substring(11, 13);
            const second = dateTimeStr.substring(13, 15);
            
            return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
        }
    }

    // 이벤트 처리 및 필터링
    processEvent(rawEvent) {
        const now = new Date();
        const startTime = new Date(rawEvent.startTime);
        const endTime = new Date(rawEvent.endTime);

        // 과거 이벤트 제외 (30일 이전)
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        if (endTime < thirtyDaysAgo) {
            return null;
        }

        return {
            id: rawEvent.id || `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            summary: rawEvent.summary,
            description: rawEvent.description || '',
            location: rawEvent.location || '',
            startTime: rawEvent.startTime,
            endTime: rawEvent.endTime,
            created: rawEvent.created || new Date().toISOString(),
            updated: rawEvent.updated || new Date().toISOString(),
            url: rawEvent.url || this.buildEventUrl(rawEvent.id)
        };
    }

    // 이벤트 URL 생성
    buildEventUrl(eventId) {
        if (!eventId) return '';
        return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(eventId)}`;
    }

    // 캘린더 이벤트 가져오기 (CORS 프록시 사용)
    async getEvents() {
        if (!this.isConnected || !this.calendarUrl) {
            throw new Error('캘린더에 연결되어 있지 않습니다.');
        }

        try {
            // CORS 프록시 서비스들 (순서대로 시도)
            const proxyUrls = [
                `https://api.allorigins.win/get?url=${encodeURIComponent(this.calendarUrl)}`,
                `https://corsproxy.io/?${encodeURIComponent(this.calendarUrl)}`,
                `https://cors-anywhere.herokuapp.com/${this.calendarUrl}`
            ];

            let icalData = null;
            let lastError = null;

            for (const proxyUrl of proxyUrls) {
                try {
                    console.log(`Trying proxy: ${proxyUrl.split('?')[0]}...`);
                    
                    const response = await fetch(proxyUrl, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // allorigins.win 응답 형식 처리
                        icalData = data.contents || data;
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`Proxy failed: ${error.message}`);
                    continue;
                }
            }

            if (!icalData) {
                // 모든 프록시 실패 시 사용자에게 안내
                throw new Error(`캘린더 데이터를 가져올 수 없습니다. CORS 정책으로 인해 직접 접근이 제한됩니다.\n\n해결 방법:\n1. 브라우저 확장 프로그램 'CORS Unblock' 설치 후 활성화\n2. 또는 Chrome을 --disable-web-security 옵션으로 실행\n3. 또는 Mock 데이터로 테스트 진행\n\n마지막 오류: ${lastError?.message || '알 수 없는 오류'}`);
            }

            const events = this.parseICalData(icalData);
            return events.filter(event => event !== null);
            
        } catch (error) {
            console.error('Calendar events fetch error:', error);
            throw error;
        }
    }

    // 이벤트를 GTD 작업으로 변환
    convertToGTDTask(calendarEvent) {
        const now = new Date();
        const startTime = new Date(calendarEvent.startTime);
        const endTime = new Date(calendarEvent.endTime);
        
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
            createdAt: calendarEvent.created,
            updatedAt: calendarEvent.updated,
            dueDate: calendarEvent.startTime,
            startTime: calendarEvent.startTime,
            endTime: calendarEvent.endTime,
            location: calendarEvent.location,
            calendar: this.calendarName,
            contexts: contexts,
            source: 'google-calendar',
            externalId: calendarEvent.id,
            externalUrl: calendarEvent.url,
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
        
        if (text.includes('회의') || text.includes('미팅') || text.includes('meeting')) {
            return 'meeting';
        }
        
        if (text.includes('작업') || text.includes('개발') || text.includes('집중') || 
            text.includes('study') || text.includes('work')) {
            return 'focus';
        }
        
        if (text.includes('이동') || text.includes('출장') || text.includes('여행') || 
            text.includes('travel')) {
            return 'travel';
        }
        
        if (text.includes('개인') || text.includes('병원') || text.includes('운동') ||
            text.includes('식사') || text.includes('휴식')) {
            return 'personal';
        }
        
        return 'general';
    }

    // 이벤트 설명 생성
    buildEventDescription(event) {
        let description = event.description || '';
        
        const meta = [];
        
        if (event.location) {
            meta.push(`📍 ${event.location}`);
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
        if (!event.startTime || !event.endTime) return null;
        
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return diffMins > 0 ? `${diffHours}시간 ${diffMins}분` : `${diffHours}시간`;
        }
        return `${diffMins}분`;
    }

    // 전체 동기화
    async syncTasks() {
        if (!this.isConnected) {
            throw new Error('Google Calendar에 연결되어 있지 않습니다.');
        }

        try {
            const events = await this.getEvents();
            
            // GTD 작업으로 변환
            const gtdTasks = events
                .filter(event => event.summary) // 제목이 있는 이벤트만
                .map(event => this.convertToGTDTask(event));

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

    // 연결 상태 저장
    saveConnectionStatus() {
        localStorage.setItem('google_calendar_simple_connected', this.isConnected);
        if (this.calendarId) {
            localStorage.setItem('google_calendar_simple_id', this.calendarId);
        }
        if (this.calendarUrl) {
            localStorage.setItem('google_calendar_simple_url', this.calendarUrl);
        }
        if (this.calendarName) {
            localStorage.setItem('google_calendar_simple_name', this.calendarName);
        }
    }

    // 연결 상태 복원
    restoreConnection() {
        this.isConnected = localStorage.getItem('google_calendar_simple_connected') === 'true';
        this.calendarId = localStorage.getItem('google_calendar_simple_id');
        this.calendarUrl = localStorage.getItem('google_calendar_simple_url');
        this.calendarName = localStorage.getItem('google_calendar_simple_name');
    }

    // 연결 해제
    disconnect() {
        this.calendarId = null;
        this.calendarUrl = null;
        this.calendarName = null;
        this.isConnected = false;
        
        localStorage.removeItem('google_calendar_simple_connected');
        localStorage.removeItem('google_calendar_simple_id');
        localStorage.removeItem('google_calendar_simple_url');
        localStorage.removeItem('google_calendar_simple_name');
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
            stats.byQuadrant[task.quadrant]++;
            
            const eventType = task.eventType || 'general';
            stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
            
            const taskDate = new Date(task.startTime);
            if (taskDate <= tomorrow) stats.upcoming24h++;
            if (taskDate <= nextWeek) stats.thisWeek++;
        });

        return stats;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.GoogleCalendarSimpleIntegration = GoogleCalendarSimpleIntegration;