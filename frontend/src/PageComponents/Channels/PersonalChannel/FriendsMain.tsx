import React from 'react'
import FriendsMain_logo from '@/assets/PersonalChannel/FriendsMain_Logo.svg'

const FriendsMain: React.FC<{ category: string }> = ({ category }) => {

    // this should be dynamic and base on what is on the category
    const text: { [key: string]: string } = {
        Online: "No one's around to play with Wumpus.",
        All: "You don't have any friends yet. Add one with their username!",
        Pending: "There are no pending friend requests.",
        Blocked: "You haven't blocked anyone.",
    }

  return (
    <div>
        <img src={FriendsMain_logo} className='mb-10'/>
        <p className='text-slate-300 text-center mt-2'>{text[category]}</p>
    </div>
  )
}

export default FriendsMain
