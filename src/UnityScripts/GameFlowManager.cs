using UnityEngine;

namespace ZoneWars.Unity
{
    public class GameFlowManager : MonoBehaviour
    {
        public PlayerProfile playerProfile;
        public MissionManager missionManager;

        void Start()
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

            Debug.Log("ZoneWars prototype started with origin: " + playerProfile.originPath);
        }

        public void SelectOrigin(OriginPath origin)
        {
            playerProfile.originPath = origin;
            playerProfile.currentAlignment = origin == OriginPath.ViltrumiteConqueror ? PlayerAlignment.Conqueror : PlayerAlignment.Hero;
            playerProfile.powerLevel = 1;
            Debug.Log($"Origin selected: {origin}");
        }

        public void GainExperience(int xp)
        {
            playerProfile.powerLevel += xp;
            Debug.Log($"Power level increased to {playerProfile.powerLevel}");
        }

        public void CompleteMission(MissionDefinition mission)
        {
            GainExperience(mission.rewardXP);
            UpdateReputation(mission.rewardReputation);
            Debug.Log($"Mission completed: {mission.missionName}");
        }

        public void UpdateReputation(int delta)
        {
            if (playerProfile.currentAlignment == PlayerAlignment.Hero)
            {
                Debug.Log("Hero reputation gained: " + delta);
            }
            else if (playerProfile.currentAlignment == PlayerAlignment.Conqueror)
            {
                Debug.Log("Conqueror reputation gained: " + delta);
            }
        }
    }
}
