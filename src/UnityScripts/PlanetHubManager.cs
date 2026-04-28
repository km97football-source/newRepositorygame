using System.Collections.Generic;
using UnityEngine;

namespace ZoneWars.Unity
{
    [System.Serializable]
    public class PlanetDefinition
    {
        public string planetName;
        public PlanetType planetType;
        public int requiredPowerLevel;
        public bool isUnlocked;
        public string description;
    }

    public enum PlanetType
    {
        Earth,
        Viltrum,
        AlienWorld,
        CanonInspired
    }

    public class PlanetHubManager : MonoBehaviour
    {
        public List<PlanetDefinition> planets = new List<PlanetDefinition>();
        public PlanetDefinition currentPlanet;
        public PlayerStatsManager playerStatsManager;

        private void Awake()
        {
            if (planets.Count == 0)
            {
                InitializeDefaultPlanets();
            }
        }

        public void InitializeDefaultPlanets()
        {
            planets = new List<PlanetDefinition>
            {
                new PlanetDefinition { planetName = "Earth", planetType = PlanetType.Earth, requiredPowerLevel = 1, isUnlocked = true, description = "The home planet, urban battle zones and hero hubs." },
                new PlanetDefinition { planetName = "Viltrum", planetType = PlanetType.Viltrum, requiredPowerLevel = 10, isUnlocked = false, description = "Imperial training grounds and conquest staging." },
                new PlanetDefinition { planetName = "Zenotra", planetType = PlanetType.AlienWorld, requiredPowerLevel = 20, isUnlocked = false, description = "Advanced alien civilization with dangerous defenders." },
                new PlanetDefinition { planetName = "Nexion", planetType = PlanetType.CanonInspired, requiredPowerLevel = 35, isUnlocked = false, description = "A war-torn world caught between rebellion and empire." }
            };
        }

        public void UnlockPlanets()
        {
            foreach (var planet in planets)
            {
                if (!planet.isUnlocked && playerStatsManager != null && playerStatsManager.stats.PowerLevel >= planet.requiredPowerLevel)
                {
                    planet.isUnlocked = true;
                    Debug.Log($"Planet unlocked: {planet.planetName}");
                }
            }
        }

        public List<PlanetDefinition> GetAvailablePlanets()
        {
            return planets.FindAll(p => p.isUnlocked);
        }

        public void TravelToPlanet(string planetName)
        {
            var target = planets.Find(p => p.planetName == planetName && p.isUnlocked);
            if (target == null)
            {
                Debug.LogWarning($"Planet locked or not found: {planetName}");
                return;
            }

            currentPlanet = target;
            Debug.Log($"Traveling to {planetName}");
            // TODO: load planet scene or environment modules.
        }
    }
}
