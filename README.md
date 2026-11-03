# Muster for iPhone and iPad

Muster is a one-thumb crowd-shooter: slide your army through gates, grow it, and break through bosses. This repo is the game wrapped as a real iPhone and iPad app, so it can go on your phone and later to TestFlight and the App Store.

- `www/index.html` is the whole game (one file). It is proto 12, the same game as the web demo, plus a few app touches listed below.
- `ios/` is the Xcode project.
- `capacitor.config.json` and `package.json` set the app name, its id and the parts it is built from (Capacitor 8.5).

## What the app adds over the web demo

- **Real buzzes.** Gates, Rally, upgrades, big losses and boss kills buzz the phone (web pages on iPhone can't). Settings → Vibration turns them off.
- **Full screen.** No browser bars and no status bar. The game stays clear of the notch, the Dynamic Island and the home bar.
- **Pauses when you leave** the app, and the sound comes back after a phone call.
- **Saves are safer.** Your progress is kept twice: in the game and in the app's own storage, because iOS can clear web storage when the phone is low on space. Saves also carry a version number so later updates can convert them.
- **iPhone stays upright; iPad turns** both ways (the extra width shows scenery beside the road).
- **Release switch.** At the top of the game's code, `const RELEASE=false;` keeps the "Testing ON: everything unlocked" switch for test builds. Set it to `true` for the App Store build.
- Placeholder icon and launch screen (a green crowd under a gold gate).

## First time on the Mac

You need Xcode (free in the Mac App Store; open it once so it finishes installing the iPhone parts) and Node.js (free, the LTS version from nodejs.org).

1. Open **Terminal** and run:
   ```
   git clone https://github.com/eposie17/gatebreak.git
   cd gatebreak
   npm install
   npx cap sync ios
   npx cap open ios
   ```
   Xcode opens the project. The first build downloads Capacitor, so it takes a few minutes.

2. **Try it in the simulator.** At the top of Xcode pick an iPhone (for example iPhone 17) and press ▶.

3. **Put it on your iPhone.**
   - Xcode → Settings → Accounts → **+** → sign in with your Apple ID.
   - Click **App** at the top of the left list, then **Signing & Capabilities**, and pick your name under **Team**. If Xcode says the id `com.eposie17.muster` is taken, change it to something only you use and put the same text next to `appId` in `capacitor.config.json`.
   - Plug in your iPhone, pick it at the top of Xcode, press ▶.
   - The first time, the iPhone asks you to turn on **Developer Mode** (Settings → Privacy & Security). Turn it on and let the phone restart. If it then says "Untrusted Developer", go to Settings → General → VPN & Device Management and trust your Apple ID.
   - With a free Apple ID the app stops opening after 7 days; press ▶ again to renew it.

4. **TestFlight** (needs the Apple Developer Program, $99 a year): on appstoreconnect.apple.com make a new app with the same id. In Xcode pick **Any iOS Device**, then **Product → Archive → Distribute App → TestFlight**. It shows up in the TestFlight app on your phone 10 to 30 minutes later.

## Putting in a newer version of the game

1. Replace `www/index.html` with the new game file.
2. Run `npx cap sync ios`.
3. Press ▶ in Xcode (for TestFlight, raise **Build** by one under App → General first, then Archive again).

## What to check on the phone

- Does it run smoothly in big fights (lots of soldiers, the Tank, the Hive Queen)? Try Battery saver too.
- Do the buzzes feel right, or too much?
- Is the Rally button easy to reach? (Settings → Rally: left or right.)
- Leave the app mid-run and come back: it should be paused.
- With the silent switch on, the sound is off. That is normal for games; say if you'd rather keep sound on.
