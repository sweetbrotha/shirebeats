import React from 'react';
import SongTile from './SongTile';

const SUGGESTED_LIMIT = 5;
const ACTUAL_LIMIT = 10;
const SEARCH_RESULTS = 5;

function SongSuggestions(
  {
    playlistName,
    playlistNumber,
    description,
    url,
    spotifyApi,
    setFormSelectedTracks
  }) {
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


  // Extracting the track ID from the URL
  const getTrackIdFromUrl = (url) => {
    const match = url.match(/\/track\/([\w-]+)/);
    return match ? match[1] : null;
  };

  // Build a song object from a track item
  const buildSong = (item) => ({
    id: item.id,
    title: item.name,
    artist: item.artists.map((artist) => artist.name).join(', '),
    albumArt: item.album.images[0].url,
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
    // We'll assume the dropped data is a Spotify track URL
    const url = event.dataTransfer.getData('text');
    const trackId = getTrackIdFromUrl(url);

    // Check if the dropped track is valid and isn't already selected
    if (trackId && !selected.find((s) => s.id === trackId)) {
      spotifyApi.getTrack(trackId)
        .then((data) => {
          const song = buildSong(data.body);
          setSelected([...selected, song]);
        })
        .catch((err) => {
          console.error(err); // fail somewhat quietly
        });
    }
  };

  React.useEffect(() => {
    const selectedTrackIds = selected.map(track => track.id);
    // Update the formSelectedTracks state in the parent component
    setFormSelectedTracks(prevObj => ({
      ...prevObj,
      [playlistNumber]: selectedTrackIds
    }));
  }, [selected, setFormSelectedTracks, playlistNumber]);

  // Runs whenever the search value changes.
  React.useEffect(() => {
    let isCancelled = false; // prevents state update on an unmounted component
    if (search !== '' && spotifyApi.getAccessToken()) {
      const trackId = getTrackIdFromUrl(search);
      if (trackId) { // user inputted a track URL
        spotifyApi.getTrack(trackId)
          .then((data) => {
            if (!isCancelled) {
              setResults([buildSong(data.body)]);
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
            spotifyApi.searchTracks(search)
              .then((data) => {
                if (!isCancelled) {
                  setResults(data.body.tracks.items.slice(0, SEARCH_RESULTS).map(buildSong));
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

  const selectSong = (song) => {
    setSearch(""); // clear search on selection click
    if (selected.find((s) => s.id === song.id)) return; // song already selected
    setSelected([...selected, song]);
  };


  const removeSong = (id) => {
    setSelected(selected.filter((selected) => selected.id !== id));
  };

  const getExclamationMarks = () => {
    const excess = selected.length - SUGGESTED_LIMIT;
    return excess > 0 ? '!'.repeat(excess) : '';
  };


  // Render placeholder only if there's space for more track selections
  const renderPlaceholder = () => {
    if (selected.length < ACTUAL_LIMIT) {
      return (
        <div className="flex flex-col h-24 w-1/2 justify-center items-center border-2 border-black-600 border-dashed border-opacity-30 bg-white bg-opacity-50">
          <span className="text-4xl text-gray-400">+</span>
          <span className="text-sm text-gray-300 mt-0.5">drag & drop Spotify tracks here</span>
        </div>
      );
    }
  };

  const dragClasses = (draggingOverCounter > 0) ? "border border-green-600 border-opacity-50 bg-green-600 bg-opacity-10" : "";

  return (
    <div className="py-4 md:py-8 pl-2 md:pl-8 w-full flex flex-col items-start">
      <a href={url} className="text-2xl text-green-700 my-1 hover:underline" target="_blank" rel="noreferrer">{playlistName}</a>
      <div className="text-sm md:text-md text-left text-gray-500 w-11/12 md:w-2/3 mb-4">{description}</div>
      <div id="selections-container" className="flex flex-col items-center w-full">
        <input
          className="flex justify-center px-2 py-1 md:px-4 md:py-2 mt-2 w-11/12 md:w-2/3 focus:outline-none focus:ring-2 focus:ring-green-600"
          type="text"
          placeholder={selected.length >= ACTUAL_LIMIT ? "Submissions full!" : "Enter a song..."}
          value={search}
          onChange={handleInputChange}
          disabled={selected.length >= ACTUAL_LIMIT}
        />
        <div className="max-h-40 w-11/12 md:w-2/3 overflow-y-auto mt-1">
          {results.map((result) => (
            <SongTile
              key={result.id}
              id={result.id}
              title={result.title}
              artist={result.artist}
              albumArt={result.albumArt}
              onSelect={selectSong}
            />
          ))}
        </div>
        {!isMobile && selected.length < ACTUAL_LIMIT ? (
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
              {selected.map((song) => (
                <SongTile
                  key={song.id}
                  id={song.id}
                  title={song.title}
                  artist={song.artist}
                  albumArt={song.albumArt}
                  onRemove={removeSong}
                  selected
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-2 gap-y-0.5">
            {selected.map((song) => (
              <SongTile
                key={song.id}
                id={song.id}
                title={song.title}
                artist={song.artist}
                albumArt={song.albumArt}
                onRemove={removeSong}
                selected
              />
            ))}
          </div>
        )}
        <div className={`flex flex-row justify-end w-full text-green-600 text-sm text-opacity-60 mt-2 pr-4 md:pr-16 ${selected.length >= SUGGESTED_LIMIT ? 'font-bold' : ''}`}>
          {selected.length >= SUGGESTED_LIMIT ? '✓' : ''} {selected.length}/{SUGGESTED_LIMIT} selected{getExclamationMarks()}
        </div>

      </div>
    </div>
  );
}

export default SongSuggestions;
