using UnityEngine;
using UnityEngine.UI;

namespace ZoneWars.Unity
{
    public class OriginSelectionUI : MonoBehaviour
    {
        public Button heroButton;
        public Button viltrumiteButton;

        private void Start()
        {
            if (heroButton != null)
                heroButton.onClick.AddListener(() => OnSelectOrigin(OriginPath.EarthHero));

            if (viltrumiteButton != null)
                viltrumiteButton.onClick.AddListener(() => OnSelectOrigin(OriginPath.ViltrumiteConqueror));
        }

        public void OnSelectOrigin(OriginPath origin)
        {
            if (ZoneWarsGameManager.Instance == null)
                return;

            ZoneWarsGameManager.Instance.StartGame(origin);
        }
    }
}
