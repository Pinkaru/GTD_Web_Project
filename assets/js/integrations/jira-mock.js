// JIRA Mock Integration for Testing

class JiraMockIntegration {
    constructor() {
        this.baseUrl = null;
        this.username = null;
        this.apiToken = null;
        this.isConnected = false;
        this.projectKey = null;
        this.jql = null;
        
        // Mock JIRA 이슈 데이터
        this.mockIssues = [
            {
                key: 'PROJ-101',
                fields: {
                    summary: '로그인 페이지 버그 수정',
                    description: '사용자가 잘못된 비밀번호를 입력했을 때 적절한 오류 메시지가 표시되지 않는 문제',
                    status: { name: 'In Progress' },
                    priority: { name: 'High' },
                    issuetype: { name: 'Bug' },
                    assignee: { displayName: '김개발' },
                    created: '2024-01-15T10:30:00.000Z',
                    updated: '2024-01-18T14:20:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Frontend' }, { name: 'Authentication' }],
                    labels: ['critical', 'security']
                }
            },
            {
                key: 'PROJ-102',
                fields: {
                    summary: '대시보드 성능 최적화',
                    description: '대시보드 로딩 시간이 너무 오래 걸리는 문제를 해결하기 위한 최적화 작업\n\n- 데이터 쿼리 최적화\n- 캐싱 구현\n- 불필요한 렌더링 제거',
                    status: { name: 'To Do' },
                    priority: { name: 'Medium' },
                    issuetype: { name: 'Story' },
                    assignee: { displayName: '박프론트' },
                    created: '2024-01-12T09:15:00.000Z',
                    updated: '2024-01-16T11:45:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Frontend' }, { name: 'Performance' }],
                    labels: ['optimization', 'dashboard']
                }
            },
            {
                key: 'PROJ-103',
                fields: {
                    summary: 'API 문서 업데이트',
                    description: '새로 추가된 엔드포인트들에 대한 API 문서 작성 및 기존 문서 업데이트',
                    status: { name: 'Code Review' },
                    priority: { name: 'Low' },
                    issuetype: { name: 'Task' },
                    assignee: { displayName: '이백엔드' },
                    created: '2024-01-10T16:20:00.000Z',
                    updated: '2024-01-17T13:10:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Backend' }, { name: 'Documentation' }],
                    labels: ['documentation', 'api']
                }
            },
            {
                key: 'PROJ-104',
                fields: {
                    summary: '모바일 앱 푸시 알림 기능',
                    description: '사용자에게 중요한 알림을 푸시 메시지로 전송하는 기능 개발\n\n요구사항:\n- FCM 통합\n- 알림 설정 페이지\n- 알림 기록 조회',
                    status: { name: 'Testing' },
                    priority: { name: 'High' },
                    issuetype: { name: 'Epic' },
                    assignee: { displayName: '최모바일' },
                    created: '2024-01-08T14:00:00.000Z',
                    updated: '2024-01-19T10:30:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Mobile' }, { name: 'Notification' }],
                    labels: ['mobile', 'notification', 'fcm']
                }
            },
            {
                key: 'PROJ-105',
                fields: {
                    summary: '데이터베이스 백업 자동화',
                    description: '매일 새벽 2시에 자동으로 데이터베이스를 백업하는 스크립트 개발',
                    status: { name: 'Done' },
                    priority: { name: 'Medium' },
                    issuetype: { name: 'Task' },
                    assignee: { displayName: '정인프라' },
                    created: '2024-01-05T11:30:00.000Z',
                    updated: '2024-01-14T16:45:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Infrastructure' }, { name: 'Database' }],
                    labels: ['automation', 'backup', 'database']
                }
            },
            {
                key: 'PROJ-106',
                fields: {
                    summary: '보안 취약점 점검',
                    description: '정기 보안 점검 및 취약점 분석\n\n- SQL Injection 점검\n- XSS 취약점 확인\n- 인증/인가 로직 검토',
                    status: { name: 'To Do' },
                    priority: { name: 'Critical' },
                    issuetype: { name: 'Task' },
                    assignee: null, // 미배정
                    created: '2024-01-18T09:00:00.000Z',
                    updated: '2024-01-18T09:00:00.000Z',
                    project: { name: 'Test Project' },
                    components: [{ name: 'Security' }],
                    labels: ['security', 'audit', 'vulnerability']
                }
            }
        ];
    }

    // Mock 연결
    async connect(credentials) {
        // 기본 유효성 검사
        if (!credentials.baseUrl || !credentials.username || !credentials.apiToken) {
            return {
                success: false,
                message: '모든 필드를 입력해주세요.'
            };
        }

        if (credentials.baseUrl.length < 10 || credentials.apiToken.length < 10) {
            return {
                success: false,
                message: 'URL과 API 토큰이 너무 짧습니다. (Mock 테스트용)'
            };
        }

        // Mock 연결 성공 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.baseUrl = credentials.baseUrl;
        this.username = credentials.username;
        this.apiToken = credentials.apiToken;
        this.projectKey = credentials.projectKey || 'PROJ';
        this.jql = credentials.jql || `project = "${this.projectKey}"`;
        this.isConnected = true;
        this.saveConnectionStatus();
        
        return {
            success: true,
            message: 'JIRA Mock 연결 성공! (테스트 모드)'
        };
    }

    // Mock 연결 테스트
    async testConnection() {
        if (!this.isConnected) {
            return { success: false, message: '연결되지 않음' };
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            success: true,
            user: {
                displayName: 'Mock User',
                emailAddress: 'mock@example.com'
            }
        };
    }

    // Mock 이슈 가져오기
    async getIssues(jql = null) {
        if (!this.isConnected) {
            throw new Error('JIRA에 연결되어 있지 않습니다.');
        }

        // 네트워크 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // JQL 필터링 시뮬레이션 (간단한 예시)
        let filteredIssues = [...this.mockIssues];
        
        if (jql && jql.includes('resolution = Unresolved')) {
            filteredIssues = filteredIssues.filter(issue => 
                issue.fields.status.name !== 'Done' && 
                issue.fields.status.name !== 'Closed'
            );
        }
        
        return filteredIssues;
    }

    // Mock 이슈 생성
    async createIssue(clarityTask) {
        if (!this.isConnected) {
            throw new Error('JIRA Mock에 연결되어 있지 않습니다.');
        }

        // Mock 생성 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockJiraIssue = {
            key: `${this.projectKey}-${Date.now() % 1000}`,
            id: Date.now().toString(),
            self: `${this.baseUrl}/rest/api/2/issue/${Date.now()}`
        };

        // Mock 데이터에 추가
        const newMockIssue = {
            key: mockJiraIssue.key,
            fields: {
                summary: clarityTask.name,
                description: clarityTask.description || '',
                status: { name: 'To Do' },
                priority: { name: this.mapQuadrantToPriority(clarityTask.quadrant) },
                issuetype: { name: 'Task' },
                assignee: { displayName: 'Mock User' },
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                project: { name: 'Test Project' },
                components: [],
                labels: clarityTask.contexts ? 
                    clarityTask.contexts.map(ctx => ctx.replace('@', '')) : []
            }
        };

        this.mockIssues.push(newMockIssue);

        return {
            success: true,
            jiraIssue: mockJiraIssue,
            message: 'Mock JIRA에 이슈가 생성되었습니다.'
        };
    }

    // 4분면을 JIRA 우선순위로 변환
    mapQuadrantToPriority(quadrant) {
        const mapping = {
            'q1': 'High',
            'q2': 'Medium', 
            'q3': 'Low',
            'q4': 'Lowest'
        };
        return mapping[quadrant] || 'Medium';
    }

    // 실제 JiraIntegration의 메서드들 재사용
    convertToGTDTask(jiraIssue) {
        return JiraIntegration.prototype.convertToGTDTask.call(this, jiraIssue);
    }

    mapPriorityToQuadrant(priority, status, issueType) {
        return JiraIntegration.prototype.mapPriorityToQuadrant.call(this, priority, status, issueType);
    }

    inferContextsFromIssue(jiraIssue) {
        return JiraIntegration.prototype.inferContextsFromIssue.call(this, jiraIssue);
    }

    buildIssueDescription(jiraIssue) {
        return JiraIntegration.prototype.buildIssueDescription.call(this, jiraIssue);
    }

    isIssueCompleted(statusName) {
        return JiraIntegration.prototype.isIssueCompleted.call(this, statusName);
    }

    convertFromGTDTask(clarityTask) {
        return JiraIntegration.prototype.convertFromGTDTask.call(this, clarityTask);
    }

    async syncTasks(options = {}) {
        if (!this.isConnected) {
            throw new Error('JIRA에 연결되어 있지 않습니다.');
        }

        try {
            const issues = await this.getIssues(options.jql);
            const gtdTasks = issues.map(issue => this.convertToGTDTask(issue));

            return {
                success: true,
                tasks: gtdTasks,
                count: gtdTasks.length,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('JIRA mock sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    saveConnectionStatus() {
        localStorage.setItem('jira_mock_connected', this.isConnected);
        if (this.baseUrl) {
            localStorage.setItem('jira_mock_base_url', this.baseUrl);
        }
        if (this.username) {
            localStorage.setItem('jira_mock_username', this.username);
        }
        if (this.apiToken) {
            localStorage.setItem('jira_mock_api_token', this.apiToken);
        }
        if (this.projectKey) {
            localStorage.setItem('jira_mock_project_key', this.projectKey);
        }
        if (this.jql) {
            localStorage.setItem('jira_mock_jql', this.jql);
        }
    }

    restoreConnection() {
        this.isConnected = localStorage.getItem('jira_mock_connected') === 'true';
        this.baseUrl = localStorage.getItem('jira_mock_base_url');
        this.username = localStorage.getItem('jira_mock_username');
        this.apiToken = localStorage.getItem('jira_mock_api_token');
        this.projectKey = localStorage.getItem('jira_mock_project_key');
        this.jql = localStorage.getItem('jira_mock_jql');
    }

    disconnect() {
        this.baseUrl = null;
        this.username = null;
        this.apiToken = null;
        this.projectKey = null;
        this.jql = null;
        this.isConnected = false;
        
        localStorage.removeItem('jira_mock_connected');
        localStorage.removeItem('jira_mock_base_url');
        localStorage.removeItem('jira_mock_username');
        localStorage.removeItem('jira_mock_api_token');
        localStorage.removeItem('jira_mock_project_key');
        localStorage.removeItem('jira_mock_jql');
    }

    generateSyncStats(syncResult) {
        return JiraIntegration.prototype.generateSyncStats.call(this, syncResult);
    }
}

// Mock 모드 토글 함수
window.toggleJiraMockMode = function() {
    if (window.confirm('JIRA Mock 모드로 전환하시겠습니까?\\n\\n실제 JIRA API 연결이 어려울 때 사용합니다.\\n6개의 샘플 이슈로 모든 기능을 테스트할 수 있습니다.')) {
        // Mock 인스턴스로 교체
        if (app && app.integrationManager) {
            app.integrationManager.integrations.set('jira', new JiraMockIntegration());
            alert('JIRA Mock 모드가 활성화되었습니다!\\n\\n이제 임의의 JIRA 정보로 테스트할 수 있습니다:\\n- URL: https://your-domain.atlassian.net\\n- 사용자명: 임의 값\\n- API 토큰: 10글자 이상\\n\\n6개의 실제 이슈 형태 데이터가 포함되어 있습니다.');
        }
    }
};

// 개발자 콘솔에 Mock 모드 안내
console.log(`
🎯 JIRA 통합 테스트 도구
=======================

실제 JIRA API 연결이 복잡하면 Mock 모드를 사용하세요:
1. toggleJiraMockMode() 실행
2. 설정에서 임의의 JIRA 정보 입력 (형식만 맞으면 됨)
3. 테스트 데이터로 통합 기능 테스트

Mock 데이터:
- 6개의 다양한 이슈 (Bug, Story, Task, Epic)
- 실제 JIRA 상태 및 우선순위 매핑
- 컴포넌트, 라벨, 담당자 정보 포함
- 아이젠하워 매트릭스 자동 분류 테스트 가능
`);

window.JiraMockIntegration = JiraMockIntegration;