"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";

export default function MEKFPage() {
  const features = [
    {
      title: "Compile-Time Sensor Types",
      description:
        "Sensors share one interface used by the filter loop, but every type stays compile-time. Required for static analysis and safety-critical use.",
    },
    {
      title: "Sensor-Owned Updates",
      description:
        "Instead of returning a measurement matrix and innovation to the filter, each sensor receives the nominal state and covariance and completes the update itself.",
    },
    {
      title: "Jinja Autogeneration",
      description:
        "New sensors are added to a master YAML file. Templates generate the sensor scaffolding, including the innovation update and nominal state update.",
    },
    {
      title: "Delayed Measurement Replay",
      description:
        "A history queue stores past filter state so delayed sensors can rewind and replay as if they arrived on time. Built with VIO and image processing delay in mind.",
    },
    {
      title: "Van Loan + Joseph Update",
      description:
        "Propagation uses Van Loan discretization. Covariance updates use a Joseph form for better numerical stability.",
    },
    {
      title: "RF-Denied Ready",
      description:
        "If GPS never locks, the filter stays in a local NED frame. Yaw and barometer altitude do not latch onto a global fix until one is available.",
    },
  ];

  const sensors = [
    {
      title: "GPS Position / Velocity",
      description:
        "Treated as separate sensors since their noises do not require covariance between them. First GPS fix reanchors the local NED frame onto WGS84.",
    },
    {
      title: "Magnetometer + Declination",
      description:
        "Yaw clamps hard onto the first magnetometer read. Declination corrects the offset between true north and magnetic north from WMM lookup tables.",
    },
    {
      title: "Barometer + IMU",
      description:
        "Barometer tracks altitude. The IMU drives propagation; gravity is derived from the accelerometer once bias is learned.",
    },
    {
      title: "Airspeed + Sideslip",
      description:
        "Airspeed observes wind. Sideslip is a pseudo-sensor used for wind velocity on fixed-wing vehicles.",
    },
    {
      title: "Zero Velocity / Zero Gyro",
      description:
        "While landed, these feed zero velocity and zero gyro readings so the filter can learn gyro bias and stop position drift.",
    },
    {
      title: "Fake Position / Height / Yaw",
      description:
        "Pseudo-sensors used when horizontal tracking is lost, before magnetometer latch, or while sitting still. Kept as sensors so they can be swapped for unit tests.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="MEKF"
        image="/images/projects/mekf.jpg"
        imageAlt="MEKF SITL debug view"
        description="A multiplicative extended Kalman filter written for Windhover Labs. Running in their software-in-the-loop simulation with Gazebo."
        secondaryDescription="Designed to be modular and MISRA-friendly: thin filter core, sensor-owned updates, and compile-time types with Jinja/Python codegen."
      />

      <GlassyVideo
        embedLink="https://www.youtube.com/embed/znVG9sWjJWA?start=7"
        title="MEKF SITL Stability Test"
      />

      <ContentSection title="About">
        <p>
          This is a stability test under strenuous maneuvers. The filter
          converges quickly, then holds steady through high-G rolls and loops.
        </p>
        <p>
          Before the first GPS read, everything runs in a local NED frame. Once
          GPS arrives, that frame is reanchored onto WGS84. The first
          magnetometer read clamps yaw. There is a visible altitude offset in
          the video from how Gazebo and the soft GPS sensor register altitude.
        </p>
      </ContentSection>

      <FeaturesGrid title="Design" features={features} />

      <ContentSection title="Architecture">
        <p>
          A lot of the state machine was inspired by PX4&apos;s EKF, but PX4&apos;s
          estimator keeps sensors tightly coupled. Here encapsulation is
          weakened a bit for modularity. Adding or removing a sensor is only a
          couple of lines in the thin MEKF core, and the rest is generated.
        </p>
        <p>
          Everything is wrapped in a StateEstimator that owns the proprietary state machine.
          It manages landed state, GPS and yaw locking, and attitude confidence
          stages. Separating the state machine from the MEKF keeps testing easy and the MEKF generic. 
        </p>
        <p>
          Pseudo-sensors live behind the same sensor-agnostic loop as real ones.
          That keeps special cases out of the state machine and makes them easy
          to enable or disable for testing.
        </p>
      </ContentSection>

      <FeaturesGrid title="Sensors" features={sensors} />

      <ContentSection title="State Vector">
        <p>
          The nominal state is configured from YAML and generated into code:
          position, velocity, attitude, magnetic field, accelerometer bias,
          gyroscope bias, magnetometer bias, and wind velocity.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}
