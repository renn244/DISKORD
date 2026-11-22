import { useLocalStorage } from '@/util/useLocalStorage';
import React, { useEffect, useRef, useState } from 'react'
import { FaCirclePlus } from "react-icons/fa6";

// url is where the message is posted, so this works for channels and direct messages
type SendMesasgeType = {
    url: string,
    onSent?: (message: any) => void
}

const SendMessage: React.FC<SendMesasgeType> = ({ url, onSent }) => {
    const [message, setMessage] = useState<string | undefined>("")
    const contentEditableRef = useRef(null)
    //TODO LATER!! 
    // make sure to save the input like draft in discord or messenger 
    // and also detect if they change channel or not using useeffect
    const {  getItem, setItem, removeItem } = useLocalStorage<string>(`message/${url}`)

    useEffect(() => {
        setMessage(getItem())
    }, [url])


    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if(e.currentTarget.textContent) {
            setItem(e.currentTarget.textContent)
        } else {
            removeItem()
        }
        
        // made so that the input will be much better and not start at the front
        setMessage(e.currentTarget.textContent || "")
        const selection = window.getSelection()
        if(selection) {
            if(contentEditableRef.current == null) return
            const range = document.createRange()
            range.selectNodeContents(contentEditableRef.current)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }

    /**
     * this is going to handle the enter key but nothing else 
     * so the it can be submitted when enter key is pressed
     */
    const handleEnterKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleSendMessage = async () => {
        if(!message) return
        try {
            const res: Response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({message: message}),
                credentials: 'include'
            })

            const data = await res.json()

            if(data.error) throw new Error(data.error)

            // you shoul be able to update messages
            removeItem()
            setMessage("")
            onSent?.(data)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <form onSubmit={handleSendMessage}
        className='flex flex-row bg-lightgray rounded-md overflow-auto items-center'>
            <div className='py-[10px] px-4'>
                <FaCirclePlus size={25} className='text-gray-300'/>
            </div>
                <div 
                onKeyDown={handleEnterKey}
                suppressContentEditableWarning={true}
                ref={contentEditableRef}
                className='text-white border-none outline-none flex-1 min-w-0 break-words 
                cursor-text py-1'
                onInput={handleInput}
                contentEditable={"true"}
                >
                    {message}
                </div>
                
        </form>
    )
}

export default SendMessage