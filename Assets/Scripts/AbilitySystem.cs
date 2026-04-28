using System.Collections.Generic;
using UnityEngine;

namespace ZoneWars.Unity
{
    [System.Serializable]
    public class AbilityDefinition
    {
        public string abilityName;
        [TextArea]
        public string description;
        public int requiredPowerLevel;
        public PlayerAlignment alignmentRequirement;
        public AbilityType abilityType;
    }

    public enum AbilityType
    {
        Passive,
        Active,
        Ultimate
    }

    public class AbilitySystem : MonoBehaviour
    {
        public List<AbilityDefinition> abilityLibrary = new List<AbilityDefinition>();
        public List<AbilityDefinition> unlockedAbilities = new List<AbilityDefinition>();

        public void UnlockAbilities(PlayerStatsManager statsManager)
        {
            foreach (var ability in abilityLibrary)
            {
                if (!unlockedAbilities.Contains(ability) && statsManager.stats.PowerLevel >= ability.requiredPowerLevel)
                {
                    if (ability.alignmentRequirement == PlayerAlignment.Hybrid || ability.alignmentRequirement == statsManager.playerProfile.currentAlignment)
                    {
                        unlockedAbilities.Add(ability);
                        Debug.Log($"Unlocked ability: {ability.abilityName}");
                    }
                }
            }
        }

        public void UseAbility(string abilityName)
        {
            var ability = unlockedAbilities.Find(a => a.abilityName == abilityName);
            if (ability == null)
            {
                Debug.LogWarning($"Ability not unlocked: {abilityName}");
                return;
            }

            Debug.Log($"Using ability: {abilityName}");
        }
    }
}
