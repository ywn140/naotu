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
            
            // 转换为思维导图数据结构
            const mindmapData = this.convertToMindmapData(analysis);
            
            // 渲染思维导图
            this.renderMindmap(mindmapData);
            
        } catch (error) {
            console.error('处理文本失败:', error);
            throw error;
        }
    }

    // 转换为思维导图数据结构
    convertToMindmapData(analysis) {
        const { topic, structure, keyInfo } = analysis;
        
        // 构建根节点
        const root = {
            id: 'root',
            label: topic,
            children: []
        };
        
        // 添加结构节点
        root.children = this.convertStructureToNodes(structure);
        
        // 添加关键信息节点
        this.addKeyInfoNodes(root, keyInfo);
        
        return root;
    }

    // 转换结构为节点
    convertStructureToNodes(structure, parentId = 'root') {
        return structure.map((item, index) => {
            const node = {
                id: `${parentId}-${index}`,
                label: item.topic,
                children: []
            };
            
            // 添加关键点
            if (item.keyPoints && item.keyPoints.length > 0) {
                node.children = item.keyPoints.map((point, pointIndex) => ({
                    id: `${node.id}-point-${pointIndex}`,
                    label: point
                }));
            }
            
            // 递归处理子节点
            if (item.children && item.children.length > 0) {
                node.children = [
                    ...node.children,
                    ...this.convertStructureToNodes(item.children, node.id)
                ];
            }
            
            return node;
        });
    }

    // 添加关键信息节点
    addKeyInfoNodes(root, keyInfo) {
        const categories = {
            actions: '行动项',
            results: '结果',
            criteria: '评价标准',
            concepts: '相关概念'
        };
        
        Object.entries(keyInfo).forEach(([key, items]) => {
            if (items.length > 0) {
                const categoryNode = {
                    id: `key-${key}`,
                    label: categories[key],
                    children: items.map((item, index) => ({
                        id: `${key}-item-${index}`,
                        label: item
                    }))
                };
                root.children.push(categoryNode);
            }
        });
    }

    // 渲染思维导图
    renderMindmap(data) {
        this.graph.data(data);
        this.graph.render();
        this.graph.fitView();
    }
}

class TextAnalyzer {
    constructor() {
        // 关键词权重
        this.keywordWeights = {
            action: ['如何', '怎样', '方法', '步骤', '措施', '执行', '实施', '开展', '推进'],
            result: ['结果', '成效', '影响', '作用', '效果', '产出', '价值'],
            criteria: ['标准', '要求', '规范', '准则', '原则', '评价', '考核'],
            concept: ['概念', '定义', '理论', '含义', '本质', '特点', '特征']
        };
        
        // 层级关系词
        this.hierarchyIndicators = {
            level1: ['首先', '其次', '最后', '另外', '此外'],
            level2: ['包括', '包含', '例如', '比如', '具体'],
            level3: ['其中', '特别是', '尤其是', '主要是'],
            level4: ['表现为', '体现在', '反映在', '具体来说']
        };
    }

    // 分析文本结构
    analyzeText(text) {
        // 分段
        const paragraphs = text.split(/\n+/).filter(p => p.trim());
        
        // 提取主题
        const mainTopic = this.extractMainTopic(paragraphs[0]);
        
        // 分析段落结构
        const structure = this.analyzeParagraphStructure(paragraphs);
        
        // 提取关键信息
        const keyInfo = {
            actions: this.extractKeywordBasedInfo(text, 'action'),
            results: this.extractKeywordBasedInfo(text, 'result'),
            criteria: this.extractKeywordBasedInfo(text, 'criteria'),
            concepts: this.extractKeywordBasedInfo(text, 'concept')
        };
        
        return {
            topic: mainTopic,
            structure: structure,
            keyInfo: keyInfo
        };
    }

    // 提取主题
    extractMainTopic(text) {
        const topics = [];
        
        // 通过关键词识别主题
        const topicPatterns = [
            /关于(.{2,20})(的|地)/,
            /(.{2,20})(问题|情况|研究)/,
            /如何(.{2,20})/,
            /(.{2,20})(的主要内容)/
        ];
        
        for (const pattern of topicPatterns) {
            const match = text.match(pattern);
            if (match) {
                topics.push(match[1]);
            }
        }
        
        // 如果没有找到明确的主题，使用第一句话的主要内容
        if (topics.length === 0) {
            const firstSentence = text.split(/[。！？]/)[0];
            topics.push(this.extractCoreSentence(firstSentence));
        }
        
        return topics[0] || text.slice(0, 20);
    }

    // 分析段落结构
    analyzeParagraphStructure(paragraphs) {
        const structure = [];
        
        paragraphs.forEach(paragraph => {
            // 检测段落层级
            const level = this.detectParagraphLevel(paragraph);
            
            // 提取段落主题
            const topic = this.extractParagraphTopic(paragraph);
            
            // 提取关键点
            const keyPoints = this.extractKeyPoints(paragraph);
            
            structure.push({
                level,
                topic,
                keyPoints,
                content: paragraph
            });
        });
        
        return this.organizeHierarchy(structure);
    }

    // 检测段落层级
    detectParagraphLevel(paragraph) {
        for (const [level, indicators] of Object.entries(this.hierarchyIndicators)) {
            if (indicators.some(indicator => paragraph.includes(indicator))) {
                return parseInt(level.replace('level', ''));
            }
        }
        return 1;
    }

    // 提取段落主题
    extractParagraphTopic(paragraph) {
        // 分句
        const sentences = paragraph.split(/[。！？]/);
        
        // 找到最有可能是主题的句子
        const topicSentence = sentences.reduce((best, current) => {
            const bestScore = this.calculateTopicScore(best);
            const currentScore = this.calculateTopicScore(current);
            return currentScore > bestScore ? current : best;
        });
        
        return this.extractCoreSentence(topicSentence);
    }

    // 计算句子作为主题的得分
    calculateTopicScore(sentence) {
        let score = 0;
        
        // 包含主题关键词
        if (/主要|关键|核心|重点|总体|概括/.test(sentence)) score += 3;
        
        // 句子长度适中
        if (sentence.length >= 5 && sentence.length <= 20) score += 2;
        
        // 包含层级指示词
        Object.values(this.hierarchyIndicators).flat().forEach(indicator => {
            if (sentence.includes(indicator)) score += 1;
        });
        
        return score;
    }

    // 提取核心句子内容
    extractCoreSentence(sentence) {
        // 移除常见的修饰词
        return sentence
            .replace(/^(关于|对于|针对|就|在|由于|因为|所以|因此|但是|然而|不过|总之|总的来说|综上所述).*/g, '')
            .replace(/(的是|地|的).{0,3}$/g, '')
            .trim();
    }

    // 提取关键点
    extractKeyPoints(paragraph) {
        const points = [];
        const sentences = paragraph.split(/[。！？]/);
        
        sentences.forEach(sentence => {
            if (this.isKeyPoint(sentence)) {
                points.push(this.extractCoreSentence(sentence));
            }
        });
        
        return points;
    }

    // 判断是否是关键点
    isKeyPoint(sentence) {
        // 包含关键词
        const hasKeyword = Object.values(this.keywordWeights)
            .flat()
            .some(keyword => sentence.includes(keyword));
            
        // 句子结构完整
        const isComplete = sentence.length >= 5 && /[，；]/.test(sentence);
        
        return hasKeyword && isComplete;
    }

    // 提取基于关键词的信息
    extractKeywordBasedInfo(text, type) {
        const keywords = this.keywordWeights[type];
        const info = [];
        
        const sentences = text.split(/[。！？]/);
        sentences.forEach(sentence => {
            if (keywords.some(keyword => sentence.includes(keyword))) {
                info.push(this.extractCoreSentence(sentence));
            }
        });
        
        return info;
    }

    // 组织层级结构
    organizeHierarchy(items) {
        const root = { level: 0, children: [] };
        const stack = [root];
        
        items.forEach(item => {
            while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }
            
            const parent = stack[stack.length - 1];
            if (!parent.children) parent.children = [];
            parent.children.push(item);
            
            stack.push(item);
        });
        
        return root.children;
    }
}

// 初始化
window.onload = () => {
    new MindMap();
};
