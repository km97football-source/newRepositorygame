# ZoneWars Game Architecture

## Overview
This document defines the core architecture of the 3D open-world action RPG inspired by *Invincible*. The project focuses on two origin paths, planetary exploration, aerial and ground combat, branching storylines, and emergent world systems.

## Core Subsystems
- **Player & Character System**: origin selection, stats, reputation, abilities, and customization.
- **World & Planet System**: multiple explorable planets, planetary hubs, environment themes, and travel.
- **Mission System**: main story quests, side missions, dynamic events, and alignment-specific objectives.
- **Combat System**: fast-paced 3D combat, aerial maneuvers, combos, finishers, and destructible environments.
- **Progression System**: power level tiers, skill tree, equipment upgrades, and unlockable planets.
- **Story & Dialogue System**: branching narrative, alignment choices, NPC reputations, and multiple endings.

## Player Origin Paths
### Viltrumite Conqueror
- Raised on Viltrum as a warrior.
- Starts with training missions and Imperial drills.
- Focuses on planet invasion, dominance, and crushing resistance.
- Unlocks Viltrum-based abilities and conquest story arcs.

### Earth Hero
- Born or raised on Earth with latent superpowers.
- Learns to protect civilians and fight villains.
- Joins a hero coalition or works as an independent defender.
- Unlocks Earth-honor abilities and liberation story arcs.

## Game Loop
1. Start with origin choice and origin-specific tutorial.
2. Explore a planet hub and accept missions.
3. Complete combat missions, hero tasks, or conquest objectives.
4. Earn experience, reputation, and power points.
5. Unlock new planets, abilities, and story branches.
6. Face bosses, lead invasions, or defend against Viltrumite attacks.
7. Reach an ending based on alignment, choices, and power level.

## Data-Driven Design
- Use data tables for planets, NPCs, missions, and enemies.
- Store ability definitions, power thresholds, and reputation multipliers externally.
- Enable designers to tune alignment rewards, event spawn rates, and AI scaling.

## Save & Progression
- Track player origin, stats, active alignment, mission status, and unlocked planets.
- Persist hero/conqueror reputation and story decisions.
- Allow replay from any origin with alternate branches available.
