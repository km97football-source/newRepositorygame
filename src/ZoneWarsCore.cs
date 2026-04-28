using System;
using System.Collections.Generic;

namespace ZoneWars
{
    public enum OriginPath
    {
        ViltrumiteConqueror,
        EarthHero
    }

    public enum Alignment
    {
        Hero,
        Conqueror,
        Hybrid
    }

    public enum PlanetType
    {
        Earth,
        Viltrum,
        AlienWorld,
        CanonInspired
    }

    public class PlayerStats
    {
        public int Strength { get; set; }
        public int Speed { get; set; }
        public int Durability { get; set; }
        public int CombatSkill { get; set; }
        public int FlightControl { get; set; }
        public int Reputation { get; set; }

        public int PowerLevel => Strength + Speed + Durability + CombatSkill + FlightControl;
    }

    public class PlayerCharacter
    {
        public OriginPath Origin { get; private set; }
        public Alignment CurrentAlignment { get; private set; }
        public PlayerStats Stats { get; private set; }
        public List<Ability> Abilities { get; private set; }
        public EquipmentSet Equipment { get; private set; }

        public PlayerCharacter(OriginPath origin)
        {
            Origin = origin;
            CurrentAlignment = origin == OriginPath.ViltrumiteConqueror ? Alignment.Conqueror : Alignment.Hero;
            Stats = new PlayerStats();
            Abilities = new List<Ability>();
            Equipment = new EquipmentSet();
        }

        public void ApplyReputation(int delta)
        {
            Stats.Reputation += delta;
            if (Stats.Reputation >= 70) CurrentAlignment = Alignment.Hero;
            else if (Stats.Reputation <= -70) CurrentAlignment = Alignment.Conqueror;
            else CurrentAlignment = Alignment.Hybrid;
        }

        public void UnlockAbility(Ability ability)
        {
            if (!Abilities.Contains(ability))
                Abilities.Add(ability);
        }
    }

    public class Ability
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int RequiredPowerLevel { get; set; }
        public Action<PlayerCharacter> Activate { get; set; }
    }

    public class EquipmentSet
    {
        public string ArmorName { get; set; }
        public string SuitStyle { get; set; }
        public int DefenseBonus { get; set; }
        public int SpeedBonus { get; set; }
    }

    public class Planet
    {
        public string Name { get; set; }
        public PlanetType Type { get; set; }
        public bool IsUnlocked { get; set; }
        public int RequiredPowerLevel { get; set; }
        public string EnvironmentTheme { get; set; }
        public List<Mission> Missions { get; set; }

        public Planet()
        {
            Missions = new List<Mission>();
        }
    }

    public class Mission
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsMainObjective { get; set; }
        public bool IsAlignmentSpecific { get; set; }
        public Alignment RequiredAlignment { get; set; }
        public int RewardXP { get; set; }
        public int RewardReputation { get; set; }
    }

    public class CombatSystem
    {
        public void ExecuteCombo(PlayerCharacter player, string comboName)
        {
            Console.WriteLine($"Executing combo: {comboName}");
            // Implement combo calculations, hit detection, and animation blending.
        }

        public void ApplyFinisher(PlayerCharacter player, Enemy target)
        {
            Console.WriteLine($"Applying finisher to {target.Name}");
            // Trigger cinematic finisher and damage calculation.
        }
    }

    public class Enemy
    {
        public string Name { get; set; }
        public int Strength { get; set; }
        public int Durability { get; set; }
        public Alignment Alignment { get; set; }
        public bool IsBoss { get; set; }
    }

    public class MissionSystem
    {
        public List<Mission> AvailableMissions { get; private set; }

        public MissionSystem()
        {
            AvailableMissions = new List<Mission>();
        }

        public void AddMission(Mission mission)
        {
            AvailableMissions.Add(mission);
        }

        public List<Mission> GetMissionsForPlayer(PlayerCharacter player)
        {
            return AvailableMissions.FindAll(m => !m.IsAlignmentSpecific || m.RequiredAlignment == player.CurrentAlignment);
        }
    }

    public class StoryBranch
    {
        public string NodeId { get; set; }
        public string Description { get; set; }
        public List<StoryChoice> Choices { get; set; }

        public StoryBranch()
        {
            Choices = new List<StoryChoice>();
        }
    }

    public class StoryChoice
    {
        public string Description { get; set; }
        public Alignment AlignmentImpact { get; set; }
        public int ReputationDelta { get; set; }
        public string NextNodeId { get; set; }
    }
}
