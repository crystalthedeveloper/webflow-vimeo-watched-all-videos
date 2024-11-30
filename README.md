# webflow-vimeo-watched-all-videos
vimeo-watch-script

# Video Completion Tracker

This project manages video completion tracking for logged-in and guest users in a Webflow project. It ensures users see the correct video embed based on their login state and enables the quiz button only after all videos are watched.

## Features
- Tracks video progress separately for logged-in and guest users using `localStorage`.
- Displays the correct video embed (`guestVideo` or `userVideo`) based on the login state.
- Dynamically enables the quiz button when all videos are watched.
- Integrates Vimeo API to handle video completion events.

## Code Structure
### Key Functions
1. **`isGuest()`**: Determines if the current user is a guest.
2. **`disableQuizButton()`**: Disables the quiz button initially.
3. **`enableQuizButtonIfAllWatched()`**: Enables the quiz button when all videos are watched.
4. **`unhideVideoComplete(videoId, chapter)`**: Shows completion markers for watched videos.
5. **`initializeVimeoPlayers()`**: Initializes Vimeo players and tracks video completion.
6. **`loadScript(src, callback)`**: Dynamically loads external scripts.

### Initialization
On `DOMContentLoaded`, the script:
- Disables the quiz button.
- Detects login state to show the appropriate video embed.
- Loads the Vimeo API script and initializes players.

## Setup
1. Add the following classes in Webflow:
   - **`guest-video`**: For videos visible to guest users.
   - **`user-video`**: For videos visible to logged-in users.
   - **`logged-in`**: Add this class dynamically to the `<body>` tag when the user is logged in.

2. Include this script in your Webflow project.

3. Ensure Vimeo videos have the `data-vimeo-id` attribute.

## How to Use
1. Videos marked as `guest-video` will only show for guests.
2. Videos marked as `user-video` will only show for logged-in users.
3. The quiz button will remain disabled until all videos are watched.

## Debugging
- Use `console.log` to check which videos are being displayed and if the correct login state is detected.
- Ensure Webflow dynamically adds or removes the `logged-in` class for proper functionality.

## External Libraries
- [Vimeo API](https://developer.vimeo.com/player/sdk)

## Example Code
See the full implementation in the script.

## License
This project is licensed under the MIT License.