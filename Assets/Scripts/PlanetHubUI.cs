using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ZoneWars.Unity
{
    public class PlanetHubUI : MonoBehaviour
    {
        public Text availablePlanetsText;
        public Text availableMissionsText;
        public Text selectedPlanetText;
        public Text selectedMissionText;
        public Button travelButton;
        public Button completeMissionButton;
        public Button nextMissionButton;
        public Button previousMissionButton;

        private List<PlanetDefinition> unlockedPlanets = new List<PlanetDefinition>();
        private List<MissionDefinition> availableMissions = new List<MissionDefinition>();
        private int selectedMissionIndex;

        private void Start()
        {
            RefreshUI();

            if (travelButton != null)
                travelButton.onClick.AddListener(OnTravelPressed);

            if (completeMissionButton != null)
                completeMissionButton.onClick.AddListener(OnCompleteMissionPressed);

            if (nextMissionButton != null)
                nextMissionButton.onClick.AddListener(OnNextMissionPressed);

            if (previousMissionButton != null)
                previousMissionButton.onClick.AddListener(OnPreviousMissionPressed);
        }

        public void RefreshUI()
        {
            if (ZoneWarsGameManager.Instance == null)
                return;

            var gameManager = ZoneWarsGameManager.Instance;
            availablePlanetsText.text = "Available Planets:\n";
            unlockedPlanets = gameManager.planetHubManager.GetAvailablePlanets();
            for (int i = 0; i < unlockedPlanets.Count; i++)
            {
                availablePlanetsText.text += $"{i + 1}. {unlockedPlanets[i].planetName} (Power {unlockedPlanets[i].requiredPowerLevel})\n";
            }

            if (unlockedPlanets.Count > 0)
            {
                selectedPlanetText.text = "Selected Planet: " + unlockedPlanets[0].planetName;
            }
            else
            {
                selectedPlanetText.text = "Selected Planet: None";
            }

            availableMissions = gameManager.missionManager.GetAvailableMissions(gameManager.playerStatsManager.playerProfile);
            availableMissionsText.text = "Available Missions:\n";
            for (int i = 0; i < availableMissions.Count; i++)
            {
                availableMissionsText.text += $"{i + 1}. {availableMissions[i].missionName}\n";
            }

            selectedMissionIndex = Mathf.Clamp(selectedMissionIndex, 0, availableMissions.Count - 1);
            ShowMissionDetails();
        }

        private void ShowMissionDetails()
        {
            if (availableMissions.Count == 0)
            {
                selectedMissionText.text = "No missions available.";
                return;
            }

            var mission = availableMissions[selectedMissionIndex];
            selectedMissionText.text = mission.missionName + "\n" + mission.description + "\nReward XP: " + mission.rewardXP + " Reputation: " + mission.rewardReputation;
        }

        private void OnTravelPressed()
        {
            if (unlockedPlanets.Count == 0 || ZoneWarsGameManager.Instance == null)
                return;

            ZoneWarsGameManager.Instance.TravelToPlanet(unlockedPlanets[0].planetName);
            RefreshUI();
        }

        private void OnCompleteMissionPressed()
        {
            if (availableMissions.Count == 0 || ZoneWarsGameManager.Instance == null)
                return;

            ZoneWarsGameManager.Instance.CompleteMission(availableMissions[selectedMissionIndex]);
            RefreshUI();
        }

        private void OnNextMissionPressed()
        {
            if (availableMissions.Count == 0) return;
            selectedMissionIndex = (selectedMissionIndex + 1) % availableMissions.Count;
            ShowMissionDetails();
        }

        private void OnPreviousMissionPressed()
        {
            if (availableMissions.Count == 0) return;
            selectedMissionIndex = (selectedMissionIndex - 1 + availableMissions.Count) % availableMissions.Count;
            ShowMissionDetails();
        }
    }
}
