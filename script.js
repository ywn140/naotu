class MindMap {
    constructor() {
        this.graph = null;
        this.data = null;
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.querySelector('.error-message');
        this.historyList = document.querySelector('#historyList');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.bindEvents();
        this.loadTheme();
        this.loadHistory();
    }

    bindEvents() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generateMindMap());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveMindMap());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportImage());
        document.getElementById('historyBtn').addEventListener('click', () => this.toggleHistory());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    }

    async generateMindMap() {
        const inputText = document.getElementById('inputText').value.trim();
        
        if (!inputText) {
            this.showError('请输入要分析的文本内容');
            return;
        }

        try {
            this.showLoading();
            
            // 解析文本生成节点数据
            const data = this.parseText(inputText);
            
            if (!data || !data.nodes || data.nodes.length === 0) {
                throw new Error('无法解析文本内容，请尝试输入更多信息');
            }

            // 更新图数据
            this.data = data;
            
            // 如果图已存在，销毁它
            if (this.graph) {
                this.graph.destroy();
            }

            // 创建新图
            this.initGraph();
            this.graph.data(this.data);
            this.graph.render();
            this.graph.fitView();

        } catch (error) {
            console.error('生成思维导图时出错:', error);
            this.showError(error.message || '生成思维导图时出错，请重试');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.loading.style.display = 'block';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 3000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    // 主题切换
    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.loadTheme();
    }

    // 保存思维导图
    saveMindMap() {
        const inputText = document.getElementById('inputText').value.trim();
        if (!inputText || !this.data) {
            this.showError('没有可保存的思维导图');
            return;
        }

        const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');
        const newItem = {
            id: Date.now(),
            text: inputText,
            data: this.data,
            date: new Date().toLocaleString()
        };

        history.unshift(newItem);
        if (history.length > 10) history.pop(); // 最多保存10条记录

        localStorage.setItem('mindmap_history', JSON.stringify(history));
        this.showError('保存成功');
        this.loadHistory();
    }

    // 加载历史记录
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');
        this.historyList.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div>${item.text.substring(0, 50)}${item.text.length > 50 ? '...' : ''}</div>
                <small>${item.date}</small>
            </div>
        `).join('');

        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadHistoryItem(item.dataset.id));
        });
    }

    toggleHistory() {
        const isVisible = this.historyList.style.display === 'block';
        this.historyList.style.display = isVisible ? 'none' : 'block';
    }

    loadHistoryItem(id) {
        const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');
        const item = history.find(h => h.id === parseInt(id));
        if (item) {
            document.getElementById('inputText').value = item.text;
            this.data = item.data;
            if (this.graph) {
                this.graph.destroy();
            }
            this.initGraph();
            this.graph.data(this.data);
            this.graph.render();
            this.graph.fitView();
            this.toggleHistory();
        }
    }

    // 导出图片
    exportImage() {
        if (!this.graph) {
            this.showError('没有可导出的思维导图');
            return;
        }

        try {
            const dataUrl = this.graph.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `mindmap_${new Date().toISOString().slice(0,10)}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('导出图片时出错:', error);
            this.showError('导出图片失败，请重试');
        }
    }

    initGraph() {
        const container = document.getElementById('mountNode');
        this.graph = new G6.Graph({
            container,
            width: container.scrollWidth,
            height: container.scrollHeight || 500,
            modes: {
                default: ['drag-canvas', 'zoom-canvas'],
            },
            defaultNode: {
                type: 'rect',
                style: {
                    radius: 5,
                    stroke: '#69c0ff',
                    fill: '#ffffff',
                    lineWidth: 1,
                    fontSize: 14,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    padding: [8, 16],
                },
            },
            defaultEdge: {
                type: 'cubic-horizontal',
                style: {
                    stroke: '#91d5ff',
                    lineWidth: 1,
                    endArrow: true,
                },
            },
            layout: {
                type: 'mindmap',
                direction: 'H',
                getHeight: () => {
                    return 60;
                },
                getWidth: (node) => {
                    const labelWidth = G6.Util.getTextSize(node.label, 14)[0];
                    return labelWidth + 40;
                },
                getVGap: () => {
                    return 20;
                },
                getHGap: () => {
                    return 100;
                },
            },
            fitView: true,
            animate: true,
        });
    }

    parseText(text) {
        // 简单的文本解析逻辑
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;

        const nodes = [];
        const edges = [];
        let nodeId = 0;

        // 添加根节点
        nodes.push({
            id: `${nodeId}`,
            label: lines[0].trim(),
        });

        // 为其他行创建节点和边
        for (let i = 1; i < lines.length; i++) {
            nodeId++;
            const line = lines[i].trim();
            nodes.push({
                id: `${nodeId}`,
                label: line,
            });
            edges.push({
                source: '0',
                target: `${nodeId}`,
            });
        }

        return {
            nodes,
            edges,
        };
    }
}

// 初始化
window.onload = () => {
    new MindMap();
};
