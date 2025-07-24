const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const isDev = process.argv.includes('--dev');

// 보안 미들웨어 (개발용 - HTTPS 강제 완전 비활성화)
if (isDev) {
    // 개발 환경: 모든 HTTPS 관련 보안 기능 비활성화
    app.use(helmet({
        contentSecurityPolicy: false,
        hsts: false,
        noSniff: false,
        frameguard: false,
        xssFilter: false,
        referrerPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginEmbedderPolicy: false,
        originAgentCluster: false,
        dnsPrefetchControl: false,
        ieNoOpen: false,
        permittedCrossDomainPolicies: false
    }));
} else {
    // 프로덕션 환경: 완전한 보안 설정
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://accounts.google.com'],
                connectSrc: ["'self'", 'https://*.todoist.com', 'https://*.atlassian.net', 'https://calendar.google.com', 'https://api.allorigins.win', 'https://corsproxy.io', 'https://cors-anywhere.herokuapp.com'],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'self'", 'https://accounts.google.com']
            },
        }
    }));
}

// CORS 설정
app.use(cors({
    origin: isDev ? '*' : [
        'http://localhost:3000',
        'https://your-domain.com' // 실제 도메인으로 변경
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 압축 미들웨어
app.use(compression());

// 정적 파일 서빙
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: isDev ? 0 : '1d', // 개발 환경에서는 캐시 비활성화
    etag: isDev ? false : true,
    setHeaders: (res, path) => {
        if (isDev) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// PWA 관련 파일 서빙
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'sw.js'));
});

// 메인 페이지들 라우팅
const pages = [
    'main',
    'inbox', 
    'today',
    'projects',
    'eisenhower_matrix',
    'completed',
    'settings'
];

pages.forEach(page => {
    // 확장자 없는 경로와 .html 확장자 경로 모두 처리
    app.get(`/${page}`, (req, res) => {
        if (isDev) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        res.sendFile(path.join(__dirname, 'design', `${page}.html`));
    });
    
    app.get(`/${page}.html`, (req, res) => {
        if (isDev) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        res.sendFile(path.join(__dirname, 'design', `${page}.html`));
    });
});

// 루트 경로는 메인 페이지로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/main');
});

// API 엔드포인트 (향후 확장용)
app.use(express.json());

// 설정 저장/불러오기 API
app.post('/api/settings', (req, res) => {
    // 실제 구현에서는 데이터베이스나 파일 시스템에 저장
    res.json({ success: true, message: '설정이 저장되었습니다.' });
});

app.get('/api/settings', (req, res) => {
    // 실제 구현에서는 저장된 설정을 불러옴
    res.json({ settings: {} });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 처리
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'design', 'main.html'));
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDev ? err.message : 'Something went wrong!'
    });
});

// SSL 인증서 설정
let sslOptions = null;
try {
    sslOptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
    };
} catch (error) {
    console.warn('SSL certificates not found. HTTPS server will not start.');
}

// HTTP 서버 시작
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
    console.log(`
🚀 Clarity Matrix GTD System
============================
Environment: ${isDev ? 'Development' : 'Production'}
HTTP Server: http://localhost:${HTTP_PORT}
Health: http://localhost:${HTTP_PORT}/health

Available pages (HTTP):
${pages.map(page => `- http://localhost:${HTTP_PORT}/${page}`).join('\n')}
    `);
});

// HTTPS 서버 시작 (SSL 인증서가 있는 경우에만)
let httpsServer = null;
if (sslOptions) {
    httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`
🔒 HTTPS Server: https://localhost:${HTTPS_PORT}
Health: https://localhost:${HTTPS_PORT}/health

Available pages (HTTPS):
${pages.map(page => `- https://localhost:${HTTPS_PORT}/${page}`).join('\n')}

⚠️  Self-signed certificate: Browser will show security warning
    Click "Advanced" → "Proceed to localhost (unsafe)" to continue
        `);
    });
}

console.log('\nPress Ctrl+C to stop the servers.\n');

module.exports = { app, httpServer, httpsServer };