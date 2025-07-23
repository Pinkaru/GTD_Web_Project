# 🔌 Clarity Matrix - API 명세서

## 📋 개요
외부 도구 통합을 위한 RESTful API 및 WebHook 명세

---

## 🔐 인증

### OAuth 2.0 플로우
```http
# 1. 인증 URL로 리다이렉트
GET /oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=tasks.read,tasks.write

# 2. 인증 코드로 토큰 교환
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret", 
  "code": "authorization_code",
  "redirect_uri": "your_redirect_uri"
}

# 응답
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "tasks.read tasks.write"
}
```

---

## 📝 작업 관리 API

### 작업 목록 조회
```http
GET /api/v1/tasks
Authorization: Bearer {access_token}

# 쿼리 파라미터
?project_id=123          # 특정 프로젝트
&quadrant=q1            # 특정 사분면
&completed=false        # 완료 여부
&source=jira           # 외부 소스
&limit=50              # 페이지 크기
&offset=0              # 오프셋

# 응답
{
  "tasks": [
    {
      "id": "task_123",
      "name": "JIRA 이슈 해결",
      "description": "버그 수정 및 테스트",
      "quadrant": "q1",
      "completed": false,
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "due_date": "2024-01-17T18:00:00Z",
      "project_id": "proj_456",
      "contexts": ["@컴퓨터", "@개발"],
      "source": "jira",
      "external_id": "PROJ-123",
      "external_url": "https://company.atlassian.net/browse/PROJ-123",
      "assignee": "developer@company.com",
      "priority": 1,
      "labels": ["버그", "긴급"]
    }
  ],
  "total": 156,
  "has_more": true
}
```

### 작업 생성
```http
POST /api/v1/tasks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "새로운 작업",
  "description": "작업 설명",
  "quadrant": "q2",
  "due_date": "2024-01-20T15:00:00Z",
  "project_id": "proj_456",
  "contexts": ["@사무실", "@회의"],
  "source": "api",
  "external_id": "external_123",
  "external_url": "https://external-tool.com/item/123",
  "assignee": "user@company.com",
  "labels": ["중요", "검토필요"]
}

# 응답 (201 Created)
{
  "id": "task_789",
  "name": "새로운 작업",
  "created_at": "2024-01-15T11:00:00Z",
  "quadrant": "q2",
  "source": "api"
}
```

### 작업 업데이트
```http
PATCH /api/v1/tasks/{task_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "업데이트된 작업 이름",
  "quadrant": "q1",
  "completed": true,
  "contexts": ["@온라인"]
}

# 응답 (200 OK)
{
  "id": "task_789",
  "updated_at": "2024-01-15T12:00:00Z",
  "quadrant": "q1",
  "completed": true
}
```

### 작업 삭제
```http
DELETE /api/v1/tasks/{task_id}
Authorization: Bearer {access_token}

# 응답 (204 No Content)
```

---

## 📁 프로젝트 API

### 프로젝트 목록
```http
GET /api/v1/projects
Authorization: Bearer {access_token}

{
  "projects": [
    {
      "id": "proj_456",
      "name": "웹사이트 리뉴얼",
      "description": "회사 웹사이트 전면 개편",
      "created_at": "2024-01-01T00:00:00Z",
      "task_count": 23,
      "completed_task_count": 15,
      "progress": 65.2,
      "source": "manual"
    }
  ]
}
```

### 프로젝트 생성
```http
POST /api/v1/projects
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "새 프로젝트",
  "description": "프로젝트 설명",
  "source": "jira",
  "external_id": "PROJ-456"
}
```

---

## 🔄 동기화 API

### 외부 도구 동기화
```http
POST /api/v1/integrations/{service}/sync
Authorization: Bearer {access_token}
Content-Type: application/json

# service: jira, todoist, asana, notion, slack

{
  "full_sync": false,        # 전체 동기화 여부
  "project_filter": ["PROJ"], # 필터 조건
  "since": "2024-01-15T00:00:00Z" # 변경사항만
}

# 응답
{
  "sync_id": "sync_123",
  "status": "in_progress",
  "started_at": "2024-01-15T12:00:00Z",
  "estimated_duration": 120
}
```

### 동기화 상태 확인
```http
GET /api/v1/integrations/{service}/sync/{sync_id}
Authorization: Bearer {access_token}

{
  "sync_id": "sync_123",
  "status": "completed",
  "started_at": "2024-01-15T12:00:00Z",
  "completed_at": "2024-01-15T12:02:15Z",
  "results": {
    "imported": 45,
    "updated": 12,
    "skipped": 3,
    "errors": 1
  },
  "errors": [
    {
      "external_id": "PROJ-999",
      "error": "Permission denied",
      "code": "INSUFFICIENT_PERMISSIONS"
    }
  ]
}
```

---

## 🔔 WebHook API

### WebHook 등록
```http
POST /api/v1/webhooks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/clarity-matrix",
  "events": [
    "task.created",
    "task.updated", 
    "task.completed",
    "project.created"
  ],
  "secret": "your_webhook_secret"
}

# 응답
{
  "id": "webhook_456",
  "url": "https://your-app.com/webhooks/clarity-matrix",
  "events": ["task.created", "task.updated"],
  "created_at": "2024-01-15T12:00:00Z",
  "active": true
}
```

### WebHook 페이로드 예시
```http
POST https://your-app.com/webhooks/clarity-matrix
Content-Type: application/json
X-Clarity-Signature: sha256=hash_of_payload_with_secret

{
  "event": "task.updated",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "task": {
      "id": "task_123",
      "name": "업데이트된 작업",
      "quadrant": "q1",
      "previous_quadrant": "q2",
      "updated_at": "2024-01-15T12:00:00Z"
    },
    "changes": {
      "quadrant": {
        "from": "q2",
        "to": "q1"
      },
      "name": {
        "from": "원래 작업명",
        "to": "업데이트된 작업"
      }
    }
  }
}
```

---

## 🔍 통합 상태 API

### 연결된 서비스 목록
```http
GET /api/v1/integrations
Authorization: Bearer {access_token}

{
  "integrations": [
    {
      "service": "jira",
      "connected": true,
      "connected_at": "2024-01-10T00:00:00Z",
      "last_sync": "2024-01-15T11:30:00Z",
      "status": "healthy",
      "task_count": 156,
      "error_count": 0
    },
    {
      "service": "todoist", 
      "connected": false,
      "available": true,
      "description": "개인 할 일 관리 도구"
    }
  ]
}
```

### 통합 설정 업데이트
```http
PATCH /api/v1/integrations/{service}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "auto_sync": true,
  "sync_interval": 300,        # 5분마다
  "default_quadrant": "q2",    # 기본 사분면
  "context_mapping": {
    "bug": ["@개발", "@긴급"],
    "feature": ["@개발", "@계획"]
  }
}
```

---

## 📊 분석 API

### GTD 분석 데이터
```http
GET /api/v1/analytics/gtd
Authorization: Bearer {access_token}
?period=week&start_date=2024-01-08

{
  "period": "week",
  "quadrant_distribution": {
    "q1": {"count": 23, "percentage": 15.3},
    "q2": {"count": 78, "percentage": 52.0},
    "q3": {"count": 34, "percentage": 22.7},
    "q4": {"count": 15, "percentage": 10.0}
  },
  "completion_rate": {
    "overall": 68.5,
    "by_quadrant": {
      "q1": 95.7,
      "q2": 61.5,
      "q3": 70.6,
      "q4": 46.7
    }
  },
  "source_breakdown": {
    "manual": 89,
    "jira": 45,
    "todoist": 16
  },
  "trends": {
    "completion_rate_change": 5.2,  # 지난 기간 대비 증가
    "q2_focus_improvement": 12.1    # Q2 집중도 개선
  }
}
```

---

## ⚠️ 에러 코드

```json
{
  "error": {
    "code": "INVALID_QUADRANT",
    "message": "Invalid quadrant value. Must be one of: q1, q2, q3, q4",
    "details": {
      "field": "quadrant",
      "provided": "q5",
      "allowed": ["q1", "q2", "q3", "q4"]
    }
  }
}
```

### 주요 에러 코드
- `INVALID_TOKEN` (401) - 인증 토큰 무효
- `INSUFFICIENT_PERMISSIONS` (403) - 권한 부족  
- `RESOURCE_NOT_FOUND` (404) - 리소스 없음
- `VALIDATION_ERROR` (400) - 입력값 검증 실패
- `RATE_LIMIT_EXCEEDED` (429) - 요청 한도 초과
- `INTEGRATION_ERROR` (502) - 외부 서비스 연동 오류
- `SYNC_IN_PROGRESS` (409) - 동기화 진행 중

---

## 🔧 SDK 예시

### JavaScript SDK
```javascript
const clarity = new ClarityMatrix({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.claritymatrix.com'
});

// 작업 생성
const task = await clarity.tasks.create({
  name: '새 작업',
  quadrant: 'q2',
  contexts: ['@사무실']
});

// JIRA 동기화
const syncResult = await clarity.integrations.sync('jira', {
  projectFilter: ['PROJ']
});

// 실시간 업데이트 구독
clarity.onTaskUpdate((task) => {
  console.log('Task updated:', task);
});
```

이 API를 통해 외부 도구들이 Clarity Matrix와 완전히 통합될 수 있습니다!