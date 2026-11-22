import React, { useEffect } from 'react'

type ConfirmModalType = {
    open: boolean,
    title: string,
    description: React.ReactNode,
    confirmText: string,
    onConfirm: () => void,
    onClose: () => void
}

const ConfirmModal: React.FC<ConfirmModalType> = ({ open, title, description, confirmText, onConfirm, onClose }) => {

    useEffect(() => {
        if(!open) return
        const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [open])

    if(!open) return null

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[100]' onClick={onClose}>
            <div role='dialog' aria-label={title} onClick={(e) => e.stopPropagation()}
            className='w-[440px] flex flex-col bg-lightgray rounded-md'>
                <div className='p-4'>
                    <h2 className='text-white font-semibold text-xl mb-3'>{title}</h2>
                    <p className='text-slate-300 text-sm'>{description}</p>
                </div>
                <div className='bg-darkgray p-4 rounded-b-md flex justify-end'>
                    <button onClick={onClose}
                    className='text-white px-4 py-[2px] font-semibold hover:underline text-sm'>
                        Cancel
                    </button>
                    <button onClick={onConfirm} autoFocus
                    className='px-4 py-2 text-sm text-white font-semibold bg-red-500 rounded-sm hover:bg-red-600'>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
