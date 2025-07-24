// PWA 설치 및 관리 스크립트
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.banner = document.getElementById('pwa-banner');
        this.installBtn = document.getElementById('btn-install');
        this.dismissBtn = document.getElementById('btn-dismiss');
        
        this.init();
    }
    
    init() {
        // Service Worker 등록
        this.registerServiceWorker();
        
        // PWA 설치 이벤트 리스너
        this.setupInstallEvents();
        
        // 이미 설치되었는지 확인
        this.checkIfInstalled();
        
        // 배너 표시 로직
        this.handleBannerDisplay();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker 등록 성공:', registration.scope);
                
                // 업데이트 확인
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 새로운 버전 사용 가능
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker 등록 실패:', error);
            }
        } else {
            console.log('❌ Service Worker를 지원하지 않는 브라우저');
        }
    }
    
    setupInstallEvents() {
        // PWA 설치 프롬프트 이벤트 캐치
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('💾 PWA 설치 프롬프트 감지');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });
        
        // 앱이 설치되었을 때
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA 설치 완료');
            this.isInstalled = true;
            this.hideInstallBanner();
            this.showInstallSuccessMessage();
            localStorage.setItem('pwa-installed', 'true');
        });
        
        // 설치 버튼 클릭
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                this.promptInstall();
            });
        }
        
        // 나중에 버튼 클릭
        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => {
                this.dismissInstallBanner();
            });
        }
    }
    
    checkIfInstalled() {
        // 이미 설치되었거나, standalone 모드인지 확인
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
        
        this.isInstalled = isStandalone || isIOSStandalone || wasInstalled;
        
        if (this.isInstalled) {
            console.log('📱 PWA가 이미 설치됨');
            this.hideInstallBanner();
        }
    }
    
    handleBannerDisplay() {
        // 이미 설치되었거나 설치를 거부했으면 배너 숨김
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        const dismissedTime = localStorage.getItem('pwa-banner-dismissed-time');
        
        if (this.isInstalled || dismissed) {
            // 7일 후에 다시 표시
            if (dismissedTime && Date.now() - parseInt(dismissedTime) > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem('pwa-banner-dismissed');
                localStorage.removeItem('pwa-banner-dismissed-time');
            } else {
                this.hideInstallBanner();
                return;
            }
        }
        
        // 모바일 디바이스에서만 배너 표시
        if (this.isMobileDevice() && !this.isInstalled) {
            // 3초 후에 배너 표시
            setTimeout(() => {
                this.showInstallBanner();
            }, 3000);
        }
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad
    }
    
    showInstallBanner() {
        if (this.banner && !this.isInstalled) {
            this.banner.classList.add('show');
            console.log('📢 PWA 설치 배너 표시');
        }
    }
    
    hideInstallBanner() {
        if (this.banner) {
            this.banner.classList.remove('show');
        }
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) {
            // iOS Safari의 경우 수동 설치 안내
            if (this.isIOSSafari()) {
                this.showIOSInstallInstructions();
                return;
            }
            
            console.log('❌ 설치 프롬프트를 사용할 수 없음');
            return;
        }
        
        try {
            // 설치 프롬프트 표시
            this.deferredPrompt.prompt();
            
            // 사용자 선택 대기
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ 사용자가 PWA 설치를 승인');
            } else {
                console.log('❌ 사용자가 PWA 설치를 거부');
            }
            
            this.deferredPrompt = null;
            this.hideInstallBanner();
            
        } catch (error) {
            console.error('❌ PWA 설치 오류:', error);
        }
    }
    
    dismissInstallBanner() {
        this.hideInstallBanner();
        localStorage.setItem('pwa-banner-dismissed', 'true');
        localStorage.setItem('pwa-banner-dismissed-time', Date.now().toString());
        console.log('⏰ PWA 설치 배너 7일간 숨김');
    }
    
    isIOSSafari() {
        const ua = window.navigator.userAgent;
        const iOS = !!ua.match(/iPad|iPhone|iPod/);
        const webkit = !!ua.match(/WebKit/);
        const chrome = !!ua.match(/CriOS|Chrome/);
        return iOS && webkit && !chrome;
    }
    
    showIOSInstallInstructions() {
        const message = `📱 iOS에서 앱 설치하기:\n\n` +
                       `1. Safari 하단의 공유 버튼(📤) 터치\n` +
                       `2. \"홈 화면에 추가\" 선택\n` +
                       `3. \"추가\" 버튼 터치\n\n` +
                       `홈 화면에서 앱처럼 사용할 수 있습니다!`;
        
        alert(message);
        this.dismissInstallBanner();
    }
    
    showInstallSuccessMessage() {
        // 성공 메시지 표시 (토스트 알림 등)
        const message = document.createElement('div');
        message.className = 'install-success-toast';
        message.innerHTML = `
            <div style=\"
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
                z-index: 1001;
                animation: slideInRight 0.3s ease;
            \">
                🎉 앱이 성공적으로 설치되었습니다!
            </div>
        `;
        
        document.body.appendChild(message);
        
        // 3초 후 제거
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    showUpdateNotification() {
        const message = document.createElement('div');
        message.className = 'update-notification';
        message.innerHTML = `
            <div style=\"
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
                z-index: 1001;
                text-align: center;
            \">
                🔄 새로운 버전이 사용 가능합니다. 페이지를 새로고침해주세요.
                <br>
                <button onclick=\"window.location.reload()\" style=\"
                    background: white;
                    color: #3b82f6;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    margin-top: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                \">새로고침</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // 10초 후 자동 제거
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 10000);
    }
}

// DOM 로드 완료 후 PWA 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    new PWAManager();
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .install-success-toast {
        animation: slideInRight 0.3s ease;
    }
`;
document.head.appendChild(style);