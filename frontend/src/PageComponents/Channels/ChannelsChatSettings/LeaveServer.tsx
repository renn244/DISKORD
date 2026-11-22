import { API_URL } from '@/util/apiUrl'
import React from 'react'



const LeaveServer: React.FC<{serverId: string | undefined}> = ({ serverId }) => {

    const handleLeaveServer = async () => {
        try {
            if(!serverId) throw new Error("server Id is undefined")

            const res: Response = 
            await fetch(`${API_URL}/api/server/leave/${serverId}`, {
                method: 'POST',
                credentials: 'include'
            })
            
            const data = await res.json()

            if(data.error) throw new Error(data.error)

            window.location.assign('/channels/@me/Friends')
        } catch (error) {
            console.log(error)
        }
    }

  return (
    <div className='w-full mr-auto'>
        <button onClick={() => handleLeaveServer()}
        className='pr-[115px] text-red-500 text-sm font-semibold my-[2px] py-[6px] pl-2 
       hover:bg-red-500 hover:text-white rounded-sm'>
            Leave Server
        </button>
    </div>
  )
}

export default LeaveServer