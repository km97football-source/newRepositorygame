using UnityEngine;

namespace ZoneWars.Unity
{
    public class PlayerFlightController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 15f;
        public float flightSpeed = 30f;
        public float rotationSpeed = 120f;
        public float acceleration = 10f;

        [Header("Flight")]
        public bool isFlying = false;
        public float altitudeSpeed = 10f;

        private Vector3 velocity;

        void Update()
        {
            HandleFlightToggle();
            HandleMovement();
        }

        private void HandleFlightToggle()
        {
            if (Input.GetKeyDown(KeyCode.F))
            {
                isFlying = !isFlying;
            }
        }

        private void HandleMovement()
        {
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");
            float altitude = 0f;

            if (isFlying)
            {
                altitude = Input.GetAxis("Jump") - Input.GetAxis("Fire3");
            }

            Vector3 inputDirection = new Vector3(horizontal, altitude, vertical).normalized;
            float targetSpeed = isFlying ? flightSpeed : moveSpeed;
            velocity = Vector3.MoveTowards(velocity, inputDirection * targetSpeed, acceleration * Time.deltaTime);

            if (inputDirection.sqrMagnitude > 0.01f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(new Vector3(inputDirection.x, 0f, inputDirection.z));
                transform.rotation = Quaternion.RotateTowards(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
            }

            transform.position += velocity * Time.deltaTime;
        }
    }
}
