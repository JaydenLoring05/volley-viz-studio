# Film Room Analyzer

Build a mobile-first web app called "Film Room" for analyzing volleyball technique from my own videos. No backend, no login — everything runs locally in the browser (videos never upload to a server).

1. VIDEO LOADING

- Upload button accepts .mp4 and .mov from my phone's camera roll.

- Show a clear error if the browser can't play the file format.

2. PLAYBACK CONTROLS (large touch-friendly buttons)

- Play/pause, step back 1 frame, step forward 1 frame (assume 30fps, with a setting for 60fps).

- Speed selector: 0.1x, 0.25x, 0.5x, 1x.

- Scrub bar plus a timestamp and frame counter.

- On desktop: left/right arrow keys step frames, space toggles play.

3. DRAWING TOOLS (canvas overlay on the paused video)

- Line tool: tap two points.

- Angle tool: tap three points (e.g. hip-knee-ankle) and display the angle in degrees at the middle point.

- Circle tool for marking ball position.

- Color picker (red, yellow, cyan), undo, clear.

- Drawings are tied to the current frame and clear when the frame changes.

4. CAPTURE

- "Capture Frame" button saves the current frame with drawings burned in.

- Before saving, pick a label from presets: Penultimate, Plant, Takeoff, Loaded Arm, Contact, Landing, Serve Toss, Serve Contact, Pass, Block — plus a Rep number (1–20) and an optional note.

- Label, rep number, and timestamp are printed in a banner at the top of the image.

5. GALLERY AND EXPORT

- Gallery of captured frames, sorted by rep then by phase order.

- Delete or re-label any capture.

- "Share" button uses the Web Share API so I can send images straight from my phone to another app.

- "Download All" exports every capture as PNGs in a .zip with filenames like rep02_contact.png.

Design: dark theme, high contrast, big buttons usable with one thumb. The video takes most of the screen; controls sit below it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11f014f1-ee0d-4848-b83f-1c949475edb3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
