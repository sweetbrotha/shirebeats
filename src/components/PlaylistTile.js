import React from 'react';

function PlaylistTile({ id, title, owner, playlistArt, onRemove, selected, onSelect }) {
  const handleClick = () => {
    if (!selected && onSelect) {
      onSelect({
        title: title,
        owner: owner,
        playlistArt: playlistArt,
        id: id,
      });
    }
  };

  const baseClassNames = 'relative flex items-center w-full my-1 pr-6';
  const selectedClassNames = `${baseClassNames} cursor-default border border-black-600 border-opacity-30 bg-green-600 bg-opacity-10`;
  const unselectedClassNames = `${baseClassNames} hover:text-green-700 cursor-pointer bg-white bg-opacity-50`;

  return (
    <div className={selected ? selectedClassNames : unselectedClassNames} onClick={handleClick}>
      <img src={playlistArt} className="w-16 h-16 mr-2" alt="Spotify Art" />
      <div className="flex flex-col items-start truncate overflow-hidden">
        <div className="text-md font-bold truncate max-w-full">{title}</div>
        <div className="text-sm text-gray-400 truncate max-w-full">by {owner}</div>
      </div>
      {onRemove && (
        <button className="absolute top-0 right-0 mt-2 mr-2 text-green-700 cursor-pointer hover:font-bold" onClick={(event) => {
          event.stopPropagation();
          onRemove(id);
        }}>
          x
        </button>
      )}
    </div>
  );
}

export default PlaylistTile;
