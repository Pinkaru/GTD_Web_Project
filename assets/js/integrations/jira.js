// JIRA Integration Module

class JiraIntegration {
    constructor() {
        this.baseUrl = null;
        this.username = null;
        this.apiToken = null;
        this.isConnected = false;
        this.projectKey = null;
        this.jql = null;
    }

    // JIRA 연결 설정
    async connect(credentials) {
        try {
            this.baseUrl = credentials.baseUrl.replace(/\/$/, ''); // 마지막 슬래시 제거
            this.username = credentials.username;
            this.apiToken = credentials.apiToken;
            this.projectKey = credentials.projectKey;
            this.jql = credentials.jql || `project = "${this.projectKey}" AND resolution = Unresolved`;

            // JIRA API 연결 테스트
            const testResponse = await this.testConnection();
            
            if (testResponse.success) {
                this.isConnected = true;
                this.saveConnectionStatus();
                return {
                    success: true,
                    message: 'JIRA 연결 성공!'
                };
            } else {
                throw new Error(testResponse.message);
            }

        } catch (error) {
            console.error('JIRA connection error:', error);
            this.isConnected = false;
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 연결 테스트
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/rest/api/2/myself`, {
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.apiToken}`)}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                return {
                    success: true,
                    user: userData
                };
            } else {
                throw new Error(`인증 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            return {
                success: false,
                message: `연결 테스트 실패: ${error.message}`
            };
        }
    }

    // JIRA 이슈 가져오기
    async getIssues(jql = null) {
        if (!this.isConnected) {
            throw new Error('JIRA에 연결되어 있지 않습니다.');
        }

        try {
            const searchJql = jql || this.jql;
            const encodedJql = encodeURIComponent(searchJql);
            
            const response = await fetch(
                `${this.baseUrl}/rest/api/2/search?jql=${encodedJql}&maxResults=100&fields=summary,description,status,priority,assignee,created,updated,components,labels,issuetype,project`,
                {
                    headers: {
                        'Authorization': `Basic ${btoa(`${this.username}:${this.apiToken}`)}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.issues || [];
            } else {
                throw new Error(`이슈 조회 실패: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('JIRA issues fetch error:', error);
            throw error;
        }
    }

    // JIRA 이슈를 GTD 작업으로 변환
    convertToGTDTask(jiraIssue) {
        const issue = jiraIssue.fields;
        const key = jiraIssue.key;

        // 우선순위 매핑
        const quadrant = this.mapPriorityToQuadrant(
            issue.priority?.name,
            issue.status?.name,
            issue.issuetype?.name
        );

        // 컨텍스트 추론
        const contexts = this.inferContextsFromIssue(jiraIssue);

        // 설명 생성
        const description = this.buildIssueDescription(jiraIssue);

        return {
            id: `jira-${key}`,
            name: `[${key}] ${issue.summary}`,
            description: description,
            quadrant: quadrant,
            completed: this.isIssueCompleted(issue.status?.name),
            createdAt: issue.created,
            updatedAt: issue.updated,
            assignee: issue.assignee?.displayName || '미배정',
            status: issue.status?.name,
            priority: issue.priority?.name || '보통',
            issueType: issue.issuetype?.name,
            project: issue.project?.name,
            components: issue.components?.map(c => c.name) || [],
            labels: issue.labels || [],
            contexts: contexts,
            source: 'jira',
            externalId: key,
            externalUrl: `${this.baseUrl}/browse/${key}`,
            originalData: jiraIssue
        };
    }

    // JIRA 우선순위를 아이젠하워 매트릭스로 매핑
    mapPriorityToQuadrant(priority, status, issueType) {
        // 버그와 긴급 이슈는 Q1
        if (issueType === 'Bug' || priority === 'Blocker' || priority === 'Critical') {
            return 'q1';
        }

        // 진행 중인 높은 우선순위 이슈는 Q1
        if (status === 'In Progress' && (priority === 'High' || priority === 'Major')) {
            return 'q1';
        }

        // 높은 우선순위는 Q2
        if (priority === 'High' || priority === 'Major') {
            return 'q2';
        }

        // 새로운 이슈나 진행 중인 보통 우선순위는 Q3
        if (status === 'To Do' || status === 'In Progress') {
            return 'q3';
        }

        // 나머지는 Q4
        return 'q4';
    }

    // 이슈에서 컨텍스트 추론
    inferContextsFromIssue(jiraIssue) {
        const issue = jiraIssue.fields;
        const contexts = [];

        // 이슈 유형 기반 컨텍스트
        switch (issue.issuetype?.name) {
            case 'Bug':
                contexts.push('@버그수정');
                break;
            case 'Story':
            case 'Epic':
                contexts.push('@개발');
                break;
            case 'Task':
                contexts.push('@작업');
                break;
            case 'Sub-task':
                contexts.push('@서브작업');
                break;
        }

        // 상태 기반 컨텍스트
        switch (issue.status?.name) {
            case 'In Progress':
                contexts.push('@진행중');
                break;
            case 'Code Review':
            case 'Review':
                contexts.push('@리뷰');
                break;
            case 'Testing':
            case 'QA':
                contexts.push('@테스트');
                break;
            case 'Ready for Deploy':
            case 'Deploy':
                contexts.push('@배포');
                break;
        }

        // 우선순위 기반 컨텍스트
        if (issue.priority?.name === 'Blocker' || issue.priority?.name === 'Critical') {
            contexts.push('@긴급');
        }

        // 컴포넌트 기반 컨텍스트
        if (issue.components && issue.components.length > 0) {
            issue.components.forEach(comp => {
                contexts.push(`@${comp.name}`);
            });
        }

        // 라벨 기반 컨텍스트
        if (issue.labels && issue.labels.length > 0) {
            issue.labels.forEach(label => {
                contexts.push(`@${label}`);
            });
        }

        // 담당자 기반 컨텍스트
        if (issue.assignee) {
            contexts.push(`@${issue.assignee.displayName}`);
        }

        return [...new Set(contexts)]; // 중복 제거
    }

    // 이슈 설명 생성
    buildIssueDescription(jiraIssue) {
        const issue = jiraIssue.fields;
        const key = jiraIssue.key;
        
        let description = issue.description || '';
        
        // 메타데이터 추가
        const meta = [];
        meta.push(`🎯 ${issue.issuetype?.name || '이슈'}`);
        meta.push(`📊 ${issue.status?.name || '상태없음'}`);
        meta.push(`⚡ ${issue.priority?.name || '보통'}`);
        
        if (issue.assignee) {
            meta.push(`👤 ${issue.assignee.displayName}`);
        } else {
            meta.push(`👤 미배정`);
        }
        
        if (issue.components && issue.components.length > 0) {
            meta.push(`🧩 ${issue.components.map(c => c.name).join(', ')}`);
        }
        
        if (meta.length > 0) {
            description = description ? 
                `${description}\n\n${meta.join('\n')}` : 
                meta.join('\n');
        }
        
        return description;
    }

    // 이슈 완료 상태 확인
    isIssueCompleted(statusName) {
        const completedStatuses = [
            'Done', 'Resolved', 'Closed', 'Complete', 
            '완료', '해결됨', '종료', '배포완료'
        ];
        return completedStatuses.includes(statusName);
    }

    // 전체 동기화
    async syncTasks(options = {}) {
        if (!this.isConnected) {
            throw new Error('JIRA에 연결되어 있지 않습니다.');
        }

        try {
            const issues = await this.getIssues(options.jql);
            
            // GTD 작업으로 변환
            const gtdTasks = issues.map(issue => this.convertToGTDTask(issue));

            return {
                success: true,
                tasks: gtdTasks,
                count: gtdTasks.length,
                syncedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('JIRA sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    // 이슈 생성 (양방향 동기화용)
    async createIssue(clarityTask) {
        if (!this.isConnected) {
            throw new Error('JIRA에 연결되어 있지 않습니다.');
        }

        try {
            const jiraIssue = this.convertFromGTDTask(clarityTask);
            
            const response = await fetch(`${this.baseUrl}/rest/api/2/issue`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.apiToken}`)}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(jiraIssue)
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    jiraIssue: result,
                    message: 'JIRA에 이슈가 생성되었습니다.'
                };
            } else {
                const errorData = await response.json();
                throw new Error(`이슈 생성 실패: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
        } catch (error) {
            console.error('JIRA issue creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // GTD 작업을 JIRA 이슈로 변환
    convertFromGTDTask(clarityTask) {
        const priorityMapping = {
            'q1': 'High',      // 긴급&중요
            'q2': 'Medium',    // 중요
            'q3': 'Low',       // 긴급
            'q4': 'Lowest'     // 나중에
        };

        return {
            fields: {
                project: {
                    key: this.projectKey
                },
                summary: clarityTask.name,
                description: clarityTask.description || '',
                issuetype: {
                    name: 'Task'
                },
                priority: {
                    name: priorityMapping[clarityTask.quadrant] || 'Medium'
                },
                labels: clarityTask.contexts ? 
                    clarityTask.contexts.map(ctx => ctx.replace('@', '')) : []
            }
        };
    }

    // 연결 상태 저장
    saveConnectionStatus() {
        localStorage.setItem('jira_connected', this.isConnected);
        if (this.baseUrl) {
            localStorage.setItem('jira_base_url', this.baseUrl);
        }
        if (this.username) {
            localStorage.setItem('jira_username', this.username);
        }
        if (this.apiToken) {
            // 보안상 암호화하여 저장하는 것이 좋지만, 여기서는 간단히 구현
            localStorage.setItem('jira_api_token', this.apiToken);
        }
        if (this.projectKey) {
            localStorage.setItem('jira_project_key', this.projectKey);
        }
        if (this.jql) {
            localStorage.setItem('jira_jql', this.jql);
        }
    }

    // 연결 상태 복원
    restoreConnection() {
        this.isConnected = localStorage.getItem('jira_connected') === 'true';
        this.baseUrl = localStorage.getItem('jira_base_url');
        this.username = localStorage.getItem('jira_username');
        this.apiToken = localStorage.getItem('jira_api_token');
        this.projectKey = localStorage.getItem('jira_project_key');
        this.jql = localStorage.getItem('jira_jql');
    }

    // 연결 해제
    disconnect() {
        this.baseUrl = null;
        this.username = null;
        this.apiToken = null;
        this.projectKey = null;
        this.jql = null;
        this.isConnected = false;
        
        localStorage.removeItem('jira_connected');
        localStorage.removeItem('jira_base_url');
        localStorage.removeItem('jira_username');
        localStorage.removeItem('jira_api_token');
        localStorage.removeItem('jira_project_key');
        localStorage.removeItem('jira_jql');
    }

    // 동기화 통계 생성
    generateSyncStats(syncResult) {
        if (!syncResult.success) return null;

        const stats = {
            total: syncResult.tasks.length,
            byQuadrant: { q1: 0, q2: 0, q3: 0, q4: 0 },
            byIssueType: {},
            byStatus: {},
            byPriority: {},
            assigned: 0,
            unassigned: 0
        };

        syncResult.tasks.forEach(task => {
            // 사분면별 통계
            stats.byQuadrant[task.quadrant]++;
            
            // 이슈 유형별 통계
            const issueType = task.issueType || 'Unknown';
            stats.byIssueType[issueType] = (stats.byIssueType[issueType] || 0) + 1;
            
            // 상태별 통계
            const status = task.status || 'Unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            // 우선순위별 통계
            const priority = task.priority || 'Unknown';
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
            
            // 할당 여부
            if (task.assignee && task.assignee !== '미배정') {
                stats.assigned++;
            } else {
                stats.unassigned++;
            }
        });

        return stats;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.JiraIntegration = JiraIntegration;