const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// 启用 CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// 启用 JSON 解析
app.use(express.json());

// 生成思维导图数据的 API 端点
app.post('/generate', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ 
                error: '请提供内容' 
            });
        }

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
        const response = await axios.post('https://aigc.sankuai.com/v1/openai/native/chat/completions', {
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
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 1869669620236480523'
            }
        });

        if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            throw new Error('Invalid API response format');
        }

        const mindmapData = response.data.choices[0].message.content;
        res.json(mindmapData);

    } catch (error) {
        console.error('Error generating mindmap:', error);
        res.status(500).json({ 
            error: '生成思维导图失败',
            details: error.message 
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: '服务器内部错误',
        details: err.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
