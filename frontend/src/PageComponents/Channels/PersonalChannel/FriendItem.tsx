import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCheck } from 'react-icons/fa6'
import { RxCross2 } from 'react-icons/rx'
import { BsChatFill } from 'react-icons/bs'
import { MdBlock, MdPersonRemove } from 'react-icons/md'
import UserAvatar from './UserAvatar'

export type friendType = {
    id: number,
    name: string,
    username: string,
    usericons: string,
    status: 'pending' | 'accepted' | 'blocked',
    direction: 'incoming' | 'outgoing'
}

type FriendItemType = {
    friend: friendType,
    online: boolean,
    handleAction: (action: string, friend: friendType) => void
}

const ActionButton = ({ label, onClick, className, children }: any) => {
    return (
        <button onClick={onClick} title={label} aria-label={label}
        className={`size-9 rounded-full bg-highdarkgray flex justify-center items-center text-slate-300 ${className}`}>
            {children}
        </button>
    )
}

const FriendItem: React.FC<FriendItemType> = ({ friend, online, handleAction }) => {
    const navigate = useNavigate()

    const subtext = friend.status === 'blocked' ? 'Blocked'
        : friend.status === 'pending' ? (friend.direction === 'incoming' ? 'Incoming Friend Request' : 'Outgoing Friend Request')
        : online ? 'Online' : 'Offline'

    return (
        <div className='group flex items-center h-[62px] px-2 mx-[-8px] rounded-md border-t-[1px] border-gray-700 hover:bg-hovercolor hover:border-transparent cursor-pointer'
        onClick={() => friend.status === 'accepted' && navigate(`/channels/@me/${friend.id}`)}>
            <UserAvatar usericons={friend.usericons} online={friend.status === 'accepted' ? online : undefined} />
            <div className='ml-3 flex-1 min-w-0'>
                <div className='flex items-baseline gap-1'>
                    <h3 className='text-white font-semibold truncate'>{friend.name}</h3>
                    <span className='text-slate-400 text-sm hidden group-hover:inline truncate'>{friend.username}</span>
                </div>
                <p className='text-slate-400 text-xs'>{subtext}</p>
            </div>
            <div className='flex gap-2' onClick={(e) => e.stopPropagation()}>
                {friend.status === 'accepted' && <>
                    <ActionButton label='Message' onClick={() => navigate(`/channels/@me/${friend.id}`)} className='hover:text-white'>
                        <BsChatFill size={16} />
                    </ActionButton>
                    <ActionButton label='Remove Friend' onClick={() => handleAction('remove', friend)} className='hover:text-red-400'>
                        <MdPersonRemove size={18} />
                    </ActionButton>
                    <ActionButton label='Block' onClick={() => handleAction('block', friend)} className='hover:text-red-400'>
                        <MdBlock size={18} />
                    </ActionButton>
                </>}
                {friend.status === 'pending' && friend.direction === 'incoming' &&
                    <ActionButton label='Accept' onClick={() => handleAction('accept', friend)} className='hover:text-green-500'>
                        <FaCheck size={16} />
                    </ActionButton>
                }
                {friend.status === 'pending' &&
                    <ActionButton label={friend.direction === 'incoming' ? 'Ignore' : 'Cancel'} onClick={() => handleAction('remove', friend)} className='hover:text-red-400'>
                        <RxCross2 size={18} />
                    </ActionButton>
                }
                {friend.status === 'blocked' &&
                    <ActionButton label='Unblock' onClick={() => handleAction('unblock', friend)} className='hover:text-red-400'>
                        <MdBlock size={18} />
                    </ActionButton>
                }
            </div>
        </div>
    )
}

export default FriendItem
