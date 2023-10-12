const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const clientAccessTokenDoc = db.doc("spotify/clientAccessToken");
const serverAccessTokenDoc = db.doc("spotify/serverAccessToken");
const submissions = db.collection("submissions");
const playlistIds = require("./playlist_ids.json");

const cors = require("cors")({
  origin: [
    //"http://localhost:3000",
    "https://shirebeats.com",
  ],
});

/**
 * Store and return a new Spotify API access token
 * @return {object} a newly generated and stored access token
 */
async function getAndStoreClientAccessToken() {
  const clientId = functions.config().spotify.client_id;
  const clientSecret = functions.config().spotify.client_secret;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const options = {
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "grant_type=client_credentials",
    json: true,
  };

  try {
    const res = await axios(options);
    const accessToken = res.data.access_token;
    const updatedAt = new Date()
        .toLocaleString("en-US", {timeZone: "America/Los_Angeles"});

    await clientAccessTokenDoc.set(
        {accessToken: accessToken, updatedAt: updatedAt});
    return accessToken;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to retrieve token");
  }
}

/**
 * Store and return an authorized Spotify API access token (backend).
 * @return {object} a newly generated and stored access token
 */
async function refreshAndStoreServerAccessToken() {
  const clientId = functions.config().spotify.client_id;
  const clientSecret = functions.config().spotify.client_secret;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const doc = await serverAccessTokenDoc.get();
  if (!doc.exists) {
    throw new Error("Server refresh token not found");
  }
  const refreshToken = doc.data().refreshToken;

  const options = {
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  };

  try {
    const res = await axios(options);
    const accessToken = res.data.access_token;
    const newRefreshToken = res.data.refresh_token || refreshToken;
    const updatedAt = new Date()
        .toLocaleString("en-US", {timeZone: "America/Los_Angeles"});

    await serverAccessTokenDoc.set({
      accessToken: accessToken,
      refreshToken: newRefreshToken,
      updatedAt: updatedAt,
    });
    return accessToken;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to refresh server access token");
  }
}

exports.getAccessToken =
    functions.https.onRequest(async (request, response) => {
      cors(request, response, async () => {
        try {
          const doc = await clientAccessTokenDoc.get();
          let accessToken;
          if (doc.exists) {
            accessToken = doc.data().accessToken;
          } else {
            accessToken = await getAndStoreClientAccessToken();
          }
          response.status(200).send({accessToken});
        } catch (err) {
          console.error(err);
          response.status(500).send({error: err.message});
        }
      });
    });

exports.refreshClientAccessToken = functions.pubsub.schedule("every 15 minutes")
    .onRun(async (context) => {
      try {
        await getAndStoreClientAccessToken();
        console.log("Client access token refreshed successfully");
      } catch (err) {
        console.error("Failed to refresh access token:", err);
      }
    });

exports.refreshServerAccessToken = functions.pubsub.schedule("every 15 minutes")
    .onRun(async (context) => {
      try {
        await refreshAndStoreServerAccessToken();
        console.log("Server access token refreshed successfully");
      } catch (err) {
        console.error("Failed to refresh server access token:", err);
      }
    });


exports.submitForm = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(400).send("Invalid request method");
    }
    const data = request.body;
    const tracks = data.tracks;

    const accessTokenDoc = await serverAccessTokenDoc.get();
    if (!accessTokenDoc.exists) {
      return response.status(500).send("Server access token not found");
    }
    const serverAccessToken = accessTokenDoc.data().accessToken;

    // Loop through the playlist numbers and the tracks object
    for (let i = 0; i < playlistIds.length; i++) {
      const playlistId = playlistIds[i];
      const submittedTrackUris = tracks[i.toString()]?.map(
          (trackId) => "spotify:track:" + trackId);
      if (!submittedTrackUris || submittedTrackUris.length === 0) {
        continue; // no tracks submitted for this playlist
      }
      // Get current tracks in the playlist
      let currentTrackUris = [];
      try {
        const options = {
          method: "GET",
          url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          headers: {"Authorization": "Bearer " + serverAccessToken},
          params: {
            fields: "items(track(uri))",
          },
        };
        const res = await axios(options);
        currentTrackUris = res.data.items.map((item) => item.track.uri);
      } catch (err) {
        console.error(`Error getting tracks from playlist ${playlistId}:`, err);
      }

      // Filter out tracks that are already in the playlist
      const newTrackUris = submittedTrackUris.filter(
          (uri) => !currentTrackUris.includes(uri));
      // Add new tracks to the playlist
      if (newTrackUris.length > 0) {
        try {
          const options = {
            method: "POST",
            url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            headers: {"Authorization": "Bearer " + serverAccessToken},
            data: {uris: newTrackUris},
            dataType: "json",
          };
          await axios(options);
          console.log(`Tracks added to playlist ${playlistId}`);
        } catch (err) {
          console.error(`Error adding tracks to playlist ${playlistId}:`, err);
        }
      }
    }

    const docId = `${Date.now()}_${data.name.replace(/\s/g, "")}`;
    submissions.doc(docId).set(data)
        .then(() => {
          console.log(`${docId} successfully written!`);
          return response.status(200).send("Data received");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
          return response.status(500).send("Error writing data");
        });
  });
});
