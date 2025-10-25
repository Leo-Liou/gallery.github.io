// 初始名画数据
let paintings = [
    {
        imageUrl: 'images/Generated Image.png',
        title: '星月夜',
        artist: '文森特·梵高',
        year: '1889',
        style: '后印象派',
        description: '这幅画描绘了一个夸张化与充满强烈表现力的星空下的村庄。'
    },
    {
        imageUrl: 'images/washington.jpg',
        title: 'Washington Crossing the Delaware',
        artist: 'Emanuel Leutze',
        year: '1851',
        style: 'based on a photograph',
        description: '引发关于政治思想的思辩'
    },
    {
        imageUrl: 'images/The scream.jpg',
        title: '呐喊',
        artist: '爱德华·蒙克',
        year: '1893',
        style: '表现主义',
        description: '作品展现了桥上一个人因焦虑而呐喊的瞬间，是表现主义绘画的标志性作品。'
    }
];

// DOM元素引用
const paintingImage = document.getElementById('painting-image');
const paintingCaption = document.getElementById('painting-caption');
const refreshBtn = document.getElementById('refresh-btn');
const autoRefreshBtn = document.getElementById('auto-refresh-btn');
const collectBtn = document.getElementById('collect-btn');
const infoTitle = document.getElementById('info-title');
const infoArtist = document.getElementById('info-artist');
const infoYear = document.getElementById('info-year');
const infoStyle = document.getElementById('info-style');
const infoDesc = document.getElementById('info-desc');
const loadingElement = document.getElementById('loading');
const notification = document.getElementById('notification');

// 自动轮播状态
let autoRefreshInterval = null;
let isAutoRefreshActive = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    displayRandomPainting();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    refreshBtn.addEventListener('click', displayRandomPainting);
    autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
    collectBtn.addEventListener('click', collectArtworks);
}

// 随机显示一幅画作
function displayRandomPainting() {
    if (paintings.length === 0) {
        showNotification('数据库中没有画作，请先获取作品！', 'error');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * paintings.length);
    const painting = paintings[randomIndex];
    
    // 更新图片
    paintingImage.src = painting.imageUrl;
    paintingImage.alt = painting.title;
    
    // 更新标题
    paintingCaption.textContent = `${painting.title} - ${painting.artist} (${painting.year})`;
    
    // 更新信息表格
    infoTitle.textContent = painting.title;
    infoArtist.textContent = painting.artist;
    infoYear.textContent = painting.year;
    infoStyle.textContent = painting.style;
    infoDesc.textContent = painting.description;
}

// 切换自动轮播
function toggleAutoRefresh() {
    if (isAutoRefreshActive) {
        // 停止自动轮播
        clearInterval(autoRefreshInterval);
        autoRefreshBtn.innerHTML = '<span>⏱️</span> 开启自动轮播（10秒/幅）';
        isAutoRefreshActive = false;
        showNotification('已停止自动轮播');
    } else {
        // 开始自动轮播
        autoRefreshInterval = setInterval(displayRandomPainting, 10000);
        autoRefreshBtn.innerHTML = '<span>⏹️</span> 停止自动轮播';
        isAutoRefreshActive = true;
        showNotification('已开启自动轮播，每10秒切换一幅画作');
    }
}

// 从大都会博物馆获取新作品
async function collectArtworks() {
    loadingElement.style.display = 'block';
    showNotification('正在从大都会博物馆获取名画数据...');
    
    try {
        // 搜索大都会博物馆的精选绘画
        const searchUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/search?isHighlight=true&departmentId=11&hasImages=true&q=painting';
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
            throw new Error('没有找到作品数据');
        }
        
        // 随机选择20个作品（已按您的要求修改）
        const randomIDs = searchData.objectIDs
            .sort(() => 0.5 - Math.random())
            .slice(0, 20);
        
        const newArtworks = [];
        
        // 逐个获取作品详情
        for (let i = 0; i < randomIDs.length; i++) {
            const objectID = randomIDs[i];
            
            // 更新加载信息
            loadingElement.innerHTML = 
                `<p>正在获取第 ${i+1} 幅作品... 共 ${randomIDs.length} 幅</p>`;
            
            const objectUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;
            const objectResponse = await fetch(objectUrl);
            const artworkData = await objectResponse.json();
            
            // 检查数据是否完整且有图片
            if (artworkData.primaryImage && artworkData.title && artworkData.artistDisplayName) {
                // 转换数据格式
                const painting = {
                    imageUrl: artworkData.primaryImage,
                    title: artworkData.title,
                    artist: artworkData.artistDisplayName,
                    year: artworkData.objectDate || '年代未知',
                    style: getArtStyle(artworkData),
                    description: generateDescription(artworkData),
                    source: '大都会博物馆'
                };
                
                // 检查是否重复
                if (!isDuplicate(painting)) {
                    newArtworks.push(painting);
                }
            }
            
            // 等待一下，避免请求太快
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // 添加到收藏
        paintings = [...paintings, ...newArtworks];
        
        // 显示成功消息
        showNotification(`成功添加 ${newArtworks.length} 幅新作品！`);
        
        // 如果当前没有画作显示，立即显示一幅
        if (!paintingImage.src || paintingImage.src === window.location.href) {
            displayRandomPainting();
        }
        
    } catch (error) {
        showNotification(`获取数据失败：${error.message}`, 'error');
    }
    
    loadingElement.style.display = 'none';
}

// 推断艺术风格
function getArtStyle(artworkData) {
    const medium = artworkData.medium || '';
    const year = artworkData.objectBeginDate;
    
    if (medium.includes('Oil')) {
        if (year >= 1870 && year <= 1890) return '印象派油画';
        if (year >= 1890 && year <= 1910) return '后印象派油画';
        return '油画';
    }
    if (medium.includes('Watercolor')) return '水彩画';
    if (medium.includes('Tempera')) return '蛋彩画';
    return '绘画';
}

// 生成作品描述
function generateDescription(artworkData) {
    let desc = `《${artworkData.title}》是${artworkData.artistDisplayName}的${getArtStyle(artworkData)}作品。`;
    
    if (artworkData.objectDate) {
        desc += `创作于${artworkData.objectDate}。`;
    }
    
    if (artworkData.medium) {
        desc += `使用${artworkData.medium.toLowerCase()}创作。`;
    }
    
    if (artworkData.tags && artworkData.tags.length > 0) {
        const tags = artworkData.tags.slice(0, 2).map(tag => tag.term);
        desc += `作品主题涉及${tags.join('、')}。`;
    }
    
    desc += '现藏于纽约大都会艺术博物馆。';
    return desc;
}

// 检查重复作品
function isDuplicate(newPainting) {
    return paintings.some(painting => 
        painting.title === newPainting.title && 
        painting.artist === newPainting.artist
    );
}

// 显示通知
function showNotification(message, type = '') {
    notification.textContent = message;
    notification.className = type === 'error' ? 'notification error' : 'notification';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// 保存收藏到本地文件（可选功能）
function saveCollection() {
    if (paintings.length === 0) {
        showNotification('请先收集一些作品！', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(paintings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-art-collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`✅ 成功保存 ${paintings.length} 幅作品到本地文件！`);
}
