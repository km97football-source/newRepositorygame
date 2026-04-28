using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ZoneWars.Unity
{
    public class UIManager : MonoBehaviour
    {
        public Text originText;
        public Text alignmentText;
        public Text powerText;
        public Text planetText;
        public Text missionText;
        public PlayerStatsManager statsManager;
        public PlanetHubManager planetHubManager;
        public MissionManager missionManager;

        private void Update()
        {
            if (statsManager != null)
            {
                originText.text = "Origin: " + statsManager.playerProfile.originPath;
                alignmentText.text = "Alignment: " + statsManager.playerProfile.currentAlignment;
                powerText.text = "Power Level: " + statsManager.stats.PowerLevel;
            }

            if (planetHubManager != null)
            {
                planetText.text = planetHubManager.currentPlanet != null ? "Planet: " + planetHubManager.currentPlanet.planetName : "Planet: None";
            }

            if (missionManager != null && statsManager != null)
            {
                var missions = missionManager.GetAvailableMissions(statsManager.playerProfile);
                missionText.text = "Missions Available: " + missions.Count;
            }
        }

        public void ShowMissionDetails(MissionDefinition mission)
        {
            if (mission == null) return;
            missionText.text = mission.missionName + "\n" + mission.description;
        }
    }
}
