# Shire Beats
<https://shirebeats.com>

This is a website for collaborative playlist generation, created for my burning man camp. The client-side leverages Spotify's API for track search and drag-and-drop functionality, enabling users to add Spotify tracks to the group's playlists via a few methods. The server-side appends these tracks to the playlist, deduplicating results and persisting form submission data to a database. A separate backend utility (not in this repo) sorts select playlists by Spotify API's track features, such as "tempo", "energy" and "danceability".

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).