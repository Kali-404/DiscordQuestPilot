# DiscordQuestPilot

### Your Discord Quests, on Autopilot.

DiscordQuestPilot is a JavaScript automation script for supported Discord Quest activities.

The initial release is intentionally distributed as a standalone script. A future version may evolve into a more structured application with a modular architecture and user interface.

> **Current version:** 1.0.0  
> **Status:** Initial release

## Supported Quest Types

- `WATCH_VIDEO`
- `PLAY_ON_DESKTOP`
- `STREAM_ON_DESKTOP`
- `PLAY_ACTIVITY`
- `WATCH_VIDEO_ON_MOBILE`

## Requirements

- An active Discord account
- An eligible Discord Quest
- Access to the Discord client environment where the script is executed
- Discord desktop application for Quest types that require desktop functionality

## Usage

1. Open Discord and sign in.
2. Open the appropriate Developer Tools / Console for your Discord client environment.
3. Open `DiscordQuestPilot.js`.
4. Copy the complete script.
5. Paste it into the console and execute it.
6. The script searches for eligible, incomplete, non-expired Quests with supported task types.
7. Progress and status messages are displayed in the console.

### Stop the script

Run:

```javascript
pararMissao()
```

The stop function attempts to restore temporary client modifications and remove the active Quest heartbeat listener.

## How it works

DiscordQuestPilot locates Quest-related modules already loaded by the Discord client and uses them to inspect eligible Quests and process supported task types.

Depending on the Quest type, the script interacts with Quest-related endpoints or temporarily modifies client-side state used by the Discord application.

This project is therefore dependent on Discord's internal client implementation and may stop working when Discord changes its code.

## Security

- The published script does not contain a Discord password, authentication token, API key, webhook, or external telemetry endpoint.
- Never paste your Discord token, password, cookies, or other private credentials into this project or into an issue.
- Inspect changes before executing updated versions of the script.
- Only use releases and source code you trust.

## Limitations

This is an initial standalone script and is not designed to guarantee compatibility with future Discord releases.

Known limitations include:

- Dependence on Discord internal modules.
- Dependence on current Quest data structures.
- Limited error recovery.
- Quest behavior can change without notice.
- Some Quest types require the Discord desktop application.

## Disclaimer

DiscordQuestPilot is an independent project and is **not affiliated with, endorsed by, or sponsored by Discord Inc.**

This project interacts with internal Discord client functionality. Discord may change its client implementation at any time, which can affect compatibility.

Users are responsible for understanding and complying with Discord's Terms of Service and other applicable policies before using the software.

The author does not guarantee that use of this software is permitted by Discord or that an account will remain unrestricted.

## Project Roadmap

### v1.0.0

- [x] Quest detection
- [x] Supported Quest type detection
- [x] Video Quest handling
- [x] Desktop Quest handling
- [x] Stream Quest handling
- [x] Activity Quest handling
- [x] Mobile video Quest handling
- [x] Manual stop function
- [x] Temporary-state cleanup

### Future DiscordQuestPilot

- [ ] Modular architecture
- [ ] Graphical interface
- [ ] Quest dashboard
- [ ] Improved error handling
- [ ] Configuration system
- [ ] Better logging
- [ ] Expanded compatibility
- [ ] Automated testing

## Contributing

Bug reports and compatibility feedback are welcome.

When reporting a problem, include:

- Operating system
- Discord client type
- Quest type
- Error message
- Relevant console output

Remove all private information before posting logs.

## License

The license for this repository should match the original authorship and licensing of the source code.

If you are the original author and want to release this project under the MIT License, add the standard MIT `LICENSE` file before publishing.

## Support

If you find the project useful, consider starring the repository and reporting compatibility issues through GitHub Issues.

---

**DiscordQuestPilot**  
*Your Discord Quests, on Autopilot.*
