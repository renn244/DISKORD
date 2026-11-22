import { API_URL } from '@/util/apiUrl'
import React, { useEffect, useRef, useState } from 'react'
import Message from './Message'
import { useSocketContext } from '@/Context/SocketContext'

type ComponentMessageType = {
  channelId: number
}

export type messageType = {
  id: number,
  channel_id: number,
  user_id: number,
  timestamp: string,
  content: string,
  name: string
}

const Messages: React.FC<ComponentMessageType> = ({ channelId }) => {
  const [messages, setMessages] = useState<messageType []>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = useRef<boolean>(true)

  const { socket } =  useSocketContext()


  useEffect(() => {
    if(!socket || !channelId) return

    const handleNewMessage = (message: messageType) => {
      if(message.channel_id !== channelId) return

      // skip it if we already have it
      scrollToBottom.current = true
      setMessages(prevmessages => prevmessages.some(m => m.id === message.id) ? prevmessages : [...prevmessages, message]);
    };

    socket.on('message', handleNewMessage)

    socket.emit('JoinRoom', channelId.toString())

    return () => {
        socket.off('message', handleNewMessage);
        socket.emit('LeaveRoom', channelId.toString())
    };
  }, [socket, channelId])


  const getMessages = async (pageNumber: number) => {
    try {
      const res:Response = await fetch(`${API_URL}/api/message/GetMessage/${channelId}`, {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({page: pageNumber}),
        credentials: 'include'
      })

      const data = await res.json()

      if(data.error) throw new Error(data.error)

      setHasMore(data.hasMore)
      setPage(pageNumber)
      // older pages go on top
      setMessages(prev => pageNumber === 1 ? data.messages : [...data.messages, ...prev])
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setMessages([])
    scrollToBottom.current = true
    getMessages(1)
  }, [channelId])

  useEffect(() => {
    if(scrollToBottom.current) bottomRef.current?.scrollIntoView()
  }, [messages])

  const handleLoadOlder = () => {
    scrollToBottom.current = false
    getMessages(page + 1)
  }

  return (
    <div>
      {hasMore &&
        <div className='flex justify-center pt-4'>
          <button onClick={handleLoadOlder}
          className='text-sm text-slate-300 hover:text-white bg-highdarkgray px-3 py-1 rounded-md'>
            Load older messages
          </button>
        </div>
      }
      {messages?.map((message) => {
        return <Message key={message.id} message={message} />
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default Messages
