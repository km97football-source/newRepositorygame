using UnityEngine;

namespace ZoneWars.Unity
{
    [System.Serializable]
    public class PlayerStats
    {
        public int strength = 5;
        public int speed = 5;
        public int durability = 5;
        public int combatSkill = 5;
        public int flightControl = 5;
        public int reputation = 0;

        public int PowerLevel => strength + speed + durability + combatSkill + flightControl;
    }

    public class PlayerStatsManager : MonoBehaviour
    {
        public PlayerProfile playerProfile;
        public PlayerStats stats;

        public int PowerLevel => playerProfile != null ? playerProfile.powerLevel : 0;

        public void Awake()
        {
            if (playerProfile == null)
            {
                playerProfile = new PlayerProfile
                {
                    originPath = OriginPath.EarthHero,
                    currentAlignment = PlayerAlignment.Hero,
                    powerLevel = 1
                };
            }

            if (stats == null)
            {
                stats = new PlayerStats();
            }
        }

        public void AddExperience(int xp)
        {
            playerProfile.powerLevel += xp;
            Debug.Log($"Power level now {playerProfile.powerLevel}");
        }

        public void AddReputation(int amount)
        {
            stats.reputation += amount;
            UpdateAlignment();
            Debug.Log($"Reputation now {stats.reputation}, alignment {playerProfile.currentAlignment}");
        }

        public void UpgradeStat(string statName, int amount)
        {
            switch (statName)
            {
                case "Strength":
                    stats.strength += amount;
                    break;
                case "Speed":
                    stats.speed += amount;
                    break;
                case "Durability":
                    stats.durability += amount;
                    break;
                case "CombatSkill":
                    stats.combatSkill += amount;
                    break;
                case "FlightControl":
                    stats.flightControl += amount;
                    break;
            }

            Debug.Log($"Upgraded {statName} by {amount}. New power level: {stats.PowerLevel}");
        }

        private void UpdateAlignment()
        {
            if (stats.reputation >= 70)
            {
                playerProfile.currentAlignment = PlayerAlignment.Hero;
            }
            else if (stats.reputation <= -70)
            {
                playerProfile.currentAlignment = PlayerAlignment.Conqueror;
            }
            else
            {
                playerProfile.currentAlignment = PlayerAlignment.Hybrid;
            }
        }
    }
}
