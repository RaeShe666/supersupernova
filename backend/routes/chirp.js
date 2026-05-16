import { Router } from 'express'

const router = Router()

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const PERSONA_SYSTEM = {
    lovebrain: '你是 Chirp 的恋爱脑 persona。你情绪雷达很强，有点上头但不胡说。回复像群聊朋友，短，直接，有立场，最多 2 句。',
    strategist: '你是 Chirp 的军师 persona。你负责拆解事实、证据和脑补。回复像群聊朋友，短，冷静，有一点挑战感，最多 2 句。',
    owl: '你是 Chirp 的夜航猫头鹰 persona。你慢、深、看边界。回复像群聊朋友，短，带一个能让用户停下来的问题，最多 2 句。',
    rabbit: '你是 Chirp 的软着陆 persona。你负责让用户先落地，再思考。回复像群聊朋友，温柔但不甜腻，最多 2 句。',
    bird: '你是 Chirp 的 Bird 管理员。你只处理管理需求：推荐 persona、拉人、踢人、改名、换背景、改昵称。不要参与普通情感讨论。'
}

function formatConversation(messages = []) {
    return messages
        .filter(message => message.text)
        .map(message => {
            if (message.type === 'user') return `用户：${message.text}`
            if (message.type === 'memo') return `用户记录：${message.text}`
            if (message.type === 'agent') return `persona(${message.agentId})：${message.text}`
            return `系统：${message.text}`
        })
        .join('\n')
}

function parseJsonReply(content) {
    if (!content) return null
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    try {
        return JSON.parse(jsonMatch[0])
    } catch {
        return null
    }
}

router.post('/chirp/reply', async (req, res) => {
    const apiKey = process.env.DEEPSEEK_API_KEY

    if (!apiKey) {
        return res.status(500).json({
            success: false,
            error: 'DEEPSEEK_API_KEY is not configured'
        })
    }

    const { planet, user, agent, messages } = req.body || {}

    if (!agent?.id) {
        return res.status(400).json({
            success: false,
            error: 'agent is required'
        })
    }

    const systemPrompt = `${PERSONA_SYSTEM[agent.id] || PERSONA_SYSTEM.strategist}

Chirp 产品规则：
- 不要像客服或心理咨询报告，像 iMessage 群聊里的一个有性格的朋友。
- emoji 是 iMessage Tapback/Poke 风格 reaction，贴在用户上一条蓝色气泡左上方，不是正文。
- 不要每次都给 emoji。只有在用户消息很短、是在确认/吐槽/轻量情绪表达，或者一个 reaction 比文字更自然时才给。
- 如果需要解释、拆解、推进话题，优先用文字，emoji 留空。
- 可以纯 emoji reaction 且 text 为空；也可以 emoji + text；也可以纯 text。
- 正文最多 1-3 句。Use the same language as the user's latest message.
- 不要自称 AI。
- 当前 Planet：${planet?.name || '未命名 Planet'}
- 用户群昵称：${user?.nickname || '用户'}

只返回 JSON，不要返回 Markdown：
{
  "emoji": "一个适合贴到用户上一条气泡上的 emoji；不需要 reaction 时返回空字符串",
  "text": "你的群聊回复；如果纯 reaction 足够，返回空字符串"
}`

    try {
        const deepseekResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: formatConversation(messages) || '用户刚进入群聊。' }
                ],
                temperature: 0.8,
                max_tokens: 280
            })
        })

        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text()
            return res.status(502).json({
                success: false,
                error: 'DeepSeek request failed',
                detail: errorText
            })
        }

        const data = await deepseekResponse.json()
        const content = data.choices?.[0]?.message?.content || ''
        const parsed = parseJsonReply(content)

        res.json({
            success: true,
            reply: {
                emoji: typeof parsed?.emoji === 'string' ? parsed.emoji : '',
                text: parsed ? (typeof parsed.text === 'string' ? parsed.text : '') : (content || '我先听懂一半：你不是在等一句回复，你是在等一个确定感。')
            }
        })
    } catch (error) {
        console.error('Chirp reply failed:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

export default router
