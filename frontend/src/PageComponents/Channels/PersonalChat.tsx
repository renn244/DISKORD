import { API_URL } from '@/util/apiUrl'

import { FaPlus } from "react-icons/fa";
import Friends from "./PersonalChannel/Friends";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import lastelementofURL from "@/util/lastElementofURL";
import { useEffect, useState } from "react";
import { useSocketContext } from "@/Context/SocketContext";
import DirectChat from "./PersonalChannel/DirectChat";
import NewMessageModal from "./PersonalChannel/NewMessageModal";
import UserAvatar from "./PersonalChannel/UserAvatar";
import UserArea from "../UserSettings/UserArea";

interface logo_component {
    selected_cat?: boolean;
}

type conversationType = {
    id: number,
    name: string,
    usericons: string,
    last_message: string
}

const PersonalChat = () => {
    const Options = [
        {logo: Me_logo, text: "Friends"},
    ]

    const URL = useLocation()
    const selected = lastelementofURL(URL)
    const [conversations, setConversations] = useState<conversationType[]>([])
    const [openNewMessage, setOpenNewMessage] = useState<boolean>(false)
    const { socket, onlineUsers } = useSocketContext()

    const getConversations = async () => {
        try {
            const res: Response = await fetch(`${API_URL}/api/message/GetConversations`, {
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)
            setConversations(data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getConversations()
    }, [])

    // a new message moves that conversation to the top (or adds it)
    useEffect(() => {
        if(!socket) return
        socket.on('directMessage', getConversations)
        return () => {
            socket.off('directMessage', getConversations)
        }
    }, [socket])

    return (
        <div className='flex flex-row w-full h-screen h-full'>
            <div id="personalchat-sidebar" 
            className='flex flex-col min-w-[240px] w-[240px] bg-gray-800'>
                <nav className='relative flex flex-col flex-1'>
                    <div className='relative flex px-[10px] items-center justify-center h-[48px] border-b-[1px] border-gray-900'>
                        <button onClick={() => setOpenNewMessage(true)}
                        className='w-full bg-gray-900 px-[6px] py-[1px] h-[26px] rounded-md text-slate-400 text-sm text-start'>
                            Find or start a conversation
                        </button>
                    </div>
                    <div className="flex flex-col items-center pr-2 flex-1 overflow-auto">
                        {Options?.map((info) => {
                            const selected_cat = selected === info.text

                            return (
                                <Link key={info.text} to={'../@me/' + info.text} className='flex group w-full pl-2'>
                                    <div className={`flex items-center group-hover:bg-gray-700 rounded-md h-[42px] w-full cursor-pointer
                                         ${selected_cat && 'bg-gray-700'}`}>
                                        <div className='size-[32px] mr-3'>
                                            <info.logo selected_cat={selected_cat} />
                                        </div>
                                        <div className="flex items-start w-[156px]">
                                                <h2 className={`group-hover:text-white
                                                font-semibold text-slate-400  ${selected_cat && 'text-white'}`}>
                                                    {info.text}
                                                </h2>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                        
                        <h2 className="pt-[18px] pl-[18px] pb-1 pr-2 text-start w-full uppercase 
                        text-slate-400 text-xs font-bold flex items-center">
                            <span className="hover:text-slate-300 flex-1">Direct Message</span>
                            <button onClick={() => setOpenNewMessage(true)} aria-label="Create DM"
                            className="hover:text-slate-300"><FaPlus /></button>
                        </h2>

                        {conversations.map((conversation) => {
                            const selected_dm = selected === conversation.id.toString()

                            return (
                                <Link key={conversation.id} to={'../@me/' + conversation.id} className='flex group w-full pl-2'>
                                    <div className={`flex items-center gap-3 px-2 group-hover:bg-gray-700 rounded-md h-[42px] w-full
                                        ${selected_dm && 'bg-gray-700'}`}>
                                        <UserAvatar usericons={conversation.usericons} online={onlineUsers.includes(conversation.id.toString())} />
                                        <h2 className={`group-hover:text-white font-semibold text-slate-400 truncate ${selected_dm && 'text-white'}`}>
                                            {conversation.name}
                                        </h2>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>  
                    <UserArea />
                </nav>
            </div>
            <NewMessageModal open={openNewMessage} onClose={() => setOpenNewMessage(false)} />
            <Routes>
                <Route path={"Friends"} element={<Friends />}/>
                <Route path={":friendId"} element={<DirectChat />}/>
            </Routes> 
        </div>
    )
}

// just logos
export const Me_logo: React.FC<logo_component> = ({selected_cat}) => {
    return (
        <div className="size-[32px] mr-3 flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" aria-hidden="true" 
            className={`text-gray-400 group-hover:text-white ${selected_cat && 'text-white'}`}>
            <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"/></svg>
        </div>
    )
}

export default PersonalChat