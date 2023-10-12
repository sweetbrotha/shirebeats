import React from 'react';
import PlaylistTile from './PlaylistTile';

const SELECTION_LIMIT = 3;
const SEARCH_RESULTS = 5;

function PlaylistSuggestions({ spotifyApi, setFormSelectedPlaylists }) {
  const [search, setSearch] = React.useState('');
  const [draggingOverCounter, setDraggingOverCounter] = React.useState(0);
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    const selectedIds = selected.map(playlist => playlist.id);
    // Update the formSelectedPlaylists state in the parent component
    setFormSelectedPlaylists(selectedIds);
}, [selected, setFormSelectedPlaylists]);


  const getPlaylistIdFromUrl = (url) => {
    const match = url.match(/\/playlist\/([\w-]+)/);
    return match ? match[1] : null;
  };

  // Build a playlist object from an item returned by Spotify's API
  const buildPlaylist = (item) => ({
    id: item.id,
    title: item.name,
    owner: item.owner.display_name,
    playlistArt: item.images[0].url,
  });

  const handleInputChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    setDraggingOverCounter((prevCounter) => prevCounter + 1);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDraggingOverCounter((prevCounter) => prevCounter - 1);
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Allows drag-and-drop behavior
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDraggingOverCounter(0); // reset counter on drop
    // We'll assume the dropped data is a Spotify playlist URL
    const url = event.dataTransfer.getData('text');
    const playlistId = getPlaylistIdFromUrl(url);
  
    // Check if the dropped playlist is valid and isn't already selected
    if (playlistId && !selected.find((s) => s.id === playlistId)) {
      spotifyApi.getPlaylist(playlistId)
        .then((data) => {
          const playlist = buildPlaylist(data.body);
          setSelected([...selected, playlist]);
        })
        .catch((err) => {
          console.error(err); // fail somewhat quietly
        });
    }
  };

  // Runs whenever the search value changes.
  React.useEffect(() => {
    let isCancelled = false; // prevents state update on an unmounted component
    if (search !== '' && spotifyApi.getAccessToken()) {
      const playlistId = getPlaylistIdFromUrl(search);
      if (playlistId) { // user inputted a playlist URL
        spotifyApi.getPlaylist(playlistId)
          .then((data) => {
            if (!isCancelled) {
              setResults([buildPlaylist(data.body)]);
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setResults([]);
            }
          });
      } else { // user is searching text, debounce for 0.5 seconds
        const timeoutId = setTimeout(() => {
          if (!isCancelled) {
            spotifyApi.searchPlaylists(search)
              .then((data) => {
                if (!isCancelled) {
                  setResults(data.body.playlists.items.slice(0, SEARCH_RESULTS).map(buildPlaylist));
                }
              })
              .catch(() => {
                if (!isCancelled) {
                  setResults([]);
                }
              });
          }
        }, 500);

        // cleanup function
        return () => {
          isCancelled = true; // Prevent setResults after unmount
          clearTimeout(timeoutId); // cancel this execution when input value changes quickly
        };
      }
    } else {
      setResults([]); // Clear suggestions when input is empty
    }
  }, [search, spotifyApi]);

  const selectPlaylist = (playlist) => {
    setSearch(""); // clear search on selection click
    if (selected.find((p) => p.id === playlist.id)) return; // song already selected
    setSelected([...selected, playlist]);
  };


  const removePlaylist = (id) => {
    setSelected(selected.filter((selected) => selected.id !== id));
  };

  // Render placeholder only if there's space for more playlist selections
  const renderPlaceholder = () => {
    if (selected.length < SELECTION_LIMIT) {
      return (
        <div className="flex flex-col h-24 w-1/2 justify-center items-center border-2 border-black-600 border-dashed border-opacity-30 bg-white bg-opacity-50">
          <span className="text-4xl text-gray-400">+</span>
          <span className="text-sm text-gray-300 mt-0.5">drag & drop Spotify playlists here</span>
        </div>
      );
    }
  };

  const dragClasses = (draggingOverCounter > 0) ? "border border-green-600 border-opacity-50 bg-green-600 bg-opacity-10" : "";

  return (
    <div className="py-4 md:py-8 pl-2 md:pl-8 w-full flex flex-col items-start">
      <div className="text-2xl text-green-700 my-1">playlists u like?</div>
      <div className="text-sm md:text-md text-left text-gray-500 w-11/12 md:w-2/3 mb-4">
        optionally, include full playlists here! if there's extra space on the communal music tablet, we'll download it.
        priority goes to hobbit-crafted playlists!
      </div>
      <div id="selections-container" className="flex flex-col items-center w-full">
        <input
          className="flex justify-center px-2 py-1 md:px-4 md:py-2 mt-2 w-11/12 md:w-2/3 focus:outline-none focus:ring-2 focus:ring-green-600"
          type="text"
          placeholder={selected.length >= SELECTION_LIMIT ? "Submissions complete!" : "Find a playlist..."}
          value={search}
          onChange={handleInputChange}
          disabled={selected.length >= SELECTION_LIMIT}
        />
        <div className="max-h-40 w-11/12 md:w-2/3 overflow-y-auto mt-1">
          {results.map((result) => (
            <PlaylistTile
              key={result.id}
              id={result.id}
              title={result.title}
              owner={result.owner}
              playlistArt={result.playlistArt}
              onSelect={selectPlaylist}
            />
          ))}
        </div>
        {!isMobile && selected.length < SELECTION_LIMIT ? (
          <div className="flex justify-center items-center w-full my-2 md:my-4">
            <hr className="border-t border-green-600 border-opacity-30 w-1/4" />
            <span className="text-green-600 px-2">or</span>
            <hr className="border-t border-green-600 border-opacity-30 w-1/4" />
          </div>
        ) : null}
        {!isMobile ? (
        <div
          className={`flex flex-col w-4/5 p-4 items-center ${dragClasses}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {renderPlaceholder()}
          <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-2 gap-y-0.5">
            {selected.map((playlist) => (
              <PlaylistTile
                key={playlist.id}
                id={playlist.id}
                title={playlist.title}
                owner={playlist.owner}
                playlistArt={playlist.playlistArt}
                onRemove={removePlaylist}
                selected
              />
            ))}
          </div>
        </div>
        ) : (
          <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-2 gap-y-0.5">
            {selected.map((playlist) => (
              <PlaylistTile
                key={playlist.id}
                id={playlist.id}
                title={playlist.title}
                owner={playlist.owner}
                playlistArt={playlist.playlistArt}
                onRemove={removePlaylist}
                selected
              />
            ))}
          </div>
        )}
        <div className={`flex flex-row justify-end w-full text-green-600 text-sm text-opacity-60 mt-2 pr-4 md:pr-16 ${selected.length === SELECTION_LIMIT ? 'font-bold' : ''}`}>
          {selected.length === SELECTION_LIMIT ? '✓' : ''} {selected.length}/{SELECTION_LIMIT} selected{selected.length === SELECTION_LIMIT ? '!' : ''}
        </div>

      </div>
    </div>
  );
}

export default PlaylistSuggestions;
