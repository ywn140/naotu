class MindMap {
    constructor() {
        this.graph = null;
        this.data = null;
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.querySelector('.error-message');
        this.historyList = document.querySelector('#history-list');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
        this.loadTheme();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
    }

    bindEvents() {
        // 生成按钮事件
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateMindMap());
        }

        // 主题切换事件
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // 保存按钮事件
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveMindMap());
        }

        // 导出按钮事件
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportImage());
        }

        // 历史记录按钮事件
        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.toggleHistory());
        }

        // 输入框事件
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.addEventListener('input', () => {
                if (generateBtn) {
                    generateBtn.disabled = !textInput.value.trim();
                }
            });
        }
    }

    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
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

    async generateMindMap() {
        const textInput = document.getElementById('text-input');
        if (!textInput) return;

        const inputText = textInput.value.trim();
        if (!inputText) {
            this.showError('请输入要分析的文本内容');
            return;
        }

        try {
            this.showLoading();
            const data = this.parseText(inputText);
            
            if (!data || !data.nodes || data.nodes.length === 0) {
                throw new Error('无法解析文本内容，请尝试输入更多信息');
            }

            this.data = data;
            
            if (this.graph) {
                this.graph.destroy();
            }

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

    // 主题切换相关方法
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
        const textInput = document.getElementById('text-input');
        if (!textInput || !this.data) {
            this.showError('没有可保存的思维导图');
            return;
        }

        const inputText = textInput.value.trim();
        if (!inputText) {
            this.showError('没有可保存的内容');
            return;
        }

        try {
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
        } catch (error) {
            console.error('保存失败:', error);
            this.showError('保存失败，请重试');
        }
    }

    // 加载历史记录
    loadHistory() {
        if (!this.historyList) return;

        try {
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
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showError('加载历史记录失败');
        }
    }

    toggleHistory() {
        if (!this.historyList) return;
        const isVisible = this.historyList.style.display === 'block';
        this.historyList.style.display = isVisible ? 'none' : 'block';
    }

    loadHistoryItem(id) {
        try {
            const history = JSON.parse(localStorage.getItem('mindmap_history') || '[]');
            const item = history.find(h => h.id === parseInt(id));
            if (item) {
                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.value = item.text;
                }
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
        } catch (error) {
            console.error('加载历史记录项失败:', error);
            this.showError('加载历史记录失败');
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
            this.showError('导出成功');
        } catch (error) {
            console.error('导出图片失败:', error);
            this.showError('导出图片失败，请重试');
        }
    }

    // 原有的方法保持不变
    parseText(text) {
        // 保持原有的解析逻辑不变
        return this.textAnalyzer.analyze(text);
    }

    initGraph() {
        // 保持原有的图初始化逻辑不变
    }
}

// TextAnalyzer 类保持不变
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
