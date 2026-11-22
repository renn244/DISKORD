import React from 'react'
import UserIcons from '@/assets/UserIcons.svg'

type UserAvatarType = {
    usericons?: string,
    online?: boolean,
    size?: number
}

// online is optional so it only shows the green/gray dot when we know the status
const UserAvatar: React.FC<UserAvatarType> = ({ usericons, online, size = 32 }) => {
    return (
        <div className='relative shrink-0' style={{ width: size, height: size }}>
            <img src={usericons || UserIcons}
            className={`size-full rounded-full bg-highdarkgray object-cover ${!usericons && 'p-1'}`} />
            {online !== undefined && (
                <span className={`absolute -bottom-[2px] -right-[2px] size-[14px] rounded-full border-[3px] border-darkgray
                ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
            )}
        </div>
    )
}

export default UserAvatar
