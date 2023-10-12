import React from 'react';

function SongTile({ id, title, artist, albumArt, onRemove, selected, onSelect }) {
  const handleClick = () => {
    if (!selected && onSelect) {
      onSelect({
        title: title,
        artist: artist,
        albumArt: albumArt,
        id: id,
      });
    }
  };

  const baseClassNames = 'relative flex items-center w-full my-1 pr-6';
  const selectedClassNames = `${baseClassNames} cursor-default border border-black-600 border-opacity-30 bg-green-600 bg-opacity-10`;
  const unselectedClassNames = `${baseClassNames} hover:text-green-700 cursor-pointer bg-white bg-opacity-50`;

  return (
    <div className={selected ? selectedClassNames : unselectedClassNames} onClick={handleClick}>
      <img src={albumArt} className="w-16 h-16 mr-2" alt="Spotify Art" />
      <div className="flex flex-col items-start w-0 min-w-0 flex-grow overflow-hidden">
        <div className="text-sm md:text-md font-bold truncate">{title}</div>
        <div className="text-xs md:text-sm text-gray-500 truncate">{artist}</div>
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

export default SongTile;
