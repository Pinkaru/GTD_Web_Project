// Todoist Mock Data for Testing
// CORS 문제로 실제 API 호출이 안 될 때 사용

class TodoistMockIntegration {
    constructor() {
        this.isConnected = false;
        this.token = null;
        
        // 테스트용 Mock 데이터
        this.mockProjects = [
            { id: 1, name: "업무", color: "blue" },
            { id: 2, name: "개인", color: "green" },
            { id: 3, name: "학습", color: "orange" }
        ];

        this.mockLabels = [
            { id: 1, name: "집" },
            { id: 2, name: "사무실" },
            { id: 3, name: "전화" },
            { id: 4, name: "컴퓨터" },
            { id: 5, name: "15분" }
        ];

        this.mockTasks = [
            {
                id: 101,
                content: "긴급한 버그 수정",
                description: "프로덕션 환경의 결제 시스템 버그 수정",
                project_id: 1,
                priority: 4, // P1
                labels: [2, 4], // 사무실, 컴퓨터
                due: { date: new Date().toISOString().split('T')[0] }, // 오늘
                created_at: "2024-01-10T10:00:00Z",
                url: "https://todoist.com/showTask?id=101",
                is_completed: false
            },
            {
                id: 102,
                content: "주간 보고서 작성",
                description: "팀 성과 및 다음 주 계획 정리",
                project_id: 1,
                priority: 3, // P2
                labels: [4], // 컴퓨터
                due: null,
                created_at: "2024-01-12T09:00:00Z",
                url: "https://todoist.com/showTask?id=102",
                is_completed: false
            },
            {
                id: 103,
                content: "회의실 예약",
                description: "내주 팀 미팅용 회의실 예약",
                project_id: 1,
                priority: 2, // P3
                labels: [3], // 전화
                due: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }, // 내일
                created_at: "2024-01-13T15:30:00Z",
                url: "https://todoist.com/showTask?id=103",
                is_completed: false
            },
            {
                id: 104,
                content: "병원 예약",
                description: "정기 건강검진 예약",
                project_id: 2,
                priority: 4, // P1
                labels: [3], // 전화
                due: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }, // 내일
                created_at: "2024-01-14T11:00:00Z",
                url: "https://todoist.com/showTask?id=104",
                is_completed: false
            },
            {
                id: 105,
                content: "책 읽기 - 클린 아키텍처",
                description: "소프트웨어 아키텍처 학습",
                project_id: 3,
                priority: 1, // P4
                labels: [1], // 집
                due: null,
                created_at: "2024-01-15T20:00:00Z",
                url: "https://todoist.com/showTask?id=105",
                is_completed: false
            },
            {
                id: 106,
                content: "JavaScript 강의 수강",
                description: "고급 JavaScript 패턴 학습",
                project_id: 3,
                priority: 2, // P3
                labels: [1, 4, 5], // 집, 컴퓨터, 15분
                due: null,
                created_at: "2024-01-16T19:00:00Z",
                url: "https://todoist.com/showTask?id=106",
                is_completed: false
            }
        ];
    }

    // Mock 연결 (실제 API 대신)
    async connect(apiToken) {
        // 간단한 토큰 검증 시뮬레이션
        if (!apiToken || apiToken.length < 10) {
            return { 
                success: false, 
                message: 'API 토큰이 너무 짧습니다. (테스트용 Mock)' 
            };
        }

        // 성공적인 연결 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        
        this.token = apiToken;
        this.isConnected = true;
        this.saveConnectionStatus();
        
        return { 
            success: true, 
            message: 'Todoist Mock 연결 성공! (테스트 모드)' 
        };
    }

    // Mock 프로젝트 가져오기
    async getProjects() {
        if (!this.isConnected) {
            throw new Error('연결되지 않음');
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...this.mockProjects];
    }

    // Mock 작업 가져오기
    async getTasks() {
        if (!this.isConnected) {
            throw new Error('연결되지 않음');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...this.mockTasks];
    }

    // Mock 라벨 가져오기
    async getLabels() {
        if (!this.isConnected) {
            throw new Error('연결되지 않음');
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        return [...this.mockLabels];
    }

    // 실제 TodoistIntegration과 동일한 메서드들
    saveConnectionStatus() {
        localStorage.setItem('todoist_mock_connected', this.isConnected);
        if (this.token) {
            localStorage.setItem('todoist_mock_token', this.token);
        }
    }

    restoreConnection() {
        this.isConnected = localStorage.getItem('todoist_mock_connected') === 'true';
        this.token = localStorage.getItem('todoist_mock_token');
    }

    disconnect() {
        this.token = null;
        this.isConnected = false;
        localStorage.removeItem('todoist_mock_connected');
        localStorage.removeItem('todoist_mock_token');
    }

    // TodoistIntegration의 다른 메서드들 재사용
    mapPriorityToQuadrant(priority, dueDate) {
        return TodoistIntegration.prototype.mapPriorityToQuadrant.call(this, priority, dueDate);
    }

    isTaskUrgent(dueDate) {
        return TodoistIntegration.prototype.isTaskUrgent.call(this, dueDate);
    }

    mapLabelsToContexts(labels) {
        return TodoistIntegration.prototype.mapLabelsToContexts.call(this, labels);
    }

    convertToGTDTask(todoistTask, projects, labels) {
        return TodoistIntegration.prototype.convertToGTDTask.call(this, todoistTask, projects, labels);
    }

    async syncTasks() {
        if (!this.isConnected) {
            throw new Error('Todoist에 연결되어 있지 않습니다.');
        }

        try {
            const [tasks, projects, labels] = await Promise.all([
                this.getTasks(),
                this.getProjects(), 
                this.getLabels()
            ]);

            const gtdTasks = tasks.map(task => 
                this.convertToGTDTask(task, projects, labels)
            );

            return {
                success: true,
                tasks: gtdTasks,
                count: gtdTasks.length,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Todoist mock sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    // Mock 작업 생성
    async createTask(clarityTask) {
        if (!this.isConnected) {
            throw new Error('Todoist Mock에 연결되어 있지 않습니다.');
        }

        // Mock 생성 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockTodoistTask = {
            id: Date.now(), // Mock ID
            content: clarityTask.name,
            description: clarityTask.description || '',
            priority: this.mapQuadrantToPriority(clarityTask.quadrant),
            project_id: 1, // 기본 프로젝트
            labels: clarityTask.contexts ? 
                clarityTask.contexts.map(ctx => ctx.replace('@', '')) : [],
            created_at: new Date().toISOString(),
            url: `https://todoist.com/showTask?id=${Date.now()}`, // Mock URL
            is_completed: false
        };

        // Mock 데이터에 추가
        this.mockTasks.push(mockTodoistTask);

        return {
            success: true,
            todoistTask: mockTodoistTask,
            message: 'Mock Todoist에 작업이 생성되었습니다.'
        };
    }

    // Mock 작업 업데이트
    async updateTask(clarityTask) {
        if (!this.isConnected || !clarityTask.externalId) {
            throw new Error('Mock 연결이 없거나 외부 ID가 없습니다.');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Mock 데이터에서 찾아서 업데이트
        const mockTask = this.mockTasks.find(t => t.id.toString() === clarityTask.externalId);
        if (mockTask) {
            mockTask.content = clarityTask.name;
            mockTask.priority = this.mapQuadrantToPriority(clarityTask.quadrant);
            mockTask.description = clarityTask.description || '';
        }

        return {
            success: true,
            message: 'Mock Todoist 작업이 업데이트되었습니다.'
        };
    }

    // Mock 작업 완료
    async completeTask(clarityTask) {
        if (!clarityTask.externalId) return { success: false };

        await new Promise(resolve => setTimeout(resolve, 200));

        // Mock 데이터에서 찾아서 완료 처리
        const mockTask = this.mockTasks.find(t => t.id.toString() === clarityTask.externalId);
        if (mockTask) {
            mockTask.is_completed = true;
        }

        return { 
            success: true, 
            message: 'Mock Todoist에서 작업이 완료되었습니다.' 
        };
    }

    // 4분면을 Todoist 우선순위로 변환 (실제 구현과 동일)
    mapQuadrantToPriority(quadrant) {
        const mapping = {
            'q1': 4, 'q2': 3, 'q3': 2, 'q4': 1
        };
        return mapping[quadrant] || 1;
    }

    generateSyncStats(syncResult) {
        return TodoistIntegration.prototype.generateSyncStats.call(this, syncResult);
    }
}

// Mock 모드 토글 함수
window.toggleMockMode = function() {
    if (window.confirm('Mock 모드로 전환하시겠습니까?\nCORS 문제로 실제 API가 작동하지 않을 때 사용하세요.')) {
        // Mock 인스턴스로 교체
        if (app && app.integrationManager) {
            app.integrationManager.integrations.set('todoist', new TodoistMockIntegration());
            alert('Mock 모드가 활성화되었습니다.\n이제 임의의 토큰(10글자 이상)으로 테스트할 수 있습니다.');
        }
    }
};

// 개발자 콘솔에 Mock 모드 활성화 안내
console.log(`
🧪 Todoist 통합 테스트 도구
=========================

CORS 오류가 발생하면 Mock 모드를 사용하세요:
1. toggleMockMode() 실행
2. 설정에서 임의의 토큰(10글자 이상) 입력
3. 테스트 데이터로 통합 기능 테스트

Mock 데이터:
- 6개의 테스트 작업
- 3개의 프로젝트 (업무, 개인, 학습)  
- 5개의 라벨/컨텍스트
`);

window.TodoistMockIntegration = TodoistMockIntegration;