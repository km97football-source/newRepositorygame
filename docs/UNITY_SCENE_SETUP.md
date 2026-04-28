# Unity Scene Setup for ZoneWars Prototype

This guide describes the concrete scene layout, GameObjects, and component wiring for the first ZoneWars Unity prototype.

## Scene: `OriginSelectionScene`

### Root objects
- `ZoneWarsGameManager`
  - Components:
    - `ZoneWarsGameManager`
    - `PlayerStatsManager`
    - `AbilitySystem`
    - `MissionManager`
    - `PlanetHubManager`
    - `UIManager`
    - `OriginSelectionUI`
- `UIManager`
  - Components:
    - `UIManager`
  - Child objects:
    - `OriginText` (Text)
    - `AlignmentText` (Text)
    - `PowerText` (Text)
    - `PlanetText` (Text)
    - `MissionText` (Text)
    - `StartHeroButton` (Button)
    - `StartViltrumiteButton` (Button)

### Player setup
- `Player` (empty GameObject)
  - Components:
    - `PlayerFlightController`
    - `CombatController`
    - `PlayerStatsManager` (optional if separate GameManager instance)

### Scene wiring
1. Set `GameManager` references:
   - `GameFlowManager.playerProfile` -> create `PlayerProfile` asset or assign default values in inspector.
   - `GameFlowManager.missionManager` -> `MissionManager` component.
   - `PlayerStatsManager.playerProfile` -> same `PlayerProfile` instance.
   - `PlayerStatsManager.stats` -> default `PlayerStats` instance.
   - `AbilitySystem` -> `abilityLibrary` entries can be configured in inspector.
   - `PlanetHubManager.playerStatsManager` -> `PlayerStatsManager` component.
   - `UIManager.statsManager` -> `PlayerStatsManager` component.
   - `UIManager.planetHubManager` -> `PlanetHubManager` component.
   - `UIManager.missionManager` -> `MissionManager` component.

2. Configure `MissionManager.allMissions` with hero and conqueror sample missions.
3. Configure `PlanetHubManager.planets` by adding sample planets.
4. Configure UI Text objects to link to `UIManager` fields.

### Origin selection buttons
- `StartHeroButton` -> `GameFlowManager.SelectOrigin(OriginPath.EarthHero)`
- `StartViltrumiteButton` -> `GameFlowManager.SelectOrigin(OriginPath.ViltrumiteConqueror)`

### Prototype flow
- Player starts in `OriginSelectionScene`.
- Origin buttons set player origin and alignment.
- `UIManager` dynamically updates text fields from `PlayerStatsManager` and `PlanetHubManager`.
- `MissionManager` filters available missions using `PlayerProfile`.
- `PlanetHubManager` unlocks planets as the player increases power level.

## Scene: `PlanetHubScene`

### Root objects
- `ZoneWarsGameManager`
  - Components: `ZoneWarsGameManager`, `PlanetHubManager`, `MissionManager`, `AbilitySystem`, `PlayerStatsManager`, `UIManager`
- `Player` with `PlayerFlightController` and `CombatController`
- `Environment` (placeholder geometry)
- `MissionBoard`
  - Components: `PlanetHubUI` or `MissionDisplay` script (optional), references `MissionManager`

### Recommended layout
- Use a simple terrain mesh or cube platform.
- Add floating icons for unlocked planets.
- Add buttons for each available mission.

## Recommended Unity object naming
- `ZoneWars_GameManager`
- `ZoneWars_Player`
- `ZoneWars_UI`
- `ZoneWars_PlanetHub`
- `ZoneWars_MissionBoard`

## Notes on scene transitions
- Use `SceneManager.LoadScene("PlanetHubScene")` after origin selection or mission completion.
- Keep scene-specific objects small and reuse the same `GameManager` data with a persistent `DontDestroyOnLoad` object if desired.
- Add `OriginSelectionScene` and `PlanetHubScene` to Unity Build Settings so `SceneManager.LoadScene` can load them correctly.

## Sample inspector data
- `AbilitySystem.abilityLibrary`
  - `Shockwave`: Active, requiredPowerLevel 5, alignment Hero/Hybrid
  - `GravityPunch`: Active, requiredPowerLevel 10, alignment Conqueror/Hybrid
  - `AerialBurst`: Ultimate, requiredPowerLevel 20, alignment Hybrid
- `PlanetHubManager.planets`
  - Earth: requiredPowerLevel 1, unlocked true
  - Viltrum: requiredPowerLevel 10
  - Zenotra: requiredPowerLevel 20
  - Nexion: requiredPowerLevel 35
- `MissionManager.allMissions`
  - `Rescue Civilians` (Hero, power 1)
  - `Stop Bank Robbery` (Hero, power 3)
  - `Conquerive Strike` (Conqueror, power 5)
  - `Assault the Defender` (Conqueror, power 12)
