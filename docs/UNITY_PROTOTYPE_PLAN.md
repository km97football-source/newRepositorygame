# Unity Prototype Plan

## Goal
Create a minimal Unity-compatible prototype for ZoneWars that demonstrates:
- selectable origin paths
- 3D flight-enabled player movement
- fast aerial and ground combat
- mission selection and alignment-aware objectives
- planet unlocking and story progression

## Prototype Scope
1. **Starter scene** with origin selection UI.
2. **Player controller** for 3D movement, flight, and ground transitions.
3. **Combat module** with basic combos and ability triggers.
4. **Mission manager** supporting hero/conqueror mission filtering.
5. **Planet hub system** with unlock conditions and environment settings.
6. **Game flow manager** for story progression and power level gating.

## Implementation Notes
- Use Unity's `CharacterController` or `Rigidbody` for 3D movement.
- Build input mapping for flight, boost, and combat actions.
- Keep AI and enemy behavior abstract for prototype.
- Use placeholder mission and planet data until content is available.
- Plan for a later expansion to actual 3D level scenes and destructible environments.

## Next Tasks
- Create `OriginSelectionScene` in Unity.
- Add `PlayerFlightController` and wire movement controls.
- Add `CombatController` with combo states and ability activation.
- Add `PlayerStatsManager` to track power level, reputation, and stat upgrades.
- Add `AbilitySystem` to manage unlockable powers and ability use.
- Define `MissionManager` and sample missions for both paths.
- Add `PlanetHubManager` for planet unlocking, travel, and progression gates.
- Create a simple `UIManager` for mission, alignment, and planet display.
