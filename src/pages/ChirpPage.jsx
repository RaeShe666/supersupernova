import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BIRD,
  CHIRP_PLANETS,
  DeerAvatar,
  PERSONA_POOL,
  PersonaAvatar,
  UserAvatar,
  formatMessageTime,
  getPersonasForPlanet,
  getPlanetRecent,
  writePlanetActivity
} from './chirpShared'
import './ChirpPage.css'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

const createInitialMessages = (planet) => {
  if (planet?.id === 'work') {
    return [
      { id: 'm1', type: 'memo', text: '明天要讲那个方案，我不想显得太用力，但又怕被忽略。', createdAt: Date.now() - 1000 * 60 * 5 },
      { id: 'm2', type: 'user', text: '@军师 这个会我应该怎么开头？', read: true, createdAt: Date.now() - 1000 * 60 * 4 },
      { id: 'm3', type: 'agent', agentId: 'strategist', text: '先别证明你很努力，先定义这场会要拿到什么结果。开头用一句话框住问题，再给两个选择，让他们进你的结构里。', createdAt: Date.now() - 1000 * 60 * 3 }
    ]
  }

  return [
    { id: 'm1', type: 'memo', text: '他今天只回了一个“嗯嗯”，我有点想装作没事，但其实一直在想。', createdAt: Date.now() - 1000 * 60 * 4 },
    { id: 'm2', type: 'user', text: '@恋爱脑 这是不是有点冷了？', read: true, tapbacks: ['🙂'], createdAt: Date.now() - 1000 * 60 * 3 },
    { id: 'm3', type: 'agent', agentId: 'lovebrain', text: '先别急。我知道你现在脑子已经开始跑八百集了，但一个“嗯嗯”不能直接判案，你要看他接下来有没有补动作。', createdAt: Date.now() - 1000 * 60 * 2 }
  ]
}

function ChirpPage({ planetConfig = CHIRP_PLANETS[0], onBack }) {
  const initialAgents = useMemo(() => getPersonasForPlanet(planetConfig), [planetConfig])
  const [planet, setPlanet] = useState({
    id: planetConfig.id,
    name: planetConfig.roomName,
    type: planetConfig.type,
    tone: planetConfig.tone,
    background: planetConfig.background
  })
  const [userProfile] = useState({ nickname: '鹿', avatar: 'S' })
  const [agents, setAgents] = useState(initialAgents)
  const [messages, setMessages] = useState(() => createInitialMessages(planetConfig))
  const [input, setInput] = useState('')
  const [activeAgentId, setActiveAgentId] = useState(initialAgents[0]?.id || null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState({ name: planetConfig.roomName })
  const [typingAgentId, setTypingAgentId] = useState(null)
  const [toast, setToast] = useState('')
  const timelineRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const refreshAgents = () => setAgents(getPersonasForPlanet(planetConfig))
    window.addEventListener('chirp:planet-personas-updated', refreshAgents)
    window.addEventListener('chirp:personas-updated', refreshAgents)
    return () => {
      window.removeEventListener('chirp:planet-personas-updated', refreshAgents)
      window.removeEventListener('chirp:personas-updated', refreshAgents)
    }
  }, [planetConfig])

  const bird = BIRD
  const visibleMembers = [{ id: 'user', name: userProfile.nickname, color: '#F5C878', avatar: UserAvatar }, bird, ...agents]
  const memberCount = visibleMembers.length
  const RoomAvatar = planetConfig.avatar || DeerAvatar

  const mentionItems = useMemo(() => [
    ...agents.map(agent => ({
      id: agent.id,
      label: agent.name,
      insertText: `@${agent.name} `,
      role: agent.role,
      color: agent.color,
      avatar: agent.avatar
    })),
    { id: 'bird', label: 'Bird', insertText: '@Bird ', role: 'Admin', color: bird.color, avatar: bird.avatar },
    { id: 'all', label: 'all', insertText: '@all ', role: 'Replies in order', color: '#ECECEF', avatar: null }
  ], [agents, bird])

  const filteredMentionItems = useMemo(() => {
    const normalizedQuery = mentionQuery.trim().toLowerCase()
    if (!normalizedQuery) return mentionItems
    return mentionItems.filter(item => (
      item.label.toLowerCase().includes(normalizedQuery)
      || item.role.toLowerCase().includes(normalizedQuery)
    ))
  }, [mentionItems, mentionQuery])

  const pushMessage = (message) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, createdAt: Date.now(), ...message }])
    requestAnimationFrame(() => {
      if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    })
  }

  const rememberUserMessage = (text, timestamp = Date.now()) => {
    writePlanetActivity(planet.id, text, timestamp)
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
    if (/^@all\b/i.test(text)) return 'all'
    if (/^@bird\b/i.test(text) || /^@小鸟\b/.test(text)) return 'bird'
    const mentionedAgent = agents.find(agent => text.startsWith(`@${agent.name}`))
    return mentionedAgent?.id || null
  }

  const findMentionToken = (value) => {
    const match = value.match(/(^|\s)@([^\s@]*)$/)
    if (!match) return null
    return { start: match.index + match[1].length, query: match[2] || '' }
  }

  const updateInput = (value) => {
    setInput(value)
    const mentionToken = findMentionToken(value)
    if (!mentionToken) {
      setMentionOpen(false)
      setMentionQuery('')
      setMentionIndex(0)
      return
    }
    setMentionOpen(true)
    setMentionQuery(mentionToken.query)
    setMentionIndex(0)
  }

  const insertMention = (item) => {
    const mentionToken = findMentionToken(input)
    if (!mentionToken) return
    setInput(`${input.slice(0, mentionToken.start)}${item.insertText}`)
    setMentionOpen(false)
    setMentionQuery('')
    setMentionIndex(0)
  }

  const handleUploadFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('Image is larger than 8MB and cannot be uploaded.')
      return
    }
    showToast('Image upload is not available yet.')
  }

  const requestAgentReply = async (agent, currentMessages) => {
    try {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const apiBase = import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:8080' : '')
      const recent = getPlanetRecent(planet)
      const response = await fetch(`${apiBase}/api/chirp/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planet: { ...planet, recentUserMessage: recent.rawText || recent.text, recentUserMessageAt: recent.timestamp },
          user: userProfile,
          agent: {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            systemPrompt: agent.systemPrompt,
            skills: agent.skills
          },
          members: agents.map(({ id, name, role }) => ({ id, name, role })),
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
      console.warn('Chirp reply failed:', error)
      return null
    }
  }

  const replyAsAgent = async (agent, overrideText, conversationOverride = null) => {
    let typingVisible = false
    const typingTimer = overrideText ? null : window.setTimeout(() => {
      typingVisible = true
      setTypingAgentId(agent.id)
    }, 2000)

    const modelReply = overrideText ? null : await requestAgentReply(agent, conversationOverride || messages)
    if (typingTimer) window.clearTimeout(typingTimer)

    const replyText = overrideText || modelReply?.text
    const tapback = modelReply?.emoji || null

    if (!replyText && tapback) {
      setTypingAgentId(null)
      addTapbackToLastUserMessage(tapback)
      return
    }

    if (!replyText) {
      setTypingAgentId(null)
      showToast('AI connection failed. Please try again.')
      return
    }

    if (typingVisible) await sleep(380)
    setTypingAgentId(null)
    addTapbackToLastUserMessage(tapback)
    pushMessage({ type: 'agent', agentId: agent.id, text: replyText })
  }

  const addPersonaFromCommunity = () => {
    const candidate = PERSONA_POOL.find(persona => !agents.some(agent => agent.id === persona.id))
    if (!candidate) {
      showToast('No more mock personas available.')
      return null
    }
    setAgents(prev => [...prev, candidate])
    showToast(`${candidate.name} joined the chat.`)
    return candidate
  }

  const handleBirdAdmin = async (text) => {
    const adminIntent = /(推荐|找.*persona|人格|拉|加入|踢|删除|移除|改名|名称|背景|昵称|头像|member|add|remove|rename)/i.test(text)
    if (!adminIntent) {
      await replyAsAgent(bird, 'I only handle admin tasks here. Ask me to find, add, remove, rename, or adjust the room.')
      return
    }
    if (/(推荐|找.*persona|人格)/i.test(text)) {
      const candidate = PERSONA_POOL.find(persona => !agents.some(agent => agent.id === persona.id))
      await replyAsAgent(bird, candidate ? `This room has its core voices, but it could use ${candidate.name}: ${candidate.role}.` : 'All mock personas are already in this room.')
      return
    }
    if (/(拉|加入|add)/i.test(text)) {
      const added = addPersonaFromCommunity()
      await replyAsAgent(bird, added ? `Done. I added ${added.name}.` : 'No mock persona is available right now.')
      return
    }
    if (/(踢|删除|移除|remove)/i.test(text)) {
      const removed = agents[agents.length - 1]
      if (!removed) return
      setAgents(prev => prev.slice(0, -1))
      if (activeAgentId === removed.id) setActiveAgentId(null)
      await replyAsAgent(bird, `Done. I removed ${removed.name}.`)
      return
    }
    if (/(改名|名称|rename)/i.test(text)) {
      setPlanet(prev => ({ ...prev, name: 'Soft Reset' }))
      await replyAsAgent(bird, 'Done. I renamed this Planet.')
      return
    }
    if (/背景/i.test(text)) {
      setPlanet(prev => ({ ...prev, background: '#FFF8E7' }))
      await replyAsAgent(bird, 'Done. I warmed up the background.')
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const mention = resolveMention(text)
    const timestamp = Date.now()
    setInput('')
    setMentionOpen(false)
    setMentionQuery('')
    setMentionIndex(0)
    rememberUserMessage(text, timestamp)

    if (!mention && !activeAgentId) {
      pushMessage({ type: 'memo', text, createdAt: timestamp })
      return
    }

    const userMessage = { type: 'user', text, read: true, createdAt: timestamp }
    pushMessage(userMessage)
    const conversationWithUserMessage = [...messages, userMessage]

    if (mention === 'all') {
      setActiveAgentId(null)
      for (const agent of agents) {
        await replyAsAgent(agent, null, conversationWithUserMessage)
        await sleep(850)
      }
      return
    }

    if (mention === 'bird') {
      setActiveAgentId(null)
      await handleBirdAdmin(text)
      return
    }

    const nextAgent = agents.find(agent => agent.id === mention) || agents.find(agent => agent.id === activeAgentId)
    if (!nextAgent) return
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
  }

  const removeAgent = (agentId) => {
    const removed = agents.find(agent => agent.id === agentId)
    setAgents(prev => prev.filter(agent => agent.id !== agentId))
    if (activeAgentId === removed?.id) setActiveAgentId(null)
  }

  const openSettings = () => {
    setSettingsDraft({ name: planet.name })
    setSettingsOpen(true)
  }

  const closeSettings = () => {
    setSettingsDraft({ name: planet.name })
    setSettingsOpen(false)
  }

  const saveSettings = () => {
    setPlanet(prev => ({ ...prev, name: settingsDraft.name.trim() || 'Untitled Planet' }))
    setSettingsOpen(false)
  }

  return (
    <div className="chirp-page" style={{ '--chirp-paper': planet.background }}>
      <div className="chirp-shell">
        <header className="chirp-topbar">
          <button className="chirp-back" aria-label="Back" onClick={onBack}>
            <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button className="chirp-group-title" onClick={openSettings}><span>{planet.name} ({memberCount})</span></button>
          <button className="chirp-more" onClick={openSettings} aria-label="Group settings">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
          </button>
        </header>

        <main className={`chirp-main ${settingsOpen ? 'settings-open' : ''}`}>
          <section className="chirp-chat">
            <div className="chirp-timeline" ref={timelineRef}>
              <div className="chirp-date">Today {formatMessageTime(new Date())}</div>
              {messages.map(message => <MessageBubble key={message.id} message={message} agents={agents} bird={bird} />)}
              {typingAgentId && <TypingBubble agent={[...agents, bird].find(agent => agent.id === typingAgentId)} />}
            </div>

            <footer className="chirp-composer">
              <div className="chirp-input-row">
                <button className="chirp-upload-button" type="button" aria-label="Upload image" onClick={() => fileInputRef.current?.click()}>+</button>
                <input ref={fileInputRef} className="chirp-file-input" type="file" accept="image/*" onChange={handleUploadFile} />
                <div className="chirp-input-shell">
                  <textarea
                    rows="1"
                    value={input}
                    onChange={(event) => updateInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        if (mentionOpen && filteredMentionItems.length > 0) {
                          event.preventDefault()
                          insertMention(filteredMentionItems[mentionIndex])
                          return
                        }
                        event.preventDefault()
                        handleSend()
                      }
                      if (mentionOpen && filteredMentionItems.length > 0 && event.key === 'ArrowDown') {
                        event.preventDefault()
                        setMentionIndex(index => (index + 1) % filteredMentionItems.length)
                      }
                      if (mentionOpen && filteredMentionItems.length > 0 && event.key === 'ArrowUp') {
                        event.preventDefault()
                        setMentionIndex(index => (index - 1 + filteredMentionItems.length) % filteredMentionItems.length)
                      }
                      if (mentionOpen && event.key === 'Escape') {
                        event.preventDefault()
                        setMentionOpen(false)
                      }
                    }}
                    placeholder="@ to start a conversation"
                  />
                </div>
                <button className="chirp-send" onClick={handleSend} aria-label="Send">
                  <svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                </button>
                {mentionOpen && filteredMentionItems.length > 0 && (
                  <div className="chirp-mention-menu">
                    {filteredMentionItems.map((item, index) => (
                      <button
                        key={item.id}
                        className={index === mentionIndex ? 'is-active' : ''}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          insertMention(item)
                        }}
                      >
                        <span className="chirp-mention-avatar" style={{ backgroundColor: item.color }}>
                          {item.avatar ? <PersonaAvatar persona={item} /> : 'all'}
                        </span>
                        <span><strong>{item.label}</strong><small>{item.role}</small></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </footer>
          </section>

          {settingsOpen && <button className="chirp-settings-scrim" type="button" aria-label="Close settings" onClick={closeSettings} />}

          <aside className="chirp-settings">
            <div className="chirp-settings-head">
              <button onClick={closeSettings} aria-label="Close settings">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <section className="chirp-room-profile">
              <div className="chirp-room-profile-inner">
                <div className="chirp-room-avatar"><RoomAvatar /></div>
                <input className="chirp-room-name-input" value={settingsDraft.name} onChange={(event) => setSettingsDraft(prev => ({ ...prev, name: event.target.value }))} aria-label="Group name" />
              </div>
            </section>

            <div className="chirp-settings-body">
              <section>
                <h3>Members</h3>
                <div className="chirp-members-grid">
                  {visibleMembers.map(member => (
                    <div className="chirp-member" key={member.id}>
                      <div className="chirp-member-avatar" style={{ backgroundColor: member.color }}><PersonaAvatar persona={member} /></div>
                      <span>{member.name}</span>
                    </div>
                  ))}
                  <button className="chirp-member-action" onClick={addPersonaFromCommunity} aria-label="Add member"><b>+</b></button>
                  <button className="chirp-member-action" onClick={() => agents[agents.length - 1] && removeAgent(agents[agents.length - 1].id)} aria-label="Remove member"><b>-</b></button>
                </div>
              </section>

              <section>
                <h3>Admin</h3>
                <div className="chirp-admin-card">
                  <div className="chirp-admin-avatar"><BIRD.avatar /></div>
                  <div><strong>Bird</strong><p>Only replies when mentioned for admin tasks</p></div>
                </div>
              </section>

              <section>
                <h3>@all Order</h3>
                <div className="chirp-agent-list">
                  {agents.map((agent, index) => (
                    <div className="chirp-agent-row" key={agent.id}>
                      <div className="chirp-agent-avatar" style={{ backgroundColor: agent.color }}><PersonaAvatar persona={agent} /></div>
                      <div><strong>{index + 1}. {agent.name}</strong><span>{agent.role}</span></div>
                      <div className="chirp-agent-actions">
                        <button onClick={() => moveAgent(agent.id, -1)}>↑</button>
                        <button onClick={() => moveAgent(agent.id, 1)}>↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="chirp-settings-footer"><button type="button" onClick={saveSettings}>Save</button></div>
          </aside>
        </main>
        {toast && <div className="chirp-toast">{toast}</div>}
      </div>
    </div>
  )
}

function MessageBubble({ message, agents, bird }) {
  if (message.type === 'system') return null
  if (message.type === 'memo') return <div className="chirp-message memo"><div className="chirp-bubble">{message.text}</div></div>
  if (message.type === 'user') {
    return (
      <div className="chirp-message user">
        <div className="chirp-user-message-body">
          <div className="chirp-bubble">{message.text}</div>
          {!!message.tapbacks?.length && <div className="chirp-user-tapbacks">{message.tapbacks.map((tapback, index) => <span key={`${tapback}-${index}`}>{tapback}</span>)}</div>}
          {message.read && <span className="chirp-read-receipt">{formatMessageTime(new Date(message.createdAt))} Read</span>}
        </div>
        <div className="chirp-user-side-avatar"><UserAvatar /></div>
      </div>
    )
  }

  const agent = [...agents, bird].find(item => item.id === message.agentId)
  if (!agent) return null
  return (
    <div className="chirp-message agent">
      <div className="chirp-agent-side-avatar" style={{ backgroundColor: agent.color }}><PersonaAvatar persona={agent} /></div>
      <div className="chirp-agent-message-body"><span className="chirp-agent-name">{agent.name}</span><div className="chirp-bubble">{message.text}</div></div>
    </div>
  )
}

function TypingBubble({ agent }) {
  if (!agent) return null
  return (
    <div className="chirp-message agent">
      <div className="chirp-agent-side-avatar" style={{ backgroundColor: agent.color }}><PersonaAvatar persona={agent} /></div>
      <div className="chirp-agent-message-body"><div className="chirp-bubble typing"><i></i><i></i><i></i></div></div>
    </div>
  )
}

export default ChirpPage
