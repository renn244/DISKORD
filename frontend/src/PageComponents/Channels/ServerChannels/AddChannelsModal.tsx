import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from 'react'
import { FaHashtag } from 'react-icons/fa6'

type AddChannelsModalType = {
    open: boolean,
    setOpenModal: Dispatch<SetStateAction<boolean>>,
    id: string | undefined
}



const AddChannelsModal: React.FC<AddChannelsModalType> = ({open, setOpenModal, id}) => {
    const [channelName, setChannelName] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        setChannelName("")
        setError("")
    }, [open])

    const handleCreateChannel = async () => {
        setLoading(true)
        setError("")
        try {
            const res: Response = await fetch(`http://localhost:5000/api/server/CreateChannel/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({
                    channelname: channelName
                }),
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)
            window.location.assign(`http://localhost:5173/channels/${id}/${data.id}`)
        } catch (error: any) {
            console.log(error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if(!open) return null

    return (
        <div className='w-full h-screen fixed bg-black bg-opacity-50 flex justify-center items-center'>
            <div className='w-[460px] flex flex-col bg-lightgray rounded-md'>
                <div className='p-4 flex justify-start relative'>
                    <div className='max-w-[460px]'>
                        <h2 className='text-white text-semibold text-2xl'>Create Channel</h2>
                        <p className='text-slate-400 text-xs'>in Text Channels</p>
                    </div>
                </div>
                <div className='px-4'>
                    <div className='mb-5'>
                        <h2 className='text-gray-200 font-bold text-xs uppercase mb-2'>Channel name</h2>
                        <div className='flex h-[40px] relative '>
                            <FaHashtag className='absolute top-3 left-2 text-slate-300' />
                            <input 
                            // channel names are lowercase with dashes like new-channel
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && channelName && !loading && handleCreateChannel()}
                            value={channelName}
                            maxLength={40}
                            autoFocus
                            placeholder='new-channel'
                            className='text-slate-300 p-[10px] pl-7 w-full outline-none rounded-sm bg-highdarkgray' />
                        </div>
                        {error && <p className='text-red-400 text-sm mt-2'>{error}</p>}
                    </div>
                </div>
                <div className='bg-darkgray p-4 rounded-b-md h-full flex justify-end'>
                    <button onClick={() => setOpenModal(false)}
                    className='text-white px-4 py-[2px] font-semibold hover:underline
                    text-sm'>Cancel
                    </button>
                    <button onClick={() => handleCreateChannel()}
                    disabled={!channelName || loading}
                    className={`w-[129px] px-4 py-[2px] text-sm bg-indigo-500 rounded-sm hover:bg-indigo-600
                    font-semibold text-white ${!channelName && 'opacity-50'}`}>
                        {loading ? <span className='animate-spin'>loading...</span> : "Create Channel"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddChannelsModal