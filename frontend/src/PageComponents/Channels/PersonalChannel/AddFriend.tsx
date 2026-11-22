import React, { useState } from 'react'

const AddFriend: React.FC<{ onSent: () => void }> = ({ onSent }) => {
    const [username, setUsername] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [result, setResult] = useState<{ error?: string, message?: string }>({})

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if(!username.trim()) return
        setLoading(true)
        try {
            const res: Response = await fetch('http://localhost:5000/api/friend/request', {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ username }),
                credentials: 'include'
            })

            const data = await res.json()
            setResult(data)

            if(!data.error) {
                setUsername("")
                onSent()
            }
        } catch (error) {
            console.log(error)
            setResult({ error: "Something went wrong. Try again." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='px-[30px] py-5 border-b-[1px] border-gray-700'>
            <h2 className='text-white font-bold uppercase text-base mb-2'>Add Friend</h2>
            <p className='text-slate-300 text-sm mb-4'>You can add friends with their DISKORD username.</p>
            <form onSubmit={handleSendRequest}
            className={`flex items-center bg-highdarkgray rounded-lg border-[1px] px-3 py-2
            ${result.error ? 'border-red-500' : result.message ? 'border-green-500' : 'border-black focus-within:border-blue-500'}`}>
                <input value={username} autoFocus
                onChange={(e) => { setUsername(e.target.value); setResult({}) }}
                placeholder='You can add friends with their DISKORD username.'
                className='flex-1 bg-transparent outline-none text-white placeholder:text-slate-500' />
                <button type='submit' disabled={!username.trim() || loading}
                className='bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-md'>
                    Send Friend Request
                </button>
            </form>
            {result.error && <p className='text-red-400 text-sm mt-2'>{result.error}</p>}
            {result.message && <p className='text-green-400 text-sm mt-2'>{result.message}</p>}
        </div>
    )
}

export default AddFriend
