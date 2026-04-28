using UnityEngine;
using UnityEngine.SceneManagement;

namespace ZoneWars.Unity
{
    public class ZoneWarsGameManager : MonoBehaviour
    {
        public static ZoneWarsGameManager Instance { get; private set; }

        public PlayerStatsManager playerStatsManager;
        public AbilitySystem abilitySystem;
        public MissionManager missionManager;
        public PlanetHubManager planetHubManager;
        public UIManager uiManager;
        public SampleGameData sampleGameData;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            InitializeGame();
        }

        private T CreateManager<T>(string objectName) where T : MonoBehaviour
        {
            var container = new GameObject(objectName);
            DontDestroyOnLoad(container);
            return container.AddComponent<T>();
        }

        public void InitializeGame()
        {
            if (sampleGameData == null)
            {
                sampleGameData = CreateInstance<SampleGameData>();
                sampleGameData.InitializeDefaultData();
            }

            if (missionManager == null)
            {
                missionManager = CreateManager<MissionManager>("MissionManager");
            }

            if (planetHubManager == null)
            {
                planetHubManager = CreateManager<PlanetHubManager>("PlanetHubManager");
            }

            if (abilitySystem == null)
            {
                abilitySystem = CreateManager<AbilitySystem>("AbilitySystem");
            }

            if (playerStatsManager == null)
            {
                playerStatsManager = CreateManager<PlayerStatsManager>("PlayerStatsManager");
            }

            if (missionManager != null)
            {
                missionManager.LoadMissions(sampleGameData.missions);
            }

            if (planetHubManager != null)
            {
                planetHubManager.InitializePlanets(sampleGameData.planets);
            }

            if (abilitySystem != null)
            {
                abilitySystem.LoadAbilities(sampleGameData.abilities);
            }

            if (playerStatsManager != null)
            {
                if (playerStatsManager.playerProfile == null)
                {
                    playerStatsManager.playerProfile = new PlayerProfile
                    {
                        originPath = OriginPath.EarthHero,
                        currentAlignment = PlayerAlignment.Hero,
                        powerLevel = 1
                    };
                }

                if (playerStatsManager.stats == null)
                {
                    playerStatsManager.stats = new PlayerStats();
                }
            }

            if (abilitySystem != null && playerStatsManager != null)
            {
                abilitySystem.UnlockAbilities(playerStatsManager);
            }

            if (planetHubManager != null && playerStatsManager != null)
            {
                planetHubManager.playerStatsManager = playerStatsManager;
                planetHubManager.UnlockPlanets();
            }

            if (uiManager != null)
            {
                uiManager.RefreshUI();
            }
        }

        public void StartGame(OriginPath origin)
        {
            if (playerStatsManager == null) return;

            playerStatsManager.playerProfile.originPath = origin;
            playerStatsManager.playerProfile.currentAlignment = origin == OriginPath.ViltrumiteConqueror ? PlayerAlignment.Conqueror : PlayerAlignment.Hero;
            playerStatsManager.playerProfile.powerLevel = 1;
            playerStatsManager.stats = new PlayerStats();

            if (abilitySystem != null)
            {
                abilitySystem.unlockedAbilities.Clear();
                abilitySystem.UnlockAbilities(playerStatsManager);
            }

            if (planetHubManager != null)
            {
                planetHubManager.playerStatsManager = playerStatsManager;
                planetHubManager.UnlockPlanets();
            }

            uiManager?.RefreshUI();
            SceneManager.LoadScene("PlanetHubScene");
        }

        public void CompleteMission(MissionDefinition mission)
        {
            if (mission == null || playerStatsManager == null) return;

            playerStatsManager.AddExperience(mission.rewardXP);
            playerStatsManager.AddReputation(mission.rewardReputation);

            if (abilitySystem != null)
            {
                abilitySystem.UnlockAbilities(playerStatsManager);
            }

            if (planetHubManager != null)
            {
                planetHubManager.UnlockPlanets();
            }

            uiManager?.RefreshUI();
            Debug.Log($"Mission completed: {mission.missionName}");
        }

        public void TravelToPlanet(string planetName)
        {
            if (planetHubManager == null) return;

            planetHubManager.TravelToPlanet(planetName);
            uiManager?.RefreshUI();
        }
    }
}
