// Todoist Integration Module

class TodoistIntegration {
    constructor() {
        this.baseUrl = 'https://api.todoist.com/rest/v2';
        this.token = null;
        this.isConnected = false;
    }

    // OAuth 연동 (실제 구현에서는 백엔드 필요)
    async connect(apiToken) {
        try {
            this.token = apiToken;
            
            // API 토큰 유효성 검증
            const response = await fetch(`${this.baseUrl}/projects`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.isConnected = true;
                this.saveConnectionStatus();
                return { success: true, message: 'Todoist 연결 성공!' };
            } else {
                throw new Error('잘못된 API 토큰입니다.');
            }
        } catch (error) {
            this.isConnected = false;
            return { success: false, message: error.message };
        }
    }

    // 연결 상태 저장
    saveConnectionStatus() {
        localStorage.setItem('todoist_connected', this.isConnected);
        if (this.token) {
            // 실제 앱에서는 보안을 위해 암호화 필요
            localStorage.setItem('todoist_token', this.token);
        }
    }

    // 연결 상태 복원
    restoreConnection() {
        this.isConnected = localStorage.getItem('todoist_connected') === 'true';
        this.token = localStorage.getItem('todoist_token');
    }

    // Todoist 프로젝트 가져오기
    async getProjects() {
        if (!this.isConnected || !this.token) {
            throw new Error('Todoist에 연결되어 있지 않습니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/projects`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('프로젝트를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('Todoist projects fetch error:', error);
            throw error;
        }
    }

    // Todoist 작업 가져오기
    async getTasks() {
        if (!this.isConnected || !this.token) {
            throw new Error('Todoist에 연결되어 있지 않습니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('작업을 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('Todoist tasks fetch error:', error);
            throw error;
        }
    }

    // Todoist 우선순위를 아이젠하워 매트릭스 4분면으로 매핑
    mapPriorityToQuadrant(priority, dueDate) {
        const isUrgent = dueDate && this.isTaskUrgent(dueDate);
        const isImportant = priority >= 3; // P1, P2를 중요로 간주

        if (isUrgent && isImportant) return 'q1';  // 긴급&중요
        if (!isUrgent && isImportant) return 'q2'; // 중요
        if (isUrgent && !isImportant) return 'q3'; // 긴급
        return 'q4'; // 나중에
    }

    // 작업이 긴급한지 판단 (마감일 기준)
    isTaskUrgent(dueDate) {
        if (!dueDate) return false;
        
        const today = new Date();
        const due = new Date(dueDate);
        const diffInDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        
        return diffInDays <= 2; // 2일 이내면 긴급
    }

    // Todoist 라벨을 GTD 컨텍스트로 변환
    mapLabelsToContexts(labels) {
        const contextMapping = {
            '집': '@집',
            '사무실': '@사무실', 
            '외출': '@외출',
            '온라인': '@온라인',
            '전화': '@전화',
            '컴퓨터': '@컴퓨터',
            '회의': '@회의',
            '15분': '@15분',
            '30분': '@30분',
            '1시간': '@1시간이상'
        };

        const contexts = [];
        labels.forEach(label => {
            const context = contextMapping[label] || `@${label}`;
            contexts.push(context);
        });

        return contexts;
    }

    // Todoist 작업을 Clarity Matrix 형식으로 변환
    convertToGTDTask(todoistTask, projects, labels) {
        const project = projects.find(p => p.id === todoistTask.project_id);
        const taskLabels = labels.filter(l => todoistTask.labels?.includes(l.id));
        
        return {
            id: `todoist-${todoistTask.id}`,
            name: todoistTask.content,
            description: todoistTask.description || '',
            quadrant: this.mapPriorityToQuadrant(todoistTask.priority, todoistTask.due?.date),
            completed: todoistTask.is_completed || false,
            createdAt: todoistTask.created_at,
            updatedAt: new Date().toISOString(),
            dueDate: todoistTask.due?.date,
            project: project?.name || 'Todoist',
            contexts: this.mapLabelsToContexts(taskLabels.map(l => l.name)),
            source: 'todoist',
            externalId: todoistTask.id.toString(),
            externalUrl: todoistTask.url,
            priority: todoistTask.priority,
            labels: taskLabels.map(l => l.name),
            originalData: todoistTask
        };
    }

    // 전체 동기화
    async syncTasks() {
        if (!this.isConnected) {
            throw new Error('Todoist에 연결되어 있지 않습니다.');
        }

        try {
            // 병렬로 데이터 가져오기
            const [tasks, projects, labels] = await Promise.all([
                this.getTasks(),
                this.getProjects(),
                this.getLabels()
            ]);

            // GTD 형식으로 변환
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
            console.error('Todoist sync error:', error);
            return {
                success: false,
                error: error.message,
                tasks: []
            };
        }
    }

    // 라벨 가져오기
    async getLabels() {
        try {
            const response = await fetch(`${this.baseUrl}/labels`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                return []; // 라벨이 없어도 계속 진행
            }
        } catch (error) {
            console.error('Todoist labels fetch error:', error);
            return [];
        }
    }

    // 연결 해제
    disconnect() {
        this.token = null;
        this.isConnected = false;
        localStorage.removeItem('todoist_connected');
        localStorage.removeItem('todoist_token');
    }

    // 동기화 통계 생성
    // Clarity Matrix → Todoist 작업 생성
    async createTask(clarityTask) {
        if (!this.isConnected || !this.token) {
            throw new Error('Todoist에 연결되어 있지 않습니다.');
        }

        try {
            const todoistTask = this.convertFromGTDTask(clarityTask);
            
            const response = await fetch(`${this.baseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoistTask)
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    todoistTask: result,
                    message: 'Todoist에 작업이 생성되었습니다.'
                };
            } else {
                throw new Error('작업 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Todoist task creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clarity Matrix → Todoist 작업 업데이트
    async updateTask(clarityTask) {
        if (!this.isConnected || !this.token || !clarityTask.externalId) {
            throw new Error('Todoist 연결이 없거나 외부 ID가 없습니다.');
        }

        try {
            const todoistTask = this.convertFromGTDTask(clarityTask);
            
            const response = await fetch(`${this.baseUrl}/tasks/${clarityTask.externalId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoistTask)
            });

            if (response.ok) {
                return {
                    success: true,
                    message: 'Todoist 작업이 업데이트되었습니다.'
                };
            } else {
                throw new Error('작업 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('Todoist task update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clarity Matrix → Todoist 작업 완료
    async completeTask(clarityTask) {
        if (!clarityTask.externalId) return { success: false };

        try {
            const response = await fetch(`${this.baseUrl}/tasks/${clarityTask.externalId}/close`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return { success: response.ok };
        } catch (error) {
            console.error('Todoist task completion error:', error);
            return { success: false, error: error.message };
        }
    }

    // GTD 작업을 Todoist 형식으로 변환
    convertFromGTDTask(clarityTask) {
        const todoistTask = {
            content: clarityTask.name,
            description: clarityTask.description || '',
            priority: this.mapQuadrantToPriority(clarityTask.quadrant),
        };

        // 마감일 설정
        if (clarityTask.dueDate) {
            todoistTask.due_date = clarityTask.dueDate.split('T')[0];
        }

        // 프로젝트 ID (기본 프로젝트 사용)
        if (clarityTask.project && clarityTask.project !== 'Todoist') {
            // 실제 구현에서는 프로젝트 매핑 테이블 필요
            todoistTask.project_id = this.getProjectIdByName(clarityTask.project);
        }

        // 라벨 변환 (컨텍스트 → 라벨)
        if (clarityTask.contexts && clarityTask.contexts.length > 0) {
            todoistTask.labels = clarityTask.contexts
                .map(ctx => ctx.replace('@', ''))
                .filter(label => label.length > 0);
        }

        return todoistTask;
    }

    // 4분면을 Todoist 우선순위로 변환
    mapQuadrantToPriority(quadrant) {
        const mapping = {
            'q1': 4, // 긴급&중요 → P1
            'q2': 3, // 중요 → P2
            'q3': 2, // 긴급 → P3
            'q4': 1  // 나중에 → P4
        };
        return mapping[quadrant] || 1;
    }

    // 프로젝트 이름으로 ID 찾기 (캐시 필요)
    getProjectIdByName(projectName) {
        // 실제 구현에서는 프로젝트 목록을 캐시하고 매핑
        // 현재는 기본 프로젝트 ID 반환
        return null; // 기본 Inbox
    }

    generateSyncStats(syncResult) {
        if (!syncResult.success) return null;

        const stats = {
            total: syncResult.tasks.length,
            byQuadrant: {
                q1: 0, q2: 0, q3: 0, q4: 0
            },
            byProject: {},
            urgent: 0,
            important: 0
        };

        syncResult.tasks.forEach(task => {
            // 사분면별 통계
            stats.byQuadrant[task.quadrant]++;
            
            // 프로젝트별 통계  
            const project = task.project || '기타';
            stats.byProject[project] = (stats.byProject[project] || 0) + 1;
            
            // 긴급/중요 통계
            if (['q1', 'q3'].includes(task.quadrant)) stats.urgent++;
            if (['q1', 'q2'].includes(task.quadrant)) stats.important++;
        });

        return stats;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.TodoistIntegration = TodoistIntegration;