import { Button, TextField, createTheme, ThemeProvider } from '@material-ui/core';
import React from 'react';
import SpotifyWebApi from 'spotify-web-api-node';
import SongSuggestions from './SongSuggestions';
import playlists from './playlists.json';
import axios from 'axios';
import PlaylistSuggestions from './PlaylistSuggestions';
import FeedbackBox from './FeedbackBox';

import gandalfImage from '../images/gandalf.png';
import frodoImage from '../images/frodo.png';
import legolasImage from '../images/legolas.png';
import smeagolImage from '../images/smeagol.png';
import galadrielImage from '../images/galadriel.png';
import gandalfLaptopImage from '../images/gandalf_laptop.png';
import gandalfNodGif from '../images/gandalf_nodding.gif';
import loadingGif from '../images/loading.gif';

const theme = createTheme({
  palette: {
    primary: {
      main: '#008000', // green
    },
  },
});

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
});

function Form() {
  const [name, setName] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [formSelectedTracks, setFormSelectedTracks] = React.useState({});
  const [formSelectedPlaylists, setFormSelectedPlaylists] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(null);


  const accessTokenUrl = "https://us-central1-shirebeats.cloudfunctions.net/getAccessToken";
  const submitFormUrl = "https://us-central1-shirebeats.cloudfunctions.net/submitForm";

  const getAccessToken = React.useCallback(async () => {
    try {
      const response = await axios.get(accessTokenUrl);
      if (response.data.accessToken) {
        spotifyApi.setAccessToken(response.data.accessToken);
      } else {
        console.error('Access token not found in response');
      }
    } catch (error) {
      console.error('Error fetching access token', error);
    }
  }, [accessTokenUrl]);

  React.useEffect(() => {
    getAccessToken();
    // token refreshed on backend every 15 minutes, tokens expire after an hour
    const interval = setInterval(getAccessToken, 60 * 45 * 1000);
    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [getAccessToken]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Start loading
    setSubmitSuccess(null);
    const data = {
      name: name,
      feedback: feedback,
      tracks: formSelectedTracks,
      playlists: formSelectedPlaylists
    };
    setTimeout(async () => {
      try {
        // disable call to backend
        //await axios.post(submitFormUrl, data);
        console.log("url:", submitFormUrl);
        console.log("data:", data);
        setSubmitSuccess(true);
      } catch (error) {
        console.error('Error submitting form', error);
        setSubmitSuccess(false);
      } finally {
        setLoading(false); // Stop loading
      }
    }, 1000);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col items-center justify-center bg-white bg-opacity-50 md:w-4/5 w-full md:h-4/5 h-full rounded-xl overflow-y-auto">
        {!submitSuccess ? (
          <form
            className="flex flex-col items-center w-full h-full pt-16 px-8"
            onSubmit={handleSubmit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
              }
            }}
          >
            <div className="flex flex-col mb-8 w-full items-center">
              <div className="flex flex-row items-center justify-center h-32">
                <img src={gandalfImage} className="h-20 md:h-32 mx-4" alt="Gandalf" />
                <div
                  className="text-green-700 font-bold text-4xl md:text-6xl"
                  style={{ fontFamily: 'ElvenFont' }}
                >
                  Shire Beats
                </div>
                <img src={gandalfImage} className="h-20 md:h-32 mx-4" alt="Gandalf" />
              </div>
              <div className="text-xs md:text-sm text-gray-500 w-5/6 md:w-2/3">
                submit your favorites before the 8/13 deadline! the submission max is a suggestion, exceed when inspired.
                you may peep the work-in-progress playlists by clicking the playlist titles below.
                the finalized playlists will be distributed before the burn.
              </div>
              <div className="text-xs md:text-sm text-red-500 w-5/6 md:w-2/3">
                note: the submission window has expired, and at present this site is only for show. pressing 'submit'
                will not trigger new playlist additions!
              </div>
            </div>
            <TextField
              required
              value={name}
              onChange={handleNameChange}
              label="Your Name"
              variant="outlined"
              InputProps={{
                style: {
                  fontWeight: "bold",
                  color: "green"
                }
              }}
            />
            <div className="pt-4 md:pt-8 pb-8 md:pb-16">
              {playlists.map((playlist, index) => (
                <SongSuggestions
                  key={index}
                  playlistNumber={index}
                  playlistName={playlist.title}
                  description={playlist.description}
                  url={playlist.url}
                  spotifyApi={spotifyApi}
                  setFormSelectedTracks={setFormSelectedTracks} />
              ))}
              <PlaylistSuggestions
                spotifyApi={spotifyApi}
                setFormSelectedPlaylists={setFormSelectedPlaylists} />
              <FeedbackBox feedback={feedback} setFeedback={setFeedback} />

            </div>
            <Button
              disabled={loading}
              type="submit"
              variant="contained"
              style={{
                backgroundColor: loading ? 'transparent' : 'green',
                fontFamily: 'ElvenFont',
                fontWeight: 'bold',
                fontSize: '20px',
                height: '60px',
                width: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
              }}
            >
              {loading ? (
                <div className="flex flex-col">
                  <img src={loadingGif} className="object-contain h-10 inline-block max-h-full max-w-full" alt="loading" />
                  <div className="text-xs text-black">one sec...</div>
                </div>
              ) : (
                'Submit'
              )}
            </Button>
            {submitSuccess === false &&
              <div className="mt-2 text-xs md:text-sm text-red-500 text-opacity-50">[error submitting form, please try again?]</div>
            }
            <div className="flex flex-row w-full justify-center">
              <img src={gandalfLaptopImage} className="h-64 mt-24 mx-4 opacity-80" alt="Gandalf" />
            </div>
          </form>
        ) : (
          <CompletionPage />
        )}
      </div>
    </ThemeProvider>
  );
}

function CompletionPage() {
  return (
    <div className="flex flex-col items-center w-full h-full overflow-y-auto pt-16 px-8">
      <div className="flex flex-row">
        <img src={frodoImage} className="h-14 md:h-20 md:mx-4" alt="Frodo" />
        <img src={galadrielImage} className="h-14 md:h-20 md:mx-4" alt="Galadriel" />
        <img src={gandalfImage} className="h-14 md:h-20 md:mx-4" alt="Gandalf" />
        <img src={legolasImage} className="h-14 md:h-20 md:mx-4" alt="Legolas" />
        <img src={smeagolImage} className="h-14 md:h-20 md:mx-4" alt="Smeagol" />
      </div>
      <div
        className="w-4/5 my-2 text-green-700 font-bold text-3xl md:text-6xl"
        style={{ fontFamily: 'ElvenFont' }}
      >
        let the revelry commence!
      </div>
      <img src={gandalfNodGif} className="mt-4 rounded-2xl opacity-90" alt="Celebration" />
      <div className="text-xs md:text-sm font-bold italic text-green-700 mt-2">
        thank you for contributing! the playlists have been updated.
      </div>
      <div className="w-full flex justify-center items-center">
        <div className="flex flex-wrap justify-center items-center w-2/3 my-6">
          {playlists.map((playlist, index) => (
            <a href={playlist.url} key={index} target="_blank" rel="noreferrer">
              <img src={`${process.env.PUBLIC_URL}/covers/${playlist.image}`} className="h-36 mx-4 my-4 border-2 hover:border-4 border-green-300" alt={playlist.title} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Form;
