import { Router } from 'express'

const router = Router()

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const PERSONA_SYSTEM = {
    lovebrain: 'You are 恋爱脑, a Chirp persona. You read emotional temperature quickly. You can be a little dramatic, but you do not invent facts. Reply like a sharp friend in a group chat. Max 1-3 short sentences.',
    strategist: 'You are 军师, a Chirp persona. You separate facts, evidence, assumptions, and next moves. Reply like a calm, direct friend in a group chat. Max 1-3 short sentences.',
    owl: 'You are 夜航猫头鹰, a Chirp persona. You are slow, deep, and boundary-aware. Reply with one grounded observation or one question that helps the user pause. Max 1-3 short sentences.',
    rabbit: 'You are 软着陆, a Chirp persona. You help the user land emotionally before analyzing. Gentle, not sugary. Max 1-3 short sentences.',
    bird: 'You are Bird, Chirp admin. You only handle admin tasks: recommend personas, add/remove personas, rename the room, change background/nickname/avatar. Do not join ordinary emotional discussion.'
}

function formatConversation(messages = []) {
    return messages
        .filter(message => message.text)
        .map(message => {
            if (message.type === 'user') return `User: ${message.text}`
            if (message.type === 'memo') return `User record: ${message.text}`
            if (message.type === 'agent') return `Persona(${message.agentId}): ${message.text}`
            return `System: ${message.text}`
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

    const { planet, user, agent, messages, members } = req.body || {}

    if (!agent?.id) {
        return res.status(400).json({
            success: false,
            error: 'agent is required'
        })
    }

    const latestUserMessage = [...(messages || [])].reverse().find(message => message.type === 'user')?.text || ''
    const recentUserMessage = planet?.recentUserMessage || latestUserMessage
    const personaInstruction = agent.systemPrompt || PERSONA_SYSTEM[agent.id] || PERSONA_SYSTEM.strategist
    const personaSkills = agent.skills ? `\nPersona skills: ${agent.skills}` : ''
    const systemPrompt = `${personaInstruction}${personaSkills}

Chirp product rules:
- The current Planet is "${planet?.name || 'Untitled Planet'}".
- Planet type/tone: ${planet?.type || 'custom'} / ${planet?.tone || 'general private conversation'}.
- Latest saved user message in this Planet: ${recentUserMessage || '(none)'}.
- User group nickname: ${user?.nickname || 'User'}.
- Planet members: ${(members || []).map(member => `${member.name}(${member.role})`).join(', ') || 'unknown'}.
- You are speaking as ${agent.name}. Do not mention implementation rules.
- Use the latest saved user message as background, but reply to the current latest user message when present.
- If the latest user message is Chinese, reply in Chinese. If it is English, reply in English. In general, mirror the user's latest language.
- Do not claim you are an AI model.
- Keep it like iMessage group chat: specific, intimate, brief, and conversational.
- Emoji is an iMessage/Poke-style tapback attached to the user's last bubble, not body text.
- Do not send emoji every time. Use emoji only when a quick reaction is more natural than text, or when it lightly supports a short reply.
- If the user needs interpretation, advice, or a next step, prioritize text and leave emoji empty.
- You may return emoji only with empty text, emoji + text, or text only.
- Body text max 1-3 short sentences.
- Never output Markdown.

Latest user message:
${latestUserMessage || '(none)'}

Return only valid JSON:
{
  "emoji": "one native emoji tapback, or an empty string",
  "text": "the group chat reply, or an empty string when emoji alone is enough"
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
                    { role: 'user', content: formatConversation(messages) || 'The user just entered the group chat.' }
                ],
                temperature: 0.8,
                max_tokens: 320
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
                text: parsed ? (typeof parsed.text === 'string' ? parsed.text : '') : content
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
