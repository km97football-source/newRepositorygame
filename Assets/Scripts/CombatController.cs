using System.Collections.Generic;
using UnityEngine;

namespace ZoneWars.Unity
{
    public class CombatController : MonoBehaviour
    {
        public enum CombatState
        {
            Idle,
            Attacking,
            Comboing,
            UsingAbility
        }

        public CombatState currentState = CombatState.Idle;
        public List<string> availableCombos = new List<string> { "JabCombo", "AirSlam", "Shockwave" };

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.Mouse0))
            {
                ExecuteAttack();
            }

            if (Input.GetKeyDown(KeyCode.Alpha1))
            {
                UseAbility("EnergyBurst");
            }
        }

        public void ExecuteAttack()
        {
            currentState = CombatState.Attacking;
            Debug.Log("Execute basic attack");
            currentState = CombatState.Idle;
        }

        public void ExecuteCombo(string comboName)
        {
            currentState = CombatState.Comboing;
            Debug.Log($"Execute combo: {comboName}");
            currentState = CombatState.Idle;
        }

        public void UseAbility(string abilityName)
        {
            currentState = CombatState.UsingAbility;
            Debug.Log($"Use ability: {abilityName}");
            currentState = CombatState.Idle;
        }
    }
}
