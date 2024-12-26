class MindMap {
    constructor() {
        this.graph = null;
        this.data = null;
        this.isDarkTheme = localStorage.getItem('theme') === 'dark';
        this.init();
        this.bindEvents();
    }

    init() {
        // 设置主题
        document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');

        // 初始化图形实例
        this.graph = new G6.Graph({
            container: 'mindmap',
            width: document.getElementById('mindmap').offsetWidth,
            height: document.getElementById('mindmap').offsetHeight,
            modes: {
                default: ['drag-canvas', 'zoom-canvas'],
            },
            defaultNode: {
                type: 'rect',
                style: {
                    radius: 5,
                },
            },
            defaultEdge: {
                type: 'cubic-horizontal',
                style: {
                    stroke: '#A3B1BF',
                },
            },
            layout: {
                type: 'mindmap',
                direction: 'H',
                getHeight: () => 16,
                getWidth: () => 16,
                getVGap: () => 10,
                getHGap: () => 50,
                getSide: (d) => {
                    if (d.id === 'root') return 'right';
                    return d.data.side || 'right';
                },
            },
            animate: true,
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (this.graph) {
                this.graph.changeSize(
                    document.getElementById('mindmap').offsetWidth,
                    document.getElementById('mindmap').offsetHeight
                );
            }
        });
    }

    bindEvents() {
        // 生成按钮点击事件
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateMindMap();
        });

        // 主题切换按钮点击事件
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 保存按钮点击事件
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveMindMap();
        });

        // 导出按钮点击事件
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportImage();
        });

        // 历史记录按钮点击事件
        document.getElementById('history-btn').addEventListener('click', () => {
            this.toggleHistory();
        });

        // 文本框回车事件
        document.getElementById('text-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.generateMindMap();
            }
        });
    }

    showLoading() {
        document.querySelector('.loading').style.display = 'block';
    }

    hideLoading() {
        document.querySelector('.loading').style.display = 'none';
    }

    showError(message) {
        const errorElement = document.querySelector('.error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }

    async generateMindMap() {
        const input = document.getElementById('text-input').value.trim();
        if (!input) {
            this.showError('请输入要分析的文本内容');
            return;
        }

        this.showLoading();

        try {
            // 这里是示例数据结构，实际项目中需要替换为真实的后端API调用
            this.data = {
                id: 'root',
                label: input.split('\n')[0] || '中心主题',
                children: this.parseText(input)
            };

            this.renderMindMap();
        } catch (error) {
            this.showError('生成思维导图时发生错误');
            console.error('Error generating mind map:', error);
        } finally {
            this.hideLoading();
        }
    }

    parseText(text) {
        // 简单的文本解析逻辑，可以根据需要扩展
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length <= 1) return [];

        const children = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                children.push({
                    id: `node-${i}`,
                    label: line,
                    style: {
                        fill: this.getRandomColor(),
                    },
                });
            }
        }
        return children;
    }

    getRandomColor() {
        const colors = this.isDarkTheme ? 
            ['#1f1f1f', '#2d2d2d', '#3d3d3d', '#4d4d4d'] : 
            ['#E8F3FF', '#F7E8FF', '#FFE8E8', '#E8FFEA'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    renderMindMap() {
        if (!this.data || !this.graph) return;

        const nodes = [];
        const edges = [];

        // 添加根节点
        nodes.push({
            id: this.data.id,
            label: this.data.label,
            style: {
                fill: this.isDarkTheme ? '#177ddc' : '#91D5FF',
                stroke: this.isDarkTheme ? '#177ddc' : '#91D5FF',
                textBaseline: 'top',
                textAlign: 'center',
                radius: 4,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                lineWidth: 1,
                opacity: 1
            },
            labelCfg: {
                style: {
                    fill: this.isDarkTheme ? '#ffffff' : '#000000',
                    fontSize: 14,
                    fontWeight: 500
                }
            }
        });

        // 添加子节点和边
        this.data.children.forEach((child) => {
            nodes.push({
                id: child.id,
                label: child.label,
                style: {
                    ...child.style,
                    stroke: this.isDarkTheme ? '#434343' : '#e8e8e8',
                    textBaseline: 'top',
                    textAlign: 'center',
                    radius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                    lineWidth: 1,
                    opacity: 1
                },
                labelCfg: {
                    style: {
                        fill: this.isDarkTheme ? '#ffffff' : '#000000',
                        fontSize: 12
                    }
                }
            });

            edges.push({
                source: this.data.id,
                target: child.id,
                style: {
                    stroke: this.isDarkTheme ? '#434343' : '#A3B1BF',
                    lineWidth: 1,
                    endArrow: false,
                    cursor: 'pointer'
                }
            });
        });

        // 更新图形
        this.graph.data({
            nodes,
            edges
        });
        this.graph.render();
        this.graph.fitView();
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');

        // 更新图标
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';

        // 重新渲染思维导图
        if (this.data) {
            this.renderMindMap();
        }
    }

    saveMindMap() {
        const input = document.getElementById('text-input').value.trim();
        if (!input || !this.data) {
            this.showError('没有可保存的思维导图');
            return;
        }

        try {
            // 获取现有历史记录
            const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');

            // 创建新的记录
            const newEntry = {
                id: Date.now(),
                title: this.data.label,
                text: input,
                data: this.data,
                timestamp: new Date().toISOString()
            };

            // 将新记录添加到历史记录开头
            history.unshift(newEntry);

            // 只保留最新的10条记录
            const updatedHistory = history.slice(0, 10);

            // 保存更新后的历史记录
            localStorage.setItem('mindmap_history', JSON.stringify(updatedHistory));

            // 显示成功消息
            this.showError('思维导图已保存');
        } catch (error) {
            this.showError('保存失败');
            console.error('Error saving mind map:', error);
        }
    }

    exportImage() {
        if (!this.graph || !this.data) {
            this.showError('没有可导出的思维导图');
            return;
        }

        try {
            // 下载图片
            this.graph.downloadFullImage('mindmap', 'image/png', {
                backgroundColor: this.isDarkTheme ? '#141414' : '#ffffff'
            });
        } catch (error) {
            this.showError('导出图片失败');
            console.error('Error exporting image:', error);
        }
    }

    toggleHistory() {
        const historyPanel = document.getElementById('history-list');
        const isVisible = historyPanel.style.display === 'block';

        if (isVisible) {
            historyPanel.style.display = 'none';
        } else {
            this.showHistory();
        }
    }

    showHistory() {
        const historyPanel = document.getElementById('history-list');
        const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');

        if (history.length === 0) {
            historyPanel.innerHTML = '<div class="history-item">暂无历史记录</div>';
        } else {
            historyPanel.innerHTML = history.map(entry => `
                <div class="history-item" data-id="${entry.id}">
                    <div>${entry.title}</div>
                    <small>${new Date(entry.timestamp).toLocaleString()}</small>
                </div>
            `).join('');

            // 为每个历史记录项添加点击事件
            historyPanel.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    const entry = history.find(h => h.id === id);
                    if (entry) {
                        document.getElementById('text-input').value = entry.text;
                        this.data = entry.data;
                        this.renderMindMap();
                        historyPanel.style.display = 'none';
                    }
                });
            });
        }

        historyPanel.style.display = 'block';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});
