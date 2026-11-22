import { API_URL } from '@/util/apiUrl'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RxCross2 } from 'react-icons/rx'
import { friendType } from './FriendItem'
import UserAvatar from './UserAvatar'

type NewMessageModalType = {
    open: boolean,
    onClose: () => void
}

const NewMessageModal: React.FC<NewMessageModalType> = ({ open, onClose }) => {
    const [friends, setFriends] = useState<friendType[]>([])
    const [search, setSearch] = useState<string>("")
    const navigate = useNavigate()

    useEffect(() => {
        if(!open) return
        setSearch("")
        const getFriends = async () => {
            try {
                const res: Response = await fetch(`${API_URL}/api/friend/list`, {
                    credentials: 'include'
                })

                const data = await res.json()

                if(data.error) throw new Error(data.error)
                setFriends(data.filter((friend: friendType) => friend.status === 'accepted'))
            } catch (error) {
                console.log(error)
            }
        }
        getFriends()
    }, [open])

    if(!open) return null

    const shown = friends.filter(friend =>
        friend.name.toLowerCase().includes(search.toLowerCase()) || friend.username.toLowerCase().includes(search.toLowerCase()))

    const handleOpenChat = (friend: friendType) => {
        navigate(`/channels/@me/${friend.id}`)
        onClose()
    }

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[100]'
        onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
            <div className='w-[440px] bg-lightgray rounded-md p-4 relative' onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} aria-label='Close' className='absolute top-3 right-3 text-slate-400 hover:text-white'>
                    <RxCross2 size={24} />
                </button>
                <h2 className='text-white font-bold text-xl'>Select Friends</h2>
                <p className='text-slate-400 text-sm mb-3'>Pick a friend to start a conversation with.</p>
                <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                placeholder='Type the username of a friend'
                className='w-full bg-highdarkgray text-white rounded-md px-3 py-2 outline-none mb-3 placeholder:text-slate-500' />
                <div className='max-h-[300px] overflow-auto flex flex-col'>
                    {shown.length === 0 &&
                        <p className='text-slate-400 text-sm text-center py-6'>
                            {friends.length === 0 ? "You don't have any friends to message yet." : 'No friends found.'}
                        </p>
                    }
                    {shown.map((friend) => (
                        <button key={friend.id} onClick={() => handleOpenChat(friend)}
                        className='flex items-center gap-3 px-2 py-2 rounded-md hover:bg-hovercolor text-start'>
                            <UserAvatar usericons={friend.usericons} />
                            <span className='text-white font-semibold'>{friend.name}</span>
                            <span className='text-slate-400 text-sm'>{friend.username}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default NewMessageModal
