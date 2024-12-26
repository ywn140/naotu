class MindMap {
    constructor() {
        this.textAnalyzer = new TextAnalyzer();
        this.init();
    }

    async init() {
        try {
            const container = document.getElementById('mindmap');
            const width = container.offsetWidth || 1200;
            const height = container.offsetHeight || 800;

            // 创建图实例
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
                        stroke: '#8B7E74',
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
                        stroke: '#8B7E74',
                        lineWidth: 2,
                        endArrow: {
                            path: G6.Arrow.triangle(6, 8, 0),
                            fill: '#8B7E74'
                        }
                    }
                }
            });

            // 绑定事件
            this.bindEvents();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    // 绑定事件
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
                        await this.processText(text);
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

            // 监听输入，实时更新按钮状态
            textInput.oninput = () => {
                generateBtn.disabled = !textInput.value.trim();
                this.hideError();
            };
        }
    }

    // 显示加载状态
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // 显示错误信息
    showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
        }
    }

    // 隐藏错误信息
    hideError() {
        const error = document.getElementById('error');
        if (error) {
            error.style.display = 'none';
        }
    }

    // 处理输入文本
    async processText(text) {
        try {
            // 分析文本
            const analysis = this.textAnalyzer.analyzeText(text);
            
            // 渲染思维导图
            this.renderMindmap(analysis);
            
        } catch (error) {
            console.error('处理文本失败:', error);
            throw error;
        }
    }

    // 渲染思维导图
    renderMindmap(data) {
        const nodes = [];
        const edges = [];
        let id = 0;

        // 创建根节点
        const rootNode = {
            id: String(id++),
            label: data.topic,
            type: 'root-node',
            style: {
                fill: '#e6f7ff',
                stroke: '#91d5ff'
            }
        };
        nodes.push(rootNode);

        // 添加结构节点
        data.structure.forEach(item => {
            const nodeId = String(id++);
            nodes.push({
                id: nodeId,
                label: item.topic,
                type: 'structure-node',
                style: {
                    fill: this.getNodeColor(item.importance),
                    stroke: '#91d5ff'
                }
            });
            edges.push({
                source: rootNode.id,
                target: nodeId
            });

            // 添加子节点
            if (item.children) {
                item.children.forEach(child => {
                    const childId = String(id++);
                    nodes.push({
                        id: childId,
                        label: child.content,
                        type: 'content-node'
                    });
                    edges.push({
                        source: nodeId,
                        target: childId
                    });
                });
            }
        });

        // 添加关键信息节点
        Object.entries(data.keyInfo).forEach(([category, items]) => {
            if (items && items.length > 0) {
                const categoryId = String(id++);
                nodes.push({
                    id: categoryId,
                    label: this.getCategoryLabel(category),
                    type: 'category-node'
                });
                edges.push({
                    source: rootNode.id,
                    target: categoryId
                });

                items.forEach(item => {
                    const itemId = String(id++);
                    nodes.push({
                        id: itemId,
                        label: item.content || item,
                        type: 'info-node',
                        style: {
                            fill: this.getPriorityColor(item.priority)
                        }
                    });
                    edges.push({
                        source: categoryId,
                        target: itemId
                    });
                });
            }
        });

        this.graph.data({ nodes, edges });
        this.graph.render();
        this.graph.fitView();
    }

    // 获取节点颜色
    getNodeColor(importance) {
        const colors = {
            high: '#f6ffed',
            medium: '#e6f7ff',
            low: '#fff7e6'
        };
        return colors[importance] || colors.medium;
    }

    // 获取优先级颜色
    getPriorityColor(priority) {
        if (priority >= 5) return '#f6ffed';
        if (priority >= 3) return '#e6f7ff';
        return '#fff7e6';
    }

    // 获取分类标签
    getCategoryLabel(category) {
        const labels = {
            challenges: '问题与挑战',
            solutions: '解决方案',
            conditions: '条件与场景',
            viewpoints: '观点与建议',
            evidence: '证据支持',
            logicChains: '逻辑链条'
        };
        return labels[category] || category;
    }
}

class TextAnalyzer {
    constructor() {
        // 关键词权重
        this.keywordWeights = {
            action: ['如何', '怎样', '方法', '步骤', '措施', '执行', '实施', '开展', '推进', '落实', '实现', '完成', '提升', '优化', '改进'],
            result: ['结果', '成效', '影响', '作用', '效果', '产出', '价值', '意义', '贡献', '成果', '优势', '表现', '收益'],
            criteria: ['标准', '要求', '规范', '准则', '原则', '评价', '考核', '衡量', '判断', '评估', '指标', '质量'],
            concept: ['概念', '定义', '理论', '含义', '本质', '特点', '特征', '属性', '范畴', '体系', '模式', '机制'],
            logic: ['因此', '所以', '导致', '引起', '造成', '决定', '影响', '促进', '制约', '关系', '基于', '由于'],
            evidence: ['数据', '研究', '调查', '证明', '表明', '显示', '证据', '案例', '实例', '统计', '分析', '报告'],
            viewpoint: ['认为', '观点', '看法', '主张', '建议', '提出', '强调', '指出', '说明', '论述', '表示', '阐述'],
            condition: ['如果', '假设', '前提', '条件', '情况下', '场景', '环境', '背景'],
            challenge: ['问题', '挑战', '困难', '障碍', '瓶颈', '风险', '隐患', '局限'],
            solution: ['解决', '应对', '克服', '突破', '改善', '优化', '完善', '提升']
        };
        
        // 语义关联词
        this.semanticRelations = {
            cause: ['因为', '由于', '导致', '引起', '使得', '致使', '促使', '基于', '源于'],
            result: ['所以', '因此', '故而', '从而', '致使', '造成', '最终', '结果'],
            contrast: ['但是', '然而', '相反', '不过', '尽管', '虽然', '反而', '却'],
            supplement: ['而且', '并且', '同时', '此外', '另外', '还有', '不仅', '除此之外'],
            condition: ['如果', '假如', '假设', '一旦', '只要', '除非', '在...情况下'],
            purpose: ['为了', '旨在', '目的是', '用来', '用于', '以便', '为此', '争取']
        };

        // 段落结构词
        this.structureIndicators = {
            summary: ['总的来说', '综上所述', '归纳起来', '简而言之', '总而言之'],
            sequence: ['首先', '其次', '然后', '接着', '最后', '第一', '第二'],
            emphasis: ['重点是', '关键是', '核心是', '主要是', '特别是', '尤其是'],
            example: ['例如', '比如', '举例来说', '以...为例', '就像', '譬如'],
            transition: ['另外', '此外', '同时', '不仅如此', '与此同时', '在此基础上']
        };

        // 观点强度标记词
        this.viewStrength = {
            strong: ['必须', '一定', '肯定', '确实', '显然', '毫无疑问'],
            moderate: ['可能', '也许', '大概', '估计', '应该', '或许'],
            weak: ['可能', '或许', '似乎', '好像', '据说', '传言']
        };

        // 情感倾向词
        this.sentimentWords = {
            positive: ['好', '优秀', '出色', '卓越', '优化', '改进', '提升', '增强'],
            negative: ['差', '糟糕', '问题', '困难', '劣势', '不足', '缺陷', '风险'],
            neutral: ['普通', '一般', '正常', '标准', '通常', '平均', '中等']
        };
    }

    // 分析文本结构和深层语义
    analyzeText(text) {
        // 分段
        const paragraphs = text.split(/\n+/).filter(p => p.trim());
        
        // 提取主题
        const mainTopic = this.extractMainTopic(paragraphs[0]);
        
        // 分析段落结构
        const structure = this.analyzeParagraphStructure(paragraphs);
        
        // 提取关键信息
        const keyInfo = {
            challenges: this.extractKeywordBasedInfo(text, 'challenge'),
            solutions: this.extractKeywordBasedInfo(text, 'solution'),
            conditions: this.extractConditions(text),
            viewpoints: this.extractViewpoints(text),
            evidence: this.extractEvidence(text),
            logicChains: this.extractLogicChains(text)
        };

        // 深度语义分析
        const semanticAnalysis = {
            relations: this.analyzeSemanticRelations(text),
            sentiment: this.analyzeSentiment(text),
            emphasis: this.findEmphasisPoints(text)
        };
        
        return {
            topic: mainTopic,
            structure: this.enrichStructure(structure, semanticAnalysis),
            keyInfo: this.prioritizeContent(keyInfo),
            semantics: semanticAnalysis
        };
    }

    // 提取条件和场景
    extractConditions(text) {
        const conditions = [];
        const sentences = text.split(/[。！？]/);
        
        sentences.forEach(sentence => {
            this.keywordWeights.condition.forEach(keyword => {
                if (sentence.includes(keyword)) {
                    const condition = {
                        type: 'condition',
                        content: this.extractCoreSentence(sentence),
                        context: this.findRelatedContext(sentence, sentences)
                    };
                    conditions.push(condition);
                }
            });
        });
        
        return conditions;
    }

    // 分析情感倾向
    analyzeSentiment(text) {
        let sentiment = {
            positive: 0,
            negative: 0,
            neutral: 0
        };
        
        Object.entries(this.sentimentWords).forEach(([type, words]) => {
            words.forEach(word => {
                const matches = text.match(new RegExp(word, 'g'));
                if (matches) {
                    sentiment[type] += matches.length;
                }
            });
        });
        
        return sentiment;
    }

    // 查找重点强调内容
    findEmphasisPoints(text) {
        const emphasisPoints = [];
        const sentences = text.split(/[。！？]/);
        
        sentences.forEach(sentence => {
            this.structureIndicators.emphasis.forEach(keyword => {
                if (sentence.includes(keyword)) {
                    emphasisPoints.push({
                        point: this.extractCoreSentence(sentence),
                        strength: this.determineEmphasisStrength(sentence)
                    });
                }
            });
        });
        
        return emphasisPoints;
    }

    // 确定强调程度
    determineEmphasisStrength(sentence) {
        for (const [strength, words] of Object.entries(this.viewStrength)) {
            if (words.some(word => sentence.includes(word))) {
                return strength;
            }
        }
        return 'moderate';
    }

    // 内容优先级排序
    prioritizeContent(keyInfo) {
        const prioritized = {};
        
        Object.entries(keyInfo).forEach(([key, items]) => {
            if (Array.isArray(items)) {
                prioritized[key] = items.map(item => ({
                    ...item,
                    priority: this.calculatePriority(item)
                })).sort((a, b) => b.priority - a.priority);
            }
        });
        
        return prioritized;
    }

    // 计算内容优先级
    calculatePriority(item) {
        let priority = 0;
        
        // 基于强调词
        if (this.structureIndicators.emphasis.some(word => 
            item.content?.includes(word)
        )) {
            priority += 3;
        }
        
        // 基于情感强度
        if (this.viewStrength.strong.some(word => 
            item.content?.includes(word)
        )) {
            priority += 2;
        }
        
        // 基于证据支持
        if (item.evidence?.length > 0) {
            priority += item.evidence.length;
        }
        
        return priority;
    }

    {{ ... }}  // 保留其他现有方法
}

// 初始化
window.onload = () => {
    new MindMap();
};
