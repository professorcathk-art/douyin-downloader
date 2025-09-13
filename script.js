// Global variables
let currentVideoData = null;
const PASSWORD = '123456';

// DOM elements
const passwordModal = document.getElementById('passwordModal');
const mainContent = document.getElementById('mainContent');
const passwordInput = document.getElementById('passwordInput');
const passwordSubmit = document.getElementById('passwordSubmit');
const passwordError = document.getElementById('passwordError');
const urlInput = document.getElementById('urlInput');
const parseBtn = document.getElementById('parseBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const errorMessage = document.getElementById('errorMessage');
const videoTitle = document.getElementById('videoTitle');
const coverImage = document.getElementById('coverImage');
const downloadVideoBtn = document.getElementById('downloadVideo');
const downloadCoverBtn = document.getElementById('downloadCover');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    if (localStorage.getItem('authenticated') === 'true') {
        showMainContent();
    } else {
        showPasswordModal();
    }
    
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Password authentication
    passwordSubmit.addEventListener('click', handlePasswordSubmit);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    });
    
    // Parse button
    parseBtn.addEventListener('click', handleParse);
    
    // Download buttons
    downloadVideoBtn.addEventListener('click', downloadVideo);
    downloadCoverBtn.addEventListener('click', downloadCover);
}

function showPasswordModal() {
    passwordModal.style.display = 'flex';
    mainContent.classList.add('hidden');
    passwordInput.focus();
}

function showMainContent() {
    passwordModal.style.display = 'none';
    mainContent.classList.remove('hidden');
}

function handlePasswordSubmit() {
    const inputPassword = passwordInput.value.trim();
    
    if (inputPassword === PASSWORD) {
        localStorage.setItem('authenticated', 'true');
        showMainContent();
        passwordError.textContent = '';
        passwordInput.value = '';
    } else {
        passwordError.textContent = '密码错误，请重新输入';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function extractUrl(text) {
    // Regular expression to match HTTP/HTTPS URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex);
    
    if (matches && matches.length > 0) {
        // Return the first valid URL found
        return matches[0];
    }
    
    return null;
}

async function handleParse() {
    const inputText = urlInput.value.trim();
    
    if (!inputText) {
        showError('请输入分享链接');
        return;
    }
    
    // Extract URL from the input text
    const url = extractUrl(inputText);
    
    if (!url) {
        showError('未找到有效的链接，请检查输入内容');
        return;
    }
    
    // Validate if it's a Douyin URL
    if (!url.includes('douyin.com')) {
        showError('请确保链接是抖音分享链接');
        return;
    }
    
    try {
        showLoading();
        hideError();
        hideResults();
        
        // Step 1: Get aweme_id
        const awemeId = await getAwemeId(url);
        
        if (!awemeId) {
            throw new Error('获取视频ID失败');
        }
        
        // Step 2: Get video information
        const videoData = await getVideoInfo(awemeId);
        
        if (!videoData) {
            throw new Error('获取视频信息失败');
        }
        
        // Display results
        displayResults(videoData);
        
    } catch (error) {
        console.error('Parse error:', error);
        showError('解析失败：' + error.message);
    } finally {
        hideLoading();
    }
}

async function getAwemeId(url) {
    try {
        const response = await fetch(`http://64.227.89.151/api/douyin/web/get_aweme_id?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.code === 200) {
            return data.data;
        } else {
            throw new Error('API返回错误：' + (data.message || '未知错误'));
        }
    } catch (error) {
        console.error('getAwemeId error:', error);
        throw new Error('网络请求失败，请检查网络连接');
    }
}

async function getVideoInfo(awemeId) {
    try {
        const response = await fetch(`http://64.227.89.151/api/douyin/web/fetch_one_video?aweme_id=${awemeId}`);
        const data = await response.json();
        
        if (data.code === 200 && data.data && data.data.aweme_detail) {
            return data.data.aweme_detail;
        } else {
            throw new Error('API返回错误：' + (data.message || '未知错误'));
        }
    } catch (error) {
        console.error('getVideoInfo error:', error);
        throw new Error('获取视频信息失败');
    }
}

function displayResults(videoData) {
    currentVideoData = videoData;
    
    // Display title
    videoTitle.textContent = videoData.desc || '无标题';
    
    // Display cover image
    if (videoData.cover_url) {
        coverImage.src = videoData.cover_url;
        coverImage.alt = '视频封面';
    }
    
    // Show results
    results.classList.remove('hidden');
}

function downloadVideo() {
    if (!currentVideoData || !currentVideoData.video || !currentVideoData.video.download_addr) {
        showError('没有可下载的视频');
        return;
    }
    
    const downloadUrl = currentVideoData.video.download_addr.url_list[0];
    const title = currentVideoData.desc || 'douyin_video';
    
    // Create a clean filename
    const cleanTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const filename = `${cleanTitle}.mp4`;
    
    downloadFile(downloadUrl, filename);
}

function downloadCover() {
    if (!currentVideoData || !currentVideoData.cover_url) {
        showError('没有可下载的封面');
        return;
    }
    
    const coverUrl = currentVideoData.cover_url;
    const title = currentVideoData.desc || 'douyin_cover';
    
    // Create a clean filename
    const cleanTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const filename = `${cleanTitle}_cover.jpg`;
    
    downloadFile(coverUrl, filename);
}

function downloadFile(url, filename) {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showSuccess(`开始下载：${filename}`);
    } catch (error) {
        console.error('Download error:', error);
        showError('下载失败，请重试');
    }
}

function showLoading() {
    loading.classList.remove('hidden');
    parseBtn.disabled = true;
    parseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 解析中...';
}

function hideLoading() {
    loading.classList.add('hidden');
    parseBtn.disabled = false;
    parseBtn.innerHTML = '<i class="fas fa-magic"></i> 开始解析';
}

function showResults() {
    results.classList.remove('hidden');
}

function hideResults() {
    results.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
