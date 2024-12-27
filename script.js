class MindMap {
    constructor() {
        this.graph = null;
        this.data = null;
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.querySelector('.error-message');
        this.init();
    }

    async init() {
        try {
            const container = document.getElementById('mindmap');
            const width = container.offsetWidth;
            const height = container.offsetHeight;

            this.graph = new G6.Graph({
                container: 'mindmap',
                width,
                height,
                modes: {
                    default: ['drag-canvas', 'zoom-canvas']
                },
                layout: {
                    type: 'mindmap',
                    direction: 'H',
                    getHeight: () => 16,
                    getWidth: () => 16,
                    getVGap: () => 50,
                    getHGap: () => 100
                },
                defaultNode: {
                    type: 'rect',
                    size: [160, 45],
                    style: {
                        radius: 8,
                        fill: '#fff',
                        stroke: '#1890ff',
                        lineWidth: 2,
                        cursor: 'pointer'
                    },
                    labelCfg: {
                        style: {
                            fill: '#2A2A2A',
                            fontSize: 14,
                            fontWeight: 500,
                            wordWrap: true,
                            wordWrapWidth: 140,
                            textAlign: 'center'
                        }
                    }
                },
                defaultEdge: {
                    type: 'cubic-horizontal',
                    style: {
                        stroke: '#1890ff',
                        lineWidth: 2,
                        endArrow: {
                            path: G6.Arrow.triangle(6, 8, 0),
                            fill: '#1890ff'
                        }
                    }
                }
            });

            // 监听窗口大小变化
            window.addEventListener('resize', () => {
                if (this.graph) {
                    this.graph.changeSize(container.offsetWidth, container.offsetHeight);
                }
            });

            this.bindEvents();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    bindEvents() {
        const generateBtn = document.getElementById('generateBtn');
        const textInput = document.getElementById('textInput');

        if (generateBtn && textInput) {
            generateBtn.onclick = async () => {
                const text = textInput.value.trim();
                if (text) {
                    try {
                        this.showLoading();
                        generateBtn.disabled = true;
                        await this.generateMindMap(text);
                    } catch (error) {
                        console.error('生成思维导图失败:', error);
                        this.showError('生成思维导图失败，请重试');
                    } finally {
                        this.hideLoading();
                        generateBtn.disabled = false;
                    }
                } else {
                    this.showError('请输入文本内容');
                }
            };

            textInput.oninput = () => {
                generateBtn.disabled = !textInput.value.trim();
            };
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

    async generateMindMap(text) {
        try {
            // 解析文本生成节点数据
            const data = this.parseText(text);
            
            if (!data || !data.nodes || data.nodes.length === 0) {
                throw new Error('无法解析文本内容，请尝试输入更多信息');
            }

            // 更新图数据
            if (this.graph) {
                this.graph.clear();
                this.graph.data(data);
                this.graph.render();
                this.graph.fitView();
            }
        } catch (error) {
            console.error('生成思维导图时出错:', error);
            throw error;
        }
    }

    parseText(text) {
        // 简单的文本解析逻辑
        const lines = text.split('\n').filter(line => line.trim());
        const nodes = [];
        const edges = [];
        
        if (lines.length === 0) {
            return null;
        }

        // 添加根节点
        const rootId = '0';
        nodes.push({
            id: rootId,
            label: lines[0],
            style: {
                fill: '#e6f7ff',
                stroke: '#1890ff'
            }
        });

        // 添加子节点
        lines.slice(1).forEach((line, index) => {
            const id = String(index + 1);
            nodes.push({
                id,
                label: line
            });
            edges.push({
                source: rootId,
                target: id
            });
        });

        return { nodes, edges };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});
