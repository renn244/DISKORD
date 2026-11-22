import { API_URL } from '@/util/apiUrl'
import { useState } from "react"
import Arrow_Logo from '../../../assets/CreateServer_logo/Arrow_LOGO.svg'
import Compass from '../../../assets/CreateServer_logo/Compass_LOGO.svg'
import { ModalProps } from "./AddServerModal"

const JoinServer: React.FC<ModalProps> = ({handleModalNumber}) => {
    const [serverLink, setServerLink] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [notValid, setNotValid] = useState<boolean>(false)

    const handleJoinServer = async () => {
        setLoading(true)

        try {
            const res:Response = await fetch(`${API_URL}/api/server/Join_Server`, {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({serverlink: serverLink}),
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)

            window.location.assign(`/channels/${data.serverId}/${data.channelId}`)
        } catch (error: any) {
            console.log(error)
            setNotValid(true)
        } finally {
            setLoading(false)
        }
    }

  return (
    <div className='bg-gray-700 rounded-md h-[440px] w-[436px]'>
        <div className='p-4 flex flex-col items-center'>
            <h2 className='font-bold text-2xl text-white mt-6 mb-2'>Join Server</h2>
            <p className="text-slate-300 text-center text-base mt-2">Enter an invite below to join an existing server</p>
        </div>
        <div className="pr-4 pl-4 mb-4">
            <h2 className={`font-semibold text-[12px] text-slate-200 mb-2 ${notValid ? 'text-red-600' : ""}`}>INVITE LINK 
                <span className=' text-red-700'>{notValid ? " - The invite is invalid or has expired." : "*" }</span>
            </h2>
            <input value={serverLink}
            onChange={(e:React.ChangeEvent<HTMLInputElement>) => { setServerLink(e.target.value); setNotValid(false) }}
            onKeyDown={(e) => e.key === 'Enter' && serverLink && handleJoinServer()}
            className='p-[10px] bg-gray-800 w-full rounded-sm outline-none text-white'
            type="text" placeholder='diskord/invite/3f9a1c2b7d4e5f60a1b2' />
        </div>
        <div className="pr-4 pl-4 mb-4">
            <h2 className='font-semibold text-[12px] text-slate-200 mb-2'>INVITE SHOULD LOOK LIKE</h2>
            <div className="text-white text-sm">diskord/invite/3f9a1c2b7d4e5f60a1b2</div>
            <div className="text-white text-sm">3f9a1c2b7d4e5f60a1b2</div>
        </div>
        <div className="px-4">
            <div className='flex items-center border border-gray-500 rounded-lg hover:bg-slate-600 mb-4 px-4'>   
                <img src={Compass} className='ml-4 m-2' />
                <div>
                    <h2 className='font-bold text-md text-white'>Don't have an Invite?</h2>
                    <p className="text-white text-xs">Check out Discoverable communities in Server Discoveries</p>
                </div>
                <img src={Arrow_Logo} className='ml-auto mr-[16px]' />
            </div>
        </div>
        <div className='p-4 h-[70px] flex justify-between items-center bg-gray-800 rounded-b-md'>
            <button onClick={() => handleModalNumber(1)}
            className="text-white hover:underline hover:underline-offset-1">
                Back
            </button>
            
            <button disabled={loading || !serverLink.trim()}
            onClick={() => handleJoinServer()}
            className='bg-indigo-500 text-white text-base rounded-md px-4 py-[2px] font-bold h-[38px] disabled:opacity-50'>
                Join Server
            </button>
        </div>
    </div>
  )
}

export default JoinServer