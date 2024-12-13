// 初始化全局变量
let graph = null;
let currentData = null;

// 初始化函数
function init() {
    // 检查URL参数是否包含共享的脑图数据
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    
    if (sharedData) {
        try {
            const decodedData = JSON.parse(atob(sharedData));
            renderMindmap(decodedData);
            document.getElementById('inputPanel').style.display = 'none';
        } catch (e) {
            console.error('Invalid shared data:', e);
        }
    }

    // 初始化事件监听
    document.getElementById('generateBtn').addEventListener('click', generateMindmap);
    document.getElementById('clearBtn').addEventListener('click', clearInput);
    document.getElementById('zoomInBtn').addEventListener('click', () => graph && graph.zoom(1.1));
    document.getElementById('zoomOutBtn').addEventListener('click', () => graph && graph.zoom(0.9));
    document.getElementById('fitViewBtn').addEventListener('click', () => graph && graph.fitView());
    document.getElementById('shareBtn').addEventListener('click', shareMindmap);
}

// 生成脑图数据结构
function generateMindmapData(text) {
    const lines = text.trim().split('\n');
    const root = {
        id: 'root',
        label: lines[0] || '中心主题',
        children: []
    };

    let currentLevel = 0;
    let currentParent = root;
    let parentStack = [root];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 简单的缩进检测
        const indentation = lines[i].search(/\S/);
        const level = Math.floor(indentation / 2);

        const node = {
            id: `node-${i}`,
            label: line.trim(),
            children: []
        };

        if (level > currentLevel) {
            parentStack.push(currentParent);
            currentParent = parentStack[parentStack.length - 1];
        } else if (level < currentLevel) {
            for (let j = 0; j < currentLevel - level; j++) {
                parentStack.pop();
            }
            currentParent = parentStack[parentStack.length - 1];
        }

        currentParent.children.push(node);
        currentLevel = level;
    }

    return root;
}

// 渲染脑图
function renderMindmap(data) {
    if (graph) {
        graph.destroy();
    }

    const container = document.getElementById('mindmap');
    const width = container.scrollWidth;
    const height = container.scrollHeight || 500;

    graph = new G6.TreeGraph({
        container: 'mindmap',
        width,
        height,
        modes: {
            default: ['drag-canvas', 'zoom-canvas', 'drag-node']
        },
        defaultNode: {
            size: [120, 40],
            style: {
                fill: '#fff',
                stroke: '#91d5ff',
                radius: 5,
            },
        },
        defaultEdge: {
            style: {
                stroke: '#91d5ff',
            },
        },
        layout: {
            type: 'mindmap',
            direction: 'H',
            getHeight: () => 16,
            getWidth: () => 16,
            getVGap: () => 10,
            getHGap: () => 50,
        },
    });

    graph.data(data);
    graph.render();
    graph.fitView();
}

// 生成脑图
function generateMindmap() {
    const textInput = document.getElementById('textInput').value;
    const linkInput = document.getElementById('linkInput').value;

    if (linkInput) {
        // 处理链接输入
        fetch(linkInput)
            .then(response => response.text())
            .then(text => {
                currentData = generateMindmapData(text);
                renderMindmap(currentData);
            })
            .catch(error => {
                alert('获取链接内容失败，请检查链接是否有效');
                console.error('Error fetching link:', error);
            });
    } else if (textInput) {
        // 处理文本输入
        currentData = generateMindmapData(textInput);
        renderMindmap(currentData);
    } else {
        alert('请输入文本内容或提供有效的链接');
    }
}

// 清空输入
function clearInput() {
    document.getElementById('textInput').value = '';
    document.getElementById('linkInput').value = '';
}

// 分享脑图
function shareMindmap() {
    if (!currentData) {
        alert('请先生成脑图');
        return;
    }

    const encodedData = btoa(JSON.stringify(currentData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    
    // 复制链接到剪贴板
    navigator.clipboard.writeText(shareUrl)
        .then(() => alert('分享链接已复制到剪贴板'))
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('复制链接失败，请手动复制：' + shareUrl);
        });
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    if (graph) {
        const container = document.getElementById('mindmap');
        graph.changeSize(container.scrollWidth, container.scrollHeight);
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
