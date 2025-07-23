// Integration Manager - 모든 외부 도구 통합 관리

class IntegrationManager {
    constructor(app) {
        this.app = app; // ClarityMatrix 앱 인스턴스
        this.integrations = new Map();
        this.syncHistory = JSON.parse(localStorage.getItem('sync_history')) || [];
        this.conflictResolver = new ConflictResolver();
        
        // 통합 모듈 등록
        this.registerIntegrations();
    }

    // 사용 가능한 통합 모듈 등록
    registerIntegrations() {
        this.integrations.set('todoist', new TodoistIntegration());
        this.integrations.set('google-calendar', new GoogleCalendarSimpleIntegration());
        this.integrations.set('jira', new JiraIntegration());
    }

    // 특정 서비스와 연결
    async connectService(serviceName, credentials) {
        const integration = this.integrations.get(serviceName);
        if (!integration) {
            throw new Error(`지원하지 않는 서비스입니다: ${serviceName}`);
        }

        try {
            const result = await integration.connect(credentials);
            if (result.success) {
                this.logSyncHistory(serviceName, 'connected', result);
            }
            return result;
        } catch (error) {
            this.logSyncHistory(serviceName, 'connection_failed', { error: error.message });
            throw error;
        }
    }

    // 특정 서비스 동기화
    async syncService(serviceName, options = {}) {
        const integration = this.integrations.get(serviceName);
        if (!integration || !integration.isConnected) {
            throw new Error(`${serviceName} 서비스가 연결되어 있지 않습니다.`);
        }

        try {
            const syncResult = await integration.syncTasks(options);
            
            if (syncResult.success) {
                // 기존 외부 작업 제거 (해당 서비스의)
                this.removeExistingExternalTasks(serviceName);
                
                // 새로운 작업 추가
                await this.importTasks(syncResult.tasks, serviceName);
                
                // 동기화 기록 저장
                this.logSyncHistory(serviceName, 'sync_success', {
                    count: syncResult.tasks.length,
                    timestamp: syncResult.syncedAt
                });

                // 앱 UI 업데이트
                this.app.render();
            }

            return syncResult;
        } catch (error) {
            this.logSyncHistory(serviceName, 'sync_failed', { error: error.message });
            throw error;
        }
    }

    // 모든 연결된 서비스 동기화
    async syncAll() {
        const results = [];
        
        for (const [serviceName, integration] of this.integrations) {
            if (integration.isConnected) {
                try {
                    const result = await this.syncService(serviceName);
                    results.push({
                        service: serviceName,
                        success: true,
                        count: result.tasks?.length || 0
                    });
                } catch (error) {
                    results.push({
                        service: serviceName,
                        success: false,
                        error: error.message
                    });
                }
            }
        }

        return results;
    }

    // 기존 외부 작업 제거 (중복 방지)
    removeExistingExternalTasks(serviceName) {
        this.app.tasks = this.app.tasks.filter(task => 
            task.source !== serviceName
        );
        this.app.saveData();
    }

    // 외부 작업 가져오기
    async importTasks(externalTasks, serviceName) {
        const processedTasks = [];
        
        for (const task of externalTasks) {
            // 충돌 검사 및 해결
            const resolvedTask = await this.conflictResolver.resolveTask(task, this.app.tasks);
            
            // GTD 컨텍스트 추론
            resolvedTask.inferredContexts = this.inferContexts(resolvedTask);
            
            // 최종 작업 추가
            processedTasks.push(resolvedTask);
        }

        // 앱에 작업 추가
        this.app.tasks.push(...processedTasks);
        this.app.saveData();

        return processedTasks;
    }

    // 컨텍스트 자동 추론
    inferContexts(task) {
        const contexts = [...(task.contexts || [])];
        
        // 키워드 기반 컨텍스트 추론
        const keywords = {
            '@전화': ['전화', '콜', '통화', 'call'],
            '@회의': ['미팅', '회의', '회의실', 'meeting'],
            '@외출': ['방문', '출장', '외부', '나가기'],
            '@온라인': ['이메일', '온라인', '웹', '검토', 'email', 'review'],
            '@개발': ['코딩', '개발', '버그', '테스트', 'bug', 'dev'],
            '@문서': ['작성', '문서', '보고서', '기획', 'doc']
        };

        const text = `${task.name} ${task.description || ''}`.toLowerCase();
        
        for (const [context, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word)) && !contexts.includes(context)) {
                contexts.push(context);
            }
        }

        // 마감일 기반 컨텍스트
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const diffInDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffInDays <= 1 && !contexts.includes('@긴급')) {
                contexts.push('@긴급');
            }
        }

        return contexts;
    }

    // 동기화 기록 저장
    logSyncHistory(service, action, data) {
        const entry = {
            service,
            action,
            timestamp: new Date().toISOString(),
            data
        };

        this.syncHistory.unshift(entry);
        
        // 최근 100개만 유지
        if (this.syncHistory.length > 100) {
            this.syncHistory = this.syncHistory.slice(0, 100);
        }

        localStorage.setItem('sync_history', JSON.stringify(this.syncHistory));
    }

    // 연결된 서비스 목록
    getConnectedServices() {
        const services = [];
        
        for (const [name, integration] of this.integrations) {
            services.push({
                name,
                connected: integration.isConnected,
                lastSync: this.getLastSyncTime(name)
            });
        }

        return services;
    }

    // 마지막 동기화 시간
    getLastSyncTime(service) {
        const lastSync = this.syncHistory.find(
            entry => entry.service === service && entry.action === 'sync_success'
        );
        return lastSync ? lastSync.timestamp : null;
    }

    // 동기화 통계
    getSyncStats() {
        const stats = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            tasksBySource: {},
            lastWeekActivity: []
        };

        // 전체 통계
        this.syncHistory.forEach(entry => {
            if (entry.action === 'sync_success') {
                stats.successfulSyncs++;
                stats.totalSyncs++;
            } else if (entry.action === 'sync_failed') {
                stats.failedSyncs++;
                stats.totalSyncs++;
            }
        });

        // 소스별 작업 수
        this.app.tasks.forEach(task => {
            if (task.source && task.source !== 'manual') {
                stats.tasksBySource[task.source] = (stats.tasksBySource[task.source] || 0) + 1;
            }
        });

        return stats;
    }

    // 새 작업을 외부 서비스에 생성 (양방향 동기화)
    async createExternalTask(task, targetServices = []) {
        const results = [];
        
        // 대상 서비스가 지정되지 않으면 연결된 모든 서비스에 생성
        const services = targetServices.length > 0 ? 
            targetServices : 
            Array.from(this.integrations.keys()).filter(name => 
                this.integrations.get(name).isConnected
            );

        for (const serviceName of services) {
            const integration = this.integrations.get(serviceName);
            if (integration && integration.isConnected && integration.createTask) {
                try {
                    const result = await integration.createTask(task);
                    
                    if (result.success) {
                        // 외부 ID 저장하여 양방향 링크 생성
                        task.externalId = result.todoistTask?.id?.toString();
                        task.externalUrl = result.todoistTask?.url;
                        task.source = serviceName;
                        
                        this.logSyncHistory(serviceName, 'task_created', {
                            taskId: task.id,
                            externalId: task.externalId
                        });
                    }
                    
                    results.push({
                        service: serviceName,
                        success: result.success,
                        message: result.message || result.error
                    });
                } catch (error) {
                    results.push({
                        service: serviceName,
                        success: false,
                        error: error.message
                    });
                }
            }
        }

        return results;
    }

    // 작업 업데이트를 외부 서비스에 동기화
    async updateExternalTask(task) {
        if (!task.source || task.source === 'manual') return [];

        const integration = this.integrations.get(task.source);
        if (!integration || !integration.isConnected || !integration.updateTask) {
            return [];
        }

        try {
            const result = await integration.updateTask(task);
            
            this.logSyncHistory(task.source, 'task_updated', {
                taskId: task.id,
                externalId: task.externalId,
                success: result.success
            });

            return [{
                service: task.source,
                success: result.success,
                message: result.message || result.error
            }];
        } catch (error) {
            return [{
                service: task.source,
                success: false,
                error: error.message
            }];
        }
    }

    // 작업 완료를 외부 서비스에 동기화
    async completeExternalTask(task) {
        if (!task.source || task.source === 'manual') return [];

        const integration = this.integrations.get(task.source);
        if (!integration || !integration.isConnected || !integration.completeTask) {
            return [];
        }

        try {
            const result = await integration.completeTask(task);
            
            this.logSyncHistory(task.source, 'task_completed', {
                taskId: task.id,
                externalId: task.externalId,
                success: result.success
            });

            return [{
                service: task.source,
                success: result.success,
                message: result.message || result.error
            }];
        } catch (error) {
            return [{
                service: task.source,
                success: false,
                error: error.message
            }];
        }
    }

    // 서비스 연결 해제
    disconnectService(serviceName) {
        const integration = this.integrations.get(serviceName);
        if (integration) {
            integration.disconnect();
            
            // 해당 서비스의 작업 제거
            this.removeExistingExternalTasks(serviceName);
            
            // 연결 해제 기록
            this.logSyncHistory(serviceName, 'disconnected', {});
            
            // UI 업데이트
            this.app.render();
        }
    }

    // 자동 동기화 설정
    setupAutoSync(interval = 300000) { // 5분마다
        setInterval(async () => {
            try {
                await this.syncAll();
                console.log('자동 동기화 완료');
            } catch (error) {
                console.error('자동 동기화 실패:', error);
            }
        }, interval);
    }
}

// 충돌 해결 클래스
class ConflictResolver {
    async resolveTask(newTask, existingTasks) {
        // 이름이 같은 작업이 있는지 확인
        const duplicate = existingTasks.find(existing => 
            existing.name.toLowerCase() === newTask.name.toLowerCase() &&
            existing.source !== newTask.source
        );

        if (duplicate) {
            // 충돌 해결 규칙
            return this.mergeConflictingTasks(duplicate, newTask);
        }

        return newTask;
    }

    mergeConflictingTasks(existing, newTask) {
        // 우선순위: 수동 입력 > 외부 도구
        if (existing.source === 'manual') {
            // 수동 입력된 작업 우선, 외부 정보만 추가
            return {
                ...existing,
                externalSources: [
                    ...(existing.externalSources || []),
                    {
                        source: newTask.source,
                        id: newTask.externalId,
                        url: newTask.externalUrl,
                        syncedAt: new Date().toISOString()
                    }
                ]
            };
        } else {
            // 외부 도구끼리 충돌시 더 최근 것 사용
            const existingDate = new Date(existing.updatedAt || existing.createdAt);
            const newDate = new Date(newTask.updatedAt || newTask.createdAt);
            
            return newDate > existingDate ? newTask : existing;
        }
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.IntegrationManager = IntegrationManager;
window.ConflictResolver = ConflictResolver;