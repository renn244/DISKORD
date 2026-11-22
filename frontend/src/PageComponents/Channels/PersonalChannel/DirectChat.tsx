import { API_URL } from '@/util/apiUrl'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { userAuthContext } from '@/Context/AuthContext'
import { useSocketContext } from '@/Context/SocketContext'
import Message from '../ServerChannels/Message'
import { messageType } from '../ServerChannels/Messages'
import SendMessage from '../ServerChannels/SendMessage'
import UserAvatar from './UserAvatar'

type directMessageType = messageType & { receiver_id: number }

type chatFriendType = {
    id: number,
    name: string,
    username: string,
    usericons: string,
    is_friend: boolean
}

const DirectChat = () => {
    const { friendId } = useParams()
    const { user } = userAuthContext()
    const { socket, onlineUsers } = useSocketContext()
    const [friend, setFriend] = useState<chatFriendType | undefined>()
    const [messages, setMessages] = useState<directMessageType[]>([])
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(false)
    const [notFound, setNotFound] = useState<boolean>(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = useRef<boolean>(true)

    const getMessages = async (pageNumber: number) => {
        try {
            const res: Response = await fetch(`${API_URL}/api/message/GetDirectMessage/${friendId}?page=${pageNumber}`, {
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)

            setFriend(data.friend)
            setHasMore(data.hasMore)
            setPage(pageNumber)
            setMessages(prev => pageNumber === 1 ? data.messages : [...data.messages, ...prev])
        } catch (error) {
            console.log(error)
            setNotFound(true)
        }
    }

    useEffect(() => {
        setNotFound(false)
        setMessages([])
        scrollToBottom.current = true
        getMessages(1)
    }, [friendId])

    // skip it if we already have it (the sender gets it from the response and the socket)
    const addMessage = (message: directMessageType) => {
        scrollToBottom.current = true
        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message])
    }

    useEffect(() => {
        if(!socket) return

        const handleDirectMessage = (message: directMessageType) => {
            const inThisChat = [message.user_id, message.receiver_id].every(id => id === Number(friendId) || id === Number(user?.id))
            if(inThisChat) addMessage(message)
        }

        socket.on('directMessage', handleDirectMessage)
        return () => {
            socket.off('directMessage', handleDirectMessage)
        }
    }, [socket, friendId])

    useEffect(() => {
        if(scrollToBottom.current) bottomRef.current?.scrollIntoView()
    }, [messages])

    const handleLoadOlder = () => {
        scrollToBottom.current = false
        getMessages(page + 1)
    }

    if(notFound) return (
        <div className='flex flex-1 justify-center items-center bg-darkgray'>
            <h2 className='text-slate-300 text-xl font-semibold'>This user doesn't exist.</h2>
        </div>
    )

    if(!friend) return <div className='flex-1 bg-darkgray' />

    const online = onlineUsers.includes(friend.id.toString())

    return (
        <div className='flex flex-col flex-1 bg-darkgray min-w-0'>
            <div className='h-[48px] p-2 px-4 flex items-center gap-3 border-b-[1px] border-gray-900 shrink-0'>
                <UserAvatar usericons={friend.usericons} online={friend.is_friend ? online : undefined} size={24} />
                <h2 className='text-white font-bold text-base'>{friend.name}</h2>
                {friend.is_friend && <span className='text-slate-400 text-sm'>{online ? 'Online' : 'Offline'}</span>}
            </div>
            <div className='flex-1 flex flex-col min-h-0'>
                <div className='flex-1 overflow-auto pb-4'>
                    {hasMore ?
                        <div className='flex justify-center pt-4'>
                            <button onClick={handleLoadOlder}
                            className='text-sm text-slate-300 hover:text-white bg-highdarkgray px-3 py-1 rounded-md'>
                                Load older messages
                            </button>
                        </div>
                    :
                        <div className='px-4 pt-8 pb-2'>
                            <UserAvatar usericons={friend.usericons} size={80} />
                            <h1 className='text-white text-3xl font-bold mt-2'>{friend.name}</h1>
                            <h3 className='text-slate-300 text-xl mb-2'>{friend.username}</h3>
                            <p className='text-slate-400'>This is the beginning of your direct message history with <b>{friend.name}</b>.</p>
                        </div>
                    }
                    {messages.map((message) => (
                        <Message key={message.id} message={message} />
                    ))}
                    <div ref={bottomRef} />
                </div>
                <div className='min-h-[68px] px-4 shrink-0'>
                    {friend.is_friend ?
                        <SendMessage url={`${API_URL}/api/message/AddDirectMessage/${friend.id}`} onSent={addMessage} />
                    :
                        <div className='bg-lightgray rounded-md py-3 px-4 text-slate-400 text-sm'>
                            You can only message friends. Add {friend.name} as a friend to keep chatting.
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default DirectChat
