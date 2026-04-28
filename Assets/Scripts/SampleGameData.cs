using System.Collections.Generic;
using UnityEngine;

namespace ZoneWars.Unity
{
    [CreateAssetMenu(fileName = "SampleGameData", menuName = "ZoneWars/SampleGameData")]
    public class SampleGameData : ScriptableObject
    {
        public List<AbilityDefinition> abilities = new List<AbilityDefinition>();
        public List<MissionDefinition> missions = new List<MissionDefinition>();
        public List<PlanetDefinition> planets = new List<PlanetDefinition>();

        public void InitializeDefaultData()
        {
            abilities = new List<AbilityDefinition>
            {
                new AbilityDefinition
                {
                    abilityName = "Shockwave",
                    description = "A radial energy blast that staggers nearby enemies.",
                    requiredPowerLevel = 5,
                    alignmentRequirement = PlayerAlignment.Hybrid,
                    abilityType = AbilityType.Active
                },
                new AbilityDefinition
                {
                    abilityName = "GravityPunch",
                    description = "A brutal strike that crushes durability and launches enemies.",
                    requiredPowerLevel = 10,
                    alignmentRequirement = PlayerAlignment.Conqueror,
                    abilityType = AbilityType.Active
                },
                new AbilityDefinition
                {
                    abilityName = "AerialBurst",
                    description = "A high-altitude burst that clears the sky and damages all foes below.",
                    requiredPowerLevel = 20,
                    alignmentRequirement = PlayerAlignment.Hybrid,
                    abilityType = AbilityType.Ultimate
                }
            };

            missions = new List<MissionDefinition>
            {
                new MissionDefinition
                {
                    missionName = "Rescue Civilians",
                    description = "Save trapped civilians from a collapsing city district.",
                    isMainMission = false,
                    isAlignmentSpecific = true,
                    requiredAlignment = PlayerAlignment.Hero,
                    requiredPowerLevel = 1,
                    rewardXP = 3,
                    rewardReputation = 10
                },
                new MissionDefinition
                {
                    missionName = "Stop Bank Robbery",
                    description = "Intercept a villainous crew stealing an experimental reactor core.",
                    isMainMission = false,
                    isAlignmentSpecific = true,
                    requiredAlignment = PlayerAlignment.Hero,
                    requiredPowerLevel = 3,
                    rewardXP = 5,
                    rewardReputation = 15
                },
                new MissionDefinition
                {
                    missionName = "Conquerive Strike",
                    description = "Lead an assault on a rebel citadel to demonstrate Viltrum strength.",
                    isMainMission = false,
                    isAlignmentSpecific = true,
                    requiredAlignment = PlayerAlignment.Conqueror,
                    requiredPowerLevel = 5,
                    rewardXP = 7,
                    rewardReputation = -15
                },
                new MissionDefinition
                {
                    missionName = "Assault the Defender",
                    description = "Defeat the planet's strongest champion and break local morale.",
                    isMainMission = true,
                    isAlignmentSpecific = true,
                    requiredAlignment = PlayerAlignment.Conqueror,
                    requiredPowerLevel = 12,
                    rewardXP = 12,
                    rewardReputation = -25
                }
            };

            planets = new List<PlanetDefinition>
            {
                new PlanetDefinition { planetName = "Earth", planetType = PlanetType.Earth, requiredPowerLevel = 1, isUnlocked = true, description = "The home planet with sprawling urban and rural zones." },
                new PlanetDefinition { planetName = "Viltrum", planetType = PlanetType.Viltrum, requiredPowerLevel = 10, isUnlocked = false, description = "Harsh imperial training arenas and conquest staging grounds." },
                new PlanetDefinition { planetName = "Zenotra", planetType = PlanetType.AlienWorld, requiredPowerLevel = 20, isUnlocked = false, description = "A futuristic alien civilization with resilient defenders." },
                new PlanetDefinition { planetName = "Nexion", planetType = PlanetType.CanonInspired, requiredPowerLevel = 35, isUnlocked = false, description = "A war-ravaged world torn between rebellion and the Viltrumite empire." }
            };
        }
    }
}
