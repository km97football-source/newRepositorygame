using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace ZoneWars.Unity
{
    public class MissionManager : MonoBehaviour
    {
        public List<MissionDefinition> allMissions = new List<MissionDefinition>();

        public void LoadMissions(List<MissionDefinition> missions)
        {
            allMissions = new List<MissionDefinition>(missions);
        }

        public List<MissionDefinition> GetAvailableMissions(PlayerProfile player)
        {
            return allMissions
                .Where(m => !m.isAlignmentSpecific || m.requiredAlignment == player.currentAlignment)
                .Where(m => player.powerLevel >= m.requiredPowerLevel)
                .ToList();
        }
    }

    [System.Serializable]
    public class MissionDefinition
    {
        public string missionName;
        [TextArea]
        public string description;
        public bool isMainMission;
        public bool isAlignmentSpecific;
        public PlayerAlignment requiredAlignment;
        public int requiredPowerLevel;
        public int rewardXP;
        public int rewardReputation;
    }

    public enum PlayerAlignment
    {
        Hero,
        Conqueror,
        Hybrid
    }

    [System.Serializable]
    public class PlayerProfile
    {
        public OriginPath originPath;
        public PlayerAlignment currentAlignment;
        public int powerLevel;
    }

    public enum OriginPath
    {
        ViltrumiteConqueror,
        EarthHero
    }
}
