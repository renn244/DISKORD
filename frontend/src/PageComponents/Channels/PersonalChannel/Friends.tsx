import { API_URL } from '@/util/apiUrl'
import { useEffect, useState } from 'react'
import FriendsMain from './FriendsMain'
import { Me_logo } from '../PersonalChat'
import { Separator } from '@/components/ui/separator'
import { useSocketContext } from '@/Context/SocketContext'
import FriendItem, { friendType } from './FriendItem'
import AddFriend from './AddFriend'
import UserAvatar from './UserAvatar'
import ConfirmModal from './ConfirmModal'

const Friends = () => {
    const [category, setCategory] = useState<string>("Online")
    const [friends, setFriends] = useState<friendType[]>([])
    const [confirm, setConfirm] = useState<{ action: string, friend: friendType } | undefined>()
    const categorytypes: string[] = ["Online", "All", "Pending", "Blocked"]
    const { socket, onlineUsers } = useSocketContext()

    const getFriends = async () => {
        try {
            const res: Response = await fetch(`${API_URL}/api/friend/list`, {
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)
            setFriends(data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getFriends()
    }, [])

    // the server tells us when a request is sent, accepted, removed or blocked
    useEffect(() => {
        if(!socket) return
        socket.on('friendsUpdated', getFriends)
        return () => {
            socket.off('friendsUpdated', getFriends)
        }
    }, [socket])

    // removing a friend and blocking ask first, everything else happens right away
    const handleAction = (action: string, friend: friendType) => {
        if(action === 'block' || (action === 'remove' && friend.status === 'accepted')) return setConfirm({ action, friend })
        doAction(action, friend)
    }

    const doAction = async (action: string, friend: friendType) => {
        setConfirm(undefined)
        try {
            const res: Response = await fetch(`${API_URL}/api/friend/${action}/${friend.id}`, {
                method: 'POST',
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)
            getFriends()
        } catch (error) {
            console.log(error)
        }
    }

    const isOnline = (friend: friendType) => onlineUsers.includes(friend.id.toString())
    const accepted = friends.filter(friend => friend.status === 'accepted')
    const onlineFriends = accepted.filter(isOnline)
    const pendingCount = friends.filter(friend => friend.status === 'pending' && friend.direction === 'incoming').length

    const shown = category === 'Online' ? onlineFriends
        : category === 'All' ? accepted
        : category === 'Pending' ? friends.filter(friend => friend.status === 'pending')
        : friends.filter(friend => friend.status === 'blocked')

    return (
        <div className='flex flex-col flex-1  bg-darkgray '>
            <div className='h-[48px] p-2 flex items-center justify-start border-b-[1px] border-gray-900'>
                <div className='h-[31px]'>
                    <Me_logo />
                </div>
                <h2 className="font-semibold text-white">Friends</h2>
                <Separator orientation='vertical' className='mx-2'/>
                <div className='flex items-center'>
                    {categorytypes.map((type) => {
                        const selected = category === type
                        return (
                            <div key={type} className={`px-2 py-[2px] mx-2 hover:bg-gray-600 rounded-sm ${selected && 'bg-gray-600'}`}>
                                <button onClick={() => setCategory(type)}
                                className={`flex items-center gap-1 text-slate-300 font-semibold hover:text-slate-200 ${selected && 'text-white'}`}>
                                    {type}
                                    {type === 'Pending' && pendingCount > 0 &&
                                        <span className='bg-red-500 text-white text-xs rounded-full px-[6px] leading-4'>{pendingCount}</span>
                                    }
                                </button>
                            </div>
                        )
                    })}
                    <button onClick={() => setCategory('Add Friend')}
                    className={`px-2 py-[2px] mx-2 rounded-sm font-semibold
                    ${category === 'Add Friend' ? 'text-green-400 bg-transparent' : 'text-white bg-green-700'}`}>
                        Add Friend
                    </button>
                </div>
            </div>
            <div className='flex flex-1'>
                <div className='max-w-[1188px] flex-1 border-gray-700 border-r-[1px] flex flex-col'>
                    {category === 'Add Friend' ?
                        <AddFriend onSent={getFriends} />
                    : shown.length === 0 ?
                        <div className='mx-auto flex flex-col justify-center items-center w-[440px] h-full'>
                            <FriendsMain category={category} />
                        </div>
                    :
                        <div className='px-[30px] pt-4 overflow-auto'>
                            <h2 className='text-slate-400 text-xs font-semibold uppercase mb-4'>{category} — {shown.length}</h2>
                            {shown.map((friend) => (
                                <FriendItem key={friend.id} friend={friend} online={isOnline(friend)} handleAction={handleAction} />
                            ))}
                        </div>
                    }
                </div>
                <div className='max-w-[418px] h-full flex flex-col p-4 pr-2'>
                    <h2 className='text-xl font-bold text-white text-start w-[385px] mt-2 mb-4'>Active Now</h2>
                    {onlineFriends.length === 0 ?
                    <div className='p-4 flex flex-col items-center'>
                        <h2 className='text-lg text-white font-bold'>It's quiet for now...</h2>
                        <p className='text-sm text-center text-slate-200'>When a friend starts an activity—like playing a game or hanging out on voice—we’ll show it here!</p>
                    </div>
                    :
                    <div className='flex flex-col gap-2'>
                        {onlineFriends.map((friend) => (
                            <div key={friend.id} className='flex items-center gap-3 p-3 rounded-lg bg-highdarkgray'>
                                <UserAvatar usericons={friend.usericons} online />
                                <h3 className='text-white font-semibold'>{friend.name}</h3>
                            </div>
                        ))}
                    </div>
                    }
                </div>
            </div>
            <ConfirmModal open={!!confirm}
            title={confirm?.action === 'block' ? `Block '${confirm?.friend.name}'` : `Remove '${confirm?.friend.name}'`}
            description={confirm?.action === 'block'
                ? <>Are you sure you want to block <b>{confirm?.friend.name}</b>? They won't be able to message you or send you friend requests, and they'll be removed from your friends.</>
                : <>Are you sure you want to remove <b>{confirm?.friend.name}</b> from your friends?</>}
            confirmText={confirm?.action === 'block' ? 'Block' : 'Remove Friend'}
            onConfirm={() => confirm && doAction(confirm.action, confirm.friend)}
            onClose={() => setConfirm(undefined)} />
        </div>
    )
}

export default Friends
