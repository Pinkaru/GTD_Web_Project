// Clarity Matrix - GTD Web Application JavaScript

class ClarityMatrix {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.projects = JSON.parse(localStorage.getItem('projects')) || [];
        this.currentProjectId = null;
        this.currentViewDate = new Date();
        
        // 설정 관리자 초기화
        try {
            this.storageManager = new StorageManager();
            console.log('✅ StorageManager 초기화 완료');
        } catch (error) {
            console.error('❌ StorageManager 초기화 실패:', error);
            console.log('StorageManager 없이 계속 진행...');
            this.storageManager = null;
        }
        
        // 통합 관리자 초기화
        this.integrationManager = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeIntegrations();
        this.render();
    }

    // 통합 모듈 초기화
    initializeIntegrations() {
        // IntegrationManager가 로드되었는지 확인
        if (typeof IntegrationManager !== 'undefined') {
            this.integrationManager = new IntegrationManager(this);
            
            // 저장된 연결 상태 복원
            this.restoreIntegrationConnections();
        }
    }

    // 저장된 통합 연결 상태 복원
    restoreIntegrationConnections() {
        if (this.integrationManager) {
            // Todoist 연결 상태 복원
            const todoistIntegration = this.integrationManager.integrations.get('todoist');
            if (todoistIntegration) {
                todoistIntegration.restoreConnection();
            }
            
            // Google Calendar 연결 상태 복원
            const googleCalendarIntegration = this.integrationManager.integrations.get('google-calendar');
            if (googleCalendarIntegration) {
                googleCalendarIntegration.restoreConnection();
            }
            
            // JIRA 연결 상태 복원
            const jiraIntegration = this.integrationManager.integrations.get('jira');
            if (jiraIntegration) {
                jiraIntegration.restoreConnection();
            }
            
            this.updateIntegrationUI();
        }
    }

    // Data Persistence
    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Event Binding
    bindEvents() {
        console.log('🔗 이벤트 바인딩 시작...');
        
        // Task Form (Inbox)
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            console.log('✅ task-form 찾음, 이벤트 바인딩');
            taskForm.addEventListener('submit', (e) => {
                console.log('📝 작업 추가 이벤트 발생');
                this.addTask(e);
            });
        } else {
            console.log('❌ task-form을 찾을 수 없음');
        }

        // Project Form
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            console.log('✅ project-form 찾음, 이벤트 바인딩');
            projectForm.addEventListener('submit', (e) => {
                console.log('📁 프로젝트 추가 이벤트 발생');
                this.addProject(e);
            });
        } else {
            console.log('❌ project-form을 찾을 수 없음');
        }

        // Project Task Form
        const projectTaskForm = document.getElementById('project-task-form');
        if (projectTaskForm) {
            console.log('✅ project-task-form 찾음, 이벤트 바인딩');
            projectTaskForm.addEventListener('submit', (e) => {
                console.log('📋 프로젝트 작업 추가 이벤트 발생');
                this.addProjectTask(e);
            });
        } else {
            console.log('❌ project-task-form을 찾을 수 없음');
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }

    // Task Management
    async addTask(e) {
        console.log('🎯 addTask 메서드 호출됨');
        e.preventDefault();
        const taskInput = document.getElementById('task-input');
        const quadrantSelect = document.getElementById('task-quadrant-select');
        
        console.log('📝 입력값:', taskInput?.value, '우선순위:', quadrantSelect?.value);
        
        if (!taskInput.value.trim()) {
            console.log('❌ 입력값이 비어있음');
            return;
        }

        const task = {
            id: this.generateId(),
            name: taskInput.value.trim(),
            quadrant: quadrantSelect ? quadrantSelect.value : 'q3',
            completed: false,
            createdAt: new Date().toISOString(),
            projectId: null,
            source: 'manual'
        };

        this.tasks.push(task);
        console.log('✅ 작업 추가됨:', task);
        this.saveData();
        
        // 양방향 동기화: 연결된 외부 서비스에도 생성
        if (this.integrationManager) {
            try {
                const results = await this.integrationManager.createExternalTask(task, ['todoist']);
                
                // 성공 시 외부 링크 정보 업데이트
                if (results.length > 0 && results[0].success) {
                    this.saveData(); // 외부 ID가 추가된 task 저장
                    
                    // 사용자에게 알림 (선택사항)
                    const successServices = results.filter(r => r.success).map(r => r.service);
                    if (successServices.length > 0) {
                        console.log(`작업이 ${successServices.join(', ')}에도 생성되었습니다.`);
                    }
                }
            } catch (error) {
                console.error('외부 서비스 동기화 실패:', error);
                // 실패해도 로컬 작업은 유지
            }
        }
        
        taskInput.value = '';
        console.log('🔄 렌더링 시작...');
        this.render();
    }

    addProjectTask(e) {
        e.preventDefault();
        const taskInput = document.getElementById('project-task-input');
        const quadrantSelect = document.getElementById('project-task-quadrant-select');
        
        if (!taskInput.value.trim() || !this.currentProjectId) return;

        const task = {
            id: this.generateId(),
            name: taskInput.value.trim(),
            quadrant: quadrantSelect ? quadrantSelect.value : 'q2',
            completed: false,
            createdAt: new Date().toISOString(),
            projectId: this.currentProjectId
        };

        this.tasks.push(task);
        this.saveData();
        
        taskInput.value = '';
        this.render();
    }

    async completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            
            // 양방향 동기화: 외부 서비스에도 완료 상태 동기화
            if (this.integrationManager && task.source && task.source !== 'manual') {
                try {
                    await this.integrationManager.completeExternalTask(task);
                    console.log(`${task.source}에서도 작업이 완료되었습니다.`);
                } catch (error) {
                    console.error('외부 서비스 완료 동기화 실패:', error);
                }
            }
            
            this.saveData();
            this.render();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.render();
    }

    async moveTaskToQuadrant(taskId, quadrant) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const oldQuadrant = task.quadrant;
            task.quadrant = quadrant;
            
            // 양방향 동기화: 우선순위 변경을 외부 서비스에도 반영
            if (this.integrationManager && task.source && task.source !== 'manual') {
                try {
                    await this.integrationManager.updateExternalTask(task);
                    console.log(`${task.source}에서 우선순위가 업데이트되었습니다: ${oldQuadrant} → ${quadrant}`);
                } catch (error) {
                    console.error('외부 서비스 업데이트 실패:', error);
                    // 실패해도 로컬 변경은 유지
                }
            }
            
            this.saveData();
            this.render();
        }
    }

    // Project Management
    addProject(e) {
        console.log('🎯 addProject 메서드 호출됨');
        e.preventDefault();
        const projectInput = document.getElementById('project-input');
        
        console.log('📁 프로젝트 입력값:', projectInput?.value);
        
        if (!projectInput.value.trim()) {
            console.log('❌ 프로젝트명이 비어있음');
            return;
        }

        const project = {
            id: this.generateId(),
            name: projectInput.value.trim(),
            createdAt: new Date().toISOString()
        };

        this.projects.push(project);
        console.log('✅ 프로젝트 추가됨:', project);
        this.saveData();
        
        projectInput.value = '';
        console.log('🔄 렌더링 시작...');
        this.render();
    }

    selectProject(projectId) {
        this.currentProjectId = projectId;
        this.render();
    }

    deleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            console.log('❌ 프로젝트를 찾을 수 없음:', projectId);
            return;
        }
        
        const taskCount = this.getTasksByProject(projectId).length;
        const confirmMessage = taskCount > 0 
            ? `"${project.name}" 프로젝트와 관련된 ${taskCount}개의 작업이 모두 삭제됩니다.\n정말 삭제하시겠습니까?`
            : `"${project.name}" 프로젝트를 삭제하시겠습니까?`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ 프로젝트 삭제 취소됨');
            return;
        }
        
        console.log('🗑️ 프로젝트 삭제:', project.name, `(작업 ${taskCount}개 포함)`);
        
        // Remove project
        this.projects = this.projects.filter(p => p.id !== projectId);
        
        // Remove all tasks associated with this project
        this.tasks = this.tasks.filter(t => t.projectId !== projectId);
        
        if (this.currentProjectId === projectId) {
            this.currentProjectId = null;
        }
        
        this.saveData();
        console.log('✅ 프로젝트 삭제 완료');
        this.render();
    }

    // Utility Methods
    clearSelection() {
        this.currentProjectId = null;
        this.render();
    }

    getTodayTasks() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => 
            !task.completed && 
            (task.quadrant === 'q1' || 
             new Date(task.createdAt).toDateString() === today ||
             (task.dueDate && new Date(task.dueDate).toDateString() === today))
        );
    }

    getTasksByDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.tasks.filter(task => 
            new Date(task.createdAt).toDateString() === targetDate
        );
    }

    getTasksByQuadrant(quadrant) {
        return this.tasks.filter(task => !task.completed && task.quadrant === quadrant);
    }

    getTasksByProject(projectId) {
        return this.tasks.filter(task => task.projectId === projectId);
    }

    getCompletedTasks() {
        return this.tasks.filter(task => task.completed);
    }

    // Rendering Methods
    render() {
        this.renderInboxTasks();
        this.renderTodayTasks();
        this.renderEisenhowerMatrix();
        this.renderProjects();
        this.renderProjectTasks();
        this.renderCompletedTasks();
        this.renderStats();
    }

    renderInboxTasks() {
        const inboxTaskList = document.getElementById('inbox-task-list');
        if (!inboxTaskList) return;

        const inboxTasks = this.tasks.filter(task => !task.completed && !task.projectId);
        
        if (inboxTasks.length === 0) {
            inboxTaskList.innerHTML = '<li class="empty-state"><div><h3>수신함이 비어있습니다</h3><p>새 작업을 추가해보세요</p></div></li>';
            return;
        }

        inboxTaskList.innerHTML = inboxTasks.map(task => `
            <li class="${task.source && task.source !== 'manual' ? 'external-task' : ''}">
                <div class="task-content">
                    <div class="task-name">
                        ${task.source && task.source !== 'manual' ? `<span class="source-badge ${task.source}">${this.getSourceIcon(task.source)}</span>` : ''}
                        ${task.name}
                    </div>
                    <div class="task-meta">
                        <span class="priority-${task.quadrant.replace('q', '')}">
                            ${this.getQuadrantName(task.quadrant)}
                        </span>
                        ${task.contexts && task.contexts.length > 0 ? 
                            task.contexts.map(ctx => `<span class="context-tag">${ctx}</span>`).join(' ') : ''
                        }
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-complete" onclick="app.completeTask('${task.id}')">완료</button>
                    <button class="btn-delete" onclick="app.deleteTask('${task.id}')">삭제</button>
                    ${task.externalUrl ? `<button class="btn-external" onclick="window.open('${task.externalUrl}', '_blank')" title="원본 보기">🔗</button>` : ''}
                </div>
            </li>
        `).join('');
    }

    renderTodayTasks() {
        const todayTaskList = document.getElementById('today-task-list');
        const currentDateEl = document.getElementById('current-date');
        
        if (!todayTaskList) return;

        // Update current date display
        if (currentDateEl) {
            const options = { month: 'long', day: 'numeric', weekday: 'short' };
            currentDateEl.textContent = this.currentViewDate.toLocaleDateString('ko-KR', options);
        }

        const viewDateTasks = this.getTasksByDate(this.currentViewDate);
        
        if (viewDateTasks.length === 0) {
            const isToday = this.currentViewDate.toDateString() === new Date().toDateString();
            const message = isToday ? 
                '<h3>오늘 할 일이 없습니다</h3><p>휴식을 취하거나 새로운 작업을 계획해보세요</p>' :
                '<h3>이 날짜에는 작업이 없습니다</h3><p>다른 날짜를 선택해보세요</p>';
            
            todayTaskList.innerHTML = `<li class="empty-state"><div>${message}</div></li>`;
            return;
        }

        todayTaskList.innerHTML = viewDateTasks.map(task => {
            const createdDate = new Date(task.createdAt).toLocaleDateString('ko-KR');
            return `
                <li>
                    <div class="task-content">
                        <div class="task-name">${task.name}</div>
                        <div class="task-meta">
                            <span class="priority-${task.quadrant.replace('q', '')}">
                                ${this.getQuadrantName(task.quadrant)}
                            </span>
                            <span style="margin-left: 1rem; font-size: 0.8rem; color: #64748b;">
                                생성: ${createdDate}
                            </span>
                            ${task.completed ? '<span style="margin-left: 0.5rem;">✓ 완료</span>' : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        ${!task.completed ? `<button class="btn-complete" onclick="app.completeTask('${task.id}')">완료</button>` : ''}
                        <button class="btn-delete" onclick="app.deleteTask('${task.id}')">삭제</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    renderEisenhowerMatrix() {
        const quadrants = ['q1', 'q2', 'q3', 'q4'];
        
        quadrants.forEach(quadrant => {
            const quadrantList = document.getElementById(`${quadrant}-list`);
            if (!quadrantList) return;

            // Add drag over event listener to the quadrant container
            quadrantList.addEventListener('dragover', (e) => this.dragOver(e));
            quadrantList.addEventListener('drop', (e) => this.drop(e, quadrant));

            const tasks = this.getTasksByQuadrant(quadrant);
            
            if (tasks.length === 0) {
                quadrantList.innerHTML = '<li class="empty-state"><div><p>작업이 없습니다</p></div></li>';
                return;
            }

            quadrantList.innerHTML = tasks.map(task => `
                <li draggable="true" 
                    data-task-id="${task.id}"
                    ondragstart="app.dragStart(event, '${task.id}')">
                    <div class="task-name">${task.name}</div>
                    <div class="task-actions" style="margin-top: 0.5rem;">
                        <button class="btn-complete" onclick="event.stopPropagation(); app.completeTask('${task.id}')">완료</button>
                        <button class="btn-delete" onclick="event.stopPropagation(); app.deleteTask('${task.id}')">삭제</button>
                    </div>
                </li>
            `).join('');
        });
    }

    renderProjects() {
        const projectList = document.getElementById('project-list');
        if (!projectList) return;

        if (this.projects.length === 0) {
            projectList.innerHTML = '<li class="empty-state"><div><p>프로젝트가 없습니다</p></div></li>';
            return;
        }

        projectList.innerHTML = this.projects.map(project => {
            const taskCount = this.getTasksByProject(project.id).length;
            const isSelected = this.currentProjectId === project.id;
            
            return `
                <li class="${isSelected ? 'selected' : ''}" onclick="app.selectProject('${project.id}')">
                    <div class="task-content">
                        <div class="task-name">${project.name}</div>
                        <div class="task-meta">${taskCount}개 작업</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-delete" onclick="event.stopPropagation(); app.deleteProject('${project.id}')" title="프로젝트 삭제">삭제</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    renderProjectTasks() {
        const projectTaskList = document.getElementById('project-task-list');
        const selectedProjectName = document.getElementById('selected-project-name');
        const projectTaskFormContainer = document.getElementById('project-task-form-container');
        
        if (!projectTaskList || !selectedProjectName) return;

        if (!this.currentProjectId) {
            selectedProjectName.textContent = '프로젝트를 선택하세요';
            projectTaskList.innerHTML = '';
            if (projectTaskFormContainer) {
                projectTaskFormContainer.style.display = 'none';
            }
            return;
        }

        const project = this.projects.find(p => p.id === this.currentProjectId);
        const projectTasks = this.getTasksByProject(this.currentProjectId);

        selectedProjectName.textContent = project ? project.name : '알 수 없는 프로젝트';
        
        if (projectTaskFormContainer) {
            projectTaskFormContainer.style.display = 'block';
        }

        if (projectTasks.length === 0) {
            projectTaskList.innerHTML = '<li class="empty-state"><div><p>이 프로젝트에는 작업이 없습니다</p></div></li>';
            return;
        }

        projectTaskList.innerHTML = projectTasks.map(task => `
            <li>
                <div class="task-content">
                    <div class="task-name">${task.name}</div>
                    <div class="task-meta">
                        <span class="priority-${task.quadrant.replace('q', '')}">
                            ${this.getQuadrantName(task.quadrant)}
                        </span>
                        ${task.completed ? '<span style="margin-left: 0.5rem;">✓ 완료</span>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${!task.completed ? `<button class="btn-complete" onclick="app.completeTask('${task.id}')">완료</button>` : ''}
                    <button class="btn-delete" onclick="app.deleteTask('${task.id}')">삭제</button>
                </div>
            </li>
        `).join('');
    }

    renderCompletedTasks() {
        const completedTaskList = document.getElementById('completed-task-list');
        if (!completedTaskList) return;

        const completedTasks = this.getCompletedTasks();
        
        if (completedTasks.length === 0) {
            completedTaskList.innerHTML = '<li class="empty-state"><div><h3>완료된 작업이 없습니다</h3><p>작업을 완료하면 여기에 표시됩니다</p></div></li>';
            return;
        }

        completedTaskList.innerHTML = completedTasks.map(task => {
            const completedDate = new Date(task.completedAt).toLocaleDateString('ko-KR');
            return `
                <li>
                    <div class="task-content">
                        <div class="task-name">${task.name}</div>
                        <div class="task-meta">
                            완료일: ${completedDate}
                            <span style="margin-left: 1rem;" class="priority-${task.quadrant.replace('q', '')}">
                                ${this.getQuadrantName(task.quadrant)}
                            </span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-delete" onclick="app.deleteTask('${task.id}')">삭제</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    // Drag and Drop for Eisenhower Matrix
    dragStart(event, taskId) {
        event.dataTransfer.setData('text/plain', taskId);
        event.dataTransfer.effectAllowed = 'move';
        
        // Add visual feedback
        event.target.style.opacity = '0.5';
    }

    dragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        // Visual feedback for drop zone
        const quadrant = event.currentTarget.closest('.matrix-quadrant');
        if (quadrant) {
            quadrant.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        }
    }

    drop(event, quadrant) {
        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain');
        
        // Remove visual feedback
        const allQuadrants = document.querySelectorAll('.matrix-quadrant');
        allQuadrants.forEach(q => q.style.backgroundColor = '');
        
        // Find and reset the dragged element opacity
        const draggedElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (draggedElement) {
            draggedElement.style.opacity = '1';
        }
        
        this.moveTaskToQuadrant(taskId, quadrant);
    }

    // Helper Methods
    getQuadrantName(quadrant) {
        const names = {
            'q1': '긴급 & 중요',
            'q2': '중요',
            'q3': '긴급',
            'q4': '나중에'
        };
        return names[quadrant] || '미정';
    }

    // 소스 아이콘 반환
    getSourceIcon(source) {
        const icons = {
            'todoist': '📋',
            'jira': '🎯',
            'google-calendar': '📅',
            'slack': '💬',
            'asana': '📊'
        };
        return icons[source] || '🔗';
    }

    // Settings and Data Management
    exportData() {
        const data = {
            tasks: this.tasks,
            projects: this.projects,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `clarity-matrix-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks && Array.isArray(data.tasks)) {
                    this.tasks = data.tasks;
                }
                
                if (data.projects && Array.isArray(data.projects)) {
                    this.projects = data.projects;
                }
                
                this.saveData();
                this.render();
                alert('데이터를 성공적으로 가져왔습니다.');
            } catch (error) {
                alert('잘못된 파일 형식입니다.');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    clearAllData() {
        if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.tasks = [];
            this.projects = [];
            this.currentProjectId = null;
            localStorage.removeItem('tasks');
            localStorage.removeItem('projects');
            this.storageManager.resetAllSettings();
            this.render();
            alert('모든 데이터가 삭제되었습니다.');
        }
    }

    // ========== 향상된 설정 관리 메서드들 ==========

    // 설정 내보내기
    exportSettings() {
        this.storageManager.exportSettings();
    }

    // 설정 가져오기
    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const success = await this.storageManager.importSettings(file);
            if (success) {
                alert('설정을 성공적으로 가져왔습니다.\n페이지를 새로고침하여 변경사항을 적용합니다.');
                location.reload();
            }
        } catch (error) {
            alert('설정 파일을 가져오는데 실패했습니다: ' + error.message);
        }
        
        event.target.value = ''; // 파일 입력 초기화
    }

    // 저장소 정보 표시
    showStorageInfo() {
        const info = this.storageManager.getStorageInfo();
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const message = `
📊 저장소 상태 정보
==================

💾 저장 용량:
- 설정: ${formatBytes(info.settingsSize)}
- 작업: ${formatBytes(info.tasksSize)}
- 프로젝트: ${formatBytes(info.projectsSize)}
- 동기화 기록: ${formatBytes(info.syncHistorySize)}
- 총 용량: ${formatBytes(info.totalSize)}

🔗 연결된 통합 서비스:
${info.connectedIntegrations.length > 0 ? 
    info.connectedIntegrations.map(service => `- ${service}`).join('\n') : 
    '- 연결된 서비스가 없습니다'
}

📅 마지막 업데이트: ${info.lastUpdated ? new Date(info.lastUpdated).toLocaleString('ko-KR') : '없음'}
🏷️ 설정 버전: ${info.version}
        `;

        alert(message);
    }

    // 설정 백업 복원
    restoreSettingsFromBackup() {
        if (confirm('백업에서 설정을 복원하시겠습니까?\n현재 설정이 덮어쓰여집니다.')) {
            const success = this.storageManager.restoreFromBackup();
            if (success) {
                alert('백업에서 설정을 복원했습니다.\n페이지를 새로고침합니다.');
                location.reload();
            } else {
                alert('복원할 백업을 찾을 수 없습니다.');
            }
        }
    }

    renderStats() {
        const totalTasksEl = document.getElementById('total-tasks');
        const completedTasksEl = document.getElementById('completed-tasks');
        const totalProjectsEl = document.getElementById('total-projects');
        const completionRateEl = document.getElementById('completion-rate');

        if (!totalTasksEl) return; // Not on settings page

        const totalTasks = this.tasks.length;
        const completedTasks = this.getCompletedTasks().length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        totalProjectsEl.textContent = this.projects.length;
        completionRateEl.textContent = `${completionRate}%`;
    }

    // Date Navigation Methods
    previousDay() {
        this.currentViewDate.setDate(this.currentViewDate.getDate() - 1);
        this.render();
    }

    nextDay() {
        this.currentViewDate.setDate(this.currentViewDate.getDate() + 1);
        this.render();
    }

    goToToday() {
        this.currentViewDate = new Date();
        this.render();
    }

    // ========== 통합 관련 메서드들 ==========

    // Todoist 연결 모달 표시
    showTodoistConnect() {
        const modal = document.getElementById('todoist-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Todoist 모달 닫기
    closeTodoistModal() {
        const modal = document.getElementById('todoist-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Todoist 연결
    async connectTodoist(event) {
        event.preventDefault();
        
        const tokenInput = document.getElementById('todoist-token');
        const autoSyncCheckbox = document.getElementById('auto-sync');
        
        if (!tokenInput.value.trim()) {
            alert('API 토큰을 입력해주세요.');
            return;
        }

        try {
            // 로딩 상태 표시
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '연결 중...';
            submitBtn.disabled = true;

            // Todoist 연결
            const result = await this.integrationManager.connectService('todoist', tokenInput.value.trim());
            
            if (result.success) {
                // 성공 시
                alert('Todoist 연결이 완료되었습니다!');
                this.closeTodoistModal();
                
                // UI 업데이트
                this.updateIntegrationUI();
                
                // 자동 동기화 설정
                if (autoSyncCheckbox.checked) {
                    this.integrationManager.setupAutoSync();
                }
                
                // 초기 동기화 실행
                await this.syncTodoist();
                
            } else {
                alert(`연결 실패: ${result.message}`);
            }
        } catch (error) {
            alert(`연결 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            // 버튼 상태 복원
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Todoist 동기화
    async syncTodoist() {
        if (!this.integrationManager) return;

        try {
            const result = await this.integrationManager.syncService('todoist');
            
            if (result.success) {
                const count = result.tasks?.length || 0;
                alert(`Todoist에서 ${count}개의 작업을 가져왔습니다.`);
                
                // 통계 업데이트
                this.updateSyncSummary();
            } else {
                alert(`동기화 실패: ${result.error}`);
            }
        } catch (error) {
            alert(`동기화 중 오류: ${error.message}`);
        }
    }

    // Todoist 연결 해제
    disconnectTodoist() {
        if (confirm('Todoist 연결을 해제하시겠습니까?\n연결 해제 시 Todoist에서 가져온 모든 작업이 삭제됩니다.')) {
            this.integrationManager.disconnectService('todoist');
            this.updateIntegrationUI();
            alert('Todoist 연결이 해제되었습니다.');
        }
    }

    // 통합 UI 업데이트
    updateIntegrationUI() {
        if (!this.integrationManager) return;

        // Todoist UI 업데이트
        this.updateTodoistUI();
        
        // Google Calendar UI 업데이트
        this.updateGoogleCalendarUI();
        
        // JIRA UI 업데이트
        this.updateJiraUI();
        
        // 통합 동기화 요약 업데이트
        this.updateIntegrationSummary();
    }

    // Todoist UI 업데이트
    updateTodoistUI() {
        const todoistIntegration = this.integrationManager.integrations.get('todoist');
        if (!todoistIntegration) return;

        const statusEl = document.getElementById('todoist-status');
        const connectBtn = document.getElementById('todoist-connect-btn');
        const syncBtn = document.getElementById('todoist-sync-btn');
        const disconnectBtn = document.getElementById('todoist-disconnect-btn');

        if (todoistIntegration.isConnected) {
            // 연결된 상태
            if (statusEl) {
                statusEl.textContent = '연결됨';
                statusEl.style.backgroundColor = '#dcfce7';
                statusEl.style.color = '#166534';
            }
            
            if (connectBtn) connectBtn.style.display = 'none';
            if (syncBtn) syncBtn.style.display = 'inline-block';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
        } else {
            // 연결 해제 상태
            if (statusEl) {
                statusEl.textContent = '연결되지 않음';
                statusEl.style.backgroundColor = '#fef3c7';
                statusEl.style.color = '#92400e';
            }
            
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (syncBtn) syncBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    }

    // Google Calendar UI 업데이트
    updateGoogleCalendarUI() {
        const calendarIntegration = this.integrationManager.integrations.get('google-calendar');
        if (!calendarIntegration) return;

        const statusEl = document.getElementById('google-calendar-status');
        const connectBtn = document.getElementById('google-calendar-connect-btn');
        const syncBtn = document.getElementById('google-calendar-sync-btn');
        const disconnectBtn = document.getElementById('google-calendar-disconnect-btn');

        if (calendarIntegration.isConnected) {
            // 연결된 상태
            if (statusEl) {
                statusEl.textContent = '연결됨';
                statusEl.style.backgroundColor = '#dcfce7';
                statusEl.style.color = '#166534';
            }
            
            if (connectBtn) connectBtn.style.display = 'none';
            if (syncBtn) syncBtn.style.display = 'inline-block';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
        } else {
            // 연결 해제 상태
            if (statusEl) {
                statusEl.textContent = '연결되지 않음';
                statusEl.style.backgroundColor = '#fef3c7';
                statusEl.style.color = '#92400e';
            }
            
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (syncBtn) syncBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    }

    // JIRA UI 업데이트
    updateJiraUI() {
        const jiraIntegration = this.integrationManager.integrations.get('jira');
        if (!jiraIntegration) return;

        const statusEl = document.getElementById('jira-status');
        const connectBtn = document.getElementById('jira-connect-btn');
        const syncBtn = document.getElementById('jira-sync-btn');
        const disconnectBtn = document.getElementById('jira-disconnect-btn');

        if (jiraIntegration.isConnected) {
            // 연결된 상태
            if (statusEl) {
                statusEl.textContent = '연결됨';
                statusEl.style.backgroundColor = '#dcfce7';
                statusEl.style.color = '#166534';
            }
            
            if (connectBtn) connectBtn.style.display = 'none';
            if (syncBtn) syncBtn.style.display = 'inline-block';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
        } else {
            // 연결 해제 상태
            if (statusEl) {
                statusEl.textContent = '연결되지 않음';
                statusEl.style.backgroundColor = '#fef3c7';
                statusEl.style.color = '#92400e';
            }
            
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (syncBtn) syncBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    }

    // 통합 동기화 요약 UI 업데이트
    updateIntegrationSummary() {
        const todoistIntegration = this.integrationManager.integrations.get('todoist');
        const calendarIntegration = this.integrationManager.integrations.get('google-calendar');
        const jiraIntegration = this.integrationManager.integrations.get('jira');
        
        const hasConnectedIntegrations = 
            (todoistIntegration && todoistIntegration.isConnected) ||
            (calendarIntegration && calendarIntegration.isConnected) ||
            (jiraIntegration && jiraIntegration.isConnected);
        
        const syncSummary = document.getElementById('sync-summary');
        if (syncSummary) {
            if (hasConnectedIntegrations) {
                syncSummary.style.display = 'block';
                this.updateSyncSummary();
            } else {
                syncSummary.style.display = 'none';
            }
        }
    }

    // 동기화 요약 업데이트
    updateSyncSummary() {
        if (!this.integrationManager) return;

        const stats = this.integrationManager.getSyncStats();
        const externalTasks = this.tasks.filter(task => task.source !== 'manual');
        
        const totalSyncedEl = document.getElementById('total-synced');
        const lastSyncEl = document.getElementById('last-sync');
        
        if (totalSyncedEl) {
            totalSyncedEl.textContent = externalTasks.length;
        }
        
        if (lastSyncEl) {
            // 가장 최근 동기화 시간 찾기
            const todoistLastSync = this.integrationManager.getLastSyncTime('todoist');
            const calendarLastSync = this.integrationManager.getLastSyncTime('google-calendar');
            const jiraLastSync = this.integrationManager.getLastSyncTime('jira');
            
            const syncTimes = [todoistLastSync, calendarLastSync, jiraLastSync]
                .filter(time => time !== null)
                .map(time => new Date(time));
            
            let latestSync = null;
            if (syncTimes.length > 0) {
                latestSync = new Date(Math.max(...syncTimes)).toISOString();
            }
            
            if (latestSync) {
                const date = new Date(latestSync);
                lastSyncEl.textContent = date.toLocaleString('ko-KR');
            } else {
                lastSyncEl.textContent = '없음';
            }
        }
    }

    // ========== Google Calendar 통합 메서드들 ==========

    // Google Calendar 연결 모달 표시
    showGoogleCalendarConnect() {
        const modal = document.getElementById('google-calendar-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Google Calendar 모달 닫기
    closeGoogleCalendarModal() {
        const modal = document.getElementById('google-calendar-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Google Calendar 연결
    async connectGoogleCalendar(event) {
        event.preventDefault();
        
        const calendarUrlInput = document.getElementById('calendar-url');
        const calendarNameInput = document.getElementById('calendar-name');
        const autoSyncCheckbox = document.getElementById('auto-sync-calendar');
        
        if (!calendarUrlInput.value.trim()) {
            alert('캘린더 공유 URL을 입력해주세요.');
            return;
        }

        try {
            // 로딩 상태 표시
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '연결 중...';
            submitBtn.disabled = true;

            // Google Calendar 연결
            const result = await this.integrationManager.connectService('google-calendar', {
                url: calendarUrlInput.value.trim(),
                name: calendarNameInput.value.trim() || 'Google Calendar'
            });
            
            if (result.success) {
                // 성공 시
                alert('Google Calendar 연결이 완료되었습니다!');
                this.closeGoogleCalendarModal();
                
                // 입력 필드 초기화
                calendarUrlInput.value = '';
                calendarNameInput.value = '';
                
                // UI 업데이트
                this.updateIntegrationUI();
                
                // 자동 동기화 설정
                if (autoSyncCheckbox.checked) {
                    this.integrationManager.setupAutoSync(600000); // 10분마다
                }
                
                // 초기 동기화 실행
                await this.syncGoogleCalendar();
                
            } else {
                alert(`연결 실패: ${result.message}`);
            }
        } catch (error) {
            alert(`연결 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            // 버튼 상태 복원
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Google Calendar 동기화
    async syncGoogleCalendar() {
        if (!this.integrationManager) return;

        try {
            console.log('🔄 Google Calendar 동기화 시작...');
            const result = await this.integrationManager.syncService('google-calendar');
            
            console.log('📊 동기화 결과:', result);
            
            if (result.success) {
                const count = result.tasks?.length || 0;
                console.log(`✅ ${count}개의 캘린더 이벤트를 가져왔습니다:`, result.tasks);
                
                // 가져온 작업들 확인
                if (result.tasks && result.tasks.length > 0) {
                    console.table(result.tasks.map(task => ({
                        name: task.name,
                        quadrant: task.quadrant,
                        startTime: task.startTime,
                        contexts: task.contexts?.join(', ') || '',
                        source: task.source
                    })));
                }
                
                alert(`Google Calendar에서 ${count}개의 이벤트를 가져왔습니다.\n\n브라우저 콘솔(F12)에서 상세 정보를 확인할 수 있습니다.`);
                
                // 통계 업데이트 및 화면 새로고침
                this.updateSyncSummary();
                this.render(); // 화면 새로고침 강제 실행
                
            } else {
                console.error('❌ 동기화 실패:', result.error);
                alert(`동기화 실패: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ 동기화 중 오류:', error);
            alert(`동기화 중 오류: ${error.message}`);
        }
    }

    // Google Calendar 연결 해제
    disconnectGoogleCalendar() {
        if (confirm('Google Calendar 연결을 해제하시겠습니까?\\n연결 해제 시 Google Calendar에서 가져온 모든 이벤트가 삭제됩니다.')) {
            this.integrationManager.disconnectService('google-calendar');
            this.updateIntegrationUI();
            alert('Google Calendar 연결이 해제되었습니다.');
        }
    }

    // ========== JIRA 통합 메서드들 ==========

    // JIRA 연결 모달 표시
    showJiraConnect() {
        const modal = document.getElementById('jira-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // JIRA 모달 닫기
    closeJiraModal() {
        const modal = document.getElementById('jira-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // JIRA 연결
    async connectJira(event) {
        event.preventDefault();
        
        const baseUrlInput = document.getElementById('jira-base-url');
        const usernameInput = document.getElementById('jira-username');
        const apiTokenInput = document.getElementById('jira-api-token');
        const projectKeyInput = document.getElementById('jira-project-key');
        const jqlInput = document.getElementById('jira-jql');
        const autoSyncCheckbox = document.getElementById('auto-sync-jira');
        
        // 필수 필드 확인 (API 토큰은 기존 연결이 있으면 선택적)
        const jiraIntegration = this.integrationManager?.integrations.get('jira');
        const hasExistingConnection = jiraIntegration && jiraIntegration.isConnected;
        
        if (!baseUrlInput.value.trim() || !usernameInput.value.trim() || !projectKeyInput.value.trim()) {
            alert('베이스 URL, 사용자명, 프로젝트 키는 필수 입력 필드입니다.');
            return;
        }
        
        if (!apiTokenInput.value.trim() && !hasExistingConnection) {
            alert('API 토큰을 입력해주세요.');
            return;
        }

        try {
            // 로딩 상태 표시
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '연결 중...';
            submitBtn.disabled = true;

            // JIRA 연결 (API 토큰이 비어있으면 기존 값 사용)
            const apiToken = apiTokenInput.value.trim() || 
                            (hasExistingConnection ? jiraIntegration.apiToken : '');
            
            const result = await this.integrationManager.connectService('jira', {
                baseUrl: baseUrlInput.value.trim(),
                username: usernameInput.value.trim(),
                apiToken: apiToken,
                projectKey: projectKeyInput.value.trim().toUpperCase(),
                jql: jqlInput.value.trim()
            });
            
            if (result.success) {
                // 성공 시
                alert('JIRA 연결이 완료되었습니다!');
                this.closeJiraModal();
                
                // UI 업데이트 (입력 필드는 초기화하지 않음)
                this.updateIntegrationUI();
                
                // 자동 동기화 설정
                if (autoSyncCheckbox.checked) {
                    this.integrationManager.setupAutoSync(900000); // 15분마다
                }
                
                // 초기 동기화 실행
                await this.syncJira();
                
            } else {
                alert(`연결 실패: ${result.message}`);
            }
        } catch (error) {
            alert(`연결 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            // 버튼 상태 복원
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // JIRA 동기화
    async syncJira() {
        if (!this.integrationManager) return;

        try {
            console.log('🔄 JIRA 동기화 시작...');
            const result = await this.integrationManager.syncService('jira');
            
            console.log('📊 JIRA 동기화 결과:', result);
            
            if (result.success) {
                const count = result.tasks?.length || 0;
                console.log(`✅ ${count}개의 JIRA 이슈를 가져왔습니다:`, result.tasks);
                
                // 가져온 작업들 확인
                if (result.tasks && result.tasks.length > 0) {
                    console.table(result.tasks.map(task => ({
                        name: task.name.substring(0, 50) + '...',
                        quadrant: task.quadrant,
                        status: task.status,
                        priority: task.priority,
                        assignee: task.assignee,
                        issueType: task.issueType
                    })));
                }
                
                alert(`JIRA에서 ${count}개의 이슈를 가져왔습니다.\n\n브라우저 콘솔(F12)에서 상세 정보를 확인할 수 있습니다.`);
                
                // 통계 업데이트 및 화면 새로고침
                this.updateSyncSummary();
                this.render(); // 화면 새로고침 강제 실행
                
            } else {
                console.error('❌ JIRA 동기화 실패:', result.error);
                alert(`동기화 실패: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ JIRA 동기화 중 오류:', error);
            alert(`동기화 중 오류: ${error.message}`);
        }
    }

    // JIRA 연결 해제
    disconnectJira() {
        if (confirm('JIRA 연결을 해제하시겠습니까?\\n연결 해제 시 JIRA에서 가져온 모든 이슈가 삭제됩니다.')) {
            this.integrationManager.disconnectService('jira');
            this.updateIntegrationUI();
            alert('JIRA 연결이 해제되었습니다.');
        }
    }

    // ========== 디버그 헬퍼 메서드들 ==========

    // 현재 작업 상태 디버그
    debugTasks() {
        console.log('📋 현재 저장된 모든 작업들:');
        console.log('총 작업 수:', this.tasks.length);
        
        const tasksBySource = {};
        this.tasks.forEach(task => {
            const source = task.source || 'manual';
            tasksBySource[source] = (tasksBySource[source] || 0) + 1;
        });
        
        console.log('소스별 작업 분포:', tasksBySource);
        
        // 외부 작업만 따로 표시
        const externalTasks = this.tasks.filter(task => task.source && task.source !== 'manual');
        if (externalTasks.length > 0) {
            console.log('🔗 외부 통합 작업들:');
            console.table(externalTasks.map(task => ({
                name: task.name,
                source: task.source,
                quadrant: task.quadrant,
                completed: task.completed,
                createdAt: task.createdAt
            })));
        } else {
            console.log('❌ 외부 통합 작업이 없습니다.');
        }
        
        return {
            total: this.tasks.length,
            bySource: tasksBySource,
            external: externalTasks.length
        };
    }

    // 통합 상태 디버그
    debugIntegrations() {
        console.log('🔗 통합 서비스 상태:');
        
        if (!this.integrationManager) {
            console.log('❌ IntegrationManager가 초기화되지 않았습니다.');
            return;
        }
        
        for (const [serviceName, integration] of this.integrationManager.integrations) {
            console.log(`${serviceName}:`, {
                connected: integration.isConnected,
                hasData: integration.calendarUrl || integration.token,
                type: integration.constructor.name
            });
        }
        
        // 동기화 히스토리
        const syncHistory = this.integrationManager.syncHistory.slice(0, 5);
        if (syncHistory.length > 0) {
            console.log('📅 최근 동기화 기록:');
            console.table(syncHistory.map(entry => ({
                service: entry.service,
                action: entry.action,
                timestamp: new Date(entry.timestamp).toLocaleString(),
                data: entry.data?.count || entry.data?.error || ''
            })));
        }
    }

    // JIRA 연결 모달 표시
    showJiraConnect() {
        const modal = document.getElementById('jira-modal');
        if (modal) {
            // 저장된 설정 불러오기
            this.loadJiraSettings();
            modal.style.display = 'block';
        }
    }

    // JIRA 모달 닫기
    closeJiraModal() {
        const modal = document.getElementById('jira-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 저장된 JIRA 설정 로드
    loadJiraSettings() {
        const jiraIntegration = this.integrationManager?.integrations.get('jira');
        if (jiraIntegration && jiraIntegration.isConnected) {
            // 저장된 값들을 폼에 채우기
            const baseUrlInput = document.getElementById('jira-base-url');
            const usernameInput = document.getElementById('jira-username');
            const projectKeyInput = document.getElementById('jira-project-key');
            const jqlInput = document.getElementById('jira-jql');
            const autoSyncCheckbox = document.getElementById('auto-sync-jira');

            if (baseUrlInput) baseUrlInput.value = jiraIntegration.baseUrl || '';
            if (usernameInput) usernameInput.value = jiraIntegration.username || '';
            if (projectKeyInput) projectKeyInput.value = jiraIntegration.projectKey || '';
            if (jqlInput) jqlInput.value = jiraIntegration.jql || '';
            if (autoSyncCheckbox) autoSyncCheckbox.checked = true; // 기본값
            
            // API 토큰은 보안상 표시하지 않음 (placeholder로 표시)
            const apiTokenInput = document.getElementById('jira-api-token');
            if (apiTokenInput && jiraIntegration.apiToken) {
                apiTokenInput.placeholder = '이미 설정된 API 토큰 (변경하려면 새로 입력)';
            }
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ClarityMatrix();
    
    // Global functions for onclick events (after app is initialized)
    window.app = app;
});