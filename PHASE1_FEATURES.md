# Phase 1 상세 기능 명세서

## 🎯 Phase 1 목표
현재 기본 GTD 앱에서 **프리미엄 개인 생산성 도구**로 업그레이드

---

## 🔥 우선순위 기능들

### 1. 주간 검토 시스템 (Weekly Review)
**GTD 핵심 원칙 구현**

#### 기능 상세
- **안내된 검토 프로세스**
  ```
  1. 정신 비우기 (Mind Sweep)
     - 수신함에 남은 항목 확인
     - 새로운 아이디어/걱정거리 수집
  
  2. 현황 파악 (Get Current)
     - 지난 주 완료 작업 검토
     - 미완료 작업 재평가
     - 다음 주 우선순위 설정
  
  3. 창의성 발휘 (Get Creative)
     - 언젠가/어쩌면 목록 검토
     - 새로운 프로젝트 아이디어
     - 장기 목표 점검
  ```

- **진행률 추적**
  - 검토 완료 체크리스트
  - 주간 검토 완료율 통계
  - 검토 소요 시간 기록

#### UI/UX 설계
```html
<!-- 주간 검토 전용 페이지 -->
<div class="weekly-review">
  <div class="review-progress">
    <div class="step active" data-step="1">정신 비우기</div>
    <div class="step" data-step="2">현황 파악</div>
    <div class="step" data-step="3">창의성 발휘</div>
  </div>
  
  <div class="review-content">
    <!-- 단계별 컨텐츠 -->
  </div>
</div>
```

---

### 2. 컨텍스트 관리 시스템
**GTD의 핵심 - "언제, 어디서, 무엇을" 관리**

#### 컨텍스트 카테고리
```javascript
const contexts = {
  location: ['@집', '@사무실', '@외출', '@온라인'],
  tools: ['@전화', '@컴퓨터', '@차량'],
  energy: ['@높은에너지', '@보통에너지', '@낮은에너지'],
  time: ['@15분', '@30분', '@1시간이상'],
  people: ['@팀원', '@상사', '@가족']
};
```

#### 스마트 필터링
- **현재 컨텍스트 기반 작업 표시**
  - 시간대별 적합한 작업 제안
  - 위치 기반 작업 자동 필터링
  - 에너지 수준별 작업 추천

#### 구현 예시
```javascript
class ContextManager {
  getCurrentContext() {
    const hour = new Date().getHours();
    const contexts = [];
    
    if (hour >= 9 && hour <= 18) {
      contexts.push('@사무실', '@컴퓨터');
    } else {
      contexts.push('@집');
    }
    
    return contexts;
  }
  
  getRecommendedTasks() {
    const currentContexts = this.getCurrentContext();
    return this.tasks.filter(task => 
      task.contexts.some(ctx => currentContexts.includes(ctx))
    );
  }
}
```

---

### 3. 자연어 처리 개선
**빠른 작업 추가의 혁신**

#### 파싱 예시
```
입력: "내일 오후 3시에 김대리와 프로젝트 회의 @사무실 #중요"

파싱 결과:
- 제목: "김대리와 프로젝트 회의"
- 일시: 2024-01-16 15:00
- 컨텍스트: [@사무실]
- 우선순위: Q1 (중요)
- 참석자: [김대리]
```

#### 구현 로직
```javascript
class NLPProcessor {
  parseTaskInput(input) {
    const patterns = {
      date: /내일|오늘|(\d+)일|(\d+)월\s*(\d+)일/g,
      time: /(\d{1,2})시|(\d{1,2}):\d{2}|오전|오후/g,
      context: /@([가-힣\w]+)/g,
      priority: /#(중요|긴급|나중에)/g,
      people: /(\w+)(?:님|씨|대리|과장|부장)와?/g
    };
    
    return {
      title: this.extractTitle(input),
      dueDate: this.extractDate(input),
      contexts: this.extractContexts(input),
      priority: this.extractPriority(input),
      participants: this.extractParticipants(input)
    };
  }
}
```

---

### 4. 스마트 알림 시스템

#### 알림 유형
1. **시간 기반 알림**
   - 마감일 알림 (1일전, 1시간전)
   - 정기 검토 알림 (주간/월간)

2. **컨텍스트 기반 알림**
   - "집에 도착했을 때" 알림
   - "업무 시간" 시작 알림

3. **지능형 알림**
   - 비슷한 작업 패턴 분석
   - 최적 시간대 제안

#### 구현
```javascript
class SmartNotification {
  scheduleContextAlert(task) {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        // 위치 기반 알림 설정
        this.setLocationBasedReminder(task, position);
      });
    }
  }
  
  analyzeBestTime(taskType) {
    const completedTasks = this.getCompletedTasksByType(taskType);
    const times = completedTasks.map(task => 
      new Date(task.completedAt).getHours()
    );
    
    // 가장 자주 완료한 시간대 찾기
    return this.getMostFrequentTime(times);
  }
}
```

---

### 5. 고급 대시보드 및 분석

#### 생산성 지표
```javascript
const productivityMetrics = {
  // 완료율 추이
  completionRate: {
    daily: [],
    weekly: [],
    monthly: []
  },
  
  // 분면별 작업 분포
  quadrantDistribution: {
    q1: 0, // 긴급&중요
    q2: 0, // 중요
    q3: 0, // 긴급
    q4: 0  // 나중에
  },
  
  // 작업 소요 시간 분석
  taskDuration: {
    average: 0,
    byQuadrant: {},
    byProject: {}
  }
};
```

#### 시각화 컴포넌트
```html
<div class="analytics-dashboard">
  <div class="metric-card">
    <h3>이번 주 완료율</h3>
    <div class="progress-ring" data-progress="78">
      <span>78%</span>
    </div>
  </div>
  
  <div class="quadrant-chart">
    <canvas id="quadrant-distribution"></canvas>
  </div>
  
  <div class="productivity-trend">
    <canvas id="weekly-trend"></canvas>
  </div>
</div>
```

---

### 6. 향상된 프로젝트 관리

#### 프로젝트 템플릿 시스템
```javascript
const projectTemplates = {
  '신제품 출시': [
    { name: '시장 조사', quadrant: 'q2', contexts: ['@컴퓨터'] },
    { name: '경쟁사 분석', quadrant: 'q2', contexts: ['@온라인'] },
    { name: '기획서 작성', quadrant: 'q1', contexts: ['@컴퓨터'] },
    { name: '팀 미팅 일정 조율', quadrant: 'q3', contexts: ['@전화'] }
  ],
  
  '이사 준비': [
    { name: '이사업체 견적', quadrant: 'q1', contexts: ['@전화'] },
    { name: '박스 구매', quadrant: 'q2', contexts: ['@외출'] },
    { name: '주소 변경 신고', quadrant: 'q1', contexts: ['@온라인'] }
  ]
};
```

#### 프로젝트 진행률 추적
```javascript
class ProjectTracker {
  calculateProgress(projectId) {
    const tasks = this.getProjectTasks(projectId);
    const completed = tasks.filter(t => t.completed).length;
    
    return {
      percentage: Math.round((completed / tasks.length) * 100),
      completedTasks: completed,
      totalTasks: tasks.length,
      estimatedCompletion: this.estimateCompletion(tasks)
    };
  }
}
```

---

### 7. 데이터 내보내기/가져오기 향상

#### 지원 형식 확장
```javascript
const exportFormats = {
  json: { name: 'JSON', extension: '.json' },
  csv: { name: 'CSV (엑셀)', extension: '.csv' },
  markdown: { name: 'Markdown', extension: '.md' },
  todoist: { name: 'Todoist 형식', extension: '.csv' },
  things: { name: 'Things 형식', extension: '.json' }
};
```

#### 자동 백업
```javascript
class AutoBackup {
  constructor() {
    this.scheduleWeeklyBackup();
  }
  
  scheduleWeeklyBackup() {
    setInterval(() => {
      if (this.isBackupTime()) {
        this.createBackup();
      }
    }, 60000 * 60); // 매 시간 체크
  }
  
  createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      data: this.getAllData(),
      version: '1.0'
    };
    
    this.saveToCloud(backup);
  }
}
```

---

## 💎 프리미엄 기능 구분

### 무료 (Free) 기능 유지
- 기본 GTD 워크플로우
- 아이젠하워 매트릭스
- 5개 프로젝트 제한
- 로컬 저장

### 프로 (Pro) 전용 기능
- ✨ **주간 검토 시스템**
- ✨ **컨텍스트 관리**
- ✨ **자연어 처리**
- ✨ **스마트 알림**
- ✨ **고급 분석 대시보드**
- ✨ **무제한 프로젝트**
- ✨ **프로젝트 템플릿**
- ✨ **자동 백업**

---

## 🚀 개발 우선순위

1. **1순위 (즉시 시작)**
   - 주간 검토 시스템
   - 컨텍스트 관리 기초

2. **2순위 (1개월 내)**
   - 자연어 처리
   - 스마트 알림 기초

3. **3순위 (2-3개월 내)**
   - 고급 분석
   - 프로젝트 템플릿
   - 자동 백업

이 Phase 1 업그레이드를 통해 Clarity Matrix는 시장의 다른 GTD 앱들과 확실히 차별화될 수 있습니다.