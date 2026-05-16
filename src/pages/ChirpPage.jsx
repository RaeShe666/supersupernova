import { useMemo, useRef, useState } from 'react'
import './ChirpPage.css'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const DeerAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M20 24c-5-8-9-9-12-7" />
    <path d="M44 24c5-8 9-9 12-7" />
    <path d="M25 17c-2-7-6-9-10-9" />
    <path d="M39 17c2-7 6-9 10-9" />
    <ellipse cx="32" cy="36" rx="17" ry="15" />
    <circle cx="25" cy="34" r="2.5" />
    <circle cx="39" cy="34" r="2.5" />
    <path d="M29 42c2 2 4 2 6 0" />
  </svg>
)

const BirdAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <ellipse cx="31" cy="35" rx="18" ry="15" />
    <circle cx="25" cy="31" r="2.5" />
    <path d="M36 31l12-4-8 9z" />
    <path d="M20 48c6 4 17 4 24-1" />
  </svg>
)

const CatAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M18 25 15 10l13 9" />
    <path d="M46 25 49 10l-13 9" />
    <path d="M16 34c0-12 8-19 16-19s16 7 16 19-7 18-16 18-16-6-16-18z" />
    <circle cx="25" cy="34" r="2.5" />
    <circle cx="39" cy="34" r="2.5" />
    <path d="M32 39v4" />
    <path d="M25 45c4 3 10 3 14 0" />
  </svg>
)

const FoxAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M12 25 22 9l10 11L42 9l10 16c1 17-7 27-20 27S11 42 12 25z" />
    <circle cx="25" cy="32" r="2.5" />
    <circle cx="39" cy="32" r="2.5" />
    <path d="M28 40c2 2 6 2 8 0" />
  </svg>
)

const OwlAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M17 23 13 12l11 5c5-3 11-3 16 0l11-5-4 11c4 5 5 13 2 19-4 9-13 12-17 12S19 51 15 42c-3-6-2-14 2-19z" />
    <circle cx="25" cy="33" r="5" />
    <circle cx="39" cy="33" r="5" />
    <path d="M30 42h4" />
  </svg>
)

const RabbitAvatar = () => (
  <svg viewBox="0 0 64 64" className="chirp-avatar-svg" aria-hidden="true">
    <path d="M23 23C18 9 19 3 24 3s7 8 7 18" />
    <path d="M41 23C46 9 45 3 40 3s-7 8-7 18" />
    <ellipse cx="32" cy="39" rx="17" ry="15" />
    <circle cx="25" cy="37" r="2.5" />
    <circle cx="39" cy="37" r="2.5" />
    <path d="M28 45c2 2 6 2 8 0" />
  </svg>
)

const PERSONA_POOL = [
  {
    id: 'lovebrain',
    name: '恋爱脑',
    role: '情绪雷达',
    color: '#E8A29C',
    avatar: CatAvatar,
    emoji: '‼️',
    reply: '我先承认，我恋爱脑。但这次我不乱嗑：你在意的不是他回得慢，是他有没有把你放进他的节奏里。'
  },
  {
    id: 'strategist',
    name: '军师',
    role: '关系拆解',
    color: '#A8C5DA',
    avatar: FoxAvatar,
    emoji: '🧩',
    reply: '先别急着判死刑。把证据分三类：他说了什么、做了什么、你脑补了什么。现在第三类明显超标。'
  },
  {
    id: 'owl',
    name: '夜航猫头鹰',
    role: '边界观察',
    color: '#C4B0D9',
    avatar: OwlAvatar,
    emoji: '🌙',
    reply: '这个群缺一个慢一点的人。我会问你：这件事为什么让你这么快把自己放到低位？'
  },
  {
    id: 'rabbit',
    name: '软着陆',
    role: '温柔承接',
    color: '#A8C5A0',
    avatar: RabbitAvatar,
    emoji: '🫧',
    reply: '先不分析了。你现在像是被悬在半空，我先帮你落地：喝口水，告诉我你最怕的那个结果是什么。'
  }
]

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    type: 'system',
    text: '默认发送会作为 Planet 记录保存。Bird 在这里是管理员，不主动发言。'
  },
  {
    id: 'm2',
    type: 'memo',
    text: '他今天只回了一个「嗯嗯」，我有点想装作没事，但其实一直在想。'
  },
  {
    id: 'm3',
    type: 'user',
    text: '@恋爱脑 这是不是有点冷掉了？',
    tapbacks: ['‼️']
  },
  {
    id: 'm4',
    type: 'agent',
    agentId: 'lovebrain',
    text: '先别急。我知道你现在脑子已经开始跑八百集了，但一个「嗯嗯」不能直接判案。你要看他接下来有没有补动作。'
  }
]

function ChirpPage() {
  const [planet, setPlanet] = useState({ name: '恋爱观察室', background: '#FAFAF7' })
  const [userProfile, setUserProfile] = useState({ nickname: '鹿', avatar: 'S' })
  const [agents, setAgents] = useState(PERSONA_POOL.slice(0, 2))
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [pendingMention, setPendingMention] = useState(null)
  const [activeAgentId, setActiveAgentId] = useState('lovebrain')
  const [mentionOpen, setMentionOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [typingAgentId, setTypingAgentId] = useState(null)
  const [toast, setToast] = useState('')
  const timelineRef = useRef(null)

  const bird = useMemo(() => ({
    id: 'bird',
    name: 'Bird',
    role: '管理员',
    color: '#F5C878',
    avatar: BirdAvatar
  }), [])

  const activeAgent = agents.find(agent => agent.id === activeAgentId)
  const visibleMembers = [{ id: 'user', name: userProfile.nickname, color: '#F5C878', avatar: UserAvatar }, bird, ...agents]
  const mentionItems = [{ id: 'all', name: '@all', role: '按顺序串行回复' }, ...agents, bird]

  const pushMessage = (message) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ...message }])
    requestAnimationFrame(() => {
      if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    })
  }

  const addTapbackToLastUserMessage = (emoji) => {
    if (!emoji) return
    setMessages(prev => {
      const next = [...prev]
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].type === 'user') {
          const tapbacks = next[index].tapbacks || []
          next[index] = { ...next[index], tapbacks: [...tapbacks, emoji] }
          break
        }
      }
      return next
    })
  }

  const showToast = (text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }

  const resolveMention = (text) => {
    if (pendingMention) return pendingMention
    if (/^@all\b/i.test(text)) return 'all'
    if (/^@bird\b/i.test(text) || /^@小鸟\b/.test(text)) return 'bird'
    const mentionedAgent = agents.find(agent => text.startsWith(`@${agent.name}`))
    return mentionedAgent?.id || null
  }

  const replyAsAgent = async (agent, overrideText, conversationOverride = null) => {
    const deepseekReply = overrideText ? null : await requestAgentReply(agent, conversationOverride || messages)
    const replyText = overrideText || deepseekReply?.text

    if (!replyText) {
      showToast('AI 连接失败，请稍后再试。')
      pushMessage({
        type: 'system',
        text: `${agent.name} 暂时没有连上 AI。`
      })
      return
    }

    const tapback = deepseekReply?.emoji || (overrideText ? agent.emoji : null)

    setTypingAgentId(agent.id)
    await sleep(650 + Math.min(replyText.length * 18, 900))
    setTypingAgentId(null)
    addTapbackToLastUserMessage(tapback)
    pushMessage({
      type: 'agent',
      agentId: agent.id,
      text: replyText
    })
  }

  const addPersonaFromCommunity = () => {
    const candidate = PERSONA_POOL.find(persona => !agents.some(agent => agent.id === persona.id))
    if (!candidate) {
      showToast('Persona 社区暂时没有更多模拟候选。')
      return null
    }

    setAgents(prev => [...prev, candidate])
    pushMessage({ type: 'system', text: `${candidate.name} 加入了 ${planet.name}` })
    showToast(`${candidate.name} 已加入群聊。`)
    return candidate
  }

  const requestAgentReply = async (agent, currentMessages) => {
    try {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const apiBase = import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:8080' : '')
      const response = await fetch(`${apiBase}/api/chirp/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planet: {
            name: planet.name,
            background: planet.background
          },
          user: userProfile,
          agent: {
            id: agent.id,
            name: agent.name,
            role: agent.role
          },
          messages: currentMessages.slice(-12).map(message => ({
            type: message.type,
            text: message.text,
            agentId: message.agentId
          }))
        })
      })

      if (!response.ok) return null
      const result = await response.json()
      if (!result?.success) return null
      return result.reply
    } catch (error) {
      console.warn('Chirp DeepSeek reply failed:', error)
      return null
    }
  }

  const handleBirdAdmin = async (text) => {
    const adminIntent = /(推荐|找|拉|加|踢|删|移除|改名|名称|背景|昵称|头像|persona|人格|成员)/.test(text)

    if (!adminIntent) {
      await replyAsAgent(bird, '我在 Planet 里只做管理员。你要我拉人、踢人、改名、换背景，或者帮你找 persona，再叫我。')
      return
    }

    if (/(推荐|找|persona|人格)/.test(text)) {
      const candidate = PERSONA_POOL.find(persona => !agents.some(agent => agent.id === persona.id))
      await replyAsAgent(
        bird,
        candidate
          ? `我看了一下最近的聊天，这个群现在有情绪和拆解，但少一个“慢下来问边界”的角色。我推荐 ${candidate.name}。你确认后我可以把 TA 拉进来。`
          : '这批模拟 Persona 都在群里了。后面接真实社区搜索时，这里会继续给你补候选。'
      )
      return
    }

    if (/(拉|加)/.test(text)) {
      const added = addPersonaFromCommunity()
      await replyAsAgent(bird, added ? `成了，我把 ${added.name} 拉进群聊了。` : '暂时没有可加入的模拟候选。')
      return
    }

    if (/(踢|删|移除)/.test(text)) {
      const removed = agents[agents.length - 1]
      if (!removed) return
      setAgents(prev => prev.slice(0, -1))
      if (activeAgentId === removed.id) setActiveAgentId(null)
      pushMessage({ type: 'system', text: `${removed.name} 已离开 ${planet.name}` })
      await replyAsAgent(bird, `成了，我把 ${removed.name} 请出去了。`)
      return
    }

    if (/(改名|名称)/.test(text)) {
      setPlanet(prev => ({ ...prev, name: '喝水侠原地退役' }))
      await replyAsAgent(bird, '成了，Planet 名字改好了。')
      return
    }

    if (/背景/.test(text)) {
      setPlanet(prev => ({ ...prev, background: '#FFF8E7' }))
      await replyAsAgent(bird, '换成暖一点的背景了。')
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const mention = resolveMention(text)
    setInput('')
    setPendingMention(null)
    setMentionOpen(false)

    if (!mention && !activeAgentId) {
      pushMessage({ type: 'memo', text })
      return
    }

    const userMessage = { type: 'user', text }
    pushMessage(userMessage)
    const conversationWithUserMessage = [...messages, userMessage]

    if (mention === 'all') {
      setActiveAgentId(null)
      for (const agent of agents) {
        await replyAsAgent(agent, null, conversationWithUserMessage)
        await sleep(850)
      }
      pushMessage({ type: 'system', text: '@all 结束，群聊回到安静状态。' })
      return
    }

    if (mention === 'bird') {
      setActiveAgentId(null)
      await handleBirdAdmin(text)
      return
    }

    const nextAgent = agents.find(agent => agent.id === mention) || agents.find(agent => agent.id === activeAgentId)
    if (!nextAgent) return

    if (mention && activeAgentId && activeAgentId !== mention) {
      const previous = agents.find(agent => agent.id === activeAgentId)
      if (previous) pushMessage({ type: 'system', text: `${previous.name} 闭麦，${nextAgent.name} 开麦。` })
    }

    setActiveAgentId(nextAgent.id)
    await replyAsAgent(nextAgent, null, conversationWithUserMessage)
  }

  const moveAgent = (agentId, direction) => {
    const index = agents.findIndex(agent => agent.id === agentId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= agents.length) return
    const next = [...agents]
    ;[next[index], next[target]] = [next[target], next[index]]
    setAgents(next)
    pushMessage({ type: 'system', text: '@all 发言顺序已调整。' })
  }

  const removeAgent = (agentId) => {
    const removed = agents.find(agent => agent.id === agentId)
    setAgents(prev => prev.filter(agent => agent.id !== agentId))
    if (activeAgentId === agentId) setActiveAgentId(null)
    if (removed) pushMessage({ type: 'system', text: `${removed.name} 已离开 ${planet.name}` })
  }

  const pickMention = (id) => {
    setPendingMention(id)
    setMentionOpen(false)
  }

  const updatePlanetName = (value) => {
    setPlanet(prev => ({ ...prev, name: value || '未命名 Planet' }))
  }

  const updateBackground = (value) => {
    setPlanet(prev => ({ ...prev, background: value }))
  }

  return (
    <div className="chirp-page" style={{ '--chirp-paper': planet.background }}>
      <div className="chirp-shell">
        <header className="chirp-topbar">
          <button className="chirp-back" aria-label="Back">
            <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <button className="chirp-group-title" onClick={() => setSettingsOpen(true)}>
            <div className="chirp-member-stack">
              {visibleMembers.slice(0, 5).map(member => (
                <span className="chirp-mini-avatar" style={{ backgroundColor: member.color }} key={member.id}>
                  <member.avatar />
                </span>
              ))}
            </div>
            <span>{planet.name}</span>
            <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <button className="chirp-more" onClick={() => setSettingsOpen(true)} aria-label="Group settings">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
          </button>
        </header>

        <main className={`chirp-main ${settingsOpen ? 'settings-open' : ''}`}>
          <section className="chirp-chat">
            <div className="chirp-timeline" ref={timelineRef}>
              <div className="chirp-date">今天 10:18</div>

              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  agents={agents}
                  bird={bird}
                />
              ))}

              {typingAgentId && (
                <TypingBubble agent={[...agents, bird].find(agent => agent.id === typingAgentId)} />
              )}
            </div>

            <footer className="chirp-composer">
              <div className="chirp-active-line">
                {activeAgent && <span>{activeAgent.name} 正在开麦</span>}
                <em>{activeAgent ? '继续发送会默认由 TA 回复；@ 其他人会切换发言权。' : '不 @ 任何人时，这条会作为 Planet 记录保存。'}</em>
              </div>

              <div className="chirp-input-row">
                <button className="chirp-at-button" onClick={() => setMentionOpen(open => !open)}>@</button>

                {mentionOpen && (
                  <div className="chirp-mention-menu">
                    {mentionItems.map(item => (
                      <button key={item.id} onClick={() => pickMention(item.id)}>
                        <span className="chirp-mention-avatar" style={{ backgroundColor: item.color || '#ECECEF' }}>
                          {item.avatar ? <item.avatar /> : 'all'}
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                        <small>{item.role}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="chirp-input-shell">
                  {pendingMention && (
                    <span className="chirp-mention-chip">@{pendingMention === 'all' ? 'all' : pendingMention === 'bird' ? 'Bird' : agents.find(agent => agent.id === pendingMention)?.name}</span>
                  )}
                  <textarea
                    rows="1"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="说点什么..."
                  />
                  <button className="chirp-send" onClick={handleSend} aria-label="Send">
                    <svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                  </button>
                </div>
              </div>
            </footer>
          </section>

          <aside className="chirp-settings">
            <div className="chirp-settings-head">
              <strong>聊天信息</strong>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </div>

            <div className="chirp-settings-body">
              <section>
                <h3>成员名称</h3>
                <div className="chirp-members-grid">
                  {visibleMembers.map(member => (
                    <div className="chirp-member" key={member.id}>
                      <div className="chirp-member-avatar" style={{ backgroundColor: member.color }}>
                        <member.avatar />
                      </div>
                      <span>{member.name}</span>
                    </div>
                  ))}
                  <button className="chirp-member-action" onClick={addPersonaFromCommunity}>
                    <b>+</b>
                    <span>拉人</span>
                  </button>
                  <button className="chirp-member-action" onClick={() => agents[agents.length - 1] && removeAgent(agents[agents.length - 1].id)}>
                    <b>-</b>
                    <span>踢人</span>
                  </button>
                </div>
              </section>

              <section>
                <h3>管理员</h3>
                <div className="chirp-admin-card">
                  <div className="chirp-admin-avatar"><BirdAvatar /></div>
                  <div>
                    <strong>Bird</strong>
                    <p>只有被 @ 并提出管理需求时回复</p>
                  </div>
                </div>
              </section>

              <section>
                <h3>Planet 设置</h3>
                <div className="chirp-settings-card">
                  <label>
                    <span>Planet 名称</span>
                    <input value={planet.name} onChange={(event) => updatePlanetName(event.target.value)} />
                  </label>
                  <label>
                    <span>我的群昵称</span>
                    <input value={userProfile.nickname} onChange={(event) => setUserProfile(prev => ({ ...prev, nickname: event.target.value || '我' }))} />
                  </label>
                  <label>
                    <span>头像代号</span>
                    <input value={userProfile.avatar} onChange={(event) => setUserProfile(prev => ({ ...prev, avatar: event.target.value || '我' }))} />
                  </label>
                  <div className="chirp-bg-row">
                    {['#FAFAF7', '#FFF8E7', '#F4F7FA', '#F7F4FA'].map(color => (
                      <button
                        key={color}
                        style={{ backgroundColor: color }}
                        onClick={() => updateBackground(color)}
                        aria-label={`Set background ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h3>@all 发言顺序</h3>
                <div className="chirp-agent-list">
                  {agents.map((agent, index) => (
                    <div className="chirp-agent-row" key={agent.id}>
                      <div className="chirp-agent-avatar" style={{ backgroundColor: agent.color }}><agent.avatar /></div>
                      <div>
                        <strong>{index + 1}. {agent.name}</strong>
                        <span>{agent.role}</span>
                      </div>
                      <div className="chirp-agent-actions">
                        <button onClick={() => moveAgent(agent.id, -1)}>↑</button>
                        <button onClick={() => moveAgent(agent.id, 1)}>↓</button>
                        <button onClick={() => removeAgent(agent.id)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </main>

        {toast && <div className="chirp-toast">{toast}</div>}
      </div>
    </div>
  )
}

function MessageBubble({ message, agents, bird }) {
  if (message.type === 'system') {
    return <div className="chirp-system-note">{message.text}</div>
  }

  if (message.type === 'memo') {
    return (
      <div className="chirp-message memo">
        <div className="chirp-bubble">{message.text}</div>
      </div>
    )
  }

  if (message.type === 'user') {
    return (
      <div className="chirp-message user">
        <div className="chirp-bubble">{message.text}</div>
        {!!message.tapbacks?.length && (
          <div className="chirp-user-tapbacks">
            {message.tapbacks.map((tapback, index) => (
              <span key={`${tapback}-${index}`}>{tapback}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const agent = [...agents, bird].find(item => item.id === message.agentId)
  if (!agent) return null

  return (
    <div className="chirp-message agent">
      <div className="chirp-agent-side-avatar" style={{ backgroundColor: agent.color }}><agent.avatar /></div>
      <div className="chirp-agent-message-body">
        <span className="chirp-agent-name">{agent.name}</span>
        <div className="chirp-bubble">{message.text}</div>
      </div>
    </div>
  )
}

function UserAvatar() {
  return (
    <span className="chirp-user-photo" aria-label="User avatar">
      S
    </span>
  )
}

function TypingBubble({ agent }) {
  if (!agent) return null

  return (
    <div className="chirp-message agent">
      <div className="chirp-agent-side-avatar" style={{ backgroundColor: agent.color }}><agent.avatar /></div>
      <div className="chirp-agent-message-body">
        <span className="chirp-agent-name">{agent.name}</span>
        <div className="chirp-bubble typing">
          <i></i><i></i><i></i>
        </div>
      </div>
    </div>
  )
}

export default ChirpPage
