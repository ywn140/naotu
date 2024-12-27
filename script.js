class MindMap {
    constructor() {
        this.graph = null;
        this.container = document.getElementById('mindmap');
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.querySelector('.error-message');
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.contextMenu = document.getElementById('nodeContextMenu');
        this.selectedNode = null;
        this.currentTheme = 'default';
        this.themes = {
            default: {
                node: {
                    default: { fill: '#FFFFFF', stroke: '#8B7E74' },
                    root: { fill: '#8B7E74', stroke: '#8B7E74' },
                    selected: { fill: '#E8F2FF', stroke: '#4A90E2' }
                }
            },
            dark: {
                node: {
                    default: { fill: '#2C3E50', stroke: '#34495E', labelCfg: { style: { fill: '#FFFFFF' } } },
                    root: { fill: '#34495E', stroke: '#34495E', labelCfg: { style: { fill: '#FFFFFF' } } },
                    selected: { fill: '#3498DB', stroke: '#2980B9', labelCfg: { style: { fill: '#FFFFFF' } } }
                }
            },
            colorful: {
                node: {
                    default: { fill: '#FFFFFF', stroke: '#4A90E2' },
                    root: { fill: '#4A90E2', stroke: '#4A90E2' },
                    selected: { fill: '#E8F2FF', stroke: '#4A90E2' }
                }
            }
        };
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

        // 添加工具栏事件监听
        document.getElementById('addNodeBtn')?.addEventListener('click', () => this.addNode());
        document.getElementById('deleteNodeBtn')?.addEventListener('click', () => this.deleteNode());
        document.getElementById('editNodeBtn')?.addEventListener('click', () => this.editNode());
        document.getElementById('colorNodeBtn')?.addEventListener('click', () => this.showColorPicker());
        document.getElementById('themeBtn')?.addEventListener('click', () => this.toggleTheme());

        // 添加右键菜单事件监听
        document.getElementById('addChildNode')?.addEventListener('click', () => this.addNode());
        document.getElementById('editNode')?.addEventListener('click', () => this.editNode());
        document.getElementById('deleteNode')?.addEventListener('click', () => this.deleteNode());

        // 添加颜色选择器事件监听
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.changeNodeColor(color);
            });
        });

        // 点击其他地方时隐藏右键菜单
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // 添加窗口大小调整监听
        window.addEventListener('resize', () => {
            if (this.graph) {
                const width = this.container.offsetWidth;
                const height = this.container.offsetHeight;
                this.graph.changeSize(width, height);
                this.graph.fitCenter();
            }
        });
    }

    // 显示右键菜单
    showContextMenu(e, node) {
        const { x, y } = this.graph.getCanvasByPoint(e.x, e.y);
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.selectedNode = node;
    }

    // 隐藏右键菜单
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.selectedNode = null;
    }

    // 添加节点
    addNode() {
        if (!this.selectedNode) return;
        
        const newId = `node-${Date.now()}`;
        const model = this.graph.findDataById(this.selectedNode);
        
        this.graph.addItem('node', {
            id: newId,
            label: '新节点',
            ...this.getNodeConfig(model.depth + 1)
        });

        this.graph.addItem('edge', {
            source: this.selectedNode,
            target: newId,
            style: {
                stroke: this.themes[this.currentTheme].node.default.stroke,
                opacity: 0.8
            }
        });

        this.hideContextMenu();
        this.graph.layout();
    }

    // 编辑节点
    editNode() {
        if (!this.selectedNode) return;
        
        const node = this.graph.findById(this.selectedNode);
        const label = prompt('请输入新的文本：', node.getModel().label);
        
        if (label !== null) {
            this.graph.updateItem(this.selectedNode, {
                label: label
            });
        }

        this.hideContextMenu();
    }

    // 删除节点
    deleteNode() {
        if (!this.selectedNode) return;
        
        const node = this.graph.findById(this.selectedNode);
        if (node) {
            this.graph.removeItem(this.selectedNode);
        }

        this.hideContextMenu();
    }

    // 更改节点颜色
    changeNodeColor(color) {
        if (!this.selectedNode) return;
        
        this.graph.updateItem(this.selectedNode, {
            style: {
                fill: color,
                stroke: color
            }
        });

        this.hideContextMenu();
    }

    // 切换主题
    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.currentTheme = themes[nextIndex];
        
        this.graph.getNodes().forEach(node => {
            const model = node.getModel();
            const config = model.id === 'node-0' ? 
                this.themes[this.currentTheme].node.root :
                this.themes[this.currentTheme].node.default;
            
            this.graph.updateItem(node, {
                style: {
                    ...config
                }
            });
        });
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
                        align: 'DL',
                        center: [width / 2, height / 2], // 添加中心点配置
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
                // 使用 fitCenter 替代 fitView
                this.graph.fitCenter();
                
                // 添加一个小延迟来确保布局完成后再次居中
                setTimeout(() => {
                    this.graph.fitCenter();
                }, 100);
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

    // ... rest of the existing code ...
}
