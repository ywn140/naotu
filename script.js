class MindMap {
    constructor() {
        this.graph = null;
        this.container = document.getElementById('mindmap');
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.querySelector('.error-message');
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.init();
    }

    init() {
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => this.handleGenerateClick());
        }

        if (this.textInput) {
            this.textInput.addEventListener('input', () => {
                if (this.generateBtn) {
                    this.generateBtn.disabled = !this.textInput.value.trim();
                }
            });
        }

        // 添加窗口大小调整监听
        window.addEventListener('resize', () => {
            if (this.graph) {
                const width = this.container.offsetWidth;
                const height = this.container.offsetHeight;
                this.graph.changeSize(width, height);
                this.graph.fitView();
            }
        });
    }

    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'block';
        }
        if (this.generateBtn) {
            this.generateBtn.disabled = true;
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
        }
        if (this.generateBtn) {
            this.generateBtn.disabled = false;
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            setTimeout(() => {
                this.errorMessage.style.display = 'none';
            }, 3000);
        }
    }

    async handleGenerateClick() {
        const content = this.textInput.value;
        if (!content) {
            this.showError('请输入内容');
            return;
        }

        this.showLoading();
        try {
            const data = await this.processContent(content);
            await this.renderGraph(data);
        } catch (error) {
            console.error('生成思维导图时出错:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async processContent(content) {
        try {
            // 构建 prompt
            const prompt = `请根据以下文本，生成一个结构极其丰富、层次分明的思维导图。要求：
1. 主题展开要求：
   - 全面性：覆盖所有重要概念和关键点
   - 层次性：清晰的主次关系
   - 关联性：展示概念间的联系
2. 结构要求：
   - 主题：核心主题突出
   - 分支：逻辑分支清晰
   - 层级：层次结构分明

文本内容：${content}

请返回一个JSON格式的结果，包含以下结构：
{
    "topic": "主题名称",
    "nodes": [
        {
            "type": "feature",
            "label": "一级主题",
            "children": [
                {
                    "type": "point",
                    "label": "二级要点"
                }
            ]
        }
    ]
}`;

            // 调用 API
            const response = await fetch('https://aigc.sankuai.com/v1/openai/native/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 1869669620236480523'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败');
            }

            const result = await response.json();
            
            if (!result.choices || !result.choices[0] || !result.choices[0].message) {
                throw new Error('API 响应格式无效');
            }

            return this.cleanAndParseJSON(result.choices[0].message.content);
        } catch (error) {
            throw new Error('处理内容失败: ' + error.message);
        }
    }

    async renderGraph(data) {
        try {
            console.log('开始渲染图形，输入数据:', data);
            
            if (this.container) {
                this.container.innerHTML = '';

                const width = this.container.offsetWidth || 1200;
                const height = this.container.offsetHeight || 800;

                // 创建图实例
                this.graph = new G6.Graph({
                    container: 'mindmap',
                    width,
                    height,
                    modes: {
                        default: ['drag-canvas', 'zoom-canvas']
                    },
                    layout: {
                        type: 'dagre',
                        rankdir: 'LR',
                        nodesep: 50,
                        ranksep: 100,
                        preventOverlap: true,
                        sortByCombo: true,
                        controlPoints: true,
                        align: 'DL'
                    },
                    defaultNode: {
                        type: 'rect',
                        size: [160, 45],
                        style: {
                            radius: 8,
                            fill: '#fff',
                            stroke: '#8B7E74',
                            lineWidth: 2,
                            cursor: 'pointer',
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowBlur: 10,
                            shadowOffsetY: 5
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
                        type: 'polyline',
                        style: {
                            stroke: '#8B7E74',
                            lineWidth: 2,
                            endArrow: {
                                path: G6.Arrow.triangle(6, 8, 0),
                                fill: '#8B7E74'
                            },
                            radius: 5
                        }
                    }
                });

                // 数据处理
                const nodes = [];
                const edges = [];
                let id = 0;

                const getNodeConfig = (depth) => {
                    // 基础配置
                    const baseConfig = {
                        size: [160, 45],
                        style: {
                            radius: 8,
                            lineWidth: 2,
                            cursor: 'pointer',
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowBlur: 10,
                            shadowOffsetY: 5
                        },
                        labelCfg: {
                            style: {
                                wordWrap: true,
                                wordWrapWidth: 140,
                                textAlign: 'center'
                            }
                        }
                    };

                    // 根据深度调整配置
                    switch(depth) {
                        case 0: // 根节点
                            baseConfig.size = [180, 50];
                            baseConfig.style.fill = '#8B7E74';
                            baseConfig.style.stroke = '#8B7E74';
                            baseConfig.labelCfg.style.fill = '#fff';
                            baseConfig.labelCfg.style.fontSize = 16;
                            baseConfig.labelCfg.style.fontWeight = 600;
                            break;
                        case 1: // 一级节点
                            baseConfig.size = [170, 45];
                            baseConfig.style.fill = '#fff';
                            baseConfig.style.stroke = '#9F8772';
                            baseConfig.labelCfg.style.fill = '#2A2A2A';
                            baseConfig.labelCfg.style.fontSize = 15;
                            baseConfig.labelCfg.style.fontWeight = 600;
                            break;
                        case 2: // 二级节点
                            baseConfig.style.fill = '#fff';
                            baseConfig.style.stroke = '#B4A69A';
                            baseConfig.labelCfg.style.fill = '#2A2A2A';
                            baseConfig.labelCfg.style.fontSize = 14;
                            baseConfig.labelCfg.style.fontWeight = 500;
                            break;
                        case 3: // 三级节点
                            baseConfig.size = [150, 40];
                            baseConfig.style.fill = '#fff';
                            baseConfig.style.stroke = '#C8B6A6';
                            baseConfig.labelCfg.style.fill = '#2A2A2A';
                            baseConfig.labelCfg.style.fontSize = 13;
                            baseConfig.labelCfg.style.fontWeight = 400;
                            break;
                        default: // 四级及以上节点
                            baseConfig.size = [140, 35];
                            baseConfig.style.fill = '#fff';
                            baseConfig.style.stroke = '#DDC3A5';
                            baseConfig.labelCfg.style.fill = '#2A2A2A';
                            baseConfig.labelCfg.style.fontSize = 12;
                            baseConfig.labelCfg.style.fontWeight = 400;
                    }

                    return baseConfig;
                };

                const processNode = (node, parentId = null, depth = 0) => {
                    if (depth > 4) return; // 限制最大深度为4级

                    const currentId = `node-${id++}`;
                    const nodeConfig = getNodeConfig(depth);
                    
                    // 添加节点
                    nodes.push({
                        id: currentId,
                        label: node.label || node.topic || '',
                        ...nodeConfig,
                        depth
                    });

                    // 添加边
                    if (parentId) {
                        edges.push({
                            source: parentId,
                            target: currentId,
                            style: {
                                stroke: nodeConfig.style.stroke,
                                opacity: 0.8
                            }
                        });
                    }

                    // 处理子节点
                    const children = [
                        ...(node.children || []),
                        ...(node.nodes || [])
                    ];

                    // 按深度排序子节点
                    children.sort((a, b) => {
                        const aDepth = a.depth || 0;
                        const bDepth = b.depth || 0;
                        return aDepth - bDepth;
                    });

                    children.forEach(child => processNode(child, currentId, depth + 1));
                    return currentId;
                };

                // 处理根节点
                processNode({
                    label: data.topic || '思维导图',
                    children: data.children || data.nodes || []
                });

                // 按深度对节点排序
                nodes.sort((a, b) => {
                    const aDepth = a.depth || 0;
                    const bDepth = b.depth || 0;
                    return aDepth - bDepth;
                });

                // 渲染图形
                this.graph.data({
                    nodes,
                    edges
                });

                this.graph.render();
                this.graph.fitView();
            }
        } catch (error) {
            console.error('处理图形时出错:', error);
            this.showError(error.message);
            
            // 清理
            if (this.graph) {
                try {
                    this.graph.destroy();
                } catch (destroyError) {
                    console.error('清理图形实例时出错:', destroyError);
                }
                this.graph = null;
            }
        }
    }

    cleanAndParseJSON(data) {
        try {
            console.log('开始解析 JSON:', data);

            // 如果已经是对象，直接返回
            if (typeof data === 'object' && data !== null) {
                console.log('数据已经是对象格式');
                return data;
            }

            // 确保是字符串
            if (typeof data !== 'string') {
                throw new Error('无效的数据类型');
            }

            // 移除 Markdown 代码块标记
            let cleanText = data
                .replace(/```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .replace(/^[\s\n]*```[\w]*\n/g, '')
                .replace(/\n```[\s\n]*$/g, '')
                .trim();

            console.log('清理后的文本:', cleanText);

            // 尝试解析 JSON
            let jsonData;
            try {
                jsonData = JSON.parse(cleanText);
            } catch (parseError) {
                console.log('初次解析失败，尝试进一步清理...');
                
                // 进一步清理文本
                cleanText = cleanText
                    .replace(/,(\s*[}\]])/g, '$1')  // 移除多余的逗号
                    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // 修复属性名
                    .replace(/:\s*'([^']*)'/g, ':"$1"')  // 将单引号替换为双引号
                    .replace(/\n/g, ' ')  // 移除换行符
                    .replace(/\s+/g, ' ')  // 压缩空白
                    .trim();

                console.log('进一步清理后的文本:', cleanText);
                jsonData = JSON.parse(cleanText);
            }

            // 验证和修复数据结构
            if (!this.isValidMindMapData(jsonData)) {
                console.log('数据结构无效，尝试修复...');
                jsonData = this.repairDataStructure(jsonData);
            }

            console.log('最终解析的数据:', jsonData);
            return jsonData;

        } catch (error) {
            console.error('JSON 解析错误:', error);
            throw new Error('JSON 解析失败: ' + error.message);
        }
    }

    isValidMindMapData(data) {
        return data && 
               (data.topic || data.label) && 
               (Array.isArray(data.nodes) || Array.isArray(data.children));
    }

    repairDataStructure(data) {
        // 如果是字符串，创建简单结构
        if (typeof data === 'string') {
            return {
                topic: '思维导图',
                nodes: [{ label: data }]
            };
        }

        // 如果是数组，包装成正确的结构
        if (Array.isArray(data)) {
            return {
                topic: '思维导图',
                nodes: data.map(item => ({
                    label: typeof item === 'string' ? item : (item.label || item.topic || '节点')
                }))
            };
        }

        // 如果是对象，规范化结构
        if (typeof data === 'object' && data !== null) {
            return {
                topic: data.topic || data.label || '思维导图',
                nodes: Array.isArray(data.nodes) ? data.nodes :
                       Array.isArray(data.children) ? data.children :
                       [{ label: '节点' }]
            };
        }

        // 默认结构
        return {
            topic: '思维导图',
            nodes: [{ label: '节点' }]
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});
