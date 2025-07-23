// Enhanced Storage Manager for Settings Persistence

class StorageManager {
    constructor() {
        this.storageKey = 'clarity_matrix_settings';
        this.backupKey = 'clarity_matrix_backup';
        this.version = '1.0.0';
        
        // 기본 설정
        this.defaultSettings = {
            version: this.version,
            theme: 'light',
            language: 'ko',
            autoSave: true,
            autoSync: {
                enabled: true,
                interval: 300000 // 5분
            },
            integrations: {
                todoist: {
                    connected: false,
                    token: null,
                    autoSync: true
                },
                googleCalendar: {
                    connected: false,
                    calendarId: null,
                    calendarUrl: null,
                    calendarName: null,
                    autoSync: true
                },
                jira: {
                    connected: false,
                    baseUrl: null,
                    username: null,
                    apiToken: null,
                    projectKey: null,
                    jql: null,
                    autoSync: true
                }
            },
            ui: {
                sidebarCollapsed: false,
                defaultView: 'main',
                showCompletedTasks: false,
                taskSortOrder: 'created',
                matrixLayout: 'grid'
            },
            notifications: {
                enabled: true,
                syncSuccess: true,
                syncErrors: true,
                taskReminders: false
            }
        };
        
        this.init();
    }

    // 초기화
    init() {
        this.migrateOldSettings();
        this.validateSettings();
    }

    // 기존 localStorage 데이터를 새로운 구조로 마이그레이션
    migrateOldSettings() {
        try {
            const oldSettings = {
                todoistConnected: localStorage.getItem('todoist_connected') === 'true',
                todoistToken: localStorage.getItem('todoist_token'),
                googleCalendarConnected: localStorage.getItem('google_calendar_simple_connected') === 'true',
                googleCalendarId: localStorage.getItem('google_calendar_simple_id'),
                googleCalendarUrl: localStorage.getItem('google_calendar_simple_url'),
                googleCalendarName: localStorage.getItem('google_calendar_simple_name'),
                jiraConnected: localStorage.getItem('jira_connected') === 'true',
                jiraBaseUrl: localStorage.getItem('jira_base_url'),
                jiraUsername: localStorage.getItem('jira_username'),
                jiraApiToken: localStorage.getItem('jira_api_token'),
                jiraProjectKey: localStorage.getItem('jira_project_key'),
                jiraJql: localStorage.getItem('jira_jql')
            };

            // 기존 설정이 있으면 새 구조로 변환
            let needsMigration = false;
            const currentSettings = this.getSettings();

            if (oldSettings.todoistConnected && oldSettings.todoistToken) {
                currentSettings.integrations.todoist.connected = true;
                currentSettings.integrations.todoist.token = oldSettings.todoistToken;
                needsMigration = true;
            }

            if (oldSettings.googleCalendarConnected) {
                currentSettings.integrations.googleCalendar.connected = true;
                currentSettings.integrations.googleCalendar.calendarId = oldSettings.googleCalendarId;
                currentSettings.integrations.googleCalendar.calendarUrl = oldSettings.googleCalendarUrl;
                currentSettings.integrations.googleCalendar.calendarName = oldSettings.googleCalendarName;
                needsMigration = true;
            }

            if (oldSettings.jiraConnected) {
                currentSettings.integrations.jira.connected = true;
                currentSettings.integrations.jira.baseUrl = oldSettings.jiraBaseUrl;
                currentSettings.integrations.jira.username = oldSettings.jiraUsername;
                currentSettings.integrations.jira.apiToken = oldSettings.jiraApiToken;
                currentSettings.integrations.jira.projectKey = oldSettings.jiraProjectKey;
                currentSettings.integrations.jira.jql = oldSettings.jiraJql;
                needsMigration = true;
            }

            if (needsMigration) {
                this.saveSettings(currentSettings);
                console.log('✅ 기존 설정이 새로운 구조로 마이그레이션되었습니다.');
                
                // 기존 개별 설정 항목들 삭제
                const keysToRemove = [
                    'todoist_connected', 'todoist_token',
                    'google_calendar_simple_connected', 'google_calendar_simple_id', 
                    'google_calendar_simple_url', 'google_calendar_simple_name',
                    'jira_connected', 'jira_base_url', 'jira_username', 
                    'jira_api_token', 'jira_project_key', 'jira_jql'
                ];
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

        } catch (error) {
            console.warn('설정 마이그레이션 중 오류:', error);
        }
    }

    // 설정 유효성 검사
    validateSettings() {
        const settings = this.getSettings();
        let isValid = true;

        // 버전 체크
        if (settings.version !== this.version) {
            console.log(`설정 버전 업데이트: ${settings.version} → ${this.version}`);
            settings.version = this.version;
            isValid = false;
        }

        // 필수 키 존재 확인
        const requiredKeys = ['integrations', 'ui', 'notifications'];
        requiredKeys.forEach(key => {
            if (!settings[key]) {
                settings[key] = this.defaultSettings[key];
                isValid = false;
            }
        });

        if (!isValid) {
            this.saveSettings(settings);
        }
    }

    // 전체 설정 가져오기
    getSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const settings = JSON.parse(stored);
                return { ...this.defaultSettings, ...settings };
            }
        } catch (error) {
            console.error('설정 로드 오류:', error);
        }
        
        return { ...this.defaultSettings };
    }

    // 전체 설정 저장
    saveSettings(settings) {
        try {
            const toSave = {
                ...settings,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
            this.createBackup();
            return true;
        } catch (error) {
            console.error('설정 저장 오류:', error);
            return false;
        }
    }

    // 특정 설정 섹션 가져오기
    getSection(sectionName) {
        const settings = this.getSettings();
        return settings[sectionName] || {};
    }

    // 특정 설정 섹션 저장
    saveSection(sectionName, sectionData) {
        const settings = this.getSettings();
        settings[sectionName] = { ...settings[sectionName], ...sectionData };
        return this.saveSettings(settings);
    }

    // 통합 서비스 설정 가져오기
    getIntegrationSettings(serviceName) {
        const settings = this.getSettings();
        return settings.integrations[serviceName] || {};
    }

    // 통합 서비스 설정 저장
    saveIntegrationSettings(serviceName, integrationData) {
        const settings = this.getSettings();
        if (!settings.integrations[serviceName]) {
            settings.integrations[serviceName] = {};
        }
        
        settings.integrations[serviceName] = {
            ...settings.integrations[serviceName],
            ...integrationData
        };
        
        return this.saveSettings(settings);
    }

    // 설정 백업 생성
    createBackup() {
        try {
            const currentSettings = localStorage.getItem(this.storageKey);
            if (currentSettings) {
                const backup = {
                    settings: currentSettings,
                    timestamp: new Date().toISOString(),
                    version: this.version
                };
                
                localStorage.setItem(this.backupKey, JSON.stringify(backup));
            }
        } catch (error) {
            console.warn('백업 생성 실패:', error);
        }
    }

    // 설정 백업 복원
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                const backupData = JSON.parse(backup);
                localStorage.setItem(this.storageKey, backupData.settings);
                
                console.log('✅ 백업에서 설정을 복원했습니다.');
                return true;
            }
        } catch (error) {
            console.error('백업 복원 실패:', error);
        }
        
        return false;
    }

    // 설정 내보내기
    exportSettings() {
        const settings = this.getSettings();
        const exportData = {
            ...settings,
            exportedAt: new Date().toISOString(),
            exportVersion: this.version
        };

        // 민감한 정보 제거 (토큰, 비밀번호 등)
        if (exportData.integrations) {
            Object.keys(exportData.integrations).forEach(service => {
                const integration = exportData.integrations[service];
                if (integration.token) integration.token = '[REDACTED]';
                if (integration.apiToken) integration.apiToken = '[REDACTED]';
            });
        }

        const blob = new Blob(
            [JSON.stringify(exportData, null, 2)], 
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `clarity-matrix-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 설정 가져오기 (파일에서)
    importSettings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // 버전 호환성 확인
                    if (importedData.exportVersion && 
                        importedData.exportVersion !== this.version) {
                        console.warn(`버전 불일치: ${importedData.exportVersion} → ${this.version}`);
                    }
                    
                    // 민감한 정보는 제외하고 가져오기
                    const safeSettings = { ...importedData };
                    delete safeSettings.exportedAt;
                    delete safeSettings.exportVersion;
                    
                    if (safeSettings.integrations) {
                        Object.keys(safeSettings.integrations).forEach(service => {
                            const integration = safeSettings.integrations[service];
                            if (integration.token === '[REDACTED]') delete integration.token;
                            if (integration.apiToken === '[REDACTED]') delete integration.apiToken;
                        });
                    }
                    
                    this.saveSettings(safeSettings);
                    resolve(true);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file);
        });
    }

    // 모든 설정 초기화
    resetAllSettings() {
        if (confirm('모든 설정을 초기화하시겠습니까?\n통합 연결 정보도 모두 삭제됩니다.')) {
            this.createBackup();
            localStorage.removeItem(this.storageKey);
            this.saveSettings(this.defaultSettings);
            
            console.log('✅ 모든 설정이 초기화되었습니다.');
            return true;
        }
        
        return false;
    }

    // 저장소 정보 가져오기
    getStorageInfo() {
        const settings = this.getSettings();
        const tasksData = localStorage.getItem('tasks');
        const projectsData = localStorage.getItem('projects');
        const syncHistory = localStorage.getItem('sync_history');
        
        return {
            settingsSize: this.calculateSize(this.storageKey),
            tasksSize: this.calculateSize('tasks'),
            projectsSize: this.calculateSize('projects'),
            syncHistorySize: this.calculateSize('sync_history'),
            totalSize: this.getTotalStorageSize(),
            lastUpdated: settings.lastUpdated,
            version: settings.version,
            connectedIntegrations: Object.keys(settings.integrations)
                .filter(key => settings.integrations[key].connected)
        };
    }

    // 특정 키의 크기 계산
    calculateSize(key) {
        const data = localStorage.getItem(key);
        return data ? new Blob([data]).size : 0;
    }

    // 전체 저장소 크기 계산
    getTotalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.StorageManager = StorageManager;